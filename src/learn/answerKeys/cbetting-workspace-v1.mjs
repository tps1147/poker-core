// Answer keys for cbetting-workspace-v1 (tree node f-cbet), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/cbetting-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "cbetting-workspace-v1",
  contentVersion: 1,
  node: "f-cbet",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "cb1-guided" },
    { kind: "why", id: "cb1-why" },
    { kind: "decision", spotId: "cb1-practice-read" },
    { kind: "decision", spotId: "cb1-practice-cbet" },
    { kind: "decision", spotId: "cb1-fresh-read" },
    { kind: "decision", spotId: "cb1-fresh-cbet" },
    { kind: "takeaway" },
  ],
  why: {
    "cb1-why": {
      after: "cb1-guided",
      key: "a",
      misconception: "b",
      corrections: {
        b: "Raising first is not the reason. On nine-seven-six with two diamonds, the same raise checks.",
        c: "Ace-queen has no pair yet. The range advantage earns the bet, not the hand.",
      },
    },
  },
  pause: { film: "f-cbet", at: 65.51, key: { action: "bet" } },
};
