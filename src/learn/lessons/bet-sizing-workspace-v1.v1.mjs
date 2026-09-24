// Lesson 18, Bet sizing, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Vale's film is the retained 0 to 20.416667 s of
// vale-lesson-18 (490 frames, lessons/bet-sizing-workspace-v1/audit/README.md): bet size is part of
// the story; a small bet pressures capped ranges and denies cheap equity without risking too much; a
// large bet says strong value, or a bluff with enough backup to apply real pressure; the leak is the
// same half-pot size on every board. She names no card, board, pot or amount except "half-pot", so
// every card and amount on the table is a given for the exercise.
//
// Three heads-up hands. In each one the hero has already decided to bet and chooses the size: a
// small bet (a third of the pot) or a large bet (three quarters). Each hand states Ace Andy's range
// and how it answers the two sizes as an assumption, never read from his hidden cards, and each
// stops once the hero bets (no card is dealt after the decision, no showdown, no opponent card ships):
//   Vale's hand   A♥ K♦ on K♠ 7♣ 2♦, pot 120, checked to you. Top pair against a capped range whose
//                 worse kings and pairs call a small bet more often than a large one.
//   Practice      Q♥ J♥ on K♥ T♥ 4♣ 2♠, pot 240, checked to you. No pair, a flush draw and an
//                 open-ended straight draw: a bluff with backup against one-pair hands that fold to a
//                 large bet more often than to a small one.
//   Fresh hand    K♥ Q♥ on A♠ 8♦ 3♣, pot 180, checked to you. No pair and almost no backup against a
//                 capped range whose aces call either size and whose missed hands fold to either size.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// bet-sizing-workspace-v1.v1.js) grades. No spot carries a preview rule: each size rests on the
// stated range, not on a given equity, so a signed-out preview leaves it ungraded ("open").
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (stack) => ({ hero: { name: "You", stack }, opponent: { name: "Ace Andy", stack, botId: null } });

// The table facts at each decision. Nothing is owed (Ace Andy checked), so the pot is potBefore.
// The two sizes are the stated givens: a third of the pot and three quarters of the pot.
const guided = { street: "flop", hero: ["Ah", "Kd"], board: ["Ks", "7c", "2d"], potBefore: 120, sizes: { bet: 40, "large-bet": 90 } };
const practice = { street: "turn", hero: ["Qh", "Jh"], board: ["Kh", "Th", "4c", "2s"], potBefore: 240, sizes: { bet: 80, "large-bet": 180 } };
const fresh = { street: "flop", hero: ["Kh", "Qh"], board: ["As", "8d", "3c"], potBefore: 180, sizes: { bet: 60, "large-bet": 135 } };
const labels = ({ sizes }) => ({ bet: `Small bet ${sizes.bet}`, "large-bet": `Large bet ${sizes["large-bet"]}` });

const NOTE = "The hand stops once you bet. What Ace Andy does next, and the next card, are not part of this lesson.";

