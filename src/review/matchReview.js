// Match-level aggregation for Match Review: accuracy, grade histogram, key
// hands and leak tags across a session's hand histories. CommonJS, plain-node
// safe; the insight engine is injected straight through to gradeDecisions.

const { buildReplayTimeline } = require('./replayTimeline');
const { gradeHand, GRADE_SCORE } = require('./gradeDecisions');

// blunder is worst; brilliant outranks even good when picking a "worst" grade.
const GRADE_SEVERITY = { blunder: 4, mistake: 3, inaccuracy: 2, good: 1, brilliant: 0 };

const KEY_HAND_LIMIT = 4;

// A leak needs repetition — one bad fold is a moment, two is a pattern.
const LEAK_MIN_REPEATS = 2;
const LEAK_TAGS = [
  // ≥2 folds graded blunder: the user surrenders profitable spots under fire.
  { tag: 'overfolding-to-aggression', action: 'fold', grade: 'blunder' },
  // ≥2 calls graded blunder: the user pays prices their equity can't justify.
  { tag: 'chasing-bad-prices', action: 'call', grade: 'blunder' },
  // ≥2 missed river value bets: the user leaves money behind with monsters.
  { tag: 'missing-value-bets', action: 'check', grade: 'inaccuracy' },
];

const ALL_IN_KEY = 'allin';
const isAllInAction = (action) =>
  String(action || '').replace(/[-_\s]/g, '').toLowerCase() === ALL_IN_KEY;

const worstOf = (grades) => {
  if (!grades.length) return null;
  return grades.reduce((worst, grade) =>
    (GRADE_SEVERITY[grade] || 0) > (GRADE_SEVERITY[worst] || 0) ? grade : worst
  );
};

// handDocs[] + heroUserId + engine → session review. Malformed docs are
// skipped, never fatal. accuracyPct is 100 when nothing was gradeable — an
// empty review should read as "nothing wrong", not zero.
const buildMatchReview = (handDocs, heroUserId, engine) => {
  const docs = Array.isArray(handDocs) ? handDocs : [];
  const hands = [];
  const ranking = []; // parallel private ranking data, kept off the output
  const histogram = { brilliant: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
  const leakCounts = LEAK_TAGS.map(() => 0);
  let scoreSum = 0;
  let decisionCount = 0;

  docs.forEach((doc) => {
    const timeline = buildReplayTimeline(doc, heroUserId);
    if (!timeline) return;
    const decisions = gradeHand(timeline, engine);
    const grades = decisions.map((d) => d.grade);

    decisions.forEach((decision) => {
      histogram[decision.grade] = (histogram[decision.grade] || 0) + 1;
      scoreSum += GRADE_SCORE[decision.grade] != null ? GRADE_SCORE[decision.grade] : 1;
      decisionCount += 1;
      LEAK_TAGS.forEach((leak, i) => {
        if (decision.action === leak.action && decision.grade === leak.grade) leakCounts[i] += 1;
      });
    });

    hands.push({
      handId: doc._id || doc.id || null,
      handNumber: doc.handNumber != null ? doc.handNumber : null,
      netChange: timeline.summary.netChange,
      grades,
      worstGrade: worstOf(grades),
      isKeyHand: false,
      keyReasons: [],
      decisions, // not in the v1 spec shape, but the UI needs the per-frame
      // grades to render a hand row — carrying them here avoids a re-grade.
    });
    ranking.push({
      hasBlunder: grades.includes('blunder'),
      hasMistake: grades.includes('mistake'),
      hasAllIn: timeline.frames.some((f) => isAllInAction(f.action)),
      absNet: Math.abs(timeline.summary.netChange),
    });
  });

  // Key hands: blunders trump mistakes trump all-ins trump raw swing size.
  const order = hands
    .map((hand, i) => ({ hand, rank: ranking[i], i }))
    .sort((a, b) =>
      (b.rank.hasBlunder - a.rank.hasBlunder) ||
      (b.rank.hasMistake - a.rank.hasMistake) ||
      (b.rank.hasAllIn - a.rank.hasAllIn) ||
      (b.rank.absNet - a.rank.absNet) ||
      (a.i - b.i) // stable: earlier hand wins exact ties
    );
  const keyHands = order.slice(0, KEY_HAND_LIMIT).map(({ hand, rank }) => {
    const reasons = [];
    if (rank.hasBlunder) reasons.push('blunder');
    if (rank.hasMistake) reasons.push('mistake');
    if (rank.hasAllIn) reasons.push('all-in');
    if (!reasons.length) reasons.push('big-swing');
    hand.isKeyHand = true;
    hand.keyReasons = reasons;
    return hand;
  });

  const leakTags = LEAK_TAGS
    .filter((leak, i) => leakCounts[i] >= LEAK_MIN_REPEATS)
    .map((leak) => leak.tag);

  return {
    accuracyPct: decisionCount === 0 ? 100 : Math.round((scoreSum / decisionCount) * 100),
    grades: histogram,
    hands,
    keyHands,
    leakTags,
  };
};

module.exports = { buildMatchReview, GRADE_SEVERITY, KEY_HAND_LIMIT, LEAK_MIN_REPEATS };
