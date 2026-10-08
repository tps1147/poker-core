// o-multiway, Multiway Pots (Other Tables), academy v2 definition.
// Film: src-academy-o-multiway-v2 (91 s). canon.yourTurn = "yourTurn" at 69.34 s: "Your turn. Two
// players, each folds 70%. Both fold? 0.7 × 0.7... 49%. Above 40%, so you can bet."
// Plan: formats.md (o-multiway). Against random hands, an illustration: A♦ J♣ on J♥ 7♠ 3♦ is behind
// 43 of 1,081 single hands (4.0%), 7.8% of deals against two and 11.5% against three (the plan
// script enumerates every deal). Folds are given per player and independent: all of them must fold.
//   Your turn   two players at 70% each, a 2/3-pot bluff (needs 40%): 49% -> bet
//   Guided      A♦ J♣ on J♥ 7♠ 3♦ against three: someone is ahead 11.5% of the time
//   Practice    three players at 60% each, a 2/3-pot bluff: 21.6% < 40% -> check
//   Fresh       two players at 60% each, a half-pot bluff (needs 1/3): 36% -> bet (changed size)
// Keys: answerKeys/o-multiway.mjs. Every number: test/academyLessonsB.test.mjs and the plan script.
import { definitionBase, welcome, filmStage, whyStage, decision, bands, takeaway } from "./kit.mjs";

const feedback = { found: "You counted every player.", missed: "Count every player again.", open: "Here’s the count." };
const NAMES = ["Rae", "Ned", "Ivy"];

// A flop with `others` opponents; the hero has the button and acts last. Each opponent checks, then
// the hero decides; an action spot plays the hero's answer.
function tableHand(id, { hero, board, pot, others, decisions, answer = null, sizes = null }) {
  const opponents = NAMES.slice(0, others);
  const script = [{ do: "pause", ms: 400 }, ...opponents.map((name) => ({ do: "act", seat: name.toLowerCase(), action: "check" }))];
  decisions.forEach((spotId, i) => script.push(i ? { do: "decide", spotId, when: "answered" } : { do: "decide", spotId }));
  if (answer) script.push({ do: "act", seat: "hero", action: "answer", spotId: answer, ...(sizes ? { sizes } : {}) });
  return {
    id, layout: "six-max",
    seats: [{ id: "hero", name: "You", stack: 1000 }, ...opponents.map((name) => ({ id: name.toLowerCase(), name, stack: 1000 }))],
    button: "hero", hero,
    start: { street: board.length === 3 ? "flop" : board.length === 4 ? "turn" : "river", board, pot, dealt: "deal" },
    script,
  };
}

const turnSpot = {
  decision: "action", choices: ["check", "bet"], sizes: { bet: 60 }, potBefore: 90, players: 2,
  given: { foldRate: 70 },
  title: "Your turn: bluff two players?",
  prompt: "Two players, each folds 70% of the time on his own (given). You bluff 60 into 90, which needs 40% folds. Check, or bet 60?",
  hint: "Both must fold. Multiply their fold rates.",
  explanation: "Bet. Both fold 0.7 × 0.7 = 49% of the time, above the 40% the bluff needs.",
};

const guided = { street: "flop", hero: ["Ad", "Jc"], board: ["Jh", "7s", "3d"] };
const practice = { street: "turn", hero: ["Qc", "Tc"], board: ["9h", "6d", "4s", "2c"] };
const fresh = { street: "turn", hero: ["Kd", "Qd"], board: ["Th", "8c", "5s", "3h"] };

