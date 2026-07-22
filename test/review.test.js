const assert = require('assert');

const { buildReplayTimeline } = require('../src/review/replayTimeline');
const { gradeHand, classifyAction, GRADE_SCORE } = require('../src/review/gradeDecisions');
const { buildMatchReview } = require('../src/review/matchReview');
const { toDrillPuzzle } = require('../src/review/drillFromFrame');

const HERO = '64fabc0123456789abcdef01';
const BOT = 'ai_sharky';

// --- fixture helpers -------------------------------------------------------
// All docs are OLD-style: no potAfterAction/chipsAfterAction anywhere, so the
// timeline must reconstruct pot/stacks purely from the recorded deltas.

const card = (rank, suit) => ({ rank, suit });
const act = (playerId, phase, action, amount) => ({
  playerId,
  phase,
  action,
  amount,
  timestamp: '2026-07-22T00:00:00.000Z',
});

const mkHand = ({
  id,
  handNumber,
  heroCards,
  botCards,
  community,
  heroStart = 10000,
  botStart = 10000,
  actions,
  potTotal,
  winnerId,
  winnerAmount,
  winnerHandName = null,
  showdown = false,
}) => {
  const committedBy = (playerId) =>
    actions.filter((a) => a.playerId === playerId).reduce((sum, a) => sum + a.amount, 0);
  const heroCommitted = committedBy(HERO);
  const botCommitted = committedBy(BOT);
  const heroWon = winnerId === HERO ? winnerAmount : 0;
  const botWon = winnerId === BOT ? winnerAmount : 0;
  return {
    _id: id,
    handNumber,
    gameType: 'solo',
    botOpponent: { name: 'Sharky', difficulty: 'medium' },
    players: [
      {
        userId: HERO,
        username: 'hero',
        position: 'BTN',
        startingChips: heroStart,
        endingChips: heroStart - heroCommitted + heroWon,
        netChange: heroWon - heroCommitted,
        cards: heroCards,
        finalAction: null,
        handResult: winnerId === HERO ? 'won' : 'lost',
        isDealer: true,
        isSmallBlind: true,
        isBigBlind: false,
      },
      {
        userId: BOT,
        username: 'Sharky',
        position: 'BB',
        startingChips: botStart,
        endingChips: botStart - botCommitted + botWon,
        netChange: botWon - botCommitted,
        cards: botCards,
        finalAction: null,
        handResult: winnerId === BOT ? 'won' : 'lost',
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: true,
      },
    ],
    communityCards: community,
    pot: { total: potTotal },
    actions,
    winner: { userId: winnerId, amount: winnerAmount, handName: winnerHandName },
    showdown: { occurred: showdown, players: [] },
    duration: 60,
    createdAt: '2026-07-22T00:00:00.000Z',
  };
};

// Hand A — hero AKs raises pre, calls flop, folds turn getting 2.6:1 with 45%
// equity (a fold blunder). Exercises reconstruction end to end.
const handA = mkHand({
  id: 'hand-a',
  handNumber: 1,
  heroCards: [card('A', '♠'), card('K', '♠')],
  botCards: [card('7', '♦'), card('7', '♣')],
  community: [card('Q', '♥'), card('7', '♥'), card('2', '♠'), card('J', '♥')],
  actions: [
    act(HERO, 'blinds', 'small blind', 50),
    act(BOT, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'raise', 250), // to 300 total — server records the delta
    act(BOT, 'preflop', 'call', 200),
    act(BOT, 'flop', 'raise', 400),
    act(HERO, 'flop', 'call', 400),
    act(BOT, 'turn', 'raise', 900),
    act(HERO, 'turn', 'fold', 0),
  ],
  potTotal: 2300,
  winnerId: BOT,
  winnerAmount: 2300,
});

