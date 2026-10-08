// o-heads-up, Heads-Up Play (Other Tables), academy v2 definition.
// Film: src-academy-o-heads-up-v2 (70 s). canon.yourTurn is null, so the film plays to its stop and
// then asks its own question: "When only one opponent is left, should you still wait for the same
// strong hands?" (the film: no, play wider).
// Numbers: LATER-SCOPE-NUMBERS-2026-10-07.md. The blinds cost 1.5 big blinds a round: a full table of
// 9 pays 1.5 ÷ 9 ≈ 0.17 big blind a hand, heads-up 1.5 ÷ 2 = 0.75, 4.5 times as much. One opponent
// holds a pocket pair 78 ÷ 1,326 = 5.9% of the time. Heads-up the button posts the small blind, acts
// first before the flop and last on every street after.
//   Your turn   same strong hands heads-up -> no, play wider
//   Guided      who acts first before the flop heads-up -> the button (small blind)
//   Practice    what the blinds cost a hand heads-up -> 0.75 big blind
//   Fresh       heads-up against six-handed: 0.75 ÷ 0.25 -> 3 times as much (changed table size)
// Keys: answerKeys/o-heads-up.mjs. Every number: test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, bands, takeaway } from "./kit.mjs";

const feedback = { found: "You read the heads-up table.", missed: "Count what waiting costs.", open: "Here’s the count." };
const preflop = (hero) => ({ street: "preflop", hero, board: [] });

const turnSpot = {
  decision: "estimate",
  bands: bands(["same", "Yes, the same hands"], ["wider", "No, play wider"]),
  dockPrompt: "Wait for the same strong hands?",
  title: "Your turn: the same hands heads-up?",
  prompt: "Nine players, then six, then two. With only one opponent left, should you still wait for the same strong hands you played at a full table?",
  hint: "What does waiting cost per hand, and how many players can hold a better hand?",
  explanation: "No, play wider. Heads-up the blinds cost three-quarters of a big blind a hand, 4.5 times a full table, and only one player can hold a better hand.",
};

const guided = preflop(["Kc", "8d"]);
const practice = preflop(["Qh", "6c"]);
const fresh = preflop(["Js", "7s"]);

const definition = {
  ...definitionBase({
    node: "o-heads-up", coach: "reina", title: "Heads-up, play wider.", kicker: "But every chip still needs a reason.",
    track: "formats", chapter: "Other Tables", minutes: 4, feedback,
    assumptions: "Blinds of one small blind and one big blind, worth 1.5 big blinds a round, no antes and no rake. A round is one hand per player at the table, so the blinds cost 1.5 ÷ (number of players) big blinds a hand on average. Heads-up the button posts the small blind. Each hand stops before the flop.",
  }),
  stages: [
    welcome("Heads-up, play wider.", "But every chip still needs a reason.",
      "With one opponent left, the rules change shape and waiting gets expensive. Watch Reina, then read three heads-up hands.", "Reina"),
    filmStage({ film: "o-heads-up", at: null, spotId: "hu-turn", spot: turnSpot, upNext: "Play Reina’s heads-up hand" }),
    whyStage("hu-why", "Why play wider heads-up?", [
      { id: "cost", text: "Waiting costs 0.75 big blind a hand, 4.5 times a full table, and only one player can hold a better hand.", fix: "Right. The nit bleeds away; the player who never stops raising gets picked off." },
      { id: "same", text: "Strong hands are strong anywhere, so the hands you play don’t change.", fix: "Not heads-up. With one opponent, fewer hands beat you, and waiting costs 4.5 times as much." },
      { id: "acts-first", text: "Because heads-up the button acts first on every street.", fix: "The button acts first only before the flop, then last on every street after." },
    ]),
    decision("hu-guided", "hu-guided", "guided", "Reina’s hand", "Reina’s heads-up hand. Who acts first?", "Try a practice hand", { feedback }),
    decision("hu-practice", "hu-practice", "practice", "Practice", "What does waiting cost?", "Try a fresh hand", { feedback }),
    decision("hu-fresh", "hu-fresh", "fresh", "Fresh hand", "Compare with six-handed.", "See your recap", { feedback }),
    takeaway({
      heading: "Wider, with a reason.",
      rule: "Heads-up, play wider and keep the pressure on, but every chip still needs a reason.",
      lead: "The button posts the small blind, acts first before the flop and last after it. Waiting costs 0.75 big blind a hand, and one opponent holds a pocket pair only 5.9% of the time.",
      labels: ["Reina’s hand", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "hu-guided": {
      decision: "estimate", ...guided,
      bands: bands(["button", "You, the button and small blind"], ["big-blind", "The big blind"]),
      dockPrompt: "Who acts first before the flop?",
      title: "Heads-up. Who acts first?",
      prompt: "Reina’s heads-up hand. You have the button, so you post the small blind. Before the flop, who acts first?",
      hint: "Heads-up the button is the small blind. Who acts first before the flop, and who after?",
      explanation: "You do: the button posts the small blind and acts first before the flop. After the flop you act last on every street, so the button has position for the whole hand after the flop, every other hand.",
    },
    "hu-practice": {
      decision: "estimate", ...practice,
      bands: bands(["bb-017", "About 0.17 big blind"], ["bb-075", "0.75 big blind"], ["bb-150", "1.5 big blinds"]),
      dockPrompt: "What do the blinds cost a hand?",
      title: "What do the blinds cost a hand?",
      prompt: "Each round costs you 1.5 big blinds in blinds. At a full table of 9 that is about 0.17 big blind a hand. Heads-up, about how much is it a hand?",
      hint: "Heads-up, a round is only two hands.",
      explanation: "0.75 big blind: 1.5 ÷ 2. That is 4.5 times the full table’s 1.5 ÷ 9, so waiting for the same strong hands costs 4.5 times as much.",
    },
    "hu-fresh": {
      decision: "estimate", ...fresh,
      bands: bands(["x2", "2 times as much"], ["x3", "3 times as much"], ["x45", "4.5 times as much"]),
      dockPrompt: "How many times as much?",
      title: "Heads-up against six-handed.",
      prompt: "Each round costs 1.5 big blinds in blinds. How many times as much do the blinds cost you a hand heads-up as at a six-handed table?",
      hint: "Work out the cost a hand at each table: 1.5 ÷ the number of players.",
      explanation: "3 times: heads-up 1.5 ÷ 2 = 0.75, six-handed 1.5 ÷ 6 = 0.25, and 0.75 ÷ 0.25 = 3.",
    },
  },
  hands: {
    "hu-guided": huHand("hu-guided", { ...guided, pot: 0, blinds: [5, 10], decisions: ["hu-guided"] }),
    "hu-practice": huHand("hu-practice", { ...practice, pot: 0, blinds: [5, 10], decisions: ["hu-practice"] }),
    "hu-fresh": huHand("hu-fresh", { ...fresh, pot: 0, blinds: [5, 10], decisions: ["hu-fresh"] }),
  },
};

export default definition;
