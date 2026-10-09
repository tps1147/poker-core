// Answer keys for w-how-deep (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as w-how-deep.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/w-how-deep.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 2 (no repeated question): the film keeps its own count (wd-turn, 1,326 two-card
// starts) and the lesson skips its end ask. The guided question counts the starts of one pair (aces:
// 4 x 3 / 2 = 6) and practice the starts of two ranks (ace-king: 4 x 4 = 16), in place of the film's
// own 1,326 and the 169 kinds the film answers. Fresh is unchanged. Every key is recomputed in
// test/academyEarly.test.mjs.
export default {
  lessonId: "w-how-deep", node: "w-how-deep", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "wd-why" }, { kind: "decision", spotId: "wd-guided" }, { kind: "decision", spotId: "wd-practice" }, { kind: "decision", spotId: "wd-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "w-how-deep", spotId: "wd-turn", decision: "estimate", bands: ["169", "1326", "2652"], key: { band: "1326" } },
  why: { stage: 2, spotId: "wd-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "a" },
  spots: {
    "wd-guided": { stage: 3, decision: "estimate", bands: ["4", "6", "12"], key: { band: "6" } },
    "wd-practice": { stage: 4, decision: "estimate", bands: ["4", "12", "16"], key: { band: "16" } },
    "wd-fresh": { stage: 5, decision: "estimate", bands: ["math", "preflop", "postflop"], key: { band: "postflop" } },
  },
};
