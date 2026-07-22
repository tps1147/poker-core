// Standalone CJS extraction of the PURE rating-band math from
// Poker.com/src/game/botJourneyWorld.js. Only ROOM_RATING_BAND, deriveBandRating
// and applyRoomRatingBands (plus the tiny normalizeDifficulty helper they need)
// are pulled across — the asset/layout machinery (botJourneyAssets,
// botJourneyRoomLayouts, BOT_WORLD_ROOMS, personas, buildBotJourneyWorld) is
// deliberately left behind because it does React-Native asset require()s.

const normalizeDifficulty = (difficulty) => String(difficulty || 'BEGINNER').toUpperCase();

// ELO bands per difficulty/room. Bot ratings are DERIVED from these bands + the bot's position
// inside its room (see deriveBandRating / applyRoomRatingBands) instead of being hand-typed, so
// every higher room is both higher-ELO AND harder. The derived rating flows straight into the bot
// profile -> botConfig.rating -> server computeSkill (no server change needed).
const ROOM_RATING_BAND = Object.freeze({
  BEGINNER: { lo: 400, hi: 520 },
  INTERMEDIATE: { lo: 600, hi: 860 },
  ADVANCED: { lo: 920, hi: 1130 },
  EXPERT: { lo: 1200, hi: 1560 },
});

// Derive a single bot's rating from its room band + its position in that room. Lowest-indexed bot
// sits at band.lo, highest at band.hi, evenly spaced in between. Single-bot rooms pin to band.lo.
const deriveBandRating = (difficulty, indexInRoom = 0, roomSize = 1) => {
  const band = ROOM_RATING_BAND[normalizeDifficulty(difficulty)] || ROOM_RATING_BAND.BEGINNER;
  if (!Number.isFinite(roomSize) || roomSize <= 1) return band.lo;
  const t = Math.max(0, Math.min(1, indexInRoom / (roomSize - 1)));
  return Math.round(band.lo + (band.hi - band.lo) * t);
};

// Return a NEW bots array where each bot's `rating` is replaced by its band-derived value. Bots are
// grouped by difficulty (preserving input order = their in-room order), so this matches how
// buildBotJourneyWorld buckets bots into rooms. Used by play-bots.js so selectedBot.rating (the value
// sent in botConfig) is band-derived, and used internally so encounters show the same number.
const applyRoomRatingBands = (bots = []) => {
  const counts = new Map();
  const sizes = bots.reduce((acc, bot) => {
    const key = normalizeDifficulty(bot.difficulty);
    acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());
  return bots.map((bot) => {
    const key = normalizeDifficulty(bot.difficulty);
    const indexInRoom = counts.get(key) || 0;
    counts.set(key, indexInRoom + 1);
    return {
      ...bot,
      rating: deriveBandRating(key, indexInRoom, sizes.get(key) || 1),
    };
  });
};

module.exports = {
  ROOM_RATING_BAND,
  deriveBandRating,
  applyRoomRatingBands,
  normalizeDifficulty,
};
