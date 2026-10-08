// y-bankroll, Bankroll (The Player), academy v2 definition.
// Film: src-academy-y-bankroll-v2 (89 s). canon.yourTurn is null, so the film plays to its stop and
// then asks its own question: "You win more sessions than you lose. Can you still go broke?" (yes).
// Plan: player.md (y-bankroll). Chips and buy-ins in a stated toy model, never money advice: each
// session wins or loses one buy-in, and this player wins 55% of sessions. The chance of ever losing
// the whole bankroll from N buy-ins is (45/55)^N = (9/11)^N: 5 -> 36.7%, 10 -> 13.4%, 20 -> 1.8%,
// 40 -> 0.033%.
//   Your turn   can a winning player go broke -> yes (from 5 buy-ins, 36.7% in the model)
//   Guided      2,000 chips at a 100-chip game -> 20 buy-ins
//   Practice    2,000 chips: the 100-chip game (20, 1.8%) or the 50-chip game (40, 0.033%), which
//               keeps the model's chance under 1% -> the 50-chip game
//   Fresh       1,500 chips: the 150-chip game (10, 13.4%) or the 75-chip game (20, 1.8%), which
//               keeps it under 5% -> the 75-chip game (changed amounts)
// Keys: answerKeys/y-bankroll.mjs. Every number: test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, bands, takeaway } from "./kit.mjs";

const feedback = { found: "You counted the cushion.", missed: "Count it in buy-ins.", open: "Here’s the count." };
const preflop = (hero) => ({ street: "preflop", hero, board: [] });

const turnSpot = {
  decision: "estimate",
  bands: bands(["no", "No"], ["yes", "Yes"]),
  dockPrompt: "Can a winning player go broke?",
  title: "Your turn: can a winner go broke?",
  prompt: "In the film’s toy model this player wins 55% of his sessions, an edge of a tenth of a buy-in a session. Can he still lose his whole bankroll?",
  hint: "Look at the rows: from 5 buy-ins, from 10, from 20.",
  explanation: "Yes. Same player, same edge: from 5 buy-ins he loses it all 36.7% of the time, from 20 only 1.8%. Only the cushion changed.",
};

const guided = preflop(["Ah", "7c"]);
const practice = preflop(["Kd", "Qs"]);
const fresh = preflop(["9c", "9d"]);

const definition = {
  ...definitionBase({
    node: "y-bankroll", conceptId: "t6-bankroll", coach: "mina", title: "Count it in buy-ins.", kicker: "A bad run should be a dip, not the end.",
    track: "player", chapter: "The Player", minutes: 4, feedback,
    assumptions: "Chips in a toy model, not money advice. A buy-in is the chips one game asks you to sit down with. In the model each session wins or loses exactly one buy-in, and this player wins 55% of sessions. Under it, the chance of ever losing the whole bankroll from N buy-ins is (45 ÷ 55) to the power N. The bankrolls and games are examples. Each hand at the table stops before the flop.",
  }),
  stages: [
    welcome("Count it in buy-ins.", "A bad run should be a dip, not the end.",
      "This is about chips in a toy model, not money advice. Watch Mina count a bankroll in buy-ins, then size three games.", "Mina"),
    filmStage({ film: "y-bankroll", at: null, spotId: "br-turn", spot: turnSpot, upNext: "Count Mina’s bankroll" }),
    whyStage("br-why", "Why can a winning player still go broke?", [
      { id: "cushion", text: "His edge is an average. A normal bad run can take a short bankroll before the average shows.", fix: "Right. From 5 buy-ins, 36.7%; from 40, 0.033%. Same player, a bigger cushion." },
      { id: "not-winner", text: "He can’t: if he goes broke, he wasn’t really a winning player.", fix: "He wins 55% of sessions in the model and still goes broke 36.7% of the time from 5 buy-ins. Winning and going broke can both happen." },
      { id: "plays-badly", text: "Only if he starts playing badly when he’s losing.", fix: "Playing the same way every session, he can still run out. The cushion, not his play, is what changed." },
    ]),
    decision("br-guided", "br-guided", "guided", "Mina’s bankroll", "Mina’s bankroll. Count the buy-ins.", "Try a practice hand", { feedback }),
    decision("br-practice", "br-practice", "practice", "Practice", "Two games. Which one?", "Try a fresh hand", { feedback }),
    decision("br-fresh", "br-fresh", "fresh", "Fresh hand", "A new bankroll. Pick the game.", "See your recap", { feedback }),
    takeaway({
      heading: "A dip, not the end.",
      rule: "Count your bankroll in buy-ins, and keep enough of them that a bad run is a dip, not the end.",
      lead: "In the toy model: from 5 buy-ins 36.7%, from 10 13.4%, from 20 1.8%, from 40 0.033%. Chips, not money advice.",
      labels: ["Mina’s bankroll", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "br-guided": {
      decision: "estimate", ...guided, bankroll: 2000, buyIn: 100,
      bands: bands(["bi-10", "10 buy-ins"], ["bi-20", "20 buy-ins"], ["bi-40", "40 buy-ins"]),
      dockPrompt: "How many buy-ins?",
      title: "2,000 chips, a 100-chip game.",
      prompt: "Mina’s example: a bankroll of 2,000 chips, at a game with a 100-chip buy-in. How many buy-ins is that?",
      hint: "Divide the bankroll by one buy-in.",
      explanation: "2,000 ÷ 100 = 20 buy-ins. In the toy model, from 20 buy-ins this player loses it all 1.8% of the time.",
    },
    "br-practice": {
      decision: "estimate", ...practice, bankroll: 2000, games: [100, 50], under: 1,
      bands: bands(["game-100", "The 100-chip game"], ["game-50", "The 50-chip game"]),
      dockPrompt: "Which game keeps it under 1%?",
      title: "2,000 chips. Which game?",
      prompt: "The same 2,000 chips. Two games: one with a 100-chip buy-in, one with a 50-chip buy-in. In the toy model, which keeps the chance of losing it all under 1%?",
      hint: "Count the buy-ins for each game, then find its row.",
      explanation: "The 50-chip game: 2,000 ÷ 50 = 40 buy-ins, 0.033% in the model. At the 100-chip game it is 20 buy-ins and 1.8%.",
    },
    "br-fresh": {
      decision: "estimate", ...fresh, bankroll: 1500, games: [150, 75], under: 5,
      bands: bands(["game-150", "The 150-chip game"], ["game-75", "The 75-chip game"]),
      dockPrompt: "Which game keeps it under 5%?",
      title: "1,500 chips. Which game?",
      prompt: "A bankroll of 1,500 chips. Two games: a 150-chip buy-in or a 75-chip buy-in. In the toy model, which keeps the chance of losing it all under 5%?",
      hint: "Count the buy-ins for each game, then find its row.",
      explanation: "The 75-chip game: 1,500 ÷ 75 = 20 buy-ins, 1.8% in the model. At the 150-chip game it is only 10 buy-ins, and 13.4%.",
    },
  },
  hands: {
    "br-guided": huHand("br-guided", { ...guided, pot: 0, blinds: [50, 100], stack: 2000, decisions: ["br-guided"] }),
    "br-practice": huHand("br-practice", { ...practice, pot: 0, blinds: [25, 50], stack: 2000, decisions: ["br-practice"] }),
    "br-fresh": huHand("br-fresh", { ...fresh, pot: 0, blinds: [25, 50], stack: 1500, decisions: ["br-fresh"] }),
  },
};

export default definition;
