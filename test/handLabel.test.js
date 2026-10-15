// The table's plain-words hand label (src/eval/handLabel.js).
const assert = require('assert');
const { describeHand } = require('../src/eval/handLabel');
const { describeHand: fromBarrel } = require('../src');

const cards = (codes) => codes.trim().split(/\s+/).filter(Boolean).map((c) => ({ rank: c.slice(0, -1), suit: c.slice(-1) }));
const label = (hole, board = '') => describeHand(cards(hole), cards(board))?.label;
const tone = (hole, board = '') => describeHand(cards(hole), cards(board))?.tone;

// Preflop
assert.strictEqual(label('A♠ A♥'), 'Pocket Aces');
assert.strictEqual(label('K♠ T♠'), 'King-Ten suited');
assert.strictEqual(label('7d Qc'), 'Queen-Seven offsuit');
assert.strictEqual(label('10h 10s'), 'Pocket Tens');

// Pairs and kickers
assert.strictEqual(label('A♠ 4♦', 'A♥ 9♣ 7♦'), 'Top pair, weak kicker');
assert.strictEqual(label('A♠ K♦', 'A♥ 9♣ 7♦'), 'Top pair, top kicker');
assert.strictEqual(label('A♠ K♦', 'K♥ 9♣ 7♦'), 'Top pair, top kicker');
assert.strictEqual(label('K♠ J♦', 'K♥ 9♣ 7♦'), 'Top pair, good kicker');
assert.strictEqual(label('9♠ 5♦', 'K♥ 9♣ 7♦'), 'Middle pair');
assert.strictEqual(label('7♠ 5♦', 'K♥ 9♣ 7♦'), 'Bottom pair');
assert.strictEqual(label('Q♠ Q♦', 'J♥ 9♣ 7♦'), 'Overpair');
assert.strictEqual(label('5♠ 5♦', 'J♥ 9♣ 7♦'), 'Pocket Fives');
assert.strictEqual(tone('5♠ 5♦', 'J♥ 9♣ 7♦'), 'made');

// Stronger hands
assert.strictEqual(label('7♠ 7♦', 'K♥ 9♣ 7♣'), 'Set of Sevens');
assert.strictEqual(label('K♠ 2♦', 'K♥ K♣ 7♣'), 'Trips, Kings');
assert.strictEqual(label('K♠ 9♦', 'K♥ 9♣ 7♣'), 'Two pair, Kings and Nines');
assert.strictEqual(tone('K♠ 9♦', 'K♥ 9♣ 7♣'), 'strong');
assert.strictEqual(label('8♠ 6♦', '9♥ 7♣ 5♣'), 'Straight');
assert.strictEqual(label('A♣ 2♣', 'K♣ 9♣ 7♣'), 'Flush');
assert.strictEqual(label('7♠ 7♦', '7♥ 9♣ 9♦'), 'Full house');

// The board's hand is not the hero's
assert.strictEqual(label('A♠ 4♦', 'K♥ K♣ 7♦'), 'Nothing yet');
assert.strictEqual(label('7♠ 2♦', 'K♥ K♣ 7♦'), 'Bottom pair');
assert.strictEqual(label('Q♠ Q♦', 'K♥ K♣ 7♦'), 'Pocket Queens');
assert.strictEqual(label('8♠ 2♦', 'K♥ K♣ 7♦ 7♠ 3♣'), 'Eight high');
assert.strictEqual(label('8♠ 2♦', 'A♥ K♣ Q♦ J♠ T♣'), 'Playing the board');
assert.strictEqual(label('4♠ 3♦', 'K♥ K♣ K♦'), 'Nothing yet');
assert.strictEqual(label('J♠ 3♦', 'K♥ K♣ 7♦ 7♠ 3♣'), 'Bottom pair');

// Draws (flop and turn only)
assert.strictEqual(label('A♥ 4♥', 'K♥ 9♥ 2♣'), 'Flush draw');
assert.strictEqual(tone('A♥ 4♥', 'K♥ 9♥ 2♣'), 'draw');
assert.strictEqual(label('8♠ 7♦', '9♥ 6♣ 2♦'), 'Open-ended straight draw');
assert.strictEqual(label('8♠ 7♦', 'J♥ 9♣ 2♦'), 'Gutshot');
assert.strictEqual(label('8♥ 7♥', '9♥ 6♥ 2♦'), 'Flush and straight draw');
assert.strictEqual(label('K♠ 9♦', 'K♣ 8♥ 4♥ 2♥'), 'Top pair, weak kicker');
assert.strictEqual(label('K♥ 9♥', 'K♣ 8♥ 4♥'), 'Top pair + flush draw');
assert.strictEqual(label('2♠ 3♦', 'Q♥ J♣ T♦ 6♠'), 'Nothing yet', 'a board-only run is no draw of ours');
assert.strictEqual(label('A♥ 4♥', 'K♥ 9♥ 2♣ 7♠ 3♦'), 'Ace high', 'no draw talk on the river');
assert.strictEqual(label('A♠ 5♦', '4♥ 3♣ 9♦'), 'Gutshot', 'wheel gutshot');

// Unknown cards give no label
assert.strictEqual(describeHand([{ rank: 'A', suit: '♠' }, { hidden: true }], []), null);
assert.strictEqual(describeHand(null, []), null);
assert.strictEqual(fromBarrel, describeHand);

// Never a number: every label is words.
for (const [h, b] of [['A♠ A♥', ''], ['8♥ 7♥', '9♥ 6♥ 2♦'], ['A♠ 4♦', 'A♥ 9♣ 7♦']]) {
  assert.ok(!/\d|%/.test(label(h, b)), `${label(h, b)} carries no number`);
}

console.log('handLabel: preflop names, pairs and kickers, board-only hands, draws pass');
