"use strict";
// Abuse-case fixtures run against the pure reducers (src/rating/v1). Each case names the abuse, the
// expected rejection code or invariant, and a thunk. They exercise machinery only; they do not show any
// candidate is robust in production.
const F = require("../../../test/v1/rating/fixtures.cjs");
const { R, codes } = F;
const J = (x) => JSON.parse(JSON.stringify(x));

function cases() {
  const h1 = F.assessHand(F.rawHand({ handId: "h1" }), [{ ordinal: 3, street: "flop" }, { ordinal: 5, street: "turn" }]);
  const model = F.makeModel("joint_latent_outcome_quality");
  const idx = F.evidenceIndex(h1.evs);
  const prop = (input, i = idx, m = model) => R.proposePairedRatingUpdate(input, m, i);
  return [
    { id: "quality-farming/split-hand", category: "quality_farming",
      description: "Splitting one hand into more scored decisions must not add independent weight.",
      run: () => {
        const one = F.assessHand(F.rawHand({ handId: "h1" }), [{ ordinal: 3, street: "flop" }], { value: 0.4 });
        const two = F.assessHand(F.rawHand({ handId: "h1" }), [{ ordinal: 3, street: "flop" }, { ordinal: 5, street: "turn" }], { value: 0.4 });
        const a = prop(F.pairedInput({ assessments: one.as }), F.evidenceIndex(one.evs)).value.participants[0].delta;
        const b = prop(F.pairedInput({ assessments: two.as }), F.evidenceIndex(two.evs)).value.participants[0].delta;
        return { pass: Math.abs(a - b) < 1e-12, detail: { oneDecision: a, twoDecisions: b } };
      } },
    { id: "quality-farming/unbounded-value", category: "quality_farming",
      description: "An extreme quality value moves the bounded candidate by at most its supplied bound.",
      run: () => {
        const big = F.assessHand(F.rawHand({ handId: "h1" }), [{ ordinal: 3, street: "flop" }], { value: 1e6 });
        const m = F.makeModel("bounded_uncertainty_shrunk_quality");
        const w = R.proposePairedRatingUpdateWithAudit(F.pairedInput({ candidate: "bounded_uncertainty_shrunk_quality", assessments: big.as }), m, F.evidenceIndex(big.evs));
        const term = w.value.privateAudit.participants[0].qualityTerm;
        return { pass: term === F.PARAMS.bounded_uncertainty_shrunk_quality.adjustmentBound, detail: { qualityTerm: term } };
      } },
    { id: "duplicate-evidence/replayed-assessment", category: "duplicate_evidence", expect: "DUPLICATE_ASSESSMENT",
      run: () => ({ codes: codes(prop(F.pairedInput({ assessments: [...h1.as, h1.as[0]] }))) }) },
    { id: "duplicate-evidence/reissued-decision", category: "duplicate_evidence", expect: "DEPENDENCE_DUPLICATE_DECISION",
      run: () => {
        const e = J(h1.evs[0]); e.evidenceId = "ev:reissued"; const ev = F.refingerprint(e);
        const a = R.evaluateDecisionQuality(ev, F.stubEvaluator(), F.opponentModel()).value;
        return { codes: codes(prop(F.pairedInput({ assessments: [...h1.as, a] }), F.evidenceIndex([...h1.evs, ev]))) };
      } },
    { id: "reordered-evidence/same-proposal", category: "reordered_evidence",
      run: () => {
        const a = prop(F.pairedInput({ assessments: h1.as })).value.fingerprint;
        const b = prop(F.pairedInput({ assessments: [...h1.as].reverse() })).value.fingerprint;
        return { pass: a === b, detail: { a, b } };
      } },
    { id: "policy-drift/opponent-policy-version", category: "policy_drift", expect: "POLICY_DRIFT",
      run: () => {
        const i = F.pairedInput({ assessments: h1.as });
        i.participants[0].opponentPolicyRef = F.V("persona-policy-fixture", "4"); i.participants[1].personaPolicyRef = F.V("persona-policy-fixture", "4");
        return { codes: codes(prop(i)) };
      } },
    { id: "policy-drift/evaluator-version", category: "policy_drift", expect: "unknown-version",
      run: () => {
        const cfg = F.candidateConfig("joint_latent_outcome_quality"); cfg.evaluatorRefs = [F.V("evaluator-fixture", "2")];
        return { codes: codes(prop(F.pairedInput({ assessments: h1.as }), idx, R.candidates.createJointLatentOutcomeQuality(cfg).value)) };
      } },
    { id: "policy-drift/model-not-from-policy", category: "policy_drift", expect: "POLICY_MISMATCH",
      run: () => ({ codes: codes(prop(F.pairedInput({ assessments: h1.as }), idx, F.makeModel("joint_latent_outcome_quality", { ...F.PARAMS.joint_latent_outcome_quality, qualityLoading: 9 }))) }) },
    { id: "provisional/no-policy-never-placed", category: "provisional",
      run: () => {
        const r = R.derivePlacementContext(F.snapshot("u-hero", 0, 1, F.V("p")), F.summary({ eligibleMatchCount: 10000, sourceCounts: [{ kind: "ranked_settlement", matches: 10000 }] }), null);
        return { pass: r.ok && r.value.state !== "placed" && r.value.standingEligibility === "unknown", detail: r.ok ? r.value.state : r.problems };
      } },
    { id: "smurf/legacy-history-recast", category: "smurf", expect: "INADMISSIBLE_PLACEMENT_SOURCE",
      run: () => ({ codes: codes(R.derivePlacementContext(F.snapshot("u-hero", 0, 1, F.V("p")),
        F.summary({ sourceCounts: [{ kind: "ranked_settlement", matches: 1 }, { kind: "legacy_synthetic_history", matches: 2 }] }), F.placementPolicy())) }) },
    { id: "opponent-selection/ai-only-farming", category: "opponent_selection",
      description: "A supplied human-opponent minimum keeps an AI-only record provisional.",
      run: () => {
        const r = R.derivePlacementContext(F.snapshot("u-hero", 0, 1, F.V("p")), F.summary({ opponentClassCounts: { human: 0, ai_persona: 3 } }),
          F.placementPolicy({ opponentClassMinimums: { human: 1, ai_persona: null } }));
        return { pass: r.ok && r.value.state === "provisional", detail: r.value && r.value.reasonCodes };
      } },
    { id: "opponent-selection/unpaired-update", category: "opponent_selection", expect: "PAIRED_PARTICIPANT_MISMATCH",
      description: "Rating one side of a match without its bound opponent is refused.",
      run: () => { const i = F.pairedInput(); i.participants.pop(); return { codes: codes(prop(i)) }; } },
  ];
}

function runAbuseCases() {
  return cases().map((c) => {
    const out = c.run();
    const pass = c.expect ? Array.isArray(out.codes) && out.codes.includes(c.expect) : out.pass === true;
    return { id: c.id, category: c.category, expect: c.expect || "invariant", pass, observed: out.codes || out.detail };
  });
}

module.exports = { cases, runAbuseCases };
