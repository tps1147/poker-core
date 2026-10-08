// o-tournaments-icm, Tournaments and ICM (Other Tables), academy v2 definition.
// Film: src-academy-o-tournaments-icm-v2 (92.5 s). canon.yourTurn = "yourTurn" at 67.51 s: "Your
// turn. The big stack calls the same flip. Before... 38.4%. After, on average... 38.1%. Both lose
// money. The player who sat out gains."
// Numbers: LATER-SCOPE-NUMBERS-2026-10-07.md and src-academy-o-tournaments-icm-v2/truth.mjs, by the
// Malmuth–Harville recursion (each place goes to a remaining player in proportion to his chips).
// Three players with 5,000 / 3,000 / 2,000, paid 50% / 30% / 20% of the prize pool: prize shares
// 38.4% / 32.8% / 28.9%. A coin flip, short against big: win -> 3,000 / 3,000 / 4,000 and the short
// stack's share 35.4%; lose -> out in third, 20%; average 27.7%.
//   Your turn   the big stack calls the flip: 38.4% -> 38.1% on average -> he loses prize money
//   Guided      you are the short stack, the big stack puts you all-in, a pure coin flip:
//               fold 28.9% against call 27.7% -> fold
//   Practice    you are the middle stack, out of the hand: 32.8% -> 34.1% on average -> you gain
//   Fresh       the same all-in, but you win 55% (given): chips 0.55 × 4,000 = 2,200 > 2,000, yet
//               prize share 0.55 × 35.4% + 0.45 × 20% = 28.5% < 28.9% -> fold (changed chance)
// The blinds are left out. Keys: answerKeys/o-tournaments-icm.mjs. Every share is recomputed by
// the Harville recursion in test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, bands, takeaway } from "./kit.mjs";

const feedback = { found: "You priced it in prize money.", missed: "Price it in prize money, not chips.", open: "Here’s the prize math." };
const STACKS = { big: 5000, mid: 3000, short: 2000 };

// Three players. `heroSeat` is which stack the hero holds; the big stack puts the short stack all-in.
function icmHand(id, { hero, heroSeat, decisions, answer = null }) {
  const others = Object.keys(STACKS).filter((k) => k !== heroSeat);
  const names = { big: "Big stack", mid: "Middle stack", short: "Short stack" };
  const seats = [{ id: "hero", name: "You", stack: STACKS[heroSeat] }, ...others.map((k) => ({ id: k, name: names[k], stack: STACKS[k] }))];
  const script = [{ do: "pause", ms: 400 }];
  if (heroSeat === "short") script.push({ do: "act", seat: "big", action: "bet", amount: 2000 }, { do: "act", seat: "mid", action: "fold" });
  decisions.forEach((spotId, i) => script.push(i ? { do: "decide", spotId, when: "answered" } : { do: "decide", spotId }));
  if (answer) script.push({ do: "act", seat: "hero", action: "answer", spotId: answer });
  return {
    id, layout: "six-max", seats, button: "big", hero,
    start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
    script,
  };
}

const turnSpot = {
  decision: "estimate", stacks: [5000, 3000, 2000], payouts: [50, 30, 20],
  bands: bands(["gains", "He gains prize money"], ["same", "About the same"], ["loses", "He loses prize money"]),
  dockPrompt: "What happens to the big stack’s prize money?",
  title: "Your turn: the big stack calls.",
  prompt: "The big stack calls the short stack’s all-in: a pure coin flip, fair in chips. On average, what happens to the big stack’s share of the prize money?",
  hint: "Before, he has 38.4%. Work out his share if he wins the flip and if he loses it.",
  explanation: "He loses: 38.4% before, 38.1% on average after. Both players in the flip lose prize money, and the player who sat out gains.",
};

const short = { street: "preflop", board: [], hero: ["Ac", "Td"], call: 2000 };
const mid = { street: "preflop", board: [], hero: ["9h", "9s"] };
const fresh = { street: "preflop", board: [], hero: ["Ah", "Qs"], call: 2000 };