const definition = {
  id: "bet-sizing-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t3-bet-sizing",
  sourceLessonId: "lesson-bet-sizing-001", videoLessonId: "lesson-bet-sizing-001",
  coach: "vale", access: "pro", template: "postflop",
  title: "Size tells the story.", kicker: "One size for every board is a leak.",
  trail: ["Learn", "Postflop fundamentals", "Bet sizing"],
  course: { chapter: "Postflop fundamentals" },
  meta: { minutes: 4 },
  assumptions: "Heads-up after the flop, 1,000 behind for both players, no rake. In every hand you raised before the flop, Ace Andy called from the big blind, and he checks to you. You have already decided to bet; the question is only the size. The two sizes are given for the exercise: a small bet of a third of the pot or a large bet of three quarters of the pot. Ace Andy’s range, and how it answers each size, is stated in each hand as an assumption for the exercise, not a solver’s answer, and nothing is read from his hidden cards. Each hand stops once you bet, so no more cards are dealt and no cards are shown.",
  media: "media/bet-sizing-workspace-v1.v1.json",
  feedback: { found: "You told the story.", missed: "Let’s read the story again.", open: "Here’s the story." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Size tells the story.", em: "Not one size for every board.",
      lead: "A bet size says something about your hand. Watch Vale split small bets from large ones, then choose a size in three hands at the table.",
      cta: "Watch with Vale" },
    { kind: "film", label: "Film", upNext: "Play Vale’s hand",
      // Chapters on the film's own beats (lessons/bet-sizing-workspace-v1/v1/timeline.json rail).
      chapters: [{ at: 0, label: "Size is a story" }, { beat: "small", label: "A small bet" }, { beat: "large", label: "A large bet" }, { beat: "leak", label: "The leak" }] },
    { kind: "decision", label: "Vale’s hand", spotId: "bs1-guided", hand: "bs1-guided", role: "guided",
      coachLine: "Vale’s flop. You pick the size.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "bs1-practice", hand: "bs1-practice", role: "practice",
      coachLine: "A draw this time. Pick the size.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "bs1-fresh", hand: "bs1-fresh", role: "fresh",
      coachLine: "Your read, your size.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "A size with a story.",
      lead: "Before you bet, name the story. A small bet pressures a capped range and denies cheap equity for little risk. A large bet says strong value, or a bluff with enough backup. The same half-pot size on every board is the leak.",
      recapLabels: ["Vale’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "bs1-guided": {
      decision: "action", choices: ["bet", "large-bet"], choiceLabels: labels(guided), ...guided,
      title: "Ace Andy checks. Which size tells your story?",
      prompt: "Vale’s hand: ace-king on a king, seven, two flop, pot 120, and Ace Andy checks. For this exercise his range is capped: he would have re-raised aces, kings and ace-king, so he holds weaker kings, sevens, small pairs and hands that missed. His weaker kings and pairs call a small bet more often than a large one. Small bet 40, or large bet 90?",
      hint: "Ask who pays you. Which hands in his range are worse than yours, and which size keeps them putting chips in?",
      explanation: "Top pair with the best kicker is ahead of almost all of a capped range. His weaker kings and pairs call 40 more often than 90, so the small bet keeps the hands you beat paying, and his missed hands still pay to see the turn. A large bet folds the worse hands you want in. That is the small-bet story: pressure a capped range and deny cheap equity without risking much.",
      note: NOTE,
      focus: ["Ah", "Kd", "Ks"], hear: 1,
    },
    "bs1-practice": {
      decision: "action", choices: ["bet", "large-bet"], choiceLabels: labels(practice), ...practice,
      title: "Ace Andy checks the turn. Which size tells your story?",
      prompt: "Queen-jack of hearts on king, ten, four, two, with two hearts on the board. Pot 240. You bet the flop, Ace Andy called, and now he checks. You have no pair, but a flush draw and an open-ended straight draw. For this exercise his range is mostly one pair, a king or a ten, plus some draws, and his one-pair hands fold to a large bet more often than to a small one. Small bet 80, or large bet 180?",
      hint: "You are not ahead now. Ask what you want his one-pair hands to do, and what your cards give you when he calls.",
      explanation: "Queen-jack of hearts is a bluff with backup: any heart makes a flush, and any ace or nine makes a straight. You want his one-pair hands to fold, and 180 folds them more often than 80. When he calls, the draw still gives you many river cards that win. That is the large-bet story Vale names: a bluff with enough backup to apply real pressure.",
      note: NOTE,
      focus: ["Qh", "Jh", "Kh", "Th"], hear: 3,
    },
    "bs1-fresh": {
      decision: "action", choices: ["bet", "large-bet"], choiceLabels: labels(fresh), ...fresh,
      title: "Ace Andy checks. Which size tells your story?",
      prompt: "King-queen of hearts on an ace, eight, three flop with no hearts. Pot 180, and Ace Andy checks. For this exercise his range is capped: he would have re-raised ace-king and ace-queen, so he holds weaker aces and hands that missed. His aces call either size, and his missed hands fold to either size. Small bet 60, or large bet 135?",
      hint: "Compare what each size wins and what it risks. Which of his hands act differently against the two sizes?",
      explanation: "King-queen has no pair and almost no backup: no flush draw, and only a runner-runner straight. In this range his missed hands fold to either size and his aces call either size, so 135 wins nothing that 60 does not, and risks 75 more. A bluff without backup is not the large-bet story. The small bet pressures his capped range without risking much.",
      note: NOTE,
    },
  },
  hands: {
    // Vale's hand. The film deals it and the flop, and Ace Andy checks (script step 0), so the web
    // hand starts there (startAt 1): the learner's size, then the table plays it.
    "bs1-guided": {
      id: "bs1-guided", layout: "heads-up", seats: seats(1000), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "flop", board: guided.board, pot: 120, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: guided.board },
      ],
      script: [
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "bs1-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "bs1-guided", sizes: guided.sizes },
      ],
      startAt: 1,
    },
    "bs1-practice": {
      id: "bs1-practice", layout: "heads-up", seats: seats(1000), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "turn", board: practice.board, pot: 240, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "bs1-practice" },
        { do: "act", seat: "hero", action: "answer", spotId: "bs1-practice", sizes: practice.sizes },
      ],
    },
    "bs1-fresh": {
      id: "bs1-fresh", layout: "heads-up", seats: seats(1000), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "flop", board: fresh.board, pot: 180, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "bs1-fresh" },
        { do: "act", seat: "hero", action: "answer", spotId: "bs1-fresh", sizes: fresh.sizes },
      ],
    },
  },
};

export default definition;
