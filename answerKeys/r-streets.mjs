// Answer keys for r-streets (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as r-streets.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/r-streets.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "r-streets", node: "r-streets", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "st-guided" }, { kind: "decision", spotId: "st-practice" }, { kind: "decision", spotId: "st-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "r-streets", spotId: "st-turn", decision: "estimate", bands: ["you", "andy"], key: { band: "andy" } },
  why: { stage: 2, spotId: "st-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
  spots: {
    "st-guided": { stage: 3, decision: "estimate", bands: ["you", "andy"], key: { band: "andy" } },
    "st-practice": { stage: 4, decision: "estimate", bands: ["sb", "bb", "co"], key: { band: "sb" } },
    "st-fresh": { stage: 5, decision: "estimate", bands: ["utg", "co", "btn"], key: { band: "utg" } },
  },
};
