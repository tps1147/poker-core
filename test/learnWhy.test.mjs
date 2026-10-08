// The why stage type (ACADEMY-LEARNING-LOOP 2026-10-07, "Why"): one tap from three reasons after a
// hand's last decision. The stage ships its reasons only; the key and corrections sit apart.
//   node test/learnWhy.test.mjs
import assert from "node:assert/strict";
import * as learn from "../src/learn/index.mjs";

const { filmFirstLesson, lessonHands, railSegments, segmentForStep, tablePlan, whyStages, whyDecision, whyVerdict, WHY_KIND, chipScore, entryState } = learn;
let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };

// A copy of pot odds (guided, practice, fresh: one decision each) with a why step after the guided hand.
const base = filmFirstLesson("pot-odds-workspace-v2");
const plain = base.stages.filter((stage) => stage.kind !== WHY_KIND);
const at = plain.findIndex((stage) => stage.spotId === "pot2-guided") + 1;
const why = { kind: "why", id: "t-why", label: "Why", after: "pot2-guided", prompt: "Why call?", next: "Try a practice hand",
  reasons: [{ id: "a", text: "Price" }, { id: "b", text: "Misconception" }, { id: "c", text: "Near miss" }] };
const def = { ...base, stages: [...plain.slice(0, at), why, ...plain.slice(at)] };
const KEY = { key: "a", corrections: { b: "Not that.", c: "Close, but no." } };

check("whyStages and whyDecision", () => {
  assert.equal(WHY_KIND, "why");
  assert.deepEqual(whyStages(def).map((stage) => stage.index), [at]);
  assert.equal(whyDecision(def, at).spotId, "pot2-guided");
  assert.equal(whyDecision(def, 1), null, "a film is not a decision");
  assert.deepEqual(whyStages(plain.length ? { stages: plain } : {}), []);
});

check("lessonHands and the rail: the why step rides on the hand it follows", () => {
  assert.deepEqual(lessonHands(def).map((hand) => hand.role), ["guided", "practice", "fresh"]);
  const segments = railSegments(def, null);
  assert.deepEqual(segments.map((segment) => segment.key), ["film", "pot2-guided", "pot2-practice", "pot2-fresh", "recap"]);
  assert.deepEqual(segments[1].stages, [at - 1, at]);
  assert.equal(segmentForStep(segments, at).key, "pot2-guided");
  const answered = railSegments(def, { furthest: at, answers: { "pot2-guided": { action: "call" } } });
  assert.equal(answered[1].complete, true, "the hand fills on its decisions; the why never holds it back");
});

check("tablePlan: the finished hand stays on the table during the why", () => {
  assert.deepEqual(tablePlan(def, at, { furthest: at, answers: { "pot2-guided": { action: "call" } } }), { handId: "pot2-guided", mode: "settled" });
  assert.deepEqual(tablePlan(def, at + 1, { furthest: at + 1 }), { handId: "pot2-practice", mode: "live" });
});

check("whyVerdict: right, wrong with its correction, ungraded without a key", () => {
  assert.deepEqual(whyVerdict(KEY, "a"), { correct: true, correction: null });
  assert.deepEqual(whyVerdict(KEY, "b"), { correct: false, correction: "Not that." });
  assert.deepEqual(whyVerdict(KEY, "c"), { correct: false, correction: "Close, but no." });
  assert.deepEqual(whyVerdict(null, "a"), { correct: null, correction: null });
});

check("the why stage ships no key, and never moves the chip score", () => {
  assert.ok(!("key" in why) && !why.reasons.some((reason) => "correct" in reason));
  const history = [{ spotId: "pot2-fresh", correct: true }];
  assert.deepEqual(chipScore(def, { history }), chipScore(base, { history }));
  assert.equal(entryState(def, { furthest: at, stage: at, watched: { 1: true } }).resumeStep, at);
});

console.log(`why checks passed (${checks})`);
