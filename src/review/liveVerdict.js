// The table coach's verdict on a decision the hero just made at a live table. CommonJS, pure.
//
// One verdict per spot. This does not grade on its own: it lays the decision out as a one-hand
// replay timeline (the shape buildReplayTimeline makes from a stored hand) and runs it through the
// same gradeHand -> buildMatchStory -> verdictCopy path the server uses for the stored story, with
// the same engine (getReviewEngine). The grader's equity is seeded from the cards and the price
// (simEquity.js), so the felt and the review say the same thing about the same decision.
//
// The verdict is about the hero's own decision only. Nothing here reads or describes the opponent.

const AIPlayer = require('../ai/aiPlayer');
const { evaluateHand } = require('../eval/pokerEvaluator');
const { gradeHand } = require('./gradeDecisions');
const { buildMatchStory, verdictCopy, playerGradeInfo } = require('./matchStory');

// The server's engine shape (pokerServer services/aiCoach/factSheet.js getInsightEngine): an
// AIPlayer whose rng never runs on the grading path, with pokerEvaluator's evaluateHand attached.
let engineInstance = null;
const getReviewEngine = () => {
  if (!engineInstance) {
    engineInstance = new AIPlayer({ rng: () => 0 });
    engineInstance.evaluateHand = evaluateHand;
  }
  return engineInstance;
};

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const PHASES = new Set(['preflop', 'flop', 'turn', 'river']);

// decision: the hero's decision as the table saw it just before acting.
//   handId, handNumber, phase, holeCards, board,
//   action      'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in' (the server's action word)
//   amount      chips this action moved into the pot (0 for fold and check)
//   toCall      chips owed before acting, capped at the hero's stack
//   potBefore   every chip in the middle before acting: finished streets plus this street's bets
//   bigBlind
//   raisedPreflop  whether anyone has raised preflop before this decision (the grader leaves a
//                  blind completion ungraded only in an unraised pot)
// Returns { spot, copy, grade } or null. copy is verdictCopy's { headline, why, stake }; it and
// grade are null when the engine does not judge this kind of decision (an open, a plain check).
const liveSpotVerdict = (decision, engine = getReviewEngine()) => {
  if (!decision || !PHASES.has(decision.phase)) return null;
  const holeCards = Array.isArray(decision.holeCards) ? decision.holeCards : [];
  if (holeCards.length !== 2) return null;
  const handId = decision.handId == null ? 'live' : String(decision.handId);
  const bigBlind = num(decision.bigBlind) || 100;
  const frames = [];
  if (decision.phase === 'preflop' && decision.raisedPreflop) {
    // An opponent raise before the decision, so the blind exemption reads the pot as raised.
    frames.push({ index: 0, phase: 'preflop', boardCards: [], actor: 'opponent', action: 'raise', amount: 0, toCall: 0, potBefore: 0, isHeroDecision: false });
  }
  const index = frames.length;
  frames.push({
    index,
    phase: decision.phase,
    boardCards: Array.isArray(decision.board) ? decision.board : [],
    actor: 'hero',
    action: decision.action,
    amount: Math.max(0, num(decision.amount)),
    potBefore: Math.max(0, num(decision.potBefore)),
    toCall: Math.max(0, num(decision.toCall)),
    isHeroDecision: true,
  });
  const timeline = { hero: { cards: holeCards }, bigBlind, frames };
  let decisions;
  try {
    decisions = gradeHand(timeline, engine);
  } catch (error) {
    return null;
  }
  if (!decisions.length) return null;
  const story = buildMatchStory(
    { hands: [{ handId, handNumber: decision.handNumber == null ? null : decision.handNumber, netChange: 0, decisions }] },
    { [handId]: timeline },
  );
  const spot = story.spots.find((s) => s.frameIndex === index) || null;
  if (!spot) return null;
  const copy = verdictCopy(spot);
  return { spot, copy, grade: spot.playerGrade ? playerGradeInfo(spot.playerGrade) : null };
};

module.exports = { liveSpotVerdict, getReviewEngine };
