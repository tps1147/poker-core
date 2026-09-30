// THE STATS TABLE: the Stats hero drawn as a poker table seen from above (the Stats redesign,
// round 2, 2026-09-30). The player's rating is the pot in the middle; six stats sit in the seats;
// the table itself grows more detailed arena by arena, so climbing the rating ladder shows on the
// felt. Shared by the phone and the web so the two tables are the same table.
//
//   TABLE_SEATS        the six seats, clockwise from the top: which stat sits there (each app draws
//                      the seat as its own vinyl object on a coaster: crown, chip stacks, trophy,
//                      hourglass, brazier, dealt cards)
//   TABLE_LAYOUT       the stage's proportions: the base table (a stadium) and the seat size
//   tableDecor(index)  the arena's table: its emblem over the pot (grander as you climb), its motif,
//                      the rail features it has earned (cumulative, one more per arena), how many
//                      motifs travel the rail, whether one crosses the felt
//   dealerSeat(stats)  where the dealer button sits: on the streak when you are on a run (3+ days),
//                      else on today when today is up, else nowhere (never on a stat that is down)
//   rankBand(rank)     the leaderboard's say on the table: 'crown' top 10, 'gilt' top 100, 'brass'
//                      top 1,000, else null
//   railPoint(t, rx, ry)  a point on the rail ellipse, t 0..1 clockwise from the top
//   stadiumPoint(t, w, h) a point on the base table's own outline (a stadium: w wide, h tall, ends
//                         of radius h/2), t 0..1 of its perimeter clockwise from the top centre,
//                         with the outward normal: where the seats, studs and travellers sit
//   stadiumPath(cx, cy, w, h)  that outline as SVG path data, clockwise from the top centre
//
// MOTIFS are 24x24 path data (one per arena), drawn the same way by react-native-svg and the web's
// <svg>.

const { ARENAS } = require('./arenaClimb');

// Every feature the rail can wear, in the order the arenas earn them (the first arena has none).
const RAIL_FEATURES = Object.freeze(['inlay', 'studs', 'doubleRail', 'motifs', 'gems', 'filigree', 'crown']);

// The emblem over the pot, by arena: a fresh sealed deck to start, then the dealer's puck, the card
// crest, the suit compass, and the crown of cards (the flop as a crown) for the last two arenas.
const EMBLEM_OF = Object.freeze({
  'rabbits-burrow': 'deck',
  'croquet-lawn': 'puck',
  'tea-garden': 'card',
  'hall-of-mirrors': 'card',
  'clubshire-court': 'compass',
  'diamond-vault': 'compass',
  'spade-keep': 'crown',
  'heart-throne': 'crown',
});

// The stage, as fractions of its width: the base table (stadium) in the middle, the seats on its edge.
const TABLE_LAYOUT = Object.freeze({ tableW: 0.62, tableH: 0.44, stageH: 0.82, seat: 52 });

const MOTIF_OF = Object.freeze({
  'rabbits-burrow': 'watch',
  'croquet-lawn': 'hoop',
  'tea-garden': 'teacup',
  'hall-of-mirrors': 'mirror',
  'clubshire-court': 'club',
  'diamond-vault': 'diamond',
  'spade-keep': 'spade',
  'heart-throne': 'heart',
});

// mode 'stroke': a line drawing (stroke 1.6); 'fill': a solid shape.
const MOTIFS = Object.freeze({
  watch: Object.freeze({ mode: 'stroke', d: 'M12 7.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z M12 11v3l2 1.5 M10.5 3.5h3 M12 3.5v4' }),
  hoop: Object.freeze({ mode: 'stroke', d: 'M6 20V11a6 6 0 0 1 12 0v9 M4 20h4 M16 20h4 M10.2 17.5a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0' }),
  teacup: Object.freeze({ mode: 'stroke', d: 'M5 10h11v3.5a5.5 5.5 0 0 1-11 0z M16 11.5h1.5a2.25 2.25 0 0 1 0 4.5H15 M4 21h13 M8.5 3.5c-1 1.2 1 2 0 3.5 M12.5 3.5c-1 1.2 1 2 0 3.5' }),
  mirror: Object.freeze({ mode: 'stroke', d: 'M12 3a5.5 7 0 1 0 0.01 0z M12 17v4 M9 21h6 M10 7.5l2.5-2 M9.5 10.5l4.5-3.5' }),
  club: Object.freeze({ mode: 'fill', d: 'M12 2.5a4.2 4.2 0 0 0-3.9 5.8A4.2 4.2 0 1 0 10.6 15.9L9.5 21.5h5l-1.1-5.6a4.2 4.2 0 1 0 2.5-7.6A4.2 4.2 0 0 0 12 2.5z' }),
  diamond: Object.freeze({ mode: 'fill', d: 'M12 2l7.5 10L12 22 4.5 12z' }),
  spade: Object.freeze({ mode: 'fill', d: 'M12 2.5C9.5 6.5 4 9.3 4 13.6a4.1 4.1 0 0 0 7 2.9l-1.3 5h4.6l-1.3-5a4.1 4.1 0 0 0 7-2.9C20 9.3 14.5 6.5 12 2.5z' }),
  heart: Object.freeze({ mode: 'fill', d: 'M12 20.5C6.5 16.2 3 13 3 9a4.5 4.5 0 0 1 9-1.2A4.5 4.5 0 0 1 21 9c0 4-3.5 7.2-9 11.5z' }),
});

