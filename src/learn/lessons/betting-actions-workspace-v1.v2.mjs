// Lesson 3, Betting actions, content version 2: the film-first flow (learn-flow-2026-09-16 SPEC,
// RECIPE.md). Ada's film is a required step: the same retained interval as version 1 (0 to 19 s, her
// three jobs), now drawn on the real table. Then three hands on the real table, one job each, answered
// on the game's own ActionBar (Fold, Call, Raise to N):
//   Ada's hand (guided)  her flop, Q♠ J♥ on Q♦ 8♣ 3♠, 30 into 120: the job that keeps a hand alive
//   Practice             a missed river draw, 100 into 200: the job that saves chips
//   Fresh hand           a flopped set, 40 into 120: the job that builds value
// Version 1 (betting-actions-workspace-v1.js) is unchanged for v1 runs.
//
// No answer keys live here: the server registry grades (pokerServer/src/data/lessonRuns/
// betting-actions-workspace-v1.v2.js). No spot declares a preview rule: the answer rests on a read
// supplied in the prompt, which no rule can grade from the cards, so a signed-out preview shows the
// thinking ungraded (feedback.open). Every read is supplied, never inferred from hidden cards; no
// opponent card ships, no hand reaches a showdown, and no street is dealt after a decision.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (stack) => ({ hero: { name: "You", stack }, opponent: { name: "Ace Andy", stack, botId: null } });

// Stacks and pots are one table state: every pot is what both players have already put in.
const guided = { street: "flop", hero: ["Qs", "Jh"], board: ["Qd", "8c", "3s"], potBefore: 120, bet: 30, call: 30 };
const practice = { street: "river", hero: ["7h", "6h"], board: ["Ks", "9h", "5h", "Jc", "2s"], potBefore: 200, bet: 100, call: 100 };
const fresh = { street: "flop", hero: ["8s", "8h"], board: ["Kc", "8d", "3h"], potBefore: 120, bet: 40, call: 40 };

