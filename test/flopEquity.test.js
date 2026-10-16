// Flop and turn equity (production audit 2026-10-12): the figures the HUD and the grader quote,
// pinned against exact enumeration.
//
// EXACT is every opponent hand against every run-out (a flop is 1,081 x 990 showdowns), computed
// once with an evaluator written separately from pokerEvaluator, so these are the true vs-random
// equities. The grader's run-out samples 500 of them, so it may sit a few points either side of
// the exact figure (one standard error is about 2 points), but never systematically low. The
// strength score the HUD used to quote is not an equity: it read these spots about 18 points low.
const assert = require('assert');
const { simulatedEquity } = require('../src/review/simEquity');
const { computeHandInsights } = require('../src/insights');
const { gradeHand } = require('../src/review/gradeDecisions');
const AIPlayer = require('../src/ai/aiPlayer');
const { evaluateHand } = require('../src/eval/pokerEvaluator');

const SUIT = { s: '♠', h: '♥', d: '♦', c: '♣' };
const c = (text) => (text.match(/../g) || []).map((x) => ({ rank: x[0], suit: SUIT[x[1]] }));

// [hole, board, exact vs-random equity %]
const EXACT = [
  ['Th8c', 'Qs3c2h', 32.12],
  ['AhKd', '9s6c2h', 52.27],
  ['7s6s', 'Ks9s2d', 50.48],
  ['JcTd', '9h8s2c', 55.41],
  ['5d4d', 'AsKcQh', 20.89],
  ['9c9d', 'KhQs4d', 66.13],
  ['Ad2c', 'Jh7s7d', 54.29],
  ['KsQs', 'Kd8h3c', 87.4],
  ['8h7h', '6c5d2s', 46.44],
  ['Tc8c', 'Qs3c2h4d', 20.67],
  ['AhKd', '9s6c2h3d', 45.07],
  ['7s6s', 'Ks9s2d3h', 31.06],
  ['QdJc', 'Ts9h2c5d', 44.26],
];

let sumSim = 0;
let sumStrength = 0;
const strengthEngine = new AIPlayer({ rng: () => 0 });
EXACT.forEach(([hole, board, exact]) => {
  const sim = simulatedEquity(c(hole), c(board));
  assert.ok(Math.abs(sim - exact) <= 5, `${hole} on ${board}: run-out ${sim}% vs exact ${exact}%`);
  sumSim += sim - exact;
  sumStrength += 100 * strengthEngine.evaluateHandStrength(c(hole), c(board)) - exact;
});
const simBias = sumSim / EXACT.length;
const strengthBias = sumStrength / EXACT.length;
assert.ok(Math.abs(simBias) <= 2, `run-out equity is unbiased against exact enumeration (mean ${simBias.toFixed(1)})`);
assert.ok(strengthBias < -10, `the strength score is not an equity (mean ${strengthBias.toFixed(1)} against exact)`);

// The audit's hand: T8 on Q-3-2 has 32.1% against a random hand. The strength score said 12%.
assert.ok(Math.abs(simulatedEquity(c('Th8c'), c('Qs3c2h')) - 32.1) <= 3);

// THE HUD. From the flop on it quotes the grader's run-out, marked as an estimate, and on the
// same price it is the very number the grader (and so the review and the coach on the felt) uses.
const engine = new AIPlayer();
const tableState = ({ board, pot, currentBet, heroBet = 0, heroChips = 5000, phase = 'flop' }) => ({
  currentPhase: phase,
  communityCards: c(board),
  pot,
  currentBet,
  players: [
    { id: 'hero', cards: c('Th8c'), bet: heroBet, chips: heroChips },
    { id: 'opp', cards: [], bet: currentBet, chips: 4000 },
  ],
});

const unbet = computeHandInsights(tableState({ board: 'Qs3c2h', pot: 200, currentBet: 0 }), 'hero', engine);
assert.strictEqual(unbet.equityBasis, 'simulated');
assert.strictEqual(unbet.equityIsEstimate, true, 'engine figures keep carrying "est."');
assert.strictEqual(unbet.equityPct, Math.round(simulatedEquity(c('Th8c'), c('Qs3c2h'), { toCall: 0, pot: 200 })));
assert.ok(unbet.equityPct > 28, `T8 on Q32 is not a near-zero hand on the HUD, got ${unbet.equityPct}`);

// Facing a half-pot bet: the HUD's number and the grader's number for calling it are the same.
const facing = computeHandInsights(tableState({ board: 'Qs3c2h', pot: 200, currentBet: 100 }), 'hero', engine);
assert.strictEqual(facing.potOdds.callAmount, 100);
const reviewEngine = new AIPlayer({ rng: () => 0 });
reviewEngine.evaluateHand = evaluateHand;
const [graded] = gradeHand({
  hero: { cards: c('Th8c') },
  bigBlind: 100,
  frames: [{ index: 0, phase: 'flop', boardCards: c('Qs3c2h'), actor: 'hero', action: 'call', amount: 100, toCall: 100, potBefore: 300, isHeroDecision: true }],
}, reviewEngine);
assert.strictEqual(facing.equityPct, graded.metrics.equityPct, 'HUD and grader agree on the same decision');
assert.ok(facing.equityPct < unbet.equityPct, 'a betting range is stronger than a random hand');

// A short stack can only call what it has: the price is capped at the hero's chips, as the grader's is.
const short = computeHandInsights(tableState({ board: 'Qs3c2h', pot: 200, currentBet: 1000, heroChips: 300 }), 'hero', engine);
assert.strictEqual(short.potOdds.callAmount, 300);

// Preflop is unchanged: the table equity against a random hand.
const pre = computeHandInsights(tableState({ board: '', pot: 150, currentBet: 100, phase: 'preflop' }), 'hero', engine);
assert.notStrictEqual(pre.equityBasis, 'simulated');

console.log(`flopEquity: ${EXACT.length} spots within 5 points of exact (mean ${simBias.toFixed(1)}; strength score ${strengthBias.toFixed(1)}), HUD = grader`);
