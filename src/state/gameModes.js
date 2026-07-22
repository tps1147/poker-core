// Converted from ESM to CommonJS during extraction (originally
// Poker.com/src/game/gameModes.js, which also carried a UTF-8 BOM — stripped
// here). Each `export const` became a plain const + a module.exports at the end.

const GAME_MODES = Object.freeze({
  RANKED_ONLINE: 'ranked_online',
  BOT_PRACTICE: 'bot_practice',
  FRIEND_PRIVATE: 'friend_private',
});

const LEGACY_GAME_MODE_MAP = Object.freeze({
  ranked: GAME_MODES.RANKED_ONLINE,
  online: GAME_MODES.RANKED_ONLINE,
  queue: GAME_MODES.RANKED_ONLINE,
  casual: GAME_MODES.RANKED_ONLINE,
  bot: GAME_MODES.BOT_PRACTICE,
  solo: GAME_MODES.BOT_PRACTICE,
  practice: GAME_MODES.BOT_PRACTICE,
  private: GAME_MODES.FRIEND_PRIVATE,
  friend: GAME_MODES.FRIEND_PRIVATE,
  friend_private: GAME_MODES.FRIEND_PRIVATE,
});

const GAME_MODE_LABELS = Object.freeze({
  [GAME_MODES.RANKED_ONLINE]: 'Ranked Online',
  [GAME_MODES.BOT_PRACTICE]: 'Bot Practice',
  [GAME_MODES.FRIEND_PRIVATE]: 'Private Game',
});

const normalizeGameMode = (mode, fallback = GAME_MODES.RANKED_ONLINE) => {
  if (!mode) return fallback;

  const normalized = String(mode).trim();
  if (Object.values(GAME_MODES).includes(normalized)) {
    return normalized;
  }

  return LEGACY_GAME_MODE_MAP[normalized.toLowerCase()] || fallback;
};

const isRankedMode = (mode) => normalizeGameMode(mode) === GAME_MODES.RANKED_ONLINE;

module.exports = {
  GAME_MODES,
  LEGACY_GAME_MODE_MAP,
  GAME_MODE_LABELS,
  normalizeGameMode,
  isRankedMode,
};
