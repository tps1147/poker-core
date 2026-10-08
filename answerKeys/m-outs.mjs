// Answer-key ADDITIONS for m-outs, whose definition is the shipped outs-workspace-v1 (content version 2),
// for the server worker to merge into pokerServer/src/data/lessonRuns/outs-workspace-v1.v2.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (m-outs, 64.92 s), spot outs2-turn;
//   - the current film's own in-film guess moved, unchanged, from pause to legacyPause;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     outs2-guided-call 2 -> 3, outs2-practice-count 3 -> 4, outs2-practice-call 4 -> 5
//     outs2-fresh-count 5 -> 6, outs2-fresh-call 6 -> 7
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "outs-workspace-v1", node: "m-outs", contentVersion: 2, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 64.92, filmId: "m-outs", spotId: "outs2-turn", decision: "count", range: [0, 47], key: { value: 8, tolerance: 0 } },
  why: { stage: 2, spotId: "outs2-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
};
