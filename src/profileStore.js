import { supabase } from './supabase';

// Traduce el perfil de la app (`me`) a las tablas de Supabase y al revés.
// Público: profiles (con juegos, nivel, formatos y carta favorita) y decks. Privado (solo su dueño): private_profiles.

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
const allCards = (me) => [me.favCard, ...me.decks.map((d) => d.card)].filter(Boolean);
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
const fixUpload = (map) => (c) => (c?.upload && map[c.upload] ? { ...c, upload: map[c.upload] } : c);
export const replaceUploads = (me, map) => ({
  ...me, favCard: fixUpload(map)(me.favCard), decks: me.decks.map((d) => ({ ...d, card: fixUpload(map)(d.card) })),
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
export async function loadMe(uid) {
  const [prof, priv, decks] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
    supabase.from('private_profiles').select('*').eq('user_id', uid).maybeSingle(),
    supabase.from('decks').select('*').eq('user_id', uid),
  ]);
  [prof, priv, decks].forEach(check);
  const p = prof.data;
  if (!p || !priv.data) return null;
  const settings = priv.data.settings ?? {};
  return {
    name: p.display_name, bio: p.bio, visible: p.visible, showDistance: p.show_distance,
    avatar: isAvatarPath(p.avatar_path) ? p.avatar_path : '',
    days: p.days, slots: p.slots, stores: p.store_ids,
    interests: p.interests?.length ? p.interests : [p.active_game],
    level: p.level, formats: p.formats ?? [], title: p.title ?? '',
    verifiedStore: p.verified_store_id ?? null, // solo lectura: lo pone el servidor
    favCard: { ...(p.fav_card ?? {}), game: p.fav_card?.game ?? p.active_game },
    decks: decks.data.map((d) => ({ id: d.id, game: d.game, name: d.name, format: d.format, card: d.card })),
    birthDate: priv.data.birth_date,
    radius: settings.radius ?? 5, onlyVerified: !!settings.onlyVerified,
    notif: { matches: true, messages: true, events: false, ...settings.notif },
  };
}

// Distancia aproximada de cada rango (solo para ordenar y filtrar en la app; nunca es una ubicación real)
const BAND_KM = { 'A menos de 1 km': 0.5, 'A 1–2 km': 1.5, 'A 2–5 km': 3.5 };

/* Jugadores cercanos que aún no has decidido, con su rango de distancia. Solo llegan perfiles visibles y no bloqueados. */
export async function loadDiscover(uid, radius) {
  const [near, likes, supers] = await Promise.all([
    supabase.rpc('nearby_players', { radius_km: radius }),
    supabase.from('likes').select('to_user').eq('from_user', uid),
    supabase.rpc('my_super_likers'),
  ]);
  [near, likes, supers].forEach(check);
  const decided = new Set(likes.data.map((l) => l.to_user));
  const bands = new Map(near.data.map((r) => [r.user_id, r.distance_band]));
  if (!bands.size) return [];
  const ids = [...bands.keys()];
  const [prof, decks] = await Promise.all([
    supabase.from('profiles').select('*').in('id', ids),
    supabase.from('decks').select('*').in('user_id', ids),
  ]);
  [prof, decks].forEach(check);
  const superIds = new Set(supers.data);
  // decided: ya le diste like o súper duelo (no vuelve a salir en Descubrir, sí en Cerca de ti)
  return prof.data.map((p) => ({ ...toPlayer(p, decks.data, BAND_KM[bands.get(p.id)] ?? 7, superIds.has(p.id)), decided: decided.has(p.id) }));
}

/* Mensajes: en la base de datos una propuesta de partida va como texto con este prefijo y su JSON */
const MEETUP = '@meetup ';
export const messageFromRow = (row, uid) => {
  const from = row.sender_id === uid ? 'me' : 'them';
  if (row.body.startsWith(MEETUP)) {
    try { return { id: row.id, type: 'meetup', from, ...JSON.parse(row.body.slice(MEETUP.length)) }; } catch { /* sin formato válido: se muestra como texto */ }
  }
  return { id: row.id, type: 'text', from, text: row.body };
};

