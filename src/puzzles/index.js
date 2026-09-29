// The puzzle engine: one set of puzzle rules for the phone, the web and the server.
// Subpath entry: require('poker-core/puzzles'). Pure CommonJS, no I/O and no platform APIs; the
// same inputs always give the same outputs.
//
//   copy      PUZZLE_COPY: every player-visible string the engine returns
//   seed      PUZZLE_SEED_RANGE, seedFrom, and the server's fnv1a32 / makeSeed / mulberry32
//   bands     the band table (ratings 1000/1300/1600, K 16/24/32, 'adaptive' cut-offs 1250/1550,
//             seeded +/-75 nudge), adaptiveBand / adaptiveDifficulty, normaliseDifficulty,
//             the server's rating change, puzzleStanding ('Unrated' until the first attempt)
//   topics    PUZZLE_TOPICS, labels, the spot per topic, topicForSeed
//   daily     todayKey / dayStart (the player's local day), the daily puzzle (dailySeed,
//             dailyTopic, dailyRequest, isDailyPuzzle), previewSeed, DAILY_PUZZLE_GOAL = 10
//   run       PUZZLE_RUN_MARKS [3,5,10,15,20], runAfter (a hinted solve keeps the run), marks,
//             and the saved-run record
//   request   nextPuzzleRequest({ mode: 'solve' | 'topic' | 'daily' | 'rush', ... })
//   answer    puzzleActions, gradeAnswer, answerMaths, dealPlan, puzzleIdentity, advanceRule,
//             resolveAnswer
//   attempt   generatedAttemptPayload, libraryAttemptPayload, puzzleAttempt
//
// TIERS: poker-core has no puzzle tier ladder. poker-core/rating's RATING_TIERS is the AI-rating
// ladder (600 to 1200 'territory'), on a different scale from the puzzle rating (which starts at
// 1200), so it is not reused here and there is no pointsToNextTier. The server keeps the only
// puzzle ladder (pokerServer User.updatePuzzleRanking: Bronze, Silver 1400, Gold 1600, Platinum
// 1800, Diamond 2000); moving it here is an owner decision.

module.exports = {
  ...require('./copy'),
  ...require('./seed'),
  ...require('./bands'),
  ...require('./topics'),
  ...require('./daily'),
  ...require('./run'),
  ...require('./request'),
  ...require('./answer'),
  ...require('./attempt'),
};
