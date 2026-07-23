// Smoke test: require the package index and every subpath target from the
// package.json "exports" map, assert the key surface is callable, and run the
// two NEW orchestration modules on the REAL AIPlayer engine. This catches
// export/interop mistakes (a broken require anywhere in a subtree throws here).
//   node test/loads.test.js

const assert = require('assert');
const path = require('path');

// 1) Main barrel loads.
const core = require('../src/index.js');

// 2) Every subpath target from package.json "exports" resolves and requires
//    clean (a broken require in that subtree throws on load).
const pkg = require('../package.json');
const loaded = {};
for (const [key, rel] of Object.entries(pkg.exports)) {
  loaded[key] = require(path.join(__dirname, '..', rel));
}

// 3) Key functions are typeof 'function' across the whole surface.
const expectFns = {
  '.': [
    'buildReplayTimeline', 'gradeHand', 'buildMatchReview', 'toDrillPuzzle',
    'frameToHeroState', 'buildTerminalFrame', 'gradeTheme',
    'computeHandInsights', 'createOpponentTracker', 'summarizeOpponentRead',
    'normalizeCards', 'computeEquity', 'computePotOdds',
    'buildBotJourney', 'recordBotMatchResult', 'calculateAiRatingDelta',
    'deriveBandRating', 'applyRoomRatingBands',
    'normalizeGameState', 'normalizePlayerList', 'normalizePuzzleState', 'normalizeGameMode',
    'getArchetypeScout', 'getArchetypeMeta', 'getBotById', 'isKnownBotId',
    'evaluateHand', 'compareHands',
  ],
  './review': [
    'buildReplayTimeline', 'gradeHand', 'classifyAction', 'buildMatchReview',
    'toDrillPuzzle', 'frameToHeroState', 'buildTerminalFrame', 'gradeTheme',
  ],
  './insights': [
    'computeHandInsights', 'createOpponentTracker', 'normalizeCards',
    'computeEquity', 'computePotOdds', 'summarizeOpponentRead', 'deriveOpponentActionEvents',
  ],
  './rating': [
    'buildBotJourney', 'recordBotMatchResult', 'calculateAiRatingDelta',
    'deriveBandRating', 'applyRoomRatingBands', 'normalizeDifficulty',
  ],
  './eval': ['evaluateHand', 'compareHands'],
  './state': [
    'normalizeGameState', 'normalizePlayerList', 'normalizePuzzleState',
    'normalizeGameMode', 'isRankedMode',
  ],
  './data': ['getArchetypeScout', 'getArchetypeMeta', 'getBotById', 'isKnownBotId'],
};

for (const [key, fns] of Object.entries(expectFns)) {
  const mod = key === '.' ? core : loaded[key];
  fns.forEach((fn) => {
    assert.strictEqual(typeof mod[fn], 'function', `${key} export "${fn}" is a function`);
  });
}

// ./ai is the class itself (module.exports = AIPlayer).
const AIPlayer = loaded['./ai'];
assert.strictEqual(typeof AIPlayer, 'function', './ai exports the AIPlayer class directly');
assert.strictEqual(typeof core.AIPlayer, 'function', 'main barrel re-exports AIPlayer');

// Key non-function data structures exist on the main barrel.
['GRADE_THEME', 'GRADE_RULES', 'GRADE_SCORE', 'ROOM_RATING_BAND', 'ARCHETYPE_SCOUT', 'ARCHETYPE_META', 'GAME_MODES', 'RATING_TIERS', 'BOT_ROSTER', 'BOT_ROSTER_BY_ID'].forEach((k) => {
  assert.strictEqual(typeof core[k], 'object', `main barrel exposes ${k}`);
});

// 4) Interop smoke — the NEW orchestration actually runs on the real engine.
const engine = new core.AIPlayer();
engine.evaluateHand = core.evaluateHand; // expose the made-hand gate like the UI wrapper

const gameState = {
  playerId: 'hero',
  currentPhase: 'flop',
  pot: 300,
  currentBet: 100,
  communityCards: [{ rank: 'J', suit: '♥' }, { rank: '5', suit: '♥' }, { rank: '2', suit: '♦' }],
  players: [
    { id: 'hero', cards: [{ rank: 'A', suit: '♥' }, { rank: 'K', suit: '♥' }], bet: 0, chips: 9000 },
    { id: 'villain', cards: [], bet: 100, chips: 9000 },
  ],
  availableActions: { toCall: 100 },
};
const insights = core.computeHandInsights(gameState, 'hero', engine);
assert.ok(insights && typeof insights.strength === 'number', 'computeHandInsights returns a numeric strength');
assert.ok(insights.potOdds && typeof insights.potOdds.neededEquityPct === 'number', 'computeHandInsights computes pot odds');
assert.ok(insights.outs && insights.outs.flush === 9, 'computeHandInsights sees the 4-card flush draw (9 outs)');
assert.strictEqual(core.computeHandInsights({ players: [] }, 'nobody', engine), null, 'null when the hero has no cards');
assert.strictEqual(core.computeHandInsights(gameState, 'hero', null), null, 'null when no engine is provided');

// createOpponentTracker runs a lastAction diff and summarizes.
const tracker = core.createOpponentTracker('hero');
tracker.observe({ currentBet: 150, players: [{ id: 'hero', lastAction: 'raise', bet: 150 }, { id: 'villain', lastAction: null, bet: 0 }] });
const read = tracker.observe({ currentBet: 150, players: [{ id: 'hero', lastAction: 'raise', bet: 150 }, { id: 'villain', lastAction: 'fold', bet: 0 }] });
assert.ok(read && typeof read.style === 'string', 'opponent tracker summary carries a style');
assert.strictEqual(read.sampleSize, 1, 'tracker recorded the villain fold');

// A tiny end-to-end rating check: an upset win moves the rating up.
const delta = core.calculateAiRatingDelta({ userRating: 500, botRating: 900, won: true });
assert.ok(delta > 0, 'beating a higher-rated bot raises the rating');
assert.deepStrictEqual(core.deriveBandRating('EXPERT', 0, 1), 1200, 'single-bot EXPERT room pins to band.lo');

console.log('loads (smoke) checks passed');
