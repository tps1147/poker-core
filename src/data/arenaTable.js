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
//                      its rail (ARENA_RAILS: the generated ring's fit, metal, shine), how many
//                      motifs travel the rail, whether one crosses the felt
//   dealerSeat(stats)  where the dealer button sits: on the streak when you are on a run (3+ days),
//                      else on today when today is up, else nowhere (never on a stat that is down)
//   rankBand(rank)     the leaderboard's say on the table: 'crown' top 10, 'gilt' top 100, 'brass'
//                      top 1,000, else null
//   railPoint(t, rx, ry)  a point on the rail ellipse, t 0..1 clockwise from the top
//   stadiumPoint(t, w, h) a point on the base table's own outline (a stadium: w wide, h tall, ends
//                         of radius h/2), t 0..1 of its perimeter clockwise from the top centre,
//                         with the outward normal: where the studs and travellers sit
//   stadiumPath(cx, cy, w, h)  that outline as SVG path data, clockwise from the top centre
//   edgePoint(x, row, w, h)    a seat's place: the top or bottom outline at x (a fraction of w)
//
// MOTIFS are 24x24 path data (one per arena), drawn the same way by react-native-svg and the web's
// <svg>.

const { ARENAS } = require('./arenaClimb');

// THE RAIL, by arena: each arena's table is dressed in a generated ring (the art lives in each app as
// ring-<arena id>.webp; _media/stats-hub/rails holds the sources and rings.py) drawn from its card
// back: `ring` is where the ring sits on the table, as fractions of the table's box (the art is cut
// from a render of this exact table, so it lays on the app's BaseTable); `metal` colours the glow
// under the table; `shine` runs a light through the art (from the Tea Garden on).
const ARENA_RAILS = Object.freeze([
  Object.freeze({ metal: '#7fa3d6', shine: false, ring: Object.freeze({ x: -0.0624, y: -0.1352, w: 1.0815, h: 1.304 }) }), // a woven steel-blue lattice with silver pocket-watch medallions
  Object.freeze({ metal: '#8fbf7a', shine: false, ring: Object.freeze({ x: -0.0644, y: -0.1683, w: 1.1355, h: 1.3425 }) }), // a clipped topiary hedge with pewter croquet hoops
  Object.freeze({ metal: '#c98a5e', shine: true, ring: Object.freeze({ x: -0.0731, y: -0.1231, w: 1.1328, h: 1.2603 }) }), // copper vines and roses with a teacup at each end
  Object.freeze({ metal: '#dfe3ea', shine: true, ring: Object.freeze({ x: -0.1586, y: -0.1515, w: 1.3166, h: 1.3058 }) }), // a silver art-deco band with mirror panels and sunburst fans
  Object.freeze({ metal: '#45b487', shine: true, ring: Object.freeze({ x: -0.0497, y: -0.1439, w: 1.1183, h: 1.29 }) }), // an emerald leather band with gold clubs and crests
  Object.freeze({ metal: '#d9ae55', shine: true, ring: Object.freeze({ x: -0.1379, y: -0.207, w: 1.2758, h: 1.4228 }) }), // a gold vault lattice set with blue gems and rosettes
  Object.freeze({ metal: '#62c9b9', shine: true, ring: Object.freeze({ x: -0.1139, y: -0.1632, w: 1.2278, h: 1.3184 }) }), // teal-and-silver battlements with spade-flag turrets
  Object.freeze({ metal: '#e3b95c', shine: true, ring: Object.freeze({ x: -0.099, y: -0.2011, w: 1.1989, h: 1.4215 }) }), // gold filigree with hearts and a crown at each end
]);

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
// The stage, as fractions of its width: the base table (a wide stadium) in the middle, the seats
// standing on its top and bottom edges (`sink` of each seat over the cloth, the rest outside).
const TABLE_LAYOUT = Object.freeze({ tableW: 0.8, tableH: 0.4, stageH: 0.79, seat: 40, sink: 8 });

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

// Three seats along the top edge and three along the bottom, the way a six-handed table seats its
// players: `x` is the seat's place along the table's width (-0.5 .. 0.5 of it), `row` its edge.
// `label` is the short word by the figure (keep it to 8 characters); `name` is what a screen
// reader hears.
const TABLE_SEATS = Object.freeze([
  Object.freeze({ key: 'hands', label: 'Hands', name: 'Hands played', row: 'top', x: -0.35 }),
  Object.freeze({ key: 'rank', label: 'Rank', name: 'Rank', row: 'top', x: 0 }),
  Object.freeze({ key: 'winRate', label: 'Win rate', name: 'Win rate', row: 'top', x: 0.35 }),
  Object.freeze({ key: 'streak', label: 'Streak', name: 'Streak', row: 'bottom', x: -0.35 }),
  Object.freeze({ key: 'today', label: 'Today', name: 'Today', row: 'bottom', x: 0 }),
  Object.freeze({ key: 'seasonHigh', label: 'Best', name: 'Season high', row: 'bottom', x: 0.35 }),
]);

function tableDecor(index) {
  const i = Math.max(0, Math.min(ARENAS.length - 1, Number.isFinite(index) ? Math.floor(index) : 0));
  const arena = ARENAS[i];
  return {
    arena,
    level: i,
    emblem: EMBLEM_OF[arena.id],
    motif: MOTIF_OF[arena.id],
    rail: ARENA_RAILS[i],
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

// Where a seat sits: the table's top or bottom outline at `x` (a fraction of its width), centre-relative.
function edgePoint(x, row, w, h) {
  const r = h / 2;
  const s = Math.max(0, w / 2 - r);
  const px = x * w;
  const over = Math.max(0, Math.abs(px) - s);
  const dy = over >= r ? 0 : Math.sqrt(r * r - over * over);
  return { x: px, y: row === 'top' ? -dy : dy };
}

function stadiumPath(cx, cy, w, h) {
  const r = h / 2;
  const s = Math.max(0, w / 2 - r);
  return `M ${cx} ${cy - r} H ${cx + s} A ${r} ${r} 0 0 1 ${cx + s} ${cy + r} H ${cx - s} A ${r} ${r} 0 0 1 ${cx - s} ${cy - r} Z`;
}

module.exports = { ARENA_RAILS, stadiumPoint, stadiumPath, edgePoint, TABLE_SEATS, MOTIFS, MOTIF_OF, EMBLEM_OF, TABLE_LAYOUT, tableDecor, dealerSeat, rankBand, railPoint };
