// Answer keys for o-multiway (academy v2), content version 2, for the server worker: copy into
// pokerServer/src/data/lessonRuns as o-multiway.v2.js (CommonJS). This folder is not shipped
// (package.json "files" is src only), so the web bundle never receives a key. Stage indexes match
// src/learn/lessons/academy/o-multiway.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
// v2 (2026-10-09): every decision left the film's own numbers. mw-guided: second pair, 9♠ 8♠ on K♦
// 9♣ 4♥, against two random hands -> about 34% (bands p19 / p34 / p60). mw-practice: three players
// at 65%, a half-pot bluff -> 27.5%, check. mw-fresh: two players at 55%, a third-pot bluff ->
// 30.25%, bet. The keys' actions are unchanged; the film and why keys too.
export default {
  lessonId: "o-multiway", node: "o-multiway", contentVersion: 2, flow: "film-first", access: "pro", conceptId: "t6-multiway",
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why", spotId: "mw-why"}, {kind: "decision", spotId: "mw-guided"}, {kind: "decision", spotId: "mw-practice"}, {kind: "decision", spotId: "mw-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: 69.34, spotId: "mw-turn", decision: "action", choices: ["check", "bet"], key: {action: "bet"} },
  why: { stage: 2, spotId: "mw-why", options: ["both", "more-value", "each"], key: { option: "both" } },
  spots: {
    "mw-guided": { stage: 3, decision: "estimate", bands: ["p19", "p34", "p60"], key: {band: "p34"} },
    "mw-practice": { stage: 4, decision: "action", choices: ["check", "bet"], key: {action: "check"} },
    "mw-fresh": { stage: 5, decision: "action", choices: ["check", "bet"], key: {action: "bet"} },
  },
};
