// The web imports poker-core/puzzles with ESM named imports (flop52web, Next / turbopack and
// node --test). This checks that every CommonJS export of the puzzles barrel is a named ESM
// export through the package's own exports map, as node's CJS lexer sees it.
//   node test/puzzles.esm.test.mjs

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as esm from 'poker-core/puzzles';
import { nextPuzzleRequest, gradeAnswer, dealPlan, generatedAttemptPayload, adaptiveBand, PUZZLE_COPY } from 'poker-core/puzzles';

const require = createRequire(import.meta.url);
const cjs = require('../src/puzzles/index.js');

const missing = Object.keys(cjs).filter((k) => !(k in esm));
assert.deepEqual(missing, [], `named ESM exports missing: ${missing.join(', ')}`);
Object.keys(cjs).forEach((k) => assert.equal(esm[k], cjs[k], k));

assert.equal(typeof nextPuzzleRequest, 'function');
assert.equal(typeof gradeAnswer, 'function');
assert.equal(typeof dealPlan, 'function');
assert.equal(typeof generatedAttemptPayload, 'function');
assert.equal(adaptiveBand({ rating: 1800, seed: 1 }), 'advanced');
assert.equal(PUZZLE_COPY.actions.fold, 'Fold');

// The main barrel's named exports carry the engine too.
const core = await import('poker-core');
assert.equal(core.nextPuzzleRequest, cjs.nextPuzzleRequest);

// No puzzles export shares a name with poker-core/learn (the ES-module subpath that
// puzzles.test.js cannot require): learn's actionLabel(spot, action) is not the puzzles label.
const learn = await import('poker-core/learn');
const shared = Object.keys(cjs).filter((k) => k in learn);
assert.deepEqual(shared, [], `puzzles exports also exported by poker-core/learn: ${shared.join(', ')}`);

console.log(`puzzles ESM checks passed (${Object.keys(cjs).length} named exports)`);
