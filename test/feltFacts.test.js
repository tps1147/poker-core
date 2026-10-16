// The table coach's felt facts (src/insights/feltFacts.js): texture words, what the bet asks, outs.
const assert = require('assert');
const { feltFacts, textureWords } = require('../src/insights');
const { getReviewEngine } = require('../src/review');

const cards = (text) => text.split(' ').map((t) => ({ rank: t.slice(0, -1), suit: t.slice(-1) }));

assert.strictEqual(textureWords(cards('K♠ 7♥ 2♦')), 'Dry');
assert.strictEqual(textureWords(cards('9♥ 8♥ 2♦')), 'Two-tone');
assert.strictEqual(textureWords(cards('9♥ 8♣ 7♦')), 'Straight possible');
assert.strictEqual(textureWords(cards('K♥ 9♥ 2♥')), 'Flush possible');
assert.strictEqual(textureWords(cards('K♠ K♥ 7♦')), 'Paired');
assert.strictEqual(textureWords(cards('A♠ 2♥ 3♦')), 'Straight possible', 'the wheel counts');
assert.strictEqual(textureWords(cards('J♥ T♥ 9♥ 9♣')), 'Flush possible · Straight possible');
assert.strictEqual(textureWords(cards('Q♠ 9♥ 2♦')), 'Dry');
assert.strictEqual(textureWords(cards('Q♠ T♥ 2♦')), 'Connected');
assert.strictEqual(textureWords([]), null);

const engine = getReviewEngine();
// Half-pot bet on the flop: 300 into 600 — call 300 to win 900, needs 25%.
const flop = feltFacts({ phase: 'flop', holeCards: cards('A♥ Q♥'), board: cards('K♥ 7♥ 2♦'), pot: 600, heroBet: 0, opponentBet: 300, toCall: 300, heroStack: 5000, bigBlind: 100 }, engine);
assert.deepStrictEqual(flop.ask, { label: 'Half-pot bet', toCall: 300, wins: 900, neededPct: 25 });
assert.strictEqual(flop.texture, 'Two-tone');
assert.strictEqual(flop.outs, 9, 'a nut flush draw has nine outs');

// Nothing owed: no ask. River: no outs.
const river = feltFacts({ phase: 'river', holeCards: cards('A♥ Q♥'), board: cards('K♥ 7♥ 2♦ 3♣ 9♠'), pot: 600, toCall: 0, heroStack: 5000 }, engine);
assert.strictEqual(river.ask, null);
assert.strictEqual(river.outs, null);

// Sizes, a raise, the blind and an all-in, capped at the stack.
const ask = (o) => feltFacts({ phase: 'turn', pot: 1000, heroStack: 9000, bigBlind: 100, ...o }).ask;
assert.strictEqual(ask({ opponentBet: 300 }).label, 'Small bet');
assert.strictEqual(ask({ opponentBet: 750 }).label, 'Big bet');
assert.strictEqual(ask({ opponentBet: 1000 }).label, 'Pot-sized bet');
assert.strictEqual(ask({ opponentBet: 1600 }).label, 'Overbet');
assert.strictEqual(ask({ heroBet: 300, opponentBet: 900 }).label, 'Raise');
assert.strictEqual(ask({ opponentBet: 4000, opponentAllIn: true, heroStack: 2500 }).toCall, 2500);
assert.strictEqual(ask({ opponentBet: 4000, opponentAllIn: true }).label, 'All-in');
assert.strictEqual(feltFacts({ phase: 'preflop', pot: 0, heroBet: 50, opponentBet: 100, heroStack: 9000, bigBlind: 100 }).ask.label, 'The big blind');
assert.strictEqual(feltFacts({ phase: 'preflop', pot: 0, heroBet: 100, opponentBet: 300, heroStack: 9000, bigBlind: 100 }).ask.label, 'Raise');

// Facts only: no advice words, no opponent words.
assert.ok(!/fold|should|bot|\bAI\b|opponent/i.test(JSON.stringify(flop)));
console.log('feltFacts: texture, the ask and outs pass');
