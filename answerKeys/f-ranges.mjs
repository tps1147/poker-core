// Answer-key ADDITIONS for f-ranges, whose definition is the shipped ranges-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/ranges-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (f-ranges, 81.05 s), spot rng1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     rng1-guided 2 -> 3, rng1-practice-preflop 3 -> 4, rng1-practice-flop 4 -> 5
//     rng1-fresh-preflop 5 -> 6, rng1-fresh-flop 6 -> 7
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "ranges-workspace-v1", node: "f-ranges", contentVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 81.05, filmId: "f-ranges", spotId: "rng1-turn", decision: "estimate", bands: ["about-25", "about-64", "about-90"], key: { band: "about-64" } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "a" }, misconception: "c" },
};
