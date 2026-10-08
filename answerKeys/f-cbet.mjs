// Answer-key ADDITIONS for f-cbet, whose definition is the shipped cbetting-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/cbetting-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (f-cbet, 65.51 s), spot cb1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     cb1-guided 2 -> 3, cb1-practice-read 3 -> 4, cb1-practice-cbet 4 -> 5
//     cb1-fresh-read 5 -> 6, cb1-fresh-cbet 6 -> 7
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "cbetting-workspace-v1", node: "f-cbet", contentVersion: 2, fromVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 65.51, filmId: "f-cbet", spotId: "cb1-turn", decision: "action", choices: ["check", "bet"], key: { action: "bet" } },
  why: { stage: 2, spotId: "cb1-why", options: ["a", "b", "c"], key: { option: "a" }, misconception: "b" },
};
