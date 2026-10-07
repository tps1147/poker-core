// Rating v1 §5 decision evidence and quality: closed type, unknown versions, concealed/future data,
// changed payload, calibration and the "raw fixture cannot leak" property.
//   node test/v1/rating/evidence.test.cjs
"use strict";
const assert = require("node:assert/strict");
const F = require("./fixtures.cjs");
const { R, codes } = F;

let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (e) { console.error(`FAIL ${name}`); throw e; } };
const ctx = F.versionContext();

check("valid extracted evidence passes and is frozen", () => {
  const ev = F.extractDecision(F.rawHand(), 3);
  const r = R.validateDecisionEvidence(ev, ctx);
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.ok(Object.isFrozen(r.value) && Object.isFrozen(r.value.informationSet));
});

check("missing version context fails closed", () => {
  assert.deepEqual(codes(R.validateDecisionEvidence(F.extractDecision(F.rawHand(), 3), null)), ["POLICY_UNSELECTED"]);
});

check("unknown contract/schema/extractor/format/visibility/amount-semantics versions reject", () => {
  const base = F.extractDecision(F.rawHand(), 3);
  const mut = (f) => { const e = JSON.parse(JSON.stringify(base)); f(e); return F.refingerprint(e); };
  assert.ok(codes(R.validateDecisionEvidence(mut((e) => { e.contractId = "F52-V1-CONTRACT-2"; }), ctx)).includes("unknown-contract"));
  assert.ok(codes(R.validateDecisionEvidence(mut((e) => { e.schemaVersion = 2; }), ctx)).includes("unknown-schema-version"));
  for (const k of ["extractorRef", "formatRef", "visibilityPolicyRef"]) {
    assert.ok(codes(R.validateDecisionEvidence(mut((e) => { e[k] = F.V(e[k].id, "999"); }), ctx)).includes("unknown-version"), k);
  }
  assert.ok(codes(R.validateDecisionEvidence(mut((e) => { e.informationSet.legalActions[0].amountSemanticsRef = F.V("other"); }), ctx)).includes("unknown-version"));
  assert.ok(codes(R.validateDecisionEvidence(mut((e) => { e.opponentPolicyRef = F.V("persona-policy-fixture", "4"); }), ctx)).includes("unknown-version"));
});

check("concealed, future and later fields are not part of the closed decision type", () => {
  const base = F.extractDecision(F.rawHand(), 3);
  const injections = [
    (e) => { e.opponentHoleCards = [F.card("7c"), F.card("7d")]; },
    (e) => { e.informationSet.futureBoard = [F.card("9d")]; },
    (e) => { e.finalWinner = "ai-viv"; },
    (e) => { e.laterObservations = [{ ordinal: 6 }]; },
    (e) => { e.opponentModel.concealedCards = [F.card("7c")]; },
    (e) => { e.informationSet.showdown = { cards: ["7c", "7d"] }; },
    (e) => { e.informationSet.clientLegalActions = []; },
  ];
  for (const inj of injections) {
    const e = JSON.parse(JSON.stringify(base)); inj(e);
    const r = R.validateDecisionEvidence(F.refingerprint(e), ctx);
    assert.equal(r.ok, false);
    assert.ok(codes(r).some((c) => c === "unknown-field" || c === "private-field"), JSON.stringify(codes(r)));
  }
});

check("future board cards, future actions and illegal choices reject", () => {
  const base = F.extractDecision(F.rawHand(), 3);
  const mut = (f) => { const e = JSON.parse(JSON.stringify(base)); f(e); return F.refingerprint(e); };
  assert.ok(codes(R.validateDecisionEvidence(mut((e) => { e.informationSet.visibleBoardCards.push(F.card("9d")); }), ctx)).includes("invalid-card-count"));
  assert.ok(codes(R.validateDecisionEvidence(mut((e) => { e.informationSet.publicActionPrefix.push({ ordinal: 4, participantId: "ai-viv", street: "turn", action: "check", amount: null }); }), ctx))
    .some((c) => c === "future-action-in-prefix" || c === "future-street-in-prefix"));
  assert.ok(codes(R.validateDecisionEvidence(mut((e) => { e.chosenAction = { action: "jam", amount: 999 }; }), ctx)).includes("illegal-chosen-action"));
  assert.ok(codes(R.validateDecisionEvidence(mut((e) => { e.informationSet.ownCards[1] = F.card("Qs"); }), ctx)).includes("duplicate-card"));
});

