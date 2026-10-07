// The arena climb: gates, the climb read from a rating, and the sigils.
//   node test/arenaClimb.test.js
const assert = require('node:assert/strict');
const { ARENAS, SIGILS, SIGIL_SIZE, arenaClimb, sigilLattice } = require('../src/data');

assert.equal(ARENAS.length, 8, 'eight arenas');
for (let i = 1; i < ARENAS.length; i += 1) assert.ok(ARENAS[i].minRating > ARENAS[i - 1].minRating, 'gates rise');
for (const a of ARENAS) {
  const rows = SIGILS[a.id];
  assert.ok(rows && rows.length === SIGIL_SIZE && rows.every((r) => r.length === SIGIL_SIZE), `${a.id}: a 13x13 sigil`);
}
const mirrors = SIGILS['hall-of-mirrors'];
for (let r = 0; r < SIGIL_SIZE; r += 1) for (let c = 0; c < SIGIL_SIZE; c += 1) assert.equal(mirrors[r][c], mirrors[c][r], 'Hall of Mirrors is its own transpose');

let climb = arenaClimb(1284);
assert.deepEqual([climb.current.id, climb.next.id, climb.toGo, climb.numeral], ['tea-garden', 'hall-of-mirrors', 116, 'III']);
assert.ok(Math.abs(climb.progress - 34 / 150) < 1e-9);
climb = arenaClimb(0);
assert.deepEqual([climb.index, climb.current.id, climb.next.id], [0, 'rabbits-burrow', 'croquet-lawn']);
climb = arenaClimb(2300);
assert.deepEqual([climb.top, climb.next, climb.progress, climb.toGo], [true, null, 1, 0]);
assert.equal(arenaClimb('nope').index, 0, 'no rating reads as the first arena');

const cells = sigilLattice('hall-of-mirrors', 34 / 150);
assert.equal(cells.length, 169);
assert.equal(cells.filter((c) => c.mark).length, 25);
assert.equal(cells.filter((c) => c.lit).length, 6, 'lit in proportion to progress');
assert.ok(cells.filter((c) => c.lit).every((c) => c.mark), 'only sigil cells light');
assert.ok(cells[6 * 13 + 6].lit, 'the centre lights first');
assert.equal(sigilLattice('hall-of-mirrors', 1).filter((c) => c.lit).length, 25);
assert.deepEqual(sigilLattice('nowhere', 0.5), []);
console.log('arenaClimb checks passed');
