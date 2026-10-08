// Rules 7, Showdown and Split Pots (r-showdown), v2 lesson. The film has no yourTurn anchor; the
// guided hand is its hook: Ace Andy bets, everyone folds, and he mucks face down. Practice is the
// film's split (Q♠ J♦ against Q♥ T♣ on K♣ K♦ 9♥ 9♠ A♥); the fresh hand is the plan's Transfer, a
// new showdown where the learner taps the winner or a split (the board's two pair, an ace kicker).
// Keys: answerKeys/r-showdown.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const WHO = bands(["you", "You"], ["andy", "Ace Andy"], ["split", "Split pot"]);
const guided = { street: "flop", hero: ["8c", "6c"], board: ["Ad", "Jh", "5s"] };
const practice = { street: "river", hero: ["Qs", "Jd"], board: ["Kc", "Kd", "9h", "9s", "Ah"], versus: ["Qh", "Tc"] };
const fresh = { street: "river", hero: ["As", "2d"], board: ["Qs", "Qh", "7c", "7d", "3s"], versus: ["Kh", "Jc"] };

const spots = {
  "sd-guided": {
    decision: "estimate", ...guided, potBefore: 120, bet: 60, call: 60,
    bands: bands(["yes", "Yes: everyone else folded"], ["no", "No: he must show to win"]), dockPrompt: "If you fold, does he win?",
    title: "Can you win without showing?",
    prompt: "Ace Andy bets 60 into 120 on the flop. Say you fold, and he slides his cards into the muck face down. Does he win the pot?",
    hint: "A pot is won at a showdown, or when everyone else has folded.",
    explanation: "Yes. When everyone else folds there is no showdown: the last player in takes the pot, and nobody sees his cards.",
  },
  "sd-practice": {
    decision: "estimate", ...practice, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "Called on the river.",
    prompt: "You hold Q♠ J♦. Ace Andy holds Q♥ T♣. The board is K♣ K♦ 9♥ 9♠ A♥, and the pot is 300. Who wins?",
    hint: "Build each best five. Does either player’s own card make it better than the board?",
    explanation: "The board’s K-K-9-9-A is the best five for both of you; neither queen, jack nor ten beats the ace. Same five, so the 300 splits, 150 each.",
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
  node: "r-showdown", film: "r-showdown", coach: "ada", access: "free", track: "How a Hand Plays", minutes: 3,
  title: "Fold, or the best five.", kicker: "Exact ties split.",
  assumptions: "A pot is won when everyone else folds, with no cards shown, or at showdown by the best five. Exact ties split the pot evenly. Showdown hands are shown in the question.",
  stages: v2Stages({
    welcome: { heading: "Can you win without showing?", em: "Yes, or no?", lead: "Watch three showdowns, then call the winner, or the split, at the table.", cta: "Watch with Ada" },
    film: { upNext: "Play Ada’s hand", film: "r-showdown", at: null, spot: spots["sd-guided"] },
    hands: [
      { id: "sd-guided", label: "Ada’s hand", coachLine: "The film’s fold. Who wins?" },
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
    "sd-guided": huHand("sd-guided", { hero: guided.hero, board: guided.board, pot: 120, acts: [{ seat: "opponent", action: "bet", amount: 60 }] }),
    "sd-practice": huHand("sd-practice", { hero: practice.hero, board: practice.board, pot: 300 }),
    "sd-fresh": huHand("sd-fresh", { hero: fresh.hero, board: fresh.board, pot: 200 }),
  },
});

export default definition;
