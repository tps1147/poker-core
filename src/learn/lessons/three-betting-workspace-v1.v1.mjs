// Lesson 14, 3-betting, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Knox's film is the retained 0 to 29.791667 s of
// knox-lesson-14 (715 frames, lessons/three-betting-workspace-v1/audit/README.md): a 3-bet is not a
// bigger call, strong hands 3-bet for value because worse hands continue, suited blocker hands
// 3-bet as pressure (fewer of the strongest hands, still playable when called), ace-five suited
// against a late open as the example (blocks ace-king and ace-queen, can make the nut flush, does
// not want to just call every time) and the leak of 3-betting only premiums. He never says an
// amount, a seat or a range, so every amount on the table is a given for the exercise.
//
// The lesson is about the job of a 3-bet. Every hand asks for that job (value or pressure); the
// practice and fresh hands then ask for the action. Three hands at a six-handed table, each
// stopping once the hero acts (no flop is dealt, no hand reaches a showdown, no opponent card ships):
//   Knox's hand   A♠ 5♠ in the big blind. Rae, Ned and Kit fold, Ivy raises to 25 from the button,
//                 Sol folds. The job: pressure (his own example). The hand then plays the 3-bet to
//                 100 when the learner presses it.
//   Practice      A♦ K♣ on the button. Ivy folds, Sol raises to 25 from middle position, Kit folds.
//                 The job: value (a strong hand; worse hands continue). The action: 3-bet to 75.
//   Fresh hand    A♥ 4♥ in the small blind. Ned and Ivy fold, Kit raises to 25 from the cutoff, Sol
//                 folds. The job: pressure. The action (3-bet to 100 or fold, the small blind plan
//                 this exercise gives): 3-bet, not the leak of folding every hand that is not premium.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// three-betting-workspace-v1.v1.js) grades. No spot carries a preview rule: a job is an estimate
// with no rule, and the actions rest on Knox's two jobs, not on a given equity, so a signed-out
// preview leaves them ungraded ("open") rather than ship a key.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).

// The six-max ring (scriptedHand's ring shape, the film kit's shape): chairs hero, s1..s5 clockwise
// from the hero; the button follows the hero's `position`. The same five players as lessons 2 and 13,
// 1,000 each (100 big blinds at 5 and 10), seated per hand so a different player opens each time:
//   big blind (Knox's hand)  s1 UTG Rae, s2 MP Ned, s3 CO Kit, s4 BTN Ivy, s5 SB Sol
//   button (practice)        s1 SB Rae, s2 BB Ned, s3 UTG Ivy, s4 MP Sol, s5 CO Kit
//   small blind (fresh)      s1 BB Rae, s2 UTG Ned, s3 MP Ivy, s4 CO Kit, s5 BTN Sol
// Every opener sits in the top-right chair (s4): a side chair meets the column's edge, and the
// top-centre chair's bet lands on the pot pill.
const ring = (position, hero, names, rest) => ({
  layout: "six-max",
  seats: { hero: { name: "You", stack: 1000 } },
  players: names.map((name) => ({ name, stack: 1000 })),
  position, hero, ...rest,
});
const blinds = { do: "blinds", sb: 5, bb: 10 };
const fold = (seat) => ({ do: "act", seat, action: "fold" });
const open = (seat) => ({ do: "act", seat, action: "raise", to: 25 });

// The table facts at each decision: no board, the pot before the open is the blinds (15), the open
// is 25, and `call` is what the hero still owes on top of any posted blind.
const guided = { street: "preflop", board: [], hero: ["As", "5s"], potBefore: 15, bet: 25, call: 15 };
const practice = { street: "preflop", board: [], hero: ["Ad", "Kc"], potBefore: 15, bet: 25, call: 25 };
const fresh = { street: "preflop", board: [], hero: ["Ah", "4h"], potBefore: 15, bet: 25, call: 20 };

const JOBS = [{ id: "value", label: "For value" }, { id: "pressure", label: "As pressure" }];
const JOB_DOCK = "What is this 3-bet for?";
const NOTE = "The hand stops once you act. What the opener does next, and the flop, are not part of this lesson.";
const actionFeedback = { found: "You made the 3-bet.", missed: "Let’s look at the job again.", open: "Here’s the thinking." };

