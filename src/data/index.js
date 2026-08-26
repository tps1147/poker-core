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

module.exports = {
  ...require('./archetypeScout'),
  ...require('./botRoster'),
  ...require('./preflopEquity'),
};
