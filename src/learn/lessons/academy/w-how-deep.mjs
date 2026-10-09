// Welcome 4, How Deep the Game Goes (w-how-deep, film w-how-deep, rendered as w-deep), v2 lesson,
// content version 2. The film has no yourTurn anchor; it asks and answers its opening count (1,326
// two-card starts, folding into 169 kinds), so the lesson skips the end ask. The guided question
// counts the starts inside one kind: a pair of aces, 4 × 3 ÷ 2 = 6. Practice counts a kind of two
// ranks: ace-king, 4 × 4 = 16 (4 suited, 12 offsuit). The fresh hand is the plan's Transfer (which
// track answers a question), changed to a question the film does not show: how big a bet should be.
// The rule card is the film's own RuleCard (its canonical `rule` anchor points at the up-next card,
// an anchor-pass gap). Keys: answerKeys/w-how-deep.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const table = (id) => huHand(id, { hero: ["Kh", "Qh"], pot: 0, blinds: [5, 10] });
const SPOT = { street: "preflop", hero: ["Kh", "Qh"] };

// The film's own question (it asks and answers it on screen), kept as it plays.
const turnSpot = {
  scene: "deck",
  decision: "estimate", ...SPOT,
  bands: bands(["169", "169"], ["1326", "1,326"], ["2652", "2,652"]), dockPrompt: "Two-card starts from 52 cards",
  title: "How many ways can a hand start?",
  prompt: "A 52-card deck. How many different two-card starting hands can you be dealt?",
  hint: "Pick the first card 52 ways and the second 51 ways, then remember that K♥ Q♥ and Q♥ K♥ are the same hand.",
  explanation: "52 × 51 ÷ 2 is 1,326 different two-card starts. 2,652 counts every pair twice, once in each order, and 169 is the number of kinds they fold into.",
};

const spots = {
  "wd-guided": {
    scene: "deck",
    decision: "estimate", ...SPOT,
    bands: bands(["4", "4"], ["6", "6"], ["12", "12"]), dockPrompt: "Ways to hold two aces",
    title: "One kind, many starts.",
    prompt: "There are four aces in the deck. How many different ways can you be dealt a pair of aces?",
    hint: "Pick the first ace 4 ways and the second 3 ways, then remember that A♠ A♥ and A♥ A♠ are the same hand.",
    explanation: "4 × 3 ÷ 2 is 6 ways to hold two aces. 12 counts every pair twice, once in each order. Every pair works the same way: 13 pairs × 6 is 78 of the 1,326 starts.",
  },
  "wd-practice": {
    scene: "deck",
    decision: "estimate", ...SPOT,
    bands: bands(["4", "4"], ["12", "12"], ["16", "16"]), dockPrompt: "Ways to hold ace-king",
    title: "Two ranks, any suits.",
    prompt: "Now ace-king, in any suits. How many different two-card starts make ace-king?",
    hint: "Any of the 4 aces can go with any of the 4 kings.",
    explanation: "4 aces × 4 kings is 16 starts: 4 suited, like A♥ K♥, and 12 offsuit, like A♠ K♦.",
  },
  "wd-fresh": {
    scene: "question",
    decision: "estimate", ...SPOT,
    bands: bands(["math", "The Math Spine"], ["preflop", "Preflop"], ["postflop", "Postflop"]), dockPrompt: "Which track answers it?",
    title: "Find the right lesson.",
    prompt: "You have a good hand on the flop and want to bet. “How big should my bet be?” Which track answers that?",
    hint: "One track promises to help you bet with a reason and a size.",
    explanation: "Postflop: think in ranges, read the flop, and bet with a reason and a size. Its Bet Sizing lesson answers exactly this question.",
  },
};

const definition = v2Lesson({
  node: "w-how-deep", version: 2, film: "w-how-deep", coach: "knox", access: "free", track: "Welcome to Poker", minutes: 3,
  title: "Simple to learn.", kicker: "Deep to master.",
  assumptions: "Counts are exact: 1,326 = 52 × 51 ÷ 2 starts, which fold into 13 pairs, 78 suited and 78 offsuit kinds. Each pair is 6 starts (4 × 3 ÷ 2); each two different ranks are 16 (4 × 4: 4 suited, 12 offsuit). The table here is only a frame for the questions.",
  stages: v2Stages({
    welcome: { heading: "How deep does it go?", em: "One idea at a time.", lead: "You know the rules. Watch how many ways a hand can go, then answer three quick questions.", cta: "Watch with Knox" },
    film: { upNext: "Answer Knox’s question", film: "w-how-deep", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "wd-guided", label: "Knox’s question", coachLine: "Inside one kind. Count it." },
      { id: "wd-practice", label: "Practice", coachLine: "Two ranks this time." },
      { id: "wd-fresh", label: "Fresh question", coachLine: "A question the film didn’t ask." },
    ],
    why: { prompt: "Why does poker take a lifetime to master?",
      options: options(
        ["a", "Once you know the hand rankings, the rest is simple.", "The rankings are the start. Every spot changes the right play: seat, bet, stacks and four rounds."],
        ["b", "Every spot changes the right decision: the seat, the bet and the stacks, over four betting rounds.", "Right. The same hand plays differently in every spot, so you learn one idea at a time."],
        ["c", "There are so many starting hands that you must memorise each one.", "The 1,326 fold into 169 kinds, and you learn ideas, not a list."]) },
    takeaway: { heading: "One idea at a time.",
      lead: "1,326 starts, four betting rounds and hidden cards: the same hand plays differently in every spot, so you learn the ideas, one at a time.",
      ruleCard: { lines: ["SIMPLE TO LEARN,", "DEEP TO MASTER."], sub: "One idea at a time." } },
  }),
  spots,
  hands: { "wd-guided": table("wd-guided"), "wd-practice": table("wd-practice"), "wd-fresh": table("wd-fresh") },
});

export default definition;
