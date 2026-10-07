// Lesson 19, Semi-bluffing, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Knox's film is the retained 0 to 8.75 s of
// knox-lesson-19 (210 frames, lessons/semibluff-workspace-v1/audit/README.md): "A semi-bluff gives
// you two ways to win. Villain can fold now, or you can improve later. That is very different from
// firing with no backup." He names no cards, no amounts, no fold rate, no equity and no action, so
// every one of those is a given here. The old proof spot (queen-jack of hearts, "raising applies
// pressure") is outside the retained interval and is never used.
//
// The lesson is the price of pressure, in Knox's two branches. Every hand is heads-up, Ace Andy
// checks to you, and two decisions sit on one deal:
//   1. What does a bet with no backup need? The break-even fold rate, bet ÷ (pot + bet).
//   2. Check or bet? With the given fold rate (the fold branch) and, for a draw, the given chance
//      to win when called (the showdown branch), against what checking already wins.
//   Knox's hand  8♥ 7♥ on 9♥ 6♣ 2♥ K♠, pot 100, bet 50. Needs 33%, folds 30%, 15 outs about 30%. Bet.
//   Practice     J♣ T♣ on Q♦ 9♠ 3♣ 2♥ 5♦ (river, missed), pot 120, bet 80. Needs 40%, folds 30%. Check.
//   Fresh hand   6♦ 5♦ on K♦ J♣ 9♦ 2♠, pot 100, bet 100. Needs 50%, folds 20%, 9 outs about 18%. Check.
// No street is dealt after a decision, no showdown is played and no opponent card ships: each hand
// stops once your check or bet is on the table.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// semibluff-workspace-v1.v1.js) grades. Every spot is an estimate, or an action that rests on given
// numbers in the prompt rather than a given equity the price rule reads, so no spot ships a preview
// rule and a signed-out preview leaves it ungraded ("open").
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).

// Heads-up, 1,000 each before the hand; the chips already in the pot came from both players equally.
const seats = (stack) => ({ hero: { name: "You", stack }, opponent: { name: "Ace Andy", stack, botId: null } });

const guided = { street: "turn", hero: ["8h", "7h"], board: ["9h", "6c", "2h", "Ks"] };
const practice = { street: "river", hero: ["Jc", "Tc"], board: ["Qd", "9s", "3c", "2h", "5d"] };
const fresh = { street: "turn", hero: ["6d", "5d"], board: ["Kd", "Jc", "9d", "2s"] };

const PRICE_DOCK = "How often must he fold?";
const PRICE_TITLE = "What does a bet with no backup need?";
const NOTE_TURN = "The river is not dealt in this lesson. The decision is made before the card comes.";
const actionFeedback = { found: "You priced both branches.", missed: "Let’s add the branches together.", open: "Here’s the math." };