// Hand B — hero limps 98o, check-check, then calls a river all-in with 10%
// equity needing 47.6% (a call blunder). Also the all-in key-hand marker.
const handB = mkHand({
  id: 'hand-b',
  handNumber: 2,
  heroCards: [card('9', '♣'), card('8', '♦')],
  botCards: [card('A', '♦'), card('A', '♣')],
  community: [card('K', '♠'), card('Q', '♦'), card('4', '♣'), card('4', '♥'), card('2', '♥')],
  botStart: 2100,
  actions: [
    act(HERO, 'blinds', 'small blind', 50),
    act(BOT, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'call', 50), // completing the blind — ungraded in v1
    act(BOT, 'preflop', 'check', 0),
    act(BOT, 'flop', 'check', 0),
    act(HERO, 'flop', 'check', 0),
    act(BOT, 'turn', 'check', 0),
    act(HERO, 'turn', 'check', 0),
    act(BOT, 'river', 'all-in', 2000),
    act(HERO, 'river', 'call', 2000),
  ],
  potTotal: 4200,
  winnerId: BOT,
  winnerAmount: 4200,
  winnerHandName: 'Three of a Kind',
  showdown: true,
});

// Hand C — hero JTs calls a flop bet on a correctly priced flush draw
// (brilliant), then folds the turn with equity edge +5 (a mistake).
const handC = mkHand({
  id: 'hand-c',
  handNumber: 3,
  heroCards: [card('J', '♥'), card('T', '♥')],
  botCards: [card('A', '♠'), card('Q', '♠')],
  community: [card('9', '♥'), card('5', '♥'), card('2', '♦'), card('K', '♣')],
  actions: [
    act(HERO, 'blinds', 'small blind', 50),
    act(BOT, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'raise', 250),
    act(BOT, 'preflop', 'call', 200),
    act(BOT, 'flop', 'raise', 500),
    act(HERO, 'flop', 'call', 500),
    act(BOT, 'turn', 'raise', 1200),
    act(HERO, 'turn', 'fold', 0),
  ],
  potTotal: 2800,
  winnerId: BOT,
  winnerAmount: 2800,
});

// Hand D — hero KK value-raises the flop (good) and lays down to a huge river
// overbet with a still-big hand (brilliant laydown).
const handD = mkHand({
  id: 'hand-d',
  handNumber: 4,
  heroCards: [card('K', '♦'), card('K', '♥')],
  botCards: [card('8', '♠'), card('8', '♥')],
  community: [card('K', '♠'), card('8', '♣'), card('3', '♦'), card('6', '♠'), card('A', '♥')],
  actions: [
    act(HERO, 'blinds', 'small blind', 50),
    act(BOT, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'raise', 250),
    act(BOT, 'preflop', 'call', 200),
    act(BOT, 'flop', 'check', 0),
    act(HERO, 'flop', 'raise', 500),
    act(BOT, 'flop', 'call', 500),
    act(BOT, 'turn', 'check', 0),
    act(HERO, 'turn', 'check', 0),
    act(BOT, 'river', 'raise', 6000),
    act(HERO, 'river', 'fold', 0),
  ],
  potTotal: 7600,
  winnerId: BOT,
  winnerAmount: 7600,
});

// Hand E — hero 76o calls a flop bet slightly under price (mistake), spews a
// turn raise with air when a free card was available (inaccuracy), then checks
// back the river with a monster (inaccuracy — missed value).
const handE = mkHand({
  id: 'hand-e',
  handNumber: 5,
  heroCards: [card('7', '♠'), card('6', '♦')],
  botCards: [card('Q', '♥'), card('J', '♦')],
  community: [card('7', '♦'), card('4', '♣'), card('2', '♣'), card('9', '♠'), card('7', '♣')],
  actions: [
    act(HERO, 'blinds', 'small blind', 50),
    act(BOT, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'call', 50),
    act(BOT, 'preflop', 'check', 0),
    act(BOT, 'flop', 'raise', 300),
    act(HERO, 'flop', 'call', 300),
    act(BOT, 'turn', 'check', 0),
    act(HERO, 'turn', 'raise', 500),
    act(BOT, 'turn', 'call', 500),
    act(BOT, 'river', 'check', 0),
    act(HERO, 'river', 'check', 0),
  ],
  potTotal: 1800,
  winnerId: HERO,
  winnerAmount: 1800,
  winnerHandName: 'Three of a Kind',
  showdown: true,
});

