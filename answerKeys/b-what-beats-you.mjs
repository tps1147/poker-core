// Answer keys for b-what-beats-you (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as b-what-beats-you.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/b-what-beats-you.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "b-what-beats-you", node: "b-what-beats-you", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "wb-guided" }, { kind: "decision", spotId: "wb-practice" }, { kind: "decision", spotId: "wb-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "b-what-beats-you", spotId: "wb-turn", decision: "estimate", bands: ["0", "10", "60", "300"], key: { band: "60" } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "b" }, misconception: "a" },
  spots: {
    "wb-guided": { stage: 3, decision: "estimate", bands: ["0", "10", "60", "300"], key: { band: "60" } },
    "wb-practice": { stage: 4, decision: "estimate", bands: ["fs", "fh", "none"], key: { band: "fs" } },
    "wb-fresh": { stage: 5, decision: "estimate", bands: ["ak", "qq", "jt"], key: { band: "qq" } },
  },
};
