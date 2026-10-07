// Lesson 16, Board texture, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Vale's film is the retained 0 to 32.416667 s of
// vale-lesson-16 (778 frames, lessons/board-texture-workspace-v1/audit/README.md): the flop texture
// tells you how much can change; a dry board like ace-seven-two has fewer draws and fewer strong
// connections; a wet board like jack-ten-nine creates pairs, straights, two pairs and combo draws;
// when the board smashes the caller's range, autopilot betting gets punished; before you bet, read
// what strong hands exist, what draws exist and whose range connects harder. She speaks ranks only:
// no suits, no hero hand, no pot, no bet and no range, so every one of those is a given here. The old
// proof spot's verdict ("check and keep control") is outside the retained interval and is never used.
//
// The lesson is the read, not the bet. Every hand stops at the moment Vale names ("before you bet"):
// heads-up, you raised on the button, Ace Andy called and checks the flop to you. Two decisions on
// one deal, both facts of the visible flop alone:
//   1. Which draws can this flop give? (flush draws, straight draws, both, or neither), and
//   2. Dry or wet? (Vale's two words, read from what step 1 found.)
// No action is asked or keyed: that needs ranges Vale never declares (the audit's content contract),
// and choosing the bet is the next lesson. No street after a decision, no showdown, no opponent card.
//   Vale's hand   A♥ Q♦ on J♠ T♠ 9♥ (her wet example; suits given). Both draws. Wet.
//   Practice      A♠ K♦ on K♣ 8♦ 3♥, rainbow. No draw at all. Dry, like her ace-seven-two.
//   Fresh hand    J♣ J♦ on 6♥ 5♥ 2♣. Both draws, from low cards. Wet.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// board-texture-workspace-v1.v1.js) grades. Every spot is an estimate with no preview rule, so a
// signed-out preview leaves it ungraded ("open") rather than ship a key.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).

// Heads-up, blinds 5 and 10, 1,000 each before the hand. You raised to 30 on the button (the small
// blind heads-up) and Ace Andy called from the big blind: 60 in the pot and 970 behind each. On the
// flop the big blind acts first and checks.
const seats = () => ({ hero: { name: "You", stack: 970 }, opponent: { name: "Ace Andy", stack: 970, botId: null } });
const POT = 60;

const guided = { street: "flop", hero: ["Ah", "Qd"], board: ["Js", "Ts", "9h"] };
const practice = { street: "flop", hero: ["As", "Kd"], board: ["Kc", "8d", "3h"] };
const fresh = { street: "flop", hero: ["Jc", "Jd"], board: ["6h", "5h", "2c"] };

const DRAWS = [
  { id: "both", label: "Flush and straight draws" },
  { id: "flush", label: "Flush draws only" },
  { id: "straight", label: "Straight draws only" },
  { id: "none", label: "No flush or straight draw" },
];
const TEXTURE = [{ id: "dry", label: "Dry" }, { id: "wet", label: "Wet" }];
const DRAWS_DOCK = "Which draws can this flop give?";
const TEXTURE_DOCK = "Is this flop dry or wet?";
const DRAWS_HINT = "Count the suits on the flop first. Then check whether any two flop cards fit inside one five-card straight.";
const NOTE = "The hand stops before you act. This lesson reads the flop; choosing the bet is the next lesson.";
const textureFeedback = { found: "You named the texture.", missed: "Let’s name it together.", open: "Here’s the read." };

