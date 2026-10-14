// Configuración de cada juego: paleta, formatos, terminología, imágenes y buscador de cartas.
// Una carta se representa siempre como { name, img? }: Magic resuelve la imagen por nombre
// (Scryfall); Pokémon y One Piece guardan la URL de la imagen de la carta.
import { cardArt, cardImg, opImg } from './data';
import { CATALOG } from './catalog';
import { cardUploadUrl, isCardUpload } from './profileStore';

/* Catálogo de líderes y cartas populares de One Piece (la API pública no tiene buscador por nombre) */
const OP_CATALOG = [
  ['OP01-001', 'Roronoa Zoro', 'Líder'], ['OP01-002', 'Trafalgar Law', 'Líder'], ['OP01-003', 'Monkey.D.Luffy', 'Líder'],
  ['OP01-031', 'Kouzuki Oden', 'Líder'], ['OP01-060', 'Donquixote Doflamingo', 'Líder'], ['OP01-061', 'Kaido', 'Líder'],
  ['OP01-091', 'King', 'Líder'], ['OP02-001', 'Edward.Newgate', 'Líder'], ['OP02-002', 'Monkey.D.Garp', 'Líder'],
  ['OP02-049', 'Emporio.Ivankov', 'Líder'], ['OP02-071', 'Magellan', 'Líder'], ['OP02-093', 'Smoker', 'Líder'],
  ['OP03-001', 'Portgas.D.Ace', 'Líder'], ['OP03-021', 'Kuro', 'Líder'], ['OP03-022', 'Arlong', 'Líder'],
  ['OP03-040', 'Nami', 'Líder'], ['OP03-076', 'Rob Lucci', 'Líder'], ['OP03-099', 'Charlotte Katakuri', 'Líder'],
  ['OP04-001', 'Nefeltari Vivi', 'Líder'], ['OP04-019', 'Donquixote Doflamingo', 'Líder'], ['OP04-020', 'Issho', 'Líder'],
  ['OP04-039', 'Rebecca', 'Líder'], ['OP04-058', 'Crocodile', 'Líder'], ['OP05-001', 'Sabo', 'Líder'],
  ['OP05-002', 'Belo Betty', 'Líder'], ['OP05-041', 'Sakazuki', 'Líder'], ['OP05-060', 'Monkey.D.Luffy', 'Líder'],
  ['OP05-098', 'Enel', 'Líder'], ['OP06-001', 'Uta', 'Líder'], ['OP06-020', 'Hody Jones', 'Líder'],
  ['OP06-080', 'Gecko Moria', 'Líder'], ['OP07-001', 'Monkey.D.Dragon', 'Líder'], ['OP07-019', 'Jewelry Bonney', 'Líder'],
  ['OP07-038', 'Boa Hancock', 'Líder'], ['OP08-001', 'Tony Tony.Chopper', 'Líder'], ['OP08-002', 'Marco', 'Líder'],
  ['ST01-001', 'Monkey.D.Luffy', 'Líder'], ['EB01-001', 'Kouzuki Oden', 'Líder'],
  ['OP01-016', 'Nami', 'Personaje'], ['OP01-024', 'Monkey.D.Luffy', 'Personaje'], ['OP01-025', 'Roronoa Zoro', 'Personaje'],
  ['OP01-121', 'Yamato', 'Personaje'], ['OP05-119', 'Monkey.D.Luffy', 'Personaje'], ['OP06-118', 'Roronoa Zoro', 'Personaje'],
  ['OP02-004', 'Edward.Newgate', 'Personaje'], ['OP03-122', 'Sogeking', 'Personaje'], ['OP04-083', 'Sabo', 'Personaje'],
  ['OP05-069', 'Trafalgar Law', 'Personaje'], ['ST01-012', 'Monkey.D.Luffy', 'Personaje'],
].map(([code, name, type]) => ({ name: `${name} (${code})`, img: opImg(code), sub: type }));

