// Rule-based match summary for Match Review. CommonJS, plain-node safe, no
// React/RN imports. Deterministic: no randomness, no time-of-day, no reliance
// on object key-iteration order.
//
// THE HONESTY CONTRACT (what this generator may never emit):
//  1. Never characterize style (tight/loose/passive/aggressive) — VPIP/PFR/AF
//     live in analyticsStore, not in `review`.
//  2. Never attribute a chip result to decision quality. netChange is variance;
//     only costOfDecision may be called a cost, and only ever as "expected
//     value", always hedged with "about".
//  3. Never price an unpriced decision (costOfDecision returns null → the
//     decision never enters the ranking and never reaches S2).
//  4. Never mention opponent holdings, ranges or reasoning — the grader is
//     hero-only by design.
//  5. Never compare to a past match — the store is session-only, one game.
//  6. Never call accuracyPct 100 with decisionCount 0 a perfect match; that is
//     buildMatchReview's "nothing to grade" sentinel (matchReview.js:107).
//  7. Never put a count ratio ("23 of 32 correct") in the same clause as
//     accuracyPct — different measures that diverge badly.
//  8. Never claim street concentration; preflop raises are ungraded and blind
//     completions exempted, so the flop necessarily carries the most graded
//     decisions. It is a base-rate artifact.
//  9. Never use "costliest" for a stakes ranking. Cost means costOfDecision.
// 10. Every number traces to exactly one field on `review`.
//
// Evidence clauses quote decision.note VERBATIM. gradeDecisions already writes
// a sentence that asserts only what it measured, so quoting it makes
// fabrication structurally impossible rather than merely forbidden.

const { GRADE_SEVERITY, LEAK_TAGS } = require('./matchReview');
const { errorCostOfDecision } = require('./decisionCost');

// --- verdict bands ----------------------------------------------------------

// COUPLING WARNING: accuracyPct is a GRADE_SCORE-weighted mean x 100
// (see gradeDecisions.js:77 — good/brilliant 1, inaccuracy 0.75, mistake 0.5,
// blunder 0.15), so the scale is compressed at the top: one blunder in twenty
// still reads 96. These bands are tuned to THAT arithmetic. If GRADE_SCORE ever
// moves, these thresholds must move with it.
const VERDICT_BANDS = [
  { min: 100, letter: 'A+', band: 'CLEAN SHEET', tone: 'gold' },
  { min: 96, letter: 'A', band: 'SHARP', tone: 'gold' },
  { min: 91, letter: 'B', band: 'SOLID', tone: 'blue' },
  { min: 85, letter: 'C', band: 'LEAKY', tone: 'blue' },
  { min: 75, letter: 'D', band: 'COSTLY', tone: 'danger' },
  { min: 0, letter: 'F', band: 'ROUGH NIGHT', tone: 'danger' },
];

const NO_LETTER = '–'; // en dash — "we are not putting a letter on this"
const VERDICT_NO_HANDS = { letter: NO_LETTER, band: 'NO HANDS', tone: 'neutral' };
const VERDICT_NOT_GRADED = { letter: NO_LETTER, band: 'NOT GRADED', tone: 'neutral' };
const VERDICT_SMALL_SAMPLE = { letter: NO_LETTER, band: 'SMALL SAMPLE', tone: 'neutral' };

// A match is too short to carry a letter grade at all.
const isThin = (handCount, decisionCount) => handCount < 3 || decisionCount < 5;

// The small-sample suppression is applied to the LOUDEST pixel on the screen.
// An F earned off three decisions is the single most misleading thing this
// feature could print, so a thin match gets no letter at all.
const verdictFor = ({ accuracyPct = 0, decisionCount = 0, handCount = 0 } = {}) => {
  if (handCount === 0) return { ...VERDICT_NO_HANDS };
  if (decisionCount === 0) return { ...VERDICT_NOT_GRADED };
  if (isThin(handCount, decisionCount)) return { ...VERDICT_SMALL_SAMPLE };
  const pct = Number(accuracyPct) || 0;
  const match = VERDICT_BANDS.find((entry) => pct >= entry.min) || VERDICT_BANDS[VERDICT_BANDS.length - 1];
  return { letter: match.letter, band: match.band, tone: match.tone };
};

// --- formatting helpers -----------------------------------------------------

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

// Spelled out below ten, digits from ten up.
const spell = (n) => {
  const value = Math.abs(Math.round(Number(n) || 0));
  return value < NUMBER_WORDS.length ? NUMBER_WORDS[value] : value.toLocaleString();
};
const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

