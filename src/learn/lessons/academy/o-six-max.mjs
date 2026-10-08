// o-six-max, Six-Handed Tables (Other Tables), academy v2 definition.
// Film: src-academy-o-six-max-v2 (63 s). canon.yourTurn = "yourTurn" at 48.69 s: "Your turn.
// Six-handed, from the cutoff... three players behind. Fewer hands to get through, so you open more."
// Numbers: LATER-SCOPE-NUMBERS-2026-10-07.md. Players left to act behind the first seat: 8 at a full
// table of 9, 5 six-handed: the same job as the fourth seat at a full table. A premium hand (jacks or
// better, or ace-king) is 40 of 1,326 combos, 3.0%.
//   Your turn   six-handed cutoff -> 3 players behind
//   Guided      six-handed, first to act (under the gun) -> 5 behind
//   Practice    which full-table seat has the same 5 behind -> the fourth seat
//   Fresh       six-handed, the hijack (middle position) after one fold -> 4 behind (changed seat)
// Keys: answerKeys/o-six-max.mjs. Every count: test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, ringHand, bands, takeaway } from "./kit.mjs";

const feedback = { found: "You counted who’s behind.", missed: "Count the players still to act.", open: "Here’s the count." };
const behind = (...n) => bands(...n.map((x) => [`behind-${x}`, `${x} players`]));

const turnSpot = {
  decision: "estimate", position: "CO", seats: 6,
  bands: behind(2, 3, 5),
  dockPrompt: "Players still to act behind you",
  title: "Your turn: the cutoff, six-handed.",
  prompt: "Six-handed, it folds to you in the cutoff. How many players are still to act behind you?",
  hint: "Follow the action clockwise from your seat to the big blind.",
  explanation: "3: the button, the small blind and the big blind. Fewer hands to get through, so you open more.",
};

const definition = {
  ...definitionBase({
    node: "o-six-max", coach: "reina", title: "Count who’s behind you.", kicker: "Fewer seats, wider opens.",
    track: "formats", chapter: "Other Tables", minutes: 4, feedback,
    assumptions: "Blinds of 5 and 10, no antes. A full table seats 9 players, a six-handed table 6. Opening is about the players still to act behind you: each of them could hold a better hand. Each hand stops before you open.",
  }),
  stages: [
    welcome("Count who’s behind you.", "Fewer seats, wider opens.",
      "Should you open the same hands first to act at a full table and at six-handed? Watch Reina count the danger, then count three seats.", "Reina"),
    filmStage({ film: "o-six-max", at: 48.69, spotId: "sm-turn", spot: turnSpot, upNext: "Count Reina’s first seat" }),
    whyStage("sm-why", "Why open more from the cutoff?", [
      { id: "behind", text: "Only three players can still wake up with a better hand behind you.", fix: "Right. Each player behind you is one more chance that someone holds a better hand." },
      { id: "same", text: "A hand is as strong from any seat, so open the same hands from every seat.", fix: "Not at every seat or table size. A hand only has to beat the players still to act, and fewer behind means wider opens." },
      { id: "blinds", text: "Because the blinds cost less from the cutoff.", fix: "The blinds cost the same. The reason is fewer players left to get through." },
    ]),
    decision("sm-guided", "sm-guided", "guided", "Reina’s seat", "First to act, six-handed.", "Try a practice hand", { feedback }),
    decision("sm-practice", "sm-practice", "practice", "Practice", "Match it to a full table.", "Try a fresh hand", { feedback }),
    decision("sm-fresh", "sm-fresh", "fresh", "Fresh hand", "One fold, then you.", "See your recap", { feedback }),
    takeaway({
      heading: "Fewer seats, wider opens.",
      rule: "Fewer seats means fewer players to beat. Count who's behind you, then open wider.",
      lead: "First to act at a full table has 8 behind; six-handed only 5, the same job as the fourth seat at a full table.",
      labels: ["Reina’s seat", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "sm-guided": {
      decision: "estimate", street: "preflop", board: [], hero: ["Ah", "Td"],
      bands: behind(3, 5, 8),
      dockPrompt: "Players still to act behind you",
      title: "First to act, six-handed.",
      prompt: "Six-handed, you are under the gun, first to act. How many players are still to act behind you?",
      hint: "Six seats, and you are the first. Count the rest.",
      explanation: "5. At a full table of 9 the first seat has 8 behind, so the six-handed first seat is a much easier job.",
    },
    "sm-practice": {
      decision: "estimate", street: "preflop", board: [], hero: ["Kc", "Js"],
      bands: bands(["seat-1", "The first seat (8 behind)"], ["seat-4", "The fourth seat (5 behind)"], ["seat-6", "The sixth seat (3 behind)"]),
      dockPrompt: "Which full-table seat matches?",
      title: "Which full-table seat is the same job?",
      prompt: "Six-handed, first to act, you have 5 players behind you. At a full table of 9, which seat has the same 5 behind?",
      hint: "At a full table the first seat has 8 behind, the second 7, and so on.",
      explanation: "The fourth seat: 8, 7, 6, then 5 behind. Opening first six-handed is the same job as the fourth seat at a full table, not the first.",
    },
    "sm-fresh": {
      decision: "estimate", street: "preflop", board: [], hero: ["Qd", "Tc"],
      bands: behind(3, 4, 5),
      dockPrompt: "Players still to act behind you",
      title: "One fold, then you.",
      prompt: "Six-handed, under the gun folds and it is your turn in middle position. How many players are still to act behind you?",
      hint: "Folded players are out. Count from your seat to the big blind.",
      explanation: "4: the cutoff, the button and the two blinds. One seat later, one player fewer to get through.",
    },
  },
  hands: {
    "sm-guided": ringHand("sm-guided", { position: "UTG", hero: ["Ah", "Td"], decisions: ["sm-guided"] }),
    "sm-practice": ringHand("sm-practice", { position: "UTG", hero: ["Kc", "Js"], decisions: ["sm-practice"] }),
    "sm-fresh": ringHand("sm-fresh", { position: "MP", hero: ["Qd", "Tc"], folds: ["UTG"], decisions: ["sm-fresh"] }),
  },
};

export default definition;
