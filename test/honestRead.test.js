// The honest evaluation read: fixture ladder + DIFFERENTIAL verification against
// the server's implementation.
//   node test/honestRead.test.js
//
// The acceptance bar for the port is the differential, not the fixtures alone:
// poker-core's evaluateHandStrength must agree with the server's
// (pokerServer/src/game/AIPlayer.js) POST-FLOP to < 1e-9 over thousands of seeded
// random deals, because Match Review grades the player on this number while the
// opponent decides on the server's. PRE-FLOP the two intentionally differ: the
// server bot keeps its crude heuristic (its decision bands are tuned to it), the
// insight engine reports the real generated equity table — so pre-flop we assert
// poker-core === the table instead.
//
// Requires the sibling server repo at ../../pokerServer (same checkout layout the
// deploy scripts assume). The server AI modules are plain dependency-free CJS.

const assert = require('assert');
const path = require('path');

const AIPlayer = require('../src/ai/aiPlayer');
const { PREFLOP_EQUITY, canonicalKey } = require('../src/data/preflopEquity');

const ServerAIPlayer = require(path.join(
  __dirname, '..', '..', 'pokerServer', 'src', 'game', 'AIPlayer.js'));

const RANKS = '23456789TJQKA';
const SUITS = '♠♥♦♣';
const card = (rank, suit) => ({ rank, suit });

// Deterministic rng (mulberry32) so a failure reproduces exactly.
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const engine = new AIPlayer({ rng: mulberry32(1) });
const server = new ServerAIPlayer();
server.setBotConfig({ rng: mulberry32(2) }); // fixed rng + plain config, per the server pattern

// ── pre-flop: the real table ────────────────────────────────────────────────
assert.strictEqual(engine.evaluateHandStrength([card('A', '♠'), card('A', '♥')], []), 0.8536, 'AA reads the table equity');
assert.strictEqual(engine.evaluateHandStrength([card('A', '♠'), card('K', '♠')], []), 0.6719, 'AKs reads the table equity');
assert.strictEqual(engine.evaluateHandStrength([card('3', '♦'), card('2', '♣')], []), 0.3239, '32o reads the table equity');
assert.strictEqual(engine.evaluateHandStrength([card('X', '♠'), card('Y', '♠')], []), 0.5, 'unknown ranks fall back to 0.5');

// ── the flop that exposed the old read: 2♥ 7♦ 9♠ rainbow ───────────────────
const FLOP_279 = [card('2', '♥'), card('7', '♦'), card('9', '♠')];

// AK-high air: was ~1.0 (kept its inflated pre-flop number), honest read is 0.20.
const akAir = engine.evaluateHandStrength([card('A', '♣'), card('K', '♣')], FLOP_279);
assert.ok(Math.abs(akAir - 0.20) < 1e-9, `AK air on 2-7-9 reads 0.20 (got ${akAir})`);

// A hand actually holding a seven now outranks the air, at every tier:
const pairOf7s = engine.evaluateHandStrength([card('A', '♦'), card('7', '♣')], FLOP_279); // second pair
const twoPair97 = engine.evaluateHandStrength([card('9', '♣'), card('7', '♣')], FLOP_279); // the ~0.66 band
const setOf7s = engine.evaluateHandStrength([card('7', '♠'), card('7', '♣')], FLOP_279);
assert.ok(Math.abs(pairOf7s - 0.45) < 1e-9, `pair of sevens (A kicker) reads 0.45 (got ${pairOf7s})`);
assert.ok(Math.abs(twoPair97 - 0.66) < 1e-9, `nines and sevens reads the 0.66 two-pair band (got ${twoPair97})`);
assert.ok(Math.abs(setOf7s - 0.78) < 1e-9, `set of sevens reads the 0.78 set band (got ${setOf7s})`);
assert.ok(akAir < pairOf7s && pairOf7s < setOf7s, 'made sevens outrank the AK air');

// QQ overpair on that flop: the 0.58 overpair band, no draw contamination.
const qqOver = engine.evaluateHandStrength([card('Q', '♠'), card('Q', '♣')], FLOP_279);
assert.ok(Math.abs(qqOver - 0.58) < 1e-9, `QQ overpair reads 0.58 (got ${qqOver})`);

// ── draws: honest counting ──────────────────────────────────────────────────
// Turn combo draw (royal draw): 9 flush outs + 4 straight outs, capped at 0.3.
const comboHole = [card('A', '♣'), card('K', '♣')];
const comboTurn = [card('Q', '♣'), card('J', '♣'), card('2', '♥'), card('7', '♦')];
const comboDraw = engine.evaluateDrawingHands([...comboHole, ...comboTurn], comboTurn, 1);
assert.strictEqual(comboDraw.flushOuts, 9, 'four clubs = 9 flush outs');
assert.strictEqual(comboDraw.straightOuts, 4, 'AKQJ needs exactly the four tens');
assert.strictEqual(comboDraw.totalOuts, 13);
assert.ok(Math.abs(comboDraw.totalValue - 0.3) < 1e-9, 'combo draw value capped at 0.3');

