// Answer-key ADDITIONS for p-blind-defense, whose definition is the shipped blind-defense-workspace-v1 (content version 1),
// for the server worker to merge into pokerServer/src/data/lessonRuns/blind-defense-workspace-v1.v1.js. Not shipped
// (package.json "files" is src only). What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (p-blind-defense, 73.99 s), spot bd1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     bd1-guided 2 -> 3, bd1-practice-price 3 -> 4, bd1-practice-call 4 -> 5
//     bd1-fresh-price 5 -> 6, bd1-fresh-call 6 -> 7
//     the existing keys are unchanged. The registry validator must also admit the why stage.
// Recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "blind-defense-workspace-v1", node: "p-blind-defense", contentVersion: 2, fromVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 73.99, filmId: "p-blind-defense", spotId: "bd1-turn", decision: "count", range: [0, 100], key: { value: 30, tolerance: 0 } },
  why: { stage: 2, spotId: "bd1-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "a" },
};
