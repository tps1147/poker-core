// Answer-key ADDITIONS for m-equity, whose definition is the shipped equity-workspace-v1 (content version 2),
// for the server worker to merge into pokerServer/src/data/lessonRuns/equity-workspace-v1.v2.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (m-equity, 68.06 s), spot eq2-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     eq2-guided 2 -> 3, eq2-practice 3 -> 4, eq2-fresh 4 -> 5
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "equity-workspace-v1", node: "m-equity", contentVersion: 2, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 68.06, filmId: "m-equity", spotId: "eq2-turn", decision: "estimate", bands: ["about-0", "about-60", "about-150"], key: { band: "about-60" } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
};