// Hand F — hero Q2o calls a big flop bet with nothing (second call blunder,
// which trips the chasing-bad-prices leak tag), then folds the turn correctly.
const handF = mkHand({
  id: 'hand-f',
  handNumber: 6,
  heroCards: [card('Q', '♣'), card('2', '♦')],
  botCards: [card('A', '♥'), card('K', '♥')],
  community: [card('K', '♦'), card('9', '♦'), card('3', '♥'), card('J', '♠')],
  actions: [
    act(HERO, 'blinds', 'small blind', 50),
    act(BOT, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'call', 50),
    act(BOT, 'preflop', 'check', 0),
    act(BOT, 'flop', 'raise', 600),
    act(HERO, 'flop', 'call', 600),
    act(BOT, 'turn', 'raise', 1500),
    act(HERO, 'turn', 'fold', 0),
  ],
  potTotal: 2900,
  winnerId: BOT,
  winnerAmount: 2900,
});

// --- stub insight engine ---------------------------------------------------
// Scripted by hero hole ranks + visible board size so one engine instance can
// drive every fixture deterministically through buildMatchReview.

const STRENGTH_SCRIPT = {
  AK: { 0: 0.65, 3: 0.5, 4: 0.45 },
  '98': { 0: 0.3, 3: 0.2, 4: 0.2, 5: 0.1 },
  JT: { 0: 0.6, 3: 0.3, 4: 0.35 },
  KK: { 0: 0.85, 3: 0.85, 4: 0.7, 5: 0.71 },
  '76': { 0: 0.5, 3: 0.33, 4: 0.25, 5: 0.85 },
  Q2: { 0: 0.4, 3: 0.15, 4: 0.1 },
};
const FLUSH_DRAW_OUTS = { JT: 9 };
const holeKey = (cards) => `${cards[0].rank}${cards[1].rank}`;

const stubEngine = {
  evaluateHandStrength(holeCards, board) {
    const script = STRENGTH_SCRIPT[holeKey(holeCards)] || {};
    const strength = script[(board || []).length];
    return strength != null ? strength : 0.5;
  },
  hasFlushDraw(cards) {
    const outs = FLUSH_DRAW_OUTS[holeKey(cards.slice(0, 2))];
    return outs
      ? { isFlushDraw: true, type: 'flush-draw', outs }
      : { isFlushDraw: false, outs: 0 };
  },
  evaluateDrawingHands() {
    return { straightOuts: 0, flushOuts: 0, totalOuts: 0, totalValue: 0 };
  },
};

// --- timeline reconstruction (hand A, hand-computed expectations) ----------

const timelineA = buildReplayTimeline(handA, HERO);
assert.ok(timelineA, 'timeline A builds');
assert.strictEqual(timelineA.bigBlind, 100);
assert.strictEqual(timelineA.hero.seat, 'BTN');
assert.strictEqual(timelineA.opponent.seat, 'BB');
assert.strictEqual(timelineA.opponent.name, 'Sharky');
assert.strictEqual(timelineA.frames.length, 8);

