// x-mdf, Defending Against Bets (Pressure and Defense), academy v2 definition 1.
// Film: src-academy-x-mdf-v2 (91 s). canon.yourTurn = "yourTurn" at 66.97 s: "Your turn. 90 in the
// pot, he bets 60, 35 combos." The film reveals 90 ÷ 150 = 3/5 and "Defend 21".
// Plan: docs/v1-feature/academy/plans/pressure.md (x-mdf). Keep at least pot ÷ (pot + bet) of your
// range; the range sizes (42, 35 and the new ones here) are given illustrations, labelled.
//   Your turn   pot 90, bet 60, 35 combos -> keep 21 (3/5)
//   Guided      the film's worked river: pot 100, bet 75, 42 combos -> keep 24 (4/7)
//   Practice    pot 100, bet 50 (half pot), 30 combos -> keep 20 (2/3)
//   Fresh       pot 120, bet 40 (a third of the pot), 32 combos -> keep 24 (3/4), changed size and count
// Keys: answerKeys/x-mdf.mjs. Every number: test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, bands, takeaway } from "./kit.mjs";

const keepBands = (...counts) => bands(...counts.map((n) => [`keep-${n}`, `Keep ${n}`]));
const river = (hero, board, potBefore, bet) => ({ street: "river", hero, board, potBefore, bet, call: bet });

const turnSpot = {
  decision: "estimate", street: "river", potBefore: 90, bet: 60, range: 35,
  bands: keepBands(14, 21, 35),
  dockPrompt: "How many combos do you keep?",
  title: "Your turn: how much do you defend?",
  prompt: "River. 90 in the pot, and he bets 60. Your range here is 35 combos (an illustration). How many of them must you keep?",
  hint: "Keep at least the pot over the pot plus the bet.",
  explanation: "Keep 90 ÷ (90 + 60) = 90 ÷ 150 = 3/5 of your range. 3/5 of 35 is 21: defend 21 and fold the weakest 14.",
};

const guided = river(["Jd", "Jc"], ["Qs", "8d", "5c", "3h", "2s"], 100, 75);
const practice = river(["Kc", "Tc"], ["Ah", "Td", "6h", "4s", "2c"], 100, 50);
const fresh = river(["Qs", "9s"], ["Kh", "9c", "7d", "4c", "2h"], 120, 40);

const definition = {
  ...definitionBase({
    node: "x-mdf", conceptId: "t4-mdf-bluffcatch", coach: "knox", title: "Defend enough.", kicker: "Fold too much and any bluff wins.",
    track: "pressure", chapter: "Pressure and Defense", minutes: 5,
    assumptions: "Heads-up, no rake. He bets into you on the river and you either keep a hand (call) or fold it. Your range is given as a count of combos, an illustration, never read from his cards. The rule is the default, minimum defense: keep at least pot ÷ (pot + bet) of your range, so his bluffs earn nothing. It is not a law: a player who never bluffs is the next track’s question.",
  }),
  stages: [
    welcome("Defend enough.", "Fold too much and any bluff wins.",
      "He bets and you might be beaten. Watch Knox find how much of your range to keep, then defend three rivers at the table.", "Knox"),
    filmStage({ film: "x-mdf", at: 66.97, spotId: "md-turn", spot: turnSpot, upNext: "Play Knox’s river" }),
    whyStage("md-why", "Why keep 21 of the 35?", [
      { id: "mdf", text: "21 is 3/5 of 35: keep pot ÷ (pot + bet), or his bluffs win with any two cards.", fix: "Right. Fold more than 2/5 and every bluff he fires makes chips." },
      { id: "beaten", text: "Because only 21 of my combos beat the hands he bets for value.", fix: "Defending isn’t about beating his value bets. It’s how much you keep so his bluffs earn nothing." },
      { id: "breakeven", text: "His bluff needs 60 ÷ 150 = 40% folds, so I keep 40% of my range.", fix: "40% is the share you can fold. You keep the other 60%: 21 of 35." },
    ]),
    decision("md-guided", "md-guided", "guided", "Knox’s river", "Knox’s river. Count what you keep.", "Try a practice hand"),
    decision("md-practice", "md-practice", "practice", "Practice", "A smaller bet. Same rule.", "Try a fresh hand"),
    decision("md-fresh", "md-fresh", "fresh", "Fresh hand", "Your count.", "See your recap"),
    takeaway({
      heading: "Defend enough.",
      rule: "Keep at least pot ÷ (pot + bet) of your range. Fold less than that and his bluffs print.",
      lead: "The share you keep and the folds his bluff needs add up to 1. It is the default, not a law.",
      labels: ["Knox’s river", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "md-guided": {
      decision: "estimate", ...guided, range: 42,
      bands: keepBands(18, 24, 42),
      dockPrompt: "How many combos do you keep?",
      title: "He bets 75 into 100. How many do you keep?",
      prompt: "Knox’s river. The pot is 100 and he bets 75. Your range is 42 combos (an illustration). How many must you keep?",
      hint: "Pot over the pot plus the bet, then take that share of 42.",
      explanation: "100 ÷ (100 + 75) = 100 ÷ 175 = 4/7. 4/7 of 42 is 24: keep 24, fold the weakest 18. Fold 60% instead and his bluffs make 30 each.",
      focus: ["Jd", "Jc"],
    },
    "md-practice": {
      decision: "estimate", ...practice, range: 30,
      bands: keepBands(10, 20, 30),
      dockPrompt: "How many combos do you keep?",
      title: "Half the pot. How many do you keep?",
      prompt: "The pot is 100 and he bets 50. Your range is 30 combos (an illustration). How many must you keep?",
      hint: "A smaller bet means you keep a bigger share.",
      explanation: "100 ÷ (100 + 50) = 2/3. 2/3 of 30 is 20: keep 20 and fold 10. His half-pot bluff needs a third of your range to fold.",
    },
    "md-fresh": {
      decision: "estimate", ...fresh, range: 32,
      bands: keepBands(8, 16, 24),
      dockPrompt: "How many combos do you keep?",
      title: "A third of the pot. How many do you keep?",
      prompt: "The pot is 120 and he bets 40. Your range is 32 combos (an illustration). How many must you keep?",
      hint: "Pot over the pot plus the bet.",
      explanation: "120 ÷ (120 + 40) = 3/4. 3/4 of 32 is 24: keep 24, fold only 8. Small bets need very few folds, so you defend almost everything.",
    },
  },
  hands: {
    "md-guided": huHand("md-guided", { ...guided, pot: 100, bet: 75, decisions: ["md-guided"] }),
    "md-practice": huHand("md-practice", { ...practice, pot: 100, bet: 50, decisions: ["md-practice"] }),
    "md-fresh": huHand("md-fresh", { ...fresh, pot: 120, bet: 40, decisions: ["md-fresh"] }),
  },
};

export default definition;
