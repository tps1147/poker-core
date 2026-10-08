// Answer keys for x-check-raise (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as x-check-raise.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/x-check-raise.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "x-check-raise", node: "x-check-raise", contentVersion: 1, flow: "film-first", access: "pro", conceptId: null,
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why", spotId: "cr-why"}, {kind: "decision", spotId: "cr-guided"}, {kind: "decision", spotId: "cr-practice"}, {kind: "decision", spotId: "cr-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: 60.83, spotId: "cr-turn", decision: "action", choices: ["call", "raise"], key: {action: "call"} },
  why: { stage: 2, spotId: "cr-why", options: ["folds-worse", "monster", "price"], key: { option: "folds-worse" } },
  spots: {
    "cr-guided": { stage: 3, decision: "action", choices: ["call", "raise"], key: {action: "raise"} },
    "cr-practice": { stage: 4, decision: "action", choices: ["call", "raise"], key: {action: "raise"} },
    "cr-fresh": { stage: 5, decision: "action", choices: ["call", "raise"], key: {action: "call"} },
  },
};
