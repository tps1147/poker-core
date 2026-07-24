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

// Hero's stored net chip swing, read straight from the doc's own seat. Used
// ONLY for un-replayable hands, where there is no timeline.summary to read it
// from. Falls back to 0 when the hero seat is missing or its netChange isn't a
// finite number, so an un-buildable hand still gets a defined swing.
const heroNetChangeFromDoc = (doc, heroUserId) => {
  const players = doc && Array.isArray(doc.players) ? doc.players : [];
  const heroSeat = players.find((p) => p && String(p.userId) === String(heroUserId));
  if (!heroSeat) return 0;
  const net = Number(heroSeat.netChange);
  return Number.isFinite(net) ? net : 0;
};

// handDocs[] + heroUserId + engine → session review. LOSSLESS: every doc
// becomes a hands[] row — one whose timeline can't be built is surfaced as an
// un-replayable row (replayable:false), never dropped. accuracyPct is 100 when
// nothing was gradeable — an empty review should read as "nothing wrong", not
// zero. Un-replayable hands are not gradeable and so never lower accuracy.
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

    // LOSSLESS INVARIANT: every doc the server returned becomes exactly one
    // hands[] row, so review.hands.length === docs.length. A doc whose replay
    // timeline can't be reconstructed (malformed actions, not heads-up, hero
    // not seated) used to be dropped here and vanish from the review — that was
    // the "hands are lost" data-integrity bug. It now surfaces as an
    // un-replayable row instead: no grades, no decisions, its stored netChange
    // read from the doc's own hero seat. It contributes NOTHING to accuracy /
    // histogram / leaks / decisionCount — an un-replayable hand is not a hero
    // error, so it must not move any of those aggregates.
    if (!timeline) {
      const netChange = heroNetChangeFromDoc(doc, heroUserId);
      hands.push({
        handId: doc._id || doc.id || null,
        handNumber: doc.handNumber != null ? doc.handNumber : null,
        netChange,
        grades: [],
        worstGrade: null,
        isKeyHand: false,
        keyReasons: [],
        decisions: [],
        replayable: false,
      });
      // No blunder/mistake/all-in signal exists for an un-replayable hand, so
      // it ranks on |netChange| alone and naturally sinks below any graded
      // hand carrying a real error marker. It can only be picked as a key hand
      // when there aren't enough graded hands to fill the slots.
      ranking.push({
        hasBlunder: false,
        hasMistake: false,
        hasAllIn: false,
        absNet: Math.abs(netChange),
      });
      return;
    }

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
      replayable: true,
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

// LEAK_TAGS is exported so consumers can RE-COUNT a tag's (action, grade) pair
// against hands[].decisions instead of restating the pairs. leakTags alone is
// an assertion; recounting from the same rule makes it a falsifiable claim.
module.exports = { buildMatchReview, GRADE_SEVERITY, KEY_HAND_LIMIT, LEAK_MIN_REPEATS, LEAK_TAGS };
