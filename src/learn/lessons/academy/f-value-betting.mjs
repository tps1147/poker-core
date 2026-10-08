// Postflop 5, Value Betting (f-value-betting), v2 lesson. Vale's film pauses at its yourTurn anchor
// (70.02 s, "Same river, one change: now he only calls with two pair or better") for an ungraded
// guess; the guided hand plays that same river (A♥ J♦ on J♣ 9♠ 5♦ 3♥ 2♣, pot 200: every caller
// beats you, so check). Practice is the film's main spot (calls with nines or better: 38 of 54 worse,
// bet); the fresh hand is a thinner river with a changed size and count, where checking is right.
// Caller counts are given illustrations, never a read. Keys: answerKeys/f-value-betting.mjs (package root, not shipped).
import { huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const RIVER = { street: "river", hero: ["Ah", "Jd"], board: ["Jc", "9s", "5d", "3h", "2c"], potBefore: 200, bet: 0, call: 0 };
const fresh = { street: "river", hero: ["Ks", "Qd"], board: ["Kh", "8c", "6d", "4s", "2h"], potBefore: 150, bet: 0, call: 0 };
const BET = (amount) => ({ bet: amount });

const spots = {
  "vb-guided": {
    decision: "action", choices: ["check", "bet"], ...RIVER, sizes: BET(100),
    title: "Your turn: one change.",
    prompt: "Same river: A♥ J♦ on J♣ 9♠ 5♦ 3♥ 2♣, pot 200, and he checks to you. One change, given: he now calls 100 only with two pair or better. Check, or bet 100?",
    hint: "Sort the hands that call first. How many of them are worse than your top pair?",
    explanation: "Two pair or better all beat top pair, so every hand that calls beats you and every worse hand folds. A bet only loses chips: check.",
  },
  "vb-practice": {
    decision: "action", choices: ["check", "bet"], ...RIVER, sizes: BET(100),
    title: "Check and hope, or bet?",
    prompt: "A♥ J♦ on J♣ 9♠ 5♦ 3♥ 2♣, pot 200, and he checks. Given: he calls 100 with a pair of nines or better, 54 hands, and 38 of them are worse than yours, 1 ties and 15 beat you. Check, or bet 100?",
    hint: "Compare the worse callers with half of all the callers.",
    explanation: "38 of the 54 callers are worse: 70.4%, more than half, so bet. Ignoring raises, 38 × 100 won against 15 × 100 lost is +2,300 over those calls, about 42.6 a call. A check wins nothing more from the 38.",
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
  node: "f-value-betting", film: "f-value-betting", coach: "knox", access: "pro", track: "Postflop", minutes: 4,
  title: "Bet when worse hands call.", kicker: "Not to trap. Not to hope.",
  assumptions: "Heads-up on the river; he checks to you. Which hands call is given for each exercise as an illustration, never a read of his cards, and raises are ignored. A value bet earns when more than half of the hands that call are worse than yours.",
  feedback: { found: "That’s the value read.", missed: "Let’s sort the callers.", open: "Here’s the thinking." },
  stages: v2Stages({
    welcome: { heading: "Top pair on the river.", em: "Check and hope, or bet?", lead: "Watch Knox sort the hands that call, then decide three rivers at the table.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s river", film: "f-value-betting", at: 70.02, spot: spots["vb-guided"] },
    hands: [
      { id: "vb-guided", label: "Knox’s river", coachLine: "The film’s one change. Your call." },
      { id: "vb-practice", label: "Practice", coachLine: "The film’s first river." },
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
    "vb-guided": huHand("vb-guided", { hero: RIVER.hero, board: RIVER.board, pot: 200, acts: [{ seat: "opponent", action: "check" }], answer: { sizes: BET(100) } }),
    "vb-practice": huHand("vb-practice", { hero: RIVER.hero, board: RIVER.board, pot: 200, acts: [{ seat: "opponent", action: "check" }], answer: { sizes: BET(100) } }),
    "vb-fresh": huHand("vb-fresh", { hero: fresh.hero, board: fresh.board, pot: 150, acts: [{ seat: "opponent", action: "check" }], answer: { sizes: BET(75) } }),
  },
});

export default definition;
