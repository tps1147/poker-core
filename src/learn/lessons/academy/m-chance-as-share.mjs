// Math 1, Chance as a Share (m-chance-as-share), v2 lesson. Mina's film pauses at its yourTurn
// anchor (61.51 s, "Your turn. How often is it an ace?") for the "Your turn" spot; the guided hand
// plays that same spot (4 of 52, 1 in 13, about 7.7%). Practice and fresh are the plan's Checks:
// a red card (50%), then a jack, queen or king (12 of 52, about 23.1%), a changed count.
// Keys: answerKeys/m-chance-as-share.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const ACE = bands(["4", "About 4%"], ["7.7", "About 7.7%: 1 in 13"], ["25", "About 25%: 1 in 4"]);
const SPOT = { street: "preflop", hero: ["9s", "6d"] };
const table = (id) => huHand(id, { hero: SPOT.hero, pot: 0, blinds: [5, 10] });

const spots = {
  "cs-guided": {
    decision: "estimate", ...SPOT, bands: ACE, dockPrompt: "How often is it an ace?",
    title: "Your turn: an ace?",
    prompt: "One card, face down, from a full shuffled 52-card deck. How often is it an ace?",
    hint: "Count the cards you want, then divide by all the cards there are.",
    explanation: "Four aces out of 52 cards: 4 ÷ 52 is 1 in 13, about 7.7%. In 100 draws, shuffling back each time, expect about 8 aces.",
  },
  "cs-practice": {
    decision: "estimate", ...SPOT, bands: bands(["25", "25%"], ["50", "50%"], ["75", "75%"]), dockPrompt: "How often is it red?",
    title: "A red card.",
    prompt: "One card from a full shuffled deck. How often is it red, a heart or a diamond?",
    hint: "Two of the four suits are red, 13 cards each.",
    explanation: "26 of the 52 cards are red: 26 ÷ 52 is one half, 50%. Half the time, over many draws.",
  },
  "cs-fresh": {
    decision: "estimate", ...SPOT, bands: bands(["8", "About 8%"], ["23", "About 23%"], ["25", "About 25%"]), dockPrompt: "How often is it a jack, queen or king?",
    title: "A picture card.",
    prompt: "One card from a full shuffled deck. How often is it a jack, a queen or a king?",
    hint: "Three ranks, four cards each. Then divide by 52.",
    explanation: "12 of the 52 cards are jacks, queens or kings: 12 ÷ 52 is 3 in 13, about 23.1%. A little under one time in four.",
  },
};

const definition = v2Lesson({
  node: "m-chance-as-share", film: "m-chance-as-share", coach: "knox", access: "free", track: "The Math Spine", minutes: 3,
  title: "A chance is a share.", kicker: "Repeat it, and the share shows up.",
  assumptions: "One card from a full, shuffled 52-card deck, with nothing else known; the cards in front of you play no part. A chance is the outcomes you want out of all of them, and it shows over many repeats, never in one draw.",
  feedback: { found: "You found the share.", missed: "Let’s count it together.", open: "Here’s the thinking." },
  stages: v2Stages({
    welcome: { heading: "How often is it a heart?", em: "Rarely, one in four, or half?", lead: "Watch Knox turn a deck into chances, then find three shares yourself.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s spot", film: "m-chance-as-share", at: 61.51, spot: spots["cs-guided"] },
    hands: [
      { id: "cs-guided", label: "Knox’s spot", coachLine: "The film’s ace. Your answer." },
      { id: "cs-practice", label: "Practice", coachLine: "A red card this time." },
      { id: "cs-fresh", label: "Fresh spot", coachLine: "Three ranks at once." },
    ],
    why: { prompt: "Why is it about 7.7%?",
      options: options(
        ["a", "One in four, because there are four aces.", "Four aces out of 52 cards, not out of four: 1 in 13."],
        ["b", "Four aces out of all 52 cards: the outcomes you want, out of all of them.", "Right. 4 ÷ 52: the outcomes you want, out of all of them."],
        ["c", "7.7% is so small that it won’t happen.", "7.7% happens about 8 times in 100 draws. Small isn’t never."]) },
    takeaway: { heading: "A chance is a share.",
      lead: "Chance = the outcomes you want ÷ all outcomes. Repeat it, and that share is what you get.",
      ruleCard: { lines: ["A chance is a share.", "The outcomes you want, out of all of them.", "Repeat it... and that share is what you get."], sub: null } },
  }),
  spots,
  hands: { "cs-guided": table("cs-guided"), "cs-practice": table("cs-practice"), "cs-fresh": table("cs-fresh") },
});

export default definition;
