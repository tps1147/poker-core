// Welcome 1, What Poker Really Is (w-what-is-poker), v2 lesson. Ada's film has no yourTurn anchor,
// so it plays to its stop point and the guided hand asks the film's own showdown: K♥ Q♥ against
// A♣ J♦ on J♥ T♣ 4♥ 2♠ 9♦, your straight against their pair of jacks. Practice is a second
// showdown; the fresh hand is the plan's Transfer, the other way to win: everyone else folds.
// Keys: answerKeys/w-what-is-poker.mjs (package root, not shipped). No imports beyond the shared kit.
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const WHO = bands(["you", "You"], ["andy", "Ace Andy"], ["split", "Split pot"]);
const guided = { hero: ["Kh", "Qh"], board: ["Jh", "Tc", "4h", "2s", "9d"], versus: ["Ac", "Jd"] };
const practice = { hero: ["8s", "8d"], board: ["Ad", "8h", "3c", "Qs", "5h"], versus: ["Ah", "Kc"] };
const fresh = { hero: ["7c", "6c"], board: ["Kd", "9s", "4c", "2h"] };

const spots = {
  "wip-guided": {
    decision: "estimate", street: "river", ...guided, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "The hand goes all the way. Who wins?",
    prompt: "You hold K♥ Q♥. Ace Andy holds A♣ J♦. The board is J♥ T♣ 4♥ 2♠ 9♦. At showdown the best five cards win. Who takes the pot?",
    hint: "Find each player’s best five from their two cards and the five on the board. Look for five ranks in a row.",
    explanation: "King, queen, jack, ten and nine are five in a row: a straight. Ace Andy has a pair of jacks with an ace. A straight beats a pair, so you win this one.",
  },
  "wip-practice": {
    decision: "estimate", street: "river", ...practice, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "Another showdown. Who wins?",
    prompt: "You hold 8♠ 8♦. Ace Andy holds A♥ K♣. The board is A♦ 8♥ 3♣ Q♠ 5♥. Who takes the pot?",
    hint: "Ace Andy pairs the ace on the board. How many eights can you count?",
    explanation: "Your two eights and the 8♥ make three eights. Ace Andy has a pair of aces with a king. Three of a kind beats one pair, so you win.",
  },
  "wip-fresh": {
    decision: "estimate", street: "turn", ...fresh, potBefore: 120, bet: 60, call: 60,
    bands: bands(["andy", "Ace Andy, without showing"], ["show", "Nobody yet: he must show to win"], ["split", "Split pot"]),
    dockPrompt: "If you fold here, who takes the pot?",
    title: "The other way to win.",
    prompt: "A new hand. Ace Andy bets 60 into 120 on the turn, and you are thinking of folding 7♣ 6♣. If you fold, his cards stay face down. Who takes the pot?",
    hint: "A pot is won in two ways: the best five at showdown, or everyone else folding.",
    explanation: "When everyone else folds, the last player in wins the pot without showing a card. Ace Andy never needed the best hand here, only a fold.",
  },
};

const definition = v2Lesson({
  node: "w-what-is-poker", film: "w-what-is-poker", coach: "knox", access: "free", track: "Welcome to Poker", minutes: 3,
  title: "What decides who wins?", kicker: "The cards, or the decisions.",
  assumptions: "Heads-up. At showdown the best five cards of the seven each player can use win the pot; a pot can also be won when everyone else folds. The opponent’s cards are shown in the question when the hand reaches showdown.",
  stages: v2Stages({
    welcome: { heading: "What decides who wins?", em: "Hold that thought.", lead: "Watch Knox deal one hand all the way, then read three hands at the table.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s hand", film: "w-what-is-poker", at: null, spot: spots["wip-guided"] },
    hands: [
      { id: "wip-guided", label: "Knox’s hand", coachLine: "Knox’s showdown. You read it." },
      { id: "wip-practice", label: "Practice", coachLine: "Same idea, new cards." },
      { id: "wip-fresh", label: "Fresh hand", coachLine: "No showdown this time." },
    ],
    why: { prompt: "Over hundreds of hands, what takes the chips?",
      options: options(
        ["a", "Being dealt better cards than everyone else.", "Everyone is dealt the same cards over time. Cards decide one hand; decisions decide a thousand."],
        ["b", "Better decisions: any single hand can go either way.", "Right. Any one hand can go either way; over hundreds, the better decisions take the chips."],
        ["c", "Always holding the best five at showdown.", "You also win when everyone else folds, without showing a thing."]) },
    takeaway: { heading: "Decisions decide a thousand.",
      lead: "One hand can go either way. Over hundreds of hands, better decisions take the chips, at a showdown or when everyone else folds.",
      ruleCard: { lines: ["better decisions take the chips.", "That's what Flop52 teaches you,", "one idea at a time."], sub: null } },
  }),
  spots,
  hands: {
    "wip-guided": huHand("wip-guided", { hero: guided.hero, board: guided.board, versus: guided.versus, pot: 200 }),
    "wip-practice": huHand("wip-practice", { hero: practice.hero, board: practice.board, versus: practice.versus, pot: 160 }),
    "wip-fresh": huHand("wip-fresh", { hero: fresh.hero, board: fresh.board, pot: 120, acts: [{ seat: "opponent", action: "bet", amount: 60 }] }),
  },
});

export default definition;
