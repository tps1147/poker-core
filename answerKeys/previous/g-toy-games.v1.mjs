// Answer keys for g-toy-games (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as g-toy-games.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/g-toy-games.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "g-toy-games", node: "g-toy-games", contentVersion: 1, flow: "film-first", access: "pro", conceptId: null,
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why", spotId: "tg-why"}, {kind: "decision", spotId: "tg-guided"}, {kind: "decision", spotId: "tg-practice"}, {kind: "decision", spotId: "tg-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: null, spotId: "tg-turn", decision: "estimate", bands: ["never", "sometimes", "always"], key: {band: "sometimes"} },
  why: { stage: 2, spotId: "tg-why", options: ["mix", "computers", "king-folds"], key: { option: "mix" } },
  spots: {
    "tg-guided": { stage: 3, decision: "estimate", bands: ["quarter", "third", "half"], key: {band: "quarter"} },
    "tg-practice": { stage: 4, decision: "estimate", bands: ["third", "half", "two-thirds"], key: {band: "two-thirds"} },
    "tg-fresh": { stage: 5, decision: "action", choices: ["fold", "call"], key: {action: "fold"} },
  },
};
