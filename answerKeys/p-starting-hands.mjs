// Answer-key ADDITIONS for p-starting-hands, whose definition is the shipped starting-hands-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/starting-hands-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (p-starting-hands, 77.18 s), spot sh1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     sh1-guided 2 -> 3, sh1-practice-read 3 -> 4, sh1-practice-act 4 -> 5
//     sh1-fresh-read 5 -> 6, sh1-fresh-act 6 -> 7
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "starting-hands-workspace-v1", node: "p-starting-hands", contentVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 77.18, filmId: "p-starting-hands", spotId: "sh1-turn", decision: "action", choices: ["fold", "raise"], key: { action: "raise" } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "a" }, misconception: "c" },
};
