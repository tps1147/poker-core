"use strict";
// Shared fixtures for test/v1/rating. Every number below is a MACHINERY FIXTURE chosen only to make the
// arithmetic observable; none is a proposed production value, threshold or weight.
const R = require("../../../src/rating/v1/index.cjs");

const V = (id, version = "1") => ({ id, version, sha256: null });
const S = (kind, recordId, recordVersion = "1") => ({ kind, recordId, recordVersion, sourceHash: null });
const ENV = { contractId: R.CONTRACT_ID, schemaVersion: R.SCHEMA_VERSION };
const codes = (r) => (r.ok ? [] : r.problems.map((x) => x.code));
const card = (s) => ({ rank: s[0], suit: s[1] });

const FORMAT = V("hu-nlhe-fixture");
const POPULATION = V("ranked-hu-fixture");
const EXTRACTOR = V("extractor-fixture");
const VISIBILITY = V("decision-visibility-fixture");
const AMOUNTS = V("amount-semantics-fixture");
const PERSONA_POLICY = V("persona-policy-fixture", "3");
const OPP_MODEL = V("opponent-model-fixture");
const EVALUATOR = V("evaluator-fixture");
const VALUE_SEM = V("value-semantics-fixture");
const QUALITY_SEM = V("quality-semantics-fixture");
const RATING_U = V("rating-uncertainty-method-fixture");
const ASSESS_U = V("assessment-uncertainty-method-fixture");

const versionContext = () => ({
  formatRefs: [FORMAT], extractorRefs: [EXTRACTOR], visibilityPolicyRefs: [VISIBILITY], amountSemanticsRefs: [AMOUNTS],
  opponentPolicyRefs: [PERSONA_POLICY],
  formatGeometry: { ranks: "23456789TJQKA", suits: "cdhs", holeCards: 2, boardCardsByStreet: { preflop: 0, flop: 3, turn: 4, river: 5 } },
});

// A raw server-side hand record: it contains everything, including concealed and future data.
function rawHand({ handId = "h1", matchId = "m1", heroCards = ["Ah", "Kd"], villainCards = ["7c", "7d"], board = ["Qs", "Jh", "2c", "9d", "3s"], winner = "villain" } = {}) {
  return {
    matchId, handId,
    players: { hero: { id: "u-hero", kind: "human", cards: heroCards }, villain: { id: "ai-viv", kind: "ai_persona", cards: villainCards, policy: PERSONA_POLICY } },
    blinds: { smallBlind: 1, bigBlind: 2 },
    board, winner,
    actions: [
      { ordinal: 0, by: "u-hero", street: "preflop", action: "raise", amount: 6 },
      { ordinal: 1, by: "ai-viv", street: "preflop", action: "call", amount: 6 },
      { ordinal: 2, by: "ai-viv", street: "flop", action: "bet", amount: 8 },
      { ordinal: 3, by: "u-hero", street: "flop", action: "call", amount: 8 },
      { ordinal: 4, by: "ai-viv", street: "turn", action: "check", amount: null },
      { ordinal: 5, by: "u-hero", street: "turn", action: "bet", amount: 20 },
      { ordinal: 6, by: "ai-viv", street: "turn", action: "call", amount: 20 },
    ],
    showdown: { villainShowed: villainCards },
  };
}