// Signed chip figures, shared with both UIs so a number quoted in prose and the
// same number in a cell can never disagree.
//
// THE MINUS IS U+2212, NOT A HYPHEN, and that is not typographic fussiness: a
// hyphen is narrower than a digit, so one negative in a column of figures throws
// the whole column out of alignment. Both clients' number components exist to
// fix exactly that, and this helper feeds them.
//
// TWO REGISTERS, because one threshold cannot serve both callers. Prose reads
// "the hand itself still ran +24,530"; a stat cell needs "+24.5K" or it blows
// out. So signedChips keeps full precision for sentences, and
// signedChipsCompact abbreviates on the same rungs the clients' Num components
// use. Same value, same sign, two documented registers — the split web already
// makes between fmt and fmtRating.
const MINUS = '−';

const signFor = (n) => (n > 0 ? '+' : n < 0 ? MINUS : '');

// Prose. Groups, never abbreviates below a million.
const signedChips = (value) => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1000000) {
    const compact = (abs / 1000000).toFixed(2).replace(/\.?0+$/, '');
    return signFor(n) + compact + 'M';
  }
  return signFor(n) + abs.toLocaleString();
};

// Cells. Abbreviates from ten thousand, with M and B rungs above — without
// those rungs a 5,000,000 stack prints as "5000.0K", which is not a smaller
// string than the number it replaced.
const signedChipsCompact = (value) => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const s = signFor(n);
  if (abs >= 1e9) return s + (abs / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6) return s + (abs / 1e6).toFixed(1) + 'M';
  if (abs >= 1e4) return s + (abs / 1e3).toFixed(1) + 'K';
  return s + Math.round(abs).toLocaleString();
};

const netPhraseFor = (net) => {
  const n = Number(net) || 0;
  if (n > 0) return `up ${n.toLocaleString()} chips`;
  if (n < 0) return `down ${Math.abs(n).toLocaleString()} chips`;
  return 'level';
};

const handLabelFor = (hand, index) =>
  (hand && hand.handNumber != null) ? `hand #${hand.handNumber}` : `hand ${index + 1}`;

// --- fixed copy tables ------------------------------------------------------

// Each phrase is faithful to the EXACT rule that produced the tag
// (matchReview.js LEAK_TAGS) — no embellishment beyond what was measured.
const LEAK_PHRASE = {
  'overfolding-to-aggression': 'You folded calls the price said to take',
  'chasing-bad-prices': "You paid prices your equity didn't cover",
  'missing-value-bets': 'You checked back river hands strong enough to bet',
};

// Each phrase is faithful to the only way that action can be downgraded by
// gradeDecisions — see its RULE TABLE.
const ACTION_PHRASE = {
  fold: 'You let hands go that the price said to keep',
  call: "You paid prices your equity didn't cover",
  check: 'You checked back a river hand strong enough to bet',
  raise: 'You raised with nothing behind it when a cheap continue was there',
};

const ERROR_GRADES = ['blunder', 'mistake', 'inaccuracy']; // worst first
const GRADE_NOUN = { blunder: 'blunder', mistake: 'mistake', inaccuracy: 'inaccuracy' };

// --- derived inputs ---------------------------------------------------------

const sumGrades = (grades) =>
  Object.keys(grades || {}).reduce((sum, key) => sum + (Number(grades[key]) || 0), 0);

// Re-count a leak tag's (action, grade) pair against the decisions themselves,
// using the SAME pair matchReview.js:57-59 counted with.
const leakTagCounts = (review) => {
  const hands = (review && Array.isArray(review.hands)) ? review.hands : [];
  const counts = {};
  LEAK_TAGS.forEach((leak) => { counts[leak.tag] = 0; });
  hands.forEach((hand) => {
    const decisions = (hand && Array.isArray(hand.decisions)) ? hand.decisions : [];
    decisions.forEach((decision) => {
      if (!decision) return;
      LEAK_TAGS.forEach((leak) => {
        if (decision.action === leak.action && decision.grade === leak.grade) {
          counts[leak.tag] += 1;
        }
      });
    });
  });
  return counts;
};

// Highest recomputed count among the tags the engine actually fired.
// Ties break by LEAK_TAGS declaration order, never by object key order.
const topLeak = (review) => {
  const tags = (review && Array.isArray(review.leakTags)) ? review.leakTags : [];
  if (!tags.length) return null;
  const counts = leakTagCounts(review);
  let best = null;
  LEAK_TAGS.forEach((leak) => {
    if (!tags.includes(leak.tag)) return;
    const count = counts[leak.tag] || 0;
    if (!best || count > best.count) best = { tag: leak.tag, count };
  });
  return best;
};

