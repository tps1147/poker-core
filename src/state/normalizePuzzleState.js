// Converted from ESM to CommonJS during extraction (originally
// Poker.com/src/game/normalizePuzzleState.js, which also carried a UTF-8 BOM —
// stripped here). `export const` became plain consts + a module.exports at the
// end. Logic is unchanged.

const EMPTY_HAND_STATE = Object.freeze({
  phase: 'puzzle',
  communityCards: [],
  playerCards: [],
  opponentCards: [],
  pot: 0,
  opponentBet: 0,
  bigBlind: 100,
  actionInProgress: false,
  isShowdown: false,
});

const deriveLegalActions = (state = {}, puzzle = {}) => {
  const toCall = state.opponentBet || state.currentBet || 0;
  const bigBlind = state.bigBlind || puzzle.bigBlind || 100;
  const actionContext = state.action || puzzle.action || 'facing_raise';
  const isUnopened = actionContext === 'unopened_pot';

  return {
    canFold: !isUnopened || toCall > 0,
    canCheck: toCall === 0,
    canCall: toCall > 0,
    canRaise: true,
    toCall,
    minimumRaise: Math.max(toCall * 2, bigBlind * 2),
    suggestedRaise: isUnopened ? bigBlind * 3 : Math.max(toCall * 2, bigBlind * 2),
  };
};

const normalizePuzzleState = (puzzleData = {}, liveState = null) => {
  const puzzle = puzzleData && typeof puzzleData === 'object' ? puzzleData : {};
  const initialState = {
    ...EMPTY_HAND_STATE,
    ...(puzzle.initialState || {}),
  };
  const activeState = {
    ...initialState,
    ...(liveState || {}),
  };
  const progression = puzzle.progression || {};
  const result = puzzle.result || liveState?.result || null;

  return {
    puzzleId: puzzle._id || puzzle.id || null,
    title: puzzle.title || 'Poker Puzzle',
    initialHandState: initialState,
    activeHandState: activeState,
    legalActions: progression.legalActions || puzzle.legalActions || deriveLegalActions(activeState, puzzle),
    selectedAction: liveState?.selectedAction || null,
    correctAction: progression.correctAction || puzzle.correctAction || null,
    explanation: progression.explanation || puzzle.explanation || '',
    result,
    ratingDelta: result?.ratingDelta || puzzle.ratingDelta || 0,
    nextRecommendation: result?.nextRecommendation || puzzle.nextRecommendation || null,
  };
};

module.exports = {
  normalizePuzzleState,
};
