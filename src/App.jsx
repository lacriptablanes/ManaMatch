import { useState, useRef, useId, useEffect } from 'react';
import { PLAYERS, STORES, pokeImg, opImg } from './data';
import { GAMES, GAME_IDS } from './games';
import { supabase } from './supabase';

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

/* Un perfil de juego por cada TCG: carta favorita, colores, formatos, nivel y mazos */
const DEFAULT_PROFILES = {
  magic: {
    level: 'Casual competitivo', favCard: { name: 'Atraxa, Praetors\' Voice' }, colors: ['W', 'U', 'B', 'G'], formats: ['Commander', 'Modern'],
    decks: [{ id: 1, name: 'Atraxa Superfriends', format: 'Commander', card: { name: 'Atraxa, Praetors\' Voice' } }],
  },
  pokemon: {
    level: 'Casual', favCard: { name: 'Charizard ex', img: pokeImg('sv3pt5', 6) }, colors: ['fire', 'colorless'], formats: ['Estándar'],
    decks: [{ id: 2, name: 'Charizard ex', format: 'Estándar', card: { name: 'Charizard ex', img: pokeImg('sv3', 125) } }],
  },
  onepiece: {
    level: 'Casual', favCard: { name: 'Monkey.D.Luffy (ST01-001)', img: opImg('ST01-001') }, colors: ['red'], formats: ['Estándar'],
    decks: [{ id: 3, name: 'Luffy de inicio', format: 'Estándar', card: { name: 'Monkey.D.Luffy (ST01-001)', img: opImg('ST01-001') } }],
  },
};
const DEFAULT_ME = {
  name: 'Planeswalker', age: 28, avatar: '', game: 'magic', profiles: DEFAULT_PROFILES,
  bio: 'Jugador de cartas de toda la vida. Busco mesa fija entre semana y algún torneo de tienda.',
  stores: ['s1'], days: ['X', 'V'], slots: ['Tarde'],
  radius: 5, onlyVerified: false,
  showDistance: true, visible: true,
  notif: { matches: true, messages: true, events: false },
};
/* Convierte un perfil guardado con la versión anterior (solo Magic) al formato de varios juegos */
const migrateMe = (v) => {
  const me = { ...DEFAULT_ME, ...v, notif: { ...DEFAULT_ME.notif, ...v.notif } };
  if (v.profiles) me.profiles = { ...DEFAULT_PROFILES, ...v.profiles };
  else {
    const m = DEFAULT_PROFILES.magic;
    me.game = 'magic';
    me.profiles = {
      ...DEFAULT_PROFILES,
      magic: {
        level: v.level ?? m.level, colors: v.colors ?? m.colors, formats: v.formats ?? m.formats,
        favCard: typeof v.favCard === 'string' ? { name: v.favCard } : m.favCard,
        decks: (v.decks ?? m.decks).map((d, i) => ({ id: d.id ?? i, name: d.name, format: d.format, card: d.card ?? { name: d.commander } })),
      },
    };
  }
  ['favCard', 'colors', 'formats', 'level', 'decks', 'games', 'showAge'].forEach((k) => delete me[k]);
  if (typeof me.avatar !== 'string' || (me.avatar && !me.avatar.startsWith('data:image/'))) me.avatar = '';
  if (!GAMES[me.game]) me.game = 'magic';
  return me;
};

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
const REPORT_REASONS = [
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
const fuzzyDist = (km) => km < 1 ? 'A menos de 1 km' : km < 2 ? 'A 1–2 km' : km < 5 ? 'A 2–5 km' : 'A más de 5 km';
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
    const entry = { popped: false, onPop() { this.popped = true; cb.current(); } };
    backStack.push(entry);
    history.pushState({ mm: true }, '');
    return () => {
      const i = backStack.indexOf(entry);
      if (i !== -1) backStack.splice(i, 1);
      if (!entry.popped) { ignorePop++; history.back(); }
    };
  }, [active]);
}

