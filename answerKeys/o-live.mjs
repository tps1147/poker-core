// Answer keys for o-live (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as o-live.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/o-live.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "o-live", node: "o-live", contentVersion: 1, flow: "film-first", access: "pro", conceptId: null,
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why"}, {kind: "decision", spotId: "lv-guided"}, {kind: "decision", spotId: "lv-practice"}, {kind: "decision", spotId: "lv-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: 50.5, spotId: "lv-turn", decision: "estimate", bands: ["call", "raise"], key: {band: "call"} },
  why: { stage: 2, spotId: "lv-why", options: ["no-word", "online", "double"], key: { option: "no-word" } },
  spots: {
    "lv-guided": { stage: 3, decision: "estimate", bands: ["call", "raise"], key: {band: "call"} },
    "lv-practice": { stage: 4, decision: "estimate", bands: ["first", "all"], key: {band: "first"} },
    "lv-fresh": { stage: 5, decision: "estimate", bands: ["shaking", "betting"], key: {band: "betting"} },
  },
};
