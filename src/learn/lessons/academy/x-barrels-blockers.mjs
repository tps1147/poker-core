// x-barrels-blockers, Barrels and Blockers (Pressure and Defense), academy v2 definition.
// Film: src-academy-x-barrels-blockers-v2 (84 s). canon.yourTurn = "yourTurn" at 64.66 s: "Your turn.
// Sort two bluff cards. The A♠ blocks his calls. Better bluff. The 9♦ blocks his folds. Worse bluff."
// Plan: pressure.md (x-barrels-blockers). The river is K♠ 9♠ 4♦ 2♠ 7♥ after the film's line.
//   Your turn   A♠ or 9♦ as the bluff card -> the A♠
//   Guided      the film's barrel plan: pot 100, 350 behind -> half pot, 50 -> 100 -> 200 = 350
//   Practice    pot 50, 650 behind -> pot-size bets, 50 -> 150 -> 450 = 650 (changed size)
//   Fresh       J♥ 5♣ on T♣ 9♦ 8♠ 4♥ 2♣, he calls every straight and folds 30 one-pair combos
//               (given): the J♥ takes his straights from 48 to 40, folds 30/78 = 38.5% -> 30/70 =
//               42.9%, above the 40% a 100 bet into 150 needs -> bet (the blocker removes calls)
// Keys: answerKeys/x-barrels-blockers.mjs. Every number: test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, bands, takeaway } from "./kit.mjs";

const RIVER = ["Ks", "9s", "4d", "2s", "7h"];
const feedback = { found: "You planned it.", missed: "Let’s plan it together.", open: "Here’s the plan." };
const sizeBands = (a, b, c) => bands([`bet-${a}`, `Bet ${a}`], [`bet-${b}`, `Bet ${b}`], [`bet-${c}`, `Bet ${c}`]);

const turnSpot = {
  decision: "estimate", street: "river", board: RIVER,
  bands: bands(["ace-spades", "The A♠"], ["nine-diamonds", "The 9♦"]),
  dockPrompt: "Which card makes the better bluff?",
  title: "Your turn: sort two bluff cards.",
  prompt: "River K♠ 9♠ 4♦ 2♠ 7♥, after the film’s line. He calls with his flushes and folds his pairs. You bluff holding one of two cards. Which makes the better bluff: the A♠ or the 9♦?",
  hint: "A good bluff card removes hands that would call, not hands that would fold.",
  explanation: "The A♠ removes 9 of his 45 two-spade flushes, the hands that call, and every nut flush. The 9♦ removes pairs of nines, hands that would fold. The A♠ is the better bluff.",
};

const guided = { street: "flop", hero: ["As", "Qd"], board: ["Ks", "9s", "4d"] };
const practice = { street: "flop", hero: ["Ah", "Jh"], board: ["Tc", "6d", "3h"] };
const fresh = { street: "river", hero: ["Jh", "5c"], board: ["Tc", "9d", "8s", "4h", "2c"] };

