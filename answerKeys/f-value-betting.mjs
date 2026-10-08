// Answer keys for f-value-betting (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as f-value-betting.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/f-value-betting.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "f-value-betting", node: "f-value-betting", contentVersion: 1, flow: "film-first", access: "pro", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "vb-why" }, { kind: "decision", spotId: "vb-guided" }, { kind: "decision", spotId: "vb-practice" }, { kind: "decision", spotId: "vb-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: 70.02, anchor: "yourTurn", filmId: "f-value-betting", spotId: "vb-turn", decision: "action", choices: ["check", "bet"], key: { action: "check" } },
  why: { stage: 2, spotId: "vb-why", options: ["a", "b", "c"], key: { option: "a" }, misconception: "b" },
  spots: {
    "vb-guided": { stage: 3, decision: "action", choices: ["check", "bet"], key: { action: "check" } },
    "vb-practice": { stage: 4, decision: "action", choices: ["check", "bet"], key: { action: "bet" } },
    "vb-fresh": { stage: 5, decision: "action", choices: ["check", "bet"], key: { action: "check" } },
  },
};