// TEST REFERENCE EXTRACTOR (allowlist). Main owns the live extraction; this exists only to show that
// concealed/future fields of a raw fixture cannot reach the closed decision type.
function extractDecision(raw, ordinal, { street = "flop", position = "button" } = {}) {
  const hero = raw.players.hero; const villain = raw.players.villain;
  const boardCount = { preflop: 0, flop: 3, turn: 4, river: 5 }[street];
  const prefix = raw.actions.filter((a) => a.ordinal < ordinal);
  const committed = (id) => prefix.filter((a) => a.by === id && a.amount !== null).reduce((s, a) => s + a.amount, 0);
  const pot = committed(hero.id) + committed(villain.id);
  const lastVillain = [...prefix].reverse().find((a) => a.by === villain.id && a.street === street);
  const toCall = lastVillain && lastVillain.amount ? lastVillain.amount : 0;
  const ev = {
    ...ENV, evidenceId: `ev:${raw.matchId}:${raw.handId}:${ordinal}`, fingerprint: null,
    source: S("hand-action", `${raw.handId}#${ordinal}`), subjectId: hero.id, matchId: raw.matchId, handId: raw.handId,
    actionOrdinal: ordinal, formatRef: FORMAT, opponentId: villain.id, participantKind: hero.kind, opponentKind: villain.kind,
    opponentPolicyRef: villain.policy, extractorRef: EXTRACTOR, visibilityPolicyRef: VISIBILITY, observedAt: "2026-10-01T12:00:00Z",
    informationSet: {
      street, ownCards: hero.cards.map(card), visibleBoardCards: raw.board.slice(0, boardCount).map(card), position,
      publicStacks: [{ participantId: hero.id, chips: 200 - committed(hero.id) }, { participantId: villain.id, chips: 200 - committed(villain.id) }],
      publicCommitments: [{ participantId: hero.id, chips: committed(hero.id) }, { participantId: villain.id, chips: committed(villain.id) }],
      potBeforeAction: pot, amountToCall: toCall, blinds: { ...raw.blinds },
      legalActions: toCall > 0
        ? [{ action: "fold", minimumAmount: null, maximumAmount: null, amountSemanticsRef: AMOUNTS },
          { action: "call", minimumAmount: toCall, maximumAmount: toCall, amountSemanticsRef: AMOUNTS },
          { action: "raise", minimumAmount: toCall * 2, maximumAmount: 200 - committed(hero.id), amountSemanticsRef: AMOUNTS }]
        : [{ action: "check", minimumAmount: null, maximumAmount: null, amountSemanticsRef: AMOUNTS },
          { action: "bet", minimumAmount: raw.blinds.bigBlind, maximumAmount: 200 - committed(hero.id), amountSemanticsRef: AMOUNTS }],
      publicActionPrefix: prefix.map((a) => ({ ordinal: a.ordinal, participantId: a.by, street: a.street, action: a.action, amount: a.amount })),
    },
    chosenAction: (() => { const a = raw.actions.find((x) => x.ordinal === ordinal); return { action: a.action, amount: a.amount }; })(),
    opponentModel: { modelRef: OPP_MODEL, uncertaintyRef: S("model-uncertainty", "opp-u"), admittedDecisionTimeEvidenceRefs: [S("public-action", `${raw.handId}#1`)] },
    completeness: { status: "complete", missingFields: [], reasonCodes: [] },
  };
  ev.fingerprint = R.fingerprintOf(ev);
  return ev;
}
const refingerprint = (ev) => { const e = JSON.parse(JSON.stringify(ev)); e.fingerprint = R.fingerprintOf(e); return e; };

// Stub evaluator: a deterministic function of the closed information set only (pot odds of a call).
// Not a poker evaluator; exists to exercise the plumbing. `value` is overridable for causal tests.
function stubEvaluator({ calibrated = true, value = null, status = "supported" } = {}) {
  const u = (variance) => ({ status: "estimated", methodRef: ASSESS_U, parameters: { variance }, coverageRef: null });
  return {
    evaluatorRef: EVALUATOR, valueSemanticsRef: VALUE_SEM, qualitySemanticsRef: QUALITY_SEM,
    calibrationRef: calibrated ? S("calibration", "cal-fixture") : null, versionContext: versionContext(),
    evaluate(ev, view) {
      const is = ev.informationSet;
      const price = is.amountToCall / (is.potBeforeAction + 2 * is.amountToCall || 1);
      const base = value === null ? 1 - price - (view ? view.aggression : 0) : value;
      return { status, actionValues: is.legalActions.map((a) => ({ action: a.action, amount: a.minimumAmount, estimate: a.action === ev.chosenAction.action ? base : 0, uncertainty: u(0.25) })),
        chosenValue: base, chosenUncertainty: u(0.25), privateReasonCodes: ["STUB"] };
    },
  };
}
const opponentModel = () => ({ modelRef: OPP_MODEL, opponentPolicyRef: PERSONA_POLICY, uncertaintyRef: S("model-uncertainty", "opp-u"), view: { aggression: 0.1 } });

