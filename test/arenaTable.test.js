// The Stats table: seats, each arena's decor, the dealer seat, the rank band, the rail.
//   node test/arenaTable.test.js
const assert = require('node:assert/strict');
const { ARENA_RAILS, stadiumPoint, stadiumPath, edgePoint, ARENAS, TABLE_SEATS, MOTIFS, MOTIF_OF, EMBLEM_OF, TABLE_LAYOUT, tableDecor, dealerSeat, rankBand, railPoint } = require('../src/data');

assert.deepEqual(TABLE_SEATS.map((s) => s.key), ['hands', 'rank', 'winRate', 'streak', 'today', 'seasonHigh']);
assert.deepEqual(TABLE_SEATS.map((s) => s.row), ['top', 'top', 'top', 'bottom', 'bottom', 'bottom'], 'three a side, as a six-handed table');
for (const seat of TABLE_SEATS) {
  assert.ok(seat.label.length <= 8 && seat.name, `${seat.key}: a short label and a spoken name`);
}
for (const a of ARENAS) assert.ok(MOTIFS[MOTIF_OF[a.id]] && EMBLEM_OF[a.id], `${a.id} has a motif and an emblem`);
assert.deepEqual(ARENAS.map((_, i) => tableDecor(i).emblem), ['deck', 'puck', 'card', 'card', 'compass', 'compass', 'crown', 'crown']);
assert.ok(TABLE_LAYOUT.tableW > TABLE_LAYOUT.tableH, 'the table is a wide stadium, as every base table is');

// Each arena has its own ring, and every ring covers the table it dresses.
assert.equal(ARENA_RAILS.length, ARENAS.length);
for (const rail of ARENA_RAILS) {
  const r = rail.ring;
  assert.ok(r.x <= 0 && r.y <= 0 && r.x + r.w >= 1 && r.y + r.h >= 1, 'the ring reaches past the table on every side');
  assert.ok(/^#[0-9a-f]{6}$/.test(rail.metal));
}
assert.deepEqual([tableDecor(0).rail.shine, tableDecor(2).rail.shine], [false, true]);
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

// The stadium: w 300, h 160 -> ends of radius 80, straights 140 long.
const near = (a, b) => Math.abs(a - b) < 1e-6;
const s0 = stadiumPoint(0, 300, 160);
assert.ok(near(s0.x, 0) && near(s0.y, -80) && s0.ny === -1, 'top centre, facing up');
const perim = 4 * 70 + 2 * Math.PI * 80;
const east = stadiumPoint((70 + Math.PI * 40) / perim, 300, 160);
assert.ok(near(east.x, 150) && near(east.y, 0) && near(east.nx, 1), 'the right end, facing right');
const south = stadiumPoint(0.5, 300, 160);
assert.ok(near(south.x, 0) && near(south.y, 80) && south.ny === 1, 'half way round is the bottom centre');
assert.ok(stadiumPath(150, 80, 300, 160).startsWith('M 150 0 H 220 A 80 80'));
assert.deepEqual(edgePoint(0, 'top', 300, 160), { x: 0, y: -80 });
const endSeat = edgePoint(0.34, 'bottom', 300, 160);
assert.ok(near(endSeat.x, 102) && endSeat.y > 0 && endSeat.y < 80, 'a seat past the straight sits on the curve');

console.log('arenaTable ok: seats, decor per arena, dealer seat, rank band, rail, stadium');