const fA = timelineA.frames;
// blinds: deltas post straight into the pot; stacks are pre-action.
assert.deepStrictEqual(
  [fA[0].potBefore, fA[0].potAfter, fA[0].heroStack, fA[0].actor, fA[0].isHeroDecision],
  [0, 50, 10000, 'blinds', false]
);
assert.deepStrictEqual([fA[1].potBefore, fA[1].potAfter, fA[1].oppStack], [50, 150, 10000]);
// hero's preflop raise: facing the BB's extra 50, delta 250 → pot 400.
assert.deepStrictEqual(
  [fA[2].toCall, fA[2].potBefore, fA[2].potAfter, fA[2].heroStack, fA[2].isHeroDecision],
  [50, 150, 400, 9950, true]
);
// bot's call: owes 300 - 100 = 200 within the preflop round (blinds included).
assert.deepStrictEqual([fA[3].toCall, fA[3].potAfter, fA[3].oppStack], [200, 600, 9900]);
// new street resets round commitments: bot leads for 0 owed.
assert.deepStrictEqual(
  [fA[4].toCall, fA[4].potBefore, fA[4].potAfter, fA[4].oppStack, fA[4].boardCards.length],
  [0, 600, 1000, 9700, 3]
);
assert.deepStrictEqual([fA[5].toCall, fA[5].potAfter, fA[5].heroStack], [400, 1400, 9700]);
assert.deepStrictEqual(
  [fA[6].toCall, fA[6].potBefore, fA[6].potAfter, fA[6].boardCards.length],
  [0, 1400, 2300, 4]
);
assert.deepStrictEqual(
  [fA[7].toCall, fA[7].potBefore, fA[7].potAfter, fA[7].heroStack, fA[7].isHeroDecision],
  [900, 2300, 2300, 9300, true]
);
// Reconstructed stacks agree with the doc's own endingChips bookkeeping.
assert.strictEqual(fA[7].heroStack, handA.players[0].endingChips);
assert.strictEqual(fA[7].oppStack + 2300, handA.players[1].endingChips);
// Final pot matches the stored pot total.
assert.strictEqual(fA[7].potAfter, handA.pot.total);

// Street board inference: hand A ended on the turn — no river board.
assert.strictEqual(timelineA.streets.flop.length, 3);
assert.strictEqual(timelineA.streets.turn.length, 4);
assert.strictEqual(timelineA.streets.river, null);
const timelineB = buildReplayTimeline(handB, HERO);
assert.strictEqual(timelineB.streets.river.length, 5);

// Summary.
assert.deepStrictEqual(timelineA.summary, {
  winner: 'opponent',
  wonBy: 'fold',
  netChange: -700,
  showdown: false,
});
assert.strictEqual(timelineB.summary.wonBy, 'Three of a Kind');
assert.strictEqual(timelineB.summary.showdown, true);

// Null-safety: malformed docs return null, never throw.
assert.strictEqual(buildReplayTimeline(null, HERO), null);
assert.strictEqual(buildReplayTimeline({}, HERO), null);
assert.strictEqual(buildReplayTimeline({ ...handA, actions: null }, HERO), null);
assert.strictEqual(buildReplayTimeline({ ...handA, players: [handA.players[0]] }, HERO), null);
assert.strictEqual(buildReplayTimeline(handA, 'not-in-hand'), null);

// --- action classification -------------------------------------------------

assert.strictEqual(classifyAction('fold', 0, 0), 'fold');
assert.strictEqual(classifyAction('all-in', 2000, 2000), 'call'); // covering call
assert.strictEqual(classifyAction('all-in', 0, 2000), 'raise'); // open shove
assert.strictEqual(classifyAction('small blind', 0, 50), null);

// --- grading: one case per bucket ------------------------------------------

const decisionsA = gradeHand(timelineA, stubEngine);
assert.strictEqual(decisionsA.length, 3);
assert.deepStrictEqual(decisionsA.map((d) => d.grade), ['good', 'good', 'blunder']);
// Fold blunder metrics: 900 to call into 2300 → needs 28.1%, had 45%.
const foldBlunder = decisionsA[2];
assert.strictEqual(foldBlunder.frameIndex, 7);
assert.strictEqual(foldBlunder.action, 'fold');
assert.deepStrictEqual(foldBlunder.metrics, {
  strength: 0.45,
  equityPct: 45,
  neededPct: 28.1,
  toCall: 900,
  pot: 2300,
});
assert.ok(foldBlunder.note.includes('2.6:1'), 'note quotes the pot price');
assert.ok(foldBlunder.note.includes('45% equity'), 'note quotes equity');
// Flop call: 400 into 1400 → needs 28.6%.
assert.strictEqual(decisionsA[1].metrics.neededPct, 28.6);

