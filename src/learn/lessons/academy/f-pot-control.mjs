// Postflop 6, Pot Control and Free Cards (f-pot-control), v2 lesson. Vale's film pauses at its
// yourTurn anchor (60.81 s, "Same nines, but now you act first") for the "Your turn" spot; the guided
// hand plays that same spot out of position (your check hands him the choice: the free card is his).
// Practice is the film's in-position turn (check behind: two streets of value and a free river);
// the fresh hand changes the size: the two-street pot from a 60 flop pot.
// Keys: answerKeys/f-pot-control.mjs (package root, not shipped).
import { bands, huHand, options, seatsHU, v2Lesson, v2Stages } from "./kitEarly.mjs";

const TURN = ["Kc", "6d", "3s", "2h"];
const NINES = ["9s", "9h"];
const WHO = bands(["you", "You do"], ["him", "He does"]);

const spots = {
  "pc-guided": {
    decision: "estimate", street: "turn", hero: NINES, board: TURN, bands: WHO, dockPrompt: "If you check, who chooses?",
    title: "Your turn: now you act first.",
    prompt: "Same nines on K♣ 6♦ 3♠ 2♥, pot 200, but now you act first on the turn. If you check, who decides whether the river comes free?",
    hint: "After your check, someone still has to act on this turn.",
    explanation: "He does. Your check hands him the choice: he can bet, or check and take the river free. Out of position the free card is his, not yours.",
  },
  "pc-practice": {
    decision: "action", choices: ["check", "bet"], street: "turn", hero: NINES, board: TURN, potBefore: 200, bet: 0, call: 0, sizes: { bet: 100 },
    title: "Last to act on the turn.",
    prompt: "You bet 50 on the K♣ 6♦ 3♠ flop and he called; the pot is 200. The turn is the 2♥ and he checks to you, last to act. Check behind, or bet 100?",
    hint: "Who keeps calling a third bet with a medium pair facing it? And what does a check behind cost you on the river?",
    explanation: "Check behind. Three bets are called mostly by hands that beat your nines; two bets still get paid once by his weaker pairs. The check is a free card: the river costs nothing, and 2 nines of 46 unseen cards, about 4.3%, give you a set.",
  },
  "pc-fresh": {
    decision: "count", street: "flop", hero: ["8c", "8d"], board: ["Qh", "7s", "2c"], range: [0, 1000], unit: "chips",
    title: "Two streets, a new pot.",
    prompt: "A new hand. The flop pot is 60 and you are last to act with 8♣ 8♦. You bet half the pot on the flop, check the turn behind, and bet half the pot on the river; he calls both bets. How big is the final pot?",
    hint: "A half-pot bet that is called doubles the pot. How many times does it double here?",
    explanation: "60 + 30 + 30 is 120 after the flop; the checked turn leaves 120; 120 + 60 + 60 is 240. Two half-pot bets make the pot 4 times bigger, against 8 times for three.",
  },
};

const definition = v2Lesson({
  node: "f-pot-control", film: "f-pot-control", coach: "knox", access: "pro", track: "Postflop", minutes: 4,
  title: "Medium hand, small pot.", kicker: "Take the free card when you’re last.",
  assumptions: "Heads-up, half-pot bets, and every bet called. Which hands keep calling is the film’s illustration, never a read. A free card means the next card comes without anyone betting.",
  stages: v2Stages({
    welcome: { heading: "How big a pot do you want?", em: "Three streets, or two?", lead: "Watch Knox size a pot for a pair of nines, then play three spots at the table.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s nines", film: "f-pot-control", at: 60.81, spot: spots["pc-guided"] },
    hands: [
      { id: "pc-guided", label: "Knox’s nines", coachLine: "The film’s turn, out of position." },
      { id: "pc-practice", label: "Practice", coachLine: "Last to act this time." },
      { id: "pc-fresh", label: "Fresh hand", coachLine: "A new pot to size." },
    ],
    why: { prompt: "Why is the free card his when you act first?",
      options: options(
        ["a", "If you check first, the river always comes free.", "Only if he checks too. After your check, he decides."],
        ["b", "Checking is weak, so acting first you should always bet.", "Checking isn’t weak. Out of position it just hands him the choice."],
        ["c", "Your check hands him the choice: bet, or take the river free.", "Right. Acting first, your check gives him the choice: bet, or a free river."]) },
    takeaway: { heading: "Medium hand, small pot.",
      lead: "Medium hand, small pot: two streets of value, and take the free card when you are last.",
      ruleCard: { lines: ["Medium hand, small pot.", "Two streets of value...", "and take the free card when you're last."], sub: null } },
  }),
  spots,
  hands: {
    "pc-guided": huHand("pc-guided", { hero: NINES, board: TURN, pot: 200, button: "opponent", seats: seatsHU("Ace Andy", 950, 950) }),
    "pc-practice": huHand("pc-practice", { hero: NINES, board: TURN, pot: 200, seats: seatsHU("Ace Andy", 950, 950), acts: [{ seat: "opponent", action: "check" }], answer: { sizes: { bet: 100 } } }),
    "pc-fresh": huHand("pc-fresh", { hero: ["8c", "8d"], board: ["Qh", "7s", "2c"], pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
  },
});

export default definition;
