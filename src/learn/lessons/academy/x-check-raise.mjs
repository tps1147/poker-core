// x-check-raise, The Check-Raise (Pressure and Defense), academy v2 definition.
// Film: src-academy-x-check-raise-v2 (78 s). canon.yourTurn = "yourTurn" at 60.83 s: "Your turn.
// Same flop, he bets 20, and you hold sevens. A raise folds out worse hands and keeps better ones.
// So just call."
// Plan: pressure.md (x-check-raise). You are the big blind, out of position: you check, he bets 20
// into 60, and a raise goes to 70 (his price to call it: 50 ÷ 200 = 25%).
//   Your turn   7♥ 7♣ on 9♠ 6♦ 2♣ -> call (a raise folds worse and keeps better)
//   Guided      the film's set, 6♣ 6♥ on 9♠ 6♦ 2♣ -> raise to 70 (value)
//   Practice    T♠ 9♠ on J♠ 8♦ 3♠, 15 outs to a straight or a flush -> raise to 70 (the draw half)
//   Fresh       9♦ 9♠ on Q♥ 7♣ 4♠, a pair below the top card -> call (changed flop and pair)
// Keys: answerKeys/x-check-raise.mjs. Every number and hand class: test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, takeaway } from "./kit.mjs";

const SIZES = { raise: 70 };
const flop = (hero, board) => ({ street: "flop", hero, board, potBefore: 60, bet: 20, call: 20 });
const feedback = { found: "You picked the raise’s job.", missed: "Ask what a raise folds and what it keeps.", open: "Here’s the thinking." };

const turnSpot = {
  decision: "action", choices: ["call", "raise"], sizes: SIZES, ...flop(["7h", "7c"], ["9s", "6d", "2c"]),
  title: "Your turn: call, or check-raise to 70?",
  prompt: "Same flop: 9♠ 6♦ 2♣. You checked from the big blind, the pot was 60 and he bets 20. You hold sevens. Call 20, or raise to 70?",
  hint: "Which of his hands fold to a raise, and which call it?",
  explanation: "Sevens are a medium pair. A raise to 70 folds the hands sevens already beat and keeps the ones that beat sevens. Just call.",
};

const guided = flop(["6c", "6h"], ["9s", "6d", "2c"]);
const practice = flop(["Ts", "9s"], ["Js", "8d", "3s"]);
const fresh = flop(["9d", "9s"], ["Qh", "7c", "4s"]);

const definition = {
  ...definitionBase({
    node: "x-check-raise", coach: "knox", title: "Check, then raise.", kicker: "Strong hands and best draws, together.",
    track: "pressure", chapter: "Pressure and Defense", minutes: 5, feedback,
    assumptions: "Heads-up, no rake, stacks of 1,000. You are the big blind, so you act first after the flop. In every hand the pot is 60, you check, and he bets 20. You call 20 or raise to 70. A raise to 70 asks him to call 50 more into a final pot of 200. Outs are counted with one card to come and need no help from his cards, which stay hidden. The hand stops once you act.",
  }),
  stages: [
    welcome("Check, then raise.", "Strong hands and best draws, together.",
      "Out of position, you can let him bet first and then raise. Watch Knox raise a set and a draw the same way, then play three flops.", "Knox"),
    filmStage({ film: "x-check-raise", at: 60.83, spotId: "cr-turn", spot: turnSpot, upNext: "Play Knox’s set" }),
    whyStage("cr-why", "Why just call with sevens?", [
      { id: "folds-worse", text: "A raise folds the hands sevens beat and keeps the hands that beat sevens.", fix: "Right. The raise has no job here, so calling keeps his weaker hands in." },
      { id: "monster", text: "A check-raise always means a monster, and sevens aren’t one.", fix: "A check-raise isn’t always a monster: good draws raise too. Sevens call because a raise has no job." },
      { id: "price", text: "Because his price to call a raise would only be 25%.", fix: "25% is his price against a raise. It doesn’t decide your hand: what the raise folds and keeps does." },
    ]),
    decision("cr-guided", "cr-guided", "guided", "Knox’s set", "Knox’s set. He bets 20.", "Try a practice hand", { feedback }),
    decision("cr-practice", "cr-practice", "practice", "Practice", "A big draw. He bets 20.", "Try a fresh hand", { feedback }),
    decision("cr-fresh", "cr-fresh", "fresh", "Fresh hand", "Your flop. He bets 20.", "See your recap", { feedback }),
    takeaway({
      heading: "Raise with a job.",
      rule: "Check-raise your strongest hands and your best draws together.",
      lead: "From his seat both raises look the same. A medium pair calls: a raise would fold worse hands and keep better ones.",
      labels: ["Knox’s set", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "cr-guided": {
      decision: "action", choices: ["call", "raise"], sizes: SIZES, ...guided,
      title: "A set. Call, or raise to 70?",
      prompt: "Knox’s hand: 6♣ 6♥ on 9♠ 6♦ 2♣, a set. The pot was 60, you checked and he bets 20. Call 20, or raise to 70?",
      hint: "If he calls the raise, how big is the pot? If you just call, how big?",
      explanation: "Raise. If he calls 50 more, his price is 50 ÷ 200 = 25%, and the pot is 200 instead of the 100 a call makes. A set wants the bigger pot.",
      focus: ["6c", "6h", "6d"],
    },
    "cr-practice": {
      decision: "action", choices: ["call", "raise"], sizes: SIZES, ...practice,
      title: "A big draw. Call, or raise to 70?",
      prompt: "T♠ 9♠ on J♠ 8♦ 3♠. Any queen or seven makes a straight and any spade a flush: 15 outs. The pot was 60, you checked and he bets 20. Call 20, or raise to 70?",
      hint: "Your best draws raise with your strongest hands. What does this draw do when he calls?",
      explanation: "Raise. The draw wins two ways: he can fold now, and when he calls, 15 of the 47 unseen cards make a straight or a flush on the turn. Raised with your sets, it hides which one you hold.",
      focus: ["Ts", "9s", "Js", "8d", "3s"],
    },
    "cr-fresh": {
      decision: "action", choices: ["call", "raise"], sizes: SIZES, ...fresh,
      title: "Nines. Call, or raise to 70?",
      prompt: "9♦ 9♠ on Q♥ 7♣ 4♠. The pot was 60, you checked and he bets 20. Call 20, or raise to 70?",
      hint: "Ask the raise’s job: which hands fold, and which call?",
      explanation: "Call. Nines are a pair below the queen. A raise folds the hands nines beat and is called by the queens and better that beat you. Not every pair wants a bigger pot.",
    },
  },
  hands: {
    "cr-guided": huHand("cr-guided", { ...guided, pot: 60, bet: 20, heroFirst: true, decisions: ["cr-guided"], answer: "cr-guided", sizes: SIZES }),
    "cr-practice": huHand("cr-practice", { ...practice, pot: 60, bet: 20, heroFirst: true, decisions: ["cr-practice"], answer: "cr-practice", sizes: SIZES }),
    "cr-fresh": huHand("cr-fresh", { ...fresh, pot: 60, bet: 20, heroFirst: true, decisions: ["cr-fresh"], answer: "cr-fresh", sizes: SIZES }),
  },
};

export default definition;
