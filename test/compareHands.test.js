// compareHands kicker regression + differential against a brute-force reference.
//   node test/compareHands.test.js
//
// compareHands used to stop at the category's headline value, so two hands with
// the same pair / trips / quads / two pair / high card always tied whatever
// their kickers: A♠K♦ vs A♣Q♦ on an ace-high board came back 0. The reference
// below scores every 5-card subset of the 7 cards with a plain canonical
// ordering and keeps the best, so it agrees with the real rules by construction.

const assert = require('assert');
const { evaluateHand, compareHands } = require('../src/eval/pokerEvaluator');

const RANKS = '23456789TJQKA';
const SUITS = '♠♥♦♣';
const parse = (codes) => codes.trim().split(/\s+/).map((c) => ({ rank: c[0], suit: c[1] }));
const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);
const cmp = (hole1, hole2, board) => sign(compareHands(
  evaluateHand(parse(`${hole1} ${board}`)),
  evaluateHand(parse(`${hole2} ${board}`))));

// ── the reported bug ────────────────────────────────────────────────────────
assert.strictEqual(cmp('A♠ K♦', 'A♣ Q♦', 'A♥ 9♣ 7♦ 4♠ 2♥'), 1, 'AK beats AQ on an ace-high board');
assert.strictEqual(cmp('A♣ Q♦', 'A♠ K♦', 'A♥ 9♣ 7♦ 4♠ 2♥'), -1, 'and the other way round');

// ── every category: kickers break ties, true ties stay ties ─────────────────
const cases = [
  // [hole1, hole2, board, expected, label]
  ['A♠ 3♦', 'K♣ 3♥', 'Q♥ 9♣ 7♦ 5♠ 2♥', 1, 'high card: A-high beats K-high'],
  ['A♠ 8♦', 'A♣ 6♥', 'Q♥ T♣ 7♦ 4♠ 2♥', 1, 'high card: fifth card decides'],
  ['A♠ 3♦', 'A♣ 2♥', 'K♥ Q♣ 9♦ 7♠ 5♥', 0, 'high card: sixth/seventh card plays no part'],
  ['K♠ 9♦', 'K♣ 8♥', 'K♥ Q♣ 7♦ 4♠ 2♥', 1, 'pair: third kicker decides'],
  ['K♠ 3♦', 'K♣ 2♥', 'K♥ Q♣ 9♦ 7♠ 5♥', 0, 'pair: board kickers play, split'],
  ['J♠ J♦', 'J♣ J♥', 'A♥ K♣ 9♦ 4♠ 2♥', 0, 'pair: same pair, same kickers, split'],
  ['A♠ 2♦', 'Q♠ 2♥', '9♥ 9♣ 5♦ 5♠ 3♥', 1, 'two pair: kicker decides'],
  ['A♠ 2♦', 'A♣ 3♥', 'K♥ K♣ 6♦ 6♠ 4♥', 0, 'two pair: same kicker, split'],
  ['4♠ 2♦', '3♣ 2♥', 'Q♥ Q♣ J♦ J♠ T♥', 0, 'two pair: board kicker plays, split'],
  ['A♠ 3♦', 'K♣ 3♥', '8♥ 8♣ 8♦ 6♠ 2♥', 1, 'trips: first kicker decides'],
  ['8♠ A♦', '8♣ A♥', '8♥ 8♦ K♣ 6♠ 2♥', 0, 'trips: same kickers, split'],
  ['A♠ 3♦', 'K♣ 3♥', '7♥ 7♣ 7♦ 7♠ 2♥', 1, 'quads: kicker decides'],
  ['3♠ 2♦', '4♣ 2♥', '7♥ 7♣ 7♦ 7♠ A♥', 0, 'quads: board kicker plays, split'],
  ['9♠ 2♦', '4♣ 2♥', '8♥ 7♣ 6♦ 5♠ K♥', 1, 'straight: higher straight wins'],
  ['T♠ 2♦', 'T♣ 3♥', '9♥ 8♣ 7♦ 6♠ K♥', 0, 'straight: same straight, split'],
  ['A♠ K♦', '9♣ 8♥', '6♥ 5♣ 4♦ 3♠ 2♥', 0, 'straight: ace does not turn a six-high board straight into a wheel'],
  ['A♥ 2♦', 'Q♥ 3♣', 'K♥ 9♥ 6♥ 4♥ J♠', 1, 'flush: higher flush card wins'],
  ['2♠ 3♦', '4♣ 5♦', 'A♥ K♥ 9♥ 6♥ 4♥', 0, 'flush: board flush, split'],
  ['9♥ 2♦', '3♥ 2♣', '8♥ 7♥ 6♥ 5♥ K♠', 1, 'straight flush: higher one wins'],
  ['K♠ K♦', 'Q♣ Q♥', 'K♥ Q♦ 7♠ 7♣ 2♥', 1, 'full house: trips decide'],
  ['A♠ 9♦', 'K♣ 9♥', '9♣ 9♠ 4♦ A♥ K♦', 1, 'full house: pair decides'],
  ['2♠ 3♦', '4♣ 5♦', 'T♥ J♥ Q♥ K♥ A♥', 0, 'royal flush on board, split'],
];
for (const [h1, h2, board, want, label] of cases) {
  assert.strictEqual(cmp(h1, h2, board), want, label);
  assert.strictEqual(cmp(h2, h1, board), 0 - want || 0, `${label} (reversed)`);
}

