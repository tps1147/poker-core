// Answer-key ADDITIONS for m-rule-2-4, whose definition is the shipped rule-2-4-workspace-v1 (content version 2),
// for the server worker to merge into pokerServer/src/data/lessonRuns/rule-2-4-workspace-v1.v2.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (m-rule-2-4, 62.81 s), spot rule2-turn;
//   - the current film's own in-film guess moved, unchanged, from pause to legacyPause;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     rule2-guided-estimate 2 -> 3, rule2-guided-call 3 -> 4, rule2-practice-count 4 -> 5
//     rule2-practice-estimate 5 -> 6, rule2-fresh-count 6 -> 7, rule2-fresh-estimate 7 -> 8
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "rule-2-4-workspace-v1", node: "m-rule-2-4", contentVersion: 2, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 62.81, filmId: "m-rule-2-4", spotId: "rule2-turn", decision: "estimate", bands: ["x2", "x4"], key: { band: "x4" } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "a" }, misconception: "b" },
};
