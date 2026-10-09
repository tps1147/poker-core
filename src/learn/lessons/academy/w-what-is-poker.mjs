// Welcome 1, What Poker Really Is (w-what-is-poker), v2 lesson, content version 3 (2026-10-09, the
// welcome rebuild's v3 film). The learner plays the film's hand: K♥ Q♥ against Ada's A♣ J♦ on
// J♥ T♣ 4♥ 2♠ 9♦. The film pauses four times (filmV2 multiPause), each over the frame where it draws
// its own card with ONE lit button, so the hand cannot be lost: YOUR TURN preflop (only Call 5),
// on the flop (only Call 20), on the river (only Bet 40), then WHO WINS? (You or Ada), a prediction
// either answer of which goes on (never graded wrong). The film then answers its own showdown (your
// straight beats a pair of jacks) and shows the other way to win (everyone else folds).
// The guided hand is a new showdown that turns the film's around: K♠ K♦ against Ace Andy's 7♥ 6♥ on
// 8♥ 5♣ K♣ 2♥ 9♠, three kings against a straight, and this time Ace Andy wins. Practice is a third
// showdown (a set of eights against a pair of aces); the fresh hand is the plan's Transfer, the
// other way to win: everyone else folds.
// Content version 2 (the v2 film, its own showdown and a skipped end ask) stays registered on the
// server for older builds (answerKeys/previous/w-what-is-poker.v2.mjs).
// Keys: answerKeys/w-what-is-poker.mjs (package root, not shipped). No imports beyond the shared kit.
import { bands, huHand, options, seatsHU, v2Lesson, v2Stages } from "./kitEarly.mjs";

const WHO = bands(["you", "You"], ["andy", "Ace Andy"], ["split", "Split pot"]);
const film = { hero: ["Kh", "Qh"], board: ["Jh", "Tc", "4h", "2s", "9d"], versus: ["Ac", "Jd"] };
const guided = { hero: ["Ks", "Kd"], board: ["8h", "5c", "Kc", "2h", "9s"], versus: ["7h", "6h"] };
const practice = { hero: ["8s", "8d"], board: ["Ad", "8h", "3c", "Qs", "5h"], versus: ["Ah", "Kc"] };
const fresh = { hero: ["7c", "6c"], board: ["Kd", "9s", "4c", "2h"] };

// The film's four pauses, each the button the film itself lights (Fold, Call 5, Raise preflop; Fold,
// Call 20, Raise on the flop; Fold, Check, Bet 40 on the river), only that one enabled. `labels` names a
// choice as the film draws it.
const turn1 = {
  decision: "action", street: "preflop", hero: film.hero, board: [], potBefore: 15, call: 5,
  choices: ["fold", "call", "raise"], labels: { call: "Call 5" }, enabled: ["call"],
  title: "Your turn", dockPrompt: "Your turn. Call 5.",
  prompt: "Ada has 10 in, you have 5. Call 5 to stay in the hand.",
};
const turn2 = {
  decision: "action", street: "flop", hero: film.hero, board: film.board.slice(0, 3), potBefore: 20, bet: 20, call: 20,
  choices: ["fold", "call", "raise"], labels: { call: "Call 20" }, enabled: ["call"],
  title: "Your turn", dockPrompt: "Your turn. Call 20.",
  prompt: "King, queen, jack, ten: one card from a straight. Ada bets 20. Call 20 to see the turn.",
};
const turn3 = {
  decision: "action", street: "river", hero: film.hero, board: film.board, potBefore: 60, bet: 40,
  choices: ["fold", "check", "bet"], labels: { bet: "Bet 40" }, enabled: ["bet"],
  title: "Your turn", dockPrompt: "Your turn. Bet 40.",
  prompt: "The nine makes your straight, king down to nine. Ada checks. Bet 40.",
};
// WHO WINS? A prediction before the cards are turned: either answer goes on, and the film shows it.
const whoWins = {
  decision: "estimate", street: "river", hero: film.hero, board: film.board, bands: bands(["you", "You"], ["ada", "Ada"]),
  title: "Who wins?", dockPrompt: "Cards up. Who wins?",
  prompt: "Cards up. Your straight against Ada’s two hidden cards. Who wins?",
  explanation: "Ada has ace-jack, a pair of jacks. King, queen, jack, ten, nine is a straight, and a straight beats a pair, so the pot is yours.",
};

