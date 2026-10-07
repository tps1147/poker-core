// Lesson 5, the rule of 2 and 4, content version 2: the film-first flow (learn-flow-2026-09-16 SPEC,
// RECIPE.md). Mina's retained film (0 to 26.75 s of mina-lesson-05.mp4, unchanged from version 1) is
// a required step with one ungraded, local guess at 15 s (a playback position in measured silence
// between "was" 14.705 and "Here" 15.185; the file, WAV, cues and beats are untouched). Then three
// hands on the real table:
//   Mina's hand (guided)  J♠ T♠ on 9♣ 8♦ 2♥ A♣, the film's own turn: Ace Andy bets 40 into 120.
//                         Estimate the chance (8 × 2), then decide the call against the 40 ÷ 200
//                         price Mina speaks.
//   Practice              6♠ 5♠ on 7♦ 8♣ K♥, the flop: count the outs, then estimate with two
//                         cards to come (times four).
//   Fresh hand            J♥ T♥ on K♥ 6♠ 2♥ 4♦, the turn: count the outs, then estimate with one
//                         card to come (times two, where times four is the common slip).
// No street is dealt after a decision and no opponent card ships in this lesson. Version 1
// (rule-2-4-workspace-v1.js) is unchanged for version 1 runs.
//
// No answer keys live here: the server registry grades. A signed-out preview grades the counts by
// completion against the visible cards and Mina's call by her given estimate against the price; the
// estimate spots carry no preview rule and are ungraded in preview.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (stack) => ({ hero: { name: "You", stack }, opponent: { name: "Ace Andy", stack, botId: null } });
const guided = { hero: ["Js", "Ts"], board: ["9c", "8d", "2h", "Ac"], street: "turn", potBefore: 120, bet: 40, call: 40 };
const practice = { hero: ["6s", "5s"], board: ["7d", "8c", "Kh"], street: "flop" };
const fresh = { hero: ["Jh", "Th"], board: ["Kh", "6s", "2h", "4d"], street: "turn" };
const band = (percent) => ({ id: `about-${percent}`, label: `About ${percent}%` });

