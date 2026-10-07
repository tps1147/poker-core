'use strict';

// Difficulty bands: what each band is rated, how hard it moves a rating, and which band
// 'adaptive' serves a player. This is pokerServer 252d87e's behaviour, moved here so the server
// (PuzzleGeneratorService, puzzleController, PuzzleRatingService) and both clients read one table.
//
//   band          puzzle rating   K    'adaptive' serves it from
//   beginner      1000            16   (everyone below 1250, and every unrated player)
//   intermediate  1300            24   1250
//   advanced      1600            32   1550
//
// Near a cut-off the player's rating is nudged by up to ADAPTIVE_SPREAD either way, keyed by the
// request's seed (never Math.random), so a seeded request always picks the same band. A request
// with no seed is not nudged.

const { PUZZLE_COPY } = require('./copy');
const { makeSeed, mulberry32 } = require('./seed');

const PUZZLE_BANDS = Object.freeze(['beginner', 'intermediate', 'advanced']);
// The difficulties the server knows and serves as asked. 'adaptive' is a request, not a band.
const VALID_DIFFICULTIES = PUZZLE_BANDS;
const ADAPTIVE = 'adaptive';

const DIFFICULTY_RATING = Object.freeze({ beginner: 1000, intermediate: 1300, advanced: 1600 });
const DIFFICULTY_K = Object.freeze({ beginner: 16, intermediate: 24, advanced: 32 });
const ADAPTIVE_CUTOFFS = Object.freeze({ intermediate: 1250, advanced: 1550 });
const ADAPTIVE_SPREAD = 75;
// A generated attempt that names no band (or names 'adaptive', the request rather than the band
// served) is graded against this neutral rating.
const UNBANDED_PUZZLE_RATING = 1200;
// A new player's puzzle rating (pokerServer User puzzleRanking.rating default).
const STARTING_PUZZLE_RATING = 1200;

const PUZZLE_BAND_TABLE = Object.freeze(PUZZLE_BANDS.map((name) => Object.freeze({
  name,
  label: PUZZLE_COPY.difficulties[name],
  rating: DIFFICULTY_RATING[name],
  k: DIFFICULTY_K[name],
  adaptiveFrom: Object.prototype.hasOwnProperty.call(ADAPTIVE_CUTOFFS, name) ? ADAPTIVE_CUTOFFS[name] : null,
})));

const isPuzzleBand = (difficulty) => typeof difficulty === 'string'
  && Object.prototype.hasOwnProperty.call(DIFFICULTY_RATING, difficulty);

// The band a served difficulty is graded as. Anything the generator does not know ('expert', a
// typo, nothing) was served as a beginner spot, so it is one (the server's bandOf /
// sanitizeDifficulty).
function normaliseDifficulty(difficulty) {
  return isPuzzleBand(difficulty) ? difficulty : 'beginner';
}

function ratingForDifficulty(difficulty) {
  return DIFFICULTY_RATING[normaliseDifficulty(difficulty)];
}

function kFactorForDifficulty(difficulty) {
  return DIFFICULTY_K[normaliseDifficulty(difficulty)];
}

// The rating a generated attempt is graded against, from the difficulty in its body
// (puzzleController recordGeneratedAttempt): no difficulty, or 'adaptive', is the neutral 1200;
// anything else is its band's rating.
function attemptPuzzleRating(difficulty) {
  const served = typeof difficulty === 'string' && difficulty && difficulty !== ADAPTIVE ? difficulty : null;
  return served ? ratingForDifficulty(served) : UNBANDED_PUZZLE_RATING;
}

// The seeded nudge for a request's seed; 0 for a request with no seed.
function adaptiveNudge(seed) {
  if (seed === null || typeof seed === 'undefined') return 0;
  return Math.round((mulberry32(makeSeed('adaptive', 'spread', seed | 0))() * 2 - 1) * ADAPTIVE_SPREAD);
}

// adaptiveDifficulty(rating, seed): the server's positional form, unchanged. `rating` is the
// player's puzzle rating, or null/undefined for a player with nothing to adapt to (anonymous or
// never rated), who gets beginner.
function adaptiveDifficulty(rating, seed) {
  if (typeof rating !== 'number' || !Number.isFinite(rating)) return 'beginner';
  const nudged = rating + adaptiveNudge(seed);
  if (nudged >= ADAPTIVE_CUTOFFS.advanced) return 'advanced';
  if (nudged >= ADAPTIVE_CUTOFFS.intermediate) return 'intermediate';
  return 'beginner';
}

// adaptiveBand({ rating, rated, seed }): the band 'adaptive' serves. rated: false (no attempt has
// moved the rating yet) is beginner whatever the stored rating; leaving it out follows the rating
// given, as the server does once it has decided the player is rated.
function adaptiveBand({ rating, rated, seed } = {}) {
  if (rated === false) return 'beginner';
  return adaptiveDifficulty(rating, seed);
}

// The ELO expectation the server uses (PuzzleRatingService expectedScore).
function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

// What a generated attempt does to the player's rating, as the server computes it: one-sided ELO
// against the attempt's puzzle rating, K from the band. `rating` falls back to 1200 as the server's
// `puzzleRanking.rating || 1200` does.
function generatedRatingChange({ rating, difficulty, correct } = {}) {
  const before = rating || STARTING_PUZZLE_RATING;
  const puzzleRating = attemptPuzzleRating(difficulty);
  const k = kFactorForDifficulty(difficulty);
  const userChange = Math.round(k * ((correct === true ? 1 : 0) - expectedScore(before, puzzleRating)));
  return { userChange, newUserRating: before + userChange, puzzleRating };
}

// The standing line: a rating only once the player has attempted a puzzle. With none, 'Unrated'
// rather than the 1200 every account starts on.
function puzzleStanding({ rating, total } = {}) {
  const rated = typeof rating === 'number' && Number.isFinite(rating) && Number(total) > 0;
  return {
    rated,
    rating: rated ? rating : null,
    label: rated ? String(Math.round(rating)) : PUZZLE_COPY.unrated,
  };
}

function difficultyLabel(difficulty) {
  return Object.prototype.hasOwnProperty.call(PUZZLE_COPY.difficulties, difficulty)
    ? PUZZLE_COPY.difficulties[difficulty]
    : PUZZLE_COPY.difficulties[normaliseDifficulty(difficulty)];
}

module.exports = {
  PUZZLE_BANDS,
  VALID_DIFFICULTIES,
  ADAPTIVE,
  DIFFICULTY_RATING,
  DIFFICULTY_K,
  ADAPTIVE_CUTOFFS,
  ADAPTIVE_SPREAD,
  UNBANDED_PUZZLE_RATING,
  STARTING_PUZZLE_RATING,
  PUZZLE_BAND_TABLE,
  isPuzzleBand,
  normaliseDifficulty,
  ratingForDifficulty,
  kFactorForDifficulty,
  attemptPuzzleRating,
  adaptiveNudge,
  adaptiveDifficulty,
  adaptiveBand,
  expectedScore,
  generatedRatingChange,
  puzzleStanding,
  difficultyLabel,
};
