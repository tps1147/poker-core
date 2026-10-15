// NO LESSON CAN STRAND A LEARNER (Tyler, 2026-10-08: a six-max preflop hand "just doesn't let you
// act"). Walks every hand stage of all 59 film-first definitions through the clients' driver
// (lessonWalk.mjs), on every branch an earlier action opens, and checks at each decision point:
//   - the driver stops at this stage's decision, with the hero to act (in turn, for an action)
//   - at least one option, and every action the spot offers is legal on that table, at the size
//     the key shows
//   - every option moves the hand on to its next decision or its end
// and that the why step and the film's "Your turn" offer options a client can render.
// The web and app tests run the same walk through their own dock models; the server's runs every
// option through its reducer and keys.
//   node test/lessonWalk.test.mjs
import assert from "node:assert/strict";
import * as learn from "../src/learn/index.mjs";

const { FILM_FIRST_LESSONS, ACADEMY_V2_EARLY_LESSONS, ACADEMY_V2_LATER_LESSONS, walkProblems, decisionPoints, answerOptions, legalActions } = learn;
const ALL = [...FILM_FIRST_LESSONS, ...ACADEMY_V2_EARLY_LESSONS, ...ACADEMY_V2_LATER_LESSONS];
let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };

check("all 59 definitions are walked", () => {
  assert.equal(ALL.length, 59);
  assert.equal(new Set(ALL.map((d) => d.id)).size, 59);
});

check("no stage of any lesson strands the learner", () => {
  const problems = ALL.flatMap((definition) => walkProblems(definition));
  assert.deepEqual(problems, []);
});

check("every decision point of every branch is reached with the hero to act", () => {
  let points = 0;
  for (const definition of ALL) {
    for (const point of decisionPoints(definition)) {
      points += 1;
      assert.equal(point.blocked?.kind, "decide", `${definition.id} ${point.stage.spotId}`);
      assert.equal(point.state.currentTurnId, "hero", `${definition.id} ${point.stage.spotId}`);
      assert.ok(answerOptions(point.spot).length > 0, `${definition.id} ${point.stage.spotId} has options`);
      if (point.spot.decision === "action") assert.ok(legalActions(point.state).length > 0, `${definition.id} ${point.stage.spotId} legal`);
    }
  }
  assert.ok(points >= 177, `walked ${points} decision points`);
});

// The walk finds what it is meant to find: broken copies of a real lesson.
const rfi = FILM_FIRST_LESSONS.find((d) => d.id === "rfi-position-workspace-v1");
const clone = (d) => JSON.parse(JSON.stringify(d));

check("a decision the hand never reaches is reported", () => {
  const broken = clone(rfi);
  broken.hands["rfi1-guided"].script = broken.hands["rfi1-guided"].script.filter((step) => step.do !== "decide");
  assert.ok(walkProblems(broken).some((p) => /rfi1-guided.*never reaches this decision/.test(p)));
});

check("an action out of turn and an illegal check are reported", () => {
  const broken = clone(rfi);
  // The cutoff no longer folds: it is the cutoff's turn when the hero is asked, and the hero owes 10.
  broken.hands["rfi1-guided"].script = broken.hands["rfi1-guided"].script.map((step) => (step.do === "act" && step.seat === "CO" ? { do: "pause", ms: 100 } : step));
  broken.spots["rfi1-guided"].choices = ["check", "raise"];
  const problems = walkProblems(broken);
  assert.ok(problems.some((p) => /rfi1-guided.*was to act; the decision jumps the queue/.test(p)), problems.join("\n"));
  assert.ok(problems.some((p) => /rfi1-guided.*"check" is not legal here/.test(p)), problems.join("\n"));
});

check("a raise key that does not show the size it plays is reported", () => {
  const broken = clone(rfi);
  delete broken.spots["rfi1-guided"].sizes;
  assert.ok(walkProblems(broken).some((p) => /rfi1-guided.*"raise" plays as 25 but the spot shows no size/.test(p)));
});

check("a hand that waits on an answer no stage asks for is reported", () => {
  const broken = clone(rfi);
  // The practice hand's second decision waits on a spot that no stage answers.
  broken.hands["rfi1-practice"].script.push({ do: "act", seat: "hero", action: "answer", spotId: "nobody", when: "answered" });
  const problems = walkProblems(broken);
  assert.ok(problems.some((p) => /rfi1-practice-open.*waits on answer nobody/.test(p)), problems.join("\n"));
});

check("a why step and a Your turn with nothing to pick are reported", () => {
  const broken = clone(rfi);
  broken.stages[2].options = broken.stages[2].options.slice(0, 1);
  broken.stages[1].pause.spot.choices = [];
  const problems = walkProblems(broken);
  assert.ok(problems.some((p) => /the why step offers 1 option/.test(p)));
  assert.ok(problems.some((p) => /"Your turn" spot offers no option/.test(p)));
});

check("answerOptions covers every kind a client renders", () => {
  assert.deepEqual(answerOptions({ decision: "action", choices: ["fold", "call"] }).map((o) => o.fields), [{ action: "fold" }, { action: "call" }]);
  assert.deepEqual(answerOptions({ decision: "estimate", bands: [{ id: "a" }, "b"] }).map((o) => o.fields), [{ band: "a" }, { band: "b" }]);
  assert.equal(answerOptions({ decision: "count", range: [0, 20] }).length, 21);
  assert.equal(answerOptions({ decision: "best-five", hero: ["As", "Ks"], board: ["Qs", "Js", "Ts", "2c", "3d"] }).length, 21);
});

console.log(`lesson walk checks passed (${checks})`);
