'use strict';

// The chip tiers: the ladder the puzzle rating climbs, named after chip colours. A display ladder
// the phone and the web both read; the server's stored puzzleRanking.tier (Bronze to Diamond) is
// left as it is.
//
//   tier     from    why there
//   White    -       every rating below Red (and nobody unrated: an unrated player has no tier)
//   Red      1100
//   Green    1250    the 'adaptive' cut-off for Intermediate spots (bands ADAPTIVE_CUTOFFS)
//   Black    1400
//   Purple   1550    the 'adaptive' cut-off for Advanced spots
//   Gold     1700
//
// So a promotion to Green or Purple is the point where the stream really does start serving harder
// spots. Promotions only go up: puzzleTierPromotion is null for a drop, which shows quietly.

const { ADAPTIVE_CUTOFFS } = require('./bands');
const { PUZZLE_COPY } = require('./copy');

const L = PUZZLE_COPY.tiers;

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

// colour: the chip's face; edge: the stripes round its rim; ink: text on the face.
const PUZZLE_TIERS = deepFreeze([
  { id: 'white', label: L.white, from: null, colour: '#e8e8e8', edge: '#0984fa', ink: '#101a2b' },
  { id: 'red', label: L.red, from: 1100, colour: '#c43b32', edge: '#ffffff', ink: '#ffffff' },
  { id: 'green', label: L.green, from: ADAPTIVE_CUTOFFS.intermediate, colour: '#2a9a5c', edge: '#ffffff', ink: '#ffffff' },
  { id: 'black', label: L.black, from: 1400, colour: '#2b2f36', edge: '#ffffff', ink: '#ffffff' },
  { id: 'purple', label: L.purple, from: ADAPTIVE_CUTOFFS.advanced, colour: '#7444e6', edge: '#ffffff', ink: '#ffffff' },
  { id: 'gold', label: L.gold, from: 1700, colour: '#d6b780', edge: '#5e4626', ink: '#1a1408' },
]);

const isRating = (rating) => typeof rating === 'number' && Number.isFinite(rating);

function tierIndex(rating) {
  let index = 0;
  PUZZLE_TIERS.forEach((tier, i) => {
    if (tier.from !== null && rating >= tier.from) index = i;
  });
  return index;
}

// puzzleTier(rating) -> { tier, index, next, toNext, progress } or null for no rating.
//   next      the tier above, or null at Gold;
//   toNext    rating points to the next tier (null at Gold);
//   progress  0..1 through this tier toward the next (1 at Gold). White's span is counted from
//             the starting band (1000), the lowest rating any spot is rated.
function puzzleTier(rating) {
  if (!isRating(rating)) return null;
  const index = tierIndex(rating);
  const tier = PUZZLE_TIERS[index];
  const next = PUZZLE_TIERS[index + 1] || null;
  if (!next) return { tier, index, next: null, toNext: null, progress: 1 };
  const floor = tier.from === null ? 1000 : tier.from;
  const span = next.from - floor;
  const progress = Math.max(0, Math.min(1, (rating - floor) / span));
  return { tier, index, next, toNext: Math.max(0, Math.ceil(next.from - rating)), progress };
}

// The tier an answer promoted the player into, or null (no move, a drop, or a missing rating).
function puzzleTierPromotion(before, after) {
  if (!isRating(before) || !isRating(after)) return null;
  const a = tierIndex(after);
  return a > tierIndex(before) ? PUZZLE_TIERS[a] : null;
}

module.exports = { PUZZLE_TIERS, puzzleTier, puzzleTierPromotion };
