// Answer keys for outs-workspace-v1 (tree node m-outs), version 2: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/outs-workspace-v1.v2.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "outs-workspace-v1",
  contentVersion: 2,
  node: "m-outs",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "outs2-guided-call" },
    { kind: "why", id: "outs2-why" },
    { kind: "decision", spotId: "outs2-practice-count" },
    { kind: "decision", spotId: "outs2-practice-call" },
    { kind: "decision", spotId: "outs2-fresh-count" },
    { kind: "decision", spotId: "outs2-fresh-call" },
    { kind: "takeaway" },
  ],
  why: {
    "outs2-why": {
      after: "outs2-guided-call",
      key: "c",
      misconception: "a",
      corrections: {
        a: "A card that also gives him a better hand is not an out. Count only the cards that make you the winner.",
        b: "One card is to come, so it is ×2: roughly 18%. That still beats the 10% price.",
      },
    },
  },
  pause: { film: "m-outs", at: 64.92, key: { value: 8, tolerance: 0 } },
};
