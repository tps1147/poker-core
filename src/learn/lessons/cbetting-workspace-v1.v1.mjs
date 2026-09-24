// Lesson 17, C-betting, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Vale's film is the retained 0 to 27.875 s of
// vale-lesson-17 (669 frames, production/lessons/cbetting-workspace-v1/audit/README.md): a
// continuation bet works best when the flop favors the range that raised, king-seven-two rainbow
// as that board, the caller missing it, a small c-bet working without a made hand, and the
// condition that earns it. The excluded tail (the old proof spot, "Make the small pressure bet."
// and the closing slogan) is not part of this lesson. Vale speaks no pot, bet, size or stack, so
// every amount on the table and in this copy is a given for the exercise.
//
// Three heads-up hands on the flop. You raised before the flop on the button and Ace Andy called
// from the big blind, so he acts first after the flop and checks to you:
//   Vale's hand  A♣ Q♦ on K♦ 7♣ 2♠: check, or a small c-bet of 20 into 60.
//   Practice     K♣ Q♠ on 8♥ 7♥ 6♦: which range the flop favors, then check or c-bet 20 into 60.
//   Fresh hand   K♥ Q♥ on A♦ 8♣ 3♠: which range the flop favors, then check or c-bet 15 into 45.
// Who a flop favors is judged from the ranges the lesson assumes (stated in `assumptions` and in
// every prompt), never from Ace Andy's cards. Each hand stops once you act: no turn is dealt, no
// hand reaches a showdown and no opponent card ships.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// cbetting-workspace-v1.v1.js) grades. No spot carries a preview rule: a range read and a check or
// bet without a given chance have no arithmetic rule, so a signed-out preview leaves them ungraded
// (feedback.open) rather than ship a key.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (stack) => ({ hero: { name: "You", stack }, opponent: { name: "Ace Andy", stack, botId: null } });
const READ_BANDS = [
  { id: "raiser", label: "Your range, the raiser’s" },
  { id: "caller", label: "His range, the caller’s" },
];
const READ_DOCK = "This flop favors";
const RANGES = "Assume your raise holds the big pairs and strong aces and kings, and his call holds more small pairs and suited connectors.";
const READ_HINT = "Picture both assumed ranges on these three cards. Which one holds more of the pairs, two pairs, straights and strong draws this flop makes?";
const ACT_HINT = "Ask Vale’s two questions: does the flop favor your range, and does the board cooperate? A c-bet has to be earned; it is not automatic.";
const NOTE = "The hand stops once you act. No turn is dealt in this lesson, and Ace Andy’s cards stay hidden.";
const readFeedback = { found: "You read the flop.", missed: "Let’s picture both ranges on this flop.", open: "Here’s the read." };
const actFeedback = { found: "You weighed both conditions.", missed: "Let’s check both conditions.", open: "Here’s the thinking." };

// Checked to you on the flop: no bet is faced, nothing is owed.
const guided = { street: "flop", hero: ["Ac", "Qd"], board: ["Kd", "7c", "2s"], potBefore: 60, bet: 0, call: 0 };
const practice = { street: "flop", hero: ["Kc", "Qs"], board: ["8h", "7h", "6d"], potBefore: 60, bet: 0, call: 0 };
const fresh = { street: "flop", hero: ["Kh", "Qh"], board: ["Ad", "8c", "3s"], potBefore: 45, bet: 0, call: 0 };

