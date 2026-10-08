// Answer keys for w-what-is-poker (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as w-what-is-poker.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/w-what-is-poker.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "w-what-is-poker", node: "w-what-is-poker", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "wip-guided" }, { kind: "decision", spotId: "wip-practice" }, { kind: "decision", spotId: "wip-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "w-what-is-poker", spotId: "wip-turn", decision: "estimate", bands: ["you", "andy", "split"], key: { band: "you" } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "b" }, misconception: "a" },
  spots: {
    "wip-guided": { stage: 3, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "you" } },
    "wip-practice": { stage: 4, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "you" } },
    "wip-fresh": { stage: 5, decision: "estimate", bands: ["andy", "show", "split"], key: { band: "andy" } },
  },
};
