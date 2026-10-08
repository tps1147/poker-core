// Answer-key ADDITIONS for m-ev, whose definition is the shipped ev-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/ev-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (m-ev, 60.08 s), spot ev1-turn;
//   - the current film's own in-film guess moved, unchanged, from pause to legacyPause;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     ev1-guided 2 -> 3, ev1-practice-ev 3 -> 4, ev1-practice-call 4 -> 5
//     ev1-fresh-ev 5 -> 6, ev1-fresh-call 6 -> 7
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "ev-workspace-v1", node: "m-ev", contentVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 60.08, filmId: "m-ev", spotId: "ev1-turn", decision: "action", choices: ["fold", "call"], key: { action: "call" } },
  why: { stage: 2, spotId: "ev1-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
};