check("changed payload under a reused evidence id is detected by the fingerprint", () => {
  const e = JSON.parse(JSON.stringify(F.extractDecision(F.rawHand(), 3)));
  e.chosenAction.action = "fold"; e.chosenAction.amount = null; // same evidenceId, same stale fingerprint
  assert.ok(codes(R.validateDecisionEvidence(e, ctx)).includes("FINGERPRINT_MISMATCH"));
});

check("RAW-FIXTURE PROPERTY: concealed/future info in the raw record cannot change extracted evidence or quality", () => {
  const a = F.rawHand();
  const variants = [
    F.rawHand({ villainCards: ["As", "Ad"] }),
    F.rawHand({ board: ["Qs", "Jh", "2c", "Kh", "Kc"] }), // same flop, different future turn/river
    F.rawHand({ winner: "hero" }),
    (() => { const x = F.rawHand(); x.actions.push({ ordinal: 7, by: "u-hero", street: "river", action: "bet", amount: 50 }); x.showdown = { villainShowed: ["2h", "3h"] }; return x; })(),
  ];
  const evA = F.extractDecision(a, 3);
  const qa = R.evaluateDecisionQuality(evA, F.stubEvaluator(), F.opponentModel());
  assert.equal(qa.ok, true, JSON.stringify(qa.problems));
  for (const b of variants) {
    const evB = F.extractDecision(b, 3);
    assert.equal(evB.fingerprint, evA.fingerprint, "extracted evidence identical");
    const qb = R.evaluateDecisionQuality(evB, F.stubEvaluator(), F.opponentModel());
    assert.equal(R.hashOf(qb.value), R.hashOf(qa.value), "quality identical");
  }
  // And the evaluator only ever sees the allowlisted closed copy.
  let seenKeys = null;
  const spy = F.stubEvaluator(); const inner = spy.evaluate;
  spy.evaluate = (ev, view) => { seenKeys = Object.keys(ev).sort(); assert.ok(Object.isFrozen(ev)); return inner(ev, view); };
  R.evaluateDecisionQuality(evA, spy, F.opponentModel());
  assert.deepEqual(seenKeys, [...require("../../../src/rating/v1/evidence.cjs").EVIDENCE_KEYS].sort());
});

check("assessment shape: dependence group from match+hand, calibration required for supported", () => {
  const ev = F.extractDecision(F.rawHand(), 3);
  const r = R.evaluateDecisionQuality(ev, F.stubEvaluator(), F.opponentModel());
  assert.equal(r.value.dependenceGroupId, "hand:m1:h1");
  assert.equal(r.value.status, "supported");
  const unc = R.evaluateDecisionQuality(ev, F.stubEvaluator({ calibrated: false }), F.opponentModel());
  assert.ok(codes(unc).includes("supported-without-calibration"));
  const ok2 = R.evaluateDecisionQuality(ev, F.stubEvaluator({ calibrated: false, status: "uncertain" }), F.opponentModel());
  assert.equal(ok2.ok, true);
});

check("opponent model: missing, mismatched, drifted or carrying concealed holdings rejects", () => {
  const ev = F.extractDecision(F.rawHand(), 3);
  assert.ok(codes(R.evaluateDecisionQuality(ev, F.stubEvaluator(), null)).includes("opponent-model-missing"));
  assert.ok(codes(R.evaluateDecisionQuality(ev, F.stubEvaluator(), { ...F.opponentModel(), modelRef: F.V("other-model") })).includes("opponent-model-mismatch"));
  assert.ok(codes(R.evaluateDecisionQuality(ev, F.stubEvaluator(), { ...F.opponentModel(), opponentPolicyRef: F.V("persona-policy-fixture", "2") })).includes("policy-drift"));
  assert.ok(codes(R.evaluateDecisionQuality(ev, F.stubEvaluator(), { ...F.opponentModel(), view: { holeCards: ["7c", "7d"] } })).includes("private-field"));
});

