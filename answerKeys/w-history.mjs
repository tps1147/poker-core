// Answer keys for w-history (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as w-history.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/w-history.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "w-history", node: "w-history", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "wh-why" }, { kind: "decision", spotId: "wh-guided" }, { kind: "decision", spotId: "wh-practice" }, { kind: "decision", spotId: "wh-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "w-history", spotId: "wh-turn", decision: "estimate", bands: ["house", "players"], key: { band: "players" } },
  why: { stage: 2, spotId: "wh-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
  spots: {
    "wh-guided": { stage: 3, decision: "estimate", bands: ["house", "players"], key: { band: "players" } },
    "wh-practice": { stage: 4, decision: "estimate", bands: ["luck", "better", "peek"], key: { band: "better" } },
    "wh-fresh": { stage: 5, decision: "estimate", bands: ["casino", "buyins", "sponsor"], key: { band: "buyins" } },
  },
};
