// Answer keys for r-showdown (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as r-showdown.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/r-showdown.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 2 (2026-10-08, no repeated question): the film's own question (spot sd-turn, Ace Andy
// bets and everyone folds) is no longer the guided spot. sd-guided is now your river bet with nine
// high and his fold: you do not have to show (no); sd-practice is K♠ K♥ against 9♦ 2♣ on 5♣ 6♦ 7♥ 8♠ K♣
// (his straight wins; the old practice was the film's own split). The fresh spot is unchanged.
// Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "r-showdown", node: "r-showdown", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "sd-why" }, { kind: "decision", spotId: "sd-guided" }, { kind: "decision", spotId: "sd-practice" }, { kind: "decision", spotId: "sd-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "r-showdown", spotId: "sd-turn", decision: "estimate", bands: ["yes", "no"], key: { band: "yes" } },
  why: { stage: 2, spotId: "sd-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "b" },
  spots: {
    "sd-guided": { stage: 3, decision: "estimate", bands: ["yes", "no"], key: { band: "no" } },
    "sd-practice": { stage: 4, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "andy" } },
    "sd-fresh": { stage: 5, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "you" } },
  },
};
