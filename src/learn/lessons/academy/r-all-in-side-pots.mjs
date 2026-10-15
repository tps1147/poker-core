// Rules 8, All-Ins and Side Pots (r-all-in-side-pots), v2 lesson (content version 2). The film has no
// yourTurn anchor: it asks its own question (Ada all-in for 50 in a four-way 1,000 pot: how much can
// she win?) and answers it, so the lesson does not re-ask it (`turnSpot`, endAsk "skip"). The guided
// hand follows that idea with new stacks and the next player up: Ada all-in for 60, Bo for 200, you
// and Di 500 each (1,260 in all): how much can Bo win (660)? It is dealt on a four-seat table.
// Practice is the plan's worked three-way side pot (you are C), on a three-seat table; the fresh hand
// is the plan's uncalled bet with a changed size (all-in 800, called all-in for 300), heads-up.
// Keys: answerKeys/r-all-in-side-pots.mjs (package root, not shipped).
import { huHand, options, ringHand, seatsHU, v2Lesson, v2Stages } from "./kitEarly.mjs";

const RIVER = { street: "river", hero: ["Jh", "Jd"], board: ["Qs", "Jc", "7c", "7h", "2s"] };
const GUIDED = { street: "river", hero: ["Tc", "Td"], board: ["9h", "8s", "4d", "4c", "Ks"] };
const PRACTICE = { street: "river", hero: ["Ac", "Qc"], board: ["Kd", "Td", "6s", "5c", "3h"] };

// The film's own question (asked and answered in the film).
const turnSpot = {
  decision: "count", ...RIVER, range: [0, 1000], step: 10, unit: "chips",
  title: "How much can Ada win?",
  prompt: "Four players. Ada is all-in for 50, Bo for 150, and you and Di put in 400 each: 1,000 in all. If Ada has the best hand, how much can she win?",
  hint: "Cut a line at Ada’s 50. Each player can put at most 50 into the pot she can win.",
  explanation: "Ada matched 50 from each of the four players: a main pot of 50 × 4 = 200. The other 800 sits in side pots she never paid into, so 200 is all she can win.",
};

const spots = {
  "ap-guided": {
    decision: "count", ...GUIDED, range: [0, 1500], step: 10, unit: "chips",
    title: "How much can Bo win?",
    prompt: "Four players. Ada is all-in for 60, Bo for 200, and you and Di put in 500 each: 1,260 in all. If Bo has the best hand, how much can he win?",
    hint: "Cut a line at Ada’s 60 and another at Bo’s 200. Bo can win every layer up to his own line.",
    explanation: "The main pot is 60 from each of four players: 240. Side pot one is the next 140 from Bo, you and Di: 420. Bo is in both, so he can win 240 + 420 = 660. The last 600 is between you and Di.",
  },
  "ap-practice": {
    decision: "count", ...PRACTICE, range: [0, 1000], step: 10, unit: "chips",
    title: "Build the side pot.",
    prompt: "Three players. A is all-in for 100, B for 300, and you cover both and call 300. The main pot holds 300. How big is the side pot that only B and you can win?",
    hint: "Take 100 from each player for the main pot. What is left of B’s 300 and yours?",
    explanation: "Each player puts 100 in the main pot: 300 for A, B and you. B and you each have 200 more in, so the side pot is 2 × 200 = 400. 300 + 400 is all 700.",
  },
  "ap-fresh": {
    decision: "count", street: "turn", hero: ["Ah", "Kh"], board: ["Kc", "9d", "4s", "2h"], range: [0, 1000], step: 10, unit: "chips",
    title: "The chips nobody matched.",
    prompt: "You move all-in for 800. Ace Andy calls, all-in for 300. How many of your chips come straight back to you?",
    hint: "Only what he can match is in play. Count what he matched, then what is left of your 800.",
    explanation: "He can match 300, so 600 is in play: 300 each. The other 500 of your 800 was never matched, and it comes straight back to you.",
  },
};

const definition = v2Lesson({
  node: "r-all-in-side-pots", version: 2, film: "r-all-in-side-pots", coach: "knox", access: "free", track: "How a Hand Plays", minutes: 4,
  title: "Win only what you matched.", kicker: "The rest is a side pot.",
  assumptions: "No rake. An all-in player can win only the chips each other player matched; the chips above form side pots for the players who paid them, and a bet nobody can match is returned.",
  stages: v2Stages({
    welcome: { heading: "How much can she win?", em: "Pick your number first.", lead: "Watch the pot get cut at every all-in, then count three pots yourself.", cta: "Watch with Knox" },
    film: { upNext: "Count a new four-way pot", film: "r-all-in-side-pots", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "ap-guided", label: "Bo’s share", coachLine: "Four players, new stacks. Count Bo’s pots." },
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
    // Four seats: Ada and Bo all-in, you and Di with 500 behind after 500 each.
    "ap-guided": ringHand("ap-guided", { position: "BTN", hero: GUIDED.hero, board: GUIDED.board, pot: 1260, stack: 500,
      players: [{ name: "Ada", stack: 0 }, { name: "Bo", stack: 0 }, { name: "Di", stack: 500 }] }),
    // Three seats: A and B all-in, you (C) with 700 behind after calling 300.
    "ap-practice": ringHand("ap-practice", { position: "BTN", hero: PRACTICE.hero, board: PRACTICE.board, pot: 700, stack: 700,
      players: [{ name: "A", stack: 0 }, { name: "B", stack: 0 }] }),
    "ap-fresh": huHand("ap-fresh", { hero: ["Ah", "Kh"], board: ["Kc", "9d", "4s", "2h"], pot: 100, seats: seatsHU("Ace Andy", 800, 300) }),
  },
});

export default definition;
