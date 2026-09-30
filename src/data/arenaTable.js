// THE STATS TABLE: the Stats hero drawn as a poker table seen from above (the Stats redesign,
// round 2, 2026-09-30). The player's rating is the pot in the middle; six stats sit in the seats;
// the table itself grows more detailed arena by arena, so climbing the rating ladder shows on the
// felt. Shared by the phone and the web so the two tables are the same table.
//
//   TABLE_SEATS        the six seats, clockwise from the top: which stat, its glyph
//   tableDecor(index)  the arena's table: its motif, the rail features it has earned (cumulative,
//                      one more per arena), how many motifs travel the rail, whether one crosses
//                      the felt
//   dealerSeat(stats)  where the dealer button sits: on the streak when you are on a run (3+ days),
//                      else on today when today is up, else nowhere (never on a stat that is down)
//   rankBand(rank)     the leaderboard's say on the table: 'crown' top 10, 'gilt' top 100, 'brass'
//                      top 1,000, else null
//   railPoint(t, rx, ry)  a point on the rail ellipse, t 0..1 clockwise from the top
//
// Glyphs are 24x24 path data, drawn the same way by react-native-svg and the web's <svg>: MOTIFS
// (one per arena, the arena's own emblem) and SEAT_GLYPHS (cream on each seat's Flop52 chip).

const { ARENAS } = require('./arenaClimb');

// Every feature the rail can wear, in the order the arenas earn them (the first arena has none).
const RAIL_FEATURES = Object.freeze(['inlay', 'studs', 'doubleRail', 'motifs', 'gems', 'filigree', 'crown']);

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

// Cream line glyphs for the seat chips (stroke 1.8).
const SEAT_GLYPHS = Object.freeze({
  rank: 'M4 17.5 5.5 8l4.2 4L12 5.5l2.3 6.5 4.2-4 1.5 9.5z M4.5 20.5h15',
  hands: 'M5.5 6.5h8a1.2 1.2 0 0 1 1.2 1.2v11.1a1.2 1.2 0 0 1-1.2 1.2h-8a1.2 1.2 0 0 1-1.2-1.2V7.7a1.2 1.2 0 0 1 1.2-1.2z M15.5 5l3.3.9a1.2 1.2 0 0 1 .8 1.5l-2.9 10.7',
  winRate: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17z M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 11.2a.8.8 0 1 0 0 1.6a.8.8 0 1 0 0-1.6z',
  streak: 'M12 3c.8 3.2 5 5.4 5 10.2a5 5 0 0 1-10 0c0-2.6 1.4-4.2 2.4-5.2.3 2 1.2 3 2.3 3.3-.5-2.8-.6-5.6.3-8.3z',
  seasonHigh: 'M2.5 20.5 9 10l4 6 2.5-3.5 6 8z M15 12.5V4.5l4.5 1.8-4.5 1.8',
  today: 'M12 19.5V5.5 M6.5 11 12 5.5 17.5 11 M5 21h14',
});

// Clockwise from the top of the table. `at` is the seat's angle on the rail (0 = top, 0.5 = bottom).
const TABLE_SEATS = Object.freeze([
  Object.freeze({ key: 'rank', label: 'Rank', at: 0 }),
  Object.freeze({ key: 'winRate', label: 'Win rate', at: 0.17 }),
  Object.freeze({ key: 'seasonHigh', label: 'Season high', at: 0.33 }),
  Object.freeze({ key: 'today', label: 'Today', at: 0.5 }),
  Object.freeze({ key: 'streak', label: 'Streak', at: 0.67 }),
  Object.freeze({ key: 'hands', label: 'Hands', at: 0.83 }),
]);

function tableDecor(index) {
  const i = Math.max(0, Math.min(ARENAS.length - 1, Number.isFinite(index) ? Math.floor(index) : 0));
  const arena = ARENAS[i];
  const features = {};
  RAIL_FEATURES.forEach((name, n) => { features[name] = i > n; });
  return {
    arena,
    level: i,
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

module.exports = { TABLE_SEATS, RAIL_FEATURES, MOTIFS, MOTIF_OF, SEAT_GLYPHS, tableDecor, dealerSeat, rankBand, railPoint };
