'use strict';

// Seeds: one rule for every puzzle seed on the phone, the web and the server.
//
// The server's generator is deterministic from (topic, difficulty, seed) and reads the seed as
// `seed | 0`, so a seed must stay under 2^31 to mean the same thing everywhere. Every seed the
// engine makes is an integer in [0, PUZZLE_SEED_RANGE).
//
// fnv1a32, makeSeed and mulberry32 are byte-for-byte the server's (pokerServer
// src/services/PuzzleGeneratorService.js), so the adaptive nudge computed here is the one the
// server computes for the same seed (test/puzzles.test.js pins golden values from the server).

const PUZZLE_SEED_RANGE = 2000000000;

// FNV-1a, 32-bit, unsigned.
function fnv1a32(str) {
  const s = String(str);
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// The server's makeSeed: FNV-1a over `${a}|${b}|${seed}`.
function makeSeed(a, b, seed) {
  return fnv1a32(`${a}|${b}|${seed}`);
}

// The server's PRNG: a function returning floats in [0, 1).
function mulberry32(a) {
  let t = a >>> 0;
  return function next() {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const isSeed = (value) => Number.isInteger(value) && value >= 0 && value < PUZZLE_SEED_RANGE;

// seedFrom(seedSource) -> an integer seed in [0, PUZZLE_SEED_RANGE).
//   a function   called once; must return a float in [0, 1) (Math.random, or a seeded RNG);
//   an integer   used as the seed, wrapped into the range (a seed handed over in a link);
//   a fraction   in (0, 1), scaled into the range (one Math.random() draw taken earlier);
//   a string     of digits, read as an integer (a ?seed= query value).
// Anything else throws: the engine never picks randomness for the caller.
function seedFrom(seedSource) {
  let value = seedSource;
  if (typeof value === 'function') {
    const r = Number(value());
    if (!Number.isFinite(r) || r < 0 || r >= 1) {
      throw new TypeError('seedSource() must return a number in [0, 1)');
    }
    return Math.min(PUZZLE_SEED_RANGE - 1, Math.floor(r * PUZZLE_SEED_RANGE));
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) value = Number(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Number.isInteger(value)) return ((value % PUZZLE_SEED_RANGE) + PUZZLE_SEED_RANGE) % PUZZLE_SEED_RANGE;
    if (value > 0 && value < 1) return Math.floor(value * PUZZLE_SEED_RANGE);
  }
  throw new TypeError('seedSource must be a function returning [0, 1), an integer seed, or a fraction in (0, 1)');
}

module.exports = {
  PUZZLE_SEED_RANGE,
  fnv1a32,
  makeSeed,
  mulberry32,
  isSeed,
  seedFrom,
};
