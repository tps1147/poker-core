// Barrel for the bot-journey progression model + rating bands.
// Subpath entry: require('poker-core/rating'). The ranked ladder's formula is not here: it lives
// only on the server (pokerServer src/services/rankedRating.js) so it never ships to clients.

module.exports = {
  ...require('./journeyProgress'), // buildBotJourney, recordBotMatchResult, calculateAiRatingDelta, …
  ...require('./ratingBands'), // ROOM_RATING_BAND, deriveBandRating, applyRoomRatingBands, normalizeDifficulty
  ...require('./gauntletAccess'), // MASTERY_TARGETS, getGauntletAccess, buildGauntletAccessMap, isBotMasteredByProgress
};
