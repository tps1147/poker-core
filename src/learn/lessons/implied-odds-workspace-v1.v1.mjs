// Lesson 8, Implied odds, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Mina's film is the retained 0 to 20.0 s of
// mina-lesson-08 (480 frames, audit/README.md): the definition, the caveat that future money only
// counts when it is realistic, and the three things implied odds need. She names no card, amount,
// price or verdict, so every amount on the table and in this copy is a given for the exercise.
//
// Then three hands on the real table, each stopping at the decision (no river is dealt and no
// opponent card ships in this lesson):
//   Mina's hand   A♥ J♥ on K♥ 8♣ 4♥ 2♠, 75 into 100. The direct price is 30%, above the given
//                 roughly 18%. Given a 250 river call if a heart comes, deep stacks and a strong
//                 draw, the call costs 75 of 500, 15%: call.
//   Practice      the same price and draw, but Ace Andy has only 50 behind: the most you can win
//                 later is 50 (estimate), so the call costs 75 of 300, 25%: fold.
//   Fresh hand    8♦ 7♦ on 9♣ 6♠ 2♥ K♣, 50 into 150. Direct price 20%, above the given roughly
//                 16%. Given a 250 river call if the straight comes, the call costs 50 of 500, 10%
//                 (estimate): call.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// implied-odds-workspace-v1.v1.js) grades. No spot carries a preview rule: the course's rule
// "price-vs-equity" reads the direct price only, which is exactly the habit this lesson extends, so
// a signed-out preview leaves these decisions ungraded ("open") rather than grade them wrongly.
// For the same reason the given chance lives in the copy, not in a `given.equity` field.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (heroStack, opponentStack) => ({ hero: { name: "You", stack: heroStack }, opponent: { name: "Ace Andy", stack: opponentStack, botId: null } });
const guided = { hero: ["Ah", "Jh"], board: ["Kh", "8c", "4h", "2s"], street: "turn", potBefore: 100, bet: 75, call: 75 };
const practice = { hero: ["As", "7s"], board: ["Qs", "9d", "5s", "2c"], street: "turn", potBefore: 100, bet: 75, call: 75 };
const fresh = { hero: ["8d", "7d"], board: ["9c", "6s", "2h", "Kc"], street: "turn", potBefore: 150, bet: 50, call: 50 };
const callFeedback = { found: "You priced the whole hand.", missed: "Let’s price the whole hand.", open: "Here’s the thinking." };

