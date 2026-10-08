// Answer-key ADDITIONS for f-board-texture, whose definition is the shipped board-texture-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/board-texture-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (f-board-texture, 74.88 s), spot bt1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     bt1-guided-draws 2 -> 3, bt1-guided-texture 3 -> 4, bt1-practice-draws 4 -> 5
//     bt1-practice-texture 5 -> 6, bt1-fresh-draws 6 -> 7, bt1-fresh-texture 7 -> 8
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "board-texture-workspace-v1", node: "f-board-texture", contentVersion: 2, fromVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 74.88, filmId: "f-board-texture", spotId: "bt1-turn", decision: "estimate", bands: ["raiser", "caller"], key: { band: "raiser" } },
  why: { stage: 2, spotId: "bt1-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "b" },
};
