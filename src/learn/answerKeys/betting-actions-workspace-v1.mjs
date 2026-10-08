// Answer keys for betting-actions-workspace-v1 (tree node r-actions), version 2: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/betting-actions-workspace-v1.v2.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "betting-actions-workspace-v1",
  contentVersion: 2,
  node: "r-actions",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "act2-guided" },
    { kind: "why", id: "act2-why" },
    { kind: "decision", spotId: "act2-practice" },
    { kind: "decision", spotId: "act2-fresh" },
    { kind: "takeaway" },
  ],
  why: {
    "act2-why": {
      after: "act2-guided",
      key: "b",
      misconception: "c",
      corrections: {
        a: "Raising is allowed after a bet. Here it is the wrong job: the hands that continue mostly beat you.",
        c: "A check costs nothing and only works when nothing is owed. A call puts in the 30.",
      },
    },
  },
  pause: null,
};
