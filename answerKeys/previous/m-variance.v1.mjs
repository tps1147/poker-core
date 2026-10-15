// Answer keys for m-variance (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as m-variance.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/m-variance.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "m-variance", node: "m-variance", contentVersion: 1, flow: "film-first", access: "pro", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "va-why" }, { kind: "decision", spotId: "va-guided" }, { kind: "decision", spotId: "va-practice" }, { kind: "decision", spotId: "va-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: 54.24, anchor: "yourTurn", filmId: "m-variance", spotId: "va-turn", decision: "estimate", bands: ["10", "100", "1000"], key: { band: "1000" } },
  why: { stage: 2, spotId: "va-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
  spots: {
    "va-guided": { stage: 3, decision: "estimate", bands: ["10", "100", "1000"], key: { band: "1000" } },
    "va-practice": { stage: 4, decision: "estimate", bands: ["yes", "no"], key: { band: "no" } },
    "va-fresh": { stage: 5, decision: "estimate", bands: ["25", "200", "5000"], key: { band: "5000" } },
  },
};
