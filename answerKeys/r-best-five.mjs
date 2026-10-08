// Answer keys for r-best-five (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as r-best-five.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/r-best-five.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "r-best-five", node: "r-best-five", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "b5-guided" }, { kind: "decision", spotId: "b5-practice" }, { kind: "decision", spotId: "b5-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "r-best-five", spotId: "b5-turn", decision: "best-five", cards: ["Ac", "Ad", "9s", "8h", "7d", "6c", "5s"], key: { cards: ["9s", "8h", "7d", "6c", "5s"] } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
  spots: {
    "b5-guided": { stage: 3, decision: "best-five", cards: ["Ac", "Ad", "9s", "8h", "7d", "6c", "5s"], key: { cards: ["9s", "8h", "7d", "6c", "5s"] } },
    "b5-practice": { stage: 4, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "you" } },
    "b5-fresh": { stage: 5, decision: "best-five", cards: ["Kh", "3c", "Ks", "Qd", "8h", "8c", "2s"], key: { cards: ["Kh", "Ks", "8h", "8c", "Qd"] } },
  },
};
