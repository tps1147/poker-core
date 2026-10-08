// Answer keys for b-texture-read (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as b-texture-read.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/b-texture-read.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "b-texture-read", node: "b-texture-read", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "tx-guided" }, { kind: "decision", spotId: "tx-practice" }, { kind: "decision", spotId: "tx-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "b-texture-read", spotId: "tx-turn", decision: "estimate", bands: ["k72", "kk4", "a83", "987", "jt4"], key: { band: "a83" } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
  spots: {
    "tx-guided": { stage: 3, decision: "estimate", bands: ["k72", "kk4", "a83", "987", "jt4"], key: { band: "a83" } },
    "tx-practice": { stage: 4, decision: "estimate", bands: ["straight", "flush", "fullhouse"], key: { band: "straight" } },
    "tx-fresh": { stage: 5, decision: "estimate", bands: ["quads", "straight", "flush"], key: { band: "quads" } },
  },
};
