// Rules 6, The Four Betting Rounds (r-streets), v2 lesson (content version 2). The film has no
// yourTurn anchor: it asks its own question (heads-up, you raised on the button and the big blind
// called: who speaks first on the flop?) and answers it, so the lesson does not re-ask it
// (`turnSpot`, endAsk "skip"). The guided hand follows that idea with the seats swapped and a later
// street: Ace Andy has the button, you are the big blind, he bet the flop and you called: who acts
// first on the turn (you, whoever bet last)? Practice is a three-way flop the film does not show (the
// big blind, middle position and you in the cutoff: the big blind first); the fresh hand changes the
// seats again (under the gun, the cutoff and the button, both blinds out).
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

// The film's own question (asked and answered in the film).
const turnSpot = {
  decision: "estimate", street: "flop", hero: ["Ah", "Jc"], board: ["Ks", "7d", "2c"],
  bands: bands(["you", "You: you bet last"], ["andy", "Ace Andy, the big blind"]), dockPrompt: "Who acts first on the flop?",
  title: "Who speaks first?",
  prompt: "Heads-up. You raised to 30 on the button and Ace Andy called from the big blind. The flop is K♠ 7♦ 2♣, with 60 in the pot. Who acts first?",
  hint: "After the flop, the order follows the seats. Start at the button and move left.",
  explanation: "The big blind acts first on the flop, and you, on the button, act last. Who bet last does not matter: the seats set the order.",
};

const spots = {
  "st-guided": {
    decision: "estimate", street: "turn", hero: ["Qd", "Td"], board: ["9c", "6d", "2s", "Kh"],
    bands: bands(["you", "You, in the big blind"], ["andy", "Ace Andy: he bet last"]), dockPrompt: "Who acts first on the turn?",
    title: "Seats swapped. The turn.",
    prompt: "Heads-up. Ace Andy has the button and raised to 25; you called from the big blind. He bet 30 on the flop and you called. The turn is the K♥, with 110 in the pot. Who acts first?",
    hint: "The bets on the flop don’t change the order. Start at the button and move left.",
    explanation: "You do. Ace Andy has the button, so you, in the big blind, act first on the turn and on the river. He bet last on the flop, and that changes nothing: the seats set the order.",
  },
  "st-practice": {
    decision: "estimate", street: "flop", hero: ["9h", "9d"], board: ["Qc", "8s", "4h"],
    bands: bands(["bb", "The big blind"], ["mp", "Middle position"], ["co", "The cutoff (you)"]), dockPrompt: "Who acts first on the flop?",
    title: "Three players see a flop.",
    prompt: "Six-handed. Middle position raised to 30, you called in the cutoff and the big blind called. The flop is Q♣ 8♠ 4♥. Who acts first?",
    hint: "Start at the button and move left. The first seat still in the hand acts first.",
    explanation: "The small blind folded, so the big blind is the first seat left of the button still in: it acts first, then middle position, then you in the cutoff. The raiser does not go first.",
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
  node: "r-streets", version: 2, film: "r-streets", coach: "knox", access: "free", track: "How a Hand Plays", minutes: 3,
  title: "Four rounds, one order.", kicker: "Seats decide, not the last bet.",
  assumptions: "Hold’em has four betting rounds: preflop, flop, turn and river. Heads-up the button acts first before the flop; after the flop, on every street, the first seat left of the button still in the hand acts first.",
  stages: v2Stages({
    welcome: { heading: "Who speaks first?", em: "You, or them?", lead: "Watch Knox walk the four rounds, then name who acts first at three tables.", cta: "Watch with Knox" },
    film: { upNext: "Play the turn", film: "r-streets", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "st-guided", label: "The turn", coachLine: "Seats swapped. Who acts?" },
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
    // Ace Andy on the button raised to 25 and you called (50); he bet 30 on the flop and you called: 110.
    "st-guided": huHand("st-guided", { hero: ["Qd", "Td"], board: ["9c", "6d", "2s", "Kh"], pot: 110, button: "opponent", seats: seatsHU("Ace Andy", 945, 945) }),
    // Under the gun folds, middle position raises to 30, you call in the cutoff, the button and the
    // small blind fold, and the big blind calls: 95 in the pot, three seats see the flop.
    "st-practice": flopRing("st-practice", { position: "CO", hero: ["9h", "9d"], flop: ["Qc", "8s", "4h"], preflop: [
      { seat: "UTG", action: "fold" }, { seat: "MP", action: "raise", to: 30 }, { seat: "hero", action: "call" },
      { seat: "BTN", action: "fold" }, { seat: "SB", action: "fold" }, { seat: "BB", action: "call" }] }),
    // Under the gun raises to 30, middle position folds, the cutoff and you on the button call, and both
    // blinds fold: 105 in the pot, three seats see the flop.
    "st-fresh": flopRing("st-fresh", { position: "BTN", hero: ["Ac", "Td"], flop: ["Jh", "6c", "3s"], preflop: [
      { seat: "UTG", action: "raise", to: 30 }, { seat: "MP", action: "fold" }, { seat: "CO", action: "call" },
      { seat: "hero", action: "call" }, { seat: "SB", action: "fold" }, { seat: "BB", action: "fold" }] }),
  },
});

export default definition;
