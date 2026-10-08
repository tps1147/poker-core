// Answer keys for m-chance-as-share (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as m-chance-as-share.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/m-chance-as-share.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "m-chance-as-share", node: "m-chance-as-share", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "cs-guided" }, { kind: "decision", spotId: "cs-practice" }, { kind: "decision", spotId: "cs-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: 61.51, anchor: "yourTurn", filmId: "m-chance-as-share", spotId: "cs-turn", decision: "estimate", bands: ["4", "7.7", "25"], key: { band: "7.7" } },
  why: { stage: 2, spotId: "cs-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
  spots: {
    "cs-guided": { stage: 3, decision: "estimate", bands: ["4", "7.7", "25"], key: { band: "7.7" } },
    "cs-practice": { stage: 4, decision: "estimate", bands: ["25", "50", "75"], key: { band: "50" } },
    "cs-fresh": { stage: 5, decision: "estimate", bands: ["8", "23", "25"], key: { band: "23" } },
  },
};