// Clockwise from the top of the table. `at` is the seat's angle on the rail (0 = top, 0.5 = bottom).
// `label` is the short word under the figure (a phone's side seat has about 54pt for it); `name` is
// what a screen reader hears.
const TABLE_SEATS = Object.freeze([
  Object.freeze({ key: 'rank', label: 'Rank', name: 'Rank', at: 0 }),
  Object.freeze({ key: 'winRate', label: 'Win rate', name: 'Win rate', at: 0.17 }),
  Object.freeze({ key: 'seasonHigh', label: 'Best', name: 'Season high', at: 0.33 }),
  Object.freeze({ key: 'today', label: 'Today', name: 'Today', at: 0.5 }),
  Object.freeze({ key: 'streak', label: 'Streak', name: 'Streak', at: 0.67 }),
  Object.freeze({ key: 'hands', label: 'Hands', name: 'Hands played', at: 0.83 }),
]);

function tableDecor(index) {
  const i = Math.max(0, Math.min(ARENAS.length - 1, Number.isFinite(index) ? Math.floor(index) : 0));
  const arena = ARENAS[i];
  const features = {};
  RAIL_FEATURES.forEach((name, n) => { features[name] = i > n; });
  return {
    arena,
    level: i,
    emblem: EMBLEM_OF[arena.id],
    motif: MOTIF_OF[arena.id],
    features,
    travellers: 1 + Math.floor(i / 2),
    crossing: i >= 2,
  };
}

function dealerSeat({ streak = null, delta = null } = {}) {
  if (Number.isFinite(streak) && streak >= 3) return 'streak';
  if (Number.isFinite(delta) && delta > 0) return 'today';
  return null;
}

function rankBand(rank) {
  if (!Number.isFinite(rank) || rank < 1) return null;
  if (rank <= 10) return 'crown';
  if (rank <= 100) return 'gilt';
  if (rank <= 1000) return 'brass';
  return null;
}

function railPoint(t, rx, ry) {
  const a = ((Number(t) || 0) % 1) * Math.PI * 2;
  return { x: Math.sin(a) * rx, y: -Math.cos(a) * ry, angle: (a * 180) / Math.PI };
}

function stadiumPoint(t, w, h) {
  const r = h / 2;
  const s = Math.max(0, w / 2 - r);
  const arc = Math.PI * r;
  const perimeter = 4 * s + 2 * arc;
  let d = (((Number(t) || 0) % 1) + 1) % 1 * perimeter;
  if (d <= s) return { x: d, y: -r, nx: 0, ny: -1 };
  d -= s;
  if (d <= arc) { const a = d / r; return { x: s + Math.sin(a) * r, y: -Math.cos(a) * r, nx: Math.sin(a), ny: -Math.cos(a) }; }
  d -= arc;
  if (d <= 2 * s) return { x: s - d, y: r, nx: 0, ny: 1 };
  d -= 2 * s;
  if (d <= arc) { const a = d / r; return { x: -s - Math.sin(a) * r, y: Math.cos(a) * r, nx: -Math.sin(a), ny: Math.cos(a) }; }
  d -= arc;
  return { x: -s + d, y: -r, nx: 0, ny: -1 };
}

function stadiumPath(cx, cy, w, h) {
  const r = h / 2;
  const s = Math.max(0, w / 2 - r);
  return `M ${cx} ${cy - r} H ${cx + s} A ${r} ${r} 0 0 1 ${cx + s} ${cy + r} H ${cx - s} A ${r} ${r} 0 0 1 ${cx - s} ${cy - r} Z`;
}

module.exports = { stadiumPoint, stadiumPath, TABLE_SEATS, RAIL_FEATURES, MOTIFS, MOTIF_OF, EMBLEM_OF, TABLE_LAYOUT, tableDecor, dealerSeat, rankBand, railPoint };
