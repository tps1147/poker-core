// Answer keys for b-the-nuts (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as b-the-nuts.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/b-the-nuts.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// v2 (contentVersion 2): the film key is the film's own hook (A♣ K♣: the nuts is K-K), unchanged; the
// guided hand is new (8♠ 8♦ on J♥ T♣ 8♣ 3♦: the nuts is Q-9, a straight) and practice is a suited
// flop (K♦ 9♦ 4♦: A♦ Q♦). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "b-the-nuts", node: "b-the-nuts", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "nu-why" }, { kind: "decision", spotId: "nu-guided" }, { kind: "decision", spotId: "nu-practice" }, { kind: "decision", spotId: "nu-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "b-the-nuts", spotId: "nu-turn", decision: "estimate", bands: ["ak", "kk", "qq"], key: { band: "kk" } },
  why: { stage: 2, spotId: "nu-why", options: ["a", "b", "c"], key: { option: "a" }, misconception: "b" },
  spots: {
    "nu-guided": { stage: 3, decision: "estimate", bands: ["jj", "q9", "97"], key: { band: "q9" } },
    "nu-practice": { stage: 4, decision: "estimate", bands: ["kk", "aq", "qj"], key: { band: "aq" } },
    "nu-fresh": { stage: 5, decision: "estimate", bands: ["33", "kk", "aq"], key: { band: "33" } },
  },
};
