// Answer keys for equity-workspace-v1 (tree node m-equity), version 2: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/equity-workspace-v1.v2.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "equity-workspace-v1",
  contentVersion: 2,
  node: "m-equity",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "eq2-guided" },
    { kind: "why", id: "eq2-why" },
    { kind: "decision", spotId: "eq2-practice" },
    { kind: "decision", spotId: "eq2-fresh" },
    { kind: "takeaway" },
  ],
  why: {
    "eq2-why": {
      after: "eq2-guided",
      key: "b",
      misconception: "c",
      corrections: {
        a: "A draw already owns a share. It wins 35% of the time by the end.",
        c: "Chips you put in belong to the pot. Your share is your chance of winning it: 35% of 120.",
      },
    },
  },
  pause: { film: "m-equity", at: 68.06, key: { band: "about-60" } },
};
