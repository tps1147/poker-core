// Rules 4, Seats, Button and Blinds (r-seats-blinds), v2 lesson. The film has no yourTurn anchor;
// the guided hand is its hook (15 chips in the pot before a card: whose?). Practice taps the seat
// that posts the small blind at six-handed; the fresh hand is the plan's Transfer with the table
// shrunk to two (heads-up, the button posts the small blind). The rule card is the film's own
// RuleCard (its canonical `rule` anchor points at the up-next card, an anchor-pass gap).
// Keys: answerKeys/r-seats-blinds.mjs (package root, not shipped).
import { bands, huHand, options, ringHand, v2Lesson, v2Stages } from "./kitEarly.mjs";

const spots = {
  "sb-guided": {
    decision: "estimate", street: "preflop", hero: ["Qd", "8s"],
    bands: bands(["house", "The house’s"], ["players", "Two players’: the blinds"]), dockPrompt: "Whose chips are the 15?",
    title: "15 chips, before any card.",
    prompt: "Six players, and you are on the button. Before anyone sees a card there are already 15 chips in the pot. Whose chips are they?",
    hint: "Look at the two seats just after the button. What did they put in?",
    explanation: "The small blind put in 5 and the big blind put in 10. They are two players’ chips, not the house’s, and whoever wins the pot takes them all.",
  },
  "sb-practice": {
    decision: "estimate", street: "preflop", hero: ["7c", "7h"],
    bands: bands(["button", "The button"], ["next", "The seat right after the button"], ["two", "Two seats after the button"]), dockPrompt: "Who posts the small blind?",
    title: "Find the small blind.",
    prompt: "Six players, and you are on the button. Which seat posts the small blind?",
    hint: "The blinds sit in the two seats after the button, smaller first.",
    explanation: "The seat right after the button posts the small blind, 5, and the next seat posts the big blind, 10. The button itself posts nothing at a full table.",
  },
  "sb-fresh": {
    decision: "estimate", street: "preflop", hero: ["Ks", "Td"],
    bands: bands(["you", "You, on the button"], ["andy", "Ace Andy"]), dockPrompt: "Heads-up: who posts the small blind?",
    title: "Shrink the table to two.",
    prompt: "Heads-up: only you and Ace Andy. You have the button. Who posts the small blind?",
    hint: "With two players, the button takes one of the blinds.",
    explanation: "Heads-up, the button posts the small blind and Ace Andy posts the big blind. You act first before the flop and last on every street after it.",
  },
};

const definition = v2Lesson({
  node: "r-seats-blinds", film: "r-seats-blinds", coach: "knox", access: "free", track: "How a Hand Plays", minutes: 3,
  title: "Blinds are players’ chips.", kicker: "The button moves every hand.",
  assumptions: "Blinds of 5 and 10. At six-handed the two seats after the button post the blinds; heads-up the button posts the small blind. The pot always goes to a player; the house takes nothing from it here.",
  stages: v2Stages({
    welcome: { heading: "Whose chips are they?", em: "The house’s, or two players’?", lead: "Watch the button move round the table, then name the seats at the table.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s hand", film: "r-seats-blinds", at: null, spot: spots["sb-guided"] },
    hands: [
      { id: "sb-guided", label: "Knox’s table", coachLine: "The film’s 15 chips. Whose?" },
      { id: "sb-practice", label: "Practice", coachLine: "Find the small blind." },
      { id: "sb-fresh", label: "Fresh hand", coachLine: "Two players now." },
    ],
    why: { prompt: "Why are the blinds in the pot before any card?",
      options: options(
        ["a", "The button posts them, because it deals.", "At a full table the button posts nothing: the two seats after it post the blinds."],
        ["b", "Two players post their own chips so there is something to win; the winner takes them.", "Right. The blinds are players’ chips, and whoever wins the pot takes them."],
        ["c", "The blinds are a fee to the house for dealing.", "The blinds are players’ chips, not a fee: they go to whoever wins the pot."]) },
    takeaway: { heading: "Blinds are players’ chips.",
      lead: "The button moves every hand. Blinds come from players and go to whoever wins the pot. Heads-up, the button is the small blind.",
      ruleCard: { lines: ["BLINDS ARE", "PLAYERS' CHIPS."], sub: "The button moves every hand." } },
  }),
  spots,
  hands: {
    "sb-guided": ringHand("sb-guided", { position: "BTN", hero: ["Qd", "8s"], blinds: [5, 10], acts: [{ seat: "UTG", action: "fold" }, { seat: "MP", action: "fold" }, { seat: "CO", action: "fold" }] }),
    "sb-practice": ringHand("sb-practice", { position: "BTN", hero: ["7c", "7h"], blinds: [5, 10], acts: [{ seat: "UTG", action: "fold" }, { seat: "MP", action: "fold" }, { seat: "CO", action: "fold" }] }),
    "sb-fresh": huHand("sb-fresh", { hero: ["Ks", "Td"], pot: 0, blinds: [5, 10] }),
  },
});

export default definition;
