import { useState, useRef, useId, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PLAYERS, STORES, pokeImg, opImg } from './data';
import { GAMES, placeholderArt, defaultAvatar } from './games';
import { CATALOG, GAME_CATEGORIES, MAX_GAMES, gameName, isGameId } from './catalog';
import { compat, byCompat, reliability } from './compat';
import { TITLES, unlockedTitles, titleFor } from './titles';
import { t, useLang, setLang, getLang, LANGS, locale } from './i18n';
import { supabase } from './supabase';
import ManaBreak from './ManaBreak';
import {
  loadMe, saveMe, uploadAvatar, removeAvatars, isAvatarPath, avatarUrl, ageFrom, isCardUpload,
  hasLocalCardImages, uploadCardImages, replaceUploads, cleanCardImages, flagImage, hiddenImages,
} from './profileStore';

/* ---------- Iconos SVG inline (sin dependencias) ---------- */
const svg = (children, extra = {}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...extra}>{children}</svg>
);
const I = {
  flame: svg(<path d="M12 22c4 0 7-2.8 7-7 0-3.5-2.2-6.2-4-8-.3 2.2-1.3 3.6-2.6 4.2C12.8 8 11.5 5 9 2.5 9 6.5 5 9 5 14.5 5 19 8 22 12 22z" />),
  radar: svg(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 12l6-6" /></>),
  chat: svg(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />),
  user: svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  x: svg(<path d="M6 6l12 12M18 6L6 18" />, { strokeWidth: 2.8 }),
  check: svg(<path d="M4.5 12.5l5 5 10-11" />, { strokeWidth: 2.8 }),
  star: svg(<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" />, { fill: 'currentColor', fillOpacity: 0.2 }),
  undo: svg(<><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>, { strokeWidth: 2.4 }),
  send: svg(<><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></>),
  cal: svg(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  mail: svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>),
  logout: svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>),
  back: svg(<path d="M15 6l-6 6 6 6" />, { strokeWidth: 2.5 }),
  gear: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>),
  close: svg(<path d="M6 6l12 12M18 6L6 18" />, { strokeWidth: 2.5 }),
  sword: svg(<><path d="M21 3l-.8 3.6L10 16.8 7.2 14 17.4 3.8z" fill="currentColor" fillOpacity="0.25" /><path d="M5 12.5l6.5 6.5" strokeWidth="2.4" /><path d="M8.2 15.8L4.5 19.5" strokeWidth="2.6" /><circle cx="3.6" cy="20.4" r="1.1" fill="currentColor" /></>, { strokeWidth: 1.8 }),
  pin: svg(<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>),
  clock: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  trophy: svg(<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></>),
  store: svg(<><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v9h14v-9M10 21v-5h4v5" /></>),
  chevron: svg(<path d="M9 6l6 6-6 6" />, { strokeWidth: 2.4 }),
  plus: svg(<path d="M12 5v14M5 12h14" />, { strokeWidth: 2.4 }),
  edit: svg(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>),
  crystal: svg(<><path d="M12 2l7 7-7 13L5 9z" /><path d="M5 9h14M12 2v20" /></>),
  ball: svg(<><circle cx="12" cy="12" r="9" /><path d="M3 12h6M15 12h6" /><circle cx="12" cy="12" r="3" /></>),
  hat: svg(<><path d="M2.5 15.5c0-1.6 4.3-2.8 9.5-2.8s9.5 1.2 9.5 2.8-4.3 2.8-9.5 2.8-9.5-1.2-9.5-2.8z" /><path d="M6.8 13.4C6.8 9 9.1 6 12 6s5.2 3 5.2 7.4" /><path d="M7 11.6c3.2.8 6.8.8 10 0" /></>),
  deck: svg(<><rect x="3" y="6" width="12" height="15" rx="2" /><path d="M8 3h11a2 2 0 0 1 2 2v13" /></>),
  sun: svg(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  moon: svg(<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />),
  auto: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" /></>),
  camera: svg(<><path d="M4 8h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="13.5" r="3.5" /></>),
  trash: svg(<><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>),
  bell: svg(<><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 21h4" /></>),
  eye: svg(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  shield: svg(<><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>),
  search: svg(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>),
  lock: svg(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  bookmark: svg(<path d="M6 3h12v18l-6-4-6 4z" />),
  map: svg(<><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></>),
  globe: svg(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></>),
  reset: svg(<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>),
  palette: svg(<><path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z" /><circle cx="7.5" cy="11" r="1.2" fill="currentColor" /><circle cx="10" cy="7" r="1.2" fill="currentColor" /><circle cx="15" cy="7.5" r="1.2" fill="currentColor" /></>),
  flag: svg(<><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>),
  ban: svg(<><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>),
  alert: svg(<><path d="M12 3l10 18H2z" /><path d="M12 10v4M12 17.5v.5" /></>),
  book: svg(<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M8 7h7M8 11h5" /></>),
  wifiOff: svg(<><path d="M2 8.8a15 15 0 0 1 4.2-2.7M10.7 5.1A15 15 0 0 1 22 8.8M5 12.6a10 10 0 0 1 4.5-2.4M16.8 11a10 10 0 0 1 2.2 1.6M8.5 16.1a5 5 0 0 1 7 0M12 20h.01M3 3l18 18" /></>),
  download: svg(<><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></>),
  share: svg(<><path d="M12 3v13M8 7l4-4 4 4" /><path d="M5 12v8h14v-8" /></>),
  qr: svg(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.5M14 21h3M20 18v3" /></>),
};
/* Icono de cada juego: cristal de maná, Poké Ball y sombrero de paja */
const GAME_ICON = { magic: I.crystal, pokemon: I.ball, onepiece: I.hat };

/* ---------- Catálogo común ---------- */
const LEVELS = ['Casual', 'Casual competitivo', 'Competitivo'];
const DAYS = [['L', 'Lunes'], ['M', 'Martes'], ['X', 'Miércoles'], ['J', 'Jueves'], ['V', 'Viernes'], ['S', 'Sábado'], ['D', 'Domingo']];
const SLOTS = ['Mañana', 'Tarde', 'Noche'];

/* Un único perfil: tus juegos, un nivel, unos formatos, una carta favorita (de cualquiera de tus juegos) y tus mazos */
const DEFAULT_ME = {
  name: 'Planeswalker', birthDate: '1998-03-14', avatar: '',
  interests: ['magic', 'pokemon', 'lorcana', 'fab', 'wh40k'],
  level: 'Casual competitivo', formats: ['Commander', 'Modern', 'Estándar'],
  favCard: { game: 'magic', name: '' },
  decks: [
    { id: 1, game: 'magic', name: 'Atraxa Superfriends', format: 'Commander', card: { name: 'Atraxa, Praetors\' Voice' } },
    { id: 2, game: 'pokemon', name: 'Charizard ex', format: 'Estándar', card: { name: 'Charizard ex', img: pokeImg('sv3', 125) } },
  ],
  bio: 'Jugador de cartas de toda la vida. Busco mesa fija entre semana y algún torneo de tienda.',
  stores: ['s1'], days: ['X', 'V'], slots: ['Tarde'],
  verifiedStore: 's1', // demo: Dragón Rojo Games te ha verificado
  premium: false, // cuenta premium: activa el brillo foil de tus cartas (aún no hay compra; ver isPremium)
  radius: 5, onlyVerified: false,
  showDistance: true, visible: true,
  notif: { matches: true, messages: true, events: false },
};
const cleanCard = (c) => {
  if (!c || typeof c !== 'object') return { name: '' };
  const { upload, ...rest } = c;
  return isCardUpload(upload) ? { ...rest, upload } : rest;
};
/* Convierte perfiles guardados con versiones anteriores (solo Magic, o un perfil por juego) al perfil único */
const migrateMe = (v) => {
  const me = { ...DEFAULT_ME, ...v, notif: { ...DEFAULT_ME.notif, ...v.notif } };
  if (v.profiles) {
    // Versión con un perfil por juego: el activo pasa a ser el perfil único y se juntan formatos y mazos
    const game = v.profiles[v.game] ? v.game : Object.keys(v.profiles)[0];
    const active = v.profiles[game] ?? {};
    const kept = Object.entries(v.profiles).filter(([g]) => !v.interests || v.interests.includes(g) || g === game);
    me.level = active.level ?? DEFAULT_ME.level;
    me.favCard = { ...(active.favCard ?? { name: '' }), game };
    me.formats = [...new Set(kept.flatMap(([, x]) => x.formats ?? []))];
    me.decks = kept.flatMap(([g, x]) => (x.decks ?? []).map((d) => ({ ...d, game: g })));
  } else if (typeof v.favCard === 'string') {
    // Primera versión (solo Magic)
    me.favCard = { game: 'magic', name: v.favCard };
    me.decks = (v.decks ?? []).map((d, i) => ({ id: d.id ?? i, game: 'magic', name: d.name, format: d.format, card: d.card ?? { name: d.commander } }));
  }
  // Antes se guardaba la edad; ahora la fecha de nacimiento (aproximada si solo había edad)
  if (!v.birthDate) me.birthDate = v.age ? `${new Date().getFullYear() - v.age}-01-01` : DEFAULT_ME.birthDate;
  ['profiles', 'game', 'colors', 'games', 'showAge', 'age'].forEach((k) => delete me[k]);
  if (typeof me.avatar !== 'string' || (me.avatar && !me.avatar.startsWith('data:image/') && !isAvatarPath(me.avatar))) me.avatar = '';
  // Lista de juegos: solo identificadores del catálogo, sin repetir y como mucho MAX_GAMES
  me.interests = Array.isArray(me.interests) ? [...new Set(me.interests.filter(isGameId))].slice(0, MAX_GAMES) : [];
  if (!me.interests.length) me.interests = [GAMES[me.favCard?.game] ? me.favCard.game : 'magic'];
  return normalizeMe(me);
};
/* Mantiene el perfil coherente: la carta favorita es de uno de tus juegos y los datos tienen la forma esperada */
function normalizeMe(me) {
  const first = me.interests[0] ?? 'magic';
  // El banner es solo una imagen subida; el juego solo decide la imagen por defecto si no hay ninguna
  const fc = cleanCard(me.favCard);
  const favCard = { game: me.interests.includes(fc.game) ? fc.game : first, name: '', ...(fc.upload && { upload: fc.upload }) };
  return {
    ...me,
    level: LEVELS.includes(me.level) ? me.level : 'Casual',
    title: TITLES.some((x) => x.id === me.title) ? me.title : '',
    verifiedStore: typeof me.verifiedStore === 'string' ? me.verifiedStore : null,
    // Solo formatos de tus juegos (si quitas un juego, sus formatos desaparecen)
    formats: Array.isArray(me.formats) ? me.formats.filter((f) => formatOptions(me.interests).includes(f)).slice(0, 20) : [],
    favCard,
    decks: (Array.isArray(me.decks) ? me.decks : []).filter((d) => d && GAMES[d.game]).map((d) => ({ ...d, card: cleanCard(d.card) })),
  };
}
/* Formatos que se pueden elegir: los de tus juegos, sin repetir */
const formatOptions = (games) => [...new Set(games.flatMap((g) => GAMES[g]?.formats ?? []))];

/* ---------- Seguridad y convivencia ---------- */
const RULES = [
  [I.sword, 'Aquí se viene a jugar', 'ManaMatch es para encontrar rivales y mesa, no para ligar. Nada de insinuaciones ni propuestas personales.', 'clash'],
  [I.store, 'Quedadas solo en tiendas', 'Las partidas se proponen siempre en una tienda o evento público. Nunca en domicilios.', 'store'],
  [I.shield, 'Respeto ante todo', 'Sin acoso, insultos, discriminación ni presión. Un "no" es un "no".', 'shield'],
  [I.eye, 'Protege tus datos', 'No compartas tu dirección, teléfono ni redes hasta conocer a alguien en la tienda.', 'eye'],
  [I.user, 'Solo mayores de 18', 'El chat privado y los duelos 1 contra 1 son solo para adultos verificados.', 'adult'],
];
const SAFETY_TIPS = [
  'Queda siempre en la tienda y en horario de apertura.',
  'Avisa a alguien de dónde vas a jugar.',
  'Sigue la conversación dentro de ManaMatch: así podemos ayudarte si algo va mal.',
  'Si alguien insiste en verte fuera de la tienda o se pone personal, denúncialo.',
];
const IMAGE_REASON = 'Imagen inapropiada o que no es del juego';
const REPORT_REASONS = [
  IMAGE_REASON,
  'Busca ligar o hace insinuaciones',
  'Acoso o insultos',
  'Contenido sexual o inapropiado',
  'Insiste en quedar fuera de una tienda',
  'Spam, estafa o venta sospechosa',
  'Perfil falso o suplantación',
  'Posible menor de edad',
  'Otro motivo',
];

/* Distancia aproximada: nunca mostramos la posición exacta de un jugador */
const fuzzyDist = (km) => t(km < 1 ? 'A menos de 1 km' : km < 2 ? 'A 1–2 km' : km < 5 ? 'A 2–5 km' : 'A más de 5 km');
/* Moderación básica del chat. En producción se repetiría en el servidor con un modelo de moderación. */
const CONTACT_RE = /(\+?\d[\d\s.-]{7,}\d)|(^|\s)@[a-z0-9_.]{3,}|[\w.-]+@[\w-]+\.\w+|\b(whats?app|wasap|telegram|insta(gram)?|snap(chat)?|tiktok|mi n[uú]mero|tel[eé]fono)\b/i;
/* Normaliza para que no se pueda esquivar con tildes, mayúsculas, números o letras repetidas ("F0LLAAAR") */
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's' };
const normalize = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[0134578@$]/g, (c) => LEET[c] ?? c).replace(/([a-z])\1{2,}/g, '$1');
const CONDUCT_RE = new RegExp(`\\b(${[
  'guap[oa]s?', 'preciosa', 'bonita', 'hermosa', 'tia buena', 'ligar', 'ligue', 'liarnos', 'enrollarnos',
  'sexy', 'sexo', 'sexual\\w*', 'bes(o|os|ar|arte|ito|itos)', 'carino', 'nen[ae]', 'mi amor', 'te quiero',
  'desnud\\w*', 'nudes?', 'fotos? tuyas?', 'tu casa', 'mi casa', 'a solas', 'novi[oa]s?', 'solter[oa]',
  'foll\\w*', 'fornic\\w*', 'polvo', 'cachond\\w*', 'excitad\\w*', 'morbo\\w*', 'mamada', 'chupam\\w*',
  'polla', 'cono', 'tetas', 'pene', 'cita', 'romantic\\w*', 'enamor\\w*', 'masaje\\w*', 'porno\\w*',
].join('|')})\\b`);
/* Raíces explícitas que se buscan también con las letras pegadas ("f.o.l.l.a.r", "forni car") */
const STRONG_RE = /(fornic|follar|mamada|desnud|cachond)/;
const checkMessage = (t) => {
  const n = normalize(t);
  if (CONDUCT_RE.test(n) || STRONG_RE.test(n.replace(/[^a-z]/g, ''))) return 'conduct';
  return CONTACT_RE.test(t) ? 'contact' : null;
};
const MOD_TEXT = {
  conduct: 'Este mensaje no encaja con el código de conducta. ManaMatch es para jugar, no para ligar. Cámbialo antes de enviarlo.',
  contact: 'Parece que compartes datos de contacto. Te recomendamos seguir por aquí hasta conoceros en la tienda.',
  rate: 'Vas muy rápido. Espera unos segundos antes de enviar más mensajes.',
};
/* Límite de velocidad del chat: frena el spam y el acoso a ráfagas (el servidor debe aplicar el suyo) */
const RATE = { max: 5, windowMs: 10000 };

/* Estado que se guarda en el navegador (si el almacenamiento falla, sigue funcionando en memoria) */
function useStoredState(key, initial, merge = (v) => v) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? merge(JSON.parse(raw)) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
  }, [key, value]);
  return [value, setValue];
}

/* ---------- Comportamiento de app móvil ---------- */
/* Botón "atrás" (Android) y gesto de volver: cierra la capa superior en vez de salir de la app.
   Cada capa abierta añade una entrada al historial; si se cierra desde la interfaz, se retira. */
const backStack = [];
let ignorePop = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ignorePop > 0) { ignorePop--; return; }
    backStack.pop()?.onPop();
  });
}
function useBack(active, onBack) {
  const cb = useRef(onBack);
  useEffect(() => { cb.current = onBack; });
  useEffect(() => {
    if (!active) return;
    const entry = { popped: false, pushed: false, onPop() { this.popped = true; cb.current(); } };
    // La entrada se añade un instante después: si la capa se monta y desmonta enseguida (React en modo
    // estricto, o un cierre inmediato) no se toca el historial. Antes, ese "atrás" extra podía salir
    // de la página actual y volver a la anterior.
    const timer = setTimeout(() => {
      entry.pushed = true;
      backStack.push(entry);
      history.pushState({ mm: true }, '');
    });
    return () => {
      clearTimeout(timer);
      if (!entry.pushed) return;
      const i = backStack.indexOf(entry);
      if (i !== -1) backStack.splice(i, 1);
      if (!entry.popped) { ignorePop++; history.back(); }
    };
  }, [active]);
}

/* Respeta la opción del sistema "reducir movimiento" */
// Con el rendimiento «ligero» se atenúa el movimiento igual que con la preferencia de accesibilidad del sistema
const reducedMotion = () => document.documentElement.dataset.perf === 'light' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// Brillo «foil» de la carta: solo para cuentas premium (el servidor debe confirmarlo; aquí solo es visual)
const isPremium = (me) => me.premium === true;

/* Vibración breve en móviles que la admiten (Android); en el resto no hace nada */
const haptic = (pattern = 12) => { try { navigator.vibrate?.(pattern); } catch { /* sin vibración */ } };

/* Altura real visible: en iOS el teclado no cambia 100dvh, así que usamos visualViewport */
function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const set = () => document.documentElement.style.setProperty('--app-h', `${vv.height}px`);
    set();
    vv.addEventListener('resize', set);
    return () => vv.removeEventListener('resize', set);
  }, []);
}

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

/* Instalación como app: botón nativo en Android/Chrome e instrucciones en iOS */
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
function useInstall() {
  const [promptEvt, setPromptEvt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);
  useEffect(() => {
    const ready = (e) => { e.preventDefault(); setPromptEvt(e); };
    const done = () => { setInstalled(true); setPromptEvt(null); };
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', ready); window.removeEventListener('appinstalled', done); };
  }, []);
  const install = async () => { promptEvt?.prompt(); await promptEvt?.userChoice; setPromptEvt(null); };
  return { installed, canPrompt: !!promptEvt, install, isIOS: /iphone|ipad|ipod/i.test(navigator.userAgent) };
}

/* Sugerencias de cartas con el buscador del juego (Scryfall, Pokémon TCG API o catálogo de One Piece) */
// Sugerencias de cartas. Cada resultado va ligado a su búsqueda: mientras llega el de la búsqueda actual
// no se muestran los de la anterior (se podría elegir una carta equivocada) y se indica que está buscando.
function useCardSuggest(game, q) {
  const [res, setRes] = useState({ key: '', list: [], failed: false });
  const key = q.trim().length < 2 ? '' : `${game}:${q.trim()}`;
  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      GAMES[game].search(q, ctrl.signal)
        .then((list) => setRes({ key, list, failed: false }))
        .catch(() => { if (!ctrl.signal.aborted) setRes({ key, list: [], failed: true }); });
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [game, q, key]);
  const ready = key && res.key === key;
  return { list: ready ? res.list : [], loading: !!key && !ready, failed: ready && res.failed, done: ready && !res.failed };
}

