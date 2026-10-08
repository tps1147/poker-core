// Answer keys for bet-sizing-workspace-v1 (tree node f-bet-sizing), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/bet-sizing-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "bet-sizing-workspace-v1",
  contentVersion: 1,
  node: "f-bet-sizing",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "bs1-guided" },
    { kind: "why", id: "bs1-why" },
    { kind: "decision", spotId: "bs1-practice" },
    { kind: "decision", spotId: "bs1-fresh" },
    { kind: "takeaway" },
  ],
  why: {
    "bs1-why": {
      after: "bs1-guided",
      key: "b",
      misconception: "c",
      corrections: {
        a: "The job here is value from worse hands, not folds.",
        c: "A big bet folds the worse hands you want calling. Size for the job.",
      },
    },
  },
  pause: { film: "f-bet-sizing", at: 73.95, key: { band: "third" } },
};
