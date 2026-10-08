// Answer keys for ev-workspace-v1 (tree node m-ev), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/ev-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "ev-workspace-v1",
  contentVersion: 1,
  node: "m-ev",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "ev1-guided" },
    { kind: "why", id: "ev1-why" },
    { kind: "decision", spotId: "ev1-practice-ev" },
    { kind: "decision", spotId: "ev1-practice-call" },
    { kind: "decision", spotId: "ev1-fresh-ev" },
    { kind: "decision", spotId: "ev1-fresh-call" },
    { kind: "takeaway" },
  ],
  why: {
    "ev1-why": {
      after: "ev1-guided",
      key: "c",
      misconception: "a",
      corrections: {
        a: "One river is one sample. The call earns about +40 on average, win or lose.",
        b: "You lose 70% of the time. The call pays because the pot is big enough, not because you win most.",
      },
    },
  },
  pause: { film: "m-ev", at: 60.08, key: { action: "call" } },
};