/* ---------- Utilidades por juego ---------- */
const storeName = (id) => STORES.find((s) => s.id === id)?.name;
// Tienda que ha verificado en persona a un jugador (la marca el personal de la tienda, nunca el jugador)
const verifiedStoreOf = (p) => p.verifiedStore ?? (p.verified ? p.stores?.[0] : null) ?? null;
/* Icono de tienda; si esa tienda te ha verificado, lleva un check */
const StoreIcon = ({ verified, title }) => (
  <span className={`row-icon${verified ? ' store-verified' : ''}`} title={verified ? title : undefined}>
    {I.store}{verified && <span className="store-check" aria-label={title}>{I.check}</span>}
  </span>
);
// Imágenes denunciadas por ti o por varias personas: se sustituyen por la imagen por defecto del juego
const hiddenImgs = new Set();
const isHidden = (card) => !!card?.upload && hiddenImgs.has(card.upload);
const artOf = (game, card) => (isHidden(card) ? placeholderArt(game) : GAMES[game].art(card));
// Solo las cartas oficiales completas de Pokémon y One Piece se recortan; las subidas y las de Magic ya son ilustración
const isFullCard = (game, card) => (game === 'pokemon' || game === 'onepiece') && !card?.upload && !!card?.img;
const cardOk = (game, c) => !!(c?.name?.trim() || c?.upload) || !!GAMES[game]?.generic;
/* Las cartas de Pokémon y One Piece son la carta completa: se encuadra hacia la ilustración */
const imgCls = (game, card) => (isFullCard(game, card) ? ` full-card fc-${game}` : '');
// La foto puede ser una subida a la cuenta (ruta en Storage), una recién elegida (data URL) o, si no hay, la carta favorita
const photoSrc = (me) => (isAvatarPath(me.avatar) ? avatarUrl(me.avatar) : me.avatar);
// Sin foto subida: un meeple gris claro, como una imagen pendiente de cargar (el "huevo" de Twitter)
const myAvatar = (me) => photoSrc(me) || defaultAvatar();
const avatarOf = (p) => p.avatar || defaultAvatar();
// Marco del retrato: el morado de la app para todos (los colores por juego ya no existen en el perfil)
const FRAME = { list: ['#8B5CF6'], grad: '#8B5CF6', glow: '#8B5CF6' };
// Marco verde: quien te ha retado con un Súper duelo (y las conversaciones que salieron de uno)
const SUPER_FRAME = ['#C4F56A'];
const toggleIn = (arr, v) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
// Con onPlay, toda la pantalla vacía es un botón que abre el minijuego (y lo dice con un aviso)
const Empty = ({ icon, title, text, onPlay, playHint }) => {
  const body = (
    <>
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {onPlay && <span className="empty-hint">{I.sword}{playHint}</span>}
    </>
  );
  return onPlay
    ? <button type="button" className="empty empty-tap" onClick={onPlay}>{body}</button>
    : <div className="empty">{body}</div>;
};
const Switch = ({ id, on, onChange, label, hint, icon }) => (
  <div className="setting">
    {icon && <span className="setting-icon">{icon}</span>}
    <div className="grow"><div className="setting-label">{label}</div>{hint && <div className="setting-hint">{hint}</div>}</div>
    <button id={id} type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)}><span /></button>
  </div>
);
const Segmented = ({ value, options, onChange, name }) => (
  <div className="segmented" role="radiogroup" aria-label={name}>
    {options.map(([v, label, icon]) => (
      <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{icon}{label}</button>
    ))}
  </div>
);
const ChipPicker = ({ options, value, onChange, toggle }) => (
  <div className="tags">{options.map((o) => <button type="button" key={o} className={`tag ${value.includes(o) ? 'on' : ''}`} aria-pressed={value.includes(o)} onClick={() => (toggle ? toggle(o) : onChange(toggleIn(value, o)))}>{t(o)}</button>)}</div>
);
const ModNote = ({ kind }) => kind && (
  <div className={`mod-note ${kind === 'rate' ? 'contact' : kind}`} role="alert">{kind === 'conduct' ? I.ban : I.alert}<span>{t(MOD_TEXT[kind])}</span></div>
);
const gameIcon = (g) => GAME_ICON[g] ?? I.deck;

/* Desplegable con tus juegos (para elegir de qué juego es una carta o un mazo) */
const GameSelect = ({ id, games, value, onChange }) => (
  <select id={id} className="game-select" value={value} onChange={(e) => onChange(e.target.value)}>
    {games.map((g) => <option key={g} value={g}>{GAMES[g].name}</option>)}
  </select>
);

/* ---------- Tus juegos: lista del catálogo y juegos en común ---------- */
const sharedGames = (me, p) => (p.interests ?? []).filter((g) => me.interests.includes(g));
// Juego de vuestro duelo: el primero que compartís (o, si no, el de su carta favorita)
const duelGame = (me, p) => sharedGames(me, p)[0] ?? p.favCard.game;
const fold = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function GamePicker({ value, onChange }) {
  const [q, setQ] = useState('');
  const full = value.length >= MAX_GAMES;
  const nq = fold(q.trim());
  const groups = GAME_CATEGORIES
    .map((cat) => [cat, CATALOG.filter((g) => g.cat === cat && (!nq || fold(`${g.name} ${g.alias}`).includes(nq)))])
    .filter(([, games]) => games.length);
  return (
    <div className="game-picker">
      <div className="picker-head">
        <p>{t('Elige los juegos a los que juegas. Te mostraremos antes a la gente con más juegos en común.')}</p>
        <span className={`picker-count${full ? ' full' : ''}`} aria-live="polite">({value.length}/{MAX_GAMES})</span>
      </div>
      <label className="picker-search">{I.search}
        <input type="search" value={q} placeholder={t('Buscar juego')} aria-label={t('Buscar juego')} onChange={(e) => setQ(e.target.value)} />
      </label>
      {groups.map(([cat, games]) => (
        <div key={cat} className="picker-group">
          <h4>{t(cat)}</h4>
          <div className="tags">
            {games.map((g) => {
              const on = value.includes(g.id);
              return (
                <button type="button" key={g.id} className={`tag interest${on ? ' on' : ''}`} aria-pressed={on} disabled={!on && full}
                  onClick={() => onChange(on ? value.filter((x) => x !== g.id) : [...value, g.id])}>{on && I.check}{g.name}</button>
              );
            })}
          </div>
        </div>
      ))}
      {!groups.length && <p className="field-hint">{t('No encontramos «{q}». Pronto añadiremos más juegos.', { q })}</p>}
    </div>
  );
}

/* Insignia de fiabilidad: solo positiva o "nuevo"; los que fallan no se señalan en público */
const RelBadge = ({ p, compact }) => {
  const r = reliability(p);
  if (r.level === 'reliable') return <span className="rel-badge reliable" title={t('{n} partidas confirmadas por sus rivales', { n: r.played })}>{I.shield}{t('Fiable')}{!compact && ` · ${t('{n} partidas', { n: r.played })}`}</span>;
  if (r.level === 'new') return <span className="rel-badge new">{I.plus}{compact ? t('Nuevo') : t('Nuevo en ManaMatch')}</span>;
  return compact ? null : <span className="rel-badge">{I.check}{t('{n} partidas jugadas', { n: r.played })}</span>;
};

/* Hoja con el selector completo de juegos; los cambios se aplican al pulsar Listo */
function GamesSheet({ value, onSave, onClose }) {
  const [draft, setDraft] = useState(value);
  useBack(true, onClose);
  return createPortal(
    <>
      <div className="sheet-bg top" onClick={onClose} />
      <section className="sheet edit-sheet top games-sheet" aria-label={t('Tus juegos')}>
        <header className="sheet-bar">
          <button className="icon-btn" onClick={onClose} aria-label={t('Cancelar')}>{I.close}</button>
          <h2>{t('Tus juegos')}</h2>
          <span style={{ width: 44 }} />
        </header>
        <div className="body"><GamePicker value={draft} onChange={setDraft} /></div>
        <div className="sheet-cta">
          <button id="games-done" className="primary" disabled={!draft.length} onClick={() => { onSave(draft); onClose(); }}>{I.check}{t('Listo')}</button>
        </div>
      </section>
    </>,
    document.querySelector('.phone') ?? document.body,
  );
}

/* Datos con los que se desbloquean los títulos */
const playerStats = (p) => ({
  played: p.rel?.played ?? 0, matches: p.matches ?? 0, reliable: reliability(p).level === 'reliable',
  games: p.interests ?? [], formats: p.formats ?? [], decks: p.decks?.length ?? 0, stores: p.stores?.length ?? 0,
  level: p.level, days: p.days ?? [], slots: p.slots ?? [], hasPhoto: !!p.avatar,
  hasFav: !!(p.favCard?.upload || p.favCard?.img), bio: p.bio ?? '',
});

/* Aviso de logro, al estilo de las consolas: sale arriba unos segundos al desbloquear un título */
function Achievement({ id, onEquip, onDone }) {
  const x = TITLES.find((y) => y.id === id);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    haptic([20, 40, 20]);
    const timer = setTimeout(() => done.current(), 5500);
    return () => clearTimeout(timer);
  }, [id]);
  if (!x) return null;
  return (
    <div className="achievement" role="status" aria-live="polite">
      <span className="ach-ico">{I.trophy}</span>
      <div className="grow">
        <small>{t('¡Logro desbloqueado!')}</small>
        <b>{t(x.label)}</b>
        <span>{t(x.hint)}</span>
      </div>
      <button type="button" className="ach-btn" onClick={onEquip}>{t('Ponérmelo')}</button>
    </div>
  );
}

/* Hoja para elegir título, como la de los juegos: etiquetas agrupadas; las bloqueadas explican cómo conseguirlas */
function TitlesSheet({ value, unlocked, onSave, onClose }) {
  const [pick, setPick] = useState(value);
  useBack(true, onClose);
  return createPortal(
    <>
      <div className="sheet-bg top" onClick={onClose} />
      <section className="sheet edit-sheet top games-sheet" aria-label={t('Título')}>
        <header className="sheet-bar">
          <button className="icon-btn" onClick={onClose} aria-label={t('Cancelar')}>{I.close}</button>
          <h2>{t('Título')}</h2>
          <span style={{ width: 44 }} />
        </header>
        <div className="body">
          <div className="picker-head">
            <p>{t('Se muestra bajo tu foto. Desbloquea más jugando.')}</p>
            <span className="picker-count">({unlocked.length}/{TITLES.length})</span>
          </div>
          {/* Primero los que ya tienes; los bloqueados dicen cómo conseguirlos */}
          <div className="titles">
            {[...TITLES].sort((a, b) => unlocked.includes(b.id) - unlocked.includes(a.id)).map((x) => {
              const open = unlocked.includes(x.id);
              return (
                <button type="button" key={x.id} className={`title-opt${pick === x.id ? ' on' : ''}${open ? '' : ' locked'}`}
                  disabled={!open} aria-pressed={pick === x.id} onClick={() => setPick(x.id)}>
                  <span className="title-ico">{open ? (pick === x.id ? I.check : I.star) : I.lock}</span>
                  <span className="grow"><b>{t(x.label)}</b><small>{t(x.hint)}</small></span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sheet-cta">
          <button id="title-done" className="primary" onClick={() => { onSave(pick); onClose(); }}>{I.check}{t('Listo')}</button>
        </div>
      </section>
    </>,
    document.querySelector('.phone') ?? document.body,
  );
}
const playerTitle = (p) => t(titleFor(p.title, playerStats(p)).label);
/* "Casual competitivo · Commander, cEDH": nivel y, detrás, los formatos */
const levelLine = (p, max = 2) => [t(p.level), p.formats.slice(0, max).map((f) => t(f)).join(', ')].filter(Boolean).join(' · ');

/* Juegos de otro jugador, con los que compartís resaltados primero */
const GameList = ({ me, p }) => {
  const shared = sharedGames(me, p);
  const rest = (p.interests ?? []).filter((g) => !shared.includes(g));
  return (
    <div className="tags">
      {shared.map((g) => <span key={g} className="tag interest on shared">{I.check}{gameName(g)}</span>)}
      {rest.map((g) => <span key={g} className="tag interest">{gameName(g)}</span>)}
    </div>
  );
};

/* Hexágono regular (punta arriba) con esquinas redondeadas, como path SVG */
function hexPath(cx, cy, R, r) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
  const toward = (p, q) => {
    const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
    return [p[0] + (dx / len) * r, p[1] + (dy / len) * r];
  };
  const f = (n) => n.toFixed(2);
  return pts.map((p, i) => {
    const a = toward(p, pts[(i + 5) % 6]), b = toward(p, pts[(i + 1) % 6]);
    return `${i ? 'L' : 'M'}${f(a[0])},${f(a[1])} Q${f(p[0])},${f(p[1])} ${f(b[0])},${f(b[1])}`;
  }).join(' ') + ' Z';
}
const HEX_RING = hexPath(50, 56, 53, 9);
const HEX_PHOTO = hexPath(50, 56, 44, 8);
/* Encuadre de una carta completa dentro del hexágono: ancho y altura (fracción) del centro de la ilustración.
   En One Piece se sube el encuadre para evitar la marca "SAMPLE" de las imágenes oficiales. */
const FULL_HEX = { pokemon: { w: 110, f: 0.3 }, onepiece: { w: 150, f: 0.2 } };

/* Retrato hexagonal: foto con borde degradado de colores y anillo exterior con un destello que lo recorre */
function Hex({ src, alt = '', size = 150, badge, colors = ['#fff'], ring = true, fullCard = false }) {
  const id = useId();
  const stops = colors.length > 1 ? colors : [colors[0], colors[0]];
  return (
    <div className="hex" style={{ '--s': `${size}px`, '--glow': colors[0] }}>
      <svg className="hex-svg" viewBox="0 0 100 112" role="img" aria-label={alt}>
        <defs>
          <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
            {stops.map((c, i) => <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />)}
          </linearGradient>
          <clipPath id={`${id}c`}><path d={HEX_PHOTO} /></clipPath>
        </defs>
        {ring && <path className="hex-ring" d={HEX_RING} />}
        {ring && <path className="hex-spark" d={HEX_RING} pathLength="100" stroke={`url(#${id}g)`} />}
        <path className="hex-fill" d={HEX_PHOTO} />
        {/* Una carta completa (Pokémon, One Piece) se amplía y se centra en su ilustración */}
        {fullCard
          ? <image href={src} x={50 - FULL_HEX[fullCard].w / 2} y={56 - FULL_HEX[fullCard].w * 1.396 * FULL_HEX[fullCard].f} width={FULL_HEX[fullCard].w} height={FULL_HEX[fullCard].w * 1.396} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}c)`} />
          : <image href={src} x="11" y="12" width="78" height="88" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}c)`} />}
        <path className="hex-border" d={HEX_PHOTO} stroke={`url(#${id}g)`} />
      </svg>
      {badge && <span className="role-badge">{I.star}{badge}</span>}
    </div>
  );
}

/* ================= Carta del jugador en la mesa ================= */
/* No se arrastra: se juega lanzándole cartas de la mano. Tocar su zona inferior abre la ficha.
   leaving indica con qué carta se ha jugado, para animar su salida de la mesa. */