check("no admitted opponent model or partial evidence cannot be supported; unassessable stays null", () => {
  const e = JSON.parse(JSON.stringify(F.extractDecision(F.rawHand(), 3)));
  e.opponentModel.modelRef = null;
  const noModel = F.refingerprint(e);
  assert.ok(codes(R.evaluateDecisionQuality(noModel, F.stubEvaluator(), null)).includes("EVALUATOR_OVERCLAIM"));
  assert.equal(R.evaluateDecisionQuality(noModel, F.stubEvaluator({ status: "uncertain" }), null).ok, true);
  const u = JSON.parse(JSON.stringify(F.extractDecision(F.rawHand(), 3)));
  u.completeness = { status: "unassessable", missingFields: ["publicStacks"], reasonCodes: ["LEGACY_RECORD"] };
  let called = false;
  const spy = F.stubEvaluator(); spy.evaluate = () => { called = true; return {}; };
  const r = R.evaluateDecisionQuality(F.refingerprint(u), spy, F.opponentModel());
  assert.equal(r.ok, true);
  assert.equal(called, false);
  assert.equal(r.value.status, "unassessable");
  assert.equal(r.value.chosenActionAssessment.value, null, "unassessable is not a zero/perfect score");
});

check("validateQualityAssessment rejects value-on-unassessable, supported-without-estimate, mismatched evidence", () => {
  const ev = F.extractDecision(F.rawHand(), 3);
  const a = R.evaluateDecisionQuality(ev, F.stubEvaluator(), F.opponentModel()).value;
  const m = (f) => { const x = JSON.parse(JSON.stringify(a)); f(x); return x; };
  assert.ok(codes(R.validateQualityAssessment(m((x) => { x.status = "unassessable"; }))).includes("unassessable-with-value"));
  assert.ok(codes(R.validateQualityAssessment(m((x) => { x.chosenActionAssessment.value = null; }))).includes("supported-without-estimate"));
  assert.ok(codes(R.validateQualityAssessment(m((x) => { x.dependenceGroupId = "hand:m1:h2"; }), ev)).includes("dependence-group-mismatch"));
  assert.ok(codes(R.validateQualityAssessment(m((x) => { x.evidenceFingerprint = "0".repeat(64); }), ev)).includes("evidence-mismatch"));
  assert.ok(codes(R.validateQualityAssessment(m((x) => { x.opponentHoleCards = []; }))).includes("private-field"));
});

check("untrusted client fact: a trust claim or client field cannot enter the closed type", () => {
  const e = JSON.parse(JSON.stringify(F.extractDecision(F.rawHand(), 3)));
  e.authority = "server"; e.clientVerified = true;
  const r = R.validateDecisionEvidence(F.refingerprint(e), ctx);
  assert.equal(r.ok, false);
  assert.ok(codes(r).filter((c) => c === "unknown-field").length === 2);
  // A client-claimed "supported" assessment with no evaluator execution still has to pass every invariant.
  const forged = { ...F.ENV, assessmentId: "qa:client", evidenceId: e.evidenceId, evidenceFingerprint: "f".repeat(64), evaluatorRef: F.EVALUATOR,
    opponentPolicyRef: F.PERSONA_POLICY, calibrationRef: null, status: "supported", actionValues: [],
    chosenActionAssessment: { value: 1, uncertainty: { status: "unknown", methodRef: null, parameters: null, coverageRef: null }, qualitySemanticsRef: F.QUALITY_SEM },
    dependenceGroupId: "hand:m1:h1", privateReasonCodes: [], executionRef: F.S("client", "x"), authority: "server" };
  const fr = R.validateQualityAssessment(forged, F.extractDecision(F.rawHand(), 3));
  assert.ok(["unknown-field", "supported-without-estimate", "supported-without-calibration", "evidence-mismatch"].every((c) => codes(fr).includes(c)));
});

console.log(`rating evidence: ${checks} checks passed`);
