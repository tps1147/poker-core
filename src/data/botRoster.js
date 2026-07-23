// CANONICAL BOT ROSTER — the server-side source of truth for "which bots exist".
//
// Standalone CJS extraction of the PURE data half of
// Poker.com/src/game/botProfiles.js (BOT_PROFILES). The avatar `require('../assets/...')`
// lines are deliberately NOT copied — those React-Native asset requires are the only
// reason BOT_PROFILES could not already be shared (see archetypeScout.js, which pulled
// the archetype metadata across for the same reason). Flavor-only fields (personality,
// description, badge, country, avatar) are left behind.
//
// `stats` (vpip/pfr/aggression) ARE carried: they tune how a bot plays, and the server
// canonicalizes them from here at game creation. Without that, a client could request a
// high-rated bot's identity but hand it a pushover's play style and farm the rating.
//
// WHY THIS EXISTS: pokerServer computes bot-journey progression (ELO / mastery /
// milestones) at match end. Before this module the server had to take the opponent's
// identity AND strength from the client-supplied `botConfig`, so a client could claim it
// had just beaten a 1560-rated boss. The server now resolves the opponent from THIS
// roster by id and ignores every strength field the client sent; an unknown id earns
// nothing at all. That also bounds the key space of the persisted per-bot maps to these
// 16 ids.
//
// RATINGS ARE DERIVED, NOT TYPED. Each bot's `rating` comes from this package's own
// rating/ratingBands.deriveBandRating(difficulty, indexInRoom, roomSize), grouping bots
// by difficulty in BOT_PROFILES order — exactly what applyRoomRatingBands does. So the
// number the server scores a match with is the same number The Gauntlet map shows.

const { deriveBandRating, normalizeDifficulty } = require('../rating/ratingBands');

// Journey rooms, keyed by difficulty (mirrors BOT_WORLD_ROOMS in botJourneyWorld.js —
// id/name only, none of the scene/layout data, which is asset-bound).
const ROOM_BY_DIFFICULTY = Object.freeze({
  BEGINNER: Object.freeze({ id: 'clubshire-grove', name: 'Clubshire' }),
  INTERMEDIATE: Object.freeze({ id: 'diamond-chip-mine', name: 'Chip Mine' }),
  ADVANCED: Object.freeze({ id: 'spade-keep', name: 'Spade Keep' }),
  EXPERT: Object.freeze({ id: 'heart-final-carnival', name: 'Final Table' }),
});

