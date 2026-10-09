// Answer keys for w-what-is-poker (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as w-what-is-poker.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/w-what-is-poker.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 2 (no repeated question): the film keeps its own showdown (wip-turn, K♥ Q♥ against
// A♣ J♦, you win) and the lesson skips its end ask. The guided hand is a new showdown (K♠ K♦ against
// 7♥ 6♥ on 8♥ 5♣ K♣ 2♥ 9♠: the straight beats three kings, Ace Andy wins). Practice and fresh are
// unchanged. Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "w-what-is-poker", node: "w-what-is-poker", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "wip-why" }, { kind: "decision", spotId: "wip-guided" }, { kind: "decision", spotId: "wip-practice" }, { kind: "decision", spotId: "wip-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "w-what-is-poker", spotId: "wip-turn", decision: "estimate", bands: ["you", "andy", "split"], key: { band: "you" } },
  why: { stage: 2, spotId: "wip-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "a" },
  spots: {
    "wip-guided": { stage: 3, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "andy" } },
    "wip-practice": { stage: 4, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "you" } },
    "wip-fresh": { stage: 5, decision: "estimate", bands: ["andy", "show", "split"], key: { band: "andy" } },
  },
};
