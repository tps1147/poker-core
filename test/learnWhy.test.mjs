// The why stage type (ACADEMY-LEARNING-LOOP 2026-10-07, "Why"), as defs-b defined it (082285d):
// { kind: "why", label, prompt, options: [{ id, text, fix }] } right after the film, the key apart.
//   node test/learnWhy.test.mjs
import assert from "node:assert/strict";
import * as learn from "../src/learn/index.mjs";

const { filmFirstLesson, lessonHands, railSegments, tablePlan, whyStages, whyResult, WHY_KIND, chipScore } = learn;
let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };

// A copy of pot odds with a why step after the film (index 2).
const base = filmFirstLesson("pot-odds-workspace-v2");
const plain = base.stages.filter((stage) => stage.kind !== WHY_KIND);
const why = { kind: "why", label: "Why", prompt: "Why call?",
  options: [{ id: "a", text: "Price", fix: "Right." }, { id: "b", text: "Misconception", fix: "Not that." }, { id: "c", text: "Near miss", fix: "Close, but no." }] };
const def = { ...base, stages: [...plain.slice(0, 2), why, ...plain.slice(2)] };

check("whyStages finds the step", () => {
  assert.equal(WHY_KIND, "why");
  assert.deepEqual(whyStages(def).map((stage) => stage.index), [2]);
});

check("hands and the rail are unchanged by the why step", () => {
  assert.deepEqual(lessonHands(def).map((hand) => hand.role), ["guided", "practice", "fresh"]);
  assert.deepEqual(railSegments(def, null).map((segment) => segment.key), ["film", "pot2-guided", "pot2-practice", "pot2-fresh", "recap"]);
});

check("tablePlan holds the guided hand behind the why, as behind the film", () => {
  assert.deepEqual(tablePlan(def, 2, { furthest: 2 }), { handId: "pot2-guided", mode: "held" });
  assert.deepEqual(tablePlan(def, 3, { furthest: 3 }), { handId: "pot2-guided", mode: "live" });
});

check("whyResult: graded by the server key, ungraded without one", () => {
  assert.deepEqual(whyResult(why, "a", { option: "a" }), { option: "a", correct: true, fix: "Right." });
  assert.deepEqual(whyResult(why, "b", { option: "a" }), { option: "b", correct: false, fix: "Not that." });
  assert.deepEqual(whyResult(why, "c"), { option: "c", correct: null, fix: "Close, but no." });
  assert.equal(whyResult(why, "z", { option: "a" }), null);
});

check("the why never moves the chip score", () => {
  const history = [{ spotId: "pot2-fresh", correct: true }];
  assert.deepEqual(chipScore(def, { history }), chipScore(base, { history }));
});

console.log(`why checks passed (${checks})`);
