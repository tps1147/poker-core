// Answer keys for f-playing-draws (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as f-playing-draws.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/f-playing-draws.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// The film spot is the guided spot (same cards and numbers). Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "f-playing-draws", node: "f-playing-draws", contentVersion: 1, flow: "film-first", access: "pro", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why" }, { kind: "decision", spotId: "pd-guided" }, { kind: "decision", spotId: "pd-practice" }, { kind: "decision", spotId: "pd-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: 67.72, anchor: "yourTurn", filmId: "f-playing-draws", spotId: "pd-turn", decision: "action", choices: ["fold", "call"], key: { action: "call" } },
  why: { stage: 2, spotId: "pd-why", options: ["room", "passive", "times4"], key: { option: "room" }, misconception: "passive" },
  spots: {
    "pd-guided": { stage: 3, decision: "action", choices: ["fold", "call"], key: { action: "call" } },
    "pd-practice": { stage: 4, decision: "action", choices: ["fold", "call"], key: { action: "fold" } },
    "pd-fresh": { stage: 5, decision: "action", choices: ["fold", "call"], key: { action: "call" } },
  },
};
