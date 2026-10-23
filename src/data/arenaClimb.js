// THE ARENA CLIMB: the eight arenas' rating gates, each arena's sigil, and the climb read from a
// rating. Shared by the phone and the web (the Stats hero: THE CLIMB).
//
// ARENAS mirrors both apps' areas lists (ids, names, rating gates; the apps keep their own art and
// felts). Each arena's SIGIL is a 13x13 grid on the poker hand matrix (13 ranks x 13 ranks: pairs on
// the diagonal, suited above, offsuit below), authored as a silhouette (keyhole, wicket, teapot,
// mirror X, club, diamond, spade, heart; flop52web src/data/arenaSigils.js is the original, its
// test asserts Hall of Mirrors is its own transpose).
//
//   arenaClimb(rating)        -> { index, current, next, progress (0..1 toward next), toGo, top }
//   sigilLattice(id, progress) -> 169 cells { mark (the sigil has it), lit (earned) }, lit from the
//                                sigil's centre out in proportion to progress: the next arena's
//                                sigil resolves as the player climbs toward it.
//
// THE SEAL (2.0, "The World"): the 52 ring around the current arena's art. Thirteen cards per suit,
// filled clockwise from the top (spades first). Each quarter the ring closes grants that arena's
// suit reward; the fourth (clubs) is the gate itself. At the Heart Throne the ring turns gold.
// No figure is ever shown from it: the seal is the only read of the climb a player sees.
//
//   sealFor(rating)            -> { arenaIndex, arenaId, quarter (0..4), fill (k/52), lit (0..52), gold }
//   sealChange(before, after)  -> { before, after, quartersCrossed [{arenaIndex, quarter}], gateCrossed,
//                                   promotedTo (arena id | null), demoted }

const ARENAS = Object.freeze([
  Object.freeze({ id: 'rabbits-burrow', name: "Rabbit's Burrow", minRating: 0 }),
  Object.freeze({ id: 'croquet-lawn', name: 'Croquet Lawn', minRating: 1100 }),
  Object.freeze({ id: 'tea-garden', name: 'Tea Garden', minRating: 1250 }),
  Object.freeze({ id: 'hall-of-mirrors', name: 'Hall of Mirrors', minRating: 1400 }),
  Object.freeze({ id: 'clubshire-court', name: 'Clubshire Court', minRating: 1550 }),
  Object.freeze({ id: 'diamond-vault', name: 'Diamond Vault', minRating: 1700 }),
  Object.freeze({ id: 'spade-keep', name: 'Spade Keep', minRating: 1850 }),
  Object.freeze({ id: 'heart-throne', name: 'Heart Throne', minRating: 2000 }),
]);

const SIGIL_SIZE = 13;
const SIGILS = Object.freeze({
  'rabbits-burrow': Object.freeze([
    '0000000000000',
    '0000111110000',
    '0001111111000',
    '0011111111100',
    '0011111111100',
    '0011111111100',
    '0001111111000',
    '0000111110000',
    '0000111110000',
    '0001111111000',
    '0011111111100',
    '0011111111100',
    '0000000000000',
  ]),
  'croquet-lawn': Object.freeze([
    '0000000000000',
    '0000000000000',
    '0011111111100',
    '0111111111110',
    '1110000000111',
    '1100000000011',
    '1100000000011',
    '1100000000011',
    '1100000000011',
    '1100000000011',
    '1100000000011',
    '1100000000011',
    '0000000000000',
  ]),
  'tea-garden': Object.freeze([
    '0000000000000',
    '0000001000000',
    '0000011100000',
    '0001111111000',
    '0011111111100',
    '1111111111110',
    '1111111111111',
    '0111111111110',
    '0011111111100',
    '0001111111000',
    '0000111110000',
    '0000000000000',
    '0000000000000',
  ]),
  'hall-of-mirrors': Object.freeze([
    '1000000000001',
    '0100000000010',
    '0010000000100',
    '0001000001000',
    '0000100010000',
    '0000010100000',
    '0000001000000',
    '0000010100000',
    '0000100010000',
    '0001000001000',
    '0010000000100',
    '0100000000010',
    '1000000000001',
  ]),
  'clubshire-court': Object.freeze([
    '0000011100000',
    '0001111111000',
    '0001111111000',
    '0011111111100',
    '0110011100110',
    '1111011101111',
    '1111111111111',
    '1111111111111',
    '0111111111110',
    '0011111111100',
    '0000011100000',
    '0000111110000',
    '0000000000000',
  ]),
  'diamond-vault': Object.freeze([
    '0000001000000',
    '0000011100000',
    '0000111110000',
    '0001111111000',
    '0011111111100',
    '0111111111110',
    '1111111111111',
    '0111111111110',
    '0011111111100',
    '0001111111000',
    '0000111110000',
    '0000011100000',
    '0000001000000',
  ]),
  'spade-keep': Object.freeze([
    '0000001000000',
    '0000011100000',
    '0000111110000',
    '0001111111000',
    '0011111111100',
    '0111111111110',
    '1111111111111',
    '1111111111111',
    '1111111111111',
    '0111110111110',
    '0000011100000',
    '0000111110000',
    '0000000000000',
  ]),
  'heart-throne': Object.freeze([
    '0000000000000',
    '0110000000110',
    '1111000001111',
    '1111100011111',
    '1111111111111',
    '1111111111111',
    '0111111111110',
    '0011111111100',
    '0001111111000',
    '0000111110000',
    '0000011100000',
    '0000001000000',
    '0000000000000',
  ]),
});

