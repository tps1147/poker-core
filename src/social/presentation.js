'use strict';

const { normalizeEmoji, vetQuickChat } = require('./catalog');
const { resolveSeatKey } = require('./seatIdentity');

const SOCIAL_FRESHNESS_MS = Object.freeze({ emoji: 3000, speech: 5000 });
const SOCIAL_DURATION_MS = Object.freeze({ emoji: 1500, speech: 4000 });
const SOCIAL_QUEUE_LIMITS = Object.freeze({ perSeat: 2, table: 12, seen: 64 });

/** Normalize received, server-authored events; this never emits or changes poker state. */
function normalizeSocialEvent(kind, payload, context, now = Date.now()) {
  if (!payload || !context?.gameId || String(payload.gameId) !== context.gameId) return null;
  const itemKind = kind === 'emojiReaction' || kind === 'emoji' ? 'emoji'
    : kind === 'quickChat' || kind === 'speech' ? 'speech' : null;
  if (!itemKind || (itemKind === 'emoji' ? context.enabled?.reactions === false : context.enabled?.chat === false)) return null;
  const from = payload.from == null ? null : String(payload.from);
  if (!from || context.blockedSenderIds?.includes(from)) return null;
  const seat = resolveSeatKey(from, context.seats);
  if (!seat) return null;
  const seatData = context.seats.find((candidate) => candidate.key === seat);
  let content;
  if (itemKind === 'emoji') content = normalizeEmoji(payload.emoji);
  else if (seatData?.isBot) content = typeof payload.text === 'string' ? payload.text.trim().slice(0, 200) : null;
  else content = vetQuickChat(payload)?.text;
  if (!content) return null;
  // No timestamp is a receive-time legacy event. Invalid/far-future times are dropped.
  const timestamp = payload.ts == null ? now : payload.ts;
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp > now + 1000) return null;
  const expiresAt = timestamp + SOCIAL_FRESHNESS_MS[itemKind];
  if (expiresAt <= now) return null;
  // messageId identifies a preset, not a unique delivery. Heart aliases dedupe together.
  const id = JSON.stringify([context.gameId, from, itemKind, payload.ts ?? null, content]);
  const item = { id, key: id, kind: itemKind, from, timestamp, expiresAt,
    ...(itemKind === 'emoji' ? { emoji: content } : { text: content }) };
  return { seat, seatKey: seat, item };
}

function createSocialState() { return { active: {}, pending: {}, seen: {} }; }

function cloneState(state) {
  return { active: { ...state.active },
    pending: Object.fromEntries(Object.entries(state.pending).map(([seat, items]) => [seat, [...items]])),
    seen: { ...state.seen } };
}

function refresh(next, now, blocked) {
  for (const [id, expiresAt] of Object.entries(next.seen)) {
    if (expiresAt <= now) delete next.seen[id];
  }
  for (const seat of new Set([...Object.keys(next.active), ...Object.keys(next.pending)])) {
    if (next.active[seat] && next.active[seat].endsAt <= now) delete next.active[seat];
    const pending = (next.pending[seat] || []).filter((item) => item.expiresAt > now);
    if (!blocked && !next.active[seat] && pending.length) {
      const item = pending.shift();
      next.active[seat] = { ...item, startedAt: now,
        endsAt: Math.min(item.expiresAt, now + SOCIAL_DURATION_MS[item.kind]) };
    }
    if (pending.length) next.pending[seat] = pending;
    else delete next.pending[seat];
  }
  return next;
}

/** Poker/reveal priority sets blocked: expiry continues, activation waits briefly. */
function tableSocialReducer(state = createSocialState(), action = {}) {
  if (action.type === 'reset') return createSocialState();
  const now = action.now ?? Date.now();
  const next = cloneState(state);
  if (action.type === 'complete') {
    // Old animation callbacks cannot clear a newer act.
    if (next.active[action.seat]?.id === action.id) delete next.active[action.seat];
  }
  refresh(next, now, action.blocked === true);
  if (action.type === 'enqueue') {
    const { seat, seatKey, item } = action.event || {};
    const key = seat || seatKey;
    if (!key || !item?.id || !(item.expiresAt > now) || next.seen[item.id]) return next;
    next.seen[item.id] = item.expiresAt;
    const seen = Object.entries(next.seen);
    if (seen.length > SOCIAL_QUEUE_LIMITS.seen) {
      seen.sort((a, b) => a[1] - b[1]);
      for (const [id] of seen.slice(0, seen.length - SOCIAL_QUEUE_LIMITS.seen)) delete next.seen[id];
    }
    next.pending[key] = [...(next.pending[key] || []), item].slice(-SOCIAL_QUEUE_LIMITS.perSeat);
    // Global budget: preserve the newest pending items across explicitly resolved seats.
    let all = Object.entries(next.pending).flatMap(([seatName, items]) => items.map((entry) => ({ seat: seatName, item: entry })));
    while (all.length > SOCIAL_QUEUE_LIMITS.table) {
      all.sort((a, b) => a.item.timestamp - b.item.timestamp);
      const oldest = all.shift();
      next.pending[oldest.seat] = next.pending[oldest.seat].filter((entry) => entry.id !== oldest.item.id);
    }
    refresh(next, now, action.blocked === true);
  }
  return next;
}

function socialPresentation(state) { return state?.active || {}; }
function getSocialDeadline(state, now = Date.now()) {
  const deadlines = [...Object.values(state?.active || {}).map((item) => item.endsAt),
    ...Object.values(state?.pending || {}).flat().map((item) => item.expiresAt),
    ...Object.values(state?.seen || {})].filter(Number.isFinite);
  return deadlines.length ? Math.min(...deadlines) : null;
}

module.exports = { SOCIAL_FRESHNESS_MS, SOCIAL_DURATION_MS, SOCIAL_QUEUE_LIMITS,
  normalizeSocialEvent, createSocialState, tableSocialReducer, socialPresentation, getSocialDeadline };
