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
//   tiers     PUZZLE_TIERS, the chip ladder (White, Red 1100, Green 1250, Black 1400, Purple 1550,
//             Gold 1700), puzzleTier, puzzleTierPromotion
//   rematch   the missed-hand queue: rematchAfterAnswer, dueRematch, rematchesWaiting
//   reveal    puzzleDuel (equity against the price) and puzzleCount (the outs, for "Show the count")
//   dailyShare dailyNumber, dailySplit (how every player answered), dailyShareText
//
// TIERS: the chip ladder (tiers.js) is the display ladder both clients show, approved by the
// owner on 2026-10-09. poker-core/rating's RATING_TIERS is the AI-rating ladder, a different
// scale. The server's stored puzzleRanking.tier (Bronze to Diamond) is left as it was.

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
  ...require('./tiers'),
  ...require('./rematch'),
  ...require('./reveal'),
  ...require('./dailyShare'),
};
