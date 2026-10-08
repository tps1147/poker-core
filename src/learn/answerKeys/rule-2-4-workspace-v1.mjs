// Answer keys for rule-2-4-workspace-v1 (tree node m-rule-2-4), version 2: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/rule-2-4-workspace-v1.v2.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "rule-2-4-workspace-v1",
  contentVersion: 2,
  node: "m-rule-2-4",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "rule2-guided-estimate" },
    { kind: "decision", spotId: "rule2-guided-call" },
    { kind: "why", id: "rule2-why" },
    { kind: "decision", spotId: "rule2-practice-count" },
    { kind: "decision", spotId: "rule2-practice-estimate" },
    { kind: "decision", spotId: "rule2-fresh-count" },
    { kind: "decision", spotId: "rule2-fresh-estimate" },
    { kind: "takeaway" },
  ],
  why: {
    "rule2-why": {
      after: "rule2-guided-call",
      key: "a",
      misconception: "b",
      corrections: {
        b: "×4 is for two cards seen for this one price. On the turn one card is left: ×2, about 16%.",
        c: "Close is still short. 16% against a 20% price loses chips over time.",
      },
    },
  },
  pause: { film: "m-rule-2-4", at: 62.81, key: { band: "x4" } },
};
