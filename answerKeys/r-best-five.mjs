// Answer keys for r-best-five (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as r-best-five.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/r-best-five.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 2 (2026-10-08, no repeated question): the film's own question (spot b5-turn, pocket
// aces on 9♠ 8♥ 7♦ 6♣ 5♠) is no longer the guided spot. b5-guided is now Q♣ Q♦ on K♥ J♥ 9♥ 6♥ 2♥ (the
// board's flush, none of yours); b5-practice is Q♠ 8♦ against Q♣ J♥ on Q♥ T♠ 7♦ 5♣ 3♠ (his jack kicker
// wins; the old practice was the film's own kicker example). The fresh spot is unchanged.
// Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "r-best-five", node: "r-best-five", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "b5-why" }, { kind: "decision", spotId: "b5-guided" }, { kind: "decision", spotId: "b5-practice" }, { kind: "decision", spotId: "b5-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "r-best-five", spotId: "b5-turn", decision: "best-five", cards: ["Ac", "Ad", "9s", "8h", "7d", "6c", "5s"], key: { cards: ["9s", "8h", "7d", "6c", "5s"] } },
  why: { stage: 2, spotId: "b5-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "c" },
  spots: {
    "b5-guided": { stage: 3, decision: "best-five", cards: ["Qc", "Qd", "Kh", "Jh", "9h", "6h", "2h"], key: { cards: ["Kh", "Jh", "9h", "6h", "2h"] } },
    "b5-practice": { stage: 4, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "andy" } },
    "b5-fresh": { stage: 5, decision: "best-five", cards: ["Kh", "3c", "Ks", "Qd", "8h", "8c", "2s"], key: { cards: ["Kh", "Ks", "8h", "8c", "Qd"] } },
  },
};
