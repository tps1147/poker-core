'use strict';

// One catalog for clients and the authoritative relay. Keep transport names unchanged.
const QUICK_PHRASES = Object.freeze({
  gl: 'Good luck!', gg: 'Good game!', nh: 'Nice hand!', ty: 'Thank you!',
  wp: 'Well played!', lol: 'Haha!', oops: 'Oops!', hurry: 'Hurry up!',
});
const QUICK_MESSAGES = Object.freeze(Object.entries(QUICK_PHRASES)
  .map(([id, text]) => Object.freeze({ id, text })));
const EMOJI_REACTIONS = Object.freeze([
  ['\u{1F600}', 'Smile'], ['\u{1F602}', 'Laugh'], ['\u{1F525}', 'Fire'],
  ['\u{1F62E}', 'Surprise'], ['\u{1F621}', 'Angry'], ['\u2764\uFE0F', 'Heart'],
  ['\u{1F44D}', 'Thumbs up'], ['\u{1F44F}', 'Applause'],
].map(([emoji, label]) => Object.freeze({ emoji, label })));
const REACTION_EMOJI = Object.freeze(EMOJI_REACTIONS.map(({ emoji }) => emoji));
const REACTION_SET = new Set(REACTION_EMOJI);
const LIMITS = Object.freeze({
  quickChat: Object.freeze({ minGapMs: 2000, perMinute: 10 }),
  emojiReaction: Object.freeze({ minGapMs: 1200, perMinute: 20 }),
});

function normalizeEmoji(value) {
  if (typeof value !== 'string') return null;
  const emoji = value === '\u2764' ? '\u2764\uFE0F' : value;
  return REACTION_SET.has(emoji) ? emoji : null;
}

function vetQuickChat(data) {
  if (!data || typeof data !== 'object') return null;
  const { messageId, text } = data;
  if (typeof messageId !== 'string' || !Object.prototype.hasOwnProperty.call(QUICK_PHRASES, messageId)) return null;
  const phrase = QUICK_PHRASES[messageId];
  if (text !== undefined && text !== null && text !== phrase) return null;
  return { messageId, text: phrase };
}

// Client feedback only; the server still owns the per-socket rate limit.
function getSendCooldown(kind, state = {}, now = Date.now()) {
  const limit = LIMITS[kind];
  if (!limit) return Infinity;
  const last = typeof state.last === 'number' && Number.isFinite(state.last) ? state.last : null;
  const recent = (Array.isArray(state.recent) ? state.recent : [])
    .filter((t) => Number.isFinite(t) && now - t < 60000).sort((a, b) => a - b);
  const gapWait = last === null ? 0 : Math.max(0, last + limit.minGapMs - now);
  const minuteWait = recent.length < limit.perMinute ? 0
    : Math.max(0, recent[recent.length - limit.perMinute] + 60000 - now);
  return Math.max(gapWait, minuteWait);
}

function recordSocialSend(state = {}, now = Date.now()) {
  return { last: now, recent: [...(Array.isArray(state.recent) ? state.recent : [])
    .filter((t) => Number.isFinite(t) && now - t < 60000), now] };
}

module.exports = { QUICK_PHRASES, QUICK_MESSAGES, EMOJI_REACTIONS, REACTION_EMOJI,
  LIMITS, normalizeEmoji, vetQuickChat, getSendCooldown, recordSocialSend };
