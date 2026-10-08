// Answer-key ADDITIONS for x-fold-equity, whose definition is the shipped semibluff-workspace-v1
// (content version 1), for the server worker to merge into pokerServer/src/data/lessonRuns/
// semibluff-workspace-v1.v1.js. Not shipped (package.json "files" is src only).
// What changed in the definition (academy v2, 2026-10-08):
//   - the film stage gained the v2 film's "Your turn" pause (x-fold-equity, 59.9 s), spot sb1-turn;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     sb1-guided-price 2 -> 3, sb1-guided-bet 3 -> 4, sb1-practice-price 4 -> 5,
//     sb1-practice-bet 5 -> 6, sb1-fresh-price 6 -> 7, sb1-fresh-bet 7 -> 8; the existing keys are
//     unchanged. The registry validator must also admit the why stage between film and decisions.
// Recomputed in test/academyLessonsB.test.mjs: pot 160, bet 100, folds 25%, hit 25% (given):
// break-even 100 ÷ 260 = 38.5%; called 0.25 × 360 − 100 = −10; bet 0.25 × 160 + 0.75 × (−10) = 32.5;
// check 0.25 × 160 = 40 -> check.
export default {
  lessonId: "semibluff-workspace-v1", node: "x-fold-equity", contentVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 59.9, filmId: "x-fold-equity", spotId: "sb1-turn", decision: "action", choices: ["check", "bet"], key: { action: "check" } },
  why: { stage: 2, spotId: "sb1-why", options: ["both-branches", "folds-only", "called-loses"], key: { option: "both-branches" } },
};
