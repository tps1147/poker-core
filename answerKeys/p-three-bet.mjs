// Answer-key ADDITIONS for p-three-bet, whose definition is the shipped three-betting-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/three-betting-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (p-three-bet, 73.1 s), spot tb1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     tb1-guided 2 -> 3, tb1-practice-job 3 -> 4, tb1-practice-action 4 -> 5
//     tb1-fresh-job 5 -> 6, tb1-fresh-action 6 -> 7
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "three-betting-workspace-v1", node: "p-three-bet", contentVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 73.1, filmId: "p-three-bet", spotId: "tb1-turn", decision: "action", choices: ["fold", "call", "raise"], key: { action: "raise" } },
  why: { stage: 2, spotId: "tb1-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
};
