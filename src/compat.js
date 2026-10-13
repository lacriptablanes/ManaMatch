// Compatibilidad entre tu perfil y el de otro jugador (0–100) y los motivos que la explican.
// Pesos: juegos en común 40 · disponibilidad 15 · formatos 15 · nivel 10 · tienda compartida 10 · cercanía 10.
// En producción se calculará igual en el servidor; aquí se usa para ordenar y explicar el mazo de perfiles.

const LEVEL_ORDER = ['Casual', 'Casual competitivo', 'Competitivo'];

export function compat(me, p) {
  const mine = me.interests ?? [], theirs = p.interests ?? [];
  const shared = theirs.filter((g) => mine.includes(g));
  // Con 3 juegos en común (o todos los que tenga el que menos) ya es la puntuación máxima
  const games = shared.length ? Math.min(1, shared.length / Math.max(1, Math.min(3, mine.length, theirs.length))) : 0;

  // Formatos y nivel solo se comparan en el juego principal del otro, si tú también tienes perfil en él
  const myProf = mine.includes(p.game) ? me.profiles?.[p.game] : null;
  const sharedFormats = myProf ? p.formats.filter((f) => myProf.formats.includes(f)) : [];
  const formats = myProf ? (sharedFormats.length ? 1 : 0.2) : 0;
  const lvlDiff = myProf ? Math.abs(LEVEL_ORDER.indexOf(myProf.level) - LEVEL_ORDER.indexOf(p.level)) : 2;
  const level = [1, 0.5, 0][lvlDiff] ?? 0;

  const sharedDays = (p.days ?? []).filter((d) => me.days.includes(d));
  const sharedSlots = (p.slots ?? []).filter((s) => me.slots.includes(s));
  // Sin disponibilidad indicada no penalizamos del todo: aún no sabemos si coincidís
  const time = !me.days.length || !p.days?.length ? 0.5 : sharedDays.length ? (sharedSlots.length || !me.slots.length ? 1 : 0.6) : 0;

  const sharedStores = (p.stores ?? []).filter((s) => me.stores.includes(s));
  const stores = sharedStores.length ? 1 : 0;
  const near = Math.max(0, 1 - p.dist / Math.max(me.radius, 1));

  const score = Math.round(100 * (0.4 * games + 0.15 * time + 0.15 * formats + 0.1 * level + 0.1 * stores + 0.1 * near));
  return { score, shared, sharedFormats, sharedDays, sharedSlots, sharedStores, sameLevel: lvlDiff === 0 };
}

/* Ordena de más a menos compatible; a igualdad, el más cercano primero */
export const byCompat = (me) => (a, b) => compat(me, b).score - compat(me, a).score || a.dist - b.dist;
