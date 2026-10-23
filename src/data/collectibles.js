// THE CASE: everything a player can collect in 2.0 ("The World"). Nothing here is sold; every item
// is earned by play, has a story and a rarity, and shows only in its own table slot.
//
// Kinds and the slots they equip into:
//   back       card back (slot "back")            arena I-VIII, feats, Crown Hour, seasons
//   protector  the card guard on your hole cards (slot "protector")
//   button     the dealer button skin (slot "button")
//   felt       the felt tint at your tables (slot "felt")
//   medal      shown on the Player Card only (no table slot)
//   title      the line under your name on the Player Card (slot "title")
//
// Arena backs keep the existing card-back ids (rabbits-burrow ... heart-throne), so a stored
// `cardBack` maps 1:1 onto `equipped.back`. Every other id is "<kind>-<name>".
//
// unlock rules ({ type, ... }):
//   default                      owned from the start
//   arena    { arenaIndex }      reaching that arena (the gate, Q4 of the one below)
//   quarter  { arenaIndex, quarter }   closing that quarter of the arena's seal (1 felt, 2 protector, 3 title)
//   feat     { feat }            a feat (first promotion, a heater, a sharp placement, ...)
//   event    { event, place? }   an event finish (Crown Hour)
//   season   { season, arenaIndex? }   a season finish
//   arc      { track, step }     a step on the achievement arc (achievementArc.js)
//   gauntlet { character }       beating a Gauntlet character
//
// story templates fill {date}, {arena}, {opponent}, {place}, {season} (storyFor).

const { ARENAS } = require('./arenaClimb');

const KINDS = Object.freeze(['back', 'protector', 'button', 'felt', 'medal', 'title']);
const SLOTS = Object.freeze(['back', 'protector', 'button', 'felt', 'title']);
const RARITIES = Object.freeze(['common', 'rare', 'epic', 'legendary']);

const ARENA_RARITY = ['common', 'common', 'common', 'rare', 'rare', 'epic', 'epic', 'legendary'];

function item(id, kind, name, rarity, unlock, story) {
  return Object.freeze({ id, kind, name, rarity, unlock: Object.freeze(unlock), story });
}

const ARENA_ITEMS = ARENAS.flatMap((a, i) => [
  item(a.id, 'back', `${a.name} back`, ARENA_RARITY[i],
    i === 0 ? { type: 'default', arenaIndex: 0 } : { type: 'arena', arenaIndex: i },
    i === 0 ? 'Where every climb starts.' : 'Earned {date}, walking into {arena}.'),
  item(`felt-${a.id}`, 'felt', `${a.name} felt`, ARENA_RARITY[i], { type: 'quarter', arenaIndex: i, quarter: 1 },
    'The first quarter of {arena}, closed {date}.'),
  item(`protector-${a.id}`, 'protector', `${a.name} protector`, ARENA_RARITY[i], { type: 'quarter', arenaIndex: i, quarter: 2 },
    'Half of {arena} closed {date}.'),
  item(`title-${a.id}`, 'title', `Of ${a.name}`, ARENA_RARITY[i], { type: 'quarter', arenaIndex: i, quarter: 3 },
    'Three quarters of {arena}, {date}.'),
]);

const OTHER_ITEMS = [
  // Feat backs.
  item('back-first-gate', 'back', 'First Gate', 'rare', { type: 'feat', feat: 'first-promotion' }, 'Your first gate, {date}.'),
  item('back-heater', 'back', 'Heater', 'rare', { type: 'feat', feat: 'heater-5' }, 'Five good matches in a row, {date}.'),
  item('back-sharp-placement', 'back', 'Sharp Start', 'epic', { type: 'feat', feat: 'placement-sharp' }, 'Placed with a sharp hand, {date}.'),
  item('back-giant-killer', 'back', 'Giant Killer', 'epic', { type: 'feat', feat: 'beat-higher-arena' }, 'Beat {opponent}, two arenas up, {date}.'),
  // Event and season backs.
  item('back-crown-hour', 'back', 'Crown Hour', 'epic', { type: 'event', event: 'crown-hour', place: 1 }, 'Won Crown Hour, {date}.'),
  item('back-season-1', 'back', 'Season One', 'rare', { type: 'season', season: 1 }, 'Played Season {season}.'),
  item('back-season-1-throne', 'back', 'Season One Crown', 'legendary', { type: 'season', season: 1, arenaIndex: 7 }, 'Finished Season {season} at the Throne.'),
  // Dealer buttons.
  item('button-classic', 'button', 'Classic button', 'common', { type: 'default' }, 'The house button.'),
  item('button-brass', 'button', 'Brass button', 'rare', { type: 'arc', track: 'craft', step: 3 }, 'Earned on the Craft track, {date}.'),
  item('button-crown', 'button', 'Crown button', 'legendary', { type: 'event', event: 'crown-hour', place: 1 }, 'Crown Hour champion, {date}.'),
  item('button-rival', 'button', 'Rival button', 'rare', { type: 'arc', track: 'rivals', step: 3 }, 'Earned on the Rivals track, {date}.'),
  // Base felt and protector.
  item('felt-house', 'felt', 'House felt', 'common', { type: 'default' }, 'The house cloth.'),
  item('protector-none', 'protector', 'No protector', 'common', { type: 'default' }, ''),
  // Medals (Player Card only).
  item('medal-crown-gold', 'medal', 'Crown Hour gold', 'legendary', { type: 'event', event: 'crown-hour', place: 1 }, '1st of {place}, Crown Hour, {date}.'),
  item('medal-crown-silver', 'medal', 'Crown Hour silver', 'epic', { type: 'event', event: 'crown-hour', place: 2 }, '2nd, Crown Hour, {date}.'),
  item('medal-crown-bronze', 'medal', 'Crown Hour bronze', 'rare', { type: 'event', event: 'crown-hour', place: 3 }, '3rd, Crown Hour, {date}.'),
  item('medal-sixmax-podium', 'medal', 'Six-max podium', 'rare', { type: 'feat', feat: 'sixmax-podium' }, 'On the podium at six-max, {date}.'),
  item('medal-placement', 'medal', 'Placed', 'common', { type: 'feat', feat: 'placement-done' }, 'Ten placement matches, {date}.'),
  item('medal-throne', 'medal', 'The Throne', 'legendary', { type: 'arena', arenaIndex: 7 }, 'Reached the Heart Throne, {date}.'),
  // Base title.
  item('title-none', 'title', 'No title', 'common', { type: 'default' }, ''),
];