// The decision maximizing errorCostOfDecision, with its owning hand.
// null when nothing is priceable. Ties are settled deterministically:
// cost desc → grade severity desc → hand index asc → frameIndex asc.
const worstErrorOf = (review) => {
  const hands = (review && Array.isArray(review.hands)) ? review.hands : [];
  let best = null;
  hands.forEach((hand, index) => {
    const decisions = (hand && Array.isArray(hand.decisions)) ? hand.decisions : [];
    decisions.forEach((decision) => {
      const cost = errorCostOfDecision(decision);
      if (cost == null) return;
      const candidate = { hand, handIndex: index, decision, cost };
      if (!best) { best = candidate; return; }
      const better =
        (candidate.cost - best.cost) ||
        ((GRADE_SEVERITY[candidate.decision.grade] || 0) - (GRADE_SEVERITY[best.decision.grade] || 0)) ||
        (best.handIndex - candidate.handIndex) ||
        (best.decision.frameIndex - candidate.decision.frameIndex);
      if (better > 0) best = candidate;
    });
  });
  return best;
};

// Modal action among decisions graded inaccuracy/mistake/blunder.
// Ties broken alphabetically so the output never depends on iteration order.
const modalErrorActionOf = (review) => {
  const hands = (review && Array.isArray(review.hands)) ? review.hands : [];
  const counts = {};
  hands.forEach((hand) => {
    const decisions = (hand && Array.isArray(hand.decisions)) ? hand.decisions : [];
    decisions.forEach((decision) => {
      if (!decision || !ERROR_GRADES.includes(decision.grade)) return;
      const action = String(decision.action || '');
      if (!action) return;
      counts[action] = (counts[action] || 0) + 1;
    });
  });
  const actions = Object.keys(counts).sort();
  if (!actions.length) return null;
  let best = actions[0];
  actions.forEach((action) => { if (counts[action] > counts[best]) best = action; });
  return { action: best, count: counts[best] };
};

// The first brilliant decision, for S4's single-brilliant variant.
const firstBrilliant = (review) => {
  const hands = (review && Array.isArray(review.hands)) ? review.hands : [];
  for (let i = 0; i < hands.length; i += 1) {
    const decisions = (hands[i] && Array.isArray(hands[i].decisions)) ? hands[i].decisions : [];
    const found = decisions.find((d) => d && d.grade === 'brilliant');
    if (found) return { hand: hands[i], handIndex: i, decision: found };
  }
  return null;
};

// "one blunder and one inaccuracy" — non-zero buckets only, worst first.
const enumerateErrors = (grades) => {
  const parts = ERROR_GRADES
    .filter((grade) => (Number(grades[grade]) || 0) > 0)
    .map((grade) => {
      const n = Number(grades[grade]) || 0;
      return `${spell(n)} ${GRADE_NOUN[grade]}${n === 1 ? '' : 's'}`;
    });
  if (parts.length <= 1) return parts[0] || '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
};

// --- the generator ----------------------------------------------------------

const MAX_SENTENCES = 4;