const definition = {
  id: "cbetting-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t3-cbetting",
  sourceLessonId: "lesson-cbetting-001", videoLessonId: "lesson-cbetting-001",
  coach: "vale", access: "pro", template: "postflop",
  title: "Earn the c-bet.", kicker: "Bet when the flop favors your range.",
  trail: ["Learn", "Postflop fundamentals", "C-betting"],
  course: { chapter: "Postflop fundamentals" },
  meta: { minutes: 4 },
  assumptions: "Heads-up, on the flop. You raised before the flop on the button and Ace Andy called from the big blind, so he acts first and checks to you. The pots and stacks are given for the exercise; Vale speaks no amount. The ranges are assumptions, never read from anyone’s cards: your raise holds the strongest hands, big pairs and strong aces and kings, because Ace Andy would re-raise most of his; his call holds more small and middle pairs, suited connectors and middling aces. Who a flop favors, and whether the board cooperates, are judged from those assumed ranges and the three board cards. A small c-bet is a third of the pot. Each hand stops once you act: no turn is dealt and Ace Andy’s cards stay hidden.",
  media: "media/cbetting-workspace-v1.v1.json",
  feedback: { found: "You read it right.", missed: "Let’s read the flop together.", open: "Here’s the thinking." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Earn the c-bet.", em: "Raising first is not the reason.",
      lead: "A continuation bet works best when the flop favors the range that raised. Watch Vale read a king-high flop, then play three hands at the table.",
      cta: "Watch with Vale" },
    { kind: "film", label: "Film", upNext: "Play Vale’s hand",
      // The media rail's chapters on the film's own beats, with the opening as "Intro".
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "The range that raised" }, { beat: "texture", label: "King-seven-two rainbow" }, { beat: "caller", label: "The caller misses" }, { beat: "small", label: "A small c-bet" }, { beat: "earn", label: "Earn it" }] },
    { kind: "decision", label: "Vale’s hand", spotId: "cb1-guided", hand: "cb1-guided", role: "guided",
      coachLine: "Vale’s hand. Ace Andy checks to you.", next: "Try a practice hand",
      feedback: actFeedback },
    { kind: "decision", label: "Practice", spotId: "cb1-practice-read", hand: "cb1-practice", role: "practice",
      coachLine: "A different flop. Read it before you bet.", next: "Now decide the c-bet",
      feedback: readFeedback },
    { kind: "decision", label: "Practice", spotId: "cb1-practice-cbet", hand: "cb1-practice", role: "practice",
      coachLine: "You have the read. Now check or c-bet.", next: "Try a fresh hand",
      feedback: actFeedback },
    { kind: "decision", label: "Fresh hand", spotId: "cb1-fresh-read", hand: "cb1-fresh", role: "fresh",
      coachLine: "Your read, your c-bet.", next: "Now decide the c-bet",
      feedback: readFeedback },
    { kind: "decision", label: "Fresh hand", spotId: "cb1-fresh-cbet", hand: "cb1-fresh", role: "fresh",
      coachLine: "Your read, your c-bet.", next: "See your recap",
      feedback: actFeedback },
    { kind: "takeaway", label: "Recap", heading: "A c-bet you earned.",
      lead: "Before you c-bet, ask whose range the flop favors and whether the board cooperates. When both are on your side, a small c-bet is earned, even without a made hand. When they are not, raising first is not a reason to bet.",
      recapLabels: ["Vale’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "cb1-guided": {
      decision: "action", choices: ["check", "bet"], sizes: { bet: 20 }, ...guided,
      title: "Check, or c-bet 20?",
      prompt: `Vale’s hand. You raised, Ace Andy called, and he checks to you on king-seven-two in three suits. The pot is 60 and ace-queen has no pair yet. With the assumed ranges from the film, check, or c-bet 20?`,
      hint: ACT_HINT,
      explanation: "King-seven-two in three suits is dry: no flush draw and hardly any straight draw. By the assumed ranges, your raise holds more strong kings and overpairs, and Ace Andy’s call misses this board often. Your range has the advantage and the board cooperates, so a small c-bet of 20 is earned under this lesson’s assumptions, even though ace-queen has no pair yet. It does not promise the bet wins; it is Vale’s rule applied to these ranges.",
      note: NOTE,
      focus: ["Kd", "7c", "2s"], hear: 5,
    },
    "cb1-practice-read": {
      decision: "estimate", bands: READ_BANDS, dockPrompt: READ_DOCK, ...practice,
      title: "Whose range does this flop favor?",
      prompt: `You raised, Ace Andy called, and he checks to you on eight-seven-six with two hearts. The pot is 60. ${RANGES} Which range does this flop favor?`,
      hint: READ_HINT,
      explanation: "Eight-seven-six with two hearts connects with the hands the assumptions give Ace Andy more of: sixes, sevens and eights for sets, eight-seven and seven-six for two pair, ten-nine and five-four for straights, and many draws. Your raise has the overpairs, but his call hits this flop harder. It favors the caller.",
      note: NOTE,
      focus: ["8h", "7h", "6d"], hear: 0,
    },
    "cb1-practice-cbet": {
      decision: "action", choices: ["check", "bet"], sizes: { bet: 20 }, ...practice,
      title: "Now, check or c-bet 20?",
      prompt: "Use the read you just made. King-queen has no pair and no draw here. The pot is 60 and Ace Andy has checked. Check, or c-bet 20?",
      hint: ACT_HINT,
      explanation: "The flop favors Ace Andy’s assumed range, and the board does not cooperate: three connected cards and two hearts give his range many strong hands and draws. Neither condition is yours, so the c-bet of 20 is not earned. With no pair and no draw, checking is the play under this lesson’s assumptions. Raising first is not a reason to bet.",
      note: NOTE,
      hear: 4,
    },
    "cb1-fresh-read": {
      decision: "estimate", bands: READ_BANDS, dockPrompt: READ_DOCK, ...fresh,
      title: "Whose range does this flop favor?",
      prompt: `You raised, Ace Andy called, and he checks to you on ace-eight-three in three suits. The pot is 45. ${RANGES} Which range does this flop favor?`,
      hint: READ_HINT,
      explanation: "Ace-eight-three in three suits is dry. By the assumptions, your raise holds more of the strong aces, such as ace-king and ace-queen, and the big pairs, while Ace Andy re-raises most of his best aces and his call of small pairs and suited connectors misses this board often. It favors the raiser.",
      note: NOTE,
    },
    "cb1-fresh-cbet": {
      decision: "action", choices: ["check", "bet"], sizes: { bet: 15 }, ...fresh,
      title: "Now, check or c-bet 15?",
      prompt: "Use the read you just made. King-queen of hearts has no pair and no draw here. The pot is 45 and Ace Andy has checked. Check, or c-bet 15?",
      hint: ACT_HINT,
      explanation: "Your assumed range has the advantage and the board cooperates: three suits and no connected cards, so there is little for Ace Andy’s call to have hit or to draw to. That earns a small c-bet of 15 under this lesson’s assumptions, even though king-queen has no pair yet.",
      note: NOTE,
    },
  },
  hands: {
    // Vale's hand. The film deals it on its `table` beat and the flop on `texture`, and ends on
    // `start` (startAt 0): Ace Andy checks, then the dock opens. The learner's check or c-bet then
    // plays on the table and the hand stops.
    "cb1-guided": {
      id: "cb1-guided", layout: "heads-up", seats: seats(970), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "flop", board: guided.board, pot: 60, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: guided.board },
      ],
      script: [
        { do: "pause", ms: 600 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "cb1-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "cb1-guided", sizes: { bet: 20 } },
      ],
    },
    "cb1-practice": {
      id: "cb1-practice", layout: "heads-up", seats: seats(1170), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "flop", board: practice.board, pot: 60, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "cb1-practice-read" },
        { do: "decide", spotId: "cb1-practice-cbet", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "cb1-practice-cbet", sizes: { bet: 20 } },
      ],
    },
    "cb1-fresh": {
      id: "cb1-fresh", layout: "heads-up", seats: seats(1485), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "flop", board: fresh.board, pot: 45, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "cb1-fresh-read" },
        { do: "decide", spotId: "cb1-fresh-cbet", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "cb1-fresh-cbet", sizes: { bet: 15 } },
      ],
    },
  },
};

export default definition;
