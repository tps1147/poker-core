// Sequential Gauntlet access — a plain-node port of the server's access assertions
// (pokerServer/src/tests/JourneyProgression.test.js "Gauntlet challenge access").
//   node test/gauntletAccess.test.js

const assert = require('assert');

const {
  MASTERY_TARGETS,
  buildGauntletAccessMap,
  buildMasteryTargets,
  getGauntletAccess,
  getGauntletLockRequirement,
  isBotMasteredByProgress,
} = require('../src/rating/gauntletAccess');
const rating = require('../src/rating');
const { BOT_ROSTER } = require('../src/data');

// The barrel exposes the same functions (poker-core/rating is what consumers import).
['getGauntletAccess', 'buildGauntletAccessMap', 'isBotMasteredByProgress', 'getGauntletLockRequirement', 'buildMasteryTargets']
  .forEach((fn) => assert.strictEqual(typeof rating[fn], 'function', `rating barrel exports ${fn}`));
assert.strictEqual(rating.MASTERY_TARGETS, MASTERY_TARGETS, 'rating barrel exposes MASTERY_TARGETS');

// Targets are roster-derived (the verified numbers from the design), not difficulty defaults.
assert.deepStrictEqual(MASTERY_TARGETS, {
  'rookie-bob': 2, 'slow-steve': 3, 'lucky-larry': 2, 'friendly-frank': 3,
  'cautious-claire': 3, 'solid-sarah': 3, 'tricky-tom': 3, 'aggressive-alex': 5,
  'position-pete': 4, 'mathematical-mike': 4, 'iron-warden': 4, 'shade-stalker': 7,
  'gem-golem': 5, 'neon-jester': 5, 'mirage': 5, 'the-house': 9,
});
assert.ok(Object.isFrozen(MASTERY_TARGETS), 'MASTERY_TARGETS is frozen');
assert.deepStrictEqual(buildMasteryTargets(BOT_ROSTER), MASTERY_TARGETS, 'buildMasteryTargets reproduces the constant');

// The first bot is always open; an empty progress opens nothing else.
assert.deepStrictEqual(getGauntletAccess('rookie-bob', {}), { isUnlocked: true, remainingBots: [] });
assert.strictEqual(getGauntletAccess('slow-steve', {}).isUnlocked, false);
assert.strictEqual(getGauntletAccess('slow-steve').isUnlocked, false, 'progress defaults to {}');

// Unknown ids (custom practice bots) are outside the campaign.
assert.strictEqual(getGauntletAccess('dev-sandbox-bot', {}), null);
assert.strictEqual(getGauntletAccess(undefined, {}), null);

// test.each port: every bot unlocks only after EVERY earlier bot is at target; any single
// earlier bot one win short (including an earlier room member) closes access.
BOT_ROSTER.slice(1).forEach((bot, offset) => {
  const index = offset + 1;
  const winsByBot = Object.fromEntries(BOT_ROSTER.slice(0, index).map((prior) => [prior.id, MASTERY_TARGETS[prior.id]]));
  assert.strictEqual(getGauntletAccess(bot.id, { botProgress: { winsByBot } }).isUnlocked, true, `${bot.id} opens at targets`);
  BOT_ROSTER.slice(0, index).forEach((prior) => {
    const incomplete = { ...winsByBot, [prior.id]: winsByBot[prior.id] - 1 };
    const access = getGauntletAccess(bot.id, { botProgress: { winsByBot: incomplete } });
    assert.strictEqual(access.isUnlocked, false, `${bot.id} closed when ${prior.id} is one short`);
    assert.strictEqual(access.remainingBots[0].id, prior.id, 'the short bot is the first remaining prerequisite');
  });
});

// Farming aggregate wins cannot skip a bot or open a room.
const farmed = { botProgress: { winsByBot: { 'rookie-bob': 100 }, totalWins: 100, winsByDifficulty: { BEGINNER: 100 } } };
assert.strictEqual(getGauntletAccess('lucky-larry', farmed).isUnlocked, false);
assert.strictEqual(getGauntletAccess('cautious-claire', farmed).isUnlocked, false);
assert.deepStrictEqual(
  getGauntletLockRequirement(getGauntletAccess('lucky-larry', farmed)),
  { botId: 'slow-steve', name: 'Slow Steve', wins: 3 },
);
assert.strictEqual(getGauntletLockRequirement(getGauntletAccess('rookie-bob', farmed)), null);
assert.strictEqual(getGauntletLockRequirement(null), null);

// Stored mastery remains valid without per-bot wins (legacy documents).
const masteredOnly = { botProgress: { masteredBots: BOT_ROSTER.slice(0, 4).map((bot) => bot.id), winsByBot: {} } };
assert.strictEqual(getGauntletAccess('cautious-claire', masteredOnly).isUnlocked, true);
assert.strictEqual(getGauntletAccess('solid-sarah', masteredOnly).isUnlocked, false);

// isBotMasteredByProgress: masteredBots OR wins >= target; non-finite wins never master.
assert.strictEqual(isBotMasteredByProgress('rookie-bob', { botProgress: { winsByBot: { 'rookie-bob': 2 } } }), true);
assert.strictEqual(isBotMasteredByProgress('rookie-bob', { botProgress: { winsByBot: { 'rookie-bob': 1 } } }), false);
assert.strictEqual(isBotMasteredByProgress('rookie-bob', { botProgress: { winsByBot: { 'rookie-bob': 'lots' } } }), false);
assert.strictEqual(isBotMasteredByProgress('rookie-bob', { botProgress: { masteredBots: ['rookie-bob'] } }), true);
assert.strictEqual(isBotMasteredByProgress('rookie-bob', null), false, 'null progress is empty');
// An id with no target never counts as mastered by wins (wins >= undefined is false).
assert.strictEqual(isBotMasteredByProgress('nobody', { botProgress: { winsByBot: { nobody: 99 } } }), false);

// Custom targets + custom roster are honoured together.
const custom = [
  { id: 'a', name: 'A', difficulty: 'BEGINNER', unlockCondition: { type: 'default' } },
  { id: 'b', name: 'B', difficulty: 'BEGINNER', unlockCondition: { type: 'botWins', botId: 'a', count: 4 } },
];
const customTargets = buildMasteryTargets(custom);
assert.deepStrictEqual(customTargets, { a: 4, b: 3 });
assert.strictEqual(getGauntletAccess('b', { botProgress: { winsByBot: { a: 3 } } }, { roster: custom, masteryTargets: customTargets }).isUnlocked, false);
assert.strictEqual(getGauntletAccess('b', { botProgress: { winsByBot: { a: 4 } } }, { roster: custom, masteryTargets: customTargets }).isUnlocked, true);
assert.strictEqual(getGauntletAccess('rookie-bob', {}, { roster: custom }), null, 'roster bots are not in a custom roster');

// The map covers every roster bot with the same answers as the single call.
const map = buildGauntletAccessMap(farmed);
assert.deepStrictEqual(Object.keys(map), BOT_ROSTER.map((bot) => bot.id));
BOT_ROSTER.forEach((bot) => {
  assert.deepStrictEqual(map[bot.id], getGauntletAccess(bot.id, farmed), `map parity for ${bot.id}`);
});

console.log('gauntletAccess checks passed');
