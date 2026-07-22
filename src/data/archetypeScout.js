// Standalone CJS extraction of the PURE archetype metadata from
// Poker.com/src/game/botProfiles.js. Only ARCHETYPE_META / getArchetypeMeta and
// ARCHETYPE_SCOUT / getArchetypeScout are pulled across — BOT_PROFILES is
// deliberately left behind because each profile does a React-Native asset
// require() (avatar: require('../assets/...')) that plain node/turbopack can't
// resolve. `export const` became plain consts + a module.exports at the end.

// Player-type labels for the UI — mirrors pokerServer/src/game/archetypes.js so the journey can
// SHOW how each opponent plays (the bot AI consumes `archetype` server-side).
const ARCHETYPE_META = Object.freeze({
  'calling-station': { label: 'Calling Station', blurb: 'Calls everything, never bluffs' },
  nit: { label: 'Nit', blurb: 'Ultra-tight, only premium hands' },
  tag: { label: 'Tight-Aggressive', blurb: 'Solid, value-driven, plays position' },
  lag: { label: 'Maniac', blurb: 'Loose & aggressive, over-bluffs' },
  trapper: { label: 'Trapper', blurb: 'Slowplays and check-raises' },
  shark: { label: 'Shark', blurb: 'Balanced & ruthless, punishes mistakes' },
  drawer: { label: 'Gambler', blurb: 'Chases draws, overvalues equity' },
  balanced: { label: 'All-Rounder', blurb: 'Well-rounded fundamentals' },
});

const getArchetypeMeta = (archetype) => ARCHETYPE_META[archetype] || ARCHETYPE_META.balanced;

// Two-line scouting read per archetype for The Gauntlet's SCOUTING REPORT panel — one punchy,
// poker-accurate sentence for how the opponent plays and one for the exploit that beats them.
const ARCHETYPE_SCOUT = Object.freeze({
  'calling-station': {
    howTheyPlay: 'Calls everything — bluffs are wasted here.',
    howToBeat: 'Value bet relentlessly; never bluff.',
  },
  nit: {
    howTheyPlay: 'Folds everything but premium hands.',
    howToBeat: 'Steal small pots often, then fold when they fight back.',
  },
  tag: {
    howTheyPlay: 'Tight, aggressive, and position-aware.',
    howToBeat: 'Fight back in position and attack their checks.',
  },
  lag: {
    howTheyPlay: 'Raises relentlessly and bluffs far too often.',
    howToBeat: 'Call down lighter with made hands and let them overplay.',
  },
  trapper: {
    howTheyPlay: 'Slowplays monsters and springs check-raises.',
    howToBeat: 'Check back marginal hands — a sudden raise means strength.',
  },
  shark: {
    howTheyPlay: 'Balanced and ruthless — punishes every mistake.',
    howToBeat: 'Stay disciplined and skip the fancy moves.',
  },
  drawer: {
    howTheyPlay: 'Chases every draw and overpays for equity.',
    howToBeat: 'Charge full price on wet boards; slow down when the draw hits.',
  },
  balanced: {
    howTheyPlay: 'Solid fundamentals with no glaring leak.',
    howToBeat: 'Grind small edges with position and patience.',
  },
});

const getArchetypeScout = (archetype) => ARCHETYPE_SCOUT[archetype] || ARCHETYPE_SCOUT.balanced;

module.exports = {
  ARCHETYPE_META,
  getArchetypeMeta,
  ARCHETYPE_SCOUT,
  getArchetypeScout,
};
