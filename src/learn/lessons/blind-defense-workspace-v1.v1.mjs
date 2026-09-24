// Lesson 13, Blind defense, content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE.md). Reina's film is the retained 0 to 31.75 s of
// reina-lesson-13 (762 frames, lessons/blind-defense-workspace-v1/audit/README.md): the posted blind
// improves the price, defending is not pride and not permission to play everything, the three
// things (price, position, playability), why jack-ten suited plays, the dominated offsuit contrast
// (king-four) and "you will be out of position". She never says an amount, a range or a verdict, so
// every amount on the table and every opening range in this copy is a given for the exercise.
//
// Then three hands at a six-handed table, the hero in the big blind every time, each stopping once
// the hero acts (no flop is dealt, no hand reaches a showdown and no opponent card ships):
//   Reina's hand  J♣ T♣. Sol raises to 25 from the button, Kit folds. Pot 40, 15 to call, price
//                 15 ÷ 55, about 27%. Suited and connected, a wide button range: call.
//   Practice      K♦ 4♣. Rae raises to 30 under the gun, the rest fold. Pot 45, 20 to call, price
//                 20 ÷ 65, about 31% (estimate). A tight under-the-gun range holds the better kings,
//                 so king-four is dominated and plays out of position: fold.
//   Fresh hand    9♠ 8♠. Ned raises to 20 from middle position, the rest fold. Pot 35, 10 to call,
//                 price 10 ÷ 45, about 22% (estimate). Suited and connected, rarely dominated: call.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// blind-defense-workspace-v1.v1.js) grades. No spot carries a preview rule: the price estimates have
// none, and the fold or call rests on the stated ranges and playability, not on a given equity, so a
// signed-out preview leaves them ungraded ("open") rather than grade them by price alone.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).

// The six-max ring (scriptedHand's ring shape, the film kit's shape): chairs hero, s1..s5 clockwise
// from the hero; the button follows the hero's `position`. With the hero in the big blind, s1 is
// under the gun (Rae), s2 middle position (Ned), s3 the cutoff (Ivy), s4 the button (Sol) and s5 the
// small blind (Kit). The same five players as lesson 2, 1,000 each (100 big blinds at 5 and 10).
const PLAYERS = ["Rae", "Ned", "Ivy", "Sol", "Kit"];
const ring = (hero, rest) => ({
  layout: "six-max",
  seats: { hero: { name: "You", stack: 1000 } },
  players: PLAYERS.map((name) => ({ name, stack: 1000 })),
  position: "BB", hero, ...rest,
});
const blinds = { do: "blinds", sb: 5, bb: 10 };
const fold = (seat) => ({ do: "act", seat, action: "fold" });
// The table facts at each decision: no board, the pot before the hero's call is potBefore + bet, and
// `call` is what the hero still owes on top of the posted blind.
const guided = { street: "preflop", board: [], hero: ["Jc", "Tc"], potBefore: 25, bet: 15, call: 15 };
const practice = { street: "preflop", board: [], hero: ["Kd", "4c"], potBefore: 25, bet: 20, call: 20 };
const fresh = { street: "preflop", board: [], hero: ["9s", "8s"], potBefore: 25, bet: 10, call: 10 };

const NOTE = "The hand stops once you act. No flop is dealt in this lesson.";
const PRICE_DOCK = "Your call ÷ the pot after you call";
const PRICE_HINT = "Add your call to the pot first. Then divide your call by that total.";
const priceFeedback = { found: "You priced it.", missed: "Let’s build the price.", open: "Here’s the price." };

