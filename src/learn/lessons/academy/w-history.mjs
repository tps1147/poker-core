// Welcome 2, A Short History (w-history), v2 lesson, content version 2. The film has no yourTurn
// anchor: it asks its predict question up front ("In poker, who takes your chips?") and answers it
// at the end (the other players; the house only takes a small fee), so the lesson skips the end ask.
// The guided question puts that idea in numbers: four players sit down with 200 each and the house
// takes 20 in fees, so 780 stays at the table. Practice is one pot after the fee: you win 150, 75 of
// it yours, the house keeps 5, so 70 came from the other players. The fresh hand is the plan's
// Transfer (who paid a tournament prize). No real person is named anywhere.
// Keys: answerKeys/w-history.mjs (package root, not shipped).
import { bands, huHand, options, v2Lesson, v2Stages } from "./kitEarly.mjs";

const table = (id) => huHand(id, { hero: ["As", "Kd"], pot: 0, blinds: [5, 10] });

// The film's own question (it asks and answers it on screen), kept as it plays.
const turnSpot = {
  scene: "question",
  decision: "estimate", street: "preflop", hero: ["As", "Kd"],
  bands: bands(["house", "The house"], ["players", "The other players"]), dockPrompt: "Who takes the chips you lose?",
  title: "Who takes your chips?",
  prompt: "You lose a pot at poker. Who ends up with those chips: the house, or the other players at the table?",
  hint: "Think about where the chips in a pot go when the hand ends.",
  explanation: "In poker the chips move between the players. The house does not play against you; it only takes a small fee for running the game.",
};

const spots = {
  "wh-guided": {
    scene: "question",
    decision: "estimate", street: "preflop", hero: ["As", "Kd"],
    bands: bands(["800", "800"], ["780", "780"], ["600", "600"]), dockPrompt: "Chips left at the table",
    title: "Where did the chips go?",
    prompt: "Four players sit down with 200 chips each. An hour later the house has taken 20 chips in fees. How many chips do the four players hold between them now?",
    hint: "A pot always goes to a player. Only the fee leaves the table.",
    explanation: "The house never plays a hand, so no pot goes to it. The 800 only moves between the four players, less the 20 in fees: 780.",
  },
  "wh-practice": {
    scene: "question",
    decision: "estimate", street: "preflop", hero: ["As", "Kd"],
    bands: bands(["150", "150"], ["75", "75"], ["70", "70"]),
    dockPrompt: "Won from the other players",
    title: "One pot, one fee.",
    prompt: "You win a pot of 150. You put 75 of it in; the other players put in the rest. The house keeps 5 as its fee. How many chips did you win from the other players?",
    hint: "Take away the chips that were yours already, then the fee.",
    explanation: "You collect 145, and 75 of it was yours: you won 70 from the other players. The house played no hand; it only kept its fee.",
  },
  "wh-fresh": {
    scene: "question",
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
  node: "w-history", version: 2, film: "w-history", coach: "knox", access: "free", track: "Welcome to Poker", minutes: 3,
  title: "Played against people.", kicker: "Two hundred years, one thread.",
  assumptions: "A history film. Every claim on screen is sourced in the plan's truth sheet (HISTORY-SOURCES.md); no real person is named or shown. The table here is only a frame for the questions; their chip counts and fees are round example numbers.",
  stages: v2Stages({
    welcome: { heading: "Played against people.", em: "Won by thinking.", lead: "Riverboats, Texas and a computer. Watch what they share, then answer three quick questions.", cta: "Watch with Knox" },
    film: { upNext: "Answer Knox’s question", film: "w-history", at: null, endAsk: "skip", spot: turnSpot },
    hands: [
      { id: "wh-guided", label: "Knox’s question", coachLine: "Follow the chips around a table." },
      { id: "wh-practice", label: "Practice", coachLine: "One pot, after the fee." },
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
