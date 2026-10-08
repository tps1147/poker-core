// Answer keys for b-the-nuts (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as b-the-nuts.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/b-the-nuts.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "b-the-nuts", node: "b-the-nuts", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "nu-guided" }, { kind: "decision", spotId: "nu-practice" }, { kind: "decision", spotId: "nu-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "b-the-nuts", spotId: "nu-turn", decision: "estimate", bands: ["ak", "kk", "qq"], key: { band: "kk" } },
  why: { stage: 2, spotId: "nu-why", options: ["a", "b", "c"], key: { option: "a" }, misconception: "b" },
  spots: {
    "nu-guided": { stage: 3, decision: "estimate", bands: ["ak", "kk", "qq"], key: { band: "kk" } },
    "nu-practice": { stage: 4, decision: "estimate", bands: ["99", "aa", "t7"], key: { band: "99" } },
    "nu-fresh": { stage: 5, decision: "estimate", bands: ["33", "kk", "aq"], key: { band: "33" } },
  },
};
