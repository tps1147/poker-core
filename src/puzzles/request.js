'use strict';

// Which puzzle to ask the server for: nextPuzzleRequest({ mode, ... }) -> { topic, difficulty, seed },
// the query for GET /puzzles/generate. Both clients build every request here, so the same inputs
// ask for the same puzzle on the phone and the web.
//
//   'solve'  the open stream (Solve a puzzle). The topic comes from the seed unless a topic lock is
//            given; the difficulty is 'adaptive' (the server picks the band from the player's
//            rating) unless an explicit band is given.
//   'topic'  a locked stream (Explore, Stats 'Fix this', Learn drills): as 'solve', with the
//            caller's topic. A topic the generator does not know is ignored (the open stream).
//   'daily'  the day's puzzle: the same request for every player that day (dailyRequest). Topic,
//            difficulty and seedSource are ignored; dayKey (from todayKey) is required.
//   'rush'   Puzzle Rush: the topic comes from the seed, the band ramps with the Rush streak
//            (rushDifficultyForStreak). Topic and difficulty are ignored.
//
// Difficulties the server does not know ('expert') are never requested: an explicit difficulty
// other than a band or 'adaptive' is treated as not given.
//
// seedSource is required for every mode but 'daily' (see seedFrom): Math.random, a seed handed
// over in a link, or a seeded RNG in tests. The same seed always makes the same request.

const { seedFrom } = require('./seed');
const { isPuzzleBand, ADAPTIVE } = require('./bands');
const { isPuzzleTopic, topicForSeed } = require('./topics');
const { dailyRequest } = require('./daily');

const PUZZLE_MODES = Object.freeze(['solve', 'topic', 'daily', 'rush']);

// Rush's band by the streak before the answer: beginner, intermediate from 3, advanced from 7.
const RUSH_DIFFICULTY_STEPS = Object.freeze([
  Object.freeze({ from: 0, difficulty: 'beginner' }),
  Object.freeze({ from: 3, difficulty: 'intermediate' }),
  Object.freeze({ from: 7, difficulty: 'advanced' }),
]);

function rushDifficultyForStreak(streak) {
  const s = Number.isFinite(streak) && streak > 0 ? streak : 0;
  let difficulty = RUSH_DIFFICULTY_STEPS[0].difficulty;
  RUSH_DIFFICULTY_STEPS.forEach((step) => { if (s >= step.from) difficulty = step.difficulty; });
  return difficulty;
}

// A difficulty worth sending: a band or 'adaptive'. Anything else is null (not given).
function requestDifficulty(difficulty) {
  return isPuzzleBand(difficulty) || difficulty === ADAPTIVE ? difficulty : null;
}

function nextPuzzleRequest({ mode = 'solve', topic, difficulty, dayKey, seedSource, streak } = {}) {
  switch (mode) {
    case 'daily':
      return dailyRequest(dayKey);
    case 'rush': {
      const seed = seedFrom(seedSource);
      return { topic: topicForSeed(seed), difficulty: rushDifficultyForStreak(streak), seed };
    }
    case 'solve':
    case 'topic': {
      const seed = seedFrom(seedSource);
      return {
        topic: isPuzzleTopic(topic) ? topic : topicForSeed(seed),
        difficulty: requestDifficulty(difficulty) || ADAPTIVE,
        seed,
      };
    }
    default:
      throw new TypeError(`nextPuzzleRequest: unknown mode ${JSON.stringify(mode)} (one of ${PUZZLE_MODES.join(', ')})`);
  }
}

module.exports = {
  PUZZLE_MODES,
  RUSH_DIFFICULTY_STEPS,
  rushDifficultyForStreak,
  requestDifficulty,
  nextPuzzleRequest,
};
