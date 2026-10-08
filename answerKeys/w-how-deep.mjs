// Answer keys for w-how-deep (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as w-how-deep.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/w-how-deep.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "w-how-deep", node: "w-how-deep", contentVersion: 1, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "wd-guided" }, { kind: "decision", spotId: "wd-practice" }, { kind: "decision", spotId: "wd-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "w-deep", spotId: "wd-turn", decision: "estimate", bands: ["169", "1326", "2652"], key: { band: "1326" } },
  why: { stage: 2, options: ["a", "b", "c"], key: { option: "b" }, misconception: "a" },
  spots: {
    "wd-guided": { stage: 3, decision: "estimate", bands: ["169", "1326", "2652"], key: { band: "1326" } },
    "wd-practice": { stage: 4, decision: "estimate", bands: ["13", "169", "1326"], key: { band: "169" } },
    "wd-fresh": { stage: 5, decision: "estimate", bands: ["math", "preflop", "postflop"], key: { band: "postflop" } },
  },
};
