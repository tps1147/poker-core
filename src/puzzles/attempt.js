'use strict';

// Recording an answer: exactly the body each server endpoint reads, built one way for both clients.
//
//   generated puzzles  POST /puzzles/generated/attempt
//                      { correct, action, difficulty, timeTakenMs, hintUsed, daily, topic, seed }
//     difficulty is the band the puzzle was SERVED (never 'adaptive'), so the server grades it
//     against that band's rating; topic is the puzzle's own (meta.topic); seed is meta.seed (the
//     server ignores it today; it is sent so a later server can check the spot). hintUsed and daily
//     are always booleans. puzzleRating and leakKey are not sent: the server ignores both.
//   library puzzles    POST /puzzles/attempt { puzzleId, correct, action, timeTakenMs }
//
// daily is true only for the day's daily puzzle answered on that day (the server marks the day's
// dailyDone from it), so it needs the moment of the answer: pass answeredAt (and tzOffsetMinutes,
// as for todayKey). With answeredAt, daily is worked out from the puzzle when not given.
//
// correct, when not given, is graded here (gradeAnswer).

const { canonicalAction, gradeAnswer } = require('./answer');
const { normaliseDifficulty } = require('./bands');
const { isPuzzleTopic } = require('./topics');
const { todayKey, isDailyPuzzle } = require('./daily');

// The actions the server stores (anything else it records as 'call').
const ATTEMPT_ACTIONS = Object.freeze(['fold', 'call', 'raise', 'check', 'all-in']);

function puzzleIdOf(puzzle) {
  const id = puzzle._id !== undefined && puzzle._id !== null ? puzzle._id : puzzle.id;
  return id === undefined || id === null ? '' : String(id);
}

// 'generated' (from /puzzles/generate: no id, a topic and a seed), 'library' (a stored puzzle with
// a database id), or 'local' (lesson and drill puzzles, not recorded through these endpoints).
// null for no puzzle.
function puzzleKind(puzzle) {
  if (!puzzle || typeof puzzle !== 'object') return null;
  const id = puzzleIdOf(puzzle);
  if (/^[0-9a-f]{24}$/i.test(id)) return 'library';
  const meta = puzzle.meta || {};
  const tagged = Array.isArray(puzzle.tags) && puzzle.tags.includes('generated');
  if (!id && ((isPuzzleTopic(meta.topic) && Number.isInteger(meta.seed)) || tagged)) return 'generated';
  return 'local';
}

function attemptAction(action) {
  const a = canonicalAction(action);
  if (!ATTEMPT_ACTIONS.includes(a)) {
    throw new TypeError(`attempt action must be one of ${ATTEMPT_ACTIONS.join(', ')} (or bet), got ${JSON.stringify(action)}`);
  }
  return a;
}

const toMs = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
};

const gradedCorrect = (puzzle, action, correct) => (typeof correct === 'boolean' ? correct : gradeAnswer(puzzle, action).correct === true);

function dailyFlag(puzzle, { daily, answeredAt, tzOffsetMinutes }) {
  if (daily === false) return false;
  const hasMoment = answeredAt instanceof Date || (typeof answeredAt === 'number' && Number.isFinite(answeredAt));
  if (!hasMoment) {
    if (daily === true) throw new TypeError('generatedAttemptPayload: daily needs answeredAt (the moment of the answer)');
    return false;
  }
  return isDailyPuzzle(puzzle, todayKey(answeredAt, tzOffsetMinutes));
}

function generatedAttemptPayload({ puzzle, action, correct, hintUsed, daily, timeTakenMs, tzOffsetMinutes, answeredAt } = {}) {
  if (puzzleKind(puzzle) !== 'generated') throw new TypeError('generatedAttemptPayload: not a generated puzzle');
  const act = attemptAction(action);
  const meta = puzzle.meta || {};
  const body = {
    correct: gradedCorrect(puzzle, act, correct),
    action: act,
    difficulty: normaliseDifficulty(puzzle.difficulty),
    timeTakenMs: toMs(timeTakenMs),
    hintUsed: hintUsed === true,
    daily: dailyFlag(puzzle, { daily, answeredAt, tzOffsetMinutes }),
  };
  if (isPuzzleTopic(meta.topic)) body.topic = meta.topic;
  if (Number.isInteger(meta.seed)) body.seed = meta.seed;
  return body;
}

function libraryAttemptPayload({ puzzle, action, correct, timeTakenMs } = {}) {
  if (puzzleKind(puzzle) !== 'library') throw new TypeError('libraryAttemptPayload: not a library puzzle');
  const act = attemptAction(action);
  return {
    puzzleId: puzzleIdOf(puzzle),
    correct: gradedCorrect(puzzle, act, correct),
    action: act,
    timeTakenMs: toMs(timeTakenMs),
  };
}

// The one call both clients make after an answer: { endpoint: 'generated' | 'library', body }, or
// null for a puzzle that is not recorded here ('local'). Same arguments as generatedAttemptPayload.
function puzzleAttempt(args = {}) {
  const kind = puzzleKind(args.puzzle);
  if (kind === 'generated') return { endpoint: 'generated', body: generatedAttemptPayload(args) };
  if (kind === 'library') return { endpoint: 'library', body: libraryAttemptPayload(args) };
  return null;
}

module.exports = {
  ATTEMPT_ACTIONS,
  puzzleKind,
  generatedAttemptPayload,
  libraryAttemptPayload,
  puzzleAttempt,
};