const definition = {
  id: "board-texture-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t3-board-texture",
  sourceLessonId: "lesson-board-texture-001", videoLessonId: "lesson-board-texture-001",
  coach: "vale", access: "pro", template: "postflop",
  title: "Read the flop before you bet.", kicker: "How much can change?",
  trail: ["Learn", "Postflop fundamentals", "Board texture"],
  course: { chapter: "Postflop fundamentals" },
  meta: { minutes: 4 },
  assumptions: "Heads-up, blinds of 5 and 10, 1,000 each before the hand, no antes and no rake. You raised to 30 on the button and Ace Andy called from the big blind, so the pot is 60 and you each have 970. He checks the flop to you. Vale names ranks only, so the suits, your cards and the amounts are given for the exercise. In this lesson a draw means four cards to a flush (two of a suit on the flop) or four cards to a straight (open-ended or with one gap) that some two-card hand could hold right now; draws that need both the turn and the river do not count. Dry and wet follow Vale’s two examples. A wet flop, like jack-ten-nine, already lets some hand make a straight and gives combo draws, a flush draw and a straight draw together. A dry flop, like ace-seven-two in three suits, lets no hand make a straight and gives no flush draw; it can still leave a few straight draws, which is why Vale says fewer draws, not none. Each flop in this lesson is clearly one or the other. Nothing is read from anyone’s hidden cards, and no ranges are assumed. Each hand stops before you act.",
  media: "media/board-texture-workspace-v1.v1.json",
  feedback: { found: "You read the flop.", missed: "Let’s read it together.", open: "Here’s the read." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Read the flop before you bet.", em: "Dry or wet.",
      lead: "The flop decides how much the next cards can change. Watch Vale read a dry board and a wet one, then read three flops at the table.",
      cta: "Watch with Vale" },
    { kind: "film", label: "Film", upNext: "Play Vale’s hand",
      // Chapters on the film's own beats (lessons/board-texture-workspace-v1/v1/timeline.json rail).
      // No in-film guess: every pause point would ask what she is about to say as an example, not a read.
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "A dry board" }, { beat: "wet", label: "A wet board" }, { beat: "texture", label: "What it creates" }, { beat: "leak", label: "Autopilot bets" }, { beat: "range", label: "Read before you bet" }] },
    { kind: "decision", label: "Vale’s hand", spotId: "bt1-guided-draws", hand: "bt1-guided", role: "guided",
      coachLine: "Vale’s wet board. Read it before you bet.", next: "Now name the texture" },
    { kind: "decision", label: "Vale’s hand", spotId: "bt1-guided-texture", hand: "bt1-guided", role: "guided",
      coachLine: "You found the draws. Now name the board.", next: "Try a practice hand", feedback: textureFeedback },
    { kind: "decision", label: "Practice", spotId: "bt1-practice-draws", hand: "bt1-practice", role: "practice",
      coachLine: "A new flop. Read it the same way.", next: "Now name the texture" },
    { kind: "decision", label: "Practice", spotId: "bt1-practice-texture", hand: "bt1-practice", role: "practice",
      coachLine: "Draws first, then the name.", next: "Try a fresh hand", feedback: textureFeedback },
    { kind: "decision", label: "Fresh hand", spotId: "bt1-fresh-draws", hand: "bt1-fresh", role: "fresh",
      coachLine: "Your read.", next: "Now name the texture" },
    { kind: "decision", label: "Fresh hand", spotId: "bt1-fresh-texture", hand: "bt1-fresh", role: "fresh",
      coachLine: "Your read.", next: "See your recap", feedback: textureFeedback },
    { kind: "takeaway", label: "Recap", heading: "A flop you can read.",
      lead: "Before you bet, read the flop: what strong hands it allows and what draws it gives. A dry flop gives few; a wet flop creates straights and combo draws, so the next cards can change a lot.",
      recapLabels: ["Vale’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "bt1-guided-draws": {
      decision: "estimate", ...guided,
      bands: DRAWS, dockPrompt: DRAWS_DOCK,
      title: "Which draws can this flop give?",
      prompt: "Vale’s jack-ten-nine, with the suits given: jack and ten of spades, nine of hearts. You raised to 30 on the button with ace-queen, Ace Andy called, and he checks to you. The pot is 60. Before you bet, read the flop: which draws could any player hold right now?",
      hint: DRAWS_HINT,
      explanation: "Two spades are showing, so any two spades make a flush draw. Jack, ten and nine all fit inside one straight, so hands like king-queen and queen-eight already have a straight and many more hold straight draws. A hand like eight-six of spades holds both at once: that is a combo draw.",
      focus: ["Js", "Ts", "9h"], hear: 3,
    },
    "bt1-guided-texture": {
      decision: "estimate", ...guided,
      bands: TEXTURE, dockPrompt: TEXTURE_DOCK,
      title: "Is this flop dry or wet?",
      prompt: "Take the draws you just found on jack-ten-nine. Is this flop dry or wet?",
      hint: "Compare it with Vale’s two examples: which one has fewer draws and fewer strong connections, and which one creates straights and combo draws?",
      explanation: "It is Vale’s own wet board. Straights are already possible, flush draws and straight draws both exist, and some hands hold both at once. A lot can change on the turn.",
      note: NOTE,
      focus: ["Js", "Ts", "9h"], hear: 2,
    },
    "bt1-practice-draws": {
      decision: "estimate", ...practice,
      bands: DRAWS, dockPrompt: DRAWS_DOCK,
      title: "Which draws can this flop give?",
      prompt: "A new hand. You raised to 30 on the button with ace-king, Ace Andy called, and the flop is king of clubs, eight of diamonds, three of hearts. He checks to you with 60 in the pot. Which draws could any player hold right now?",
      hint: DRAWS_HINT,
      explanation: "Three different suits are showing, so no two-card hand can hold four of one suit. King and eight are too far apart to share a five-card straight, and so are eight and three, so no hand holds four cards to a straight either. Only draws that need both the turn and the river are left, and they do not count here.",
      focus: ["Kc", "8d", "3h"], hear: 1,
    },
    "bt1-practice-texture": {
      decision: "estimate", ...practice,
      bands: TEXTURE, dockPrompt: TEXTURE_DOCK,
      title: "Is this flop dry or wet?",
      prompt: "Take the draws you just found on king-eight-three. Is this flop dry or wet?",
      hint: "Compare it with Vale’s two examples: which one has fewer draws and fewer strong connections, and which one creates straights and combo draws?",
      explanation: "Like Vale’s ace-seven-two in three suits, no hand can make a straight here and there is no flush draw. This flop gives no draw at all, so it is dry: less can change on the turn.",
      note: NOTE,
      focus: ["Kc", "8d", "3h"], hear: 1,
    },
    "bt1-fresh-draws": {
      decision: "estimate", ...fresh,
      bands: DRAWS, dockPrompt: DRAWS_DOCK,
      title: "Which draws can this flop give?",
      prompt: "You raised to 30 on the button with a pair of jacks, Ace Andy called, and the flop is six of hearts, five of hearts, two of clubs. He checks to you with 60 in the pot. Which draws could any player hold right now?",
      hint: DRAWS_HINT,
      explanation: "Two hearts are showing, so any two hearts make a flush draw. Six, five and two fit inside one straight, two to six, so four-three already has a straight, and hands like seven-four, ace-three or any four hold straight draws. Low cards connect too.",
      focus: ["6h", "5h", "2c"],
    },
    "bt1-fresh-texture": {
      decision: "estimate", ...fresh,
      bands: TEXTURE, dockPrompt: TEXTURE_DOCK,
      title: "Is this flop dry or wet?",
      prompt: "Take the draws you just found on six-five-two. Is this flop dry or wet?",
      hint: "Small cards count the same as big ones. Ask what this flop creates, not how high it is.",
      explanation: "It is wet. A straight is already possible, flush draws and straight draws both exist, and a hand like seven-four of hearts holds both. There are no big cards, and it still changes a lot.",
      note: NOTE,
      focus: ["6h", "5h", "2c"],
    },
  },
  hands: {
    // The film deals this hand, the flop on "jack", and ends on Ace Andy's check (script step 0), so
    // the web hand starts there (startAt 1): the two reads, and nothing after them.
    "bt1-guided": {
      id: "bt1-guided", layout: "heads-up", seats: seats(), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "flop", board: guided.board, pot: POT, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: guided.board },
      ],
      script: [
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "bt1-guided-draws" },
        { do: "decide", spotId: "bt1-guided-texture", when: "answered" },
      ],
      startAt: 1,
    },
    "bt1-practice": {
      id: "bt1-practice", layout: "heads-up", seats: seats(), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "flop", board: practice.board, pot: POT, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "bt1-practice-draws" },
        { do: "decide", spotId: "bt1-practice-texture", when: "answered" },
      ],
    },
    "bt1-fresh": {
      id: "bt1-fresh", layout: "heads-up", seats: seats(), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "flop", board: fresh.board, pot: POT, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "bt1-fresh-draws" },
        { do: "decide", spotId: "bt1-fresh-texture", when: "answered" },
      ],
    },
  },
};

export default definition;
