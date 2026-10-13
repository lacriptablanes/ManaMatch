// Catálogo de juegos que un jugador puede marcar en su perfil ("Tus juegos").
// Los tres primeros (magic, pokemon, onepiece) además tienen perfil completo con cartas (games.js).
// Los identificadores se guardan en la base de datos: no cambiarlos, solo añadir nuevos.

export const GAME_CATEGORIES = ['Cartas coleccionables', 'Cartas LCG', 'Wargames', 'Rol', 'Juegos de mesa'];

// Cada juego: [id, nombre, otras formas de buscarlo (abreviaturas, saga)]
const list = (cat, items) => items.map(([id, name, alias = '']) => ({ id, name, cat, alias }));

export const CATALOG = [
  ...list('Cartas coleccionables', [
    ['magic', 'Magic: The Gathering', 'mtg'], ['pokemon', 'Pokémon'], ['onepiece', 'One Piece'], ['yugioh', 'Yu-Gi-Oh!', 'ygo yugioh'],
    ['lorcana', 'Disney Lorcana'], ['fab', 'Flesh and Blood', 'fab'], ['swu', 'Star Wars: Unlimited', 'swu'], ['riftbound', 'Riftbound', 'league of legends lol'],
    ['digimon', 'Digimon'], ['dbs', 'Dragon Ball Super', 'dbs fusion world'], ['altered', 'Altered'], ['union-arena', 'Union Arena'],
    ['gundam', 'Gundam Card Game'], ['vanguard', 'Cardfight!! Vanguard'], ['weiss', 'Weiss Schwarz'], ['fftcg', 'Final Fantasy TCG'],
    ['grand-archive', 'Grand Archive'], ['duel-masters', 'Duel Masters'], ['hololive', 'Hololive OCG'], ['universus', 'UniVersus'],
    ['netrunner', 'Netrunner'], ['wowtcg', 'World of Warcraft TCG'], ['7th-sea', '7th Sea'], ['hth', 'Home Team Heroes'],
  ]),
  ...list('Cartas LCG', [
    ['arkham-lcg', 'Arkham Horror LCG', 'lcg'], ['marvel-champions', 'Marvel Champions'],
  ]),
  ...list('Wargames', [
    ['wh40k', 'Warhammer 40,000', '40k'], ['aos', 'Warhammer Age of Sigmar', 'aos'], ['old-world', 'Warhammer: The Old World', 'fantasy'], ['horus-heresy', 'Warhammer: The Horus Heresy', '30k'],
    ['kill-team', 'Kill Team', 'warhammer'], ['legions-imperialis', 'Legions Imperialis', 'warhammer'], ['warcry', 'Warcry', 'warhammer'], ['necromunda', 'Necromunda', 'warhammer'],
    ['blood-bowl', 'Blood Bowl', 'warhammer'], ['underworlds', 'Warhammer Underworlds'], ['sw-legion', 'Star Wars: Legion'], ['shatterpoint', 'Shatterpoint'],
    ['mcp', 'Marvel: Crisis Protocol'], ['conquest', 'Conquest'], ['conquest-fb', 'Conquest: First Blood'], ['infinity', 'Infinity'], ['bolt-action', 'Bolt Action'],
    ['mesbg', 'El Señor de los Anillos', 'lotr sda middle-earth'], ['malifaux', 'Malifaux'], ['saga', 'Saga'], ['warmachine', 'Warmachine'],
    ['flames-of-war', 'Flames of War'], ['mordheim', 'Mordheim'], ['team-yankee', 'Team Yankee'], ['black-powder', 'Black Powder'],
    ['hail-caesar', 'Hail Caesar'], ['pike-shotte', 'Pike & Shotte'], ['dba', 'De Bellis Antiquitatis'], ['sphere-wars', 'Sphere Wars'], ['grimdark', 'Grimdark Future'], ['age-of-fantasy', 'Age of Fantasy'],
  ]),
  ...list('Rol', [['dnd', 'Dungeons & Dragons', 'dnd d&d rol']]),
  ...list('Juegos de mesa', [
    ['catan', 'Catan'], ['carcassonne', 'Carcassonne'], ['root', 'Root'], ['gloomhaven', 'Gloomhaven'], ['frosthaven', 'Frosthaven'],
  ]),
];

const BY_ID = Object.fromEntries(CATALOG.map((g) => [g.id, g]));
export const isGameId = (id) => Object.hasOwn(BY_ID, id);
export const gameName = (id) => BY_ID[id]?.name ?? id;
export const MAX_GAMES = 10;
