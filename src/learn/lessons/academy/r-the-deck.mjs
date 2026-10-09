// Rules 1, The Deck: 52 Cards (r-the-deck), v2 lesson (content version 2). The film has no yourTurn
// anchor: it asks its own question (A♠ K♦ against A♥ K♣ on Q♥ J♦ T♣ 4♠ 3♥, the same straight, a
// split) and answers it, so the lesson does not re-ask it (`turnSpot`, endAsk "skip"). The guided
// hand follows that idea on new cards: K♠ J♦ against K♥ J♣ on K♦ 8♣ 8♥ 5♠ 2♣, the same two pair
// and kicker, a split. Practice is the plan's Transfer card (9♣ or 9♦: equal); the fresh hand is the
// plan's fresh Checks spot, Q♦ J♥ T♠ 4♣ 2♦ with K♥ 9♣ against K♠ 9♦, a split with a changed straight.
// Keys: answerKeys/r-the-deck.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const WHO = bands(["you", "You"], ["andy", "Ace Andy"], ["split", "Split pot"]);
const film = { street: "river", hero: ["As", "Kd"], board: ["Qh", "Jd", "Tc", "4s", "3h"], versus: ["Ah", "Kc"] };
const guided = { street: "river", hero: ["Ks", "Jd"], board: ["Kd", "8c", "8h", "5s", "2c"], versus: ["Kh", "Jc"] };
const practice = { street: "preflop", hero: ["9c", "9d"] };
const fresh = { street: "river", hero: ["Kh", "9c"], board: ["Qd", "Jh", "Ts", "4c", "2d"], versus: ["Ks", "9d"] };

// The film's own question (asked and answered in the film).
const turnSpot = {
  decision: "estimate", ...film, bands: WHO, dockPrompt: "Who wins at showdown?",
  title: "Whose ace is better?",
  prompt: "Your A♠ K♦ against Ace Andy’s A♥ K♣. The board is Q♥ J♦ T♣ 4♠ 3♥. Who wins the 200 pot?",
  hint: "Build each best five first. Then ask whether anything but the ranks could break a tie.",
  explanation: "You both make the same straight, ace down to ten. Your spade does not beat his heart: no suit outranks another, so the pot splits, 100 each.",
};

const spots = {
  "dk-guided": {
    decision: "estimate", ...guided, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "Two kings, two suits.",
    prompt: "You hold K♠ J♦. Ace Andy holds K♥ J♣. The board is K♦ 8♣ 8♥ 5♠ 2♣. Who takes the 120 pot?",
    hint: "Build each best five. If the ranks match card for card, does the suit of a king change anything?",
    explanation: "You both play K-K-8-8-J: kings and eights with a jack. Your spade king does not beat his heart king, so the pot splits, 60 each.",
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
  node: "r-the-deck", version: 2, film: "r-the-deck", coach: "knox", access: "free", track: "How a Hand Plays", minutes: 3,
  title: "Ranks decide.", kicker: "Thirteen ranks, four suits.",
  assumptions: "Hold’em with one 52-card deck: four suits of thirteen ranks, no jokers. Suits never break a tie; they only matter for a flush. Showdown hands are shown in the question.",
  stages: v2Stages({
    welcome: { heading: "Whose ace is better?", em: "Spades, hearts, or neither?", lead: "Watch Knox sort the deck, then read three cards and showdowns at the table.", cta: "Watch with Knox" },
    film: { upNext: "Read a new showdown", film: "r-the-deck", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "dk-guided", label: "Two kings", coachLine: "Same ranks, new suits. Read it." },
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
    "dk-guided": huHand("dk-guided", { hero: guided.hero, board: guided.board, versus: guided.versus, pot: 120 }),
    "dk-practice": huHand("dk-practice", { hero: practice.hero, pot: 0, blinds: [5, 10] }),
    "dk-fresh": huHand("dk-fresh", { hero: fresh.hero, board: fresh.board, versus: fresh.versus, pot: 160 }),
  },
});

export default definition;
