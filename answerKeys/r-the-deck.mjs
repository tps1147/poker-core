// Answer keys for r-the-deck (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as r-the-deck.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/r-the-deck.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 2 (2026-10-08, no repeated question): the film's own question (spot dk-turn, A♠ K♦
// against A♥ K♣, a split) is no longer the guided spot. The new guided spot dk-guided is K♠ J♦ against
// K♥ J♣ on K♦ 8♣ 8♥ 5♠ 2♣, the same two pair and kicker: a split. Practice and fresh are unchanged.
// Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "r-the-deck", node: "r-the-deck", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "dk-why" }, { kind: "decision", spotId: "dk-guided" }, { kind: "decision", spotId: "dk-practice" }, { kind: "decision", spotId: "dk-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "r-the-deck", spotId: "dk-turn", decision: "estimate", bands: ["you", "andy", "split"], key: { band: "split" } },
  why: { stage: 2, spotId: "dk-why", options: ["a", "b", "c"], key: { option: "a" }, misconception: "b" },
  spots: {
    "dk-guided": { stage: 3, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "split" } },
    "dk-practice": { stage: 4, decision: "estimate", bands: ["clubs", "diamonds", "equal"], key: { band: "equal" } },
    "dk-fresh": { stage: 5, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "split" } },
  },
};
