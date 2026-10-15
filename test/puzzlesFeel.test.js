// poker-core/puzzles: the reveal, the count, rematches, the daily split and the chip tiers.
//   node test/puzzlesFeel.test.js
const assert = require('assert');
const P = require('../src/puzzles');

let passed = 0;
let failed = 0;
function t(name, fn) {
  try { fn(); passed += 1; } catch (err) { failed += 1; console.error(`FAIL ${name}\n  ${err && err.stack ? err.stack.split('\n').slice(0, 4).join('\n  ') : err}`); }
}

const drawSpot = {
  difficulty: 'intermediate',
  initialState: { phase: 'turn', playerCards: [{ rank: 'Q', suit: '♥' }, { rank: 'J', suit: '♥' }], communityCards: ['Th', '9c', '3h', '2s'], pot: 100, opponentBet: 50, action: 'facing_bet' },
  meta: { topic: 'pot-odds', seed: 5, equity: 33, requiredEquity: 25 },
  progression: { correctAction: 'call' },
};

t('duel: equity against price, edge and the side it favours', () => {
  assert.deepStrictEqual(P.puzzleDuel({ equity: 33, price: 25 }), { equity: 33, price: 25, edge: 8, favours: 'call' });
  assert.strictEqual(P.puzzleDuel({ equity: 18, price: 25 }).favours, 'fold');
  assert.strictEqual(P.puzzleDuel({ equity: 62, price: null }), null);
  assert.strictEqual(P.puzzleDuel(null), null);
});

t('count: open-ended straight flush draw on the turn is 15 outs, 33%', () => {
  const c = P.puzzleCount(drawSpot);
  assert.strictEqual(c.unseen, 46);
  assert.strictEqual(c.outs, 15);
  assert.strictEqual(c.hitPct, 33);
  assert.deepStrictEqual(c.groups.map((g) => [g.id, g.count]), [['flush', 9], ['straight', 6]]);
  assert.strictEqual(c.pairs.count, 6);
  assert.strictEqual(c.tiles.length, 46);
  assert.strictEqual(c.tiles.filter((x) => x.group && x.group !== 'pair').length, 15);
  assert.ok(!/—/.test(c.line));
});

t('count: flush draw on the flop is 9 outs, 35% by the river, rule of 4 says 36', () => {
  const c = P.puzzleCount({ initialState: { playerCards: ['Ah', 'Kh'], communityCards: ['7h', '5h', '2c'] } });
  assert.strictEqual(c.outs, 9);
  assert.strictEqual(c.toCome, 2);
  assert.strictEqual(c.hitPct, 35);
  assert.strictEqual(c.rulePct, 36);
});

t('count: a card that only pairs the board is never an out', () => {
  const c = P.puzzleCount({ initialState: { playerCards: ['9s', '9d'], communityCards: ['Kc', '7h', '2d'] } });
  assert.strictEqual(c.outs, 2);
  assert.deepStrictEqual(c.groups.map((g) => g.id), ['trips']);
});

t('count: null preflop, on the river, with bad cards, or nothing to hit', () => {
  assert.strictEqual(P.puzzleCount({ initialState: { playerCards: ['Ah', 'Kh'], communityCards: [] } }), null);
  assert.strictEqual(P.puzzleCount({ initialState: { playerCards: ['Ah', 'Kh'], communityCards: ['7h', '5h', '2c', '3d', '9s'] } }), null);
  assert.strictEqual(P.puzzleCount({ initialState: { playerCards: ['Ah', 'Ah'], communityCards: ['7h', '5h', '2c'] } }), null);
  assert.strictEqual(P.puzzleCount(null), null);
});

t('tiers: ladder, progress, promotion only upward', () => {
  assert.deepStrictEqual(P.PUZZLE_TIERS.map((x) => x.from), [null, 1100, 1250, 1400, 1550, 1700]);
  assert.strictEqual(P.puzzleTier(900).tier.id, 'white');
  const red = P.puzzleTier(1238);
  assert.strictEqual(red.tier.id, 'red');
  assert.strictEqual(red.toNext, 12);
  assert.strictEqual(red.next.id, 'green');
  assert.strictEqual(P.puzzleTier(1250).tier.id, 'green');
  assert.strictEqual(P.puzzleTier(1900).next, null);
  assert.strictEqual(P.puzzleTier(1900).progress, 1);
  assert.strictEqual(P.puzzleTier(null), null);
  assert.strictEqual(P.puzzleTierPromotion(1238, 1253).id, 'green');
  assert.strictEqual(P.puzzleTierPromotion(1253, 1238), null);
  assert.strictEqual(P.puzzleTierPromotion(1240, 1245), null);
  // Green and Purple sit on the adaptive cut-offs.
  assert.strictEqual(P.PUZZLE_TIERS[2].from, P.ADAPTIVE_CUTOFFS.intermediate);
  assert.strictEqual(P.PUZZLE_TIERS[4].from, P.ADAPTIVE_CUTOFFS.advanced);
});