const LEAVE = {
  nope: 'translate(-135%, 4%) rotate(-22deg)',
  like: 'translate(135%, 4%) rotate(22deg)',
  super: 'translateY(-125%) scale(0.85)',
};
function TableCard({ p, me, leaving, onInfo }) {
  const c = compat(me, p);
  const shared = c.shared.length;
  const ref = useRef(null);
  // Inclinación 3D sutil hacia el puntero (máx. ~6°); el reflejo y la ilustración también lo siguen
  const tilt = (e) => {
    const el = ref.current, r = el.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${mx * 100}%`);
    el.style.setProperty('--my', `${my * 100}%`);
    if (reducedMotion()) return;
    el.style.setProperty('--ry', `${(mx - 0.5) * 12}deg`);
    el.style.setProperty('--rx', `${(0.5 - my) * 6}deg`);
  };
  const untilt = () => { ['--rx', '--ry'].forEach((v) => ref.current?.style.setProperty(v, '0deg')); };
  const { grad, glow, list } = FRAME;
  const deck = p.decks[0];
  return (
    <article
      ref={ref} className={`swipe-card table-card g-${p.favCard.game}${leaving ? ' leaving' : ''}${p.superLikedYou ? ' super' : ''}${isPremium(me) ? ' premium' : ''}`}
      style={{ '--frame': grad, '--glow': glow, transform: LEAVE[leaving] ?? 'perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))' }}
      onPointerMove={tilt} onPointerLeave={untilt} onPointerCancel={untilt}
    >
      {p.superLikedYou && <div className="super-banner">{I.star}{t('{name} te ha retado con un Súper duelo', { name: p.name })}</div>}
      <div className="art-frame">
        <img className={`hero-art${imgCls(p.favCard.game, p.favCard)}`} src={artOf(p.favCard.game, p.favCard)} alt="" draggable="false" />
        <div className="foil" />
        <div className="hero-top">
          <span className="glass-chip game-chip">{gameIcon(duelGame(me, p))}{GAMES[duelGame(me, p)]?.name ?? gameName(duelGame(me, p))}</span>
          <span className="glass-chip dist-chip">{I.pin}{fuzzyDist(p.dist)}</span>
        </div>
      </div>
      <div className="hero-body" role="button" tabIndex={0} aria-label={t('Ver la ficha de {name}', { name: p.name })}
        onClick={onInfo} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onInfo(); } }}>
        <Hex src={avatarOf(p)} alt={p.name} size={100} badge={playerTitle(p)} colors={p.superLikedYou ? SUPER_FRAME : list} />
        <h2 className="hero-name">{p.name}{p.verified && <span className="verified" title={t('Verificado')}>{I.check}</span>}</h2>
        {deck && <div className="hero-deck">{I.deck}<b>{deck.name}</b><i className="dot-sep" />{t(deck.format)}</div>}
        <div className="hero-sub">{levelLine(p)}</div>
        <div className="hero-chips">
          <div className="hero-shared" title={t('Compatibilidad contigo')}>
            <b>{c.score}%</b>{shared > 0 ? (shared === 1 ? t('1 juego en común') : t('{n} juegos en común', { n: shared })) : t('compatible')}
          </div>
          <RelBadge p={p} compact />
        </div>
      </div>
      <div className={`stamp like${leaving === 'like' || leaving === 'super' ? ' show' : ''}`}>{t('¡Duelo!')}</div>
      <div className={`stamp nope${leaving === 'nope' ? ' show' : ''}`}>{t('Paso')}</div>
    </article>
  );
}

/* ================= Profile sheet ================= */
function ProfileSheet({ p, me, onClose, onLike, onReport, onReportImage, onBlock }) {
  const c = compat(me, p);
  const shared = c.shared.length;
  const dayName = (k) => t(DAYS.find(([d]) => d === k)?.[1] ?? k).toLowerCase();
  const list2 = (xs) => xs.join(', ');
  const reasons = [
    shared > 0 && [I.deck, t('Jugáis a {games}', { games: list2(c.shared.map(gameName)) })],
    c.sharedFormats.length > 0 && [I.sword, t('Mismos formatos: {formats}', { formats: list2(c.sharedFormats.map((f) => t(f))) })],
    c.sameLevel && [I.check, t('Mismo nivel: {level}', { level: t(p.level) })],
    c.sharedDays.length > 0 && [I.clock, c.sharedSlots.length
      ? t('Coincidís los {days} por la {slots}', { days: list2(c.sharedDays.map(dayName)), slots: list2(c.sharedSlots.map((x) => t(x).toLowerCase())) })
      : t('Coincidís los {days}', { days: list2(c.sharedDays.map(dayName)) })],
    c.sharedStores.length > 0 && [I.store, t('Vais a {stores}', { stores: list2(c.sharedStores.map(storeName)) })],
  ].filter(Boolean);
  const { list } = FRAME;
  const stores = p.stores.map((id) => STORES.find((x) => x.id === id)).filter(Boolean);
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <section className={`sheet g-${p.favCard.game}`} aria-label={t('Perfil de {name}', { name: p.name })}>
        <button id="close-profile" className="icon-btn glass close" onClick={onClose} aria-label={t('Cerrar')}>{I.close}</button>
        {/* La cabecera se desplaza con el contenido para no tapar el texto al hacer scroll */}
        <div className="sheet-scroll">
        <div className="sheet-hero">
          <img className={imgCls(p.favCard.game, p.favCard).trim()} src={artOf(p.favCard.game, p.favCard)} alt="" />
          <span className="sheet-handle" />
          {p.favCard.upload && !isHidden(p.favCard) && (
            <button type="button" className="img-flag" onClick={() => onReportImage(p.favCard.upload)} aria-label={t('Denunciar esta imagen')}>{I.flag}{t('Denunciar imagen')}</button>
          )}
        </div>
        <div className="body">
          <div className="sheet-id">
            <Hex src={avatarOf(p)} alt={p.name} size={84} colors={p.superLikedYou ? SUPER_FRAME : list} ring={false} />
            <div>
              <h2 className="sheet-name">{p.name}{p.verified && <span className="verified" title={t('Verificado')}>{I.check}</span>}</h2>
              <div className="sheet-sub">{levelLine(p, 4)}</div>
              <span className="title-chip">{I.star}{playerTitle(p)}</span>
            </div>
          </div>
          <div className="info-pills">
            {p.verified && <span className="info-pill ok">{I.shield}{storeName(verifiedStoreOf(p)) ? t('Verificado en {store}', { store: storeName(verifiedStoreOf(p)) }) : t('Verificado')}</span>}
            <RelBadge p={p} />
            <span className="info-pill">{I.pin}{fuzzyDist(p.dist)}</span>
            {p.availability && <span className="info-pill">{I.clock}{t(p.availability)}</span>}
          </div>
          <p className="bio">{p.bio}</p>

          <div className="compat-box">
            <div className="compat-ring" style={{ '--v': c.score }}><b>{c.score}%</b></div>
            <div className="grow">
              <div className="compat-title">{t('Compatibilidad')}</div>
              {reasons.length ? (
                <ul className="compat-reasons">{reasons.map(([icon, text]) => <li key={text}>{icon}<span>{text}</span></li>)}</ul>
              ) : <p className="compat-none">{t('No tenéis mucho en común todavía, pero un duelo nunca se sabe.')}</p>}
            </div>
          </div>

          {p.interests?.length > 0 && <>
            <h3 className="section-title">{t('Juegos')}{shared > 0 && <small className="title-note">{t('{n} en común', { n: shared })}</small>}</h3>
            <GameList me={me} p={p} />
          </>}

          {p.decks.length > 0 && <h3 className="section-title">{t('Mazos')}</h3>}
          <div className="decks">
            {p.decks.map((d) => (
              <div key={d.id ?? d.name} className="deck-card">
                <img loading="lazy" decoding="async" className={imgCls(d.game, d.card).trim()} src={artOf(d.game, d.card)} alt="" />
                <span className="deck-format">{t(d.format)}</span>
                <div><b>{d.name}</b><small>{GAMES[d.game].name}{d.card.name && ` · ${d.card.name}`}</small></div>
                {d.card.upload && !isHidden(d.card) && (
                  <button type="button" className="img-flag mini" onClick={() => onReportImage(d.card.upload)} aria-label={t('Denunciar la imagen del mazo {name}', { name: d.name })}>{I.flag}</button>
                )}
              </div>
            ))}
          </div>


          {stores.length > 0 && <h3 className="section-title">{t('Dónde juega')}</h3>}
          <div className="list">
            {stores.map((s) => {
              return (
                <div key={s.id} className="row">
                  <StoreIcon verified={verifiedStoreOf(p) === s.id} title={t('Ha verificado a {name} en persona', { name: p.name })} />
                  <div className="grow"><div className="title">{s.name}</div><div className="sub">{t(s.events)}</div></div>
                  <span className="dist">{s.dist} km</span>
                </div>
              );
            })}
          </div>

          <div className="safety-actions">
            <button id="block-user" className="ghost small" onClick={onBlock}>{I.ban}{t('Bloquear')}</button>
            <button id="report-user" className="ghost small danger" onClick={onReport}>{I.flag}{t('Denunciar')}</button>
          </div>
        </div>
        </div>
        {onLike && (
          <div className="sheet-cta">
            <button id="like-from-profile" className="primary" onClick={onLike}>{I.sword}{t('Retar a una partida')}</button>
          </div>
        )}
      </section>
    </>
  );
}

/* ================= Fiabilidad: ¿os visteis en la tienda? ================= */
const ATTEND = [
  ['came', 'Sí, vino', I.check],
  ['noshow', 'No se presentó', I.close],
  ['cancelled', 'Lo cancelamos', I.cal],
];
function Attendance({ p, meetup, value, onChange, onReport }) {
  const store = storeName(meetup.store);
  const [now] = useState(() => Date.now());
  const future = meetup.date && new Date(meetup.date).getTime() > now;
  if (value) {
    const text = value === 'came' ? t('Has confirmado que {name} vino. ¡Gracias por cuidar la comunidad!', { name: p.name })
      : value === 'noshow' ? t('Has indicado que {name} no se presentó.', { name: p.name }) : t('Partida cancelada: no cuenta para nadie.');
    return (
      <div className={`attend done ${value}`} role="status">
        {value === 'came' ? I.shield : value === 'noshow' ? I.alert : I.cal}<span>{text}</span>
        {value === 'noshow' && <button type="button" className="link-btn" onClick={onReport}>{t('Denunciar')}</button>}
        <button type="button" className="link-btn" onClick={() => onChange(null)}>{t('Cambiar')}</button>
      </div>
    );
  }
  return (
    <div className="attend">
      <div className="attend-q">{I.store}<b>{future ? t('Después de la partida en {store}, confirma si {name} vino', { store, name: p.name }) : t('¿Os visteis en {store}?', { store })}</b></div>
      <p>{t('Tu respuesta es privada. Con varias partidas confirmadas, los jugadores consiguen la insignia «Fiable».')}</p>
      {!future && (
        <div className="attend-btns">
          {ATTEND.map(([id, label, icon]) => <button key={id} type="button" className={`ghost small ${id}`} onClick={() => onChange(id)}>{icon}{t(label)}</button>)}
        </div>
      )}
    </div>
  );
}

/* ================= Denunciar ================= */
function ReportSheet({ p, onClose, onSubmit }) {
  const [reason, setReason] = useState(p.image ? IMAGE_REASON : '');
  const [details, setDetails] = useState('');
  // Al denunciar solo una imagen no se bloquea por defecto a la persona
  const [alsoBlock, setAlsoBlock] = useState(!p.image);
  return (
    <>
      <div className="sheet-bg top" onClick={onClose} />
      <section className="sheet edit-sheet top" aria-label={t('Denunciar a {name}', { name: p.name })}>
        <header className="sheet-bar">
          <button className="icon-btn" onClick={onClose} aria-label={t('Cerrar')}>{I.close}</button>
          <h2>{p.image ? t('Denunciar imagen') : t('Denunciar a {name}', { name: p.name })}</h2>
          <span style={{ width: 44 }} />
        </header>
        <div className="body form">
          <p className="sheet-intro">{p.image && `${t('La dejarás de ver al momento y, con varias denuncias, se oculta para todos.')} `}{t('Tu denuncia es anónima: {name} no sabrá quién la ha enviado. El equipo la revisa en menos de 24 horas.', { name: p.name })}</p>
          <fieldset><legend>{t('¿Qué ha pasado?')}</legend>
            <div className="list">
              {REPORT_REASONS.map((r) => (
                <button type="button" key={r} role="radio" aria-checked={reason === r} className={`row pick radio ${reason === r ? 'on' : ''}`} onClick={() => setReason(r)}>
                  <span className="radio-dot" /><div className="grow"><div className="title">{t(r)}</div></div>
                </button>
              ))}
            </div>
          </fieldset>
          <label>{t('Cuéntanos más (opcional)')}<textarea id="report-details" rows="3" maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t('Qué dijo o hizo, cuándo…')} /></label>
          <Switch id="report-block" icon={I.ban} label={t('Bloquear también a {name}', { name: p.name })} hint={t('No podrá verte ni escribirte')} on={alsoBlock} onChange={setAlsoBlock} />
        </div>
        <div className="sheet-cta">
          <button id="send-report" className="primary danger-fill" disabled={!reason} onClick={() => onSubmit({ reason, details, alsoBlock })}>{I.flag}{t('Enviar denuncia')}</button>
        </div>
      </section>
    </>
  );
}

/* Diálogo de confirmación pequeño (bloquear) */
function Confirm({ title, text, confirm, onConfirm, onClose, icon = I.ban, id = 'confirm-block' }) {
  return (
    <>
      <div className="sheet-bg top" onClick={onClose} />
      <div className="dialog" role="alertdialog" aria-label={title}>
        <div className="dialog-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{text}</p>
        <div className="btn-row">
          <button className="ghost" onClick={onClose}>{t('Cancelar')}</button>
          <button id={id} className="primary danger-fill" onClick={onConfirm}>{confirm}</button>
        </div>
      </div>
    </>
  );
}

/* ================= Inicio de sesión ================= */
// Sesión de Supabase: undefined mientras se comprueba, null sin sesión. Sin Supabase configurado no hay cuentas.
function useSession() {
  const [session, setSession] = useState(supabase ? undefined : null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

const GOOGLE_G = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.1z" />
    <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
  </svg>
);

// Fondo del login: cartas de los tres juegos que caen despacio sobre blanco
const LOGIN_CARDS = [
  ['magic', { name: 'Lightning Bolt' }], ['pokemon', { name: 'Charizard ex', img: pokeImg('sv3pt5', 6) }],
  ['onepiece', { name: 'Portgas.D.Ace (OP03-001)', img: opImg('OP03-001') }], ['magic', { name: 'Ragavan, Nimble Pilferer' }],
  ['pokemon', { name: 'Pikachu', img: pokeImg('sv3pt5', 25) }], ['onepiece', { name: 'Monkey.D.Luffy (ST01-001)', img: opImg('ST01-001') }],
  ['magic', { name: "Atraxa, Praetors' Voice" }], ['pokemon', { name: 'Gardevoir ex', img: pokeImg('sv1', 86) }],
  ['onepiece', { name: 'Charlotte Katakuri (OP03-099)', img: opImg('OP03-099') }], ['magic', { name: 'Korvold, Fae-Cursed King' }],
];
const LOGIN_SPARKS = ['#8B5CF6', '#C4F56A', '#B79CFB', '#C4F56A'];

// Dos filas en diagonal con las cartas alternadas. Cada fila se pinta tres veces y avanza una copia por vuelta:
// la copia central siempre tiene vecinas a ambos lados, así nunca se ve el final de la cinta
const LOGIN_ROWS = [0, 1].map((r) => LOGIN_CARDS.filter((_, i) => i % 2 === r).map(([game, card]) => ({ key: card.name, src: GAMES[game].full(card) })));

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState(null); // null | 'google' | 'sending' | 'sent' | 'error'
  // Vuelve a la misma dirección desde la que se entró (la web publicada o localhost al probar)
  const redirectTo = location.origin;
  const google = async () => {
    setState('google');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) setState('error');
  };
  const sendLink = async (e) => {
    e.preventDefault();
    setState('sending');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo } });
    setState(error ? 'error' : 'sent');
  };
  const discord = async () => {
    setState('discord');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo } });
    if (error) setState('error');
  };
  const busy = state === 'google' || state === 'discord' || state === 'sending';
  return (
    <div className="login" role="dialog" aria-label={t('Iniciar sesión')}>
      <div className="login-rain" aria-hidden="true">
        {LOGIN_ROWS.map((row, r) => (
          <div key={r} className={`rain-row ${r ? 'down' : 'up'}`}>
            <div className="rain-track">{[...row, ...row, ...row].map((c, i) => <img key={c.key + i} src={c.src} alt="" />)}</div>
          </div>
        ))}
      </div>
      <div className="sparks">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i, '--c': LOGIN_SPARKS[i % LOGIN_SPARKS.length] }} />)}</div>
      <div className="duel-icon" aria-hidden="true">{SWORD}{SWORD}</div>
      <p className="its">{t('Bienvenido a')}</p>
      <h1 className="match-title" data-text="MANAMATCH">MANAMATCH</h1>
      <p className="swiped">{t('Encuentra rivales de Magic, Pokémon, One Piece y muchos más juegos cerca de ti.')}<br />{t('Solo para mayores de 18.')}</p>

      <button id="login-google" type="button" className="login-google" disabled={busy} onClick={google}>{GOOGLE_G}{state === 'google' ? t('Abriendo Google…') : t('Continuar con Google')}</button>
      <button id="login-discord" type="button" className="login-google login-discord" disabled={busy} onClick={discord}>{I.chat}{state === 'discord' ? t('Abriendo Discord…') : t('Continuar con Discord')}</button>

      <div className="login-or"><span>{t('o con tu correo')}</span></div>

      {state === 'sent' ? (
        <p className="login-note" role="status">{I.check}<span>{t('Te hemos enviado un enlace a {email}. Ábrelo desde este dispositivo para entrar.', { email: email.trim() })}</span></p>
      ) : (
        <form className="match-reply" onSubmit={sendLink}>
          <input id="login-email" type="email" required autoComplete="email" aria-label={t('Correo electrónico')} placeholder={t('tu@correo.com')} value={email} onChange={(e) => setEmail(e.target.value)} />
          <button id="login-email-send" disabled={busy || !email.trim()}>{state === 'sending' ? t('Enviando…') : t('Enviar enlace')}</button>
        </form>
      )}
      {state === 'error' && <p className="login-note error" role="alert">{I.alert}<span>{t('No se ha podido iniciar sesión. Inténtalo de nuevo en unos minutos.')}</span></p>}

      <p className="login-legal">{I.shield}{t('Nunca publicamos en tu nombre')}</p>
    </div>
  );
}

/* ================= Código de conducta (bienvenida y consulta) ================= */
// Iconos animados del código de conducta: cada uno representa su norma. Se animan al entrar en su pantalla.
function RuleArt({ anim, icon }) {
  if (anim === 'clash') return <div className="art art-clash">{SWORD}{SWORD}</div>;
  if (anim === 'store') return (
    <div className="art art-store">
      {I.store}
      <span className="art-pin">{I.pin}</span>
      <span className="art-ripple" />
    </div>
  );
  if (anim === 'shield') return (
    <div className="art art-shield">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path className="art-shield-body" d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
        <path className="art-check" pathLength="1" d="M8.5 12l2.5 2.5 4.5-5" />
      </svg>
    </div>
  );
  if (anim === 'eye') return (
    <div className="art art-eye">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <g className="art-lid"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle className="art-pupil" cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" /></g>
      </svg>
      <span className="art-lock">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
      </span>
    </div>
  );
  if (anim === 'adult') return <div className="art art-adult">{I.user}<span className="art-stamp">+18</span></div>;
  return <div className="art">{icon}</div>;
}

// Carrusel horizontal con puntos: `slide(i)` marca la pantalla visible para que anime al entrar
function useCarousel(count) {
  const [page, setPage] = useState(0);
  const track = useRef(null);
  const go = (i) => track.current.scrollTo({ left: i * track.current.clientWidth, behavior: 'smooth' });
  const onScroll = (e) => setPage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth));
  const slide = (i) => `rule-slide ${page === i ? 'on' : ''}`;
  const dots = (
    <div className="rules-dots">
      {Array.from({ length: count }, (_, i) => <button key={i} type="button" className={page === i ? 'on' : ''} aria-label={t('Ir a la pantalla {n}', { n: i + 1 })} aria-current={page === i} onClick={() => go(i)} />)}
    </div>
  );
  return { page, last: count - 1, track, go, onScroll, slide, dots };
}

// Carrusel deslizable: portada, una norma por pantalla y, al final, consejos de seguridad (y aceptar, la primera vez)
function RulesScreen({ firstTime, onAccept, onClose }) {
  const [adult, setAdult] = useState(false);
  const [agree, setAgree] = useState(false);
  const { page, last, track, go, onScroll, slide, dots } = useCarousel(RULES.length + 2);
  return (
    <div className="rules" role="dialog" aria-label={t('Código de conducta')}>
      {!firstTime && <button className="icon-btn rules-close" onClick={onClose} aria-label={t('Cerrar')}>{I.close}</button>}
      <div className="rules-slides" ref={track} onScroll={onScroll}>
        <section className={slide(0)}>
          <div className="rule-hero">{I.sword}</div>
          <span className="eyebrow">{firstTime ? t('Bienvenido a ManaMatch') : 'ManaMatch'}</span>
          <h1 className="rules-title">{t('Código de conducta')}</h1>
          <p className="rules-lead">{t('Encuentra rivales de Magic, Pokémon, One Piece y muchos más juegos cerca de ti.')} <b>{t('No es una app de citas:')}</b> {t('aquí se viene a jugar.')}</p>
          <p className="slide-hint">{t('Desliza para ver las {n} normas', { n: RULES.length })}</p>
        </section>
        {RULES.map(([icon, title, text, anim], i) => (
          <section key={title} className={slide(i + 1)} aria-label={t('Norma {n} de {total}', { n: i + 1, total: RULES.length })}>
            <div className="rule-hero"><RuleArt anim={anim} icon={icon} /><span className="rule-num">{i + 1}</span></div>
            <span className="eyebrow">{t('Norma {n} de {total}', { n: i + 1, total: RULES.length })}</span>
            <h2 className="rules-title">{t(title)}</h2>
            <p className="rules-lead">{t(text)}</p>
          </section>
        ))}
        <section className={`${slide(last)} final`}>
          <div className="rule-hero small"><RuleArt anim="shield" /></div>
          <span className="eyebrow">{t('Antes de jugar')}</span>
          <h2 className="rules-title">{t('Consejos de seguridad')}</h2>
          <ul className="tip-list">{SAFETY_TIPS.map((tip) => <li key={tip}>{I.check}<span>{t(tip)}</span></li>)}</ul>
          {firstTime && (
            <div className="rules-checks">
              <button type="button" role="checkbox" aria-checked={adult} className={`check-row ${adult ? 'on' : ''}`} onClick={() => setAdult(!adult)}><span className="box">{adult && I.check}</span>{t('Tengo 18 años o más')}</button>
              <button type="button" role="checkbox" aria-checked={agree} className={`check-row ${agree ? 'on' : ''}`} onClick={() => setAgree(!agree)}><span className="box">{agree && I.check}</span>{t('Acepto el código de conducta')}</button>
            </div>
          )}
        </section>
      </div>
      <div className="rules-cta">
        {dots}
        {page < last
          ? <button id="rules-next" className="primary" onClick={() => go(page + 1)}>{page === 0 ? t('Empezar') : t('Siguiente')}{I.chevron}</button>
          : firstTime
            ? <button id="accept-rules" className="primary" disabled={!adult || !agree} onClick={onAccept}>{I.sword}{t('Entrar a jugar')}</button>
            : <button className="primary" onClick={onClose}>{t('Entendido')}</button>}
      </div>
    </div>
  );
}

/* ================= Normas y sanciones (ver docs/NORMAS.md) ================= */
const NORMS = [
  {
    level: 'Leves', sev: 1, art: 'spam',
    items: ['Spam o mensajes repetidos.', 'Lenguaje grosero puntual, sin ir dirigido a nadie.', 'Nombre, bio o mazos con contenido inapropiado leve.'],
    ladder: ['Advertencia', 'Turno perdido · 3 días', 'Turno perdido · 14 días'],
  },
  {
    level: 'Graves', sev: 2, art: 'heart',
    items: [
      'Insultos, burlas o faltas de respeto a otro jugador.', 'Ligar o hacer insinuaciones.',
      'Pedir teléfono o redes con insistencia, o presionar para quedar fuera de una tienda.', 'Discriminación por cualquier motivo.',
      'Hacerse pasar por otra persona o por una tienda.', 'Fotos de perfil inapropiadas.',
    ],
    ladder: ['Turno perdido · 7 días', 'Turno perdido · 30 días', 'Descalificación'],
  },
  {
    level: 'Muy graves', sev: 3, art: 'alert',
    items: [
      'Contenido sexual de cualquier tipo.', 'Mentir sobre la edad o cualquier contacto de un adulto con un menor.',
      'Amenazas, violencia o acoso, también fuera de la app.', 'Publicar datos personales de otra persona.',
      'Estafas o robos en partidas o intercambios.', 'Crear cuentas nuevas para saltarse una sanción.',
    ],
    ladder: ['Descalificación inmediata'],
  },
];
// Nombres al estilo de los jueces de torneo
const SANCTIONS = [
  ['warn', 'Advertencia', 'Un aviso. Sin más consecuencias.'],
  ['pause', 'Turno perdido', 'Suspensión temporal: no puedes retar, chatear ni aparecer a otros jugadores.'],
  ['dq', 'Descalificación', 'Expulsión definitiva de ManaMatch.'],
];
const NORMS_PROCESS = [
  [I.flag, 'Revisión en 24 h', 'Las denuncias se revisan en un máximo de 24 horas. En casos muy graves, el perfil se oculta mientras tanto.'],
  [I.bell, 'Siempre sabrás por qué', 'Quien recibe una sanción ve qué norma ha incumplido y cuánto dura.'],
  [I.reset, 'Puedes recurrir', 'Tienes 14 días para recurrir y lo revisa una persona distinta.'],
  [I.clock, 'El historial caduca', 'Las infracciones leves se borran a los 6 meses y las graves a los 12.'],
  [I.shield, 'Autoridades', 'Lo que pueda ser delito (amenazas, menores…) se comunica a las autoridades.'],
];
const SANCTION_MARK = { warn: '!', pause: 'II', dq: '✕' };

// Iconos animados de las normas: balanza, mensajes repetidos, corazón tachado, alarma, cartas de sanción y reloj
function NormArt({ art }) {
  const stroke = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (art === 'scale') return (
    <div className="art art-scale">
      <svg {...stroke}>
        <path d="M12 4v16M8 20h8" />
        <g className="art-beam"><path d="M4 7h16" /><path d="M4 7l-2.5 6h5z" /><path d="M20 7l-2.5 6h5z" /></g>
        <circle cx="12" cy="4" r="1.3" fill="currentColor" />
      </svg>
    </div>
  );
  if (art === 'spam') return (
    <div className="art art-spam">
      {[0, 1, 2].map((i) => <span key={i} className="art-bubble" style={{ '--i': i }}><i /><i /><i /></span>)}
    </div>
  );
  if (art === 'heart') return (
    <div className="art art-heart">
      <svg {...stroke}>
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor" fillOpacity="0.2" />
        <path className="art-slash" pathLength="1" d="M4 4l16 16" />
      </svg>
    </div>
  );
  if (art === 'alert') return <div className="art art-alert">{I.alert}<span className="art-pulse" /><span className="art-pulse" /></div>;
  if (art === 'cards') return (
    <div className="art art-cards">{SANCTIONS.map(([id], i) => <span key={id} className={`mini-card s-${id}`} style={{ '--i': i }}>{SANCTION_MARK[id]}</span>)}</div>
  );
  if (art === 'clock') return (
    <div className="art art-clock">
      <svg {...stroke}><circle cx="12" cy="12" r="9" /><path className="art-hand" d="M12 12V6.5" /><path className="art-hand short" d="M12 12h3.5" /></svg>
    </div>
  );
  return null;
}

function NormsScreen({ onClose }) {
  const { page, last, track, go, onScroll, slide, dots } = useCarousel(NORMS.length + 3);
  return (
    <div className="rules norms" role="dialog" aria-label={t('Normas y sanciones')}>
      <button className="icon-btn rules-close" onClick={onClose} aria-label={t('Cerrar')}>{I.close}</button>
      <div className="rules-slides" ref={track} onScroll={onScroll}>
        <section className={slide(0)}>
          <div className="rule-hero"><NormArt art="scale" /></div>
          <span className="eyebrow">{t('Comunidad ManaMatch')}</span>
          <h1 className="rules-title">{t('Normas y sanciones')}</h1>
          <p className="rules-lead">{t('Las infracciones van en tres niveles.')} <b>{t('Cuanto más grave, más dura la sanción')}</b>{t(', y si se repite, sube un escalón.')}</p>
          <p className="slide-hint">{t('Desliza para verlas')}</p>
        </section>
        {NORMS.map(({ level, sev, art, items, ladder }, i) => (
          <section key={level} className={`${slide(i + 1)} dense`} aria-label={t('Infracciones {level}', { level: t(level).toLowerCase() })}>
            <div className={`rule-hero small sev-${sev}`}><NormArt art={art} /></div>
            <span className="eyebrow">{t('Nivel {n} de {total}', { n: i + 1, total: NORMS.length })}</span>
            <h2 className="rules-title">{t(level)}</h2>
            <ul className={`tip-list norm-list sev-${sev}`}>{items.map((it) => <li key={it}><span className="norm-dot" /><span>{t(it)}</span></li>)}</ul>
            <div className={`ladder sev-${sev}`} aria-label={t('Sanción')}>
              {ladder.map((step, n) => (
                <div key={step} className="ladder-step" style={{ '--n': n }}>
                  {ladder.length > 1 && <span>{t('{n}.ª vez', { n: n + 1 })}</span>}
                  <b>{t(step)}</b>
                </div>
              ))}
            </div>
          </section>
        ))}
        <section className={`${slide(NORMS.length + 1)} dense`}>
          <div className="rule-hero small"><NormArt art="cards" /></div>
          <span className="eyebrow">{t('Como en los torneos')}</span>
          <h2 className="rules-title">{t('Sanciones')}</h2>
          <ul className="tip-list sanction-list">
            {SANCTIONS.map(([id, name, text]) => <li key={id}><span className={`mini-card s-${id}`}>{SANCTION_MARK[id]}</span><div><b>{t(name)}</b><p>{t(text)}</p></div></li>)}
          </ul>
        </section>
        <section className={`${slide(last)} dense`}>
          <div className="rule-hero small"><NormArt art="clock" /></div>
          <span className="eyebrow">{t('Justo y transparente')}</span>
          <h2 className="rules-title">{t('Cómo funciona')}</h2>
          <ul className="tip-list sanction-list">
            {NORMS_PROCESS.map(([icon, title, text]) => <li key={title}><span className="process-icon">{icon}</span><div><b>{t(title)}</b><p>{t(text)}</p></div></li>)}
          </ul>
        </section>
      </div>
      <div className="rules-cta">
        {dots}
        {page < last
          ? <button id="norms-next" className="primary" onClick={() => go(page + 1)}>{page === 0 ? t('Empezar') : t('Siguiente')}{I.chevron}</button>
          : <button id="norms-done" className="primary" onClick={onClose}>{t('Entendido')}</button>}
      </div>
    </div>
  );
}

/* ================= Mano de cartas ================= */
/* Las acciones son cartas: se arrastran y se lanzan hacia arriba, contra el jugador.
   Si se sueltan sin lanzarlas vuelven a la mano; con el teclado, Intro o Espacio las lanzan. */
const HAND = [
  { id: 'rewind', label: 'Deshacer', hint: 'recupera al último jugador', icon: I.undo },
  { id: 'nope', label: 'Paso', hint: 'pasar de este jugador', icon: I.x },
  { id: 'like', label: '¡Duelo!', hint: 'retar a una partida', icon: I.check },
  { id: 'super', label: 'Súper duelo', hint: 'reto destacado', icon: I.star },
];
// Minijuego: cartas de la mano que hacen de mando
const STEER = { nope: -1, like: 1 };

function ThrowCard({ card, index, total, disabled, targetRef, onPlay, onTap, count, onHold }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const fan = index - (total - 1) / 2; // posición en el abanico: -1.5 … 1.5
  const rest = { x: 0, y: Math.abs(fan) * 7, r: fan * 8, s: 1 };
  const [pos, setPos] = useState(rest);
  const [phase, setPhase] = useState('idle'); // idle · drag · back · fly · deal

  const throwTo = () => {
    const a = ref.current.getBoundingClientRect();
    const b = targetRef.current.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height * 0.42 - (a.top + a.height / 2);
    haptic(10);
    setPhase('fly');
    setPos((q) => ({ x: q.x + dx, y: q.y + dy, r: q.r + 340, s: 1.6 }));
    setTimeout(() => {
      onPlay(card.id);
      // Robas una carta nueva: aparece desde abajo y vuelve a su sitio en el abanico
      setPhase('deal');
      setPos({ ...rest, y: 170, s: 0.8 });
      requestAnimationFrame(() => requestAnimationFrame(() => { setPhase('idle'); setPos(rest); }));
    }, 380);
  };

  // Modo mando (minijuego): mantener pulsada en lugar de lanzar
  const [held, setHeld] = useState(false);
  const hold = (on) => { setHeld(on); onHold(on); };
  const down = (e) => {
    if (onHold && !disabled) { try { ref.current.setPointerCapture(e.pointerId); } catch { /* sin captura */ } hold(true); return; }
    if (disabled || phase !== 'idle') return;
    try { ref.current.setPointerCapture(e.pointerId); } catch { /* sin captura, el gesto sigue funcionando */ }
    drag.current = { x0: e.clientX, y0: e.clientY, moved: false, samples: [[e.clientY, e.timeStamp]] };
    setPhase('drag');
  };
  const move = (e) => {
    if (onHold) return;
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (Math.hypot(dx, dy) > 6) d.moved = true;
    d.samples = [...d.samples.slice(-4), [e.clientY, e.timeStamp]];
    setPos({ x: dx, y: rest.y + dy, r: rest.r * 0.3 + dx / 14, s: 1.12 });
  };
  const up = () => {
    if (onHold) { if (held) hold(false); return; }
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const [y1, t1] = d.samples[0], [y2, t2] = d.samples[d.samples.length - 1];
    const vy = (y2 - y1) / Math.max(1, t2 - t1); // px/ms; negativo = hacia arriba
    const dy = y2 - d.y0;
    if (d.moved && (dy < -90 || (dy < -25 && vy < -0.5))) { throwTo(); return; }
    // No se ha lanzado: vuelve a la mano (si solo se ha tocado, se asoma para enseñar que hay que lanzarla)
    setPhase('back');
    if (!d.moved) { onTap(); setPos({ ...rest, y: rest.y - 22, s: 1.08 }); setTimeout(() => setPos(rest), 180); }
    else setPos(rest);
    setTimeout(() => setPhase('idle'), 380);
  };

  return (
    <button
      ref={ref} type="button" id={`card-${card.id}`} disabled={disabled}
      className={`hand-card ${card.id} ${phase}${held && onHold ? ' held' : ''}${onHold ? ' steer' : ''}`}
      aria-label={onHold ? t('Mantén pulsada para mover tu carta hacia la {dir}', { dir: STEER[card.id] < 0 ? t('izquierda') : t('derecha') }) : t('Carta {label}: {hint}. Lánzala hacia arriba para jugarla.', { label: t(card.label), hint: t(card.hint) })} title={t(card.label)}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.r}deg) scale(${pos.s})`, zIndex: phase === 'drag' || phase === 'fly' ? 20 : index + 1 }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      // Teclado (detail === 0): Intro o Espacio lanzan la carta directamente
      onClick={(e) => { if (e.detail === 0 && !disabled && !onHold && phase === 'idle') throwTo(); }}
    >
      <span className="hc-frame">
        <span className="hc-gem"><svg className="hc-hex" viewBox="0 0 100 112" aria-hidden="true"><path d={HEX_PHOTO} /></svg>{card.icon}</span>
        <span className="hc-name">{t(card.label)}</span>
        {count !== undefined && <span className={`hc-count${count ? '' : ' zero'}`} aria-label={count ? undefined : t('Conseguir Súper duelos')}>{count || '+'}</span>}
      </span>
    </button>
  );
}