const definition = {
  ...definitionBase({
    node: "o-multiway", conceptId: "t6-multiway", coach: "knox", title: "Every player is another range.", kicker: "Bluff less, value bet stronger.",
    track: "formats", chapter: "Other Tables", minutes: 5, feedback,
    assumptions: "No rake. Hands ahead of yours are counted against random hands, an illustration, with only the cards you can see removed, and nothing about future cards. Each opponent’s fold rate is given, and each decides on his own, so a bluff wins only when all of them fold. A bet of 2/3 of the pot breaks even at 40% folds, half the pot at 1/3. Each hand stops once you act.",
  }),
  stages: [
    welcome("Every player is another range.", "Bluff less, value bet stronger.",
      "Top pair against one player is strong. Against three? Watch Knox count the seats, then play three pots with more than one opponent.", "Knox"),
    filmStage({ film: "o-multiway", at: 69.34, spotId: "mw-turn", spot: turnSpot, upNext: "Play Knox’s flop" }),
    whyStage("mw-why", "Why can you bluff these two?", [
      { id: "both", text: "Both must fold: 0.7 × 0.7 = 49%, above the 40% a 2/3-pot bluff needs.", fix: "Right. Against three players at 70%, it would be 34.3%: not enough." },
      { id: "more-value", text: "More players put more chips in the pot, so any bet is worth more.", fix: "More callers don’t mean more value for any hand. Each extra player is one more range that has to fold." },
      { id: "each", text: "Each one folds 70%, which is above 40%.", fix: "One player alone isn’t the test. Both must fold together: 49%." },
    ]),
    decision("mw-guided", "mw-guided", "guided", "Knox’s flop", "Knox’s top pair, three opponents.", "Try a practice hand", { feedback }),
    decision("mw-practice", "mw-practice", "practice", "Practice", "Three opponents. Bluff?", "Try a fresh hand", { feedback }),
    decision("mw-fresh", "mw-fresh", "fresh", "Fresh hand", "Two opponents, a smaller bet.", "See your recap", { feedback }),
    takeaway({
      heading: "Count every range.",
      rule: "Every extra player is another range to beat. Bluff less and value bet stronger hands.",
      lead: "Against random hands top pair is behind 4.0% of the time against one, 7.8% against two and 11.5% against three. A bluff needs all of them to fold.",
      labels: ["Knox’s flop", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "mw-guided": {
      decision: "estimate", ...guided,
      bands: bands(["p4", "About 4%"], ["p11", "About 11.5%"], ["p30", "About 30%"]),
      dockPrompt: "How often is someone already ahead?",
      title: "Top pair, three opponents.",
      prompt: "Knox’s hand: A♦ J♣ on J♥ 7♠ 3♦. Against three random hands (an illustration), how often does at least one of them already beat you?",
      hint: "Against one hand it is 43 of 1,081, about 4%. Each seat adds its own hands.",
      explanation: "About 11.5%. Against one random hand 4.0%, against two 7.8%, against three 11.5%. Each seat just adds hands that already beat you.",
    },
    "mw-practice": {
      decision: "action", choices: ["check", "bet"], sizes: { bet: 60 }, ...practice,
      given: { foldRate: 60, players: 3 },
      title: "Three opponents. Bluff 60 into 90?",
      prompt: "Q♣ T♣ on 9♥ 6♦ 4♠ 2♣, queen high. Three opponents check to you; the pot is 90. Each folds to a bet of 60 60% of the time, on his own (given). The bluff needs 40%. Check, or bet 60?",
      hint: "All three must fold: 0.6 × 0.6 × 0.6.",
      explanation: "Check. All three fold only 0.6 × 0.6 × 0.6 = 21.6% of the time, far short of 40%. The same bluff works heads-up, where 60% is enough.",
    },
    "mw-fresh": {
      decision: "action", choices: ["check", "bet"], sizes: { bet: 45 }, ...fresh,
      given: { foldRate: 60, players: 2 },
      title: "Two opponents. Bluff 45 into 90?",
      prompt: "K♦ Q♦ on T♥ 8♣ 5♠ 3♥, king high. Two opponents check to you; the pot is 90. Each folds to a bet of 45 60% of the time, on his own (given). A half-pot bluff needs 1/3. Check, or bet 45?",
      hint: "Both must fold. Compare with 45 ÷ (90 + 45).",
      explanation: "Bet. Both fold 0.6 × 0.6 = 36% of the time, above the 33.3% a half-pot bluff needs. A smaller bluff needs fewer folds, so it can still work against two.",
    },
  },
  hands: {
    "mw-guided": tableHand("mw-guided", { ...guided, pot: 80, others: 3, decisions: ["mw-guided"] }),
    "mw-practice": tableHand("mw-practice", { ...practice, pot: 90, others: 3, decisions: ["mw-practice"], answer: "mw-practice", sizes: { bet: 60 } }),
    "mw-fresh": tableHand("mw-fresh", { ...fresh, pot: 90, others: 2, decisions: ["mw-fresh"], answer: "mw-fresh", sizes: { bet: 45 } }),
  },
};

export default definition;
