// Answer keys for y-tilt (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as y-tilt.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/y-tilt.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "y-tilt", node: "y-tilt", contentVersion: 1, flow: "film-first", access: "pro", conceptId: "t6-tilt",
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why", spotId: "tl-why"}, {kind: "decision", spotId: "tl-guided"}, {kind: "decision", spotId: "tl-practice"}, {kind: "decision", spotId: "tl-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: null, spotId: "tl-turn", decision: "action", choices: ["fold", "call"], key: {action: "call"} },
  why: { stage: 2, spotId: "tl-why", options: ["math", "calm", "due"], key: { option: "math" } },
  spots: {
    "tl-guided": { stage: 3, decision: "action", choices: ["fold", "call"], key: {action: "call"} },
    "tl-practice": { stage: 4, decision: "action", choices: ["fold", "call"], key: {action: "fold"} },
    "tl-fresh": { stage: 5, decision: "action", choices: ["fold", "call"], key: {action: "call"} },
  },
};
