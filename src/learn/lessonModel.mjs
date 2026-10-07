// The pure lesson-player model (learn-flow-2026-09-16; mobile-lessons-v2 SPEC 3.2): rail segments,
// the chip score, recap rows, the hint ladder, what the table is allowed to know about saved
// answers, and the small rules the hand step and the coach panel apply to a spot. No React, no
// timers: the web player and the app's lesson controller both render from it, so a wrong answer
// releases the same hand, a hint costs the same chip and the recap reads the same on both.
//
// Sources, ported verbatim unless noted:
//   rail, table plan, released answers, ladder, score, recap, entry, film meta
//                                  flop52web src/components/learn/player/lessonModel.js
//   action labels, answer text     flop52web src/components/learn/engine/decisions/answers.js
//   hand plan, action bar, ledger, highlights, feedback copy
//                                  flop52web src/components/learn/player/HandStep.js
//   verdict tone and words, panel copy
//                                  flop52web src/components/learn/player/CoachPanel.js
//   completing cards (the outs fan)
//                                  flop52web src/components/learn/engine/session/previewGrading.js
// Relative imports with extensions, so it runs under plain Node, Metro and the web bundler.
import pokerEval from "../eval/pokerEvaluator.js";
import { decisionStages, lessonHands } from "./lessons/index.mjs";
import { cardLabel, expandScript, toTableCard } from "./scriptedHand.mjs";

const { evaluateHand } = pokerEval;

// ---- answers (answers.js) ----------------------------------------------------------------------
const CARD = /^[2-9TJQKA][shdc]$/;
const SUITS = { s: "♠", h: "♥", d: "♦", c: "♣" };

export const DEFAULT_ACTION_LABELS = Object.freeze({
  fold: () => "Fold", check: () => "Check", call: (spot) => `Call ${spot.call}`,
  bet: (spot) => (spot.sizes?.bet ? `Bet ${spot.sizes.bet}` : "Bet"), raise: (spot) => (spot.sizes?.raise ? `Raise to ${spot.sizes.raise}` : "Raise"),
  "large-bet": (spot) => (spot.sizes?.["large-bet"] ? `Bet ${spot.sizes["large-bet"]}` : "Bet big"),
});

export const ANSWER_WORDS = Object.freeze({
  action: ["You chose", "The play"], count: ["You counted", "The count"],
  estimate: ["Your estimate", "The estimate"], "best-five": ["Your five", "The best five"],
});

export function visibleCards(spot) {
  return [...(spot.hero || []), ...(spot.board || [])].filter(Boolean);
}

export function actionLabel(spot, action) {
  return spot.choiceLabels?.[action] ?? DEFAULT_ACTION_LABELS[action]?.(spot) ?? action;
}

export function cardText(code) {
  return CARD.test(code) ? `${code[0] === "T" ? "10" : code[0]}${SUITS[code[1]]}` : String(code);
}

export function answerText(kind, fields, spot = null) {
  if (!fields) return "";
  if (kind === "action") return fields.action;
  if (kind === "count") return spot?.unit ? `${fields.value} ${spot.unit}` : String(fields.value);
  if (kind === "estimate") return spot?.bands?.find((band) => (band.id ?? band) === fields.band)?.label ?? fields.band;
  if (kind === "best-five") return (fields.cards || []).map(cardText).join(" ");
  return "";
}

// ---- rail (SPEC 4.6) ----------------------------------------------------------------------------
// Segments: Film · <coach>'s hand · Practice · Fresh hand · Recap. A hand is one segment however
// many decisions it holds. A segment fills on completion, never on arrival.
export function railSegments(definition, run) {
  const stages = definition.stages;
  const answers = run?.answers || {};
  const furthest = run?.furthest ?? 0;
  const segments = [];
  stages.forEach((stage, index) => {
    if (stage.kind === "film") segments.push({ key: "film", label: stage.label, start: index, stages: [index], complete: !!run?.watched?.[index] });
  });
  for (const hand of lessonHands(definition)) {
    segments.push({
      key: hand.hand, label: hand.label, role: hand.role, start: hand.stages[0].index, stages: hand.stages.map((stage) => stage.index),
      complete: hand.stages.every((stage) => !!answers[stage.spotId]),
    });
  }
  const last = stages.length - 1;
  if (stages[last]?.kind === "takeaway") segments.push({ key: "recap", label: stages[last].label, start: last, stages: [last], complete: furthest >= last });
  return segments.map((segment, i) => ({ ...segment, number: i + 1, reachable: segment.start <= furthest }));
}

