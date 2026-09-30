// The Stats table: seats, each arena's decor, the dealer seat, the rank band, the rail.
//   node test/arenaTable.test.js
const assert = require('node:assert/strict');
const { ARENAS, TABLE_SEATS, RAIL_FEATURES, MOTIFS, MOTIF_OF, SEAT_GLYPHS, tableDecor, dealerSeat, rankBand, railPoint } = require('../src/data');

assert.deepEqual(TABLE_SEATS.map((s) => s.key), ['rank', 'winRate', 'seasonHigh', 'today', 'streak', 'hands']);
for (const seat of TABLE_SEATS) assert.ok(SEAT_GLYPHS[seat.key], `${seat.key} has a glyph`);
for (const a of ARENAS) assert.ok(MOTIFS[MOTIF_OF[a.id]], `${a.id} has a motif`);

// Each arena earns one more rail feature than the last; the first has none, the last all.
const counts = ARENAS.map((_, i) => Object.values(tableDecor(i).features).filter(Boolean).length);
assert.deepEqual(counts, [0, 1, 2, 3, 4, 5, 6, 7]);
assert.equal(RAIL_FEATURES.length, ARENAS.length - 1);
assert.deepEqual([tableDecor(2).motif, tableDecor(2).features.studs, tableDecor(2).features.doubleRail], ['teacup', true, false]);
assert.deepEqual(ARENAS.map((_, i) => tableDecor(i).travellers), [1, 1, 2, 2, 3, 3, 4, 4]);
assert.equal(tableDecor(-3).level, 0, 'clamped low');
assert.equal(tableDecor(99).level, 7, 'clamped high');

// The dealer button: a run, else a day up, else nowhere.
assert.equal(dealerSeat({ streak: 6, delta: -4 }), 'streak');
assert.equal(dealerSeat({ streak: 1, delta: 18 }), 'today');
assert.equal(dealerSeat({ streak: 2, delta: -3 }), null);
assert.equal(dealerSeat({}), null, 'unknowns never earn it');

assert.deepEqual([rankBand(3), rankBand(40), rankBand(412), rankBand(5000), rankBand(null)], ['crown', 'gilt', 'brass', null, null]);

const top = railPoint(0, 100, 50);
const right = railPoint(0.25, 100, 50);
assert.ok(Math.abs(top.x) < 1e-9 && Math.abs(top.y + 50) < 1e-9, 'the top of the rail');
assert.ok(Math.abs(right.x - 100) < 1e-9 && Math.abs(right.y) < 1e-9, 'a quarter turn clockwise is the right end');

console.log('arenaTable ok: seats, decor per arena, dealer seat, rank band, rail');
