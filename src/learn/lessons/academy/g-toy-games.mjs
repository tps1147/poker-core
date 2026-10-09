// Content version 2 (2026-10-09): the film asks and answers its own question at its end, so the
// lesson no longer asks it again over the frozen frame (film stage endAsk "skip"; filmV2 "handoff").
// Version 1 stays registered on the server for older builds.
// g-toy-games, Poker in Miniature (Game Theory), academy v2 definition.
// Film: src-academy-g-toy-games-v2 (88 s), Kuhn poker: J < Q < K, one chip each (pot 2), one bet
// of 1. canon.yourTurn is null, so the film plays to its stop and then asks its own question:
// "You hold the jack. Does it ever bet? Never... sometimes... or always?" (the film: balance).
// Plan: theory.md (g-toy-games). The verified balance: the king bets 3 times as often as the jack
// bluffs, so 1 bet in 4 is a bluff, exactly bet ÷ (pot + 2·bet) = 1 ÷ (2 + 2); the queen calls 1/3;
// the first player's value is −1/18 a hand. test/academyLessonsB.test.mjs re-verifies the profile
// by best response over every pure strategy, and the plan script asserts it too.
// The table hands carry the same two fractions to a Hold'em river with the same ratio of bet to pot
// (a bet of half the pot, as Kuhn's 1 into 2):
//   Your turn   the jack: never / sometimes / always -> sometimes
//   Guided      you bet 50 into 100 with a range of best hands and bluffs: bluff share 1/4
//   Practice    he bets 50 into 100: keep 2/3 of your bluff-catchers (Kuhn's caller keeps 2/3 too)
//   Fresh       he bets 50 into 100 and never bluffs (given): fold the bluff-catcher, the film's
//               "never bluff and every bet is a king" from the caller's seat (changed seat and size)
// Keys: answerKeys/g-toy-games.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, bands, takeaway } from "./kit.mjs";

const feedback = { found: "You found the rate.", missed: "Let’s find the rate together.", open: "Here’s the rate." };
const shareBands = (...pairs) => bands(...pairs);

const turnSpot = {
  decision: "estimate", game: "kuhn",
  bands: bands(["never", "Never"], ["sometimes", "Sometimes"], ["always", "Always"]),
  dockPrompt: "Does the jack ever bet?",
  title: "Your turn: does the jack ever bet?",
  prompt: "Three cards: jack, queen, king. One chip each, so the pot is 2, and one bet of 1. You act first holding the jack, the worst card. Does it ever bet?",
  hint: "What does he do with his queen if your bets are always kings? And if half of them are jacks?",
  explanation: "Sometimes. Never bluff and every bet is a king, so his queen folds. Always bluff and his queen calls. Bet the king 3 times as often as you bluff the jack: 1 bet in 4 is a bluff, and he gains nothing by changing.",
};

const guided = { street: "river", hero: ["Ah", "Kd"], board: ["Qc", "Jd", "7s", "4h", "2c"] };
const practice = { street: "river", hero: ["Qh", "Ts"], board: ["Qd", "9c", "6s", "5h", "2d"], potBefore: 100, bet: 50, call: 50 };
const fresh = { street: "river", hero: ["Kc", "Jh"], board: ["Ks", "8d", "6c", "3h", "2s"], potBefore: 100, bet: 50, call: 50 };

