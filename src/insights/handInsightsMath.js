// Pure math for the in-game HUD panel (hand insights + opponent read).
// CommonJS like tableMotion.js so handInsightsMath.test.js runs with plain node.

const RANKS = '23456789TJQKA';

// Some payloads carry '10' instead of 'T' (ProductionCard defends the same way) —
// normalize before the AIPlayer engine indexes into its rank string.
const normalizeCardForEngine = (card) => {
  if (!card) return null;
  let rank = String(card.rank || '').toUpperCase();
  if (rank === '10') rank = 'T';
  if (rank.length !== 1 || !RANKS.includes(rank)) return null;
  return { rank, suit: card.suit };
};

// One malformed card would silently skew every engine number — reject the set instead.
const normalizeCards = (cards) => {
  if (!Array.isArray(cards)) return null;
  const list = cards.map(normalizeCardForEngine);
  return list.every(Boolean) ? list : null;
};

// A flush + straight combo draw double-counts the two straight-flush cards.
const combineOuts = (flushOuts, straightOuts) => {
  const flush = Math.max(0, Number(flushOuts) || 0);
  const straight = Math.max(0, Number(straightOuts) || 0);
  const total = flush + straight;
  return flush > 0 && straight > 0 ? Math.min(total, 15) : total;
};

const EQUITY_CAP = 92;

// Rule of 2-and-4: each out ~4% with two streets to come, ~2% with one.
const equityFromOuts = (totalOuts, phase) => {
  const outs = Math.max(0, Number(totalOuts) || 0);
  if (outs === 0) return null;
  if (phase === 'flop') return Math.min(outs * 4, EQUITY_CAP);
  if (phase === 'turn') return Math.min(outs * 2, EQUITY_CAP);
  return null; // preflop/river: no draw math to quote
};

const clamp01 = (value) => Math.min(Math.max(Number(value) || 0, 0), 1);

const computeEquity = ({ totalOuts = 0, phase, strength = 0 } = {}) => {
  const outsPct = equityFromOuts(totalOuts, phase);
  const strengthPct = Math.round(Math.min(Math.max(clamp01(strength) * 100, 3), 95));
  // A strong made hand with a stray gutshot shouldn't read as 16% — quote outs
  // only when the draw is actually the bigger share of the hand's value.
  if (outsPct !== null && outsPct >= strengthPct) {
    return { pct: Math.round(outsPct), isEstimate: false, basis: 'outs' };
  }
  return { pct: strengthPct, isEstimate: true, basis: 'strength' };
};

const computePotOdds = ({ callAmount = 0, potBeforeCall = 0 } = {}) => {
  const call = Math.max(0, Number(callAmount) || 0);
  if (call <= 0) return null;
  const pot = Math.max(0, Number(potBeforeCall) || 0);
  const potAfterCall = pot + call;
  return {
    callAmount: call,
    potAfterCall,
    neededEquityPct: Math.round((call / potAfterCall) * 1000) / 10,
  };
};

const strengthLabel = (strength, { madeHandName = null, phase = 'preflop' } = {}) => {
  const s = clamp01(strength);
  if (phase === 'preflop' || !madeHandName) {
    if (s >= 0.8) return 'Premium hold';
    if (s >= 0.62) return 'Strong hold';
    if (s >= 0.45) return 'Playable hold';
    if (s >= 0.3) return 'Marginal hold';
    return 'Weak hold';
  }
  let band;
  if (s >= 0.85) band = 'Very strong';
  else if (s >= 0.68) band = 'Strong';
  else if (s >= 0.5) band = 'Decent';
  else if (s >= 0.32) band = 'Weak';
  else band = 'Very weak';
  return `${band} — ${madeHandName}`;
};

const textureLabel = (boardTexture) => {
  if (!boardTexture) return null;
  const base = boardTexture.isWet ? 'Wet' : 'Dry';
  return boardTexture.isPaired ? `${base} · Paired` : base;
};

// --- Opponent read (client-side, observed actions only) ---

const createOpponentCounts = () => ({
  folds: 0,
  calls: 0,
  raises: 0,
  checks: 0,
  facedBet: 0,
  foldedToBet: 0,
});

const OPPONENT_ACTION_BUCKETS = {
  fold: 'folds',
  check: 'checks',
  call: 'calls',
  bet: 'raises',
  raise: 'raises',
  allin: 'raises',
};

const recordOpponentAction = (counts, action, facingBet = false) => {
  const key = String(action || '').replace(/[-_\s]/g, '').toLowerCase();
  const bucket = OPPONENT_ACTION_BUCKETS[key];
  if (!bucket) return counts; // blinds / timeouts aren't reads
  const next = { ...counts };
  next[bucket] += 1;
  if (facingBet && bucket !== 'checks') {
    next.facedBet += 1;
    if (bucket === 'folds') next.foldedToBet += 1;
  }
  return next;
};

const OPPONENT_MIN_SAMPLE = 8;

const summarizeOpponentRead = (counts) => {
  const c = counts || createOpponentCounts();
  const sampleSize = c.folds + c.calls + c.raises + c.checks;
  const aggroPct = sampleSize > 0 ? Math.round((c.raises / sampleSize) * 100) : 0;
  const foldToRaisePct = c.facedBet > 0 ? Math.round((c.foldedToBet / c.facedBet) * 100) : null;
  let style = 'reading…';
  if (sampleSize >= OPPONENT_MIN_SAMPLE) {
    if (aggroPct >= 35) style = 'aggressive';
    else if (aggroPct <= 15) style = 'passive';
    else style = 'balanced';
  }
  return { sampleSize, aggroPct, foldToRaisePct, style, minSample: OPPONENT_MIN_SAMPLE };
};

// Mirrors tableMotion's lastAction diff: one event per transition, opponents only.
// facingBet reads the PRE-action state — the table bet exceeded their committed chips.
const deriveOpponentActionEvents = (previousState, nextState, heroPlayerId) => {
  if (!previousState || !nextState) return [];
  const prevPlayers = Array.isArray(previousState.players) ? previousState.players : [];
  const nextPlayers = Array.isArray(nextState.players) ? nextState.players : [];
  const events = [];
  nextPlayers.forEach((nextPlayer) => {
    if (!nextPlayer || nextPlayer.id === heroPlayerId) return;
    const prevPlayer = prevPlayers.find((player) => player && player.id === nextPlayer.id);
    if (!prevPlayer) return;
    if (nextPlayer.lastAction && nextPlayer.lastAction !== prevPlayer.lastAction) {
      const facingBet = ((previousState.currentBet || 0) - (prevPlayer.bet || 0)) > 0;
      events.push({ playerId: nextPlayer.id, action: nextPlayer.lastAction, facingBet });
    }
  });
  return events;
};

module.exports = {
  normalizeCardForEngine,
  normalizeCards,
  combineOuts,
  equityFromOuts,
  computeEquity,
  computePotOdds,
  strengthLabel,
  textureLabel,
  createOpponentCounts,
  recordOpponentAction,
  summarizeOpponentRead,
  deriveOpponentActionEvents,
  OPPONENT_MIN_SAMPLE,
};
