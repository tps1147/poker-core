// Answer keys for x-barrels-blockers (academy v2), content version 2, for the server worker: copy into
// pokerServer/src/data/lessonRuns as x-barrels-blockers.v2.js (CommonJS). This folder is not shipped
// (package.json "files" is src only), so the web bundle never receives a key. Stage indexes match
// src/learn/lessons/academy/x-barrels-blockers.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
// v2 (2026-10-09): bk-guided left the film's own barrel plan (pot 100, 350 behind, half pot) for
// pot 80 with 585 behind: three-quarters of the pot, 60 -> 150 -> 375, key bet-60 of bet-40 /
// bet-60 / bet-80. The film, why, practice and fresh keys are unchanged.
export default {
  lessonId: "x-barrels-blockers", node: "x-barrels-blockers", contentVersion: 2, flow: "film-first", access: "pro", conceptId: "t4-barreling-blockers",
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why", spotId: "bk-why"}, {kind: "decision", spotId: "bk-guided"}, {kind: "decision", spotId: "bk-practice"}, {kind: "decision", spotId: "bk-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: 64.66, spotId: "bk-turn", decision: "estimate", bands: ["ace-spades", "nine-diamonds"], key: {band: "ace-spades"} },
  why: { stage: 2, spotId: "bk-why", options: ["blocks-calls", "any-ace", "showdown"], key: { option: "blocks-calls" } },
  spots: {
    "bk-guided": { stage: 3, decision: "estimate", bands: ["bet-40", "bet-60", "bet-80"], key: {band: "bet-60"} },
    "bk-practice": { stage: 4, decision: "estimate", bands: ["bet-25", "bet-50", "bet-100"], key: {band: "bet-50"} },
    "bk-fresh": { stage: 5, decision: "action", choices: ["check", "bet"], key: {action: "bet"} },
  },
};