const decisionsB = gradeHand(timelineB, stubEngine);
assert.deepStrictEqual(decisionsB.map((d) => d.grade), ['good', 'good', 'good', 'blunder']);
assert.strictEqual(decisionsB[0].note, 'Completed the blind (not graded)'); // limp ungraded
const callBlunder = decisionsB[3];
assert.strictEqual(callBlunder.action, 'call');
assert.strictEqual(callBlunder.metrics.neededPct, 47.6);
assert.strictEqual(callBlunder.metrics.equityPct, 10);

const timelineC = buildReplayTimeline(handC, HERO);
const decisionsC = gradeHand(timelineC, stubEngine);
assert.deepStrictEqual(decisionsC.map((d) => d.grade), ['good', 'brilliant', 'mistake']);
// Brilliant draw call: 9 outs → 36% on the flop vs 31.3% needed, weak made hand.
assert.strictEqual(decisionsC[1].action, 'call');
assert.strictEqual(decisionsC[1].metrics.equityPct, 36);
assert.strictEqual(decisionsC[1].metrics.neededPct, 31.3);
// Mistake fold: 35% equity vs 30% needed — inside the (+3, +8] band.
assert.strictEqual(decisionsC[2].action, 'fold');
assert.strictEqual(decisionsC[2].metrics.neededPct, 30);

const timelineD = buildReplayTimeline(handD, HERO);
const decisionsD = gradeHand(timelineD, stubEngine);
assert.deepStrictEqual(decisionsD.map((d) => d.grade), ['good', 'good', 'good', 'brilliant']);
assert.ok(decisionsD[1].note.startsWith('Value raise'), 'flop value raise noted');
// Brilliant laydown: premium strength 0.71 vs an overbet needing 44.1% —
// the halved (range-discounted) equity, 35.5, is more than 8 points short,
// while the raw 71% would have read as a call. Exercises all three gates
// (LAYDOWN_STRENGTH 0.7, LAYDOWN_MIN_NEEDED 44, LAYDOWN_RANGE_DISCOUNT 0.5).
const laydown = decisionsD[3];
assert.strictEqual(laydown.action, 'fold');
assert.strictEqual(laydown.metrics.neededPct, 44.1);
assert.ok(laydown.note.includes('Disciplined laydown'));

const timelineE = buildReplayTimeline(handE, HERO);
const decisionsE = gradeHand(timelineE, stubEngine);
assert.deepStrictEqual(decisionsE.map((d) => d.grade), ['good', 'mistake', 'inaccuracy', 'inaccuracy']);
// Mistake call: 33% vs 37.5% needed — inside the [-8, -3) band.
assert.strictEqual(decisionsE[1].metrics.neededPct, 37.5);
// Spew raise: 25% hand, no draw, free card available.
assert.strictEqual(decisionsE[2].action, 'raise');
assert.ok(decisionsE[2].note.includes('free'));
// Missed value: river check with an 85% hand.
assert.strictEqual(decisionsE[3].action, 'check');
assert.ok(decisionsE[3].note.includes('missed value'));

const timelineF = buildReplayTimeline(handF, HERO);
const decisionsF = gradeHand(timelineF, stubEngine);
assert.deepStrictEqual(decisionsF.map((d) => d.grade), ['good', 'blunder', 'good']);
// The turn fold is the CORRECT side of a bad price — good, not punished.
assert.strictEqual(decisionsF[2].action, 'fold');

// Grading is null-safe.
assert.deepStrictEqual(gradeHand(null, stubEngine), []);
assert.deepStrictEqual(gradeHand(timelineA, null), []);

// --- match review ----------------------------------------------------------

const allHands = [handA, handB, handC, handD, handE, handF];
const review = buildMatchReview(allHands, HERO, stubEngine);

// 21 decisions: 12 good + 2 brilliant (14×1) + 2 inaccuracy (1.5) +
// 2 mistake (1.0) + 3 blunder (0.45) = 16.95 → 16.95/21 = 80.71 → 81.
assert.deepStrictEqual(review.grades, {
  brilliant: 2,
  good: 12,
  inaccuracy: 2,
  mistake: 2,
  blunder: 3,
});
assert.strictEqual(review.accuracyPct, 81);
assert.strictEqual(GRADE_SCORE.blunder, 0.15); // policy constant stays honest

