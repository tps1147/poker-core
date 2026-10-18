// Barrel for the leak ladder (practice bots that play to the player's own leaks).
// Subpath entry: require('poker-core/ladder'). Not in the main barrel: practice only, server-led.

module.exports = {
  ...require('./leakLadder'), // buildLeakProfile, buildLadder, stateAfterMatch, ladderVerdict, LEAKS, BOX_DAYS
};