export function segmentForStep(segments, step) {
  return segments.find((segment) => segment.stages.includes(step)) || null;
}

// ---- hands ------------------------------------------------------------------------------------
export function stageHand(definition, step) {
  const stage = definition.stages[step];
  return stage?.kind === "decision" ? definition.hands[stage.hand] : null;
}

// Which hand the persistent table shows at a step, and how:
//   "held"  the guided hand frozen on its start state (entry and film: the table waits behind the film)
//   "live"  the hand's script runs (a decision step)
//   "settled" a finished hand re-entered without re-dealing or replaying chips (recap, Back)
export function tablePlan(definition, step, run) {
  const stages = definition.stages;
  const stage = stages[step];
  const decisions = decisionStages(definition);
  if (!stage || stage.kind === "welcome" || stage.kind === "film") return { handId: decisions[0]?.hand ?? null, mode: "held" };
  if (stage.kind === "decision") {
    const handStages = decisions.filter((item) => item.hand === stage.hand);
    const answeredAll = handStages.every((item) => run?.answers?.[item.spotId]);
    const revisiting = answeredAll && (run?.furthest ?? 0) > handStages.at(-1).index;
    return { handId: stage.hand, mode: revisiting ? "settled" : "live" };
  }
  return { handId: decisions.at(-1)?.hand ?? null, mode: "settled" };
}

// The hand object the driver plays for a table plan (HandStep.js hookHand). "held" cuts the script
// at the hand's `startAt` (the film's handoff frame); "settled" starts past the end, so the finished
// table mounts with no deal and no chip flight. Memoize it on `plan.handId` and `plan.mode`: a new
// object restarts the driver and re-deals.
export function planHand(definition, plan) {
  const hand = plan.handId ? definition.hands[plan.handId] : null;
  if (!hand) return null;
  if (plan.mode === "held") {
    const startAt = hand.startAt || 0;
    return { ...hand, script: hand.script.slice(0, startAt), startAt };
  }
  if (plan.mode === "settled") return { ...hand, startAt: expandScript(hand).length };
  return hand;
}

// The answers the scripted hand may act on (useScriptedHand `answers`). An action is played on the
// table as soon as it is saved (a fold folds, a call calls). A best five or a count releases the
// hand only when it is correct, ungraded, or the learner has moved past it ("Continue anyway"),
// so a wrong count never opens the call on the same deal.
export function releasedAnswers(definition, run, step) {
  const out = {};
  for (const stage of decisionStages(definition)) {
    const saved = run?.answers?.[stage.spotId];
    if (!saved) continue;
    const spot = definition.spots[stage.spotId];
    if (spot.decision === "action") out[stage.spotId] = saved;
    else if (saved.correct !== false || stage.index < step) out[stage.spotId] = saved;
  }
  return out;
}

// One string per distinct set of saved attempts (HandStep.js useStableAnswers). A client memoizes
// the released answers on it, so the driver's retry bookkeeping (which compares answer objects)
// never sees fresh objects for unchanged answers on a re-render.
export function answersSignature(answers) {
  return Object.entries(answers || {})
    .map(([id, a]) => [id, a.attemptNumber ?? "", a.attemptId ?? "", String(a.correct), a.action ?? "", JSON.stringify(a.response ?? null)].join(":"))
    .sort().join("|");
}

