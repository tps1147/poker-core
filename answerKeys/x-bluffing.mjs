// Answer-key ADDITIONS for x-bluffing, whose definition is the shipped bluffing-workspace-v1
// (content version 1), for the server worker to merge into pokerServer/src/data/lessonRuns/
// bluffing-workspace-v1.v1.js. Not shipped (package.json "files" is src only).
// What changed in the definition (academy v2, 2026-10-08):
//   - the v2 film (x-bluffing) has no yourTurn anchor, so no pause was added and there is no film key;
//   - a why stage was inserted at index 2, so every decision stage after it moved down by one:
//     bl1-guided 2 -> 3, bl1-practice-target 3 -> 4, bl1-practice-action 4 -> 5,
//     bl1-fresh-story 5 -> 6, bl1-fresh-action 6 -> 7; the existing keys are unchanged. The registry
//     validator must also admit the why stage between film and decisions.
// The why asks about the v2 film's verdict, J♣ 9♣ on Q♠ T♦ 5♣ 4♥ 2♠, pot 150, bet 100: break-even
// 40%, his 102 combos (an illustration) fold 77 (75.5%), 74 of them better than jack high, about
// 88.7 a bluff. Recomputed in test/academyLessonsB.test.mjs and asserted by the plan script.
export default {
  lessonId: "bluffing-workspace-v1", node: "x-bluffing", contentVersion: 1, additions: true,
  stageShift: { from: 2, by: 1 },
  film: null,
  why: { stage: 2, spotId: "bl1-why", options: ["story-target", "called-bad", "missed"], key: { option: "story-target" } },
};
