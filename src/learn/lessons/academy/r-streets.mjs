// Rules 6, The Four Betting Rounds (r-streets), v2 lesson. The film has no yourTurn anchor; the
// guided hand is its hook: heads-up, you raised on the button and the big blind called, so who
// speaks first on the flop? Practice is the plan's Transfer (small blind, big blind and cutoff see
// a flop); the fresh hand changes the seats (under the gun, the cutoff and the button).
// Keys: answerKeys/r-streets.mjs (package root, not shipped).
import { bands, huHand, options, ringHand, seatsHU, v2Lesson, v2Stages } from "./kitEarly.mjs";

// A six-handed hand played from the deal: the blinds, the preflop action that leaves exactly the
// seats the question names, then the flop. The table shows who folded and the pot they built.
const flopRing = (id, { position, hero, flop, preflop }) => {
  const hand = ringHand(id, { position, hero, blinds: [5, 10], acts: preflop });
  const decide = hand.script.pop();
  hand.script.push({ do: "street", cards: flop }, decide);
  return hand;
};

const spots = {
  "st-guided": {
    decision: "estimate", street: "flop", hero: ["Ah", "Jc"], board: ["Ks", "7d", "2c"],
    bands: bands(["you", "You: you bet last"], ["andy", "Ace Andy, the big blind"]), dockPrompt: "Who acts first on the flop?",
    title: "Who speaks first?",
    prompt: "Heads-up. You raised to 30 on the button and Ace Andy called from the big blind. The flop is K♠ 7♦ 2♣, with 60 in the pot. Who acts first?",
    hint: "After the flop, the order follows the seats. Start at the button and move left.",
    explanation: "The big blind acts first on the flop, and you, on the button, act last. Who bet last does not matter: the seats set the order.",
  },
  "st-practice": {
    decision: "estimate", street: "flop", hero: ["9h", "9d"], board: ["Qc", "8s", "4h"],
    bands: bands(["sb", "The small blind"], ["bb", "The big blind"], ["co", "The cutoff (you)"]), dockPrompt: "Who acts first on the flop?",
    title: "Three players see a flop.",
    prompt: "Six-handed. The small blind, the big blind and you in the cutoff see the flop: Q♣ 8♠ 4♥. Who acts first?",
    hint: "Start at the button and move left. The first seat still in the hand acts first.",
    explanation: "The small blind is the first seat left of the button, so it acts first, then the big blind, then you in the cutoff.",
  },
  "st-fresh": {
    decision: "estimate", street: "flop", hero: ["Ac", "Td"], board: ["Jh", "6c", "3s"],
    bands: bands(["utg", "Under the gun"], ["co", "The cutoff"], ["btn", "The button (you)"]), dockPrompt: "Who acts first on the flop?",
    title: "New seats.",
    prompt: "Six-handed. Under the gun, the cutoff and you on the button see the flop: J♥ 6♣ 3♠. Both blinds folded. Who acts first?",
    hint: "The blinds are out of the hand. Start at the button, move left, and find the first seat still in.",
    explanation: "With both blinds folded, under the gun is the first seat left of the button still in the hand, so it acts first. You, on the button, act last.",
  },
};

const definition = v2Lesson({
  node: "r-streets", film: "r-streets", coach: "knox", access: "free", track: "How a Hand Plays", minutes: 3,
  title: "Four rounds, one order.", kicker: "Seats decide, not the last bet.",
  assumptions: "Hold’em has four betting rounds: preflop, flop, turn and river. Heads-up the button acts first before the flop; after the flop, on every street, the first seat left of the button still in the hand acts first.",
  stages: v2Stages({
    welcome: { heading: "Who speaks first?", em: "You, or them?", lead: "Watch Knox walk the four rounds, then name who acts first at three tables.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s hand", film: "r-streets", at: null, spot: spots["st-guided"] },
    hands: [
      { id: "st-guided", label: "Knox’s flop", coachLine: "The film’s flop. Who acts?" },
      { id: "st-practice", label: "Practice", coachLine: "More players, same rule." },
      { id: "st-fresh", label: "Fresh hand", coachLine: "New seats in the hand." },
    ],
    why: { prompt: "Why does Ace Andy act first on the flop?",
      options: options(
        ["a", "The big blind always acts first, on every street.", "Not before the flop: heads-up, the button acts first preflop."],
        ["b", "After the flop the first seat left of the button acts first, whoever bet last.", "Right. Seats set the order after the flop, whoever bet last."],
        ["c", "The player who bet last acts first on the next street.", "Who bet last doesn’t matter: after the flop, the first seat left of the button acts first."]) },
    takeaway: { heading: "Four rounds, one order.",
      lead: "After the flop, the first seat left of the button acts first, every street, whoever bet last.",
      ruleCard: { lines: ["AFTER THE FLOP, LEFT OF", "THE BUTTON ACTS FIRST."], sub: "Every street, whoever bet last." } },
  }),
  spots,
  hands: {
    "st-guided": huHand("st-guided", { hero: ["Ah", "Jc"], board: ["Ks", "7d", "2c"], pot: 60, seats: seatsHU("Ace Andy", 970, 970) }),
    // Under the gun and middle position fold, you raise to 30 in the cutoff, the button folds and both
    // blinds call: 90 in the pot, three seats see the flop.
    "st-practice": flopRing("st-practice", { position: "CO", hero: ["9h", "9d"], flop: ["Qc", "8s", "4h"], preflop: [
      { seat: "UTG", action: "fold" }, { seat: "MP", action: "fold" }, { seat: "hero", action: "raise", to: 30 },
      { seat: "BTN", action: "fold" }, { seat: "SB", action: "call" }, { seat: "BB", action: "call" }] }),
    // Under the gun raises to 30, middle position folds, the cutoff and you on the button call, and both
    // blinds fold: 105 in the pot, three seats see the flop.
    "st-fresh": flopRing("st-fresh", { position: "BTN", hero: ["Ac", "Td"], flop: ["Jh", "6c", "3s"], preflop: [
      { seat: "UTG", action: "raise", to: 30 }, { seat: "MP", action: "fold" }, { seat: "CO", action: "call" },
      { seat: "hero", action: "call" }, { seat: "SB", action: "fold" }, { seat: "BB", action: "fold" }] }),
  },
});

export default definition;
