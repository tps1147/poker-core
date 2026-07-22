// Main barrel — the single source of truth for shared poker logic used by both
// the Poker.com mobile app (Metro) and the Next.js web app (turbopack), plus
// plain node for tests. Everything is CommonJS; no build step.
//
// Subpath entries are also available for tighter imports:
//   require('poker-core/review')   require('poker-core/insights')
//   require('poker-core/rating')   require('poker-core/state')
//   require('poker-core/eval')     require('poker-core/ai')
//   require('poker-core/data')

const pokerEvaluator = require('./eval/pokerEvaluator');

module.exports = {
  // Match Review engine + grade theme.
  ...require('./review'),
  // Hand-insight engine: pure math, computeHandInsights, opponent tracker.
  ...require('./insights'),
  // Rating / bot-journey model + ELO bands.
  ...require('./rating'),
  // Game-state normalization + mode helpers.
  ...require('./state'),
  // Archetype scouting metadata.
  ...require('./data/archetypeScout'),
  // The shared insight engine (AIPlayer class) and the hand evaluator.
  AIPlayer: require('./ai/aiPlayer'),
  pokerEvaluator,
  evaluateHand: pokerEvaluator.evaluateHand,
  compareHands: pokerEvaluator.compareHands,
};