// ---- hint ladder (SPEC 1.3) ---------------------------------------------------------------------
// attempts: this run's attempts at the spot. Level 0 nothing, 1 the hint text, 2 the focus cards.
export function spotLadder(run, spotId, role) {
  const attempts = (run?.history || []).filter((item) => item.spotId === spotId);
  const answer = run?.answers?.[spotId] || null;
  const wrong = attempts.filter((item) => item.correct === false).length;
  const hinted = !!run?.hints?.[spotId];
  const hintLevel = wrong >= 2 && !answer?.correct ? 2 : hinted || wrong >= 1 ? 1 : 0;
  return {
    attempts: attempts.length, wrong, hinted, answer, hintLevel,
    // Wrong answers: first, Try again; second and later, Show me (Try again as the secondary).
    primary: !answer ? null : answer.correct === false ? (wrong >= 2 ? "show" : "retry") : "continue",
    // "Continue anyway" is always there on the guided and practice hands; the fresh hand shows it
    // from the second attempt (the recap still lists the miss).
    continueAnyway: !!answer && answer.correct === false && (role !== "fresh" || attempts.length >= 2),
  };
}

// ---- score (SPEC 1.3) -------------------------------------------------------------------------
// 3: every fresh-hand decision correct first time with no hint, and at most one assisted attempt
//    in the whole run. 2: every fresh-hand decision correct first time. 1: otherwise.
export function chipScore(definition, run) {
  const history = run?.history || [];
  const fresh = decisionStages(definition).filter((stage) => stage.role === "fresh");
  const firsts = fresh.map((stage) => history.find((item) => item.spotId === stage.spotId));
  // The run's first attempt at each fresh decision (history is this run only).
  const firstTry = firsts.length > 0 && firsts.every((attempt) => attempt?.correct === true);
  const clean = firstTry && firsts.every((attempt) => !attempt.usedHint);
  const assisted = history.filter((item) => item.assisted).length;
  const score = clean && assisted <= 1 ? 3 : firstTry ? 2 : 1;
  const reason = score === 3
    ? "Every fresh-hand decision right on the first try, with no hint."
    : score === 2 ? "Every fresh-hand decision right on the first try. A hint or a second try elsewhere keeps the third chip."
      : "The fresh hand took more than one try. Play it again to earn more chips.";
  return { score, reason };
}

// ---- recap rows ---------------------------------------------------------------------------------
const cap = (text) => (text ? text[0].toUpperCase() + text.slice(1).toLowerCase() : "");

export function handName(cards) {
  if (!Array.isArray(cards) || cards.length !== 5) return null;
  return cap(evaluateHand(cards.map(toTableCard)).name);
}

function attemptWords(attempts, answer) {
  if (!attempts.length) return "not played";
  const first = attempts[0];
  if (first.correct === true && !first.assisted && !first.usedHint) return "first try";
  if (answer?.correct === true) return first.usedHint || attempts.length === 1 ? "with a hint" : "after a retry";
  if (answer?.correct == null && first.correct == null) return "played";
  return "missed";
}

export function recapRows(definition, run) {
  const labels = definition.stages.at(-1)?.recapLabels || [];
  const history = run?.history || [];
  return lessonHands(definition).map((hand, i) => {
    const parts = hand.stages.map((stage) => {
      const spot = definition.spots[stage.spotId];
      const answer = run?.answers?.[stage.spotId] || null;
      const attempts = history.filter((item) => item.spotId === stage.spotId);
      let fact = null;
      if (spot.decision === "best-five") fact = handName(answer?.expected?.cards || answer?.response?.cards);
      else if (spot.decision === "count") fact = answer?.response?.value != null ? `${answer.response.value}${spot.unit ? ` ${spot.unit}` : ""}` : null;
      else if (spot.decision === "estimate") fact = answer?.response?.band ? answerText("estimate", answer.response, spot).toLowerCase() : null;
      else if (spot.decision === "action") fact = answer?.action ? (["fold", "check", "call"].includes(answer.action) ? answer.action : actionLabel(spot, answer.action).toLowerCase()) : null;
      return { stage, spot, answer, attempts, fact, words: attemptWords(attempts, answer) };
    });
    const missed = parts.some((part) => part.words === "missed" || part.words === "not played");
    const words = parts.every((part) => part.words === "first try") ? "first try"
      : missed ? "missed" : parts.some((part) => part.words === "after a retry") ? "after a retry" : parts.some((part) => part.words === "with a hint") ? "with a hint" : parts[0].words;
    const facts = parts.map((part) => part.fact).filter(Boolean);
    const five = parts.find((part) => part.spot.decision === "best-five")?.answer?.expected?.cards || null;
    return {
      key: hand.hand, role: hand.role, label: labels[i] || hand.label, facts, words, missed,
      cards: five, firstStage: hand.stages[0].index, missedStage: parts.find((part) => part.words === "missed" || part.words === "not played")?.stage.index ?? null,
    };
  });
}

