// Converted from ESM to CommonJS during extraction (originally
// Poker.com/src/game/normalizeGameState.js, which had a UTF-8 BOM on line 1 —
// stripped here). The `import ./gameModes` became a require; `export const`
// became plain consts + a module.exports at the end. Logic is unchanged.

const { GAME_MODES, normalizeGameMode } = require('./gameModes');

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const normalizeActions = (rawActions = {}, player = {}, state = {}) => {
  const toCall = Math.max((state.currentBet || 0) - (player.bet || 0), 0);
  const chips = player.chips || 0;
  const minimumRaise = firstDefined(rawActions.minimumRaise, rawActions.minRaise, state.minimumRaise, state.blinds?.big, 20);
  const maxRaise = firstDefined(rawActions.maxRaise, rawActions.maximumRaise, chips, 0);

  return {
    canFold: firstDefined(rawActions.canFold, toCall > 0, true),
    canCheck: firstDefined(rawActions.canCheck, toCall === 0, false),
    canCall: firstDefined(rawActions.canCall, toCall > 0 && chips > 0, false),
    canRaise: firstDefined(rawActions.canRaise, rawActions.canBet, chips > toCall, false),
    minimumRaise,
    maxRaise,
    toCall,
  };
};

const normalizePlayerList = (players) => asArray(players).map((player) => ({
  ...player,
  id: player.id || player._id || player.userId || player.socketId,
  username: player.username || player.name || player.displayName || 'Player',
  bet: player.bet || player.currentBet || 0,
  chips: player.chips || player.stack || 0,
  cards: player.cards || player.hand || [],
}));

const normalizeGameState = (rawState, options = {}) => {
  const raw = rawState || {};
  const players = normalizePlayerList(raw.players);
  const playerId = options.playerId || raw.playerId || raw.heroId;
  const hero = players.find((player) => player.id === playerId) || null;
  const opponent = players.find((player) => player.id !== playerId) || null;
  const board = raw.board || raw.communityCards || [];
  const mode = normalizeGameMode(
    raw.mode || raw.gameMode || raw.gameType || options.mode,
    options.defaultMode || GAME_MODES.RANKED_ONLINE
  );
  const phase = raw.phase || raw.currentPhase || 'waiting';
  const currentTurn = raw.currentTurn || raw.currentPlayerId || raw.activePlayerId || null;
  const legalActions = normalizeActions(raw.legalActions || raw.availableActions, hero || {}, raw);

  return {
    id: raw.gameId || raw.id || options.gameId || null,
    handId: raw.handId || raw.currentHandId || null,
    handNumber: raw.handNumber || raw.handNo || null,
    mode,
    players,
    hero,
    opponent,
    phase,
    currentPhase: phase,
    board,
    communityCards: board,
    pot: raw.pot || raw.totalPot || 0,
    currentBet: raw.currentBet || 0,
    legalActions,
    availableActions: legalActions,
    currentTurn,
    isHeroTurn: !!hero && currentTurn === hero.id,
    dealer: raw.dealer || raw.dealerId || null,
    blinds: raw.blinds || { small: raw.smallBlind || 10, big: raw.bigBlind || 20 },
    timers: raw.timers || raw.turnTimer || null,
    lastAction: raw.lastAction || raw.lastPlayerAction || null,
    result: raw.result || raw.gameResult || raw.handResult || null,
    raw,
  };
};

module.exports = {
  normalizePlayerList,
  normalizeGameState,
};
