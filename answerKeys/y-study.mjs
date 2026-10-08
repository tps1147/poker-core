// Answer keys for y-study (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as y-study.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/y-study.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "y-study", node: "y-study", contentVersion: 1, flow: "film-first", access: "pro", conceptId: null,
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why"}, {kind: "decision", spotId: "sd-guided"}, {kind: "decision", spotId: "sd-practice"}, {kind: "decision", spotId: "sd-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: null, spotId: "sd-turn", decision: "estimate", bands: ["loss", "unsure"], key: {band: "unsure"} },
  why: { stage: 2, spotId: "sd-why", options: ["unsure", "more-hands", "biggest"], key: { option: "unsure" } },
  spots: {
    "sd-guided": { stage: 3, decision: "estimate", bands: ["sure-fold", "sure-call-lost", "unsure-call-won"], key: {band: "unsure-call-won"} },
    "sd-practice": { stage: 4, decision: "estimate", bands: ["cram", "later"], key: {band: "later"} },
    "sd-fresh": { stage: 5, decision: "estimate", bands: ["sure-bet-won", "unsure-fold", "sure-call-lost-big"], key: {band: "unsure-fold"} },
  },
};
