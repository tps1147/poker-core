// Decision grading for Match Review. CommonJS, plain-node safe, hero-only —
// opponent decisions are never graded in v1 (we can't see the bot's reasoning
// and punishing its play teaches the user nothing).
//
// The insight engine is INJECTED (the UI passes an AIPlayer instance; tests
// pass a stub) so this module never imports the ESM AIPlayer. Required engine
// surface, mirroring useHandInsights' adaptation:
//   - evaluateHandStrength(holeCards, board) → 0..1
//   - hasFlushDraw(allCards) → { isFlushDraw, type, outs }
//   - evaluateDrawingHands(allCards) → { straightOuts, ... }
//   - evaluateHand(allCards) → { rank, name }  (OPTIONAL — pokerEvaluator's;
//     when present it gates outs on made straights+, exactly like the HUD.
//     Stubs without it just skip the gate: slightly generous outs, acceptable.)

const {
  normalizeCards,
  combineOuts,
  computeEquity,
  computePotOdds,
} = require('../insights/handInsightsMath');

// RULE TABLE (documented constants — the whole v1 grading policy lives here).
//
// Facing a bet, with diff = equityPct - neededEquityPct (percentage points):
//   fold: diff > +8            → 'blunder'   (folded a clearly profitable call)
//         diff in (+3, +8]     → 'mistake'
//         otherwise            → 'good'      (correct side, or coin-flip ±3)
//         BRILLIANT: strength ≥ LAYDOWN_STRENGTH and DISCOUNTED equity beats
//         needed by <-8 (see LAYDOWN_RANGE_DISCOUNT below) — a disciplined
//         big laydown of a two-pair-or-better holding.
//   call: diff < -8            → 'blunder'   (called way over the price)
//         diff in [-8, -3)     → 'mistake'
//         otherwise            → 'good'
//         BRILLIANT: strength < DRAW_CALL_STRENGTH_MAX, equity basis is OUTS,
//         and outs equity ≥ needed — a draw-driven hand (no made pair of the
//         hero's own) continuing at the right price.
//
// Not facing a bet:
//   check: 'good' by default. River check with strength ≥ VALUE_STRENGTH →
//          'inaccuracy' (missed value at the last aggro opportunity — v1
//          approximates "last opportunity" as any hero river check).
//   preflop limp / open raise: 'good' — ungraded in v1. That includes any
//          preflop decision facing toCall ≤ bigBlind (completing or folding
//          the small blind), where the crude equity model would misfire.
//
// Raises:
//   strength ≥ VALUE_STRENGTH → 'good' (value raise).
//   strength < SPEW_STRENGTH with zero outs when a free/cheap continue existed
//   (toCall === 0, or diff ≥ -3 so calling was ~priced) → 'inaccuracy' (spew).
//   Everything else → 'good'. Deliberately conservative: bluffing is a
//   legitimate strategy this engine cannot read, so v1 only punishes clear
//   price violations, never aggression itself.
//
// 2026-08-26 RE-TUNE. evaluateHandStrength moved off the old inflated scale
// (where AK-high kept its ~0.85 pre-flop number on any flop) onto the server's
// honest read, whose meaning is written down in AIPlayer.POSTFLOP_BANDS
// (src/ai/aiPlayer.js): top pair 0.50 (+ kicker bonus ≤ 0.06), overpair 0.58,
// two pair 0.52–0.66, trips 0.72 / set 0.78, straight 0.80+, flush 0.86+;
// band.value 0.46 = "top pair and up", band.strong 0.60 = "two pair and up",
// stackOff 0.62, monster 0.86. Every strength-denominated constant below is
// DERIVED from those bands rather than invented; the equity-point bands
// (CLEAR_PTS / EDGE_PTS) are price math, not strength, and did not move.
const GRADE_RULES = {
  CLEAR_PTS: 8, // beyond this many points, the decision is clearly right/wrong
  EDGE_PTS: 3, // inside this band it's a coin flip — never punished
  // Brilliant laydowns are reserved for genuinely strong hands (two pair and
  // up) folding to MASSIVE bets. Both gates matter: with a low floor and no
  // sizing gate, any fold of a middling made hand to an ordinary bet
  // short-circuited the raw-diff bands and could relabel a clear blunder
  // (folding a profitable call) as "brilliant" — which also made the
  // overfolding leak tag structurally unable to fire.
  //
  // 0.60 IS POSTFLOP_BANDS.strong ("two pair and up"), the engine's own
  // written-down line for a genuinely strong holding. On the river — where
  // LAYDOWN_MIN_NEEDED puts nearly every celebrated laydown — draw value is 0,
  // so the made-hand bands apply exactly: 0.60 sits in the engine's gap
  // between an overpair (0.58 — still one pair; folding one pair to a jam is
  // ordinary discipline, graded by the raw-diff bands) and the weakest
  // two-pair holding (0.62). stackOff (0.62) would grade rivers identically
  // (no made hand lands in [0.60, 0.62)) but would drop flop/turn
  // strong-hand-plus-draw composites in that window; band.strong is also the
  // semantic match for "the celebration is for folding two pair or better".
  LAYDOWN_STRENGTH: 0.6, // was 0.7 on the old scale
  LAYDOWN_MIN_NEEDED: 44, // needed-equity floor: massive overbets and jams only
  // "Draw-driven hand" ceiling for the brilliant priced-in call. Honest-scale
  // arithmetic: pure air tops out at 0.20 (highCardStrength's max), the
  // weakest pair OF THE HERO'S OWN reads 0.34, and evaluateDrawingHands caps
  // a draw's contribution at 0.30 — so air + any draw reads < 0.50 while any
  // own-pair + draw reads ≥ 0.52. The old 0.4 predates strength including
  // draw value; kept, it would have vetoed exactly the big-card combo draws
  // (~0.44–0.48) this grade exists to celebrate.
  DRAW_CALL_STRENGTH_MAX: 0.5, // was 0.4 on the old scale
  // Value threshold (river missed-value flag + the value-raise note).
  // band.value opens at 0.46 ("top pair and up"), but top pair spans
  // 0.50–0.56 (0.50 + kicker bonus), so a 0.46–0.50 threshold would flag
  // EVERY top-pair river check as missed value — and checking back weak-kicker
  // top pair on the river is routine, not an error. 0.55 sits at the top of
  // the top-pair span: top pair with a queen-or-better kicker (≥ 0.55), every
  // overpair (0.58) and all two-pair-plus (0.62+) flag; thinner one-pair
  // checks stay ungraded. Deliberately biased to the high end of the
  // value band for exactly that noise reason.
  VALUE_STRENGTH: 0.55, // was 0.8 on the old scale
  // Pure-air ceiling for the spew-raise flag: "below any pair of the hero's
  // own". The weakest genuine pair reads 0.34, pure high-card air tops out at
  // 0.20, and a pair sitting wholly ON the board reads 0.24–0.30 ("really a
  // high-card hand", per the engine's own comment). The ceiling must stay
  // below band.continue (0.30, "can call one bet") — flagging at the engine's
  // own continue line would call spew on hands the scale itself continues
  // with. 0.28 leaves a six-point margin under every real pair while catching
  // air and board-pair hands up to a ten-high kicker.
  SPEW_STRENGTH: 0.28, // was 0.3 on the old scale
  // Raw vs-random equity always reads ≥ strength×100, while needed equity in
  // heads-up caps below 50% — so the literal "equity−needed < −8" laydown test
  // could never fire. A massive bet weights the villain toward the top of their
  // range, so the laydown check halves raw equity first. Unchanged at 0.5 in
  // the 2026-08-26 re-tune, but the window it carves moved with the scale: at
  // the 44-needed floor the discounted test passes for strength < 0.72, so
  // two pair (0.62–0.66) clears the bar and trips (0.72) clears it against
  // anything bigger than the minimum overbet — while set-and-up (0.78+) still
  // reads as a profitable call even discounted, so folding a set, straight or
  // flush to a jam correctly falls through to the bands and grades a blunder.
  LAYDOWN_RANGE_DISCOUNT: 0.5,
};

