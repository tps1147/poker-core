// Barrel for the bot-journey progression model + rating bands.
// Subpath entry: require('poker-core/rating').

module.exports = {
  ...require('./journeyProgress'), // buildBotJourney, recordBotMatchResult, calculateAiRatingDelta, …
  ...require('./ratingBands'), // ROOM_RATING_BAND, deriveBandRating, applyRoomRatingBands, normalizeDifficulty
};
