// Barrel for the hand-insight engine (pure math + orchestration + opponent read).
// Subpath entry: require('poker-core/insights').
//
// opponentRead re-exports the same createOpponentCounts / recordOpponentAction /
// summarizeOpponentRead / deriveOpponentActionEvents that live in
// handInsightsMath, so spreading both is safe (identical references).

module.exports = {
  ...require('./handInsightsMath'),
  ...require('./handInsights'), // computeHandInsights
  ...require('./opponentRead'), // createOpponentTracker (+ re-exports)
};
