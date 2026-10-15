// Answer keys for w-history (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as w-history.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/w-history.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 2 (no repeated question): the film keeps its own question (wh-turn, who takes your
// chips: the other players) and the lesson skips its end ask. The guided question counts the chips
// left at a table (4 x 200 - 20 in fees = 780) and practice one pot after the fee (150 - 75 - 5 = 70
// won from the other players), in place of the film's own question and the computers' win the film
// answers. Fresh is unchanged. Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "w-history", node: "w-history", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "wh-why" }, { kind: "decision", spotId: "wh-guided" }, { kind: "decision", spotId: "wh-practice" }, { kind: "decision", spotId: "wh-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "w-history", spotId: "wh-turn", decision: "estimate", bands: ["house", "players"], key: { band: "players" } },
  why: { stage: 2, spotId: "wh-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
  spots: {
    "wh-guided": { stage: 3, decision: "estimate", bands: ["800", "780", "600"], key: { band: "780" } },
    "wh-practice": { stage: 4, decision: "estimate", bands: ["150", "75", "70"], key: { band: "70" } },
    "wh-fresh": { stage: 5, decision: "estimate", bands: ["casino", "buyins", "sponsor"], key: { band: "buyins" } },
  },
};
