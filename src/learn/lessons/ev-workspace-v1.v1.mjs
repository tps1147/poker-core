// Lesson 9, Expected value (Pro), content version 1: a new lesson, film-first from the start
// (learn-flow-2026-09-16 SPEC, RECIPE). Mina's film is the retained 0 to 17.875 s of mina-lesson-09
// (four sentences: a good decision can lose and still make money; expected value is the long-run
// result of repeating the same decision; a combo draw facing a fifty-chip call; the final pot is 300,
// so you need about 17%). It stops in the pause before "Your draw has more than that", which would
// claim a chance from the card faces. Audit: production/lessons/ev-workspace-v1/audit/README.md.
//
// Then three hands on the real table. Mina's own turn (guided) is her spoken price against a given
// chance. The practice and fresh hands each hold two decisions on one deal: the expected value of
// the call in chips, then the call itself. The fresh hand is a call that loses about four times in
// five and still earns chips, which is the lesson's point.
//
// Every hand's numbers rest on stated assumptions: Ace Andy is all-in, so nothing is bet after the
// call; ties and rake are ignored; the chance of winning is GIVEN for the exercise and never read
// from the cards. With those, the expected value of a call is: chance × final pot − the call.
// No street is dealt after a decision, no showdown is earned and no opponent card ships.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/ev-workspace-v1.v1.js)
// grades. A signed-out preview grades the calls by rule (price against the given chance) and leaves
// the expected-value bands ungraded (feedback.open) rather than ship a key.
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (opponentStack) => ({ hero: { name: "You", stack: 1200 }, opponent: { name: "Ace Andy", stack: opponentStack, botId: null } });
const guided = { hero: ["Qs", "Js"], board: ["Ts", "9c", "2h", "4s"], street: "turn", potBefore: 200, bet: 50, call: 50 };
const practice = { hero: ["Jd", "Tc"], board: ["9s", "8h", "2c", "Kd"], street: "turn", potBefore: 150, bet: 50, call: 50 };
const fresh = { hero: ["7c", "6c"], board: ["Kc", "Jd", "2c", "9h"], street: "turn", potBefore: 150, bet: 25, call: 25 };
const priceFeedback = { found: "You judged the call.", missed: "Let’s weigh the call.", open: "Here’s the thinking." };
const evFeedback = { found: "You found the long-run value.", missed: "Let’s average it out.", open: "Here’s the thinking." };
const EV_HINT = "Picture this exact call made many times. Take the given chance of the final pot, with your own call counted in it, then take away what the call costs.";
const CALL_HINT = "Folding earns and loses nothing from here. Compare that with what the call earns or loses on average over many repeats.";
const EV_DOCK ="On average, each time you make this call";

