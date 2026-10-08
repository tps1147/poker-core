// Rules 1, The Deck: 52 Cards (r-the-deck), v2 lesson. The film has no yourTurn anchor; the guided
// hand is its own showdown: A♠ K♦ against A♥ K♣ on Q♥ J♦ T♣ 4♠ 3♥, the same straight, a split.
// Practice is the plan's Transfer card (9♣ or 9♦: equal); the fresh hand is the plan's fresh
// Checks spot, Q♦ J♥ T♠ 4♣ 2♦ with K♥ 9♣ against K♠ 9♦, a split with a changed straight.
// Keys: answerKeys/r-the-deck.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const WHO = bands(["you", "You"], ["andy", "Ace Andy"], ["split", "Split pot"]);
const guided = { street: "river", hero: ["As", "Kd"], board: ["Qh", "Jd", "Tc", "4s", "3h"], versus: ["Ah", "Kc"] };
const practice = { street: "preflop", hero: ["9c", "9d"] };
const fresh = { street: "river", hero: ["Kh", "9c"], board: ["Qd", "Jh", "Ts", "4c", "2d"], versus: ["Ks", "9d"] };

const spots = {
  "dk-guided": {
    decision: "estimate", ...guided, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "Whose ace is better?",
    prompt: "Your A♠ K♦ against Ace Andy’s A♥ K♣. The board is Q♥ J♦ T♣ 4♠ 3♥. Who wins the 200 pot?",
    hint: "Build each best five first. Then ask whether anything but the ranks could break a tie.",
    explanation: "You both make the same straight, ace down to ten. Your spade does not beat his heart: no suit outranks another, so the pot splits, 100 each.",
  },
  "dk-practice": {
    decision: "estimate", ...practice,
    bands: bands(["clubs", "The 9♣"], ["diamonds", "The 9♦"], ["equal", "Neither: they are equal"]), dockPrompt: "Which nine is higher?",
    title: "Two nines.",
    prompt: "You hold 9♣ 9♦. Which of your two nines is higher?",
    hint: "In Hold’em, which part of a card decides how high it is?",
    explanation: "They are equal. Ranks decide; suits never outrank each other. Suits only matter for a flush, five cards of one suit.",
  },
  "dk-fresh": {
    decision: "estimate", ...fresh, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "New board. Same question.",
    prompt: "Your K♥ 9♣ against Ace Andy’s K♠ 9♦. The board is Q♦ J♥ T♠ 4♣ 2♦. Who wins?",
    hint: "Find the five ranks in a row. Does either hand do better than that?",
    explanation: "Both hands make the same straight, king down to nine. The suits are different and it does not matter: the pot splits.",
  },
};

const definition = v2Lesson({
  node: "r-the-deck", film: "r-the-deck", coach: "ada", access: "free", track: "How a Hand Plays", minutes: 3,
  title: "Ranks decide.", kicker: "Thirteen ranks, four suits.",
  assumptions: "Hold’em with one 52-card deck: four suits of thirteen ranks, no jokers. Suits never break a tie; they only matter for a flush. Showdown hands are shown in the question.",
  stages: v2Stages({
    welcome: { heading: "Whose ace is better?", em: "Spades, hearts, or neither?", lead: "Watch Ada sort the deck, then read three cards and showdowns at the table.", cta: "Watch with Ada" },
    film: { upNext: "Play Ada’s hand", film: "r-the-deck", at: null, spot: spots["dk-guided"] },
    hands: [
      { id: "dk-guided", label: "Ada’s showdown", coachLine: "The film’s showdown. You read it." },
      { id: "dk-practice", label: "Practice", coachLine: "Two cards, one rank." },
      { id: "dk-fresh", label: "Fresh hand", coachLine: "A new straight, a new pair of suits." },
    ],
    why: { prompt: "Why does this pot split?",
      options: options(
        ["a", "You both make the same five ranks, and suits never break a tie.", "Right. Same five ranks, and no suit beats another: split."],
        ["b", "Spades outrank hearts, so your ace should win it.", "No suit outranks another in Hold’em. Suits only matter for a flush."],
        ["c", "It splits because you both hold an ace and a king.", "Holding the same ranks isn’t why: the board makes the same straight for both of you."]) },
    takeaway: { heading: "Ranks decide.",
      lead: "52 cards: 13 ranks × 4 suits. Ranks matter. Suits only matter for flushes.",
      ruleCard: { lines: ["13 RANKS × 4 SUITS.", "RANKS DECIDE."], sub: "Suits only matter for flushes." } },
  }),
  spots,
  hands: {
    "dk-guided": huHand("dk-guided", { hero: guided.hero, board: guided.board, pot: 200 }),
    "dk-practice": huHand("dk-practice", { hero: practice.hero, pot: 0, blinds: [5, 10] }),
    "dk-fresh": huHand("dk-fresh", { hero: fresh.hero, board: fresh.board, pot: 160 }),
  },
});

export default definition;
