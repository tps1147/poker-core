'use strict';

// The player's day, the daily puzzle and the daily goal.
//
// THE DAY. A day is the player's local calendar day. tzOffsetMinutes is what
// Date.prototype.getTimezoneOffset returns (UTC minus local: 420 for UTC-7, -600 for UTC+10), the
// same number the server's GET /puzzles/me/stats?tzOffset= takes, so todayKey here and the
// server's solvedToday / dailyDone window are the same day. Left out, it is the offset of the
// device the code runs on at that instant.
//
// THE DAILY PUZZLE is the same spot for everyone that day, on the phone and the web: its topic
// rotates through the five by day, its band is fixed (DAILY_DIFFICULTY, never 'adaptive', which
// would serve each player a different spot), and its seed is a hash of the day.

const { fnv1a32, PUZZLE_SEED_RANGE } = require('./seed');
const { PUZZLE_TOPICS } = require('./topics');

const DAILY_PUZZLE_GOAL = 10;
const DAILY_DIFFICULTY = 'intermediate';
const MAX_TZ_OFFSET_MINUTES = 840;
const DAY_MS = 24 * 60 * 60 * 1000;

// A tz offset in minutes, rounded and clamped to the real range of offsets. Garbage reads as 0.
function clampTzOffset(minutes) {
  if (minutes === null || typeof minutes === 'undefined' || minutes === '') return 0;
  const n = Number(minutes);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-MAX_TZ_OFFSET_MINUTES, Math.min(MAX_TZ_OFFSET_MINUTES, Math.round(n)));
}

function toTime(date) {
  if (date instanceof Date) {
    const t = date.getTime();
    if (Number.isFinite(t)) return t;
  } else if (typeof date === 'number' && Number.isFinite(date)) {
    return date;
  }
  throw new TypeError('expected a Date or a timestamp in milliseconds');
}

function offsetFor(ms, tzOffsetMinutes) {
  return tzOffsetMinutes === null || typeof tzOffsetMinutes === 'undefined'
    ? new Date(ms).getTimezoneOffset()
    : clampTzOffset(tzOffsetMinutes);
}

const pad = (n, width = 2) => String(n).padStart(width, '0');

// todayKey(date, tzOffsetMinutes) -> 'YYYY-MM-DD', the player's local day at that instant.
function todayKey(date, tzOffsetMinutes) {
  const ms = toTime(date);
  const local = new Date(ms - offsetFor(ms, tzOffsetMinutes) * 60 * 1000);
  return `${pad(local.getUTCFullYear(), 4)}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
}

// dayStart(date, tzOffsetMinutes) -> the Date at which that local day began (the server's
// startOfDay, which /me/stats counts solvedToday and dailyDone from).
function dayStart(date, tzOffsetMinutes) {
  const ms = toTime(date);
  const shiftMs = offsetFor(ms, tzOffsetMinutes) * 60 * 1000;
  const local = new Date(ms - shiftMs);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + shiftMs);
}

function isDayKey(dayKey) {
  if (typeof dayKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return false;
  const [y, m, d] = dayKey.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function assertDayKey(dayKey, fn) {
  if (!isDayKey(dayKey)) throw new TypeError(`${fn}: dayKey must be a 'YYYY-MM-DD' day (from todayKey), got ${JSON.stringify(dayKey)}`);
}

// Days since 1970-01-01 for a day key.
function dayNumber(dayKey) {
  assertDayKey(dayKey, 'dayNumber');
  const [y, m, d] = dayKey.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

function dailySeed(dayKey) {
  assertDayKey(dayKey, 'dailySeed');
  return fnv1a32(`daily|${dayKey}`) % PUZZLE_SEED_RANGE;
}

// The day's topic: the five in turn, one per day, so each comes round every five days.
function dailyTopic(dayKey) {
  const n = PUZZLE_TOPICS.length;
  return PUZZLE_TOPICS[((dayNumber(dayKey) % n) + n) % n];
}

// The request for the day's puzzle: the same for every player.
function dailyRequest(dayKey) {
  return { topic: dailyTopic(dayKey), difficulty: DAILY_DIFFICULTY, seed: dailySeed(dayKey) };
}

// Whether a served puzzle is that day's daily puzzle.
function isDailyPuzzle(puzzle, dayKey) {
  if (!puzzle || typeof puzzle !== 'object' || !isDayKey(dayKey)) return false;
  const meta = puzzle.meta || {};
  const want = dailyRequest(dayKey);
  return meta.topic === want.topic && meta.seed === want.seed && puzzle.difficulty === want.difficulty && !meta.adaptive;
}

// The seed of the puzzle a preview shows ahead of play (Play's puzzle cell on the web, the resting
// table on the phone): the day and today's count, so it moves on as the player solves.
function previewSeed(dayKey, solvedToday) {
  assertDayKey(dayKey, 'previewSeed');
  const count = Number.isFinite(solvedToday) && solvedToday > 0 ? Math.floor(solvedToday) : 0;
  return fnv1a32(`${dayKey}:${count}`) % PUZZLE_SEED_RANGE;
}

// Progress toward the daily goal. `count` is the server's /me/stats solvedToday (which counts
// every attempt today, right or wrong); null or garbage reads as nothing yet.
function dailyGoalProgress(count) {
  const done = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  return {
    count: done,
    goal: DAILY_PUZZLE_GOAL,
    filled: Math.min(done, DAILY_PUZZLE_GOAL),
    left: Math.max(0, DAILY_PUZZLE_GOAL - done),
    met: done >= DAILY_PUZZLE_GOAL,
  };
}

module.exports = {
  DAILY_PUZZLE_GOAL,
  DAILY_DIFFICULTY,
  MAX_TZ_OFFSET_MINUTES,
  clampTzOffset,
  todayKey,
  dayStart,
  isDayKey,
  dayNumber,
  dailySeed,
  dailyTopic,
  dailyRequest,
  isDailyPuzzle,
  previewSeed,
  dailyGoalProgress,
};
