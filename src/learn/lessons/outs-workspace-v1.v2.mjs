// Lesson 4, Outs, content version 2: the film-first flow (learn-flow-2026-09-16 SPEC 7.1,
// storyboard 8.2). Mina's film is a required step with one ungraded, local guess at 16.25 s (a
// playback position in measured silence; the file, WAV, cues and beats are untouched). Then three
// hands on the real table: her own turn (guided call), a practice hand (count, then call on the same
// deal) and a fresh hand (count, then call). No street is dealt after a decision and no opponent
// card ships in this lesson. Version 1 (outs-workspace-v1.js) is unchanged for v1 runs.
//
// No answer keys live here: the server registry grades, and a signed-out preview grades by rule
// (outs by completion against the visible cards, and the price against the given chance).
// The given chances follow the lesson's stated estimate, roughly 2% per out with one card to come.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (stack) => ({ hero: { name: "You", stack }, opponent: { name: "Ace Andy", stack, botId: null } });
const practice = { hero: ["Js", "Ts"], board: ["9d", "8c", "2h", "Ks"], street: "turn", potBefore: 200, bet: 25, call: 25 };
const fresh = { hero: ["9s", "8s"], board: ["Jd", "7c", "2h", "Ks"], street: "turn", potBefore: 100, bet: 50, call: 50 };

