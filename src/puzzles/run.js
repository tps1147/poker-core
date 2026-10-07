'use strict';

// The run: consecutive correct answers, with marks at 3, 5, 10, 15 and 20 (a restrained moment at
// each, and none past 20).
//
//   a correct answer             extends the run by one;
//   a correct answer with a hint keeps the run where it was (it still counts toward the rating);
//   a wrong answer               ends the run (0);
//   no answer key (ungraded)     leaves the run alone.
//
// A saved run is live only on the day it was made and for RUN_FRESH_MS after the last answer:
// after that it is a memory, not a run. Storage stays with each platform (localStorage on the web,
// a store on the phone); the record's shape and the rule for reading it back live here.

const { todayKey } = require('./daily');

const PUZZLE_RUN_MARKS = Object.freeze([3, 5, 10, 15, 20]);
const RUN_FRESH_MS = 20 * 60 * 1000;

const toRun = (run) => (Number.isFinite(run) && run > 0 ? Math.floor(run) : 0);

// The first mark above the run, or null past the last one.
function nextRunMark(run) {
  const r = toRun(run);
  const mark = PUZZLE_RUN_MARKS.find((m) => m > r);
  return typeof mark === 'number' ? mark : null;
}

function isRunMilestone(run) {
  return PUZZLE_RUN_MARKS.includes(toRun(run));
}

function runAfter(run, { correct, hintUsed } = {}) {
  const r = toRun(run);
  if (correct === true) return hintUsed === true ? r : r + 1;
  if (correct === false) return 0;
  return r;
}

// The mark this answer reached, or null. Only a run that grew can reach a mark, so a hinted solve
// sitting on a mark never fires it twice.
function runMilestoneReached(before, after) {
  const b = toRun(before);
  const a = toRun(after);
  return a > b && isRunMilestone(a) ? a : null;
}

// The run track: the marks reached, the next one, and the index of the last mark reached (-1 for
// none), for a row of five beads.
function runTrack(run) {
  const r = toRun(run);
  const reached = PUZZLE_RUN_MARKS.filter((m) => m <= r);
  return { run: r, next: nextRunMark(r), reached, hitIndex: reached.length - 1 };
}

// The record a platform saves after each answer.
function runRecord(run, { now, tzOffsetMinutes } = {}) {
  const at = now instanceof Date ? now.getTime() : now;
  return { run: toRun(run), at, day: todayKey(at, tzOffsetMinutes) };
}

// The run a saved record still holds at `now`: its run if it is from today and fresh, else 0.
// Reads the web's older { streak, at, date } record too.
function liveRun(record, { now, tzOffsetMinutes } = {}) {
  if (!record || typeof record !== 'object') return 0;
  const run = toRun(typeof record.run === 'number' ? record.run : record.streak);
  const at = Number(record.at);
  const day = record.day || record.date;
  const t = now instanceof Date ? now.getTime() : now;
  if (!Number.isFinite(at) || !Number.isFinite(t)) return 0;
  if (t < at || t - at > RUN_FRESH_MS) return 0;
  if (day !== todayKey(t, tzOffsetMinutes)) return 0;
  return run;
}

module.exports = {
  PUZZLE_RUN_MARKS,
  RUN_FRESH_MS,
  nextRunMark,
  isRunMilestone,
  runAfter,
  runMilestoneReached,
  runTrack,
  runRecord,
  liveRun,
};
