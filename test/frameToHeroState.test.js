// Plain-node checks for frameToHeroState / buildTerminalFrame (same harness
// style as test/review.test.js): run with
//   node test/frameToHeroState.test.js

const assert = require('assert');

const { buildReplayTimeline } = require('../src/review/replayTimeline');
const { frameToHeroState, buildTerminalFrame } = require('../src/review/frameToHeroState');

const HERO = '64fabc0123456789abcdef01';
const BOT = 'ai_sharky';

const card = (rank, suit) => ({ rank, suit });
const act = (playerId, phase, action, amount) => ({
  playerId,
  phase,
  action,
  amount,
  timestamp: '2026-07-22T00:00:00.000Z',
});

const mkHand = ({ community, actions, winnerId, winnerAmount, showdown, winnerHandName = null }) => ({
  _id: 'hand-x',
  handNumber: 1,
  gameType: 'solo',
  players: [
    {
      userId: HERO,
      username: 'hero',
      position: 'BTN',
      startingChips: 10000,
      cards: [card('A', '♠'), card('K', '♠')],
      netChange: 0,
      isDealer: true,
      isSmallBlind: true,
      isBigBlind: false,
    },
    {
      userId: BOT,
      username: 'Sharky',
      position: 'BB',
      startingChips: 10000,
      cards: [card('7', '♦'), card('7', '♣')],
      netChange: 0,
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: true,
    },
  ],
  communityCards: community,
  pot: { total: 0 },
  actions,
  winner: { userId: winnerId, amount: winnerAmount, handName: winnerHandName },
  showdown: { occurred: showdown, players: [] },
  createdAt: '2026-07-22T00:00:00.000Z',
});

// Fold ending on the turn: board stays at 4 cards, no reveal.
const foldHand = mkHand({
  community: [card('Q', '♥'), card('7', '♥'), card('2', '♠'), card('J', '♥')],
  actions: [
    act(HERO, 'blinds', 'small blind', 50),
    act(BOT, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'raise', 250),
    act(BOT, 'preflop', 'call', 200),
    act(BOT, 'flop', 'raise', 400),
    act(HERO, 'flop', 'call', 400),
    act(BOT, 'turn', 'raise', 900),
    act(HERO, 'turn', 'fold', 0),
  ],
  winnerId: BOT,
  winnerAmount: 2300,
  showdown: false,
});

// Showdown ending with a full runout.
const showdownHand = mkHand({
  community: [card('K', '♠'), card('Q', '♦'), card('4', '♣'), card('4', '♥'), card('2', '♥')],
  actions: [
    act(HERO, 'blinds', 'small blind', 50),
    act(BOT, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'call', 50),
    act(BOT, 'preflop', 'check', 0),
    act(BOT, 'flop', 'raise', 300),
    act(HERO, 'flop', 'call', 300),
    act(BOT, 'turn', 'check', 0),
    act(HERO, 'turn', 'check', 0),
    act(BOT, 'river', 'raise', 500),
    act(HERO, 'river', 'call', 500),
  ],
  winnerId: BOT,
  winnerAmount: 1800,
  showdown: true,
  winnerHandName: 'Two Pair',
});

const foldTimeline = buildReplayTimeline(foldHand, HERO);
const showTimeline = buildReplayTimeline(showdownHand, HERO);
assert.ok(foldTimeline && showTimeline, 'fixture timelines build');

// --- blind pseudo-frame ------------------------------------------------------

const blindState = frameToHeroState(foldTimeline, foldTimeline.frames[0]);
assert.strictEqual(blindState.phase, 'preflop', 'blinds map to the preflop phase');
assert.strictEqual(blindState.pot, 0, 'pot before the small blind is empty');
assert.strictEqual(blindState.opponentBet, 0, 'no facing badge on a blind frame');
assert.deepStrictEqual(blindState.communityCards, [], 'no board preflop');
assert.deepStrictEqual(blindState.opponentCards, [], 'bot cards stay hidden');
assert.strictEqual(blindState.isShowdown, false);
assert.strictEqual(blindState.actionInProgress, true, 'no hero-turn glow on blinds');
assert.strictEqual(blindState.playerChips, 10000);
assert.strictEqual(blindState.bigBlind, 100);
assert.strictEqual(blindState.position, 'BTN');

