// Rules 8, All-Ins and Side Pots (r-all-in-side-pots), v2 lesson. The film has no yourTurn anchor;
// the guided hand is its hook: Ada all-in for 50 in a four-way 1,000 pot (Bo 150, Cy and Di 400
// each): how much can she win? Practice is the plan's worked three-way side pot; the fresh hand is
// the plan's uncalled bet with a changed size (all-in 800, called all-in for 300).
// Keys: answerKeys/r-all-in-side-pots.mjs (package root, not shipped).
import { huHand, options, seatsHU, v2Lesson, v2Stages } from "./kitEarly.mjs";

const RIVER = { street: "river", hero: ["Jh", "Jd"], board: ["Qs", "Jc", "7c", "7h", "2s"] };

const spots = {
  "ap-guided": {
    decision: "count", ...RIVER, range: [0, 1000], unit: "chips",
    title: "How much can Ada win?",
    prompt: "Four players. Ada is all-in for 50, Bo for 150, and Cy and Di put in 400 each: 1,000 in all. If Ada has the best hand, how much can she win?",
    hint: "Cut a line at Ada’s 50. Each player can put at most 50 into the pot she can win.",
    explanation: "Ada matched 50 from each of the four players: a main pot of 50 × 4 = 200. The other 800 sits in side pots she never paid into, so 200 is all she can win.",
  },
  "ap-practice": {
    decision: "count", ...RIVER, range: [0, 1000], unit: "chips",
    title: "Build the side pot.",
    prompt: "Three players. A is all-in for 100, B for 300, and C covers both and calls 300. The main pot holds 300. How big is the side pot that only B and C can win?",
    hint: "Take 100 from each player for the main pot. What is left of B’s and C’s 300?",
    explanation: "Each player puts 100 in the main pot: 300 for A, B and C. B and C each have 200 more in, so the side pot is 2 × 200 = 400. 300 + 400 is all 700.",
  },
  "ap-fresh": {
    decision: "count", street: "turn", hero: ["Ah", "Kh"], board: ["Kc", "9d", "4s", "2h"], range: [0, 1000], unit: "chips",
    title: "The chips nobody matched.",
    prompt: "You move all-in for 800. Ace Andy calls, all-in for 300. How many of your chips come straight back to you?",
    hint: "Only what he can match is in play. Count what he matched, then what is left of your 800.",
    explanation: "He can match 300, so 600 is in play: 300 each. The other 500 of your 800 was never matched, and it comes straight back to you.",
  },
};

const definition = v2Lesson({
  node: "r-all-in-side-pots", film: "r-all-in-side-pots", coach: "ada", access: "free", track: "How a Hand Plays", minutes: 4,
  title: "Win only what you matched.", kicker: "The rest is a side pot.",
  assumptions: "No rake. An all-in player can win only the chips each other player matched; the chips above form side pots for the players who paid them, and a bet nobody can match is returned.",
  stages: v2Stages({
    welcome: { heading: "How much can she win?", em: "Pick your number first.", lead: "Watch Ada cut the pot at every all-in, then count three pots yourself.", cta: "Watch with Ada" },
    film: { upNext: "Count Ada’s pot", film: "r-all-in-side-pots", at: null, spot: spots["ap-guided"] },
    hands: [
      { id: "ap-guided", label: "Ada’s pot", coachLine: "The film’s four-way pot. Count it." },
      { id: "ap-practice", label: "Practice", coachLine: "Three players, two pots." },
      { id: "ap-fresh", label: "Fresh hand", coachLine: "Your all-in this time." },
    ],
    why: { prompt: "Why can Ada win only 200?",
      options: options(
        ["a", "She wins back the 50 she put in, and no more.", "She wins her own 50 back plus 50 from each of the other three: 200."],
        ["b", "She matched 50 from each of the four players; the rest sits in side pots.", "Right. 50 from each of four players; the rest is side pots she never paid into."],
        ["c", "An all-in player with the best hand wins the whole 1,000.", "An all-in player can’t win chips she never matched: the other 800 is in side pots."]) },
    takeaway: { heading: "Win only what you matched.",
      lead: "Win only what you matched. The rest is a side pot for those who paid it.",
      ruleCard: { lines: ["WIN ONLY WHAT", "YOU MATCHED."], sub: "The rest is a side pot for those who paid it." } },
  }),
  spots,
  hands: {
    "ap-guided": huHand("ap-guided", { hero: RIVER.hero, board: RIVER.board, pot: 1000, seats: seatsHU("Ada", 600, 0) }),
    "ap-practice": huHand("ap-practice", { hero: RIVER.hero, board: RIVER.board, pot: 700, seats: seatsHU("Ada", 700, 0) }),
    "ap-fresh": huHand("ap-fresh", { hero: ["Ah", "Kh"], board: ["Kc", "9d", "4s", "2h"], pot: 100, seats: seatsHU("Ace Andy", 1000, 300) }),
  },
});

export default definition;
