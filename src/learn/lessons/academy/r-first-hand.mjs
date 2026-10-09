// Rules 9, Your First Full Hand (r-first-hand), v2 lesson (content version 2). The film has no
// yourTurn anchor; it shows the three rules prompts the hand pauses for and asks and answers the
// first one itself (who acts first before the flop, heads-up on the button), so the lesson does not
// re-ask it (`turnSpot`, endAsk "skip"). The hands are one deal against Ada: the guided hand is a new
// preflop rules check (you posted 5 on the button and Ada 10: what does a call cost? 5 more).
// Practice asks the legal buttons with nothing owed; the fresh hand asks what is in the pot with
// changed sizes (you raised to 40, Ada bets 30 on the flop, and you call). Rules facts only: poker
// choices are never graded here.
// Keys: answerKeys/r-first-hand.mjs (package root, not shipped).
import { bands, huHand, options, seatsHU, v2Lesson, v2Stages } from "./kitEarly.mjs";

const ADA = seatsHU("Ada", 1000, 1000);
const HERO = ["As", "Qd"];
const FLOP = ["Ad", "8h", "4c"];

// The film's own question (asked and answered in the film).
const turnSpot = {
  decision: "estimate", street: "preflop", hero: HERO,
  bands: bands(["you", "You, on the button"], ["ada", "Ada, in the big blind"]), dockPrompt: "Who acts first before the flop?",
  title: "Rules check: who acts first?",
  prompt: "Heads-up. You post 5, Ada posts 10, and you have the button. Who acts first before the flop?",
  hint: "Heads-up, the button posts the small blind. Where does the action start before the flop?",
  explanation: "You do. Heads-up, the button posts the small blind and acts first before the flop. After the flop it flips: Ada acts first and you act last.",
};

const spots = {
  "fh-guided": {
    decision: "estimate", street: "preflop", hero: HERO,
    bands: bands(["five", "5 more"], ["ten", "10 more"], ["zero", "Nothing: you can check"]), dockPrompt: "What does a call cost?",
    title: "Rules check: what does a call cost?",
    prompt: "The blinds are in: your 5 on the button, Ada’s 10. It’s your turn. How much more do you put in to call?",
    hint: "A call matches the biggest bet in front of you. What have you already put in?",
    explanation: "5 more. Ada’s big blind is 10 and your small blind is already 5 of it, so a call adds 5. You can’t check: you owe chips.",
  },
  "fh-practice": {
    decision: "estimate", street: "flop", hero: HERO, board: FLOP,
    bands: bands(["checkbet", "Check or bet"], ["callraise", "Call or raise"], ["checkcall", "Check or call"]), dockPrompt: "Which buttons are legal?",
    title: "Rules check: which buttons?",
    prompt: "The flop is A♦ 8♥ 4♣ and Ada checks to you. Nothing is owed. Which buttons can you press, besides fold?",
    hint: "A call matches a bet. Has anyone bet yet on this flop?",
    explanation: "Check or bet. With nothing owed there is nothing to call or raise: check costs nothing, and a bet starts the betting. Folding is allowed but gives the pot away for free.",
  },
  "fh-fresh": {
    decision: "count", street: "flop", hero: HERO, board: FLOP, potBefore: 80, bet: 30, call: 30, range: [0, 400], step: 10, unit: "chips",
    title: "Rules check: what’s in the pot?",
    prompt: "You raised to 40 before the flop and Ada called. On the flop she bets 30. If you call, how much is in the pot?",
    hint: "Before the flop you each put in 40. Then add her 30 and your 30.",
    explanation: "40 from each of you makes 80 before the flop. Her 30 and your 30 make it 140.",
  },
};

const definition = v2Lesson({
  node: "r-first-hand", version: 2, film: "r-first-hand", coach: "knox", access: "free", track: "How a Hand Plays", minutes: 4,
  title: "Your first full hand.", kicker: "Every rule in action.",
  assumptions: "Heads-up against Ada, blinds of 5 and 10, 1,000 each. The hand pauses for rules checks: what a call costs, which buttons are legal, what is in the pot. Those have right answers; your poker choices are never graded, not even by the result.",
  stages: v2Stages({
    welcome: { heading: "Ready for a full hand?", em: "Every rule is already yours.", lead: "Watch how the hand pauses for a rules check, then sit down with Ada.", cta: "Watch with Knox" },
    film: { upNext: "Sit down with Ada", film: "r-first-hand", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "fh-guided", label: "Before the flop", coachLine: "The first rules check: your call." },
      { id: "fh-practice", label: "The flop", coachLine: "Nothing owed. Which buttons?" },
      { id: "fh-fresh", label: "The pot", coachLine: "Count the chips in the middle." },
    ],
    why: { prompt: "Why do you act first before the flop?",
      options: options(
        ["a", "The big blind acts first, because it posted more.", "Heads-up the button is the small blind, and it acts first before the flop."],
        ["b", "Heads-up, the button posts the small blind and acts first before the flop.", "Right. The button posts the small blind, acts first preflop and last on every street after."],
        ["c", "You act first because you will act last after the flop too.", "After the flop the order flips: Ada acts first and you act last."]) },
    takeaway: { heading: "You can play a full hand.",
      lead: "Rules checks have right answers. Your poker choices, fold, call or raise, are yours: nobody grades them, not even the result.",
      ruleCard: { lines: ["Nobody grades them... not even the result."], sub: null } },
  }),
  spots,
  hands: {
    "fh-guided": huHand("fh-guided", { hero: HERO, pot: 0, seats: ADA, blinds: [5, 10] }),
    "fh-practice": huHand("fh-practice", { hero: HERO, board: FLOP, pot: 80, seats: seatsHU("Ada", 960, 960), acts: [{ seat: "opponent", action: "check" }] }),
    "fh-fresh": huHand("fh-fresh", { hero: HERO, board: FLOP, pot: 80, seats: seatsHU("Ada", 960, 960), acts: [{ seat: "opponent", action: "bet", amount: 30 }] }),
  },
});

export default definition;
