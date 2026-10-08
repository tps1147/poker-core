// Answer keys for blind-defense-workspace-v1 (tree node p-blind-defense), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/blind-defense-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "blind-defense-workspace-v1",
  contentVersion: 1,
  node: "p-blind-defense",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "bd1-guided" },
    { kind: "why", id: "bd1-why" },
    { kind: "decision", spotId: "bd1-practice-price" },
    { kind: "decision", spotId: "bd1-practice-call" },
    { kind: "decision", spotId: "bd1-fresh-price" },
    { kind: "decision", spotId: "bd1-fresh-call" },
    { kind: "takeaway" },
  ],
  why: {
    "bd1-why": {
      after: "bd1-guided",
      key: "b",
      misconception: "a",
      corrections: {
        a: "The posted 10 is already in the pot. It improves your price, but the hand still has to earn the call.",
        c: "Count your own call: 15 ÷ 55, about 27%.",
      },
    },
  },
  pause: { film: "p-blind-defense", at: 73.99, key: { value: 30, tolerance: 0 } },
};
