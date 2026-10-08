// Node state: open / filled / sealed, the legacy carry-over, and the bridges to chapterStanding and
// the apps' concept seal.
//   node test/nodeState.test.mjs
import assert from "node:assert/strict";
import {
  nodeState, nodeStates, provedLessonIds, trackStanding, prereqsFilled, progressFromLegacy, cleanFresh, sealingRecall,
  conceptOfNode, nodesOfConcept, DAY_MS, NODE_STATES,
} from "../src/learn/nodeState.mjs";
import { chapterStanding, chapterById, learnPath, COURSE_ORDER, NODES, filmFirstLesson } from "../src/learn/index.mjs";

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };
const T0 = Date.UTC(2026, 9, 7, 12);
const done = (fresh = null) => ({ watched: true, handsDone: true, fresh });
const clean = (at = T0) => ({ firstTry: true, hints: 0, assisted: false, at });

check("the three states, and a brand-new learner is open everywhere", () => {
  assert.deepEqual(NODE_STATES, ["open", "filled", "sealed"]);
  assert.equal(nodeState("m-outs"), "open");
  assert.equal(nodeState("m-outs", {}), "open");
  const all = nodeStates({});
  assert.equal(Object.keys(all).length, 59);
  assert.ok(Object.values(all).every((s) => s === "open"));
});

check("filled needs both the film and the hand steps", () => {
  assert.equal(nodeState("m-outs", { nodes: { "m-outs": { watched: true } } }), "open", "watching alone never fills");
  assert.equal(nodeState("m-outs", { nodes: { "m-outs": { handsDone: true } } }), "open");
  assert.equal(nodeState("m-outs", { nodes: { "m-outs": done() } }), "filled");
});

check("sealed: a clean fresh hand and a correct recall a day or more after it", () => {
  const recallAt = (at, correct = true) => ({ "m-outs": { step: 1, due: at + 3 * DAY_MS, log: [{ at, correct }] } });
  const p = (fresh, recall) => ({ nodes: { "m-outs": done(fresh) }, recall });
  assert.equal(nodeState("m-outs", p(clean(), recallAt(T0 + DAY_MS))), "sealed", "exactly one day later counts");
  assert.equal(nodeState("m-outs", p(clean(), recallAt(T0 + DAY_MS - 1))), "filled", "under a day is too soon");
  assert.equal(nodeState("m-outs", p(clean(), recallAt(T0 + 2 * DAY_MS, false))), "filled", "a missed recall does not seal");
  assert.equal(nodeState("m-outs", p(clean(), {})), "filled", "no recall yet");
  assert.equal(nodeState("m-outs", p({ ...clean(), hints: 1 }, recallAt(T0 + 2 * DAY_MS))), "filled", "a hint never seals");
  assert.equal(nodeState("m-outs", p({ ...clean(), firstTry: false }, recallAt(T0 + 2 * DAY_MS))), "filled", "a second try never seals");
  assert.equal(nodeState("m-outs", p({ ...clean(), assisted: true }, recallAt(T0 + 2 * DAY_MS))), "filled", "a helped attempt never seals");
  // A later miss does not unseal: the evidence was earned.
  const later = { "m-outs": { step: 0, due: 0, log: [{ at: T0 + 2 * DAY_MS, correct: true }, { at: T0 + 9 * DAY_MS, correct: false }] } };
  assert.equal(nodeState("m-outs", p(clean(), later)), "sealed");
  // Sealing evidence without the film and hands still is not a seal: sealed implies filled.
  assert.equal(nodeState("m-outs", { nodes: { "m-outs": { fresh: clean() } }, recall: recallAt(T0 + 2 * DAY_MS) }), "open");
  // Dates work as times.
  assert.equal(nodeState("m-outs", p(clean(new Date(T0)), { "m-outs": { log: [{ at: new Date(T0 + DAY_MS), correct: true }] } })), "sealed");
  assert.equal(cleanFresh(null), false);
  assert.equal(sealingRecall({}, "m-outs"), null);
});