const definition = {
  id: "three-betting-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t2-3betting",
  sourceLessonId: "lesson-3betting-001", videoLessonId: "lesson-3betting-001",
  coach: "knox", access: "pro", template: "preflop",
  title: "Know why you 3-bet.", kicker: "A 3-bet is not a bigger call.",
  trail: ["Learn", "Preflop discipline", "3-betting"],
  course: { chapter: "Preflop discipline" },
  meta: { minutes: 4 },
  assumptions: "Six-handed, blinds of 5 and 10, everyone starts with 1,000 (100 big blinds), no antes and no rake. One player opens with a raise to 25 and everyone before you folds. Opening ranges are not stated; each hand names who opened and from where. The 3-bet sizes are given for the exercise: 75 (three times the open) on the button, 100 (four times) from the blinds. In the small blind the plan for this exercise is 3-bet or fold. The job of each 3-bet follows Knox’s two jobs, value and pressure, not a solver, and nothing is read from anyone’s hidden cards. Each hand stops once you act, so no flop is dealt.",
  media: "media/three-betting-workspace-v1.v1.json",
  feedback: { found: "You named the job.", missed: "Let’s name the job together.", open: "Here’s the job." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Know why you 3-bet.", em: "Value or pressure.",
      lead: "A 3-bet changes the hand, so it needs a job. Watch Knox split value from pressure, then play three hands at a six-handed table.",
      cta: "Watch with Knox" },
    { kind: "film", label: "Film", upNext: "Play Knox’s hand",
      // Chapters on the film's own beats (lessons/three-betting-workspace-v1/v1/timeline.json rail).
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "A new hand" }, { beat: "value", label: "Value" }, { beat: "pressure", label: "Pressure" }, { beat: "hand", label: "Ace-five suited" }, { beat: "leak", label: "The leak" }] },
    { kind: "decision", label: "Knox’s hand", spotId: "tb1-guided", hand: "tb1-guided", role: "guided",
      coachLine: "Knox’s ace-five suited. You name the job.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "tb1-practice-job", hand: "tb1-practice", role: "practice",
      coachLine: "A stronger hand this time. Name the job first.", next: "Now decide the action" },
    { kind: "decision", label: "Practice", spotId: "tb1-practice-action", hand: "tb1-practice", role: "practice",
      coachLine: "You have the job. Now act on it.", next: "Try a fresh hand", feedback: actionFeedback },
    { kind: "decision", label: "Fresh hand", spotId: "tb1-fresh-job", hand: "tb1-fresh", role: "fresh",
      coachLine: "Your job, your action.", next: "Now decide the action" },
    { kind: "decision", label: "Fresh hand", spotId: "tb1-fresh-action", hand: "tb1-fresh", role: "fresh",
      coachLine: "Your job, your action.", next: "See your recap", feedback: actionFeedback },
    { kind: "takeaway", label: "Recap", heading: "A 3-bet with a job.",
      lead: "Before you 3-bet, name the job: value when worse hands can continue, pressure with suited blockers that still play well when called. Only 3-betting premiums makes you easy to read.",
      recapLabels: ["Knox’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "tb1-guided": {
      decision: "estimate", ...guided,
      bands: JOBS, dockPrompt: JOB_DOCK,
      title: "Ivy opens from the button. What is a 3-bet for?",
      prompt: "Knox’s ace-five suited, in the big blind. Rae, Ned and Kit fold, Ivy raises to 25 from the button, a late open, and Sol folds from the small blind. The pot is 40 and you owe 15 more. If you 3-bet to 100, what job does that 3-bet do?",
      hint: "Ask what happens after the 3-bet. Do you want worse hands to continue, or do your cards make the strongest hands less likely and still play well when called?",
      explanation: "Ace-five suited is Knox’s own example of a pressure 3-bet against a late open. Your ace makes ace-king and ace-queen less likely in Ivy’s hand, and two suited cards can make the nut flush, so the hand still plays well when called. It is not a strong hand that wants worse hands to continue, so the job is pressure.",
      note: "Knox’s hand plays the 3-bet he describes. It stops before Ivy answers it.",
      focus: ["As", "5s"], focusPositions: ["BTN"], hear: 2,
    },
    "tb1-practice-job": {
      decision: "estimate", ...practice,
      bands: JOBS, dockPrompt: JOB_DOCK,
      title: "Sol opens. What is a 3-bet for?",
      prompt: "A new hand. You are on the button with ace-king offsuit. Ivy folds, Sol raises to 25 from middle position, and Kit folds from the cutoff. The pot is 40 and you owe 25. If you 3-bet, what job does that 3-bet do?",
      hint: "Picture the hands that keep playing against your 3-bet. Are you usually ahead of them, or do you mostly want them gone?",
      explanation: "Ace-king is a strong hand. Worse hands such as ace-queen, king-queen and smaller pairs can continue against a 3-bet, and ace-king is ahead of them, so the 3-bet is for value. It also blocks aces and kings, but that is not why it 3-bets: it wants those worse hands to continue.",
      focus: ["Ad", "Kc"], focusPositions: ["MP"], hear: 1,
    },
    "tb1-practice-action": {
      decision: "action", choices: ["fold", "call", "raise"], sizes: { raise: 75 }, ...practice,
      title: "Now, fold, call or 3-bet?",
      prompt: "You named the job. Sol raised to 25 and you owe 25. Fold, call 25, or 3-bet to 75?",
      hint: "Compare what a call and a 3-bet each do for a hand this strong against the worse hands that can continue.",
      explanation: "Strong hands 3-bet for value because worse hands can continue. A call keeps the pot small with a hand that is usually ahead; a 3-bet to 75 builds the pot while ace-queen, king-queen and smaller pairs are still willing to put chips in.",
      note: NOTE,
      focus: ["Ad", "Kc"], focusPositions: ["MP"], hear: 1,
    },
    "tb1-fresh-job": {
      decision: "estimate", ...fresh,
      bands: JOBS, dockPrompt: JOB_DOCK,
      title: "Kit opens from the cutoff. What is a 3-bet for?",
      prompt: "You are in the small blind with ace-four of hearts. Ned and Ivy fold, Kit raises to 25 from the cutoff, and Sol folds on the button. The pot is 40 and you owe 20 more. If you 3-bet to 100, what job does that 3-bet do?",
      hint: "Look at the ace and the suit. What does each one do if Kit opened a strong hand, and what does each one do if Kit calls?",
      explanation: "Ace-four suited is not a strong hand, so the 3-bet does not want worse hands to continue. Its ace makes ace-king and ace-queen less likely in Kit’s hand, and two hearts can make the nut flush, so it still plays well when called. The job is pressure, the same reasons Knox gives for ace-five.",
      focus: ["Ah", "4h"], focusPositions: ["CO"],
    },
    "tb1-fresh-action": {
      decision: "action", choices: ["fold", "raise"], sizes: { raise: 100 }, ...fresh,
      title: "Fold or 3-bet?",
      prompt: "You named the job. Kit opened to 25 from the cutoff and you owe 20 more. The plan in the small blind is 3-bet or fold. Fold, or 3-bet to 100?",
      hint: "Think about the player who only 3-bets premium hands, and what this hand’s ace and suit give you.",
      explanation: "Ace-four suited has the blocker and the nut flush that make a pressure 3-bet against a late open. Folding it because it is not premium is the leak Knox names: a player who only 3-bets premiums is easy to read. So the 3-bet to 100 is the play under this lesson’s assumptions.",
      note: NOTE,
    },
  },
  hands: {
    // Knox's hand. The film deals it, posts the blinds and plays the action round to the hero:
    // Rae, Ned and Kit fold, Ivy raises to 25 from the button, Sol folds (script steps 0 to 5). The
    // web hand starts there (startAt 6). The learner names the job; the hand then plays Knox's 3-bet when
    // the learner presses it (a hero step with a prompt, not an answer: the film's ring model plays
    // no answer step, and this 3-bet is the example the film already named).
    "tb1-guided": ring("BB", guided.hero, ["Rae", "Ned", "Kit", "Ivy", "Sol"], {
      id: "tb1-guided",
      start: { street: "preflop", board: [], pot: 0, dealt: "held" },
      intro: [{ do: "deal" }],
      script: [
        blinds,
        fold("UTG"),
        fold("MP"),
        fold("CO"),
        open("BTN"),
        fold("SB"),
        { do: "decide", spotId: "tb1-guided" },
        { do: "act", seat: "hero", action: "raise", to: 100, when: "answered", prompt: "3-bet to 100" },
      ],
      startAt: 6,
    }),
    // Middle position opens; the cutoff folds; the hero is on the button. Job, then the action.
    "tb1-practice": ring("BTN", practice.hero, ["Rae", "Ned", "Ivy", "Sol", "Kit"], {
      id: "tb1-practice",
      start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
      script: [
        blinds,
        { do: "pause", ms: 400 },
        fold("UTG"),
        open("MP"),
        fold("CO"),
        { do: "decide", spotId: "tb1-practice-job" },
        { do: "decide", spotId: "tb1-practice-action", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "tb1-practice-action", sizes: { raise: 75 } },
      ],
    }),
    // The cutoff opens; the button folds; the hero is in the small blind. Job, then the action.
    "tb1-fresh": ring("SB", fresh.hero, ["Rae", "Ned", "Ivy", "Kit", "Sol"], {
      id: "tb1-fresh",
      start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
      script: [
        blinds,
        { do: "pause", ms: 400 },
        fold("UTG"),
        fold("MP"),
        open("CO"),
        fold("BTN"),
        { do: "decide", spotId: "tb1-fresh-job" },
        { do: "decide", spotId: "tb1-fresh-action", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "tb1-fresh-action", sizes: { raise: 100 } },
      ],
    }),
  },
};

export default definition;
