// Board 2, The Nuts (b-the-nuts), v2 lesson, content version 2. The film has no yourTurn anchor: it
// asks its hook (A♣ K♣ on K♠ Q♦ 7♥ 4♣ 2♠: is anything better possible?) and answers it itself (three
// kings), so the lesson skips the end ask (endAsk "skip"). `turnSpot` keeps that question.
// v2 (2026-10-09, no repeated question): guided holds a set this time, 8♠ 8♦ on J♥ T♣ 8♣ 3♦, and
// the crown is a straight (Q-9), not the set; practice reads a suited flop, K♦ 9♦ 4♦, where only
// A♦ Q♦ is the nuts (the film's 9♠ 8♠ 2♦ flop is gone); the fresh hand is the plan's Transfer, a
// paired river where four of a kind is the crown.
// Keys: answerKeys/b-the-nuts.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const filmHand = { street: "river", hero: ["Ac", "Kc"], board: ["Ks", "Qd", "7h", "4c", "2s"] };
const guided = { street: "turn", hero: ["8s", "8d"], board: ["Jh", "Tc", "8c", "3d"] };
const practice = { street: "flop", hero: ["Ks", "9c"], board: ["Kd", "9d", "4d"] };
const fresh = { street: "river", hero: ["Kh", "Qc"], board: ["Jd", "8c", "3h", "3s", "Kd"] };

// The film's own question (its hook, asked and answered in the film).
const turnSpot = {
  decision: "estimate", ...filmHand,
  bands: bands(["ak", "A-K: top pair, best kicker"], ["kk", "K-K: three kings"], ["qq", "Q-Q: three queens"]), dockPrompt: "The nuts on this board",
  title: "Is anything better possible?",
  prompt: "You hold A♣ K♣ on K♠ Q♦ 7♥ 4♣ 2♠: top pair with the best kicker. Which two cards make the best hand this board allows?",
  hint: "Check for a flush and a straight first. If neither is possible, what is the highest set?",
  explanation: "No flush and no straight are possible here, so the best hand is a set, and the highest set is three kings: K-K. Your ace-king is good, but it is not the nuts.",
};

const spots = {
  "nu-guided": {
    decision: "estimate", ...guided,
    bands: bands(["jj", "J-J: three jacks"], ["q9", "Q-9: a queen-high straight"], ["97", "9-7: a jack-high straight"]), dockPrompt: "The nuts on this board",
    title: "A set. Is it the crown?",
    prompt: "You hold 8♠ 8♦ on J♥ T♣ 8♣ 3♦: a set of eights. Which two cards make the best hand this board allows?",
    hint: "Check for a straight before any set. Which two cards make five in a row with J, T and 8?",
    explanation: "Jack, ten and eight let a straight in. Nine-seven makes one to the jack, but queen-nine makes one to the queen, and nothing beats it: Q-9 is the nuts. Only two clubs show, so no flush yet. Your set is strong, but not the crown.",
  },
  "nu-practice": {
    decision: "estimate", ...practice,
    bands: bands(["kk", "K-K: three kings"], ["aq", "A♦ Q♦: the ace-high flush"], ["qj", "Q♦ J♦: a flush"]), dockPrompt: "The nuts on this flop",
    title: "Three diamonds.",
    prompt: "You hold K♠ 9♣ on K♦ 9♦ 4♦: two pair. Which two cards are the nuts right now?",
    hint: "Three of one suit on the flop: any two of that suit make a flush. Which flush is highest?",
    explanation: "Any two diamonds make a flush, and a flush beats every set. The highest is A♦ Q♦: the ace, then the queen under the board’s king. Q♦ J♦ is a flush too, but a lower one, and no straight flush is possible.",
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
  node: "b-the-nuts", version: 2, film: "b-the-nuts", coach: "knox", access: "free", track: "Reading the Board", minutes: 3,
  title: "The best this board allows.", kicker: "Recheck it every street.",
  assumptions: "The nuts is the best hand any two unseen cards can make with the board. Every answer is found by trying every two-card hand, with the cards in your own hand counted as possible too.",
  stages: v2Stages({
    welcome: { heading: "Is anything better?", em: "Nothing, or something?", lead: "Watch Knox drop every pair of cards into the slots, then find the nuts on three new boards.", cta: "Watch with Knox" },
    film: { upNext: "Find the crown", film: "b-the-nuts", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "nu-guided", label: "Guided hand", coachLine: "A set this time. Find the crown." },
      { id: "nu-practice", label: "Practice", coachLine: "Three diamonds." },
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
    "nu-guided": huHand("nu-guided", { hero: guided.hero, board: guided.board, pot: 100, acts: [{ seat: "opponent", action: "check" }] }),
    "nu-practice": huHand("nu-practice", { hero: practice.hero, board: practice.board, pot: 80, acts: [{ seat: "opponent", action: "check" }] }),
    "nu-fresh": huHand("nu-fresh", { hero: fresh.hero, board: fresh.board, pot: 160, acts: [{ seat: "opponent", action: "check" }] }),
  },
});

export default definition;
