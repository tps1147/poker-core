// Welcome 2, A Short History (w-history), v2 lesson. The film has no yourTurn anchor: it asks its
// predict question up front ("In poker, who takes your chips?") and answers it at the end, so the
// guided hand asks that same question. Practice is the plan's second comprehension check; the fresh
// hand is the plan's Transfer (who paid a tournament prize). No real person is named anywhere.
// Keys: answerKeys/w-history.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const table = (id) => huHand(id, { hero: ["As", "Kd"], pot: 0, blinds: [5, 10] });

const spots = {
  "wh-guided": {
    decision: "estimate", street: "preflop", hero: ["As", "Kd"],
    bands: bands(["house", "The house"], ["players", "The other players"]), dockPrompt: "Who takes the chips you lose?",
    title: "Who takes your chips?",
    prompt: "You lose a pot at poker. Who ends up with those chips: the house, or the other players at the table?",
    hint: "Think about where the chips in a pot go when the hand ends.",
    explanation: "In poker the chips move between the players. The house does not play against you; it only takes a small fee for running the game.",
  },
  "wh-practice": {
    decision: "estimate", street: "preflop", hero: ["As", "Kd"],
    bands: bands(["luck", "They got luckier cards"], ["better", "They decided better over many hands"], ["peek", "They could see the other players’ cards"]),
    dockPrompt: "How did the poker computers win?",
    title: "How did the machines win?",
    prompt: "In 2017 and again in 2019, computer programs beat top pros at no-limit Hold’em. What did they do to win?",
    hint: "The programs saw the same cards a player sees. Nothing else was hidden from them, and nothing extra was shown.",
    explanation: "The programs won by deciding better over many hands. They held no extra information and no better cards: the same thing that rewarded players in every era rewarded them.",
  },
  "wh-fresh": {
    decision: "estimate", street: "preflop", hero: ["As", "Kd"],
    bands: bands(["casino", "The casino"], ["buyins", "The other players’ buy-ins, minus a fee"], ["sponsor", "Nobody: the prize is printed new"]),
    dockPrompt: "Who paid the prize?",
    title: "A tournament prize.",
    prompt: "A pro wins a poker tournament after years of study. Who paid for the prize?",
    hint: "Where does the money in a tournament come from before the first card is dealt?",
    explanation: "Every player pays a buy-in, and the prize comes from those buy-ins, minus the house fee. The pro won it from the other players, by deciding better.",
  },
};

const definition = v2Lesson({
  node: "w-history", film: "w-history", coach: "ada", access: "free", track: "Welcome to Poker", minutes: 3,
  title: "Played against people.", kicker: "Two hundred years, one thread.",
  assumptions: "A history film. Every claim on screen is sourced in the plan's truth sheet (HISTORY-SOURCES.md); no real person is named or shown. The table here is only a frame for the questions.",
  stages: v2Stages({
    welcome: { heading: "Played against people.", em: "Won by thinking.", lead: "Riverboats, Texas and a computer. Watch what they share, then answer three quick questions.", cta: "Watch with Ada" },
    film: { upNext: "Answer Ada’s question", film: "w-history", at: null, spot: spots["wh-guided"] },
    hands: [
      { id: "wh-guided", label: "Ada’s question", coachLine: "The film’s question. Your answer." },
      { id: "wh-practice", label: "Practice", coachLine: "The machines, this time." },
      { id: "wh-fresh", label: "Fresh question", coachLine: "A new spot: a tournament." },
    ],
    why: { prompt: "Why do the chips you lose go to the other players?",
      options: options(
        ["a", "The house picks the winner, as it does with slots.", "The house doesn’t play against you. The chips move between the players."],
        ["b", "The house takes a share of every pot, so it wins the most.", "The fee pays for running the game. The pot itself always goes to a player."],
        ["c", "The chips move between players; the house only takes a small fee.", "Right. You play against people; the house only takes a small fee."]) },
    takeaway: { heading: "Better thinking has always won.",
      lead: "Poker is played against people, not the house. From riverboats to computers, the player who decided better took the chips.",
      ruleCard: { lines: ["Poker's played against people,", "and it's won by thinking."], sub: null } },
  }),
  spots,
  hands: { "wh-guided": table("wh-guided"), "wh-practice": table("wh-practice"), "wh-fresh": table("wh-fresh") },
});

export default definition;
