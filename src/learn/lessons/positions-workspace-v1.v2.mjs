// Lesson 2, Table positions, content version 2: the film-first flow (learn-flow-2026-09-16 SPEC,
// RECIPE.md). Reina's film is a required step: the version 1 interval (0 to 29.5 s), WAV, coach clip,
// captions, cues and beats, drawn on the real six-max table. Then three hands at a six-handed table:
//   guided    Reina's own king-nine offsuit (K♦ 9♣), carried from under the gun to the button in the
//             film; it folds to you on the button (fold or raise)
//   practice  queen-nine offsuit under the gun, five players still to act (fold or raise)
//   fresh     nine-four offsuit on the button after the table folds (fold or raise)
// No street is dealt after a decision, no hand reaches a showdown and no opponent card ships.
// Version 1 (positions-workspace-v1.js) is unchanged for v1 runs.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// positions-workspace-v1.v2.js) grades every answer. A seat decision has no arithmetic preview rule,
// so a signed-out preview leaves it ungraded (feedback.open).
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).

// The six-max ring (scriptedHand's third seat shape, the film kit's shape): chairs hero, s1..s5
// clockwise from the hero; the button follows the hero's `position`. The same five players sit at
// every hand, 1,000 each (100 big blinds at 5 and 10).
const PLAYERS = ["Rae", "Ned", "Ivy", "Sol", "Kit"];
const ring = (position, hero, rest) => ({
  layout: "six-max",
  seats: { hero: { name: "You", stack: 1000 } },
  players: PLAYERS.map((name) => ({ name, stack: 1000 })),
  position, hero, ...rest,
});
const OPEN = { raise: 25 };
const blinds = { do: "blinds", sb: 5, bb: 10 };
// The table facts every spot shows: blinds in (5 and 10), 15 in the pot, 10 owed, no board.
const preflop = (hero) => ({ street: "preflop", board: [], hero, potBefore: 5, bet: 10, call: 10, sizes: OPEN });

