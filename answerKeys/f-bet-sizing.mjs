// Answer-key ADDITIONS for f-bet-sizing, whose definition is the shipped bet-sizing-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/bet-sizing-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (f-bet-sizing, 73.95 s), spot bs1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     bs1-guided 2 -> 3, bs1-practice 3 -> 4, bs1-fresh 4 -> 5
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "bet-sizing-workspace-v1", node: "f-bet-sizing", contentVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 73.95, filmId: "f-bet-sizing", spotId: "bs1-turn", decision: "estimate", bands: ["third", "three-quarters"], key: { band: "third" } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
};
