// Answer keys for rfi-position-workspace-v1 (tree node p-open-raise), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/rfi-position-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "rfi-position-workspace-v1",
  contentVersion: 1,
  node: "p-open-raise",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "rfi1-guided" },
    { kind: "why", id: "rfi1-why" },
    { kind: "decision", spotId: "rfi1-practice-behind" },
    { kind: "decision", spotId: "rfi1-practice-open" },
    { kind: "decision", spotId: "rfi1-fresh-behind" },
    { kind: "decision", spotId: "rfi1-fresh-open" },
    { kind: "takeaway" },
  ],
  why: {
    "rfi1-why": {
      after: "rfi1-guided",
      key: "c",
      misconception: "b",
      corrections: {
        a: "Seat first: under the gun, five players behind tighten the range.",
        b: "A limp lets the blinds in cheaply and wins nothing now. Come in with a raise.",
      },
    },
  },
  pause: { film: "p-open-raise", at: 79.05, key: { action: "fold" } },
};
