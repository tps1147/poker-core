// Answer keys for r-seats-blinds (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as r-seats-blinds.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/r-seats-blinds.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "r-seats-blinds", node: "r-seats-blinds", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "sb-why" }, { kind: "decision", spotId: "sb-guided" }, { kind: "decision", spotId: "sb-practice" }, { kind: "decision", spotId: "sb-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "r-seats-blinds", spotId: "sb-turn", decision: "estimate", bands: ["house", "players"], key: { band: "players" } },
  why: { stage: 2, spotId: "sb-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
  spots: {
    "sb-guided": { stage: 3, decision: "estimate", bands: ["house", "players"], key: { band: "players" } },
    "sb-practice": { stage: 4, decision: "estimate", bands: ["button", "next", "two"], key: { band: "next" } },
    "sb-fresh": { stage: 5, decision: "estimate", bands: ["you", "andy"], key: { band: "you" } },
  },
};
