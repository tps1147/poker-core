// NODE STATE: where a learner stands on one lesson node of the academy tree (ACADEMY-LEARNING-LOOP
// 2026-10-07, "Node state"). One shared rule for web, mobile and the server. Pure, no I/O, no clock:
// every time is a number of milliseconds (or a Date) the caller passes in.
//
//   open    you can start it.
//   filled  you watched the film and completed the hand steps.
//   sealed  the fresh hand was right first try with no hints, AND a delayed recall of the lesson's
//           rule was right one day or more after that fresh hand. Watching and helped answers never
//           seal. Sealed implies filled.
// Old proved runs from the 20-lesson path count as filled on their mapped node, never sealed: only
// new evidence (a clean fresh hand plus a delayed recall) can seal a node.
// A node is never "locked": prerequisites steer the path, they do not bar a lesson (see
// prereqsFilled for the "ahead" hint the apps draw).
//
// THE PROGRESS OBJECT, shared with recall.mjs and filmV2.mjs:
//   {
//     nodes: { [nodeId]: {
//       watched:   true when the film passed the watch rule (filmV2 filmWatched),
//       handsDone: true when the guided, practice and fresh hands are complete,
//       fresh:     { firstTry, hints, assisted, at } for the fresh hand: firstTry true when the first
//                  answer was right; hints the hint count; assisted a helped attempt; at its time,
//       legacyProved: true when an old 20-lesson run proved the mapped lesson,
//     } },
//     recall:  { [nodeId]: { step, due, log: [{ at, correct }] } }   (recall.mjs),
//     openers: { [trackId]: true | time }                             (filmV2 openerDue),
//   }
// Missing pieces read as "not yet": an empty object is a brand-new learner.
//
// HOW THIS RELATES TO THE OTHER SEALS.
//   chapterStanding (curriculum.mjs) is unchanged. It counts a chapter's PROVED lessons from a Set of
//   definition ids; provedLessonIds(progress) below builds that Set from node states (filled or
//   sealed counts as proved), so a track's chapter hand opens once every node in it is filled, and a
//   chapter is still SEALED by its chapter hand (or, with no hand, by every lesson proved).
//   deriveMasteredSet (the apps' mastery.js over the 28 CONCEPT_NODES) is a different seal: it is
//   concept mastery from table play (skill rings, beaten archetypes), recomputed live and able to
//   decay. A node seal here is lesson evidence (one clean fresh hand plus one delayed recall) and
//   does not decay. The two meet through `legacy.concept`: conceptOfNode / nodesOfConcept map a
//   node to the concept whose medallion the apps draw. Neither seal sets the other; an app that
//   shows both shows them as two marks.
import { NODES, TRACKS } from "./academyTree.mjs";
import { lessonOfNode, nodeOfLesson } from "./curriculum.mjs";

export const NODE_STATES = Object.freeze(["open", "filled", "sealed"]);
export const DAY_MS = 24 * 60 * 60 * 1000;
// A delayed recall must come at least this long after the fresh hand to count toward a seal.
export const SEAL_DELAY_MS = DAY_MS;

const timeOf = (t) => (t instanceof Date ? t.getTime() : Number(t));
const recordOf = (progress, nodeId) => progress?.nodes?.[nodeId] || null;

// The fresh hand was right on the first try with no hint and no help.
export function cleanFresh(fresh) {
  return !!fresh && fresh.firstTry === true && !(Number(fresh.hints) > 0) && fresh.assisted !== true && Number.isFinite(timeOf(fresh.at));
}

// The first correct recall of the node at least SEAL_DELAY_MS after its clean fresh hand, or null.
export function sealingRecall(progress, nodeId) {
  const fresh = recordOf(progress, nodeId)?.fresh;
  if (!cleanFresh(fresh)) return null;
  const after = timeOf(fresh.at) + SEAL_DELAY_MS;
  const log = progress?.recall?.[nodeId]?.log || [];
  return log.find((entry) => entry && entry.correct === true && timeOf(entry.at) >= after) || null;
}

// open | filled | sealed. `options.legacyProved`: a Set (or array) of old definition ids or node ids
// proved on the 20-lesson path, for callers that keep those outside the progress object.
export function nodeState(nodeId, progress = {}, options = {}) {
  const record = recordOf(progress, nodeId);
  const legacy = record?.legacyProved === true || legacyHas(options.legacyProved, nodeId);
  const done = record?.watched === true && record?.handsDone === true;
  if (done && sealingRecall(progress, nodeId)) return "sealed";
  if (done || legacy) return "filled";
  return "open";
}

function legacyHas(list, nodeId) {
  if (!list) return false;
  const set = list instanceof Set ? list : new Set(list);
  return set.has(nodeId) || set.has(lessonOfNode(nodeId));
}

// Every node's state, keyed by node id, in tree order.
export function nodeStates(progress = {}, options = {}) {
  const out = {};
  for (const node of NODES) out[node.id] = nodeState(node.id, progress, options);
  return out;
}

// The definition ids of every filled or sealed node: the `provedIds` chapterStanding takes.
export function provedLessonIds(progress = {}, options = {}) {
  const out = new Set();
  for (const node of NODES) if (nodeState(node.id, progress, options) !== "open") out.add(lessonOfNode(node.id));
  return out;
}

// A track at a glance: { total, filled, sealed, next } where `filled` counts filled-or-sealed nodes,
// `sealed` the sealed ones, and `next` is the first open node in tree order (null when none is).
export function trackStanding(trackId, progress = {}, options = {}) {
  const nodes = NODES.filter((node) => node.track === trackId);
  let filled = 0;
  let sealed = 0;
  let next = null;
  for (const node of nodes) {
    const state = nodeState(node.id, progress, options);
    if (state !== "open") filled += 1;
    if (state === "sealed") sealed += 1;
    if (state === "open" && !next) next = node.id;
  }
  return { track: trackId, total: nodes.length, filled, sealed, next };
}

// Whether every prerequisite of a node is filled or sealed (the apps draw "ahead" when not; the
// lesson stays open to start).
export function prereqsFilled(nodeId, progress = {}, options = {}) {
  const node = NODES.find((n) => n.id === nodeId);
  return !!node && node.prereqs.every((id) => nodeState(id, progress, options) !== "open");
}

// The progress an old 20-lesson record carries over: each proved old definition id becomes
// `legacyProved` on its mapped node (filled, never sealed). Watched-only records carry nothing: a
// node fills only with its hand steps done. Merges into `progress` without mutating it.
export function progressFromLegacy(provedDefinitionIds = [], progress = {}) {
  const nodes = { ...(progress.nodes || {}) };
  for (const id of provedDefinitionIds instanceof Set ? provedDefinitionIds : new Set(provedDefinitionIds)) {
    const node = nodeOfLesson(id);
    if (!node) continue;
    nodes[node.id] = { ...(nodes[node.id] || {}), legacyProved: true };
  }
  return { ...progress, nodes };
}

// The node <-> concept bridge to the apps' deriveMasteredSet (CONCEPT_NODES ids, `legacy.concept`).
export function conceptOfNode(nodeId) {
  return NODES.find((n) => n.id === nodeId)?.legacy?.concept || null;
}
export function nodesOfConcept(conceptId) {
  return NODES.filter((n) => n.legacy?.concept === conceptId).map((n) => n.id);
}

// The tracks in order, for callers that iterate standings.
export const TRACK_IDS = Object.freeze(TRACKS.map((t) => t.id));
