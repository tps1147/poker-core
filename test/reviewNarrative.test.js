// Match Review redesign: decision cost math + the rule-based match narrative.
//   node test/reviewNarrative.test.js
//
// These modules make CLAIMS to the player, so the tests are written against the
// honesty contract in matchNarrative.js as much as against the arithmetic:
// what may never be priced, never be summed, and never be celebrated.

const assert = require('assert');

const {
  costOfDecision,
  errorCostOfDecision,
  handCost,
  totalErrorCost,
  rankHandsByCost,
  rankDrillSpots,
} = require('../src/review/decisionCost');
const {
  buildMatchNarrative,
  VERDICT_BANDS,
  verdictFor,
  signedChips,
  signedChipsCompact,
  leakTagCounts,
} = require('../src/review/matchNarrative');
const { GRADE_SCORE } = require('../src/review/gradeDecisions');
const { buildMatchReview } = require('../src/review/matchReview');

// --- fixture helpers -------------------------------------------------------

// A graded decision as gradeDecisions actually emits one.
const decision = ({
  frameIndex = 0,
  action = 'call',
  grade = 'good',
  equityPct = null,
  neededPct = null,
  pot = 0,
  toCall = 0,
  strength = 0.5,
  equityBasis = 'strength',
  note = 'note',
} = {}) => ({
  frameIndex,
  action,
  grade,
  metrics: { strength, equityPct, neededPct, toCall, pot, equityBasis },
  note,
});

const hand = ({ handId = 'h1', handNumber = 1, netChange = 0, decisions = [] } = {}) => ({
  handId,
  handNumber,
  netChange,
  grades: decisions.map((d) => d.grade),
  worstGrade: decisions.reduce((worst, d) => {
    const rank = { blunder: 4, mistake: 3, inaccuracy: 2, good: 1, brilliant: 0 };
    return (rank[d.grade] || 0) > (rank[worst] || 0) ? d.grade : worst;
  }, decisions.length ? decisions[0].grade : null),
  isKeyHand: false,
  keyReasons: [],
  decisions,
});