// The 16-bot ladder in BOT_PROFILES order (4 per room). `unlockCondition` / `isUnlocked`
// are carried across verbatim because rating/journeyProgress.js reads them to compute
// mastery targets, bot_unlocked / room_cleared / journey_complete milestones.
const BOT_PROFILE_DATA = Object.freeze([
  // ---------------- BEGINNER ♣ Clubshire (4) ----------------
  {
    id: 'rookie-bob',
    name: 'Rookie Bob',
    difficulty: 'BEGINNER',
    archetype: 'calling-station',
    isUnlocked: true,
    unlockCondition: { type: 'default' },
    learningTieIn: 'Starting hands and pot control',
    stats: { vpip: 65, pfr: 15, aggression: 0.8 },
  },
  {
    id: 'slow-steve',
    name: 'Slow Steve',
    difficulty: 'BEGINNER',
    archetype: 'nit',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'rookie-bob', count: 2 },
    learningTieIn: 'Bet sizing basics',
    stats: { vpip: 30, pfr: 12, aggression: 0.9 },
  },
  {
    id: 'lucky-larry',
    name: 'Lucky Larry',
    difficulty: 'BEGINNER',
    archetype: 'drawer',
    isUnlocked: false,
    unlockCondition: { type: 'practiceWins', count: 4 },
    learningTieIn: 'Drawing odds',
    stats: { vpip: 55, pfr: 25, aggression: 1.5 },
  },
  {
    id: 'friendly-frank',
    name: 'Friendly Frank',
    difficulty: 'BEGINNER',
    archetype: 'calling-station',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'lucky-larry', count: 2 },
    learningTieIn: 'Value betting',
    stats: { vpip: 70, pfr: 8, aggression: 0.6 },
  },

  // ---------------- INTERMEDIATE ♦ Chip Mine (4) ----------------
  {
    id: 'cautious-claire',
    name: 'Cautious Claire',
    difficulty: 'INTERMEDIATE',
    archetype: 'nit',
    isUnlocked: false,
    unlockCondition: { type: 'difficultyWins', difficulty: 'BEGINNER', count: 8 },
    learningTieIn: 'Opening ranges',
    stats: { vpip: 22, pfr: 18, aggression: 1.2 },
  },
  {
    id: 'solid-sarah',
    name: 'Solid Sarah',
    difficulty: 'INTERMEDIATE',
    archetype: 'tag',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'cautious-claire', count: 3 },
    learningTieIn: 'Board texture',
    stats: { vpip: 28, pfr: 22, aggression: 2.1 },
  },
  {
    id: 'tricky-tom',
    name: 'Tricky Tom',
    difficulty: 'INTERMEDIATE',
    archetype: 'trapper',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'solid-sarah', count: 3 },
    learningTieIn: 'Bluff catching',
    stats: { vpip: 26, pfr: 20, aggression: 2.5 },
  },
  {
    id: 'aggressive-alex',
    name: 'Aggressive Alex',
    difficulty: 'INTERMEDIATE',
    archetype: 'lag',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'tricky-tom', count: 3 },
    learningTieIn: 'Defense against aggression',
    stats: { vpip: 32, pfr: 28, aggression: 3.2 },
  },

  // ---------------- ADVANCED ♠ Spade Keep (4) ----------------
  {
    id: 'position-pete',
    name: 'Position Pete',
    difficulty: 'ADVANCED',
    archetype: 'tag',
    isUnlocked: false,
    unlockCondition: { type: 'difficultyWins', difficulty: 'INTERMEDIATE', count: 12 },
    learningTieIn: 'Position and initiative',
    stats: { vpip: 30, pfr: 24, aggression: 2.7 },
  },
  {
    id: 'mathematical-mike',
    name: 'Mathematical Mike',
    difficulty: 'ADVANCED',
    archetype: 'shark',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'position-pete', count: 4 },
    learningTieIn: 'Pot odds and equity',
    stats: { vpip: 24, pfr: 19, aggression: 2.3 },
  },
  {
    id: 'iron-warden',
    name: 'Iron Warden',
    difficulty: 'ADVANCED',
    archetype: 'shark',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'mathematical-mike', count: 4 },
    learningTieIn: 'Value vs bluff balance',
    stats: { vpip: 23, pfr: 18, aggression: 2.4 },
  },
  {
    id: 'shade-stalker',
    name: 'Shade Stalker',
    difficulty: 'ADVANCED',
    archetype: 'trapper',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'iron-warden', count: 4 },
    learningTieIn: 'Reading traps',
    stats: { vpip: 25, pfr: 19, aggression: 2.6 },
  },

  // ---------------- EXPERT ♥ Final Table (4) ----------------
  {
    id: 'gem-golem',
    name: 'Gem Golem',
    difficulty: 'EXPERT',
    archetype: 'shark',
    isUnlocked: false,
    unlockCondition: { type: 'difficultyWins', difficulty: 'ADVANCED', count: 12 },
    learningTieIn: 'Pot geometry',
    stats: { vpip: 22, pfr: 18, aggression: 2.5 },
  },
  {
    id: 'neon-jester',
    name: 'Neon Jester',
    difficulty: 'EXPERT',
    archetype: 'lag',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'gem-golem', count: 5 },
    learningTieIn: 'Defending vs aggression',
    stats: { vpip: 38, pfr: 32, aggression: 3.6 },
  },
  {
    id: 'mirage',
    name: 'Mirage',
    difficulty: 'EXPERT',
    archetype: 'trapper',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'neon-jester', count: 5 },
    learningTieIn: 'Range awareness',
    stats: { vpip: 24, pfr: 19, aggression: 2.8 },
  },
  {
    id: 'the-house',
    name: 'The House',
    difficulty: 'EXPERT',
    archetype: 'shark',
    isUnlocked: false,
    unlockCondition: { type: 'botWins', botId: 'mirage', count: 5 },
    learningTieIn: 'Closing out a match',
    stats: { vpip: 21, pfr: 17, aggression: 2.6 },
  },
]);

// Bucket by difficulty PRESERVING input order — the same grouping applyRoomRatingBands
// uses, so indexInRoom/roomSize (and therefore the derived rating) match the client.
const buildRoster = (profiles) => {
  const sizes = profiles.reduce((acc, bot) => {
    const key = normalizeDifficulty(bot.difficulty);
    acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());
  const seen = new Map();

  return Object.freeze(profiles.map((bot) => {
    const difficulty = normalizeDifficulty(bot.difficulty);
    const indexInRoom = seen.get(difficulty) || 0;
    seen.set(difficulty, indexInRoom + 1);
    const roomSize = sizes.get(difficulty) || 1;
    const room = ROOM_BY_DIFFICULTY[difficulty] || ROOM_BY_DIFFICULTY.BEGINNER;

    return Object.freeze({
      ...bot,
      unlockCondition: Object.freeze({ ...bot.unlockCondition }),
      difficulty,
      room: room.id,
      roomName: room.name,
      indexInRoom,
      roomSize,
      // DERIVED at module load — never hand-typed. Same call the client makes.
      rating: deriveBandRating(difficulty, indexInRoom, roomSize),
    });
  }));
};

const BOT_ROSTER = buildRoster(BOT_PROFILE_DATA);

const BOT_ROSTER_BY_ID = Object.freeze(BOT_ROSTER.reduce((acc, bot) => {
  acc[bot.id] = bot;
  return acc;
}, Object.create(null)));

// Lookup by id. Returns undefined for anything not on the ladder — callers are expected
// to treat that as "no such opponent" rather than substituting a default.
const getBotById = (botId) => (
  typeof botId === 'string' ? BOT_ROSTER_BY_ID[botId] : undefined
);

const isKnownBotId = (botId) => getBotById(botId) !== undefined;

module.exports = {
  BOT_ROSTER,
  BOT_ROSTER_BY_ID,
  ROOM_BY_DIFFICULTY,
  getBotById,
  isKnownBotId,
};