const definition = {
  id: "positions-workspace-v1", version: 2, flow: "film-first",
  conceptId: "t0-positions",
  sourceLessonId: "lesson-positions-001", videoLessonId: "lesson-positions-001",
  coach: "reina", access: "free", template: "preflop",
  title: "Position is information.", kicker: "Learn the seat, then choose the range.",
  trail: ["Learn", "Table literacy", "Table positions"],
  course: { chapter: "Table literacy" },
  meta: { minutes: 3 },
  assumptions: "Six-handed, blinds of 5 and 10, everyone starts with 1,000 (100 big blinds), no antes and no rake. Nobody has raised before you, and nobody limps: when the action reaches you, you open with a raise to 25 or you fold. The plays follow common six-handed opening ranges for each seat, a rule of thumb this lesson gives you, not something read from anyone’s hidden cards. Each hand stops once you act, so no flop is dealt.",
  media: "media/positions-workspace-v1.v2.json",
  feedback: { found: "You read the seat.", missed: "Let’s look at the seat.", open: "Here’s the thinking." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Position is information.", em: "Read the seat first.",
      lead: "The same two cards play differently from different seats. Watch Reina carry king-nine from the first seat to the button, then play three hands at a six-handed table.",
      cta: "Watch with Reina" },
    { kind: "film", label: "Film", upNext: "Play Reina’s hand",
      // Chapters on the film's own beats (the v1 beats, unchanged), with the opening as "Intro".
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Read the seat" }, { beat: "hand", label: "Read the hand" }, { beat: "move", label: "Move to the button" }, { beat: "range", label: "Choose the range" }] },
    { kind: "decision", label: "Reina’s hand", spotId: "pos2-guided", hand: "pos2-guided", role: "guided",
      coachLine: "Reina’s king-nine, now on the button.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "pos2-practice", hand: "pos2-practice", role: "practice",
      coachLine: "New cards. You are first to act.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "pos2-fresh", hand: "pos2-fresh", role: "fresh",
      coachLine: "Your seat, your cards, your call.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "Seat first, range second.",
      lead: "Before you weigh your cards, count who still acts behind you. Early seats play fewer hands; late seats earn more of the right hands, not every hand.",
      recapLabels: ["Reina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "pos2-guided": {
      decision: "action", choices: ["fold", "raise"], ...preflop(["Kd", "9c"]),
      title: "It folds to you on the button. Fold or raise?",
      prompt: "Reina’s king-nine offsuit, now on the button. Under the gun, middle position and the cutoff have all folded. The blinds have put in 5 and 10, so 15 is in the pot and you owe 10. Raise to 25, or fold?",
      hint: "Count the players who still act after you, and remember who acts last on every street after the flop.",
      explanation: "Only the small blind and the big blind act after you, and you act last on every street after the flop. With just two players left to wake up with a better king or a strong pair, king-nine offsuit is one of the right hands for this seat, so raising to 25 is the play under this lesson’s assumptions.",
      note: "The hand stops once you act. No flop is dealt in this lesson.",
      focusPositions: ["SB", "BB"], hear: 6,
    },
    "pos2-practice": {
      decision: "action", choices: ["fold", "raise"], ...preflop(["Qs", "9d"]),
      title: "First to act with queen-nine. Fold or raise?",
      prompt: "A new hand. You are under the gun, the first seat to act, with queen-nine offsuit. The blinds have put in 5 and 10, so 15 is in the pot and you owe 10. Five players still act after you. Raise to 25, or fold?",
      hint: "Count the players who still get to act after you. Then ask what a hand like this runs into when better queens and strong pairs can be waiting behind you.",
      explanation: "Under the gun, five players still get to react, and any of them can hold a better queen or a strong pair. Queen-nine offsuit is easily dominated from the first seat, so folding is the play under this lesson’s assumptions. On the button, with only the blinds behind, the same kind of hand becomes worth opening.",
      note: "The hand stops once you act. No flop is dealt in this lesson.",
      focusPositions: ["MP", "CO", "BTN", "SB", "BB"], hear: 1,
    },
    "pos2-fresh": {
      decision: "action", choices: ["fold", "raise"], ...preflop(["9h", "4c"]),
      title: "It folds to you on the button. Fold or raise?",
      prompt: "Under the gun, middle position and the cutoff have all folded, and you are on the button with nine-four offsuit. The blinds have put in 5 and 10, so 15 is in the pot and you owe 10. Raise to 25, or fold?",
      hint: "Late position earns more hands, not every hand. Weigh your two cards as well as your seat.",
      explanation: "The button is the best seat at the table, but it does not make every hand playable. Nine-four offsuit rarely makes a strong hand and is usually behind whatever the blinds continue with, so folding is the play under this lesson’s assumptions. Late position earns more of the right hands, not all of them.",
      note: "The hand stops once you act. No flop is dealt in this lesson.",
    },
  },
  hands: {
    // Reina's hand. The film deals it under the gun and walks the button round (MP, then CO) as she
    // says "Now move to the button", landing on the button with script step 0. The web hand starts
    // there (startAt 1): the blinds post, the three seats before the button fold, and you decide.
    "pos2-guided": ring("UTG", ["Kd", "9c"], {
      id: "pos2-guided",
      start: { street: "preflop", board: [], pot: 0, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "position", hero: "MP" },
        { do: "position", hero: "CO" },
      ],
      script: [
        { do: "position", hero: "BTN" },
        { do: "pause", ms: 500 },
        blinds,
        { do: "pause", ms: 400 },
        { do: "act", seat: "UTG", action: "fold" },
        { do: "act", seat: "MP", action: "fold" },
        { do: "act", seat: "CO", action: "fold" },
        { do: "decide", spotId: "pos2-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "pos2-guided", sizes: OPEN },
      ],
      startAt: 1,
    }),
    // Under the gun: the blinds post and the action starts with you.
    "pos2-practice": ring("UTG", ["Qs", "9d"], {
      id: "pos2-practice",
      start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
      script: [
        blinds,
        { do: "pause", ms: 500 },
        { do: "decide", spotId: "pos2-practice" },
        { do: "act", seat: "hero", action: "answer", spotId: "pos2-practice", sizes: OPEN },
      ],
    }),
    // The button: the blinds post and the three seats before you fold.
    "pos2-fresh": ring("BTN", ["9h", "4c"], {
      id: "pos2-fresh",
      start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
      script: [
        blinds,
        { do: "pause", ms: 400 },
        { do: "act", seat: "UTG", action: "fold" },
        { do: "act", seat: "MP", action: "fold" },
        { do: "act", seat: "CO", action: "fold" },
        { do: "decide", spotId: "pos2-fresh" },
        { do: "act", seat: "hero", action: "answer", spotId: "pos2-fresh", sizes: OPEN },
      ],
    }),
  },
};

export default definition;
