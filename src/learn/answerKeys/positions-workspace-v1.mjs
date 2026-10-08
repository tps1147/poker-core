// Answer keys for positions-workspace-v1 (tree node p-position-value), version 2: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/positions-workspace-v1.v2.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "positions-workspace-v1",
  contentVersion: 2,
  node: "p-position-value",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "pos2-guided" },
    { kind: "why", id: "pos2-why" },
    { kind: "decision", spotId: "pos2-practice" },
    { kind: "decision", spotId: "pos2-fresh" },
    { kind: "takeaway" },
  ],
  why: {
    "pos2-why": {
      after: "pos2-guided",
      key: "a",
      misconception: "c",
      corrections: {
        b: "Under the gun the same hand folds: five players still act after you.",
        c: "Fewer players behind is half of it. You also act last on the flop, the turn and the river.",
      },
    },
  },
  pause: { film: "p-position-value", at: 76.55, key: { band: "co" } },
};
