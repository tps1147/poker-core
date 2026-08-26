const assert = require('assert');

const {
  normalizeCardForEngine,
  normalizeCards,
  combineOuts,
  equityFromOuts,
  computeEquity,
  computePotOdds,
  strengthLabel,
  textureLabel,
  createOpponentCounts,
  recordOpponentAction,
  summarizeOpponentRead,
  deriveOpponentActionEvents,
  OPPONENT_MIN_SAMPLE,
} = require('../src/insights/handInsightsMath');

// --- card normalization ---
assert.deepStrictEqual(normalizeCardForEngine({ rank: '10', suit: '♠' }), { rank: 'T', suit: '♠' });
assert.deepStrictEqual(normalizeCardForEngine({ rank: 'a', suit: '♥' }), { rank: 'A', suit: '♥' });
assert.strictEqual(normalizeCardForEngine({ rank: 'X', suit: '♠' }), null);
assert.strictEqual(normalizeCardForEngine(null), null);
assert.deepStrictEqual(normalizeCards([]), []);
assert.strictEqual(normalizeCards([{ rank: 'A', suit: '♠' }, { rank: '?', suit: '♦' }]), null);
assert.strictEqual(normalizeCards(undefined), null);

// --- outs combination (flush + straight overlap caps at 15) ---
assert.strictEqual(combineOuts(9, 8), 15);
assert.strictEqual(combineOuts(9, 0), 9);
assert.strictEqual(combineOuts(0, 8), 8);
assert.strictEqual(combineOuts(0, 0), 0);

// --- rule of 2-and-4 ---
assert.strictEqual(equityFromOuts(8, 'flop'), 32);
assert.strictEqual(equityFromOuts(8, 'turn'), 16);
assert.strictEqual(equityFromOuts(25, 'flop'), 92); // capped
assert.strictEqual(equityFromOuts(8, 'river'), null);
assert.strictEqual(equityFromOuts(0, 'flop'), null);

// Drawing hand on the flop: outs math wins, not an estimate.
const drawEquity = computeEquity({ totalOuts: 9, phase: 'flop', strength: 0.3 });
assert.deepStrictEqual(drawEquity, { pct: 36, isEstimate: false, basis: 'outs' });

// Strong made hand with a stray gutshot: strength estimate wins over 16%.
const madeEquity = computeEquity({ totalOuts: 4, phase: 'flop', strength: 0.9 });
assert.strictEqual(madeEquity.pct, 90);
assert.strictEqual(madeEquity.isEstimate, true);
assert.strictEqual(madeEquity.basis, 'strength');

// River / no draw: always a labeled estimate.
const riverEquity = computeEquity({ totalOuts: 9, phase: 'river', strength: 0.5 });
assert.strictEqual(riverEquity.isEstimate, true);
assert.strictEqual(riverEquity.pct, 50);

// Estimate floor/ceiling stay inside 3..95.
assert.strictEqual(computeEquity({ totalOuts: 0, phase: 'flop', strength: 0 }).pct, 3);
assert.strictEqual(computeEquity({ totalOuts: 0, phase: 'flop', strength: 1 }).pct, 95);

// --- pot odds ---
assert.strictEqual(computePotOdds({ callAmount: 0, potBeforeCall: 300 }), null);
assert.deepStrictEqual(
  computePotOdds({ callAmount: 100, potBeforeCall: 300 }),
  { callAmount: 100, potAfterCall: 400, neededEquityPct: 25 }
);
assert.strictEqual(computePotOdds({ callAmount: 50, potBeforeCall: 100 }).neededEquityPct, 33.3);

// --- strength labels ---
assert.strictEqual(strengthLabel(0.85, { phase: 'preflop' }), 'Premium hold');
assert.strictEqual(strengthLabel(0.2, { phase: 'preflop' }), 'Weak hold');
assert.strictEqual(strengthLabel(0.9, { madeHandName: 'Flush', phase: 'river' }), 'Very strong — Flush');
assert.strictEqual(strengthLabel(0.55, { madeHandName: 'One Pair', phase: 'flop' }), 'Decent — One Pair');
// Postflop with no made-hand info falls back to hold bands rather than lying.
assert.strictEqual(strengthLabel(0.7, { madeHandName: null, phase: 'flop' }), 'Strong hold');

// 2026-08-26 re-tune: the cuts now sit on the honest scale — post-flop on
// AIPlayer.POSTFLOP_BANDS, pre-flop on the real equity table.
assert.strictEqual(strengthLabel(0.66, { madeHandName: 'Two Pair', phase: 'turn' }), 'Strong — Two Pair'); // band.strong 0.60
assert.strictEqual(strengthLabel(0.5, { madeHandName: 'One Pair', phase: 'river' }), 'Decent — One Pair'); // top pair floor = band.value side
assert.strictEqual(strengthLabel(0.34, { madeHandName: 'One Pair', phase: 'flop' }), 'Weak — One Pair'); // weakest pair of your own
assert.strictEqual(strengthLabel(0.27, { madeHandName: 'One Pair', phase: 'river' }), 'Very weak — One Pair'); // pair wholly on the board
assert.strictEqual(strengthLabel(0.7995, { phase: 'preflop' }), 'Premium hold'); // QQ
assert.strictEqual(strengthLabel(0.7499, { phase: 'preflop' }), 'Strong hold'); // TT
assert.strictEqual(strengthLabel(0.4508, { phase: 'preflop' }), 'Marginal hold'); // 76s
assert.strictEqual(strengthLabel(0.3422, { phase: 'preflop' }), 'Weak hold'); // 72o

