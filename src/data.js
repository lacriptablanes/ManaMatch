// Imágenes de las cartas: Scryfall (Magic), Pokémon TCG API (Pokémon) y OPTCG API (One Piece).
// Los jugadores vienen de Supabase (profileStore.js); aquí solo quedan las tiendas de ejemplo.
export const cardArt = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=art_crop`;
export const cardImg = (name) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
export const pokeImg = (set, n) => `https://images.pokemontcg.io/${set}/${n}_hires.png`;
export const opImg = (code) => `https://optcgapi.com/media/static/Card_Images/${code}.jpg`;

// Tiendas de ejemplo (en producción vendrán de la tabla stores). Direcciones ficticias.
// Apartadas: no se muestran hasta tener un sistema para añadir tiendas (STORES_ENABLED en App.jsx).
// schedule: [día (L M X J V S D), hora, nombre del evento, juego]
export const STORES = [
  {
    id: 's1', name: 'Dragón Rojo Games', dist: 0.8, events: 'FNM viernes 19:00 · Commander miércoles',
    address: 'Calle del Dragón 12', hours: 'L–S · 11:00–21:00', games: ['magic', 'pokemon', 'lorcana', 'wh40k'],
    schedule: [['X', '18:00', 'Commander casual', 'magic'], ['V', '19:00', 'Friday Night Magic', 'magic'], ['S', '11:00', 'Liga Pokémon', 'pokemon']],
  },
  {
    id: 's2', name: 'La Guarida del Mago', dist: 1.6, events: 'Pioneer jueves · Pokémon sábados',
    address: 'Plaza de los Magos 3', hours: 'L–V · 17:00–21:30 · S 10:00–14:00', games: ['magic', 'pokemon', 'yugioh'],
    schedule: [['J', '18:30', 'Pioneer', 'magic'], ['S', '10:30', 'Liga Pokémon', 'pokemon'], ['D', '17:00', 'Torneo Yu-Gi-Oh!', 'yugioh']],
  },
  {
    id: 's3', name: 'Cripta TCG', dist: 2.4, events: 'Modern martes · Draft domingos',
    address: 'Avenida de la Cripta 45', hours: 'M–D · 16:00–22:00', games: ['magic', 'fab', 'onepiece', 'kill-team'],
    schedule: [['M', '19:00', 'Modern', 'magic'], ['J', '19:00', 'Flesh and Blood Armory', 'fab'], ['D', '17:00', 'Draft', 'magic']],
  },
  {
    id: 's4', name: 'Meeple & Mana', dist: 3.9, events: 'One Piece lunes · Lorcana sábados',
    address: 'Calle de las Mesas 7', hours: 'L–S · 10:00–20:30', games: ['onepiece', 'lorcana', 'catan', 'dnd', 'root'],
    schedule: [['L', '18:00', 'Torneo One Piece', 'onepiece'], ['X', '19:30', 'Noche de juegos de mesa', 'catan'], ['S', '17:00', 'Liga Lorcana', 'lorcana']],
  },
];
