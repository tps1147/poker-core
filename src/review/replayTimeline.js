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
  if (!players || players.length < 2 || !actions || actions.length === 0) return null;
  if (players.length > 2) return buildMultiwayTimeline(handDoc, heroUserId, players, actions);

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
    // A malformed action entry (null/primitive) means we can't know how many
    // chips it moved, so every later frame's pot, stacks and toCall would be
    // reconstructed off a corrupted running total. We DELIBERATELY return null
    // here rather than skipping the entry: skipping would keep the hand
    // "replayable" but silently mis-grade every downstream hero decision (wrong
    // pot odds → fabricated grades that pollute accuracy/histogram/leaks), which
    // is worse than not grading it at all. Returning null no longer LOSES the
    // hand — buildMatchReview now surfaces a null timeline as an un-replayable
    // hands[] row (replayable:false) carrying the doc's stored netChange. So the
    // two fixes compose: this stays strict (no silent corruption), matchReview
    // stops dropping nulls. Clean-action hands never hit this path and remain
    // byte-identical to before (proven by the existing timeline/grading tests).
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

// A six-max hand (2.0 finish, Oct 23 2026): the same timeline shape, read against the field.
// Each player's stack and bet are folded separately; toCall is the biggest bet in front of the
// hero, oppStack the deepest live opponent's stack, and the "opponent" is the last player still
// in against the hero (the one a review talks about). An ante goes to the pot without counting
// toward the bet. A hero decision is judged only when one opponent is left in the pot: the
// grading reads equity against one player, so a three-way spot is shown, never graded.
// Amounts are deltas, as in heads-up docs (the server converts the table's raise-to totals).
const buildMultiwayTimeline = (handDoc, heroUserId, players, actions) => {
  const heroDoc = players.find((p) => p && String(p.userId) === String(heroUserId));
  if (!heroDoc) return null;
  const others = players.filter((p) => p && p !== heroDoc);
  const idOf = (p) => String(p.userId);
  const community = Array.isArray(handDoc.communityCards) ? handDoc.communityCards : [];
  const bigBlindAction = actions.find((a) => a && String(a.action).toLowerCase() === 'big blind');
  const bigBlind = bigBlindAction ? toNumber(bigBlindAction.amount) : 100;

  const stacks = {};
  const committed = {};
  const folded = new Set();
  players.forEach((p) => { stacks[idOf(p)] = toNumber(p.startingChips); committed[idOf(p)] = 0; });
  const heroId = idOf(heroDoc);
  let currentRound = 'preflop';
  let pot = 0;
  const frames = [];
  let lastFacing = null;

  for (let i = 0; i < actions.length; i++) {
    const raw = actions[i];
    if (!raw || typeof raw !== 'object') return null;
    const pid = String(raw.playerId);
    if (!(pid in stacks)) return null;
    const phase = typeof raw.phase === 'string' ? raw.phase : 'preflop';
    const round = ROUND_FOR_PHASE[phase] || 'preflop';
    if (round !== currentRound) {
      Object.keys(committed).forEach((k) => { committed[k] = 0; });
      currentRound = round;
    }
    const action = String(raw.action || '').toLowerCase();
    const amount = Math.max(0, toNumber(raw.amount));
    const live = others.filter((p) => !folded.has(idOf(p)));
    const biggest = Math.max(0, ...live.map((p) => committed[idOf(p)]));
    const toCall = pid === heroId ? Math.min(Math.max(0, biggest - committed[heroId]), Math.max(0, stacks[heroId])) : 0;
    const potBefore = pot;
    const heroStack = stacks[heroId];
    const oppStack = Math.max(0, ...live.map((p) => stacks[idOf(p)]));

    pot += amount;
    stacks[pid] -= amount;
    if (action !== 'ante') committed[pid] += amount;
    if (action === 'fold') folded.add(pid);

    const isHero = pid === heroId;
    if (isHero && live.length >= 1) lastFacing = live;
    frames.push({
      index: i,
      phase,
      boardCards: community.slice(0, VISIBLE_BOARD_COUNT[round] || 0),
      actor: phase === 'blinds' ? 'blinds' : (isHero ? 'hero' : 'opponent'),
      action: raw.action,
      amount,
      potBefore,
      potAfter: pot,
      heroStack,
      oppStack,
      toCall,
      liveOpponents: live.length,
      actorName: isHero ? null : ((players.find((p) => idOf(p) === pid) || {}).username || null),
      isHeroDecision: isHero && phase !== 'blinds' && live.length === 1,
    });
  }

  const streets = {
    flop: community.length >= 3 ? community.slice(0, 3) : null,
    turn: community.length >= 4 ? community.slice(0, 4) : null,
    river: community.length >= 5 ? community.slice(0, 5) : null,
  };
  // The opponent: whoever was still in at the end against the hero, else the last one the hero faced.
  const stillIn = others.filter((p) => !folded.has(idOf(p)));
  const winnerDoc = handDoc.winner && typeof handDoc.winner === 'object' ? handDoc.winner : null;
  const oppDoc = stillIn.find((p) => winnerDoc && idOf(p) === String(winnerDoc.userId))
    || stillIn[0] || (lastFacing && lastFacing[lastFacing.length - 1]) || others[0];
  const showdownOccurred = !!(handDoc.showdown && handDoc.showdown.occurred);
  return {
    hero: { seat: heroDoc.seat || seatOf(heroDoc), cards: Array.isArray(heroDoc.cards) ? heroDoc.cards : [] },
    opponent: {
      seat: oppDoc.seat || seatOf(oppDoc),
      // Cards only when they were shown down.
      cards: showdownOccurred && !folded.has(idOf(oppDoc)) && Array.isArray(oppDoc.cards) ? oppDoc.cards : [],
      name: oppDoc.username || null,
    },
    field: players.length,
    bigBlind,
    streets,
    frames,
    summary: {
      winner: winnerDoc ? (String(winnerDoc.userId) === heroId ? 'hero' : 'opponent') : null,
      wonBy: (winnerDoc && winnerDoc.handName) || (showdownOccurred ? null : 'fold'),
      netChange: toNumber(heroDoc.netChange),
      showdown: showdownOccurred,
    },
  };
};

module.exports = { buildReplayTimeline };
