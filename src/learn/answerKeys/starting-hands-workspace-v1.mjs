// Answer keys for starting-hands-workspace-v1 (tree node p-starting-hands), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/starting-hands-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "starting-hands-workspace-v1",
  contentVersion: 1,
  node: "p-starting-hands",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "sh1-guided" },
    { kind: "why", id: "sh1-why" },
    { kind: "decision", spotId: "sh1-practice-read" },
    { kind: "decision", spotId: "sh1-practice-act" },
    { kind: "decision", spotId: "sh1-fresh-read" },
    { kind: "decision", spotId: "sh1-fresh-act" },
    { kind: "takeaway" },
  ],
  why: {
    "sh1-why": {
      after: "sh1-guided",
      key: "a",
      misconception: "c",
      corrections: {
        b: "Queens with good kickers open. The seven is the problem, with five players behind.",
        c: "Suited is a bonus, not a ticket. The seat and the second card still decide.",
      },
    },
  },
  pause: { film: "p-starting-hands", at: 77.18, key: { action: "raise" } },
};