// ---------------------------------------------------------------- rating
const snapshot = (subjectId, estimate, variance, policyRef, revision = 4) => ({ subjectId, revision, estimate,
  uncertainty: { status: "estimated", methodRef: RATING_U, parameters: { variance }, coverageRef: null }, modelRef: V("prior-model"), policyRef });

const PARAMS = {
  joint_latent_outcome_quality: { logisticScale: 1, outcomeScores: { win: 1, tie: 0.5, loss: 0 }, qualityLoading: 0.5, qualityIntercept: 0, qualityNoiseVariance: 1, varianceFloor: 0.01 },
  bounded_uncertainty_shrunk_quality: { logisticScale: 1, stepSize: 0.2, outcomeScores: { win: 1, tie: 0.5, loss: 0 }, qualityGain: 0.3, qualityReference: 0, priorQualityVariance: 1, adjustmentBound: 0.1 },
  outcome_only_baseline: { logisticScale: 1, stepSize: 0.2, outcomeScores: { win: 1, tie: 0.5, loss: 0 } },
};
function candidateConfig(candidate, parameters = PARAMS[candidate]) {
  const q = candidate !== "outcome_only_baseline";
  return { candidate, experimental: true, configId: V(`exp-${candidate}`), parameterSchemaRef: V(`schema-${candidate}`),
    uncertaintyMethodRef: RATING_U, assessmentUncertaintyMethodRef: q ? ASSESS_U : null, qualitySemanticsRef: q ? QUALITY_SEM : null,
    evaluatorRefs: q ? [EVALUATOR] : [], parameters: JSON.parse(JSON.stringify(parameters)) };
}
const makeModel = (candidate, parameters) => {
  const f = { outcome_only_baseline: R.candidates.createOutcomeOnlyBaseline, joint_latent_outcome_quality: R.candidates.createJointLatentOutcomeQuality,
    bounded_uncertainty_shrunk_quality: R.candidates.createBoundedUncertaintyShrunkQuality }[candidate];
  const r = f(candidateConfig(candidate, parameters));
  if (!r.ok) throw new Error(JSON.stringify(r.problems));
  return r.value;
};
function ratingPolicy(candidate = "joint_latent_outcome_quality", { status = "candidate", parameters } = {}) {
  const P = V(`rating-policy-${candidate}`);
  if (status === "unselected") {
    return { ...ENV, policy: V("rating-policy-unselected"), status, candidate: null, formatRef: FORMAT, populationRef: POPULATION, parameterSchemaRef: null, parameters: null,
      placementPolicyRef: null, opponentAdmissionPolicyRef: null, qualityAdmissionPolicyRef: null, uncertaintyPolicyRef: null, dependencePolicyRef: null,
      publicReasonPolicyRef: null, validationRefs: [], acceptanceRef: null };
  }
  return { ...ENV, policy: P, status, candidate, formatRef: FORMAT, populationRef: POPULATION, parameterSchemaRef: V(`schema-${candidate}`),
    parameters: JSON.parse(JSON.stringify(parameters || PARAMS[candidate])), placementPolicyRef: V("placement-fixture"),
    opponentAdmissionPolicyRef: V("opp-admission-fixture"), qualityAdmissionPolicyRef: V("quality-admission-fixture"),
    uncertaintyPolicyRef: V("uncertainty-policy-fixture"), dependencePolicyRef: V("dependence-fixture"), publicReasonPolicyRef: V("public-reasons-fixture"),
    validationRefs: [], acceptanceRef: status === "accepted" ? S("acceptance", "acc-1") : null };
}
function pairedInput({ candidate = "joint_latent_outcome_quality", assessments = [], winner = "u-hero", policy } = {}) {
  const pol = policy || ratingPolicy(candidate);
  return {
    ...ENV, matchId: "m1", resultSource: S("ranked-settlement", "settle-m1"), formatRef: FORMAT, populationRef: POPULATION,
    participants: [
      { subjectId: "u-hero", participantKind: "human", current: snapshot("u-hero", 0.2, 0.5, pol.policy), personaPolicyRef: null, opponentPolicyRef: PERSONA_POLICY },
      { subjectId: "ai-viv", participantKind: "ai_persona", current: snapshot("ai-viv", 0.4, 0.3, pol.policy), personaPolicyRef: PERSONA_POLICY, opponentPolicyRef: null },
    ],
    completedOutcome: { outcomeRef: S("match-outcome", "out-m1"), completedAt: "2026-10-01T12:30:00Z", outcomeSemanticsRef: V("outcome-semantics-fixture"),
      kind: winner === null ? "tie" : "participant_win", winnerSubjectId: winner,
      netChipsBySubject: [{ subjectId: "u-hero", netChips: winner === "u-hero" ? 200 : winner === null ? 0 : -200 }, { subjectId: "ai-viv", netChips: winner === "u-hero" ? -200 : winner === null ? 0 : 200 }],
      eligibility: "eligible" },
    admittedQualityAssessments: assessments, admittedEvidenceSetRef: S("evidence-set", "es-m1"), policy: pol,
  };
}
// Evidence + assessments for hero decisions at the given ordinals of one raw hand.
function assessHand(raw, specs, evaluatorOpts = {}) {
  const evs = []; const as = [];
  for (const { ordinal, street } of specs) {
    const ev = extractDecision(raw, ordinal, { street });
    const r = R.evaluateDecisionQuality(ev, stubEvaluator(evaluatorOpts), opponentModel());
    if (!r.ok) throw new Error(JSON.stringify(r.problems));
    evs.push(ev); as.push(r.value);
  }
  return { evs, as };
}
const evidenceIndex = (evs) => new Map(evs.map((e) => [e.evidenceId, e]));

