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

module.exports = { ARENAS, SIGILS, SIGIL_SIZE, ARENA_NUMERALS: ROMAN, arenaClimb, sigilLattice };
