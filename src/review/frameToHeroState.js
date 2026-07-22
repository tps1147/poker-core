// Pure mapping: replay timeline frame → the normalizePuzzleState-shaped hand
// state PuzzleHero renders (same keys drillFromFrame emits, plus the live-mode
// flags PuzzleHero reads: isShowdown / isDealing / actionInProgress).
//
// CommonJS, no React/RN imports — frameToHeroState.test.js runs it with plain
// node, exactly like src/game/review/review.test.js does for the engine.
//
// Card-privacy rule (product decision): the hand docs carry the bot's hole
// cards for every hand, but the replay UI only reveals them on the TERMINAL
// frame of a hand that actually reached showdown — before that the opponent
// row stays face-down, matching what the player saw at the table.

// 'blinds' pseudo-frames are part of the preflop betting round.
const PHASE_FOR_FRAME = {
  blinds: 'preflop',
  preflop: 'preflop',
  flop: 'flop',
  turn: 'turn',
  river: 'river',
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Synthesizes the one "result" frame appended after the last action so the
// stepper can land on the hand's outcome: full dealt board, final pot, stacks
// after the last action (pre-payout — the pot still sits in the middle).
const buildTerminalFrame = (timeline) => {
  if (!timeline || !Array.isArray(timeline.frames) || timeline.frames.length === 0) return null;
  const last = timeline.frames[timeline.frames.length - 1];
  if (!last) return null;

  const showdown = !!(timeline.summary && timeline.summary.showdown);
  const streets = timeline.streets || {};
  // A fold ending shows the board as it stood; a showdown shows the full
  // runout (all-in hands can have board cards past the last betting round).
  const boardCards = showdown
    ? streets.river || streets.turn || streets.flop || last.boardCards || []
    : last.boardCards || [];

  const lastActorWasHero = last.actor === 'hero';
  const amount = toNumber(last.amount);

  return {
    index: last.index + 1,
    phase: 'showdown',
    boardCards,
    actor: 'result',
    action: 'result',
    amount: 0,
    potBefore: toNumber(last.potAfter),
    potAfter: toNumber(last.potAfter),
    // Frame stacks are pre-action; settle the last action's delta here.
    heroStack: toNumber(last.heroStack) - (lastActorWasHero ? amount : 0),
    oppStack: toNumber(last.oppStack) - (lastActorWasHero ? 0 : amount),
    toCall: 0,
    isHeroDecision: false,
    isTerminal: true,
  };
};

// (timeline, frame) → PuzzleHero-shaped state object, or null on bad input.
const frameToHeroState = (timeline, frame) => {
  if (!timeline || !frame || !timeline.hero) return null;

  const isTerminal = !!frame.isTerminal;
  const isShowdown = isTerminal && !!(timeline.summary && timeline.summary.showdown);

  return {
    phase: isTerminal ? 'showdown' : PHASE_FOR_FRAME[frame.phase] || 'preflop',
    playerCards: Array.isArray(timeline.hero.cards) ? timeline.hero.cards : [],
    communityCards: Array.isArray(frame.boardCards) ? frame.boardCards : [],
    // Face-down until the showdown reveal — never leak pre-showdown holdings.
    opponentCards: isShowdown && Array.isArray(timeline.opponent?.cards)
      ? timeline.opponent.cards
      : [],
    pot: toNumber(frame.potBefore),
    // The opponent-seat bet badge shows what the HERO is facing; a bot frame's
    // toCall is the bot's own price, which has no seat to live on here.
    opponentBet: frame.isHeroDecision && frame.toCall > 0 ? toNumber(frame.toCall) : 0,
    playerChips: toNumber(frame.heroStack),
    opponentChips: toNumber(frame.oppStack),
    bigBlind: toNumber(timeline.bigBlind) || 100,
    position: timeline.hero.seat,
    isShowdown,
    isDealing: false,
    // Drives PuzzleSeat's turn glow: the hero seat lights up exactly on the
    // frames where the hero was the one deciding.
    actionInProgress: !frame.isHeroDecision,
  };
};

module.exports = { frameToHeroState, buildTerminalFrame };
