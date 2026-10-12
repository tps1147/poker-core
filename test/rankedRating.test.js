// Ranked rating v2 (src/rating/ranked.js) and the grader's simulated equity (src/review/simEquity.js).
const assert = require('assert');
const { computeRankedOutcome, playRatingFor, describeRankedSteps, RANKED_RULES } = require('../src/rating');
const { simulatedEquity } = require('../src/review/simEquity');

// 1. The result sets the sign, whatever the play.
for (let you = 200; you <= 2400; you += 200) {
  for (let opp = 200; opp <= 2400; opp += 200) {
    for (const acc of [40, 70, 100]) {
      const r = computeRankedOutcome({ winner: { rating: you, matches: 50, accuracyPct: acc, graded: 10 }, loser: { rating: opp, matches: 50, accuracyPct: acc, graded: 10 }, hands: 8 });
      assert.ok(r.winner.delta >= 1, `win ${you} v ${opp} acc ${acc} gains`);
      assert.ok(r.loser.delta <= -1 || r.loser.after === RANKED_RULES.FLOOR, `loss ${opp} v ${you} acc ${acc} costs`);
      assert.ok(Math.abs(r.winner.delta) <= RANKED_RULES.CAP && Math.abs(r.loser.delta) <= RANKED_RULES.CAP);
    }
  }
}
// 2. Play sets the size: a well-played loss costs less than a badly played one.
const lossWell = computeRankedOutcome({ winner: { rating: 1174, matches: 40 }, loser: { rating: 977, matches: 40, accuracyPct: 92, graded: 12 }, hands: 6 }).loser;
const lossBad = computeRankedOutcome({ winner: { rating: 1174, matches: 40 }, loser: { rating: 977, matches: 40, accuracyPct: 55, graded: 12 }, hands: 6 }).loser;
assert.ok(lossWell.delta > lossBad.delta, 'played well, lost less');
assert.ok(lossWell.delta <= -1);
// Too few graded decisions: no play factor.
const unread = computeRankedOutcome({ winner: { rating: 1000, matches: 40 }, loser: { rating: 1000, matches: 40, accuracyPct: 100, graded: 2 }, hands: 6 }).loser;
assert.strictEqual(unread.factor, 1);
// 3. K follows experience.
const fresh = computeRankedOutcome({ winner: { rating: 1000, matches: 0 }, loser: { rating: 1000, matches: 0 }, hands: 8 });
assert.strictEqual(fresh.winner.delta, 20); // 40 x 0.5
const settled = computeRankedOutcome({ winner: { rating: 1000, matches: 30 }, loser: { rating: 1000, matches: 30 }, hands: 8 });
assert.strictEqual(settled.winner.delta, 12); // 24 x 0.5
// 4. Short matches count less; a forfeit never does.
const short = computeRankedOutcome({ winner: { rating: 1000, matches: 30 }, loser: { rating: 1000, matches: 30 }, hands: 1 });
assert.strictEqual(short.winner.delta, 7); // 12 x 0.6
const left = computeRankedOutcome({ winner: { rating: 1000, matches: 30 }, loser: { rating: 1000, matches: 30 }, hands: 1, forfeit: true });
assert.strictEqual(left.loser.delta, -12);
// 5. The arena shield: a promotion sets it, the next loss uses it and stays in the arena.
const up = computeRankedOutcome({ winner: { rating: 1245, matches: 30 }, loser: { rating: 1245, matches: 30 }, hands: 8 }).winner;
assert.ok(up.after >= 1250 && Number.isInteger(up.shieldArena), 'promoted into Tea Garden with a shield');
const held = computeRankedOutcome({ winner: { rating: 1300, matches: 30 }, loser: { rating: up.after, matches: 30, shieldArena: up.shieldArena }, hands: 8 }).loser;
assert.strictEqual(held.after, 1250);
assert.strictEqual(held.shieldArena, null);
// Floor.
const floor = computeRankedOutcome({ winner: { rating: 300, matches: 30 }, loser: { rating: 105, matches: 30 }, hands: 8 }).loser;
assert.strictEqual(floor.after, 100);
// Play rating and form.
assert.strictEqual(playRatingFor(80), 1000);
assert.strictEqual(playRatingFor(90), 1400);
assert.strictEqual(playRatingFor(100), 1800);
const form = computeRankedOutcome({ winner: { rating: 1000, matches: 30, accuracyPct: 90, graded: 6, form: 1000 }, loser: { rating: 1000, matches: 30 }, hands: 8 }).winner;
assert.strictEqual(form.form, 1120);
assert.ok(describeRankedSteps(form.steps).some((l) => /Played like 1,400/.test(l)));
// Only contested decisions count toward play.
const { playFromReview } = require('../src/rating');
const fake = { hands: [{ decisions: [
  { action: 'check', grade: 'good', metrics: { equityPct: 40, toCall: 0 } },
  { action: 'call', grade: 'blunder', metrics: { equityPct: 20, toCall: 100 } },
  { action: 'raise', grade: 'good', metrics: { equityPct: 70, toCall: 0 } },
  { action: 'call', grade: 'good', metrics: { equityPct: null, toCall: 50 } },
] }] };
assert.deepStrictEqual(playFromReview(fake), { accuracyPct: 57, graded: 2 }); // (0.15 + 1) / 2, rounded

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
console.log('rankedRating: all assertions passed');
