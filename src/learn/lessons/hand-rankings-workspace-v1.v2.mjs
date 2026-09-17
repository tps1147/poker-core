// Lesson 1, Hand rankings, content version 2: the film-first flow (learn-flow-2026-09-16 SPEC 7.1,
// storyboard 8.1). Ada's film is a required step. Then three hands on the real table, driven by the
// scripted-hand driver: her own river (guided), a straight behind a paired board (practice) and a
// flush over trips (fresh). Version 1 (hand-rankings-workspace-v1.js) is unchanged for v1 runs.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// hand-rankings-workspace-v1.v2.js) grades every five, and a signed-out preview grades with the
// hand evaluator (previewRule "best-five-evaluator"). The opponent's cards (`opponent.reveal`) ship
// only on hands whose script earns a showdown AFTER the learner's answer is saved; they are never
// drawn before that step runs (scriptedHand.validateHand enforces it).
// Relative imports only: the server's parity test imports this under plain Node.
const seats = (stack) => ({ hero: { name: "You", stack }, opponent: { name: "Ace Andy", stack, botId: null } });

const definition = {
  id: "hand-rankings-workspace-v1", version: 2, flow: "film-first",
  conceptId: "t0-hand-rankings",
  sourceLessonId: "lesson-hand-rankings-001", videoLessonId: "lesson-hand-rankings-001",
  coach: "ada", access: "free", template: "table-literacy",
  title: "Name the hand first.", kicker: "Cards before chips.",
  trail: ["Learn", "Table literacy", "Hand rankings"],
  course: { chapter: "Table literacy" },
  meta: { minutes: 4 },
  media: "media/hand-rankings-workspace-v1.v2.json",
  feedback: { found: "You named it.", missed: "Let’s build it together.", open: "Here’s the hand." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Name the hand first.", em: "Then choose the action.",
      lead: "Two cards in your hand, five on the board, and only five of the seven count. Watch Ada read a river, then play three hands at the table.",
      cta: "Watch with Ada" },
    { kind: "film", label: "Film", upNext: "Play Ada’s hand",
      // Chapters on the film's own beats (media beats; FILMS keeps them unchanged).
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Name the hand" }, { beat: "deal", label: "Read the board" }, { beat: "hand", label: "Build the hand" }, { beat: "rank", label: "Best five cards" }] },
    { kind: "decision", label: "Ada’s hand", spotId: "hr2-guided", hand: "hr2-guided", role: "guided",
      coachLine: "Ada’s river. You build the hand.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "hr2-practice", hand: "hr2-practice", role: "practice",
      coachLine: "Same idea, new cards. The pair on the board is busy.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "hr2-fresh", hand: "hr2-fresh", role: "fresh",
      coachLine: "Take your time. Rank the whole board.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "A hand you can name.",
      lead: "Read all seven cards, keep the five that rank highest, and say the hand to yourself before you touch a chip.",
      recapLabels: ["Ada’s river", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "hr2-guided": {
      decision: "best-five", previewRule: "best-five-evaluator",
      street: "river", potBefore: 160, bet: 40, call: 40,
      board: ["Ah", "9c", "9s", "4d", "2c"], hero: ["As", "9d"],
      title: "Which five cards make your hand?",
      prompt: "Ace-nine on this river. Your opponent bets 40 into 160. Before you think about the chips, pick the five cards that make your best hand.",
      hint: "Look for cards that share a rank across your hand and the board, then find the highest rung of the ladder those five can reach.",
      explanation: "The board shows two nines and you hold the third, so you have three nines. Your ace pairs the ace on the board. Three of a kind with a pair is a full house, nines full of aces. The four and the two do nothing.",
      focus: ["9d", "9c", "9s"], hear: 4,
    },
    "hr2-practice": {
      decision: "best-five", previewRule: "best-five-evaluator",
      street: "river", potBefore: 80, bet: 20, call: 20,
      board: ["9s", "8h", "Qd", "3c", "3s"], hero: ["Jc", "Td"],
      title: "Which five cards are your hand?",
      prompt: "Jack-ten on this river. Your opponent bets 20 into 80. The pair of threes looks busy. Pick the five cards that make your best hand.",
      hint: "Sort all seven cards by rank, high to low, and look at the gaps between them. A pair is not the only way to make a hand.",
      explanation: "Queen, jack, ten, nine and eight are five cards in a row, a straight. The pair of threes on the board ranks lower than a straight, so the threes do nothing for you.",
      focus: ["Qd", "9s", "8h"], hear: 5,
    },
    "hr2-fresh": {
      decision: "best-five", previewRule: "best-five-evaluator",
      street: "river", potBefore: 120, bet: 30, call: 30,
      board: ["Qh", "9h", "2h", "Kc", "Ks"], hero: ["Kh", "Jh"],
      title: "New board. Same idea.",
      prompt: "King-jack of hearts on this river. Your opponent bets 30 into 120. Two different hands are hiding in these seven cards; pick the five that rank highest.",
      hint: "Count how many cards of one suit you can see, and how many of one rank. Then check which of those two hands sits higher on the ladder.",
      explanation: "Five hearts are showing. The king, queen, jack, nine and two of hearts make a flush. Your three kings are real, but a flush ranks above three of a kind, so the two black kings do nothing here.",
      focus: ["Qh", "9h", "2h"],
    },
  },
  // Scripted hands for the real table (SPEC 2.4). Stacks and pots are one consistent table state:
  // the film ends on hr2-guided's start (pot 160, stacks 1,120, button on You).
  hands: {
    "hr2-guided": {
      id: "hr2-guided", layout: "heads-up", seats: seats(1120), button: "hero",
      hero: ["As", "9d"],
      opponent: { reveal: ["Ac", "Kc"] },
      start: { street: "river", board: ["Ah", "9c", "9s", "4d", "2c"], pot: 160, dealt: "held" },
      // Film only (the kit samples it on the film's beats); it ends exactly on `start`.
      intro: [
        { do: "deal" },
        { do: "street", cards: ["Ah", "9c", "9s"] },
        { do: "street", cards: ["4d"] },
        { do: "street", cards: ["2c"] },
        { do: "highlight", cards: ["9d", "9c", "9s", "As", "Ah"], dim: true },
      ],
      script: [
        { do: "pause", ms: 600 },
        { do: "act", seat: "opponent", action: "bet", amount: 40 },
        { do: "decide", spotId: "hr2-guided" },
        { do: "act", seat: "hero", action: "call", amount: 40, when: "answered", prompt: "Call 40 and see the showdown" },
        { do: "showdown" },
        { do: "result", winner: "hero", message: "from-expected" },
      ],
    },
    "hr2-practice": {
      id: "hr2-practice", layout: "heads-up", seats: seats(1160), button: "hero",
      hero: ["Jc", "Td"],
      opponent: { reveal: ["Qc", "9d"] },
      start: { street: "river", board: ["9s", "8h", "Qd", "3c", "3s"], pot: 80, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 20 },
        { do: "decide", spotId: "hr2-practice" },
        { do: "act", seat: "hero", action: "call", amount: 20, when: "answered", prompt: "Call 20 and see the showdown" },
        { do: "showdown" },
        { do: "result", winner: "hero", message: "from-expected" },
      ],
    },
    "hr2-fresh": {
      id: "hr2-fresh", layout: "heads-up", seats: seats(1140), button: "hero",
      hero: ["Kh", "Jh"],
      opponent: { reveal: ["As", "Kd"] },
      start: { street: "river", board: ["Qh", "9h", "2h", "Kc", "Ks"], pot: 120, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 30 },
        { do: "decide", spotId: "hr2-fresh" },
        { do: "act", seat: "hero", action: "call", amount: 30, when: "answered", prompt: "Call 30 and see the showdown" },
        { do: "showdown" },
        { do: "result", winner: "hero", message: "from-expected" },
      ],
    },
  },
};

export default definition;
