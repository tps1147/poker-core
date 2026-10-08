// Answer keys for r-showdown (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as r-showdown.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/r-showdown.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "r-showdown", node: "r-showdown", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "sd-guided" }, { kind: "decision", spotId: "sd-practice" }, { kind: "decision", spotId: "sd-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "r-showdown", spotId: "sd-turn", decision: "estimate", bands: ["yes", "no"], key: { band: "yes" } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "c" }, misconception: "b" },
  spots: {
    "sd-guided": { stage: 3, decision: "estimate", bands: ["yes", "no"], key: { band: "yes" } },
    "sd-practice": { stage: 4, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "split" } },
    "sd-fresh": { stage: 5, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "you" } },
  },
};
