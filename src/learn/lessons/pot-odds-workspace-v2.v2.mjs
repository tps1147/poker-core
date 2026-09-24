// Lesson 7, Pot odds, content version 2: the film-first flow (learn-flow-2026-09-16 SPEC,
// RECIPE.md). Mina's film (the retained 0 to 20.25 s of mina-lesson-07, byte for byte the version 1
// film's interval, WAV, captions, cues and beats) is a required step with one ungraded, local guess
// at 14.417 s, a cue boundary in measured silence. Then three price decisions on the real table:
// her own turn (guided), a practice hand and a fresh hand. Every hand stops at the decision: no
// river is dealt and no opponent card ships in this lesson. Version 1 (pot-odds-workspace-v2.js)
// is unchanged for version 1 runs.
//
// Grading is the version 1 pilot's: the guided hand is the pilot's 150 + 50 + 50 = 250, a 20%
// price against a given chance above it (call); the fresh hand is the pilot's 120 + 60 + 60 = 240, a
// 25% price against a given chance below it (fold). The given chances follow the course's stated
// estimate (roughly 2% per out with one card to come, lesson 5) on the cards each hand shows, so the
// table never contradicts the number: 15 outs for Mina's hand, 12 for practice, 8 for the fresh hand.
//
// No answer keys live here: the server registry (pokerServer/src/data/lessonRuns/
// pot-odds-workspace-v2.v2.js) grades, and a signed-out preview grades by rule (the price against the
// given chance, previewRule "price-vs-equity").
// No imports: poker-core/learn ships this file to the web, the app and the server's parity test (plain Node).
const seats = (opponentStack) => ({ hero: { name: "You", stack: 1200 }, opponent: { name: "Ace Andy", stack: opponentStack, botId: null } });
const guided = { hero: ["Kh", "Qh"], board: ["Jh", "Tc", "4h", "2s"], street: "turn", potBefore: 150, bet: 50, call: 50 };
const practice = { hero: ["Jd", "Td"], board: ["8d", "7c", "2d", "As"], street: "turn", potBefore: 90, bet: 30, call: 30 };
const fresh = { hero: ["6s", "5s"], board: ["Ks", "8d", "4c", "2h"], street: "turn", potBefore: 120, bet: 60, call: 60 };
const priceFeedback = { found: "You found the price.", missed: "Let’s look at the price.", open: "Here’s the thinking." };

