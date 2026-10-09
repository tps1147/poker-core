// Board 5, Board Shapes (b-texture-read), v2 lesson, content version 2. The film has no yourTurn
// anchor: it asks its hook (of five flops, on which could someone already have a flush? only
// A♥ 8♥ 3♥) and answers it, then reads 9♣ 8♦ 7♠ (48 straights) and J♥ T♥ 4♣ (draws only), so the
// lesson skips the end ask (endAsk "skip"). `turnSpot` keeps that question.
// v2 (2026-10-09, no repeated question): guided reads five new flops for a straight (only
// T♥ 9♣ 6♦, with eight-seven); practice reads a two-tone flop, 8♥ 7♥ 2♠, where both draws are
// still coming and a set is the most anyone has (the film's 9♣ 8♦ 7♠ is gone); the fresh hand is
// the plan's Transfer on a fresh paired flop, 6♠ 6♦ J♣, where four of a kind is already possible.
// Keys: answerKeys/b-texture-read.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

// The film's own question (its hook, asked and answered in the film).
const turnSpot = {
  scene: "deck",
  decision: "estimate", street: "preflop", hero: ["Qs", "Td"],
  bands: bands(["k72", "K♦ 7♣ 2♠"], ["kk4", "K♥ K♣ 4♦"], ["a83", "A♥ 8♥ 3♥"], ["987", "9♣ 8♦ 7♠"], ["jt4", "J♥ T♥ 4♣"]), dockPrompt: "A flush is already possible on…",
  title: "Five flops.",
  prompt: "Five flops, same deck: K♦ 7♣ 2♠, K♥ K♣ 4♦, A♥ 8♥ 3♥, 9♣ 8♦ 7♠ and J♥ T♥ 4♣. On which one could someone already have a flush?",
  hint: "A flush needs five of one suit, and a player holds only two cards.",
  explanation: "Only A♥ 8♥ 3♥: three hearts on the flop, so any two of the ten unseen hearts make a flush right now, 45 combos. J♥ T♥ 4♣ has two hearts: a flush draw, not a flush.",
};

const spots = {
  "tx-guided": {
    scene: "deck",
    decision: "estimate", street: "preflop", hero: ["Kd", "Jc"],
    bands: bands(["q72", "Q♥ 7♦ 2♣"], ["aa5", "A♠ A♥ 5♦"], ["k83", "K♣ 8♣ 3♣"], ["t96", "T♥ 9♣ 6♦"], ["j84", "J♦ 8♠ 4♥"]), dockPrompt: "A straight is already possible on…",
    title: "Five new flops.",
    prompt: "Five new flops: Q♥ 7♦ 2♣, A♠ A♥ 5♦, K♣ 8♣ 3♣, T♥ 9♣ 6♦ and J♦ 8♠ 4♥. On which one could someone already have a straight?",
    hint: "A player holds two cards, so three board cards must fit inside five ranks in a row.",
    explanation: "Only T♥ 9♣ 6♦: eight-seven fills it, 6-7-8-9-T, 16 combos right now. J♦ 8♠ 4♥ is too spread out, A♠ A♥ 5♦ is paired, and K♣ 8♣ 3♣ lets in a flush, not a straight.",
  },
  "tx-practice": {
    decision: "estimate", street: "flop", hero: ["Qs", "Td"], board: ["8h", "7h", "2s"],
    bands: bands(["straight", "A straight"], ["flush", "A flush"], ["set", "Three of a kind"]), dockPrompt: "Possible right now",
    title: "Two hearts, two close cards.",
    prompt: "The flop is 8♥ 7♥ 2♠. Which of these can someone already have right now?",
    hint: "Two hearts are not three. And do the three ranks fit inside five in a row?",
    explanation: "Three of a kind: a pocket pair that matches a board card, a set. Two hearts make only a flush draw, and 8-7 with a 2 makes only straight draws. Both are still coming.",
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
  node: "b-texture-read", version: 2, film: "b-texture-read", coach: "knox", access: "free", track: "Reading the Board", minutes: 4,
  title: "Read the shape first.", kicker: "What’s possible now, and what’s coming.",
  assumptions: "A board’s shape is what the cards allow: paired, suited, connected or dry. Every “possible now” answer is found by trying every two-card hand from the unseen cards.",
  stages: v2Stages({
    welcome: { heading: "Which flops are dangerous?", em: "Pick one, or more.", lead: "Watch Knox read five flops, then read new shapes at the table.", cta: "Watch with Knox" },
    film: { upNext: "Read five new flops", film: "b-texture-read", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "tx-guided", label: "Five flops", coachLine: "Five new flops. Find the straight." },
      { id: "tx-practice", label: "Practice", coachLine: "Two hearts, two close cards." },
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
    "tx-guided": huHand("tx-guided", { hero: ["Kd", "Jc"], pot: 0, blinds: [5, 10] }),
    "tx-practice": huHand("tx-practice", { hero: ["Qs", "Td"], board: ["8h", "7h", "2s"], pot: 80, acts: [{ seat: "opponent", action: "check" }] }),
    "tx-fresh": huHand("tx-fresh", { hero: ["Qs", "Td"], board: ["6s", "6d", "Jc"], pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
  },
});

export default definition;