// Histogram + accuracy computed the way buildMatchReview computes them, so a
// fixture can never drift from the real weighting.
const reviewOf = (hands, leakTags = []) => {
  const grades = { brilliant: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
  let scoreSum = 0;
  let decisionCount = 0;
  hands.forEach((h) => {
    h.decisions.forEach((d) => {
      grades[d.grade] += 1;
      scoreSum += GRADE_SCORE[d.grade];
      decisionCount += 1;
    });
  });
  return {
    accuracyPct: decisionCount === 0 ? 100 : Math.round((scoreSum / decisionCount) * 100),
    grades,
    hands,
    keyHands: [],
    leakTags,
  };
};

const textOf = (narrative) => narrative.sentences.map((s) => s.text);

// --- costOfDecision: the EV identity ---------------------------------------

// The worked example from the spec: pot 1400, toCall 1200, equity 22, needed
// 46.2. Verified against the identity itself, not a copied constant.
const pricedCall = decision({
  action: 'call', grade: 'blunder', equityPct: 22, neededPct: 46.2, pot: 1400, toCall: 1200,
  note: 'Called 1200 getting 1.2:1 with 22% equity (needed 46.2%)',
});
assert.strictEqual(costOfDecision(pricedCall), 629);
assert.strictEqual(
  costOfDecision(pricedCall),
  Math.round((1400 + 1200) * Math.abs(22 - 46.2) / 100),
  'costOfDecision IS (pot + toCall) * |equity - needed| / 100'
);

// computePotOdds defines neededPct = call / (pot + call), so the identity can
// be restated with no percentage at all: stake * |equity - needed| / 100 is
// |stake*equity/100 - call| — the EV of the call in chips, derived
// independently. The two agree to within computePotOdds' own quantization:
// neededPct is rounded to 0.1pp, which is worth stake * 0.05/100 = 1.3 chips
// here. That residue is exactly why the copy always hedges with "about".
const stake = 1400 + 1200;
const neededFromOdds = Math.round((1200 / stake) * 1000) / 10; // 46.2
assert.strictEqual(neededFromOdds, 46.2, 'the fixture price matches computePotOdds');
const fromPercentages = Math.round((stake * Math.abs(22 - neededFromOdds)) / 100);
const fromChips = Math.abs((stake * 22) / 100 - 1200);
assert.ok(
  Math.abs(fromPercentages - fromChips) <= (stake * 0.05) / 100 + 1,
  `the EV identity holds up to the 0.1pp rounding of neededPct (${fromPercentages} vs ${fromChips})`
);

// The three unpriceable shapes all return null — never 0. A zero would teach
// the player that a check is free.
assert.strictEqual(costOfDecision(decision({ neededPct: null, equityPct: 40, toCall: 100, pot: 500 })), null);
assert.strictEqual(costOfDecision(decision({ neededPct: 30, equityPct: null, toCall: 100, pot: 500 })), null);
assert.strictEqual(costOfDecision(decision({ neededPct: 30, equityPct: 40, toCall: 0, pot: 500 })), null);
assert.strictEqual(costOfDecision(null), null);
assert.strictEqual(costOfDecision({}), null);

// --- errorCostOfDecision: the load-bearing scoping -------------------------

// A GOOD decision must contribute ZERO. Summing |diff| over good decisions
// would fold EV the player GAINED into a figure labelled "what it cost you".
const pricedGood = decision({
  action: 'call', grade: 'good', equityPct: 60, neededPct: 30, pot: 1000, toCall: 500,
});
assert.ok(costOfDecision(pricedGood) > 0, 'the good decision IS priceable');
assert.strictEqual(errorCostOfDecision(pricedGood), null, 'a good decision costs nothing');
assert.strictEqual(
  errorCostOfDecision(decision({ grade: 'brilliant', equityPct: 60, neededPct: 30, pot: 1000, toCall: 500 })),
  null,
  'a brilliant decision costs nothing'
);
['inaccuracy', 'mistake', 'blunder'].forEach((grade) => {
  const d = decision({ grade, equityPct: 20, neededPct: 45, pot: 1000, toCall: 500 });
  assert.strictEqual(errorCostOfDecision(d), costOfDecision(d), `${grade} carries its cost`);
});

// handCost sums only errors, and counts unpriceable errors separately.
const mixedHand = hand({
  handId: 'mix',
  decisions: [
    pricedGood, // priced, but good → contributes 0
    decision({ frameIndex: 1, grade: 'blunder', equityPct: 20, neededPct: 45, pot: 1000, toCall: 500 }), // 375
    decision({ frameIndex: 2, action: 'check', grade: 'inaccuracy', toCall: 0 }), // unpriceable error
  ],
});
const mixed = handCost(mixedHand);
assert.strictEqual(mixed.cost, 375);
assert.strictEqual(mixed.pricedErrors, 1);
assert.strictEqual(mixed.unpricedErrors, 1);
assert.strictEqual(handCost({}).cost, 0, 'a hand with no decisions costs nothing');
assert.strictEqual(totalErrorCost(reviewOf([mixedHand])), 375);
assert.strictEqual(totalErrorCost(null), 0);

// --- rankHandsByCost: ordering and tie-breaks ------------------------------

const cheapBlunder = (id, n) => hand({
  handId: id,
  handNumber: n,
  decisions: [decision({ grade: 'blunder', equityPct: 30, neededPct: 40, pot: 100, toCall: 100 })], // 20
});
const richBlunder = hand({
  handId: 'rich',
  handNumber: 7,
  decisions: [decision({ grade: 'blunder', equityPct: 20, neededPct: 45, pot: 1000, toCall: 500 })], // 375
});
const cleanHand = hand({ handId: 'clean', handNumber: 2, decisions: [pricedGood] });

// Exact tie on cost AND severity → earlier hand number wins.
const tieA = cheapBlunder('tieA', 4);
const tieB = cheapBlunder('tieB', 9);
const ranked = rankHandsByCost(reviewOf([cleanHand, tieB, richBlunder, tieA]));
assert.deepStrictEqual(
  ranked.map((h) => h.handId),
  ['rich', 'tieA', 'tieB'],
  'cost desc, then hand number asc; error-free hands excluded'
);
assert.ok(!ranked.some((h) => h.handId === 'clean'), 'a hand with no errors never enters the ledger');

// Equal cost, different severity → the worse grade ranks first.
const unpricedBlunder = hand({
  handId: 'ub', handNumber: 3, decisions: [decision({ grade: 'blunder', toCall: 0 })],
});
const unpricedInacc = hand({
  handId: 'ui', handNumber: 1, decisions: [decision({ action: 'check', grade: 'inaccuracy', toCall: 0 })],
});
const bySeverity = rankHandsByCost(reviewOf([unpricedInacc, unpricedBlunder]));
assert.deepStrictEqual(
  bySeverity.map((h) => h.handId),
  ['ub', 'ui'],
  'at equal (zero) cost the worse grade outranks the earlier hand'
);

// --- rankDrillSpots: must have a timeline ----------------------------------

const withTimeline = hand({
  handId: 'has-tl',
  handNumber: 5,
  decisions: [decision({ frameIndex: 3, grade: 'mistake', equityPct: 20, neededPct: 40, pot: 800, toCall: 400 })],
});
const noTimeline = hand({
  handId: 'no-tl',
  handNumber: 6,
  decisions: [decision({ frameIndex: 2, grade: 'blunder', equityPct: 10, neededPct: 50, pot: 5000, toCall: 5000 })],
});
const nullId = hand({
  handId: null,
  handNumber: 8,
  decisions: [decision({ grade: 'blunder', equityPct: 10, neededPct: 50, pot: 9000, toCall: 9000 })],
});
const drillReview = reviewOf([withTimeline, noTimeline, nullId, cleanHand]);
const spots = rankDrillSpots(drillReview, { 'has-tl': { frames: [] } });
assert.strictEqual(spots.length, 1, 'only the hand WITH a timeline can be drilled');
assert.strictEqual(spots[0].handId, 'has-tl');
assert.strictEqual(spots[0].spotId, 'has-tl-f3', 'spotId matches toDrillPuzzle id shape');
assert.strictEqual(spots[0].cost, costOfDecision(withTimeline.decisions[0]));
assert.deepStrictEqual(rankDrillSpots(drillReview, {}), [], 'no timelines at all → no spots');
assert.deepStrictEqual(rankDrillSpots(null, null), []);

// Highest cost first, and the limit is honored.
const manySpots = rankDrillSpots(
  reviewOf([withTimeline, hand({
    handId: 'big',
    handNumber: 2,
    decisions: [
      decision({ frameIndex: 0, grade: 'blunder', equityPct: 10, neededPct: 50, pot: 2000, toCall: 1000 }),
      decision({ frameIndex: 1, action: 'check', grade: 'inaccuracy', toCall: 0 }), // unpriced → last
    ],
  })]),
  { 'has-tl': { frames: [] }, big: { frames: [] } },
  10
);
assert.deepStrictEqual(
  manySpots.map((s) => s.spotId),
  ['big-f0', 'has-tl-f3', 'big-f1'],
  'cost desc with unpriced spots last'
);
assert.strictEqual(rankDrillSpots(drillReview, { 'has-tl': {}, big: {} }, 0).length, 0, 'limit 0 honored');

// --- verdictFor: bands, and both suppressions ------------------------------

assert.deepStrictEqual(
  verdictFor({ accuracyPct: 100, decisionCount: 0, handCount: 4 }),
  { letter: '–', band: 'NOT GRADED', tone: 'neutral' },
  'the nothing-to-grade sentinel is never an A+'
);
assert.strictEqual(verdictFor({ accuracyPct: 0, decisionCount: 0, handCount: 0 }).band, 'NO HANDS');

// Thin suppresses the letter at EVERY accuracy value, including 100.
[0, 50, 72, 85, 95, 100].forEach((pct) => {
  assert.deepStrictEqual(
    verdictFor({ accuracyPct: pct, decisionCount: 3, handCount: 2 }),
    { letter: '–', band: 'SMALL SAMPLE', tone: 'neutral' },
    `thin match at ${pct}% carries no letter`
  );
  // Thin by decision count alone, with plenty of hands.
  assert.strictEqual(verdictFor({ accuracyPct: pct, decisionCount: 4, handCount: 20 }).band, 'SMALL SAMPLE');
});

const bandAt = (pct) => verdictFor({ accuracyPct: pct, decisionCount: 30, handCount: 10 });
assert.deepStrictEqual(bandAt(100), { letter: 'A+', band: 'CLEAN SHEET', tone: 'gold' });
assert.strictEqual(bandAt(99).letter, 'A');
assert.strictEqual(bandAt(96).letter, 'A');
assert.strictEqual(bandAt(95).letter, 'B');
assert.strictEqual(bandAt(91).letter, 'B');
assert.strictEqual(bandAt(90).letter, 'C');
assert.strictEqual(bandAt(85).letter, 'C');
assert.strictEqual(bandAt(84).letter, 'D');
assert.strictEqual(bandAt(75).letter, 'D');
assert.strictEqual(bandAt(74).letter, 'F');
assert.strictEqual(bandAt(0).letter, 'F');
assert.strictEqual(VERDICT_BANDS.length, 6);

// --- signedChips ------------------------------------------------------------

assert.strictEqual(signedChips(400), '+400');
// U+2212 MINUS, not a hyphen. A hyphen is narrower than a digit, so one
// negative throws a whole column of figures out of alignment.
assert.strictEqual(signedChips(-3400), '−3,400');
assert.ok(!signedChips(-3400).includes('-'), 'no ASCII hyphen may survive in a chip figure');
assert.strictEqual(signedChips(0), '0');
assert.strictEqual(signedChips(1250000), '+1.25M', 'compacts at a million so a stat cell cannot blow out');
assert.strictEqual(signedChips(-2000000), '−2M');
assert.strictEqual(signedChips(undefined), '0');

// The cell register: abbreviates from ten thousand, with rungs above so a
// five-million stack does not print as the longer string "5000.0K".
assert.strictEqual(signedChipsCompact(400), '+400');
assert.strictEqual(signedChipsCompact(-3400), '−3,400');
assert.strictEqual(signedChipsCompact(24530), '+24.5K');
assert.strictEqual(signedChipsCompact(5000000), '+5.0M');
assert.strictEqual(signedChipsCompact(-2500000000), '−2.5B');
assert.strictEqual(signedChipsCompact(0), '0');
// Prose keeps full precision at the same value the cell abbreviates.
assert.strictEqual(signedChips(24530), '+24,530');

// --- buildMatchNarrative: the six worked examples --------------------------

// ① Typical losing match: 14 hands, {good 26, inaccuracy 1, mistake 2,
// blunder 2} → 28.05/31 → 90 → C LEAKY, leak chasing-bad-prices x2.
const ex1Worst = decision({
  frameIndex: 4, action: 'call', grade: 'blunder',
  equityPct: 22, neededPct: 46.2, pot: 1400, toCall: 1200,
  note: 'Called 1200 getting 1.2:1 with 22% equity (needed 46.2%)',
});
const ex1Hands = [
  hand({ handId: 'e1h9', handNumber: 9, netChange: -2000, decisions: [ex1Worst] }),
  hand({
    handId: 'e1h3', handNumber: 3, netChange: -150,
    decisions: [decision({ action: 'call', grade: 'blunder', equityPct: 30, neededPct: 40, pot: 200, toCall: 100 })],
  }),
  hand({
    handId: 'e1h5', handNumber: 5, netChange: 0,
    decisions: [
      decision({ action: 'fold', grade: 'mistake', equityPct: 35, neededPct: 40, pot: 300, toCall: 100 }),
      decision({ frameIndex: 1, action: 'fold', grade: 'mistake', equityPct: 35, neededPct: 40, pot: 300, toCall: 100 }),
      decision({ frameIndex: 2, action: 'check', grade: 'inaccuracy', toCall: 0 }),
    ],
  }),
];
// Pad to 14 hands / 31 decisions with plain good decisions.
for (let i = 0; i < 11; i += 1) {
  ex1Hands.push(hand({
    handId: `e1p${i}`, handNumber: 20 + i, netChange: 0,
    decisions: Array.from({ length: i < 4 ? 3 : 2 }, (_, k) => decision({ frameIndex: k, grade: 'good' })),
  }));
}
const ex1 = reviewOf(ex1Hands, ['chasing-bad-prices']);
ex1.hands[0].netChange = -2000;
assert.strictEqual(ex1.hands.length, 14, 'example 1 has 14 hands');
assert.deepStrictEqual(ex1.grades, { brilliant: 0, good: 26, inaccuracy: 1, mistake: 2, blunder: 2 });
assert.strictEqual(ex1.accuracyPct, 90, '28.05 / 31 rounds to 90');
const n1 = buildMatchNarrative(ex1, {}, { botName: 'Sharky' });
assert.deepStrictEqual(n1.verdict, { letter: 'C', band: 'LEAKY', tone: 'blue' });
assert.strictEqual(n1.sentences.length, 3);
assert.strictEqual(
  textOf(n1)[0],
  'You graded 90% across 31 decisions in 14 hands, and finished down 2,150 chips.'
);
assert.strictEqual(
  textOf(n1)[1],
  'Your most expensive spot was hand #9 — “Called 1200 getting 1.2:1 with 22% equity (needed 46.2%)” — about 629 chips of expected value.'
);
assert.strictEqual(textOf(n1)[2], "You paid prices your equity didn't cover — that happened 2 times.");
// The evidence clause is the engine's note, byte for byte.
assert.ok(textOf(n1)[1].includes(ex1Worst.note), 'S2 quotes decision.note verbatim');

// ② Clean sheet: 9 hands, {brilliant 1, good 17} → 100 → A+, net +3,400.
const ex2Hands = [
  hand({
    handId: 'e2h1', handNumber: 1, netChange: 3400,
    decisions: [decision({ action: 'call', grade: 'brilliant' }), decision({ frameIndex: 1, grade: 'good' })],
  }),
];
for (let i = 0; i < 8; i += 1) {
  ex2Hands.push(hand({
    handId: `e2h${i + 2}`, handNumber: i + 2, netChange: 0,
    decisions: [decision({ grade: 'good' }), decision({ frameIndex: 1, grade: 'good' })],
  }));
}
const ex2 = reviewOf(ex2Hands);
assert.strictEqual(ex2.accuracyPct, 100);
const n2 = buildMatchNarrative(ex2, {}, {});
assert.deepStrictEqual(n2.verdict, { letter: 'A+', band: 'CLEAN SHEET', tone: 'gold' });
assert.deepStrictEqual(textOf(n2), [
  'You graded 100% across 18 decisions in 9 hands, and finished up 3,400 chips.',
  'Nothing graded worse than good across 18 decisions, and 1 of them graded brilliant.',
]);

// ③ Winning match, expensive fold, no pattern: {good 22, inaccuracy 1,
// blunder 1} → 22.90/24 → 95 → B SOLID; the errored hand still WON.
const ex3Fold = decision({
  frameIndex: 2, action: 'fold', grade: 'blunder',
  equityPct: 58, neededPct: 25, pot: 900, toCall: 300,
  note: 'Folded getting 3:1 with 58% equity (needed 25%)',
});
const ex3Hands = [
  hand({ handId: 'e3h4', handNumber: 4, netChange: 400, decisions: [ex3Fold] }),
  hand({
    handId: 'e3h6', handNumber: 6, netChange: 650,
    decisions: [decision({ action: 'check', grade: 'inaccuracy', toCall: 0 })],
  }),
];
for (let i = 0; i < 9; i += 1) {
  ex3Hands.push(hand({
    handId: `e3p${i}`, handNumber: 10 + i, netChange: 0,
    decisions: Array.from({ length: i < 4 ? 3 : 2 }, (_, k) => decision({ frameIndex: k, grade: 'good' })),
  }));
}
const ex3 = reviewOf(ex3Hands);
assert.strictEqual(ex3.hands.length, 11);
assert.deepStrictEqual(ex3.grades, { brilliant: 0, good: 22, inaccuracy: 1, mistake: 0, blunder: 1 });
assert.strictEqual(ex3.accuracyPct, 95, '22.90 / 24 rounds to 95');
const n3 = buildMatchNarrative(ex3, {}, {});
assert.deepStrictEqual(n3.verdict, { letter: 'B', band: 'SOLID', tone: 'blue' });
assert.deepStrictEqual(textOf(n3), [
  'You graded 95% across 24 decisions in 11 hands, and finished up 1,050 chips.',
  'Your most expensive spot was hand #4 — “Folded getting 3:1 with 58% equity (needed 25%)” — about 396 chips of expected value; the hand itself still ran +400.',
  '2 decisions graded below good — one blunder and one inaccuracy, in different spots.',
]);

// ④ Thin 2-hand match: {good 2, blunder 1} → 72, but thin → no letter.
const ex4 = reviewOf([
  hand({
    handId: 'e4h1', handNumber: 1, netChange: -400,
    decisions: [
      decision({ grade: 'good' }),
      decision({
        frameIndex: 1, action: 'call', grade: 'blunder',
        equityPct: 15, neededPct: 45, pot: 1000, toCall: 1000,
        note: 'Called 1000 getting 1:1 with 15% equity (needed 45%)',
      }),
    ],
  }),
  hand({ handId: 'e4h2', handNumber: 2, netChange: 0, decisions: [decision({ grade: 'good' })] }),
]);
assert.strictEqual(ex4.accuracyPct, 72, '2.15 / 3 rounds to 72');
const n4 = buildMatchNarrative(ex4, {}, {});
assert.deepStrictEqual(n4.verdict, { letter: '–', band: 'SMALL SAMPLE', tone: 'neutral' });
assert.deepStrictEqual(textOf(n4), [
  'Two hands, 3 graded decisions, 72% accuracy — you finished down 400 chips.',
  "That's a small sample — a match this short can't tell you much about your game yet.",
]);
// Thin structurally suppresses S2 even though a priced blunder exists.
assert.ok(!n4.sentences.some((s) => s.id === 's2'), 'thin suppresses the price sentence');
assert.ok(!n4.sentences.some((s) => s.id === 's3'), 'thin suppresses the pattern sentence');

// ⑤ Nothing gradeable: 4 hands, 0 decisions, engine sentinel accuracy 100.
const ex5 = reviewOf([
  hand({ handId: 'e5h1', handNumber: 1, netChange: -300, decisions: [] }),
  hand({ handId: 'e5h2', handNumber: 2, netChange: 0, decisions: [] }),
  hand({ handId: 'e5h3', handNumber: 3, netChange: 0, decisions: [] }),
  hand({ handId: 'e5h4', handNumber: 4, netChange: 0, decisions: [] }),
]);
assert.strictEqual(ex5.accuracyPct, 100, 'the engine sentinel really is 100');
const n5 = buildMatchNarrative(ex5, {}, {});
assert.deepStrictEqual(n5.verdict, { letter: '–', band: 'NOT GRADED', tone: 'neutral' });
assert.deepStrictEqual(textOf(n5), [
  "Across 4 hands you never faced a decision the engine could grade — there's no accuracy score for this match.",
  "Play a longer match and there'll be something to mark.",
]);
// THE sentinel test: zero graded decisions must never be praised.
const n5Text = textOf(n5).join(' ');
assert.ok(!/clean sheet/i.test(n5Text), 'a zero-decision match is NOT a clean sheet');
assert.ok(!/brilliant/i.test(n5Text));
assert.ok(!/100/.test(n5Text), 'the 100 sentinel never reaches the copy');
assert.ok(!n5.sentences.some((s) => s.id === 's4'), 'S4 cannot fire with nothing graded');

// ⑥ Errors that cannot be priced: {good 31, inaccuracy 3} river check-backs
// → 33.25/34 → 98 → A SHARP; S2 skipped because nothing is priceable.
const ex6Hands = [];
for (let i = 0; i < 3; i += 1) {
  ex6Hands.push(hand({
    handId: `e6c${i}`, handNumber: i + 1, netChange: 300,
    decisions: [
      decision({ action: 'check', grade: 'inaccuracy', toCall: 0, note: 'Checked the river with a 92% hand — missed value' }),
      decision({ frameIndex: 1, grade: 'good' }),
    ],
  }));
}
for (let i = 0; i < 13; i += 1) {
  ex6Hands.push(hand({
    handId: `e6p${i}`, handNumber: 10 + i, netChange: 0,
    decisions: Array.from({ length: i < 2 ? 3 : 2 }, (_, k) => decision({ frameIndex: k, grade: 'good' })),
  }));
}
const ex6 = reviewOf(ex6Hands, ['missing-value-bets']);
assert.strictEqual(ex6.hands.length, 16);
assert.deepStrictEqual(ex6.grades, { brilliant: 0, good: 31, inaccuracy: 3, mistake: 0, blunder: 0 });
assert.strictEqual(ex6.accuracyPct, 98, '33.25 / 34 rounds to 98');
assert.strictEqual(totalErrorCost(ex6), 0, 'river check-backs have toCall 0 — nothing to price');
const n6 = buildMatchNarrative(ex6, {}, {});
assert.deepStrictEqual(n6.verdict, { letter: 'A', band: 'SHARP', tone: 'gold' });
assert.deepStrictEqual(textOf(n6), [
  'You graded 98% across 34 decisions in 16 hands, and finished up 900 chips.',
  'You checked back river hands strong enough to bet — that happened 3 times.',
]);
assert.ok(!n6.sentences.some((s) => s.id === 's2'), 'no priceable error → no price sentence');

// --- narrative: rule firing, priority, and the cap -------------------------

// S3 variant (b): a modal error action with no leak tag firing.
const modalHands = [
  hand({
    handId: 'm1', handNumber: 1, netChange: -500,
    decisions: [
      decision({ action: 'fold', grade: 'mistake', equityPct: 40, neededPct: 30, pot: 400, toCall: 100 }),
      decision({ frameIndex: 1, action: 'fold', grade: 'inaccuracy', equityPct: 40, neededPct: 30, pot: 400, toCall: 100 }),
    ],
  }),
];
for (let i = 0; i < 5; i += 1) {
  modalHands.push(hand({
    handId: `mp${i}`, handNumber: i + 2, netChange: 0,
    decisions: [decision({ grade: 'good' }), decision({ frameIndex: 1, grade: 'good' })],
  }));
}
const modalReview = reviewOf(modalHands); // no leakTags: the pairs never repeat
const nModal = buildMatchNarrative(modalReview, {}, {});
const s3Modal = nModal.sentences.find((s) => s.id === 's3');
assert.strictEqual(
  s3Modal.text,
  'You let hands go that the price said to keep in 2 of your 2 flagged spots.',
  'variant (b) fires at 2 same-action errors'
);

// Priority: when a leak tag IS present, variant (a) wins and (b) never shows —
// the card must not make two overlapping pattern claims.
const leakedReview = reviewOf(modalHands, ['overfolding-to-aggression']);
const nLeaked = buildMatchNarrative(leakedReview, {}, {});
const s3Leaked = nLeaked.sentences.find((s) => s.id === 's3');
assert.ok(s3Leaked.text.startsWith('You folded calls the price said to take'), 'leak tag outranks modal action');
assert.ok(!/flagged spots/.test(s3Leaked.text), 'only one pattern claim per card');

// Every rule can fire; the cap holds at 4 even when S1+S2+S3+S4 all qualify.
const fullHands = [
  hand({
    handId: 'f1', handNumber: 1, netChange: -900,
    decisions: [
      decision({
        action: 'call', grade: 'blunder', equityPct: 12, neededPct: 48, pot: 3000, toCall: 2000,
        note: 'Called 2000 getting 1.5:1 with 12% equity (needed 48%)',
      }),
      decision({ frameIndex: 1, action: 'call', grade: 'blunder', equityPct: 20, neededPct: 45, pot: 500, toCall: 300 }),
      decision({ frameIndex: 2, action: 'call', grade: 'brilliant' }),
      decision({ frameIndex: 3, action: 'call', grade: 'brilliant' }),
    ],
  }),
];
for (let i = 0; i < 6; i += 1) {
  fullHands.push(hand({
    handId: `fp${i}`, handNumber: i + 2, netChange: 0,
    decisions: [decision({ grade: 'good' }), decision({ frameIndex: 1, grade: 'good' })],
  }));
}
const fullReview = reviewOf(fullHands, ['chasing-bad-prices']);
const nFull = buildMatchNarrative(fullReview, {}, {});
assert.strictEqual(nFull.sentences.length, 4, 'all four slots fire');
assert.deepStrictEqual(nFull.sentences.map((s) => s.id), ['s1', 's2', 's3', 's4'], 'fixed emission order');
assert.strictEqual(nFull.sentences[3].text, '2 decisions graded brilliant.');

// Every branch stays within the cap.
[ex1, ex2, ex3, ex4, ex5, ex6, modalReview, leakedReview, fullReview].forEach((r, i) => {
  const n = buildMatchNarrative(r, {}, {});
  assert.ok(n.sentences.length <= 4, `example ${i} emits at most 4 sentences`);
  assert.ok(n.sentences.length >= 1, `example ${i} emits at least 1 sentence`);
  const ids = n.sentences.map((s) => s.id);
  assert.deepStrictEqual(ids, [...ids].sort((a, b) => {
    const order = ['s1', 's1h', 's2', 's3', 's4'];
    return order.indexOf(a) - order.indexOf(b);
  }), `example ${i} keeps the fixed slot order`);
});

// S4's single-brilliant variant names the action and the hand.
const oneBrilliant = reviewOf([
  hand({
    handId: 'b1', handNumber: 12, netChange: 100,
    decisions: [
      decision({ action: 'fold', grade: 'brilliant' }),
      decision({ frameIndex: 1, action: 'call', grade: 'mistake', equityPct: 30, neededPct: 40, pot: 400, toCall: 200 }),
    ],
  }),
  hand({ handId: 'b2', handNumber: 13, netChange: 0, decisions: [decision({ grade: 'good' }), decision({ frameIndex: 1, grade: 'good' })] }),
  hand({ handId: 'b3', handNumber: 14, netChange: 0, decisions: [decision({ grade: 'good' }), decision({ frameIndex: 1, grade: 'good' })] }),
]);
const nOne = buildMatchNarrative(oneBrilliant, {}, {});
assert.strictEqual(
  nOne.sentences.find((s) => s.id === 's4').text,
  'One decision graded brilliant: the fold on hand #12.'
);

// A hand with no handNumber falls back to its position, never prints "null".
const anonReview = reviewOf([
  hand({
    handId: 'a1', handNumber: null, netChange: -100,
    decisions: [decision({
      action: 'call', grade: 'blunder', equityPct: 10, neededPct: 50, pot: 1000, toCall: 1000,
      note: 'Called 1000 getting 1:1 with 10% equity (needed 50%)',
    })],
  }),
  hand({ handId: 'a2', handNumber: 2, netChange: 0, decisions: [decision({ grade: 'good' }), decision({ frameIndex: 1, grade: 'good' })] }),
  hand({ handId: 'a3', handNumber: 3, netChange: 0, decisions: [decision({ grade: 'good' }), decision({ frameIndex: 1, grade: 'good' })] }),
]);
const nAnon = buildMatchNarrative(anonReview, {}, {});
const s2Anon = nAnon.sentences.find((s) => s.id === 's2');
assert.ok(s2Anon.text.includes('was hand 1 —'), 'a null handNumber falls back to position');
assert.ok(!/null|undefined|NaN/.test(textOf(nAnon).join(' ')), 'no null/undefined/NaN reaches the copy');

// Degenerate inputs never throw and never fabricate.
assert.deepStrictEqual(buildMatchNarrative(null, null, {}).sentences, []);
assert.deepStrictEqual(buildMatchNarrative({ hands: [], grades: {} }, {}, {}).sentences, []);
assert.strictEqual(buildMatchNarrative({ hands: [], grades: {} }, {}, {}).verdict.band, 'NO HANDS');

// --- leakTagCounts: the falsifiable claim behind the {n}x badge ------------

const leakCounted = leakTagCounts(ex1);
assert.strictEqual(leakCounted['chasing-bad-prices'], 2, 'recounted from decisions, not asserted');
assert.strictEqual(leakCounted['overfolding-to-aggression'], 0);
assert.strictEqual(leakTagCounts(ex6)['missing-value-bets'], 3);

// --- gradeDecisions equityBasis: additive only ------------------------------

// The whole review pipeline still produces identical grades and notes; the new
// field is present on both paths and never alters a grade.
const { gradeHand } = require('../src/review/gradeDecisions');
const card = (rank, suit) => ({ rank, suit });
const drawEngine = {
  evaluateHandStrength: () => 0.35,
  hasFlushDraw: () => ({ isFlushDraw: true, type: 'flush-draw', outs: 9 }),
  evaluateDrawingHands: () => ({ straightOuts: 0 }),
};
const basisTimeline = {
  hero: { cards: [card('A', '♥'), card('5', '♥')], seat: 'BTN' },
  opponent: { cards: [], seat: 'BB' },
  bigBlind: 100,
  frames: [
    { index: 0, phase: 'blinds', actor: 'hero', isHeroDecision: false, action: 'small blind', amount: 50, potBefore: 0, potAfter: 50, toCall: 0 },
    { index: 1, phase: 'blinds', actor: 'opponent', isHeroDecision: false, action: 'big blind', amount: 100, potBefore: 50, potAfter: 150, toCall: 0 },
    {
      index: 2, phase: 'flop', actor: 'hero', isHeroDecision: true, action: 'call', amount: 300,
      potBefore: 900, potAfter: 1200, toCall: 300,
      boardCards: [card('K', '♥'), card('7', '♥'), card('2', '♠')],
    },
  ],
};
const basisDecisions = gradeHand(basisTimeline, drawEngine);
assert.strictEqual(basisDecisions.length, 1);
assert.strictEqual(basisDecisions[0].metrics.equityBasis, 'outs', 'a real draw quotes the outs model');
assert.strictEqual(basisDecisions[0].grade, 'brilliant', 'the grade is unchanged by the new field');

const strengthTimeline = {
  ...basisTimeline,
  frames: [
    basisTimeline.frames[0],
    basisTimeline.frames[1],
    { ...basisTimeline.frames[2], boardCards: [card('K', '♠'), card('7', '♦'), card('2', '♣')] },
  ],
};
const strengthDecisions = gradeHand(strengthTimeline, {
  evaluateHandStrength: () => 0.35,
  hasFlushDraw: () => ({ isFlushDraw: false, outs: 0 }),
  evaluateDrawingHands: () => ({ straightOuts: 0 }),
});
assert.strictEqual(strengthDecisions[0].metrics.equityBasis, 'strength', 'no draw → the estimate model');

// The blind-exemption path carries an explicit null, not undefined.
const sbTimeline = {
  hero: { cards: [card('7', '♦'), card('2', '♣')], seat: 'BTN' },
  opponent: { cards: [], seat: 'BB' },
  bigBlind: 100,
  frames: [
    { index: 0, phase: 'blinds', actor: 'hero', isHeroDecision: false, action: 'small blind', amount: 50, potBefore: 0, potAfter: 50, toCall: 0 },
    { index: 1, phase: 'blinds', actor: 'opponent', isHeroDecision: false, action: 'big blind', amount: 100, potBefore: 50, potAfter: 150, toCall: 0 },
    { index: 2, phase: 'preflop', actor: 'hero', isHeroDecision: true, action: 'fold', amount: 0, potBefore: 150, potAfter: 150, toCall: 50, boardCards: [] },
  ],
};
const sbGraded = gradeHand(sbTimeline, drawEngine);
assert.strictEqual(sbGraded[0].metrics.equityBasis, null);
assert.ok('equityBasis' in sbGraded[0].metrics, 'the key is present on the exemption path');
assert.strictEqual(sbGraded[0].grade, 'good', 'the exemption still grades good');
assert.strictEqual(costOfDecision(sbGraded[0]), null, 'an exempt blind decision is never priced');

// buildMatchReview still returns the documented shape with the new field.
assert.deepStrictEqual(Object.keys(buildMatchReview([], 'nobody', drawEngine)).sort(), [
  'accuracyPct', 'grades', 'hands', 'keyHands', 'leakTags',
]);

// --- integration: the drill CTA's actual path ------------------------------
//
// rankDrillSpots only earns its timeline filter if the spots it returns can
// REALLY be converted. Stub timelines would pass the filter and still produce
// no puzzle, leaving the screen's primary button dead. This runs the whole
// chain on a real hand doc: doc → timeline → grades → review → spots →
// puzzles.

const { buildReplayTimeline } = require('../src/review/replayTimeline');
const { toDrillPuzzle } = require('../src/review/drillFromFrame');

const HERO_ID = 'hero-1';
const BOT_ID = 'bot-1';
const act = (playerId, phase, action, amount) => ({
  playerId, phase, action, amount, timestamp: '2026-07-23T00:00:00.000Z',
});
const community = [card('K', '♠'), card('9', '♦'), card('4', '♣'), card('J', '♥'), card('3', '♠')];

// Hero completes the blind (exempt), then calls a 1000 bet into 1200 with a
// 15% hand — needed 45.5%, so a clear blunder worth about 671 chips of EV.
const integrationDoc = {
  _id: 'hand-integration-1',
  handNumber: 12,
  gameType: 'solo',
  players: [
    {
      userId: HERO_ID, username: 'hero', position: 'BTN',
      startingChips: 10000, endingChips: 8900, netChange: -1100,
      cards: [card('7', '♦'), card('2', '♣')],
      handResult: 'lost', isDealer: true, isSmallBlind: true, isBigBlind: false,
    },
    {
      userId: BOT_ID, username: 'Sharky', position: 'BB',
      startingChips: 10000, endingChips: 11100, netChange: 1100,
      cards: [card('K', '♥'), card('9', '♠')],
      handResult: 'won', isDealer: false, isSmallBlind: false, isBigBlind: true,
    },
  ],
  communityCards: community,
  actions: [
    act(HERO_ID, 'blinds', 'small blind', 50),
    act(BOT_ID, 'blinds', 'big blind', 100),
    act(HERO_ID, 'preflop', 'call', 50),
    act(BOT_ID, 'preflop', 'check', 0),
    act(BOT_ID, 'flop', 'bet', 1000),
    act(HERO_ID, 'flop', 'call', 1000),
  ],
  winner: { userId: BOT_ID, handName: 'Two Pair', amount: 2200 },
  showdown: { occurred: true },
};

const weakEngine = {
  evaluateHandStrength: () => 0.15,
  hasFlushDraw: () => ({ isFlushDraw: false, outs: 0 }),
  evaluateDrawingHands: () => ({ straightOuts: 0 }),
};

const realTimeline = buildReplayTimeline(integrationDoc, HERO_ID);
assert.ok(realTimeline, 'the fixture doc builds a timeline');
const realReview = buildMatchReview([integrationDoc], HERO_ID, weakEngine);
assert.strictEqual(realReview.hands.length, 1);
assert.strictEqual(realReview.grades.blunder, 1, 'the overpriced call grades a blunder');

const realSpots = rankDrillSpots(realReview, { 'hand-integration-1': realTimeline });
assert.strictEqual(realSpots.length, 1, 'the blunder is drillable');
assert.strictEqual(realSpots[0].cost, 671, '(1200 + 1000) * |15 - 45.5| / 100');
assert.strictEqual(
  realSpots[0].cost,
  costOfDecision(realSpots[0].decision),
  'the ranked cost is the decision cost'
);

// The payoff: every ranked spot really converts, and its spotId is the
// puzzle's own id — which is what the drilled-state tracking keys on.
realSpots.forEach((spot) => {
  const puzzle = toDrillPuzzle(realTimeline, spot.decision, integrationDoc);
  assert.ok(puzzle, `spot ${spot.spotId} converts to a puzzle`);
  assert.strictEqual(puzzle.id, spot.spotId, 'spotId matches the puzzle id exactly');
  assert.ok(puzzle.initialState && puzzle.progression, 'the puzzle has the shape LearningPuzzlePlay needs');
});

// The exempt blind completion is NOT offered as a drill.
assert.strictEqual(realReview.hands[0].decisions.length, 2, 'both hero decisions were recorded');
assert.strictEqual(realReview.hands[0].decisions[0].grade, 'good', 'the blind completion stays ungraded');

// And a hand with no timeline entry yields no spots at all, so the CTA hides
// rather than staging something that cannot be built.
assert.deepStrictEqual(rankDrillSpots(realReview, {}), []);

console.log('review narrative + decision cost checks passed');
