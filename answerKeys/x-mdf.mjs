// Answer keys for x-mdf (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as x-mdf.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/x-mdf.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "x-mdf", node: "x-mdf", contentVersion: 1, flow: "film-first", access: "pro", conceptId: "t4-mdf-bluffcatch",
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why"}, {kind: "decision", spotId: "md-guided"}, {kind: "decision", spotId: "md-practice"}, {kind: "decision", spotId: "md-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: 66.97, spotId: "md-turn", decision: "estimate", bands: ["keep-14", "keep-21", "keep-35"], key: {band: "keep-21"} },
  why: { stage: 2, spotId: "md-why", options: ["mdf", "beaten", "breakeven"], key: { option: "mdf" } },
  spots: {
    "md-guided": { stage: 3, decision: "estimate", bands: ["keep-18", "keep-24", "keep-42"], key: {band: "keep-24"} },
    "md-practice": { stage: 4, decision: "estimate", bands: ["keep-10", "keep-20", "keep-30"], key: {band: "keep-20"} },
    "md-fresh": { stage: 5, decision: "estimate", bands: ["keep-8", "keep-16", "keep-24"], key: {band: "keep-24"} },
  },
};
