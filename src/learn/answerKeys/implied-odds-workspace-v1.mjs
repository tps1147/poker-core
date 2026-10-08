// Answer keys for implied-odds-workspace-v1 (tree node m-implied-odds), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/implied-odds-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "implied-odds-workspace-v1",
  contentVersion: 1,
  node: "m-implied-odds",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "imp1-guided" },
    { kind: "why", id: "imp1-why" },
    { kind: "decision", spotId: "imp1-practice-most" },
    { kind: "decision", spotId: "imp1-practice-call" },
    { kind: "decision", spotId: "imp1-fresh-price" },
    { kind: "decision", spotId: "imp1-fresh-call" },
    { kind: "takeaway" },
  ],
  why: {
    "imp1-why": {
      after: "imp1-guided",
      key: "b",
      misconception: "c",
      corrections: {
        a: "18% is below 30%. The call needs the river chips to pay.",
        c: "Only chips you can really win count. With nothing behind, the same draw folds.",
      },
    },
  },
  pause: { film: "m-implied-odds", at: 71.25, key: { action: "fold" } },
};
