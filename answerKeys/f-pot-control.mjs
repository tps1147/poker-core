// Answer keys for f-pot-control (academy v2), content version 2, for the server worker: copy into
// pokerServer/src/data/lessonRuns as f-pot-control.v2.js (CommonJS). This folder is not shipped
// (package.json "files" is src only), so the web bundle never receives a key. Stage indexes match
// src/learn/lessons/academy/f-pot-control.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// v2 (2026-10-09): the film's question keeps its own key (pc-turn, him), and the guided and practice
// hands are new spots instead of the film's nines (guided T♦ T♣ last to act: the free river is your
// choice, you; practice J♠ J♦ in position on the turn: check). Every key is recomputed in
// test/academyEarly.test.mjs.
export default {
  lessonId: "f-pot-control", node: "f-pot-control", contentVersion: 2, flow: "film-first", access: "pro", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "pc-why" }, { kind: "decision", spotId: "pc-guided" }, { kind: "decision", spotId: "pc-practice" }, { kind: "decision", spotId: "pc-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: 60.81, anchor: "yourTurn", filmId: "f-pot-control", spotId: "pc-turn", decision: "estimate", bands: ["you", "him"], key: { band: "him" } },
  why: { stage: 2, spotId: "pc-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "b" },
  spots: {
    "pc-guided": { stage: 3, decision: "estimate", bands: ["you", "him"], key: { band: "you" } },
    "pc-practice": { stage: 4, decision: "action", choices: ["check", "bet"], key: { action: "check" } },
    "pc-fresh": { stage: 5, decision: "count", range: [0, 1000], key: { value: 240, tolerance: 0 } },
  },
};
