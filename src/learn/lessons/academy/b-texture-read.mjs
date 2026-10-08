// Board 5, Board Shapes (b-texture-read), v2 lesson. The film has no yourTurn anchor; the guided hand
// is its hook: of five flops, on which could someone already have a flush (only A♥ 8♥ 3♥)?
// Practice reads the connected flop 9♣ 8♦ 7♠; the fresh hand is the plan's Transfer on a fresh
// paired flop, 6♠ 6♦ J♣, where four of a kind is already possible.
// Keys: answerKeys/b-texture-read.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const spots = {
  "tx-guided": {
    decision: "estimate", street: "preflop", hero: ["Qs", "Td"],
    bands: bands(["k72", "K♦ 7♣ 2♠"], ["kk4", "K♥ K♣ 4♦"], ["a83", "A♥ 8♥ 3♥"], ["987", "9♣ 8♦ 7♠"], ["jt4", "J♥ T♥ 4♣"]), dockPrompt: "A flush is already possible on…",
    title: "Five flops.",
    prompt: "Five flops, same deck: K♦ 7♣ 2♠, K♥ K♣ 4♦, A♥ 8♥ 3♥, 9♣ 8♦ 7♠ and J♥ T♥ 4♣. On which one could someone already have a flush?",
    hint: "A flush needs five of one suit, and a player holds only two cards.",
    explanation: "Only A♥ 8♥ 3♥: three hearts on the flop, so any two of the ten unseen hearts make a flush right now, 45 combos. J♥ T♥ 4♣ has two hearts: a flush draw, not a flush.",
  },
  "tx-practice": {
    decision: "estimate", street: "flop", hero: ["Qs", "Td"], board: ["9c", "8d", "7s"],
    bands: bands(["straight", "A straight"], ["flush", "A flush"], ["fullhouse", "A full house"]), dockPrompt: "Possible right now",
    title: "A connected flop.",
    prompt: "The flop is 9♣ 8♦ 7♠. Which of these can someone already have right now?",
    hint: "Look at the three ranks. Can two cards fill in five in a row?",
    explanation: "A straight: jack-ten, ten-six or six-five already make one: 40 combos, with your ten taking some of them. Three suits mean no flush, and an unpaired flop allows no full house.",
  },
  "tx-fresh": {
    decision: "estimate", street: "flop", hero: ["Qs", "Td"], board: ["6s", "6d", "Jc"],
    bands: bands(["quads", "Four of a kind"], ["straight", "A straight"], ["flush", "A flush"]), dockPrompt: "Possible right now",
    title: "A fresh flop.",
    prompt: "The flop is 6♠ 6♦ J♣. Which of these can someone already have right now?",
    hint: "The board is paired. What can the other two sixes do?",
    explanation: "Four of a kind: the last two sixes make it, and full houses are possible too. Three suits mean no flush, and six-six-jack is too far apart for a straight.",
  },
};

const definition = v2Lesson({
  node: "b-texture-read", film: "b-texture-read", coach: "knox", access: "free", track: "Reading the Board", minutes: 4,
  title: "Read the shape first.", kicker: "What’s possible now, and what’s coming.",
  assumptions: "A board’s shape is what the cards allow: paired, suited, connected or dry. Every “possible now” answer is found by trying every two-card hand from the unseen cards.",
  stages: v2Stages({
    welcome: { heading: "Which flops are dangerous?", em: "Pick one, or more.", lead: "Watch Knox read five flops, then read the shape of three at the table.", cta: "Watch with Knox" },
    film: { upNext: "Answer Knox’s question", film: "b-texture-read", at: null, spot: spots["tx-guided"] },
    hands: [
      { id: "tx-guided", label: "Knox’s flops", coachLine: "The film’s five flops. Find the flush." },
      { id: "tx-practice", label: "Practice", coachLine: "A connected flop." },
      { id: "tx-fresh", label: "Fresh flop", coachLine: "A paired flop." },
    ],
    why: { prompt: "Why is A♥ 8♥ 3♥ the only flop with a flush already possible?",
      options: options(
        ["a", "Every flop is equally dangerous: anything can be out there.", "Flops differ: only a three-suited flop lets a flush in right now."],
        ["b", "Two hearts on the flop are enough for a flush.", "Two hearts make a flush draw, not a flush: it needs a third."],
        ["c", "Only three cards of one suit let a player’s two cards finish a flush.", "Right. A player holds two cards, so the board must show three of the suit."]) },
    takeaway: { heading: "Read the shape first.",
      lead: "Paired, suited, connected or dry: read what’s possible now, and what’s still coming, before you read your hand.",
      ruleCard: { lines: ["So read the shape first.", "What's possible now... and what's still coming."], sub: null } },
  }),
  spots,
  hands: {
    "tx-guided": huHand("tx-guided", { hero: ["Qs", "Td"], pot: 0, blinds: [5, 10] }),
    "tx-practice": huHand("tx-practice", { hero: ["Qs", "Td"], board: ["9c", "8d", "7s"], pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
    "tx-fresh": huHand("tx-fresh", { hero: ["Qs", "Td"], board: ["6s", "6d", "Jc"], pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
  },
});

export default definition;
