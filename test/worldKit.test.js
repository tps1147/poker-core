// The 2.0 design kit: tokens, the seal ring, the chip rig, the swirl, the switch.
//   node test/worldKit.test.js
const assert = require('node:assert/strict');
const w = require('../src/world');
const { CHARACTER_OPTIONS } = require('../src/data');

assert.equal(w.WORLD_GROUND, '#101c2b', 'the brand ground never changes');
assert.equal(w.WORLD_TOKENS.dark.ground, '#101c2b');
assert.equal(w.WORLD_TOKENS.dark.felt.stops[0], '#24675d', 'dark mode: green felt');
assert.ok(/^#(0|1)[0-9a-f]{5}$/i.test(w.WORLD_TOKENS.light.felt.stops[1]), 'light mode: navy felt');
for (const mode of ['dark', 'light']) {
  const t = w.WORLD_TOKENS[mode];
  for (const k of ['ground', 'ink', 'brass', 'felt', 'feltLine', 'stitch', 'lamp', 'rail', 'plate', 'plateBrass', 'button3d']) assert.ok(t[k], `${mode}.${k}`);
}
assert.deepEqual(Object.keys(w.CARD_FACE.suits), ['s', 'h', 'd', 'c'], 'four-color cards');
assert.equal(w.CARD_FACE.radius, 0.15);
assert.equal(w.CARD_SHEEN.glossEveryMs, 8000);

let ring = w.sealRing({ lit: 20 });
assert.equal(ring.segments.length, 52);
assert.equal(ring.segments.filter((s) => s.on).length, 20);
assert.equal(ring.segments[0].angle, 0, 'spades start at the top');
assert.deepEqual([ring.segments[12].suit, ring.segments[13].suit, ring.segments[51].suit], [0, 1, 3]);
assert.equal(ring.marks.length, 4);
assert.equal(ring.closed, false);
ring = w.sealRing({ fill: 1, gold: true });
assert.ok(ring.closed && ring.segments.every((s) => s.color === w.RING_GOLD.on), 'gold at the Throne');
assert.equal(w.sealRing({ fill: 0.5 }).lit, 26);
const day = w.sealRing({ lit: 5, mode: 'light' });
assert.equal(day.segments[20].color, '#efcdbf', 'unlit cards are pale by day');
for (const s of w.RING_SUITS) assert.ok(/^#[0-9a-f]{6}$/.test(s.offLight), `${s.glyph}: a day tint`);
assert.ok(w.sealRing({ lit: 3, mode: 'light', gold: true }).segments.every((s) => /^#/.test(s.color)), 'every segment has a colour');
assert.equal(day.segments[0].color, w.RING_SUITS[0].on, 'lit cards keep their colour by day');

for (const pose of CHARACTER_OPTIONS.poses) for (const hat of CHARACTER_OPTIONS.hats) {
  const rig = w.chipRig({ pose, hat });
  assert.deepEqual(rig.box, [120, 140]);
  assert.ok(rig.shapes.length > 10 && rig.shapes.every((s) => ['circle', 'ellipse', 'rect', 'path'].includes(s.t)), `${pose}/${hat}`);
  assert.ok(rig.shapes.every((s) => Object.values(s).every((v) => typeof v !== 'number' || Number.isFinite(v))), 'no NaN');
}
assert.ok(w.chipRig({ head: true }).shapes.length < w.chipRig({}).shapes.length, 'head only drops body and arms');
assert.ok(w.chipRig({ pose: 'allin' }).shapes.some((s) => s.t === 'rect' && s.fill === '#0b1522'), 'shades on all-in');

for (const mode of ['dark', 'light']) {
  const px = w.swirlColor(10, 40, 48, 86, 12345, 0.3, mode);
  assert.equal(px.length, 3);
  assert.ok(px.every((v) => v >= 0 && v <= 255));
}
assert.ok(w.swirlColor(24, 43, 48, 86, 0, 0, 'dark').every((v, i) => v < [120, 120, 120][i]), 'dark swirl stays near the ground');

assert.deepEqual(['1', 'true', 'on', 'YES', '', undefined, '0', 'false'].map(w.worldV2Enabled), [true, true, true, true, false, false, false, false]);
console.log('worldKit checks passed');
