// o-tournaments-icm, Tournaments and ICM (Other Tables), academy v2 definition, content version 2.
// Film: src-academy-o-tournaments-icm-v2 (92.5 s). canon.yourTurn = "yourTurn" at 67.51 s: "Your
// turn. The big stack calls the same flip. Before... 38.4%. After, on average... 38.1%. Both lose
// money. The player who sat out gains."
// Numbers: LATER-SCOPE-NUMBERS-2026-10-07.md and src-academy-o-tournaments-icm-v2/truth.mjs, by the
// Malmuth–Harville recursion (each place goes to a remaining player in proportion to his chips).
// Three players with 5,000 / 3,000 / 2,000, paid 50% / 30% / 20% of the prize pool: prize shares
// 38.4% / 32.8% / 28.9%. A coin flip, short against big: win -> 3,000 / 3,000 / 4,000 and the short
// stack's share 35.4%; lose -> out in third, 20%; average 27.7%.
//   Your turn   the big stack calls the flip: 38.4% -> 38.1% on average -> he loses prize money
//   Guided      a new table, 6,500 / 2,500 / 1,000, same payouts: you are the short stack, the big
//               stack puts you all-in, a pure coin flip: fold 25.2% against call (29.1% + 20%) / 2
//               = 24.6% -> fold
//   Practice    the same new table, you are the middle stack, out of the flip: 32.4% -> 33.1% on
//               average (31.2% if the short stack doubles, 35% if he busts) -> you gain
//   v2 (2026-10-09): v1's guided and practice were the film's own flip and its turn answer
//   (5,000 / 3,000 / 2,000: 28.9% against 27.7%; the middle stack's 32.8% -> 34.1%).
//   Fresh       the same all-in, but you win 55% (given): chips 0.55 × 4,000 = 2,200 > 2,000, yet
//               prize share 0.55 × 35.4% + 0.45 × 20% = 28.5% < 28.9% -> fold (changed chance)
// The blinds are left out. Keys: answerKeys/o-tournaments-icm.mjs. Every share is recomputed by
// the Harville recursion in test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, bands, takeaway } from "./kit.mjs";

const feedback = { found: "You priced it in prize money.", missed: "Price it in prize money, not chips.", open: "Here’s the prize math." };
const FILM_STACKS = { big: 5000, mid: 3000, short: 2000 };
const NEW_STACKS = { big: 6500, mid: 2500, short: 1000 };

