// Postflop 7, Playing Draws (f-playing-draws), v2 lesson, content version 2. Vale's film pauses at
// its yourTurn anchor (67.72 s, "Your turn. Nine outs again. He bets 60 into 120, with 300 behind")
// for the "Your turn" spot: 6♣ 5♣ on K♣ 9♣ 2♦, price 25%, at least 74 needed later, 300 behind: call.
// v2 (2026-10-09): no step replays the film's draw any more. The guided hand is a new nine-out draw
// (8♦ 7♦ on J♦ 5♦ 2♠: he bets 40 into 100, 250 behind; price 22.2%, at least 29 needed later: call).
// Practice and fresh play that same guided draw ("Same flush draw"): practice faces 80 into 120 with
// only 60 behind (price 28.6%, at least 138 needed later: fold); fresh is all-in 100 into 100 (378 of
// 1,081 runouts, 35.0%, against a 33.3% price: call). The raise is the next track's.
// Keys: answerKeys/f-playing-draws.mjs.
import { huHand, options, seatsHU, v2Lesson, v2Stages } from "./kitEarly.mjs";

const FILM_HERO = ["6c", "5c"];
const FILM_FLOP = ["Kc", "9c", "2d"];
const HERO = ["8d", "7d"];
const FLOP = ["Jd", "5d", "2s"];
const facing = (potBefore, bet, hero = HERO, board = FLOP) => ({ street: "flop", hero, board, potBefore, bet, call: bet });

// The film's own question (its "Your turn" spot), as the film asks it.
const turnSpot = {
  decision: "action", choices: ["fold", "call"], ...facing(120, 60, FILM_HERO, FILM_FLOP),
  title: "Your turn: nine outs again.",
  prompt: "6♣ 5♣ on K♣ 9♣ 2♦: nine clubs make your flush. He bets 60 into 120, and you each have 300 behind after a call. Call or fold?",
  hint: "Find the price first. Then ask how much more you would need to win later, and whether the stacks hold it.",
  explanation: "Calling 60 makes a 240 pot: a 25% price, and the next card hits 9 of 47 times, about 19.1%. Short on price alone, you need at least 74 more later (60 ÷ 9/47 − 240), and 300 behind leaves room: call.",
};

const spots = {
  "pd-guided": {
    decision: "action", choices: ["fold", "call"], ...facing(100, 40),
    title: "A new draw, a smaller bet.",
    prompt: "8♦ 7♦ on J♦ 5♦ 2♠, another nine-out flush draw. He bets 40 into 100. After a call you each still have 250. Call or fold?",
    hint: "Price first: your call over the final pot. Then how much more you need later, and whether 250 holds it.",
    explanation: "Calling 40 makes a 180 pot: a 22.2% price, against about 19.1% to hit on the next card. Short on price alone, you need at least 29 more later (40 ÷ 9/47 − 180 is about 28.9), and 250 behind leaves room: call.",
  },
  "pd-practice": {
    decision: "action", choices: ["fold", "call"], ...facing(120, 80),
    title: "The stacks decide.",
    prompt: "Same flush draw. This time he bets 80 into 120, and he has only 60 behind after your call. Call or fold?",
    hint: "On price alone the draw is short. How much more would you need later, and can his 60 pay it?",
    explanation: "Calling 80 makes a 280 pot, a 28.6% price, against about 19.1%. You would need about 137.8 more later, so at least 138, and only 60 is there to win: fold.",
  },
  "pd-fresh": {
    decision: "action", choices: ["fold", "call"], ...facing(100, 100),
    title: "All-in this time.",
    prompt: "Same flush draw. He moves all-in for 100 into 100. No more betting can follow, so you see both the turn and the river. Call or fold?",
    hint: "All-in, you see two cards for this one price. Count the runouts that make your flush.",
    explanation: "Calling 100 makes a 300 pot, a price of about 33.3%. With both cards to come, 378 of the 1,081 turn-and-river pairs make your flush: 35.0%, above the price, so call.",
  },
};

const definition = v2Lesson({
  node: "f-playing-draws", version: 2, film: "f-playing-draws", coach: "knox", access: "pro", track: "Postflop", minutes: 4,
  title: "Price first.", kicker: "Then the stacks, then the raise.",
  assumptions: "Heads-up on the flop with a nine-out flush draw; ties and other draws are ignored. The chance to hit is exact: 9 of 47 unseen cards on the next card, 378 of 1,081 pairs with both cards to come. Whether he pays you later is a read this lesson does not grade: only the arithmetic and the stack cap.",
  stages: v2Stages({
    welcome: { heading: "A flush draw faces a bet.", em: "Call, raise or fold?", lead: "Watch Knox price a draw and let the stacks decide, then play three draws at the table.", cta: "Watch with Knox" },
    film: { upNext: "Price a new draw", film: "f-playing-draws", at: 67.72, spot: turnSpot },
    hands: [
      { id: "pd-guided", label: "A new draw", coachLine: "Diamonds this time. Price first." },
      { id: "pd-practice", label: "Practice", coachLine: "A short stack behind." },
      { id: "pd-fresh", label: "Fresh hand", coachLine: "He’s all-in." },
    ],
    why: { prompt: "Why call when the price alone is short?",
      options: options(
        ["room", "The price is short, 19.1% against 25%, but 300 behind leaves room for the 74 more you need.", "Right. Price first, then the stacks: there is enough behind to win what the price is missing."],
        ["passive", "Draws are always just called.", "Not always: with 40 behind the same draw folds, and a raise is another way to play it."],
        ["times4", "9 outs × 4 is 36%, above the 25% price.", "He can bet again on the turn: this price buys one card, about 19.1%."]) },
    takeaway: { heading: "Price first.",
      lead: "Price first; then ask what the stacks let you win later, and whether a raise wins it now.",
      ruleCard: { lines: ["Price first.", "Then ask what the stacks let you win later...", "and whether a raise wins it now."], sub: null } },
  }),
  spots,
  hands: {
    "pd-guided": huHand("pd-guided", { hero: HERO, board: FLOP, pot: 100, seats: seatsHU("Ace Andy", 290, 290), acts: [{ seat: "opponent", action: "bet", amount: 40 }], answer: {} }),
    "pd-practice": huHand("pd-practice", { hero: HERO, board: FLOP, pot: 120, seats: seatsHU("Ace Andy", 1000, 140), acts: [{ seat: "opponent", action: "bet", amount: 80 }], answer: {} }),
    "pd-fresh": huHand("pd-fresh", { hero: HERO, board: FLOP, pot: 100, seats: seatsHU("Ace Andy", 1000, 100), acts: [{ seat: "opponent", action: "bet", amount: 100 }], answer: {} }),
  },
});

export default definition;
