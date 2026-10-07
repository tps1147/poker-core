'use strict';
// Run with node test/social.test.js. These checks protect transport attribution and expiry,
// rather than animation details: a mistaken identity can put another person's words on the hero.
const assert = require('assert');
const social = require('../src/social');
const { buildSocialContext, normalizeSocialEvent, tableSocialReducer: reduce, createSocialState,
  resolveSeatKey, getSocialDeadline, getSendCooldown, recordSocialSend } = social;
const now = 100000;
const context = buildSocialContext({ gameId: 'table', heroPlayerId: 'socket-a', heroUserId: 'account-a',
  socketId: 'socket-a', players: [{ id: 'socket-a' }, { id: 'ai_table', isAI: true }] });
const event = (kind, from, content, timestamp = now) => normalizeSocialEvent(kind,
  { gameId: 'table', from, ts: timestamp, ...content }, context, now);

assert.equal(social.REACTION_EMOJI.length, 8);
assert.equal(social.QUICK_MESSAGES.length, 8);
assert.equal(social.normalizeEmoji('\u2764'), '\u2764\uFE0F');
assert.equal(social.normalizeEmoji('hello'), null);
assert.deepEqual(social.vetQuickChat({ messageId: 'gl' }), { messageId: 'gl', text: 'Good luck!' });
assert.equal(social.vetQuickChat({ messageId: 'gl', text: 'custom text' }), null);
assert.equal(social.vetQuickChat({ messageId: 'not-a-preset', text: 'custom text' }), null);

assert.equal(event('emojiReaction', 'account-a', { emoji: '\u2764' }).seat, 'hero');
assert.equal(event('emojiReaction', 'socket-a', { emoji: '\u{1F600}' }).seat, 'hero');
assert.equal(event('quickChat', 'ai_table', { text: 'House rules: I win.' }).item.text, 'House rules: I win.');
assert.equal(event('quickChat', 'ai_table', { text: 'House rules: I win.' }).seat, 'opponent');
assert.equal(event('quickChat', 'account-a', { messageId: 'gl' }).item.text, 'Good luck!');
assert.equal(event('quickChat', 'account-a', { text: 'arbitrary human text' }), null);
assert.equal(event('emojiReaction', 'unknown', { emoji: '\u{1F600}' }), null);
assert.equal(resolveSeatKey('same', [{ key: 'hero', id: 'same' }, { key: 'opponent', aliases: ['same'] }]), null);

const multiple = buildSocialContext({ gameId: 'table', heroPlayerId: 'a', players: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });
assert.equal(resolveSeatKey('c', multiple.seats), 'seat:c');
assert.equal(resolveSeatKey('c', buildSocialContext({ gameId: 'table', heroPlayerId: 'a',
  players: { a: { id: 'a' }, c: { id: 'c' } } }).seats), 'opponent', 'object snapshots also resolve');
assert.equal(normalizeSocialEvent('emojiReaction', { gameId: 'wrong', from: 'ai_table', emoji: '\u{1F600}', ts: now }, context, now), null);
assert.equal(event('emojiReaction', 'ai_table', { emoji: '\u{1F600}' }, now - 3000), null);
assert.equal(event('quickChat', 'ai_table', { text: 'old' }, now - 5000), null);
assert.equal(event('emojiReaction', 'ai_table', { emoji: '\u{1F600}' }, 'not-a-time'), null);
assert.equal(event('emojiReaction', 'ai_table', { emoji: '\u{1F600}' }, now + 2000), null);
const muted = buildSocialContext({ ...context, seats: context.seats, communication: { chatEnabled: false, emojiReactions: false } });
assert.equal(normalizeSocialEvent('quickChat', { gameId: 'table', from: 'ai_table', text: 'mute me', ts: now }, muted, now), null);
assert.equal(normalizeSocialEvent('emojiReaction', { gameId: 'table', from: 'ai_table', emoji: '\u{1F600}', ts: now }, muted, now), null);
const blocked = { ...context, blockedSenderIds: ['ai_table'] };
assert.equal(normalizeSocialEvent('quickChat', { gameId: 'table', from: 'ai_table', text: 'blocked', ts: now }, blocked, now), null);

const laugh = event('emojiReaction', 'ai_table', { emoji: '\u{1F602}' });
let state = reduce(createSocialState(), { type: 'enqueue', event: laugh, now });
assert.equal(state.active.opponent.id, laugh.item.id);
assert.equal(getSocialDeadline(state, now), now + 1500);
assert.equal(getSocialDeadline(state, now + 2000), now + 1500, 'overdue acts still schedule cleanup');
const snapshot = JSON.stringify(state);
const duplicate = reduce(state, { type: 'enqueue', event: laugh, now: now + 10 });
assert.equal(Object.keys(duplicate.pending).length, 0, 'echo/repeated delivery is one performance');
assert.equal(JSON.stringify(state), snapshot, 'reducer does not mutate its input');
state = reduce(state, { type: 'enqueue', event: event('emojiReaction', 'ai_table', { emoji: '\u{1F525}' }), now });
state = reduce(state, { type: 'enqueue', event: event('emojiReaction', 'ai_table', { emoji: '\u{1F44D}' }), now });
state = reduce(state, { type: 'enqueue', event: event('emojiReaction', 'ai_table', { emoji: '\u{1F44F}' }), now });
assert.equal(state.pending.opponent.length, 2, 'at most two waiting expressions per seat');
assert.equal(state.pending.opponent[0].emoji, '\u{1F44D}', 'newest two survive a burst');
state = reduce(state, { type: 'tick', now: now + 1500 });
assert.equal(state.active.opponent.emoji, '\u{1F44D}');
const newerId = state.active.opponent.id;
state = reduce(state, { type: 'complete', seat: 'opponent', id: laugh.item.id, now: now + 1600 });
assert.equal(state.active.opponent.id, newerId, 'late animation cannot clear a newer expression');
state = reduce(state, { type: 'tick', now: now + 3000 });
assert.equal(state.active.opponent, undefined);
assert.equal(state.pending.opponent, undefined, 'expired waiting emotes never play over another action');

state = createSocialState();
for (let index = 0; index < 16; index += 1) {
  const item = { ...laugh.item, id: `burst-${index}`, timestamp: now + index, expiresAt: now + 3000 };
  state = reduce(state, { type: 'enqueue', event: { seat: `seat:${index}`, item }, now, blocked: true });
}
assert.equal(Object.values(state.pending).flat().length, 12, 'the whole table budget is bounded');
assert.equal(Object.keys(state.active).length, 0, 'poker priority defers social activation');
state = reduce(state, { type: 'tick', now: now + 3000, blocked: false });
assert.equal(Object.values(state.pending).flat().length, 0);
assert.equal(Object.keys(state.active).length, 0, 'deferred expired messages do not flash later');
assert.deepEqual(reduce(state, { type: 'reset' }), createSocialState());

let send = { last: null, recent: [] };
assert.equal(getSendCooldown('emojiReaction', send, now), 0);
send = recordSocialSend(send, now);
assert.equal(getSendCooldown('emojiReaction', send, now + 1199), 1);
assert.equal(getSendCooldown('emojiReaction', send, now + 1200), 0);
send = { last: now - 3000, recent: Array.from({ length: 10 }, (_, i) => now - 30000 + i * 2000) };
assert.equal(getSendCooldown('quickChat', send, now), 30000, 'minute budget outlasts the minimum gap');
assert.equal(getSendCooldown('quickChat', send, now + 30000), 0);

console.log('social catalog, explicit seat attribution, bounded playback and cooldown checks passed');
