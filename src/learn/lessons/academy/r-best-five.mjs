// Rules 3, Your Best Five of Seven (r-best-five), v2 lesson (content version 2). The film has no
// yourTurn anchor: it asks its own question (pocket aces on a 9-8-7-6-5 board: how many of your
// cards play?) and answers it, so the lesson does not re-ask it (`turnSpot`, endAsk "skip"). The
// guided hand follows that idea on new cards: Q♣ Q♦ on a five-heart board, K♥ J♥ 9♥ 6♥ 2♥, where
// the board's flush is the best five and your queens don't play. Practice is a kicker read the film
// does not show (Q♠ 8♦ against Q♣ J♥ on Q♥ T♠ 7♦ 5♣ 3♠: his jack kicker wins); the fresh hand is the
// plan's open pick on a new seven, where exactly one of your cards plays.
// Keys: answerKeys/r-best-five.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const film = { street: "river", hero: ["Ac", "Ad"], board: ["9s", "8h", "7d", "6c", "5s"] };
const guided = { street: "river", hero: ["Qc", "Qd"], board: ["Kh", "Jh", "9h", "6h", "2h"] };
const practice = { street: "river", hero: ["Qs", "8d"], board: ["Qh", "Ts", "7d", "5c", "3s"], versus: ["Qc", "Jh"] };
const fresh = { street: "river", hero: ["Kh", "3c"], board: ["Ks", "Qd", "8h", "8c", "2s"] };

// The film's own question (asked and answered in the film).
const turnSpot = {
  decision: "best-five", previewRule: "best-five-evaluator", ...film,
  title: "Which five cards are your hand?",
  prompt: "You hold pocket aces. The board runs 9♠ 8♥ 7♦ 6♣ 5♠. Pick the five cards that make your best hand.",
  hint: "Your hand is the best five of all seven cards. Look at the board on its own first.",
  explanation: "Nine, eight, seven, six, five is a straight on the board. Nothing with your aces beats it, so your best five is the board itself: your aces don’t play.",
  focus: ["9s", "8h", "7d", "6c", "5s"],
};

const spots = {
  "b5-guided": {
    decision: "best-five", previewRule: "best-five-evaluator", ...guided,
    title: "Five hearts on the board.",
    prompt: "You hold Q♣ Q♦. The board is K♥ J♥ 9♥ 6♥ 2♥. Pick the five cards that make your best hand.",
    hint: "Check the board on its own first. Can a pair of queens beat what it already makes?",
    explanation: "The board is five hearts: a flush, king high. A pair of queens is far below a flush, and neither queen is a heart, so your best five is the board: your queens don’t play.",
    focus: ["Kh", "Jh", "9h", "6h", "2h"],
  },
  "b5-practice": {
    decision: "estimate", ...practice,
    bands: bands(["you", "You"], ["andy", "Ace Andy"], ["split", "Split pot"]), dockPrompt: "Who wins at showdown?",
    title: "Both have queens.",
    prompt: "You hold Q♠ 8♦. Ace Andy holds Q♣ J♥. The board is Q♥ T♠ 7♦ 5♣ 3♠. Who wins?",
    hint: "You both have a pair of queens. Which card comes next in each best five?",
    explanation: "Your best five is Q-Q-T-8-7; his is Q-Q-J-T-7. After the queens, his jack beats your ten, so he wins on the kicker.",
  },
  "b5-fresh": {
    decision: "best-five", previewRule: "best-five-evaluator", ...fresh,
    title: "New seven cards.",
    prompt: "You hold K♥ 3♣. The board is K♠ Q♦ 8♥ 8♣ 2♠. Pick the five cards that make your best hand.",
    hint: "Find your pairs first, then the highest card left over to fill the fifth slot.",
    explanation: "Kings and eights, two pair, with the queen as the fifth card: K♥ K♠ 8♥ 8♣ Q♦. Your king plays and your three does not: one of your cards.",
  },
};

const definition = v2Lesson({
  node: "r-best-five", version: 2, film: "r-best-five", coach: "knox", access: "free", track: "How a Hand Plays", minutes: 4,
  title: "Best five of seven.", kicker: "Two, one or none of yours.",
  assumptions: "Hold’em: your hand is the best five of the seven cards you can use, your two plus the five on the board. You may use two, one or none of your own cards. Showdown hands are shown in the question.",
  feedback: { found: "You found it.", missed: "Let’s build it together.", open: "Here’s the hand." },
  stages: v2Stages({
    welcome: { heading: "Your aces don’t play?", em: "Here’s how.", lead: "Watch Knox build the best five, then pick your own five at the table.", cta: "Watch with Knox" },
    film: { upNext: "Pick a new five", film: "r-best-five", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "b5-guided", label: "Five hearts", coachLine: "A big pair. Does it play?" },
      { id: "b5-practice", label: "Practice", coachLine: "Same pair. The kicker decides." },
      { id: "b5-fresh", label: "Fresh hand", coachLine: "A new seven. Your pick." },
    ],
    why: { prompt: "Why don’t your aces play here?",
      options: options(
        ["a", "You must use at least one of your own cards, so they should play.", "Not even one: when the board is your best five, you play the board."],
        ["b", "Your best five can use two, one or none of yours, and the board’s straight is best.", "Right. Two, one or none: here the board’s straight is the best five."],
        ["c", "You must use both of your hole cards.", "You can use any number of your cards, even zero."]) },
    takeaway: { heading: "Best five of seven.",
      lead: "Your hand is the best five of your two plus the five on the board. Use two, one or none of yours; a kicker counts only if it makes that five.",
      ruleCard: { lines: ["BEST FIVE OF SEVEN.", "TWO, ONE OR NONE."], sub: "Whatever of yours makes the best five." } },
  }),
  spots,
  hands: {
    "b5-guided": huHand("b5-guided", { hero: guided.hero, board: guided.board, pot: 180 }),
    "b5-practice": huHand("b5-practice", { hero: practice.hero, board: practice.board, versus: practice.versus, pot: 140 }),
    "b5-fresh": huHand("b5-fresh", { hero: fresh.hero, board: fresh.board, pot: 120 }),
  },
});

export default definition;
