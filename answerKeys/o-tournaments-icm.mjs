// Answer keys for o-tournaments-icm (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as o-tournaments-icm.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/o-tournaments-icm.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "o-tournaments-icm", node: "o-tournaments-icm", contentVersion: 1, flow: "film-first", access: "pro", conceptId: "t6-icm",
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why"}, {kind: "decision", spotId: "ic-guided"}, {kind: "decision", spotId: "ic-practice"}, {kind: "decision", spotId: "ic-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: 67.51, spotId: "ic-turn", decision: "estimate", bands: ["gains", "same", "loses"], key: {band: "loses"} },
  why: { stage: 2, options: ["places", "chips", "lead"], key: { option: "places" } },
  spots: {
    "ic-guided": { stage: 3, decision: "action", choices: ["fold", "call"], key: {action: "fold"} },
    "ic-practice": { stage: 4, decision: "estimate", bands: ["gains", "loses"], key: {band: "gains"} },
    "ic-fresh": { stage: 5, decision: "action", choices: ["fold", "call"], key: {action: "fold"} },
  },
};