const definition = {
  id: "blind-defense-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t2-blind-defense",
  sourceLessonId: "lesson-blind-defense-001", videoLessonId: "lesson-blind-defense-001",
  coach: "reina", access: "pro", template: "preflop",
  title: "Defend with a reason.", kicker: "Price, position and playability.",
  trail: ["Learn", "Preflop discipline", "Blind defense"],
  course: { chapter: "Preflop discipline" },
  meta: { minutes: 4 },
  assumptions: "Six-handed, blinds of 5 and 10, everyone starts with 1,000 (100 big blinds), no antes and no rake. You are in the big blind, one player raises before you and everyone else folds. You choose between folding and calling; re-raising is a later lesson. The price is your call divided by the pot after you call. Each opener’s range is given in the hand, a rule of thumb this lesson states, never read from anyone’s hidden cards. Each hand stops once you act, so no flop is dealt.",
  media: "media/blind-defense-workspace-v1.v1.json",
  feedback: { found: "You weighed all three.", missed: "Let’s weigh the three things.", open: "Here’s the thinking." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Defend with a reason.", em: "Price, position, playability.",
      lead: "Your blind is already in, so calling a raise often looks cheap. Watch Reina weigh the three things that decide a defense, then play three hands from the big blind.",
      cta: "Watch with Reina" },
    { kind: "film", label: "Film", upNext: "Play Reina’s hand",
      // Chapters on the film's own beats (lessons/blind-defense-workspace-v1/v1/timeline.json rail).
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "The blind price" }, { beat: "range", label: "Three things" }, { beat: "hand", label: "Playability" }, { beat: "contrast", label: "Dominated hands" }, { beat: "seat", label: "Out of position" }] },
    { kind: "decision", label: "Reina’s hand", spotId: "bd1-guided", hand: "bd1-guided", role: "guided",
      coachLine: "Reina’s jack-ten suited. You decide the defense.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "bd1-practice-price", hand: "bd1-practice", role: "practice",
      coachLine: "A new raise from an earlier seat. Price it first.", next: "Now decide the defense", feedback: priceFeedback },
    { kind: "decision", label: "Practice", spotId: "bd1-practice-call", hand: "bd1-practice", role: "practice",
      coachLine: "You have the price. Now the other two things.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "bd1-fresh-price", hand: "bd1-fresh", role: "fresh",
      coachLine: "Your price, your defense.", next: "Now decide the defense", feedback: priceFeedback },
    { kind: "decision", label: "Fresh hand", spotId: "bd1-fresh-call", hand: "bd1-fresh", role: "fresh",
      coachLine: "Your price, your defense.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "A defense with a reason.",
      lead: "Your posted blind improves the price, but it is not a reason on its own. Call when the price, your position and your hand’s playability add up, and fold dominated hands that will play out of position.",
      recapLabels: ["Reina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "bd1-guided": {
      decision: "action", choices: ["fold", "call"], ...guided,
      title: "Sol raises to 25 from the button. Fold or call?",
      prompt: "Reina’s jack-ten suited in the big blind. Rae, Ned and Ivy fold, Sol raises to 25 from the button, and Kit folds from the small blind. The pot is 40 and you owe 15 more, so calling makes a 55-chip pot, a price of about 27%. Assume Sol opens a wide range from the button. After the flop you act first on every street. Call 15, or fold?",
      hint: "Weigh all three: how much of the final pot your call pays, who acts first after the flop, and what your two cards can become.",
      explanation: "Your blind is already in, so 15 more buys a share of a 55-chip pot: about 27%. Jack-ten suited can make straights, flushes and strong pair-plus-draw hands, and a wide button range holds plenty of hands it does not fear. You will act first after the flop, but the price and the playability give the hand a reason to continue, so calling is the defense under this lesson’s assumptions.",
      note: NOTE,
      focus: ["Jc", "Tc"], focusPositions: ["BTN"], hear: 2,
    },
    "bd1-practice-price": {
      decision: "estimate", ...practice,
      bands: [{ id: "about-31", label: "About 31%" }, { id: "about-44", label: "About 44%" }, { id: "about-67", label: "About 67%" }],
      dockPrompt: PRICE_DOCK,
      title: "What price does the call give you?",
      prompt: "A new hand. You are in the big blind with king-four offsuit. Rae raises to 30 from under the gun and everyone else folds. The pot is 45 and you owe 20 more. What share of the final pot would your call pay?",
      hint: PRICE_HINT,
      explanation: "Calling 20 makes the pot 65, and 20 ÷ 65 is about 31%. Dividing by the 45 already in gives 44%, and dividing by Rae’s raise of 30 gives 67%, but the price is always your call against the pot after you call.",
      hear: 0,
    },
    "bd1-practice-call": {
      decision: "action", choices: ["fold", "call"], ...practice,
      title: "Now, fold or call?",
      prompt: "Your call pays about 31% of the final pot. Assume Rae opens a tight range from under the gun: pairs, strong aces, and strong kings such as king-queen and king-jack. After the flop you act first on every street. Call 20, or fold?",
      hint: "The price is only one of the three. Ask what your hand makes when it connects, what it runs into, and who acts first after the flop.",
      explanation: "The price is fair, but king-four offsuit is the dominated offsuit hand Reina warns about. When a king comes, the kings in Rae’s range carry a better kicker, so a pair often loses a big pot, and you play every later street first. A posted blind is not a reason on its own, so folding is the defense under this lesson’s assumptions.",
      note: NOTE,
      focus: ["Kd", "4c"], focusPositions: ["UTG"], hear: 4,
    },
    "bd1-fresh-price": {
      decision: "estimate", ...fresh,
      bands: [{ id: "about-22", label: "About 22%" }, { id: "about-29", label: "About 29%" }, { id: "about-50", label: "About 50%" }],
      dockPrompt: PRICE_DOCK,
      title: "What price does the call give you?",
      prompt: "You are in the big blind with nine-eight of spades. Rae folds, Ned raises to 20 from middle position, and Ivy, Sol and Kit fold. The pot is 35 and you owe 10 more. What share of the final pot would your call pay?",
      hint: PRICE_HINT,
      explanation: "Calling 10 makes the pot 45, and 10 ÷ 45 is about 22%. Dividing by the 35 already in gives 29%, and dividing by Ned’s raise of 20 gives 50%.",
    },
    "bd1-fresh-call": {
      decision: "action", choices: ["fold", "call"], ...fresh,
      title: "Fold or call?",
      prompt: "Your call pays about 22% of the final pot. Assume Ned opens a medium range from middle position: pairs, suited aces, strong broadway hands and some suited connectors. After the flop you act first on every street. Call 10, or fold?",
      hint: "Weigh price, position and playability together, not one of them alone.",
      explanation: "The small raise makes the price cheap, about 22%. Nine-eight suited can make straights, flushes and strong pair-plus-draw hands, and when it connects it is rarely dominated by the big cards in Ned’s range. You still act first after the flop, but the price and the playability give it a reason to continue, so calling is the defense under this lesson’s assumptions.",
      note: NOTE,
    },
  },
  hands: {
    // Reina's hand. The film deals it, posts the blinds and plays the action round to the hero:
    // Rae, Ned and Ivy fold, Sol raises to 25 from the button, Kit folds (script steps 0 to 5). The
    // web hand starts there (startAt 6): the dock opens on the hero's decision.
    "bd1-guided": ring(["Jc", "Tc"], {
      id: "bd1-guided",
      start: { street: "preflop", board: [], pot: 0, dealt: "held" },
      intro: [{ do: "deal" }],
      script: [
        blinds,
        fold("UTG"),
        fold("MP"),
        fold("CO"),
        { do: "act", seat: "BTN", action: "raise", to: 25 },
        fold("SB"),
        { do: "decide", spotId: "bd1-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "bd1-guided" },
      ],
      startAt: 6,
    }),
    // Under the gun raises; the rest fold to the big blind. Price first, then the defense.
    "bd1-practice": ring(["Kd", "4c"], {
      id: "bd1-practice",
      start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
      script: [
        blinds,
        { do: "pause", ms: 400 },
        { do: "act", seat: "UTG", action: "raise", to: 30 },
        fold("MP"),
        fold("CO"),
        fold("BTN"),
        fold("SB"),
        { do: "decide", spotId: "bd1-practice-price" },
        { do: "decide", spotId: "bd1-practice-call", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "bd1-practice-call" },
      ],
    }),
    // Middle position min-raises after one fold; the rest fold to the big blind.
    "bd1-fresh": ring(["9s", "8s"], {
      id: "bd1-fresh",
      start: { street: "preflop", board: [], pot: 0, dealt: "deal" },
      script: [
        blinds,
        { do: "pause", ms: 400 },
        fold("UTG"),
        { do: "act", seat: "MP", action: "raise", to: 20 },
        fold("CO"),
        fold("BTN"),
        fold("SB"),
        { do: "decide", spotId: "bd1-fresh-price" },
        { do: "decide", spotId: "bd1-fresh-call", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "bd1-fresh-call" },
      ],
    }),
  },
};

export default definition;