const ROMAN = Object.freeze(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']);

function arenaClimb(rating) {
  const r = Number.isFinite(Number(rating)) ? Number(rating) : 0;
  let index = 0;
  ARENAS.forEach((a, i) => { if (r >= a.minRating) index = i; });
  const current = ARENAS[index];
  const next = ARENAS[index + 1] || null;
  const span = next ? next.minRating - current.minRating : 0;
  const progress = next ? Math.max(0, Math.min(1, (r - current.minRating) / span)) : 1;
  return {
    index,
    numeral: ROMAN[index],
    current,
    next,
    progress,
    toGo: next ? Math.max(0, Math.ceil(next.minRating - r)) : 0,
    top: !next,
  };
}

function sigilLattice(id, progress = 0) {
  const rows = SIGILS[id];
  if (!rows) return [];
  const mid = (SIGIL_SIZE - 1) / 2;
  const marks = [];
  rows.forEach((row, r) => row.split('').forEach((v, c) => {
    if (v === '1') marks.push({ at: r * SIGIL_SIZE + c, d: Math.abs(r - mid) + Math.abs(c - mid), r, c });
  }));
  marks.sort((a, b) => a.d - b.d || a.r - b.r || a.c - b.c);
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  const earned = new Set(marks.slice(0, Math.round(marks.length * p)).map((m) => m.at));
  const cells = [];
  rows.forEach((row, r) => row.split('').forEach((v, c) => {
    const at = r * SIGIL_SIZE + c;
    cells.push({ at, mark: v === '1', lit: earned.has(at) });
  }));
  return cells;
}

const SEAL_CARDS = 52;
// The four quarters, in fill order, and what closing each one grants in that arena. Q4 (clubs) is
// the gate: crossing it is the promotion, and the next arena's back deals in.
const SEAL_QUARTERS = Object.freeze([
  Object.freeze({ quarter: 1, suit: 'spades', glyph: '\u2660', reward: 'felt', label: 'Felt tint' }),
  Object.freeze({ quarter: 2, suit: 'hearts', glyph: '\u2665', reward: 'protector', label: 'Arena protector' }),
  Object.freeze({ quarter: 3, suit: 'diamonds', glyph: '\u2666', reward: 'title', label: 'Arena title' }),
  Object.freeze({ quarter: 4, suit: 'clubs', glyph: '\u2663', reward: 'gate', label: 'The gate opens' }),
]);

function sealFor(rating) {
  const climb = arenaClimb(rating);
  if (climb.top) {
    return { arenaIndex: climb.index, arenaId: climb.current.id, quarter: 4, fill: 1, lit: SEAL_CARDS, gold: true };
  }
  // Floor, not round: a card lights only once it is earned, so the ring never shows the gate
  // closed while the rating is still under it.
  const lit = Math.min(SEAL_CARDS - 1, Math.floor(climb.progress * SEAL_CARDS + 1e-9));
  const fill = lit / SEAL_CARDS;
  return { arenaIndex: climb.index, arenaId: climb.current.id, quarter: Math.floor(lit / 13), fill, lit, gold: false };
}

// What a rating move did to the seal: the quarters closed on the way up (across arenas, in order)
// and whether a gate was crossed. A fall reports demoted and grants nothing.
function sealChange(beforeRating, afterRating) {
  const before = sealFor(beforeRating);
  const after = sealFor(afterRating);
  const quartersCrossed = [];
  const rank = (s) => s.arenaIndex * 4 + s.quarter;
  for (let k = rank(before) + 1; k <= rank(after); k += 1) {
    const arenaIndex = Math.floor((k - 1) / 4);
    const quarter = ((k - 1) % 4) + 1;
    if (arenaIndex < ARENAS.length - 1 || quarter < 4) quartersCrossed.push({ arenaIndex, quarter });
  }
  const gateCrossed = after.arenaIndex > before.arenaIndex;
  return {
    before,
    after,
    quartersCrossed,
    gateCrossed,
    promotedTo: gateCrossed ? after.arenaId : null,
    demoted: after.arenaIndex < before.arenaIndex,
  };
}

module.exports = {
  ARENAS, SIGILS, SIGIL_SIZE, ARENA_NUMERALS: ROMAN, arenaClimb, sigilLattice,
  SEAL_CARDS, SEAL_QUARTERS, sealFor, sealChange,
};
