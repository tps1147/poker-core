// Board 1, Made Hands and Draws (b-made-vs-draw), v2 lesson, content version 2. The film has no
// yourTurn anchor: it asks its hook (A♥ 5♥ on K♥ 9♥ 2♣ 7♠, four hearts: a flush, or not yet?) and
// answers it itself, so the lesson skips the end ask (endAsk "skip"). `turnSpot` keeps that question.
// v2 (2026-10-09, no repeated question): guided reads a made hand with a draw on top, 9♥ 8♥ on
// 9♣ 6♥ 2♥ (a pair of nines now, four hearts still a draw); practice counts a flush draw built from
// one hole card, A♣ T♦ on K♣ 8♣ 3♣ (9 of 47); the fresh hand is the plan's Transfer, the one-gap
// draw 9♣ 7♣ on J♦ T♥ 3♠ (only an eight, 4 cards). None of them is the film's hook or its
// open-ended 8♠ 7♦ example.
// Keys: answerKeys/b-made-vs-draw.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const filmHand = { street: "turn", hero: ["Ah", "5h"], board: ["Kh", "9h", "2c", "7s"] };
const guided = { street: "flop", hero: ["9h", "8h"], board: ["9c", "6h", "2h"] };
const practice = { street: "flop", hero: ["Ac", "Td"], board: ["Kc", "8c", "3c"] };
const fresh = { street: "flop", hero: ["9c", "7c"], board: ["Jd", "Th", "3s"] };

// The film's own question (its hook, asked and answered in the film).
const turnSpot = {
  decision: "estimate", ...filmHand,
  bands: bands(["flush", "Yes, a flush"], ["draw", "Not yet: a flush draw"], ["pair", "A pair"]), dockPrompt: "What do you have right now?",
  title: "Four hearts. A flush?",
  prompt: "You hold A♥ 5♥. The board is K♥ 9♥ 2♣ 7♠: four hearts you can use. What do you have right now?",
  hint: "Count the hearts. How many cards does a flush need?",
  explanation: "Not yet. A flush needs five cards of one suit and you have four, so right now your hand is just ace high. 9 of the 46 cards you can’t see are hearts: one of those would finish it.",
  focus: ["Ah", "5h", "Kh", "9h"],
};

const spots = {
  "mv-guided": {
    decision: "estimate", ...guided,
    bands: bands(["flush", "A flush"], ["pair", "A pair of nines"], ["nothing", "Nothing yet: only a draw"]), dockPrompt: "What do you have right now?",
    title: "A pair, and four hearts.",
    prompt: "You hold 9♥ 8♥ on the flop 9♣ 6♥ 2♥. Four hearts again. What do you have right now?",
    hint: "Read the made part first. Does a hole card match a board card?",
    explanation: "A pair of nines: your 9♥ matches the 9♣, and that ranks right now. The four hearts are still only a draw on top of it. The flush needs a fifth heart.",
    focus: ["9h", "9c"],
  },
  "mv-practice": {
    decision: "count", ...practice, target: "flush", range: [0, 47], unit: "cards",
    title: "One club in your hand.",
    prompt: "You hold A♣ T♦ on K♣ 8♣ 3♣. Three clubs on the board and one in your hand. How many of the 47 unseen cards finish your flush on the next card?",
    hint: "A flush needs five clubs. Count the clubs you can see, then the clubs left in the deck.",
    explanation: "You can use four clubs: three on the board and your A♣. 13 clubs minus those 4 leaves 9 unseen: 9 cards of 47 finish it. The other 38 miss, and right now you have ace high.",
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
  node: "b-made-vs-draw", version: 2, film: "b-made-vs-draw", coach: "knox", access: "free", track: "Reading the Board", minutes: 3,
  title: "Read what you have now.", kicker: "A draw is a promise, not a hand.",
  assumptions: "A made hand already ranks; a draw needs another card. Counts are exact: every unseen card counted once, with no opponent cards known. The next card is never dealt in this lesson.",
  stages: v2Stages({
    welcome: { heading: "Do you have a flush?", em: "Yes, or not yet?", lead: "Watch Knox tell made hands from draws, then read three new hands at the table.", cta: "Watch with Knox" },
    film: { upNext: "Read a new hand", film: "b-made-vs-draw", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "mv-guided", label: "Guided hand", coachLine: "A pair, and four hearts. Read it." },
      { id: "mv-practice", label: "Practice", coachLine: "Count the flush cards." },
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
    "mv-guided": huHand("mv-guided", { hero: guided.hero, board: guided.board, pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
    "mv-practice": huHand("mv-practice", { hero: practice.hero, board: practice.board, pot: 80, acts: [{ seat: "opponent", action: "check" }] }),
    "mv-fresh": huHand("mv-fresh", { hero: fresh.hero, board: fresh.board, pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
  },
});

export default definition;