check("old proved runs count as filled, never sealed", () => {
  const p = progressFromLegacy(["pot-odds-workspace-v2", "lesson-outs-001", "nope"]);
  assert.equal(nodeState("m-pot-odds", p), "filled");
  assert.equal(nodeState("m-outs", p), "filled", "a catalog id maps through its definition");
  assert.equal(Object.keys(p.nodes).length, 2, "unknown ids carry nothing");
  // Even with a correct recall days later, a legacy proof alone does not seal.
  const withRecall = { ...p, recall: { "m-pot-odds": { log: [{ at: T0 + 5 * DAY_MS, correct: true }] } } };
  assert.equal(nodeState("m-pot-odds", withRecall), "filled");
  // Kept outside the progress object, by definition id or node id.
  assert.equal(nodeState("m-ev", {}, { legacyProved: new Set(["ev-workspace-v1"]) }), "filled");
  assert.equal(nodeState("m-ev", {}, { legacyProved: ["m-ev"] }), "filled");
  // New evidence still seals a node that was legacy-proved.
  const fresh = { nodes: { "m-pot-odds": { legacyProved: true, ...done(clean()) } }, recall: { "m-pot-odds": { log: [{ at: T0 + DAY_MS, correct: true }] } } };
  assert.equal(nodeState("m-pot-odds", fresh), "sealed");
  // progressFromLegacy merges and does not mutate.
  const base = { nodes: { "m-ev": done() }, openers: { math: true } };
  const merged = progressFromLegacy(new Set(["ev-workspace-v1"]), base);
  assert.deepEqual(base.nodes["m-ev"], done(), "input untouched");
  assert.equal(merged.nodes["m-ev"].legacyProved, true);
  assert.equal(merged.nodes["m-ev"].watched, true);
  assert.equal(merged.openers.math, true);
});

check("provedLessonIds feeds chapterStanding unchanged", () => {
  const legacy = progressFromLegacy(COURSE_ORDER);
  const ids = provedLessonIds(legacy);
  assert.deepEqual(new Set(ids), new Set(COURSE_ORDER), "the 20 old proofs, by their definition ids");
  const shipped = learnPath(filmFirstLesson).chapters.find((c) => c.id === "math");
  assert.equal(chapterStanding(shipped, { provedIds: ids }).handOpen, true, "the shipped math lessons open the hand");
  const full = chapterById("math");
  assert.equal(chapterStanding(full, { provedIds: ids }).handOpen, false, "the full track needs its new lessons too");
  const everyNode = { nodes: Object.fromEntries(NODES.filter((n) => n.track === "math").map((n) => [n.id, done()])) };
  assert.equal(chapterStanding(full, { provedIds: provedLessonIds(everyNode) }).handOpen, true);
  assert.ok(provedLessonIds(everyNode).has("m-variance"), "a new node's definition id is its node id");
});

check("trackStanding and prereqsFilled", () => {
  const p = { nodes: { "m-chance-as-share": done(), "m-outs": done(clean()) }, recall: { "m-outs": { log: [{ at: T0 + DAY_MS, correct: true }] } } };
  assert.deepEqual(trackStanding("math", p), { track: "math", total: 9, filled: 2, sealed: 1, next: "m-rule-2-4" });
  assert.deepEqual(trackStanding("formats", {}), { track: "formats", total: 5, filled: 0, sealed: 0, next: "o-multiway" });
  assert.equal(trackStanding("nope", {}).total, 0);
  assert.equal(prereqsFilled("w-what-is-poker", {}), true, "a root has nothing ahead of it");
  assert.equal(prereqsFilled("m-rule-2-4", p), true);
  assert.equal(prereqsFilled("m-equity", p), false);
  assert.equal(prereqsFilled("nope", p), false);
});

check("the concept bridge to deriveMasteredSet", () => {
  assert.equal(conceptOfNode("m-pot-odds"), "t1-pot-odds");
  assert.equal(conceptOfNode("b-the-nuts"), null);
  assert.deepEqual(nodesOfConcept("t1-outs-rule-24"), ["m-outs", "m-rule-2-4"]);
});

console.log(`nodeState checks passed (${checks})`);
