// x-check-raise, The Check-Raise (Pressure and Defense), academy v2 definition, content version 2.
// Film: src-academy-x-check-raise-v2 (78 s). canon.yourTurn = "yourTurn" at 60.83 s: "Your turn.
// Same flop, he bets 20, and you hold sevens. A raise folds out worse hands and keeps better ones.
// So just call." The film's own worked examples, the set 6♣ 6♥ and the draw 8♠ 7♠ on 9♠ 6♦ 2♣ with
// 60 / 20 / raise to 70, stay in the film.
// v2 (2026-10-09): the three hands leave the film's flop and money. Each is a new flop with its own
// pot and bet, and each raise is sized so his price to call it is 25%: raise R facing bet b into pot
// P asks R − b into P + 2R, and R = (P + 4b) ÷ 2 makes that one in four.
//   Your turn   7♥ 7♣ on 9♠ 6♦ 2♣, pot 60, bet 20 -> call (a raise to 70 folds worse, keeps better)
//   Guided      5♣ 5♥ on K♠ 9♦ 5♦, a set, pot 100, bet 40 -> raise to 130 (90 ÷ 360 = 25%; the
//               pot is 360 called, against 180 for a call)
//   Practice    Q♥ J♥ on T♥ 9♣ 4♥, 15 outs to a straight or a flush, pot 140, bet 50 -> raise to
//               170 (120 ÷ 480 = 25%; the draw half)
//   Fresh       8♦ 8♠ on J♥ 6♣ 3♠, a pair below the top card, pot 120, bet 45 -> call (raise to
//               150 would ask 105 ÷ 420)
// Keys: answerKeys/x-check-raise.mjs. Every number and hand class: test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, takeaway } from "./kit.mjs";

const flop = (hero, board, potBefore, bet) => ({ street: "flop", hero, board, potBefore, bet, call: bet });
const feedback = { found: "You picked the raise’s job.", missed: "Ask what a raise folds and what it keeps.", open: "Here’s the thinking." };

// The film's own question (its "Your turn" spot), as the film asks it.
const turnSpot = {
  decision: "action", choices: ["call", "raise"], sizes: { raise: 70 }, ...flop(["7h", "7c"], ["9s", "6d", "2c"], 60, 20),
  title: "Your turn: call, or check-raise to 70?",
  prompt: "Same flop: 9♠ 6♦ 2♣. You checked from the big blind, the pot was 60 and he bets 20. You hold sevens. Call 20, or raise to 70?",
  hint: "Which of his hands fold to a raise, and which call it?",
  explanation: "Sevens are a medium pair. A raise to 70 folds the hands sevens already beat and keeps the ones that beat sevens. Just call.",
};

const guided = flop(["5c", "5h"], ["Ks", "9d", "5d"], 100, 40);
const practice = flop(["Qh", "Jh"], ["Th", "9c", "4h"], 140, 50);
const fresh = flop(["8d", "8s"], ["Jh", "6c", "3s"], 120, 45);
const SIZES = { guided: { raise: 130 }, practice: { raise: 170 }, fresh: { raise: 150 } };