const definition = {
  id: "outs-workspace-v1", version: 2, flow: "film-first",
  conceptId: "t1-outs-rule-24",
  sourceLessonId: "lesson-outs-001", videoLessonId: "lesson-outs-001",
  coach: "mina", access: "free", template: "core-math",
  title: "Count clean outs first.", kicker: "Know what you are drawing to.",
  trail: ["Learn", "The math behind the move", "Outs"],
  course: { chapter: "The math behind the move" },
  meta: { minutes: 5 },
  assumptions: "Heads-up. For this exercise, every card that completes your draw is a clean out, and the chance of winning is an estimate, roughly 2% per out with one card to come, not exact equity read from the cards.",
  media: "media/outs-workspace-v1.v2.json",
  feedback: { found: "You counted it.", missed: "Let’s count it together.", open: "Here’s the count." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Count clean outs first.", em: "Then act.",
      lead: "A draw is only worth what it can become. Watch Mina count a flush draw, then count and price three hands at the table.",
      cta: "Watch with Mina" },
    { kind: "film", label: "Film", upNext: "Play Mina’s hand",
      // The media rail's chapters on the film's own beats, with the opening as "Intro".
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Read the board" }, { beat: "draw", label: "See the draw" }, { beat: "outs", label: "Count the outs" }, { beat: "rule", label: "Build the estimate" }, { beat: "price", label: "Compare the price" }],
      pause: { at: 16.25, spot: { kind: "count", range: [0, 47], unit: "outs",
        prompt: "Before Mina says it: how many clean outs does king-queen of hearts have?" } } },
    { kind: "decision", label: "Mina’s hand", spotId: "outs2-guided-call", hand: "outs2-guided", role: "guided",
      coachLine: "Mina’s hand. You make the call.", next: "Try a practice hand",
      feedback: { found: "You found the price.", missed: "Let’s look at the price.", open: "Here’s the thinking." } },
    { kind: "decision", label: "Practice", spotId: "outs2-practice-count", hand: "outs2-practice", role: "practice",
      coachLine: "Same idea, a different draw.", next: "Now decide the call" },
    { kind: "decision", label: "Practice", spotId: "outs2-practice-call", hand: "outs2-practice", role: "practice",
      coachLine: "You have the count. Now the price.", next: "Try a fresh hand",
      feedback: { found: "You found the price.", missed: "Let’s look at the price.", open: "Here’s the thinking." } },
    { kind: "decision", label: "Fresh hand", spotId: "outs2-fresh-count", hand: "outs2-fresh", role: "fresh",
      coachLine: "Your count, your call.", next: "Now decide the call" },
    { kind: "decision", label: "Fresh hand", spotId: "outs2-fresh-call", hand: "outs2-fresh", role: "fresh",
      coachLine: "Your count, your call.", next: "See your recap",
      feedback: { found: "You found the price.", missed: "Let’s look at the price.", open: "Here’s the thinking." } },
    { kind: "takeaway", label: "Recap", heading: "Outs you can count.",
      lead: "Count the unseen cards that complete your hand, then compare your chance with the price of the call.",
      recapLabels: ["Mina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "outs2-guided-call": {
      decision: "action", choices: ["fold", "call"], previewRule: "price-vs-equity",
      street: "turn", potBefore: 200, bet: 25, call: 25, board: ["As", "7h", "2c", "9h"], hero: ["Kh", "Qh"],
      given: { equity: 18, outs: 9, source: "Mina’s estimate" },
      title: "Is the call worth it?",
      prompt: "Mina counted 9 clean outs, roughly 18% with one card to come. Ace Andy bets 25 into 200. Call or fold?",
      hint: "Your 25-chip call makes a 250-chip pot. 25 ÷ 250 is a 10% price. Compare that with Mina’s 18%.",
      explanation: "Calling 25 makes a 250-chip pot, a 10% price. Mina’s roughly 18% is above 10%, so the call pays for itself over time under this lesson’s assumptions.",
      note: "The river is not dealt in this lesson. The call is right before the card comes.",
      ledger: "price", hear: 5,
    },
    "outs2-practice-count": {
      decision: "count", range: [0, 47], step: 1, unit: "outs", submitLabel: "Count them",
      previewRule: "outs-by-completion", target: "straight", ...practice,
      title: "How many outs do you have?",
      prompt: "Ace Andy bets 25 into 200. You hold jack-ten and the board shows a nine and an eight. Before you think about the price, count the unseen cards that complete your straight.",
      hint: "Name the ranks that would complete your draw, then count the unseen cards of each rank. Nothing else counts.",
      explanation: "Jack, ten, nine and eight are four in a row, open at both ends. Any queen or any seven completes the straight. There are four of each and none are visible, so you have eight outs.",
      focus: ["Js", "Ts", "9d", "8c"], hear: 2,
    },
    "outs2-practice-call": {
      decision: "action", choices: ["fold", "call"], previewRule: "price-vs-equity", ...practice,
      given: { equity: 16 },
      title: "Now, is the call worth it?",
      prompt: "Take the count you just made. At roughly 2% per out with one card to come, it gives you about 16%. Ace Andy bets 25 into 200. Call or fold?",
      hint: "Your 25-chip call makes a 250-chip pot. 25 ÷ 250 is a 10% price. Compare that with your 16%.",
      explanation: "Calling 25 makes a 250-chip pot, a 10% price. Your roughly 16% is above 10%, so calling pays for itself over time under this lesson’s assumptions.",
      note: "The river is not dealt in this lesson. The call is right before the card comes.",
      ledger: "price", hear: 6,
    },
    "outs2-fresh-count": {
      decision: "count", range: [0, 47], step: 1, unit: "outs", submitLabel: "Count them",
      previewRule: "outs-by-completion", target: "straight", ...fresh,
      title: "How many outs do you have?",
      prompt: "Ace Andy bets 50 into 100. You hold nine-eight of spades. Count the unseen cards that complete your hand.",
      hint: "Name every rank that would finish a straight for you. Then count the spades you can see before you count a flush.",
      explanation: "Nine, eight, seven and jack are waiting on one card in the middle: a ten. There are four tens and none are visible, so you have four outs. Three spades are showing, so one more spade gives you four, not a flush.",
      focus: ["9s", "8s", "7c", "Jd"],
    },
    "outs2-fresh-call": {
      decision: "action", choices: ["fold", "call"], previewRule: "price-vs-equity", ...fresh,
      given: { equity: 8 },
      title: "Call or fold?",
      prompt: "Your count gives you roughly 8% with one card to come. Ace Andy bets 50 into 100. Call or fold?",
      hint: "What does 50 into a final pot of 200 cost?",
      explanation: "Calling 50 makes a 200-chip pot, a 25% price. Your roughly 8% is well below 25%, so folding this good-looking draw saves chips over time. You give up this pot, and it is still the right decision.",
      ledger: "price", hidePrice: true,
    },
  },
  hands: {
    // The film ends after Ace Andy's 25 (script step 0), so the web hand starts there (startAt 1).
    "outs2-guided": {
      id: "outs2-guided", layout: "heads-up", seats: seats(1200), button: "hero",
      hero: ["Kh", "Qh"], opponent: {},
      start: { street: "turn", board: ["As", "7h", "2c", "9h"], pot: 200, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: ["As", "7h", "2c"] },
        { do: "street", cards: ["9h"] },
        { do: "highlight", cards: ["Kh", "Qh", "7h", "9h"] },
      ],
      script: [
        { do: "act", seat: "opponent", action: "bet", amount: 25 },
        { do: "decide", spotId: "outs2-guided-call" },
        { do: "act", seat: "hero", action: "answer", spotId: "outs2-guided-call" },
      ],
      startAt: 1,
    },
    "outs2-practice": {
      id: "outs2-practice", layout: "heads-up", seats: seats(1200), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "turn", board: practice.board, pot: 200, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 25 },
        { do: "decide", spotId: "outs2-practice-count" },
        { do: "decide", spotId: "outs2-practice-call", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "outs2-practice-call" },
      ],
    },
    "outs2-fresh": {
      id: "outs2-fresh", layout: "heads-up", seats: seats(1200), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "turn", board: fresh.board, pot: 100, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 50 },
        { do: "decide", spotId: "outs2-fresh-count" },
        { do: "decide", spotId: "outs2-fresh-call", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "outs2-fresh-call" },
      ],
    },
  },
};

export default definition;
