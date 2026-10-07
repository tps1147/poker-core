// Lesson 15, Ranges, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Vale's film is the retained 0 to 30.75 s of
// vale-lesson-15 (738 frames, lessons/ranges-workspace-v1/audit/README.md): do not put villain on one
// exact hand because it scares you; put them on a range, the hands that fit their preflop action and
// then the flop; on king-eight-three that range holds strong value but also ace-high, smaller pairs,
// worse kings and bluffs; "always aces" is fear reading; start broad, then remove hands street by
// street. The excluded tail (the old proof spot, "top pair with a strong kicker keeps going", and the
// closeout after it) is not part of this lesson, so no hand here asks for or plays a continue.
//
// Vale never says the preflop action, a pot, a bet or the hero's cards. Every amount is a given for
// the exercise and the line is stated before any range: heads-up, 1,000 stacks at 10 and 20, you
// raise to 70 on the button and Ace Andy calls from the big blind (pot 140, 930 behind each).
//
// The lesson is about reading a range, so every decision is a read (an estimate with named groups),
// never an action and never an advantage or equity claim:
//   Vale's hand   K♣ Q♣ on K♠ 8♦ 3♥ (her flop), Ace Andy bets 45 into 140. The read: a wide range,
//                 not just aces and not only strong hands (her own list).
//   Practice      A♦ J♣ on Q♥ 7♣ 2♦. Ace Andy checks, you bet 45, he calls. Two reads on one deal,
//                 under a given plan: what his preflop call takes out (premium hands, which he
//                 re-raises), then what his flop call takes out (missed hands, which fold).
//   Fresh hand    K♦ J♦ on A♥ 8♠ 4♣, the same line and plan. Which hand still fits his preflop call
//                 (ace-eight, not aces or ace-king), then what is left after his flop call (pairs
//                 and draws, not only strong hands).
// No street is dealt after a decision, no hand reaches a showdown and no opponent card ships.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// ranges-workspace-v1.v1.js) grades every band. No spot carries a preview rule (every read is an
// estimate), so a signed-out preview leaves them ungraded (feedback.open) rather than ship a key.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (stack) => ({ hero: { name: "You", stack }, opponent: { name: "Ace Andy", stack, botId: null } });

// The table facts at each decision. Vale's hand faces Ace Andy's 45; the practice and fresh hands
// decide after Ace Andy calls the hero's 45, so nothing is owed and the pot is 230.
const guided = { street: "flop", hero: ["Kc", "Qc"], board: ["Ks", "8d", "3h"], potBefore: 140, bet: 45, call: 45 };
const practice = { street: "flop", hero: ["Ad", "Jc"], board: ["Qh", "7c", "2d"], potBefore: 230, bet: 0, call: 0 };
const fresh = { street: "flop", hero: ["Kd", "Jd"], board: ["Ah", "8s", "4c"], potBefore: 230, bet: 0, call: 0 };

const LINE = "Given: you raised to 70 on the button and Ace Andy called from the big blind.";
const PREFLOP_PLAN = "Given for this hand: before the flop Ace Andy re-raises with premium hands (aces, kings, queens and ace-king) and calls with every other hand he plays, including every ace.";
const FLOP_PLAN = "Given for this hand: on the flop Ace Andy calls a bet with any pair or any draw and folds everything else.";
const NOTE = "No turn is dealt in this lesson. The read stops on the flop, and his cards stay hidden.";
const readFeedback = { found: "You read the range.", missed: "Let’s filter it together.", open: "Here’s the read." };

// The hero's bet on the practice and fresh hands, pressed by the learner. It sets up the read; the
// lesson does not grade it or claim it is the best play.
const heroBet = { do: "act", seat: "hero", action: "bet", amount: 45, prompt: "Bet 45 and see what Ace Andy does" };

