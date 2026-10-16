// The match review story: one engine-checked verdict per decision ("spot"), the player-facing
// grade names, the Form tier, key moments and a match-wide replay index. CommonJS, pure, no I/O.
//
// One verdict per spot. The server builds this once per player per match and stores it; the
// result screen, the step-through, Retry and the AI coach all read that stored record, so the
// table coach and the review can never disagree about the same decision.
//
// Players never see accuracy or a rating figure here. Form is a word (Cold, Steady, Sharp,
// On fire); grades are Clutch, Solid, Loose, Leak and Punt; every chip figure is an estimate
// from the Flop52 engine, never a solver, and the copy says "est.".

const { costOfDecision } = require('./decisionCost');
const { GRADE_SCORE, GRADE_RULES } = require('./gradeDecisions');
const { buildReplayTimeline } = require('./replayTimeline');
const { buildMatchReview } = require('./matchReview');

// 2: spots the engine did not judge carry no grade (playerGrade null) and stay out of the tally,
// the beads and Form; why lines are written copy, never engine notes.
const STORY_VERSION = 2;

// Engine grade -> what the player sees. Order is best to worst.
const PLAYER_GRADES = Object.freeze({
  brilliant: Object.freeze({ key: 'clutch', label: 'Clutch', mark: '!!', color: '#26C2A3' }),
  good: Object.freeze({ key: 'solid', label: 'Solid', mark: '', color: '#22c55e' }),
  inaccuracy: Object.freeze({ key: 'loose', label: 'Loose', mark: '?!', color: '#F5C242' }),
  mistake: Object.freeze({ key: 'leak', label: 'Leak', mark: '?', color: '#F97316' }),
  blunder: Object.freeze({ key: 'punt', label: 'Punt', mark: '??', color: '#ef4444' }),
});
const PLAYER_GRADE_ORDER = ['clutch', 'solid', 'loose', 'leak', 'punt'];
const PLAYER_GRADE_SEVERITY = { clutch: 0, solid: 1, loose: 2, leak: 3, punt: 4 };
const playerGradeInfo = (key) =>
  Object.values(PLAYER_GRADES).find((g) => g.key === key) || PLAYER_GRADES.good;

// Form tiers from contested-decision accuracy. The percentage itself never leaves this module.
const FORM_TIERS = Object.freeze(['Cold', 'Steady', 'Sharp', 'On fire']);
const FORM_CUTS = Object.freeze([70, 82, 92]); // Steady from 70, Sharp from 82, On fire from 92
const FORM_MIN_GRADED = 3; // fewer graded decisions is not enough to read form

const formTierFor = (accuracyPct, graded) => {
  const a = Number(accuracyPct);
  if (!Number.isFinite(a) || !(Number(graded) >= FORM_MIN_GRADED)) return null;
  let index = 0;
  FORM_CUTS.forEach((cut, i) => { if (a >= cut) index = i + 1; });
  return { index, label: FORM_TIERS[index], of: FORM_TIERS.length };
};

// A Punt has to cost something real. Below one big blind of estimated EV the call was close
// enough that "Punt" would overstate it, so it reads as a Leak.
const PUNT_MIN_BIG_BLINDS = 1;

const KEY_MOMENT_LIMIT = 3;