// ── differential: random 7-card hands vs a brute-force best-of-21 ───────────
function score5(cards) {
  const ranks = cards.map((c) => RANKS.indexOf(c.rank)).sort((a, b) => b - a);
  const counts = new Map();
  for (const r of ranks) counts.set(r, (counts.get(r) || 0) + 1);
  // groups ordered by size then rank: the canonical tie-break order
  const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flat = groups.map(([r]) => r);
  const flush = cards.every((c) => c.suit === cards[0].suit);
  const uniq = [...new Set(ranks)];
  let straightHigh = -1;
  if (uniq.length === 5 && uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
  if (uniq.join() === '12,3,2,1,0') straightHigh = 3;
  const shape = groups.map(([, n]) => n).join('');
  let cat;
  if (straightHigh >= 0 && flush) cat = 9;
  else if (shape === '41') cat = 8;
  else if (shape === '32') cat = 7;
  else if (flush) cat = 6;
  else if (straightHigh >= 0) cat = 5;
  else if (shape === '311') cat = 4;
  else if (shape === '221') cat = 3;
  else if (shape === '2111') cat = 2;
  else cat = 1;
  return [cat, ...(straightHigh >= 0 ? [straightHigh] : flat)];
}
const cmpScore = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? -1) - (b[i] ?? -1);
    if (d) return sign(d);
  }
  return 0;
};
function best(cards) {
  let top = null;
  for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) {
    const five = cards.filter((_, i) => i !== a && i !== b);
    const s = score5(five);
    if (!top || cmpScore(s, top) > 0) top = s;
  }
  return top;
}

const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rng = mulberry32(52);
const deck = [];
for (const r of RANKS) for (const s of SUITS) deck.push({ rank: r, suit: s });

const DEALS = 20000;
let ties = 0;
for (let n = 0; n < DEALS; n++) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  const board = d.slice(4, 9);
  const c1 = [d[0], d[1], ...board];
  const c2 = [d[2], d[3], ...board];
  const want = cmpScore(best(c1), best(c2));
  const got = sign(compareHands(evaluateHand(c1), evaluateHand(c2)));
  if (want === 0) ties++;
  assert.strictEqual(got, want,
    `deal ${n}: ${c1.map((c) => c.rank + c.suit).join(' ')} vs ${c2.map((c) => c.rank + c.suit).join(' ')}`);
}

console.log(`compareHands checks passed (${cases.length} fixtures, ${DEALS} random showdowns, ${ties} true ties)`);
