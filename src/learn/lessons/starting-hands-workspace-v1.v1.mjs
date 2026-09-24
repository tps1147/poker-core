// Lesson 11, Starting hands, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Reina's film is the retained 0 to 33.875 s of
// reina-lesson-11 (813 frames, audit/README.md): most losing hands start before the flop,
// queen-seven offsuit is a face card that does not mean profitable, what good and bad starting hands
// make, and discipline before the flop. The proof-spot fold verdict after 34.11 s is excluded. She
// names no seat, stack, blind or action, so every one of those on the table and in this copy is a
// given for the exercise.
//
// Then three hands at a six-handed table, each stopping once you act (no flop is dealt, no hand
// reaches a showdown and no other player's card ships):
//   Reina's hand  Q♦ 7♣ under the gun, first to act with five players behind: fold or raise to 25.
//   Practice      A♥ J♥ in middle position after under the gun folds: what it makes (strong hands or
//                 second-best hands), then fold or raise to 25.
//   Fresh hand    K♣ T♦ on the button facing an under-the-gun raise to 25: what it makes against that
//                 raise, then fold or call 25.
// The practice hand is not the film's queen-seven, so the film never gives its answer away.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// starting-hands-workspace-v1.v1.js) grades. No spot carries a preview rule: a read of what a
// starting hand makes, and a seat decision without a given chance, have no arithmetic rule, so a
// signed-out preview leaves them ungraded ("Here’s the thinking.").
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).

// The six-max ring (scriptedHand's ring shape, the film kit's shape): chairs hero, s1..s5 clockwise
// from the hero; the button follows the hero's `position`. The same five players sit at every hand,
// 1,000 each (100 big blinds at 5 and 10).
const PLAYERS = ["Rae", "Ned", "Ivy", "Sol", "Kit"];
const ring = (position, hero, rest) => ({
  layout: "six-max",
  seats: { hero: { name: "You", stack: 1000 } },
  players: PLAYERS.map((name) => ({ name, stack: 1000 })),
  position, hero, ...rest,
});
const OPEN = { raise: 25 };
const blinds = { do: "blinds", sb: 5, bb: 10 };
// Unopened: the blinds are in (5 and 10), 15 in the pot, 10 owed, no board.
const unopened = (hero) => ({ street: "preflop", board: [], hero, potBefore: 5, bet: 10, call: 10 });
// Facing an under-the-gun raise to 25: 5 + 10 + 25 = 40 in the pot, 25 owed.
const facingRaise = (hero) => ({ street: "preflop", board: [], hero, potBefore: 15, bet: 25, call: 25 });
const READ_BANDS = [{ id: "strong-hands", label: "Strong hands" }, { id: "second-best", label: "Second-best hands" }];
const readFeedback = { found: "You read what it makes.", missed: "Let’s picture the flops it hits.", open: "Here’s the read." };
const STOPS = "The hand stops once you act. No flop is dealt in this lesson.";

