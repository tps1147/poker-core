// Answer-key ADDITIONS for m-pot-odds, whose definition is the shipped pot-odds-workspace-v2 (content version 2),
// for the server worker to merge into pokerServer/src/data/lessonRuns/pot-odds-workspace-v2.v2.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (m-pot-odds, 65.56 s), spot pot2-turn;
//   - the current film's own in-film guess moved, unchanged, from pause to legacyPause;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     pot2-guided 2 -> 3, pot2-practice 3 -> 4, pot2-fresh 4 -> 5
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "pot-odds-workspace-v2", node: "m-pot-odds", contentVersion: 2, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 65.56, filmId: "m-pot-odds", spotId: "pot2-turn", decision: "action", choices: ["fold", "call"], key: { action: "fold" } },
  why: { stage: 2, spotId: "pot2-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
};