const definition = {
  id: "rule-2-4-workspace-v1", version: 2, flow: "film-first",
  conceptId: "t1-outs-rule-24",
  sourceLessonId: "lesson-rule-2-4-001", videoLessonId: "lesson-rule-2-4-001",
  coach: "mina", access: "free", template: "core-math",
  title: "Estimate equity fast.", kicker: "Table-speed math.",
  trail: ["Learn", "The math behind the move", "Rule of 2 and 4"],
  course: { chapter: "The math behind the move" },
  meta: { minutes: 5 },
  assumptions: "Heads-up. For this exercise, every card that completes your draw is a clean out and ties are ignored. The rule of 2 and 4 is a quick estimate, not exact equity read from the cards: multiply your outs by 4 when you will see two more cards, and by 2 when you will see one. On Mina’s hand the chance is her stated estimate, given, and only the direct price of the call counts, with no chips won on the river. The opponent’s cards stay hidden.",
  media: "media/rule-2-4-workspace-v1.v2.json",
  feedback: { found: "You estimated it.", missed: "Let’s work it out together.", open: "Here’s the estimate." },
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Estimate equity fast.", em: "Count, then multiply.",
      lead: "You do not need perfect math at the table. Watch Mina turn a count of outs into a quick chance, then estimate three hands at the table.",
      cta: "Watch with Mina" },
    { kind: "film", label: "Film", upNext: "Play Mina’s hand",
      // The film's own beats, with the opening as "Intro". `outs` (15.25) is not a chapter: it is
      // .06 s after `draw` and would draw a sliver.
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Read the board" }, { beat: "draw", label: "Count the outs" }, { beat: "rule", label: "Outs × 2" }, { beat: "estimate", label: "The estimate" }, { beat: "price", label: "The price" }],
      pause: { at: 15, spot: { kind: "count", range: [0, 47], unit: "outs",
        prompt: "Before Mina says it: how many clean outs does jack-ten have?" } } },
    { kind: "decision", label: "Mina’s hand", spotId: "rule2-guided-estimate", hand: "rule2-guided", role: "guided",
      coachLine: "Mina’s hand. You make the estimate.", next: "Now decide the call" },
    { kind: "decision", label: "Mina’s hand", spotId: "rule2-guided-call", hand: "rule2-guided", role: "guided",
      coachLine: "You have the estimate. Now the price.", next: "Try a practice hand",
      feedback: { found: "You found the price.", missed: "Let’s look at the price.", open: "Here’s the thinking." } },
    { kind: "decision", label: "Practice", spotId: "rule2-practice-count", hand: "rule2-practice", role: "practice",
      coachLine: "A new draw, one street earlier. Count it first.", next: "Now estimate the chance",
      feedback: { found: "You counted it.", missed: "Let’s count it together.", open: "Here’s the count." } },
    { kind: "decision", label: "Practice", spotId: "rule2-practice-estimate", hand: "rule2-practice", role: "practice",
      coachLine: "You have the count. Now the rule.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "rule2-fresh-count", hand: "rule2-fresh", role: "fresh",
      coachLine: "Your count, your estimate.", next: "Now estimate the chance",
      feedback: { found: "You counted it.", missed: "Let’s count it together.", open: "Here’s the count." } },
    { kind: "decision", label: "Fresh hand", spotId: "rule2-fresh-estimate", hand: "rule2-fresh", role: "fresh",
      coachLine: "Your count, your estimate.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "A chance you can estimate.",
      lead: "Count the outs, then multiply: by 4 with two cards to come, by 2 with one. Compare that quick chance with the price of the call.",
      recapLabels: ["Mina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "rule2-guided-estimate": {
      decision: "estimate", bands: [band(8), band(16), band(32)], ...guided,
      title: "Roughly how often does Mina’s draw get there?",
      prompt: "Mina counted 8 clean outs: any queen or any seven. Ace Andy bets 40 into 120 on the turn, and one card is still to come. Use the rule to turn the count into a quick chance.",
      hint: "Look at the street first. With one card to come, multiply your outs by two; with two cards to come, multiply by four.",
      explanation: "This is the turn, so one card is to come and the multiplier is two. 8 × 2 is about 16%. The exact share is a little higher, but the rule is built for table speed, not precision.",
      focus: ["Js", "Ts", "9c", "8d"], hear: 3,
    },
    "rule2-guided-call": {
      decision: "action", choices: ["fold", "call"], previewRule: "price-vs-equity", ...guided,
      given: { equity: 16, outs: 8, source: "Mina’s estimate" },
      title: "Is the call worth it?",
      prompt: "Mina’s estimate is roughly 16% with one card to come. Ace Andy bets 40 into 120. Calling 40 makes a final pot of 200. Call or fold?",
      hint: "Divide your call by the final pot to get the price. Then compare that price with Mina’s estimate.",
      explanation: "Calling 40 makes a 200-chip pot, a 20% price. Mina’s roughly 16% is below 20%, so under this lesson’s assumptions the call loses chips over time and folding is right. The draw is real; the direct price is simply more than it is worth.",
      note: "The river is not dealt in this lesson. The decision is made before the card comes.",
      ledger: "price", hear: 6,
    },
    "rule2-practice-count": {
      decision: "count", range: [0, 47], step: 1, unit: "outs", submitLabel: "Count them",
      previewRule: "outs-by-completion", target: "straight", ...practice,
      title: "How many outs do you have?",
      prompt: "Ace Andy checks to you on the flop with 60 in the pot. You hold six-five of spades and the board shows a seven and an eight. Count the unseen cards that complete your straight.",
      hint: "Name the ranks that would complete your draw, then count the unseen cards of each rank. Nothing else counts.",
      explanation: "Five, six, seven and eight are four in a row, open at both ends. Any four or any nine completes the straight. There are four of each and none are visible, so you have eight outs. With only two spades showing, a spade is not a flush on the next card.",
      focus: ["6s", "5s", "7d", "8c"],
    },
    "rule2-practice-estimate": {
      decision: "estimate", bands: [band(8), band(16), band(32)], ...practice,
      title: "Roughly how often does the draw get there by the river?",
      prompt: "Take the count you just made. This is the flop, so two cards are still to come. Suppose you see both the turn and the river. Use the rule to turn your outs into a quick chance.",
      hint: "Count the cards still to come before you multiply: two cards means times four, one card means times two.",
      explanation: "Two cards are to come, so the multiplier is four. Eight outs times four is about 32%. That assumes you see both cards. If you would only see the turn, it is times two.",
      focus: ["6s", "5s", "7d", "8c"], hear: 2,
    },
    "rule2-fresh-count": {
      decision: "count", range: [0, 47], step: 1, unit: "outs", submitLabel: "Count them",
      previewRule: "outs-by-completion", target: "flush", ...fresh,
      title: "How many outs do you have?",
      prompt: "Ace Andy checks to you on the turn with 100 in the pot. You hold jack-ten of hearts. Count the unseen cards that complete your hand.",
      hint: "Name every rank that would finish a straight for you. Then count the hearts you can see before you count a flush.",
      explanation: "Two hearts on the board and two in your hand make four of the thirteen, so nine hearts are unseen and each one completes a flush. No single card finishes a straight: jack, ten and king still need two more cards. You have nine outs.",
      focus: ["Jh", "Th", "Kh", "2h"],
    },
    "rule2-fresh-estimate": {
      decision: "estimate", bands: [band(9), band(18), band(36)], ...fresh,
      title: "Roughly how often does the draw get there?",
      prompt: "Take the count you just made. This is the turn, so one card is still to come. Use the rule to turn your outs into a quick chance.",
      hint: "Count the cards still to come before you multiply.",
      explanation: "One card is to come, so the multiplier is two. Nine outs times two is about 18%. Times four would say 36%, the common slip: that multiplier needs two cards to come.",
    },
  },
  hands: {
    // The film ends after Ace Andy's 40 (script step 0), so the web hand starts there (startAt 1).
    "rule2-guided": {
      id: "rule2-guided", layout: "heads-up", seats: seats(1200), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "turn", board: guided.board, pot: 120, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: ["9c", "8d", "2h"] },
        { do: "street", cards: ["Ac"] },
        { do: "highlight", cards: ["Js", "Ts", "9c", "8d"] },
      ],
      script: [
        { do: "act", seat: "opponent", action: "bet", amount: 40 },
        { do: "decide", spotId: "rule2-guided-estimate" },
        { do: "decide", spotId: "rule2-guided-call", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "rule2-guided-call" },
      ],
      startAt: 1,
    },
    "rule2-practice": {
      id: "rule2-practice", layout: "heads-up", seats: seats(1200), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "flop", board: practice.board, pot: 60, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "rule2-practice-count" },
        { do: "decide", spotId: "rule2-practice-estimate", when: "answered" },
      ],
    },
    "rule2-fresh": {
      id: "rule2-fresh", layout: "heads-up", seats: seats(1200), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "turn", board: fresh.board, pot: 100, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "check" },
        { do: "decide", spotId: "rule2-fresh-count" },
        { do: "decide", spotId: "rule2-fresh-estimate", when: "answered" },
      ],
    },
  },
};

export default definition;
