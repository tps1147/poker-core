// Answer keys for three-betting-workspace-v1 (tree node p-three-bet), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/three-betting-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "three-betting-workspace-v1",
  contentVersion: 1,
  node: "p-three-bet",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "tb1-guided" },
    { kind: "why", id: "tb1-why" },
    { kind: "decision", spotId: "tb1-practice-job" },
    { kind: "decision", spotId: "tb1-practice-action" },
    { kind: "decision", spotId: "tb1-fresh-job" },
    { kind: "decision", spotId: "tb1-fresh-action" },
    { kind: "takeaway" },
  ],
  why: {
    "tb1-why": {
      after: "tb1-guided",
      key: "c",
      misconception: "a",
      corrections: {
        a: "The value 3-bets are the top hands. A few blocker hands like ace-five suited join them as pressure.",
        b: "Ace-five is behind most hands that continue. It 3-bets to make him fold, not to get called by worse.",
      },
    },
  },
  pause: { film: "p-three-bet", at: 73.1, key: { action: "raise" } },
};