// ---- entry card (SPEC 1.4, 6.5) -----------------------------------------------------------------
export function entryState(definition, run) {
  const last = definition.stages.length - 1;
  const furthest = run?.furthest ?? 0;
  const watched = definition.stages.some((stage, index) => stage.kind === "film" && run?.watched?.[index]);
  if (furthest >= last) return { status: "complete", resumeStep: null, watched };
  if (furthest > 0) {
    const resumeStep = Math.max(1, Math.min(run?.stage || furthest, furthest));
    const target = definition.stages[resumeStep].kind === "film" && watched ? Math.min(furthest, resumeStep + 1) : resumeStep;
    return { status: "progress", resumeStep: target, watched, resumeLabel: definition.stages[target].label };
  }
  return { status: "new", resumeStep: 1, watched };
}

export function filmMeta(definition, media) {
  const seconds = Math.round(media?.durationSeconds || 30);
  const hands = lessonHands(definition).length;
  return { seconds, hands, minutes: definition.meta?.minutes ?? null };
}

// ---- the hand step (HandStep.js) ----------------------------------------------------------------
// Can the game's action bar say these choices? It has one fold, one check-or-call and one go button.
const BAR_ACTIONS = ["fold", "check", "call", "bet", "raise"];
export function fitsActionBar(choices = []) {
  return choices.every((choice) => BAR_ACTIONS.includes(choice))
    && choices.filter((choice) => choice === "check" || choice === "call").length <= 1
    && choices.filter((choice) => choice === "bet" || choice === "raise").length <= 1;
}

// A choice button's tone in the choice dock (fold, or a go button; everything else neutral).
export const CHOICE_TONES = Object.freeze({ fold: "fold", bet: "go", raise: "go", "large-bet": "go" });

// "25 ÷ 250 = 10%": the price of the call.
export function priceLine(spot) {
  const finalPot = spot.potBefore + spot.bet + spot.call;
  return `${spot.call} ÷ ${finalPot} = ${Math.round((100 * spot.call) / finalPot)}%`;
}

// The price ledger a spot with `ledger: "price"` shows: the chance, then the price (hidden on a
// `hidePrice` spot until the learner answers or reaches hint level 2). Null for any other spot.
export function ledgerLines(spot, answer, ladder) {
  if (!(spot?.ledger === "price" && spot.given?.equity != null)) return null;
  const outs = spot.given.outs ?? Math.round(spot.given.equity / 2);
  const ledger = [{ key: "chance", label: spot.given.source || "Your estimate", value: `${outs} outs · roughly ${spot.given.equity}%` }];
  const priceVisible = !spot.hidePrice || answer || (ladder?.hintLevel ?? 0) >= 2;
  if (priceVisible) ledger.push({ key: "price", label: "The price", value: priceLine(spot) });
  return ledger;
}

// The verdict copy for a decision: the lesson's words, overridden by the stage's.
export function feedbackCopy(definition, stage) {
  return { ...definition.feedback, ...(stage?.feedback || {}) };
}

