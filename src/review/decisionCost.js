// What a graded decision cost, in chips of expected value. CommonJS,
// plain-node safe, no React/RN imports.
//
// This module adds NO new model. computePotOdds already gives
//   neededEquityPct = call / (pot + call)
// so the grader's own diff (equityPct - neededPct), re-denominated into chips,
// is exactly
//   EV(correct) - EV(taken) = (potBefore + toCall) * |equityPct - neededPct| / 100
// It is only as good as computeEquity, which is deliberately crude (vs-random
// strength clamped [3,95], or rule-of-2-and-4 outs, flop/turn only).
// Therefore: ALWAYS hedged as "about N chips of expected value" in copy,
// NEVER presented as chips won or lost.

const { DRILLABLE_GRADES } = require('./gradeTheme');
const { GRADE_SEVERITY } = require('./matchReview');

// EV of a priced decision, in chips. null whenever the spot had no price:
// blind exemptions (neededPct null), river checks and spew raises (toCall 0).
// A null is NOT a zero — a zero would teach that checks are free.
const costOfDecision = (decision) => {
  const m = decision && decision.metrics;
  if (!m) return null;
  if (m.neededPct == null || m.equityPct == null) return null;
  if (!(Number(m.toCall) > 0)) return null;
  const stake = Number(m.pot || 0) + Number(m.toCall || 0);
  return Math.round((stake * Math.abs(m.equityPct - m.neededPct)) / 100);
};

// Cost scoped to decisions the player got WRONG.
//
// This scoping is load-bearing. Summing |diff| over good/brilliant decisions
// folds EV the player GAINED into a figure labelled "what it cost you" — the
// headline number would silently grow every time they played well.
const errorCostOfDecision = (decision) => {
  if (!decision || !DRILLABLE_GRADES.includes(decision.grade)) return null;
  return costOfDecision(decision);
};

// One hand's error cost. Unpriceable errors are counted separately rather than
// folded in as zeros, so the UI can say "not priceable" instead of "0".
const handCost = (hand) => {
  const decisions = (hand && Array.isArray(hand.decisions)) ? hand.decisions : [];
  let cost = 0;
  let pricedErrors = 0;
  let unpricedErrors = 0;
  decisions.forEach((decision) => {
    if (!decision || !DRILLABLE_GRADES.includes(decision.grade)) return;
    const value = costOfDecision(decision);
    if (value == null) {
      unpricedErrors += 1;
      return;
    }
    cost += value;
    pricedErrors += 1;
  });
  return { cost, pricedErrors, unpricedErrors };
};

const totalErrorCost = (review) => {
  const hands = (review && Array.isArray(review.hands)) ? review.hands : [];
  return hands.reduce((sum, hand) => sum + handCost(hand).cost, 0);
};

const severityOf = (grade) => GRADE_SEVERITY[grade] || 0;

const hasDrillableDecision = (hand) =>
  !!hand &&
  Array.isArray(hand.decisions) &&
  hand.decisions.some((d) => d && DRILLABLE_GRADES.includes(d.grade));

// A missing handNumber must not win an "ascending hand number" tie-break —
// it sorts last, and the original array index settles it from there.
const handNumberKey = (value) => (value == null ? Number.POSITIVE_INFINITY : Number(value));

// Hands that contain at least one error, worst first.
// cost desc → worst-grade severity desc → handNumber asc → original index asc.
// Deliberately NOT ranked by pot size or netChange: a stakes ranking would put
// a marginal inaccuracy in a huge pot above a catastrophic blunder in a small
// one, and netChange is variance, not error.
const rankHandsByCost = (review) => {
  const hands = (review && Array.isArray(review.hands)) ? review.hands : [];
  return hands
    .map((hand, index) => ({ hand, index, cost: handCost(hand).cost }))
    .filter((entry) => hasDrillableDecision(entry.hand))
    .sort((a, b) =>
      (b.cost - a.cost) ||
      (severityOf(b.hand.worstGrade) - severityOf(a.hand.worstGrade)) ||
      (handNumberKey(a.hand.handNumber) - handNumberKey(b.hand.handNumber)) ||
      (a.index - b.index)
    )
    .map((entry) => entry.hand);
};

// Flattened drillable spots, worst first, limited.
//
// Filtered to hands that HAVE a timeline: toDrillPuzzle reads timeline.frames,
// so a spot without one cannot be staged. A hand whose timeline failed still
// keeps its coaching everywhere else — it just can't be drilled.
// spotId matches toDrillPuzzle's own id so a drilled spot can be recognised
// downstream without re-deriving the key.
const rankDrillSpots = (review, timelinesById, limit = 3) => {
  const hands = (review && Array.isArray(review.hands)) ? review.hands : [];
  const timelines = timelinesById && typeof timelinesById === 'object' ? timelinesById : {};
  const spots = [];

  hands.forEach((hand, handIndex) => {
    if (!hand || hand.handId == null) return; // no id → no timeline lookup, no drill
    if (!timelines[String(hand.handId)]) return;
    const decisions = Array.isArray(hand.decisions) ? hand.decisions : [];
    decisions.forEach((decision) => {
      if (!decision || !DRILLABLE_GRADES.includes(decision.grade)) return;
      spots.push({
        spotId: `${hand.handId}-f${decision.frameIndex}`,
        handId: hand.handId,
        handNumber: hand.handNumber != null ? hand.handNumber : null,
        handIndex,
        decision,
        cost: costOfDecision(decision),
      });
    });
  });

  const costKey = (value) => (value == null ? -1 : value); // unpriced spots rank last
  spots.sort((a, b) =>
    (costKey(b.cost) - costKey(a.cost)) ||
    (severityOf(b.decision.grade) - severityOf(a.decision.grade)) ||
    (handNumberKey(a.handNumber) - handNumberKey(b.handNumber)) ||
    (a.handIndex - b.handIndex) ||
    (a.decision.frameIndex - b.decision.frameIndex)
  );

  const max = Number(limit);
  return Number.isFinite(max) && max >= 0 ? spots.slice(0, max) : spots;
};

module.exports = {
  costOfDecision,
  errorCostOfDecision,
  handCost,
  totalErrorCost,
  rankHandsByCost,
  rankDrillSpots,
};
