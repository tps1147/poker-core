// h-range-narrowing, Narrowing Ranges Street by Street (Reading People), academy v2 definition.
// Film: src-academy-h-range-narrowing-v2 (95 s). canon.yourTurn = "yourTurn" at 64.31 s: "Your turn.
// Same range, new flop: queen, six, three. 171 live. Same rule. How many call? 79... and 92 fold."
// Plan: people.md (h-range-narrowing). His range is the Postflop track's illustrative caller range
// (186 combos before the flop). The rules of thumb, labelled: he calls a flop bet with any pair or
// draw; he calls the turn with eights or better or a straight draw. Counts leave your own two cards
// out, as the film does. These are reads of his actions, never of his cards.
//   Your turn   flop Q♦ 6♣ 3♠: 171 live, 79 call -> about 80
//   Guided      the film's river J♥ 8♣ 4♦ 2♠ K♥: 82 left, 18 / 48 / 16 -> one pair is the biggest group
//   Practice    after his flop and turn calls on J♥ 8♣ 4♦ 2♠, which hand still fits -> T♥ 9♥
//   Fresh       flop T♦ 5♠ 2♣, same range and rule: 162 live, 98 call -> about 100 (changed flop)
// Keys: answerKeys/h-range-narrowing.mjs. Every count is enumerated in test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, bands, takeaway } from "./kit.mjs";

const feedback = { found: "You kept the list.", missed: "Let’s replay his actions.", open: "Here’s the count." };

const turnSpot = {
  decision: "estimate", street: "flop", board: ["Qd", "6c", "3s"], live: 171,
  bands: bands(["about-40", "About 40"], ["about-80", "About 80"], ["about-160", "About 160"]),
  dockPrompt: "How many of his combos call?",
  title: "Your turn: how many call?",
  prompt: "Same range, new flop: Q♦ 6♣ 3♠. 171 of his combos are live. Same rule: he calls your bet with any pair or draw. About how many call?",
  hint: "Count only the hands that hold a pair or a draw on this flop.",
  explanation: "79 call: 6 two pair or better, 15 top pair, 54 weaker pairs and 4 draws. The other 92 hit nothing and fold.",
};

const guided = { street: "river", hero: ["Ah", "Qh"], board: ["Jh", "8c", "4d", "2s", "Kh"] };
const practice = { street: "turn", hero: ["Ac", "Kd"], board: ["Jh", "8c", "4d", "2s"] };
const fresh = { street: "flop", hero: ["Ac", "Kd"], board: ["Td", "5s", "2c"] };

const definition = {
  ...definitionBase({
    node: "h-range-narrowing", conceptId: "t5-range-narrowing", coach: "sera", title: "Every action takes hands out.", kicker: "Keep the list, not one guess.",
    track: "people", chapter: "Reading People", minutes: 5, feedback,
    assumptions: "Heads-up. Before the flop he calls with an illustrative range of 186 combos, the Postflop track’s caller range. On the flop he calls a bet with any pair or draw; on the turn with eights or better or a straight draw. Both are rules of thumb for this exercise, not his real habits. Counts leave your own two cards out, as the film does. Every count comes from his actions, never from his hidden cards.",
  }),
  stages: [
    welcome("Every action takes hands out.", "Keep the list, not one guess.",
      "He called three times. Watch Sera narrow his range one street at a time, then count three ranges yourself.", "Sera"),
    filmStage({ film: "h-range-narrowing", at: 64.31, spotId: "rn-turn", spot: turnSpot, upNext: "Sort Sera’s river" }),
    whyStage("Why do only about 80 of 171 call?", [
      { id: "removes", text: "His call takes out every hand with no pair and no draw on this flop.", fix: "Right. Those 92 hands are gone: his range is now a history of what he did." },
      { id: "same", text: "It doesn’t really: he can still hold any hand he called with before the flop.", fix: "Ranges don’t stay the same after the flop. His call removed every hand that hit nothing." },
      { id: "cards", text: "The three flop cards removed most of his combos.", fix: "The flop cards only took 186 to 171. His call took out the next 92." },
    ]),
    decision("rn-guided", "rn-guided", "guided", "Sera’s river", "Sera’s river. Sort what is left.", "Try a practice hand", { feedback }),
    decision("rn-practice", "rn-practice", "practice", "Practice", "Two calls in. Which hand still fits?", "Try a fresh hand", { feedback }),
    decision("rn-fresh", "rn-fresh", "fresh", "Fresh hand", "A new flop. Count the callers.", "See your recap", { feedback }),
    takeaway({
      heading: "A history, not a guess.",
      rule: "Start wide, then let every action take hands out. Keep the list, not one guess.",
      lead: "186 before the flop, 162 after the flop cards, 118 after his flop call, 85 after the turn and 82 on the river.",
      labels: ["Sera’s river", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "rn-guided": {
      decision: "estimate", ...guided,
      bands: bands(["strong", "Two pair or better"], ["one-pair", "One pair"], ["missed", "Missed draws"]),
      dockPrompt: "Which group is biggest?",
      title: "82 combos left. Which group is biggest?",
      prompt: "Sera’s river: J♥ 8♣ 4♦ 2♠ K♥. He called before the flop, on the flop and on the turn, and 82 of his combos are left. Which group holds the most of them?",
      hint: "His turn call needed eights or better or a straight draw. What do most of those hands hold now?",
      explanation: "One pair: 48 of the 82. Then 18 two pair or better and 16 missed draws. None of his hands holds nothing, because every one had to keep calling.",
    },
    "rn-practice": {
      decision: "estimate", ...practice,
      bands: bands(["t9", "T♥ 9♥"], ["kt", "K♣ T♣"], ["77", "7♠ 7♦"]),
      dockPrompt: "Which hand still fits his calls?",
      title: "Which hand is still in his range?",
      prompt: "J♥ 8♣ 4♦, then 2♠. He called your flop bet (any pair or draw) and your turn bet (eights or better, or a straight draw). Which of these hands is still in his range?",
      hint: "Check each hand against both calls, one street at a time.",
      explanation: "T♥ 9♥ holds a straight draw on both streets, so it calls twice. K♣ T♣ hit nothing on the flop and folded there. 7♠ 7♦ is a pair, so it called the flop, but it is below eights and folded the turn.",
    },
    "rn-fresh": {
      decision: "estimate", ...fresh,
      bands: bands(["about-50", "About 50"], ["about-100", "About 100"], ["about-160", "About 160"]),
      dockPrompt: "How many of his combos call?",
      title: "A new flop. How many call?",
      prompt: "Same range before the flop. The flop is T♦ 5♠ 2♣, and 162 of his combos are live. Same rule: he calls your bet with any pair or draw. About how many call?",
      hint: "Low flops pair more of his small pocket pairs and suited cards.",
      explanation: "98 call: 9 two pair or better, 33 top pair or an overpair, 48 weaker pairs and 8 draws. 64 fold. More of this range connects with T♦ 5♠ 2♣ than with Q♦ 6♣ 3♠.",
    },
  },
  hands: {
    "rn-guided": huHand("rn-guided", { ...guided, pot: 300, decisions: ["rn-guided"] }),
    "rn-practice": huHand("rn-practice", { ...practice, pot: 150, decisions: ["rn-practice"] }),
    "rn-fresh": huHand("rn-fresh", { ...fresh, pot: 50, decisions: ["rn-fresh"] }),
  },
};

export default definition;
