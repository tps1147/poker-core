// Answer keys for w-the-academy (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as w-the-academy.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/w-the-academy.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "w-the-academy", node: "w-the-academy", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "wa-guided" }, { kind: "decision", spotId: "wa-practice" }, { kind: "decision", spotId: "wa-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "w-the-academy", spotId: "wa-turn", decision: "estimate", bands: ["watch", "decide"], key: { band: "decide" } },
  why: { stage: 2, spotId: "wa-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "b" },
  spots: {
    "wa-guided": { stage: 3, decision: "estimate", bands: ["watch", "decide"], key: { band: "decide" } },
    "wa-practice": { stage: 4, decision: "estimate", bands: ["why", "new", "later"], key: { band: "why" } },
    "wa-fresh": { stage: 5, decision: "estimate", bands: ["learn", "why", "new"], key: { band: "new" } },
  },
};
