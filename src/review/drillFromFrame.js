// Graded decision frame → drill puzzle. The output matches the INPUT shape
// normalizePuzzleState expects ({ initialState, progression }) so
// LearningPuzzlePlay can host a real reviewed hand with zero changes:
//   - initialState mirrors EMPTY_HAND_STATE's keys (phase, playerCards,
//     communityCards, opponentCards, pot, opponentBet, playerChips,
//     opponentChips, bigBlind) plus position/action for deriveLegalActions.
//   - opponentCards stays [] — that's EMPTY_HAND_STATE's own face-down
//     placeholder, so the villain's cards never leak into the drill.
//   - progression carries correctAction/mistakeAction/explanation and the
//     real runout as flopCards (3-card array) / turnCard / riverCard, the
//     exact field names LearningPuzzlePlay reads when advancing streets.
// CommonJS, plain-node safe, no React/RN imports.

const phaseLabel = (phase) => {
  const labels = { preflop: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River' };
  return labels[phase] || 'Poker';
};

// What the grader considered correct, derived from the grade + what was done.
// v1 only ever downgrades fold/call price errors and two aggression patterns,
// so the inverse map stays small and honest.
const deriveCorrectAction = (decision, facing) => {
  const wasWrong = decision.grade === 'mistake' || decision.grade === 'blunder';
  if (wasWrong) return decision.action === 'fold' ? 'call' : 'fold';
  if (decision.grade === 'inaccuracy') {
    if (decision.action === 'check') return 'raise'; // missed river value
    // Spew raise: take the continue the grader said was available — a CALL when
    // there was a well-priced bet to flat, a check when it was free. ('fold'
    // here would contradict the grade's own "cheap continue" rationale.)
    return facing ? 'call' : 'check';
  }
  return decision.action; // good/brilliant: what they did WAS the answer
};

// (timeline, decision, handDoc) → puzzle object, or null on malformed input.
const toDrillPuzzle = (timeline, decision, handDoc) => {
  if (!timeline || !decision || !Array.isArray(timeline.frames)) return null;
  const frame =
    timeline.frames[decision.frameIndex] &&
    timeline.frames[decision.frameIndex].index === decision.frameIndex
      ? timeline.frames[decision.frameIndex]
      : timeline.frames.find((f) => f && f.index === decision.frameIndex);
  if (!frame) return null;

  const doc = handDoc && typeof handDoc === 'object' ? handDoc : {};
  const community = Array.isArray(doc.communityCards) ? doc.communityCards : [];
  const facing = frame.toCall > 0;
  const wasWrong = decision.grade === 'mistake' || decision.grade === 'blunder';
  const metrics = decision.metrics || {};

  // The note is the human line; append the price math so the drill's
  // explanation stands alone even out of review context.
  let explanation = decision.note || '';
  if (facing && metrics.neededPct != null) {
    explanation +=
      `${explanation ? ' ' : ''}Price: ${frame.toCall} to win ` +
      `${frame.potBefore + frame.toCall} — ${metrics.neededPct}% equity needed.`;
  }

  const handNumber = doc.handNumber != null ? doc.handNumber : null;
  const handId = doc._id || doc.id || null;

  return {
    id: handId != null ? `${handId}-f${decision.frameIndex}` : `drill-f${decision.frameIndex}`,
    title: `Hand ${handNumber != null ? `#${handNumber} ` : ''}— ${phaseLabel(frame.phase)} decision`,
    initialState: {
      phase: frame.phase,
      playerCards: timeline.hero.cards, // raw doc format; the card components
      // already normalize '10' vs 'T' downstream
      communityCards: frame.boardCards, // only what was visible at the moment
      opponentCards: [], // face down, always
      pot: frame.potBefore,
      opponentBet: frame.toCall,
      playerChips: frame.heroStack,
      opponentChips: frame.oppStack,
      bigBlind: timeline.bigBlind || 100,
      position: timeline.hero.seat,
      action: facing ? 'facing_raise' : 'unopened_pot',
    },
    progression: {
      correctAction: deriveCorrectAction(decision, facing),
      mistakeAction: wasWrong ? decision.action : null,
      explanation,
      flopCards: community.length >= 3 ? community.slice(0, 3) : null,
      turnCard: community.length >= 4 ? community[3] : null,
      riverCard: community.length >= 5 ? community[4] : null,
    },
  };
};

module.exports = { toDrillPuzzle };
