// Barrel for game-state normalization + mode helpers.
// Subpath entry: require('poker-core/state').

module.exports = {
  ...require('./gameModes'), // GAME_MODES, LEGACY_GAME_MODE_MAP, GAME_MODE_LABELS, normalizeGameMode, isRankedMode
  ...require('./normalizeGameState'), // normalizeGameState, normalizePlayerList
  ...require('./normalizePuzzleState'), // normalizePuzzleState
};