// Table highlights for a spot (HandStep.js :114-128). After a correct best five: the named five lit,
// the other visible cards dimmed. Before an answer: the focus cards at hint level 2, the cards
// "Show me" has lit so far and the current best-five picks; the rest dim only while focus or
// Show me is lighting cards. `shown`: { spotId, cards, lit } from Show me, or null; it lights only
// when its spotId is this stage's `spotId`.
export function tableHighlights({ spot, spotId = null, answer = null, ladder = null, shown = null, picked = [] } = {}) {
  if (!spot) return { highlight: [], dim: [] };
  const visible = [...(spot.hero || []), ...(spot.board || [])];
  let highlight = [];
  let dim = [];
  if (spot.decision === "best-five" && answer?.correct === true) {
    highlight = answer.expected?.cards || answer.response?.cards || [];
    dim = visible.filter((code) => !highlight.includes(code));
  } else if (!answer) {
    const focus = (ladder?.hintLevel ?? 0) >= 2 ? spot.focus || [] : [];
    const lit = shown && shown.spotId === spotId && shown.cards ? shown.cards.slice(0, shown.lit) : [];
    highlight = [...new Set([...focus, ...lit, ...(spot.decision === "best-five" ? picked : [])])];
    dim = focus.length || lit.length ? visible.filter((code) => !highlight.includes(code)) : [];
  }
  return { highlight, dim };
}

// The ghost fan of outs after a correct (or shown) count on a spot with a `target`: hypothetical
// cards, never a dealt street. { count, cards, label } or null.
export function outsSummary(spot) {
  if (!spot?.target || !spot.hero || !spot.board) return null;
  const cards = completingCards(spot.hero, spot.board, spot.target);
  return { count: cards.length, cards, label: `Your ${cards.length} outs: ${cards.map(cardLabel).join(", ")}` };
}

// ---- the coach panel (CoachPanel.js) ------------------------------------------------------------
// "ok" for a correct answer, "miss" for a wrong one, "open" for an ungraded one; null before one.
export function verdictTone(answer) {
  if (!answer) return null;
  return answer.correct === true ? "ok" : answer.correct === false ? "miss" : "open";
}

// The verdict line for an answer, from feedbackCopy(definition, stage).
export function verdictWords(answer, copy) {
  const tone = verdictTone(answer);
  return tone ? ({ ok: copy?.found, miss: copy?.missed, open: copy?.open })[tone] ?? null : null;
}

// The feedback body under the verdict: a miss gets the hint (from the second miss, the pointer to
// the lit cards and Show me); a correct or ungraded answer gets the explanation.
export function feedbackBody(spot, answer, ladder) {
  if (!answer) return null;
  if (answer.correct === false) return (ladder?.wrong ?? 0) >= 2 ? "Look at the lit cards, or let us show you." : spot.hint;
  return spot.explanation;
}

// The hint as the panel shows it at a ladder level (1+). Level 2 points at the focus cards.
export function hintText(spot, ladder) {
  if ((ladder?.hintLevel ?? 0) < 1) return null;
  return `${spot.hint}${ladder.hintLevel >= 2 && spot.focus?.length ? " The lit cards are the place to start." : ""}`;
}

// The hint button: the fresh hand's hint costs the third chip (chipScore).
export function hintLabel(role) {
  return role === "fresh" ? "Hint · costs a chip" : "Hint";
}

// ---- completing cards (previewGrading.js) -------------------------------------------------------
const RANKS = "23456789TJQKA";
const DECK = [...RANKS].flatMap((rank) => ["s", "h", "d", "c"].map((suit) => `${rank}${suit}`));
// poker-core's evaluator ranks: 5 straight, 6 flush (1 high card … 9 straight flush).
const TARGET_RANK = Object.freeze({ straight: 5, flush: 6 });
const evaluate = (codes) => evaluateHand(codes.map(toTableCard));

// The unseen cards that turn the hero's hand into at least `target` (a straight or a flush) when
// the board alone does not already make it. Hypothetical cards only; nothing is dealt.
export function completingCards(hero, board, target) {
  const need = TARGET_RANK[target];
  if (!need) return [];
  const seen = new Set([...hero, ...board]);
  return DECK.filter((code) => !seen.has(code)).filter((code) => {
    const made = evaluate([...hero, ...board, code]).rank >= need;
    const boardAlone = board.length + 1 >= 5 && evaluate([...board, code]).rank >= need;
    return made && !boardAlone;
  });
}
