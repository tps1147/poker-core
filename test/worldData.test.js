// 2.0 data: the seal, The Case, results by mode, the achievement arc, placement, Your Chip.
//   node test/worldData.test.js
const assert = require('node:assert/strict');
const d = require('../src/data');

// The seal.
let s = d.sealFor(1284);
assert.deepEqual([s.arenaIndex, s.arenaId, s.quarter, s.lit, s.gold], [2, 'tea-garden', 0, 11, false]);
assert.equal(s.fill, 11 / 52, 'fill is a whole number of cards');
s = d.sealFor(0);
assert.deepEqual([s.arenaIndex, s.lit, s.quarter], [0, 0, 0]);
s = d.sealFor(1099.99);
assert.equal(s.lit, 51, 'the ring never closes under the gate');
assert.equal(s.quarter, 3);
s = d.sealFor(1100);
assert.deepEqual([s.arenaIndex, s.lit], [1, 0], 'the gate opens the next arena empty');
s = d.sealFor(2400);
assert.deepEqual([s.arenaId, s.quarter, s.fill, s.lit, s.gold], ['heart-throne', 4, 1, 52, true]);
for (let r = 0; r < 2100; r += 7) {
  const x = d.sealFor(r);
  assert.ok(Number.isInteger(x.fill * 52 + 1e-9 | 0) && Math.abs(x.fill * 52 - x.lit) < 1e-9, 'fill = lit / 52');
  assert.equal(x.quarter, x.gold ? 4 : Math.floor(x.lit / 13));
  assert.ok(!('rating' in x) && !('toGo' in x), 'the seal carries no figure');
}
assert.equal(d.SEAL_QUARTERS.length, 4);
assert.deepEqual(d.SEAL_QUARTERS.map((q) => q.reward), ['felt', 'protector', 'title', 'gate']);

let c = d.sealChange(1090, 1300);
assert.equal(c.gateCrossed, true);
assert.equal(c.promotedTo, 'tea-garden');
assert.deepEqual(c.quartersCrossed.map((q) => `${q.arenaIndex}.${q.quarter}`), ['0.4', '1.1', '1.2', '1.3', '1.4', '2.1']);
c = d.sealChange(1300, 1090);
assert.deepEqual([c.demoted, c.gateCrossed, c.quartersCrossed.length], [true, false, 0]);
c = d.sealChange(1200, 1201);
assert.deepEqual([c.gateCrossed, c.quartersCrossed.length], [false, 0]);

// The Case.
const ids = d.COLLECTIBLES.map((x) => x.id);
assert.equal(new Set(ids).size, ids.length, 'ids are unique');
for (const a of d.ARENAS) assert.equal(d.collectibleById(a.id).kind, 'back', `${a.id}: the arena back keeps its card-back id`);
for (const x of d.COLLECTIBLES) {
  assert.ok(d.COLLECTIBLE_KINDS.includes(x.kind), `${x.id}: kind`);
  assert.ok(d.RARITIES.includes(x.rarity), `${x.id}: rarity`);
  assert.ok(x.unlock && x.unlock.type, `${x.id}: unlock rule`);
  assert.equal(typeof x.story, 'string');
  if (x.unlock.type === 'arc') assert.ok(d.ARC_TRACKS.find((t) => t.id === x.unlock.track), `${x.id}: arc track exists`);
}
for (const [slot, id] of Object.entries(d.DEFAULT_EQUIPPED)) {
  assert.equal(d.slotFor(id), slot, `default ${slot} equips into ${slot}`);
  assert.ok(d.defaultCollection().includes(id), `default ${slot} is owned from the start`);
}
assert.equal(d.slotFor('medal-throne'), null, 'medals have no table slot');
const granted = d.unlocksForSeal(d.sealChange(1090, 1300));
assert.deepEqual(granted, ['croquet-lawn', 'felt-croquet-lawn', 'protector-croquet-lawn', 'title-croquet-lawn', 'tea-garden', 'felt-tea-garden']);
const throne = d.unlocksForSeal(d.sealChange(1990, 2001));
assert.ok(throne.includes('heart-throne') && throne.includes('medal-throne') && throne.includes('title-heart-throne'));
assert.deepEqual(d.unlocksForSeal(d.sealChange(1300, 1000)), []);
assert.deepEqual(d.unlocksFor({ type: 'feat', feat: 'heater-5' }), ['back-heater']);
assert.equal(d.storyFor('tea-garden', { date: 'Oct 22' }), 'Earned Oct 22, walking into Tea Garden.');
assert.equal(d.storyFor('back-heater'), 'Five good matches in a row.', 'a missing date drops cleanly');
assert.equal(d.storyFor('nope'), '');
for (const id of d.ARC_TRACKS.flatMap((t) => t.steps.map((st) => st.reward)).filter(Boolean)) assert.ok(d.collectibleById(id), `arc reward ${id} exists`);

