// Answer keys for h-player-types (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as h-player-types.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/h-player-types.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "h-player-types", node: "h-player-types", contentVersion: 1, flow: "film-first", access: "pro", conceptId: "t5-player-typing",
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why"}, {kind: "decision", spotId: "pt-guided"}, {kind: "decision", spotId: "pt-practice"}, {kind: "decision", spotId: "pt-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: null, spotId: "pt-turn", decision: "estimate", bands: ["station", "nit", "lag"], key: {band: "nit"} },
  why: { stage: 2, spotId: "pt-why", options: ["habits", "face", "three"], key: { option: "habits" } },
  spots: {
    "pt-guided": { stage: 3, decision: "estimate", bands: ["station", "nit", "lag"], key: {band: "station"} },
    "pt-practice": { stage: 4, decision: "estimate", bands: ["tag", "lag", "station"], key: {band: "lag"} },
    "pt-fresh": { stage: 5, decision: "estimate", bands: ["station", "not-yet"], key: {band: "not-yet"} },
  },
};