// review + timelines → { verdict, sentences }.
//
// Slots are evaluated in a fixed order — S1 → S1H → S2 → S3 → S4 — and each is
// independently guarded. A slot whose guard fails emits NOTHING; there is no
// filler sentence anywhere in this file.
//
// `timelinesById` and `botName` are accepted for signature stability (callers
// already hold both) but no template quotes them: every sentence must be
// derivable from `review` alone.
const buildMatchNarrative = (review, timelinesById, options = {}) => {
  const safe = review && typeof review === 'object' ? review : null;
  const hands = safe && Array.isArray(safe.hands) ? safe.hands : [];
  const grades = (safe && safe.grades) || {};
  const handCount = hands.length;
  const decisionCount = sumGrades(grades);
  const accuracyPct = Number(safe && safe.accuracyPct) || 0;
  const verdict = verdictFor({ accuracyPct, decisionCount, handCount });

  // No hands is its own screen state; the card refuses to render.
  if (!safe || handCount === 0) return { verdict, sentences: [] };

  const errorCount =
    (Number(grades.inaccuracy) || 0) + (Number(grades.mistake) || 0) + (Number(grades.blunder) || 0);
  const brilliant = Number(grades.brilliant) || 0;
  const matchNet = hands.reduce((sum, hand) => sum + (Number(hand && hand.netChange) || 0), 0);
  const thin = isThin(handCount, decisionCount);
  const netPhrase = netPhraseFor(matchNet);

  const sentences = [];
  const push = (id, text) => { if (text) sentences.push({ id, text }); };

  // S1 · HEADLINE — always fires.
  if (decisionCount === 0) {
    push(
      's1',
      `Across ${handCount} hands you never faced a decision the engine could grade ` +
      `— there's no accuracy score for this match.`
    );
  } else if (thin) {
    push(
      's1',
      `${capitalize(spell(handCount))} hand${handCount === 1 ? '' : 's'}, ${decisionCount} graded ` +
      `decision${decisionCount === 1 ? '' : 's'}, ${accuracyPct}% accuracy — you finished ${netPhrase}.`
    );
  } else {
    push(
      's1',
      `You graded ${accuracyPct}% across ${decisionCount} decisions in ${handCount} hands, ` +
      `and finished ${netPhrase}.`
    );
  }

  // S1H · SMALL-SAMPLE HEDGE — thin only. Structurally suppresses S2 and S3.
  if (thin) {
    push(
      's1h',
      decisionCount === 0
        ? `Play a longer match and there'll be something to mark.`
        : `That's a small sample — a match this short can't tell you much about your game yet.`
    );
  }

  // S2 · THE PRICE — the evidence clause is the engine's own note, verbatim.
  const worstError = thin ? null : worstErrorOf(safe);
  if (!thin && worstError) {
    const label = handLabelFor(worstError.hand, worstError.handIndex);
    let text =
      `Your most expensive spot was ${label} — “${worstError.decision.note}” — ` +
      `about ${worstError.cost.toLocaleString()} chips of expected value`;
    // Anti-outcome-bias clause: the hand WON despite the error. Stated as a
    // separate fact about the hand, never as a judgement of the decision.
    const netChange = Number(worstError.hand && worstError.hand.netChange) || 0;
    text += netChange > 0
      ? `; the hand itself still ran ${signedChips(netChange)}.`
      : '.';
    push('s2', text);
  }

  // S3 · THE PATTERN — three mutually exclusive variants, first match wins.
  if (!thin && errorCount > 0) {
    const leak = topLeak(safe);
    const modal = modalErrorActionOf(safe);
    if (leak && LEAK_PHRASE[leak.tag]) {
      push('s3', `${LEAK_PHRASE[leak.tag]} — that happened ${leak.count} times.`);
    } else if (modal && modal.count >= 2 && ACTION_PHRASE[modal.action]) {
      // A LOOSER bar than the engine's own LEAK_MIN_REPEATS on an exact
      // (action, grade) pair — deliberate, and suppressed whenever a real leak
      // tag fires, so the card never makes two overlapping pattern claims.
      push('s3', `${ACTION_PHRASE[modal.action]} in ${modal.count} of your ${errorCount} flagged spots.`);
    } else {
      // The honest negative: explicitly denies a pattern.
      const enumeration = enumerateErrors(grades);
      push(
        's3',
        `${errorCount} decisions graded below good — ${enumeration}, in different spots.`
      );
    }
  }

  // S4 · CREDIT.
  // decisionCount > 0 is load-bearing: with nothing graded, "a clean sheet"
  // would celebrate the engine's nothing-to-grade sentinel (contract rule 6).
  if (decisionCount > 0 && (errorCount === 0 || brilliant > 0)) {
    if (errorCount === 0 && brilliant > 0) {
      push(
        's4',
        `Nothing graded worse than good across ${decisionCount} decisions, ` +
        `and ${brilliant} of them graded brilliant.`
      );
    } else if (errorCount === 0) {
      push('s4', `Nothing graded worse than good across ${decisionCount} decisions — a clean sheet.`);
    } else if (brilliant === 1) {
      const found = firstBrilliant(safe);
      if (found) {
        push('s4', `One decision graded brilliant: the ${found.decision.action} on ${handLabelFor(found.hand, found.handIndex)}.`);
      }
    } else if (brilliant > 1) {
      push('s4', `${brilliant} decisions graded brilliant.`);
    }
  }

  // Hard cap, truncating from the end. Also enforced structurally: thin mode
  // suppresses S2/S3, so the maxima are S1+S2+S3+S4 = 4 and S1+S1H+S4 = 3.
  return { verdict, sentences: sentences.slice(0, MAX_SENTENCES) };
};

module.exports = {
  buildMatchNarrative,
  VERDICT_BANDS,
  verdictFor,
  // Shared with the UI so prose and pixels quote identical figures.
  signedChips,
  signedChipsCompact,
  leakTagCounts,
  MAX_NARRATIVE_SENTENCES: MAX_SENTENCES,
};
