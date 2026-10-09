// Answer keys for b-what-beats-you (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as b-what-beats-you.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/b-what-beats-you.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// v2 (contentVersion 2): the film key is the film's own hook (A♥ Q♦: 63 hands, about 60), unchanged;
// the guided hand is new (Q♠ 8♠ on Q♥ 8♣ 3♦: 5 sets beat it) and practice is a new turn (the J♠ on
// T♠ 6♠ 2♦ lets in flushes). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "b-what-beats-you", node: "b-what-beats-you", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "wb-why" }, { kind: "decision", spotId: "wb-guided" }, { kind: "decision", spotId: "wb-practice" }, { kind: "decision", spotId: "wb-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "b-what-beats-you", spotId: "wb-turn", decision: "estimate", bands: ["0", "10", "60", "300"], key: { band: "60" } },
  why: { stage: 2, spotId: "wb-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "a" },
  spots: {
    "wb-guided": { stage: 3, decision: "estimate", bands: ["0", "5", "35", "300"], key: { band: "5" } },
    "wb-practice": { stage: 4, decision: "estimate", bands: ["fl", "st", "fh", "none"], key: { band: "fl" } },
    "wb-fresh": { stage: 5, decision: "estimate", bands: ["ak", "qq", "jt"], key: { band: "qq" } },
  },
};
