// Lesson 12, Raise first in by position, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Reina's film is the retained 0 to 30.25 s of
// reina-lesson-12 (726 frames, audit/README.md): what raising first in means, why the seat decides
// how wide you open, early position against late position, her suited ace on the button and the
// leak of folding every hand that is not premium. The excluded proof line ("open the suited ace on
// the button") is the answer to her hand, so the film never says it; the learner makes that call.
// Reina names no stack, blind, open size or range width, so every amount here is a stated assumption.
//
// Then three hands at a six-handed table, each stopping once you act (no flop, no showdown, no other
// player's card ships):
//   Reina's hand   A♠ 5♠ on the button, folded to you (the film's own spot): fold or raise to 25
//   practice       J♣ T♥ under the gun: how many players act after you, then fold or raise to 25
//   fresh          K♦ T♣ in the cutoff, folded to you: how many act after you, then fold or raise to 25
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// rfi-position-workspace-v1.v1.js) grades every answer. A seat decision has no arithmetic preview
// rule and the seat count is an estimate dock, so a signed-out preview leaves them ungraded
// (feedback.open).
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).

// The six-max ring (the film kit's shape): chairs hero, s1..s5 clockwise from the hero; the button
// follows the hero's `position`. The same five players sit at every hand, 1,000 each (100 big blinds).
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
const preflop = (hero) => ({ street: "preflop", board: [], hero, potBefore: 5, bet: 10, call: 10 });
const behindBands = [{ id: "behind-2", label: "2 players" }, { id: "behind-3", label: "3 players" }, { id: "behind-5", label: "5 players" }];
const openFeedback = { found: "You read the seat.", missed: "Let’s look at the seat.", open: "Here’s the thinking." };

