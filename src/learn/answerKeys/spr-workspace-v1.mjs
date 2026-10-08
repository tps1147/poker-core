// Answer keys for spr-workspace-v1 (tree node m-spr), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/spr-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "spr-workspace-v1",
  contentVersion: 1,
  node: "m-spr",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "spr1-guided-ratio" },
    { kind: "decision", spotId: "spr1-guided-bets" },
    { kind: "why", id: "spr1-why" },
    { kind: "decision", spotId: "spr1-practice-ratio" },
    { kind: "decision", spotId: "spr1-practice-bets" },
    { kind: "decision", spotId: "spr1-fresh-ratio" },
    { kind: "decision", spotId: "spr1-fresh-bets" },
    { kind: "takeaway" },
  ],
  why: {
    "spr1-why": {
      after: "spr1-guided-bets",
      key: "b",
      misconception: "c",
      corrections: {
        a: "His extra 600 can never be matched. The effective stack is your 300.",
        c: "The stacks decide too. With one bet left, top pair can commit; deep, big pots need big hands.",
      },
    },
  },
  pause: { film: "m-spr", at: 70.54, key: { value: 2, tolerance: 0 } },
};