const definition = {
  ...definitionBase({
    node: "x-barrels-blockers", conceptId: "t4-barreling-blockers", coach: "knox", title: "Plan three streets.", kicker: "Bluff with the card that blocks his calls.",
    track: "pressure", chapter: "Pressure and Defense", minutes: 5, feedback,
    assumptions: "Heads-up, no rake. A barrel plan bets the same share of the pot on the flop, the turn and the river, and every call adds the same amount to the pot. Stacks are given in each hand. On the river, what he calls and folds with is given as a rule for this exercise, and his combo counts are an illustration, never read from his cards. A break-even bluff of 100 into 150 needs 100 ÷ 250 = 40% folds.",
  }),
  stages: [
    welcome("Plan three streets.", "Bluff with the card that blocks his calls.",
      "Size the flop bet so three bets fit your stack, then pick the bluff that removes his calls. Watch Knox, then plan three hands.", "Knox"),
    filmStage({ film: "x-barrels-blockers", at: 64.66, spotId: "bk-turn", spot: turnSpot, upNext: "Plan Knox’s three streets" }),
    whyStage("bk-why", "Why is the A♠ the better bluff?", [
      { id: "blocks-calls", text: "It removes his flushes, the hands that call, while his folding pairs stay in his range.", fix: "Right. The 9♦ does the opposite: it removes hands that would fold." },
      { id: "any-ace", text: "Any ace is a strong blocker, whatever the board and the line.", fix: "Blockers don’t matter more than the board. The board and his line decide what folds; the card only nudges the count." },
      { id: "showdown", text: "The 9♦ is worse because a pair of nines can win at showdown.", fix: "That’s not the problem. The 9♦ removes pairs of nines, the very hands a bluff wants to fold." },
    ]),
    decision("bk-guided", "bk-guided", "guided", "Knox’s plan", "Knox’s flop. Plan all three bets.", "Try a practice hand", { feedback }),
    decision("bk-practice", "bk-practice", "practice", "Practice", "Deeper stacks. Plan again.", "Try a fresh hand", { feedback }),
    decision("bk-fresh", "bk-fresh", "fresh", "Fresh hand", "Your river. Count what your jack removes.", "See your recap", { feedback: { found: "You counted the blocker.", missed: "Count what your card removes.", open: "Here’s the count." } }),
    takeaway({
      heading: "Plan, then block.",
      rule: "Plan the size for all three streets; pick the bluff that blocks his calls, after the board says he can fold.",
      lead: "Pick the flop size that gets your stack in by the river. The line and the board set his range; your blocker adjusts it.",
      labels: ["Knox’s plan", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "bk-guided": {
      decision: "estimate", ...guided,
      bands: sizeBands(25, 50, 100),
      dockPrompt: "Which flop bet fits three streets?",
      title: "Pot 100, 350 behind. Which flop bet?",
      prompt: "Knox’s plan: the pot is 100 and you each have 350 behind. He checks the flop. You want three bets, one per street, the same share of the pot each time, with all 350 in by the river. Which flop bet?",
      hint: "Each call adds your bet twice. Try half the pot: what is the next pot, and the next bet?",
      explanation: "Half the pot: 50, then 100 into 200, then 200 into 400. 50 + 100 + 200 = 350, and the pot ends at 100 + 2 × 350 = 800. Stack to pot is 350 ÷ 100 = 3.5.",
      focus: ["As", "Ks", "9s"],
    },
    "bk-practice": {
      decision: "estimate", ...practice,
      bands: sizeBands(25, 50, 100),
      dockPrompt: "Which flop bet fits three streets?",
      title: "Pot 50, 650 behind. Which flop bet?",
      prompt: "The pot is 50 and you each have 650 behind. He checks the flop. Three bets, the same share of the pot each time, all 650 in by the river. Which flop bet?",
      hint: "Deeper stacks for this pot need a bigger share. Build the three bets for each choice.",
      explanation: "The pot, 50: then 150 into 150, then 450 into 450. 50 + 150 + 450 = 650. Half the pot reaches only 25 + 50 + 100 = 175, and twice the pot puts 100 + 500 = 600 in by the turn, leaving 50 for the river.",
    },
    "bk-fresh": {
      decision: "action", choices: ["check", "bet"], sizes: { bet: 100 }, ...fresh,
      title: "Jack high. Check, or bet 100?",
      prompt: "J♥ 5♣ on T♣ 9♦ 8♠ 4♥ 2♣, jack high. The pot is 150 and he checks. Given: he calls with every straight and folds 30 one-pair combos (an illustration). A bet of 100 needs 40% folds. Check, or bet 100?",
      hint: "His straights use queen-jack, jack-seven or seven-six. How many of them can he hold while your jack is in your hand?",
      explanation: "With no jack in your hand he would hold 48 straights: 30 folds in 78 is 38.5%, short of 40%. Your J♥ removes 8 of them, leaving 40: 30 in 70 is 42.9%. Bet. The blocker removed his calls, on a line where his pairs can fold.",
      focus: ["Jh", "Tc", "9d", "8s"],
    },
  },
  hands: {
    "bk-guided": huHand("bk-guided", { ...guided, pot: 100, stack: 350, decisions: ["bk-guided"] }),
    "bk-practice": huHand("bk-practice", { ...practice, pot: 50, stack: 650, decisions: ["bk-practice"] }),
    "bk-fresh": huHand("bk-fresh", { ...fresh, pot: 150, stack: 600, decisions: ["bk-fresh"], answer: "bk-fresh", sizes: { bet: 100 } }),
  },
};

export default definition;
