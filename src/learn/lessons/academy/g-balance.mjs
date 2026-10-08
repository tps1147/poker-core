// g-balance, Balance and Indifference (Game Theory), academy v2 definition.
// Film: src-academy-g-balance-v2 (97 s). canon.yourTurn = "yourTurn" at 66.15 s: "Your turn. Pot 120,
// bet 80, 25 value hands. 200 to 80: 5 to 2... so 10 bluffs. His call: 57.1 − 57.1. Zero."
// Plan: theory.md (g-balance). Bluffs ÷ all bets = bet ÷ (pot + 2·bet); value : bluffs =
// (pot + bet) : bet. "Balanced" is a ratio, not a coin flip.
//   Your turn   pot 120, bet 80, 25 value -> 10 bluffs (caller's call worth 0)
//   Guided      the film's worked pot-size bet: pot 100, bet 100, 20 value -> 10 bluffs
//   Practice    half pot: pot 100, bet 50, 24 value -> 8 bluffs (1 in 4)
//   Fresh       pot 90, bet 60 (2/3 pot), 20 value -> 8 bluffs (2 in 7), changed size and count
// Keys: answerKeys/g-balance.mjs. Every number: test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, bands, takeaway } from "./kit.mjs";

const feedback = { found: "Balanced.", missed: "Let’s build the ratio.", open: "Here’s the ratio." };
const bluffBands = (...n) => bands(...n.map((x) => [`bluffs-${x}`, `${x} bluffs`]));
const river = (hero, board) => ({ street: "river", hero, board });

const turnSpot = {
  decision: "estimate", street: "river", pot: 120, bet: 80, value: 25,
  bands: bluffBands(5, 10, 25),
  dockPrompt: "How many bluffs go with 25 value hands?",
  title: "Your turn: how many bluffs?",
  prompt: "Pot 120. You bet 80 with 25 value hands. How many bluffs balance them?",
  hint: "Value to bluffs is the pot plus the bet, to the bet.",
  explanation: "200 to 80 is 5 to 2, so 25 value hands go with 10 bluffs. His call: 10/35 × 200 − 25/35 × 80 = 57.1 − 57.1 = 0.",
};

const guided = river(["Ac", "Kc"], ["Kh", "Td", "6c", "3s", "2c"]);
const practice = river(["Qd", "Qh"], ["Jc", "8s", "5d", "4h", "2s"]);
const fresh = river(["As", "9s"], ["9h", "7c", "5s", "3d", "2h"]);

const definition = {
  ...definitionBase({
    node: "g-balance", coach: "knox", title: "Balance is a ratio.", kicker: "Leave his call worth nothing.",
    track: "theory", chapter: "Game Theory", minutes: 5, feedback,
    assumptions: "Heads-up rivers, no rake. You bet with a range of value hands, which beat any call, and bluffs, which lose to any call. His hand beats only a bluff. You choose how many bluffs go with the value hands you are given. Each hand stops before you bet.",
  }),
  stages: [
    welcome("Balance is a ratio.", "Leave his call worth nothing.",
      "How many bluffs go with your value bets? Watch Knox find the ratio, then balance three rivers.", "Knox"),
    filmStage({ film: "g-balance", at: 66.15, spotId: "ba-turn", spot: turnSpot, upNext: "Balance Knox’s river" }),
    whyStage("ba-why", "Why 10 bluffs with 25 value hands?", [
      { id: "ratio", text: "Bluffs ÷ all bets = 80 ÷ (120 + 160) = 2/7, so 10 of 35. His call then gains nothing.", fix: "Right. One more bluff and calling wins; one fewer and folding wins." },
      { id: "random", text: "Balanced means bluffing at random, about half the time.", fix: "Balanced means a ratio, not a coin flip. The bet size sets it: here 10 bluffs to 25 value." },
      { id: "breakeven", text: "Bluffs should be bet ÷ (pot + bet) = 80 ÷ 200 of my bets.", fix: "That is a bluff’s break-even fold rate. A balanced range uses bet ÷ (pot + 2 bets): 2/7, not 2/5." },
    ]),
    decision("ba-guided", "ba-guided", "guided", "Knox’s river", "Knox’s pot-size bet.", "Try a practice hand", { feedback }),
    decision("ba-practice", "ba-practice", "practice", "Practice", "Half the pot.", "Try a fresh hand", { feedback }),
    decision("ba-fresh", "ba-fresh", "fresh", "Fresh hand", "Your bet size, your ratio.", "See your recap", { feedback }),
    takeaway({
      heading: "Nothing to gain.",
      rule: "Bluffs ÷ all bets = bet ÷ (pot + 2·bet).",
      lead: "Half pot: 1 bet in 4 is a bluff. Pot size: 1 in 3. Twice the pot: 2 in 5. Bigger bets carry more bluffs.",
      labels: ["Knox’s river", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "ba-guided": {
      decision: "estimate", ...guided, pot: 100, betSize: 100, value: 20,
      bands: bluffBands(5, 10, 20),
      dockPrompt: "How many bluffs go with 20 value hands?",
      title: "Pot-size bet. How many bluffs?",
      prompt: "Knox’s river: pot 100, checked to you. You bet 100 with 20 value hands. How many bluffs balance them?",
      hint: "At a pot-size bet, the bet over the pot plus two bets is 1/3.",
      explanation: "10 bluffs: 10 of 30 bets is 1/3. His call wins 200 against a bluff and loses 100 against value: 10/30 × 200 − 20/30 × 100 = 66.7 − 66.7 = 0.",
    },
    "ba-practice": {
      decision: "estimate", ...practice, pot: 100, betSize: 50, value: 24,
      bands: bluffBands(6, 8, 12),
      dockPrompt: "How many bluffs go with 24 value hands?",
      title: "Half the pot. How many bluffs?",
      prompt: "Pot 100, checked to you. You bet 50 with 24 value hands. How many bluffs balance them?",
      hint: "At half pot, 1 bet in 4 is a bluff: value to bluffs is 3 to 1.",
      explanation: "8 bluffs: 50 ÷ (100 + 100) = 1/4, so 8 of 32 bets. His call: 8/32 × 150 − 24/32 × 50 = 37.5 − 37.5 = 0.",
    },
    "ba-fresh": {
      decision: "estimate", ...fresh, pot: 90, betSize: 60, value: 20,
      bands: bluffBands(4, 8, 20),
      dockPrompt: "How many bluffs go with 20 value hands?",
      title: "Two-thirds of the pot. How many bluffs?",
      prompt: "Pot 90, checked to you. You bet 60 with 20 value hands. How many bluffs balance them?",
      hint: "Value to bluffs is the pot plus the bet, to the bet.",
      explanation: "8 bluffs: 150 to 60 is 5 to 2, and 60 ÷ (90 + 120) = 2/7, 8 of 28 bets. His call: 8/28 × 150 − 20/28 × 60 = 42.9 − 42.9 = 0.",
    },
  },
  hands: {
    "ba-guided": huHand("ba-guided", { ...guided, pot: 100, decisions: ["ba-guided"] }),
    "ba-practice": huHand("ba-practice", { ...practice, pot: 100, decisions: ["ba-practice"] }),
    "ba-fresh": huHand("ba-fresh", { ...fresh, pot: 90, decisions: ["ba-fresh"] }),
  },
};

export default definition;
