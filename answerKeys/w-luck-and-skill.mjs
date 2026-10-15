// Answer keys for w-luck-and-skill (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as w-luck-and-skill.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/w-luck-and-skill.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 2 (no repeated question): the film keeps its own count (wl-turn, A♣ J♦ against
// Q♥ 9♥ on J♥ T♥ 4♣ 2♠: 26 of 44) and the lesson skips its end ask. The guided hand counts a new
// all-in (A♦ A♣ against 8♠ 7♠ on K♠ 9♠ 2♦ 4♥: 35 of 44), practice takes that hand's average
// (pot 440: 440 x 35 / 44 - 220 = +130) in place of the film's +91, and fresh is a third all-in lost
// on the river (T♠ T♥ against A♣ 5♣ on 8♣ 7♦ 3♣ 2♥, river 9♣: still 29 of 44, +105 a hand).
// Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "w-luck-and-skill", node: "w-luck-and-skill", contentVersion: 2, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "wl-why" }, { kind: "decision", spotId: "wl-guided" }, { kind: "decision", spotId: "wl-practice" }, { kind: "decision", spotId: "wl-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: null, anchor: "end", filmId: "w-luck-and-skill", spotId: "wl-turn", decision: "count", range: [0, 44], key: { value: 26, tolerance: 0 } },
  why: { stage: 2, spotId: "wl-why", options: ["a", "b", "c"], key: { option: "c" }, misconception: "b" },
  spots: {
    "wl-guided": { stage: 3, decision: "count", range: [0, 44], key: { value: 35, tolerance: 0 } },
    "wl-practice": { stage: 4, decision: "estimate", bands: ["loss", "avg", "win"], key: { band: "avg" } },
    "wl-fresh": { stage: 5, decision: "estimate", bands: ["mistake", "no"], key: { band: "no" } },
  },
};
