// Pure hero-only table insights, ported from the React hook
// Poker.com/src/hooks/useHandInsights.js with the React removed. The insight
// engine (an aiPlayer instance) is INJECTED as a parameter so the mobile hook
// and a web hook can each own the engine's lifecycle (one long-lived instance).
//
// Returns null until the hero has two hole cards; every field is safe to read
// with optional chaining. Null-safe and side-effect free.

const { normalizeGameState } = require('../state/normalizeGameState');
const { evaluateHand } = require('../eval/pokerEvaluator');
const { simulatedEquity } = require('../review/simEquity');
const {
  normalizeCards,
  combineOuts,
  computeEquity,
  computePotOdds,
  strengthLabel,
  textureLabel,
} = require('./handInsightsMath');

// (gameState, heroId, engine) → insights object or null. `engine` must expose
// the AIPlayer surface: evaluateHandStrength, analyzeBoardTexture,
// countOvercards, evaluateDrawingHands, hasFlushDraw.
const computeHandInsights = (gameState, heroId, engine) => {
  if (!engine) return null;

  const normalized = normalizeGameState(gameState, { playerId: heroId });
  const holeCards = normalizeCards(normalized.hero?.cards);
  if (!holeCards || holeCards.length !== 2) return null;

  const board = normalizeCards(normalized.communityCards) || [];
  const phase = normalized.currentPhase;
  const isPostflop = board.length >= 3;
  const allCards = [...holeCards, ...board];

  const strength = engine.evaluateHandStrength(holeCards, board);

  let outs = null;
  let overcards = null;
  let texture = null;
  let madeHandName = null;
  if (isPostflop) {
    const made = evaluateHand(allCards);
    madeHandName = made?.name || null;
    texture = engine.analyzeBoardTexture(board);
    overcards = engine.countOvercards(allCards);

    // With a straight or better already made, "outs" are noise, and the engine's
    // hasStraightDraw would still fire on the made straight's own ranks.
    if (!made || made.rank < 5) {
      const draw = engine.evaluateDrawingHands(allCards);
      // The engine scores a 3-card "backdoor flush" as 10 outs — only a genuine
      // 4-card draw has real outs worth quoting.
      const flushDraw = engine.hasFlushDraw(allCards);
      const flushOuts = flushDraw.isFlushDraw && flushDraw.type === 'flush-draw' ? flushDraw.outs : 0;
      const straightOuts = draw.straightOuts || 0;
      const total = combineOuts(flushOuts, straightOuts);
      if (total > 0) outs = { flush: flushOuts, straight: straightOuts, total };
    }
  }

  // Raw pot excludes current-street bets (same convention AIPlayer uses).
  const potBeforeCall = (normalized.pot || 0)
    + normalized.players.reduce((sum, player) => sum + (player.bet || 0), 0);
  // Capped at the hero's stack, as the grader's toCall is: a short stack can only call what it has.
  const owed = normalized.availableActions?.toCall || 0;
  const heroChips = normalized.hero?.chips || 0;
  const toCall = heroChips > 0 ? Math.min(owed, heroChips) : owed;
  const potOdds = computePotOdds({ callAmount: toCall, potBeforeCall });

  // From the flop on, the equity is the grader's run-out (simEquity.js) on the same price, so the
  // HUD, the coach on the felt and the review read the same number for the same decision. The
  // strength score is not an equity: it read an unpaired flop hand near zero (T8 on Q-3-2 showed
  // 12% where the hand has 32% against a random hand), about 18 points low on the average flop.
  // The run-out is still an estimate (a modelled range, a sample), so it stays marked as one.
  const sim = isPostflop ? simulatedEquity(holeCards, board, { toCall, pot: potBeforeCall }) : null;
  const equity = sim !== null
    ? { pct: Math.round(sim), isEstimate: true, basis: 'simulated' }
    : computeEquity({ totalOuts: outs?.total || 0, phase, strength });

  return {
    phase,
    strength,
    strengthLabel: strengthLabel(strength, { madeHandName, phase }),
    madeHandName,
    outs,
    equityPct: equity.pct,
    equityIsEstimate: equity.isEstimate,
    equityBasis: equity.basis || null,
    potOdds,
    boardTexture: texture ? { ...texture, label: textureLabel(texture) } : null,
    overcards,
  };
};

module.exports = { computeHandInsights };