const definition = {
  id: "pot-odds-workspace-v2", version: 2, flow: "film-first",
  conceptId: "t1-pot-odds",
  sourceLessonId: "lesson-pot-odds-001", videoLessonId: "pilot-pot-odds",
  coach: "mina", access: "free", template: "core-math",
  title: "Find your price.", kicker: "A small idea. A better decision.",
  trail: ["Learn", "The math behind the move", "Pot odds"],
  course: { chapter: "The math behind the move" },
  meta: { minutes: 3 },
  assumptions: "Heads-up. Ace Andy is all-in on every hand, so no more betting follows the call, and there is no side pot and no rake. Ties are ignored. The chance of winning is given for the exercise: an estimate of roughly 2% per out with one card to come, counting every card that completes your draw as an out. It is never exact equity read from the cards, and the opponent’s cards stay hidden.",
  media: "media/pot-odds-workspace-v2.v2.json",
  feedback: priceFeedback,
  stages: [
    { kind: "welcome", label: "Welcome", heading: "Find your price.", em: "Then decide.",
      lead: "A draw is not a reason to call. Watch Mina build the final pot and find the price, then weigh three calls at the table.",
      cta: "Watch with Mina" },
    { kind: "film", label: "Film", upNext: "Play Mina’s hand",
      // The media rail's chapters on the film's own beats, with the opening as "Intro".
      chapters: [{ at: 0, label: "Intro" }, { beat: "table", label: "Read the board" }, { beat: "startingPot", label: "Build the pot" }, { beat: "possibleCall", label: "Add your call" }, { beat: "formula", label: "Cost over pot" }, { beat: "result", label: "Your price" }],
      // The cue boundary before "The call costs 50": "250" ends at 14.02 s and "call" starts at
      // 14.595 s (legacy-voice-audit/mina-absolute-timing.json), so the pause sits in 0.575 s of silence.
      pause: { at: 14.416666666666666, spot: { kind: "count", range: [0, 99], unit: "%",
        prompt: "Before Mina says it: your call is 50 and the final pot is 250. What price is that, in percent?" } } },
    { kind: "decision", label: "Mina’s hand", spotId: "pot2-guided", hand: "pot2-guided", role: "guided",
      coachLine: "Mina’s hand. You make the call.", next: "Try a practice hand" },
    { kind: "decision", label: "Practice", spotId: "pot2-practice", hand: "pot2-practice", role: "practice",
      coachLine: "Same idea, new numbers. Count your own call.", next: "Try a fresh hand" },
    { kind: "decision", label: "Fresh hand", spotId: "pot2-fresh", hand: "pot2-fresh", role: "fresh",
      coachLine: "Your pot, your price, your call.", next: "See your recap" },
    { kind: "takeaway", label: "Recap", heading: "A price you can explain.",
      lead: "Your call ÷ the final pot, with your own call counted in it. Call when your chance of winning is at least that price.",
      recapLabels: ["Mina’s hand", "Practice", "Fresh hand"],
      note: "Your score counts first tries on the fresh hand." },
  ],
  spots: {
    "pot2-guided": {
      decision: "action", choices: ["fold", "call"], previewRule: "price-vs-equity", ...guided,
      given: { equity: 30, outs: 15, source: "Given estimate" },
      title: "Is this a price worth taking?",
      prompt: "Ace Andy is all-in for 50 into a pot of 150. For this exercise your chance of winning is given: roughly 30% with one card to come. Call or fold?",
      hint: "Build the final pot first: 150, then Ace Andy’s 50, then your own 50. What share of that total are you paying?",
      explanation: "Calling 50 makes a final pot of 250, so the price is 50 ÷ 250 = 20%. The given roughly 30% is above 20%, so the call pays for itself over time under this lesson’s assumptions.",
      note: "The river is not dealt in this lesson. The call is judged on its price, before the card comes.",
      ledger: "price", hear: 5,
    },
    "pot2-practice": {
      decision: "action", choices: ["fold", "call"], previewRule: "price-vs-equity", ...practice,
      given: { equity: 24, outs: 12, source: "Given estimate" },
      title: "Is this call worth it?",
      prompt: "Ace Andy is all-in for 30 into a pot of 90. For this exercise your chance of winning is given: roughly 24% with one card to come. Call or fold?",
      hint: "Your 30 joins the pot too. Add all three amounts before you divide.",
      explanation: "Calling 30 makes a final pot of 150, so the price is 30 ÷ 150 = 20%. The given roughly 24% is above 20%, so calling pays for itself over time. Leave your own call out and 30 ÷ 120 looks like 25%, which makes a good call look too expensive.",
      note: "The river is not dealt in this lesson. The call is judged on its price, before the card comes.",
      ledger: "price", hear: 3,
    },
    "pot2-fresh": {
      decision: "action", choices: ["fold", "call"], previewRule: "price-vs-equity", ...fresh,
      given: { equity: 16, outs: 8, source: "Given estimate" },
      title: "New hand. Same idea.",
      prompt: "Ace Andy is all-in for 60 into a pot of 120. For this exercise your chance of winning is given: roughly 16% with one card to come. Call or fold?",
      hint: "Build the final pot with your own chips in it, then work out what share of that pot you would be paying.",
      explanation: "Calling 60 makes a final pot of 240, so the price is 60 ÷ 240 = 25%. The given roughly 16% is below 25%, so folding saves chips over time. You give up this pot, and it is still the right decision.",
      ledger: "price", hidePrice: true,
    },
  },
  hands: {
    // The film deals this turn and ends after Ace Andy's all-in 50 (script step 0), so the web hand
    // starts on the step after it (startAt 1): pot 200, 50 to call.
    "pot2-guided": {
      id: "pot2-guided", layout: "heads-up", seats: seats(50), button: "hero",
      hero: guided.hero, opponent: {},
      start: { street: "turn", board: guided.board, pot: 150, dealt: "held" },
      intro: [
        { do: "deal" },
        { do: "street", cards: ["Jh", "Tc", "4h"] },
        { do: "street", cards: ["2s"] },
      ],
      script: [
        { do: "act", seat: "opponent", action: "bet", amount: 50 },
        { do: "decide", spotId: "pot2-guided" },
        { do: "act", seat: "hero", action: "answer", spotId: "pot2-guided" },
      ],
      startAt: 1,
    },
    "pot2-practice": {
      id: "pot2-practice", layout: "heads-up", seats: seats(30), button: "hero",
      hero: practice.hero, opponent: {},
      start: { street: "turn", board: practice.board, pot: 90, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 30 },
        { do: "decide", spotId: "pot2-practice" },
        { do: "act", seat: "hero", action: "answer", spotId: "pot2-practice" },
      ],
    },
    "pot2-fresh": {
      id: "pot2-fresh", layout: "heads-up", seats: seats(60), button: "hero",
      hero: fresh.hero, opponent: {},
      start: { street: "turn", board: fresh.board, pot: 120, dealt: "deal" },
      script: [
        { do: "pause", ms: 400 },
        { do: "act", seat: "opponent", action: "bet", amount: 60 },
        { do: "decide", spotId: "pot2-fresh" },
        { do: "act", seat: "hero", action: "answer", spotId: "pot2-fresh" },
      ],
    },
  },
};

export default definition;