const definition = {
  id: "rfi-position-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t2-rfi-by-position",
  sourceLessonId: "lesson-rfi-position-001", videoLessonId: "lesson-rfi-position-001",
  coach: "reina", access: "free", template: "preflop",
  title: "Your seat sets your opening range.", kicker: "Tight early, wider late.",
  trail: ["Learn", "Preflop discipline", "Raise first in by position"],
  course: { chapter: "Preflop discipline" },
  meta: { minutes: 4 },
  assumptions: "Six-handed, blinds of 5 and 10, everyone starts with 1,000 (100 big blinds), no antes and no rake. Nobody has entered the pot before you: when the action reaches you, you open with a raise to 25 or you fold. The plays follow common six-handed opening ranges for each seat, a rule of thumb this lesson gives you, not a range Reina states and not something read from anyone’s hidden cards. Reina names no stack, blind, open size or range width. Each hand stops once you act, so no flop is dealt.",
  media: "media/rfi-position-workspace-v1.v1.json",
  feedback: openFeedback,
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Your seat sets your opening range.", em: "Tight early, wider late.",
      lead: "When everyone folds to you, the seat decides how wide you can open. Watch Reina read her suited ace on the button, then play three hands at a six-handed table.",
      cta: "Watch with Reina" },
    { kind: "film", label: "Film", upNext: "Play Reina’s hand",
      // Chapters on the film's own beats, with the opening as "Intro".
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Raise first in" }, { beat: "early", label: "Early position" }, { beat: "seats", label: "Late position" }, { beat: "hand", label: "The suited ace" }, { beat: "mistake", label: "The leak" }] },
    { kind: "decision", label: "Reina’s hand", spotId: "rfi1-guided", hand: "rfi1-guided", role: "guided",
      coachLine: "Reina’s suited ace. It folds to you on the button.", next: "Try a practice hand",
      feedback: openFeedback },
    { kind: "decision", label: "Practice", spotId: "rfi1-practice-behind", hand: "rfi1-practice", role: "practice",
      coachLine: "New cards, a new seat. Count who is behind you first.", next: "Now make your play",
      feedback: { found: "You counted the seats.", missed: "Let’s count the seats together.", open: "Here’s the count." } },
    { kind: "decision", label: "Practice", spotId: "rfi1-practice-open", hand: "rfi1-practice", role: "practice",
      coachLine: "You know who is behind you. Now choose.", next: "Try a fresh hand",
      feedback: openFeedback },
    { kind: "decision", label: "Fresh hand", spotId: "rfi1-fresh-behind", hand: "rfi1-fresh", role: "fresh",
      coachLine: "Your seat, your count.", next: "Now make your play",
      feedback: { found: "You counted the seats.", missed: "Let’s count the seats together.", open: "Here’s the count." } },
    { kind: "decision", label: "Fresh hand", spotId: "rfi1-fresh-open", hand: "rfi1-fresh", role: "fresh",
      coachLine: "Your seat, your cards, your call.", next: "See your recap",
      feedback: openFeedback },
    { kind: "takeaway", label: "Recap", heading: "Count the seats, then open.",
      lead: "When it folds to you, count the players still to act. Many behind you keeps your range tight; few behind you and position after the flop let it widen, so good hands that are not premium still earn a raise.",
      recapLabels: ["Reina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "rfi1-guided": {
      decision: "action", choices: ["fold", "raise"], ...preflop(["As", "5s"]),
      title: "It folds to you on the button. Fold or raise?",
      prompt: "Reina’s ace-five of spades on the button. Under the gun, middle position and the cutoff have all folded. The blinds have put in 5 and 10, so 15 is in the pot and you owe 10. Raise to 25, or fold?",
      hint: "Count the players who still act after you. Then think about what Reina said this hand does beyond its looks.",
      explanation: "Only the small blind and the big blind act after you, and you act last on every street after the flop. A suited ace also blocks strong aces and can make the nut flush. It is well inside common six-handed button opening ranges, so raising to 25 is the play under this lesson’s assumptions. Folding it because it is not premium is the leak Reina names.",
      note: "The hand stops once you act. No flop is dealt in this lesson.",
      focusPositions: ["SB", "BB"], hear: 5,
    },
    "rfi1-practice-behind": {
      decision: "estimate", bands: behindBands, dockPrompt: "Players still to act after you", ...preflop(["Jc", "Th"]),
      title: "How many players act after you?",
      prompt: "A new hand. You are under the gun with jack-ten offsuit, and the blinds have put in 5 and 10. Before you weigh your cards, how many players still get to act after you this hand?",
      hint: "Follow the action clockwise from your seat, all the way round to the big blind. Count every seat you pass.",
      explanation: "Under the gun you are the first to act. Middle position, the cutoff, the button, the small blind and the big blind all act after you: 5 players, any of whom can wake up with a strong hand.",
      focusPositions: ["MP", "CO", "BTN", "SB", "BB"], hear: 2,
    },
    "rfi1-practice-open": {
      decision: "action", choices: ["fold", "raise"], ...preflop(["Jc", "Th"]),
      title: "First to act with jack-ten. Fold or raise?",
      prompt: "You are under the gun with jack-ten offsuit and 5 players still to act after you. The blinds have put in 5 and 10, so 15 is in the pot and you owe 10. Raise to 25, or fold?",
      hint: "With this many players behind you, ask how often one of them holds a better hand than yours, and who acts last after the flop.",
      explanation: "With 5 players behind you, someone often holds a better jack, a better ten or a strong pair, and most of them will act after you on every later street. Jack-ten offsuit sits outside common six-handed under-the-gun opening ranges, so folding is the play under this lesson’s assumptions. From the cutoff or the button, the same hand is a normal open.",
      note: "The hand stops once you act. No flop is dealt in this lesson.",
      focusPositions: ["MP", "CO", "BTN", "SB", "BB"], hear: 2,
    },
    "rfi1-fresh-behind": {
      decision: "estimate", bands: behindBands, dockPrompt: "Players still to act after you", ...preflop(["Kd", "Tc"]),
      title: "How many players act after you?",
      prompt: "You are in the cutoff with king-ten offsuit. Under the gun and middle position have folded, and the blinds have put in 5 and 10. How many players still get to act after you?",
      hint: "Folded players are out. Follow the action clockwise from your seat to the big blind.",
      explanation: "From the cutoff, only the button, the small blind and the big blind act after you: 3 players. The two players before you have already folded.",
    },
    "rfi1-fresh-open": {
      decision: "action", choices: ["fold", "raise"], ...preflop(["Kd", "Tc"]),
      title: "It folds to you in the cutoff. Fold or raise?",
      prompt: "You are in the cutoff with king-ten offsuit and 3 players still to act after you. The blinds have put in 5 and 10, so 15 is in the pot and you owe 10. Raise to 25, or fold?",
      hint: "Fewer players behind means fewer strong hands waiting. Weigh your cards against the seat, not against the best possible hand.",
      explanation: "Only the button and the blinds are left, and they will not often hold a hand that has yours beaten. King-ten offsuit is not premium, but it is inside common six-handed cutoff opening ranges, so raising to 25 is the play under this lesson’s assumptions. Folding it because it is not premium is the leak.",
      note: "The hand stops once you act. No flop is dealt in this lesson.",
    },
  },
  hands: {
    // Reina's hand. The film deals it on the button, posts the blinds and folds under the gun, middle
    // position and the cutoff as she says "When everyone folds to you" (script steps 0 to 3). The web
    // hand starts there (startAt 4): the action is on you and you decide.
    "rfi1-guided": ring("BTN", ["As", "5s"], {
      id: "rfi1-guided",
      start: { street: "preflop", board: [], pot: 0, dealt: "held" },
      intro: [
        { do: "deal" },
      ],
      script: [
        blinds,
        { do: "act", seat: "UTG", action: "fold" },
        { do: "act", seat: "MP", action: "fold" },
        { do: "act", seat: "CO", action: "fold" },
        { do: "decide", spotId: "rfi1-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "rfi1-guided", sizes: OPEN },
      ],
      startAt: 4,
    }),
    // Under the gun: the blinds post and the action starts with you. Count, then decide.
    "rfi1-practice": ring("UTG", ["Jc", "Th"], {
      id: "rfi1-practice",
      start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
      script: [
        blinds,
        { do: "pause", ms: 500 },
        { do: "decide", spotId: "rfi1-practice-behind" },
        { do: "decide", spotId: "rfi1-practice-open", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "rfi1-practice-open", sizes: OPEN },
      ],
    }),
    // The cutoff: the blinds post and the two seats before you fold. Count, then decide.
    "rfi1-fresh": ring("CO", ["Kd", "Tc"], {
      id: "rfi1-fresh",
      start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
      script: [
        blinds,
        { do: "pause", ms: 400 },
        { do: "act", seat: "UTG", action: "fold" },
        { do: "act", seat: "MP", action: "fold" },
        { do: "decide", spotId: "rfi1-fresh-behind" },
        { do: "decide", spotId: "rfi1-fresh-open", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "rfi1-fresh-open", sizes: OPEN },
      ],
    }),
  },
};

export default definition;
