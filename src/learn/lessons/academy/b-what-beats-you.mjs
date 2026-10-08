// Board 3, What Beats You (b-what-beats-you), v2 lesson. The film has no yourTurn anchor; the guided
// hand is its hook: A♥ Q♦ on A♦ J♠ 8♠ 4♣, how many hands beat you (63: sets, two pair, ace-king)?
// Practice is the plan's Transfer river, the 5♠, and the two new families it lets in; the fresh hand
// changes the spot to an overpair, J♥ J♣ on T♦ 7♠ 4♥ 2♣, tapping the hand that beats it.
// Keys: answerKeys/b-what-beats-you.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const guided = { street: "turn", hero: ["Ah", "Qd"], board: ["Ad", "Js", "8s", "4c"] };
const practice = { street: "river", hero: ["Ah", "Qd"], board: ["Ad", "Js", "8s", "4c", "5s"] };
const fresh = { street: "turn", hero: ["Jh", "Jc"], board: ["Td", "7s", "4h", "2c"] };

const spots = {
  "wb-guided": {
    decision: "estimate", ...guided,
    bands: bands(["0", "None"], ["10", "About 10"], ["60", "About 60"], ["300", "About 300"]), dockPrompt: "Hands that beat you right now",
    title: "How many hands beat you?",
    prompt: "You hold A♥ Q♦ on A♦ J♠ 8♠ 4♣: top pair, good kicker. Of every two-card hand he could hold, how many beat you right now?",
    hint: "Count one family at a time: sets, then two pair, then the same pair with a better kicker.",
    explanation: "Sets of aces, jacks, eights or fours are 10 hands; two pair from any two board cards is 45; ace-king, the same pair with a better kicker, is 8 more. 63 hands beat you, about 60.",
  },
  "wb-practice": {
    decision: "estimate", ...practice,
    bands: bands(["fs", "Flushes and straights"], ["fh", "Full houses"], ["none", "Nothing new"]), dockPrompt: "New families on the river",
    title: "The river changes the list.",
    prompt: "The river is the 5♠: A♦ J♠ 8♠ 4♣ 5♠. Which new families of hands beat your A♥ Q♦ now?",
    hint: "Count the spades on the board. Then look for five in a row with the four and the five.",
    explanation: "Three spades let any two spades make a flush, and 7-6 or 3-2 now make a straight. The board is not paired, so no full house is possible.",
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
  node: "b-what-beats-you", film: "b-what-beats-you", coach: "knox", access: "free", track: "Reading the Board", minutes: 4,
  title: "Name what beats you.", kicker: "Before another chip.",
  assumptions: "Counts are exact: every two-card hand from the unseen cards, each counted once, as many-hands honest totals. They say how many hands beat you, never whether this opponent holds one.",
  stages: v2Stages({
    welcome: { heading: "How many hands beat you?", em: "None? Ten? Sixty?", lead: "Watch Knox count the families that beat top pair, then name them at the table.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s hand", film: "b-what-beats-you", at: null, spot: spots["wb-guided"] },
    hands: [
      { id: "wb-guided", label: "Knox’s hand", coachLine: "The film’s top pair. Count it." },
      { id: "wb-practice", label: "Practice", coachLine: "One more card, new families." },
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
    "wb-guided": huHand("wb-guided", { hero: guided.hero, board: guided.board, pot: 120, acts: [{ seat: "opponent", action: "check" }] }),
    "wb-practice": huHand("wb-practice", { hero: practice.hero, board: practice.board, pot: 120, acts: [{ seat: "opponent", action: "check" }] }),
    "wb-fresh": huHand("wb-fresh", { hero: fresh.hero, board: fresh.board, pot: 100, acts: [{ seat: "opponent", action: "check" }] }),
  },
});

export default definition;