// Results.
assert.deepEqual([...d.RESULT_MODES], ['ranked', 'sixmax', 'gauntlet', 'crown', 'friend']);
let r = d.resultSkeleton('ranked', { outcome: 'win' });
assert.deepEqual([r.modeTag, r.outcome.kind, r.centrepiece, r.button], ['RANKED · HEADS-UP', 'win', 'seal', 'Continue']);
r = d.resultSkeleton('ranked', { outcome: 'loss' });
assert.deepEqual([r.outcome.text, r.button], ['DEFEAT', 'Review the spot']);
r = d.resultSkeleton('sixmax', { place: 2 });
assert.deepEqual([r.outcome.kind, r.outcome.text, r.centrepiece], ['place', '2ND', 'podium']);
r = d.resultSkeleton('crown', { place: 3, of: 48 });
assert.equal(r.outcome.text, '3rd of 48');
assert.equal(d.resultSkeleton('friend', { outcome: 'loss' }).button, 'Rematch');
assert.equal(d.resultSkeleton('nope', {}), null);
const clean = d.stripForbidden({ outcome: 'win', ratingDelta: 14, seal: { before: { lit: 3 }, rating: 1200 }, list: [{ newRating: 1 }] });
assert.deepEqual(clean, { outcome: 'win', seal: { before: { lit: 3 } }, list: [{}] });

assert.equal(d.resultLineId('ranked', { outcome: 'win' }), 'result.ranked.win');
assert.equal(d.resultLineId('sixmax', { place: 3 }), 'result.sixmax.podium');
assert.equal(d.resultLineId('crown', { place: 5, of: 40 }), 'result.crown.final');
for (const mode of d.RESULT_MODES) for (const payload of [{ outcome: 'win' }, { outcome: 'loss' }, { place: 1 }, { place: 2 }, { place: 9 }]) {
  const id = d.resultLineId(mode, payload);
  const line = d.resultLine(id, 7);
  assert.ok(line && line.headline && line.text, `${id}: has a line`);
  assert.equal(line.headline.split(' ').length, 2, `${id}: two-word headline`);
}
for (const [id, lines] of Object.entries(d.RESULT_LINES)) for (const [h, t] of lines) assert.ok(!/\d|\+/.test(h + t), `${id}: no figures`);
assert.equal(d.resultLine('nope'), null);

// The arc.
assert.deepEqual(d.ARC_TRACKS.map((t) => t.id), ['climb', 'craft', 'study', 'rivals', 'events']);
for (const t of d.ARC_TRACKS) for (const st of t.steps) {
  assert.ok(st.goal.metric && st.goal.target > 0 && st.why && st.title, `${st.id}: what, why`);
  assert.ok(d.ARC_METRICS.includes(st.goal.metric));
}
let a = d.arcStep('climb', {});
assert.deepEqual([a.stepIndex, a.current.id, a.done.length], [0, 'climb-1', 0]);
a = d.arcStep('climb', { placementDone: 1, gatesCrossed: 3, arenaReached: 7 });
assert.deepEqual([a.current, a.done.length], [null, 5], 'a finished track has no current step');
assert.deepEqual(d.arcNewlyDone({ solidMatches: 4 }, { solidMatches: 5, sharpMatches: 1 }).map((x) => x.step), ['craft-2', 'craft-3']);

