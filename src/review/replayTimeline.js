// Pure replay timeline for Match Review. CommonJS like handInsightsMath.js so
// review.test.js runs with plain node — no React/RN imports allowed in review/.
//
// AMOUNT SEMANTICS — verified against pokerServer/src/game/GameState.js:
// every recorded action amount is a DELTA (chips that action moved into the
// middle), never a running total:
//   - 'small blind' / 'big blind': the posted blind (startHand records
//     this.blinds.small / this.blinds.big directly).
//   - 'call': actualCallAmount = min(currentBet - player.bet, player.chips).
//   - 'raise': additionalAmount = amount - player.bet — handleAction sets
//     currentBet to the TOTAL bet, but records only the delta added.
//   - 'all-in': the chips moved in by that action (again a delta).
//   - 'fold' / 'check': 0.
// So starting stacks + amounts fully determine the progression: pot += amount,
// actor stack -= amount. New docs also carry potAfterAction/chipsAfterAction,
// but we always reconstruct from the deltas so old and new docs share one
// deterministic code path (the deltas are exact, not an approximation).

// 'blinds' pseudo-actions belong to the preflop betting round — blind chips
// count toward preflop toCall math (SB completing owes BB - SB, not BB).
const ROUND_FOR_PHASE = {
  blinds: 'preflop',
  preflop: 'preflop',
  flop: 'flop',
  turn: 'turn',
  river: 'river',
};

// How much of the FINAL board is visible while a given round is being bet.
const VISIBLE_BOARD_COUNT = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Heads-up seats: dealer/SB is the button, the other seat is the big blind.
const seatOf = (player) =>
  player.position || (player.isDealer || player.isSmallBlind ? 'BTN' : 'BB');

// handDoc → { hero, opponent, streets, frames, summary } or null on malformed
// input. Deterministic and null-safe: bad docs return null, never throw.
const buildReplayTimeline = (handDoc, heroUserId) => {
  if (!handDoc || typeof handDoc !== 'object' || heroUserId == null) return null;
  const players = Array.isArray(handDoc.players) ? handDoc.players : null;
  const actions = Array.isArray(handDoc.actions) ? handDoc.actions : null;
  if (!players || players.length !== 2 || !actions || actions.length === 0) return null;

  const heroDoc = players.find((p) => p && String(p.userId) === String(heroUserId));
  const oppDoc = players.find((p) => p && String(p.userId) !== String(heroUserId));
  if (!heroDoc || !oppDoc) return null;

  const community = Array.isArray(handDoc.communityCards) ? handDoc.communityCards : [];

  // The big blind anchors preflop grading (limps/SB folds are ungraded) and
  // drill conversion; read it from the recorded pseudo-action, not config.
  const bigBlindAction = actions.find(
    (a) => a && String(a.action).toLowerCase() === 'big blind'
  );
  const bigBlind = bigBlindAction ? toNumber(bigBlindAction.amount) : 100;

  // Fold over the actions: pot and stacks are exact sums of the deltas.
  const stacks = { hero: toNumber(heroDoc.startingChips), opponent: toNumber(oppDoc.startingChips) };
  const committed = { hero: 0, opponent: 0 }; // chips in for the CURRENT round
  let currentRound = 'preflop';
  let pot = 0;
  const frames = [];

  for (let i = 0; i < actions.length; i++) {
    const raw = actions[i];
    if (!raw || typeof raw !== 'object') return null;

    const phase = typeof raw.phase === 'string' ? raw.phase : 'preflop';
    const round = ROUND_FOR_PHASE[phase] || 'preflop';
    if (round !== currentRound) {
      // New street: per-round commitments reset (the chips stay in the pot).
      committed.hero = 0;
      committed.opponent = 0;
      currentRound = round;
    }

    const who = String(raw.playerId) === String(heroDoc.userId) ? 'hero' : 'opponent';
    const other = who === 'hero' ? 'opponent' : 'hero';
    const amount = Math.max(0, toNumber(raw.amount));

    // Facing amount before acting, capped at the actor's stack (an all-in
    // larger than the stack can only be called for what's behind).
    const toCall = Math.min(
      Math.max(0, committed[other] - committed[who]),
      Math.max(0, stacks[who])
    );

    const potBefore = pot;
    const heroStack = stacks.hero; // stacks are BEFORE the action — the state
    const oppStack = stacks.opponent; // the actor faced when deciding

    pot += amount;
    stacks[who] -= amount;
    committed[who] += amount;

    frames.push({
      index: i,
      phase,
      boardCards: community.slice(0, VISIBLE_BOARD_COUNT[round] || 0),
      actor: phase === 'blinds' ? 'blinds' : who,
      action: raw.action,
      amount,
      potBefore,
      potAfter: pot,
      heroStack,
      oppStack,
      toCall,
      isHeroDecision: who === 'hero' && phase !== 'blinds',
    });
  }

  // Street boards for the scrubber: null until that street's cards exist.
  const streets = {
    flop: community.length >= 3 ? community.slice(0, 3) : null,
    turn: community.length >= 4 ? community.slice(0, 4) : null,
    river: community.length >= 5 ? community.slice(0, 5) : null,
  };

  const winnerDoc = handDoc.winner && typeof handDoc.winner === 'object' ? handDoc.winner : null;
  const showdownOccurred = !!(handDoc.showdown && handDoc.showdown.occurred);
  const summary = {
    winner: winnerDoc
      ? (String(winnerDoc.userId) === String(heroDoc.userId) ? 'hero' : 'opponent')
      : null,
    wonBy: (winnerDoc && winnerDoc.handName) || (showdownOccurred ? null : 'fold'),
    netChange: toNumber(heroDoc.netChange),
    showdown: showdownOccurred,
  };

  return {
    hero: { seat: seatOf(heroDoc), cards: Array.isArray(heroDoc.cards) ? heroDoc.cards : [] },
    opponent: {
      seat: seatOf(oppDoc),
      cards: Array.isArray(oppDoc.cards) ? oppDoc.cards : [],
      name: oppDoc.username || null,
    },
    bigBlind,
    streets,
    frames,
    summary,
  };
};

module.exports = { buildReplayTimeline };
