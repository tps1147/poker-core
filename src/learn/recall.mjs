// SPACED RECALL: the scheduler for the 20-second recall cards (ACADEMY-LEARNING-LOOP 2026-10-07,
// "Recall"). Pure functions over the progress object of nodeState.mjs; nothing is mutated and the
// clock is the caller's `now` (milliseconds or a Date).
//
// progress.recall[lessonId] = { step, due, log: [{ at, correct }] }
//   step  0..3, the index into RECALL_INTERVALS_DAYS of the interval the card is waiting out.
//   due   when the card is next due.
// A card starts at 1 day (scheduleRecall, called when the lesson's hands are done). A right answer
// moves it out one step: 1 -> 3 -> 7 -> 21 days, then stays at 21. A miss resets it to 1 day. Every
// answer is logged, and nodeState reads the log for the seal (a right recall one day or more after
// a clean fresh hand).
import { NODES } from "./academyTree.mjs";
import { recallCard } from "./recallBank.mjs";
import { DAY_MS } from "./nodeState.mjs";

export const RECALL_INTERVALS_DAYS = Object.freeze([1, 3, 7, 21]);
export const RECALL_MAX = 2;

const timeOf = (t) => (t instanceof Date ? t.getTime() : Number(t));
const LAST_STEP = RECALL_INTERVALS_DAYS.length - 1;
const dueAfter = (now, step) => timeOf(now) + RECALL_INTERVALS_DAYS[step] * DAY_MS;
const withCard = (progress, lessonId, card) => ({ ...progress, recall: { ...(progress?.recall || {}), [lessonId]: card } });

// Start a lesson's card, due in one day. A card already scheduled is left as it is.
export function scheduleRecall(progress = {}, lessonId, now) {
  if (progress?.recall?.[lessonId]) return progress;
  return withCard(progress, lessonId, { step: 0, due: dueAfter(now, 0), log: [] });
}

// Record a recall answer: right moves the card out one interval, a miss resets it to one day.
// A lesson with no card yet gets one.
export function recordRecall(progress = {}, lessonId, correct, now) {
  const card = progress?.recall?.[lessonId] || { step: 0, due: timeOf(now), log: [] };
  const step = correct === true ? Math.min(LAST_STEP, (Number(card.step) || 0) + 1) : 0;
  return withCard(progress, lessonId, { step, due: dueAfter(now, step), log: [...(card.log || []), { at: timeOf(now), correct: correct === true }] });
}

const TREE_INDEX = new Map(NODES.map((n, i) => [n.id, i]));
const TRACK_OF = new Map(NODES.map((n) => [n.id, n.track]));

// The cards due now, at most `max` (2): the most overdue first, interleaved across tracks (a second
// card from a track already picked only when no other track has one due), never two from the same
// lesson, and only lessons whose bank entry has a question. Each is { lessonId, track, due, rule,
// question }.
export function dueCards(progress = {}, now, { max = RECALL_MAX } = {}) {
  const t = timeOf(now);
  const due = Object.entries(progress?.recall || {})
    .filter(([lessonId, card]) => card && Number(card.due) <= t && TREE_INDEX.has(lessonId) && recallCard(lessonId))
    .sort(([a, x], [b, y]) => (Number(x.due) - Number(y.due)) || (TREE_INDEX.get(a) - TREE_INDEX.get(b)));
  const picked = [];
  const tracks = new Set();
  for (const pass of [0, 1]) {
    for (const [lessonId, card] of due) {
      if (picked.length >= max) break;
      if (picked.some((p) => p.lessonId === lessonId)) continue;
      const track = TRACK_OF.get(lessonId);
      if (pass === 0 && tracks.has(track)) continue;
      tracks.add(track);
      picked.push({ ...recallCard(lessonId), track, due: Number(card.due) });
    }
  }
  return picked;
}
