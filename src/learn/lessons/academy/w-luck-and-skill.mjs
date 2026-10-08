// Welcome 3, Luck Decides a Hand, Skill Decides a Thousand (w-luck-and-skill, film w-luck), v2
// lesson. The film has no yourTurn anchor; the guided hand asks the film's own count: A♣ J♦
// against Ace Andy's Q♥ 9♥ on J♥ T♥ 4♣ 2♠, both all-in for 500, and of the 44 rivers 26 win for
// you. Practice is the film's average; the fresh hand is the plan's Transfer with a changed size
// (300 each) and a changed river (the K♦): a loss shown as a result first. Results never grade
// the decision. Keys: answerKeys/w-luck-and-skill.mjs (package root, not shipped).
import { bands, huHand, options, seatsHU, v2Lesson, v2Stages } from "./kitEarly.mjs";

const SPOT = { street: "turn", hero: ["Ac", "Jd"], board: ["Jh", "Th", "4c", "2s"], versus: ["Qh", "9h"] };

const spots = {
  "wl-guided": {
    decision: "count", ...SPOT, range: [0, 44], unit: "rivers",
    title: "Count every river.",
    prompt: "You hold A♣ J♦, top pair. Ace Andy is all-in with Q♥ 9♥ and you called: the pot is 1,000. 44 cards could come on the river. How many of them win for you?",
    hint: "He wins with any heart, a king or an eight for his straight, or a queen. Count his cards first, then take them from 44.",
    explanation: "His 18 are the 9 hearts, the 3 other kings, the 3 other eights and the 3 other queens. Every other river, 26 of the 44, wins for you.",
    focus: ["Qh", "9h"],
  },
  "wl-practice": {
    decision: "estimate", ...SPOT,
    bands: bands(["loss", "−500 chips, like this hand"], ["avg", "About +91 chips"], ["win", "+500 chips"]),
    dockPrompt: "This call, made again and again, earns on average…",
    title: "Play it a thousand times.",
    prompt: "The river is the 7♥: Ace Andy makes a flush and wins this hand. You win 26 of the 44 rivers. Made again and again, what does this call earn you on average, per hand?",
    hint: "Take your share of the 1,000 pot, 26 out of 44, then take away the 500 you put in.",
    explanation: "1,000 × 26 ÷ 44 is about 591 back for your 500: about +91 chips a hand on average. This hand lost; the call still earns.",
  },
  "wl-fresh": {
    decision: "estimate", ...SPOT,
    bands: bands(["mistake", "Yes: Ace Andy won the hand"], ["no", "No: 26 of 44 rivers still win for you"]),
    dockPrompt: "Was getting all-in a mistake?",
    title: "A loss, shown first.",
    prompt: "Same cards, smaller stakes: you are both all-in for 300, so the pot is 600. The river is the K♦ and Ace Andy makes a straight. Was getting all-in a mistake?",
    hint: "Judge the decision by every river that could have come, not by the one that did.",
    explanation: "The K♦ is one of his 18 rivers. 26 of the 44 still win for you, so the call earns about 600 × 26 ÷ 44 − 300, roughly +55 chips a hand on average. Losing this hand did not make it wrong.",
  },
};

const definition = v2Lesson({
  node: "w-luck-and-skill", film: "w-luck", coach: "ada", access: "free", track: "Welcome to Poker", minutes: 4,
  title: "Luck decides a hand.", kicker: "Skill decides a thousand.",
  assumptions: "Heads-up, both players all-in on the turn, so no more betting follows and both hands are shown. The river counts are exact: all 44 unseen cards, each once, with no ties. Averages are over many repeats of this same spot.",
  stages: v2Stages({
    welcome: { heading: "Did you play it wrong?", em: "Not necessarily.", lead: "You got your chips in ahead and lost. Watch every river, then count it yourself.", cta: "Watch with Ada" },
    film: { upNext: "Play Ada’s hand", film: "w-luck", at: null, spot: spots["wl-guided"] },
    hands: [
      { id: "wl-guided", label: "Ada’s hand", coachLine: "The film’s all-in. Count the rivers." },
      { id: "wl-practice", label: "Practice", coachLine: "One hand lost. Now the average." },
      { id: "wl-fresh", label: "Fresh hand", coachLine: "New stakes, a new river." },
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
    "wl-guided": huHand("wl-guided", { hero: SPOT.hero, board: SPOT.board, pot: 1000, seats: seatsHU("Ace Andy", 500, 500) }),
    "wl-practice": huHand("wl-practice", { hero: SPOT.hero, board: SPOT.board, pot: 1000, seats: seatsHU("Ace Andy", 500, 500) }),
    "wl-fresh": huHand("wl-fresh", { hero: SPOT.hero, board: SPOT.board, pot: 600, seats: seatsHU("Ace Andy", 700, 700) }),
  },
});

export default definition;
