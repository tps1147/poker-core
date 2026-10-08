// Rules 3, Your Best Five of Seven (r-best-five), v2 lesson. The film has no yourTurn anchor; the
// guided hand is its hook: pocket aces on a 9-8-7-6-5 board, where the best five uses none of your
// cards. Practice is the plan's kicker contrast (A♥ K♦ against A♣ Q♠ on A♦ 9♠ 7♣ 4♥ 2♦); the fresh
// hand is the plan's open pick on a new seven, where exactly one of your cards plays.
// Keys: answerKeys/r-best-five.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const guided = { street: "river", hero: ["Ac", "Ad"], board: ["9s", "8h", "7d", "6c", "5s"] };
const practice = { street: "river", hero: ["Ah", "Kd"], board: ["Ad", "9s", "7c", "4h", "2d"], versus: ["Ac", "Qs"] };
const fresh = { street: "river", hero: ["Kh", "3c"], board: ["Ks", "Qd", "8h", "8c", "2s"] };

const spots = {
  "b5-guided": {
    decision: "best-five", previewRule: "best-five-evaluator", ...guided,
    title: "Which five cards are your hand?",
    prompt: "You hold pocket aces. The board runs 9♠ 8♥ 7♦ 6♣ 5♠. Pick the five cards that make your best hand.",
    hint: "Your hand is the best five of all seven cards. Look at the board on its own first.",
    explanation: "Nine, eight, seven, six, five is a straight on the board. Nothing with your aces beats it, so your best five is the board itself: your aces don’t play.",
    focus: ["9s", "8h", "7d", "6c", "5s"],
  },
  "b5-practice": {
    decision: "estimate", ...practice,
    bands: bands(["you", "You"], ["andy", "Ace Andy"], ["split", "Split pot"]), dockPrompt: "Who wins at showdown?",
    title: "Both have aces.",
    prompt: "You hold A♥ K♦. Ace Andy holds A♣ Q♠. The board is A♦ 9♠ 7♣ 4♥ 2♦. Who wins?",
    hint: "You both have a pair of aces. Which card comes next in each best five?",
    explanation: "Your best five is A-A-K-9-7; his is A-A-Q-9-7. The king kicker beats his queen, so you win.",
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
  node: "r-best-five", film: "r-best-five", coach: "knox", access: "free", track: "How a Hand Plays", minutes: 4,
  title: "Best five of seven.", kicker: "Two, one or none of yours.",
  assumptions: "Hold’em: your hand is the best five of the seven cards you can use, your two plus the five on the board. You may use two, one or none of your own cards. Showdown hands are shown in the question.",
  feedback: { found: "You found it.", missed: "Let’s build it together.", open: "Here’s the hand." },
  stages: v2Stages({
    welcome: { heading: "Your aces don’t play?", em: "Here’s how.", lead: "Watch Knox build the best five, then pick your own five at the table.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s hand", film: "r-best-five", at: null, spot: spots["b5-guided"] },
    hands: [
      { id: "b5-guided", label: "Knox’s hand", coachLine: "The film’s aces. Pick the five." },
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
    "b5-guided": huHand("b5-guided", { hero: guided.hero, board: guided.board, pot: 200 }),
    "b5-practice": huHand("b5-practice", { hero: practice.hero, board: practice.board, versus: practice.versus, pot: 160 }),
    "b5-fresh": huHand("b5-fresh", { hero: fresh.hero, board: fresh.board, pot: 120 }),
  },
});

export default definition;
