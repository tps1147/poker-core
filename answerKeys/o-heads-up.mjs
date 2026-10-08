// Answer keys for o-heads-up (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as o-heads-up.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/o-heads-up.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "o-heads-up", node: "o-heads-up", contentVersion: 1, flow: "film-first", access: "pro", conceptId: null,
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why"}, {kind: "decision", spotId: "hu-guided"}, {kind: "decision", spotId: "hu-practice"}, {kind: "decision", spotId: "hu-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: null, spotId: "hu-turn", decision: "estimate", bands: ["same", "wider"], key: {band: "wider"} },
  why: { stage: 2, spotId: "hu-why", options: ["cost", "same", "acts-first"], key: { option: "cost" } },
  spots: {
    "hu-guided": { stage: 3, decision: "estimate", bands: ["button", "big-blind"], key: {band: "button"} },
    "hu-practice": { stage: 4, decision: "estimate", bands: ["bb-017", "bb-075", "bb-150"], key: {band: "bb-075"} },
    "hu-fresh": { stage: 5, decision: "estimate", bands: ["x2", "x3", "x45"], key: {band: "x3"} },
  },
};
