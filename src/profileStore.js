import { supabase } from './supabase';

// Traduce el perfil de la app (`me`) a las tablas de Supabase y al revés.
// Público: profiles, game_profiles, decks. Privado (solo su dueño): private_profiles (nacimiento y ajustes).

const AVATARS = 'avatars';
const CARDS = 'cards';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === 'string' && UUID.test(v);

// Ruta de una foto subida: "<id de usuario>/<nombre aleatorio>.jpg"
export const isAvatarPath = (v) => typeof v === 'string' && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/i.test(v);
// Imagen de carta subida: data URL (aún sin subir) o ruta "<id de usuario>/<nombre aleatorio>.jpg" en Storage
const CARD_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/i;
export const isCardUpload = (v) => typeof v === 'string' && (CARD_PATH.test(v) || /^data:image\/(jpeg|svg\+xml)[;,]/.test(v));
export const cardUploadUrl = (path) => (supabase ? supabase.storage.from(CARDS).getPublicUrl(path).data.publicUrl : '');

/* Todas las cartas del perfil (favoritas y de mazos) */
const allCards = (me) => Object.values(me.profiles).flatMap((g) => [g.favCard, ...g.decks.map((d) => d.card)]).filter(Boolean);
export const hasLocalCardImages = (me) => allCards(me).some((c) => c.upload?.startsWith('data:image/jpeg'));

/* Sube las imágenes de cartas que aún están en el móvil. Devuelve { dataUrl: ruta } */
export async function uploadCardImages(uid, me) {
  const map = {};
  for (const c of allCards(me)) {
    if (!c.upload?.startsWith('data:image/jpeg') || map[c.upload]) continue;
    const path = `${uid}/${crypto.randomUUID()}.jpg`;
    check(await supabase.storage.from(CARDS).upload(path, dataUrlToBlob(c.upload), { contentType: 'image/jpeg', upsert: false }));
    map[c.upload] = path;
  }
  return map;
}
/* Cambia en el perfil las imágenes locales por su ruta ya subida */
export const replaceUploads = (me, map) => ({
  ...me,
  profiles: Object.fromEntries(Object.entries(me.profiles).map(([g, x]) => {
    const fix = (c) => (c?.upload && map[c.upload] ? { ...c, upload: map[c.upload] } : c);
    return [g, { ...x, favCard: fix(x.favCard), decks: x.decks.map((d) => ({ ...d, card: fix(d.card) })) }];
  })),
});
/* Borra del servidor las imágenes de cartas que ya no usa el perfil */
export async function cleanCardImages(uid, me) {
  const used = new Set(allCards(me).map((c) => c.upload).filter((u) => u && CARD_PATH.test(u)));
  const { data } = await supabase.storage.from(CARDS).list(uid);
  const old = (data ?? []).map((f) => `${uid}/${f.name}`).filter((p) => !used.has(p));
  if (old.length) await supabase.storage.from(CARDS).remove(old);
}
/* Denunciar una imagen: con varias denuncias de personas distintas se oculta para todos */
export const flagImage = async (path) => check(await supabase.from('image_flags').insert({ path }));
export async function hiddenImages() {
  const { data, error } = await supabase.rpc('hidden_images');
  if (error) throw error;
  return (data ?? []).map((r) => r.path ?? r);
}

export const avatarUrl = (path) => (supabase ? supabase.storage.from(AVATARS).getPublicUrl(path).data.publicUrl : '');

export const ageFrom = (birthDate) => {
  if (!birthDate) return null;
  const b = new Date(`${birthDate}T00:00:00`), t = new Date();
  return t.getFullYear() - b.getFullYear() - (t < new Date(t.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0);
};

const check = ({ error }) => { if (error) throw error; };
// Se decodifica a mano: fetch(data:) lo bloquea la política de seguridad (connect-src)
const dataUrlToBlob = (dataUrl) => new Blob(
  [Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), (c) => c.charCodeAt(0))], { type: 'image/jpeg' });

