// Rules 4, Seats, Button and Blinds (r-seats-blinds), v2 lesson (content version 2). The film has no
// yourTurn anchor: it asks its own question (15 chips in the pot before a card: whose?) and answers
// it, so the lesson does not re-ask it (`turnSpot`, endAsk "skip"). The guided hand follows that idea
// with new blinds and a new seat: blinds of 10 and 20, you in the big blind, 30 in the pot: how many
// are yours? Practice moves the button: you had it last hand, so what do you post now (the small
// blind)? The fresh hand shrinks the table to two with the button moved to Ace Andy: he posts the
// small blind. The rule card is the film's own RuleCard (its canonical `rule` anchor points at the
// up-next card, an anchor-pass gap).
// Keys: answerKeys/r-seats-blinds.mjs (package root, not shipped).
import { bands, huHand, options, ringHand, v2Lesson, v2Stages } from "./kitEarly.mjs";

// The film's own question (asked and answered in the film).
const turnSpot = {
  decision: "estimate", street: "preflop", hero: ["Qd", "8s"],
  bands: bands(["house", "The house’s"], ["players", "Two players’: the blinds"]), dockPrompt: "Whose chips are the 15?",
  title: "15 chips, before any card.",
  prompt: "Six players, and you are on the button. Before anyone sees a card there are already 15 chips in the pot. Whose chips are they?",
  hint: "Look at the two seats just after the button. What did they put in?",
  explanation: "The small blind put in 5 and the big blind put in 10. They are two players’ chips, not the house’s, and whoever wins the pot takes them all.",
};

const spots = {
  "sb-guided": {
    decision: "estimate", street: "preflop", hero: ["Jc", "4d"],
    bands: bands(["ten", "10 of them"], ["twenty", "20 of them"], ["thirty", "All 30"]), dockPrompt: "How many of the 30 are yours?",
    title: "Bigger blinds, a new seat.",
    prompt: "Six players, blinds of 10 and 20, and this hand you are in the big blind. There are 30 chips in the pot before a card. How many of them are yours?",
    hint: "Two seats posted. Which one is yours, and how much did it put in?",
    explanation: "20. You posted the big blind, 20, and the small blind posted 10. The 30 still belongs to two players, and whoever wins the pot takes all of it.",
  },
  "sb-practice": {
    decision: "estimate", street: "preflop", hero: ["7c", "7h"],
    bands: bands(["nothing", "Nothing"], ["small", "The small blind, 5"], ["big", "The big blind, 10"]), dockPrompt: "What do you post this hand?",
    title: "The button moves.",
    prompt: "Six players, blinds of 5 and 10. Last hand you were on the button. The button has moved one seat clockwise. What do you post this hand?",
    hint: "After every hand the button moves one seat clockwise. Where does that leave you?",
    explanation: "The small blind, 5. The button moved to the seat on your right, so you are the first seat after it. The seat after you posts the big blind, 10.",
  },
  "sb-fresh": {
    decision: "estimate", street: "preflop", hero: ["Ks", "Td"],
    bands: bands(["you", "You"], ["andy", "Ace Andy, on the button"]), dockPrompt: "Heads-up: who posts the small blind?",
    title: "Two players, the button moved.",
    prompt: "Heads-up: only you and Ace Andy. You had the button last hand; now it has moved to him. Who posts the small blind?",
    hint: "With two players, the button takes one of the blinds. Who has the button now?",
    explanation: "Ace Andy. Heads-up, the button posts the small blind, and the button is his this hand. You post the big blind, 10, and next hand it comes back to you.",
  },
};

const definition = v2Lesson({
  node: "r-seats-blinds", version: 2, film: "r-seats-blinds", coach: "knox", access: "free", track: "How a Hand Plays", minutes: 3,
  title: "Blinds are players’ chips.", kicker: "The button moves every hand.",
  assumptions: "Blinds of 5 and 10 unless the question names others. At six-handed the two seats after the button post the blinds; heads-up the button posts the small blind. The pot always goes to a player; the house takes nothing from it here.",
  stages: v2Stages({
    welcome: { heading: "Whose chips are they?", em: "The house’s, or two players’?", lead: "Watch the button move round the table, then name the seats at the table.", cta: "Watch with Knox" },
    film: { upNext: "Count the blinds", film: "r-seats-blinds", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "sb-guided", label: "The big blind", coachLine: "Bigger blinds. Which chips are yours?" },
      { id: "sb-practice", label: "Practice", coachLine: "The button moved. Now what?" },
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
    "sb-guided": ringHand("sb-guided", { position: "BB", hero: ["Jc", "4d"], blinds: [10, 20], acts: [{ seat: "UTG", action: "fold" }, { seat: "MP", action: "fold" }, { seat: "CO", action: "fold" }] }),
    "sb-practice": ringHand("sb-practice", { position: "SB", hero: ["7c", "7h"], blinds: [5, 10], acts: [{ seat: "UTG", action: "fold" }, { seat: "MP", action: "fold" }, { seat: "CO", action: "fold" }] }),
    "sb-fresh": huHand("sb-fresh", { hero: ["Ks", "Td"], pot: 0, button: "opponent", blinds: [5, 10] }),
  },
});

export default definition;
