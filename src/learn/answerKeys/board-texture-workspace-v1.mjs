// Answer keys for board-texture-workspace-v1 (tree node f-board-texture), version 1: the why step and the v2 film's
// yourTurn pause. SERVER SIDE ONLY: no client module imports this file (poker-core/learn does not
// re-export it). The spot keys stay in pokerServer/src/data/lessonRuns/board-texture-workspace-v1.v1.js.
// The why stage shifts every later stage index by one: `stages` is the new order, which that
// registry's `stage:` numbers and its film-first stage grammar have to follow.
export default {
  lessonId: "board-texture-workspace-v1",
  contentVersion: 1,
  node: "f-board-texture",
  stages: [
    { kind: "welcome" },
    { kind: "film" },
    { kind: "decision", spotId: "bt1-guided-draws" },
    { kind: "decision", spotId: "bt1-guided-texture" },
    { kind: "why", id: "bt1-why" },
    { kind: "decision", spotId: "bt1-practice-draws" },
    { kind: "decision", spotId: "bt1-practice-texture" },
    { kind: "decision", spotId: "bt1-fresh-draws" },
    { kind: "decision", spotId: "bt1-fresh-texture" },
    { kind: "takeaway" },
  ],
  why: {
    "bt1-why": {
      after: "bt1-guided-texture",
      key: "c",
      misconception: "b",
      corrections: {
        a: "High cards alone can be dry, like king-seven-two. Connected and suited cards make a board wet.",
        b: "Wet describes the board for every range: what is possible now and what is still coming.",
      },
    },
  },
  pause: { film: "f-board-texture", at: 74.88, key: { band: "raiser" } },
};