/* Respeta la opción del sistema "reducir movimiento" */
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
const prof = (me) => me.profiles[me.game];
const artOf = (game, card) => GAMES[game].art(card);
const fullOf = (game, card) => GAMES[game].full(card);
/* Las cartas de Pokémon y One Piece son la carta completa: se encuadra hacia la ilustración */
const imgCls = (game) => (game === 'magic' ? '' : ` full-card fc-${game}`);
const myAvatar = (me) => me.avatar || artOf(me.game, prof(me).favCard);
const avatarIsCard = (me, game = me.game) => (!me.avatar && game !== 'magic' ? game : false);
const frameOf = (game, colors) => {
  const pal = GAMES[game].palette;
  const c = (colors.length ? colors : [Object.keys(pal)[0]]).map((k) => pal[k].color);
  return { list: c, grad: c.length > 1 ? `linear-gradient(135deg, ${c.join(', ')})` : c[0], glow: c[0] };
};
const toggleIn = (arr, v) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
const Pips = ({ game, colors }) => (
  <div className="pips">{colors.map((c) => <span key={c} className="pip" title={GAMES[game].palette[c].label} style={{ '--c': GAMES[game].palette[c].color }} />)}</div>
);
const Empty = ({ icon, title, text }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
);
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
  <div className="tags">{options.map((o) => <button type="button" key={o} className={`tag ${value.includes(o) ? 'on' : ''}`} aria-pressed={value.includes(o)} onClick={() => (toggle ? toggle(o) : onChange(toggleIn(value, o)))}>{o}</button>)}</div>
);
const ModNote = ({ kind }) => kind && (
  <div className={`mod-note ${kind === 'rate' ? 'contact' : kind}`} role="alert">{kind === 'conduct' ? I.ban : I.alert}<span>{MOD_TEXT[kind]}</span></div>
);
const GameTag = ({ game }) => <span className={`game-tag g-${game}`}>{GAME_ICON[game]}{GAMES[game].name}</span>;
const GAME_OPTIONS = GAME_IDS.map((g) => [g, GAMES[g].name, GAME_ICON[g]]);

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
      {badge && <span className="role-badge">{I.sword}{badge}</span>}
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
function TableCard({ p, leaving, onInfo }) {
  const ref = useRef(null);
  // Inclinación 3D sutil hacia el puntero (máx. ~6°); el reflejo y la ilustración también lo siguen
  const tilt = (e) => {
    const el = ref.current, r = el.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${mx * 100}%`);
    el.style.setProperty('--my', `${my * 100}%`);
    if (reducedMotion()) return;
    el.style.setProperty('--ry', `${(mx - 0.5) * 12}deg`);
    el.style.setProperty('--rx', `${(0.5 - my) * 10}deg`);
  };
  const untilt = () => { ['--rx', '--ry'].forEach((v) => ref.current?.style.setProperty(v, '0deg')); };
  const { grad, glow, list } = frameOf(p.game, p.colors);
  const deck = p.decks[0];
  return (
    <article
      ref={ref} className={`swipe-card table-card g-${p.game}${leaving ? ' leaving' : ''}`}
      style={{ '--frame': grad, '--glow': glow, transform: LEAVE[leaving] ?? 'perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))' }}
      onPointerMove={tilt} onPointerLeave={untilt} onPointerCancel={untilt}
    >
      <div className="art-frame">
        <img className={`hero-art${imgCls(p.game)}`} src={artOf(p.game, p.favCard)} alt={`Carta ${p.favCard.name}`} draggable="false" />
        <div className="foil" />
        <div className="hero-top">
          <span className="glass-chip game-chip">{GAME_ICON[p.game]}{GAMES[p.game].name}</span>
          <span className="glass-chip dist-chip">{I.pin}{fuzzyDist(p.dist)}</span>
        </div>
      </div>
      <div className="hero-body" role="button" tabIndex={0} aria-label={`Ver la ficha de ${p.name}`}
        onClick={onInfo} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onInfo(); } }}>
        <Hex src={p.avatar} alt={p.name} size={100} badge={p.formats[0]} colors={list} />
        <h2 className="hero-name">{p.name}{p.verified && <span className="verified" title={`Verificado en ${storeName(p.stores[0])}`}>{I.check}</span>}</h2>
        <div className="hero-deck">{I.deck}<b>{deck.name}</b><i className="dot-sep" />{deck.format}</div>
        <div className="hero-tags">
          <Pips game={p.game} colors={p.colors} />
          <span className="hero-fav">{GAME_ICON[p.game]}{p.favCard.name}</span>
        </div>
        <div className="hero-sub">{I.store}{storeName(p.stores[0])}<i className="dot-sep" />{p.level}</div>
      </div>
      <div className={`stamp like${leaving === 'like' || leaving === 'super' ? ' show' : ''}`}>¡Duelo!</div>
      <div className={`stamp nope${leaving === 'nope' ? ' show' : ''}`}>Paso</div>
    </article>
  );
}

/* ================= Profile sheet ================= */
function ProfileSheet({ p, onClose, onLike, onReport, onBlock }) {
  const { list } = frameOf(p.game, p.colors);
  const pal = GAMES[p.game].palette;
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <section className={`sheet g-${p.game}`} aria-label={`Perfil de ${p.name}`}>
        <button id="close-profile" className="icon-btn glass close" onClick={onClose} aria-label="Cerrar">{I.close}</button>
        {/* La cabecera se desplaza con el contenido para no tapar el texto al hacer scroll */}
        <div className="sheet-scroll">
        <div className="sheet-hero">
          <img className={imgCls(p.game).trim()} src={artOf(p.game, p.favCard)} alt="" />
          <span className="sheet-handle" />
        </div>
        <div className="body">
          <div className="sheet-id">
            <Hex src={p.avatar} alt={p.name} size={84} colors={list} ring={false} />
            <div>
              <GameTag game={p.game} />
              <h2 className="sheet-name">{p.name}{p.verified && <span className="verified" title="Verificado">{I.check}</span>}</h2>
              <div className="sheet-sub">{[p.level, ...p.formats.filter((f) => f !== p.level)].join(' · ')}</div>
            </div>
          </div>
          <div className="info-pills">
            {p.verified && <span className="info-pill ok">{I.shield}Verificado en {storeName(p.stores[0])}</span>}
            <span className="info-pill">{I.user}Mayor de 18</span>
            <span className="info-pill">{I.pin}{fuzzyDist(p.dist)}</span>
            <span className="info-pill">{I.clock}{p.availability}</span>
          </div>
          <p className="bio">{p.bio}</p>

          <h3 className="section-title">Mazos</h3>
          <div className="decks">
            {p.decks.map((d) => (
              <div key={d.name} className="deck-card">
                <img loading="lazy" decoding="async" className={imgCls(p.game).trim()} src={artOf(p.game, d.card)} alt="" />
                <span className="deck-format">{d.format}</span>
                <div><b>{d.name}</b><small>{GAMES[p.game].keyCard(d.format)}: {d.card.name}</small></div>
              </div>
            ))}
          </div>

          <h3 className="section-title">{GAMES[p.game].paletteLabel}</h3>
          <div className="tags">
            {p.colors.map((c) => <span key={c} className="tag color-tag"><span className="pip" style={{ '--c': pal[c].color }} />{pal[c].label}</span>)}
          </div>

          <h3 className="section-title">{GAMES[p.game].favLabel}</h3>
          <div className="fav-wrap"><img loading="lazy" decoding="async" className="fav-full" src={fullOf(p.game, p.favCard)} alt={p.favCard.name} /></div>

          <h3 className="section-title">Dónde juega</h3>
          <div className="list">
            {p.stores.map((id) => {
              const s = STORES.find((x) => x.id === id);
              return (
                <div key={id} className="row">
                  <span className="row-icon">{I.store}</span>
                  <div className="grow"><div className="title">{s.name}</div><div className="sub">{s.events}</div></div>
                  <span className="dist">{s.dist} km</span>
                </div>
              );
            })}
          </div>

          <div className="safety-actions">
            <button id="block-user" className="ghost small" onClick={onBlock}>{I.ban}Bloquear</button>
            <button id="report-user" className="ghost small danger" onClick={onReport}>{I.flag}Denunciar</button>
          </div>
        </div>
        </div>
        {onLike && (
          <div className="sheet-cta">
            <button id="like-from-profile" className="primary" onClick={onLike}>{I.sword}Retar a una partida</button>
          </div>
        )}
      </section>
    </>
  );
}

/* ================= Denunciar ================= */
function ReportSheet({ p, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  return (
    <>
      <div className="sheet-bg top" onClick={onClose} />
      <section className="sheet edit-sheet top" aria-label={`Denunciar a ${p.name}`}>
        <header className="sheet-bar">
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">{I.close}</button>
          <h2>Denunciar a {p.name}</h2>
          <span style={{ width: 44 }} />
        </header>
        <div className="body form">
          <p className="sheet-intro">Tu denuncia es anónima: {p.name} no sabrá quién la ha enviado. El equipo la revisa en menos de 24 horas.</p>
          <fieldset><legend>¿Qué ha pasado?</legend>
            <div className="list">
              {REPORT_REASONS.map((r) => (
                <button type="button" key={r} role="radio" aria-checked={reason === r} className={`row pick radio ${reason === r ? 'on' : ''}`} onClick={() => setReason(r)}>
                  <span className="radio-dot" /><div className="grow"><div className="title">{r}</div></div>
                </button>
              ))}
            </div>
          </fieldset>
          <label>Cuéntanos más (opcional)<textarea id="report-details" rows="3" maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Qué dijo o hizo, cuándo…" /></label>
          <Switch id="report-block" icon={I.ban} label={`Bloquear también a ${p.name}`} hint="No podrá verte ni escribirte" on={alsoBlock} onChange={setAlsoBlock} />
        </div>
        <div className="sheet-cta">
          <button id="send-report" className="primary danger-fill" disabled={!reason} onClick={() => onSubmit({ reason, details, alsoBlock })}>{I.flag}Enviar denuncia</button>
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
          <button className="ghost" onClick={onClose}>Cancelar</button>
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
  const busy = state === 'google' || state === 'sending';
  return (
    <div className="login" role="dialog" aria-label="Iniciar sesión">
      <div className="login-rain" aria-hidden="true">
        {LOGIN_ROWS.map((row, r) => (
          <div key={r} className={`rain-row ${r ? 'down' : 'up'}`}>
            <div className="rain-track">{[...row, ...row, ...row].map((c, i) => <img key={c.key + i} src={c.src} alt="" />)}</div>
          </div>
        ))}
      </div>
      <div className="sparks">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i, '--c': LOGIN_SPARKS[i % LOGIN_SPARKS.length] }} />)}</div>
      <div className="duel-icon" aria-hidden="true">{SWORD}{SWORD}</div>
      <p className="its">Bienvenido a</p>
      <h1 className="match-title" data-text="MANAMATCH">MANAMATCH</h1>
      <p className="swiped">Encuentra rivales de Magic, Pokémon y One Piece cerca de ti.<br />Solo para mayores de 18.</p>

      <button id="login-google" type="button" className="login-google" disabled={busy} onClick={google}>{GOOGLE_G}{state === 'google' ? 'Abriendo Google…' : 'Continuar con Google'}</button>

      <div className="login-or"><span>o con tu correo</span></div>

      {state === 'sent' ? (
        <p className="login-note" role="status">{I.check}<span>Te hemos enviado un enlace a <b>{email.trim()}</b>. Ábrelo desde este dispositivo para entrar.</span></p>
      ) : (
        <form className="match-reply" onSubmit={sendLink}>
          <input id="login-email" type="email" required autoComplete="email" aria-label="Correo electrónico" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button id="login-email-send" disabled={busy || !email.trim()}>{state === 'sending' ? 'Enviando…' : 'Enviar enlace'}</button>
        </form>
      )}
      {state === 'error' && <p className="login-note error" role="alert">{I.alert}<span>No se ha podido iniciar sesión. Inténtalo de nuevo en unos minutos.</span></p>}

      <p className="login-legal">{I.shield}Nunca publicamos en tu nombre</p>
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
      {Array.from({ length: count }, (_, i) => <button key={i} type="button" className={page === i ? 'on' : ''} aria-label={`Ir a la pantalla ${i + 1}`} aria-current={page === i} onClick={() => go(i)} />)}
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
    <div className="rules" role="dialog" aria-label="Código de conducta">
      {!firstTime && <button className="icon-btn rules-close" onClick={onClose} aria-label="Cerrar">{I.close}</button>}
      <div className="rules-slides" ref={track} onScroll={onScroll}>
        <section className={slide(0)}>
          <div className="rule-hero">{I.sword}</div>
          <span className="eyebrow">{firstTime ? 'Bienvenido a ManaMatch' : 'ManaMatch'}</span>
          <h1 className="rules-title">Código de conducta</h1>
          <p className="rules-lead">Encuentra rivales de Magic, Pokémon y One Piece cerca de ti. <b>No es una app de citas:</b> aquí se viene a jugar.</p>
          <p className="slide-hint">Desliza para ver las {RULES.length} normas</p>
        </section>
        {RULES.map(([icon, title, text, anim], i) => (
          <section key={title} className={slide(i + 1)} aria-label={`Norma ${i + 1} de ${RULES.length}`}>
            <div className="rule-hero"><RuleArt anim={anim} icon={icon} /><span className="rule-num">{i + 1}</span></div>
            <span className="eyebrow">Norma {i + 1} de {RULES.length}</span>
            <h2 className="rules-title">{title}</h2>
            <p className="rules-lead">{text}</p>
          </section>
        ))}
        <section className={`${slide(last)} final`}>
          <div className="rule-hero small"><RuleArt anim="shield" /></div>
          <span className="eyebrow">Antes de jugar</span>
          <h2 className="rules-title">Consejos de seguridad</h2>
          <ul className="tip-list">{SAFETY_TIPS.map((t) => <li key={t}>{I.check}<span>{t}</span></li>)}</ul>
          {firstTime && (
            <div className="rules-checks">
              <button type="button" role="checkbox" aria-checked={adult} className={`check-row ${adult ? 'on' : ''}`} onClick={() => setAdult(!adult)}><span className="box">{adult && I.check}</span>Tengo 18 años o más</button>
              <button type="button" role="checkbox" aria-checked={agree} className={`check-row ${agree ? 'on' : ''}`} onClick={() => setAgree(!agree)}><span className="box">{agree && I.check}</span>Acepto el código de conducta</button>
            </div>
          )}
        </section>
      </div>
      <div className="rules-cta">
        {dots}
        {page < last
          ? <button id="rules-next" className="primary" onClick={() => go(page + 1)}>{page === 0 ? 'Empezar' : 'Siguiente'}{I.chevron}</button>
          : firstTime
            ? <button id="accept-rules" className="primary" disabled={!adult || !agree} onClick={onAccept}>{I.sword}Entrar a jugar</button>
            : <button className="primary" onClick={onClose}>Entendido</button>}
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
    <div className="rules norms" role="dialog" aria-label="Normas y sanciones">
      <button className="icon-btn rules-close" onClick={onClose} aria-label="Cerrar">{I.close}</button>
      <div className="rules-slides" ref={track} onScroll={onScroll}>
        <section className={slide(0)}>
          <div className="rule-hero"><NormArt art="scale" /></div>
          <span className="eyebrow">Comunidad ManaMatch</span>
          <h1 className="rules-title">Normas y sanciones</h1>
          <p className="rules-lead">Las infracciones van en tres niveles. <b>Cuanto más grave, más dura la sanción</b>, y si se repite, sube un escalón.</p>
          <p className="slide-hint">Desliza para verlas</p>
        </section>
        {NORMS.map(({ level, sev, art, items, ladder }, i) => (
          <section key={level} className={`${slide(i + 1)} dense`} aria-label={`Infracciones ${level.toLowerCase()}`}>
            <div className={`rule-hero small sev-${sev}`}><NormArt art={art} /></div>
            <span className="eyebrow">Nivel {i + 1} de {NORMS.length}</span>
            <h2 className="rules-title">{level}</h2>
            <ul className={`tip-list norm-list sev-${sev}`}>{items.map((t) => <li key={t}><span className="norm-dot" /><span>{t}</span></li>)}</ul>
            <div className={`ladder sev-${sev}`} aria-label="Sanción">
              {ladder.map((step, n) => (
                <div key={step} className="ladder-step" style={{ '--n': n }}>
                  {ladder.length > 1 && <span>{n + 1}.ª vez</span>}
                  <b>{step}</b>
                </div>
              ))}
            </div>
          </section>
        ))}
        <section className={`${slide(NORMS.length + 1)} dense`}>
          <div className="rule-hero small"><NormArt art="cards" /></div>
          <span className="eyebrow">Como en los torneos</span>
          <h2 className="rules-title">Sanciones</h2>
          <ul className="tip-list sanction-list">
            {SANCTIONS.map(([id, name, text]) => <li key={id}><span className={`mini-card s-${id}`}>{SANCTION_MARK[id]}</span><div><b>{name}</b><p>{text}</p></div></li>)}
          </ul>
        </section>
        <section className={`${slide(last)} dense`}>
          <div className="rule-hero small"><NormArt art="clock" /></div>
          <span className="eyebrow">Justo y transparente</span>
          <h2 className="rules-title">Cómo funciona</h2>
          <ul className="tip-list sanction-list">
            {NORMS_PROCESS.map(([icon, title, text]) => <li key={title}><span className="process-icon">{icon}</span><div><b>{title}</b><p>{text}</p></div></li>)}
          </ul>
        </section>
      </div>
      <div className="rules-cta">
        {dots}
        {page < last
          ? <button id="norms-next" className="primary" onClick={() => go(page + 1)}>{page === 0 ? 'Empezar' : 'Siguiente'}{I.chevron}</button>
          : <button id="norms-done" className="primary" onClick={onClose}>Entendido</button>}
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

function ThrowCard({ card, index, total, disabled, targetRef, onPlay, onTap }) {
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

  const down = (e) => {
    if (disabled || phase !== 'idle') return;
    try { ref.current.setPointerCapture(e.pointerId); } catch { /* sin captura, el gesto sigue funcionando */ }
    drag.current = { x0: e.clientX, y0: e.clientY, moved: false, samples: [[e.clientY, e.timeStamp]] };
    setPhase('drag');
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (Math.hypot(dx, dy) > 6) d.moved = true;
    d.samples = [...d.samples.slice(-4), [e.clientY, e.timeStamp]];
    setPos({ x: dx, y: rest.y + dy, r: rest.r * 0.3 + dx / 14, s: 1.12 });
  };
  const up = () => {
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
      className={`hand-card ${card.id} ${phase}`}
      aria-label={`Carta ${card.label}: ${card.hint}. Lánzala hacia arriba para jugarla.`} title={card.label}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.r}deg) scale(${pos.s})`, zIndex: phase === 'drag' || phase === 'fly' ? 20 : index + 1 }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      // Teclado (detail === 0): Intro o Espacio lanzan la carta directamente
      onClick={(e) => { if (e.detail === 0 && !disabled && phase === 'idle') throwTo(); }}
    >
      <span className="hc-frame">
        <span className="hc-gem"><svg className="hc-hex" viewBox="0 0 100 112" aria-hidden="true"><path d={HEX_PHOTO} /></svg>{card.icon}</span>
        <span className="hc-name">{card.label}</span>
      </span>
    </button>
  );
}