const definition = {
  ...definitionBase({
    node: "x-check-raise", version: 2, coach: "knox", title: "Check, then raise.", kicker: "Strong hands and best draws, together.",
    track: "pressure", chapter: "Pressure and Defense", minutes: 5, feedback,
    assumptions: "Heads-up, no rake, stacks of 1,000. You are the big blind, so you act first after the flop. In every hand you check, he bets, and you call or raise. Each raise is sized so that his price to call it is 25%: he calls the difference into the final pot. Outs are counted with one card to come and need no help from his cards, which stay hidden. The hand stops once you act.",
  }),
  stages: [
    welcome("Check, then raise.", "Strong hands and best draws, together.",
      "Out of position, you can let him bet first and then raise. Watch Knox raise a set and a draw the same way, then play three flops.", "Knox"),
    filmStage({ film: "x-check-raise", at: 60.83, spotId: "cr-turn", spot: turnSpot, upNext: "Play a set" }),
    whyStage("cr-why", "Why just call with sevens?", [
      { id: "folds-worse", text: "A raise folds the hands sevens beat and keeps the hands that beat sevens.", fix: "Right. The raise has no job here, so calling keeps his weaker hands in." },
      { id: "monster", text: "A check-raise always means a monster, and sevens aren’t one.", fix: "A check-raise isn’t always a monster: good draws raise too. Sevens call because a raise has no job." },
      { id: "price", text: "Because his price to call a raise would only be 25%.", fix: "25% is his price against a raise. It doesn’t decide your hand: what the raise folds and keeps does." },
    ]),
    decision("cr-guided", "cr-guided", "guided", "A set", "A set on a new flop. He bets 40.", "Try a practice hand", { feedback }),
    decision("cr-practice", "cr-practice", "practice", "Practice", "A big draw. He bets 50.", "Try a fresh hand", { feedback }),
    decision("cr-fresh", "cr-fresh", "fresh", "Fresh hand", "Your flop. He bets 45.", "See your recap", { feedback }),
    takeaway({
      heading: "Raise with a job.",
      rule: "Check-raise your strongest hands and your best draws together.",
      lead: "From his seat both raises look the same. A medium pair calls: a raise would fold worse hands and keep better ones.",
      labels: ["A set", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "cr-guided": {
      decision: "action", choices: ["call", "raise"], sizes: SIZES.guided, ...guided,
      title: "A set. Call, or raise to 130?",
      prompt: "5♣ 5♥ on K♠ 9♦ 5♦, a set. The pot was 100, you checked and he bets 40. Call 40, or raise to 130?",
      hint: "If he calls the raise, how big is the pot? If you just call, how big?",
      explanation: "Raise. If he calls 90 more, his price is 90 ÷ 360 = 25%, and the pot is 360 instead of the 180 a call makes. A set wants the bigger pot.",
      focus: ["5c", "5h", "5d"],
    },
    "cr-practice": {
      decision: "action", choices: ["call", "raise"], sizes: SIZES.practice, ...practice,
      title: "A big draw. Call, or raise to 170?",
      prompt: "Q♥ J♥ on T♥ 9♣ 4♥. Any king or eight makes a straight and any heart a flush: 15 outs. The pot was 140, you checked and he bets 50. Call 50, or raise to 170?",
      hint: "Your best draws raise with your strongest hands. What does this draw do when he calls?",
      explanation: "Raise. The draw wins two ways: he can fold now, and when he calls, 15 of the 47 unseen cards make a straight or a flush on the turn. Raised with your sets, it hides which one you hold.",
      focus: ["Qh", "Jh", "Th", "9c", "4h"],
    },
    "cr-fresh": {
      decision: "action", choices: ["call", "raise"], sizes: SIZES.fresh, ...fresh,
      title: "Eights. Call, or raise to 150?",
      prompt: "8♦ 8♠ on J♥ 6♣ 3♠. The pot was 120, you checked and he bets 45. Call 45, or raise to 150?",
      hint: "Ask the raise’s job: which hands fold, and which call?",
      explanation: "Call. Eights are a pair below the jack. A raise folds the hands eights beat and is called by the jacks and better that beat you. Not every pair wants a bigger pot.",
    },
  },
  hands: {
    "cr-guided": huHand("cr-guided", { ...guided, pot: 100, bet: 40, heroFirst: true, decisions: ["cr-guided"], answer: "cr-guided", sizes: SIZES.guided }),
    "cr-practice": huHand("cr-practice", { ...practice, pot: 140, bet: 50, heroFirst: true, decisions: ["cr-practice"], answer: "cr-practice", sizes: SIZES.practice }),
    "cr-fresh": huHand("cr-fresh", { ...fresh, pot: 120, bet: 45, heroFirst: true, decisions: ["cr-fresh"], answer: "cr-fresh", sizes: SIZES.fresh }),
  },
};

export default definition;
