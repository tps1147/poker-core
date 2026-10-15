// Board 4, Kickers and Counterfeits (b-kickers-counterfeit), v2 lesson, content version 2. The film
// has no yourTurn anchor: it asks its hook (A♥ 3♣ against A♣ K♦ on A♠ 3♦ 9♣, then the turn 9♥:
// who is ahead?) and answers it, then shows the extreme split (4♠ 4♦ on K♣ K♥ 9♦ 9♠ Q♣), so the
// lesson skips the end ask (endAsk "skip"). `turnSpot` keeps that question.
// v2 (2026-10-09, no repeated question): guided pairs the board BELOW your second pair, K♠ 9♥
// against A♦ K♥ on K♣ 9♦ 4♠ 4♥: your nines still play and you stay ahead; practice is a new river,
// J♠ 4♥ against J♦ 6♣ on J♣ 4♦ 9♠ 9♥ Q♠, where both best fives are the board's J-J-9-9-Q (a
// split); the fresh hand is the plan's Transfer, a river where a pocket pair is counterfeited.
// Keys: answerKeys/b-kickers-counterfeit.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const WHO = bands(["you", "You"], ["andy", "Ace Andy"], ["split", "Split pot"]);
const filmHand = { street: "turn", hero: ["Ah", "3c"], board: ["As", "3d", "9c", "9h"], versus: ["Ac", "Kd"] };
const guided = { street: "turn", hero: ["Ks", "9h"], board: ["Kc", "9d", "4s", "4h"], versus: ["Ad", "Kh"] };
const practice = { street: "river", hero: ["Js", "4h"], board: ["Jc", "4d", "9s", "9h", "Qs"], versus: ["Jd", "6c"] };
const fresh = { street: "river", hero: ["7c", "7d"], board: ["Qh", "Qc", "Jd", "Js", "2h"], versus: ["As", "5s"] };

// The film's own question (its hook, asked and answered in the film).
const turnSpot = {
  decision: "estimate", ...filmHand, bands: WHO, dockPrompt: "Who is ahead now?",
  title: "The board pairs.",
  prompt: "You hold A♥ 3♣ and Ace Andy holds A♣ K♦. The flop was A♠ 3♦ 9♣, and you flopped two pair. The turn is the 9♥. Who is ahead now?",
  hint: "Build each best five with the turn. Which of your cards still plays?",
  explanation: "The nine pairs the board, so both best fives are aces and nines. Your pair of threes no longer counts: it is counterfeited. The fifth card decides, and his king beats your three.",
};

const spots = {
  "kc-guided": {
    decision: "estimate", ...guided, bands: WHO, dockPrompt: "Who is ahead now?",
    title: "A low pair on the board.",
    prompt: "Ace Andy has A♦ K♥ against your K♠ 9♥. You flopped kings and nines on K♣ 9♦ 4♠, and the 4♥ pairs the board. Who is ahead now?",
    hint: "Build each best five with the turn. Is the board’s pair above or below your nines?",
    explanation: "You still are. Your best five is kings and nines; his is kings and fours with an ace. The fours pair below your nines, so your nines still play and nothing is counterfeited.",
  },
  "kc-practice": {
    decision: "estimate", ...practice, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "The river plays.",
    prompt: "You hold J♠ 4♥, Ace Andy J♦ 6♣. You flopped two pair on J♣ 4♦ 9♠, the turn 9♥ paired the board, and the river is the Q♠. Who wins at showdown?",
    hint: "Find each best five. After the turn, which of your cards still plays? Then look at the queen.",
    explanation: "The nines counterfeited your fours, and his six led on the turn. Then the Q♠ outranks both kickers: each best five is J-J-9-9-Q, and the pot is split.",
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
  node: "b-kickers-counterfeit", version: 2, film: "b-kickers-counterfeit", coach: "knox", access: "free", track: "Reading the Board", minutes: 4,
  title: "Do your cards still play?", kicker: "When the board pairs.",
  assumptions: "Each player’s hand is the best five of their seven cards. When the board pairs, a pair in your hand can stop counting, and the fifth card, the kicker, decides. Showdown hands are shown in the question.",
  stages: v2Stages({
    welcome: { heading: "You flop two pair, and lose.", em: "How?", lead: "Watch Knox’s two pair get counterfeited, then call three new showdowns at the table.", cta: "Watch with Knox" },
    film: { upNext: "Call a new showdown", film: "b-kickers-counterfeit", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "kc-guided", label: "Guided hand", coachLine: "The board pairs low. Who’s ahead?" },
      { id: "kc-practice", label: "Practice", coachLine: "Two pair, then a river." },
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
    "kc-guided": huHand("kc-guided", { hero: guided.hero, board: guided.board, versus: guided.versus, pot: 140 }),
    "kc-practice": huHand("kc-practice", { hero: practice.hero, board: practice.board, versus: practice.versus, pot: 240 }),
    "kc-fresh": huHand("kc-fresh", { hero: fresh.hero, board: fresh.board, versus: fresh.versus, pot: 200 }),
  },
});

export default definition;
