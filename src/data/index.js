// Shared, asset-free DATA barrel — `require('poker-core/data')`.
//
// Everything here is pure data extracted from the mobile app's game modules, with the
// React-Native asset require()s (avatars, scene art) deliberately left behind so plain
// node, turbopack and the server can all load it.
//
//   archetypeScout — player-type labels + scouting reads, keyed by archetype
//   botRoster      — the canonical 16-bot journey ladder with band-derived ratings
//   preflopEquity  — generated real pre-flop equity table (copied from the server) +
//                    canonicalKey/equityForTopPercent helpers
//   arenaClimb     — the eight arenas' rating gates and sigils, arenaClimb(rating), sigilLattice
//   arenaTable     — the Stats table: seats, each arena's table decor and motif, dealer seat, rank band
//   (2.0 "The World")
//   arenaClimb     — also the seal: sealFor(rating), sealChange(before, after), SEAL_QUARTERS
//   collectibles   — The Case catalog: COLLECTIBLES, DEFAULT_EQUIPPED, unlocksForSeal, storyFor
//   results        — result modes, resultSkeleton(mode, payload), FORBIDDEN_RESULT_FIELDS
//   achievementArc — ARC_TRACKS, arcStep, arcNewlyDone
//   placement      — PLACEMENT_MATCHES, STAMPS, stampFor, placementLine, placementSummary
//   character      — Your Chip: CHARACTER_OPTIONS, DEFAULT_CHARACTER, normalizeCharacter
//   avatar         — the player avatar: AVATAR_LOOKS/BODIES/SLOTS/PARTS, normalizeAvatar, avatarFor

module.exports = {
  ...require('./archetypeScout'),
  ...require('./botRoster'),
  ...require('./preflopEquity'),
  ...require('./arenaClimb'),
  ...require('./arenaTable'),
  ...require('./collectibles'),
  ...require('./results'),
  ...require('./achievementArc'),
  ...require('./placement'),
  ...require('./character'),
  ...require('./avatar'),
};
