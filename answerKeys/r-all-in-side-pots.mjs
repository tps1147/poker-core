// Answer keys for r-all-in-side-pots (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as r-all-in-side-pots.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/r-all-in-side-pots.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 2 (2026-10-08, no repeated question): the film's own question (spot ap-turn, Ada
// all-in for 50 in a 1,000 pot: 200) is no longer the guided spot. ap-guided is now Ada 60, Bo 200,
// you and Di 500 each: how much can Bo win (240 + 420 = 660, range 0 to 1,500). ap-practice keeps
// its numbers on its own cards (it shared the film's board). The fresh spot is unchanged.
// Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "r-all-in-side-pots", node: "r-all-in-side-pots", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "ap-why" }, { kind: "decision", spotId: "ap-guided" }, { kind: "decision", spotId: "ap-practice" }, { kind: "decision", spotId: "ap-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "r-all-in-side-pots", spotId: "ap-turn", decision: "count", range: [0, 1000], key: { value: 200, tolerance: 0 } },
  why: { stage: 2, spotId: "ap-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
  spots: {
    "ap-guided": { stage: 3, decision: "count", range: [0, 1500], key: { value: 660, tolerance: 0 } },
    "ap-practice": { stage: 4, decision: "count", range: [0, 1000], key: { value: 400, tolerance: 0 } },
    "ap-fresh": { stage: 5, decision: "count", range: [0, 1000], key: { value: 500, tolerance: 0 } },
  },
};