const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const GAMES = {
  magic: {
    id: 'magic', name: 'Magic', fullName: 'Magic: The Gathering',
    paletteLabel: 'Colores de maná',
    palette: {
      W: { label: 'Blanco', color: '#f8e7b9' }, U: { label: 'Azul', color: '#4fa3e0' }, B: { label: 'Negro', color: '#9b8aa6' },
      R: { label: 'Rojo', color: '#f0613a' }, G: { label: 'Verde', color: '#3fbf6f' },
    },
    formats: ['Commander', 'cEDH', 'Modern', 'Pioneer', 'Standard', 'Legacy', 'Vintage', 'Pauper', 'Draft', 'Sealed'],
    keyCard: (format) => (format === 'Commander' || format === 'cEDH' ? 'Comandante' : 'Carta principal'),
    favLabel: 'Carta favorita',
    art: (c) => c.img || (c.name?.trim() ? cardArt(c.name) : ''),
    full: (c) => c.img || (c.name?.trim() ? cardImg(c.name) : ''),
    search: async (q, signal) => {
      const d = await (await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`, { signal })).json();
      return (d.data || []).slice(0, 8).map((name) => ({ name }));
    },
  },
  pokemon: {
    id: 'pokemon', name: 'Pokémon', fullName: 'Pokémon JCC',
    paletteLabel: 'Tipos de energía',
    palette: {
      grass: { label: 'Planta', color: '#5fbd58' }, fire: { label: 'Fuego', color: '#f26b3a' }, water: { label: 'Agua', color: '#3d9be9' },
      lightning: { label: 'Rayo', color: '#f7d02c' }, psychic: { label: 'Psíquico', color: '#c45ac9' }, fighting: { label: 'Lucha', color: '#c46a3b' },
      darkness: { label: 'Oscuro', color: '#4d4a63' }, metal: { label: 'Metal', color: '#9aa5b1' }, dragon: { label: 'Dragón', color: '#b8962e' },
      colorless: { label: 'Incoloro', color: '#e6e1d6' },
    },
    formats: ['Estándar', 'Expandido', 'Gym Leader Challenge', 'Sin límites', 'Prerelease'],
    keyCard: () => 'Pokémon estrella',
    favLabel: 'Carta favorita',
    art: (c) => c.img,
    full: (c) => c.img,
    // La API devuelve error 500 si se combina orderBy con select, y a veces falla puntualmente: se reintenta una vez
    search: async (q, signal) => {
      const name = q.trim().includes(' ') ? `name:"${q.trim()}"` : `name:${q.trim()}*`;
      const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(name)}&pageSize=10&orderBy=-set.releaseDate`;
      const get = async () => { const r = await fetch(url, { signal }); if (!r.ok) throw new Error(r.status); return r.json(); };
      const d = await get().catch(() => new Promise((res) => setTimeout(res, 600)).then(get));
      return (d.data || []).map((c) => ({ name: c.name, img: c.images.large, sub: c.set?.name }));
    },
  },
  onepiece: {
    id: 'onepiece', name: 'One Piece', fullName: 'One Piece Card Game',
    paletteLabel: 'Colores',
    palette: {
      red: { label: 'Rojo', color: '#e0313d' }, green: { label: 'Verde', color: '#2e9e5b' }, blue: { label: 'Azul', color: '#2b7bd6' },
      purple: { label: 'Morado', color: '#8e4fc9' }, black: { label: 'Negro', color: '#55556a' }, yellow: { label: 'Amarillo', color: '#f2c230' },
    },
    formats: ['Estándar', 'Sellado', 'Treasure Cup'],
    keyCard: () => 'Líder',
    favLabel: 'Carta favorita',
    art: (c) => c.img,
    full: (c) => c.img,
    // Busca en el catálogo local y, si escribes un código (OP05-060), lo resuelve directamente
    search: async (q) => {
      const code = q.trim().toUpperCase();
      if (/^(OP|ST|EB|PRB)\d{2}-\d{3}$/.test(code)) return [{ name: code, img: opImg(code), sub: 'Por código' }];
      const f = fold(q);
      return OP_CATALOG.filter((c) => fold(c.name).includes(f)).slice(0, 10);
    },
  },
};
// Juegos con buscador de cartas e imágenes oficiales (perfil "destacado")
export const GAME_IDS = Object.keys(GAMES);

/* Imagen por defecto de cada juego (cuando no hay carta ni imagen subida). Es un dibujo propio, sin logos ni arte
   oficial: un motivo según el tipo de juego, el nombre del juego y un fondo con su propio tono y patrón.
   El motivo va en la mitad superior para no quedar debajo del nombre del jugador en su tarjeta. */
const BG = ['#2c2840', '#241f3a', '#2a2238', '#1f2638', '#2b2333', '#262a3d', '#30253f'];
const ACCENT = ['#C4F56A', '#B79CFB', '#D4FF8A', '#CDB8FF'];
const MOTIF = {
  // tres cartas en abanico
  cards: (a) => `<g transform="translate(200 175)" fill="none" stroke-width="6" stroke-linejoin="round">`
    + `<rect x="-46" y="-66" width="92" height="128" rx="10" transform="rotate(-16)" stroke="${a}" opacity=".45"/>`
    + `<rect x="-46" y="-66" width="92" height="128" rx="10" transform="rotate(14)" stroke="${a}" opacity=".7"/>`
    + `<rect x="-46" y="-70" width="92" height="128" rx="10" fill="#171522" stroke="${a}"/>`
    + `<path d="M0 -38l14 26-14 26-14-26z" fill="${a}" stroke="none"/></g>`,
  // escudo con espada (wargames)
  army: (a) => `<g transform="translate(200 172)" fill="none" stroke="${a}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">`
    + `<path d="M0 -72l58 22v42c0 46-26 76-58 88-32-12-58-42-58-88v-42z" fill="#171522"/>`
    + `<path d="M0 -40v92M-22 24h44M-8 52h16" /></g>`,
  // dado de 20 caras (rol)
  d20: (a) => `<g transform="translate(200 172)" fill="none" stroke="${a}" stroke-width="6" stroke-linejoin="round">`
    + `<path d="M0 -76l66 38v76L0 76l-66-38v-76z" fill="#171522"/>`
    + `<path d="M0 -76L-40 20h80zM-66 -38l26 58M66 -38l-26 58M-40 20L0 76l40-56M-66 38l26-18M66 38l-26-18"/></g>`,
  // meeple (juegos de mesa)
  meeple: (a) => `<g transform="translate(200 175)">`
    + `<path d="M0 -74c20 0 32 14 32 30 0 10-4 18-10 24 26 6 52 16 60 28 6 10-4 16-18 14l-30-4 22 48c4 10-2 16-12 16h-28L0 46l-16 36h-28c-10 0-16-6-12-16l22-48-30 4c-14 2-24-4-18-14 8-12 34-22 60-28-6-6-10-14-10-24 0-16 12-30 32-30z" fill="#171522" stroke="${a}" stroke-width="6" stroke-linejoin="round"/></g>`,
};
const MOTIF_BY_CAT = { 'Cartas coleccionables': 'cards', 'Cartas LCG': 'cards', Wargames: 'army', Rol: 'd20', 'Juegos de mesa': 'meeple' };
const hash = (str) => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const artCache = {};
export const placeholderArt = (id) => {
  if (artCache[id]) return artCache[id];
  const g = CATALOG.find((x) => x.id === id) ?? { name: id, cat: 'Cartas coleccionables' };
  const h = hash(id);
  const bg = BG[h % BG.length], a = ACCENT[(h >> 3) % ACCENT.length];
  // Patrón de fondo distinto por juego: rombos, puntos o rayas
  const pattern = [
    `<pattern id="p" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="36" height="36" fill="none"/><rect x="0" y="0" width="18" height="18" fill="#fff" opacity=".035"/></pattern>`,
    `<pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="3" fill="#fff" opacity=".06"/></pattern>`,
    `<pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect width="10" height="24" fill="#fff" opacity=".035"/></pattern>`,
  ][(h >> 5) % 3];
  const name = esc(g.name.length > 26 ? `${g.name.slice(0, 25)}…` : g.name);
  const size = g.name.length > 18 ? 24 : 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">`
    + `<defs>${pattern}<radialGradient id="g" cx="50%" cy="34%" r="55%"><stop offset="0" stop-color="${a}" stop-opacity=".22"/><stop offset="1" stop-color="${a}" stop-opacity="0"/></radialGradient></defs>`
    + `<rect width="400" height="500" fill="${bg}"/><rect width="400" height="500" fill="url(#p)"/><rect width="400" height="500" fill="url(#g)"/>`
    + MOTIF[MOTIF_BY_CAT[g.cat] ?? 'cards'](a)
    + `<text x="200" y="300" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="800" font-size="${size}" fill="#F8F7FC">${name}</text>`
    + `</svg>`;
  return (artCache[id] = `data:image/svg+xml,${encodeURIComponent(svg)}`);
};

/* El resto del catálogo: perfil genérico, sin buscador; la imagen la sube el jugador */
const FAV_LABEL = {
  'Cartas coleccionables': 'Carta favorita', 'Cartas LCG': 'Carta favorita',
  Wargames: 'Ejército o miniatura favorita', Rol: 'Personaje favorito', 'Juegos de mesa': 'Imagen favorita',
};
for (const g of CATALOG) {
  if (GAMES[g.id]) continue;
  const ph = placeholderArt(g.id);
  GAMES[g.id] = {
    id: g.id, name: g.name, fullName: g.name, generic: true,
    paletteLabel: '', palette: {},
    // El nivel (casual/competitivo) ya se elige aparte: aquí solo tipos de partida
    formats: ['Partidas abiertas', 'Torneos de tienda', 'Liga'],
    keyCard: () => (g.cat === 'Wargames' ? 'Ejército' : g.cat === 'Rol' ? 'Personaje' : 'Carta principal'),
    favLabel: FAV_LABEL[g.cat],
    art: () => ph,
    full: () => ph,
    search: null,
  };
}

// Una imagen subida por el jugador manda sobre la oficial (en cualquier juego)
const uploaded = (c) => (isCardUpload(c?.upload) ? (c.upload.startsWith('data:') ? c.upload : cardUploadUrl(c.upload)) : '');
for (const cfg of Object.values(GAMES)) {
  const { art, full } = cfg;
  cfg.art = (c) => uploaded(c) || art(c ?? {}) || placeholderArt(cfg.id);
  cfg.full = (c) => uploaded(c) || full(c ?? {}) || placeholderArt(cfg.id);
}
