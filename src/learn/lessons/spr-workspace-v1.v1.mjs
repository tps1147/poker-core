// Lesson 10, Stack-to-pot ratio, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE). Mina's film is one contiguous interval of her original
// clip, 0 to 21.0 s, four sentences: what SPR tells you, the formula (effective stack divided by
// the pot), and the low and high SPR contrast. The excluded tail (the old proof spot and its
// verdict, and "Measure the depth, then commit") is not part of this lesson.
//
// The lesson measures room. Every hand asks two things on one deal: the SPR (the effective stack,
// the smaller of the two stacks, divided by the pot), and how many pot-sized bets fit before the
// effective stack is all in. Both are arithmetic on the amounts the table shows. No hand asks for
// an action, and nothing here turns "more willing to commit" into a threshold or a commitment rule.
// No street is dealt after a decision, no showdown is earned and no opponent card ships.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// spr-workspace-v1.v1.js) grades every band. There is no preview rule for an estimate, so a
// signed-out preview leaves these spots ungraded (feedback.open) rather than ship a key.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (hero, opponent) => ({ hero: { name: "You", stack: hero }, opponent: { name: "Ace Andy", stack: opponent, botId: null } });
const BETS_BANDS = [
  { id: "bets-1", label: "One bet" },
  { id: "bets-2", label: "Two bets" },
  { id: "bets-3", label: "Three bets" },
];
const BETS_DOCK = "Pot-sized bets until the effective stack is in";
const RATIO_DOCK = "Effective stack ÷ pot";
const RATIO_HINT = "The effective stack is the most that can go in this hand: the smaller of the two stacks. Divide it by the pot.";
const BETS_HINT = "A pot-sized bet matches the pot, and after a call the pot is three times as big. Keep going until a bet would use up the effective stack.";
const NOTE = "No more cards are dealt in this lesson. SPR measures the room left; it does not decide the hand for you.";
// No bet is faced on any hand: Ace Andy checks, so the pot is the pot before any bet.
const guided = { hero: ["Ad", "Kc"], board: ["Ks", "8h", "3c"], street: "flop", potBefore: 300, bet: 0, call: 0 };
const practice = { hero: ["Qh", "Jh"], board: ["Qc", "7d", "2s"], street: "flop", potBefore: 120, bet: 0, call: 0 };
const fresh = { hero: ["As", "Ts"], board: ["Ah", "9c", "5d"], street: "flop", potBefore: 100, bet: 0, call: 0 };