const definition = {
  id: "ranges-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t3-ranges",
  sourceLessonId: "lesson-ranges-001", videoLessonId: "lesson-ranges-001",
  coach: "vale", access: "pro", template: "postflop",
  title: "Think in ranges.", kicker: "Start broad, then narrow.",
  trail: ["Learn", "Postflop fundamentals", "Ranges"],
  course: { chapter: "Postflop fundamentals" },
  meta: { minutes: 5 },
  assumptions: "Heads-up, 1,000 stacks at blinds of 10 and 20, no antes or rake. On every hand you raised to 70 on the button and Ace Andy called from the big blind, so the flop pot is 140 with 930 behind each. That preflop line is given; Vale does not say it. On the practice and fresh hands Ace Andy’s plan is also given: before the flop he re-raises with aces, kings, queens and ace-king and calls with every other hand he plays, including every ace; on the flop he calls a bet with any pair or any draw and folds everything else. A range is named in words, never read from his cards, which stay hidden. No turn or river is dealt, and no read here says who is ahead.",
  media: "media/ranges-workspace-v1.v1.json",
  feedback: readFeedback,
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Think in ranges.", em: "Not in fears.",
      lead: "One scary hand is not a read. Watch Vale put villain on a range, then read three hands at the table.",
      cta: "Watch with Vale" },
    { kind: "film", label: "Film", upNext: "Play Vale’s hand",
      // The media rail's chapters on the film's own beats, with the opening as "Intro".
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "A range, not a hand" }, { beat: "preflop", label: "Preflop action" }, { beat: "texture", label: "King-eight-three" }, { beat: "range", label: "What still fits" }, { beat: "fear", label: "Fear reading" }, { beat: "narrow", label: "Street by street" }] },
    { kind: "decision", label: "Vale’s hand", spotId: "rng1-guided", hand: "rng1-guided", role: "guided",
      coachLine: "Vale’s hand. Put Ace Andy on a range.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "rng1-practice-preflop", hand: "rng1-practice", role: "practice",
      coachLine: "Start with his action before the flop.", next: "Now the flop" },
    { kind: "decision", label: "Practice", spotId: "rng1-practice-flop", hand: "rng1-practice", role: "practice",
      coachLine: "Now remove what his flop call rules out.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "rng1-fresh-preflop", hand: "rng1-fresh", role: "fresh",
      coachLine: "Your read. Start broad.", next: "Now the flop" },
    { kind: "decision", label: "Fresh hand", spotId: "rng1-fresh-flop", hand: "rng1-fresh", role: "fresh",
      coachLine: "Your read. Narrow it once more.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "Ranges, not fears.",
      lead: "Start with every hand that fits the action before the flop, then remove the hands each street rules out.",
      recapLabels: ["Vale’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "rng1-guided": {
      decision: "estimate", ...guided,
      bands: [{ id: "aces", label: "Just aces" }, { id: "strong", label: "Only strong hands" }, { id: "range", label: "A wide range" }],
      dockPrompt: "What do you put Ace Andy on?",
      title: "What do you put him on?",
      prompt: `Vale’s hand. ${LINE} The flop is king-eight-three and Ace Andy bets 45 into 140. What do you put him on?`,
      hint: "Start with every hand that calls a raise before the flop. Then ask which of those could still bet this flop.",
      explanation: "A call before the flop keeps a lot of hands, and a bet on king-eight-three can come from many of them: strong value, but also ace-high, smaller pairs, worse kings and bluffs, as Vale lists. Just aces is one hand, and only strong hands throws away most of what still fits. That is fear reading, not hand reading.",
      note: "The hand stops at the read. What you do with king-queen is not part of this lesson.",
      focus: ["Ks", "8d", "3h"], hear: 2,
    },
    "rng1-practice-preflop": {
      decision: "estimate", ...practice,
      bands: [{ id: "premiums", label: "Premium hands" }, { id: "small-pairs", label: "Small pairs" }, { id: "connectors", label: "Suited connectors" }],
      dockPrompt: "Which group does his call take out?",
      title: "What did his call take out?",
      prompt: `${LINE} ${PREFLOP_PLAN} The flop is queen-seven-two, you bet 45 and he called. Start with his action before the flop: which group can you take out of his range?`,
      hint: "Go back to the moment he chose to call. Which group would the given plan have played another way?",
      explanation: "Premium hands would have re-raised, and Ace Andy only called, so aces, kings, queens and ace-king come out. Small pairs and suited connectors like seven-six are hands he calls with, so they stay. That is the first filter: the hands that fit his preflop action.",
      note: NOTE, hear: 1,
    },
    "rng1-practice-flop": {
      decision: "estimate", ...practice,
      bands: [{ id: "top-pairs", label: "Top pairs" }, { id: "smaller-pairs", label: "Smaller pairs" }, { id: "missed", label: "Missed hands" }],
      dockPrompt: "Which group does his flop call take out?",
      title: "Now, what did the flop take out?",
      prompt: `${FLOP_PLAN} On queen-seven-two you bet 45 into 140 and Ace Andy called. Which group can you take out now?`,
      hint: "Go through what is left of his range one group at a time. Under the given plan, would that group call your bet or fold it?",
      explanation: "Top pairs like queen-jack and smaller pairs like sevens or twos all hold a pair, so under the given plan they call and stay. Hands with no pair and no draw fold to a bet, so his call removes them. Start broad, then remove hands street by street.",
      note: NOTE, hear: 5,
    },
    "rng1-fresh-preflop": {
      decision: "estimate", ...fresh,
      bands: [{ id: "aces", label: "Aces" }, { id: "ace-king", label: "Ace-king" }, { id: "ace-eight", label: "Ace-eight" }],
      dockPrompt: "Which hand still fits his call?",
      title: "Which hand still fits?",
      prompt: `${LINE} ${PREFLOP_PLAN} The flop is ace-eight-four, you bet 45 and he called. Before you think about the flop, which of these still fits his range?`,
      hint: "Check each hand against what he did before the flop. A hand the given plan re-raises cannot be a hand that only called.",
      explanation: "Aces and ace-king are premium hands, and he would have re-raised them. Ace-eight is a hand he calls with, so it still fits. Taking out what his action rules out is hand reading; picking the scariest hand is not.",
      note: NOTE,
    },
    "rng1-fresh-flop": {
      decision: "estimate", ...fresh,
      bands: [{ id: "strong", label: "Only strong hands" }, { id: "pairs-draws", label: "Pairs and draws" }, { id: "missed", label: "Missed hands" }],
      dockPrompt: "What is left after his flop call?",
      title: "What is left after his call?",
      prompt: `${FLOP_PLAN} On ace-eight-four you bet 45 into 140 and Ace Andy called. What is left in his range?`,
      hint: "Keep every group the given plan calls with and remove every group it folds.",
      explanation: "His call keeps every pair and every draw he holds: aces like ace-eight, eights, fours, pocket pairs and any draws. Missed hands fold under the given plan, so they are gone. Strong hands are in there, but so are many weaker pairs and draws, so only strong hands would be fear reading.",
      note: NOTE,
    },
  },
  hands: {
    // The film deals this hand on its `table` beat and the flop as Vale says "flop", and ends on
    // `start`: pot 140, 930 behind each, no bet. The web hand starts there (no startAt): Ace Andy
    // bets 45, then the dock opens. No call, no turn, no showdown.
    "rng1-guided": {
      id: "rng1-guided", layout: "heads-up", seats: seats(930), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "flop", board: guided.board, pot: 140, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: guided.board },
      ],
      script: [
        { do: "pause", ms: 600 },
        { do: "act", seat: "opponent", action: "bet", amount: 45 },
        { do: "decide", spotId: "rng1-guided" },
      ],
    },
    "rng1-practice": {
      id: "rng1-practice", layout: "heads-up", seats: seats(930), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "flop", board: practice.board, pot: 140, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        heroBet,
        { do: "pause", ms: 500 },
        { do: "act", seat: "opponent", action: "call" },
        { do: "decide", spotId: "rng1-practice-preflop" },
        { do: "decide", spotId: "rng1-practice-flop", when: "answered" },
      ],
    },
    "rng1-fresh": {
      id: "rng1-fresh", layout: "heads-up", seats: seats(930), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "flop", board: fresh.board, pot: 140, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        heroBet,
        { do: "pause", ms: 500 },
        { do: "act", seat: "opponent", action: "call" },
        { do: "decide", spotId: "rng1-fresh-preflop" },
        { do: "decide", spotId: "rng1-fresh-flop", when: "answered" },
      ],
    },
  },
};

export default definition;
