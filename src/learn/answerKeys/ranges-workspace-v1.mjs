// Answer keys for ranges-workspace-v1 (tree node f-ranges), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/ranges-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "ranges-workspace-v1",
  contentVersion: 1,
  node: "f-ranges",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "rng1-guided" },
    { kind: "why", id: "rng1-why" },
    { kind: "decision", spotId: "rng1-practice-preflop" },
    { kind: "decision", spotId: "rng1-practice-flop" },
    { kind: "decision", spotId: "rng1-fresh-preflop" },
    { kind: "decision", spotId: "rng1-fresh-flop" },
    { kind: "takeaway" },
  ],
  why: {
    "rng1-why": {
      after: "rng1-guided",
      key: "a",
      misconception: "c",
      corrections: {
        b: "Weaker kings, pairs and bluffs bet too. Cutting them out is fear reading.",
        c: "One bet fits many combos. Put him on all of them, weighted.",
      },
    },
  },
  pause: { film: "f-ranges", at: 81.05, key: { band: "about-64" } },
};
