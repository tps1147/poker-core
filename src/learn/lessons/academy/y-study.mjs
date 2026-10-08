// y-study, How to Study (The Player), academy v2 definition.
// Film: src-academy-y-study-v2 (80 s). canon.yourTurn is null, so the film plays to its stop and then
// asks its own question: "Which one: the loss... or the unsure one?" (the film: the unsure one).
// Plan: player.md (y-study). Tag each decision by how sure you were, never by the result: the +10
// call from y-tilt still loses 70 times in 100, so reviewing losses mostly reviews good decisions.
// Then spacing: decide a spot fresh now and check it again later.
//   Your turn   the loss or the unsure one -> the unsure one
//   Guided      a three-hand log: which goes to review -> the unsure call that won
//   Practice    when to come back to a reviewed spot -> later, after a gap
//   Fresh       a new log: which goes to review -> the unsure fold (changed hands and results)
// These are judgments about decisions and evidence; no answer depends on a result.
// Keys: answerKeys/y-study.mjs. The 70-in-100 figure is checked in test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, bands, takeaway } from "./kit.mjs";

const feedback = { found: "That’s the one to study.", missed: "Filter by how sure you were.", open: "Here’s the filter." };
const preflop = (hero) => ({ street: "preflop", hero, board: [] });

const turnSpot = {
  decision: "estimate",
  bands: bands(["loss", "The big loss"], ["unsure", "The unsure win"]),
  dockPrompt: "Which hand do you review?",
  title: "Your turn: which hand do you review?",
  prompt: "Two hands. In one you lost a big pot. In the other you won, but weren’t sure of your call. There’s time to review one. Which?",
  hint: "Which tag tells you a decision might be wrong: the result, or how sure you were?",
  explanation: "The unsure one. A good call loses often: the +10 call still loses 70 times in 100. The unsure decision is where you might be wrong.",
};

const guided = preflop(["As", "Qc"]);
const practice = preflop(["Jd", "Th"]);
const fresh = preflop(["8c", "8h"]);

const definition = {
  ...definitionBase({
    node: "y-study", coach: "mina", title: "Study the unsure decisions.", kicker: "Then come back to them later.",
    track: "player", chapter: "The Player", minutes: 4, feedback,
    assumptions: "Each hand in a session log is tagged by how sure you felt about the decision, sure or not sure, and its result is greyed out. A result says nothing about the decision on its own: a +10 call still loses 70 times in 100. Each hand at the table stops before the flop.",
  }),
  stages: [
    welcome("Study the unsure decisions.", "Then come back to them later.",
      "Which hand should you review: the one you lost, or the one you weren’t sure about? Watch Mina sort a session, then sort three logs.", "Mina"),
    filmStage({ film: "y-study", at: null, spotId: "sd-turn", spot: turnSpot, upNext: "Sort Mina’s session" }),
    whyStage("sd-why", "Why review the unsure one?", [
      { id: "unsure", text: "Good calls lose often, so losses mostly show good decisions. Being unsure marks one that might be wrong.", fix: "Right. Tag how sure you were, not whether you won." },
      { id: "more-hands", text: "Neither: playing more hands improves you faster than reviewing.", fix: "More hands won’t fix a decision you never look at. Review the unsure ones." },
      { id: "biggest", text: "The loss, because the biggest pot matters most.", fix: "Pot size isn’t the filter. A +10 call loses 70 times in 100; review where you weren’t sure." },
    ]),
    decision("sd-guided", "sd-guided", "guided", "Mina’s session", "Mina’s session log.", "Try a practice hand", { feedback }),
    decision("sd-practice", "sd-practice", "practice", "Practice", "You reviewed a spot. Now what?", "Try a fresh hand", { feedback: { found: "That’s how it sticks.", missed: "Space it out.", open: "Here’s the plan." } }),
    decision("sd-fresh", "sd-fresh", "fresh", "Fresh hand", "A new log. Pick the review.", "See your recap", { feedback }),
    takeaway({
      heading: "Decisions, not results.",
      rule: "Review the decisions you weren't sure of, and come back to them later.",
      lead: "Tag each decision by how sure you felt and grey out the result. Decide a reviewed spot fresh, then check it again days later.",
      labels: ["Mina’s session", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "sd-guided": {
      scene: "question",
      decision: "estimate", ...guided,
      bands: bands(["sure-fold", "A sure fold that saved chips"], ["sure-call-lost", "A sure call that lost"], ["unsure-call-won", "An unsure call that won"]),
      dockPrompt: "Which hand goes to review?",
      title: "Three hands. Which goes to review?",
      prompt: "Mina’s session log has three hands: a sure fold that saved chips, a sure call that lost, and an unsure call that won. Which goes to the review queue?",
      hint: "Grey out the results. What is left to sort by?",
      explanation: "The unsure call that won. Winning doesn’t make it right. A sure call that lost may still be a good call, like the +10 call that loses 70 times in 100.",
    },
    "sd-practice": {
      scene: "question",
      decision: "estimate", ...practice,
      bands: bands(["cram", "Again now, ten times in a row"], ["later", "Fresh, then again days later"]),
      dockPrompt: "When do you come back to it?",
      title: "You reviewed a spot. Then?",
      prompt: "You reviewed an unsure decision and found the right play. How do you make it stick?",
      hint: "Cramming feels like learning. What does the Academy do with your rule cards?",
      explanation: "Decide it fresh now, then check it again days later. Spaced practice beats cramming, which is why the Academy brings each rule back on a schedule.",
    },
    "sd-fresh": {
      scene: "question",
      decision: "estimate", ...fresh,
      bands: bands(["sure-bet-won", "A sure value bet that won"], ["unsure-fold", "An unsure fold to a river bet"], ["sure-call-lost-big", "A sure call that lost a big pot"]),
      dockPrompt: "Which hand goes to review?",
      title: "A new log. Which goes to review?",
      prompt: "A new session log: a sure value bet that won, an unsure fold to a river bet, and a sure call that lost a big pot. Which goes to the review queue?",
      hint: "Sort by how sure you were, not by the chips.",
      explanation: "The unsure fold. You weren’t sure of it, so it may be a leak. The big loss came from a decision you were sure of, and a good call can lose.",
    },
  },
  hands: {
    "sd-guided": huHand("sd-guided", { ...guided, pot: 0, blinds: [5, 10], decisions: ["sd-guided"] }),
    "sd-practice": huHand("sd-practice", { ...practice, pot: 0, blinds: [5, 10], decisions: ["sd-practice"] }),
    "sd-fresh": huHand("sd-fresh", { ...fresh, pot: 0, blinds: [5, 10], decisions: ["sd-fresh"] }),
  },
};

export default definition;
