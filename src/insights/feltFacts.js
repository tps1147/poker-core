// What the table coach draws on the felt while the hero decides: plain facts about the spot, never
// advice and never a read on the opponent. CommonJS, pure.
//
//   texture  the board in two words at most ("Two-tone · Connected", "Flush possible", "Dry")
//   ask      what the bet in front of the hero is asking: its size against the pot, the price to
//            call, what a call wins and the share it needs ("Half-pot bet", call 300 to win 900,
//            needs 25%). null when nothing is owed.
//   outs     the hero's draw outs on the flop and turn, counted the way the HUD and the grader count
//            them (a real four-card flush draw plus straight outs, nothing once a straight is made)
//
// Every number is arithmetic on the table's own chips or a count of cards; no equity estimate is
// drawn before the hero acts. The verdict after the hero acts is liveSpotVerdict's (review).

const { normalizeCards, combineOuts, computePotOdds } = require('./handInsightsMath');
const { evaluateHand } = require('../eval/pokerEvaluator');

const RANKS = '23456789TJQKA';
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

// Board texture, strongest fact first, two at most.
const textureWords = (boardCards) => {
  const board = normalizeCards(boardCards) || [];
  if (board.length < 3) return null;
  const words = [];
  const suitCounts = {};
  board.forEach((c) => { suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1; });
  const maxSuit = Math.max(...Object.values(suitCounts));
  const ranks = [...new Set(board.map((c) => RANKS.indexOf(c.rank)))];
  const withWheel = ranks.includes(12) ? [...ranks, -1] : ranks;
  // Three distinct board ranks inside a five-rank window: a straight is possible.
  let straight = false;
  for (let low = -1; low <= 8 && !straight; low += 1) {
    if (withWheel.filter((r) => r >= low && r <= low + 4).length >= 3) straight = true;
  }
  const paired = ranks.length < board.length;
  if (maxSuit >= 3) words.push(maxSuit >= 4 ? 'Four to a flush' : 'Flush possible');
  if (straight) words.push('Straight possible');
  if (paired) words.push(board.length - ranks.length >= 2 ? 'Double paired' : 'Paired');
  if (maxSuit === 2 && board.length < 5 && words.length < 2) words.push('Two-tone');
  if (!words.length) {
    const sorted = withWheel.slice().sort((a, b) => a - b);
    const close = sorted.some((r, i) => i > 0 && r - sorted[i - 1] <= 2);
    words.push(close ? 'Connected' : 'Dry');
  }
  return words.slice(0, 2).join(' · ');
};

// The bet's size against the pot it went into.
const SIZE_WORDS = [
  [0.4, 'Small bet'],
  [0.6, 'Half-pot bet'],
  [0.85, 'Big bet'],
  [1.15, 'Pot-sized bet'],
  [Infinity, 'Overbet'],
];
const sizeWord = (bet, potBeforeBet) => {
  if (!(potBeforeBet > 0)) return 'Bet';
  const ratio = bet / potBeforeBet;
  return SIZE_WORDS.find(([cut]) => ratio < cut)[1];
};

// engine: the AIPlayer surface the grader uses (hasFlushDraw, evaluateDrawingHands).
const outsFor = (holeCards, boardCards, engine) => {
  const hole = normalizeCards(holeCards);
  const board = normalizeCards(boardCards) || [];
  if (!engine || !hole || hole.length !== 2 || (board.length !== 3 && board.length !== 4)) return null;
  const all = [...hole, ...board];
  const made = evaluateHand(all);
  if (made && made.rank >= 5) return null;
  const flush = engine.hasFlushDraw(all);
  const flushOuts = flush && flush.isFlushDraw && flush.type === 'flush-draw' ? flush.outs : 0;
  const draw = engine.evaluateDrawingHands(all);
  const total = combineOuts(flushOuts, (draw && draw.straightOuts) || 0);
  return total > 0 ? total : null;
};

// state: { phase, holeCards, board, pot (finished streets), heroBet, opponentBet, toCall,
//          heroStack, opponentAllIn, bigBlind }
const feltFacts = (state, engine = null) => {
  if (!state) return null;
  const pot = Math.max(0, num(state.pot));
  const heroBet = Math.max(0, num(state.heroBet));
  const oppBet = Math.max(0, num(state.opponentBet));
  const owed = Math.max(0, num(state.toCall) || oppBet - heroBet);
  const toCall = Math.min(owed, Math.max(0, num(state.heroStack)) || owed);
  let ask = null;
  if (toCall > 0) {
    const potBeforeCall = pot + heroBet + oppBet;
    const odds = computePotOdds({ callAmount: toCall, potBeforeCall });
    // A bet is sized against the pot it went into; facing a raise (chips of the hero's own
    // already in, or preflop) the label is just Raise.
    const raise = oppBet - heroBet;
    const bigBlind = num(state.bigBlind);
    let label;
    if (state.opponentAllIn) label = 'All-in';
    else if (state.phase === 'preflop' && bigBlind > 0 && oppBet <= bigBlind) label = 'The big blind';
    else if (heroBet > 0 || state.phase === 'preflop') label = 'Raise';
    else label = sizeWord(raise, pot, false);
    ask = {
      label,
      toCall,
      wins: potBeforeCall,
      neededPct: odds ? Math.round(odds.neededEquityPct) : null,
    };
  }
  return {
    texture: textureWords(state.board),
    ask,
    outs: outsFor(state.holeCards, state.board, engine),
  };
};

module.exports = { feltFacts, textureWords };
