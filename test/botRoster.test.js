// Canonical bot roster: shape, id hygiene, derived ratings and lookups.
// The SERVER trusts this list to decide whether a match happened at all and how strong
// the opponent was, so every invariant it relies on is asserted here.
//   node test/botRoster.test.js

const assert = require('assert');

const {
  BOT_ROSTER,
  BOT_ROSTER_BY_ID,
  getBotById,
  isKnownBotId,
} = require('../src/data/botRoster');
const { deriveBandRating, ROOM_RATING_BAND } = require('../src/rating/ratingBands');

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const ID_REGEX = /^[a-z0-9][a-z0-9_-]*$/;

// 1) The ladder is exactly 16 bots.
assert.ok(Array.isArray(BOT_ROSTER), 'BOT_ROSTER is an array');
assert.strictEqual(BOT_ROSTER.length, 16, 'the roster holds 16 bots');

// 2) Ids are unique, slug-shaped, and every bot carries the fields the progression
//    model reads (name/archetype/difficulty/room/indexInRoom/rating).
const ids = BOT_ROSTER.map((bot) => bot.id);
assert.strictEqual(new Set(ids).size, ids.length, 'every bot id is unique');

BOT_ROSTER.forEach((bot) => {
  assert.ok(ID_REGEX.test(bot.id), `bot id "${bot.id}" is a safe slug`);
  assert.strictEqual(typeof bot.name, 'string', `${bot.id} has a name`);
  assert.ok(bot.name.length > 0, `${bot.id} name is non-empty`);
  assert.strictEqual(typeof bot.archetype, 'string', `${bot.id} has an archetype`);
  assert.ok(DIFFICULTIES.includes(bot.difficulty), `${bot.id} difficulty is a known room tier`);
  assert.strictEqual(typeof bot.room, 'string', `${bot.id} names its room`);
  assert.ok(Number.isInteger(bot.indexInRoom) && bot.indexInRoom >= 0, `${bot.id} has an in-room index`);
  assert.ok(Number.isFinite(bot.rating), `${bot.id} rating is finite`);
  assert.ok(bot.unlockCondition && typeof bot.unlockCondition.type === 'string',
    `${bot.id} carries an unlockCondition (milestone math reads it)`);
});

// 3) Ratings are DERIVED from the room bands, not typed: they ascend inside each room,
//    start at band.lo and end at band.hi, and equal deriveBandRating for that slot.
DIFFICULTIES.forEach((difficulty) => {
  const room = BOT_ROSTER.filter((bot) => bot.difficulty === difficulty);
  assert.ok(room.length > 0, `${difficulty} room is populated`);

  room.forEach((bot, index) => {
    assert.strictEqual(bot.indexInRoom, index, `${bot.id} sits at index ${index} of its room`);
    assert.strictEqual(
      bot.rating,
      deriveBandRating(difficulty, index, room.length),
      `${bot.id} rating is the band-derived value`
    );
    if (index > 0) {
      assert.ok(bot.rating > room[index - 1].rating, `${bot.id} out-rates the bot below it`);
    }
  });

  assert.strictEqual(room[0].rating, ROOM_RATING_BAND[difficulty].lo, `${difficulty} opens at band.lo`);
  assert.strictEqual(
    room[room.length - 1].rating,
    ROOM_RATING_BAND[difficulty].hi,
    `${difficulty} tops out at band.hi`
  );
});

// Rooms themselves ascend: the weakest EXPERT still out-rates the strongest ADVANCED.
for (let i = 1; i < DIFFICULTIES.length; i += 1) {
  const lower = BOT_ROSTER.filter((b) => b.difficulty === DIFFICULTIES[i - 1]);
  const higher = BOT_ROSTER.filter((b) => b.difficulty === DIFFICULTIES[i]);
  assert.ok(
    higher[0].rating > lower[lower.length - 1].rating,
    `${DIFFICULTIES[i]} starts above ${DIFFICULTIES[i - 1]}`
  );
}

// 4) Lookups. getBotById returns the SAME frozen object the array holds; anything not on
//    the ladder is undefined (never a default bot) and isKnownBotId rejects junk.
assert.strictEqual(getBotById('rookie-bob'), BOT_ROSTER[0], 'getBotById returns the roster entry');
assert.strictEqual(getBotById('the-house').difficulty, 'EXPERT', 'the final boss is EXPERT');
assert.strictEqual(Object.keys(BOT_ROSTER_BY_ID).length, 16, 'the id map covers every bot');
BOT_ROSTER.forEach((bot) => {
  assert.strictEqual(BOT_ROSTER_BY_ID[bot.id], bot, `${bot.id} is indexed in BOT_ROSTER_BY_ID`);
  assert.strictEqual(isKnownBotId(bot.id), true, `${bot.id} is a known bot`);
});

[
  'bot-nit', 'ROOKIE-BOB', 'rookie bob', '', 'constructor', '__proto__', 'toString',
  null, undefined, 42, {}, [], { id: 'rookie-bob' },
].forEach((junk) => {
  assert.strictEqual(getBotById(junk), undefined, `getBotById(${String(junk)}) is undefined`);
  assert.strictEqual(isKnownBotId(junk), false, `isKnownBotId(${String(junk)}) is false`);
});

// 5) The roster is immutable — a consumer cannot bolt a fake bot on at runtime.
assert.ok(Object.isFrozen(BOT_ROSTER), 'BOT_ROSTER is frozen');
assert.ok(Object.isFrozen(BOT_ROSTER[0]), 'roster entries are frozen');

console.log('botRoster checks passed');

// stats are carried so the SERVER can canonicalize how a bot plays (not just what it's
// rated). Without them a client could claim a boss's identity, hand it a pushover's
// play style, and farm the rating — see canonicalizeBotConfig in pokerServer.
BOT_ROSTER.forEach((bot) => {
  assert.ok(bot.stats, `${bot.id} has stats`);
  assert.ok(Number.isFinite(bot.stats.vpip) && bot.stats.vpip > 0 && bot.stats.vpip <= 100, `${bot.id} vpip sane`);
  assert.ok(Number.isFinite(bot.stats.pfr) && bot.stats.pfr >= 0 && bot.stats.pfr <= bot.stats.vpip, `${bot.id} pfr <= vpip`);
  assert.ok(Number.isFinite(bot.stats.aggression) && bot.stats.aggression > 0, `${bot.id} aggression sane`);
});
console.log('botRoster stats checks passed');
