// Postflop 6, Pot Control and Free Cards (f-pot-control), v2 lesson, content version 2. Vale's film
// pauses at its yourTurn anchor (60.81 s, "Same nines, but now you act first") for the "Your turn"
// spot: 9♠ 9♥ on K♣ 6♦ 3♠ 2♥, pot 200, out of position, your check hands him the choice (him).
// v2 (2026-10-09): no step replays the film's nines any more. The guided hand flips the seat on new
// cards (T♦ T♣ on J♠ 7♥ 4♦ 3♣, pot 140, last to act: he checks, and a check behind makes the free
// river your choice). Practice is a new in-position turn (J♠ J♦ on A♥ 8♣ 4♠ 2♦, pot 160: check
// behind, two streets of value and a free river); the fresh hand sizes the two-street pot from a 60
// flop pot (240). Keys: answerKeys/f-pot-control.mjs (package root, not shipped).
import { bands, huHand, options, seatsHU, v2Lesson, v2Stages } from "./kitEarly.mjs";

const TURN = ["Kc", "6d", "3s", "2h"];
const NINES = ["9s", "9h"];
const WHO = bands(["you", "You do"], ["him", "He does"]);
const GUIDED = { hero: ["Td", "Tc"], board: ["Js", "7h", "4d", "3c"] };
const PRACTICE = { hero: ["Js", "Jd"], board: ["Ah", "8c", "4s", "2d"] };

// The film's own question (its "Your turn" spot), as the film asks it.
const turnSpot = {
  decision: "estimate", street: "turn", hero: NINES, board: TURN, bands: WHO, dockPrompt: "If you check, who chooses?",
  title: "Your turn: now you act first.",
  prompt: "Same nines on K♣ 6♦ 3♠ 2♥, pot 200, but now you act first on the turn. If you check, who decides whether the river comes free?",
  hint: "After your check, someone still has to act on this turn.",
  explanation: "He does. Your check hands him the choice: he can bet, or check and take the river free. Out of position the free card is his, not yours.",
};

const spots = {
  "pc-guided": {
    decision: "estimate", street: "turn", ...GUIDED, potBefore: 140, bands: WHO, dockPrompt: "If you check behind, who chose?",
    title: "Now you act last.",
    prompt: "T♦ T♣ on J♠ 7♥ 4♦ 3♣, pot 140. This time you are last to act: he checks the turn to you. If you check behind, who chose to take the river free?",
    hint: "He has already acted on this turn. Who closes the betting?",
    explanation: "You do. He checked first, so your check ends the turn and the river comes free. Last to act, the free card is yours to take.",
  },
  "pc-practice": {
    decision: "action", choices: ["check", "bet"], street: "turn", ...PRACTICE, potBefore: 160, bet: 0, call: 0, sizes: { bet: 80 },
    title: "Last to act on the turn.",
    prompt: "You bet 40 on the A♥ 8♣ 4♠ flop with J♠ J♦ and he called; the pot is 160. The turn is the 2♦ and he checks to you, last to act. Check behind, or bet 80?",
    hint: "Who keeps calling a third bet with an ace on the board? And what does a check behind cost you on the river?",
    explanation: "Check behind. Three bets are called mostly by aces and better, which beat your jacks; two bets still get paid once by his weaker pairs. The check is a free card: the river costs nothing, and 2 jacks of 46 unseen cards, about 4.3%, give you a set.",
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
  node: "f-pot-control", version: 2, film: "f-pot-control", coach: "knox", access: "pro", track: "Postflop", minutes: 4,
  title: "Medium hand, small pot.", kicker: "Take the free card when you’re last.",
  assumptions: "Heads-up, half-pot bets, and every bet called. Which hands keep calling is the film’s illustration, never a read. A free card means the next card comes without anyone betting.",
  stages: v2Stages({
    welcome: { heading: "How big a pot do you want?", em: "Three streets, or two?", lead: "Watch Knox size a pot for a pair of nines, then play three spots at the table.", cta: "Watch with Knox" },
    film: { upNext: "Play the other seat", film: "f-pot-control", at: 60.81, spot: turnSpot },
    hands: [
      { id: "pc-guided", label: "The other seat", coachLine: "New tens. This time you act last." },
      { id: "pc-practice", label: "Practice", coachLine: "Last to act. Bet, or take the free card?" },
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
    "pc-guided": huHand("pc-guided", { ...GUIDED, pot: 140, seats: seatsHU("Ace Andy", 900, 900), acts: [{ seat: "opponent", action: "check" }] }),
    "pc-practice": huHand("pc-practice", { ...PRACTICE, pot: 160, seats: seatsHU("Ace Andy", 900, 900), acts: [{ seat: "opponent", action: "check" }], answer: { sizes: { bet: 80 } } }),
    "pc-fresh": huHand("pc-fresh", { hero: ["8c", "8d"], board: ["Qh", "7s", "2c"], pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
  },
});

export default definition;