const definition = {
  id: "spr-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t1-spr",
  sourceLessonId: "lesson-spr-001", videoLessonId: "lesson-spr-001",
  coach: "mina", access: "pro", template: "deeper-math",
  title: "Measure the depth first.", kicker: "Know how much room is left.",
  trail: ["Learn", "Deeper math", "Stack-to-pot ratio"],
  course: { chapter: "Deeper math" },
  meta: { minutes: 4 },
  assumptions: "Heads-up, on the flop. Each stack is what that player has behind, after the chips already in the pot. The effective stack is the smaller of the two stacks. To count the room left, every bet is assumed to be the size of the pot and to be called, and the last bet is all in. No turn or river is dealt and the opponent’s cards stay hidden. The lesson measures the room in a hand; it does not tell you when to commit.",
  media: "media/spr-workspace-v1.v1.json",
  feedback: { found: "You measured it.", missed: "Let’s measure it together.", open: "Here’s the measure." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Measure the depth first.", em: "Then count the bets left.",
      lead: "Stack-to-pot ratio tells you how much room is left in a hand. Watch Mina define it, then measure three hands at the table.",
      cta: "Watch with Mina" },
    { kind: "film", label: "Film", upNext: "Play Mina’s hand",
      // The media rail's chapters on the film's own beats, with the opening as "Intro".
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Find the effective stack" }, { beat: "range", label: "Divide by the pot" }, { beat: "low", label: "Low SPR" }, { beat: "high", label: "High SPR" }] },
    { kind: "decision", label: "Mina’s hand", spotId: "spr1-guided-ratio", hand: "spr1-guided", role: "guided",
      coachLine: "Mina’s hand. You measure the room.", next: "Now count the bets" },
    { kind: "decision", label: "Mina’s hand", spotId: "spr1-guided-bets", hand: "spr1-guided", role: "guided",
      coachLine: "You have the ratio. Now the bets it leaves.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "spr1-practice-ratio", hand: "spr1-practice", role: "practice",
      coachLine: "Same idea. Check both stacks first.", next: "Now count the bets" },
    { kind: "decision", label: "Practice", spotId: "spr1-practice-bets", hand: "spr1-practice", role: "practice",
      coachLine: "You have the ratio. Now the bets it leaves.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "spr1-fresh-ratio", hand: "spr1-fresh", role: "fresh",
      coachLine: "Your measure, your count.", next: "Now count the bets" },
    { kind: "decision", label: "Fresh hand", spotId: "spr1-fresh-bets", hand: "spr1-fresh", role: "fresh",
      coachLine: "Your measure, your count.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "Room you can measure.",
      lead: "Divide the effective stack, the smaller of the two, by the pot. The lower the number, the fewer bets are left before the chips are in.",
      recapLabels: ["Mina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "spr1-guided-ratio": {
      decision: "estimate", ...guided,
      bands: [{ id: "about-1", label: "About 1" }, { id: "about-3", label: "About 3" }, { id: "about-4", label: "About 4" }],
      dockPrompt: RATIO_DOCK,
      title: "What is the SPR?",
      prompt: "Mina’s hand: ace-king on a king-eight-three flop. The pot is 300. You have 300 behind and Ace Andy has 900. Ace Andy checks. Take the effective stack and divide it by the pot.",
      hint: RATIO_HINT,
      explanation: "You have 300, so no more than 300 can go in, however much Ace Andy has. The effective stack is 300, and 300 ÷ 300 is an SPR of 1. Dividing Ace Andy’s 900 gives 3 and adding both stacks gives 4, but chips that cannot be matched are never in play.",
      note: NOTE,
      hear: 1,
    },
    "spr1-guided-bets": {
      decision: "estimate", ...guided,
      bands: BETS_BANDS,
      dockPrompt: BETS_DOCK,
      title: "How much room is left?",
      prompt: "The pot is 300 and the effective stack is 300. Suppose every bet from here is the size of the pot and is called. How many bets until the effective stack is all in?",
      hint: BETS_HINT,
      explanation: "A pot-sized bet here is 300, which is all you have. One bet and the effective stack is in. That is what Mina means by not many future bets left. It measures the room; it does not say whether to bet, call or fold.",
      note: NOTE,
      hear: 2,
    },
    "spr1-practice-ratio": {
      decision: "estimate", ...practice,
      bands: [{ id: "about-2", label: "About 2" }, { id: "about-8", label: "About 8" }, { id: "about-10", label: "About 10" }],
      dockPrompt: RATIO_DOCK,
      title: "What is the SPR?",
      prompt: "Queen-jack on a queen-seven-two flop. The pot is 120. You have 1,000 behind and Ace Andy has 240. Ace Andy checks. What is the stack-to-pot ratio?",
      hint: RATIO_HINT,
      explanation: "Ace Andy can put in only 240 more, so 240 is the effective stack. 240 ÷ 120 is an SPR of 2. Your 1,000 gives about 8 and both stacks together give about 10, but the other 760 of yours cannot be matched in this hand.",
      note: NOTE,
      hear: 1,
    },
    "spr1-practice-bets": {
      decision: "estimate", ...practice,
      bands: BETS_BANDS,
      dockPrompt: BETS_DOCK,
      title: "How much room is left?",
      prompt: "The pot is 120 and the effective stack is 240. Suppose every bet from here is the size of the pot and is called. How many bets until the effective stack is all in?",
      hint: BETS_HINT,
      explanation: "Bet the pot, 120, and after the call the pot is 360 with 120 left behind. The next bet is all in, and it is smaller than the pot. Two bets and the effective stack is in: still not many future bets.",
      note: NOTE,
      hear: 2,
    },
    "spr1-fresh-ratio": {
      decision: "estimate", ...fresh,
      bands: [{ id: "about-13", label: "About 13" }, { id: "about-15", label: "About 15" }, { id: "about-28", label: "About 28" }],
      dockPrompt: RATIO_DOCK,
      title: "New hand. Same measure.",
      prompt: "Ace-ten of spades on an ace-nine-five flop. The pot is 100. You have 1,300 behind and Ace Andy has 1,500. Ace Andy checks. What is the stack-to-pot ratio?",
      hint: RATIO_HINT,
      explanation: "This time your stack is the smaller one, so 1,300 is the effective stack. 1,300 ÷ 100 is an SPR of 13. Ace Andy’s 1,500 gives 15 and both stacks together give 28, but only 1,300 can go in.",
      note: NOTE,
    },
    "spr1-fresh-bets": {
      decision: "estimate", ...fresh,
      bands: BETS_BANDS,
      dockPrompt: BETS_DOCK,
      title: "How much room is left?",
      prompt: "The pot is 100 and the effective stack is 1,300. Suppose every bet from here is the size of the pot and is called. How many bets until the effective stack is all in?",
      hint: BETS_HINT,
      explanation: "Bet 100 and the pot is 300 with 1,200 behind. Bet 300 and the pot is 900 with 900 behind. Bet 900 and the stacks are in. Three pot-sized bets: one on the flop, one on the turn and one on the river. That is the turn and river pressure Mina means when SPR is high.",
      note: NOTE,
    },
  },
  hands: {
    // The film deals this hand on its `table` beat and ends on `start`; the web hand starts there
    // (startAt 0): Ace Andy checks, then the dock opens. No bet, no call, no showdown.
    "spr1-guided": {
      id: "spr1-guided", layout: "heads-up", seats: seats(300, 900), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "flop", board: guided.board, pot: 300, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: guided.board },
      ],
      script: [
        { do: "pause", ms: 600 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "spr1-guided-ratio" },
        { do: "decide", spotId: "spr1-guided-bets", when: "answered" },
      ],
    },
    "spr1-practice": {
      id: "spr1-practice", layout: "heads-up", seats: seats(1000, 240), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "flop", board: practice.board, pot: 120, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "spr1-practice-ratio" },
        { do: "decide", spotId: "spr1-practice-bets", when: "answered" },
      ],
    },
    "spr1-fresh": {
      id: "spr1-fresh", layout: "heads-up", seats: seats(1300, 1500), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "flop", board: fresh.board, pot: 100, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "spr1-fresh-ratio" },
        { do: "decide", spotId: "spr1-fresh-bets", when: "answered" },
      ],
    },
  },
};

export default definition;
