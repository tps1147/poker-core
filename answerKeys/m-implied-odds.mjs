// Answer-key ADDITIONS for m-implied-odds, whose definition is the shipped implied-odds-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/implied-odds-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (m-implied-odds, 71.25 s), spot imp1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     imp1-guided 2 -> 3, imp1-practice-most 3 -> 4, imp1-practice-call 4 -> 5
//     imp1-fresh-price 5 -> 6, imp1-fresh-call 6 -> 7
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "implied-odds-workspace-v1", node: "m-implied-odds", contentVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 71.25, filmId: "m-implied-odds", spotId: "imp1-turn", decision: "action", choices: ["fold", "call"], key: { action: "fold" } },
  why: { stage: 2, spotId: "imp1-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
};
