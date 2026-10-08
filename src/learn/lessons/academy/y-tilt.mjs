// y-tilt, Tilt and the Mental Game (The Player), academy v2 definition.
// Film: src-academy-y-tilt-v2 (87 s). canon.yourTurn is null, so the film plays to its stop and then
// asks its own question: "Same spot, a fourth time... what do you do?" (the film: keep calling).
// Plan: player.md (y-tilt). The M1 pot-odds spot: they go all-in for 50 into 100, the final pot is
// 200, your price 50 ÷ 200 = 25%, you win 30% (given): +10 a call. Three losses in a row at 30% to
// win happen 0.7³ = 34.3% of the time; five in a row 16.8%. Results never grade these decisions.
//   Your turn   the fourth time, same spot -> call (+10)
//   Guided      the film's spot, the first time -> call (+10)
//   Practice    after three losses: all-in 60 into 120, you win 20% (given): price 25% -> fold
//               (−12): the math decides, not the streak, either way
//   Fresh       after five losses: all-in 50 into 150, you win 25% (given): price 20% -> call
//               (+12.5), changed price and chance
// Keys: answerKeys/y-tilt.mjs. Every number: test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, takeaway } from "./kit.mjs";

const feedback = { found: "You graded it by the math.", missed: "Back to the math.", open: "Here’s the math." };
const river = (hero, board, potBefore, bet) => ({ street: "river", hero, board, potBefore, bet, call: bet });

const turnSpot = {
  decision: "action", choices: ["fold", "call"], ...river([], [], 100, 50),
  given: { equity: 30, lossesInRow: 3 },
  title: "Your turn: the fourth time.",
  prompt: "Three good calls, three losses. Same spot a fourth time: they go all-in for 50 into 100, and you win 30% of the time (given). Fold, or call 50?",
  hint: "Your price: your call over the final pot. Has the chance changed?",
  explanation: "Call. 50 ÷ 200 = 25%, and 30% is more: 0.3 × 200 − 50 = +10 a call, the same as the first time. Three losses in a row happen 34.3% of the time.",
};
delete turnSpot.hero;
delete turnSpot.board;

const guided = river(["Kh", "Qh"], ["Jh", "Tc", "4h", "2s", "7d"], 100, 50);
const practice = river(["9s", "8s"], ["Ts", "7d", "2c", "Kh", "4d"], 120, 60);
const fresh = river(["Ac", "5c"], ["Qc", "9c", "3d", "Jh", "6s"], 150, 50);

const definition = {
  ...definitionBase({
    node: "y-tilt", conceptId: "t6-tilt", coach: "mina", title: "Grade the decision.", kicker: "Not the last three results.",
    track: "player", chapter: "The Player", minutes: 4, feedback,
    assumptions: "Heads-up rivers, no rake. In each hand the opponent is all-in, and your chance to win when you call is given, as an estimate for this exercise. The cards already dealt in a streak don’t change the next deal. Each call is judged by its price and its average result, never by how it ends. The hand stops once you act.",
  }),
  stages: [
    welcome("Grade the decision.", "Not the last three results.",
      "Three good calls, three losses. Watch Mina keep the math in charge, then decide three rivers after losing streaks.", "Mina"),
    filmStage({ film: "y-tilt", at: null, spotId: "tl-turn", spot: turnSpot, upNext: "Play Mina’s river" }),
    whyStage("tl-why", "Why call the fourth time?", [
      { id: "math", text: "30% beats the 25% price: the call is still +10 on average, whatever the last three did.", fix: "Right. Losing three in a row at 30% happens 34.3% of the time. The math didn’t change." },
      { id: "calm", text: "Because I feel calm, so I can’t be tilting.", fix: "Tilt isn’t only anger. It is results steering your decisions, often quietly. The reason to call is the math, not your mood." },
      { id: "due", text: "Because after three losses I’m due a win.", fix: "Cards don’t remember. It is 30% every time; the call is right because of the price, not the streak." },
    ]),
    decision("tl-guided", "tl-guided", "guided", "Mina’s river", "Mina’s river, the first time.", "Try a practice hand", { feedback }),
    decision("tl-practice", "tl-practice", "practice", "Practice", "Three losses behind you. A new price.", "Try a fresh hand", { feedback }),
    decision("tl-fresh", "tl-fresh", "fresh", "Fresh hand", "Five losses behind you.", "See your recap", { feedback }),
    takeaway({
      heading: "The math decides.",
      rule: "Grade the decision by the math, not by the last three results.",
      lead: "Tilt is any time results steer the decision: calling less after losses, chasing them, playing on to win it back, or folding a good call to dodge the feeling.",
      labels: ["Mina’s river", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "tl-guided": {
      decision: "action", choices: ["fold", "call"], ...guided,
      given: { equity: 30 },
      title: "All-in for 50 into 100. Fold or call?",
      prompt: "Mina’s river. They go all-in for 50 into 100. You win 30% of the time (given). Fold, or call 50?",
      hint: "Your call over the final pot, against your chance.",
      explanation: "Call. 50 ÷ 200 = 25%, and 30% is more: 0.3 × 200 − 50 = +10 a call on average. You still lose this spot 70 times in 100.",
    },
    "tl-practice": {
      decision: "action", choices: ["fold", "call"], ...practice,
      given: { equity: 20, lossesInRow: 3 },
      title: "After three losses. Fold or call?",
      prompt: "You lost your last three all-in calls. Now they go all-in for 60 into 120, and you win 20% of the time (given). Fold, or call 60?",
      hint: "Forget the streak. Price first, then your chance.",
      explanation: "Fold. 60 ÷ 240 = 25%, and 20% is less: 0.2 × 240 − 60 = −12 a call. The fold is right because of the price, not because of the losses. Calling to win it back is the quiet tilt.",
    },
    "tl-fresh": {
      decision: "action", choices: ["fold", "call"], ...fresh,
      given: { equity: 25, lossesInRow: 5 },
      title: "After five losses. Fold or call?",
      prompt: "You lost your last five all-in calls. Now they go all-in for 50 into 150, and you win 25% of the time (given). Fold, or call 50?",
      hint: "Five in a row happens. Price first, then your chance.",
      explanation: "Call. 50 ÷ 250 = 20%, and 25% is more: 0.25 × 250 − 50 = +12.5 a call. Folding a good call to dodge the feeling is tilt too.",
    },
  },
  hands: {
    "tl-guided": huHand("tl-guided", { ...guided, pot: 100, bet: 50, stack: 50, heroFirst: true, decisions: ["tl-guided"], answer: "tl-guided" }),
    "tl-practice": huHand("tl-practice", { ...practice, pot: 120, bet: 60, stack: 60, heroFirst: true, decisions: ["tl-practice"], answer: "tl-practice" }),
    "tl-fresh": huHand("tl-fresh", { ...fresh, pot: 150, bet: 50, stack: 50, heroFirst: true, decisions: ["tl-fresh"], answer: "tl-fresh" }),
  },
};

export default definition;
