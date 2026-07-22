// Pure hero-only table insights, ported from the React hook
// Poker.com/src/hooks/useHandInsights.js with the React removed. The insight
// engine (an aiPlayer instance) is INJECTED as a parameter so the mobile hook
// and a web hook can each own the engine's lifecycle (one long-lived instance).
//
// Returns null until the hero has two hole cards; every field is safe to read
// with optional chaining. Null-safe and side-effect free.

const { normalizeGameState } = require('../state/normalizeGameState');
const { evaluateHand } = require('../eval/pokerEvaluator');
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

  const equity = computeEquity({ totalOuts: outs?.total || 0, phase, strength });

  // Raw pot excludes current-street bets (same convention AIPlayer uses).
  const potBeforeCall = (normalized.pot || 0)
    + normalized.players.reduce((sum, player) => sum + (player.bet || 0), 0);
  const potOdds = computePotOdds({
    callAmount: normalized.availableActions?.toCall || 0,
    potBeforeCall,
  });

  return {
    phase,
    strength,
    strengthLabel: strengthLabel(strength, { madeHandName, phase }),
    madeHandName,
    outs,
    equityPct: equity.pct,
    equityIsEstimate: equity.isEstimate,
    potOdds,
    boardTexture: texture ? { ...texture, label: textureLabel(texture) } : null,
    overcards,
  };
};

module.exports = { computeHandInsights };
