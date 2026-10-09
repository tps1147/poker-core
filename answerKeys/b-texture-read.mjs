// Answer keys for b-texture-read (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as b-texture-read.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/b-texture-read.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// v2 (contentVersion 2): the film key is the film's own hook (five flops: the flush is on A♥ 8♥ 3♥),
// unchanged; the guided hand is new (five new flops: the straight is on T♥ 9♣ 6♦) and practice is a
// new flop (8♥ 7♥ 2♠: only a set yet). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "b-texture-read", node: "b-texture-read", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "tx-why" }, { kind: "decision", spotId: "tx-guided" }, { kind: "decision", spotId: "tx-practice" }, { kind: "decision", spotId: "tx-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "b-texture-read", spotId: "tx-turn", decision: "estimate", bands: ["k72", "kk4", "a83", "987", "jt4"], key: { band: "a83" } },
  why: { stage: 2, spotId: "tx-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
  spots: {
    "tx-guided": { stage: 3, decision: "estimate", bands: ["q72", "aa5", "k83", "t96", "j84"], key: { band: "t96" } },
    "tx-practice": { stage: 4, decision: "estimate", bands: ["straight", "flush", "set"], key: { band: "set" } },
    "tx-fresh": { stage: 5, decision: "estimate", bands: ["quads", "straight", "flush"], key: { band: "quads" } },
  },
};