// Weights used by matchReview's accuracy math; exported from here so the
// policy (grades AND their worth) stays in one file.
const GRADE_SCORE = {
  brilliant: 1,
  good: 1,
  inaccuracy: 0.75,
  mistake: 0.5,
  blunder: 0.15,
};

const clamp01 = (value) => Math.min(Math.max(Number(value) || 0, 0), 1);
const round1 = (value) => Math.round(value * 10) / 10;

// Server action strings → a gradeable kind. 'all-in' is a call when it covers
// no more than the facing amount, otherwise it's aggression (a raise).
const classifyAction = (action, toCall, amount) => {
  const key = String(action || '').replace(/[-_\s]/g, '').toLowerCase();
  if (key === 'fold') return 'fold';
  if (key === 'check') return 'check';
  if (key === 'call') return 'call';
  if (key === 'bet' || key === 'raise') return 'raise';
  if (key === 'allin') return toCall > 0 && amount <= toCall ? 'call' : 'raise';
  return null; // blinds / timeouts are not decisions
};

// Mirror useHandInsights: strength from the engine, outs only for a genuine
// 4-card flush draw plus straight outs, gated off when a straight+ is already
// made (the made straight's own ranks would still read as a draw).
const computeInsight = (engine, holeCards, board, phase) => {
  const strength = clamp01(engine.evaluateHandStrength(holeCards, board));
  let totalOuts = 0;
  if (board.length === 3 || board.length === 4) {
    const allCards = [...holeCards, ...board];
    let countOuts = true;
    if (typeof engine.evaluateHand === 'function') {
      const made = engine.evaluateHand(allCards);
      if (made && made.rank >= 5) countOuts = false;
    }
    if (countOuts) {
      const flushDraw = engine.hasFlushDraw(allCards);
      const flushOuts =
        flushDraw && flushDraw.isFlushDraw && flushDraw.type === 'flush-draw'
          ? flushDraw.outs
          : 0; // the engine's 3-card "backdoor flush" is not a real draw
      const draw = engine.evaluateDrawingHands(allCards);
      totalOuts = combineOuts(flushOuts, (draw && draw.straightOuts) || 0);
    }
  }
  const equity = computeEquity({ totalOuts, phase, strength });
  return { strength, totalOuts, equityPct: equity.pct, equityBasis: equity.basis };
};