const definition = {
  ...definitionBase({
    node: "o-tournaments-icm", conceptId: "t6-icm", coach: "reina", title: "Chips aren’t money.", kicker: "Survival has a price.",
    track: "formats", chapter: "Other Tables", minutes: 5, feedback,
    assumptions: "Three players left in a tournament: 5,000, 3,000 and 2,000 chips. First place takes 50% of the prize pool, second 30%, third 20%. Each player’s share of the prize money comes from his chance of each place, worked out from the chips (ICM, the Malmuth–Harville model): each place goes to a remaining player in proportion to his chips. The blinds are left out, and your chance to win an all-in is given.",
  }),
  stages: [
    welcome("Chips aren’t money.", "Survival has a price.",
      "Is every tournament chip worth the same money? Watch Reina work out the prize shares, then decide three all-ins.", "Reina"),
    filmStage({ film: "o-tournaments-icm", at: 67.51, spotId: "ic-turn", spot: turnSpot, upNext: "Play Reina’s all-in" }),
    whyStage("ic-why", "Why does the big stack lose money on a fair flip?", [
      { id: "places", text: "Prize money pays for places: the chips he can win are worth less to him than the chips he risks.", fix: "Right. 38.4% before, 38.1% on average after; the player who sat out gains." },
      { id: "chips", text: "He doesn’t: a fair flip in chips is fair in money too.", fix: "Chip value and prize money aren’t the same in tournaments. The flip is fair in chips and costs both players money." },
      { id: "lead", text: "Because he might lose his chip lead.", fix: "Not just that: averaged over winning and losing the flip, his share still drops, from 38.4% to 38.1%." },
    ]),
    decision("ic-guided", "ic-guided", "guided", "Reina’s all-in", "You are the short stack. The big stack puts you all-in.", "Try a practice hand", { feedback }),
    decision("ic-practice", "ic-practice", "practice", "Practice", "You sit out the flip.", "Try a fresh hand", { feedback }),
    decision("ic-fresh", "ic-fresh", "fresh", "Fresh hand", "The same all-in, a better chance.", "See your recap", { feedback }),
    takeaway({
      heading: "Survival has a price.",
      rule: "In tournaments, chips aren't money. Survival has a price, so call tighter near the payouts.",
      lead: "5,000 / 3,000 / 2,000 chips are worth 38.4% / 32.8% / 28.9% of the prize pool: flatter than the chips. A fair flip in chips loses money for both players in it.",
      labels: ["Reina’s all-in", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "ic-guided": {
      decision: "action", choices: ["fold", "call"], ...short,
      given: { equity: 50 },
      title: "A coin flip for your tournament. Fold or call?",
      prompt: "You are the short stack with 2,000. The big stack puts you all-in and the middle stack folds: a pure coin flip, 50% (given). Folding keeps your 28.9% of the prize pool. Fold, or call 2,000?",
      hint: "Win and the stacks are 3,000 / 3,000 / 4,000; lose and you are out in third with 20%. Average your share.",
      explanation: "Fold. Win and your share climbs to 35.4%; lose and you finish third with 20%. The average is 27.7%, less than the 28.9% you keep by folding. Fair in chips, a loss in prize money.",
    },
    "ic-practice": {
      decision: "estimate", ...mid,
      bands: bands(["gains", "You gain prize money"], ["loses", "You lose prize money"]),
      dockPrompt: "What happens to your prize money?",
      title: "You sit out the flip.",
      prompt: "You are the middle stack with 3,000 and you fold. The short stack and the big stack play a pure coin flip for 2,000. Your share is 32.8% now. On average, after the flip?",
      hint: "If the short stack wins, the stacks are 3,000 / 3,000 / 4,000. If he loses, he is out and you are sure of at least second.",
      explanation: "You gain: 32.8% now, 34.1% on average after. When either player busts, you move up a place for free. That is the price of their survival, paid to you.",
    },
    "ic-fresh": {
      decision: "action", choices: ["fold", "call"], ...fresh,
      given: { equity: 55 },
      title: "55% for your tournament. Fold or call?",
      prompt: "You are the short stack with 2,000 again. The big stack puts you all-in, and this time you win 55% of the time (given). In chips the call wins: 0.55 × 4,000 = 2,200, more than 2,000. Folding keeps 28.9%. Fold, or call 2,000?",
      hint: "Use the same two shares, 35.4% if you win and 20% if you lose, with the new chance.",
      explanation: "Fold. 0.55 × 35.4% + 0.45 × 20% = 28.5%, still less than the 28.9% you keep. A call that wins chips can lose prize money near the payouts.",
    },
  },
  hands: {
    "ic-guided": icmHand("ic-guided", { hero: short.hero, heroSeat: "short", decisions: ["ic-guided"], answer: "ic-guided" }),
    "ic-practice": icmHand("ic-practice", { hero: mid.hero, heroSeat: "mid", decisions: ["ic-practice"] }),
    "ic-fresh": icmHand("ic-fresh", { hero: fresh.hero, heroSeat: "short", decisions: ["ic-fresh"], answer: "ic-fresh" }),
  },
};

export default definition;
