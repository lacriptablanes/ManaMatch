// Títulos de jugador, como en los videojuegos: se desbloquean jugando y cada uno elige cuál enseñar
// bajo su retrato. El texto está en castellano y se traduce al mostrarlo (t()).
// Nota: hoy los requisitos se comprueban en la app; cuando haya datos reales, el servidor debe validarlos.
import { CATALOG } from './catalog';

const inCat = (cat) => new Set(CATALOG.filter((g) => g.cat === cat).map((g) => g.id));
const WARGAMES = inCat('Wargames'), BOARD = inCat('Juegos de mesa'), CARD_GAMES = inCat('Cartas coleccionables');
const LIMITED = ['Draft', 'Sealed', 'Sellado', 'Prerelease'];

export const TITLE_GROUPS = ['Partidas', 'Comunidad', 'Juegos', 'Colección', 'Estilo de juego', 'Perfil'];

// s = { played, matches, reliable, games[], formats[], decks, stores, level, days[], slots[], hasPhoto, hasFav, bio }
const T = (group, id, label, hint, test) => ({ group, id, label, hint, test });
export const TITLES = [
  T('Partidas', 'rookie', 'Recién llegado', 'Disponible desde el principio', () => true),
  T('Partidas', 'duelist', 'Duelista', 'Juega tu primera partida confirmada', (s) => s.played >= 1),
  T('Partidas', 'regular-player', 'Asiduo', 'Juega 5 partidas confirmadas', (s) => s.played >= 5),
  T('Partidas', 'veteran', 'Veterano', 'Juega 20 partidas confirmadas', (s) => s.played >= 20),
  T('Partidas', 'legend', 'Leyenda de la tienda', 'Juega 50 partidas confirmadas', (s) => s.played >= 50),
  T('Partidas', 'honor', 'Palabra de honor', 'Consigue la insignia Fiable', (s) => s.reliable),

  T('Comunidad', 'social', 'Sociable', 'Consigue 3 rivales', (s) => s.matches >= 3),
  T('Comunidad', 'feared', 'Rival temido', 'Consigue 10 rivales', (s) => s.matches >= 10),
  T('Comunidad', 'regular', 'Habitual de tienda', 'Marca 2 tiendas habituales', (s) => s.stores >= 2),
  T('Comunidad', 'globetrotter', 'Trotamundos', 'Marca 4 tiendas habituales', (s) => s.stores >= 4),

  T('Juegos', 'multi', 'Multijuego', 'Ten 5 juegos o más en tu lista', (s) => s.games.length >= 5),
  T('Juegos', 'omnivore', 'Omnívoro', 'Ten 10 juegos en tu lista', (s) => s.games.length >= 10),
  T('Juegos', 'card-shark', 'Tahúr', 'Juega a 3 juegos de cartas coleccionables', (s) => s.games.filter((g) => CARD_GAMES.has(g)).length >= 3),
  T('Juegos', 'warlord', 'Señor de la guerra', 'Añade un wargame a tu lista', (s) => s.games.some((g) => WARGAMES.has(g))),
  T('Juegos', 'dungeon-master', 'Maestro de mazmorras', 'Añade Dungeons & Dragons a tu lista', (s) => s.games.includes('dnd')),
  T('Juegos', 'strategist', 'Estratega', 'Añade un juego de mesa a tu lista', (s) => s.games.some((g) => BOARD.has(g))),

  T('Colección', 'collector', 'Coleccionista', 'Añade 3 mazos', (s) => s.decks >= 3),
  T('Colección', 'deckbuilder', 'Arquitecto de mazos', 'Añade 6 mazos', (s) => s.decks >= 6),
  T('Colección', 'commander', 'Comandante', 'Juega al formato Commander', (s) => s.formats.includes('Commander')),
  T('Colección', 'pack-hunter', 'Cazador de sobres', 'Juega Draft, Sellado o presentaciones', (s) => s.formats.some((f) => LIMITED.includes(f))),
  T('Colección', 'stylish', 'Con estilo', 'Elige tu carta favorita', (s) => s.hasFav),

  T('Estilo de juego', 'competitor', 'Competidor', 'Juega a nivel competitivo', (s) => s.level === 'Competitivo'),
  T('Estilo de juego', 'chill', 'Sin prisas', 'Juega a nivel casual', (s) => s.level === 'Casual'),
  T('Estilo de juego', 'night-owl', 'Noctámbulo', 'Marca que juegas por la noche', (s) => s.slots.includes('Noche')),
  T('Estilo de juego', 'early-bird', 'Madrugador', 'Marca que juegas por la mañana', (s) => s.slots.includes('Mañana')),
  T('Estilo de juego', 'weekend', 'Guerrero de finde', 'Marca sábado y domingo', (s) => s.days.includes('S') && s.days.includes('D')),
  T('Estilo de juego', 'always-on', 'Siempre listo', 'Marca 5 días o más', (s) => s.days.length >= 5),

  T('Perfil', 'known-face', 'Cara conocida', 'Sube una foto de perfil', (s) => s.hasPhoto),
  T('Perfil', 'storyteller', 'Cuentacuentos', 'Escribe una bio de 80 letras o más', (s) => s.bio.length >= 80),
];
const BY_ID = Object.fromEntries(TITLES.map((x) => [x.id, x]));
// Si alguien no ha elegido, se muestra el más difícil que tenga
const BEST = ['legend', 'veteran', 'honor', 'feared', 'deckbuilder', 'omnivore', 'regular-player', 'globetrotter', 'warlord',
  'dungeon-master', 'commander', 'collector', 'multi', 'card-shark', 'competitor', 'social', 'regular', 'pack-hunter',
  'strategist', 'storyteller', 'known-face', 'stylish', 'night-owl', 'early-bird', 'weekend', 'always-on', 'chill', 'duelist', 'rookie'];

export const unlockedTitles = (stats) => TITLES.filter((x) => x.test(stats)).map((x) => x.id);
export const titleFor = (chosen, stats) => {
  const ok = unlockedTitles(stats);
  const id = ok.includes(chosen) ? chosen : BEST.find((x) => ok.includes(x));
  return BY_ID[id];
};