// --- board texture labels ---
assert.strictEqual(textureLabel({ isWet: true, isPaired: false }), 'Wet');
assert.strictEqual(textureLabel({ isWet: false, isPaired: true }), 'Dry · Paired');
assert.strictEqual(textureLabel({ isWet: true, isPaired: true }), 'Wet · Paired');
assert.strictEqual(textureLabel(null), null);

// --- opponent action recording ---
let counts = createOpponentCounts();
counts = recordOpponentAction(counts, 'fold', true);
counts = recordOpponentAction(counts, 'call', true);
counts = recordOpponentAction(counts, 'raise', false);
counts = recordOpponentAction(counts, 'all-in', true);
counts = recordOpponentAction(counts, 'check', false);
counts = recordOpponentAction(counts, 'smallBlind', false); // not a read
assert.strictEqual(counts.folds, 1);
assert.strictEqual(counts.calls, 1);
assert.strictEqual(counts.raises, 2); // raise + all-in
assert.strictEqual(counts.checks, 1);
assert.strictEqual(counts.facedBet, 3);
assert.strictEqual(counts.foldedToBet, 1);

// Below the sample floor: still "reading…".
const early = summarizeOpponentRead(counts);
assert.strictEqual(early.sampleSize, 5);
assert.strictEqual(early.style, 'reading…');
assert.strictEqual(early.foldToRaisePct, 33);

// Push past the floor with raises: aggressive.
let aggro = counts;
for (let i = 0; i < 4; i++) aggro = recordOpponentAction(aggro, 'raise', false);
const aggroRead = summarizeOpponentRead(aggro);
assert.strictEqual(aggroRead.sampleSize >= OPPONENT_MIN_SAMPLE, true);
assert.strictEqual(aggroRead.style, 'aggressive');

// Mostly calls/checks: passive.
let passive = createOpponentCounts();
for (let i = 0; i < 5; i++) passive = recordOpponentAction(passive, 'call', true);
for (let i = 0; i < 4; i++) passive = recordOpponentAction(passive, 'check', false);
passive = recordOpponentAction(passive, 'raise', false);
const passiveRead = summarizeOpponentRead(passive);
assert.strictEqual(passiveRead.style, 'passive');
assert.strictEqual(passiveRead.foldToRaisePct, 0);

// No fold-to-raise situations observed yet: null, not 0.
assert.strictEqual(summarizeOpponentRead(createOpponentCounts()).foldToRaisePct, null);

// --- opponent action diffing (mirrors tableMotion's lastAction diff) ---
const prevState = {
  currentBet: 150,
  players: [
    { id: 'hero', bet: 150, lastAction: 'raise' },
    { id: 'villain', bet: 50, lastAction: null },
  ],
};
const nextState = {
  currentBet: 150,
  players: [
    { id: 'hero', bet: 150, lastAction: 'raise' },
    { id: 'villain', bet: 0, lastAction: 'fold' },
  ],
};

const events = deriveOpponentActionEvents(prevState, nextState, 'hero');
assert.strictEqual(events.length, 1);
assert.deepStrictEqual(events[0], { playerId: 'villain', action: 'fold', facingBet: true });

// Hero's own actions never count as opponent reads.
const heroOnlyNext = {
  currentBet: 300,
  players: [
    { id: 'hero', bet: 300, lastAction: 'all-in' },
    { id: 'villain', bet: 50, lastAction: null },
  ],
};
assert.deepStrictEqual(deriveOpponentActionEvents(prevState, heroOnlyNext, 'hero'), []);

// Unchanged lastAction produces no event; missing states are safe.
assert.deepStrictEqual(deriveOpponentActionEvents(nextState, nextState, 'hero'), []);
assert.deepStrictEqual(deriveOpponentActionEvents(null, nextState, 'hero'), []);
assert.deepStrictEqual(deriveOpponentActionEvents(prevState, null, 'hero'), []);

// Opponent checking behind (no table bet): facingBet false.
const checkPrev = {
  currentBet: 0,
  players: [
    { id: 'hero', bet: 0, lastAction: 'check' },
    { id: 'villain', bet: 0, lastAction: null },
  ],
};
const checkNext = {
  currentBet: 0,
  players: [
    { id: 'hero', bet: 0, lastAction: 'check' },
    { id: 'villain', bet: 0, lastAction: 'check' },
  ],
};
const checkEvents = deriveOpponentActionEvents(checkPrev, checkNext, 'hero');
assert.strictEqual(checkEvents[0].facingBet, false);

console.log('handInsightsMath checks passed');