const definition = {
  id: "betting-actions-workspace-v1", version: 2, flow: "film-first",
  conceptId: "t0-betting-actions",
  sourceLessonId: "lesson-betting-actions-001", videoLessonId: "lesson-betting-actions-001",
  coach: "ada", access: "free", template: "table-literacy",
  title: "Every action has a job.", kicker: "Reason, then the button.",
  trail: ["Learn", "Table literacy", "Betting actions"],
  course: { chapter: "Table literacy" },
  meta: { minutes: 3 },
  assumptions: "Heads-up. Each hand gives you a read on Ace Andy’s bet and on your own hand, stated in the prompt. The read is supplied for the exercise, never worked out from his hidden cards, and the right job follows from that read. No more cards are dealt after you choose.",
  media: "media/betting-actions-workspace-v1.v2.json",
  feedback: { found: "You picked the job.", missed: "Let’s look at the jobs.", open: "Here’s the thinking." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Every action has a job.", em: "Pick the job, then the button.",
      lead: "Folding, calling and raising each do a different job. Watch Ada name the three jobs, then play three hands at the table and choose the job each one needs.",
      cta: "Watch with Ada" },
    { kind: "film", label: "Film", upNext: "Play Ada’s hand",
      // The media rail's chapters on the film's own beats. `hand` is a stepped beat (the queen, then
      // the board's queen), so its chapter names that beat's first step, 7.1 s, as a time.
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Three jobs" }, { beat: "deal", label: "See the price" }, { at: 7.1, label: "Read the hand" }, { beat: "decision", label: "Choose the job" }] },
    { kind: "decision", label: "Ada’s hand", spotId: "act2-guided", hand: "act2-guided", role: "guided",
      coachLine: "Ada’s flop. You pick the job.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "act2-practice", hand: "act2-practice", role: "practice",
      coachLine: "Same three buttons. This draw missed.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "act2-fresh", hand: "act2-fresh", role: "fresh",
      coachLine: "Your read, your button.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "Reason, then the button.",
      lead: "Name the job before you press: fold to save chips when the hand or the price is wrong, call to keep a hand alive with the pot under control, raise to build value or apply pressure.",
      recapLabels: ["Ada’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "act2-guided": {
      decision: "action", choices: ["fold", "call", "raise"], sizes: { raise: 90 }, ...guided,
      title: "Which job does this hand need?",
      prompt: "Ada’s flop. You hold queen-jack and the board is queen, eight, three. Ace Andy bets 30 into 120. For this exercise, treat your top pair with a medium kicker as a hand that is often best right now but loses to stronger queens and overpairs. Fold, call 30 or raise to 90?",
      hint: "Ask what each button would do here. What would folding save? What would calling keep alive, and how big would the pot get? What would a raise build, and which hands would keep playing against one?",
      explanation: "Under this read your top pair is often the best hand, so folding gives up a hand that wins too often. A raise to 90 builds a bigger pot, but the hands most willing to keep playing against it are the stronger queens and overpairs that beat you. Calling 30 keeps your hand alive and keeps the pot under control while worse hands stay in. That is the job this hand needs.",
      note: "No more cards are dealt in this lesson. The job is chosen before the turn comes.",
      focus: ["Qs", "Jh", "Qd"], hear: 2,
    },
    "act2-practice": {
      decision: "action", choices: ["fold", "call", "raise"], sizes: { raise: 300 }, ...practice,
      title: "Which job does this hand need?",
      prompt: "River. You hold seven-six of hearts. Your flush draw and your straight draw both missed, so your best five is only king high. Ace Andy bets 100 into 200. For this exercise, treat his bet as a hand that almost always beats king high, and one he will not fold to a raise. Fold, call 100 or raise to 300?",
      hint: "No card is left to come. Ask what each button can still do: what would folding save, what would calling keep alive, and would a raise change what he does?",
      explanation: "With no card to come your hand cannot improve, and under this read king high almost never wins at showdown. Calling 100 keeps alive a hand that has nothing left to win with. A raise to 300 only applies pressure if he can fold, and this read says he will not. Folding saves the 100 because the hand is wrong. That is the job here.",
      focus: ["7h", "6h", "9h", "5h"], hear: 1,
    },
    "act2-fresh": {
      decision: "action", choices: ["fold", "call", "raise"], sizes: { raise: 120 }, ...fresh,
      title: "Which job does this hand need?",
      prompt: "Flop. You hold a pair of eights and the board brings the third eight: king, eight, three. Ace Andy bets 40 into 120. For this exercise, treat his bet as a king that will keep calling bigger bets. Fold, call 40 or raise to 120?",
      hint: "Place your hand against the king this read gives him. Then ask which job you want from this pot: saving chips, keeping it small, or building it.",
      explanation: "Three eights beat a pair of kings, so folding would give up a pot you are winning. Calling 40 keeps the pot small when your hand wants it big. Under this read he keeps calling bigger bets with his king, so a raise to 120 builds value. That is the job this hand needs.",
      focus: ["8s", "8h", "8d"],
    },
  },
  // Scripted hands for the real table (RECIPE step 5). The film deals Ada's flop and shows Ace Andy's
  // 30 as she says "price" (script step 0), so the guided hand starts on the step after it (startAt 1).
  hands: {
    "act2-guided": {
      id: "act2-guided", layout: "heads-up", seats: seats(1140), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "flop", board: guided.board, pot: 120, dealt: "held" },
      // Film only; it ends exactly on `start`.
      intro: [
        { do: "deal" },
        { do: "street", cards: guided.board },
      ],
      script: [
        { do: "act", seat: "opponent", action: "bet", amount: 30 },
        { do: "decide", spotId: "act2-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "act2-guided", sizes: { raise: 90 } },
      ],
      startAt: 1,
    },
    "act2-practice": {
      id: "act2-practice", layout: "heads-up", seats: seats(1100), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "river", board: practice.board, pot: 200, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 100 },
        { do: "decide", spotId: "act2-practice" },
        { do: "act", seat: "hero", action: "answer", spotId: "act2-practice", sizes: { raise: 300 } },
      ],
    },
    "act2-fresh": {
      id: "act2-fresh", layout: "heads-up", seats: seats(1140), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "flop", board: fresh.board, pot: 120, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 40 },
        { do: "decide", spotId: "act2-fresh" },
        { do: "act", seat: "hero", action: "answer", spotId: "act2-fresh", sizes: { raise: 120 } },
      ],
    },
  },
};

export default definition;
