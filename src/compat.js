// Compatibilidad entre tu perfil y el de otro jugador (0–100) y los motivos que la explican.
// Pesos: juegos en común 40 · disponibilidad 15 · formatos 15 · nivel 10 · tienda compartida 10 · cercanía 10.
// En producción se calculará igual en el servidor; aquí se usa para ordenar y explicar el mazo de perfiles.

const LEVEL_ORDER = ['Casual', 'Casual competitivo', 'Competitivo'];

export function compat(me, p) {
  const mine = me.interests ?? [], theirs = p.interests ?? [];
  const shared = theirs.filter((g) => mine.includes(g));
  // Con 3 juegos en común (o todos los que tenga el que menos) ya es la puntuación máxima
  const games = shared.length ? Math.min(1, shared.length / Math.max(1, Math.min(3, mine.length, theirs.length))) : 0;

  // Formatos en común (de cualquier juego) y nivel parecido
  const myFormats = me.formats ?? [];
  const sharedFormats = (p.formats ?? []).filter((f) => myFormats.includes(f));
  const formats = sharedFormats.length ? 1 : myFormats.length ? 0.2 : 0.5;
  const lvlDiff = Math.abs(LEVEL_ORDER.indexOf(me.level) - LEVEL_ORDER.indexOf(p.level));
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

/* Fiabilidad: con al menos 3 partidas confirmadas, "Fiable" si casi nunca falla.
   Quien falla a menudo no se señala en público: simplemente aparece más tarde en el mazo. */
export const MIN_PLAYED = 3;
export function reliability(p) {
  const played = p.rel?.played ?? 0, noShow = p.rel?.noShow ?? 0;
  const total = played + noShow;
  if (total < MIN_PLAYED) return { level: 'new', played, factor: 1 };
  const rate = noShow / total;
  if (rate <= 0.1) return { level: 'reliable', played, factor: 1.05 };
  return { level: rate >= 0.25 ? 'flaky' : 'ok', played, factor: rate >= 0.25 ? 0.7 : 0.95 };
}

/* Ordena de más a menos compatible (ajustado por fiabilidad); a igualdad, el más cercano primero */
const rank = (me, p) => compat(me, p).score * reliability(p).factor;
export const byCompat = (me) => (a, b) => rank(me, b) - rank(me, a) || a.dist - b.dist;
