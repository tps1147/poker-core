// poker-core/puzzles: the one puzzle engine for the phone, the web and the server.
//   node test/puzzles.test.js
//
// PARITY with pokerServer 252d87e is checked two ways, without importing the server:
//   - test/fixtures/puzzleServerParity.json was captured by running the server's own
//     PuzzleGeneratorService read-only: its constants, makeSeed / mulberry32 golden values, the
//     band 'adaptive' picks for 27 ratings x 200 seeds plus odd seeds and ratings, and 14 real
//     generated puzzles (every topic, every starting street, every answer);
//   - the numbers the server's own tests pin (src/tests/PuzzleGenerator.test.js,
//     src/tests/PuzzleAdaptive.test.js) are copied here as literals.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const P = require('../src/puzzles');
const core = require('../src/index.js');
const pkg = require('../package.json');
const FIX = require('./fixtures/puzzleServerParity.json');

let passed = 0;
let failed = 0;
function t(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}\n  ${err && err.stack ? err.stack.split('\n').slice(0, 4).join('\n  ') : err}`);
  }
}
const section = (name) => console.log(`\n[${name}]`);
const clone = (x) => JSON.parse(JSON.stringify(x));
const byId = (topic, difficulty, seed) => FIX.puzzles.find((p) => p.meta.topic === topic && p.difficulty === difficulty && p.meta.seed === seed);
const cardKey = (c) => `${c.rank}${c.suit}`;

// ===========================================================================
section('PARITY: band table and adaptive choice (pokerServer 252d87e)');
// ===========================================================================

t('the band constants equal the server source', () => {
  assert.deepStrictEqual({ ...P.DIFFICULTY_RATING }, FIX.DIFFICULTY_RATING);
  assert.deepStrictEqual({ ...P.ADAPTIVE_CUTOFFS }, FIX.ADAPTIVE_CUTOFFS);
  assert.strictEqual(P.ADAPTIVE_SPREAD, FIX.ADAPTIVE_SPREAD);
  assert.deepStrictEqual([...P.PUZZLE_TOPICS], FIX.TOPICS, 'topics in the server order');
});

t("the numbers the server's tests pin", () => {
  assert.deepStrictEqual({ ...P.DIFFICULTY_RATING }, { beginner: 1000, intermediate: 1300, advanced: 1600 });
  assert.deepStrictEqual({ ...P.ADAPTIVE_CUTOFFS }, { intermediate: 1250, advanced: 1550 });
  assert.strictEqual(P.ADAPTIVE_SPREAD, 75);
  assert.strictEqual(P.ADAPTIVE_CUTOFFS.intermediate, P.DIFFICULTY_RATING.beginner + 250);
  assert.strictEqual(P.ADAPTIVE_CUTOFFS.advanced, P.DIFFICULTY_RATING.intermediate + 250);
  // PuzzleRatingService kFactorForDifficulty: advanced 32, intermediate 24, everything else 16.
  assert.deepStrictEqual({ ...P.DIFFICULTY_K }, { beginner: 16, intermediate: 24, advanced: 32 });
  for (const d of ['expert', 'adaptive', undefined, null, '', 'ADVANCED']) assert.strictEqual(P.kFactorForDifficulty(d), 16, String(d));
  assert.strictEqual(P.UNBANDED_PUZZLE_RATING, 1200);
  assert.strictEqual(P.STARTING_PUZZLE_RATING, 1200, 'User puzzleRanking.rating default');
  assert.ok(P.STARTING_PUZZLE_RATING < P.ADAPTIVE_CUTOFFS.intermediate, 'the starting rating sits in the beginner band');
});

t('the band table reads as one row per band', () => {
  assert.deepStrictEqual(P.PUZZLE_BAND_TABLE.map((b) => ({ ...b })), [
    { name: 'beginner', label: 'Beginner', rating: 1000, k: 16, adaptiveFrom: null },
    { name: 'intermediate', label: 'Intermediate', rating: 1300, k: 24, adaptiveFrom: 1250 },
    { name: 'advanced', label: 'Advanced', rating: 1600, k: 32, adaptiveFrom: 1550 },
  ]);
  assert.ok(Object.isFrozen(P.PUZZLE_BAND_TABLE) && P.PUZZLE_BAND_TABLE.every(Object.isFrozen));
  assert.deepStrictEqual([...P.VALID_DIFFICULTIES], ['beginner', 'intermediate', 'advanced']);
  assert.ok(!P.VALID_DIFFICULTIES.includes('expert'), "'expert' is dropped");
});

t('makeSeed and mulberry32 are byte-for-byte the server\'s', () => {
  FIX.makeSeed.forEach(({ args, value }) => assert.strictEqual(P.makeSeed(...args), value, JSON.stringify(args)));
  FIX.mulberry32.forEach(({ seed, first }) => {
    const rng = P.mulberry32(seed);
    assert.deepStrictEqual([rng(), rng(), rng()], first, `mulberry32(${seed})`);
  });
});

t('adaptive: 27 ratings x 200 seeds pick the server\'s band', () => {
  const band = { b: 'beginner', i: 'intermediate', a: 'advanced' };
  let checked = 0;
  for (const [rating, row] of Object.entries(FIX.bandGrid.rows)) {
    assert.strictEqual(row.length, 200);
    for (let seed = 0; seed < 200; seed += 1) {
      const want = band[row[seed]];
      assert.strictEqual(P.adaptiveDifficulty(Number(rating), seed), want, `rating ${rating} seed ${seed}`);
      assert.strictEqual(P.adaptiveBand({ rating: Number(rating), seed }), want, `adaptiveBand ${rating}/${seed}`);
      checked += 1;
    }
  }
  assert.strictEqual(checked, 27 * 200);
});

t('adaptive: odd seeds (none, null, huge, negative, fractional, NaN) and odd ratings match the server', () => {
  const decode = (v) => (v === '__undefined' ? undefined : v === '__NaN' ? NaN : v === '__Infinity' ? Infinity : v);
  assert.ok(FIX.special.length > 150);
  FIX.special.forEach(({ rating, seed, band }) => {
    assert.strictEqual(P.adaptiveDifficulty(decode(rating), decode(seed)), band, `rating ${rating} seed ${seed}`);
    assert.strictEqual(P.adaptiveBand({ rating: decode(rating), seed: decode(seed) }), band, `adaptiveBand ${rating}/${seed}`);
  });
});

t('adaptive: the properties the server tests assert', () => {
  // The 1200 starting rating, and a first miss from it (1188), stay mostly beginner.
  for (const [rating, maxIntermediate] of [[1200, 0.2], [1188, 0.1]]) {
    let intermediate = 0;
    for (let seed = 0; seed < 1000; seed += 1) {
      const b = P.adaptiveDifficulty(rating, seed);
      assert.ok(b === 'beginner' || b === 'intermediate', `unexpected ${b} at ${rating}`);
      if (b === 'intermediate') intermediate += 1;
    }
    assert.ok(intermediate / 1000 <= maxIntermediate, `${rating}: intermediate ${intermediate}/1000`);
  }
  assert.strictEqual(P.adaptiveDifficulty(1200), 'beginner');
  const middle = (P.ADAPTIVE_CUTOFFS.intermediate + P.ADAPTIVE_CUTOFFS.advanced) / 2;
  for (let seed = 0; seed < 200; seed += 1) {
    assert.strictEqual(P.adaptiveDifficulty(null, seed), 'beginner');
    assert.strictEqual(P.adaptiveDifficulty(undefined, seed), 'beginner');
    assert.strictEqual(P.adaptiveDifficulty(P.ADAPTIVE_CUTOFFS.intermediate - P.ADAPTIVE_SPREAD - 1, seed), 'beginner');
    assert.strictEqual(P.adaptiveDifficulty(middle, seed), 'intermediate');
    assert.strictEqual(P.adaptiveDifficulty(P.ADAPTIVE_CUTOFFS.advanced + P.ADAPTIVE_SPREAD, seed), 'advanced');
    assert.strictEqual(P.adaptiveDifficulty(2400, seed), 'advanced');
  }
  for (const noSeed of [undefined, null]) {
    assert.strictEqual(P.adaptiveDifficulty(1249, noSeed), 'beginner');
    assert.strictEqual(P.adaptiveDifficulty(1250, noSeed), 'intermediate');
    assert.strictEqual(P.adaptiveDifficulty(1549, noSeed), 'intermediate');
    assert.strictEqual(P.adaptiveDifficulty(1550, noSeed), 'advanced');
    assert.strictEqual(P.adaptiveNudge(noSeed), 0);
  }
  for (const [rating, below, above] of [[1250, 'beginner', 'intermediate'], [1550, 'intermediate', 'advanced']]) {
    const seen = { [below]: 0, [above]: 0 };
    for (let seed = 0; seed < 400; seed += 1) {
      const b = P.adaptiveDifficulty(rating, seed);
      assert.ok(b === below || b === above, `unexpected ${b} at ${rating}`);
      seen[b] += 1;
    }
    assert.ok(seen[below] > 120 && seen[above] > 120, `split at ${rating}: ${JSON.stringify(seen)}`);
  }
  for (let seed = 0; seed < 500; seed += 1) {
    const n = P.adaptiveNudge(seed);
    assert.ok(Number.isInteger(n) && n >= -75 && n <= 75, `nudge ${n}`);
  }
});

t('adaptiveBand: a never-rated player gets beginner whatever the stored rating', () => {
  for (let seed = 0; seed < 50; seed += 1) {
    assert.strictEqual(P.adaptiveBand({ rating: 2400, rated: false, seed }), 'beginner');
    assert.strictEqual(P.adaptiveBand({ rating: 2400, rated: true, seed }), 'advanced');
  }
  assert.strictEqual(P.adaptiveBand(), 'beginner', 'anonymous');
  assert.strictEqual(P.adaptiveBand({ rating: 1800 }), 'advanced', 'rated defaults to following the rating');
});

t('normaliseDifficulty maps unknowns the way the server grades them', () => {
  for (const b of ['beginner', 'intermediate', 'advanced']) assert.strictEqual(P.normaliseDifficulty(b), b);
  for (const d of ['expert', 'adaptive', 'Advanced', '', null, undefined, 3]) assert.strictEqual(P.normaliseDifficulty(d), 'beginner', String(d));
  assert.strictEqual(P.ratingForDifficulty('expert'), 1000);
  assert.strictEqual(P.ratingForDifficulty(undefined), 1000);
  assert.strictEqual(P.difficultyLabel('adaptive'), 'Adaptive');
  assert.strictEqual(P.difficultyLabel('expert'), 'Beginner');
});

t('the rating an attempt is graded against, and the change (server test numbers)', () => {
  assert.strictEqual(P.attemptPuzzleRating('advanced'), 1600);
  assert.strictEqual(P.attemptPuzzleRating('intermediate'), 1300);
  assert.strictEqual(P.attemptPuzzleRating('expert'), 1000, "'expert' is graded as the beginner spot it was served");
  for (const none of [undefined, null, '', 'adaptive']) assert.strictEqual(P.attemptPuzzleRating(none), 1200, String(none));
  // The server test's own expectation.
  const expectedChange = (userRating, puzzleRating, k, won) => {
    const expected = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
    return Math.round(k * ((won ? 1 : 0) - expected));
  };
  const cases = [
    [{ rating: 1200, difficulty: 'advanced', correct: true }, 1600, expectedChange(1200, 1600, 32, true), 29],
    [{ rating: 1300, difficulty: 'intermediate', correct: false }, 1300, expectedChange(1300, 1300, 24, false), -12],
    [{ rating: 1200, difficulty: 'expert', correct: true }, 1000, expectedChange(1200, 1000, 16, true), 4],
    [{ rating: 1200, difficulty: 'adaptive', correct: true }, 1200, expectedChange(1200, 1200, 16, true), 8],
    [{ rating: 1200, correct: true }, 1200, expectedChange(1200, 1200, 16, true), 8],
    [{ rating: 1200, difficulty: 'beginner', correct: false }, 1000, expectedChange(1200, 1000, 16, false), -12],
  ];
  cases.forEach(([args, puzzleRating, change, literal]) => {
    const r = P.generatedRatingChange(args);
    assert.strictEqual(change, literal, 'the literal is the server formula');
    assert.deepStrictEqual(r, { userChange: literal, newUserRating: (args.rating || 1200) + literal, puzzleRating }, JSON.stringify(args));
  });
  // "A miss on a beginner spot takes it to 1188" (server test comment).
  assert.strictEqual(P.generatedRatingChange({ rating: 1200, difficulty: 'beginner', correct: false }).newUserRating, 1188);
  assert.strictEqual(P.generatedRatingChange({ rating: 0, difficulty: 'beginner', correct: true }).newUserRating,
    1200 + expectedChange(1200, 1000, 16, true), 'a falsy rating reads as 1200, like the server');
});

t("puzzleStanding: 'Unrated' until the first attempt, never the seeded 1200", () => {
  assert.deepStrictEqual(P.puzzleStanding({ rating: 1200, total: 0 }), { rated: false, rating: null, label: 'Unrated' });
  assert.deepStrictEqual(P.puzzleStanding({ rating: 1200 }), { rated: false, rating: null, label: 'Unrated' });
  assert.deepStrictEqual(P.puzzleStanding({ rating: 1236.4, total: 3 }), { rated: true, rating: 1236.4, label: '1236' });
  assert.deepStrictEqual(P.puzzleStanding({ total: 3 }), { rated: false, rating: null, label: 'Unrated' });
  assert.deepStrictEqual(P.puzzleStanding(), { rated: false, rating: null, label: 'Unrated' });
});

// ===========================================================================
section('TOPICS');
// ===========================================================================

t("topic labels are the server's category names, and each topic's spot is the one it deals", () => {
  FIX.puzzles.forEach((p) => {
    assert.strictEqual(P.topicLabel(p.meta.topic), p.category, p.meta.topic);
    assert.strictEqual(P.TOPIC_SPOT[p.meta.topic], p.initialState.action, p.meta.topic);
  });
  assert.deepStrictEqual(Object.keys(P.TOPIC_LABELS), [...P.PUZZLE_TOPICS]);
  assert.strictEqual(P.topicLabel('nope'), null);
  assert.strictEqual(P.DEFAULT_PUZZLE_TOPIC, 'pot-odds');
  assert.ok(P.isPuzzleTopic('bluffing') && !P.isPuzzleTopic('expert') && !P.isPuzzleTopic(undefined));
});

t('topicForSeed is fixed by the seed and spreads over all five', () => {
  const counts = Object.fromEntries(P.PUZZLE_TOPICS.map((x) => [x, 0]));
  for (let seed = 0; seed < 1000; seed += 1) {
    const topic = P.topicForSeed(seed);
    assert.strictEqual(P.topicForSeed(seed), topic);
    counts[topic] += 1;
  }
  Object.entries(counts).forEach(([topic, n]) => assert.ok(n > 150 && n < 250, `${topic}: ${n}/1000`));
});

// ===========================================================================
section('REQUESTS');
// ===========================================================================

const fixed = (r) => () => r;

t("solve: 'adaptive', the topic from the seed, one seed is one request", () => {
  const a = P.nextPuzzleRequest({ mode: 'solve', seedSource: fixed(0.25) });
  assert.deepStrictEqual(a, { topic: P.topicForSeed(500000000), difficulty: 'adaptive', seed: 500000000 });
  assert.deepStrictEqual(P.nextPuzzleRequest({ mode: 'solve', seedSource: 500000000 }), a, 'a handed seed is the same request');
  assert.deepStrictEqual(P.nextPuzzleRequest({ mode: 'solve', seedSource: '500000000' }), a, 'a ?seed= string too');
  assert.deepStrictEqual(P.nextPuzzleRequest({ seedSource: 0.25 }), a, 'solve is the default mode; a fraction is scaled');
  assert.deepStrictEqual(Object.keys(a), ['topic', 'difficulty', 'seed']);
});

t('solve / topic: a topic lock keeps adaptive; an explicit band is used; expert is never requested', () => {
  assert.deepStrictEqual(P.nextPuzzleRequest({ mode: 'topic', topic: 'bluffing', seedSource: 42 }), { topic: 'bluffing', difficulty: 'adaptive', seed: 42 });
  assert.deepStrictEqual(P.nextPuzzleRequest({ mode: 'solve', topic: 'bluffing', seedSource: 42 }), { topic: 'bluffing', difficulty: 'adaptive', seed: 42 });
  assert.deepStrictEqual(P.nextPuzzleRequest({ mode: 'topic', topic: 'pot-odds', difficulty: 'advanced', seedSource: 7 }), { topic: 'pot-odds', difficulty: 'advanced', seed: 7 });
  assert.strictEqual(P.nextPuzzleRequest({ mode: 'topic', topic: 'pot-odds', difficulty: 'expert', seedSource: 7 }).difficulty, 'adaptive');
  assert.strictEqual(P.nextPuzzleRequest({ mode: 'solve', difficulty: 'Advanced', seedSource: 7 }).difficulty, 'adaptive');
  const unknown = P.nextPuzzleRequest({ mode: 'topic', topic: 'not-a-topic', seedSource: 7 });
  assert.strictEqual(unknown.topic, P.topicForSeed(7), 'an unknown topic is the open stream');
});

t('daily: the same request for everyone that day, whatever else is passed', () => {
  const day = '2026-09-29';
  const want = P.dailyRequest(day);
  assert.strictEqual(want.difficulty, P.DAILY_DIFFICULTY);
  assert.notStrictEqual(want.difficulty, 'adaptive', 'adaptive would serve each player a different spot');
  for (const extra of [{}, { seedSource: Math.random }, { topic: 'bluffing', difficulty: 'advanced' }, { streak: 9 }]) {
    assert.deepStrictEqual(P.nextPuzzleRequest({ mode: 'daily', dayKey: day, ...extra }), want);
  }
  assert.throws(() => P.nextPuzzleRequest({ mode: 'daily' }), TypeError);
  assert.throws(() => P.nextPuzzleRequest({ mode: 'daily', dayKey: '2026-9-29' }), TypeError);
});

t('rush: the band ramps with the streak, the topic comes from the seed', () => {
  const ramp = [0, 1, 2, 3, 4, 6, 7, 8, 30].map((s) => P.rushDifficultyForStreak(s));
  assert.deepStrictEqual(ramp, ['beginner', 'beginner', 'beginner', 'intermediate', 'intermediate', 'intermediate', 'advanced', 'advanced', 'advanced']);
  assert.strictEqual(P.rushDifficultyForStreak(undefined), 'beginner');
  assert.strictEqual(P.rushDifficultyForStreak(-3), 'beginner');
  const r = P.nextPuzzleRequest({ mode: 'rush', seedSource: 99, streak: 5, topic: 'bluffing', difficulty: 'advanced' });
  assert.deepStrictEqual(r, { topic: P.topicForSeed(99), difficulty: 'intermediate', seed: 99 }, 'Rush ignores a topic or difficulty');
  ['beginner', 'intermediate', 'advanced'].forEach((d) => assert.ok(P.VALID_DIFFICULTIES.includes(d)));
});

t('every request is something the server knows, with a seed its seed|0 keeps', () => {
  const seeds = [fixed(0), fixed(0.999999999), 0, 1999999999, 2000000000, 2147483648, -1, 0.5, '17'];
  for (const mode of ['solve', 'topic', 'rush']) {
    for (const seedSource of seeds) {
      const r = P.nextPuzzleRequest({ mode, seedSource, streak: 8 });
      assert.ok(P.isPuzzleTopic(r.topic), `${mode} topic ${r.topic}`);
      assert.ok(P.VALID_DIFFICULTIES.includes(r.difficulty) || r.difficulty === 'adaptive', `${mode} difficulty ${r.difficulty}`);
      assert.ok(P.isSeed(r.seed) && (r.seed | 0) === r.seed, `${mode} seed ${r.seed}`);
    }
  }
  assert.strictEqual(P.seedFrom(-1), 1999999999, 'negative integers wrap into the range');
  assert.strictEqual(P.seedFrom(2000000005), 5);
});

t('seedFrom never picks randomness for the caller', () => {
  for (const bad of [undefined, null, NaN, 1.5, -0.5, 'abc', {}, fixed(1), fixed(-0.1), fixed(NaN)]) {
    assert.throws(() => P.seedFrom(bad), TypeError, String(bad));
    assert.throws(() => P.nextPuzzleRequest({ mode: 'solve', seedSource: bad }), TypeError, String(bad));
  }
  assert.throws(() => P.nextPuzzleRequest({ mode: 'practice', seedSource: 1 }), TypeError);
});

t("the preview hands its puzzle to the page: one seed, one request (web 'Solve this one')", () => {
  const seed = P.previewSeed('2026-09-29', 4);
  const cell = P.nextPuzzleRequest({ mode: 'solve', seedSource: seed });
  const page = P.nextPuzzleRequest({ mode: 'solve', seedSource: String(seed) });
  assert.deepStrictEqual(page, cell);
});

// ===========================================================================
section('DAILY');
// ===========================================================================

t("todayKey is the player's local day (the server's startOfDay instants)", () => {
  const at = (iso) => new Date(iso);
  assert.strictEqual(P.todayKey(at('2026-09-30T01:00:00Z'), 0), '2026-09-30');
  assert.strictEqual(P.todayKey(at('2026-09-30T01:00:00Z'), 420), '2026-09-29', '18:00 on Sep 29 at UTC-7');
  assert.strictEqual(P.todayKey(at('2026-09-30T15:00:00Z'), 420), '2026-09-30');
  assert.strictEqual(P.todayKey(at('2026-09-29T20:00:00Z'), -600), '2026-09-30', '06:00 on Sep 30 at UTC+10');
  assert.strictEqual(P.todayKey(at('2026-09-29T13:59:00Z'), -600), '2026-09-29');
  assert.strictEqual(P.todayKey(Date.parse('2026-01-01T00:30:00Z'), 60), '2025-12-31', 'a timestamp works too');
  const d = new Date('2026-06-15T12:00:00Z');
  assert.strictEqual(P.todayKey(d), P.todayKey(d, d.getTimezoneOffset()), 'no offset: the device zone');
  assert.throws(() => P.todayKey(), TypeError);
  assert.throws(() => P.todayKey(new Date('nope')), TypeError);
});

t("dayStart is the server's startOfDay", () => {
  const at = (iso) => new Date(iso);
  assert.strictEqual(P.dayStart(at('2026-09-30T01:00:00Z'), 0).toISOString(), '2026-09-30T00:00:00.000Z');
  assert.strictEqual(P.dayStart(at('2026-09-30T01:00:00Z'), 420).toISOString(), '2026-09-29T07:00:00.000Z');
  assert.strictEqual(P.dayStart(at('2026-09-30T15:00:00Z'), 420).toISOString(), '2026-09-30T07:00:00.000Z');
  assert.strictEqual(P.dayStart(at('2026-09-29T20:00:00Z'), -600).toISOString(), '2026-09-29T14:00:00.000Z');
  assert.strictEqual(P.dayStart(at('2026-09-29T13:59:00Z'), -600).toISOString(), '2026-09-28T14:00:00.000Z');
  for (const tz of [-840, -600, -330, 0, 60, 420, 840]) {
    for (let h = 0; h < 48; h += 5) {
      const now = new Date(Date.UTC(2026, 8, 29, h, 17));
      const start = P.dayStart(now, tz);
      assert.ok(start <= now && now - start < 24 * 3600 * 1000, `${tz} ${h}`);
      assert.strictEqual(P.todayKey(start, tz), P.todayKey(now, tz), 'the day starts on the same local day');
    }
  }
});

t('clampTzOffset reads offsets as the server does', () => {
  assert.strictEqual(P.clampTzOffset(420), 420);
  assert.strictEqual(P.clampTzOffset('-600'), -600);
  assert.strictEqual(P.clampTzOffset(99999), 840);
  assert.strictEqual(P.clampTzOffset(-99999), -840);
  assert.strictEqual(P.clampTzOffset(330.4), 330);
  for (const garbage of [undefined, null, '', 'abc', NaN, Infinity]) assert.strictEqual(P.clampTzOffset(garbage), 0, String(garbage));
});

t('the daily seed and topic: fixed by the day, the topic rotating through all five', () => {
  const days = ['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'];
  const topics = days.map(P.dailyTopic);
  assert.deepStrictEqual([...new Set(topics.slice(0, 5))].sort(), [...P.PUZZLE_TOPICS].sort(), 'five days, five topics');
  assert.strictEqual(topics[5], topics[0], 'then round again');
  const seeds = days.map(P.dailySeed);
  assert.strictEqual(new Set(seeds).size, days.length);
  seeds.forEach((s) => assert.ok(P.isSeed(s)));
  assert.strictEqual(P.dailySeed('2026-09-29'), P.fnv1a32('daily|2026-09-29') % 2000000000);
  assert.strictEqual(P.dayNumber('1970-01-01'), 0);
  assert.strictEqual(P.dailyTopic('1970-01-01'), P.PUZZLE_TOPICS[0]);
  assert.strictEqual(P.dailyTopic('1969-12-31'), P.PUZZLE_TOPICS[4], 'days before 1970 rotate too');
  for (const bad of ['2026-02-30', '2026-9-29', '29-09-2026', '', null, 20260929]) {
    assert.throws(() => P.dailySeed(bad), TypeError, String(bad));
    assert.strictEqual(P.isDayKey(bad), false);
  }
});

t('isDailyPuzzle: only that day\'s spot, served at the fixed band', () => {
  const day = '2026-09-29';
  const req = P.dailyRequest(day);
  const daily = { ...clone(FIX.puzzles[3]), difficulty: req.difficulty, meta: { ...FIX.puzzles[3].meta, topic: req.topic, seed: req.seed } };
  assert.strictEqual(P.isDailyPuzzle(daily, day), true);
  assert.strictEqual(P.isDailyPuzzle(daily, '2026-09-30'), false);
  assert.strictEqual(P.isDailyPuzzle({ ...daily, difficulty: 'advanced' }, day), false);
  assert.strictEqual(P.isDailyPuzzle({ ...daily, meta: { ...daily.meta, adaptive: true } }, day), false);
  assert.strictEqual(P.isDailyPuzzle(null, day), false);
  assert.strictEqual(P.isDailyPuzzle(daily, 'nope'), false);
});

t("previewSeed is the web's existing formula, and moves with the day and the count", () => {
  // flop52web src/lib/puzzleRun.js previewSeed, copied.
  const webFnv = (str) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  };
  for (const [day, n] of [['2026-09-27', 6], ['2026-09-28', 0], ['2026-12-31', 11]]) {
    assert.strictEqual(P.previewSeed(day, n), webFnv(`${day}:${n}`) % 2000000000);
  }
  const a = P.previewSeed('2026-09-27', 6);
  assert.ok(P.isSeed(a));
  assert.notStrictEqual(P.previewSeed('2026-09-27', 7), a);
  assert.notStrictEqual(P.previewSeed('2026-09-28', 6), a);
  assert.strictEqual(P.previewSeed('2026-09-27', null), P.previewSeed('2026-09-27', 0));
});

t('the daily goal is ten', () => {
  assert.strictEqual(P.DAILY_PUZZLE_GOAL, 10);
  assert.deepStrictEqual(P.dailyGoalProgress(0), { count: 0, goal: 10, filled: 0, left: 10, met: false });
  assert.deepStrictEqual(P.dailyGoalProgress(7), { count: 7, goal: 10, filled: 7, left: 3, met: false });
  assert.deepStrictEqual(P.dailyGoalProgress(10), { count: 10, goal: 10, filled: 10, left: 0, met: true });
  assert.deepStrictEqual(P.dailyGoalProgress(13), { count: 13, goal: 10, filled: 10, left: 0, met: true });
  assert.deepStrictEqual(P.dailyGoalProgress(null), P.dailyGoalProgress(0));
});

// ===========================================================================
section('RUN');
// ===========================================================================

t('the marks and the next mark', () => {
  assert.deepStrictEqual([...P.PUZZLE_RUN_MARKS], [3, 5, 10, 15, 20]);
  assert.ok(Object.isFrozen(P.PUZZLE_RUN_MARKS));
  assert.deepStrictEqual([0, 2, 3, 4, 9, 14, 19, 20, 40].map(P.nextRunMark), [3, 3, 5, 5, 10, 15, 20, null, null]);
  P.PUZZLE_RUN_MARKS.forEach((m) => assert.strictEqual(P.isRunMilestone(m), true, String(m)));
  for (const n of [0, 1, 2, 4, 6, 25, 30, 100]) assert.strictEqual(P.isRunMilestone(n), false, `${n}: no moment past 20`);
});

t('runAfter: correct extends, a hinted correct keeps, wrong ends, ungraded leaves it', () => {
  assert.strictEqual(P.runAfter(4, { correct: true }), 5);
  assert.strictEqual(P.runAfter(4, { correct: true, hintUsed: true }), 4);
  assert.strictEqual(P.runAfter(4, { correct: true, hintUsed: false }), 5);
  assert.strictEqual(P.runAfter(4, { correct: false }), 0);
  assert.strictEqual(P.runAfter(4, { correct: false, hintUsed: true }), 0);
  assert.strictEqual(P.runAfter(4, { correct: null }), 4);
  assert.strictEqual(P.runAfter(4), 4);
  assert.strictEqual(P.runAfter(undefined, { correct: true }), 1);
  assert.strictEqual(P.runAfter(-3, { correct: true }), 1);
});

t('a mark is reached only by a run that grew onto it', () => {
  assert.strictEqual(P.runMilestoneReached(2, 3), 3);
  assert.strictEqual(P.runMilestoneReached(19, 20), 20);
  assert.strictEqual(P.runMilestoneReached(5, 5), null, 'a hinted solve on a mark does not fire it again');
  assert.strictEqual(P.runMilestoneReached(3, 4), null);
  assert.strictEqual(P.runMilestoneReached(20, 21), null);
  assert.strictEqual(P.runMilestoneReached(5, 0), null);
  let run = 0;
  const moments = [];
  for (const answer of [
    { correct: true }, { correct: true }, { correct: true, hintUsed: true }, { correct: true },
    { correct: true, hintUsed: true }, { correct: true }, { correct: true }, { correct: false }, { correct: true },
  ]) {
    const next = P.runAfter(run, answer);
    const m = P.runMilestoneReached(run, next);
    if (m) moments.push(m);
    run = next;
  }
  assert.deepStrictEqual(moments, [3, 5]);
  assert.strictEqual(run, 1);
});

t('runTrack for the five beads', () => {
  assert.deepStrictEqual(P.runTrack(0), { run: 0, next: 3, reached: [], hitIndex: -1 });
  assert.deepStrictEqual(P.runTrack(6), { run: 6, next: 10, reached: [3, 5], hitIndex: 1 });
  assert.deepStrictEqual(P.runTrack(22), { run: 22, next: null, reached: [3, 5, 10, 15, 20], hitIndex: 4 });
});

t('a saved run is live the same day for twenty minutes', () => {
  const now = Date.parse('2026-09-29T18:00:00Z');
  const rec = P.runRecord(7, { now, tzOffsetMinutes: 420 });
  assert.deepStrictEqual(rec, { run: 7, at: now, day: '2026-09-29' });
  assert.strictEqual(P.liveRun(rec, { now: now + 19 * 60000, tzOffsetMinutes: 420 }), 7);
  assert.strictEqual(P.liveRun(rec, { now: now + 21 * 60000, tzOffsetMinutes: 420 }), 0, 'stale');
  assert.strictEqual(P.liveRun(rec, { now: now - 1000, tzOffsetMinutes: 420 }), 0, 'a clock that went back');
  const lateNight = P.runRecord(4, { now: Date.parse('2026-09-30T06:50:00Z'), tzOffsetMinutes: 420 }); // 23:50 local
  assert.strictEqual(P.liveRun(lateNight, { now: Date.parse('2026-09-30T07:05:00Z'), tzOffsetMinutes: 420 }), 0, 'a new day starts a new run');
  // The web's older record: { streak, at, date }.
  assert.strictEqual(P.liveRun({ streak: 5, at: now, date: '2026-09-29' }, { now: now + 60000, tzOffsetMinutes: 420 }), 5);
  assert.strictEqual(P.liveRun(null, { now }), 0);
  assert.strictEqual(P.liveRun({ run: 3, at: 'x', day: '2026-09-29' }, { now }), 0);
  assert.strictEqual(P.RUN_FRESH_MS, 20 * 60 * 1000);
});

// ===========================================================================
section('ANSWER (on the server\'s own generated puzzles)');
// ===========================================================================

t('the buttons: facing a bet fold / call / raise; an unopened pot check / bet', () => {
  FIX.puzzles.forEach((p) => {
    const actions = P.puzzleActions(p);
    if (p.initialState.action === 'unopened_pot') {
      assert.deepStrictEqual(actions, [{ action: 'check', label: 'Check' }, { action: 'raise', label: 'Bet' }], P.puzzleIdentity(p));
    } else {
      assert.deepStrictEqual(actions, [
        { action: 'fold', label: 'Fold' },
        { action: 'call', label: 'Call', amount: p.initialState.opponentBet },
        { action: 'raise', label: 'Raise' },
      ], P.puzzleIdentity(p));
    }
    assert.ok(actions.some((a) => a.action === p.progression.correctAction), `the answer is on a button: ${P.puzzleIdentity(p)}`);
  });
  const answers = new Set(FIX.puzzles.map((p) => p.progression.correctAction));
  assert.deepStrictEqual([...answers].sort(), ['call', 'check', 'fold', 'raise'], 'the fixtures cover every answer');
});

t('gradeAnswer: right, wrong, bet as raise, and the best play labelled for the spot', () => {
  FIX.puzzles.forEach((p) => {
    const answer = p.progression.correctAction;
    const right = P.gradeAnswer(p, answer);
    assert.strictEqual(right.correct, true);
    assert.deepStrictEqual(right.verdict, { tone: 'correct', kicker: 'Correct' });
    assert.strictEqual(right.best.action, answer);
    assert.strictEqual(right.explanation, p.progression.explanation);
    const wrongAction = P.puzzleActions(p).find((a) => a.action !== answer).action;
    const wrong = P.gradeAnswer(p, wrongAction);
    assert.strictEqual(wrong.correct, false);
    assert.deepStrictEqual(wrong.verdict, { tone: 'wrong', kicker: 'The answer' });
    assert.deepStrictEqual(wrong.best, right.best, 'the best play is the same whatever was chosen');
    assert.strictEqual(wrong.explanation, right.explanation, 'the explanation is the same right or wrong');
    assert.strictEqual(wrong.chosen.action, wrongAction);
  });
  const bet = byId('bluffing', 'intermediate', 2);
  assert.strictEqual(bet.progression.correctAction, 'raise');
  assert.deepStrictEqual(P.gradeAnswer(bet, 'raise').best, { action: 'raise', label: 'Bet' });
  assert.strictEqual(P.gradeAnswer(bet, 'bet').correct, true, "the rail's Bet is the generator's raise");
  assert.strictEqual(P.gradeAnswer(bet, ' BET ').correct, true);
  assert.deepStrictEqual(P.gradeAnswer(bet, 'bet').chosen, { action: 'raise', label: 'Bet' });
  const raise = byId('starting-hands', 'intermediate', 66);
  assert.deepStrictEqual(P.gradeAnswer(raise, 'raise').best, { action: 'raise', label: 'Raise' });
  const call = byId('pot-odds', 'beginner', 3);
  assert.deepStrictEqual(P.gradeAnswer(call, 'check').best, { action: 'call', label: 'Call' });
  assert.strictEqual(P.gradeAnswer(call, 'check').correct, false);
});

t('gradeAnswer: library and lesson shapes, and a puzzle with no answer key', () => {
  assert.strictEqual(P.gradeAnswer({ correctAction: 'Bet', initialState: { opponentBet: 0 } }, 'raise').correct, true);
  assert.strictEqual(P.gradeAnswer({ solution: { action: 'CALL' } }, 'call').correct, true);
  assert.strictEqual(P.gradeAnswer({ solution: 'fold' }, 'fold').correct, true);
  assert.strictEqual(P.gradeAnswer({ answer: 'all in' }, 'all-in').correct, true);
  const open = P.gradeAnswer({ title: 'No key' }, 'fold');
  assert.deepStrictEqual(open, { correct: null, chosen: { action: 'fold', label: 'Fold' }, best: null, explanation: '', verdict: { tone: 'open', kicker: 'Review' } });
  assert.strictEqual(P.gradeAnswer(null, 'fold').correct, null);
  assert.strictEqual(P.gradeAnswer(FIX.puzzles[0], undefined).correct, false);
  assert.strictEqual(P.puzzleActionLabel('bet'), 'Bet');
  assert.strictEqual(P.puzzleActionLabel('raise'), 'Raise');
  assert.strictEqual(P.puzzleActionLabel('limp'), null);
  assert.strictEqual(P.puzzleActionLabel('raise', byId('bluffing', 'intermediate', 2)), 'Bet', 'with the puzzle, the spot decides');
  assert.ok(!('actionLabel' in P), "poker-core/learn owns actionLabel(spot, action); the puzzles one is puzzleActionLabel");
  assert.strictEqual(P.canonicalAction('  Check '), 'check');
  assert.strictEqual(P.canonicalAction(3), null);
});

t('answerMaths: equity and price from meta, price null with nothing to call', () => {
  FIX.puzzles.forEach((p) => {
    const m = P.answerMaths(p);
    assert.deepStrictEqual(m, { equity: p.meta.equity, price: p.meta.requiredEquity });
    if (p.initialState.action === 'unopened_pot') assert.strictEqual(m.price, null);
  });
  assert.strictEqual(P.answerMaths({}), null);
  assert.strictEqual(P.answerMaths({ meta: { seed: 1 } }), null);
  assert.strictEqual(P.answerMaths(null), null);
  assert.strictEqual(P.formatAnswerMaths({ equity: 34.2, price: 25 }), 'Equity 34% vs price 25%');
  assert.strictEqual(P.formatAnswerMaths({ equity: 62.4, price: null }), 'Equity 62%');
  assert.strictEqual(P.formatAnswerMaths({ equity: 34.4, price: 33.6 }), 'Equity 34.4% vs price 33.6%', 'never 34% vs 34% for a real gap');
  assert.strictEqual(P.formatAnswerMaths({ equity: 30, price: 30 }), 'Equity 30% vs price 30%');
  assert.strictEqual(P.formatAnswerMaths(null), '');
  assert.strictEqual(P.formatAnswerMaths(P.answerMaths(byId('pot-odds', 'beginner', 3))), 'Equity 71% vs price 35%');
});

t('dealPlan: the rest of the board from ANY starting street, in order, never a card already out', () => {
  const streetsFor = { preflop: ['flop', 'flop', 'flop', 'turn', 'river'], flop: ['turn', 'river'], turn: ['river'], river: [] };
  const phases = new Set();
  FIX.puzzles.forEach((p) => {
    const phase = p.initialState.phase;
    phases.add(phase);
    const plan = P.dealPlan(p);
    assert.deepStrictEqual(plan.map((s) => s.street), streetsFor[phase], P.puzzleIdentity(p));
    const board = [...P.startingBoard(p), ...plan.map((s) => s.card)];
    const full = [...p.progression.flopCards, p.progression.turnCard, p.progression.riverCard];
    assert.deepStrictEqual(board.map(cardKey), full.map(cardKey), 'starting board + deal = the whole board');
    assert.deepStrictEqual(P.startingBoard(p).map(cardKey), p.initialState.communityCards.map(cardKey));
    plan.forEach((s, i) => assert.strictEqual(s.slot, p.initialState.communityCards.length + i));
    const keys = [...board, ...p.initialState.playerCards].map(cardKey);
    assert.strictEqual(new Set(keys).size, 7, 'seven different cards');
  });
  assert.deepStrictEqual([...phases].sort(), ['flop', 'preflop', 'river', 'turn'], 'fixtures start on every street');
  const pre = byId('starting-hands', 'beginner', 11);
  assert.deepStrictEqual(P.dealStreets(pre).map((s) => [s.street, s.cards.length]), [['flop', 3], ['turn', 1], ['river', 1]]);
  assert.deepStrictEqual(P.dealStreets(byId('hand-reading', 'intermediate', 9)), []);
});

t('dealPlan never replaces the board: a mismatched or impossible runout deals nothing', () => {
  const flop = clone(byId('postflop-cbet', 'intermediate', 5));
  const mismatched = clone(flop);
  mismatched.initialState.communityCards[1] = { ...mismatched.progression.turnCard };
  assert.deepStrictEqual(P.dealPlan(mismatched), []);
  // A progression for a different flop, sharing no card with the table or the hero: only the
  // continuity rule can refuse it (the duplicate-card rule never fires here).
  const otherFlop = clone(flop);
  const out = new Set([...otherFlop.initialState.communityCards, ...otherFlop.initialState.playerCards,
    otherFlop.progression.turnCard, otherFlop.progression.riverCard].map(cardKey));
  const spare = [];
  for (const suit of ['♠', '♥', '♦', '♣']) {
    for (const rank of '23456789TJQKA') {
      if (spare.length < 3 && !out.has(`${rank}${suit}`)) spare.push({ rank, suit });
    }
  }
  otherFlop.progression.flopCards = spare;
  const otherKeys = [...spare, otherFlop.progression.turnCard, otherFlop.progression.riverCard].map(cardKey);
  assert.strictEqual(new Set([...otherKeys, ...otherFlop.initialState.communityCards.map(cardKey), ...otherFlop.initialState.playerCards.map(cardKey)]).size, 10, 'no shared card');
  assert.deepStrictEqual(P.dealPlan(otherFlop), [], 'a runout that does not continue the board on the table deals nothing');
  const clash = clone(flop);
  clash.progression.riverCard = { ...clash.initialState.playerCards[0] };
  assert.deepStrictEqual(P.dealPlan(clash), [], 'a runout card in the hero\'s hand');
  // A stored puzzle that keeps only its progression (no communityCards): the street decides.
  const stored = clone(flop);
  delete stored.initialState.communityCards;
  stored.initialState.phase = 'turn';
  assert.deepStrictEqual(P.startingBoard(stored).map(cardKey), [...flop.progression.flopCards, flop.progression.turnCard].map(cardKey));
  assert.deepStrictEqual(P.dealPlan(stored).map((s) => [s.street, cardKey(s.card)]), [['river', cardKey(flop.progression.riverCard)]]);
  // A board longer than its street shows only the street (a stored full board).
  const long = clone(stored);
  long.initialState.communityCards = [...flop.progression.flopCards, flop.progression.turnCard, flop.progression.riverCard];
  long.initialState.phase = 'flop';
  assert.strictEqual(P.startingBoard(long).length, 3);
  assert.strictEqual(P.dealPlan(long).length, 2);
  // Lesson-style cards: letter suits and '10'.
  const lettered = {
    initialState: { phase: 'flop', playerCards: ['Ah', 'Kh'], communityCards: ['10h', '5d', '2c'] },
    progression: { flopCards: [{ rank: 'T', suit: '♥' }, { rank: '5', suit: '♦' }, { rank: '2', suit: '♣' }], turnCard: { rank: 'Q', suit: 'hearts' }, riverCard: { rank: '3', suit: 's' } },
  };
  assert.deepStrictEqual(P.dealPlan(lettered).map((s) => s.street), ['turn', 'river']);
  // A progression that stops early deals only the cards it has, in their slots.
  const partial = clone(flop);
  delete partial.progression.turnCard;
  assert.deepStrictEqual(P.dealPlan(partial), [], 'no turn: the river cannot land in the turn slot');
  assert.deepStrictEqual(P.dealPlan(null), []);
  assert.deepStrictEqual(P.dealPlan({}), []);
  assert.strictEqual(P.cardKey({ rank: '10', suit: '♠' }), 'Ts');
  assert.strictEqual(P.cardKey({ rank: 'X', suit: '♠' }), null);
});

t("puzzleIdentity keys generated puzzles by topic, band and seed (the phone's puzzleRound format)", () => {
  // Poker.com src/game/puzzleRound.test.js expectations, copied.
  const generated = (seed) => ({ title: 'Pot Odds Spot', difficulty: 'beginner', meta: { topic: 'pot-odds', seed } });
  assert.strictEqual(P.puzzleIdentity(generated(42)), 'gen:pot-odds:beginner:42');
  assert.notStrictEqual(P.puzzleIdentity(generated(42)), P.puzzleIdentity(generated(43)));
  assert.strictEqual(P.puzzleIdentity(generated(0)), 'gen:pot-odds:beginner:0', 'seed 0 is a seed');
  assert.strictEqual(P.puzzleIdentity({ _id: 'abc123', title: 'T' }), 'id:abc123');
  assert.strictEqual(P.puzzleIdentity({ id: 7, title: 'T' }), 'id:7');
  assert.strictEqual(P.puzzleIdentity({ title: 'Just a title' }), 'title:Just a title');
  assert.strictEqual(P.puzzleIdentity(null), '');
  const ids = FIX.puzzles.map(P.puzzleIdentity);
  assert.strictEqual(new Set(ids).size, ids.length, 'every fixture puzzle has its own identity');
});

t('advanceRule: correct answers move on after 1.1s; wrong and ungraded wait for Next', () => {
  assert.deepStrictEqual(P.advanceRule(true), { auto: true, delayMs: 1100 });
  assert.deepStrictEqual(P.advanceRule(false), { auto: false, delayMs: null });
  assert.deepStrictEqual(P.advanceRule(null), { auto: false, delayMs: null });
});

t('resolveAnswer is the grade, the maths, the deal and the advance in one', () => {
  const p = byId('pot-odds', 'intermediate', 17);
  const r = P.resolveAnswer(p, 'call');
  assert.strictEqual(r.correct, false);
  assert.deepStrictEqual(r.best, { action: 'raise', label: 'Raise' });
  assert.deepStrictEqual(r.maths, { equity: p.meta.equity, price: p.meta.requiredEquity });
  assert.strictEqual(r.mathsLine, P.formatAnswerMaths(r.maths));
  assert.deepStrictEqual(r.deal, P.dealPlan(p));
  assert.deepStrictEqual(r.advance, { auto: false, delayMs: null });
  assert.deepStrictEqual(P.resolveAnswer(p, 'raise').advance, { auto: true, delayMs: 1100 });
});

// ===========================================================================
section('ATTEMPT (exactly the body the server reads)');
// ===========================================================================

// pokerServer puzzleController recordGeneratedAttempt, as the server reads a body (copied rules).
const SERVER_ACTIONS = new Set(['fold', 'call', 'raise', 'check', 'all-in']);
const SERVER_READS = ['correct', 'action', 'difficulty', 'timeTakenMs', 'topic', 'hintUsed', 'daily'];
function serverReads(body) {
  const served = typeof body.difficulty === 'string' && body.difficulty && body.difficulty !== 'adaptive' ? body.difficulty : null;
  return {
    correct: body.correct === true,
    action: SERVER_ACTIONS.has(body.action) ? body.action : 'call',
    difficulty: ['beginner', 'intermediate', 'advanced'].includes(served) ? served : 'beginner',
    puzzleRating: served ? ({ beginner: 1000, intermediate: 1300, advanced: 1600 }[served] || 1000) : 1200,
    timeTakenMs: Math.max(0, parseInt(body.timeTakenMs, 10) || 0),
    topic: typeof body.topic === 'string' && FIX.TOPICS.includes(body.topic) ? body.topic : undefined,
    hintUsed: typeof body.hintUsed === 'boolean' ? body.hintUsed : undefined,
    daily: typeof body.daily === 'boolean' ? body.daily : undefined,
  };
}

t('every field is kept by the server as sent, and the grade is against the rating the puzzle carried', () => {
  FIX.puzzles.forEach((p) => {
    const body = P.generatedAttemptPayload({ puzzle: p, action: p.progression.correctAction, hintUsed: false, timeTakenMs: 5200 });
    assert.deepStrictEqual(Object.keys(body), ['correct', 'action', 'difficulty', 'timeTakenMs', 'hintUsed', 'daily', 'topic', 'seed']);
    Object.keys(body).filter((k) => k !== 'seed').forEach((k) => assert.ok(SERVER_READS.includes(k), `the server reads ${k}`));
    const read = serverReads(body);
    SERVER_READS.forEach((k) => assert.deepStrictEqual(read[k], body[k], `${P.puzzleIdentity(p)} ${k} survives`));
    assert.strictEqual(read.puzzleRating, p.puzzleRating, `${P.puzzleIdentity(p)}: graded against the rating it was served with`);
    assert.strictEqual(body.topic, p.meta.topic);
    assert.strictEqual(body.seed, p.meta.seed);
    assert.strictEqual(body.correct, true, 'graded here when not given');
  });
  const expert = byId('pot-odds', 'expert', 3);
  const body = P.generatedAttemptPayload({ puzzle: expert, action: 'fold' });
  assert.strictEqual(body.difficulty, 'beginner', "'expert' is sent as the beginner band it was served in");
  assert.strictEqual(expert.puzzleRating, 1000);
});

t('the payload: bet is raise, correct as given, time and hint as the server wants them', () => {
  const p = byId('bluffing', 'intermediate', 2);
  const body = P.generatedAttemptPayload({ puzzle: p, action: 'Bet', hintUsed: true, timeTakenMs: 4321.6 });
  assert.deepStrictEqual(body, { correct: true, action: 'raise', difficulty: 'intermediate', timeTakenMs: 4322, hintUsed: true, daily: false, topic: 'bluffing', seed: 2 });
  assert.strictEqual(P.generatedAttemptPayload({ puzzle: p, action: 'check', correct: true }).correct, true, 'a given boolean is kept');
  assert.strictEqual(P.generatedAttemptPayload({ puzzle: p, action: 'check' }).correct, false);
  for (const [raw, ms] of [[-5, 0], [undefined, 0], ['abc', 0], [NaN, 0], [12.4, 12]]) {
    assert.strictEqual(P.generatedAttemptPayload({ puzzle: p, action: 'check', timeTakenMs: raw }).timeTakenMs, ms, String(raw));
  }
  assert.strictEqual(P.generatedAttemptPayload({ puzzle: p, action: 'check', hintUsed: 'yes' }).hintUsed, false);
  assert.throws(() => P.generatedAttemptPayload({ puzzle: p, action: 'limp' }), TypeError, 'never stored as call by accident');
  assert.throws(() => P.generatedAttemptPayload({ puzzle: p }), TypeError);
  assert.throws(() => P.generatedAttemptPayload({ puzzle: { _id: 'a'.repeat(24) }, action: 'fold' }), TypeError);
  assert.throws(() => P.generatedAttemptPayload(), TypeError);
  assert.ok(!('puzzleRating' in body) && !('leakKey' in body), 'nothing the server ignores but the seed');
});

t("daily: only the day's puzzle, answered that day", () => {
  const answeredAt = new Date('2026-09-30T01:00:00Z'); // 18:00 on Sep 29 at UTC-7
  const day = P.todayKey(answeredAt, 420);
  const req = P.dailyRequest(day);
  const daily = { ...clone(FIX.puzzles[0]), difficulty: req.difficulty, meta: { ...FIX.puzzles[0].meta, topic: req.topic, seed: req.seed } };
  const pay = (extra) => P.generatedAttemptPayload({ puzzle: daily, action: 'call', ...extra });
  assert.strictEqual(pay({ daily: true, answeredAt, tzOffsetMinutes: 420 }).daily, true);
  assert.strictEqual(pay({ answeredAt, tzOffsetMinutes: 420 }).daily, true, 'worked out from the puzzle');
  assert.strictEqual(pay({ daily: false, answeredAt, tzOffsetMinutes: 420 }).daily, false);
  assert.strictEqual(pay({ daily: true, answeredAt, tzOffsetMinutes: 0 }).daily, false, 'in UTC that moment is already Sep 30');
  assert.strictEqual(pay({ daily: true, answeredAt: answeredAt.getTime() + 7 * 3600 * 1000, tzOffsetMinutes: 420 }).daily, false, 'answered after midnight');
  assert.strictEqual(pay({}).daily, false);
  assert.throws(() => pay({ daily: true }), TypeError, 'a daily claim needs the moment of the answer');
  assert.strictEqual(P.generatedAttemptPayload({ puzzle: FIX.puzzles[0], action: 'call', daily: true, answeredAt, tzOffsetMinutes: 420 }).daily, false, 'not the daily puzzle');
  assert.deepStrictEqual(serverReads(pay({ daily: true, answeredAt, tzOffsetMinutes: 420 })).daily, true);
});

t('library puzzles, lesson puzzles, and the one call both clients make', () => {
  const library = { _id: '65f0c0ffee0000000000abcd', title: 'Stored', difficulty: 'advanced', initialState: { opponentBet: 200, action: 'facing_bet' }, progression: { correctAction: 'call' } };
  assert.strictEqual(P.puzzleKind(library), 'library');
  assert.strictEqual(P.puzzleKind(FIX.puzzles[0]), 'generated');
  assert.strictEqual(P.puzzleKind({ tags: ['generated'] }), 'generated');
  assert.strictEqual(P.puzzleKind({ id: 'lesson-pot-odds-001', progression: { correctAction: 'call' } }), 'local');
  assert.strictEqual(P.puzzleKind({ _id: 'abc', meta: { topic: 'pot-odds', seed: 1 } }), 'local', 'an id that is not a database id');
  assert.strictEqual(P.puzzleKind(null), null);
  assert.deepStrictEqual(P.libraryAttemptPayload({ puzzle: library, action: 'CALL', timeTakenMs: 900 }),
    { puzzleId: '65f0c0ffee0000000000abcd', correct: true, action: 'call', timeTakenMs: 900 });
  assert.throws(() => P.libraryAttemptPayload({ puzzle: FIX.puzzles[0], action: 'call' }), TypeError);
  assert.deepStrictEqual(P.puzzleAttempt({ puzzle: library, action: 'fold' }), { endpoint: 'library', body: { puzzleId: library._id, correct: false, action: 'fold', timeTakenMs: 0 } });
  const gen = P.puzzleAttempt({ puzzle: FIX.puzzles[0], action: 'call', timeTakenMs: 10 });
  assert.strictEqual(gen.endpoint, 'generated');
  assert.deepStrictEqual(gen.body, P.generatedAttemptPayload({ puzzle: FIX.puzzles[0], action: 'call', timeTakenMs: 10 }));
  assert.strictEqual(P.puzzleAttempt({ puzzle: { id: 'lesson-1' }, action: 'fold' }), null);
  assert.deepStrictEqual([...P.ATTEMPT_ACTIONS], [...SERVER_ACTIONS]);
});

// ===========================================================================
section('COPY, PURITY AND THE PACKAGE');
// ===========================================================================

const SRC = path.join(__dirname, '..', 'src', 'puzzles');
const sources = fs.readdirSync(SRC).filter((f) => f.endsWith('.js')).map((f) => [f, fs.readFileSync(path.join(SRC, f), 'utf8')]);

t('the copy lives in one frozen place, with no em-dashes', () => {
  const strings = [];
  const walk = (v) => {
    if (typeof v === 'string') strings.push(v);
    else if (v && typeof v === 'object') { assert.ok(Object.isFrozen(v)); Object.values(v).forEach(walk); }
  };
  walk(P.PUZZLE_COPY);
  assert.ok(strings.length > 20);
  // Em-dash and en-dash, built from their code points so this file carries neither.
  const DASH = new RegExp(`[${String.fromCharCode(0x2014)}${String.fromCharCode(0x2013)}]`);
  strings.forEach((s) => assert.ok(!DASH.test(s), `dash in ${JSON.stringify(s)}`));
  sources.forEach(([f, text]) => assert.ok(!DASH.test(text), `dash in src/puzzles/${f}`));
  // Every label the engine hands out comes from PUZZLE_COPY.
  const labels = new Set(strings);
  FIX.puzzles.forEach((p) => P.puzzleActions(p).forEach((a) => assert.ok(labels.has(a.label), a.label)));
  P.PUZZLE_BAND_TABLE.forEach((b) => assert.ok(labels.has(b.label)));
  ['correct', 'wrong', 'open'].forEach((tone) => assert.ok(labels.has(P.PUZZLE_COPY.verdict[tone])));
});

t('pure: no clock, no randomness, no I/O, no platform APIs, only local requires', () => {
  sources.forEach(([f, text]) => {
    const code = text.replace(/\/\/.*$/gm, '');
    assert.ok(!/Math\.random|Date\.now|performance\.now/.test(code), `${f}: clock or randomness`);
    assert.ok(!/\b(window|document|localStorage|sessionStorage|navigator|fetch|XMLHttpRequest|process\.env)\b/.test(code), `${f}: platform API`);
    const requires = [...code.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1]);
    requires.forEach((r) => assert.ok(r.startsWith('./') || r.startsWith('../state/'), `${f} requires ${r}`));
    assert.ok(!/\bimport\b|\bexport\b/.test(code), `${f}: CommonJS only`);
  });
});

t('the same inputs give the same outputs', () => {
  const run = () => FIX.puzzles.map((p) => [
    P.resolveAnswer(p, 'call'), P.puzzleActions(p), P.puzzleIdentity(p),
    P.generatedAttemptPayload({ puzzle: p, action: 'fold', timeTakenMs: 1, answeredAt: 0, tzOffsetMinutes: 0 }),
  ]);
  assert.deepStrictEqual(run(), run());
  const req = () => ['solve', 'topic', 'rush'].map((mode) => P.nextPuzzleRequest({ mode, seedSource: 123, topic: 'pot-odds', streak: 4 }));
  assert.deepStrictEqual(req(), req());
});

t('the package: ./puzzles is exported, and the main barrel carries it unchanged', () => {
  assert.strictEqual(pkg.exports['./puzzles'], './src/puzzles/index.js');
  assert.ok(pkg.scripts.test.includes('test/puzzles.test.js'));
  Object.keys(P).forEach((k) => assert.strictEqual(core[k], P[k], `core.${k} is the puzzles export`));
  // Nothing in the puzzles barrel shadows another subpath's export.
  const others = ['review', 'insights', 'rating', 'state', 'data'].map((s) => require(`../src/${s}`));
  Object.keys(P).forEach((k) => others.forEach((m) => assert.ok(!(k in m), `${k} is already exported elsewhere`)));
  // The existing subpaths still load and keep their surface.
  assert.strictEqual(typeof core.normalizePuzzleState, 'function');
  assert.strictEqual(typeof core.normalizeDifficulty, 'function', "rating's normalizeDifficulty is untouched");
  assert.notStrictEqual(core.normalizeDifficulty, core.normaliseDifficulty);
});

console.log(`\npuzzles tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