const PHASE_LABEL = { preflop: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River' };
const ACTION_NOUN = { fold: 'fold', call: 'call', check: 'check', raise: 'raise', bet: 'bet' };

const spotIdOf = (handId, frameIndex) => `${handId == null ? '' : String(handId)}:${frameIndex}`;

// What the engine would have done instead, or null when the decision was fine.
const betterActionFor = (decision, playerGrade) => {
  if (!decision || !playerGrade || playerGrade === 'solid' || playerGrade === 'clutch') return null;
  const m = decision.metrics || {};
  const facing = Number(m.toCall) > 0;
  if (decision.action === 'check') return 'bet';
  if (facing && m.equityPct != null && m.neededPct != null) {
    return m.equityPct >= m.neededPct ? 'call' : 'fold';
  }
  if (decision.action === 'raise') return facing ? 'call' : 'check';
  return null;
};

// Did the engine actually judge this decision? Every error and Clutch did. A 'good' grade is a
// judgement only where the engine weighed something: a priced fold or call, or a postflop raise
// strong enough to be value. Blind completions, preflop opens, plain checks, free calls and
// bluffs the engine never punishes are shown as actions, not graded.
const isJudged = (decision, phase) => {
  if (!decision) return false;
  if (decision.grade !== 'good') return decision.grade in PLAYER_GRADES;
  const m = decision.metrics || {};
  if ((decision.action === 'fold' || decision.action === 'call')
    && Number(m.toCall) > 0 && m.equityPct != null && m.neededPct != null) return true;
  if (decision.action === 'raise' && phase && phase !== 'preflop'
    && Number(m.strength) >= GRADE_RULES.VALUE_STRENGTH) return true;
  return false;
};

// One spot's verdict: everything a caption, the "Why" panel, Show best and Retry need.
// playerGrade is null when the engine did not judge the decision (see isJudged).
const spotVerdict = (hand, decision, frame, bigBlind) => {
  const costEst = costOfDecision(decision);
  const phase = frame ? frame.phase : null;
  let playerGrade = isJudged(decision, phase) ? (PLAYER_GRADES[decision.grade] || PLAYER_GRADES.good).key : null;
  if (playerGrade === 'punt' && costEst != null && costEst < PUNT_MIN_BIG_BLINDS * bigBlind) playerGrade = 'leak';
  const m = decision.metrics || {};
  return {
    spotId: spotIdOf(hand.handId, decision.frameIndex),
    handId: hand.handId == null ? null : String(hand.handId),
    handNumber: hand.handNumber,
    frameIndex: decision.frameIndex,
    phase: frame ? frame.phase : null,
    action: decision.action,
    playerGrade,
    engineGrade: decision.grade,
    pot: m.pot == null ? null : Number(m.pot),
    toCall: m.toCall == null ? null : Number(m.toCall),
    sharePct: m.equityPct == null ? null : Number(m.equityPct),
    pricePct: m.neededPct == null ? null : Number(m.neededPct),
    costEst: playerGrade === 'loose' || playerGrade === 'leak' || playerGrade === 'punt' ? costEst : null,
    better: betterActionFor(decision, playerGrade),
    note: decision.note || null,
  };
};

// The one verdict format every surface uses (table coach, review caption, Retry, the web guest
// hand): a two-word headline, one line of why, and the chips at stake. Figures are estimates
// from the Flop52 engine, so the stake line always says "est.".
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('en-US');
const HEADLINE = {
  clutch: { fold: 'Clutch fold', call: 'Clutch call', check: 'Clutch check', raise: 'Clutch raise', bet: 'Clutch bet' },
  solid: { fold: 'Good fold', call: 'Good call', check: 'Good check', raise: 'Good raise', bet: 'Good bet' },
  error: { fold: 'Folded early', call: 'Paid too much', check: 'Missed value', raise: 'Loose raise', bet: 'Loose bet' },
};
// The engine files an opening bet under 'raise'; players call it a bet. Preflop there is no
// opening bet: the big blind's raise over a limp is still a raise.
const actionWord = (spot) => (spot.action === 'raise' && !(Number(spot.toCall) > 0) && spot.phase !== 'preflop' ? 'bet' : spot.action);

// Within this many points of the price a call or fold is a coin flip, and the copy says so.
const CLOSE_PTS = 2;

// One written line of why, by action and outcome. Never the engine's own note.
const whyLine = (spot, action, good) => {
  const priced = spot.sharePct != null && spot.pricePct != null;
  const price = priced ? `You needed ${fmt(spot.pricePct)}% to call and had about ${fmt(spot.sharePct)}%` : null;
  const close = priced && Math.abs(Number(spot.sharePct) - Number(spot.pricePct)) <= CLOSE_PTS;
  if (priced && close && good && (action === 'fold' || action === 'call')) return `${price}, a coin-flip price, so either play is fine.`;
  if (priced && action === 'fold') return good ? `${price}, so letting it go saved chips.` : `${price}, so calling wins more.`;
  if (priced && action === 'call') return good ? `${price}, so the call pays.` : `${price}, so folding saves chips.`;
  if (action === 'check') return good ? 'Checking keeps the pot small with a hand that wants a cheap showdown.' : 'Your hand beats most of what would call, so a bet wins more.';
  if (action === 'raise' || action === 'bet') {
    return good ? 'Your hand is ahead of most hands that pay you, so building the pot wins more.'
      : 'Too few worse hands call this, so it risks more than it wins.';
  }
  return null;
};

const isClose = (spot) => spot.sharePct != null && spot.pricePct != null
  && Math.abs(Number(spot.sharePct) - Number(spot.pricePct)) <= CLOSE_PTS;

// null for a spot the engine did not judge: it has no verdict to show.
const verdictCopy = (spot) => {
  if (!spot || !spot.playerGrade) return null;
  const action = actionWord(spot);
  const good = spot.playerGrade === 'clutch' || spot.playerGrade === 'solid';
  const set = good ? HEADLINE[spot.playerGrade] : HEADLINE.error;
  let headline = set[action] || (good ? 'Good play' : 'Costly play');
  if (good && spot.playerGrade === 'solid' && isClose(spot) && (action === 'fold' || action === 'call')) {
    headline = action === 'fold' ? 'Close fold' : 'Close call';
  }
  let stake = null;
  if (!good && spot.costEst != null) {
    stake = spot.action === 'call'
      ? `${fmt(spot.costEst)} chips overpaid (est.)`
      : `${fmt(spot.costEst)} chips left on the table (est.)`;
  }
  return { headline, why: whyLine(spot, action, good), stake };
};

// Retry's result in the same format: the right answer reads as the better play's own verdict,
// with the chips it would have kept; a miss names the better play without giving more away.
const retryCopy = (spot, answer) => {
  if (!spot || !spot.better) return null;
  const given = String(answer || '').toLowerCase();
  const better = spot.better;
  const aggressive = (a) => a === 'bet' || a === 'raise';
  const correct = given === better || (aggressive(given) && aggressive(better));
  const asBetter = { ...spot, action: better === 'bet' ? 'raise' : better };
  const word = actionWord(asBetter);
  if (correct) {
    return {
      correct: true,
      headline: HEADLINE.solid[word] || 'Good play',
      why: whyLine(asBetter, word, true),
      stake: spot.costEst != null ? `+${fmt(spot.costEst)} chips (est.)` : null,
    };
  }
  return {
    correct: false,
    headline: 'Not quite',
    why: `The better play here was to ${word}. ${whyLine(asBetter, word, true) || ''}`.trim(),
    stake: null,
  };
};

const spotTitle = (spot) =>
  `${PHASE_LABEL[spot.phase] || 'Hand'} ${ACTION_NOUN[actionWord(spot)] || 'decision'}`;

// review: buildMatchReview output. timelinesById: handId -> buildReplayTimeline output.
// Returns the story the server stores and every client renders.
const buildMatchStory = (review, timelinesById = {}) => {
  const hands = (review && Array.isArray(review.hands)) ? review.hands : [];
  const spots = [];
  const tally = { clutch: 0, solid: 0, loose: 0, leak: 0, punt: 0 };
  const beads = [];
  let contested = 0;
  let contestedScore = 0;

  hands.forEach((hand, handIndex) => {
    const timeline = timelinesById[String(hand.handId)] || null;
    const bigBlind = Number(timeline && timeline.bigBlind) || 100;
    const framesByIndex = new Map(((timeline && timeline.frames) || []).map((f) => [f.index, f]));
    let worst = null;
    let hasClutch = false;
    (hand.decisions || []).forEach((decision) => {
      const spot = spotVerdict(hand, decision, framesByIndex.get(decision.frameIndex), bigBlind);
      spots.push(spot);
      if (!spot.playerGrade) return; // shown as an action only: no tally, bead or Form
      tally[spot.playerGrade] += 1;
      if (spot.playerGrade === 'clutch') hasClutch = true;
      if (worst == null || PLAYER_GRADE_SEVERITY[spot.playerGrade] > PLAYER_GRADE_SEVERITY[worst]) worst = spot.playerGrade;
      const m = decision.metrics || {};
      const isContested = m.equityPct != null && ((Number(m.toCall) || 0) > 0 || decision.action === 'raise' || decision.action === 'bet');
      if (isContested && decision.grade in GRADE_SCORE) {
        contested += 1;
        contestedScore += GRADE_SCORE[decision.grade];
      }
    });
    beads.push({
      handId: hand.handId == null ? null : String(hand.handId),
      handNumber: hand.handNumber != null ? hand.handNumber : handIndex + 1,
      net: Number(hand.netChange) || 0,
      // The hand's headline: its worst error, else Clutch when it had one, else Solid.
      grade: (worst === 'solid' || worst == null) && hasClutch ? 'clutch' : worst,
      replayable: hand.replayable !== false,
    });
  });

  const accuracy = contested ? Math.round((contestedScore / contested) * 100) : null;

  // Key moments: the costliest errors first, then a Clutch moment so the story is never only bad news.
  const errors = spots
    .filter((s) => s.playerGrade === 'punt' || s.playerGrade === 'leak' || s.playerGrade === 'loose')
    .sort((a, b) => (PLAYER_GRADE_SEVERITY[b.playerGrade] - PLAYER_GRADE_SEVERITY[a.playerGrade])
      || ((b.costEst || 0) - (a.costEst || 0)));
  const clutch = spots.filter((s) => s.playerGrade === 'clutch');
  const picked = [];
  if (clutch.length) picked.push(clutch[0]);
  for (const s of errors) { if (picked.length >= KEY_MOMENT_LIMIT) break; picked.push(s); }
  for (const s of clutch.slice(1)) { if (picked.length >= KEY_MOMENT_LIMIT) break; picked.push(s); }
  const order = new Map(spots.map((s, i) => [s.spotId, i]));
  const keyMoments = picked
    .sort((a, b) => order.get(a.spotId) - order.get(b.spotId))
    .map((s) => ({ spotId: s.spotId, title: spotTitle(s), handNumber: s.handNumber, playerGrade: s.playerGrade, costEst: s.costEst }));

  return {
    version: STORY_VERSION,
    form: formTierFor(accuracy, contested),
    tally,
    beads,
    keyMoments,
    spots,
    leakTags: Array.isArray(review && review.leakTags) ? review.leakTags.slice() : [],
  };
};

// Hand docs -> { review, timelinesById, story } with one engine. The server's entry point.
const buildMatchStoryFromDocs = (handDocs, heroUserId, engine) => {
  const docs = Array.isArray(handDocs) ? handDocs : [];
  const review = buildMatchReview(docs, heroUserId, engine);
  const timelinesById = {};
  docs.forEach((doc) => {
    const id = doc && (doc._id || doc.id);
    if (id == null) return;
    const timeline = buildReplayTimeline(doc, heroUserId);
    if (timeline) timelinesById[String(id)] = timeline;
  });
  return { review, timelinesById, story: buildMatchStory(review, timelinesById) };
};

// One continuous replay across every hand. Each entry points at a frame of one hand's timeline;
// spot entries carry the stored verdict id. keyMomentIndexes are positions in `frames`.
const buildMatchTimeline = (story, timelinesById = {}) => {
  const frames = [];
  const handStarts = [];
  const spotsById = new Map(((story && story.spots) || []).map((s) => [s.spotId, s]));
  ((story && story.beads) || []).forEach((bead, handIndex) => {
    const timeline = timelinesById[String(bead.handId)];
    if (!timeline || !Array.isArray(timeline.frames) || !timeline.frames.length) return;
    handStarts.push(frames.length);
    timeline.frames.forEach((frame) => {
      const spotId = spotIdOf(bead.handId, frame.index);
      frames.push({
        handId: bead.handId,
        handIndex,
        handNumber: bead.handNumber,
        frameIndex: frame.index,
        spotId: spotsById.has(spotId) ? spotId : null,
      });
    });
  });
  const position = new Map(frames.map((f, i) => [f.spotId, i]));
  const keyMomentIndexes = ((story && story.keyMoments) || [])
    .map((k) => position.get(k.spotId))
    .filter((i) => i != null);
  return { frames, handStarts, keyMomentIndexes };
};

module.exports = {
  STORY_VERSION,
  PLAYER_GRADES,
  PLAYER_GRADE_ORDER,
  playerGradeInfo,
  FORM_TIERS,
  formTierFor,
  PUNT_MIN_BIG_BLINDS,
  KEY_MOMENT_LIMIT,
  spotIdOf,
  verdictCopy,
  retryCopy,
  isJudged,
  buildMatchStory,
  buildMatchStoryFromDocs,
  buildMatchTimeline,
};
