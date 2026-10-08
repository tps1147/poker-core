// Answer keys for hand-rankings-workspace-v1 (tree node r-hand-rankings), version 2: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/hand-rankings-workspace-v1.v2.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "hand-rankings-workspace-v1",
  contentVersion: 2,
  node: "r-hand-rankings",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "hr2-guided" },
    { kind: "why", id: "hr2-why" },
    { kind: "decision", spotId: "hr2-practice" },
    { kind: "decision", spotId: "hr2-fresh" },
    { kind: "takeaway" },
  ],
  why: {
    "hr2-why": {
      after: "hr2-guided",
      key: "c",
      misconception: "a",
      corrections: {
        a: "Rank follows rarity, not looks: there are fewer full houses (3,744) than flushes (5,108).",
        b: "Your own cards never change a rank. The full house wins because it is rarer.",
      },
    },
  },
  pause: null,
};