/* ================= Discover ================= */
function Discover({ queue, me, onDecide, onInfo, onRewind, canRewind }) {
  // Por defecto se muestran jugadores del juego de tu perfil activo
  const [filter, setFilter] = useState(me.game);
  const [leaving, setLeaving] = useState(null);
  const [impact, setImpact] = useState(null);
  const [tipSeen, setTipSeen] = useStoredState('manamatch-hand-tip', false);
  const [tapHint, setTapHint] = useState(false);
  const tableRef = useRef(null);
  const impactKey = useRef(0);
  const list = queue.filter((p) =>
    (filter === 'all' || p.game === filter) && p.dist <= me.radius && (!me.onlyVerified || p.verified));
  const [top, next] = list;

  // Jugar una carta: impacto sobre el jugador y, después, su salida de la mesa
  const play = (id) => {
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
      <div className="filters">
        {[['all', 'Todos', null], ...GAME_OPTIONS].map(([id, label, icon]) => (
          <button key={id} id={`filter-${id}`} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>{icon}{label}</button>
        ))}
      </div>
      <div className="deck" ref={tableRef}>
        {!top && <Empty icon={GAME_ICON[filter] ?? I.crystal} title="No hay más jugadores" text="Prueba con otro juego, amplía tu radio de búsqueda o vuelve más tarde." />}
        {next && (
          <article className="swipe-card behind">
            <div className="art-frame"><img className={`hero-art${imgCls(next.game)}`} src={artOf(next.game, next.favCard)} alt="" /></div>
          </article>
        )}
        {top && <TableCard key={top.id} p={top} leaving={leaving} onInfo={() => onInfo(top)} />}
        {impact && (
          <div key={impact.key} className={`impact ${impact.id}`} aria-hidden="true" onAnimationEnd={(e) => { if (e.target === e.currentTarget) setImpact(null); }}>
            <span className="impact-ring" /><span className="impact-icon">{HAND.find((c) => c.id === impact.id).icon}</span>
          </div>
        )}
        <div className="hand" role="group" aria-label="Tu mano: lanza una carta hacia arriba para jugarla">
          {(top || canRewind) && (!tipSeen || tapHint) && <div className="hand-tip" role="status">{I.sword}Arrastra una carta hacia arriba y lánzala</div>}
          {HAND.map((c, i) => (
            <ThrowCard
              key={c.id} card={c} index={i} total={HAND.length} targetRef={tableRef} onPlay={play} onTap={showTapHint}
              disabled={!!leaving || (c.id === 'rewind' ? !canRewind : !top)}
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
const fuzzyPos = (p) => {
  const band = p.dist < 1 ? 0.32 : p.dist < 2 ? 0.55 : 0.78;
  const a = ((p.id * 137 + 40) % 360) * (Math.PI / 180);
  return { left: `${50 + Math.cos(a) * band * 46}%`, top: `${50 + Math.sin(a) * band * 46}%` };
};
const storePos = (km, i, n) => {
  const a = ((i + 0.5) / n) * Math.PI * 2 + 0.6;
  const r = Math.min(km / 4.5, 0.92) * 50;
  return { left: `${50 + Math.cos(a) * r}%`, top: `${50 + Math.sin(a) * r}%` };
};

function Nearby({ players, onInfo }) {
  return (
    <>
      <div className="radar" role="img" aria-label="Radar de jugadores cercanos">
        <div className="me" />
        {players.map((p) => (
          <button key={p.id} className="dot" style={{ ...fuzzyPos(p), '--c': frameOf(p.game, p.colors).glow }} onClick={() => onInfo(p)} title={`${p.name} · ${GAMES[p.game].name} · ${fuzzyDist(p.dist)}`}>
            <img src={p.avatar} alt={p.name} />
            <span className={`dot-game g-${p.game}`}>{GAME_ICON[p.game]}</span>
          </button>
        ))}
        {STORES.map((s, i) => <span key={s.id} className="shop" title={s.name} style={storePos(s.dist, i, STORES.length)}>{I.store}</span>)}
      </div>
      <div className="legend"><span><i className="lg-player" />Jugadores (zona aproximada)</span><span><i className="lg-store" />Tiendas</span></div>
      <p className="privacy-note">{I.shield}Por tu seguridad, nunca mostramos dónde está un jugador: solo su rango de distancia.</p>

      <h3 className="section-title">Tiendas cercanas</h3>
      <div className="list">
        {STORES.map((s) => {
          const regulars = players.filter((p) => p.stores.includes(s.id));
          return (
            <div key={s.id} className="row">
              <span className="row-icon">{I.store}</span>
              <div className="grow">
                <div className="title">{s.name}</div>
                <div className="sub">{s.events}</div>
                <div className="regulars">
                  <div className="stack">{regulars.slice(0, 3).map((p) => <img loading="lazy" decoding="async" key={p.id} src={p.avatar} alt={p.name} />)}</div>
                  <span>{regulars.length} {regulars.length === 1 ? 'habitual' : 'habituales'}</span>
                </div>
              </div>
              <span className="dist">{s.dist} km</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ================= Matches + Chat ================= */
function Matches({ matches, chats, openChat }) {
  if (!matches.length) return <Empty icon={I.chat} title="Aún no tienes rivales" text="Desliza a la derecha para retar a alguien y proponer una partida." />;
  return (
    <>
      <h3 className="section-title">Nuevos rivales</h3>
      <div className="new-matches">
        {matches.map((p) => (
          <button key={p.id} className="nm" onClick={() => openChat(p)}>
            <Hex src={p.avatar} alt={p.name} size={68} colors={frameOf(p.game, p.colors).list} ring={false} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
      <h3 className="section-title">Conversaciones</h3>
      <div className="list">
        {matches.map((p) => {
          const last = chats[p.id]?.at(-1);
          return (
            <button key={p.id} id={`match-${p.id}`} className="row" onClick={() => openChat(p)}>
              <img loading="lazy" decoding="async" className="avatar" src={p.avatar} alt="" />
              <div className="grow">
                <div className="title">{p.name} <span className={`mini-game g-${p.game}`}>{GAME_ICON[p.game]}</span></div>
                <div className={`sub ${last ? '' : 'new'}`}>{last ? (last.type === 'meetup' ? '📅 Partida propuesta' : last.text) : '¡Duelo aceptado! Propón una partida'}</div>
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
  const mine = me.profiles[p.game]?.formats ?? [];
  const shared = p.formats.find((f) => mine.includes(f)) || p.formats[0];
  return [`¿Una partida de ${shared} esta semana?`, `¿Jugamos en ${storeName(p.stores[0])}?`, '¿Qué mazo vas a traer?'];
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

function Chat({ p, me, msgs, onSend, onBack, onInfo, onReport }) {
  const [text, setText] = useState('');
  const [planning, setPlanning] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(true);
  const [plan, setPlan] = useState({ store: p.stores[0], date: '', format: p.formats[0] });
  const [sendText, warn, clearWarn] = useModeratedSend((t) => onSend({ type: 'text', from: 'me', text: t }));

  const send = (e) => { e.preventDefault(); if (sendText(text)) setText(''); };
  const propose = () => { onSend({ type: 'meetup', from: 'me', ...plan }); setPlanning(false); };

  const theirs = frameOf(p.game, p.colors);
  const formats = [...new Set([...p.formats, ...(me.profiles[p.game]?.formats ?? [])])];
  return (
    <div className={`chat g-${p.game}`} style={{ '--them': theirs.glow, '--them-grad': theirs.grad }}>
      <div className="chat-head">
        <button id="chat-back" className="icon-btn" onClick={onBack} aria-label="Volver">{I.back}</button>
        <button className="chat-who" onClick={() => onInfo(p)}>
          <Hex src={p.avatar} alt="" size={46} colors={theirs.list} ring={false} />
          <div><b>{p.name}</b><span>{GAME_ICON[p.game]}{p.decks[0].name}</span></div>
        </button>
        <Pips game={p.game} colors={p.colors} />
        <button id="chat-report" className="icon-btn" onClick={onReport} aria-label={`Denunciar o bloquear a ${p.name}`} title="Denunciar o bloquear">{I.flag}</button>
      </div>
      {safetyOpen && (
        <div className="safety-banner">
          {I.shield}
          <span>Quedad siempre en una tienda y no compartas tu dirección. Si algo no va bien, denúncialo con la bandera.</span>
          <button onClick={() => setSafetyOpen(false)} aria-label="Ocultar aviso">{I.close}</button>
        </div>
      )}
      <div className="msgs">
        <div className="turn-divider"><span>{GAME_ICON[p.game]}Duelo de {GAMES[p.game].name} · {p.formats[0]}</span></div>
        {!msgs.length && <div className="chat-start">Propón formato, tienda y día para vuestra partida.</div>}
        {msgs.map((m, i) => m.type === 'meetup' ? (
          <div key={i} className={`msg meetup ${m.from}`}>
            <div className="ticket-head">{I.cal}<b>Partida propuesta</b></div>
            <div className="ticket-body">
              <div><small>Formato</small>{m.format}</div>
              <div><small>Tienda</small>{storeName(m.store)}</div>
              <div><small>Cuándo</small>{m.date ? new Date(m.date).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Por concretar'}</div>
            </div>
            {m.from === 'them' && <div className="ticket-ok">{I.check}{p.name} ha aceptado</div>}
          </div>
        ) : <div key={i} className={`msg ${m.from}`}>{m.text}</div>)}
      </div>
      {planning && (
        <div className="panel form plan">
          <label>Tienda<select id="plan-store" value={plan.store} onChange={(e) => setPlan({ ...plan, store: e.target.value })}>{STORES.map((s) => <option key={s.id} value={s.id}>{s.name}{p.stores.includes(s.id) ? ' ★' : ''}</option>)}</select></label>
          <label>Formato<select id="plan-format" value={plan.format} onChange={(e) => setPlan({ ...plan, format: e.target.value })}>{formats.map((f) => <option key={f}>{f}</option>)}</select></label>
          <label>Fecha y hora<input id="plan-date" type="datetime-local" value={plan.date} onChange={(e) => setPlan({ ...plan, date: e.target.value })} /></label>
          <p className="field-hint">{I.store}Las partidas se proponen solo en tiendas: siempre en un sitio público.</p>
          <div className="btn-row"><button className="ghost" onClick={() => setPlanning(false)}>Cancelar</button><button id="plan-send" className="primary" onClick={propose}>Proponer partida</button></div>
        </div>
      )}
      {msgs.length < 3 && !planning && (
        <div className="quick">{quickReplies(p, me).map((q) => <button key={q} type="button" onClick={() => { setText(q); clearWarn(); }}>{q}</button>)}</div>
      )}
      <ModNote kind={warn} />
      <form className="composer" onSubmit={send}>
        <button type="button" id="btn-plan" className={`icon-btn plan-btn ${planning ? 'on' : ''}`} aria-label="Proponer partida" onClick={() => setPlanning((v) => !v)}>{I.cal}</button>
        <input id="chat-input" placeholder="Escribe un mensaje…" value={text} onChange={(e) => { setText(e.target.value); if (warn === 'conduct') clearWarn(); }} />
        <button id="chat-send" className="icon-btn send" aria-label={warn === 'contact' ? 'Enviar igualmente' : 'Enviar'} disabled={!text.trim()}>{I.send}</button>
      </form>
    </div>
  );
}

/* ================= Buscador de cartas del juego ================= */
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
          {loading ? <><span className="spinner" />Buscando cartas…</> : failed ? 'No se ha podido buscar. Revisa la conexión e inténtalo de nuevo.' : 'Sin resultados con ese nombre.'}
        </p>
      )}
      {open && suggestions.length > 0 && (
        <ul className="suggest" role="listbox">
          {suggestions.map((s) => (
            <li key={s.name + (s.img ?? '')}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}>
                {s.img && <img src={s.img} alt="" loading="lazy" />}
                <span><b>{s.name}</b>{s.sub && <small>{s.sub}</small>}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {game === 'onepiece' && <p className="field-hint">Busca por nombre de líder o escribe el código de la carta (p. ej. OP05-060).</p>}
    </div>
  );
}

/* ================= Editar perfil ================= */
function EditProfileSheet({ me, onSave, onClose }) {
  const [d, setD] = useState(me);
  // Los cambios se calculan sobre el estado más reciente (patch puede ser una función) para no perder pulsaciones rápidas
  const set = (patch) => setD((x) => ({ ...x, ...(typeof patch === 'function' ? patch(x) : patch) }));
  const p = d.profiles[d.game];
  const setProf = (patch) => setD((x) => {
    const cur = x.profiles[x.game];
    return { ...x, profiles: { ...x.profiles, [x.game]: { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) } } };
  });
  const game = GAMES[d.game];
  const fileRef = useRef(null);

  const [uploadError, setUploadError] = useState('');
  const upload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadError('Ese archivo no es una imagen.'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError('La foto pesa demasiado (máximo 10 MB).'); return; }
    setUploadError('');
    // Reducimos la foto a 320px para que quepa en el almacenamiento del navegador
    const img = new Image();
    img.onload = () => {
      const s = 320, c = document.createElement('canvas');
      const k = Math.max(s / img.width, s / img.height);
      c.width = s; c.height = s;
      c.getContext('2d').drawImage(img, (s - img.width * k) / 2, (s - img.height * k) / 2, img.width * k, img.height * k);
      // Al redibujarla en un canvas se eliminan los metadatos (EXIF), incluida la ubicación GPS de la foto
      set({ avatar: c.toDataURL('image/jpeg', 0.85) });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => { setUploadError('No se ha podido leer la imagen.'); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(file);
  };

  const bioFlag = checkMessage(d.bio) === 'conduct' ? 'conduct' : null;
  const ageOk = d.age >= 18 && d.age <= 99;
  const valid = d.name.trim() && ageOk && p.colors.length && p.formats.length && !bioFlag;
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <section className="sheet edit-sheet" aria-label="Editar perfil">
        <header className="sheet-bar">
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">{I.close}</button>
          <h2>Editar perfil</h2>
          <span style={{ width: 44 }} />
        </header>
        <div className="body form">
          <fieldset><legend>Perfil de juego que editas</legend>
            <Segmented name="Juego" value={d.game} onChange={(g) => set({ game: g })} options={GAME_OPTIONS} />
            <p className="field-hint">{I.palette}Cada juego tiene su propio perfil: carta favorita, colores, formatos y mazos. El que guardes como activo ambienta toda la app.</p>
          </fieldset>

          <div className="photo-edit">
            <Hex src={myAvatar(d)} alt="Tu imagen" size={96} colors={frameOf(d.game, p.colors).list} ring={false} fullCard={avatarIsCard(d)} />
            <div className="photo-actions">
              <span className="photo-hint">Por defecto usamos tu carta favorita. La foto personal es opcional.</span>
              <button type="button" id="upload-photo" className="ghost small" onClick={() => fileRef.current.click()}>{I.camera}Subir foto</button>
              {d.avatar && <button type="button" className="link-btn" onClick={() => set({ avatar: '' })}>Volver a mi carta</button>}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
              {uploadError && <span className="upload-error" role="alert">{uploadError}</span>}
            </div>
          </div>

          <div className="field-row">
            <label className="grow">Nombre de jugador<input id="edit-name" value={d.name} maxLength={24} onChange={(e) => set({ name: e.target.value })} /></label>
            <label style={{ width: 90 }}>Edad<input id="edit-age" type="number" min="18" max="99" value={d.age} onChange={(e) => set({ age: e.target.value === '' ? '' : +e.target.value })} /></label>
          </div>
          {d.age !== '' && !ageOk && <p className="upload-error" role="alert">{d.age < 18 ? 'ManaMatch es solo para mayores de 18.' : 'Revisa la edad: como máximo 99.'}</p>}
          {!d.name.trim() && <p className="upload-error" role="alert">Escribe un nombre de jugador.</p>}
          <p className="field-hint">{I.shield}Tu edad no se muestra a nadie: solo sirve para confirmar que eres mayor de 18.</p>
          <label>
            <span className="label-row">Sobre ti como jugador <small>{d.bio.length}/160</small></span>
            <textarea id="edit-bio" rows="3" maxLength={160} value={d.bio} placeholder="Qué juegas, qué buscas en una mesa…" onChange={(e) => set({ bio: e.target.value })} />
          </label>
          <ModNote kind={bioFlag} />

          <label>{game.favLabel} de {game.name}
            <CardInput key={d.game} id="edit-fav" game={d.game} value={p.favCard} onChange={(c) => setProf({ favCard: c })} placeholder="Busca una carta…" />
          </label>
          <div className={`fav-preview g-${d.game}`}><img className={imgCls(d.game).trim()} src={artOf(d.game, p.favCard)} alt="" /><span>{p.favCard.name}</span></div>

          <fieldset><legend>Nivel de juego</legend>
            <Segmented name="Nivel" value={p.level} onChange={(v) => setProf({ level: v })} options={LEVELS.map((l) => [l, l])} />
          </fieldset>

          <fieldset><legend>{game.paletteLabel}</legend>
            <div className="mana-picker">
              {Object.entries(game.palette).map(([k, m]) => (
                <button type="button" key={k} className={`mana ${p.colors.includes(k) ? 'on' : ''}`} style={{ '--c': m.color }} aria-pressed={p.colors.includes(k)} onClick={() => setProf((c) => ({ colors: toggleIn(c.colors, k) }))}>
                  <span className="pip" style={{ '--c': m.color }} />{m.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset><legend>Formatos de {game.name} (al menos uno)</legend><ChipPicker options={game.formats} value={p.formats} onChange={(v) => setProf({ formats: v })} toggle={(o) => setProf((c) => ({ formats: toggleIn(c.formats, o) }))} /></fieldset>

          <fieldset><legend>Disponibilidad</legend>
            <div className="days">
              {DAYS.map(([k, full]) => <button type="button" key={k} title={full} aria-label={full} aria-pressed={d.days.includes(k)} className={`day ${d.days.includes(k) ? 'on' : ''}`} onClick={() => set((x) => ({ days: toggleIn(x.days, k) }))}>{k}</button>)}
            </div>
            <ChipPicker options={SLOTS} value={d.slots} onChange={(v) => set({ slots: v })} toggle={(o) => set((x) => ({ slots: toggleIn(x.slots, o) }))} />
          </fieldset>

          <fieldset><legend>Tiendas habituales</legend>
            <div className="list">
              {STORES.map((s) => {
                const on = d.stores.includes(s.id);
                return (
                  <button type="button" key={s.id} className={`row pick ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => set((x) => ({ stores: toggleIn(x.stores, s.id) }))}>
                    <span className="row-icon">{I.store}</span>
                    <div className="grow"><div className="title">{s.name}</div><div className="sub">{s.dist} km · {s.events}</div></div>
                    <span className="check">{on && I.check}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
        <div className="sheet-cta">
          <button id="save-profile" className="primary" disabled={!valid} onClick={() => onSave({ ...d, name: d.name.trim() })}>{I.check}Guardar cambios</button>
        </div>
      </section>
    </>
  );
}

/* ================= Añadir mazo ================= */
function DeckSheet({ game, onSave, onClose }) {
  const g = GAMES[game];
  const [deck, setDeck] = useState({ name: '', format: g.formats[0], card: null });
  const valid = deck.name.trim() && deck.card;
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <section className="sheet edit-sheet" aria-label="Añadir mazo">
        <header className="sheet-bar">
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">{I.close}</button>
          <h2>Nuevo mazo de {g.name}</h2>
          <span style={{ width: 44 }} />
        </header>
        <div className="body form">
          <div className="deck-preview">
            {deck.card ? <img className={imgCls(game).trim()} src={artOf(game, deck.card)} alt="" /> : <div className="deck-ph">{GAME_ICON[game]}</div>}
            <span className="deck-format">{deck.format}</span>
            <b>{deck.name || 'Nombre del mazo'}</b>
          </div>
          <label>Nombre<input id="deck-name" value={deck.name} maxLength={32} placeholder="Ej. Luffy Morado" onChange={(e) => setDeck({ ...deck, name: e.target.value })} /></label>
          <label>Formato<select id="deck-format" value={deck.format} onChange={(e) => setDeck({ ...deck, format: e.target.value })}>{g.formats.map((f) => <option key={f}>{f}</option>)}</select></label>
          <label>{g.keyCard(deck.format)}
            <CardInput id="deck-card" game={game} value={deck.card} onChange={(c) => setDeck((x) => ({ ...x, card: c }))} placeholder="Busca una carta…" />
          </label>
        </div>
        <div className="sheet-cta">
          <button id="save-deck" className="primary" disabled={!valid} onClick={() => onSave({ ...deck, id: Date.now(), name: deck.name.trim() })}>{I.plus}Añadir mazo</button>
        </div>
      </section>
    </>
  );
}

/* ================= My profile ================= */
const THEMES = [['light', 'Día', I.sun], ['dark', 'Noche', I.moon], ['system', 'Auto', I.auto]];

function MyProfile({ me, setMe, matchCount, onEdit, onAddDeck, flash }) {
  const set = (patch) => setMe((x) => ({ ...x, ...patch }));
  const p = prof(me);
  const setProf = (patch) => setMe((x) => ({ ...x, profiles: { ...x.profiles, [x.game]: { ...x.profiles[x.game], ...patch } } }));
  const dayNames = DAYS.filter(([k]) => me.days.includes(k)).map(([, n]) => n.slice(0, 3)).join(', ');
  return (
    <>
      <div className="game-switch">
        <span className="game-switch-label">Perfil activo</span>
        <Segmented name="Perfil de juego" value={me.game} onChange={(g) => { set({ game: g }); flash(`Perfil de ${GAMES[g].name} activado`, GAME_ICON[g]); }} options={GAME_OPTIONS} />
      </div>

      <div className={`me-card g-${me.game}`}>
        <img className={`me-cover${imgCls(me.game)}`} src={artOf(me.game, p.favCard)} alt="" />
        <button id="edit-profile" className="icon-btn glass me-edit" aria-label="Editar perfil" onClick={onEdit}>{I.edit}</button>
        <button className="me-photo" onClick={onEdit} aria-label="Cambiar imagen">
          <Hex src={myAvatar(me)} size={108} badge={p.formats[0]} colors={frameOf(me.game, p.colors).list} fullCard={avatarIsCard(me)} />
          <span className="cam">{I.camera}</span>
        </button>
        <GameTag game={me.game} />
        <h2 className="me-name">{me.name}</h2>
        <div className="me-sub">{p.level}</div>
        <div className="me-fav">{GAME_ICON[me.game]}{p.favCard.name}</div>
        <Pips game={me.game} colors={p.colors} />
        {me.bio && <p className="me-bio">{me.bio}</p>}
        <div className="me-avail">{I.clock}{dayNames || 'Sin días'}{me.slots.length > 0 && ` · ${me.slots.join(', ')}`}</div>
        <div className="stats">
          <div><b>{p.decks.length}</b><span>Mazos</span></div>
          <div><b>{matchCount}</b><span>Rivales</span></div>
          <div><b>{me.stores.length}</b><span>Tiendas</span></div>
        </div>
      </div>
      <button className="primary edit-cta" onClick={onEdit}>{I.edit}Editar perfil</button>

      <h3 className="section-title">Mis mazos de {GAMES[me.game].name}</h3>
      <div className="decks">
        {p.decks.map((d) => (
          <div key={d.id ?? d.name} className="deck-card">
            <img loading="lazy" decoding="async" className={imgCls(me.game).trim()} src={artOf(me.game, d.card)} alt="" />
            <span className="deck-format">{d.format}</span>
            <button className="deck-del" aria-label={`Borrar ${d.name}`} onClick={() => setProf({ decks: p.decks.filter((x) => x !== d) })}>{I.trash}</button>
            <div><b>{d.name}</b></div>
          </div>
        ))}
        <button id="add-deck" className="deck-card add" onClick={onAddDeck}><span className="add-icon">{I.plus}</span>Añadir mazo<small>Formato y {GAMES[me.game].keyCard(GAMES[me.game].formats[0]).toLowerCase()}</small></button>
      </div>

      <h3 className="section-title">Verificación</h3>
      <div className="panel verify">
        <span className="verify-icon">{I.qr}</span>
        <div className="grow">
          <div className="setting-label">Verifícate en tu tienda</div>
          <div className="setting-hint">Enseña tu código al personal de {storeName(me.stores[0]) || 'tu tienda'} y conseguirás la insignia de jugador verificado.</div>
        </div>
        <button className="ghost small" onClick={() => flash('Código listo: enséñalo en la tienda', I.qr)}>Ver código</button>
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
      <div className="dialog" role="dialog" aria-label="Cambiar correo">
        <div className="dialog-icon">{I.mail}</div>
        <h3>Cambiar correo</h3>
        {state === 'sent' ? (
          <>
            <p>Te hemos enviado un enlace a <b>{current}</b> y otro a <b>{clean}</b>. Ábrelos los dos para confirmar el cambio.</p>
            <button className="primary" onClick={onClose}>Entendido</button>
          </>
        ) : (
          <form className="form dialog-form" onSubmit={submit}>
            <p>Ahora entras con <b>{current}</b>. Por seguridad, tendrás que confirmar desde las dos direcciones.</p>
            <input id="new-email" type="email" required autoComplete="email" placeholder="nuevo@correo.com" value={email} onChange={(e) => { setEmail(e.target.value); setState(null); }} />
            {same && <p className="upload-error" role="alert">Es el mismo correo que ya usas.</p>}
            {state === 'error' && <p className="upload-error" role="alert">No se ha podido cambiar. Revisa el correo o inténtalo más tarde.</p>}
            <div className="btn-row">
              <button type="button" className="ghost" onClick={onClose}>Cancelar</button>
              <button id="send-new-email" className="primary" disabled={!clean || same || state === 'sending'}>{state === 'sending' ? 'Enviando…' : 'Cambiar'}</button>
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
function DeleteAccountDialog({ onClose }) {
  const [word, setWord] = useState('');
  const [state, setState] = useState(null); // null | 'deleting' | 'error'
  const ok = word.trim().toUpperCase() === DELETE_WORD;
  const remove = async () => {
    setState('deleting');
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
      <div className="dialog" role="alertdialog" aria-label="Eliminar mi cuenta">
        <div className="dialog-icon">{I.trash}</div>
        <h3>¿Eliminar tu cuenta?</h3>
        <p>Se borrarán para siempre tu perfil, tus mazos, tus duelos y tus mensajes. No se puede deshacer.</p>
        <div className="form dialog-form">
          <label>Escribe <b>{DELETE_WORD}</b> para confirmar
            <input id="delete-word" autoComplete="off" autoCapitalize="characters" value={word} onChange={(e) => setWord(e.target.value)} />
          </label>
          {state === 'error' && <p className="upload-error" role="alert">No se ha podido eliminar la cuenta. Inténtalo de nuevo en unos minutos.</p>}
          <div className="btn-row">
            <button type="button" className="ghost" disabled={state === 'deleting'} onClick={onClose}>Cancelar</button>
            <button id="confirm-delete-account" className="primary danger-fill" disabled={!ok || state === 'deleting'} onClick={remove}>{state === 'deleting' ? 'Eliminando…' : 'Eliminar'}</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= Ajustes (se abren desde el botón de la rueda en el perfil) ================= */
function SettingsScreen({ me, setMe, theme, setTheme, blocked, onUnblock, onReset, onRules, onNorms, onWipe, installer, user, onSignOut, onClose }) {
  const set = (patch) => setMe((x) => ({ ...x, ...patch }));
  const [accountDialog, setAccountDialog] = useState(null); // 'email' | 'delete'
  useBack(!!accountDialog, () => setAccountDialog(null));
  // Cómo entró: con Google o con el enlace al correo (sin contraseña en ningún caso)
  const viaGoogle = user?.app_metadata?.provider === 'google';
  const setNotif = (k, v) => setMe((x) => ({ ...x, notif: { ...x.notif, [k]: v } }));
  const blockedPlayers = PLAYERS.filter((x) => blocked.includes(x.id));
  return (
    <div className="page" role="dialog" aria-label="Ajustes">
      <header className="page-bar">
        <button id="close-settings" className="icon-btn" onClick={onClose} aria-label="Volver al perfil">{I.back}</button>
        <h2>Ajustes</h2>
        <span style={{ width: 44 }} />
      </header>
      <div className="screen page-body">
        <h3 className="section-title">Apariencia</h3>
        <div className="panel">
          <div className="setting"><span className="setting-icon">{I.palette}</span><div className="grow"><div className="setting-label">Tema</div><div className="setting-hint">Auto sigue el modo de tu dispositivo</div></div></div>
          <Segmented name="Tema" value={theme} onChange={setTheme} options={THEMES} />
        </div>

        <h3 className="section-title">Búsqueda</h3>
        <div className="panel form">
          <label>
            <span className="label-row">Radio de búsqueda <b>{me.radius} km</b></span>
            <input id="radius" type="range" min="1" max="50" value={me.radius} onChange={(e) => set({ radius: +e.target.value })} style={{ '--p': `${((me.radius - 1) / 49) * 100}%` }} />
          </label>
          <Switch id="only-verified" icon={I.shield} label="Solo jugadores verificados" hint="Verificados en persona por una tienda" on={me.onlyVerified} onChange={(v) => set({ onlyVerified: v })} />
        </div>

        <h3 className="section-title">Privacidad</h3>
        <div className="panel settings">
          <Switch id="visible" icon={I.eye} label="Aparecer en Descubrir" hint="Si lo desactivas, nadie nuevo verá tu perfil" on={me.visible} onChange={(v) => set({ visible: v })} />
          <Switch id="show-distance" icon={I.pin} label="Mostrar mi rango de distancia" hint="Nunca se muestra tu ubicación exacta" on={me.showDistance} onChange={(v) => set({ showDistance: v })} />
        </div>

        <h3 className="section-title">Notificaciones</h3>
        <div className="panel settings">
          <Switch id="notif-matches" icon={I.sword} label="Nuevos duelos" on={me.notif.matches} onChange={(v) => setNotif('matches', v)} />
          <Switch id="notif-messages" icon={I.chat} label="Mensajes" on={me.notif.messages} onChange={(v) => setNotif('messages', v)} />
          <Switch id="notif-events" icon={I.bell} label="Eventos de mis tiendas" hint="Torneos, prereleases y ligas" on={me.notif.events} onChange={(v) => setNotif('events', v)} />
        </div>

        <h3 className="section-title">Seguridad</h3>
        <div className="list">
          <button id="open-rules" className="row" onClick={onRules}>
            <span className="row-icon safe">{I.book}</span>
            <div className="grow"><div className="title">Código de conducta</div><div className="sub">ManaMatch es para jugar, no para ligar</div></div>
            <span className="chev">{I.chevron}</span>
          </button>
          <button id="open-norms" className="row" onClick={onNorms}>
            <span className="row-icon safe">{I.flag}</span>
            <div className="grow"><div className="title">Normas y sanciones</div><div className="sub">Qué se sanciona y cómo</div></div>
            <span className="chev">{I.chevron}</span>
          </button>
          <div className="panel blocked">
            <div className="setting"><span className="setting-icon">{I.ban}</span><div className="grow"><div className="setting-label">Usuarios bloqueados</div><div className="setting-hint">{blockedPlayers.length ? 'No pueden verte ni escribirte' : 'No has bloqueado a nadie'}</div></div></div>
            {blockedPlayers.map((x) => (
              <div key={x.id} className="blocked-row">
                <img loading="lazy" decoding="async" className="avatar" src={x.avatar} alt="" /><span className="grow">{x.name}</span>
                <button className="link-btn" onClick={() => onUnblock(x.id)}>Desbloquear</button>
              </div>
            ))}
          </div>
        </div>

        {!installer.installed && (
          <>
            <h3 className="section-title">Aplicación</h3>
            <div className="panel install">
              <img src="/icon-192.png" alt="" width="48" height="48" />
              <div className="grow">
                <div className="setting-label">Instala ManaMatch</div>
                <div className="setting-hint">
                  {installer.canPrompt ? 'Tenla en tu pantalla de inicio, a pantalla completa y sin conexión.'
                    : installer.isIOS ? <>En Safari pulsa <b>Compartir</b> {I.share} y luego <b>Añadir a pantalla de inicio</b>.</>
                      : 'Abre el menú del navegador y elige «Instalar aplicación» o «Añadir a pantalla de inicio».'}
                </div>
              </div>
              {installer.canPrompt && <button id="install-app" className="primary small" onClick={installer.install}>{I.download}Instalar</button>}
            </div>
          </>
        )}

        {user && (
          <>
            <h3 className="section-title">Cuenta</h3>
            <div className="list">
              <div className="row account-row">
                <span className="row-icon account-icon">{viaGoogle ? GOOGLE_G : I.mail}</span>
                <div className="grow"><div className="title">{viaGoogle ? 'Conectado con Google' : 'Conectado con enlace al correo'}</div><div className="sub">{user.email}</div></div>
              </div>
              <p className="field-hint account-hint">{I.shield}{viaGoogle
                ? 'ManaMatch no guarda contraseñas: tu correo y tu contraseña se cambian en tu cuenta de Google.'
                : 'ManaMatch no usa contraseñas: cada vez que entras te enviamos un enlace nuevo.'}</p>
              {!viaGoogle && (
                <button id="change-email" className="row" onClick={() => setAccountDialog('email')}>
                  <span className="row-icon">{I.mail}</span>
                  <div className="grow"><div className="title">Cambiar correo</div><div className="sub">Confirmarás desde el antiguo y el nuevo</div></div>
                  <span className="chev">{I.chevron}</span>
                </button>
              )}
              <button id="sign-out" className="row" onClick={onSignOut}>
                <span className="row-icon">{I.logout}</span>
                <div className="grow"><div className="title">Cerrar sesión</div><div className="sub">Podrás volver a entrar cuando quieras</div></div>
                <span className="chev">{I.chevron}</span>
              </button>
            </div>
          </>
        )}

        <button id="reset-profile" className="danger-btn" onClick={onReset}>{I.reset}Restablecer perfil de ejemplo</button>
        <button id="wipe-data" className="danger-btn" onClick={onWipe}>{I.trash}Borrar mis datos de este dispositivo</button>
        {user && <button id="delete-account" className="danger-btn" onClick={() => setAccountDialog('delete')}>{I.ban}Eliminar mi cuenta</button>}
      </div>
      {accountDialog === 'email' && <ChangeEmailDialog current={user.email} onClose={() => setAccountDialog(null)} />}
      {accountDialog === 'delete' && <DeleteAccountDialog onClose={() => setAccountDialog(null)} />}
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
  const myGame = me.profiles[p.game] ? p.game : me.game;
  const mine = me.profiles[myGame];
  const sparkColors = [...frameOf(myGame, mine.colors).list, ...frameOf(p.game, p.colors).list];
  return (
    <div className="match" role="dialog" aria-label="¡Duelo aceptado!">
      {/* Fondo partido en diagonal: tu carta contra la suya */}
      <div className="vs-bg" aria-hidden="true">
        <div className="vs-half left"><img className={imgCls(myGame).trim()} src={artOf(myGame, mine.favCard)} alt="" /></div>
        <div className="vs-half right"><img className={imgCls(p.game).trim()} src={artOf(p.game, p.favCard)} alt="" /></div>
        <svg className="vs-seam" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="62" y1="-2" x2="38" y2="102" /></svg>
      </div>
      <div className="sparks">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i, '--c': sparkColors[i % sparkColors.length] }} />)}</div>
      <div className="duel-icon" aria-hidden="true">{SWORD}{SWORD}</div>
      <p className="its">¡Duelo</p>
      <h2 className="match-title" data-text="ACEPTADO!">ACEPTADO!</h2>
      <div className="pair">
        <Hex src={me.avatar || artOf(myGame, mine.favCard)} alt={me.name} size={124} colors={frameOf(myGame, mine.colors).list} fullCard={avatarIsCard(me, myGame)} />
        <span className="vs" aria-label="contra">VS</span>
        <Hex src={p.avatar} alt={p.name} size={124} colors={frameOf(p.game, p.colors).list} />
      </div>
      <p className="swiped">{p.name} también quiere jugar a {GAMES[p.game].name}. Proponed formato y tienda.</p>
      <div className="quick light">{quickReplies(p, me).map((q) => <button key={q} type="button" onClick={() => { setText(q); clearWarn(); }}>{q}</button>)}</div>
      <form className="match-reply" onSubmit={submit}>
        <input id="match-input" placeholder="Propón una partida…" value={text} onChange={(e) => { setText(e.target.value); if (warn === 'conduct') clearWarn(); }} />
        <button id="match-chat">{warn === 'contact' ? 'Enviar igual' : 'Enviar'}</button>
      </form>
      <ModNote kind={warn} />
      <button id="match-continue" className="keep" onClick={onContinue}>Seguir buscando</button>
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
  // Los accesos directos del icono de la app abren una pestaña concreta (?tab=chat)
  const [tab, setTab] = useState(() => { const t = new URLSearchParams(location.search).get('tab'); return TABS.some(([id]) => id === t) ? t : 'discover'; });
  const [queue, setQueue] = useState(PLAYERS);
  const [passed, setPassed] = useState([]);
  const [matches, setMatches] = useState([]);
  const [chats, setChats] = useState({});
  const [unread, setUnread] = useState(0);
  const [profile, setProfile] = useState(null);
  const [matchFx, setMatchFx] = useState(null);
  const [chatWith, setChatWith] = useState(null);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null); // 'profile' | 'deck'
  const [reporting, setReporting] = useState(null);
  const [blocking, setBlocking] = useState(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [normsOpen, setNormsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [me, setMe] = useStoredState('manamatch-me', DEFAULT_ME, migrateMe);
  const [theme, setTheme] = useStoredState('manamatch-theme', 'dark');
  const [blocked, setBlocked] = useStoredState('manamatch-blocked', []);
  const [accepted, setAccepted] = useStoredState('manamatch-rules', false);
  useAppearance(theme, me.game);
  useViewportHeight();
  const online = useOnline();
  const installer = useInstall();
  const session = useSession();

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

  const flash = (text, icon = I.sword) => { setToast({ text, icon }); setTimeout(() => setToast(null), 2200); };

  const decide = (p, like, isSuper = false) => {
    setQueue((q) => q.filter((x) => x.id !== p.id));
    setProfile(null);
    haptic(like ? 15 : 8);
    if (!like) { setPassed((h) => [...h, p]); return; }
    // Demo: los jugadores competitivos/cercanos aceptan el reto; un súper duelo siempre se acepta
    if (isSuper || p.dist < 2.5 || p.id % 2 === 0) {
      setMatches((m) => [p, ...m]);
      setUnread((u) => u + 1);
      setMatchFx(p);
      setTimeout(() => haptic([30, 60, 40]), 300);
    } else flash(`Has retado a ${p.name}`);
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
    if (!silent) flash(`Has bloqueado a ${p.name}`, I.ban);
  };

  const send = (p, m) => {
    setChats((c) => ({ ...c, [p.id]: [...(c[p.id] || []), m] }));
    setTimeout(() => {
      const reply = m.type === 'meetup' ? { ...m, from: 'them' } : { type: 'text', from: 'them', text: REPLIES[Math.floor(Math.random() * REPLIES.length)] };
      setChats((c) => ({ ...c, [p.id]: [...(c[p.id] || []), reply] }));
    }, 1200);
  };

  const addDeck = (d) => setMe((x) => ({ ...x, profiles: { ...x.profiles, [x.game]: { ...x.profiles[x.game], decks: [...x.profiles[x.game].decks, d] } } }));
  const openChat = (p) => { setChatWith(p); setTab('chat'); setMatchFx(null); setUnread(0); };
  const inChat = tab === 'chat' && chatWith;

  // Con cuentas activadas, sin sesión no se ve nada de la app
  if (session === undefined) return <main className="phone" aria-busy="true" />;
  if (supabase && !session) return <main className="phone"><LoginScreen /></main>;

  return (
    <main className={`phone ${tab === 'discover' ? 'discover' : ''}`}>
      <nav className="topnav" aria-label="Secciones">
        {TABS.map(([id, icon, label]) => (
          <button key={id} id={`nav-${id}`} aria-label={label} title={label} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); if (id === 'chat') setUnread(0); }}>
            {icon}{id === 'chat' && unread > 0 && <span className="badge">{unread}</span>}
          </button>
        ))}
      </nav>

      <section className="screen" key={tab + (chatWith?.id ?? '') + (tab === 'discover' ? me.game : '')}>
        {tab !== 'discover' && !inChat && (
          <header className="screen-head">
            <div>
              <span className="eyebrow">ManaMatch · {GAMES[me.game].name}</span>
              <h1 className="screen-title">{TABS.find((t) => t[0] === tab)[2]}</h1>
            </div>
            {tab === 'me' && <button id="open-settings" className="icon-btn head-action" onClick={() => setSettingsOpen(true)} aria-label="Ajustes" title="Ajustes">{I.gear}</button>}
          </header>
        )}
        {tab === 'discover' && <Discover queue={visibleQueue} me={me} onDecide={decide} onInfo={setProfile} onRewind={rewind} canRewind={passed.length > 0} />}
        {tab === 'nearby' && <Nearby players={PLAYERS.filter((p) => notBlocked(p) && p.dist <= me.radius && (!me.onlyVerified || p.verified))} onInfo={setProfile} />}
        {tab === 'chat' && (chatWith
          ? <Chat p={chatWith} me={me} msgs={chats[chatWith.id] || []} onSend={(m) => send(chatWith, m)} onBack={() => setChatWith(null)} onInfo={setProfile} onReport={() => setReporting(chatWith)} />
          : <Matches matches={visibleMatches} chats={chats} openChat={openChat} />)}
        {tab === 'me' && (
          <MyProfile
            me={me} setMe={setMe} matchCount={visibleMatches.length} flash={flash}
            onEdit={() => setEditing('profile')} onAddDeck={() => setEditing('deck')}
          />
        )}
      </section>

      {settingsOpen && (
        <SettingsScreen
          me={me} setMe={setMe} theme={theme} setTheme={setTheme} installer={installer}
          blocked={blocked} onUnblock={(id) => setBlocked((b) => b.filter((x) => x !== id))}
          onRules={() => setRulesOpen(true)} onNorms={() => setNormsOpen(true)} onWipe={() => setWiping(true)}
          onReset={() => { setMe(DEFAULT_ME); flash('Perfil restablecido', I.reset); }}
          user={session?.user} onSignOut={() => supabase.auth.signOut()}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {profile && (
        <ProfileSheet
          p={profile} onClose={() => setProfile(null)}
          onLike={visibleQueue.some((q) => q.id === profile.id) ? () => decide(profile, true) : null}
          onReport={() => setReporting(profile)} onBlock={() => setBlocking(profile)}
        />
      )}

      {editing === 'profile' && <EditProfileSheet me={me} onClose={() => setEditing(null)} onSave={(v) => { setMe(v); setEditing(null); flash('Perfil actualizado', I.check); }} />}
      {editing === 'deck' && <DeckSheet game={me.game} onClose={() => setEditing(null)} onSave={(d) => { addDeck(d); setEditing(null); flash(`Mazo «${d.name}» añadido`, I.plus); }} />}

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
          onSubmit={({ alsoBlock }) => { if (alsoBlock) block(reporting, true); setReporting(null); flash('Denuncia enviada. La revisaremos en 24 h', I.flag); }}
        />
      )}
      {blocking && (
        <Confirm
          title={`¿Bloquear a ${blocking.name}?`}
          text="No podrá ver tu perfil ni escribirte, y desaparecerá de tus rivales. Puedes deshacerlo desde tu perfil."
          confirm="Bloquear" onClose={() => setBlocking(null)} onConfirm={() => block(blocking)}
        />
      )}

      {wiping && (
        <Confirm
          id="confirm-wipe" icon={I.trash} confirm="Borrar todo"
          title="¿Borrar tus datos de este dispositivo?"
          text="Se eliminarán tu perfil, tus mazos, la foto, los bloqueos y tus preferencias guardados en este móvil. No se puede deshacer."
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

      {!online && <div className="offline" role="status">{I.wifiOff}Sin conexión: verás lo último que se guardó</div>}

      {toast && <div className="toast" role="status"><span className="toast-icon">{toast.icon}</span>{toast.text}</div>}
    </main>
  );
}
