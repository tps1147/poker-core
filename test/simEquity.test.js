// The grader's simulated equity (src/review/simEquity.js).
const assert = require('assert');
const { simulatedEquity } = require('../src/review/simEquity');

// Simulated equity: T8 on Q-3-2 is about a third against a random hand, a little less against a
// half-pot betting range, never the 12% the strength score gave (a mistake to call, not a blunder).
const c = (s) => s.match(/../g).map((x) => ({ rank: x[0], suit: x[1] }));
const vsRandom = simulatedEquity(c('Th8c'), c('2s3cQh'));
assert.ok(vsRandom > 29 && vsRandom < 38, `T8 on Q32 vs random ~ a third, got ${vsRandom}`);
const t8 = simulatedEquity(c('Th8c'), c('2s3cQh'), { toCall: 50, pot: 100 });
assert.ok(t8 > 22 && t8 < vsRandom, `T8 on Q32 facing half pot is below vs-random, got ${t8}`);
assert.strictEqual(simulatedEquity(c('Th8c'), c('2s3cQh'), { toCall: 50, pot: 100 }), t8, 'deterministic');
assert.ok(simulatedEquity(c('AsAh'), c('Kd7c2s')) > 80);
assert.strictEqual(simulatedEquity(c('AhKh'), c('2h7h9cQhJs')), 100);
console.log('simEquity: all assertions passed');