t('rematch: a miss returns three answers later, a fix clears it', () => {
  let q = P.rematchAfterAnswer(null, { puzzle: drawSpot, correct: false });
  assert.strictEqual(P.dueRematch(q), null);
  q = P.rematchAfterAnswer(q, { puzzle: { meta: {} }, correct: true });
  q = P.rematchAfterAnswer(q, { puzzle: { meta: {} }, correct: true });
  assert.strictEqual(P.dueRematch(q), null);
  q = P.rematchAfterAnswer(q, { puzzle: { meta: {} }, correct: true });
  const due = P.dueRematch(q);
  assert.deepStrictEqual(due.request, { topic: 'pot-odds', difficulty: 'intermediate', seed: 5 });
  q = P.rematchAfterAnswer(q, { puzzle: drawSpot, correct: true, rematch: true });
  assert.strictEqual(P.rematchesWaiting(q).total, 0);
});

t('rematch: a second miss waits for the next day', () => {
  const now = new Date('2026-10-09T12:00:00Z');
  let q = P.rematchAfterAnswer(null, { puzzle: drawSpot, correct: false, now, tzOffsetMinutes: 0 });
  q = P.rematchAfterAnswer(q, { puzzle: drawSpot, correct: false, rematch: true, now, tzOffsetMinutes: 0 });
  assert.strictEqual(q.items[0].dueDay, '2026-10-10');
  assert.strictEqual(P.dueRematch(q, { now: new Date('2026-10-09T23:00:00Z'), tzOffsetMinutes: 0 }), null);
  assert.deepStrictEqual(P.rematchesWaiting(q, { now, tzOffsetMinutes: 0 }), { due: 0, later: 1, total: 1 });
  assert.ok(P.dueRematch(q, { now: new Date('2026-10-10T08:00:00Z'), tzOffsetMinutes: 0 }));
});

t('rematch: library puzzles, the daily and ungraded answers never queue', () => {
  assert.strictEqual(P.rematchRequestFor({ difficulty: 'beginner', meta: {} }), null);
  assert.strictEqual(P.rematchRequestFor({ ...drawSpot, meta: { ...drawSpot.meta, daily: true } }), null);
  const q = P.rematchAfterAnswer(null, { puzzle: drawSpot, correct: null });
  assert.strictEqual(q.items.length, 0);
  assert.strictEqual(q.answered, 1);
  assert.deepStrictEqual(P.rematchQueue('junk'), { items: [], answered: 0 });
});

t('daily: number, split adds to 100 in button order, share text never states the answer', () => {
  assert.strictEqual(P.dailyNumber('2026-01-01'), 1);
  assert.strictEqual(P.dailyNumber('2026-10-09'), 282);
  const s = P.dailySplit({ call: 2, fold: 1, raise: 0 }, drawSpot);
  assert.deepStrictEqual(s.rows.map((r) => r.action), ['fold', 'call', 'raise']);
  assert.strictEqual(s.rows.reduce((n, r) => n + r.pct, 0), 100);
  assert.deepStrictEqual(s.rows.map((r) => r.pct), [33, 67, 0]);
  assert.strictEqual(P.dailySplit({}, drawSpot).total, 0);
  const text = P.dailyShareText({ dayKey: '2026-10-09', topic: 'pot-odds', difficulty: 'intermediate', chose: 'call', agreedPct: 61, correct: true, run: 5 });
  assert.strictEqual(text, 'Flop52 Daily #282\nPot Odds · Intermediate\nI chose call (61% of players agreed)\nRight, on a run of 5\nflop52s.com');
  assert.ok(!/best|answer is/i.test(text));
});

console.log(`puzzlesFeel: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
