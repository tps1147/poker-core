// Answer keys for y-bankroll (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as y-bankroll.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/y-bankroll.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "y-bankroll", node: "y-bankroll", contentVersion: 1, flow: "film-first", access: "pro", conceptId: "t6-bankroll",
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why", spotId: "br-why"}, {kind: "decision", spotId: "br-guided"}, {kind: "decision", spotId: "br-practice"}, {kind: "decision", spotId: "br-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: null, spotId: "br-turn", decision: "estimate", bands: ["no", "yes"], key: {band: "yes"} },
  why: { stage: 2, spotId: "br-why", options: ["cushion", "not-winner", "plays-badly"], key: { option: "cushion" } },
  spots: {
    "br-guided": { stage: 3, decision: "estimate", bands: ["bi-10", "bi-20", "bi-40"], key: {band: "bi-20"} },
    "br-practice": { stage: 4, decision: "estimate", bands: ["game-100", "game-50"], key: {band: "game-50"} },
    "br-fresh": { stage: 5, decision: "estimate", bands: ["game-150", "game-75"], key: {band: "game-75"} },
  },
};
