// Lesson 20, Bluffing, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Knox's film is the retained 0 to 33.291667 s of
// knox-lesson-20 (799 frames, lessons/bluffing-workspace-v1/audit/README.md): bluffing is not what you
// do because you missed; it is what you do when your line credibly represents value and your opponent
// can fold better hands. Two questions before you fire: what strong hands am I representing, and what
// better hands can they release? His ace-jack has poor showdown value, his line represents strong
// king-x, ace-king, ace-queen and overpairs, his ace blocks some of the strongest calls, and villain
// checks a capped river with many one-pair hands. The film stops before his conclusion ("That gives
// your bluff a target ... Story plus target is the green light"), so no verdict is spoken. He never
// says an amount, so the pot, the stacks, the line and the bet size are givens for the exercise.
//
// The lesson is Knox's two questions. Three heads-up river hands, all checked to you after the same
// given line (you raised before the flop and bet the flop and the turn; Ace Andy called both):
//   Knox's hand   A♠ J♠ on K♦ Q♠ 4♣ 8♥ 2♦. Given read: capped, many one-pair hands. Check or bet 200.
//                 Both questions have an answer: bet. A bet plays the fold branch; a check stops the
//                 hand with his cards hidden (the audit: Knox's villain hand is never shown).
//   Practice      A♥ Q♥ on K♥ 9♣ 4♥ 7♠ 2♦, a missed flush draw, the same read. First the target (which
//                 hands a bet needs to fold: the pairs that beat ace-high, not missed draws it already
//                 beats), then check or bet 200: bet. The check branch earns a showdown (a pair of nines).
//   Fresh hand    J♣ T♣ on A♦ 8♣ 3♣ 4♠ K♦, a missed flush draw. First the story (the line represents
//                 strong aces and better), then check or bet 200 under the given read that Ace Andy
//                 does not fold one pair on the river: check. A story with no target is not a bluff.
//                 Both branches earn a showdown (a pair of eights): he calls a bet.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// bluffing-workspace-v1.v1.js) grades. No spot carries a preview rule: the target and the story are
// estimates with no rule, and the actions rest on Knox's two questions and a given read, not on a given
// equity, so a signed-out preview leaves them ungraded ("open") rather than ship a key.
// The opponent's cards (`opponent.reveal`) ship only on the practice and fresh hands, whose scripts
// reach a showdown after the learner's answer is saved; scriptedHand.validateHand enforces it.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (stack) => ({ hero: { name: "You", stack }, opponent: { name: "Ace Andy", stack, botId: null } });

// The given line, the same in every hand: each player started with 1,000 and put 150 in before the
// river (a raise called before the flop, a flop bet called, a turn bet called), so the pot is 300 and
// each has 850 behind. Ace Andy checks the river to you (heads-up, you have the button and act last).
const STACK = 850;
const POT = 300;
const SIZES = { bet: 200 };

const guided = { street: "river", hero: ["As", "Js"], board: ["Kd", "Qs", "4c", "8h", "2d"] };
const practice = { street: "river", hero: ["Ah", "Qh"], board: ["Kh", "9c", "4h", "7s", "2d"] };
const fresh = { street: "river", hero: ["Jc", "Tc"], board: ["Ad", "8c", "3c", "4s", "Kd"] };

const actionFeedback = { found: "You asked both questions.", missed: "Let’s ask Knox’s two questions again.", open: "Here’s the thinking." };
const ONE_HAND = "One hand proves nothing. The decision is right or wrong because of the story and the target, not because of what Ace Andy does this time.";