const definition = {
  id: "implied-odds-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t1-implied-odds",
  sourceLessonId: "lesson-implied-odds-001", videoLessonId: "lesson-implied-odds-001",
  coach: "mina", access: "pro", template: "deeper-math",
  title: "Look past the direct price.", kicker: "When the story is not over.",
  trail: ["Learn", "Deeper math", "Implied odds"],
  course: { chapter: "Deeper math" },
  meta: { minutes: 5 },
  assumptions: "Heads-up, on the turn, with one card to come. Every card that completes your draw counts as an out, and your chance of winning is the course’s estimate, roughly 2% per out with one card to come, never exact equity read from the cards. What you could win later is given for each hand: an assumed river call if your draw comes in. It is never read from Ace Andy’s cards, it can never be more than the chips he has behind, and the river is never dealt.",
  media: "media/implied-odds-workspace-v1.v1.json",
  feedback: callFeedback,
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Look past the direct price.", em: "Only as far as it is real.",
      lead: "A price that is too high now can still be a good call when you can win more later. Watch Mina name the three things that make it real, then price three hands at the table.",
      cta: "Watch with Mina" },
    { kind: "film", label: "Film", upNext: "Play Mina’s hand",
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "The direct price" }, { beat: "extra", label: "What you can win later" }, { beat: "realistic", label: "Only realistic money" }, { beat: "conditions", label: "Three things" }] },
    { kind: "decision", label: "Mina’s hand", spotId: "imp1-guided", hand: "imp1-guided", role: "guided",
      coachLine: "Mina’s hand. You make the call.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "imp1-practice-most", hand: "imp1-practice", role: "practice",
      coachLine: "The same price and a strong draw. Check what can really come later.", next: "Now decide the call",
      feedback: { found: "You found the limit.", missed: "Let’s look at the chips behind.", open: "Here’s the limit." } },
    { kind: "decision", label: "Practice", spotId: "imp1-practice-call", hand: "imp1-practice", role: "practice",
      coachLine: "You have the limit. Now the call.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "imp1-fresh-price", hand: "imp1-fresh", role: "fresh",
      coachLine: "Your price, your call.", next: "Now decide the call",
      feedback: { found: "You priced it.", missed: "Let’s build the price.", open: "Here’s the price." } },
    { kind: "decision", label: "Fresh hand", spotId: "imp1-fresh-call", hand: "imp1-fresh", role: "fresh",
      coachLine: "Your price, your call.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "Future chips, only when they are real.",
      lead: "When the direct price is too high, add only what you can realistically win later. That needs a strong draw, stacks behind and an opponent who can pay you.",
      recapLabels: ["Mina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "imp1-guided": {
      decision: "action", choices: ["fold", "call"], ...guided,
      given: { futureWin: 250, source: "Given for this hand" },
      title: "Is the call worth it?",
      prompt: "Mina’s hand: ace-jack of hearts, a draw to the best flush, with one card to come. Your estimate is roughly 18%. Ace Andy bets 75 into 100, and after a call you both have 1,125 behind. Given for this hand: if a heart comes, he calls a 250 bet on the river. Call or fold?",
      hint: "Build the final pot and its price first. Then add only the chips that can realistically come later, and compare your call with everything you could win.",
      explanation: "Calling 75 makes a final pot of 250, a 30% direct price, and roughly 18% is below it. But the story is not over: the draw is strong, 1,125 sits behind each of you, and the given river call adds 250. Your 75 buys a shot at 500, which is 15%, below your roughly 18%. The call pays for itself over time under this hand’s assumptions.",
      note: "The river is not dealt in this lesson. The 250 is an assumption, not a promise.",
      hear: 1,
    },
    "imp1-practice-most": {
      decision: "estimate", ...practice,
      bands: [
        { id: "up-to-50", label: "At most 50" },
        { id: "about-250", label: "About 250" },
        { id: "about-1125", label: "About 1,125" },
      ],
      dockPrompt: "The most you can win on the river",
      title: "What can you really win later?",
      prompt: "Ace-seven of spades, a draw to the best flush. Ace Andy bets 75 into 100, and that bet leaves him 50 behind. You have 1,200. If a spade comes, what is the most you can win from him on the river?",
      hint: "Future chips have to come from somewhere. Look at both stacks, and remember that nobody can pay more than they have.",
      explanation: "After his bet, Ace Andy has 50 chips left. However strong your hand becomes, he cannot pay you more than that on the river, so the most you can add later is 50. Your deep stack does not change what he can pay.",
      hear: 3,
    },
    "imp1-practice-call": {
      decision: "action", choices: ["fold", "call"], ...practice,
      given: { futureWin: 50, source: "His last 50 chips" },
      title: "Now, is the call worth it?",
      prompt: "The same hand. Your estimate is roughly 18% with one card to come. Ace Andy bets 75 into 100, and at most his last 50 can come later. Call or fold?",
      hint: "Build the final pot, then add only the chips that can really come later. Compare your call with that total.",
      explanation: "Calling 75 makes a final pot of 250, a 30% direct price. Adding the most that can come later, his last 50, your 75 buys a shot at 300, which is 25%. Roughly 18% is still below 25%, so folding saves chips over time. The draw is strong, but the stacks behind are missing.",
      note: "The river is not dealt in this lesson. A strong draw is not enough without chips behind.",
      hear: 2,
    },
    "imp1-fresh-price": {
      decision: "estimate", ...fresh,
      bands: [
        { id: "about-10", label: "About 10%" },
        { id: "about-20", label: "About 20%" },
        { id: "about-33", label: "About 33%" },
      ],
      dockPrompt: "Your call against everything you could win",
      title: "What does the call cost?",
      prompt: "Eight-seven of diamonds, open at both ends for a straight, with one card to come. Ace Andy bets 50 into 150, and after a call you both have 1,150 behind. Given for this hand: if your straight comes, he calls a 250 bet on the river. What is your call as a share of everything you could win?",
      hint: "Build the final pot if you call, add the given river call, then divide your call by that total.",
      explanation: "Calling 50 makes a final pot of 250. The given river call adds 250, so everything you could win is 500. Your 50 is 10% of that. Without the river call, the direct price would be 50 of 250, 20%.",
    },
    "imp1-fresh-call": {
      decision: "action", choices: ["fold", "call"], ...fresh,
      given: { futureWin: 250, source: "Given for this hand" },
      title: "Call or fold?",
      prompt: "Your estimate is roughly 16% with one card to come. Ace Andy bets 50 into 150, you both have 1,150 behind after a call, and he calls a 250 river bet if your straight comes. Call or fold?",
      hint: "Check the three things first. Then compare your chance with the price you just built.",
      explanation: "The direct price is 50 of 250, 20%, above roughly 16%. The three things are here: a straight draw open at both ends, 1,150 behind each of you, and the given river call. With it your 50 is 10% of the 500 you could win, below roughly 16%, so the call pays for itself over time under this hand’s assumptions.",
      note: "The river is not dealt in this lesson. The 250 is an assumption, not a promise.",
    },
  },
  hands: {
    // The film deals this hand from an empty table and plays Ace Andy's 75 (script step 0), so the
    // web hand starts on the step after it (startAt 1) with the dock rising at once.
    "imp1-guided": {
      id: "imp1-guided", layout: "heads-up", seats: seats(1200, 1200), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "turn", board: guided.board, pot: 100, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: ["Kh", "8c", "4h"] },
        { do: "street", cards: ["2s"] },
      ],
      script: [
        { do: "act", seat: "opponent", action: "bet", amount: 75 },
        { do: "decide", spotId: "imp1-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "imp1-guided" },
      ],
      startAt: 1,
    },
    // Ace Andy starts with 125: his 75 leaves him 50 behind, the whole of what can come later.
    "imp1-practice": {
      id: "imp1-practice", layout: "heads-up", seats: seats(1200, 125), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "turn", board: practice.board, pot: 100, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 75 },
        { do: "decide", spotId: "imp1-practice-most" },
        { do: "decide", spotId: "imp1-practice-call", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "imp1-practice-call" },
      ],
    },
    "imp1-fresh": {
      id: "imp1-fresh", layout: "heads-up", seats: seats(1200, 1200), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "turn", board: fresh.board, pot: 150, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 50 },
        { do: "decide", spotId: "imp1-fresh-price" },
        { do: "decide", spotId: "imp1-fresh-call", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "imp1-fresh-call" },
      ],
    },
  },
};

export default definition;
