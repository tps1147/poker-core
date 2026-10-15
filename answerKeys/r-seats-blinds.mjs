// Answer keys for r-seats-blinds (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as r-seats-blinds.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/r-seats-blinds.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 2 (2026-10-08, no repeated question): the film's own question (spot sb-turn, 15 chips
// before a card: whose?) is no longer the guided spot. sb-guided now asks how many of the 30 are yours
// in the big blind with blinds of 10 and 20 (20); sb-practice asks what you post after the button
// moves past you (the small blind); sb-fresh is heads-up with the button moved to Ace Andy (he posts
// the small blind). The old practice and fresh asked what the film shows and answers.
// Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "r-seats-blinds", node: "r-seats-blinds", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "sb-why" }, { kind: "decision", spotId: "sb-guided" }, { kind: "decision", spotId: "sb-practice" }, { kind: "decision", spotId: "sb-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "r-seats-blinds", spotId: "sb-turn", decision: "estimate", bands: ["house", "players"], key: { band: "players" } },
  why: { stage: 2, spotId: "sb-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
  spots: {
    "sb-guided": { stage: 3, decision: "estimate", bands: ["ten", "twenty", "thirty"], key: { band: "twenty" } },
    "sb-practice": { stage: 4, decision: "estimate", bands: ["nothing", "small", "big"], key: { band: "small" } },
    "sb-fresh": { stage: 5, decision: "estimate", bands: ["you", "andy"], key: { band: "andy" } },
  },
};