// Same hand with the river dealt: the draw is dead and adds 0 — via the explicit
// signature AND via the legacy one-argument call the HUD/grader make.
const deadBoard = [...comboTurn, card('9', '♠')];
const deadExplicit = engine.evaluateDrawingHands([...comboHole, ...deadBoard], deadBoard, 0);
const deadLegacy = engine.evaluateDrawingHands([...comboHole, ...deadBoard]);
for (const dead of [deadExplicit, deadLegacy]) {
  assert.strictEqual(dead.totalValue, 0, 'river draws add 0');
  assert.strictEqual(dead.totalOuts, 0, 'river outs read 0');
}
const deadStrength = engine.evaluateHandStrength(comboHole, deadBoard);
assert.ok(Math.abs(deadStrength - 0.20) < 1e-9, `dead river draw: AK-high reads its 0.20 high-card value (got ${deadStrength})`);

// Board-only flush draw is NOT credited: four hearts on board, none in hand.
const heartBoard = [card('Q', '♥'), card('J', '♥'), card('4', '♥'), card('2', '♥')];
const boardOnly = engine.evaluateDrawingHands(
  [card('A', '♣'), card('K', '♦'), ...heartBoard], heartBoard, 1);
assert.strictEqual(boardOnly.flushOuts, 0, 'the board\'s own flush draw is subtracted away');
assert.strictEqual(boardOnly.straightOuts, 4, 'the hero\'s own broadway gutshot survives the subtraction');

// hasFlushDraw / hasStraightDraw keep the legacy HUD shapes.
const fd = engine.hasFlushDraw([...comboHole, ...comboTurn]);
assert.deepStrictEqual(fd, { isFlushDraw: true, outs: 9, suit: '♣', type: 'flush-draw' });
assert.deepStrictEqual(engine.hasFlushDraw(FLOP_279), { isFlushDraw: false, outs: 0 }, 'no 3-card "backdoor flush" any more');
const sd = engine.hasStraightDraw([card('T', '♣'), card('J', '♦'), card('Q', '♥'), card('K', '♠')]);
assert.deepStrictEqual(sd, { isStraightDraw: true, outs: 8, type: 'open-ended' });

// ── deuce regression: falsy rank-index 0 in pokerEvaluator ──────────────────
// The differential caught these: hands made of 2s (rank index 0) fell through
// evaluateHand's truthiness checks and read as lower categories.
const deucePair = engine.evaluateHandStrength(
  [card('2', '♥'), card('J', '♦')], [card('2', '♣'), card('7', '♥'), card('4', '♥')]);
assert.ok(Math.abs(deucePair - 0.3625) < 1e-9, `pair of deuces reads as a pair, not high card (got ${deucePair})`);
const deuceQuads = engine.evaluateHandStrength(
  [card('2', '♠'), card('2', '♣')], [card('2', '♦'), card('2', '♥'), card('K', '♦'), card('9', '♠'), card('3', '♣')]);
assert.ok(Math.abs(deuceQuads - 0.97) < 1e-9, `quad deuces read as quads (got ${deuceQuads})`);
const deuceBoat = engine.evaluateHandStrength(
  [card('K', '♠'), card('K', '♣')], [card('K', '♦'), card('2', '♥'), card('2', '♣'), card('9', '♠'), card('4', '♦')]);
assert.ok(Math.abs(deuceBoat - 0.93) < 1e-9, `kings full of deuces reads as a full house (got ${deuceBoat})`);

// ── six-suited straight flush + royal regressions in pokerEvaluator ─────────
// Also caught by the differential: with 6 cards of one suit the straight flush
// can live below the five highest suited cards, and the top-5 slice missed it.
const sixSuitedSF = engine.evaluateHandStrength(
  [card('9', '♠'), card('K', '♦')],
  [card('9', '♦'), card('6', '♦'), card('7', '♦'), card('8', '♦'), card('T', '♦')]);
assert.ok(Math.abs(sixSuitedSF - 0.99) < 1e-9, `board straight flush under K♦ reads 0.99, not flush (got ${sixSuitedSF})`);
const { evaluateHand } = require('../src/eval/pokerEvaluator');
assert.strictEqual(evaluateHand(
  [card('A', '♥'), card('K', '♥'), card('Q', '♥'), card('J', '♥'), card('T', '♥'), card('2', '♣'), card('7', '♦')]
).name, 'Royal Flush', 'a royal is named a royal');

