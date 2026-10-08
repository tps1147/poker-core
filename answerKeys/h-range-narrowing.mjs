// Answer keys for h-range-narrowing (academy v2), for the server worker: copy into pokerServer/src/data/lessonRuns
// as h-range-narrowing.v1.js (CommonJS). This folder is not shipped (package.json "files" is src only), so the
// web bundle never receives a key. Stage indexes match src/learn/lessons/academy/h-range-narrowing.mjs.
// NOTE for the registry validator: film-first entries today allow only decisions between the film
// and the takeaway; this entry adds the why stage (index 2) and the film's "Your turn" key.
// Every key is recomputed in test/academyLessonsB.test.mjs.
export default {
  lessonId: "h-range-narrowing", node: "h-range-narrowing", contentVersion: 1, flow: "film-first", access: "pro", conceptId: "t5-range-narrowing",
  stages: [{kind: "welcome"}, {kind: "film"}, {kind: "why"}, {kind: "decision", spotId: "rn-guided"}, {kind: "decision", spotId: "rn-practice"}, {kind: "decision", spotId: "rn-fresh"}, {kind: "takeaway"}],
  film: { stage: 1, at: 64.31, spotId: "rn-turn", decision: "estimate", bands: ["about-40", "about-80", "about-160"], key: {band: "about-80"} },
  why: { stage: 2, spotId: "rn-why", options: ["removes", "same", "cards"], key: { option: "removes" } },
  spots: {
    "rn-guided": { stage: 3, decision: "estimate", bands: ["strong", "one-pair", "missed"], key: {band: "one-pair"} },
    "rn-practice": { stage: 4, decision: "estimate", bands: ["t9", "kt", "77"], key: {band: "t9"} },
    "rn-fresh": { stage: 5, decision: "estimate", bands: ["about-50", "about-100", "about-160"], key: {band: "about-100"} },
  },
};
