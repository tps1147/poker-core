'use strict';

// Rematches: a missed generated puzzle comes back. The same (topic, difficulty, seed) is the same
// spot (the generator is deterministic), so a rematch is just that request again, issued in
// learning mode so it never moves the rating a second time.
//
//   a miss                      joins the queue, due REMATCH_GAP answers later;
//   a rematch answered right    leaves the queue (fixed);
//   a rematch missed again      waits for the next day (due on the day after the miss);
//   a hinted rematch            counts as answered right: the hand was worked through.
//
// The queue is a plain record each platform stores (localStorage on the web, a store on the
// phone): { items: [{ key, request, misses, dueAfter, dueDay }], answered }. `answered` counts the
// answers made since the queue began; an item is due once `answered` reaches its dueAfter (or, for
// a next-day item, once the player's day is dueDay or later). Only generated spots can come back:
// a library puzzle has no seed. Daily puzzles never queue (the daily is one spot for one day).

const { todayKey, isDayKey, dayNumber } = require('./daily');
const { isPuzzleBand } = require('./bands');
const { PUZZLE_TOPICS } = require('./topics');

const REMATCH_GAP = 3;
const REMATCH_MAX = 12;

const emptyQueue = () => ({ items: [], answered: 0 });

function rematchQueue(record) {
  if (!record || typeof record !== 'object' || !Array.isArray(record.items)) return emptyQueue();
  const items = record.items.filter((item) => item && typeof item.key === 'string' && rematchRequestOk(item.request));
  const answered = Number.isFinite(record.answered) && record.answered > 0 ? Math.floor(record.answered) : 0;
  return { items: items.slice(-REMATCH_MAX), answered };
}

function rematchRequestOk(request) {
  return !!request && typeof request === 'object'
    && PUZZLE_TOPICS.includes(request.topic)
    && isPuzzleBand(request.difficulty)
    && Number.isInteger(request.seed);
}

// The request that re-deals a served puzzle, or null when it cannot come back (no seed, a library
// puzzle, the daily, an 'adaptive' band that was never resolved).
function rematchRequestFor(puzzle) {
  if (!puzzle || typeof puzzle !== 'object') return null;
  const meta = puzzle.meta || {};
  if (meta.daily || puzzle.daily) return null;
  const request = { topic: meta.topic, difficulty: puzzle.difficulty, seed: meta.seed };
  return rematchRequestOk(request) ? request : null;
}

const rematchKey = (request) => `${request.topic}|${request.difficulty}|${request.seed}`;

// The player's day at `now`, or null without a clock (the engine never reads one): with no `now`,
// next-day items wait and a second miss is dated from nothing, so it waits too.
const toDay = (now, tzOffsetMinutes) => (now === undefined || now === null ? null : todayKey(now, tzOffsetMinutes));

function nextDayKey(dayKey) {
  const n = dayNumber(dayKey) + 1;
  const d = new Date(n * 86400000);
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// rematchAfterAnswer(queue, { puzzle, correct, rematch, now, tzOffsetMinutes }) -> the new queue.
//   puzzle    the puzzle just answered; rematch: true when it was served as a rematch.
//   now       the moment of the answer (a Date or ms); pass it, or a second miss never comes back.
// An ungraded answer (correct null) only counts as an answer.
function rematchAfterAnswer(record, { puzzle, correct, rematch = false, now, tzOffsetMinutes } = {}) {
  const queue = rematchQueue(record);
  const answered = queue.answered + 1;
  const request = rematchRequestFor(puzzle);
  if (!request || (correct !== true && correct !== false)) return { items: queue.items, answered };
  const key = rematchKey(request);
  const existing = queue.items.find((item) => item.key === key);
  const others = queue.items.filter((item) => item.key !== key);
  if (correct === true) {
    // Right: a rematch is fixed; a fresh spot was never queued.
    return { items: others, answered };
  }
  if (existing || rematch) {
    const misses = (existing ? existing.misses : 1) + 1;
    const today = toDay(now, tzOffsetMinutes);
    const dueDay = today ? nextDayKey(today) : '9999-12-31';
    return { items: [...others, { key, request, misses, dueAfter: answered, dueDay }].slice(-REMATCH_MAX), answered };
  }
  return { items: [...others, { key, request, misses: 1, dueAfter: answered + REMATCH_GAP, dueDay: null }].slice(-REMATCH_MAX), answered };
}

function isDue(item, answered, day) {
  if (item.dueDay) return isDayKey(item.dueDay) && isDayKey(day) && dayNumber(day) >= dayNumber(item.dueDay);
  return answered >= item.dueAfter;
}

// The rematch due now (the oldest due item), or null. { key, request, misses }.
function dueRematch(record, { now, tzOffsetMinutes } = {}) {
  const queue = rematchQueue(record);
  const day = toDay(now, tzOffsetMinutes);
  const item = queue.items.find((it) => isDue(it, queue.answered, day));
  return item ? { key: item.key, request: { ...item.request }, misses: item.misses } : null;
}

// Rematches waiting: due now, and saved for a later day (Home's '1 rematch waiting').
function rematchesWaiting(record, { now, tzOffsetMinutes } = {}) {
  const queue = rematchQueue(record);
  const day = toDay(now, tzOffsetMinutes);
  const due = queue.items.filter((it) => isDue(it, queue.answered, day)).length;
  return { due, later: queue.items.length - due, total: queue.items.length };
}

module.exports = {
  REMATCH_GAP,
  REMATCH_MAX,
  rematchQueue,
  rematchRequestFor,
  rematchKey,
  rematchAfterAnswer,
  dueRematch,
  rematchesWaiting,
};
