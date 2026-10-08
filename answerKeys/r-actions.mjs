// Answer-key ADDITIONS for r-actions, whose definition is the shipped betting-actions-workspace-v1 (content version 2),
// for the server worker to merge into pokerServer/src/data/lessonRuns/betting-actions-workspace-v1.v2.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     act2-guided 2 -> 3, act2-practice 3 -> 4, act2-fresh 4 -> 5
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "betting-actions-workspace-v1", node: "r-actions", contentVersion: 3, fromVersion: 2, additions: true,
  stageShift: { from: 2, by: 1 },
  why: { stage: 2, spotId: "act2-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
};