/* ================= Tienda de súper duelos ================= */
// Precios de ejemplo: los reales se configuran en Stripe (ver supabase/functions/create-checkout)
const SUPER_PACKS = [
  { id: 'pack1', credits: 1, price: '0,99 €' },
  { id: 'pack5', credits: 5, price: '3,99 €', tag: 'Más elegido' },
  { id: 'pack15', credits: 15, price: '9,99 €', tag: 'Mejor precio' },
];
function SuperShop({ credits, onBuy, onClose }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  useBack(true, onClose);
  const buy = async (pack) => {
    setBusy(pack.id); setError('');
    try { await onBuy(pack); } catch (err) { setError(err.message || 'No se ha podido iniciar el pago.'); } finally { setBusy(null); }
  };
  return createPortal(
    <>
      <div className="sheet-bg top" onClick={onClose} />
      <section className="sheet edit-sheet top shop-sheet" aria-label={t('Súper duelos')}>
        <header className="sheet-bar">
          <button className="icon-btn" onClick={onClose} aria-label={t('Cerrar')}>{I.close}</button>
          <h2>{t('Súper duelos')}</h2>
          <span style={{ width: 44 }} />
        </header>
        <div className="body">
          <div className="shop-hero">
            <span className="shop-star">{I.star}</span>
            <p><b>{t('Sal el primero en su mazo')}</b>{t('Con un Súper duelo apareces antes que nadie a esa persona, con un aviso de que la has retado. En Mensajes se verá marcado.')}</p>
          </div>
          <p className="shop-balance">{t('Te quedan {n}', { n: credits })}</p>
          <div className="shop-packs">
            {SUPER_PACKS.map((pk) => (
              <button key={pk.id} type="button" className="shop-pack" disabled={!!busy} onClick={() => buy(pk)}>
                {pk.tag && <span className="shop-tag">{t(pk.tag)}</span>}
                <b>{pk.credits}</b><span>{pk.credits === 1 ? t('Súper duelo') : t('Súper duelos')}</span>
                <em>{busy === pk.id ? t('Abriendo pago…') : pk.price}</em>
              </button>
            ))}
          </div>
          {error && <p className="upload-error" role="alert">{t(error)}</p>}
          <p className="field-hint">{I.shield}{t('Pago seguro con Stripe. ManaMatch nunca ve ni guarda los datos de tu tarjeta.')}</p>
        </div>
      </section>
    </>,
    document.querySelector('.phone') ?? document.body,
  );
}

