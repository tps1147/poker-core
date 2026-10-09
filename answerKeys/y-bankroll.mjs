// Answer keys for y-bankroll (academy v2), content version 2, for the server worker: copy into
// pokerServer/src/data/lessonRuns as y-bankroll.v2.js (CommonJS). This folder is not shipped
// (package.json "files" is src only), so the web bundle never receives a key. Stage indexes match
// src/learn/lessons/academy/y-bankroll.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
// v2 (2026-10-09): br-guided and br-practice left the film's own 2,000 chips for new bankrolls:
// guided 600 chips at a 60-chip game -> 10 buy-ins (bi-6 / bi-10 / bi-60, key bi-10); practice
// 3,200 chips, the 160- or the 80-chip game under 1% -> game-80. The film, why and fresh keys are
// unchanged.
export default {
  lessonId: "y-bankroll", node: "y-bankroll", contentVersion: 2, flow: "film-first", access: "pro", conceptId: "t6-bankroll",
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why", spotId: "br-why"}, {kind: "decision", spotId: "br-guided"}, {kind: "decision", spotId: "br-practice"}, {kind: "decision", spotId: "br-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: null, spotId: "br-turn", decision: "estimate", bands: ["no", "yes"], key: {band: "yes"} },
  why: { stage: 2, spotId: "br-why", options: ["cushion", "not-winner", "plays-badly"], key: { option: "cushion" } },
  spots: {
    "br-guided": { stage: 3, decision: "estimate", bands: ["bi-6", "bi-10", "bi-60"], key: {band: "bi-10"} },
    "br-practice": { stage: 4, decision: "estimate", bands: ["game-160", "game-80"], key: {band: "game-80"} },
    "br-fresh": { stage: 5, decision: "estimate", bands: ["game-150", "game-75"], key: {band: "game-75"} },
  },
};
