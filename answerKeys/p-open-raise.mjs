// Answer-key ADDITIONS for p-open-raise, whose definition is the shipped rfi-position-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/rfi-position-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (p-open-raise, 79.05 s), spot rfi1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     rfi1-guided 2 -> 3, rfi1-practice-behind 3 -> 4, rfi1-practice-open 4 -> 5
//     rfi1-fresh-behind 5 -> 6, rfi1-fresh-open 6 -> 7
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "rfi-position-workspace-v1", node: "p-open-raise", contentVersion: 2, fromVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 79.05, filmId: "p-open-raise", spotId: "rfi1-turn", decision: "action", choices: ["fold", "raise"], key: { action: "fold" } },
  why: { stage: 2, spotId: "rfi1-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "b" },
};
