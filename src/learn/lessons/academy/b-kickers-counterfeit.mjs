// Board 4, Kickers and Counterfeits (b-kickers-counterfeit), v2 lesson. The film has no yourTurn
// anchor; the guided hand is its hook: A♥ 3♣ against A♣ K♦ on A♠ 3♦ 9♣, and the turn 9♥ pairs the
// board. Practice is the film's extreme version (4♠ 4♦ against J♣ 2♥ on K♣ K♥ 9♦ 9♠ Q♣, a split);
// the fresh hand is the plan's Transfer, a fresh river where a pocket pair is counterfeited.
// Keys: answerKeys/b-kickers-counterfeit.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const WHO = bands(["you", "You"], ["andy", "Ace Andy"], ["split", "Split pot"]);
const guided = { street: "turn", hero: ["Ah", "3c"], board: ["As", "3d", "9c", "9h"], versus: ["Ac", "Kd"] };
const practice = { street: "river", hero: ["4s", "4d"], board: ["Kc", "Kh", "9d", "9s", "Qc"], versus: ["Jc", "2h"] };
const fresh = { street: "river", hero: ["7c", "7d"], board: ["Qh", "Qc", "Jd", "Js", "2h"], versus: ["As", "5s"] };

const spots = {
  "kc-guided": {
    decision: "estimate", ...guided, bands: WHO, dockPrompt: "Who is ahead now?",
    title: "The board pairs.",
    prompt: "You hold A♥ 3♣ and Ace Andy holds A♣ K♦. The flop was A♠ 3♦ 9♣, and you flopped two pair. The turn is the 9♥. Who is ahead now?",
    hint: "Build each best five with the turn. Which of your cards still plays?",
    explanation: "The nine pairs the board, so both best fives are aces and nines. Your pair of threes no longer counts: it is counterfeited. The fifth card decides, and his king beats your three.",
  },
  "kc-practice": {
    decision: "estimate", ...practice, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "The board plays.",
    prompt: "You hold 4♠ 4♦ and Ace Andy holds J♣ 2♥. The board is K♣ K♥ 9♦ 9♠ Q♣. Who wins?",
    hint: "Find each best five. Do your fours, or his jack, beat what the board already gives?",
    explanation: "The board’s K-K-9-9-Q is the best five for both of you: your fours don’t play and neither does his jack. It is a split.",
  },
  "kc-fresh": {
    decision: "estimate", ...fresh, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "A fresh river.",
    prompt: "You hold 7♣ 7♦ and Ace Andy holds A♠ 5♠. The board is Q♥ Q♣ J♦ J♠ 2♥. Who wins?",
    hint: "The board has two pair. Does your pair of sevens still make your best five?",
    explanation: "Both best fives are queens and jacks, so your sevens are counterfeited: only one seven can play, as the fifth card. His ace beats it, so Ace Andy wins.",
  },
};

const definition = v2Lesson({
  node: "b-kickers-counterfeit", film: "b-kickers-counterfeit", coach: "ada", access: "free", track: "Reading the Board", minutes: 4,
  title: "Do your cards still play?", kicker: "When the board pairs.",
  assumptions: "Each player’s hand is the best five of their seven cards. When the board pairs, a pair in your hand can stop counting, and the fifth card, the kicker, decides. Showdown hands are shown in the question.",
  stages: v2Stages({
    welcome: { heading: "You flop two pair, and lose.", em: "How?", lead: "Watch Ada’s two pair get counterfeited, then call three showdowns at the table.", cta: "Watch with Ada" },
    film: { upNext: "Play Ada’s hand", film: "b-kickers-counterfeit", at: null, spot: spots["kc-guided"] },
    hands: [
      { id: "kc-guided", label: "Ada’s hand", coachLine: "The film’s turn. Who’s ahead?" },
      { id: "kc-practice", label: "Practice", coachLine: "The board plays for both." },
      { id: "kc-fresh", label: "Fresh hand", coachLine: "A new paired board." },
    ],
    why: { prompt: "Why is Ace Andy ahead after the turn?",
      options: options(
        ["a", "You still win: aces and threes beat a pair of aces.", "That was the flop. With the 9♥, both best fives are aces and nines, and the fifth card decides."],
        ["b", "The paired board helps you most, because you hold two pair.", "The board’s pair helps every hand: both of you now have aces and nines."],
        ["c", "The board’s pair counterfeits your threes, and his king is the better fifth card.", "Right. Your threes no longer play, and his king beats your three."]) },
    takeaway: { heading: "Do your cards still play?",
      lead: "When the board pairs, ask: does my hand still use my cards? With the same pair, the kicker decides.",
      ruleCard: { lines: ["WHEN THE BOARD PAIRS,", "DO YOUR CARDS STILL PLAY?"], sub: "Ask it before you put more chips in." } },
  }),
  spots,
  hands: {
    "kc-guided": huHand("kc-guided", { hero: guided.hero, board: guided.board, pot: 160 }),
    "kc-practice": huHand("kc-practice", { hero: practice.hero, board: practice.board, pot: 200 }),
    "kc-fresh": huHand("kc-fresh", { hero: fresh.hero, board: fresh.board, pot: 200 }),
  },
});

export default definition;