// Three players. `heroSeat` is which stack the hero holds; the big stack puts the short stack all-in.
function icmHand(id, { hero, heroSeat, stacks = FILM_STACKS, decisions, answer = null }) {
  const others = Object.keys(stacks).filter((k) => k !== heroSeat);
  const names = { big: "Ned", mid: "Rae", short: "Ivy" };
  const seats = [{ id: "hero", name: "You", stack: stacks[heroSeat] }, ...others.map((k) => ({ id: k, name: names[k], stack: stacks[k] }))];
  const script = [{ do: "pause", ms: 400 }];
  if (heroSeat === "short") script.push({ do: "act", seat: "big", action: "bet", amount: stacks.short }, { do: "act", seat: "mid", action: "fold" });
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

const short = { street: "preflop", board: [], hero: ["Ac", "Td"], call: 1000 };
const mid = { street: "preflop", board: [], hero: ["9h", "9s"] };
const fresh = { street: "preflop", board: [], hero: ["Ah", "Qs"], call: 2000 };

const definition = {
  ...definitionBase({
    node: "o-tournaments-icm", version: 2, conceptId: "t6-icm", coach: "knox", title: "Chips aren’t money.", kicker: "Survival has a price.",
    track: "formats", chapter: "Other Tables", minutes: 5, feedback,
    assumptions: "Three players left in a tournament, with the stacks each hand gives: the film’s 5,000, 3,000 and 2,000 chips, or a new table of 6,500, 2,500 and 1,000. First place takes 50% of the prize pool, second 30%, third 20%. Each player’s share of the prize money comes from his chance of each place, worked out from the chips (ICM, the Malmuth–Harville model): each place goes to a remaining player in proportion to his chips. The blinds are left out, and your chance to win an all-in is given.",
  }),
  stages: [
    welcome("Chips aren’t money.", "Survival has a price.",
      "Is every tournament chip worth the same money? Watch Knox work out the prize shares, then decide three all-ins.", "Knox"),
    filmStage({ film: "o-tournaments-icm", at: 67.51, spotId: "ic-turn", spot: turnSpot, upNext: "Play Knox’s all-in" }),
    whyStage("ic-why", "Why does the big stack lose money on a fair flip?", [
      { id: "places", text: "Prize money pays for places: the chips he can win are worth less to him than the chips he risks.", fix: "Right. 38.4% before, 38.1% on average after; the player who sat out gains." },
      { id: "chips", text: "He doesn’t: a fair flip in chips is fair in money too.", fix: "Chip value and prize money aren’t the same in tournaments. The flip is fair in chips and costs both players money." },
      { id: "lead", text: "Because he might lose his chip lead.", fix: "Not just that: averaged over winning and losing the flip, his share still drops, from 38.4% to 38.1%." },
    ]),
    decision("ic-guided", "ic-guided", "guided", "Knox’s all-in", "A new table. You are the short stack, and the big stack puts you all-in.", "Try a practice hand", { feedback }),
    decision("ic-practice", "ic-practice", "practice", "Practice", "The same table. You sit out the flip.", "Try a fresh hand", { feedback }),
    decision("ic-fresh", "ic-fresh", "fresh", "Fresh hand", "The film’s table, a better chance.", "See your recap", { feedback }),
    takeaway({
      heading: "Survival has a price.",
      rule: "In tournaments, chips aren't money. Survival has a price, so call tighter near the payouts.",
      lead: "5,000 / 3,000 / 2,000 chips are worth 38.4% / 32.8% / 28.9% of the prize pool: flatter than the chips. A fair flip in chips loses money for both players in it.",
      labels: ["Knox’s all-in", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "ic-guided": {
      decision: "action", choices: ["fold", "call"], ...short,
      stacks: [6500, 2500, 1000], payouts: [50, 30, 20], given: { equity: 50 },
      title: "A coin flip for your tournament. Fold or call?",
      prompt: "A new table: 6,500, 2,500 and you, the short stack, with 1,000. The big stack puts you all-in and the middle stack folds: a pure coin flip, 50% (given). Folding keeps your 25.2% of the prize pool. Fold, or call 1,000?",
      hint: "Win and the stacks are 5,500 / 2,500 / 2,000, worth 29.1% to you; lose and you are out in third with 20%. Average your share.",
      explanation: "Fold. Win and your share climbs to 29.1%; lose and you finish third with 20%. The average is 24.6%, less than the 25.2% you keep by folding. Fair in chips, a loss in prize money.",
    },
    "ic-practice": {
      decision: "estimate", ...mid, stacks: [6500, 2500, 1000], payouts: [50, 30, 20],
      bands: bands(["gains", "You gain prize money"], ["loses", "You lose prize money"]),
      dockPrompt: "What happens to your prize money?",
      title: "You sit out the flip.",
      prompt: "The same table: you are the middle stack with 2,500. You fold, and the short stack with 1,000 and the big stack with 6,500 play a pure coin flip. Your share is 32.4% now. On average, after the flip?",
      hint: "If the short stack wins, the stacks are 5,500 / 2,500 / 2,000 and your share is 31.2%. If he loses, he is out and you are sure of at least second: 35%.",
      explanation: "You gain: 32.4% now, (31.2% + 35%) ÷ 2 = 33.1% on average after. When the short stack busts, you move up a place for free. That is the price of his survival, paid to you.",
    },
    "ic-fresh": {
      decision: "action", choices: ["fold", "call"], ...fresh,
      given: { equity: 55 },
      title: "55% for your tournament. Fold or call?",
      prompt: "Back to the film’s table: 5,000, 3,000 and you, the short stack, with 2,000. The big stack puts you all-in, and this time you win 55% of the time (given). In chips the call wins: 0.55 × 4,000 = 2,200, more than 2,000. Folding keeps 28.9%. Fold, or call 2,000?",
      hint: "Use the film’s two shares, 35.4% if you win and 20% if you lose, with the new chance.",
      explanation: "Fold. 0.55 × 35.4% + 0.45 × 20% = 28.5%, still less than the 28.9% you keep. A call that wins chips can lose prize money near the payouts.",
    },
  },
  hands: {
    "ic-guided": icmHand("ic-guided", { hero: short.hero, heroSeat: "short", stacks: NEW_STACKS, decisions: ["ic-guided"], answer: "ic-guided" }),
    "ic-practice": icmHand("ic-practice", { hero: mid.hero, heroSeat: "mid", stacks: NEW_STACKS, decisions: ["ic-practice"] }),
    "ic-fresh": icmHand("ic-fresh", { hero: fresh.hero, heroSeat: "short", decisions: ["ic-fresh"], answer: "ic-fresh" }),
  },
};

export default definition;
