// Rules 7, Showdown and Split Pots (r-showdown), v2 lesson (content version 2). The film has no
// yourTurn anchor: it asks its own question (Ace Andy bets, everyone folds, he mucks face down: does
// he win?) and answers it, so the lesson does not re-ask it (`turnSpot`, endAsk "skip"). The guided
// hand follows that idea from the other seat: you bet the river with nine high and Ace Andy folds: do
// you have to show? Practice is a showdown the film does not show (your set of kings against his
// straight, one of his cards playing); the fresh hand is the plan's Transfer, a new showdown where the
// learner taps the winner or a split (the board's two pair, an ace kicker).
// Keys: answerKeys/r-showdown.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const WHO = bands(["you", "You"], ["andy", "Ace Andy"], ["split", "Split pot"]);
const film = { street: "flop", hero: ["8c", "6c"], board: ["Ad", "Jh", "5s"] };
const guided = { street: "river", hero: ["9s", "8s"], board: ["Kd", "Tc", "4h", "2s", "3c"] };
const practice = { street: "river", hero: ["Ks", "Kh"], board: ["5c", "6d", "7h", "8s", "Kc"], versus: ["9d", "2c"] };
const fresh = { street: "river", hero: ["As", "2d"], board: ["Qs", "Qh", "7c", "7d", "3s"], versus: ["Kh", "Jc"] };

// The film's own question (asked and answered in the film).
const turnSpot = {
  decision: "estimate", ...film, potBefore: 120, bet: 60, call: 60,
  bands: bands(["yes", "Yes: everyone else folded"], ["no", "No: he must show to win"]), dockPrompt: "If you fold, does he win?",
  title: "Can you win without showing?",
  prompt: "Ace Andy bets 60 into 120 on the flop. Say you fold, and he slides his cards into the muck face down. Does he win the pot?",
  hint: "A pot is won at a showdown, or when everyone else has folded.",
  explanation: "Yes. When everyone else folds there is no showdown: the last player in takes the pot, and nobody sees his cards.",
};

const spots = {
  "sd-guided": {
    decision: "estimate", ...guided, potBefore: 140, bet: 70,
    bands: bands(["yes", "Yes: you must show to win"], ["no", "No: he folded, the pot is yours"]), dockPrompt: "Do you have to show?",
    title: "Your bet, his fold.",
    prompt: "You missed with 9♠ 8♠ and bet 70 into 140 on the river anyway. Ace Andy folds. Do you have to show your nine high to take the pot?",
    hint: "Is there a showdown when only one player is left in the hand?",
    explanation: "No. He folded, so there is no showdown: the pot is yours and your cards can go into the muck face down. Nobody ever has to show a hand that wins by a fold.",
  },
  "sd-practice": {
    decision: "estimate", ...practice, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "Called on the river.",
    prompt: "You hold K♠ K♥. Ace Andy holds 9♦ 2♣. The board is 5♣ 6♦ 7♥ 8♠ K♣, and the pot is 240. Who wins?",
    hint: "Build each best five. Can one of his cards finish something on this board?",
    explanation: "You have three kings, but his 9♦ completes 5-6-7-8-9, a straight, and a straight beats three of a kind. One of his cards plays, and the 240 is his.",
  },
  "sd-fresh": {
    decision: "estimate", ...fresh, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "A fresh showdown.",
    prompt: "You hold A♠ 2♦. Ace Andy holds K♥ J♣. The board is Q♠ Q♥ 7♣ 7♦ 3♠. Who wins, or is it a split?",
    hint: "The board gives you both two pair. What is each player’s fifth card?",
    explanation: "Both best fives are queens and sevens; the fifth card decides. Your ace beats his king: Q-Q-7-7-A wins over Q-Q-7-7-K.",
  },
};

const definition = v2Lesson({
  node: "r-showdown", version: 2, film: "r-showdown", coach: "knox", access: "free", track: "How a Hand Plays", minutes: 3,
  title: "Fold, or the best five.", kicker: "Exact ties split.",
  assumptions: "A pot is won when everyone else folds, with no cards shown, or at showdown by the best five. Exact ties split the pot evenly. Showdown hands are shown in the question.",
  stages: v2Stages({
    welcome: { heading: "Can you win without showing?", em: "Yes, or no?", lead: "Watch three showdowns, then call the winner, or the split, at the table.", cta: "Watch with Knox" },
    film: { upNext: "Play your river", film: "r-showdown", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "sd-guided", label: "Your river", coachLine: "You bet, he folds. Show?" },
      { id: "sd-practice", label: "Practice", coachLine: "A showdown this time." },
      { id: "sd-fresh", label: "Fresh hand", coachLine: "New board. Winner or split?" },
    ],
    why: { prompt: "Why does Ace Andy win without showing?",
      options: options(
        ["a", "He had the best hand, so the pot was his anyway.", "Nobody knows his hand: the cards stayed face down. The fold decided it."],
        ["b", "You must show your cards to win, so he really should show.", "You never have to show to win: when everyone else folds, the pot is yours."],
        ["c", "Everyone else folded, so there is no showdown: the pot is his.", "Right. No showdown, no cards shown: the last player in wins."]) },
    takeaway: { heading: "Fold, or the best five.",
      lead: "Win when they fold, or with the best five at showdown. Exact ties split.",
      ruleCard: { lines: ["WIN WHEN THEY FOLD,", "OR WITH THE BEST FIVE."], sub: "Exact ties split the pot evenly." } },
  }),
  spots,
  hands: {
    "sd-guided": huHand("sd-guided", { hero: guided.hero, board: guided.board, pot: 140, acts: [{ seat: "hero", action: "bet", amount: 70 }, { seat: "opponent", action: "fold" }] }),
    "sd-practice": huHand("sd-practice", { hero: practice.hero, board: practice.board, versus: practice.versus, pot: 240 }),
    "sd-fresh": huHand("sd-fresh", { hero: fresh.hero, board: fresh.board, versus: fresh.versus, pot: 200 }),
  },
});

export default definition;