const definition = {
  id: "semibluff-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t4-fold-equity-semibluff",
  sourceLessonId: "lesson-fold-equity-semibluff-001", videoLessonId: "lesson-fold-equity-semibluff-001",
  coach: "knox", access: "pro", template: "pressure",
  title: "Bet with a backup.", kicker: "Two ways to win.",
  trail: ["Learn", "Pressure", "Semi-bluffing"],
  course: { chapter: "Pressure" },
  meta: { minutes: 4 },
  assumptions: "Heads-up, no rake. Ace Andy checks to you, and you check or bet the size shown. How often he folds to that bet is given for each hand, never read from his cards. When a draw is called, its chance to win is an estimate, roughly 2% per out with one card to come, also given. If he calls, assume no more chips go in and the river decides the pot. If you check, assume the river is checked through, so a draw still wins its share of the pot. On the river a missed draw has no backup: assume it loses whether you check or get called. A bet with no backup breaks even when he folds bet ÷ (pot + bet) of the time.",
  media: "media/semibluff-workspace-v1.v1.json",
  feedback: { found: "You priced it.", missed: "Let’s price it together.", open: "Here’s the price." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Bet with a backup.", em: "Two ways to win.",
      lead: "A semi-bluff wins when Ace Andy folds now, or when your draw comes in later. Watch Knox, then price three bets at the table.",
      cta: "Watch with Knox" },
    { kind: "film", label: "Film", upNext: "Play Knox’s hand",
      // Chapters on the film's own beats (lessons/semibluff-workspace-v1/v1/timeline.json rail).
      // No in-film guess: the film is 8.75 s and every pause would ask for the next sentence, not a read.
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Two ways to win" }, { beat: "texture", label: "Fold now" }, { beat: "improve", label: "Improve later" }, { beat: "backup", label: "No backup" }] },
    { kind: "decision", label: "Knox’s hand", spotId: "sb1-guided-price", hand: "sb1-guided", role: "guided",
      coachLine: "Knox’s hand. Price the bet before you make it.", next: "Now check or bet" },
    { kind: "decision", label: "Knox’s hand", spotId: "sb1-guided-bet", hand: "sb1-guided", role: "guided",
      coachLine: "Now add the second way to win.", next: "Try a practice hand", feedback: actionFeedback },
    { kind: "decision", label: "Practice", spotId: "sb1-practice-price", hand: "sb1-practice", role: "practice",
      coachLine: "The river. Price it the same way.", next: "Now check or bet" },
    { kind: "decision", label: "Practice", spotId: "sb1-practice-bet", hand: "sb1-practice", role: "practice",
      coachLine: "No card to come. What backs this bet?", next: "Try a fresh hand", feedback: actionFeedback },
    { kind: "decision", label: "Fresh hand", spotId: "sb1-fresh-price", hand: "sb1-fresh", role: "fresh",
      coachLine: "Your price.", next: "Now check or bet" },
    { kind: "decision", label: "Fresh hand", spotId: "sb1-fresh-bet", hand: "sb1-fresh", role: "fresh",
      coachLine: "Your call on the pressure.", next: "See your recap", feedback: actionFeedback },
    { kind: "takeaway", label: "Recap", heading: "Pressure with a plan.",
      lead: "A bet with no backup needs folds of at least bet ÷ (pot + bet). A draw adds a second way to win, so it can bet with fewer folds, but only when both branches together beat checking.",
      recapLabels: ["Knox’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "sb1-guided-price": {
      decision: "estimate", ...guided,
      bands: [{ id: "about-25", label: "About 25%" }, { id: "about-33", label: "About 33%" }, { id: "about-50", label: "About 50%" }],
      dockPrompt: PRICE_DOCK,
      title: PRICE_TITLE,
      prompt: "Knox’s hand. You hold eight-seven of hearts on the turn, the pot is 100 and Ace Andy checks to you. Suppose you bet 50 with nothing to fall back on. How often must he fold for that bet to break even?",
      hint: "A bet with no backup risks the bet to win the pot. Divide what you risk by the pot plus your bet.",
      explanation: "You risk 50 to win the 100 already in the pot. 50 ÷ (100 + 50) = 50 ÷ 150, about 33%. A bet with no backup needs Ace Andy to fold at least that often.",
      hear: 2,
    },
    "sb1-guided-bet": {
      decision: "action", choices: ["check", "bet"], sizes: { bet: 50 }, ...guided,
      given: { foldRate: 30, winWhenCalled: 30, outs: 15 },
      title: "Check, or bet 50?",
      prompt: "Ace Andy folds to a 50 bet 30% of the time (given). When he calls, your flush draw and straight draw win about 30% (given: 15 outs, roughly 2% per out with one card to come). If you check, the river is checked through. Check or bet?",
      hint: "Fold branch: how much do his folds win? Called branch: what share of the 200-chip pot comes back for your 50? Add the two, then compare with what checking wins.",
      explanation: "Betting: his folds win 30% × 100 = 30. He calls the other 70%, and each call returns about 30% × 200 = 60 for your 50, so the calls add 70% × 10 = 7. The bet earns about 37. Checking: your draw wins about 30% of 100 = 30. His 30% folds are below the 33% a bet with no backup needs, and the bet still earns more, because the draw is the backup.",
      note: NOTE_TURN,
      focus: ["8h", "7h", "9h", "6c"], hear: 1,
    },
    "sb1-practice-price": {
      decision: "estimate", ...practice,
      bands: [{ id: "about-29", label: "About 29%" }, { id: "about-40", label: "About 40%" }, { id: "about-67", label: "About 67%" }],
      dockPrompt: PRICE_DOCK,
      title: PRICE_TITLE,
      prompt: "A new hand, on the river. You hold jack-ten of clubs and your draw missed. The pot is 120 and Ace Andy checks to you. If you bet 80, how often must he fold for the bet to break even?",
      hint: "Same rule: what you risk, divided by the pot plus your bet.",
      explanation: "You risk 80 to win 120. 80 ÷ (120 + 80) = 80 ÷ 200 = 40%. Dividing by the pot alone (67%) or by the pot after a call (29%) are the two usual slips.",
      hear: 2,
    },
    "sb1-practice-bet": {
      decision: "action", choices: ["check", "bet"], sizes: { bet: 80 }, ...practice,
      given: { foldRate: 30 },
      title: "Check, or bet 80?",
      prompt: "Ace Andy folds to an 80 bet 30% of the time (given). No card is left to come, and for this exercise your queen high loses whether you check or get called. Check or bet?",
      hint: "With no card to come, what does a call give back? Compare his folds with the break-even you just found.",
      explanation: "With no backup, only his folds win. The bet needs 40% and he folds 30%. Betting: 30% × 120 = 36 won and 70% × 80 = 56 lost, about 20 lost per bet. Checking gives up this pot and loses nothing more. That is firing with no backup.",
      focus: ["Jc", "Tc"], hear: 2,
    },
    "sb1-fresh-price": {
      decision: "estimate", ...fresh,
      bands: [{ id: "about-33", label: "About 33%" }, { id: "about-50", label: "About 50%" }, { id: "about-100", label: "About 100%" }],
      dockPrompt: PRICE_DOCK,
      title: PRICE_TITLE,
      prompt: "You hold six-five of diamonds on the turn. The pot is 100 and Ace Andy checks to you. If you bet 100 with nothing to fall back on, how often must he fold to break even?",
      hint: "What you risk, divided by the pot plus your bet.",
      explanation: "You risk 100 to win 100. 100 ÷ (100 + 100) = 50%. A bet with no backup this size needs a fold half the time.",
    },
    "sb1-fresh-bet": {
      decision: "action", choices: ["check", "bet"], sizes: { bet: 100 }, ...fresh,
      given: { foldRate: 20, winWhenCalled: 18, outs: 9 },
      title: "Check, or bet 100?",
      prompt: "Ace Andy folds to a 100 bet 20% of the time (given). When he calls, your flush draw wins about 18% (given: 9 outs, roughly 2% per out with one card to come). If you check, the river is checked through. Check or bet?",
      hint: "Add the fold branch and the called branch, then compare with what checking wins.",
      explanation: "Betting: his folds win 20% × 100 = 20. He calls the other 80%, and each call returns about 18% × 300 = 54 for your 100, a loss of 46, so the calls cost about 80% × 46 = 37. The bet loses about 17. Checking: your draw wins about 18% of 100 = 18. A draw lowers the folds a bet needs, but it does not make any fold rate enough.",
      note: NOTE_TURN,
      focus: ["6d", "5d", "Kd", "9d"],
    },
  },
  hands: {
    // The film deals this hand and ends on the dealt turn, before anyone acts, so the web hand starts
    // at script step 0 (startAt 0): Ace Andy checks, then the two decisions, then your check or bet.
    "sb1-guided": {
      id: "sb1-guided", layout: "heads-up", seats: seats(950), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "turn", board: guided.board, pot: 100, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: ["9h", "6c", "2h"] },
        { do: "street", cards: ["Ks"] },
      ],
      script: [
        { do: "pause", ms: 600 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "sb1-guided-price" },
        { do: "decide", spotId: "sb1-guided-bet", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "sb1-guided-bet", sizes: { bet: 50 } },
      ],
      startAt: 0,
    },
    "sb1-practice": {
      id: "sb1-practice", layout: "heads-up", seats: seats(940), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "river", board: practice.board, pot: 120, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "sb1-practice-price" },
        { do: "decide", spotId: "sb1-practice-bet", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "sb1-practice-bet", sizes: { bet: 80 } },
      ],
    },
    "sb1-fresh": {
      id: "sb1-fresh", layout: "heads-up", seats: seats(950), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "turn", board: fresh.board, pot: 100, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "sb1-fresh-price" },
        { do: "decide", spotId: "sb1-fresh-bet", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "sb1-fresh-bet", sizes: { bet: 100 } },
      ],
    },
  },
};

export default definition;