// --- hero decision facing a bet ---------------------------------------------

// Frame 7: hero faces the bot's 900 turn bet.
const facingState = frameToHeroState(foldTimeline, foldTimeline.frames[7]);
assert.strictEqual(facingState.phase, 'turn');
assert.strictEqual(facingState.communityCards.length, 4, 'turn board visible');
assert.strictEqual(facingState.pot, 2300, 'pot before the decision');
assert.strictEqual(facingState.opponentBet, 900, 'facing amount rides the opponent bet badge');
assert.strictEqual(facingState.playerChips, 9300, 'hero stack before acting');
assert.strictEqual(facingState.opponentChips, 8400, 'bot stack after its bet');
assert.strictEqual(facingState.actionInProgress, false, 'hero-turn glow on a hero decision');
assert.deepStrictEqual(facingState.opponentCards, [], 'no reveal mid-hand');
assert.deepStrictEqual(facingState.playerCards, foldHand.players[0].cards, 'hero cards always up');

// --- bot action frame: the bot's own price never leaks onto the badge -------

// Frame 4: bot leads the flop (its toCall was 0 there, but frame 3 — bot call
// facing 200 — is the sharper check).
const botFacingFrame = foldTimeline.frames[3];
assert.strictEqual(botFacingFrame.toCall, 200, 'fixture: bot faced 200');
const botState = frameToHeroState(foldTimeline, botFacingFrame);
assert.strictEqual(botState.opponentBet, 0, 'bot-frame facing amount is not a hero-facing badge');
assert.strictEqual(botState.actionInProgress, true);

// --- terminal frame: fold ending --------------------------------------------

const foldTerminal = buildTerminalFrame(foldTimeline);
assert.ok(foldTerminal, 'terminal frame builds');
assert.strictEqual(foldTerminal.isTerminal, true);
assert.strictEqual(foldTerminal.index, 8, 'appends after the last action');
assert.strictEqual(foldTerminal.potBefore, 2300, 'final pot');
assert.strictEqual(foldTerminal.heroStack, 9300, 'hero fold moved no chips');
assert.strictEqual(foldTerminal.oppStack, 8400);
assert.strictEqual(foldTerminal.boardCards.length, 4, 'fold ending keeps the board as dealt');

const foldEndState = frameToHeroState(foldTimeline, foldTerminal);
assert.strictEqual(foldEndState.isShowdown, false, 'no showdown -> no reveal');
assert.deepStrictEqual(foldEndState.opponentCards, [], 'bot cards stay hidden on a fold ending');
assert.strictEqual(foldEndState.phase, 'showdown');
assert.strictEqual(foldEndState.opponentBet, 0);

// --- terminal frame: showdown reveal ----------------------------------------

const showTerminal = buildTerminalFrame(showTimeline);
assert.strictEqual(showTerminal.boardCards.length, 5, 'showdown shows the full runout');
// Last action was the hero's 500 call: settle it into the terminal stacks.
assert.strictEqual(showTerminal.heroStack, 9100);
assert.strictEqual(showTerminal.oppStack, 9100);
assert.strictEqual(showTerminal.potBefore, 1800);

const showEndState = frameToHeroState(showTimeline, showTerminal);
assert.strictEqual(showEndState.isShowdown, true, 'showdown terminal frame reveals');
assert.deepStrictEqual(
  showEndState.opponentCards,
  showdownHand.players[1].cards,
  'bot cards revealed ONLY here'
);

// Every non-terminal frame of the showdown hand still hides the bot cards.
showTimeline.frames.forEach((frame) => {
  const state = frameToHeroState(showTimeline, frame);
  assert.deepStrictEqual(state.opponentCards, [], `frame ${frame.index} leaks no cards`);
  assert.strictEqual(state.isShowdown, false);
});

// --- null-safety -------------------------------------------------------------

assert.strictEqual(frameToHeroState(null, foldTimeline.frames[0]), null);
assert.strictEqual(frameToHeroState(foldTimeline, null), null);
assert.strictEqual(buildTerminalFrame(null), null);
assert.strictEqual(buildTerminalFrame({ frames: [] }), null);

console.log('frameToHeroState checks passed');
