// Math 7, Variance and Sample Size (m-variance), v2 lesson. Mina's film pauses at its yourTurn
// anchor (54.24 s, "So what should Blue expect after a hundred calls?") for an ungraded guess; the
// guided hand plays that same spot (+10 a call, 100 calls: +1,000). Practice is the plan's Checks
// decision (ahead after 10 calls of a −10 play: was it good?); the fresh hand changes the size and
// the count (+25 a call, 200 calls). Keys: answerKeys/m-variance.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const HUNDRED = bands(["10", "+10"], ["100", "+100"], ["1000", "+1,000"]);
const SPOT = { street: "preflop", hero: ["Ks", "Jd"] };
const table = (id) => huHand(id, { hero: SPOT.hero, pot: 0, blinds: [5, 10] });

const spots = {
  "va-guided": {
    scene: "question",
    decision: "estimate", ...SPOT, bands: HUNDRED, dockPrompt: "Expected total after 100 calls",
    title: "Your turn: a hundred calls.",
    prompt: "Blue’s call is worth +10 chips on average. Blue makes it a hundred times. What should Blue expect to be up, in total?",
    hint: "Expected total = the average per call × the number of calls.",
    explanation: "+10 a call, a hundred times, is +1,000 expected. Any real run swings around that: a typical swing is about 917 either way, so an ordinary run lands from about +83 to +1,917.",
  },
  "va-practice": {
    scene: "question",
    decision: "estimate", ...SPOT, bands: bands(["yes", "Yes: they’re ahead"], ["no", "No: it loses 10 a call on average"]), dockPrompt: "Was the play good?",
    title: "Ahead with a bad play.",
    prompt: "Coral makes a call worth −10 on average, ten times, and is ahead after those ten calls. Was the play good?",
    hint: "Ten calls is a small sample. What does the play do on average?",
    explanation: "No. The play loses 10 chips a call on average; ten calls are mostly luck. Over a thousand calls Coral is ahead only about 1% of the time.",
  },
  "va-fresh": {
    scene: "question",
    decision: "estimate", ...SPOT, bands: bands(["25", "+25"], ["200", "+200"], ["5000", "+5,000"]), dockPrompt: "Expected total after 200 calls",
    title: "New size, new count.",
    prompt: "A call is worth +25 chips on average. You make it 200 times. What should you expect to be up, in total?",
    hint: "Average per call × number of calls, as Blue did.",
    explanation: "+25 × 200 is +5,000 expected. The real total will swing around it; the more calls, the less the swing matters next to the average.",
  },
};

const definition = v2Lesson({
  node: "m-variance", film: "m-variance", coach: "knox", access: "pro", track: "The Math Spine", minutes: 3,
  title: "A few hands show luck.", kicker: "Thousands show the decision.",
  assumptions: "Each call’s average value is given. Expected totals are the average times the number of calls; the film’s probabilities are exact binomial figures, never simulated, and no result grades a decision.",
  stages: v2Stages({
    welcome: { heading: "How often are you behind?", em: "Guess first.", lead: "Watch Blue and Coral make the same calls a thousand times, then work out three totals.", cta: "Watch with Knox" },
    film: { upNext: "Play Knox’s spot", film: "m-variance", at: 54.24, spot: spots["va-guided"] },
    hands: [
      { id: "va-guided", label: "Knox’s spot", coachLine: "The film’s hundred calls." },
      { id: "va-practice", label: "Practice", coachLine: "A lucky run. Judge the play." },
      { id: "va-fresh", label: "Fresh spot", coachLine: "A new size and count." },
    ],
    why: { prompt: "Why expect +1,000, whatever the last few results were?",
      options: options(
        ["a", "A run of good results proves the call is good, so expect what you saw.", "Results swing. The expected total comes from the average, not from any run."],
        ["b", "You will be up exactly 1,000 after a hundred calls.", "That’s the average. A typical swing is about 917 either way."],
        ["c", "The call averages +10, times a hundred calls; real runs swing around that.", "Right. +10 × 100 = +1,000; real runs swing around it."]) },
    takeaway: { heading: "Thousands show the decision.",
      lead: "Ten good results don’t prove a good player. A few hands show luck; thousands show the decision.",
      ruleCard: { lines: ["So ten good results don't prove a good player.", "A few hands show luck.", "Thousands show the decision."], sub: null } },
  }),
  spots,
  hands: { "va-guided": table("va-guided"), "va-practice": table("va-practice"), "va-fresh": table("va-fresh") },
});

export default definition;
