// Answer keys for b-kickers-counterfeit (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as b-kickers-counterfeit.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/b-kickers-counterfeit.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// v2 (contentVersion 2): the film key is the film's own hook (A♥ 3♣ against A♣ K♦: Andy), unchanged;
// the guided hand is new (K♠ 9♥ against A♦ K♥ on K♣ 9♦ 4♠ 4♥: you, the low pair counterfeits
// nothing) and practice is a new river (J♠ 4♥ against J♦ 6♣, the Q♠ plays: split). Every key is
// recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "b-kickers-counterfeit", node: "b-kickers-counterfeit", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "kc-why" }, { kind: "decision", spotId: "kc-guided" }, { kind: "decision", spotId: "kc-practice" }, { kind: "decision", spotId: "kc-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "b-kickers-counterfeit", spotId: "kc-turn", decision: "estimate", bands: ["you", "andy", "split"], key: { band: "andy" } },
  why: { stage: 2, spotId: "kc-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "b" },
  spots: {
    "kc-guided": { stage: 3, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "you" } },
    "kc-practice": { stage: 4, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "split" } },
    "kc-fresh": { stage: 5, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "andy" } },
  },
};
