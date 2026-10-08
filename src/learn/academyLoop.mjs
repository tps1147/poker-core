// THE LESSON LOOP's shared rules (ACADEMY-LEARNING-LOOP 2026-10-07, section 2), moved here on
// 2026-10-08 from the two apps (Poker.com src/learning/academy/academyLoop.js at 7f386f4, and web's
// verbatim port src/lib/academy/academyLoop.js; the path place and next step from web's
// src/lib/academy/academyV2Model.js) so web and mobile import one copy. Behaviour is unchanged.
//
//   freshEvidence   the fresh hand's evidence for a node seal: { firstTry, hints, assisted, at }.
//   recapTally      the recap's roll-up: decisions, right first try, hints used. A count of
//                   decisions, never a result.
//   whyOf           a `why` stage ({ kind | type: "why", prompt, options: [{ id, text, correct, fix }] }),
//                   normalised, or null when the stage is not one (or carries no key of its own;
//                   lessonModel's whyResult grades a pick against the server key).
//   isWhyStage      whether a stage is a why stage at all.
//   trackPlace      where a lesson sits: "<track> · Lesson n", n its node's place among ALL of its
//                   track's nodes in tree order (the films number them that way).
//   nextAfter       what follows a lesson along the path: the next slot whose definition resolves.
//
// Pure: no I/O.
import { decisionStages } from "./lessons/index.mjs";
import { TRACKS } from "./academyTree.mjs";
import { TRACK_CHAPTERS, nodeOfLesson, chapterStanding } from "./curriculum.mjs";
import { provedLessonIds } from "./nodeState.mjs";

const freshStages = (definition) => decisionStages(definition).filter((stage) => stage.role === "fresh");
const timeOf = (t) => (t instanceof Date ? t.getTime() : Number(t));

// The fresh hand's evidence, from the run's own history (this run only): firstTry when the first
// attempt at EVERY fresh decision was right; hints the fresh decisions answered with a hint up;
// assisted when any fresh attempt was a "Show me". Null when the lesson has no fresh hand or the
// run has not answered all of it.
export function freshEvidence(definition, run, now) {
  const stages = freshStages(definition);
  if (!stages.length) return null;
  const history = Array.isArray(run?.history) ? run.history : [];
  const firsts = stages.map((stage) => history.find((item) => item?.spotId === stage.spotId) || null);
  if (firsts.some((item) => !item)) return null;
  const spots = new Set(stages.map((stage) => stage.spotId));
  const hints = stages.filter((stage) => run?.hints?.[stage.spotId] || firsts.find((f) => f.spotId === stage.spotId)?.usedHint).length;
  const assisted = history.some((item) => spots.has(item?.spotId) && item.assisted === true);
  return { firstTry: firsts.every((item) => item.correct === true), hints, assisted, at: timeOf(now) };
}

// The recap's tally: how many decisions the lesson asked, how many were right on the first try,
// and how many hints were used. Decisions only: a hand's outcome is never counted.
export function recapTally(definition, run) {
  const stages = decisionStages(definition);
  const history = Array.isArray(run?.history) ? run.history : [];
  const firstTry = stages.filter((stage) => history.find((item) => item?.spotId === stage.spotId)?.correct === true).length;
  const hints = stages.filter((stage) => run?.hints?.[stage.spotId] || history.some((item) => item?.spotId === stage.spotId && item.usedHint)).length;
  return { decisions: stages.length, firstTry, hints };
}

// A why stage, normalised: { prompt, options: [{ id, text, correct, fix }] }, or null. Accepts the
// definitions branches' `type: "why"` and a `kind: "why"` alike, and needs a prompt and at least
// two options with exactly one marked correct.
export function whyOf(stage) {
  if (!stage || (stage.type !== "why" && stage.kind !== "why")) return null;
  const options = (Array.isArray(stage.options) ? stage.options : [])
    .filter((o) => o && o.text)
    .map((o, i) => ({ id: String(o.id ?? i), text: String(o.text), correct: o.correct === true, fix: o.fix ? String(o.fix) : null }));
  if (!stage.prompt || options.length < 2 || options.filter((o) => o.correct).length !== 1) return null;
  return { prompt: String(stage.prompt), options };
}
export const isWhyStage = (stage) => !!stage && (stage.type === "why" || stage.kind === "why");

// ---- the path: a lesson's place and what follows it ------------------------------------------------

const trackOf = (id) => TRACKS.find((track) => track.id === id) || null;
const chapterOf = (id) => TRACK_CHAPTERS.find((chapter) => chapter.id === id) || null;

// Where a lesson sits, as its film draws it ("<track> · Lesson n"): the node's place among ALL of its
// track's nodes in tree order (the films number them that way, whether or not each is live yet).
// Takes a definition, a definition id or a node id; null off the tree.
export function trackPlace(definitionOrId) {
  const id = typeof definitionOrId === "string" ? definitionOrId : definitionOrId?.id;
  const node = id ? nodeOfLesson(id) : null;
  if (!node) return null;
  const chapter = chapterOf(node.track);
  const index = chapter.lessons.findIndex((slot) => slot.node === node.id);
  return {
    node: node.id, track: node.track, trackTitle: trackOf(node.track).title, trackNumber: trackOf(node.track).n,
    number: index + 1, total: chapter.lessons.length, last: index === chapter.lessons.length - 1,
  };
}

// What follows a lesson: the next playable slot in path order (`resolve(lessonId)` says which slots
// a definition opens; without it every slot counts). `chapterHand` is the track's chapter hand when
// this was the track's last playable lesson and the track has one (it opens once every node is
// filled; `open` says whether it is open now). `newTrack` marks a step into the next track, whose
// opener plays first. Null when the lesson is not on the tree.
export function nextAfter(definitionOrId, { resolve = null, progress = {} } = {}) {
  const place = trackPlace(definitionOrId);
  if (!place) return null;
  const order = TRACK_CHAPTERS.flatMap((chapter) => chapter.lessons.map((slot) => ({ slot, track: chapter.id })));
  const here = order.findIndex((item) => item.slot.node === place.node);
  const later = order.slice(here + 1).find((item) => !resolve || resolve(item.slot.lesson)) || null;
  const chapter = chapterOf(place.track);
  const lastPlayableInTrack = !later || later.track !== place.track;
  const standingNow = chapterStanding(chapter, { provedIds: provedLessonIds(progress) });
  return {
    slot: later?.slot || null,
    track: later?.track || null,
    definition: later && resolve ? resolve(later.slot.lesson) : null,
    newTrack: !!later && later.track !== place.track,
    chapterHand: lastPlayableInTrack && chapter.topic ? { track: place.track, open: standingNow.handOpen } : null,
  };
}
