// Answer-key ADDITIONS for r-hand-rankings, whose definition is the shipped hand-rankings-workspace-v1 (content version 2),
// for the server worker to merge into pokerServer/src/data/lessonRuns/hand-rankings-workspace-v1.v2.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     hr2-guided 2 -> 3, hr2-practice 3 -> 4, hr2-fresh 4 -> 5
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "hand-rankings-workspace-v1", node: "r-hand-rankings", contentVersion: 3, fromVersion: 2, additions: true,
  stageShift: { from: 2, by: 1 },
  why: { stage: 2, spotId: "hr2-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
};
