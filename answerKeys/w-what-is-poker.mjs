// Answer keys for w-what-is-poker (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as w-what-is-poker.v2.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/w-what-is-poker.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Content version 3 (2026-10-09, the welcome rebuild's v3 film): the film pauses four times. Its
// first pause keeps the film key (`film`, wip-turn: preflop, only Call lit); the other three are
// `filmPauses`, each its own <prefix>-turn spot on the film stage: wip-turn-2 (flop, only Call
// lit), wip-turn-3 (river, only Bet lit) and wip-turn-wins, the WHO WINS? prediction (`predict`:
// recorded, never graded wrong; its key is who the film shows winning). Version 2 (the v2 film's
// own showdown, end ask skipped) is kept in previous/w-what-is-poker.v2.mjs. The guided, practice
// and fresh keys are unchanged. Every key is recomputed in test/academyEarly.test.mjs.
export default {
  lessonId: "w-what-is-poker", node: "w-what-is-poker", contentVersion: 3, flow: "film-first", access: "free", conceptId: null,
  stages: [{ kind: "welcome" }, { kind: "film" }, { kind: "why", spotId: "wip-why" }, { kind: "decision", spotId: "wip-guided" }, { kind: "decision", spotId: "wip-practice" }, { kind: "decision", spotId: "wip-fresh" }, { kind: "takeaway" }],
  film: { stage: 1, at: 33.47, anchor: "yourTurn1", filmId: "w-what-is-poker", spotId: "wip-turn", decision: "action", choices: ["fold", "call", "raise"], key: { action: "call" } },
  filmPauses: [
    { stage: 1, at: 51.83, anchor: "yourTurn2", filmId: "w-what-is-poker", spotId: "wip-turn-2", decision: "action", choices: ["fold", "call", "raise"], key: { action: "call" } },
    { stage: 1, at: 71.33, anchor: "yourTurn3", filmId: "w-what-is-poker", spotId: "wip-turn-3", decision: "action", choices: ["fold", "check", "bet"], key: { action: "bet" } },
    { stage: 1, at: 75.77, anchor: "whoWins", filmId: "w-what-is-poker", spotId: "wip-turn-wins", decision: "estimate", bands: ["you", "ada"], key: { band: "you" }, predict: true },
  ],
  why: { stage: 2, spotId: "wip-why", options: ["a", "b", "c"], key: { option: "b" }, misconception: "a" },
  spots: {
    "wip-guided": { stage: 3, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "andy" } },
    "wip-practice": { stage: 4, decision: "estimate", bands: ["you", "andy", "split"], key: { band: "you" } },
    "wip-fresh": { stage: 5, decision: "estimate", bands: ["andy", "show", "split"], key: { band: "andy" } },
  },
};
