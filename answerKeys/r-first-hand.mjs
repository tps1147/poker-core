// Answer keys for r-first-hand (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as r-first-hand.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/r-first-hand.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 2 (2026-10-08, no repeated question): the film's own question (spot fh-turn, who acts
// first before the flop) is no longer the guided spot. fh-guided now asks what a call costs on the
// button after the blinds (5 more). Practice and fresh are unchanged.
// Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "r-first-hand", node: "r-first-hand", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "fh-why" }, { kind: "decision", spotId: "fh-guided" }, { kind: "decision", spotId: "fh-practice" }, { kind: "decision", spotId: "fh-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "r-first-hand", spotId: "fh-turn", decision: "estimate", bands: ["you", "ada"], key: { band: "you" } },
  why: { stage: 2, spotId: "fh-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "a" },
  spots: {
    "fh-guided": { stage: 3, decision: "estimate", bands: ["five", "ten", "zero"], key: { band: "five" } },
    "fh-practice": { stage: 4, decision: "estimate", bands: ["checkbet", "callraise", "checkcall"], key: { band: "checkbet" } },
    "fh-fresh": { stage: 5, decision: "count", range: [0, 400], key: { value: 140, tolerance: 0 } },
  },
};