const priceLine = (potBefore, toCall, equityPct, neededPct) =>
  `getting ${round1(potBefore / toCall)}:1 with ${equityPct}% equity (needed ${neededPct}%)`;

// One decision → { grade, note } per the rule table above.
const gradeOne = ({ kind, phase, toCall, potBefore, neededPct, insight }) => {
  const { CLEAR_PTS, EDGE_PTS } = GRADE_RULES;
  const facing = toCall > 0 && neededPct !== null;
  const diff = facing ? insight.equityPct - neededPct : null;
  const strengthPct = Math.round(insight.strength * 100);

  if (kind === 'fold') {
    if (!facing) return { grade: 'good', note: 'Folded with nothing to call' };
    const price = priceLine(potBefore, toCall, insight.equityPct, neededPct);
    // Brilliant runs first: a celebrated laydown must not fall through to the
    // raw-diff bands, which read every big-hand fold as a blunder. Gated to
    // two-pair-plus strength AND genuinely huge bets so it can never launder
    // an ordinary-bet fold (a real potential blunder) into a celebration.
    const discounted = insight.equityPct * GRADE_RULES.LAYDOWN_RANGE_DISCOUNT;
    if (
      insight.strength >= GRADE_RULES.LAYDOWN_STRENGTH &&
      neededPct >= GRADE_RULES.LAYDOWN_MIN_NEEDED &&
      discounted - neededPct < -CLEAR_PTS
    ) {
      return { grade: 'brilliant', note: `Disciplined laydown — folded a ${strengthPct}% hand ${price}` };
    }
    if (diff > CLEAR_PTS) return { grade: 'blunder', note: `Folded ${price}` };
    if (diff > EDGE_PTS) return { grade: 'mistake', note: `Folded ${price}` };
    return { grade: 'good', note: `Folded ${price}` };
  }

  if (kind === 'call') {
    if (!facing) return { grade: 'good', note: 'Called with nothing owed' };
    const price = priceLine(potBefore, toCall, insight.equityPct, neededPct);
    if (
      insight.strength < GRADE_RULES.DRAW_CALL_STRENGTH_MAX &&
      insight.equityBasis === 'outs' &&
      diff >= 0
    ) {
      return { grade: 'brilliant', note: `Priced-in draw call — called ${toCall} ${price}` };
    }
    if (diff < -CLEAR_PTS) return { grade: 'blunder', note: `Called ${toCall} ${price}` };
    if (diff < -EDGE_PTS) return { grade: 'mistake', note: `Called ${toCall} ${price}` };
    return { grade: 'good', note: `Called ${toCall} ${price}` };
  }

  if (kind === 'check') {
    if (phase === 'river' && insight.strength >= GRADE_RULES.VALUE_STRENGTH) {
      return {
        grade: 'inaccuracy',
        note: `Checked the river with a ${strengthPct}% hand — missed value`,
      };
    }
    return { grade: 'good', note: 'Checked' };
  }

  if (kind === 'raise') {
    if (phase === 'preflop') {
      // Open sizing / preflop aggression is ungraded in v1 — the crude
      // preflop strength model can't tell a standard open from spew.
      return { grade: 'good', note: 'Preflop raise (sizing not graded)' };
    }
    if (insight.strength >= GRADE_RULES.VALUE_STRENGTH) {
      return { grade: 'good', note: `Value raise with a ${strengthPct}% hand` };
    }
    if (
      insight.strength < GRADE_RULES.SPEW_STRENGTH &&
      insight.totalOuts === 0 &&
      (toCall === 0 || (diff !== null && diff >= -EDGE_PTS))
    ) {
      return {
        grade: 'inaccuracy',
        note: `Raised with a ${strengthPct}% hand and no draw when a ${toCall === 0 ? 'free' : 'cheap'} continue was available`,
      };
    }
    // Bluffs and semi-bluffs are legitimate — aggression itself is never
    // punished in v1, only clear price violations above.
    return { grade: 'good', note: `Raised with a ${strengthPct}% hand` };
  }

  return { grade: 'good', note: 'No grade' };
};

