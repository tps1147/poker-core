// Postflop 5, Value Betting (f-value-betting), v2 lesson, content version 2. Vale's film pauses at
// its yourTurn anchor (70.02 s, "Same river, one change: now he only calls with two pair or better")
// for an ungraded guess: A♥ J♦ on J♣ 9♠ 5♦ 3♥ 2♣, pot 200, every caller beats you, so check.
// v2 (2026-10-09): no step replays the film's river any more. The guided hand follows the film's
// one change on a new river (Q♠ T♥ on Q♦ 9♣ 5♥ 4♠ 2♦, pot 160: he calls 80 only with a better
// queen or two pair or better, so every caller beats you: check). Practice is a new bet spot with
// given counts (A♣ 9♣ on 9♥ 7♠ 4♦ 3♣ 2♥, pot 120: 24 of 36 callers worse, bet 60); the fresh hand
// is the thinner river, where checking is right. Caller counts are given illustrations, never a
// read. Keys: answerKeys/f-value-betting.mjs (package root, not shipped).
import { huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const RIVER = { street: "river", hero: ["Ah", "Jd"], board: ["Jc", "9s", "5d", "3h", "2c"], potBefore: 200, bet: 0, call: 0 };
const guided = { street: "river", hero: ["Qs", "Th"], board: ["Qd", "9c", "5h", "4s", "2d"], potBefore: 160, bet: 0, call: 0 };
const practice = { street: "river", hero: ["Ac", "9c"], board: ["9h", "7s", "4d", "3c", "2h"], potBefore: 120, bet: 0, call: 0 };
const fresh = { street: "river", hero: ["Ks", "Qd"], board: ["Kh", "8c", "6d", "4s", "2h"], potBefore: 150, bet: 0, call: 0 };
const BET = (amount) => ({ bet: amount });

// The film's own question (its "Your turn" spot), as the film asks it.
const turnSpot = {
  decision: "action", choices: ["check", "bet"], ...RIVER, sizes: BET(100),
  title: "Your turn: one change.",
  prompt: "Same river: A♥ J♦ on J♣ 9♠ 5♦ 3♥ 2♣, pot 200, and he checks to you. One change, given: he now calls 100 only with two pair or better. Check, or bet 100?",
  hint: "Sort the hands that call first. How many of them are worse than your top pair?",
  explanation: "Two pair or better all beat top pair, so every hand that calls beats you and every worse hand folds. A bet only loses chips: check.",
};

const spots = {
  "vb-guided": {
    decision: "action", choices: ["check", "bet"], ...guided, sizes: BET(80),
    title: "Who calls a queen?",
    prompt: "Q♠ T♥ on Q♦ 9♣ 5♥ 4♠ 2♦, pot 160, and he checks to you. Given: he calls 80 only with a better queen (A-Q, K-Q, Q-J) or two pair or better. Check, or bet 80?",
    hint: "List the hands that call. Does any of them lose to Q♠ T♥?",
    explanation: "A better queen beats yours on the kicker, and two pair or better beats one pair. Every hand that calls beats you, and the worse queens fold: check.",
  },
  "vb-practice": {
    decision: "action", choices: ["check", "bet"], ...practice, sizes: BET(60),
    title: "Check and hope, or bet?",
    prompt: "A♣ 9♣ on 9♥ 7♠ 4♦ 3♣ 2♥, pot 120, and he checks. Given: 36 hands would call a bet of 60, and 24 of them are worse than yours; the other 12 beat you. Check, or bet 60?",
    hint: "Compare the worse callers with half of all the callers.",
    explanation: "24 of the 36 callers are worse: 66.7%, more than half, so bet. Ignoring raises, 24 × 60 won against 12 × 60 lost is +720 over those calls, 20 a call. A check wins nothing more from the 24.",
  },
  "vb-fresh": {
    decision: "action", choices: ["check", "bet"], ...fresh, sizes: BET(75),
    title: "A thinner river.",
    prompt: "K♠ Q♦ on K♥ 8♣ 6♦ 4♠ 2♥, pot 150, and he checks to you. Given: 40 hands would call a 75 bet, and only 18 of them are worse than yours. Check, or bet 75?",
    hint: "Is more than half of the calling hands worse than yours?",
    explanation: "18 of 40 is 45%: fewer than half of the callers are worse, so the bet loses more often than it wins when called. Check.",
  },
};

const definition = v2Lesson({
  node: "f-value-betting", version: 2, film: "f-value-betting", coach: "knox", access: "pro", track: "Postflop", minutes: 4,
  title: "Bet when worse hands call.", kicker: "Not to trap. Not to hope.",
  assumptions: "Heads-up on the river; he checks to you. Which hands call is given for each exercise as an illustration, never a read of his cards, and raises are ignored. A value bet earns when more than half of the hands that call are worse than yours.",
  feedback: { found: "That’s the value read.", missed: "Let’s sort the callers.", open: "Here’s the thinking." },
  stages: v2Stages({
    welcome: { heading: "Top pair on the river.", em: "Check and hope, or bet?", lead: "Watch Knox sort the hands that call, then decide three rivers at the table.", cta: "Watch with Knox" },
    film: { upNext: "Sort the callers", film: "f-value-betting", at: 70.02, spot: turnSpot },
    hands: [
      { id: "vb-guided", label: "Sort the callers", coachLine: "A new river. Sort the callers first." },
      { id: "vb-practice", label: "Practice", coachLine: "Count the worse callers." },
      { id: "vb-fresh", label: "Fresh hand", coachLine: "A thinner river." },
    ],
    why: { prompt: "Why check top pair here?",
      options: options(
        ["a", "Every hand that calls now beats you, so a bet only loses chips.", "Right. No worse hand calls, so a bet only loses."],
        ["b", "Check your strong hands to trap him.", "You check because no worse hand calls, not to trap. When worse hands call, you bet."],
        ["c", "Top pair is never strong enough to bet the river.", "On the film’s first river the same top pair was a bet: 38 of 54 callers were worse."]) },
    takeaway: { heading: "Sort the callers.",
      lead: "Bet when more than half of the hands that call are worse than yours. When they aren’t, check.",
      ruleCard: { lines: ["So bet when more than half the hands that call", "are worse than yours."], sub: null } },
  }),
  spots,
  hands: {
    "vb-guided": huHand("vb-guided", { hero: guided.hero, board: guided.board, pot: 160, acts: [{ seat: "opponent", action: "check" }], answer: { sizes: BET(80) } }),
    "vb-practice": huHand("vb-practice", { hero: practice.hero, board: practice.board, pot: 120, acts: [{ seat: "opponent", action: "check" }], answer: { sizes: BET(60) } }),
    "vb-fresh": huHand("vb-fresh", { hero: fresh.hero, board: fresh.board, pot: 150, acts: [{ seat: "opponent", action: "check" }], answer: { sizes: BET(75) } }),
  },
});

export default definition;
