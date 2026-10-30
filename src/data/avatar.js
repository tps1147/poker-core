// THE PLAYER AVATAR (character creation, P1): what a player shows wherever a profile picture used
// to sit. A player picks a LOOK: their photo, or their character (one of four clay bodies dressed in
// parts they have earned). Art is sprites rendered from 3D; this is the data the server validates
// a saved avatar against and the one rule every client uses to decide what to draw.
//
//   AVATAR_LOOKS          ['photo', 'character']
//   AVATAR_BODIES         [{ id, name }] chip, card, dealer button, deck box
//   AVATAR_SLOTS          ['head', 'face', 'held', 'companion', 'stand']
//   AVATAR_PARTS          [{ id, name, slot, gate }]   gate = arena id the part opens with, or null
//   DEFAULT_AVATAR        { look, body, parts }
//   normalizeAvatar(x)    -> a valid avatar (unknown values fall back, wrong-slot parts drop)
//   partOpen(id, reached) -> true when the part is worn at that arena index
//   standLift(reached)    -> 0..3, how high the stand lifts the body (height follows rank, kind is chosen)
//   avatarFor(user)       -> { kind: 'character', body, parts, lift } | { kind: 'photo', image } | { kind: 'monogram' }
//
// Nothing here is sold: parts open with the climb, like the hats on Your Chip.

const { ARENAS } = require('./arenaClimb');

const AVATAR_LOOKS = Object.freeze(['photo', 'character']);

const AVATAR_BODIES = Object.freeze([
  Object.freeze({ id: 'chip', name: 'Chip' }),
  Object.freeze({ id: 'card', name: 'Card' }),
  Object.freeze({ id: 'button', name: 'Dealer button' }),
  Object.freeze({ id: 'deck', name: 'Deck box' }),
]);

const AVATAR_SLOTS = Object.freeze(['head', 'face', 'held', 'companion', 'stand']);

const AVATAR_PARTS = Object.freeze([
  Object.freeze({ id: 'crown', name: 'Crown', slot: 'head', gate: 'heart-throne' }),
  Object.freeze({ id: 'visor', name: 'Dealer visor', slot: 'head', gate: null }),
  Object.freeze({ id: 'shades', name: 'Heart shades', slot: 'face', gate: null }),
  Object.freeze({ id: 'sword', name: 'Foam sword', slot: 'held', gate: 'croquet-lawn' }),
  Object.freeze({ id: 'puppy', name: 'Chip puppy', slot: 'companion', gate: 'tea-garden' }),
  Object.freeze({ id: 'stool', name: 'Bar stool', slot: 'stand', gate: null }),
]);

const DEFAULT_AVATAR = Object.freeze({
  look: 'photo',
  body: 'chip',
  parts: Object.freeze({ head: null, face: null, held: null, companion: null, stand: null }),
});

const bodyIds = AVATAR_BODIES.map((b) => b.id);
const partById = (id) => AVATAR_PARTS.find((p) => p.id === id) || null;
const arenaIndexOf = (id) => ARENAS.findIndex((a) => a.id === id);

function normalizeAvatar(input) {
  const a = input && typeof input === 'object' ? input : {};
  const given = a.parts && typeof a.parts === 'object' ? a.parts : {};
  const parts = {};
  for (const slot of AVATAR_SLOTS) {
    const part = partById(given[slot]);
    parts[slot] = part && part.slot === slot ? part.id : null;
  }
  return {
    look: AVATAR_LOOKS.includes(a.look) ? a.look : DEFAULT_AVATAR.look,
    body: bodyIds.includes(a.body) ? a.body : DEFAULT_AVATAR.body,
    parts,
  };
}

function partOpen(id, reachedArena = 0) {
  const part = partById(id);
  if (!part) return false;
  return !part.gate || Number(reachedArena) >= arenaIndexOf(part.gate);
}

function standLift(reachedArena = 0) {
  const i = Math.max(0, Math.min(ARENAS.length - 1, Math.floor(Number(reachedArena) || 0)));
  return Math.min(3, Math.floor(i / 2));
}

/**
 * What to draw for a player. `user` is any shape a client already has: { profileImage, avatar,
 * reachedArena }. A character shows only when the player picked that look; otherwise their photo,
 * and with no photo the monogram.
 */
function avatarFor(user) {
  const u = user || {};
  if (u.avatar && u.avatar.look === 'character') {
    const a = normalizeAvatar(u.avatar);
    const reached = Number(u.reachedArena) || 0;
    const parts = {};
    for (const slot of AVATAR_SLOTS) parts[slot] = a.parts[slot] && partOpen(a.parts[slot], reached) ? a.parts[slot] : null;
    return { kind: 'character', body: a.body, parts, lift: parts.stand ? standLift(reached) : 0 };
  }
  if (typeof u.profileImage === 'string' && u.profileImage) return { kind: 'photo', image: u.profileImage };
  return { kind: 'monogram' };
}

module.exports = {
  AVATAR_LOOKS, AVATAR_BODIES, AVATAR_SLOTS, AVATAR_PARTS, DEFAULT_AVATAR,
  normalizeAvatar, partOpen, standLift, avatarFor,
};