assert.strictEqual(review.hands.length, 6);
assert.deepStrictEqual(
  review.hands.map((h) => h.worstGrade),
  ['blunder', 'blunder', 'mistake', 'good', 'mistake', 'blunder']
);
assert.strictEqual(review.hands[0].netChange, -700);
assert.strictEqual(review.hands[4].netChange, 900);

// Key hands: blunder > mistake > all-in > |netChange|. B carries a blunder AND
// the all-in, so it outranks A/F (blunder only); E's 900 swing beats C's 800.
assert.deepStrictEqual(review.keyHands.map((h) => h.handNumber), [2, 1, 6, 5]);
assert.deepStrictEqual(review.keyHands[0].keyReasons, ['blunder', 'all-in']);
assert.deepStrictEqual(review.keyHands[1].keyReasons, ['blunder']);
assert.deepStrictEqual(review.keyHands[3].keyReasons, ['mistake']);
assert.deepStrictEqual(
  review.hands.map((h) => h.isKeyHand),
  [true, true, false, false, true, true]
);

// Leaks: two call blunders (B, F) trip chasing-bad-prices; only one fold
// blunder and one missed value bet, so those tags stay quiet.
assert.deepStrictEqual(review.leakTags, ['chasing-bad-prices']);

// Empty / malformed input: perfect score, nothing to show, no throw.
assert.strictEqual(buildMatchReview([], HERO, stubEngine).accuracyPct, 100);
assert.strictEqual(buildMatchReview([{ bogus: true }], HERO, stubEngine).hands.length, 0);

// --- drill conversion ------------------------------------------------------

const drill = toDrillPuzzle(timelineA, foldBlunder, handA);
assert.ok(drill, 'drill builds');
assert.strictEqual(drill.initialState.phase, 'turn');
assert.strictEqual(drill.initialState.pot, 2300);
assert.strictEqual(drill.initialState.opponentBet, 900);
assert.strictEqual(drill.initialState.playerChips, 9300);
assert.strictEqual(drill.initialState.opponentChips, 8400);
assert.strictEqual(drill.initialState.bigBlind, 100);
assert.strictEqual(drill.initialState.position, 'BTN');
assert.strictEqual(drill.initialState.action, 'facing_raise');
assert.strictEqual(drill.initialState.communityCards.length, 4); // board at that moment
assert.deepStrictEqual(drill.initialState.playerCards, handA.players[0].cards);
assert.deepStrictEqual(drill.initialState.opponentCards, []); // face down
assert.strictEqual(drill.progression.correctAction, 'call'); // inverse of the fold blunder
assert.strictEqual(drill.progression.mistakeAction, 'fold');
assert.ok(drill.progression.explanation.includes('Price: 900 to win 3200 — 28.1% equity needed.'));
assert.strictEqual(drill.progression.flopCards.length, 3);
assert.deepStrictEqual(drill.progression.turnCard, card('J', '♥'));
assert.strictEqual(drill.progression.riverCard, null); // hand A never saw one

// The spew raise drills into taking the free card; the missed value bet
// drills into raising.
const spewDrill = toDrillPuzzle(timelineE, decisionsE[2], handE);
assert.strictEqual(spewDrill.progression.correctAction, 'check');
assert.strictEqual(spewDrill.progression.mistakeAction, null); // inaccuracy, not a mistake
assert.strictEqual(spewDrill.initialState.action, 'unopened_pot');
const valueDrill = toDrillPuzzle(timelineE, decisionsE[3], handE);
assert.strictEqual(valueDrill.progression.correctAction, 'raise');

