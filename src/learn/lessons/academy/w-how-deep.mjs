// Welcome 4, How Deep the Game Goes (w-how-deep, film w-how-deep, rendered as w-deep), v2 lesson. The film has no yourTurn
// anchor; the guided hand asks its opening count (how many two-card starts: 1,326). Practice is the
// fold into 169 kinds; the fresh hand is the plan's Transfer (which track answers a question),
// changed to a question the film does not show: how big a bet should be. The rule card is the film's
// own RuleCard (its canonical `rule` anchor points at the up-next card, an anchor-pass gap).
// Keys: answerKeys/w-how-deep.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const table = (id) => huHand(id, { hero: ["Kh", "Qh"], pot: 0, blinds: [5, 10] });
const SPOT = { street: "preflop", hero: ["Kh", "Qh"] };

const spots = {
  "wd-guided": {
    scene: "deck",
    decision: "estimate", ...SPOT,
    bands: bands(["169", "169"], ["1326", "1,326"], ["2652", "2,652"]), dockPrompt: "Two-card starts from 52 cards",
    title: "How many ways can a hand start?",
    prompt: "A 52-card deck. How many different two-card starting hands can you be dealt?",
    hint: "Pick the first card 52 ways and the second 51 ways, then remember that K♥ Q♥ and Q♥ K♥ are the same hand.",
    explanation: "52 × 51 ÷ 2 is 1,326 different two-card starts. 2,652 counts every pair twice, once in each order, and 169 is the number of kinds they fold into.",
  },
  "wd-practice": {
    scene: "deck",
    decision: "estimate", ...SPOT,
    bands: bands(["13", "13"], ["169", "169"], ["1326", "1,326"]), dockPrompt: "Kinds of starting hand",
    title: "Many starts are the same hand.",
    prompt: "K♥ Q♥ plays just like K♠ Q♠. Fold the 1,326 starts into kinds of hand, pairs, suited and offsuit. How many kinds are there?",
    hint: "13 pairs. Then every two different ranks, once suited and once offsuit.",
    explanation: "13 pairs, 78 suited and 78 offsuit: 169 kinds of hand. 78 is the number of ways to pick two different ranks from 13.",
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
  node: "w-how-deep", film: "w-how-deep", coach: "knox", access: "free", track: "Welcome to Poker", minutes: 3,
  title: "Simple to learn.", kicker: "Deep to master.",
  assumptions: "Counts are exact: 1,326 = 52 × 51 ÷ 2 starts, which fold into 13 pairs, 78 suited and 78 offsuit kinds. The table here is only a frame for the questions.",
  stages: v2Stages({
    welcome: { heading: "How deep does it go?", em: "One idea at a time.", lead: "You know the rules. Watch how many ways a hand can go, then answer three quick questions.", cta: "Watch with Knox" },
    film: { upNext: "Answer Knox’s question", film: "w-how-deep", at: null, spot: spots["wd-guided"] },
    hands: [
      { id: "wd-guided", label: "Knox’s question", coachLine: "The film’s count. Your answer." },
      { id: "wd-practice", label: "Practice", coachLine: "Fold them into kinds." },
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