const definition = {
  id: "ev-workspace-v1", version: 1, flow: "film-first",
  conceptId: "t1-ev",
  sourceLessonId: "lesson-ev-001", videoLessonId: "lesson-ev-001",
  coach: "mina", access: "pro", template: "deeper-math",
  title: "Judge the decision, not the result.", kicker: "Good decisions can lose.",
  trail: ["Learn", "Deeper math", "Expected value"],
  course: { chapter: "Deeper math" },
  meta: { minutes: 4 },
  assumptions: "Heads-up. Ace Andy is all-in on every hand, so no more chips go in after the call. Ties and rake are ignored. The chance of winning is given for the exercise, an estimate and never exact equity read from the cards, and the opponent’s cards stay hidden. With those assumptions, the expected value of a call is the given chance times the final pot, minus the call.",
  media: "media/ev-workspace-v1.v1.json",
  feedback: priceFeedback,
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Judge the decision, not the result.", em: "Good decisions can lose.",
      lead: "One hand is one result. Watch Mina price a combo draw, then weigh three calls at the table by what they earn over many repeats.",
      cta: "Watch with Mina" },
    { kind: "film", label: "Film", upNext: "Play Mina’s hand",
      // The media rail's chapters on the film's own beats, with the opening as "Intro".
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "The long run" }, { beat: "startingPot", label: "Read the spot" }, { beat: "possibleCall", label: "Build the final pot" }, { beat: "result", label: "What you need" }],
      // The cue boundary before "If you call": "call" ends at 12.63 s and "if" starts at 13.00 s
      // (ev-workspace-v1/audit/absolute-timing.json), so the pause sits in 0.37 s of silence.
      pause: { at: 12.958333333333334, spot: { kind: "count", range: [0, 99], unit: "%",
        prompt: "Before Mina says it: the pot is 200 and you face a 50-chip call. What price is that, in percent?" } } },
    { kind: "decision", label: "Mina’s hand", spotId: "ev1-guided", hand: "ev1-guided", role: "guided",
      coachLine: "Mina’s hand. You judge the call.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "ev1-practice-ev", hand: "ev1-practice", role: "practice",
      coachLine: "Same idea, a different draw. Average it out first.", next: "Now decide the call", feedback: evFeedback },
    { kind: "decision", label: "Practice", spotId: "ev1-practice-call", hand: "ev1-practice", role: "practice",
      coachLine: "You have the long-run value. Now the call.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "ev1-fresh-ev", hand: "ev1-fresh", role: "fresh",
      coachLine: "Your average, your call.", next: "Now decide the call", feedback: evFeedback },
    { kind: "decision", label: "Fresh hand", spotId: "ev1-fresh-call", hand: "ev1-fresh", role: "fresh",
      coachLine: "Your average, your call.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "Decisions you can average.",
      lead: "Judge a call by what it earns over many repeats: the chance times the final pot, minus the call. A call that earns can still lose the hand in front of you.",
      recapLabels: ["Mina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "ev1-guided": {
      decision: "action", choices: ["fold", "call"], previewRule: "price-vs-equity", ...guided,
      given: { equity: 30, outs: 15, source: "Given estimate" },
      title: "Is this call a good decision?",
      prompt: "Ace Andy is all-in for 50 into a pot of 200. Mina found the price: about 17%. For this exercise your chance of winning is given: roughly 30% with one card to come. Call or fold?",
      hint: "Build the final pot first: 200, then Ace Andy’s 50, then your own 50. Compare the share of that pot you pay with the given chance.",
      explanation: "Calling 50 makes a final pot of 300, so the price is 50 ÷ 300, about 17%. The given roughly 30% is above that. Made many times, the call wins about 30% of 300, which is 90 chips back for every 50 paid: about 40 chips earned per call.",
      note: "The river is not dealt in this lesson. This call still loses about 7 times in 10, and it is a good decision.",
      ledger: "price", hear: 3,
    },
    "ev1-practice-ev": {
      decision: "estimate", ...practice,
      bands: [
        { id: "lose-50", label: "Lose about 50" },
        { id: "lose-10", label: "Lose about 10" },
        { id: "earn-40", label: "Earn about 40" },
      ],
      dockPrompt: EV_DOCK,
      given: { equity: 16, source: "Given estimate" },
      title: "What does this call earn on average?",
      prompt: "Ace Andy is all-in for 50 into a pot of 150. For this exercise your chance of winning is given: roughly 16% with one card to come. If you made this call many times, what would it earn or lose on average, per call?",
      hint: EV_HINT,
      explanation: "Calling 50 makes a final pot of 250. Roughly 16% of 250 is 40 chips back on average, and every call costs 50. 40 − 50 is about 10 chips lost per call, even though this call sometimes wins a 250-chip pot.",
      hear: 1,
    },
    "ev1-practice-call": {
      decision: "action", choices: ["fold", "call"], previewRule: "price-vs-equity", ...practice,
      given: { equity: 16, outs: 8, source: "Given estimate" },
      title: "Now, call or fold?",
      prompt: "Take the average you just found. Ace Andy is all-in for 50 into a pot of 150, and your chance is given as roughly 16%. Call or fold?",
      hint: CALL_HINT,
      explanation: "Calling 50 makes a final pot of 250, so the price is 50 ÷ 250 = 20%. The given roughly 16% is below 20%, and the call loses about 10 chips each time you make it. Folding keeps those chips. You give up this pot, and it is still the right decision.",
      note: "The river is not dealt in this lesson. The call is judged before the card comes, never by the card.",
      ledger: "price", hear: 3,
    },
    "ev1-fresh-ev": {
      decision: "estimate", ...fresh,
      bands: [
        { id: "lose-25", label: "Lose about 25" },
        { id: "earn-11", label: "Earn about 11" },
        { id: "earn-36", label: "Earn about 36" },
      ],
      dockPrompt: EV_DOCK,
      given: { equity: 18, source: "Given estimate" },
      title: "New hand. What does the call earn?",
      prompt: "Ace Andy is all-in for 25 into a pot of 150. For this exercise your chance of winning is given: roughly 18% with one card to come. On average, what does this call earn or lose each time you make it?",
      hint: EV_HINT,
      explanation: "Calling 25 makes a final pot of 200. Roughly 18% of 200 is 36 chips back on average, and every call costs 25. 36 − 25 is about 11 chips earned per call. This call loses the hand more than 4 times in 5, and it still makes money over many repeats.",
    },
    "ev1-fresh-call": {
      decision: "action", choices: ["fold", "call"], previewRule: "price-vs-equity", ...fresh,
      given: { equity: 18, outs: 9, source: "Given estimate" },
      title: "Call or fold?",
      prompt: "Your chance is given as roughly 18%, and you will lose this hand most of the time. Ace Andy is all-in for 25 into a pot of 150. Call or fold?",
      hint: CALL_HINT,
      explanation: "Calling 25 makes a final pot of 200, so the price is 25 ÷ 200, about 13%. The given roughly 18% is above that, and the call earns about 11 chips each time you make it. It loses the hand more than 4 times in 5 and is still the right decision.",
      ledger: "price", hidePrice: true,
    },
  },
  hands: {
    // The film deals Mina's turn on its `table` beat, lights the combo draw on "combo" and ends after
    // Ace Andy's all-in 50 (script step 0) on "fifty". The web hand starts on the step after it
    // (startAt 1): pot 250, 50 to call. No river, no showdown, no opponent card.
    "ev1-guided": {
      id: "ev1-guided", layout: "heads-up", seats: seats(50), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "turn", board: guided.board, pot: 200, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: ["Ts", "9c", "2h"] },
        { do: "street", cards: ["4s"] },
        { do: "highlight", cards: ["Qs", "Js", "Ts", "9c", "4s"] },
      ],
      script: [
        { do: "act", seat: "opponent", action: "bet", amount: 50 },
        { do: "decide", spotId: "ev1-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "ev1-guided" },
      ],
      startAt: 1,
    },
    "ev1-practice": {
      id: "ev1-practice", layout: "heads-up", seats: seats(50), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "turn", board: practice.board, pot: 150, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 50 },
        { do: "decide", spotId: "ev1-practice-ev" },
        { do: "decide", spotId: "ev1-practice-call", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "ev1-practice-call" },
      ],
    },
    "ev1-fresh": {
      id: "ev1-fresh", layout: "heads-up", seats: seats(25), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "turn", board: fresh.board, pot: 150, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 25 },
        { do: "decide", spotId: "ev1-fresh-ev" },
        { do: "decide", spotId: "ev1-fresh-call", when: "answered" },
        { do: "act", seat: "hero", action: "answer", spotId: "ev1-fresh-call" },
      ],
    },
  },
};

export default definition;