// ── strictly increasing category ladder (river boards: zero draw noise) ─────
const ladder = [
  ['high card', [card('A', '♣'), card('Q', '♥')], [card('2', '♥'), card('7', '♦'), card('9', '♠'), card('K', '♦'), card('3', '♣')], 0.175],
  ['top pair', [card('K', '♣'), card('Q', '♣')], [card('2', '♥'), card('7', '♦'), card('9', '♠'), card('K', '♦'), card('3', '♣')], 0.55],
  ['two pair', [card('K', '♣'), card('9', '♣')], [card('2', '♥'), card('7', '♦'), card('9', '♠'), card('K', '♦'), card('3', '♣')], 0.66],
  ['set', [card('7', '♠'), card('7', '♣')], [card('2', '♥'), card('7', '♦'), card('9', '♠'), card('K', '♦'), card('3', '♣')], 0.78],
  ['straight', [card('J', '♣'), card('T', '♣')], [card('9', '♠'), card('8', '♦'), card('Q', '♥'), card('2', '♣'), card('K', '♦')], 0.83],
  ['flush', [card('A', '♥'), card('Q', '♥')], [card('2', '♥'), card('7', '♥'), card('9', '♥'), card('K', '♦'), card('3', '♣')], 0.90],
  ['full house', [card('7', '♠'), card('7', '♣')], [card('7', '♦'), card('9', '♠'), card('9', '♦'), card('K', '♦'), card('2', '♣')], 0.93],
  ['quads', [card('7', '♠'), card('7', '♣')], [card('7', '♦'), card('7', '♥'), card('K', '♦'), card('9', '♠'), card('2', '♣')], 0.97],
  ['straight flush', [card('J', '♣'), card('T', '♣')], [card('9', '♣'), card('8', '♣'), card('Q', '♣'), card('2', '♥'), card('K', '♦')], 0.99],
];
let prev = -1;
for (const [label, hole, board, expected] of ladder) {
  const s = engine.evaluateHandStrength(hole, board);
  assert.ok(Math.abs(s - expected) < 1e-9, `${label} reads ${expected} (got ${s})`);
  assert.ok(s > prev, `${label} (${s}) outranks the previous rung (${prev})`);
  prev = s;
}

// ── DIFFERENTIAL vs the server implementation ───────────────────────────────
const deck = [];
for (const rank of RANKS) for (const suit of SUITS) deck.push(card(rank, suit));

const rng = mulberry32(0xF10052);
const draw = (count) => {
  // Partial Fisher-Yates off a fresh copy: first `count` cards are the deal.
  const d = deck.slice();
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (d.length - i));
    const tmp = d[i]; d[i] = d[j]; d[j] = tmp;
  }
  return d.slice(0, count);
};

const PER_BOARD = 800; // x3 board sizes = 2400 post-flop comparisons
let maxDelta = 0;
let compared = 0;
for (const boardLen of [3, 4, 5]) {
  for (let i = 0; i < PER_BOARD; i++) {
    const dealt = draw(2 + boardLen);
    const hole = dealt.slice(0, 2);
    const board = dealt.slice(2);

    const ours = engine.evaluateHandStrength(hole, board);
    const theirs = server.evaluateHandStrength(hole, board);
    const delta = Math.abs(ours - theirs);
    if (delta > maxDelta) maxDelta = delta;
    compared++;
    assert.ok(delta < 1e-9,
      `post-flop divergence ${delta} at board ${boardLen}: ` +
      `${hole.map(c => c.rank + c.suit).join(' ')} | ${board.map(c => c.rank + c.suit).join(' ')} ` +
      `(core ${ours} vs server ${theirs})`);

    // Pre-flop on the same hole cards: poker-core must equal the TABLE exactly
    // (the server heuristic is expected to differ and is not compared).
    const pre = engine.evaluateHandStrength(hole, []);
    assert.strictEqual(pre, PREFLOP_EQUITY[canonicalKey(hole[0], hole[1], RANKS)],
      `pre-flop ${hole.map(c => c.rank + c.suit).join(' ')} equals the table`);
  }
}
assert.strictEqual(compared, PER_BOARD * 3);

// ── deterministic rng injection ─────────────────────────────────────────────
const fixed = new AIPlayer({ rng: () => 0 });
assert.strictEqual(fixed.rng(), 0, 'constructor-injected rng is used');
assert.strictEqual(typeof new AIPlayer().rng, 'function', 'default rng present');

console.log(`honest-read checks passed (differential: ${compared} post-flop deals, max |delta| = ${maxDelta})`);
