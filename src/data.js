// Datos de demostración. En producción vendrían de un backend (p. ej. Supabase/Firebase).
// Imágenes: Scryfall (Magic), Pokémon TCG API (Pokémon) y OPTCG API (One Piece).
export const cardArt = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=art_crop`;
export const cardImg = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
export const pokeImg = (set, n) => `https://images.pokemontcg.io/${set}/${n}_hires.png`;
export const opImg = (code) => `https://optcgapi.com/media/static/Card_Images/${code}.jpg`;

export const STORES = [
  { id: 's1', name: 'Dragón Rojo Games', dist: 0.8, events: 'FNM viernes 19:00 · Commander miércoles' },
  { id: 's2', name: 'La Guarida del Mago', dist: 1.6, events: 'Pioneer jueves · Pokémon sábados' },
  { id: 's3', name: 'Cripta TCG', dist: 2.4, events: 'Modern martes · Draft domingos' },
  { id: 's4', name: 'Meeple & Mana', dist: 3.9, events: 'One Piece lunes · Lorcana sábados' },
];

// Cada jugador tiene su lista de juegos (interests, ids de catalog.js) y un juego principal (game) con su paleta de colores, formatos y mazos.
// Las cartas son { name, img? }: en Magic la imagen se resuelve por nombre.
export const PLAYERS = [
  {
    id: 1, interests: ['magic', 'lorcana', 'catan', 'dnd'], game: 'magic', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', verified: true, name: 'Lucía', dist: 1.2,
    formats: ['Commander', 'Draft'], colors: ['U', 'G'], level: 'Casual competitivo',
    favCard: { name: 'Tatyova, Benthic Druid' },
    bio: 'Me encantan los mazos de landfall y las partidas largas de Commander con café. Busco grupo fijo los miércoles.',
    decks: [
      { name: 'Tatyova Landfall', format: 'Commander', card: { name: 'Tatyova, Benthic Druid' } },
      { name: 'Simic Ramp', format: 'Pioneer', card: { name: 'Hydroid Krasis' } },
    ],
    stores: ['s1', 's3'], availability: 'Miércoles y fines de semana',
  },
  {
    id: 2, interests: ['magic', 'fab', 'yugioh'], game: 'magic', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', verified: false, name: 'Marcos', dist: 0.6,
    formats: ['Modern', 'Legacy'], colors: ['U', 'R'], level: 'Competitivo',
    favCard: { name: 'Ragavan, Nimble Pilferer' },
    bio: 'Spike de corazón. Preparando el próximo RCQ, busco sparring para testear Modern.',
    decks: [
      { name: 'Izzet Murktide', format: 'Modern', card: { name: 'Murktide Regent' } },
      { name: 'Delver', format: 'Legacy', card: { name: 'Delver of Secrets' } },
    ],
    stores: ['s3'], availability: 'Martes y jueves por la tarde',
  },
  {
    id: 3, interests: ['pokemon', 'lorcana', 'onepiece'], game: 'pokemon', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', verified: true, name: 'Irene', dist: 2.1,
    formats: ['Estándar', 'Prerelease'], colors: ['lightning', 'colorless'], level: 'Casual',
    favCard: { name: 'Pikachu', img: pokeImg('sv3pt5', 25) },
    bio: 'Coleccionista de full arts ✨ Juego la Liga Pokémon de los sábados y me apunto a cualquier prerelease.',
    decks: [
      { name: 'Pikachu ex', format: 'Estándar', card: { name: 'Pikachu ex', img: pokeImg('sv2', 63) } },
      { name: 'Charizard VSTAR', format: 'Expandido', card: { name: 'Charizard VSTAR', img: pokeImg('swsh9', 18) } },
    ],
    stores: ['s2', 's4'], availability: 'Sábados',
  },
  {
    id: 4, interests: ['magic', 'wh40k', 'kill-team', 'blood-bowl'], game: 'magic', avatar: 'https://randomuser.me/api/portraits/men/75.jpg', verified: false, name: 'Dani', dist: 3.4,
    formats: ['Commander', 'cEDH'], colors: ['B', 'R', 'G'], level: 'Competitivo',
    favCard: { name: 'Korvold, Fae-Cursed King' },
    bio: 'cEDH los viernes, cerveza después. Si tu mazo tiene tutores, hablamos.',
    decks: [
      { name: 'Korvold Aristocrats', format: 'Commander', card: { name: 'Korvold, Fae-Cursed King' } },
      { name: 'Prossh Food Chain', format: 'cEDH', card: { name: 'Prossh, Skyraider of Kher' } },
    ],
    stores: ['s1', 's2'], availability: 'Viernes noche',
  },
  {
    id: 5, interests: ['magic', 'pokemon', 'fab', 'lorcana', 'swu'], game: 'magic', avatar: 'https://randomuser.me/api/portraits/women/90.jpg', verified: true, name: 'Sara', dist: 1.9,
    formats: ['Pauper', 'Draft'], colors: ['R', 'W'], level: 'Casual competitivo',
    favCard: { name: 'Lightning Bolt' },
    bio: 'Pauper es el mejor formato y lo defenderé. Drafteo cada set nuevo.',
    decks: [
      { name: 'Boros Kuldotha', format: 'Pauper', card: { name: 'Kuldotha Rebirth' } },
      { name: 'Mono Red Burn', format: 'Modern', card: { name: 'Lightning Bolt' } },
    ],
    stores: ['s3', 's4'], availability: 'Domingos',
  },
  {
    id: 6, interests: ['pokemon', 'yugioh', 'digimon'], game: 'pokemon', avatar: 'https://randomuser.me/api/portraits/men/46.jpg', verified: true, name: 'Hugo', dist: 0.9,
    formats: ['Estándar', 'Expandido'], colors: ['fire', 'colorless'], level: 'Competitivo',
    favCard: { name: 'Charizard ex', img: pokeImg('sv3pt5', 6) },
    bio: 'Preparando el Regional con Charizard. Busco gente para testear el metagame Estándar entre semana.',
    decks: [
      { name: 'Charizard ex', format: 'Estándar', card: { name: 'Charizard ex', img: pokeImg('sv3', 125) } },
      { name: 'Lugia VSTAR', format: 'Expandido', card: { name: 'Lugia VSTAR', img: pokeImg('swsh12', 139) } },
    ],
    stores: ['s2'], availability: 'Lunes y miércoles por la tarde',
  },
  {
    id: 7, interests: ['pokemon', 'magic', 'gloomhaven'], game: 'pokemon', avatar: 'https://randomuser.me/api/portraits/women/33.jpg', verified: false, name: 'Marta', dist: 1.7,
    formats: ['Estándar', 'Gym Leader Challenge'], colors: ['psychic'], level: 'Casual competitivo',
    favCard: { name: 'Gardevoir ex', img: pokeImg('sv1', 86) },
    bio: 'Gardevoir main desde siempre. Me encanta el Gym Leader Challenge y enseñar a jugar a gente nueva.',
    decks: [
      { name: 'Gardevoir ex', format: 'Estándar', card: { name: 'Gardevoir ex', img: pokeImg('sv1', 86) } },
    ],
    stores: ['s2', 's1'], availability: 'Sábados por la mañana',
  },
  {
    id: 8, interests: ['onepiece', 'dbs', 'union-arena'], game: 'onepiece', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', verified: true, name: 'Nico', dist: 1.4,
    formats: ['Estándar', 'Treasure Cup'], colors: ['purple'], level: 'Competitivo',
    favCard: { name: 'Portgas.D.Ace (OP03-001)', img: opImg('OP03-001') },
    bio: 'Luffy morado hasta la muerte. Voy a todos los torneos de tienda de los lunes, ¿te animas?',
    decks: [
      { name: 'Luffy Morado', format: 'Estándar', card: { name: 'Monkey.D.Luffy (OP05-060)', img: opImg('OP05-060') } },
      { name: 'Ace Rojo', format: 'Treasure Cup', card: { name: 'Portgas.D.Ace (OP03-001)', img: opImg('OP03-001') } },
    ],
    stores: ['s4'], availability: 'Lunes por la tarde',
  },
  {
    id: 9, interests: ['onepiece', 'pokemon', 'lorcana', 'root'], game: 'onepiece', avatar: 'https://randomuser.me/api/portraits/women/12.jpg', verified: false, name: 'Carla', dist: 2.8,
    formats: ['Estándar', 'Casual'], colors: ['yellow'], level: 'Casual',
    favCard: { name: 'Charlotte Katakuri (OP03-099)', img: opImg('OP03-099') },
    bio: 'Empecé con el mazo de inicio de Luffy y ya no hay vuelta atrás. Busco partidas tranquilas para aprender.',
    decks: [
      { name: 'Katakuri Amarillo', format: 'Estándar', card: { name: 'Charlotte Katakuri (OP03-099)', img: opImg('OP03-099') } },
      { name: 'Luffy de inicio', format: 'Casual', card: { name: 'Monkey.D.Luffy (ST01-001)', img: opImg('ST01-001') } },
    ],
    stores: ['s4', 's3'], availability: 'Fines de semana',
  },
];