const spots = {
  "wip-guided": {
    decision: "estimate", street: "river", ...guided, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "Three kings. Is it enough?",
    prompt: "You hold K♠ K♦. Ace Andy holds 7♥ 6♥. The board is 8♥ 5♣ K♣ 2♥ 9♠. Both hands are shown. Who wins it?",
    hint: "Find each player’s best five. Three of a kind is three of one rank; a straight is five ranks in a row.",
    explanation: "Your K♠ K♦ and the K♣ make three kings. Ace Andy’s 7♥ 6♥ with the 5♣, 8♥ and 9♠ make five in a row: a straight. A straight beats three of a kind, so Ace Andy wins this one.",
  },
  "wip-practice": {
    decision: "estimate", street: "river", ...practice, bands: WHO, dockPrompt: "Who wins at showdown?",
    title: "Another showdown. Who wins?",
    prompt: "You hold 8♠ 8♦. Ace Andy holds A♥ K♣. The board is A♦ 8♥ 3♣ Q♠ 5♥. Who takes the pot?",
    hint: "Ace Andy pairs the ace on the board. How many eights can you count?",
    explanation: "Your two eights and the 8♥ make three eights. Ace Andy has a pair of aces with a king. Three of a kind beats one pair, so you win.",
  },
  "wip-fresh": {
    decision: "estimate", street: "turn", ...fresh, potBefore: 90, bet: 45, call: 45,
    bands: bands(["andy", "Ace Andy, without showing"], ["show", "Nobody yet: he must show to win"], ["split", "Split pot"]),
    dockPrompt: "If you fold here, who takes the pot?",
    title: "The other way to win.",
    prompt: "A new hand. Ace Andy bets 45 into 90 on the turn, and you are thinking of folding 7♣ 6♣. If you fold, his cards stay face down. Who takes the pot?",
    hint: "A pot is won in two ways: the best five at showdown, or everyone else folding.",
    explanation: "When everyone else folds, the last player in wins the pot without showing a card. Ace Andy never needed the best hand here, only a fold.",
  },
};

const definition = v2Lesson({
  node: "w-what-is-poker", version: 3, film: "w-what-is-poker", coach: "knox", access: "free", track: "Welcome to Poker", minutes: 3,
  title: "What decides who wins?", kicker: "The cards, or the decisions.",
  assumptions: "Heads-up. At showdown the best five cards of the seven each player can use win the pot; a pot can also be won when everyone else folds. The opponent’s cards are shown in the question when the hand reaches showdown.",
  stages: v2Stages({
    welcome: { heading: "What decides who wins?", em: "Hold that thought.", lead: "Play one hand inside the film, then read three hands at the table.", cta: "Play the film" },
    film: { upNext: "Play Knox’s hand", film: "w-what-is-poker", at: 33.47, pauses: [
      { anchor: "yourTurn1", spotId: "wip-turn", spot: turn1 },
      { anchor: "yourTurn2", spotId: "wip-turn-2", spot: turn2 },
      { anchor: "yourTurn3", spotId: "wip-turn-3", spot: turn3 },
      { anchor: "whoWins", spotId: "wip-turn-wins", spot: whoWins, predict: true },
    ] },
    hands: [
      { id: "wip-guided", label: "Knox’s hand", coachLine: "A new showdown. You read it." },
      { id: "wip-practice", label: "Practice", coachLine: "Same idea, new cards." },
      { id: "wip-fresh", label: "Fresh hand", coachLine: "No showdown this time." },
    ],
    why: { prompt: "Over hundreds of hands, what takes the chips?",
      options: options(
        ["a", "Being dealt better cards than everyone else.", "Everyone is dealt the same cards over time. Cards decide one hand; decisions decide a thousand."],
        ["b", "Better decisions: any single hand can go either way.", "Right. Any one hand can go either way; over hundreds, the better decisions take the chips."],
        ["c", "Always holding the best five at showdown.", "You also win when everyone else folds, without showing a thing."]) },
    takeaway: { heading: "Decisions decide a thousand.",
      lead: "One hand can go either way. Over hundreds of hands, better decisions take the chips, at a showdown or when everyone else folds.",
      ruleCard: { lines: ["the better decisions take the chips.", "That's what you'll learn here,", "one decision at a time."], sub: null } },
  }),
  spots,
  hands: {
    "wip-guided": huHand("wip-guided", { hero: guided.hero, board: guided.board, versus: guided.versus, pot: 240, seats: seatsHU("Ace Andy", 880, 880) }),
    "wip-practice": huHand("wip-practice", { hero: practice.hero, board: practice.board, versus: practice.versus, pot: 160, seats: seatsHU("Ace Andy", 920, 920) }),
    "wip-fresh": huHand("wip-fresh", { hero: fresh.hero, board: fresh.board, pot: 90, seats: seatsHU("Ace Andy", 955, 955), acts: [{ seat: "opponent", action: "bet", amount: 45 }] }),
  },
});

export default definition;
