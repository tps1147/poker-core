// Answer-key ADDITIONS for m-spr, whose definition is the shipped spr-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/spr-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (m-spr, 70.54 s), spot spr1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     spr1-guided-ratio 2 -> 3, spr1-guided-bets 3 -> 4, spr1-practice-ratio 4 -> 5
//     spr1-practice-bets 5 -> 6, spr1-fresh-ratio 6 -> 7, spr1-fresh-bets 7 -> 8
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "spr-workspace-v1", node: "m-spr", contentVersion: 2, fromVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 70.54, filmId: "m-spr", spotId: "spr1-turn", decision: "count", range: [0, 20], key: { value: 2, tolerance: 0 } },
  why: { stage: 2, spotId: "spr1-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
};
