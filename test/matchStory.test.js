// The stored match story (src/review/matchStory.js): one verdict per spot, player grade names,
// Form tier, key moments and the match-wide replay index.
const assert = require('assert');
const {
  buildMatchStory, buildMatchTimeline, buildMatchStoryFromDocs, formTierFor, PLAYER_GRADE_ORDER, spotIdOf,
} = require('../src/review');

const d = (frameIndex, action, grade, m = {}) => ({ frameIndex, action, grade, note: `${action} note`, metrics: { equityPct: null, neededPct: null, toCall: 0, pot: 0, ...m } });
const timeline = (n, bigBlind = 100) => ({ bigBlind, frames: Array.from({ length: n }, (_, i) => ({ index: i, phase: ['preflop', 'flop', 'turn', 'river'][Math.min(3, i >> 1)] })) });

const review = {
  leakTags: ['overfolding-to-aggression'],
  hands: [
    { handId: 'h1', handNumber: 1, netChange: 200, decisions: [d(0, 'raise', 'good', { equityPct: 60, toCall: 0, pot: 150 }), d(6, 'call', 'brilliant', { equityPct: 40, neededPct: 25, toCall: 300, pot: 900 })] },
    { handId: 'h2', handNumber: 2, netChange: -1200, decisions: [d(1, 'call', 'good', { equityPct: 50, neededPct: 33, toCall: 100, pot: 200 }), d(5, 'fold', 'blunder', { equityPct: 44, neededPct: 26, toCall: 1000, pot: 4600 })] },
    { handId: 'h3', handNumber: 3, netChange: -60, decisions: [d(4, 'fold', 'blunder', { equityPct: 30, neededPct: 26, toCall: 50, pot: 150 })] },
    { handId: 'h4', handNumber: 4, netChange: 0, decisions: [], replayable: false },
  ],
};
const timelines = { h1: timeline(8), h2: timeline(7), h3: timeline(6) };
const story = buildMatchStory(review, timelines);

// Player grade names, and no accuracy or rating anywhere in what clients receive.
assert.deepStrictEqual(PLAYER_GRADE_ORDER, ['clutch', 'solid', 'loose', 'leak', 'punt']);
assert.deepStrictEqual(story.tally, { clutch: 1, solid: 2, loose: 0, leak: 1, punt: 1 });
assert.ok(!/accuracy|rating/i.test(JSON.stringify(story)), 'story carries no accuracy or rating');

// One verdict per spot, addressable by hand and frame.
const punt = story.spots.find((s) => s.spotId === spotIdOf('h2', 5));
assert.strictEqual(punt.playerGrade, 'punt');
assert.strictEqual(punt.costEst, Math.round((4600 + 1000) * 18 / 100)); // 1,008 est.
assert.strictEqual(punt.better, 'call');
assert.strictEqual(punt.phase, 'turn');
assert.strictEqual(punt.sharePct, 44);
assert.strictEqual(punt.pricePct, 26);

// The near-zero guard: a "blunder" worth under a big blind reads as a Leak.
const small = story.spots.find((s) => s.spotId === spotIdOf('h3', 4));
assert.strictEqual(small.engineGrade, 'blunder');
assert.strictEqual(small.playerGrade, 'leak');

// Good decisions carry no cost and no "better".
const clutch = story.spots.find((s) => s.playerGrade === 'clutch');
assert.strictEqual(clutch.costEst, null);
assert.strictEqual(clutch.better, null);

// Key moments in match order, a Clutch included, at most three.
assert.deepStrictEqual(story.keyMoments.map((k) => k.spotId), ['h1:6', 'h2:5', 'h3:4']);
assert.strictEqual(story.keyMoments[1].title, 'Turn fold');

// Beads: one per hand, worst grade, un-replayable hands kept.
assert.deepStrictEqual(story.beads.map((b) => b.grade), ['clutch', 'punt', 'leak', null]);
assert.strictEqual(story.beads[3].replayable, false);

// Form tier: a word, from contested decisions only, and none on a thin sample.
assert.strictEqual(formTierFor(95, 10).label, 'On fire');
assert.strictEqual(formTierFor(85, 10).label, 'Sharp');
assert.strictEqual(formTierFor(75, 10).label, 'Steady');
assert.strictEqual(formTierFor(40, 10).label, 'Cold');
assert.strictEqual(formTierFor(95, 2), null);
assert.ok(story.form && typeof story.form.label === 'string');

// The match-wide replay: every frame of every replayable hand, spots marked, key moments located.
const mt = buildMatchTimeline(story, timelines);
assert.strictEqual(mt.frames.length, 8 + 7 + 6);
assert.deepStrictEqual(mt.handStarts, [0, 8, 15]);
assert.deepStrictEqual(mt.keyMomentIndexes, [6, 13, 19]);
assert.strictEqual(mt.frames[13].spotId, 'h2:5');
assert.strictEqual(mt.frames[12].spotId, null);

// Deterministic, and safe on nothing.
assert.deepStrictEqual(buildMatchStory(review, timelines), story);
const empty = buildMatchStoryFromDocs([], 'hero', {});
assert.strictEqual(empty.story.spots.length, 0);
assert.strictEqual(empty.story.form, null);
console.log('matchStory: all assertions passed');