const COLLECTIBLES = Object.freeze([...ARENA_ITEMS, ...OTHER_ITEMS]);
const BY_ID = new Map(COLLECTIBLES.map((c) => [c.id, c]));

const DEFAULT_EQUIPPED = Object.freeze({
  back: 'rabbits-burrow',
  protector: 'protector-none',
  button: 'button-classic',
  felt: 'felt-house',
  title: 'title-none',
});

function collectibleById(id) {
  return BY_ID.get(id) || null;
}

function collectiblesOfKind(kind) {
  return COLLECTIBLES.filter((c) => c.kind === kind);
}

// The slot an item equips into, or null (medals show on the Player Card only).
function slotFor(id) {
  const c = collectibleById(id);
  return c && SLOTS.includes(c.kind) ? c.kind : null;
}

// Every item owned from the start.
function defaultCollection() {
  return COLLECTIBLES.filter((c) => c.unlock.type === 'default').map((c) => c.id);
}

// The items a seal change grants (sealChange() from arenaClimb.js): each quarter crossed grants
// that arena's felt, protector or title, and each gate grants the next arena's back (plus the
// Throne medal at the top). Order follows the climb.
function unlocksForSeal(change) {
  if (!change || !Array.isArray(change.quartersCrossed)) return [];
  const out = [];
  for (const { arenaIndex, quarter } of change.quartersCrossed) {
    for (const c of COLLECTIBLES) {
      const u = c.unlock;
      if (u.type === 'quarter' && u.arenaIndex === arenaIndex && u.quarter === quarter) out.push(c.id);
      if (quarter === 4 && u.type === 'arena' && u.arenaIndex === arenaIndex + 1) out.push(c.id);
    }
  }
  // Arriving at the Throne also closes its ring at once (sealFor reads it gold and full).
  if (change.after && change.after.gold && !(change.before && change.before.gold)) {
    const top = ARENAS.length - 1;
    for (const c of COLLECTIBLES) {
      if (c.unlock.type === 'quarter' && c.unlock.arenaIndex === top && !out.includes(c.id)) out.push(c.id);
    }
  }
  return out;
}

// Items unlocked by a matching rule ({ type: 'feat', feat } / { type: 'event', event, place } / ...).
function unlocksFor(rule) {
  if (!rule || !rule.type) return [];
  return COLLECTIBLES.filter((c) => {
    const u = c.unlock;
    if (u.type !== rule.type) return false;
    return Object.keys(u).every((k) => k === 'type' || u[k] === rule[k]);
  }).map((c) => c.id);
}

function storyFor(id, ctx = {}) {
  const c = collectibleById(id);
  if (!c || !c.story) return '';
  const vars = { ...ctx };
  if (vars.arena == null && Number.isInteger(c.unlock.arenaIndex)) vars.arena = ARENAS[c.unlock.arenaIndex].name;
  if (vars.season == null && c.unlock.season != null) vars.season = String(c.unlock.season);
  return c.story.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m)).replace(/,? ?\{\w+\}/g, '').trim();
}

module.exports = {
  COLLECTIBLE_KINDS: KINDS,
  EQUIP_SLOTS: SLOTS,
  RARITIES,
  COLLECTIBLES,
  DEFAULT_EQUIPPED,
  collectibleById,
  collectiblesOfKind,
  slotFor,
  defaultCollection,
  unlocksForSeal,
  unlocksFor,
  storyFor,
};
