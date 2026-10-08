// Board 1, Made Hands and Draws (b-made-vs-draw), v2 lesson. The film has no yourTurn anchor; the
// guided hand is its hook: A♥ 5♥ on K♥ 9♥ 2♣ 7♠, four hearts: a flush, or not yet? Practice is the
// film's open-ended straight draw (8 cards finish it); the fresh hand is the plan's Transfer, the
// one-gap draw 9♣ 7♣ on J♦ T♥ 3♠ (only an eight, 4 cards).
// Keys: answerKeys/b-made-vs-draw.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const guided = { street: "turn", hero: ["Ah", "5h"], board: ["Kh", "9h", "2c", "7s"] };
const practice = { street: "flop", hero: ["8c", "7d"], board: ["6s", "5h", "Kd"] };
const fresh = { street: "flop", hero: ["9c", "7c"], board: ["Jd", "Th", "3s"] };

const spots = {
  "mv-guided": {
    decision: "estimate", ...guided,
    bands: bands(["flush", "Yes, a flush"], ["draw", "Not yet: a flush draw"], ["pair", "A pair"]), dockPrompt: "What do you have right now?",
    title: "Four hearts. A flush?",
    prompt: "You hold A♥ 5♥. The board is K♥ 9♥ 2♣ 7♠: four hearts you can use. What do you have right now?",
    hint: "Count the hearts. How many cards does a flush need?",
    explanation: "Not yet. A flush needs five cards of one suit and you have four, so right now your hand is just ace high. 9 of the 46 cards you can’t see are hearts: one of those would finish it.",
    focus: ["Ah", "5h", "Kh", "9h"],
  },
  "mv-practice": {
    decision: "count", ...practice, target: "straight", range: [0, 47], unit: "cards",
    title: "Four in a row.",
    prompt: "You hold 8♣ 7♦ on 6♠ 5♥ K♦: eight, seven, six, five, four in a row, open at both ends. How many of the 47 unseen cards finish your straight on the next card?",
    hint: "Two ranks finish it: one at each end. How many of each rank are left?",
    explanation: "A four or a nine finishes it, and four of each are unseen: 8 cards of 47. The other 39 miss, and the hand stays a draw.",
  },
  "mv-fresh": {
    decision: "count", ...fresh, target: "straight", range: [0, 47], unit: "cards",
    title: "A gap in the middle.",
    prompt: "You hold 9♣ 7♣ on J♦ T♥ 3♠. How many of the 47 unseen cards finish your straight on the next card?",
    hint: "Jack, ten, nine and seven: what is missing in the middle?",
    explanation: "Only an eight fills the gap, for J-T-9-8-7, and four eights are unseen: 4 cards. A one-gap draw has half the cards of an open-ended one.",
  },
};

const definition = v2Lesson({
  node: "b-made-vs-draw", film: "b-made-vs-draw", coach: "knox", access: "free", track: "Reading the Board", minutes: 3,
  title: "Read what you have now.", kicker: "A draw is a promise, not a hand.",
  assumptions: "A made hand already ranks; a draw needs another card. Counts are exact: every unseen card counted once, with no opponent cards known. The next card is never dealt in this lesson.",
  stages: v2Stages({
    welcome: { heading: "Do you have a flush?", em: "Yes, or not yet?", lead: "Watch Knox tell made hands from draws, then read three hands at the table.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s hand", film: "b-made-vs-draw", at: null, spot: spots["mv-guided"] },
    hands: [
      { id: "mv-guided", label: "Knox’s hand", coachLine: "The film’s four hearts. Read it." },
      { id: "mv-practice", label: "Practice", coachLine: "A straight draw this time." },
      { id: "mv-fresh", label: "Fresh hand", coachLine: "A new draw, with a gap." },
    ],
    why: { prompt: "Why isn’t it a flush yet?",
      options: options(
        ["a", "Four hearts is a flush: four of one suit is enough.", "Four of one suit is a draw. A flush needs five."],
        ["b", "A flush needs five cards of one suit, and you have four.", "Right. Four hearts is a draw: ace high right now."],
        ["c", "It is a flush if the next card is likely to be a heart.", "Only 9 of the 46 unseen cards are hearts: most next cards miss."]) },
    takeaway: { heading: "Read it right now.",
      lead: "A made hand already ranks; a draw needs another card. Before you bet, read what you have right now.",
      ruleCard: { lines: ["So before you bet, read what you have right now.", "A draw is a promise... not a hand."], sub: null } },
  }),
  spots,
  hands: {
    "mv-guided": huHand("mv-guided", { hero: guided.hero, board: guided.board, pot: 100, acts: [{ seat: "opponent", action: "check" }] }),
    "mv-practice": huHand("mv-practice", { hero: practice.hero, board: practice.board, pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
    "mv-fresh": huHand("mv-fresh", { hero: fresh.hero, board: fresh.board, pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
  },
});

export default definition;
