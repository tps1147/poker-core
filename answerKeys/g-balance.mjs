// Answer keys for g-balance (academy v2), content version 2, for the server worker: copy into
// pokerServer/src/data/lessonRuns as g-balance.v2.js (CommonJS). This folder is not shipped
// (package.json "files" is src only), so the web bundle never receives a key. Stage indexes match
// src/learn/lessons/academy/g-balance.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
// v2 (2026-10-09): ba-guided left the film's opening question and worked example (pot 100, bet 100,
// 20 value -> 10 bluffs) for pot 80, bet 80, 18 value -> 9 bluffs, bands bluffs-6 / bluffs-9 /
// bluffs-18. The film, why, practice and fresh keys are unchanged.
export default {
  lessonId: "g-balance", node: "g-balance", contentVersion: 2, flow: "film-first", access: "pro", conceptId: null,
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why", spotId: "ba-why"}, {kind: "decision", spotId: "ba-guided"}, {kind: "decision", spotId: "ba-practice"}, {kind: "decision", spotId: "ba-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: 66.15, spotId: "ba-turn", decision: "estimate", bands: ["bluffs-5", "bluffs-10", "bluffs-25"], key: {band: "bluffs-10"} },
  why: { stage: 2, spotId: "ba-why", options: ["ratio", "random", "breakeven"], key: { option: "ratio" } },
  spots: {
    "ba-guided": { stage: 3, decision: "estimate", bands: ["bluffs-6", "bluffs-9", "bluffs-18"], key: {band: "bluffs-9"} },
    "ba-practice": { stage: 4, decision: "estimate", bands: ["bluffs-6", "bluffs-8", "bluffs-12"], key: {band: "bluffs-8"} },
    "ba-fresh": { stage: 5, decision: "estimate", bands: ["bluffs-4", "bluffs-8", "bluffs-20"], key: {band: "bluffs-8"} },
  },
};