/* ================= Discover ================= */
function Discover({ queue, me, onDecide, onInfo, onRewind, canRewind, credits, onNeedCredits }) {
  // Solo jugadores con algún juego en común contigo, ordenados por compatibilidad
  const [leaving, setLeaving] = useState(null);
  const [impact, setImpact] = useState(null);
  const [tipSeen, setTipSeen] = useStoredState('manamatch-hand-tip', false);
  const [tapHint, setTapHint] = useState(false);
  // Minijuego del estado vacío (se cierra al volver o si aparecen jugadores)
  const [playing, setPlaying] = useState(false);
  // En el minijuego, «Paso» y «¡Duelo!» se mantienen pulsadas para mover la carta (izquierda / derecha)
  const steerRef = useRef(0);
  const closeGame = useCallback(() => { steerRef.current = 0; setPlaying(false); }, []);
  const tableRef = useRef(null);
  const impactKey = useRef(0);
  // Quien te ha retado con un Súper duelo sale siempre el primero (es lo que se paga); después, por compatibilidad
  const list = queue.filter((p) =>
    sharedGames(me, p).length > 0 && p.dist <= me.radius && (!me.onlyVerified || p.verified))
    .sort((a, b) => (b.superLikedYou ? 1 : 0) - (a.superLikedYou ? 1 : 0) || byCompat(me)(a, b));
  const [top, next] = list;
  const gameOn = playing && !top;

  // Jugar una carta: impacto sobre el jugador y, después, su salida de la mesa
  const play = (id) => {
    if (id === 'super' && credits <= 0) { onNeedCredits(); return; }
    setTipSeen(true);
    impactKey.current += 1;
    setImpact({ id, key: impactKey.current });
    if (id === 'rewind') { onRewind(); return; }
    const target = top;
    setLeaving(id);
    setTimeout(() => { setLeaving(null); onDecide(target, id !== 'nope', id === 'super'); }, 430);
  };
  const showTapHint = () => { setTapHint(true); setTimeout(() => setTapHint(false), 2200); };

  return (
    <>
      <div className="deck" ref={tableRef}>
        {!top && (playing
          ? <ManaBreak steer={steerRef} onClose={closeGame} />
          : <Empty icon={I.crystal} title={t('No hay más jugadores')} text={t('Añade más juegos a tu lista, amplía tu radio de búsqueda o vuelve más tarde.')}
              onPlay={() => setPlaying(true)} playHint={t('Toca la pantalla y juega mientras aparecen nuevos jugadores')} />)}
        {next && (
          <article className="swipe-card behind">
            <div className="art-frame"><img className={`hero-art${imgCls(next.favCard.game, next.favCard)}`} src={artOf(next.favCard.game, next.favCard)} alt="" /></div>
          </article>
        )}
        {top && <TableCard key={top.id} p={top} me={me} leaving={leaving} onInfo={() => onInfo(top)} />}
        {impact && (
          <div key={impact.key} className={`impact ${impact.id}`} aria-hidden="true" onAnimationEnd={(e) => { if (e.target === e.currentTarget) setImpact(null); }}>
            <span className="impact-ring" /><span className="impact-icon">{HAND.find((c) => c.id === impact.id).icon}</span>
          </div>
        )}
        <div className="hand" role="group" aria-label={t('Tu mano: lanza una carta hacia arriba para jugarla')}>
          {(top || canRewind) && (!tipSeen || tapHint) && <div className="hand-tip" role="status">{I.sword}{t('Arrastra una carta hacia arriba y lánzala')}</div>}
          {HAND.map((c, i) => (
            <ThrowCard
              key={c.id} card={c} index={i} total={HAND.length} targetRef={tableRef} onPlay={play}
              onTap={c.id === 'super' && credits <= 0 ? onNeedCredits : showTapHint} count={c.id === 'super' ? credits : undefined}
              disabled={gameOn ? !STEER[c.id] : !!leaving || (c.id === 'rewind' ? !canRewind : !top)}
              onHold={gameOn && STEER[c.id] ? (on) => { steerRef.current = on ? STEER[c.id] : 0; } : undefined}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/* ================= Nearby (radar + tiendas) ================= */
/* Los jugadores se colocan en una franja según su rango de distancia y con un ángulo
   que no depende de su posición real: el radar nunca revela dónde está alguien. */
// El radar se escala a tu distancia máxima. La posición sale de un tramo aproximado (1, 2, 5, 10 km…),
// nunca de la distancia exacta, y el ángulo no depende de dónde esté: el radar no revela dónde vive nadie.
const distBucket = (km) => (km < 1 ? 1 : km < 2 ? 2 : km < 5 ? 5 : Math.ceil(km / 5) * 5);
const fuzzyPos = (p, radius) => {
  const band = Math.min(0.9, Math.max(0.24, (distBucket(p.dist) - 0.5) / radius));
  const a = ((p.id * 137 + 40) % 360) * (Math.PI / 180);
  return { left: `${50 + Math.cos(a) * band * 46}%`, top: `${50 + Math.sin(a) * band * 46}%` };
};
const storePos = (km, i, n, radius) => {
  const a = ((i + 0.5) / n) * Math.PI * 2 + 0.6;
  const r = Math.min(km / radius, 0.92) * 50;
  return { left: `${50 + Math.cos(a) * r}%`, top: `${50 + Math.sin(a) * r}%` };
};
const RADIUS_STEPS = [1, 2, 5, 10, 25, 50];

function Nearby({ players, me, onRadius, onToggleStore, onInfo, onStore }) {
  const R = me.radius;
  const stores = STORES.filter((st) => st.dist <= R);
  return (
    <>
      <div className="radius-ctl panel">
        <div className="label-row"><b>{t('Distancia máxima')}</b><span className="radius-val">{R} km</span></div>
        <input id="nearby-radius" type="range" min="1" max="50" value={R} aria-label={t('Distancia máxima')}
          onChange={(e) => onRadius(+e.target.value)} style={{ '--p': `${((R - 1) / 49) * 100}%` }} />
        <div className="radius-steps">
          {RADIUS_STEPS.map((km) => <button key={km} type="button" className={R === km ? 'on' : ''} onClick={() => onRadius(km)}>{km} km</button>)}
        </div>
        <p className="radius-count">
          {players.length === 1 ? t('1 jugador con tus juegos') : t('{n} jugadores con tus juegos', { n: players.length })}
          {' · '}
          {stores.length === 1 ? t('1 tienda') : t('{n} tiendas', { n: stores.length })}
        </p>
      </div>

      <div className="radar" role="img" aria-label={t('Radar de jugadores cercanos')}>
        <span className="ring-label half">{Math.round(R / 2 * 10) / 10} km</span>
        <span className="ring-label full">{R} km</span>
        <div className="me" />
        {players.map((p) => (
          <button key={p.id} className="dot" style={{ ...fuzzyPos(p, R), '--c': FRAME.glow }} onClick={() => onInfo(p)} title={`${p.name} · ${GAMES[p.favCard.game].name} · ${fuzzyDist(p.dist)}`}>
            <img src={avatarOf(p)} alt={p.name} />
            <span className={`dot-game g-${p.favCard.game}`}>{gameIcon(p.favCard.game)}</span>
          </button>
        ))}
        {stores.map((st, i) => <button type="button" key={st.id} className="shop" title={st.name} aria-label={st.name} style={storePos(st.dist, i, stores.length, R)} onClick={() => onStore(st.id)}>{I.store}</button>)}
      </div>
      <div className="legend"><span><i className="lg-player" />{t('Jugadores (zona aproximada)')}</span><span><i className="lg-store" />{t('Tiendas')}</span></div>
      <p className="privacy-note">{I.shield}{t('Por tu seguridad, nunca mostramos dónde está un jugador: solo su rango de distancia.')}</p>

      <h3 className="section-title">{t('Tiendas cercanas')}</h3>
      {!stores.length && <p className="section-hint">{t('No hay tiendas en esa distancia. Amplíala para ver más.')}</p>}
      <div className="list">
        {stores.map((st) => {
          const regulars = players.filter((p) => p.stores.includes(st.id));
          return (
            <div key={st.id} className="row store-row" role="button" tabIndex={0} onClick={() => onStore(st.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') onStore(st.id); }}>
              <span className="row-icon">{I.store}</span>
              <div className="grow">
                <div className="title">{st.name}</div>
                <div className="sub">{t(st.events)}</div>
                <div className="regulars">
                  <div className="stack">{regulars.slice(0, 3).map((p) => <img loading="lazy" decoding="async" key={p.id} src={avatarOf(p)} alt={p.name} />)}</div>
                  <span>{regulars.length === 1 ? t('1 habitual') : t('{n} habituales', { n: regulars.length })}</span>
                </div>
              </div>
              <div className="store-side">
                <span className="dist">{st.dist} km</span>
                <button type="button" className={`save-store${me.stores.includes(st.id) ? ' on' : ''}`} aria-pressed={me.stores.includes(st.id)}
                  onClick={(e) => { e.stopPropagation(); onToggleStore(st.id); }}>{me.stores.includes(st.id) ? <>{I.check}{t('Guardada')}</> : <>{I.bookmark}{t('Guardar')}</>}</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ================= Ficha de una tienda ================= */
function StoreSheet({ store: st, me, players, saved, onToggle, onInfo, onClose }) {
  const dayName = (k) => t(DAYS.find(([d]) => d === k)?.[1] ?? k);
  const regulars = players.filter((p) => p.stores.includes(st.id));
  const order = DAYS.map(([d]) => d);
  const schedule = [...(st.schedule ?? [])].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  const myGames = (st.games ?? []).filter((g) => me.interests.includes(g));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${st.name} ${st.address ?? ''}`)}`;
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <section className="sheet store-sheet" aria-label={st.name}>
        <button className="icon-btn glass close" onClick={onClose} aria-label={t('Cerrar')}>{I.close}</button>
        <div className="sheet-scroll">
          <div className="store-hero">
            <span className="store-hero-ico">{I.store}</span>
            <span className="sheet-handle" />
          </div>
          <div className="body">
            <h2 className="sheet-name">{st.name}</h2>
            <div className="info-pills">
              <span className="info-pill">{I.pin}{st.dist} km</span>
              {st.hours && <span className="info-pill">{I.clock}{st.hours}</span>}
            </div>
            {st.address && <p className="store-address">{I.map}{st.address}</p>}
            <div className="btn-row store-actions">
              <button type="button" className={`ghost small save-store${saved ? ' on' : ''}`} aria-pressed={saved} onClick={onToggle}>
                {saved ? <>{I.check}{t('Guardada')}</> : <>{I.bookmark}{t('Guardar')}</>}
              </button>
              <a className="ghost small" href={mapsUrl} target="_blank" rel="noopener noreferrer">{I.map}{t('Cómo llegar')}</a>
            </div>

            {schedule.length > 0 && <>
              <h3 className="section-title">{t('Eventos de la semana')}</h3>
              <div className="list">
                {schedule.map(([day, hour, name, game]) => (
                  <div key={day + hour + name} className={`row event-row${me.interests.includes(game) ? ' mine' : ''}`}>
                    <span className="event-day"><b>{dayName(day).slice(0, 3)}</b><small>{hour}</small></span>
                    <div className="grow"><div className="title">{t(name)}</div><div className="sub">{gameIcon(game)}{GAMES[game]?.name ?? gameName(game)}</div></div>
                    {me.interests.includes(game) && <span className="event-mine">{t('Tu juego')}</span>}
                  </div>
                ))}
              </div>
            </>}

            {st.games?.length > 0 && <>
              <h3 className="section-title">{t('Se juega a')}{myGames.length > 0 && <small className="title-note">{t('{n} de tus juegos', { n: myGames.length })}</small>}</h3>
              <div className="tags">
                {st.games.map((g) => <span key={g} className={`tag interest${me.interests.includes(g) ? ' on' : ''}`}>{me.interests.includes(g) && I.check}{gameName(g)}</span>)}
              </div>
            </>}

            <h3 className="section-title">{t('Jugadores habituales')}</h3>
            {regulars.length ? (
              <div className="new-matches">
                {regulars.map((p) => (
                  <button key={p.id} className="nm" onClick={() => onInfo(p)}>
                    <Hex src={avatarOf(p)} alt={p.name} size={60} colors={FRAME.list} ring={false} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            ) : <p className="section-hint">{t('Aún no hay jugadores con tus juegos que la tengan como habitual.')}</p>}
            <p className="field-hint">{I.shield}{t('Las partidas se proponen solo en tiendas: siempre en un sitio público.')}</p>
          </div>
        </div>
      </section>
    </>
  );
}

/* ================= Matches + Chat ================= */
function Matches({ matches, chats, openChat }) {
  if (!matches.length) return <Empty icon={I.chat} title={t('Aún no tienes rivales')} text={t('Lanza la carta ¡Duelo! para retar a alguien y proponer una partida.')} />;
  return (
    <>
      <h3 className="section-title">{t('Nuevos rivales')}</h3>
      <div className="new-matches">
        {matches.map((p) => (
          <button key={p.id} className={`nm${p.superDuel ? ' super-ring' : ''}`} onClick={() => openChat(p)} title={p.superDuel ? t('Súper duelo') : undefined}>
            <Hex src={avatarOf(p)} alt={p.name} size={68} colors={p.superDuel ? SUPER_FRAME : FRAME.list} ring={false} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
      <h3 className="section-title">{t('Conversaciones')}</h3>
      <div className="list">
        {matches.map((p) => {
          const last = chats[p.id]?.at(-1);
          return (
            <button key={p.id} id={`match-${p.id}`} className="row" onClick={() => openChat(p)}>
              <img loading="lazy" decoding="async" className={`avatar${p.superDuel ? ' super' : ''}`} src={avatarOf(p)} alt={p.superDuel ? t('Súper duelo') : ''} />
              <div className="grow">
                <div className="title">{p.name} <span className={`mini-game g-${p.favCard.game}`}>{gameIcon(p.favCard.game)}</span>
</div>
                <div className={`sub ${last ? '' : 'new'}`}>{last ? (last.type === 'meetup' ? `📅 ${t('Partida propuesta')}` : last.text) : p.superDuel ? t('¡Súper duelo aceptado! Propón una partida') : t('¡Duelo aceptado! Propón una partida')}</div>
              </div>
              <span className="chev">{I.chevron}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* Respuestas rápidas centradas en el juego */
const quickReplies = (p, me) => {
  const mine = me.formats;
  const format = p.formats.find((f) => mine.includes(f)) || p.formats[0];
  const store = storeName(p.stores.find((s) => me.stores.includes(s)) ?? p.stores[0]);
  return [
    format ? t('¿Una partida de {format} esta semana?', { format: t(format) }) : t('¿Una partida de {game} esta semana?', { game: GAMES[duelGame(me, p)].name }),
    store && t('¿Jugamos en {store}?', { store }),
    t('¿Qué mazo vas a traer?'),
  ].filter(Boolean);
};

/* Hook de envío con moderación: bloquea lo inapropiado y avisa (una vez) si se comparten contactos */
function useModeratedSend(onSend) {
  const [warn, setWarn] = useState(null);
  const sent = useRef([]);
  const send = (text) => {
    const t = text.trim();
    if (!t) return false;
    const now = Date.now();
    sent.current = sent.current.filter((ts) => now - ts < RATE.windowMs);
    if (sent.current.length >= RATE.max) { setWarn('rate'); return false; }
    const kind = checkMessage(t);
    if (kind === 'conduct') { setWarn('conduct'); return false; }
    if (kind === 'contact' && warn !== 'contact') { setWarn('contact'); return false; }
    setWarn(null);
    sent.current.push(now);
    onSend(t);
    return true;
  };
  return [send, warn, () => setWarn(null)];
}

function Chat({ p, me, msgs, onSend, onBack, onInfo, onReport, attended, onAttend }) {
  const [text, setText] = useState('');
  const [planning, setPlanning] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(true);
  const [plan, setPlan] = useState({ store: p.stores[0] ?? STORES[0].id, date: '', format: p.formats.find((f) => me.formats.includes(f)) ?? p.formats[0] ?? me.formats[0] ?? '' });
  const game = GAMES[duelGame(me, p)];
  const [sendText, warn, clearWarn] = useModeratedSend((t) => onSend({ type: 'text', from: 'me', text: t }));

  const send = (e) => { e.preventDefault(); if (sendText(text)) setText(''); };
  const propose = () => { onSend({ type: 'meetup', from: 'me', ...plan }); setPlanning(false); };

  const theirs = FRAME;
  const formats = [...new Set([...p.formats, ...me.formats])];
  const lastMeetup = msgs.findLast((m) => m.type === 'meetup');
  return (
    <div className={`chat g-${p.favCard.game}`} style={{ '--them': theirs.glow, '--them-grad': theirs.grad }}>
      <div className="chat-head">
        <button id="chat-back" className="icon-btn" onClick={onBack} aria-label={t('Volver')}>{I.back}</button>
        <button className={`chat-who${p.superDuel ? ' super-ring' : ''}`} onClick={() => onInfo(p)} title={p.superDuel ? t('Súper duelo') : undefined}>
          <Hex src={avatarOf(p)} alt="" size={46} colors={p.superDuel ? SUPER_FRAME : theirs.list} ring={false} />
          <div><b>{p.name}</b><span>{gameIcon(game.id)}{p.decks[0]?.name ?? game.name}</span></div>
        </button>
        <button id="chat-report" className="icon-btn" onClick={onReport} aria-label={t('Denunciar o bloquear a {name}', { name: p.name })} title={t('Denunciar o bloquear')}>{I.flag}</button>
      </div>
      {safetyOpen && (
        <div className="safety-banner">
          {I.shield}
          <span>{t('Quedad siempre en una tienda y no compartas tu dirección. Si algo no va bien, denúncialo con la bandera.')}</span>
          <button onClick={() => setSafetyOpen(false)} aria-label={t('Ocultar aviso')}>{I.close}</button>
        </div>
      )}
      <div className="msgs">
        <div className="turn-divider"><span>{gameIcon(game.id)}{t('Duelo de {game}', { game: game.name })}{plan.format && ` · ${t(plan.format)}`}</span></div>
        {!msgs.length && <div className="chat-start">{t('Propón formato, tienda y día para vuestra partida.')}</div>}
        {msgs.map((m, i) => m.type === 'meetup' ? (
          <div key={i} className={`msg meetup ${m.from}`}>
            <div className="ticket-head">{I.cal}<b>{t('Partida propuesta')}</b></div>
            <div className="ticket-body">
              <div><small>{t('Formato')}</small>{t(m.format)}</div>
              <div><small>{t('Tienda')}</small>{storeName(m.store)}</div>
              <div><small>{t('Cuándo')}</small>{m.date ? new Date(m.date).toLocaleString(locale(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : t('Por concretar')}</div>
            </div>
            {m.from === 'them' && <div className="ticket-ok">{I.check}{t('{name} ha aceptado', { name: p.name })}</div>}
          </div>
        ) : <div key={i} className={`msg ${m.from}`}>{m.text}</div>)}
        {lastMeetup && <Attendance p={p} meetup={lastMeetup} value={attended} onChange={onAttend} onReport={onReport} />}
      </div>
      {planning && (
        <div className="panel form plan">
          <label>{t('Tienda')}<select id="plan-store" value={plan.store} onChange={(e) => setPlan({ ...plan, store: e.target.value })}>{STORES.map((s) => <option key={s.id} value={s.id}>{s.name}{p.stores.includes(s.id) ? ' ★' : ''}</option>)}</select></label>
          <label>{t('Formato')}<select id="plan-format" value={plan.format} onChange={(e) => setPlan({ ...plan, format: e.target.value })}>{formats.map((f) => <option key={f} value={f}>{t(f)}</option>)}</select></label>
          <label>{t('Fecha y hora')}<input id="plan-date" type="datetime-local" value={plan.date} onChange={(e) => setPlan({ ...plan, date: e.target.value })} /></label>
          <p className="field-hint">{I.store}{t('Las partidas se proponen solo en tiendas: siempre en un sitio público.')}</p>
          <div className="btn-row"><button className="ghost" onClick={() => setPlanning(false)}>{t('Cancelar')}</button><button id="plan-send" className="primary" onClick={propose}>{t('Proponer partida')}</button></div>
        </div>
      )}
      {msgs.length < 3 && !planning && (
        <div className="quick">{quickReplies(p, me).filter((q) => !msgs.some((m) => m.text === q)).map((q) => <button key={q} type="button" onClick={() => { setText(q); clearWarn(); }}>{q}</button>)}</div>
      )}
      <ModNote kind={warn} />
      <form className="composer" onSubmit={send}>
        <button type="button" id="btn-plan" className={`icon-btn plan-btn ${planning ? 'on' : ''}`} aria-label={t('Proponer partida')} onClick={() => setPlanning((v) => !v)}>{I.cal}</button>
        <input id="chat-input" placeholder={t('Escribe un mensaje…')} value={text} onChange={(e) => { setText(e.target.value); if (warn === 'conduct') clearWarn(); }} />
        <button id="chat-send" className="icon-btn send" aria-label={warn === 'contact' ? t('Enviar igualmente') : t('Enviar')} disabled={!text.trim()}>{I.send}</button>
      </form>
    </div>
  );
}

/* ================= Buscador de cartas del juego ================= */
/* Carta: buscador (si el juego lo tiene) o nombre libre, más la opción de subir tu propia imagen */
function CardField({ id, game, value, onChange }) {
  const g = GAMES[game];
  const fileRef = useRef(null);
  const [crop, setCrop] = useState(null); // URL local de la imagen que se está encuadrando
  const [err, setErr] = useState('');
  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) { setErr('Ese archivo no es una imagen.'); return; }
    if (file.size > 10 * 1024 * 1024) { setErr('La imagen pesa demasiado (máximo 10 MB).'); return; }
    setErr('');
    setCrop(URL.createObjectURL(file));
  };
  const closeCrop = () => { URL.revokeObjectURL(crop); setCrop(null); };
  return (
    <div className="card-field">
      {g.search
        ? <CardInput id={id} game={game} value={value} onChange={onChange} placeholder={t('Busca una carta…')} />
        : <input id={id} value={value?.name ?? ''} maxLength={80} placeholder={t('Nombre (opcional)')} onChange={(e) => onChange({ ...value, name: e.target.value })} />}
      <div className="upload-row">
        <button type="button" className="ghost small" onClick={() => fileRef.current.click()}>{I.camera}{value?.upload ? t('Cambiar imagen') : t('Subir imagen')}</button>
        {value?.upload && <button type="button" className="link-btn" onClick={() => { const { upload: _u, ...rest } = value; onChange(rest); }}>{t('Quitar imagen')}</button>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
      </div>
      {err && <p className="upload-error" role="alert">{t(err)}</p>}
      <p className="field-hint">{I.shield}{t('Sube solo imágenes del juego (una carta, tu ejército, tu mesa…). Las imágenes denunciadas se ocultan.')}</p>
      {/* Fuera de la hoja de edición (en .phone): así queda por encima de todo y no se recorta */}
      {crop && createPortal(
        <CropSheet src={crop} onClose={closeCrop} onError={() => { closeCrop(); setErr('No se ha podido abrir esa imagen. Prueba con una JPG o PNG.'); }}
          onDone={(dataUrl) => { onChange({ ...value, name: value?.name ?? '', upload: dataUrl }); closeCrop(); }} />,
        document.querySelector('.phone') ?? document.body,
      )}
    </div>
  );
}

/* Imagen de banner: solo se sube una imagen (se encuadra antes de guardarla). Sin imagen se usa la de por defecto. */
function BannerField({ value, game, onChange }) {
  const fileRef = useRef(null);
  const [crop, setCrop] = useState(null);
  const [err, setErr] = useState('');
  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) { setErr('Ese archivo no es una imagen.'); return; }
    if (file.size > 10 * 1024 * 1024) { setErr('La imagen pesa demasiado (máximo 10 MB).'); return; }
    setErr('');
    setCrop(URL.createObjectURL(file));
  };
  const closeCrop = () => { URL.revokeObjectURL(crop); setCrop(null); };
  return (
    <div className="banner-field">
      <div className="banner-preview"><img src={artOf(game, value)} alt="" /></div>
      <div className="upload-row">
        <button type="button" id="banner-upload" className="ghost small" onClick={() => fileRef.current.click()}>{I.camera}{value?.upload ? t('Cambiar imagen') : t('Subir imagen')}</button>
        {value?.upload && <button type="button" className="link-btn" onClick={() => onChange({ game, name: '' })}>{t('Quitar imagen')}</button>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
      </div>
      {err && <p className="upload-error" role="alert">{t(err)}</p>}
      <p className="field-hint">{I.shield}{t('Te recomendamos una carta de alguno de tus juegos, tu ejército, tu mesa… Las imágenes denunciadas se ocultan.')}</p>
      {crop && createPortal(
        <CropSheet src={crop} onClose={closeCrop} onError={() => { closeCrop(); setErr('No se ha podido abrir esa imagen. Prueba con una JPG o PNG.'); }}
          onDone={(dataUrl) => { onChange({ game, name: '', upload: dataUrl }); closeCrop(); }} />,
        document.querySelector('.phone') ?? document.body,
      )}
    </div>
  );
}

/* Encuadre: arrastra para mover y usa el zoom; se guarda un JPEG de 640×800 sin metadatos */
const CROP_W = 260, CROP_H = 325, OUT_W = 640, OUT_H = 800;
function CropSheet({ src, onDone, onClose, onError }) {
  const [nat, setNat] = useState(null); // tamaño original
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  const imgRef = useRef(null);
  const base = nat ? Math.max(CROP_W / nat.w, CROP_H / nat.h) : 1;
  const w = nat ? nat.w * base * zoom : 0, h = nat ? nat.h * base * zoom : 0;
  // La imagen siempre cubre todo el marco
  const clamp = (o, z = zoom) => {
    const ww = nat.w * base * z, hh = nat.h * base * z;
    const mx = (ww - CROP_W) / 2, my = (hh - CROP_H) / 2;
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
  };
  const down = (e) => { drag.current = { x: e.clientX, y: e.clientY, o: off }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura */ } };
  const move = (e) => { const d = drag.current; if (d && nat) setOff(clamp({ x: d.o.x + e.clientX - d.x, y: d.o.y + e.clientY - d.y })); };
  const up = () => { drag.current = null; };
  const setZ = (z) => { setZoom(z); setOff((o) => clamp(o, z)); };
  const done = () => {
    const c = document.createElement('canvas');
    c.width = OUT_W; c.height = OUT_H;
    const k = OUT_W / CROP_W;
    const x = (CROP_W / 2 + off.x - w / 2) * k, y = (CROP_H / 2 + off.y - h / 2) * k;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#171522'; ctx.fillRect(0, 0, OUT_W, OUT_H);
    ctx.drawImage(imgRef.current, x, y, w * k, h * k);
    // Al redibujar en un canvas se pierden los metadatos (EXIF), incluida la ubicación GPS
    onDone(c.toDataURL('image/jpeg', 0.82));
  };
  return (
    <>
      <div className="sheet-bg top" onClick={onClose} />
      <section className="sheet edit-sheet top crop-sheet" aria-label={t('Encuadrar imagen')}>
        <header className="sheet-bar">
          <button className="icon-btn" onClick={onClose} aria-label={t('Cancelar')}>{I.close}</button>
          <h2>{t('Encuadra la imagen')}</h2>
          <span style={{ width: 44 }} />
        </header>
        <div className="body">
          <p className="sheet-intro">{t('Arrastra para colocarla y usa el zoom. Así se verá en tu tarjeta.')}</p>
          <div className="crop-frame" style={{ width: CROP_W, height: CROP_H }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            <img ref={imgRef} src={src} alt="" draggable="false"
              onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} onError={onError}
              style={{ width: w || undefined, height: h || undefined, transform: `translate(calc(-50% + ${off.x}px), calc(-50% + ${off.y}px))`, opacity: nat ? 1 : 0 }} />
            <span className="crop-grid" aria-hidden="true" />
          </div>
          <label className="crop-zoom">{I.search}
            <input type="range" min="1" max="3" step="0.01" value={zoom} aria-label={t('Zoom')} onChange={(e) => setZ(Number(e.target.value))} />
          </label>
        </div>
        <div className="sheet-cta">
          <button className="primary" disabled={!nat} onClick={done}>{I.check}{t('Usar imagen')}</button>
        </div>
      </section>
    </>
  );
}

function CardInput({ id, game, value, onChange, placeholder }) {
  const [q, setQ] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const { list: suggestions, loading, failed, done } = useCardSuggest(game, open ? q : '');
  const pick = (card) => { setQ(card.name); onChange({ name: card.name, ...(card.img && { img: card.img }) }); setOpen(false); };
  const blur = () => setTimeout(() => {
    setOpen(false);
    // En Magic basta el nombre (Scryfall resuelve la imagen); en el resto hay que elegir una sugerencia
    if (game === 'magic' && q.trim() && q.trim() !== value?.name) onChange({ name: q.trim() });
    else if (game !== 'magic') setQ(value?.name ?? '');
  }, 150);
  return (
    <div className="card-input">
      <div className="input-icon">
        {I.search}
        <input id={id} value={q} placeholder={placeholder} autoComplete="off" onChange={(e) => { setQ(e.target.value); setOpen(true); }} onBlur={blur}
          onFocus={(e) => e.target.scrollIntoView({ block: 'start', behavior: 'smooth' })} />
      </div>
      {open && (loading || failed || (done && !suggestions.length)) && (
        <p className="suggest suggest-state" role="status">
          {loading ? <><span className="spinner" />{t('Buscando cartas…')}</> : failed ? t('No se ha podido buscar. Revisa la conexión e inténtalo de nuevo.') : t('Sin resultados con ese nombre.')}
        </p>
      )}
      {open && suggestions.length > 0 && (
        <ul className="suggest" role="listbox">
          {suggestions.map((s) => (
            <li key={s.name + (s.img ?? '')}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}>
                {s.img && <img src={s.img} alt="" loading="lazy" />}
                <span><b>{s.name}</b>{s.sub && <small>{t(s.sub)}</small>}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {game === 'onepiece' && <p className="field-hint">{t('Busca por nombre de líder o escribe el código de la carta (p. ej. OP05-060).')}</p>}
    </div>
  );
}

/* ================= Crear perfil (la primera vez que entra una cuenta nueva) ================= */
// Aviso junto a la fecha de nacimiento: para qué se pide y que nadie más la ve
const AgeNotice = () => (
  <div className="age-notice">
    <p>{I.user}<span><b>{t('Solo para mayores de 18 años.')}</b> {t('La pedimos para comprobarlo.')}</span></p>
    <p>{I.eye}<span><b>{t('Tu edad no se muestra nunca.')}</b> {t('Ni tu fecha de nacimiento ni tu edad aparecen en tu perfil.')}</span></p>
  </div>
);
const maxBirthDate = () => { const t = new Date(); t.setFullYear(t.getFullYear() - 18); return t.toISOString().slice(0, 10); };
const NEW_ME = { ...DEFAULT_ME, name: '', birthDate: '', bio: '', stores: [], days: [], slots: [], interests: [], level: 'Casual', formats: [], favCard: { game: 'magic', name: '' }, decks: [] };

function CreateProfileScreen({ onCreate }) {
  const [d, setD] = useState(NEW_ME);
  const [state, setState] = useState(null); // null | 'saving' | 'error'
  // Aquí no hay carrusel desplazable: los pasos solo cambian con Siguiente y Atrás, así ni el teclado,
  // ni el ratón, ni el foco pueden saltarse un paso sin completar
  const [page, setPage] = useState(0);
  const last = 3;
  const set = (patch) => setD((x) => normalizeMe({ ...x, ...patch }));
  const age = ageFrom(d.birthDate);
  const ageOk = age !== null && age >= 18 && age <= 99;
  // Cada paso se completa antes de pasar al siguiente (la carta favorita es opcional)
  const done = [!!(d.name.trim() && ageOk), d.interests.length > 0, true, true];
  const stepOk = done[page];
  const reachable = done.indexOf(false) === -1 ? last : done.indexOf(false);
  const go = (i) => setPage(Math.max(0, Math.min(i, reachable)));
  // Las pantallas que no se ven no aceptan foco ni pulsaciones
  const step = (i) => ({ className: `rule-slide${page === i ? ' on' : ''}${i < last ? ' dense' : ''}`, inert: page !== i });
  const create = async () => {
    setState('saving');
    try { await onCreate({ ...d, name: d.name.trim() }); } catch { setState('error'); }
  };
  const fav = d.favCard;
  return (
    <div className="rules onboarding" role="dialog" aria-label={t('Crear tu perfil')}>
      {page > 0 && <button className="icon-btn rules-close back" onClick={() => go(page - 1)} aria-label={t('Paso anterior')}>{I.back}</button>}
      <div className="steps-viewport">
       <div className="steps-track" style={{ transform: `translateX(${-page * 100}%)` }}>
        <section {...step(0)}>
          <div className="rule-hero small"><RuleArt anim="adult" /></div>
          <span className="eyebrow">{t('Paso {n} de {total}', { n: 1, total: 3 })}</span>
          <h1 className="rules-title">{t('Crea tu perfil')}</h1>
          <div className="form onboard-form">
            <label>{t('Nombre de jugador')}<input id="new-name" value={d.name} maxLength={24} autoComplete="nickname" placeholder={t('Cómo te verán los demás')} onChange={(e) => set({ name: e.target.value })} /></label>
            <label>{t('Fecha de nacimiento')}<input id="new-birth" type="date" max={maxBirthDate()} value={d.birthDate} onChange={(e) => set({ birthDate: e.target.value })} /></label>
            {d.birthDate && !ageOk && <p className="upload-error" role="alert">{age < 18 ? t('ManaMatch es solo para mayores de 18.') : t('Revisa la fecha de nacimiento.')}</p>}
            <AgeNotice />
          </div>
        </section>
        <section {...step(1)}>
          <div className="rule-hero small"><RuleArt anim="clash" /></div>
          <span className="eyebrow">{t('Paso {n} de {total}', { n: 2, total: 3 })}</span>
          <h2 className="rules-title">{t('¿A qué juegas?')}</h2>
          <GamePicker value={d.interests} onChange={(v) => set({ interests: v })} />
        </section>
        <section {...step(2)}>
          <div className="rule-hero small"><RuleArt anim="clash" /></div>
          <span className="eyebrow">{t('Paso {n} de {total}', { n: 3, total: 3 })}</span>
          <h2 className="rules-title">{t('Tu estilo de juego')}</h2>
          <div className="form onboard-form">
            <fieldset><legend>{t('Nivel')}</legend>
              <Segmented name={t('Nivel')} value={d.level} onChange={(v) => set({ level: v })} options={LEVELS.map((l) => [l, t(l)])} />
            </fieldset>
            <fieldset><legend>{t('Imagen de banner (opcional)')}</legend>
              <BannerField value={fav} game={fav.game} onChange={(c) => set({ favCard: c })} />
            </fieldset>
          </div>
        </section>
        <section {...step(3)}>
          <Hex src={artOf(fav.game, fav)} alt="" size={130} colors={['#8B5CF6']} fullCard={isFullCard(fav.game, fav) ? fav.game : false} />
          <span className="eyebrow onboard-ready">{t('Todo listo')}</span>
          <h2 className="rules-title">{d.name.trim() || t('Jugador')}</h2>
          <p className="rules-lead">{d.interests.map(gameName).join(' · ')}<br />{t(d.level)}. {t('Tu foto, mazos, disponibilidad y tiendas los añades después desde tu perfil.')}</p>
          {state === 'error' && <p className="upload-error" role="alert">{t('No se ha podido crear el perfil. Revisa la conexión e inténtalo de nuevo.')}</p>}
        </section>
       </div>
      </div>
      <div className="rules-cta">
        <div className="rules-dots" aria-label={t('Paso {n} de {total}', { n: Math.min(page + 1, 3), total: 3 })}>{[0, 1, 2, 3].map((i) => <span key={i} className={page === i ? 'on' : ''} />)}</div>
        {page < last
          ? <button id="onboard-next" className="primary" disabled={!stepOk} onClick={() => go(page + 1)}>{t('Siguiente')}{I.chevron}</button>
          : <button id="onboard-create" className="primary" disabled={state === 'saving'} onClick={create}>{I.sword}{state === 'saving' ? t('Creando…') : t('Crear perfil')}</button>}
      </div>
    </div>
  );
}

/* Pantallas de espera y de error mientras se carga el perfil de la cuenta */
function BootScreen({ error, onRetry }) {
  return (
    <div className="boot" role="status">
      {error ? (
        <>
          <div className="dialog-icon">{I.wifiOff}</div>
          <p>{t('No hemos podido cargar tu perfil.')}</p>
          <button className="primary" onClick={onRetry}>{t('Reintentar')}</button>
        </>
      ) : <><span className="spinner big" /><p>{t('Cargando tu perfil…')}</p></>}
    </div>
  );
}

/* ================= Utilidades del perfil ================= */
/* Foto de perfil: se reduce a 320 px y, al redibujarla en un canvas, se eliminan los metadatos (EXIF, incluida la ubicación GPS) */
function readPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Ese archivo no es una imagen.')); return; }
    if (file.size > 10 * 1024 * 1024) { reject(new Error('La foto pesa demasiado (máximo 10 MB).')); return; }
    const img = new Image();
    img.onload = () => {
      const size = 320, c = document.createElement('canvas');
      const k = Math.max(size / img.width, size / img.height);
      c.width = size; c.height = size;
      c.getContext('2d').drawImage(img, (size - img.width * k) / 2, (size - img.height * k) / 2, img.width * k, img.height * k);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('No se ha podido leer la imagen.')); };
    img.src = URL.createObjectURL(file);
  });
}

/* Campo de texto que se guarda al salir de él (o con Intro). `check` devuelve un error para no guardar. */
function InlineField({ id, value, onCommit, check, multiline, ...rest }) {
  const [draft, setDraft] = useState(value);
  const [err, setErr] = useState(null);
  const [prev, setPrev] = useState(value);
  if (prev !== value) { setPrev(value); setDraft(value); }
  const commit = () => {
    const e = check?.(draft) ?? null;
    setErr(e);
    if (!e && draft !== value) onCommit(draft);
  };
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <>
      <Tag id={id} value={draft} {...rest} onChange={(e) => { setDraft(e.target.value); if (err) setErr(null); }} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter' && !multiline) e.currentTarget.blur(); }} />
      {err && (err === 'conduct' ? <ModNote kind="conduct" /> : <p className="upload-error" role="alert">{t(err)}</p>)}
    </>
  );
}

/* ================= Añadir mazo ================= */
function DeckSheet({ games, onSave, onClose }) {
  const [game, setGame] = useState(games[0]);
  const g = GAMES[game];
  const [deck, setDeck] = useState({ name: '', format: g.formats[0], card: null });
  const pickGame = (v) => { setGame(v); setDeck((x) => ({ ...x, format: GAMES[v].formats[0], card: null })); };
  const valid = deck.name.trim() && cardOk(game, deck.card);
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <section className="sheet edit-sheet" aria-label={t('Añadir mazo')}>
        <header className="sheet-bar">
          <button className="icon-btn" onClick={onClose} aria-label={t('Cerrar')}>{I.close}</button>
          <h2>{t('Nuevo mazo de {game}', { game: g.name })}</h2>
          <span style={{ width: 44 }} />
        </header>
        <div className="body form">
          <div className="deck-preview">
            {deck.card ? <img className={imgCls(game, deck.card).trim()} src={artOf(game, deck.card)} alt="" /> : <div className="deck-ph">{gameIcon(game)}</div>}
            <span className="deck-format">{t(deck.format)}</span>
            <b>{deck.name || t('Nombre del mazo')}</b>
          </div>
          {games.length > 1 && <label>{t('Juego')}<GameSelect id="deck-game" games={games} value={game} onChange={pickGame} /></label>}
          <label>{t('Nombre')}<input id="deck-name" value={deck.name} maxLength={32} placeholder={t('Ej. Luffy Morado')} onChange={(e) => setDeck({ ...deck, name: e.target.value })} /></label>
          <label>{t('Formato')}<select id="deck-format" value={deck.format} onChange={(e) => setDeck({ ...deck, format: e.target.value })}>{g.formats.map((f) => <option key={f} value={f}>{t(f)}</option>)}</select></label>
          <div className="field">{t(g.keyCard(deck.format))}
            <CardField key={game} id="deck-card" game={game} value={deck.card} onChange={(c) => setDeck((x) => ({ ...x, card: c }))} />
          </div>
        </div>
        <div className="sheet-cta">
          <button id="save-deck" className="primary" disabled={!valid} onClick={() => onSave({ ...deck, game, id: crypto.randomUUID(), name: deck.name.trim(), card: deck.card ?? { name: '' } })}>{I.plus}{t('Añadir mazo')}</button>
        </div>
      </section>
    </>
  );
}

/* ================= My profile ================= */
const THEMES = [['light', 'Día', I.sun], ['dark', 'Noche', I.moon], ['system', 'Auto', I.auto]];

function MyProfile({ me, setMe, matchCount, stats, onPhoto, onAddDeck, onFindStores, onStore, flash }) {
  const fav = me.favCard;
  const set = (patch) => setMe((x) => normalizeMe({ ...x, ...(typeof patch === 'function' ? patch(x) : patch) }));
  const [gamesOpen, setGamesOpen] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef(null);
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { setPhotoError(''); onPhoto(await readPhoto(file)); } catch (err) { setPhotoError(err.message); }
  };
  const dayNames = DAYS.filter(([k]) => me.days.includes(k)).map(([, n]) => t(n).slice(0, 3)).join(', ');
  const [titlesOpen, setTitlesOpen] = useState(false);
  const unlocked = unlockedTitles(stats);
  const title = titleFor(me.title, stats);
  return (
    <>
      {/* Así te ven los demás */}
      <div className={`me-card g-${fav.game}`}>
        <img className={`me-cover${imgCls(fav.game, fav)}`} src={artOf(fav.game, fav)} alt="" />
        <button id="edit-photo" className="me-photo" onClick={() => fileRef.current.click()} aria-label={t('Cambiar foto')}>
          <Hex src={myAvatar(me)} size={108} badge={t(title.label)} colors={['#8B5CF6']} />
          <span className="cam">{I.camera}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
        <h2 className="me-name">{me.name}</h2>
        <div className="me-sub">{levelLine(me, 3)}</div>
        {me.bio && <p className="me-bio">{me.bio}</p>}
        <div className="me-avail">{I.clock}{dayNames || t('Sin días')}{me.slots.length > 0 && ` · ${me.slots.map((x) => t(x)).join(', ')}`}</div>
        <div className="stats">
          <div><b>{me.decks.length}</b><span>{t('Mazos')}</span></div>
          <div><b>{matchCount}</b><span>{t('Rivales')}</span></div>
          <div><b>{me.stores.length}</b><span>{t('Tiendas')}</span></div>
        </div>
      </div>
      {photoError && <p className="upload-error" role="alert">{t(photoError)}</p>}
      {me.avatar && <button type="button" className="link-btn photo-remove" onClick={() => onPhoto('')}>{t('Quitar foto')}</button>}

      <h3 className="section-title">{t('Sobre ti')}</h3>
      <div className="panel form me-form">
        <label>{t('Nombre de jugador')}
          <InlineField id="me-name" value={me.name} maxLength={24} autoComplete="nickname"
            check={(v) => (v.trim() ? null : 'Escribe un nombre de jugador.')} onCommit={(v) => set({ name: v.trim() })} />
        </label>
        <label>
          <span className="label-row">{t('Sobre ti como jugador')} <small>{t('máx. 160')}</small></span>
          <InlineField id="me-bio" multiline rows="3" maxLength={160} value={me.bio} placeholder={t('Qué juegas, qué buscas en una mesa…')}
            check={(v) => (checkMessage(v) === 'conduct' ? 'conduct' : null)} onCommit={(v) => set({ bio: v })} />
        </label>
        <label>{t('Fecha de nacimiento')}
          <InlineField id="me-birth" type="date" max={maxBirthDate()} value={me.birthDate}
            check={(v) => { const a = ageFrom(v); return a === null || a > 99 ? 'Revisa la fecha de nacimiento.' : a < 18 ? 'ManaMatch es solo para mayores de 18.' : null; }}
            onCommit={(v) => set({ birthDate: v })} />
        </label>
        <p className="field-hint">{I.eye}{t('Tu edad no se muestra nunca.')}</p>
      </div>

      <h3 className="section-title">{t('Título')}<small className="title-note">{unlocked.length}/{TITLES.length}</small></h3>
      <div className="tags">
        <span className="title-chip big">{I.star}{t(title.label)}</span>
        <button type="button" id="change-title" className="tag interest add" onClick={() => setTitlesOpen(true)}>{I.edit}{t('Cambiar')}</button>
      </div>
      {titlesOpen && (
        <TitlesSheet value={title.id} unlocked={unlocked} onClose={() => setTitlesOpen(false)}
          onSave={(id) => { set({ title: id }); flash(t('Título actualizado'), I.star); }} />
      )}

      <h3 className="section-title">{t('Mis juegos')}<small className="title-note">{me.interests.length}/{MAX_GAMES}</small></h3>
      <div className="tags">
        {me.interests.map((g) => <span key={g} className="tag interest mine">{gameName(g)}</span>)}
        <button type="button" id="add-games" className="tag interest add" onClick={() => setGamesOpen(true)}>{me.interests.length < MAX_GAMES ? <>{I.plus}{t('Añadir')}</> : <>{I.edit}{t('Cambiar')}</>}</button>
      </div>
      {gamesOpen && (
        <GamesSheet value={me.interests} onClose={() => setGamesOpen(false)}
          onSave={(v) => { set({ interests: v }); flash(t('Juegos actualizados'), I.check); }} />
      )}

      <h3 className="section-title">{t('Nivel de juego')}</h3>
      <Segmented name={t('Nivel')} value={me.level} onChange={(v) => set({ level: v })} options={LEVELS.map((l) => [l, t(l)])} />

      <h3 className="section-title">{t('Formatos')}</h3>
      <ChipPicker options={formatOptions(me.interests)} value={me.formats} onChange={(v) => set({ formats: v })} toggle={(o) => set((x) => ({ formats: toggleIn(x.formats, o) }))} />

      <h3 className="section-title">{t('Imagen de banner')}</h3>
      <div className="panel form me-form">
        <BannerField value={fav} game={fav.game} onChange={(c) => set({ favCard: c })} />
      </div>

      <h3 className="section-title">{t('Mis mazos')}</h3>
      <div className="decks">
        {me.decks.map((d) => (
          <div key={d.id ?? d.name} className="deck-card">
            <img loading="lazy" decoding="async" className={imgCls(d.game, d.card).trim()} src={artOf(d.game, d.card)} alt="" />
            <span className="deck-format">{t(d.format)}</span>
            <button className="deck-del" aria-label={t('Borrar {name}', { name: d.name })} onClick={() => set((x) => ({ decks: x.decks.filter((y) => y !== d) }))}>{I.trash}</button>
            <div><b>{d.name}</b><small>{GAMES[d.game].name}</small></div>
          </div>
        ))}
        <button id="add-deck" className="deck-card add" onClick={onAddDeck}><span className="add-icon">{I.plus}</span>{t('Añadir mazo')}<small>{t('De cualquiera de tus juegos')}</small></button>
      </div>

      <h3 className="section-title">{t('Disponibilidad')}</h3>
      <div className="days">
        {DAYS.map(([k, full]) => <button type="button" key={k} title={t(full)} aria-label={t(full)} aria-pressed={me.days.includes(k)} className={`day ${me.days.includes(k) ? 'on' : ''}`} onClick={() => set((x) => ({ days: toggleIn(x.days, k) }))}>{t(k)}</button>)}
      </div>
      <ChipPicker options={SLOTS} value={me.slots} onChange={(v) => set({ slots: v })} toggle={(o) => set((x) => ({ slots: toggleIn(x.slots, o) }))} />

      <h3 className="section-title">{t('Tiendas habituales')}</h3>
      {!me.stores.length && <p className="section-hint">{t('Guarda las tiendas donde juegas desde «Cerca de ti».')}</p>}
      <div className="list">
        {me.stores.map((id) => STORES.find((st) => st.id === id)).filter(Boolean).map((st) => (
          <div key={st.id} className="row store-row" role="button" tabIndex={0} onClick={() => onStore(st.id)} onKeyDown={(e) => { if (e.key === 'Enter') onStore(st.id); }}>
            <StoreIcon verified={me.verifiedStore === st.id} title={t('Esta tienda te ha verificado en persona')} />
            <div className="grow"><div className="title">{st.name}</div><div className="sub">{st.dist} km · {t(st.events)}</div></div>
            <button type="button" className="icon-btn small-icon" aria-label={t('Quitar {name}', { name: st.name })} onClick={(e) => { e.stopPropagation(); set((x) => ({ stores: x.stores.filter((y) => y !== st.id) })); }}>{I.close}</button>
          </div>
        ))}
        <button type="button" id="find-stores" className="row add-row" onClick={onFindStores}>
          <span className="row-icon">{I.radar}</span>
          <div className="grow"><div className="title">{t('Buscar tiendas cerca')}</div><div className="sub">{t('Guárdalas desde «Cerca de ti»')}</div></div>
          <span className="chev">{I.chevron}</span>
        </button>
      </div>

      <h3 className="section-title">{t('Verificación')}</h3>
      <div className="panel verify">
        <span className="verify-icon">{I.qr}</span>
        <div className="grow">
          <div className="setting-label">{t('Verifícate en tu tienda')}</div>
          <div className="setting-hint">{t('Muy pronto el personal de {store} podrá verificarte en persona y conseguirás la insignia de jugador verificado.', { store: storeName(me.stores[0]) || t('tu tienda') })}</div>
        </div>
        <span className="soon-tag">{t('Próximamente')}</span>
      </div>
    </>
  );
}

/* ================= Cuenta: cambiar correo y eliminar cuenta ================= */
// Supabase envía la confirmación al correo antiguo y al nuevo: no cambia hasta confirmar los dos
function ChangeEmailDialog({ current, onClose }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState(null); // null | 'sending' | 'sent' | 'error'
  const clean = email.trim();
  const same = clean.toLowerCase() === current.toLowerCase();
  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    const { error } = await supabase.auth.updateUser({ email: clean }, { emailRedirectTo: location.origin });
    setState(error ? 'error' : 'sent');
  };
  return (
    <>
      <div className="sheet-bg top" onClick={onClose} />
      <div className="dialog" role="dialog" aria-label={t('Cambiar correo')}>
        <div className="dialog-icon">{I.mail}</div>
        <h3>{t('Cambiar correo')}</h3>
        {state === 'sent' ? (
          <>
            <p>{t('Te hemos enviado un enlace a {old} y otro a {new}. Ábrelos los dos para confirmar el cambio.', { old: current, new: clean })}</p>
            <button className="primary" onClick={onClose}>{t('Entendido')}</button>
          </>
        ) : (
          <form className="form dialog-form" onSubmit={submit}>
            <p>{t('Ahora entras con {email}. Por seguridad, tendrás que confirmar desde las dos direcciones.', { email: current })}</p>
            <input id="new-email" type="email" required autoComplete="email" placeholder={t('nuevo@correo.com')} value={email} onChange={(e) => { setEmail(e.target.value); setState(null); }} />
            {same && <p className="upload-error" role="alert">{t('Es el mismo correo que ya usas.')}</p>}
            {state === 'error' && <p className="upload-error" role="alert">{t('No se ha podido cambiar. Revisa el correo o inténtalo más tarde.')}</p>}
            <div className="btn-row">
              <button type="button" className="ghost" onClick={onClose}>{t('Cancelar')}</button>
              <button id="send-new-email" className="primary" disabled={!clean || same || state === 'sending'}>{state === 'sending' ? t('Enviando…') : t('Cambiar')}</button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

// Borrar la cuenta pide escribir una palabra para evitar pulsaciones por error. Lo borra el servidor
// (función delete_my_account en supabase/migrations/002_delete_account.sql) y después se limpia el dispositivo.
const DELETE_WORD = 'ELIMINAR';
function DeleteAccountDialog({ uid, onClose }) {
  const [word, setWord] = useState('');
  const [state, setState] = useState(null); // null | 'deleting' | 'error'
  const confirmWord = t(DELETE_WORD);
  const ok = word.trim().toUpperCase() === confirmWord.toUpperCase();
  const remove = async () => {
    setState('deleting');
    // Las fotos están en Storage y no se borran solas con la cuenta
    await removeAvatars(uid).catch(() => {});
    const { error } = await supabase.rpc('delete_my_account');
    if (error) { setState('error'); return; }
    try { Object.keys(localStorage).filter((k) => k.startsWith('manamatch-')).forEach((k) => localStorage.removeItem(k)); } catch { /* sin almacenamiento */ }
    caches?.delete?.('mm-media-v1');
    await supabase.auth.signOut({ scope: 'local' });
    location.replace('/');
  };
  return (
    <>
      <div className="sheet-bg top" onClick={state === 'deleting' ? undefined : onClose} />
      <div className="dialog" role="alertdialog" aria-label={t('Eliminar mi cuenta')}>
        <div className="dialog-icon">{I.trash}</div>
        <h3>{t('¿Eliminar tu cuenta?')}</h3>
        <p>{t('Se borrarán para siempre tu perfil, tus mazos, tus duelos y tus mensajes. No se puede deshacer.')}</p>
        <div className="form dialog-form">
          <label>{t('Escribe {word} para confirmar', { word: confirmWord })}
            <input id="delete-word" autoComplete="off" autoCapitalize="characters" value={word} onChange={(e) => setWord(e.target.value)} />
          </label>
          {state === 'error' && <p className="upload-error" role="alert">{t('No se ha podido eliminar la cuenta. Inténtalo de nuevo en unos minutos.')}</p>}
          <div className="btn-row">
            <button type="button" className="ghost" disabled={state === 'deleting'} onClick={onClose}>{t('Cancelar')}</button>
            <button id="confirm-delete-account" className="primary danger-fill" disabled={!ok || state === 'deleting'} onClick={remove}>{state === 'deleting' ? t('Eliminando…') : t('Eliminar')}</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= Ajustes (se abren desde el botón de la rueda en el perfil) ================= */
const PERF = [['full', 'Completo', I.star], ['light', 'Ligero', I.auto]];
function SettingsScreen({ me, setMe, theme, setTheme, perf, setPerf, blocked, onUnblock, onReset, onRules, onNorms, onWipe, installer, user, onSignOut, onClose }) {
  const set = (patch) => setMe((x) => ({ ...x, ...patch }));
  const [accountDialog, setAccountDialog] = useState(null); // 'email' | 'delete'
  useBack(!!accountDialog, () => setAccountDialog(null));
  // Cómo entró: con Google o con el enlace al correo (sin contraseña en ningún caso)
  const provider = user?.app_metadata?.provider;
  const viaGoogle = provider === 'google';
  const viaDiscord = provider === 'discord';
  const setNotif = (k, v) => setMe((x) => ({ ...x, notif: { ...x.notif, [k]: v } }));
  const blockedPlayers = PLAYERS.filter((x) => blocked.includes(x.id));
  return (
    <div className="page" role="dialog" aria-label={t('Ajustes')}>
      <header className="page-bar">
        <button id="close-settings" className="icon-btn" onClick={onClose} aria-label={t('Volver al perfil')}>{I.back}</button>
        <h2>{t('Ajustes')}</h2>
        <span style={{ width: 44 }} />
      </header>
      <div className="screen page-body">
        <h3 className="section-title">{t('Apariencia')}</h3>
        <div className="panel">
          <div className="setting"><span className="setting-icon">{I.palette}</span><div className="grow"><div className="setting-label">{t('Tema')}</div><div className="setting-hint">{t('Auto sigue el modo de tu dispositivo')}</div></div></div>
          <Segmented name={t('Tema')} value={theme} onChange={setTheme} options={THEMES.map(([v, label, icon]) => [v, t(label), icon])} />
        </div>
        <div className="panel">
          <div className="setting"><span className="setting-icon">{I.star}</span><div className="grow"><div className="setting-label">{t('Rendimiento')}</div><div className="setting-hint">{t('Ligero quita el brillo, la inclinación y las animaciones de las cartas. Solo en este dispositivo')}</div></div></div>
          <Segmented name={t('Rendimiento')} value={perf} onChange={setPerf} options={PERF.map(([v, label, icon]) => [v, t(label), icon])} />
        </div>
        <div className="panel lang-panel">
          <div className="setting">
            <span className="setting-icon">{I.globe}</span>
            <div className="grow"><label className="setting-label" htmlFor="lang">{t('Idioma')}</label></div>
            <select id="lang" className="lang-select" value={getLang()} onChange={(e) => setLang(e.target.value)}>
              {LANGS.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </div>
        </div>

        <h3 className="section-title">{t('Búsqueda')}</h3>
        <div className="panel form">
          <label>
            <span className="label-row">{t('Radio de búsqueda')} <b>{me.radius} km</b></span>
            <input id="radius" type="range" min="1" max="50" value={me.radius} onChange={(e) => set({ radius: +e.target.value })} style={{ '--p': `${((me.radius - 1) / 49) * 100}%` }} />
          </label>
          <Switch id="only-verified" icon={I.shield} label={t('Solo jugadores verificados')} hint={t('Verificados en persona por una tienda')} on={me.onlyVerified} onChange={(v) => set({ onlyVerified: v })} />
        </div>

        <h3 className="section-title">{t('Privacidad')}</h3>
        <div className="panel settings">
          <Switch id="visible" icon={I.eye} label={t('Aparecer en Descubrir')} hint={t('Si lo desactivas, nadie nuevo verá tu perfil')} on={me.visible} onChange={(v) => set({ visible: v })} />
          <Switch id="show-distance" icon={I.pin} label={t('Mostrar mi rango de distancia')} hint={t('Nunca se muestra tu ubicación exacta')} on={me.showDistance} onChange={(v) => set({ showDistance: v })} />
        </div>

        <h3 className="section-title">{t('Notificaciones')}<small className="title-note">{t('Próximamente')}</small></h3>
        <div className="panel settings">
          <Switch id="notif-matches" icon={I.sword} label={t('Nuevos duelos')} on={me.notif.matches} onChange={(v) => setNotif('matches', v)} />
          <Switch id="notif-messages" icon={I.chat} label={t('Mensajes')} on={me.notif.messages} onChange={(v) => setNotif('messages', v)} />
          <Switch id="notif-events" icon={I.bell} label={t('Eventos de mis tiendas')} hint={t('Torneos, prereleases y ligas')} on={me.notif.events} onChange={(v) => setNotif('events', v)} />
        </div>

        <h3 className="section-title">{t('Seguridad')}</h3>
        <div className="list">
          <button id="open-rules" className="row" onClick={onRules}>
            <span className="row-icon safe">{I.book}</span>
            <div className="grow"><div className="title">{t('Código de conducta')}</div><div className="sub">{t('ManaMatch es para jugar, no para ligar')}</div></div>
            <span className="chev">{I.chevron}</span>
          </button>
          <button id="open-norms" className="row" onClick={onNorms}>
            <span className="row-icon safe">{I.flag}</span>
            <div className="grow"><div className="title">{t('Normas y sanciones')}</div><div className="sub">{t('Qué se sanciona y cómo')}</div></div>
            <span className="chev">{I.chevron}</span>
          </button>
          <div className="panel blocked">
            <div className="setting"><span className="setting-icon">{I.ban}</span><div className="grow"><div className="setting-label">{t('Usuarios bloqueados')}</div><div className="setting-hint">{blockedPlayers.length ? t('No pueden verte ni escribirte') : t('No has bloqueado a nadie')}</div></div></div>
            {blockedPlayers.map((x) => (
              <div key={x.id} className="blocked-row">
                <img loading="lazy" decoding="async" className="avatar" src={avatarOf(x)} alt="" /><span className="grow">{x.name}</span>
                <button className="link-btn" onClick={() => onUnblock(x.id)}>{t('Desbloquear')}</button>
              </div>
            ))}
          </div>
        </div>

        {!installer.installed && (
          <>
            <h3 className="section-title">{t('Aplicación')}</h3>
            <div className="panel install">
              <img src="/icon-192.png" alt="" width="48" height="48" />
              <div className="grow">
                <div className="setting-label">{t('Instala ManaMatch')}</div>
                <div className="setting-hint">
                  {installer.canPrompt ? t('Tenla en tu pantalla de inicio, a pantalla completa y sin conexión.')
                    : installer.isIOS ? <>{t('En Safari pulsa «Compartir»')} {I.share} {t('y luego «Añadir a pantalla de inicio».')}</>
                      : t('Abre el menú del navegador y elige «Instalar aplicación» o «Añadir a pantalla de inicio».')}
                </div>
              </div>
              {installer.canPrompt && <button id="install-app" className="primary small" onClick={installer.install}>{I.download}{t('Instalar')}</button>}
            </div>
          </>
        )}

        {user && (
          <>
            <h3 className="section-title">{t('Cuenta')}</h3>
            <div className="list">
              <div className="row account-row">
                <span className="row-icon account-icon">{viaGoogle ? GOOGLE_G : viaDiscord ? I.chat : I.mail}</span>
                <div className="grow"><div className="title">{viaGoogle ? t('Conectado con Google') : viaDiscord ? t('Conectado con Discord') : t('Conectado con enlace al correo')}</div><div className="sub">{user.email}</div></div>
              </div>
              <p className="field-hint account-hint">{I.shield}{viaGoogle
                ? t('ManaMatch no guarda contraseñas: tu correo y tu contraseña se cambian en tu cuenta de Google.')
                : t('ManaMatch no usa contraseñas: cada vez que entras te enviamos un enlace nuevo.')}</p>
              {!viaGoogle && (
                <button id="change-email" className="row" onClick={() => setAccountDialog('email')}>
                  <span className="row-icon">{I.mail}</span>
                  <div className="grow"><div className="title">{t('Cambiar correo')}</div><div className="sub">{t('Confirmarás desde el antiguo y el nuevo')}</div></div>
                  <span className="chev">{I.chevron}</span>
                </button>
              )}
              <button id="sign-out" className="row" onClick={onSignOut}>
                <span className="row-icon">{I.logout}</span>
                <div className="grow"><div className="title">{t('Cerrar sesión')}</div><div className="sub">{t('Podrás volver a entrar cuando quieras')}</div></div>
                <span className="chev">{I.chevron}</span>
              </button>
            </div>
          </>
        )}

        {!user && <button id="reset-profile" className="danger-btn" onClick={onReset}>{I.reset}{t('Restablecer perfil de ejemplo')}</button>}
        <button id="wipe-data" className="danger-btn" onClick={onWipe}>{I.trash}{t('Borrar mis datos de este dispositivo')}</button>
        {user && <button id="delete-account" className="danger-btn" onClick={() => setAccountDialog('delete')}>{I.ban}{t('Eliminar mi cuenta')}</button>}
      </div>
      {accountDialog === 'email' && <ChangeEmailDialog current={user.email} onClose={() => setAccountDialog(null)} />}
      {accountDialog === 'delete' && <DeleteAccountDialog uid={user.id} onClose={() => setAccountDialog(null)} />}
    </div>
  );
}

/* Espada en diagonal (punta arriba a la derecha) para el icono de duelo */
const SWORD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 3l-.8 3.6L10 16.8 7.2 14 17.4 3.8z" fill="currentColor" fillOpacity="0.25" />
    <path d="M5 12.5l6.5 6.5" strokeWidth="2.2" />
    <path d="M8.2 15.8L4.5 19.5" strokeWidth="2.4" />
    <circle cx="3.6" cy="20.4" r="1.1" fill="currentColor" />
  </svg>
);

/* ================= Match overlay ================= */
function MatchScreen({ p, me, onSend, onContinue }) {
  const [text, setText] = useState('');
  const [sendText, warn, clearWarn] = useModeratedSend(onSend);
  const submit = (e) => { e.preventDefault(); if (!text.trim()) onSend(''); else sendText(text); };
  // Si tienes perfil del juego del rival, el duelo se ambienta con tu carta de ese juego
  const mine = me.favCard;
  const sparkColors = ['#8B5CF6', '#C4F56A', '#B79CFB'];
  return (
    <div className="match" role="dialog" aria-label={t('¡Duelo aceptado!')}>
      {/* Fondo partido en diagonal: tu carta contra la suya */}
      <div className="vs-bg" aria-hidden="true">
        <div className="vs-half left"><img className={imgCls(mine.game, mine).trim()} src={artOf(mine.game, mine)} alt="" /></div>
        <div className="vs-half right"><img className={imgCls(p.favCard.game, p.favCard).trim()} src={artOf(p.favCard.game, p.favCard)} alt="" /></div>
        <svg className="vs-seam" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="62" y1="-2" x2="38" y2="102" /></svg>
      </div>
      <div className="sparks">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i, '--c': sparkColors[i % sparkColors.length] }} />)}</div>
      <div className="duel-icon" aria-hidden="true">{SWORD}{SWORD}</div>
      <p className="its">{t('¡Duelo')}</p>
      <h2 className="match-title" data-text={t('ACEPTADO!')}>{t('ACEPTADO!')}</h2>
      <div className="pair">
        <Hex src={myAvatar(me)} alt={me.name} size={124} colors={['#8B5CF6', '#C4F56A']} />
        <span className="vs" aria-label={t('contra')}>VS</span>
        <Hex src={avatarOf(p)} alt={p.name} size={124} colors={p.superDuel || p.superLikedYou ? SUPER_FRAME : FRAME.list} />
      </div>
      <p className="swiped">{t('{name} también quiere jugar a {game}. Proponed formato y tienda.', { name: p.name, game: sharedGames(me, p).map(gameName).join(', ') || GAMES[p.favCard.game].name })}</p>
      <div className="quick light">{quickReplies(p, me).map((q) => <button key={q} type="button" onClick={() => { setText(q); clearWarn(); }}>{q}</button>)}</div>
      <form className="match-reply" onSubmit={submit}>
        <input id="match-input" placeholder={t('Propón una partida…')} value={text} onChange={(e) => { setText(e.target.value); if (warn === 'conduct') clearWarn(); }} />
        <button id="match-chat">{warn === 'contact' ? t('Enviar igual') : t('Enviar')}</button>
      </form>
      <ModNote kind={warn} />
      <button id="match-continue" className="keep" onClick={onContinue}>{t('Seguir buscando')}</button>
    </div>
  );
}

/* ================= App ================= */
const REPLIES = ['¡Hola! ¿Qué mazo llevarías? 😄', 'Me parece genial, ¡allí nos vemos!', 'Jajaja trae fundas de sobra', '¿Hacemos un al mejor de 3?'];
const TABS = [['discover', I.flame, 'Descubrir'], ['nearby', I.radar, 'Cerca de ti'], ['chat', I.chat, 'Mensajes'], ['me', I.user, 'Perfil']];
const DARK_MQ = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

/* Tema (día/noche) y ambientación del juego activo, aplicados en <html> */
function useAppearance(theme, game) {
  const [sysDark, setSysDark] = useState(DARK_MQ ? DARK_MQ.matches : true);
  useEffect(() => {
    if (!DARK_MQ) return;
    const on = (e) => setSysDark(e.matches);
    DARK_MQ.addEventListener('change', on);
    return () => DARK_MQ.removeEventListener('change', on);
  }, []);
  const resolved = theme === 'system' ? (sysDark ? 'dark' : 'light') : theme;
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.game = game;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', resolved === 'light' ? '#F8F7FC' : '#171522'));
  }, [resolved, game]);
}

export default function App() {
  useLang(); // al cambiar de idioma se vuelve a pintar toda la app
  // Los accesos directos del icono de la app abren una pestaña concreta (?tab=chat)
  const [tab, setTab] = useState(() => { const t = new URLSearchParams(location.search).get('tab'); return TABS.some(([id]) => id === t) ? t : 'discover'; });
  const [queue, setQueue] = useState(PLAYERS);
  const [passed, setPassed] = useState([]);
  const [matches, setMatches] = useState([]);
  const [chats, setChats] = useState({});
  // Asistencia confirmada por ti en cada duelo (en producción se envía al servidor, que calcula la fiabilidad)
  const [attendance, setAttendance] = useStoredState('manamatch-attendance', {}, (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {}));
  const [unread, setUnread] = useState(0);
  const [profile, setProfile] = useState(null);
  const [matchFx, setMatchFx] = useState(null);
  const [chatWith, setChatWith] = useState(null);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null); // 'deck'
  const [reporting, setReporting] = useState(null);
  const [blocking, setBlocking] = useState(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [normsOpen, setNormsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [me, setMe] = useStoredState('manamatch-me', DEFAULT_ME, migrateMe);
  // Imágenes que has denunciado (y, con cuenta, las ocultas para todos): se sincronizan con el conjunto global
  const [hidden, setHidden] = useStoredState('manamatch-hidden-imgs', [], (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(-200) : []));
  hidden.forEach((x) => hiddenImgs.add(x));
  // Por defecto sigue el modo del móvil (día o noche), igual que el login. Clave nueva: la anterior guardaba
  // "noche" aunque nadie lo hubiera elegido, y el login (que sigue al móvil) no coincidía con el resto de la app
  const [theme, setTheme] = useStoredState('manamatch-theme-v2', 'system');
  // Rendimiento de este dispositivo: «ligero» quita el brillo foil, la inclinación 3D y las animaciones de la carta
  const [perf, setPerf] = useStoredState('manamatch-perf', 'full', (v) => (v === 'light' ? 'light' : 'full'));
  useEffect(() => { document.documentElement.dataset.perf = perf; }, [perf]);
  const [blocked, setBlocked] = useStoredState('manamatch-blocked', []);
  const [accepted, setAccepted] = useStoredState('manamatch-rules', false);
  useAppearance(theme, me.favCard.game);
  useViewportHeight();
  const online = useOnline();
  const installer = useInstall();
  const session = useSession();
  const uid = session?.user.id;

  // Perfil en la cuenta: se carga al entrar y se guarda (con una pequeña espera) cada vez que cambia.
  // El navegador guarda una copia para abrir rápido y sin conexión.
  const [cloud, setCloud] = useState({ uid: null, status: 'loading' }); // status: loading · ready · new · error
  const [syncFailed, setSyncFailed] = useState(false);
  const [loadTry, setLoadTry] = useState(0);
  const lastSaved = useRef('');
  const cloudStatus = !supabase || !uid ? 'off' : cloud.uid === uid ? cloud.status : 'loading';
  useEffect(() => {
    if (!supabase || !uid) return;
    let alive = true;
    loadMe(uid)
      .then((m) => {
        if (!alive) return;
        if (m) { lastSaved.current = JSON.stringify(m); setMe(migrateMe(m)); }
        setCloud({ uid, status: m ? 'ready' : 'new' });
      })
      .catch(() => alive && setCloud({ uid, status: 'error' }));
    return () => { alive = false; };
  }, [uid, loadTry, setMe]);
  useEffect(() => {
    if (cloudStatus !== 'ready') return;
    const json = JSON.stringify(me);
    if (json === lastSaved.current || me.avatar.startsWith('data:')) return;
    const t = setTimeout(async () => {
      try {
        // Primero se suben las imágenes de cartas nuevas; al cambiar el perfil este efecto vuelve a guardar
        if (hasLocalCardImages(me)) { const map = await uploadCardImages(uid, me); setMe((x) => replaceUploads(x, map)); return; }
        await saveMe(uid, me);
        lastSaved.current = json; setSyncFailed(false);
        cleanCardImages(uid, me).catch(() => {});
      } catch (err) { console.error('ManaMatch: no se ha podido guardar', err); setSyncFailed(err?.message || true); }
    }, 800);
    return () => clearTimeout(t);
  }, [me, cloudStatus, uid, online, setMe]);
  // Imágenes ocultas para todos por acumular denuncias
  useEffect(() => {
    if (!supabase || !uid) return;
    hiddenImages().then((list) => setHidden((h) => [...new Set([...h, ...list])].slice(-200))).catch(() => {});
  }, [uid, setHidden]);

  // El botón "atrás" cierra primero lo último que se abrió
  useBack(tab !== 'discover', () => setTab('discover'));
  useBack(!!chatWith, () => setChatWith(null));
  useBack(!!matchFx, () => setMatchFx(null));
  useBack(!!profile, () => setProfile(null));
  useBack(!!editing, () => setEditing(null));
  useBack(!!reporting, () => setReporting(null));
  useBack(!!blocking, () => setBlocking(null));
  useBack(rulesOpen, () => setRulesOpen(false));
  useBack(settingsOpen, () => setSettingsOpen(false));
  useBack(normsOpen, () => setNormsOpen(false));
  useBack(wiping, () => setWiping(false));

  const notBlocked = (p) => !blocked.includes(p.id);
  const visibleQueue = queue.filter(notBlocked);
  const visibleMatches = matches.filter(notBlocked);

  // Logros: los títulos que desbloqueas se anuncian una vez. La primera vez solo se apuntan (sin avisar de todo
  // lo que ya tenías), y con cuenta se espera a que llegue tu perfil para no anunciar los del perfil de ejemplo.
  const played = Object.values(attendance).filter((v) => v === 'came').length;
  const myStats = { ...playerStats(me), played, matches: visibleMatches.length, reliable: played >= 3 };
  const unlockedKey = unlockedTitles(myStats).join(',');
  const [seenTitles, setSeenTitles] = useStoredState('manamatch-seen-titles', null, (v) => (Array.isArray(v) ? v : null));
  const [achievements, setAchievements] = useState([]);
  const profileReady = cloudStatus === 'off' || cloudStatus === 'ready';
  // Se calcula durante el render (patrón de "estado derivado"): en cuanto cambia lo desbloqueado, se apunta y se anuncia
  if (profileReady) {
    const now = unlockedKey.split(',').filter(Boolean);
    const fresh = seenTitles === null ? [] : now.filter((id) => !seenTitles.includes(id));
    if (seenTitles === null) setSeenTitles(now);
    else if (fresh.length) { setSeenTitles([...seenTitles, ...fresh]); setAchievements((q) => [...q, ...fresh]); }
  }

  // Súper duelos: saldo. En la demo se guarda en el móvil; con cuenta lo lleva el servidor (tabla super_credits),
  // que es el único que puede sumar saldo (tras un pago confirmado por Stripe).
  const [credits, setCredits] = useStoredState('manamatch-super-credits', 1, (v) => (Number.isInteger(v) && v >= 0 ? v : 0));
  const [shopOpen, setShopOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(null); // id de la tienda cuya ficha está abierta
  useBack(!!storeOpen, () => setStoreOpen(null));
  const toggleStore = (id) => {
    const saved = me.stores.includes(id);
    setMe((x) => ({ ...x, stores: saved ? x.stores.filter((y) => y !== id) : [...x.stores, id].slice(0, 10) }));
    flash(saved ? t('Tienda quitada de tu perfil') : t('Tienda guardada en tu perfil'), I.store);
  };
  useEffect(() => {
    if (!supabase || !uid) return;
    supabase.from('super_credits').select('balance').eq('user_id', uid).maybeSingle()
      .then(({ data }) => setCredits(data?.balance ?? 0)).catch(() => {});
  }, [uid, setCredits]);
  const buySuper = async (pack) => {
    if (!supabase) {
      // Demo sin cuenta: se suma sin cobrar para poder probarlo
      setCredits((c) => c + pack.credits); setShopOpen(false);
      flash(t('+{n} súper duelos (demo, sin cobro)', { n: pack.credits }), I.star);
      return;
    }
    const { data, error } = await supabase.functions.invoke('create-checkout', { body: { pack: pack.id } });
    if (error || !data?.url) throw new Error('Los pagos aún no están activados.');
    window.location.assign(data.url);
  };

  const flash = (text, icon = I.sword) => { setToast({ text, icon }); setTimeout(() => setToast(null), 2200); };

  const decide = (p, like, isSuper = false) => {
    setQueue((q) => q.filter((x) => x.id !== p.id));
    setProfile(null);
    haptic(like ? 15 : 8);
    if (!like) { setPassed((h) => [...h, p]); return; }
    if (isSuper) setCredits((c) => Math.max(0, c - 1));
    // Duelo marcado como Súper duelo si lo enviaste tú o si te lo enviaron a ti
    const duel = { ...p, superDuel: isSuper ? 'sent' : p.superLikedYou ? 'received' : null };
    // Demo: los jugadores competitivos/cercanos aceptan el reto; un súper duelo (o si ya te retó) siempre se acepta
    if (isSuper || p.superLikedYou || p.dist < 2.5 || p.id % 2 === 0) {
      setMatches((m) => [duel, ...m]);
      setUnread((u) => u + 1);
      setMatchFx(duel);
      setTimeout(() => haptic([30, 60, 40]), 300);
    } else flash(t('Has retado a {name}', { name: p.name }));
  };

  const rewind = () => {
    const last = passed.at(-1);
    if (!last) return;
    setPassed((h) => h.slice(0, -1));
    setQueue((q) => [last, ...q]);
  };

  const block = (p, silent = false) => {
    setBlocked((b) => b.includes(p.id) ? b : [...b, p.id]);
    setProfile(null); setBlocking(null); setReporting(null); setMatchFx(null);
    if (chatWith?.id === p.id) setChatWith(null);
    haptic(20);
    if (!silent) flash(t('Has bloqueado a {name}', { name: p.name }), I.ban);
  };

  const send = (p, m) => {
    setChats((c) => ({ ...c, [p.id]: [...(c[p.id] || []), m] }));
    setTimeout(() => {
      const reply = m.type === 'meetup' ? { ...m, from: 'them' } : { type: 'text', from: 'them', text: t(REPLIES[Math.floor(Math.random() * REPLIES.length)]) };
      setChats((c) => ({ ...c, [p.id]: [...(c[p.id] || []), reply] }));
    }, 1200);
  };

  const addDeck = (d) => setMe((x) => ({ ...x, decks: [...x.decks, d] }));
  const openChat = (p) => { setChatWith(p); setTab('chat'); setMatchFx(null); setUnread(0); };
  const inChat = tab === 'chat' && chatWith;

  // Foto de perfil: la nueva se sube a la cuenta y la anterior se borra ('' = quitar la foto)
  const savePhoto = async (dataUrl) => {
    let avatar = dataUrl;
    if (uid && dataUrl) {
      try { avatar = await uploadAvatar(uid, dataUrl); } catch (err) {
        console.error('ManaMatch: foto', err);
        flash(`${t('No se ha podido subir la foto')}${err?.message ? `: ${err.message}` : ''}`, I.alert);
        return;
      }
    } else if (uid && !dataUrl && isAvatarPath(me.avatar)) removeAvatars(uid).catch(() => {});
    setMe((x) => ({ ...x, avatar }));
    flash(dataUrl ? t('Foto actualizada') : t('Foto quitada'), I.check);
  };
  const createProfile = async (draft) => {
    if (hasLocalCardImages(draft)) draft = replaceUploads(draft, await uploadCardImages(uid, draft));
    await saveMe(uid, draft);
    lastSaved.current = JSON.stringify(draft);
    setMe(draft);
    setCloud({ uid, status: 'ready' });
  };
  // Al cerrar sesión se borra la copia local para que otra persona en este móvil no vea nada tuyo
  const signOut = async () => {
    await supabase.auth.signOut();
    try { ['manamatch-me', 'manamatch-blocked', 'manamatch-rules'].forEach((k) => localStorage.removeItem(k)); } catch { /* sin almacenamiento */ }
    // También las imágenes guardadas por el service worker (incluida la foto propia)
    try { await caches?.delete?.('mm-media-v1'); } catch { /* sin caché */ }
    location.replace('/');
  };

  // Solo en desarrollo: ?onboarding muestra la pantalla de crear perfil sin necesitar una cuenta nueva
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('onboarding')) {
    return <main className="phone"><CreateProfileScreen onCreate={async () => { location.search = ''; }} /></main>;
  }
  // Solo en desarrollo: ?login muestra la pantalla de inicio de sesión aunque no haya Supabase configurado
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('login')) return <main className="phone"><LoginScreen /></main>;
  // Con cuentas activadas, sin sesión no se ve nada de la app
  if (session === undefined) return <main className="phone" aria-busy="true" />;
  if (supabase && !session) return <main className="phone"><LoginScreen /></main>;
  if (cloudStatus === 'loading' || cloudStatus === 'error') {
    return <main className="phone"><BootScreen error={cloudStatus === 'error'} onRetry={() => { setCloud({ uid: null, status: 'loading' }); setLoadTry((n) => n + 1); }} /></main>;
  }
  if (cloudStatus === 'new') {
    return (
      <main className="phone">
        <CreateProfileScreen onCreate={createProfile} />
        {!accepted && <RulesScreen firstTime onAccept={() => setAccepted(true)} onClose={() => {}} />}
      </main>
    );
  }

  return (
    <main className={`phone ${tab === 'discover' ? 'discover' : ''}`}>
      <nav className="topnav" aria-label={t('Secciones')}>
        {TABS.map(([id, icon, label]) => (
          <button key={id} id={`nav-${id}`} aria-label={t(label)} title={t(label)} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); if (id === 'chat') setUnread(0); }}>
            {icon}{id === 'chat' && unread > 0 && <span className="badge">{unread}</span>}
          </button>
        ))}
      </nav>

      <section className="screen" key={tab + (chatWith?.id ?? '')}>
        {tab !== 'discover' && !inChat && (
          <header className="screen-head">
            <div>
              <h1 className="screen-title">{t(TABS.find((x) => x[0] === tab)[2])}</h1>
            </div>
            {tab === 'me' && <button id="open-settings" className="icon-btn head-action" onClick={() => setSettingsOpen(true)} aria-label={t('Ajustes')} title={t('Ajustes')}>{I.gear}</button>}
          </header>
        )}
        {tab === 'discover' && <Discover queue={visibleQueue} me={me} onDecide={decide} onInfo={setProfile} onRewind={rewind} canRewind={passed.length > 0} credits={credits} onNeedCredits={() => setShopOpen(true)} />}
        {tab === 'nearby' && <Nearby players={PLAYERS.filter((p) => notBlocked(p) && sharedGames(me, p).length > 0 && p.dist <= me.radius && (!me.onlyVerified || p.verified))} me={me} onRadius={(km) => setMe((x) => ({ ...x, radius: km }))} onInfo={setProfile}
          onToggleStore={toggleStore} onStore={setStoreOpen} />}
        {tab === 'chat' && (chatWith
          ? <Chat p={chatWith} me={me} attended={attendance[chatWith.id]} onAttend={(v) => setAttendance((a) => ({ ...a, [chatWith.id]: v }))} msgs={chats[chatWith.id] || []} onSend={(m) => send(chatWith, m)} onBack={() => setChatWith(null)} onInfo={setProfile} onReport={() => setReporting(chatWith)} />
          : <Matches matches={visibleMatches} chats={chats} openChat={openChat} />)}
        {tab === 'me' && (
          <MyProfile
            me={me} setMe={setMe} matchCount={visibleMatches.length} flash={flash}
            stats={myStats}
            onPhoto={savePhoto} onAddDeck={() => setEditing('deck')} onFindStores={() => setTab('nearby')} onStore={setStoreOpen}
          />
        )}
      </section>

      {settingsOpen && (
        <SettingsScreen
          me={me} setMe={setMe} theme={theme} setTheme={setTheme} perf={perf} setPerf={setPerf} installer={installer}
          blocked={blocked} onUnblock={(id) => setBlocked((b) => b.filter((x) => x !== id))}
          onRules={() => setRulesOpen(true)} onNorms={() => setNormsOpen(true)} onWipe={() => setWiping(true)}
          onReset={() => { setMe(DEFAULT_ME); flash(t('Perfil restablecido'), I.reset); }}
          user={session?.user} onSignOut={signOut}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {storeOpen && STORES.some((st) => st.id === storeOpen) && (
        <StoreSheet store={STORES.find((st) => st.id === storeOpen)} me={me} saved={me.stores.includes(storeOpen)}
          players={PLAYERS.filter((p) => notBlocked(p) && sharedGames(me, p).length > 0)}
          onToggle={() => toggleStore(storeOpen)} onInfo={setProfile} onClose={() => setStoreOpen(null)} />
      )}
      {profile && (
        <ProfileSheet
          p={profile} me={me} onClose={() => setProfile(null)}
          onReportImage={(image) => setReporting({ ...profile, image })}
          onLike={visibleQueue.some((q) => q.id === profile.id) ? () => decide(profile, true) : null}
          onReport={() => setReporting(profile)} onBlock={() => setBlocking(profile)}
        />
      )}

      {editing === 'deck' && <DeckSheet games={me.interests} onClose={() => setEditing(null)} onSave={(d) => { addDeck(d); setEditing(null); flash(t('Mazo «{name}» añadido', { name: d.name }), I.plus); }} />}

      {matchFx && (
        <MatchScreen
          p={matchFx} me={me}
          onSend={(text) => { if (text) send(matchFx, { type: 'text', from: 'me', text }); openChat(matchFx); }}
          onContinue={() => setMatchFx(null)}
        />
      )}

      {reporting && (
        <ReportSheet
          p={reporting} onClose={() => setReporting(null)}
          onSubmit={({ alsoBlock }) => {
            if (reporting.image) {
              setHidden((h) => [...h.filter((x) => x !== reporting.image), reporting.image]);
              if (supabase && uid) flagImage(reporting.image).catch(() => {});
            }
            if (alsoBlock) block(reporting, true);
            setReporting(null); flash(reporting.image ? t('Imagen denunciada y ocultada') : t('Denuncia enviada. La revisaremos en 24 h'), I.flag);
          }}
        />
      )}
      {blocking && (
        <Confirm
          title={t('¿Bloquear a {name}?', { name: blocking.name })}
          text={t('No podrá ver tu perfil ni escribirte, y desaparecerá de tus rivales. Puedes deshacerlo desde tu perfil.')}
          confirm={t('Bloquear')} onClose={() => setBlocking(null)} onConfirm={() => block(blocking)}
        />
      )}

      {wiping && (
        <Confirm
          id="confirm-wipe" icon={I.trash} confirm={t('Borrar todo')}
          title={t('¿Borrar tus datos de este dispositivo?')}
          text={t('Se eliminarán tu perfil, tus mazos, la foto, los bloqueos y tus preferencias guardados en este móvil. No se puede deshacer.')}
          onClose={() => setWiping(false)}
          onConfirm={() => {
            try { Object.keys(localStorage).filter((k) => k.startsWith('manamatch-')).forEach((k) => localStorage.removeItem(k)); } catch { /* sin almacenamiento */ }
            caches?.delete?.('mm-media-v1');
            location.replace('/');
          }}
        />
      )}

      {normsOpen && <NormsScreen onClose={() => setNormsOpen(false)} />}

      {(!accepted || rulesOpen) && (
        <RulesScreen firstTime={!accepted} onAccept={() => setAccepted(true)} onClose={() => setRulesOpen(false)} />
      )}

      {!online && <div className="offline" role="status">{I.wifiOff}{t('Sin conexión: verás lo último que se guardó')}</div>}
      {online && syncFailed && <div className="offline" role="status">{I.alert}{t('No se han podido guardar tus cambios en la cuenta. Lo reintentaremos.')}{typeof syncFailed === 'string' && <small className="sync-detail">{syncFailed}</small>}</div>}

      {shopOpen && <SuperShop credits={credits} onBuy={buySuper} onClose={() => setShopOpen(false)} />}
      {toast && <div className="toast" role="status"><span className="toast-icon">{toast.icon}</span>{toast.text}</div>}
      {achievements[0] && (
        <Achievement key={achievements[0]} id={achievements[0]}
          onDone={() => setAchievements((q) => q.slice(1))}
          onEquip={() => { setMe((x) => ({ ...x, title: achievements[0] })); setAchievements((q) => q.slice(1)); flash(t('Título actualizado'), I.star); }} />
      )}
    </main>
  );
}