// Placement.
assert.equal(d.PLACEMENT_MATCHES, 10);
assert.deepEqual([...d.STAMPS], ['PUNT', 'LOOSE', 'SOLID', 'SHARP']);
assert.deepEqual([d.stampFor(20), d.stampFor(55), d.stampFor(84.9), d.stampFor(85), d.stampFor(null)], ['PUNT', 'LOOSE', 'SOLID', 'SHARP', null]);
for (const st of d.STAMPS) {
  const l = d.placementLine(st, 5);
  assert.ok(l.text && l.id.startsWith(`placement.${st.toLowerCase()}.`));
  assert.deepEqual(d.placementLine(st, 5), l, 'the same index gives the same line');
  for (const line of d.PLACEMENT_LINES[st]) assert.ok(!/\d/.test(line), 'placement lines carry no figures');
}
const sum = d.placementSummary(['PUNT', 'PUNT', 'SOLID', 'SHARP']);
assert.deepEqual([sum.played, sum.done, sum.best, sum.trend], [4, false, 'SHARP', 'up']);

// Your Chip.
assert.deepEqual(d.normalizeCharacter({ chip: '#3f9b6b', hat: 'laser' }), { chip: '#3f9b6b', edge: '#f3ecdf', hat: 'cap', hatColor: '#d6b780' });
console.log('worldData checks passed');

// The player avatar: always a character, four bodies, parts that open with the climb.
assert.deepEqual(d.AVATAR_BODIES.map((b) => b.id), ['chip', 'card', 'button', 'deck']);
assert.deepEqual(d.normalizeAvatar(null), { look: 'character', body: 'chip', parts: { head: null, face: null, held: null, companion: null, stand: null } });
assert.deepEqual(
  d.normalizeAvatar({ look: 'character', body: 'deck', parts: { head: 'shades', face: 'shades', held: 'sword', stand: 'laser' } }),
  { look: 'character', body: 'deck', parts: { head: null, face: 'shades', held: 'sword', companion: null, stand: null } },
  'a part only fits its own slot, unknown parts drop',
);
assert.equal(d.normalizeAvatar({ look: 'photo', body: 'dice' }).look, 'character', 'the photo look is gone');
assert.equal(d.normalizeAvatar({ body: 'dice' }).body, 'chip');
assert.equal(d.partOpen('crown', 0), false, 'the crown waits for the Heart Throne');
assert.equal(d.partOpen('crown', 7), true);
assert.equal(d.partOpen('visor', 0), true);
assert.equal(d.partOpen('nope', 7), false);
assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 99].map((i) => d.standLift(i)), [0, 0, 1, 1, 2, 2, 3, 3, 3], 'stand height follows rank');
const plain = { kind: 'character', body: 'chip', parts: { head: null, face: null, held: null, companion: null, stand: null }, lift: 0 };
assert.deepEqual(d.avatarFor({ profileImage: 'basepfp3' }), plain, 'a photo no longer shows: the character replaced it');
assert.deepEqual(d.avatarFor({}), plain);
assert.equal(d.avatarFor({ avatar: { look: 'photo', body: 'card' } }).body, 'card');
assert.deepEqual(
  d.avatarFor({ profileImage: 'x', reachedArena: 2, avatar: { look: 'character', body: 'button', parts: { head: 'crown', companion: 'puppy', stand: 'stool' } } }),
  { kind: 'character', body: 'button', parts: { head: null, face: null, held: null, companion: 'puppy', stand: 'stool' }, lift: 1 },
  'a part not yet opened is not drawn',
);
