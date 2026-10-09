'use strict';

// Every player-visible string the puzzle engine returns, in one place, so the phone and the web
// say the same thing. Kickers are stored in sentence case; each platform's legend style sets the
// letter case. No em-dashes (test/puzzles.test.js checks).

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const PUZZLE_COPY = deepFreeze({
  // Action buttons and the best play. 'bet' is the label for a raise with nothing to call.
  actions: {
    fold: 'Fold',
    check: 'Check',
    call: 'Call',
    raise: 'Raise',
    bet: 'Bet',
    'all-in': 'All in',
  },
  // The served band (and the request that asks the server to choose one).
  difficulties: {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    adaptive: 'Adaptive',
  },
  // The generator topics, named as the server names each puzzle's category (pokerServer
  // PuzzleGeneratorService TOPIC_CATEGORY), so a puzzle's label and its topic's label agree.
  topics: {
    'starting-hands': 'Starting Hands',
    'pot-odds': 'Pot Odds',
    'postflop-cbet': 'Post-Flop',
    bluffing: 'Bluffing',
    'hand-reading': 'Hand Reading',
  },
  // The verdict kicker after an answer: right, wrong, or a puzzle with no answer key.
  verdict: {
    correct: 'Correct',
    wrong: 'The answer',
    open: 'Review',
  },
  bestPlay: 'Best play',
  youChose: 'You chose',
  unrated: 'Unrated',
  // The maths strip: 'Equity 34% vs price 25%', or 'Equity 62%' with no bet to call.
  maths: {
    equity: 'Equity',
    versus: 'vs',
    price: 'price',
  },
  dailyPuzzle: 'Daily puzzle',
  // The chip tiers (tiers.js), lowest first.
  tiers: {
    white: 'White',
    red: 'Red',
    green: 'Green',
    black: 'Black',
    purple: 'Purple',
    gold: 'Gold',
  },
  // "Show the count" (reveal.js): what each group of outs makes.
  count: {
    'straight-flush': 'Straight flush',
    quads: 'Four of a kind',
    'full-house': 'Full house',
    flush: 'Flush',
    straight: 'Straight',
    trips: 'Three of a kind',
    'two-pair': 'Two pair',
    pairs: 'Pairs (may not be good)',
  },
  rematch: 'Rematch',
});

module.exports = { PUZZLE_COPY };
