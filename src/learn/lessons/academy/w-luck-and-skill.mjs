// Welcome 3, Luck Decides a Hand, Skill Decides a Thousand (w-luck-and-skill, film w-luck-and-skill, rendered as w-luck), v2
// lesson, content version 2. The film has no yourTurn anchor; it asks and answers its own count
// (A♣ J♦ against Ace Andy's Q♥ 9♥ on J♥ T♥ 4♣ 2♠, all-in for 500: 26 of 44 rivers win, about +91 a
// hand), so the lesson skips the end ask. The guided hand counts a new all-in: A♦ A♣ against 8♠ 7♠
// on K♠ 9♠ 2♦ 4♥, 220 each, where only the 9 spades lose, so 35 of 44 win. Practice takes that
// hand's average after the 3♠ river loses it: 440 × 35 ÷ 44 − 220 = +130. The fresh hand is the
// plan's Transfer on new cards and a new size: T♠ T♥ against A♣ 5♣ on 8♣ 7♦ 3♣ 2♥, 330 each, lost
// to the 9♣ yet still 29 of 44 (+105 a hand). Results never grade the decision.
// Keys: answerKeys/w-luck-and-skill.mjs (package root, not shipped).
import { bands, huHand, options, seatsHU, v2Lesson, v2Stages } from "./kitEarly.mjs";

const FILM = { street: "turn", hero: ["Ac", "Jd"], board: ["Jh", "Th", "4c", "2s"], versus: ["Qh", "9h"] };
const SPOT = { street: "turn", hero: ["Ad", "Ac"], board: ["Ks", "9s", "2d", "4h"], versus: ["8s", "7s"] };
const FRESH = { street: "turn", hero: ["Ts", "Th"], board: ["8c", "7d", "3c", "2h"], versus: ["Ac", "5c"] };

// The film's own question (it asks and answers it on screen), kept as it plays.
const turnSpot = {
  decision: "count", ...FILM, range: [0, 44], unit: "rivers",
  title: "Count every river.",
  prompt: "You hold A♣ J♦, top pair. Ace Andy is all-in with Q♥ 9♥ and you called: the pot is 1,000. 44 cards could come on the river. How many of them win for you?",
  hint: "He wins with any heart, a king or an eight for his straight, or a queen. Count his cards first, then take them from 44.",
  explanation: "His 18 are the 9 hearts, the 3 other kings, the 3 other eights and the 3 other queens. Every other river, 26 of the 44, wins for you.",
  focus: ["Qh", "9h"],
};

const spots = {
  "wl-guided": {
    decision: "count", ...SPOT, range: [0, 44], unit: "rivers",
    title: "Count a new all-in.",
    prompt: "You hold A♦ A♣. Ace Andy moves all-in on the turn with 8♠ 7♠ and you call, so the pot is 440. Of the 44 cards left, how many rivers win for you?",
    hint: "Only a spade helps him: it makes his flush. Count the spades still in the deck, then take them from 44.",
    explanation: "Four spades are out (K♠ 9♠ 8♠ 7♠), so 9 are left, and each one gives him a flush. No other card helps him. The other 35 of the 44 rivers win for you.",
    focus: ["8s", "7s"],
  },
  "wl-practice": {
    decision: "estimate", ...SPOT,
    bands: bands(["loss", "−220 chips, like this hand"], ["avg", "+130 chips"], ["win", "+220 chips"]),
    dockPrompt: "This call, made again and again, earns on average…",
    title: "Play it a thousand times.",
    prompt: "The river is the 3♠: Ace Andy makes a flush and wins this hand. You win 35 of the 44 rivers. Made again and again, what does this call earn you on average, per hand?",
    hint: "Take your share of the 440 pot, 35 out of 44, then take away the 220 you put in.",
    explanation: "440 × 35 ÷ 44 is 350 back for your 220: +130 chips a hand on average. This hand lost; the call still earns.",
  },
  "wl-fresh": {
    decision: "estimate", ...FRESH,
    bands: bands(["mistake", "Yes: Ace Andy won the hand"], ["no", "No: 29 of 44 rivers still win for you"]),
    dockPrompt: "Was getting all-in a mistake?",
    title: "A loss, shown first.",
    prompt: "A new hand. You hold T♠ T♥ and Ace Andy holds A♣ 5♣. You are both all-in for 330, so the pot is 660. The river is the 9♣ and he makes a flush. Was getting all-in a mistake?",
    hint: "Judge the decision by every river that could have come, not by the one that did.",
    explanation: "The 9♣ is one of his 15 rivers: 9 clubs, 3 aces and 3 fours for a straight. 29 of the 44 still win for you, so the call earns 660 × 29 ÷ 44 − 330, +105 chips a hand on average. Losing this hand did not make it wrong.",
  },
};

const definition = v2Lesson({
  node: "w-luck-and-skill", version: 2, film: "w-luck-and-skill", coach: "knox", access: "free", track: "Welcome to Poker", minutes: 4,
  title: "Luck decides a hand.", kicker: "Skill decides a thousand.",
  assumptions: "Heads-up, both players all-in on the turn, so no more betting follows and both hands are shown. The river counts are exact: all 44 unseen cards, each once, with no ties. Averages are over many repeats of the same spot.",
  stages: v2Stages({
    welcome: { heading: "Did you play it wrong?", em: "Not necessarily.", lead: "You got your chips in ahead and lost. Watch every river, then count a new all-in yourself.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s hand", film: "w-luck-and-skill", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "wl-guided", label: "Knox’s hand", coachLine: "A new all-in. Count the rivers." },
      { id: "wl-practice", label: "Practice", coachLine: "One hand lost. Now the average." },
      { id: "wl-fresh", label: "Fresh hand", coachLine: "New cards. The loss comes first." },
    ],
    why: { prompt: "The river is the 7♥ and Ace Andy wins. Was your call wrong?",
      options: options(
        ["a", "No: you were ahead, so you should win this hand.", "Being ahead means you win more often, not every time: 18 of the 44 rivers still lose."],
        ["b", "Yes: you lost the hand, so the call was bad.", "One result doesn’t grade a decision. Over many hands this call earns about 91 a hand."],
        ["c", "No: 26 of the 44 rivers win for you, so the call earns chips on average.", "Right. Judge the call by every river: it earns chips on average."]) },
    takeaway: { heading: "Judge the decision.",
      lead: "One hand can go either way. Judge the decision by what happens over many hands, not by this one.",
      ruleCard: { lines: ["Luck decides a hand. Skill decides a thousand."], sub: null } },
  }),
  spots,
  hands: {
    "wl-guided": huHand("wl-guided", { hero: SPOT.hero, board: SPOT.board, versus: SPOT.versus, pot: 440, seats: seatsHU("Ace Andy", 0, 0) }),
    "wl-practice": huHand("wl-practice", { hero: SPOT.hero, board: SPOT.board, versus: SPOT.versus, pot: 440, seats: seatsHU("Ace Andy", 0, 0) }),
    "wl-fresh": huHand("wl-fresh", { hero: FRESH.hero, board: FRESH.board, versus: FRESH.versus, pot: 660, seats: seatsHU("Ace Andy", 0, 0) }),
  },
});

export default definition;