const definition = {
  ...definitionBase({
    node: "g-toy-games", version: 2, coach: "knox", title: "Bluff at the right rate.", kicker: "Poker, in three cards.",
    track: "theory", chapter: "Game Theory", minutes: 5, feedback,
    assumptions: "The film plays Kuhn poker: three cards, one chip each, one bet of 1, and the higher card wins. At the table, the same idea on a Hold'em river: a range made only of best hands and bluffs bets half the pot, and his hand can beat only a bluff. What he bluffs is given in each hand, never read from his cards. Each hand stops once you act.",
  }),
  stages: [
    welcome("Bluff at the right rate.", "Poker, in three cards.",
      "A game with three cards shows why bluffing at the right rate is required, not optional. Watch Knox play it, then take the same rates to the table.", "Knox"),
    filmStage({ film: "g-toy-games", at: null, endAsk: "skip", spotId: "tg-turn", spot: turnSpot, upNext: "Play Knox’s river" }),
    whyStage("tg-why", "Why does the jack bet sometimes?", [
      { id: "mix", text: "Never bluff and he folds to every bet; always bluff and he calls. The mix leaves him nothing to gain.", fix: "Right. One bet in 4 is a bluff, and his queen calls 1 time in 3." },
      { id: "computers", text: "Because a computer says so; the reason doesn’t matter at a real table.", fix: "Game theory isn’t only for computers. Three cards and one bet: you can check every line by hand, as the film did." },
      { id: "king-folds", text: "Because the jack’s bet makes his king fold sometimes.", fix: "His king never folds to a bet. The bluff wins when his queen folds." },
    ]),
    decision("tg-guided", "tg-guided", "guided", "Knox’s river", "Knox’s river. Mix your bets.", "Try a practice hand", { feedback }),
    decision("tg-practice", "tg-practice", "practice", "Practice", "Now from his seat.", "Try a fresh hand", { feedback }),
    decision("tg-fresh", "tg-fresh", "fresh", "Fresh hand", "He never bluffs.", "See your recap", { feedback }),
    takeaway({
      heading: "Nothing to gain.",
      rule: "If you never bluff, your bets fold everyone. Bluff at the rate that leaves the caller nothing to gain.",
      lead: "In three-card poker, 1 bet in 4 is a bluff and the queen calls 1 time in 3. Played that way, acting first costs 1/18 of a chip a hand.",
      labels: ["Knox’s river", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "tg-guided": {
      decision: "estimate", ...guided,
      bands: shareBands(["quarter", "1 in 4"], ["third", "1 in 3"], ["half", "1 in 2"]),
      dockPrompt: "What share of your bets are bluffs?",
      title: "Half the pot. How many bets are bluffs?",
      prompt: "River, pot 100, checked to you. Your range here holds only best hands and bluffs, and you bet 50, half the pot, the same ratio as three-card poker’s 1 into 2. What share of your bets should be bluffs?",
      hint: "Bluffs as a share of your bets: the bet over the pot plus two bets.",
      explanation: "1 in 4: 50 ÷ (100 + 100) = 1/4, the same share as three-card poker’s 1 ÷ (2 + 2). Bet the best hands 3 times as often as you bluff.",
    },
    "tg-practice": {
      decision: "estimate", ...practice,
      bands: shareBands(["third", "Keep 1/3"], ["half", "Keep 1/2"], ["two-thirds", "Keep 2/3"]),
      dockPrompt: "How much of your range must call?",
      title: "He bets 50 into 100. How much do you keep?",
      prompt: "River, pot 100, and he bets 50. Your hands here beat only a bluff. How much of your range must you keep so his bluffs gain nothing?",
      hint: "Keep the pot over the pot plus the bet.",
      explanation: "Keep 2/3: 100 ÷ 150. It is three-card poker’s caller too: when the jack bets 1 into 2, his queen (1 time in 3) and his king (always) together call 2/3 of the time.",
    },
    "tg-fresh": {
      decision: "action", choices: ["fold", "call"], ...fresh,
      given: { bluffShare: 0 },
      title: "He never bluffs. Fold or call?",
      prompt: "River, pot 100, and he bets 50. You hold K♣ J♥ on K♠ 8♦ 6♣ 3♥ 2♠, a hand that beats only a bluff. Given: he never bluffs this river; every bet is a stronger hand. Fold, or call 50?",
      hint: "If no bet is ever a bluff, what does a call win?",
      explanation: "Fold. A bet that is never a bluff is the film’s “every bet is a king”: calling loses 50 every time. That is why a player who never bluffs gets folded to.",
    },
  },
  hands: {
    "tg-guided": huHand("tg-guided", { ...guided, pot: 100, decisions: ["tg-guided"] }),
    "tg-practice": huHand("tg-practice", { ...practice, pot: 100, bet: 50, heroFirst: true, decisions: ["tg-practice"] }),
    "tg-fresh": huHand("tg-fresh", { ...fresh, pot: 100, bet: 50, heroFirst: true, decisions: ["tg-fresh"], answer: "tg-fresh" }),
  },
};

export default definition;