// Placement / visibility
const visibility = (extra = []) => ({ policy: V("public-visibility-fixture"), exposeUncertaintyParameters: false,
  publicReasonCodes: ["OUTCOME_ABOVE_EXPECTATION", "OUTCOME_BELOW_EXPECTATION", "DECISION_QUALITY_INCLUDED", "PLACEMENT_MATCHES_INCOMPLETE", "PLACEMENT_REQUIREMENTS_MET", ...extra] });
const placementPolicy = (over = {}) => ({ ...ENV, policy: V("placement-fixture"), status: "candidate", populationRef: POPULATION, formatRef: FORMAT,
  requiredEligibleMatches: 3, requiredEligibleDecisions: null, opponentClassMinimums: null, admissibleSourceKinds: ["ranked_settlement"],
  uncertaintyGate: null, acceptanceRef: null, ...over });
const summary = (over = {}) => ({ ...ENV, subjectId: "u-hero", populationRef: POPULATION, formatRef: FORMAT, receiptId: "ps-1", windowRef: null,
  eligibleMatchCount: 3, eligibleDecisionCount: 40, opponentClassCounts: { human: 1, ai_persona: 2 }, sourceCounts: [{ kind: "ranked_settlement", matches: 3 }],
  suspension: null, ...over });

module.exports = { R, V, S, ENV, codes, card, FORMAT, POPULATION, EXTRACTOR, VISIBILITY, AMOUNTS, PERSONA_POLICY, OPP_MODEL, EVALUATOR,
  VALUE_SEM, QUALITY_SEM, RATING_U, ASSESS_U, versionContext, rawHand, extractDecision, refingerprint, stubEvaluator, opponentModel,
  snapshot, PARAMS, candidateConfig, makeModel, ratingPolicy, pairedInput, assessHand, evidenceIndex, visibility, placementPolicy, summary };