/* Duelos con sus rivales (perfil, mazos y si uno de los dos envió súper duelo) */
async function rowsToPlayers(rows, uid) {
  if (!rows.length) return [];
  const others = rows.map((r) => (r.user_a === uid ? r.user_b : r.user_a));
  const [prof, decks, supers] = await Promise.all([
    supabase.from('profiles').select('*').in('id', others),
    supabase.from('decks').select('*').in('user_id', others),
    supabase.from('likes').select('from_user, to_user').eq('is_super', true).or(`from_user.eq.${uid},to_user.eq.${uid}`),
  ]);
  [prof, decks, supers].forEach(check);
  return rows.map((r, i) => {
    const other = others[i];
    // Si no se puede leer su perfil (oculto o bloqueado) se muestra un marcador sin datos
    const p = prof.data.find((x) => x.id === other) ?? { id: other, display_name: 'Jugador', active_game: 'magic' };
    const sent = supers.data.some((l) => l.from_user === uid && l.to_user === other);
    const received = supers.data.some((l) => l.from_user === other && l.to_user === uid);
    return { ...toPlayer(p, decks.data, 99, received), matchId: r.id, superDuel: sent ? 'sent' : received ? 'received' : null };
  });
}
export async function loadMatches(uid) {
  const { data, error } = await supabase.from('matches').select('id, user_a, user_b').order('created_at', { ascending: false });
  check({ error });
  return rowsToPlayers(data, uid);
}
export async function loadMatchPlayer(row, uid) {
  return (await rowsToPlayers([row], uid))[0];
}
/* Mensajes de varios duelos, ya en el formato del chat: { matchId, id, type, from, text | ...propuesta } */
export async function loadMessages(matchIds, uid) {
  if (!matchIds.length) return [];
  const { data, error } = await supabase.from('messages').select('*').in('match_id', matchIds).order('created_at');
  check({ error });
  return data.map((row) => ({ matchId: row.match_id, ...messageFromRow(row, uid) }));
}
export async function sendMessage(matchId, uid, m) {
  const body = m.type === 'meetup' ? MEETUP + JSON.stringify({ format: m.format, store: m.store, date: m.date }) : m.text;
  const { data, error } = await supabase.from('messages').insert({ match_id: matchId, sender_id: uid, body }).select().single();
  check({ error });
  return { matchId, ...messageFromRow(data, uid) };
}

/* Convierte una fila de profiles (y sus mazos) al formato de jugador de la app */
const toPlayer = (p, allDecks, dist, superLikedYou) => {
  const game = p.active_game;
  return {
    id: p.id, name: p.display_name, bio: p.bio,
    avatar: isAvatarPath(p.avatar_path) ? avatarUrl(p.avatar_path) : '',
    verified: !!p.verified_store_id, superLikedYou, dist,
    interests: p.interests?.length ? p.interests : [game], game,
    level: p.level, formats: p.formats ?? [], title: p.title ?? '',
    favCard: { ...(p.fav_card ?? {}), game: p.fav_card?.game ?? game },
    decks: allDecks.filter((d) => d.user_id === p.id).map((d) => ({ id: d.id, game: d.game, name: d.name, format: d.format, card: d.card })),
    stores: p.store_ids ?? [], days: p.days ?? [], slots: p.slots ?? [], colors: [], availability: '',
    rel: { played: 0, noShow: 0 },
  };
};

// Código de jugador: 12 caracteres hexadecimales, mostrados en grupos de 4
export const formatCode = (c) => (c ? `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}` : '');
export async function ensureShareCode() {
  const { data, error } = await supabase.rpc('ensure_share_code');
  check({ error });
  return data;
}
/* Jugador con ese código, o null si no existe, no es visible o te ha bloqueado */
export async function findPlayerByCode(code) {
  const clean = code.toLowerCase().replace(/[^0-9a-f]/g, '');
  if (clean.length !== 12) return null;
  const { data: ids, error } = await supabase.rpc('find_player_by_code', { p_code: clean });
  check({ error });
  const id = ids?.[0];
  if (!id) return null;
  const [prof, decks, supers] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('decks').select('*').eq('user_id', id),
    supabase.rpc('my_super_likers'),
  ]);
  [prof, decks, supers].forEach(check);
  if (!prof.data) return null;
  // Sin distancia conocida: no entra en la cola de Descubrir, solo se abre su ficha
  return toPlayer(prof.data, decks.data, 99, supers.data.includes(id));
}

/* Guarda tu ubicación para que te encuentren cerca. Se redondea a unos 100 m; los demás solo ven rangos de distancia. */
export async function saveLocation(uid, { latitude, longitude }) {
  const round = (n) => Math.round(n * 1000) / 1000;
  check(await supabase.from('private_profiles').update({
    location: `SRID=4326;POINT(${round(longitude)} ${round(latitude)})`, location_at: new Date().toISOString(),
  }).eq('user_id', uid));
}

/* Guarda el perfil completo. Los mazos que ya no están en la app se borran del servidor. */
export async function saveMe(uid, me) {
  const fields = {
    display_name: me.name.trim().slice(0, 24), bio: me.bio.slice(0, 160), visible: me.visible,
    // active_game: el juego de tu carta favorita (lo usan las consultas que aún filtran por un juego)
    active_game: me.favCard.game, avatar_path: isAvatarPath(me.avatar) ? me.avatar : null,
    days: me.days, slots: me.slots, store_ids: me.stores.slice(0, 10), show_distance: me.showDistance,
    interests: me.interests.slice(0, 10), level: me.level, formats: me.formats.slice(0, 20), fav_card: me.favCard,
    title: me.title || null,
  };
  // Primero se actualiza; si la fila no existe se crea. (Un "upsert" intentaría reescribir el id, que no se puede editar.)
  const upd = await supabase.from('profiles').update(fields).eq('id', uid).select('id');
  check(upd);
  if (!upd.data.length) check(await supabase.from('profiles').insert({ id: uid, ...fields }));

  check(await supabase.from('private_profiles').upsert({
    user_id: uid, birth_date: me.birthDate,
    settings: { radius: me.radius, onlyVerified: me.onlyVerified, notif: me.notif },
  }));

  const decks = me.decks.filter((d) => isUuid(d.id))
    .map((d) => ({ id: d.id, user_id: uid, game: d.game, name: d.name.slice(0, 32), format: d.format, card: d.card }));
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