const definition = {
  id: "starting-hands-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t2-starting-hands",
  sourceLessonId: "lesson-starting-hands-001", videoLessonId: "lesson-starting-hands-001",
  coach: "reina", access: "free", template: "preflop",
  title: "Discipline before the flop.", kicker: "Play the hands that make strong hands.",
  trail: ["Learn", "Preflop discipline", "Starting hands"],
  course: { chapter: "Preflop discipline" },
  meta: { minutes: 5 },
  assumptions: "Six-handed, blinds of 5 and 10, everyone starts with 1,000 (100 big blinds), no antes and no rake. Nobody limps: when the action reaches you unopened, you open with a raise to 25 or you fold. What a hand mostly makes, and what an under-the-gun raise usually holds (big pairs, strong aces and the best kings and queens), follow common six-handed opening ranges, a rule of thumb this lesson gives you, never something read from anyone’s hidden cards. Each hand stops once you act, so no flop is dealt.",
  media: "media/starting-hands-workspace-v1.v1.json",
  feedback: { found: "You read the hand.", missed: "Let’s look at what it makes.", open: "Here’s the thinking." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Discipline before the flop.", em: "A face card is not a reason.",
      lead: "Some hands look playable and still lose chips later. Watch Reina read queen-seven offsuit, then play three hands at a six-handed table.",
      cta: "Watch with Reina" },
    { kind: "film", label: "Film", upNext: "Play Reina’s hand",
      // Chapters on the film's own beats (the media rail), with the opening as "Intro".
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Before the flop" }, { beat: "trouble", label: "Dominated trouble" }, { beat: "range", label: "What good hands make" }, { beat: "bad", label: "Second-best hands" }] },
    { kind: "decision", label: "Reina’s hand", spotId: "sh1-guided", hand: "sh1-guided", role: "guided",
      coachLine: "Reina’s queen-seven. You are first to act.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "sh1-practice-read", hand: "sh1-practice", role: "practice",
      coachLine: "New cards. Read what they make before you act.", next: "Now decide the hand",
      feedback: readFeedback },
    { kind: "decision", label: "Practice", spotId: "sh1-practice-act", hand: "sh1-practice", role: "practice",
      coachLine: "You have the read. Now the action.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "sh1-fresh-read", hand: "sh1-fresh", role: "fresh",
      coachLine: "Your read, your action.", next: "Now decide the hand",
      feedback: readFeedback },
    { kind: "decision", label: "Fresh hand", spotId: "sh1-fresh-act", hand: "sh1-fresh", role: "fresh",
      coachLine: "Your read, your action.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "Hands that make strong hands.",
      lead: "Before you put chips in, ask what your two cards make from this seat and against this action. Play the hands that make strong pairs, strong draws and nutted hands, and let the second-best ones go before they cost you chips later.",
      recapLabels: ["Reina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "sh1-guided": {
      decision: "action", choices: ["fold", "raise"], ...unopened(["Qd", "7c"]),
      title: "Queen-seven offsuit, first to act. Fold or raise?",
      prompt: "Reina’s queen-seven offsuit, under the gun: you are the first to act, and five players act after you. The blinds have put in 5 and 10, so 15 is in the pot and you owe 10. Raise to 25, or fold?",
      hint: "Ask what this hand makes when it hits a flop, and who can still wake up with a better hand behind you.",
      explanation: "Queen-seven offsuit mostly makes second-best hands: a pair of queens with a weak kicker, or a pair of sevens under higher cards. With five players still to act, any of them can hold a better queen or a bigger pair. Folding is the play under this lesson’s assumptions, and it costs you nothing: under the gun you have put no chips in.",
      note: STOPS,
      focus: ["Qd", "7c"], focusPositions: ["MP", "CO", "BTN", "SB", "BB"], hear: 2,
    },
    "sh1-practice-read": {
      decision: "estimate", bands: READ_BANDS, ...unopened(["Ah", "Jh"]),
      dockPrompt: "When it connects, this hand mostly makes:",
      title: "What does ace-jack suited mostly make?",
      prompt: "A new hand. You are in middle position with ace-jack of hearts, and under the gun has folded. The blinds have put in 5 and 10, so 15 is in the pot and you owe 10. Before you act, use Reina’s rule: when this hand connects with a flop, does it mostly make strong hands (strong pairs, strong draws, nutted hands) or second-best hands?",
      hint: "Picture the flops it hits. When it pairs, how good is the other card? What can two suited cards with an ace draw to?",
      explanation: "Strong hands. A pair of aces or jacks comes with a good kicker, two more hearts give it a draw to the best possible flush, and ace-king-queen-jack-ten is the highest straight. Those are the strong pairs, strong draws and nutted hands Reina describes.",
      focus: ["Ah", "Jh"], hear: 3,
    },
    "sh1-practice-act": {
      decision: "action", choices: ["fold", "raise"], ...unopened(["Ah", "Jh"]),
      title: "Now, fold or raise?",
      prompt: "Ace-jack suited in middle position, with under the gun folded and four players still to act after you. The blinds have put in 5 and 10, so 15 is in the pot and you owe 10. Raise to 25, or fold?",
      hint: "Use the read you just made, then count the players who still act after you.",
      explanation: "A hand that makes strong pairs, strong draws and nutted hands is worth playing from middle position with four players behind. Raising to 25 is the play under this lesson’s assumptions: common six-handed opening ranges from this seat include ace-jack suited.",
      note: STOPS,
      focusPositions: ["CO", "BTN", "SB", "BB"], hear: 3,
    },
    "sh1-fresh-read": {
      decision: "estimate", bands: READ_BANDS, ...facingRaise(["Kc", "Td"]),
      dockPrompt: "Against this raise, this hand mostly makes:",
      title: "Against this raise, what does king-ten offsuit make?",
      prompt: "A new hand. You are on the button with king-ten offsuit. Under the gun raises to 25, and middle position and the cutoff fold. With the blinds in, 40 is in the pot and you owe 25. Against the hands that raise from the first seat, does king-ten offsuit mostly make strong hands or second-best hands?",
      hint: "Think about the hands a player opens with from the first seat, and what your pairs look like next to theirs.",
      explanation: "Second-best hands. A raise from under the gun, with five players still to act, usually holds big pairs, strong aces and the best kings and queens. When your king pairs, their kicker is often better; when your ten pairs, it sits under their high cards. That is dominated trouble: second-best hands that cost chips later.",
      focus: ["Kc", "Td"], focusPositions: ["UTG"],
    },
    "sh1-fresh-act": {
      decision: "action", choices: ["fold", "call"], ...facingRaise(["Kc", "Td"]),
      title: "Fold or call 25?",
      prompt: "King-ten offsuit on the button. Under the gun raised to 25, and the small blind and the big blind still act after you. 40 is in the pot and you owe 25. Call 25, or fold?",
      hint: "Use the read you just made. What would a call ask this hand to win later?",
      explanation: "Calling puts 25 in with a hand that makes second-best hands against this raise, and both blinds can still act behind you. Folding is the play under this lesson’s assumptions. A mistake you never enter costs you nothing.",
      note: STOPS,
    },
  },
  hands: {
    // Reina's hand. The film deals it under the gun as she says "queen-seven" and posts no blind (she
    // speaks no amount), so the film ends on the held deal: stacks 1,000, pot 0, no turn. The web hand
    // starts there (script step 0): the blinds post and the action is on you, first to act.
    "sh1-guided": ring("UTG", ["Qd", "7c"], {
      id: "sh1-guided",
      start: { street: "preflop", board: [], pot: 0, dealt: "held" },
      intro: [
        { do: "deal" },
      ],
      script: [
        { do: "pause", ms: 500 },
        blinds,
        { do: "pause", ms: 400 },
        { do: "decide", spotId: "sh1-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "sh1-guided", sizes: OPEN },
      ],
    }),
    // Middle position: the blinds post, under the gun folds, and two decisions on the one deal.
    "sh1-practice": ring("MP", ["Ah", "Jh"], {
      id: "sh1-practice",
      start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
      script: [
        blinds,
        { do: "pause", ms: 400 },
        { do: "act", seat: "UTG", action: "fold" },
        { do: "decide", spotId: "sh1-practice-read" },
        { do: "decide", spotId: "sh1-practice-act", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "sh1-practice-act", sizes: OPEN },
      ],
    }),
    // The button: the blinds post, under the gun raises to 25, middle position and the cutoff fold.
    "sh1-fresh": ring("BTN", ["Kc", "Td"], {
      id: "sh1-fresh",
      start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
      script: [
        blinds,
        { do: "pause", ms: 400 },
        { do: "act", seat: "UTG", action: "raise", to: 25 },
        { do: "act", seat: "MP", action: "fold" },
        { do: "act", seat: "CO", action: "fold" },
        { do: "decide", spotId: "sh1-fresh-read" },
        { do: "decide", spotId: "sh1-fresh-act", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "sh1-fresh-act" },
      ],
    }),
  },
};

export default definition;
