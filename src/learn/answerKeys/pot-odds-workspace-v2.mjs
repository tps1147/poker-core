// Answer keys for pot-odds-workspace-v2 (tree node m-pot-odds), version 2: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/pot-odds-workspace-v2.v2.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "pot-odds-workspace-v2",
  contentVersion: 2,
  node: "m-pot-odds",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "pot2-guided" },
    { kind: "why", id: "pot2-why" },
    { kind: "decision", spotId: "pot2-practice" },
    { kind: "decision", spotId: "pot2-fresh" },
    { kind: "takeaway" },
  ],
  why: {
    "pot2-why": {
      after: "pot2-guided",
      key: "c",
      misconception: "a",
      corrections: {
        a: "Your call goes in the pot too. The final pot is 250, so the price is 20%.",
        b: "Count all three amounts: 150, his 50 and your 50. That makes 250.",
      },
    },
  },
  pause: { film: "m-pot-odds", at: 65.56, key: { action: "fold" } },
};