// The produced puzzle must normalize through the REAL normalizePuzzleState
// (now a CommonJS module in poker-core) without error.
const puzzleModule = require('../src/state/normalizePuzzleState');
const normalizePuzzleState = puzzleModule.default || puzzleModule.normalizePuzzleState;
const normalized = normalizePuzzleState(drill);
assert.strictEqual(normalized.initialHandState.pot, 2300);
assert.strictEqual(normalized.initialHandState.opponentBet, 900);
assert.strictEqual(normalized.legalActions.toCall, 900);
assert.strictEqual(normalized.legalActions.canCall, true);
assert.strictEqual(normalized.legalActions.canCheck, false);
assert.strictEqual(normalized.correctAction, 'call');
assert.strictEqual(normalized.explanation, drill.progression.explanation);
const normalizedSpew = normalizePuzzleState(spewDrill);
assert.strictEqual(normalizedSpew.legalActions.canCheck, true);

// Drill conversion is null-safe.
assert.strictEqual(toDrillPuzzle(null, foldBlunder, handA), null);
assert.strictEqual(toDrillPuzzle(timelineA, null, handA), null);

// --- real AIPlayer smoke run -----------------------------------------------
// In poker-core, AIPlayer and pokerEvaluator are already CommonJS (converted
// from ESM during extraction), so they require() directly — this proves the
// review pipeline runs on the REAL extracted engine, not just the stub.

const AIPlayer = require('../src/ai/aiPlayer');
const { evaluateHand } = require('../src/eval/pokerEvaluator');
assert.strictEqual(typeof AIPlayer, 'function', 'real AIPlayer class loads');
const realEngine = new AIPlayer();
realEngine.evaluateHand = evaluateHand; // expose the made-hand gate, like the UI wrapper will

// AKs preflop should read as a strong hold on the real evaluator.
assert.ok(realEngine.evaluateHandStrength([card('A', '♠'), card('K', '♠')], []) > 0.5);

const realDecisions = gradeHand(timelineA, realEngine);
assert.strictEqual(realDecisions.length, 3, 'real engine grades all hero decisions');
const VALID_GRADES = ['brilliant', 'good', 'inaccuracy', 'mistake', 'blunder'];
realDecisions.forEach((decision) => {
  assert.ok(VALID_GRADES.includes(decision.grade), `valid grade: ${decision.grade}`);
  assert.strictEqual(typeof decision.metrics.strength, 'number');
  assert.ok(decision.metrics.strength >= 0 && decision.metrics.strength <= 1);
  assert.strictEqual(typeof decision.note, 'string');
});
// Price math is engine-independent: the turn fold still faced 28.1%.
assert.strictEqual(realDecisions[2].metrics.neededPct, 28.1);

const realReview = buildMatchReview(allHands, HERO, realEngine);
assert.strictEqual(realReview.hands.length, 6);
assert.ok(realReview.accuracyPct >= 0 && realReview.accuracyPct <= 100);

// --- regression locks from the adversarial review (2026-07-22) --------------
// Synthetic minimal timelines: gradeHand only needs hero.cards, bigBlind, frames.

const syntheticFrame = (over) => ({
  index: 0,
  phase: 'river',
  boardCards: [card('2', '♣'), card('7', '♦'), card('9', '♠'), card('J', '♦'), card('3', '♥')],
  actor: 'hero',
  isHeroDecision: true,
  action: 'fold',
  amount: 0,
  potBefore: 1750,
  potAfter: 1750,
  toCall: 750,
  ...over,
});
const syntheticTimeline = (frames, heroRanks) => ({
  hero: { cards: [card(heroRanks[0], '♥'), card(heroRanks[1], '♠')], seat: 'BTN' },
  opponent: { cards: [], seat: 'BB' },
  bigBlind: 100,
  frames,
});

// 1) Laydown gate must NOT launder a profitable-call fold into 'brilliant':
// strength 0.56 folding at needed 42.9 (raw diff +13.1) is a blunder.
const midFoldEngine = {
  evaluateHandStrength: () => 0.56,
  hasFlushDraw: () => ({ isFlushDraw: false, outs: 0 }),
  evaluateDrawingHands: () => ({ straightOuts: 0, flushOuts: 0, totalOuts: 0 }),
};
const overFire = gradeHand(syntheticTimeline([syntheticFrame({})], ['Q', 'J']), midFoldEngine);
assert.strictEqual(overFire.length, 1);
assert.strictEqual(overFire[0].grade, 'blunder', 'moderate-strength fold vs big bet is a blunder, not brilliant');

