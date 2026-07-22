// Pure opponent-read logic, ported from the React hook
// Poker.com/src/hooks/useOpponentRead.js with the React removed. The pure
// primitives (createOpponentCounts / deriveOpponentActionEvents /
// recordOpponentAction / summarizeOpponentRead) already live in
// handInsightsMath, so they are RE-EXPORTED here rather than duplicated.
//
// createOpponentTracker is a tiny stateful factory a web (or RN) hook can drive:
// feed it each game state via observe() and read summary(); the same lastAction
// diff PokerTable's motion layer uses, so nothing the hero couldn't see at the
// table. No React, no timers, no sockets.

const { normalizePlayerList } = require('../state/normalizeGameState');
const {
  createOpponentCounts,
  deriveOpponentActionEvents,
  recordOpponentAction,
  summarizeOpponentRead,
} = require('./handInsightsMath');

// createOpponentTracker(heroId) → { observe, summary, reset }.
//   - observe(gameState): diffs against the previous observed state, records any
//     opponent actions, and returns the fresh read summary.
//   - summary(): the current read without advancing state.
//   - reset(nextHeroId?): clears the per-match tendencies (call on a new table);
//     optionally rebinds the hero id.
// Tendencies are per-match reads — construct a fresh tracker (or call reset)
// when the table changes, exactly like the hook's gameId clean-slate effect.
const createOpponentTracker = (heroId = null) => {
  let counts = createOpponentCounts();
  let previous = null;
  let hero = heroId;

  const observe = (gameState) => {
    if (!gameState || !Array.isArray(gameState.players)) return summarizeOpponentRead(counts);
    const nextState = { ...gameState, players: normalizePlayerList(gameState.players) };
    const prev = previous;
    previous = nextState;
    if (!prev) return summarizeOpponentRead(counts);

    const events = deriveOpponentActionEvents(prev, nextState, hero);
    events.forEach((event) => {
      counts = recordOpponentAction(counts, event.action, event.facingBet);
    });
    return summarizeOpponentRead(counts);
  };

  const summary = () => summarizeOpponentRead(counts);

  const reset = (nextHeroId) => {
    counts = createOpponentCounts();
    previous = null;
    if (nextHeroId !== undefined) hero = nextHeroId;
    return summary();
  };

  return { observe, summary, reset };
};

module.exports = {
  createOpponentTracker,
  // Re-exported pure pieces (single definitions live in handInsightsMath):
  createOpponentCounts,
  deriveOpponentActionEvents,
  recordOpponentAction,
  summarizeOpponentRead,
};