/* Devuelve el perfil guardado o null si la cuenta aún no tiene perfil */
export async function loadMe(uid, starter) {
  const [prof, priv, games, decks] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.from('private_profiles').select('*').eq('user_id', uid).maybeSingle(),
    supabase.from('game_profiles').select('*').eq('user_id', uid),
    supabase.from('decks').select('*').eq('user_id', uid),
  ]);
  [prof, priv, games, decks].forEach(check);
  const p = prof.data;
  if (!p || !priv.data) return null;
  const settings = priv.data.settings ?? {};
  const profiles = Object.fromEntries(Object.entries(starter).map(([g, s]) => [g, { ...s, decks: [] }]));
  for (const row of games.data) {
    profiles[row.game] = { decks: [], ...profiles[row.game], level: row.level, favCard: row.fav_card, colors: row.colors, formats: row.formats };
  }
  for (const d of decks.data) profiles[d.game]?.decks.push({ id: d.id, name: d.name, format: d.format, card: d.card });
  return {
    name: p.display_name, bio: p.bio, game: p.active_game, visible: p.visible, showDistance: p.show_distance,
    avatar: isAvatarPath(p.avatar_path) ? p.avatar_path : '',
    days: p.days, slots: p.slots, stores: p.store_ids,
    interests: p.interests?.length ? p.interests : [p.active_game],
    birthDate: priv.data.birth_date,
    radius: settings.radius ?? 5, onlyVerified: !!settings.onlyVerified,
    notif: { matches: true, messages: true, events: false, ...settings.notif },
    profiles,
  };
}

/* Guarda el perfil completo. Los mazos que ya no están en la app se borran del servidor. */
export async function saveMe(uid, me) {
  const fields = {
    display_name: me.name.trim().slice(0, 24), bio: me.bio.slice(0, 160), active_game: me.game, visible: me.visible,
    avatar_path: isAvatarPath(me.avatar) ? me.avatar : null,
    days: me.days, slots: me.slots, store_ids: me.stores.slice(0, 10), show_distance: me.showDistance,
    interests: me.interests.slice(0, 10),
  };
  // Primero se actualiza; si la fila no existe se crea. (Un "upsert" intentaría reescribir el id, que no se puede editar.)
  const upd = await supabase.from('profiles').update(fields).eq('id', uid).select('id');
  check(upd);
  if (!upd.data.length) check(await supabase.from('profiles').insert({ id: uid, ...fields }));

  check(await supabase.from('private_profiles').upsert({
    user_id: uid, birth_date: me.birthDate,
    settings: { radius: me.radius, onlyVerified: me.onlyVerified, notif: me.notif },
  }));

  // Solo se guardan los perfiles de los juegos que tienes en tu lista; los demás se borran
  const kept = Object.entries(me.profiles).filter(([game]) => me.interests.includes(game) || game === me.game);
  check(await supabase.from('game_profiles').upsert(
    kept.map(([game, g]) => ({ user_id: uid, game, level: g.level, fav_card: g.favCard, colors: g.colors, formats: g.formats })),
  ));
  check(await supabase.from('game_profiles').delete().eq('user_id', uid).not('game', 'in', `(${kept.map(([g]) => g).join(',')})`));

  const decks = kept.flatMap(([game, g]) => g.decks.filter((d) => isUuid(d.id))
    .map((d) => ({ id: d.id, user_id: uid, game, name: d.name.slice(0, 32), format: d.format, card: d.card })));
  if (decks.length) check(await supabase.from('decks').upsert(decks));
  const del = supabase.from('decks').delete().eq('user_id', uid);
  check(await (decks.length ? del.not('id', 'in', `(${decks.map((d) => d.id).join(',')})`) : del));
}

/* Sube una foto (data URL en JPEG) con nombre aleatorio y borra las anteriores. Devuelve su ruta. */
export async function uploadAvatar(uid, dataUrl) {
  const blob = dataUrlToBlob(dataUrl);
  const path = `${uid}/${crypto.randomUUID()}.jpg`;
  check(await supabase.storage.from(AVATARS).upload(path, blob, { contentType: 'image/jpeg', upsert: false }));
  await removeAvatars(uid, path);
  return path;
}

/* Borra las fotos del usuario (todas, o todas menos `keep`) */
export async function removeAvatars(uid, keep) {
  const { data } = await supabase.storage.from(AVATARS).list(uid);
  const old = (data ?? []).map((f) => `${uid}/${f.name}`).filter((p) => p !== keep);
  if (old.length) await supabase.storage.from(AVATARS).remove(old);
}
