// Answer-key ADDITIONS for p-position-value, whose definition is the shipped positions-workspace-v1 (content version 2),
// for the server worker to merge into pokerServer/src/data/lessonRuns/positions-workspace-v1.v2.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (p-position-value, 76.55 s), spot pos2-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     pos2-guided 2 -> 3, pos2-practice 3 -> 4, pos2-fresh 4 -> 5
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "positions-workspace-v1", node: "p-position-value", contentVersion: 3, fromVersion: 2, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 76.55, filmId: "p-position-value", spotId: "pos2-turn", decision: "estimate", bands: ["co", "bb"], key: { band: "co" } },
  why: { stage: 2, spotId: "pos2-why", options: ["a", "b", "c"], key: { option: "a" }, misconception: "c" },
};