const definition = {
  id: "bluffing-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t4-bluffing",
  sourceLessonId: "lesson-bluffing-001", videoLessonId: "lesson-bluffing-001",
  coach: "knox", access: "pro", template: "postflop",
  title: "Bluff with a story they can fold to.", kicker: "Not because you missed.",
  trail: ["Learn", "Pressure", "Bluffing"],
  course: { chapter: "Pressure" },
  meta: { minutes: 5 },
  assumptions: "Heads-up, no rake. Each player started the hand with 1,000. In every hand you raised before the flop and bet the flop and the turn, and Ace Andy called both bets, so the pot is 300 with 850 behind each, and he checks the river to you. The pot, the stacks, that line and the 200 bet size are given for the exercise; Knox does not speak them. What Ace Andy holds is described only as a read, labelled given in each hand, never taken from his hidden cards. Poor showdown value is Knox’s description, not an equity figure. His cards are shown only at a showdown the hand reaches after your answer.",
  media: "media/bluffing-workspace-v1.v1.json",
  feedback: { found: "You found it.", missed: "Let’s ask it together.", open: "Here’s the thinking." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Bluff with a story they can fold to.", em: "Not because you missed.",
      lead: "A bluff needs a line that looks like value and better hands that can fold. Watch Knox ask his two questions on a missed river, then play three hands at the table.",
      cta: "Watch with Knox" },
    { kind: "film", label: "Film", upNext: "Play Knox’s hand",
      // Chapters on the film's own beats (lessons/bluffing-workspace-v1/v1/timeline.json rail).
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "A credible line" }, { beat: "questions", label: "Two questions" }, { beat: "texture", label: "Knox’s hand" }, { beat: "range", label: "The story" }, { beat: "blocker", label: "Your ace" }, { beat: "target", label: "His range" }] },
    { kind: "decision", label: "Knox’s hand", spotId: "bl1-guided", hand: "bl1-guided", role: "guided",
      coachLine: "Knox’s river. You ask his two questions.", next: "Try a practice hand", feedback: actionFeedback },
    { kind: "decision", label: "Practice", spotId: "bl1-practice-target", hand: "bl1-practice", role: "practice",
      coachLine: "A different miss. Find the target first.", next: "Now decide the bet" },
    { kind: "decision", label: "Practice", spotId: "bl1-practice-action", hand: "bl1-practice", role: "practice",
      coachLine: "You have the target. Now check the story and act.", next: "Try a fresh hand", feedback: actionFeedback },
    { kind: "decision", label: "Fresh hand", spotId: "bl1-fresh-story", hand: "bl1-fresh", role: "fresh",
      coachLine: "Your questions, your decision.", next: "Now decide the bet" },
    { kind: "decision", label: "Fresh hand", spotId: "bl1-fresh-action", hand: "bl1-fresh", role: "fresh",
      coachLine: "Your questions, your decision.", next: "See your recap", feedback: actionFeedback },
    { kind: "takeaway", label: "Recap", heading: "A bluff with a reason.",
      lead: "Before you bluff, ask what strong hands your line represents and which better hands this player can fold. Bet when both have an answer. A missed hand alone is not a reason.",
      recapLabels: ["Knox’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "bl1-guided": {
      decision: "action", choices: ["check", "bet"], sizes: SIZES, ...guided,
      title: "Checked to you. Check or bet?",
      prompt: "Knox’s hand: ace-jack of spades, and nothing made on this river. The pot is 300. You raised before the flop and bet the flop and the turn; Ace Andy called both and checks. Given read: his range is capped, with many one-pair hands. Check, or bet 200?",
      hint: "Ask Knox’s two questions in order. What strong hands does your line represent? Which of his hands that beat ace-jack could fold?",
      explanation: "Ace-jack has poor showdown value: checked down, it loses to every pair he holds. Your line represents strong king-x, ace-king, ace-queen and overpairs, and your ace makes ace-king and aces less likely in his hand. Against the given capped range with many one-pair hands, a bet of 200 asks better hands, such as a queen or an eight, to fold. Both questions have an answer, so under this lesson’s assumptions the bet has a story and a target.",
      note: `${ONE_HAND} His cards stay hidden in Knox’s hand.`,
      focus: ["As", "Kd", "Qs"], hear: 3,
    },
    "bl1-practice-target": {
      decision: "estimate", ...practice,
      bands: [{ id: "better-pairs", label: "Pairs that beat ace high" }, { id: "missed-draws", label: "Missed draws you already beat" }],
      dockPrompt: "Which hands does a bet need to fold?",
      title: "Which hands must a bet fold?",
      prompt: "A new hand: ace-queen of hearts, and your flush draw missed. Same line: you raised before the flop and bet the flop and the turn, and Ace Andy called both, then checks. The pot is 300. Given read: a capped range with many one-pair hands and some missed draws. If you bet, which of his hands does the bet need to fold?",
      hint: "Picture a showdown against each group. Which group’s fold changes who wins the pot?",
      explanation: "Missed draws such as jack-ten already lose to ace high, so making them fold wins nothing extra. A bluff earns its chips when a hand that would beat you gives up: one-pair hands such as a nine, a seven or a small pocket pair. That is Knox’s second question, what better hands can they release.",
      focus: ["Ah", "Qh", "Kh", "4h"], hear: 3,
    },
    "bl1-practice-action": {
      decision: "action", choices: ["check", "bet"], sizes: SIZES, ...practice,
      title: "Now, check or bet?",
      prompt: "You found the target: his one-pair hands. Your line represents strong king-x, ace-king and overpairs, and your ace makes ace-king and aces less likely in his hand. The pot is 300. Check, or bet 200?",
      hint: "Put Knox’s two questions side by side. Is there a story, and is there a target?",
      explanation: "Checked down, your ace high loses to every pair he holds. A bet of 200 tells the same story as Knox’s line, strong king-x, ace-king and overpairs, and the given range holds many one-pair hands that can fold. Story and target are both there, so the bet is the play under this lesson’s assumptions.",
      note: ONE_HAND,
      focus: ["Ah", "Kh"], hear: 6,
    },
    "bl1-fresh-story": {
      decision: "estimate", ...fresh,
      bands: [{ id: "strong-hands", label: "Strong aces and better" }, { id: "missed-draw", label: "A missed draw" }],
      dockPrompt: "What does a bet here represent?",
      title: "What would a bet represent?",
      prompt: "Jack-ten of clubs, and your flush draw missed. You raised before the flop and bet the flop and the turn, and Ace Andy called both, then checks. The pot is 300. If you bet now, what does your line say you hold?",
      hint: "Think about the hands that would play this way for value, not the two cards you actually hold.",
      explanation: "A player who raises before the flop, then bets an ace-high flop and the turn, looks like strong aces, ace-king or better. That story is credible even though you hold jack-ten. It answers Knox’s first question. The second question is still open.",
      focus: ["Ad", "Kd"],
    },
    "bl1-fresh-action": {
      decision: "action", choices: ["check", "bet"], sizes: SIZES, ...fresh,
      title: "Check or bet?",
      prompt: "Your line tells a credible story. Given read for this hand: Ace Andy does not fold one pair on the river; he has called every river bet at this table. His checked range holds many one-pair hands. The pot is 300. Check, or bet 200?",
      hint: "A story is only half of Knox’s check. Which better hands will this player actually let go?",
      explanation: "Your best five is only ace high, from the ace and king on the board, and it loses to every pair, so a bluff needs those pairs to fold. Under the given read Ace Andy calls with one pair, so no better hand releases: the bet has a story but no target. Checking gives up the 300 in the pot; a bluff into a player who calls loses 200 more. Missing your draw is not a reason to bet on its own.",
      note: "Checking still loses this pot. It is the right decision because the bet has no target, not because of the cards he shows.",
    },
  },
  hands: {
    // Knox's hand. The film deals it and the streets, then Ace Andy checks as Knox says it (script
    // step 0). The web hand starts there (startAt 1): the learner decides at once. A bet plays the
    // fold branch; a check closes the river with no showdown, so no opponent card ships.
    "bl1-guided": {
      id: "bl1-guided", layout: "heads-up", seats: seats(STACK), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "river", board: guided.board, pot: POT, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: ["Kd", "Qs", "4c"] },
        { do: "street", cards: ["8h"] },
        { do: "street", cards: ["2d"] },
      ],
      script: [
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "bl1-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "bl1-guided", sizes: SIZES },
        { do: "act", seat: "opponent", action: "fold", if: { action: "bet" } },
        { do: "result", winner: "hero", message: "Ace Andy folds. You win 500", if: { action: "bet" } },
      ],
      startAt: 1,
    },
    // The same read as Knox's hand. Target, then the action. A check reaches the showdown the lesson
    // earns: his pair of nines beats ace high. A bet plays the fold branch.
    "bl1-practice": {
      id: "bl1-practice", layout: "heads-up", seats: seats(STACK), button: "hero",
      hero: practice.hero, opponent: { reveal: ["9d", "8d"] },
      start: { street: "river", board: practice.board, pot: POT, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "bl1-practice-target" },
        { do: "decide", spotId: "bl1-practice-action", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "bl1-practice-action", sizes: SIZES },
        { do: "act", seat: "opponent", action: "fold", if: { action: "bet" } },
        { do: "result", winner: "hero", message: "Ace Andy folds. You win 500", if: { action: "bet" } },
        { do: "showdown", if: { action: "check" } },
        { do: "result", winner: "opponent", message: "Ace Andy wins 300 · A pair of nines beats ace high", if: { action: "check" } },
      ],
    },
    // Given read: he does not fold one pair on the river. Story, then the action. Both branches reach a
    // showdown: a bet is called, a check is checked down. His pair of eights beats ace high either way.
    "bl1-fresh": {
      id: "bl1-fresh", layout: "heads-up", seats: seats(STACK), button: "hero",
      hero: fresh.hero, opponent: { reveal: ["8s", "7s"] },
      start: { street: "river", board: fresh.board, pot: POT, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "bl1-fresh-story" },
        { do: "decide", spotId: "bl1-fresh-action", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "bl1-fresh-action", sizes: SIZES },
        { do: "act", seat: "opponent", action: "call", if: { action: "bet" } },
        { do: "showdown", when: "answered" },
        { do: "result", winner: "opponent", message: "Ace Andy calls and wins 700 · A pair of eights beats ace high", if: { action: "bet" } },
        { do: "result", winner: "opponent", message: "Ace Andy wins 300 · A pair of eights beats ace high", if: { action: "check" } },
      ],
    },
  },
};

export default definition;
