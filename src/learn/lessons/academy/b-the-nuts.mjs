// Board 2, The Nuts (b-the-nuts), v2 lesson. The film has no yourTurn anchor; the guided hand is its
// hook: A♣ K♣ on K♠ Q♦ 7♥ 4♣ 2♠, top pair with the best kicker, and the nuts is a set of kings.
// Practice is the film's flop 9♠ 8♠ 2♦ (a set of nines); the fresh hand is the plan's Transfer on a
// board the film does not show, a paired river where four of a kind is the crown.
// Keys: answerKeys/b-the-nuts.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const guided = { street: "river", hero: ["Ac", "Kc"], board: ["Ks", "Qd", "7h", "4c", "2s"] };
const practice = { street: "flop", hero: ["Ah", "Jd"], board: ["9s", "8s", "2d"] };
const fresh = { street: "river", hero: ["Kh", "Qc"], board: ["Jd", "8c", "3h", "3s", "Kd"] };

const spots = {
  "nu-guided": {
    decision: "estimate", ...guided,
    bands: bands(["ak", "A-K: top pair, best kicker"], ["kk", "K-K: three kings"], ["qq", "Q-Q: three queens"]), dockPrompt: "The nuts on this board",
    title: "Is anything better possible?",
    prompt: "You hold A♣ K♣ on K♠ Q♦ 7♥ 4♣ 2♠: top pair with the best kicker. Which two cards make the best hand this board allows?",
    hint: "Check for a flush and a straight first. If neither is possible, what is the highest set?",
    explanation: "No flush and no straight are possible here, so the best hand is a set, and the highest set is three kings: K-K. Your ace-king is good, but it is not the nuts.",
  },
  "nu-practice": {
    decision: "estimate", ...practice,
    bands: bands(["99", "9-9"], ["aa", "A-A"], ["t7", "T-7"]), dockPrompt: "The nuts on this flop",
    title: "A new flop.",
    prompt: "The flop is 9♠ 8♠ 2♦. Which two cards are the nuts right now?",
    hint: "Two spades are not enough for a flush yet. Can any two cards make five in a row with this flop?",
    explanation: "No flush or straight is possible yet, so the nuts is the highest set: three nines. Ten-seven makes only a draw, and aces only an overpair.",
  },
  "nu-fresh": {
    decision: "estimate", ...fresh,
    bands: bands(["33", "3-3"], ["kk", "K-K"], ["aq", "A-Q"]), dockPrompt: "The nuts on this board",
    title: "The board pairs.",
    prompt: "You hold K♥ Q♣ on J♦ 8♣ 3♥ 3♠ K♦. Which two cards make the nuts?",
    hint: "A paired board lets full houses in. Is anything above a full house possible?",
    explanation: "The pair of threes means the last two threes make four of a kind, and nothing on this board beats it. Kings full, with K-K, is second best.",
  },
};

const definition = v2Lesson({
  node: "b-the-nuts", film: "b-the-nuts", coach: "ada", access: "free", track: "Reading the Board", minutes: 3,
  title: "The best this board allows.", kicker: "Recheck it every street.",
  assumptions: "The nuts is the best hand any two unseen cards can make with the board. Every answer is found by trying every two-card hand, with the cards in your own hand counted as possible too.",
  stages: v2Stages({
    welcome: { heading: "Is anything better?", em: "Nothing, or something?", lead: "Watch Ada drop every pair of cards into the slots, then find the nuts at the table.", cta: "Watch with Ada" },
    film: { upNext: "Play Ada’s hand", film: "b-the-nuts", at: null, spot: spots["nu-guided"] },
    hands: [
      { id: "nu-guided", label: "Ada’s hand", coachLine: "The film’s top pair. Find the crown." },
      { id: "nu-practice", label: "Practice", coachLine: "A new flop, a new crown." },
      { id: "nu-fresh", label: "Fresh hand", coachLine: "A paired board." },
    ],
    why: { prompt: "Why isn’t ace-king the nuts here?",
      options: options(
        ["a", "No straight or flush is possible, so the highest set, three kings, is the best hand.", "Right. With no straight or flush possible, the highest set, three kings, is the crown."],
        ["b", "Top pair with the best kicker is always the nuts.", "Top pair can be beaten: any set beats it here, and three kings beats them all."],
        ["c", "Any set is the nuts once a flush is impossible.", "Sets rank by their card: three kings beat three queens or sevens."]) },
    takeaway: { heading: "Find the crown.",
      lead: "The nuts is the best hand this board allows. It can move with every card, so recheck it every street.",
      ruleCard: { lines: ["The nuts is the best this board allows."], sub: null } },
  }),
  spots,
  hands: {
    "nu-guided": huHand("nu-guided", { hero: guided.hero, board: guided.board, pot: 120, acts: [{ seat: "opponent", action: "check" }] }),
    "nu-practice": huHand("nu-practice", { hero: practice.hero, board: practice.board, pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
    "nu-fresh": huHand("nu-fresh", { hero: fresh.hero, board: fresh.board, pot: 160, acts: [{ seat: "opponent", action: "check" }] }),
  },
});

export default definition;
