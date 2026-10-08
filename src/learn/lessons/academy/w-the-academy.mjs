// Welcome 5, How Flop52 Makes You Better (w-the-academy, film w-the-academy, rendered as w-academy), v2 lesson. The film has no
// yourTurn anchor; the guided hand asks its predict question (watch 100, or decide 10 and check).
// Practice is the plan's comprehension check (what comes right after you decide); the fresh hand
// is the plan's Transfer, the loop in order, asked at a changed place in the ring.
// Keys: answerKeys/w-the-academy.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const table = (id) => huHand(id, { hero: ["Jc", "Tc"], pot: 0, blinds: [5, 10] });
const SPOT = { street: "preflop", hero: ["Jc", "Tc"] };

const spots = {
  "wa-guided": {
    decision: "estimate", ...SPOT,
    bands: bands(["watch", "Watch 100 lessons"], ["decide", "Decide 10 hands and check each one"]), dockPrompt: "Which makes you better?",
    title: "Watch, or decide?",
    prompt: "You could watch a hundred poker lessons, or play ten hands and check each decision. Which makes you better?",
    hint: "Think about what your memory keeps: something you watched, or something you had to work out.",
    explanation: "Deciding, then checking why, is what makes you better. Watching alone fades; a decision you made and checked holds on.",
  },
  "wa-practice": {
    decision: "estimate", ...SPOT,
    bands: bands(["why", "See why"], ["new", "Try it in a new spot"], ["later", "Prove it later"]), dockPrompt: "Right after you decide…",
    title: "The loop, step three.",
    prompt: "In the Flop52 loop you learn an idea, then decide with it. What comes right after you decide?",
    hint: "Before you try the idea anywhere else, you check one thing about the decision you just made.",
    explanation: "You see why: not whether you won the hand, but why the decision holds up. Then you try it in a new spot, and prove it later.",
  },
  "wa-fresh": {
    decision: "estimate", ...SPOT,
    bands: bands(["learn", "Learn the idea"], ["why", "See why"], ["new", "Try it in a new spot"]), dockPrompt: "Just before “Prove it later”…",
    title: "Put the loop in order.",
    prompt: "Learn it, decide it, see why, try it new, prove it later. Which step comes just before “Prove it later”?",
    hint: "Say the five steps in order and stop one short of the last.",
    explanation: "Try it in a new spot comes just before you prove it later: you use the idea on a changed hand, so you learn the idea, not one answer.",
  },
};

const definition = v2Lesson({
  node: "w-the-academy", film: "w-the-academy", coach: "ada", access: "free", track: "Welcome to Poker", minutes: 3,
  title: "How Flop52 makes you better.", kicker: "Watching alone isn't enough.",
  assumptions: "The loop: learn an idea, decide with it, see why, try it in a new spot, prove it later. The film's forgetting curve is an illustration with no rates. The table here is only a frame for the questions.",
  stages: v2Stages({
    welcome: { heading: "How do you get better?", em: "Pick one, and hold onto it.", lead: "Watch how a Flop52 lesson works, then answer three quick questions about it.", cta: "Watch with Ada" },
    film: { upNext: "Answer Ada’s question", film: "w-the-academy", at: null, spot: spots["wa-guided"] },
    hands: [
      { id: "wa-guided", label: "Ada’s question", coachLine: "The film’s question. Your pick." },
      { id: "wa-practice", label: "Practice", coachLine: "One step of the loop." },
      { id: "wa-fresh", label: "Fresh question", coachLine: "The loop, from another side." },
    ],
    why: { prompt: "Why does deciding and checking beat watching?",
      options: options(
        ["a", "More hands is always better, checked or not.", "Hands without a check repeat the same mistakes. The check is what teaches."],
        ["b", "Watching a lesson is the same as learning it.", "One viewing fades. Deciding and checking why is what holds on."],
        ["c", "You have to recall and use the idea, and a single viewing fades.", "Right. Recall and use make it stick; watching alone slips away."]) },
    takeaway: { heading: "Decide it. See why.",
      lead: "Learn it, decide it, see why, try it new, prove it later. Each lesson comes back days later, so you prove you still know it.",
      ruleCard: { lines: ["Learn it, decide it, see why,", "try it new, prove it later."], sub: null } },
  }),
  spots,
  hands: { "wa-guided": table("wa-guided"), "wa-practice": table("wa-practice"), "wa-fresh": table("wa-fresh") },
});

export default definition;
