// Títulos de jugador, como en los videojuegos: se desbloquean jugando y cada uno elige cuál enseñar
// bajo su retrato. El texto está en castellano y se traduce al mostrarlo (t()).
// Nota: hoy los requisitos se comprueban en la app; cuando haya datos reales, el servidor debe validarlos.

export const TITLES = [
  { id: 'rookie', label: 'Recién llegado', hint: 'Disponible desde el principio', test: () => true },
  { id: 'duelist', label: 'Duelista', hint: 'Juega tu primera partida confirmada', test: (s) => s.played >= 1 },
  { id: 'regular', label: 'Habitual de tienda', hint: 'Marca 2 tiendas habituales', test: (s) => s.stores >= 2 },
  { id: 'multi', label: 'Multijuego', hint: 'Ten 5 juegos o más en tu lista', test: (s) => s.games >= 5 },
  { id: 'collector', label: 'Coleccionista', hint: 'Añade 3 mazos', test: (s) => s.decks >= 3 },
  { id: 'competitor', label: 'Competidor', hint: 'Juega a nivel competitivo', test: (s) => s.level === 'Competitivo' },
  { id: 'honor', label: 'Palabra de honor', hint: 'Consigue la insignia Fiable', test: (s) => s.reliable },
  { id: 'veteran', label: 'Veterano', hint: 'Juega 20 partidas confirmadas', test: (s) => s.played >= 20 },
];
const BY_ID = Object.fromEntries(TITLES.map((x) => [x.id, x]));
// Si alguien no ha elegido, se muestra el mejor que tenga (de más a menos difícil)
// ("Verificado" no es un título: ya se ve con la marca junto al nombre)
const BEST = ['veteran', 'honor', 'collector', 'multi', 'competitor', 'regular', 'duelist', 'rookie'];

export const unlockedTitles = (stats) => TITLES.filter((x) => x.test(stats)).map((x) => x.id);
export const titleFor = (chosen, stats) => {
  const ok = unlockedTitles(stats);
  const id = ok.includes(chosen) ? chosen : BEST.find((x) => ok.includes(x));
  return BY_ID[id];
};