// timeline (from buildReplayTimeline) + engine → array of graded hero
// decisions. Null-safe: bad input or an engine failure yields [] / skips.
const gradeHand = (timeline, insightEngine) => {
  if (!timeline || !insightEngine || !Array.isArray(timeline.frames)) return [];
  const holeCards = normalizeCards(timeline.hero && timeline.hero.cards);
  if (!holeCards || holeCards.length !== 2) return [];
  const bigBlind = Number(timeline.bigBlind) || 100;

  const decisions = [];
  // Tracks whether ANY seat has raised preflop yet (updated after each frame is
  // handled, so a frame sees only raises that came BEFORE it). The blind
  // exemption below must not swallow real decisions vs a raise: the server's
  // legal minimum preflop raise can leave the BB facing toCall ≤ bigBlind, which
  // is a genuine decision, not a blind completion.
  let preflopRaiseSeen = false;
  timeline.frames.forEach((frame) => {
    if (!frame) return;
    const frameKind = classifyAction(frame.action, frame.toCall, frame.amount);
    const noteRaise = () => {
      if (frame.phase === 'preflop' && frameKind === 'raise') preflopRaiseSeen = true;
    };
    if (!frame.isHeroDecision || !frameKind) {
      noteRaise();
      return;
    }
    const kind = frameKind;

    // Unraised preflop pots for ≤ one big blind (completing or folding the
    // small blind) are ungraded in v1 — the price is so good the formula would
    // call every SB fold a mistake, and limping trash is fine.
    if (
      frame.phase === 'preflop' &&
      !preflopRaiseSeen &&
      frame.toCall > 0 &&
      frame.toCall <= bigBlind &&
      kind !== 'raise'
    ) {
      noteRaise();
      decisions.push({
        frameIndex: frame.index,
        action: kind,
        grade: 'good',
        metrics: {
          strength: null,
          equityPct: null,
          neededPct: null,
          toCall: frame.toCall,
          pot: frame.potBefore,
          equityBasis: null, // nothing was computed, so nothing to attribute
        },
        note: kind === 'call' ? 'Completed the blind (not graded)' : 'Folded the small blind (not graded)',
      });
      return;
    }

    let insight;
    try {
      const board = normalizeCards(frame.boardCards) || [];
      insight = computeInsight(insightEngine, holeCards, board, frame.phase);
    } catch (error) {
      return; // an engine hiccup must never take down the whole review
    }

    const potOdds = frame.toCall > 0
      ? computePotOdds({ callAmount: frame.toCall, potBeforeCall: frame.potBefore })
      : null;
    const neededPct = potOdds ? potOdds.neededEquityPct : null;

    const { grade, note } = gradeOne({
      kind,
      phase: frame.phase,
      toCall: frame.toCall,
      potBefore: frame.potBefore,
      neededPct,
      insight,
    });

    decisions.push({
      frameIndex: frame.index,
      action: kind,
      grade,
      metrics: {
        strength: insight.strength,
        equityPct: insight.equityPct,
        neededPct,
        toCall: frame.toCall,
        pot: frame.potBefore,
        // 'outs' (rule-of-2-and-4) or 'strength' (vs-random estimate). Surfaced
        // so the UI can say WHICH model produced the equity every price claim
        // rests on, instead of presenting both with the same confidence.
        equityBasis: insight.equityBasis,
      },
      note,
    });
    noteRaise(); // hero preflop raises gate later blind exemptions too
  });

  return decisions;
};

module.exports = { gradeHand, classifyAction, GRADE_RULES, GRADE_SCORE };
