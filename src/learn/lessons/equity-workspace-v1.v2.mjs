// Lesson 6, Equity, content version 2: the film-first flow (learn-flow-2026-09-16 SPEC, RECIPE).
// Mina's film (the v1 interval, 0 to 8 s, three sentences: "Your hand is not just what it is right
// now. How often it wins by the end. Future share is equity.") is a required step. Then three hands
// on the real table, each one estimate: the share of the pot that is yours on average, taken from a
// GIVEN chance of winning by the end. Version 1 (equity-workspace-v1.js) is unchanged for v1 runs.
//
// This lesson comes before pot odds, so there is no price build anywhere: every opponent checks, no
// bet is faced and no call is proposed. The share is the given chance times the pot on the table.
// No street is dealt after a decision, no showdown is earned and no opponent card ships.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// equity-workspace-v1.v2.js) grades every band. There is no arithmetic preview rule for a share, so
// a signed-out preview leaves these spots ungraded (feedback.open) rather than ship a key.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (stack) => ({ hero: { name: "You", stack }, opponent: { name: "Ace Andy", stack, botId: null } });
const HINT = "Your share is the given chance of winning taken of the pot in the middle. Turn that percent into chips.";
const guided = { hero: ["Ah", "Kd"], board: ["Qh", "Tc", "3s"], street: "flop", potBefore: 120, bet: 0, call: 0 };
const practice = { hero: ["7s", "6s"], board: ["8d", "5c", "Kh"], street: "flop", potBefore: 200, bet: 0, call: 0 };
const fresh = { hero: ["9c", "9d"], board: ["Jh", "Th", "4c", "2s"], street: "turn", potBefore: 250, bet: 0, call: 0 };

const definition = {
  id: "equity-workspace-v1", version: 2, flow: "film-first",
  conceptId: "t1-equity",
  sourceLessonId: "lesson-equity-001", videoLessonId: "lesson-equity-001",
  coach: "mina", access: "free", template: "core-math",
  title: "Judge your share first.", kicker: "A hand is more than it looks.",
  trail: ["Learn", "The math behind the move", "Equity"],
  course: { chapter: "The math behind the move" },
  meta: { minutes: 3 },
  assumptions: "Heads-up, and no more chips go in after this point: the opponent checks and the pot stays as it is. For this exercise, the chance of winning by the end is a given estimate, never read from the cards. Ties are ignored and there is no rake. The opponent’s cards stay hidden.",
  media: "media/equity-workspace-v1.v2.json",
  feedback: { found: "You found your share.", missed: "Let’s find the share together.", open: "Here’s the thinking." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Judge your share first.", em: "Then decide.",
      lead: "A hand is not just what it is right now. Watch Mina define future share, then find your share of the pot in three hands at the table.",
      cta: "Watch with Mina" },
    { kind: "film", label: "Film", upNext: "Play Mina’s hand",
      // The media rail's chapters on the film's own two beats, with the opening as "Intro".
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Read the hand" }, { beat: "share", label: "Judge your share" }] },
    { kind: "decision", label: "Mina’s hand", spotId: "eq2-guided", hand: "eq2-guided", role: "guided",
      coachLine: "Mina’s hand. You name the share.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "eq2-practice", hand: "eq2-practice", role: "practice",
      coachLine: "Same idea, a different hand.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "eq2-fresh", hand: "eq2-fresh", role: "fresh",
      coachLine: "A pair this time. Take your time.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "A share you can name.",
      lead: "Ask how often your hand wins by the end, then take that share of the pot. That share is your equity.",
      recapLabels: ["Mina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "eq2-guided": {
      decision: "estimate", ...guided,
      bands: [
        { id: "about-0", label: "Nothing yet" },
        { id: "about-42", label: "About 42 chips" },
        { id: "about-120", label: "About 120 chips" },
      ],
      dockPrompt: "Your share of the pot, on average",
      given: { equity: 35, source: "Given for this exercise" },
      title: "What share of this pot is yours?",
      prompt: "Mina’s hand: ace-king on a queen-ten-three flop, with no pair yet. Ace Andy checks and the pot is 120. For this exercise, your chance of winning by the end is given as 35%. On average, what share of the pot is yours?",
      hint: HINT,
      explanation: "Take the given chance of the pot: 35% of 120 is 42 chips. That is this hand’s equity. It has no pair right now, and it still owns about 42 chips on average, not nothing and not the whole 120.",
      note: "The turn and river are not dealt in this lesson. The share is about how often the hand wins by the end.",
      hear: 2,
    },
    "eq2-practice": {
      decision: "estimate", ...practice,
      bands: [
        { id: "about-0", label: "Nothing yet" },
        { id: "about-30", label: "About 30 chips" },
        { id: "about-60", label: "About 60 chips" },
      ],
      dockPrompt: "Your share of the pot, on average",
      given: { equity: 30, source: "Given for this exercise" },
      title: "What share of this pot is yours?",
      prompt: "Seven-six of spades on an eight-five-king flop: no pair, and a straight draw. Ace Andy checks and the pot is 200. For this exercise, your chance of winning by the end is given as 30%. On average, what share of the pot is yours?",
      hint: HINT,
      explanation: "Take the given chance of the pot: 30% of 200 is 60 chips. The percent is not the chips. Nothing is made yet, and the hand still owns about 60 chips on average because of how often it wins by the end.",
      note: "The turn and river are not dealt in this lesson. The share is about how often the hand wins by the end.",
      hear: 1,
    },
    "eq2-fresh": {
      decision: "estimate", ...fresh,
      bands: [
        { id: "about-40", label: "About 40 chips" },
        { id: "about-100", label: "About 100 chips" },
        { id: "about-250", label: "About 250 chips" },
      ],
      dockPrompt: "Your share of the pot, on average",
      given: { equity: 40, source: "Given for this exercise" },
      title: "New hand. Same idea.",
      prompt: "Pocket nines on a jack-ten-four-two turn. You hold a pair right now. Ace Andy checks and the pot is 250. For this exercise, your chance of winning by the end is given as 40%. On average, what share of the pot is yours?",
      hint: HINT,
      explanation: "Take the given chance of the pot: 40% of 250 is 100 chips. A pair right now does not make the whole pot yours. The hand wins 40% of the time by the end, so about 100 of the 250 chips are yours on average.",
      note: "The river is not dealt in this lesson. The share is about how often the hand wins by the end.",
    },
  },
  hands: {
    // The film deals this hand on its `table` beat and ends on `start`; the web hand starts there
    // (startAt 0): Ace Andy checks, then the dock opens. No bet, no call, no showdown.
    "eq2-guided": {
      id: "eq2-guided", layout: "heads-up", seats: seats(1140), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "flop", board: guided.board, pot: 120, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: guided.board },
      ],
      script: [
        { do: "pause", ms: 600 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "eq2-guided" },
      ],
    },
    "eq2-practice": {
      id: "eq2-practice", layout: "heads-up", seats: seats(1100), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "flop", board: practice.board, pot: 200, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "eq2-practice" },
      ],
    },
    "eq2-fresh": {
      id: "eq2-fresh", layout: "heads-up", seats: seats(1125), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "turn", board: fresh.board, pot: 250, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "eq2-fresh" },
      ],
    },
  },
};

export default definition;