// 2) The blind exemption must not swallow a BB decision facing a min-raise:
// once ANY preflop raise happened, a toCall <= BB fold is a real graded decision.
const bbVsMinRaise = syntheticTimeline(
  [
    { index: 0, phase: 'blinds', actor: 'hero', isHeroDecision: false, action: 'small blind', amount: 50, potBefore: 0, potAfter: 50, toCall: 0 },
    { index: 1, phase: 'blinds', actor: 'opponent', isHeroDecision: false, action: 'big blind', amount: 100, potBefore: 50, potAfter: 150, toCall: 0 },
    { index: 2, phase: 'preflop', actor: 'opponent', isHeroDecision: false, action: 'raise', amount: 150, potBefore: 150, potAfter: 300, toCall: 50 },
    { index: 3, phase: 'preflop', actor: 'hero', isHeroDecision: true, action: 'fold', amount: 0, potBefore: 300, potAfter: 300, toCall: 100, boardCards: [] },
  ],
  ['A', 'A']
);
const strongPreflopEngine = {
  evaluateHandStrength: () => 0.85,
  hasFlushDraw: () => ({ isFlushDraw: false, outs: 0 }),
  evaluateDrawingHands: () => ({ straightOuts: 0, flushOuts: 0, totalOuts: 0 }),
};
const bbDecisions = gradeHand(bbVsMinRaise, strongPreflopEngine);
assert.strictEqual(bbDecisions.length, 1);
assert.ok(bbDecisions[0].metrics.strength !== null, 'BB fold vs a min-raise is actually graded');
assert.strictEqual(bbDecisions[0].grade, 'blunder', 'folding AA to a min-raise grades a blunder');
// ...while a genuine unraised SB completion spot stays exempt:
const sbSpot = syntheticTimeline(
  [
    { index: 0, phase: 'blinds', actor: 'hero', isHeroDecision: false, action: 'small blind', amount: 50, potBefore: 0, potAfter: 50, toCall: 0 },
    { index: 1, phase: 'blinds', actor: 'opponent', isHeroDecision: false, action: 'big blind', amount: 100, potBefore: 50, potAfter: 150, toCall: 0 },
    { index: 2, phase: 'preflop', actor: 'hero', isHeroDecision: true, action: 'fold', amount: 0, potBefore: 150, potAfter: 150, toCall: 50, boardCards: [] },
  ],
  ['7', '2']
);
const sbDecisions = gradeHand(sbSpot, strongPreflopEngine);
assert.strictEqual(sbDecisions.length, 1);
assert.strictEqual(sbDecisions[0].metrics.strength, null, 'unraised SB fold stays ungraded');

// 3) A facing-a-bet spew-raise inaccuracy drills to CALL (the priced continue),
// never fold — 'fold' would contradict the grade's own rationale.
const spewFrame = syntheticFrame({ action: 'raise', amount: 400, toCall: 100, potBefore: 1000, phase: 'flop', boardCards: [card('2', '♣'), card('7', '♦'), card('9', '♠')] });
const spewTimeline = syntheticTimeline([spewFrame], ['Q', '4']);
const spewDecision = {
  frameIndex: 0,
  action: 'raise',
  grade: 'inaccuracy',
  metrics: { strength: 0.15, equityPct: 15, neededPct: 9.1, toCall: 100, pot: 1000 },
  note: 'Raised with a 15% hand and no draw when a cheap continue was available',
};
const facingDrill = toDrillPuzzle(spewTimeline, spewDecision, handA);
assert.ok(facingDrill, 'facing spew drill builds');
assert.strictEqual(facingDrill.progression.correctAction, 'call', 'spew vs a priced bet drills to call');

console.log('review checks passed');
