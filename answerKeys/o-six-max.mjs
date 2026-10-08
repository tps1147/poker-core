// Answer keys for o-six-max (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as o-six-max.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/o-six-max.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "o-six-max", node: "o-six-max", contentVersion: 1, flow: "film-first", access: "pro", conceptId: null,
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why", spotId: "sm-why"}, {kind: "decision", spotId: "sm-guided"}, {kind: "decision", spotId: "sm-practice"}, {kind: "decision", spotId: "sm-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: 48.69, spotId: "sm-turn", decision: "estimate", bands: ["behind-2", "behind-3", "behind-5"], key: {band: "behind-3"} },
  why: { stage: 2, spotId: "sm-why", options: ["behind", "same", "blinds"], key: { option: "behind" } },
  spots: {
    "sm-guided": { stage: 3, decision: "estimate", bands: ["behind-3", "behind-5", "behind-8"], key: {band: "behind-5"} },
    "sm-practice": { stage: 4, decision: "estimate", bands: ["seat-1", "seat-4", "seat-6"], key: {band: "seat-4"} },
    "sm-fresh": { stage: 5, decision: "estimate", bands: ["behind-3", "behind-4", "behind-5"], key: {band: "behind-4"} },
  },
};
