// Board 3, What Beats You (b-what-beats-you), v2 lesson, content version 2. The film has no yourTurn
// anchor: it asks its hook (A♥ Q♦ on A♦ J♠ 8♠ 4♣: how many hands beat you? 63) and answers it, then
// shows the river 5♠ letting in flushes and straights, so the lesson skips the end ask (endAsk
// "skip"). `turnSpot` keeps that question.
// v2 (2026-10-09, no repeated question): guided counts against two pair, Q♠ 8♠ on Q♥ 8♣ 3♦: only
// the 5 sets beat it; practice is a new turn, A♠ T♦ on T♠ 6♠ 2♦ then the J♠, whose one new family
// is flushes (the film's 5♠ river is gone); the fresh hand changes the spot to an overpair, J♥ J♣ on
// T♦ 7♠ 4♥ 2♣, tapping the hand that beats it.
// Keys: answerKeys/b-what-beats-you.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const filmHand = { street: "turn", hero: ["Ah", "Qd"], board: ["Ad", "Js", "8s", "4c"] };
const guided = { street: "flop", hero: ["Qs", "8s"], board: ["Qh", "8c", "3d"] };
const practice = { street: "turn", hero: ["As", "Td"], board: ["Ts", "6s", "2d", "Js"] };
const fresh = { street: "turn", hero: ["Jh", "Jc"], board: ["Td", "7s", "4h", "2c"] };

// The film's own question (its hook, asked and answered in the film).
const turnSpot = {
  decision: "estimate", ...filmHand,
  bands: bands(["0", "None"], ["10", "About 10"], ["60", "About 60"], ["300", "About 300"]), dockPrompt: "Hands that beat you right now",
  title: "How many hands beat you?",
  prompt: "You hold A♥ Q♦ on A♦ J♠ 8♠ 4♣: top pair, good kicker. Of every two-card hand he could hold, how many beat you right now?",
  hint: "Count one family at a time: sets, then two pair, then the same pair with a better kicker.",
  explanation: "Sets of aces, jacks, eights or fours are 10 hands; two pair from any two board cards is 45; ace-king, the same pair with a better kicker, is 8 more. 63 hands beat you, about 60.",
};

const spots = {
  "wb-guided": {
    decision: "estimate", ...guided,
    bands: bands(["0", "None"], ["5", "About 5"], ["35", "About 35"], ["300", "About 300"]), dockPrompt: "Hands that beat you right now",
    title: "Two pair. What beats it?",
    prompt: "You flopped two pair: Q♠ 8♠ on Q♥ 8♣ 3♦. Count the families. How many two-card hands beat you right now?",
    hint: "No straight or flush is possible. Which family is left above two pair, and how many of each set remain?",
    explanation: "Only sets beat you. Q-Q and 8-8 are 1 hand each, since you and the board hold two of each; 3-3 is 3 hands. That is 5. The other queen-eights tie, and every other two pair is lower.",
  },
  "wb-practice": {
    decision: "estimate", ...practice,
    bands: bands(["fl", "Flushes"], ["st", "Straights"], ["fh", "Full houses"], ["none", "Nothing new"]), dockPrompt: "The new family on the turn",
    title: "The turn changes the list.",
    prompt: "You hold A♠ T♦: top pair on T♠ 6♠ 2♦. The turn is the J♠. Which new family of hands beats you now?",
    hint: "Count the spades on the board now. Then look for three board cards close enough for a straight.",
    explanation: "Flushes. The J♠ is the third spade, so any two spades make a flush. J, T, 6 and 2 are too spread out for a straight, and an unpaired board lets in no full house.",
  },
  "wb-fresh": {
    decision: "estimate", ...fresh,
    bands: bands(["ak", "A-K"], ["qq", "Q-Q"], ["jt", "J-T"]), dockPrompt: "Which of these beats you?",
    title: "An overpair this time.",
    prompt: "You hold J♥ J♣ on T♦ 7♠ 4♥ 2♣. Which of these hands beats you?",
    hint: "Name your hand first: a pair of jacks, above every board card. What beats one pair?",
    explanation: "Queens are a higher pair, so Q-Q beats your jacks. A-K is only ace high and J-T a pair of tens: both lose. Sets and two pair beat you too.",
  },
};

const definition = v2Lesson({
  node: "b-what-beats-you", version: 2, film: "b-what-beats-you", coach: "knox", access: "free", track: "Reading the Board", minutes: 4,
  title: "Name what beats you.", kicker: "Before another chip.",
  assumptions: "Counts are exact: every two-card hand from the unseen cards, each counted once, as many-hands honest totals. They say how many hands beat you, never whether this opponent holds one.",
  stages: v2Stages({
    welcome: { heading: "How many hands beat you?", em: "None? Ten? Sixty?", lead: "Watch Knox count the families that beat top pair, then count them on three new hands.", cta: "Watch with Knox" },
    film: { upNext: "Count a new hand", film: "b-what-beats-you", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "wb-guided", label: "Guided hand", coachLine: "Two pair. Count what beats it." },
      { id: "wb-practice", label: "Practice", coachLine: "One more card, a new family." },
      { id: "wb-fresh", label: "Fresh hand", coachLine: "An overpair. What beats it?" },
    ],
    why: { prompt: "Why do so many hands beat top pair here?",
      options: options(
        ["a", "If you can’t see a better hand, there isn’t one.", "You never see his cards. Count the families: 63 hands beat you here."],
        ["b", "Sets, two pair and ace-king all beat you: 63 hands in three families.", "Right. Sets 10, two pair 45 and ace-king 8: 63 hands."],
        ["c", "Only sets beat you, since you hold top pair.", "Two pair (45 hands) and ace-king (8) beat you too, not only the 10 sets."]) },
    takeaway: { heading: "Count the families.",
      lead: "Before you put in another chip, name what beats you. Count the families, not the faces.",
      ruleCard: { lines: ["BEFORE ANOTHER CHIP,", "NAME WHAT BEATS YOU."], sub: "Count the families, not the faces." } },
  }),
  spots,
  hands: {
    "wb-guided": huHand("wb-guided", { hero: guided.hero, board: guided.board, pot: 60, acts: [{ seat: "opponent", action: "check" }] }),
    "wb-practice": huHand("wb-practice", { hero: practice.hero, board: practice.board, pot: 140, acts: [{ seat: "opponent", action: "check" }] }),
    "wb-fresh": huHand("wb-fresh", { hero: fresh.hero, board: fresh.board, pot: 100, acts: [{ seat: "opponent", action: "check" }] }),
  },
});

export default definition;
