// Answer keys for b-made-vs-draw (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as b-made-vs-draw.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/b-made-vs-draw.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// v2 (contentVersion 2): the film key is the film's own hook (A♥ 5♥, not yet a flush), unchanged; the
// guided hand is new (9♥ 8♥ on 9♣ 6♥ 2♥: a pair of nines) and practice is a flush draw (A♣ T♦ on
// K♣ 8♣ 3♣: 9 cards). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "b-made-vs-draw", node: "b-made-vs-draw", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "mv-why" }, { kind: "decision", spotId: "mv-guided" }, { kind: "decision", spotId: "mv-practice" }, { kind: "decision", spotId: "mv-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "b-made-vs-draw", spotId: "mv-turn", decision: "estimate", bands: ["flush", "draw", "pair"], key: { band: "draw" } },
  why: { stage: 2, spotId: "mv-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "a" },
  spots: {
    "mv-guided": { stage: 3, decision: "estimate", bands: ["flush", "pair", "nothing"], key: { band: "pair" } },
    "mv-practice": { stage: 4, decision: "count", range: [0, 47], key: { value: 9, tolerance: 0 } },
    "mv-fresh": { stage: 5, decision: "count", range: [0, 47], key: { value: 4, tolerance: 0 } },
  },
};
