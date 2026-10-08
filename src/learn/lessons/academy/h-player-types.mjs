// h-player-types, Player Types (Reading People), academy v2 definition.
// Film: src-academy-h-player-types-v2 (91 s). canon.yourTurn is null, so the film plays to its stop
// and then asks its own opening question: "Fold, fold, raise. Who's who?" (the film's reveal: the nit).
// Plan: people.md (h-player-types). Two habits per 100 hands, played / raised, an illustration:
// station 45 / 6, nit 12 / 10, TAG 22 / 18, LAG 34 / 27, trapper 20 / 12, drawer 38 / 10,
// shark 25 / 20, balanced baseline 24 / 19. A sample is not a type: a true 22% player over 100
// hands shows 13.7%–30.3% (two standard errors); over 1,000 the error is 1.3 points.
// Every answer is a read of actions and a judgment of the evidence, never a result.
//   Your turn   fold, fold, raise -> the nit
//   Guided      45 played, 6 raised per 100 -> the calling station
//   Practice    34 played, 27 raised per 100 -> the LAG (not the TAG's 22 / 18)
//   Fresh       9 of 20 hands played (45%) -> not yet: 20 hands is a hint, not a read (changed:
//               the sample, not the numbers, decides; ±2 standard errors span about 23% to 67%)
// Keys: answerKeys/h-player-types.mjs. Every number: test/academyLessonsB.test.mjs.
import { definitionBase, welcome, filmStage, whyStage, decision, huHand, bands, takeaway } from "./kit.mjs";

const feedback = { found: "You read what he does.", missed: "Look at the two habits again.", open: "Here’s the read." };
const typeBands = (...ids) => bands(...ids.map((id) => [id, { station: "Calling station", nit: "Nit", lag: "LAG", tag: "TAG" }[id]]));

const turnSpot = {
  decision: "estimate", line: ["fold", "fold", "raise"],
  bands: typeBands("station", "nit", "lag"),
  dockPrompt: "Which player made this line?",
  title: "Your turn: who made this line?",
  prompt: "Three hands from one player: fold, fold, raise. Which of the cast made that line: the calling station, the nit or the LAG?",
  hint: "Two habits: how often he plays a hand, and how often he raises the ones he plays.",
  explanation: "The nit. He plays few hands, 12 in 100 in the film’s illustration, and raises most of them, 10. Fold, fold, raise is his shape.",
};

const preflop = (hero) => ({ street: "preflop", hero, board: [] });
const guided = preflop(["Kd", "9c"]);
const practice = preflop(["Qs", "Jd"]);
const fresh = preflop(["Th", "8h"]);

const definition = {
  ...definitionBase({
    node: "h-player-types", conceptId: "t5-player-typing", coach: "sera", title: "Read what he does.", kicker: "Over enough hands to trust it.",
    track: "people", chapter: "Reading People", minutes: 4, feedback,
    assumptions: "Each player is described by two habits per 100 hands: how many he plays and how many he raises. The numbers are the film’s illustration, not real players; real players vary. A type is a read of actions over a sample of hands, never of faces or hidden cards. Each hand at the table stops before the flop.",
  }),
  stages: [
    welcome("Read what he does.", "Over enough hands to trust it.",
      "Online you can’t see his face. Watch Sera type players by two habits, then read three players at the table.", "Sera"),
    filmStage({ film: "h-player-types", at: null, spotId: "pt-turn", spot: turnSpot, upNext: "Read Sera’s first player" }),
    whyStage("pt-why", "Why is fold, fold, raise the nit?", [
      { id: "habits", text: "He plays few hands and raises most of the ones he plays.", fix: "Right. Two habits, played and raised, give him away." },
      { id: "face", text: "You could tell from how calm he looked before he raised.", fix: "Online there is no face to read. What he plays and raises is what you can see." },
      { id: "three", text: "Three hands are enough to name his type for good.", fix: "Three hands are a hint. A read needs enough hands: even 100 leaves a band about 17 points wide." },
    ]),
    decision("pt-guided", "pt-guided", "guided", "Sera’s player", "Sera’s first player. Read his numbers.", "Try a practice hand", { feedback }),
    decision("pt-practice", "pt-practice", "practice", "Practice", "Another player. Two habits.", "Try a fresh hand", { feedback }),
    decision("pt-fresh", "pt-fresh", "fresh", "Fresh hand", "A new player. How much do you know?", "See your recap", { feedback }),
    takeaway({
      heading: "Lines, not faces.",
      rule: "Type players by what they do, over enough hands to trust it.",
      lead: "How often he plays and how often he raises tell you most. 100 hands is a hint; 1,000 is a read.",
      labels: ["Sera’s player", "Practice", "Fresh hand"],
    }),
  ],
  spots: {
    "pt-guided": {
      decision: "estimate", ...guided, played: 45, raised: 6, hands: 100,
      bands: typeBands("station", "nit", "lag"),
      dockPrompt: "Which type is he?",
      title: "45 played, 6 raised. Which type?",
      prompt: "Over 100 hands he played 45 and raised 6 (an illustration). Which type is he?",
      hint: "Many hands played, few raised. Which player calls and calls?",
      explanation: "The calling station: he plays almost half his hands and raises very few of them. Against the baseline’s 24 played and 19 raised, he calls far too often.",
    },
    "pt-practice": {
      decision: "estimate", ...practice, played: 34, raised: 27, hands: 100,
      bands: typeBands("tag", "lag", "station"),
      dockPrompt: "Which type is he?",
      title: "34 played, 27 raised. Which type?",
      prompt: "Over 100 hands he played 34 and raised 27 (an illustration). Which type is he?",
      hint: "Compare with the baseline’s 24 played and 19 raised. Is he tighter or looser? Passive or aggressive?",
      explanation: "The LAG, loose and aggressive: he plays more hands than the baseline and raises most of them. The TAG plays fewer, about 22, and raises 18.",
    },
    "pt-fresh": {
      decision: "estimate", ...fresh, played: 9, hands: 20,
      bands: bands(["station", "A calling station"], ["not-yet", "Not yet: too few hands"]),
      dockPrompt: "Can you name his type?",
      title: "9 of 20 hands. Can you name him?",
      prompt: "A new player. You have seen 20 hands, and he played 9 of them: 45%, the calling station’s number. Can you call him a calling station yet?",
      hint: "How wide is the band around a share seen over only 20 hands?",
      explanation: "Not yet. Over 20 hands, two standard errors around 45% run from about 23% to 67%, wide enough to hold the baseline’s 24%. Keep logging his hands before you lean on the read.",
    },
  },
  hands: {
    "pt-guided": huHand("pt-guided", { ...guided, pot: 0, blinds: [5, 10], name: "Rae", decisions: ["pt-guided"] }),
    "pt-practice": huHand("pt-practice", { ...practice, pot: 0, blinds: [5, 10], name: "Ned", decisions: ["pt-practice"] }),
    "pt-fresh": huHand("pt-fresh", { ...fresh, pot: 0, blinds: [5, 10], name: "Ivy", decisions: ["pt-fresh"] }),
  },
};

export default definition;
