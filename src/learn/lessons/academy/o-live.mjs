// o-live, Live Poker (Other Tables), academy v2 definition.
// Film: src-academy-o-live-v2 (66 s). canon.yourTurn = "yourTurn" at 50.5 s: "Your turn. Facing a bet,
// a player pushes one big chip forward and says nothing. Call or raise? A call."
// Rules: framed as common house rules, as the Poker TDA rules put them (LATER-SCOPE-NUMBERS-2026-10-07):
// verbal declarations in turn are binding; a bet goes out in one motion or is announced first, and
// going back to the stack for more is a string bet; facing a bet, a single oversized chip put in
// without a declaration is only a call; protect your cards; act only in turn. Rooms can differ, so
// every spot says "under common house rules". Tells are weak evidence beside the betting.
//   Your turn   facing a bet, one oversized chip, nothing said -> a call
//   Guided      you say "call" in turn, then push in a raise -> the call stands (words count)
//   Practice    you push out 100, then go back to your stack for 200 more without a word -> the bet is
//               the first 100 (a string bet)
//   Fresh       a player’s hands shake as he bets the river -> read his betting, not the shaking
//               (changed: the tells half of the film)
// Keys: answerKeys/o-live.mjs. No numbers beyond the stated amounts.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, bands, takeaway } from "./kit.mjs";

const feedback = { found: "That’s the house rule.", missed: "Check the house rule again.", open: "Here’s the rule." };

const turnSpot = {
  decision: "estimate", facing: true,
  bands: bands(["call", "A call"], ["raise", "A raise"]),
  dockPrompt: "What does the chip mean?",
  title: "Your turn: one big chip, nothing said.",
  prompt: "Facing a bet, a player pushes one big chip forward, worth more than the bet, and says nothing. Under common house rules, is it a call or a raise?",
  hint: "Did he say anything? Without a word, what does a single chip mean when facing a bet?",
  explanation: "A call. Facing a bet, one oversized chip with nothing said is only a call. To raise with it, say “raise” first.",
};

const guided = { street: "turn", hero: ["Kh", "Jh"], board: ["Qh", "9c", "4h", "2d"] };
const practice = { street: "flop", hero: ["Ad", "Ks"], board: ["Kc", "7d", "3s"] };
const fresh = { street: "river", hero: ["Tc", "Td"], board: ["8h", "6s", "4d", "Jc", "2h"] };

const definition = {
  ...definitionBase({
    node: "o-live", coach: "knox", title: "Keep the rules yourself.", kicker: "Say it, move once, read the betting.",
    track: "formats", chapter: "Other Tables", minutes: 4, feedback,
    assumptions: "A live table under common house rules, the way the Poker TDA rules put them. Rooms can differ, so check the house rules where you play. Words said in turn count. A bet goes out in one motion, or you announce the amount first. Facing a bet, a single oversized chip with nothing said is a call. Tells, like a shaking hand, are weak evidence beside what a player bets. Each hand stops once the rule is applied.",
  }),
  stages: [
    welcome("Keep the rules yourself.", "Say it, move once, read the betting.",
      "Online the software keeps the rules for you. At a real table, you keep them. Watch Knox’s three habits, then rule on three live spots.", "Knox"),
    filmStage({ film: "o-live", at: 50.5, spotId: "lv-turn", spot: turnSpot, upNext: "Rule on Knox’s first spot" }),
    whyStage("lv-why", "Why is the big chip only a call?", [
      { id: "no-word", text: "Facing a bet, a single oversized chip with no declaration is a call under common house rules.", fix: "Right. Say “raise” first, then put the chip out." },
      { id: "online", text: "The chip is worth more than the bet, so it raises, like typing a bigger amount online.", fix: "Online and live rules aren’t the same. Live, the chip alone doesn’t say raise." },
      { id: "double", text: "It raises if the chip is worth at least twice the bet.", fix: "Size doesn’t make it a raise without a word. Announce the raise first." },
    ]),
    decision("lv-guided", "lv-guided", "guided", "Knox’s spot", "Knox’s spot: words count.", "Try a practice hand", { feedback }),
    decision("lv-practice", "lv-practice", "practice", "Practice", "One motion.", "Try a fresh hand", { feedback }),
    decision("lv-fresh", "lv-fresh", "fresh", "Fresh hand", "A tell across the table.", "See your recap", { feedback: { found: "You read the betting first.", missed: "Weigh the betting, not the tell.", open: "Here’s the read." } }),
    takeaway({
      heading: "Say it, move once.",
      rule: "At a live table, say what you do, move once, and let the betting do the talking.",
      lead: "Your words count. Bet in one motion or announce it. Facing a bet, one big chip with nothing said is a call. Tells are weak evidence; read the betting first.",
      labels: ["Knox’s spot", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "lv-guided": {
      decision: "estimate", ...guided, potBefore: 100, bet: 50, call: 50,
      bands: bands(["call", "The call stands"], ["raise", "The raise stands"]),
      dockPrompt: "What stands?",
      title: "You said “call”. Then you raised.",
      prompt: "Facing a bet of 50, you say “call” in turn, then change your mind and push in a raise. Under common house rules, what stands?",
      hint: "At a live table, which counts first: your words or your chips?",
      explanation: "The call stands. Words said in turn are binding: you put in 50 and the raise is off. Say what you mean before you move.",
    },
    "lv-practice": {
      decision: "estimate", ...practice,
      bands: bands(["first", "Only the first 100"], ["all", "All 300"]),
      dockPrompt: "How much is your bet?",
      title: "Back to the stack for more.",
      prompt: "Checked to you. You push out 100 without a word, then reach back to your stack and add 200 more. Under common house rules, how much is your bet?",
      hint: "A bet goes out in one motion, unless you announce the amount first.",
      explanation: "Only the first 100. Going back to your stack for more is a string bet, so the second motion doesn’t count. To bet 300, say “300” first, or push it out in one motion.",
    },
    "lv-fresh": {
      decision: "estimate", ...fresh,
      bands: bands(["shaking", "His shaking hands"], ["betting", "His betting, this hand and before"]),
      dockPrompt: "What drives your decision?",
      title: "His hands shake as he bets.",
      prompt: "Across the table, a player’s hands shake as he bets the river. You hold a pair of tens. What should drive your call or fold?",
      hint: "Which tells you more: a shaking hand, or what he bets and how?",
      explanation: "His betting. A shaking hand or a long stare is weak evidence: nerves look the same with strong hands and bluffs. What he bets, how much and on which streets, says far more.",
    },
  },
  hands: {
    "lv-guided": huHand("lv-guided", { ...guided, pot: 100, bet: 50, heroFirst: true, decisions: ["lv-guided"] }),
    "lv-practice": huHand("lv-practice", { ...practice, pot: 60, decisions: ["lv-practice"] }),
    "lv-fresh": huHand("lv-fresh", { ...fresh, pot: 200, bet: 100, heroFirst: true, decisions: ["lv-fresh"] }),
  },
};

export default definition;
