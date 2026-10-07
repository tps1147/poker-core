// Rating v1 §6 paired proposals, committed results and public projection.
//   node test/v1/rating/rating.test.cjs
"use strict";
const assert = require("node:assert/strict");
const F = require("./fixtures.cjs");
const { R, codes } = F;

let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (e) { console.error(`FAIL ${name}`); throw e; } };
const J = (x) => JSON.parse(JSON.stringify(x));

const hand1 = F.assessHand(F.rawHand({ handId: "h1" }), [{ ordinal: 3, street: "flop" }, { ordinal: 5, street: "turn" }]);
const hand2 = F.assessHand(F.rawHand({ handId: "h2" }), [{ ordinal: 3, street: "flop" }]);
const allEv = [...hand1.evs, ...hand2.evs];
const allAs = [...hand1.as, ...hand2.as];
const model = F.makeModel("joint_latent_outcome_quality");
const propose = (input, m = model, idx = F.evidenceIndex(allEv)) => R.proposePairedRatingUpdate(input, m, idx);

// What main would build after its atomic settlement (test-only construction).
function commit(proposal, placementContexts, { revisionOverride = null } = {}) {
  return { ...F.ENV, settlementId: "settle-m1", resultId: "rr-m1", matchId: proposal.matchId, state: "committed",
    committedAt: "2026-10-01T12:31:00Z", committedSource: F.S("ranked-settlement", "settle-m1"),
    acceptedProposalId: proposal.proposalId, acceptedProposalFingerprint: proposal.fingerprint,
    modelRef: J(proposal.modelRef), evaluatorRefs: J(proposal.evaluatorRefs), ratingPolicyRef: J(proposal.ratingPolicyRef),
    opponentPolicyRefs: J(proposal.opponentPolicyRefs),
    participants: proposal.participants.map((p, i) => ({ ...J(p), committedRevision: revisionOverride ?? p.after.revision,
      placementContext: placementContexts[i], publicReasons: [{ code: p.publicReasonCodes[0], text: "Result compared with the expected result." }] })),
    privateAuditRef: J(proposal.privateAuditRef) };
}
const placementFor = (subjectId) => R.derivePlacementContext(F.snapshot(subjectId, 0, 1, F.V("x")), F.summary({ subjectId }), F.placementPolicy()).value;

check("rating policy: unselected is valid but blocks proposals; incomplete/accepted-without-receipt reject", () => {
  const un = F.ratingPolicy(null, { status: "unselected" });
  assert.equal(R.validateRatingPolicy(un).ok, true);
  assert.deepEqual(codes(propose(F.pairedInput({ policy: un }))), ["POLICY_UNSELECTED"]);
  const inc = F.ratingPolicy(); inc.uncertaintyPolicyRef = null; inc.parameters = null;
  assert.ok(codes(R.validateRatingPolicy(inc)).filter((c) => c === "POLICY_INCOMPLETE").length >= 2);
  assert.ok(codes(R.validateRatingPolicy(F.ratingPolicy("joint_latent_outcome_quality", { status: "accepted" }))).length === 0);
  const acc = F.ratingPolicy(); acc.status = "accepted";
  assert.ok(codes(R.validateRatingPolicy(acc)).includes("POLICY_INCOMPLETE"));
  const base = F.ratingPolicy(); base.candidate = "outcome_only_baseline";
  assert.ok(codes(R.validateRatingPolicy(base)).includes("unknown-candidate"));
});

check("missing numerical parameter: candidate factory refuses, no default exists", () => {
  for (const c of R.candidates.CANDIDATES) {
    const cfg = F.candidateConfig(c); delete cfg.parameters.logisticScale;
    const r = { outcome_only_baseline: R.candidates.createOutcomeOnlyBaseline, joint_latent_outcome_quality: R.candidates.createJointLatentOutcomeQuality,
      bounded_uncertainty_shrunk_quality: R.candidates.createBoundedUncertaintyShrunkQuality }[c](cfg);
    assert.ok(codes(r).includes("POLICY_INCOMPLETE"), c);
  }
  assert.ok(codes(R.candidates.createJointLatentOutcomeQuality(null)).includes("POLICY_UNSELECTED"));
  const nx = F.candidateConfig("joint_latent_outcome_quality"); nx.experimental = false;
  assert.ok(codes(R.candidates.createJointLatentOutcomeQuality(nx)).includes("not-experimental"));
});

check("model must be built from the policy's own parameters; baseline is never a V1 update", () => {
  const other = F.makeModel("joint_latent_outcome_quality", { ...F.PARAMS.joint_latent_outcome_quality, qualityLoading: 0.6 });
  assert.ok(codes(propose(F.pairedInput({ assessments: allAs }), other)).includes("POLICY_MISMATCH"));
  assert.ok(codes(propose(F.pairedInput({ assessments: allAs }), F.makeModel("outcome_only_baseline"))).includes("BASELINE_NOT_A_V1_UPDATE"));
  assert.ok(codes(propose(F.pairedInput({ assessments: allAs }), null)).includes("POLICY_UNSELECTED"));
});

check("valid paired proposal: both participants, state proposed, revisions +1, deterministic", () => {
  const r = propose(F.pairedInput({ assessments: allAs }));
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  const p = r.value;
  assert.equal(p.state, "proposed");
  assert.equal(p.participants.length, 2);
  assert.deepEqual(p.participants.map((x) => x.subjectId), ["u-hero", "ai-viv"]);
  assert.ok(p.participants.every((x) => x.after.revision === x.before.revision + 1));
  assert.equal(p.participants[0].assessmentStatus, "supported");
  assert.equal(p.participants[1].assessmentStatus, "unassessable", "no AI decisions supplied: unassessable, not zero");
  assert.equal(R.validatePairedRatingProposal(p).ok, true);
  assert.equal(propose(F.pairedInput({ assessments: allAs })).value.fingerprint, p.fingerprint);
  assert.ok(!("committedAt" in p) && !("committedRevision" in p.participants[0]));
});

check("duplicate/reordered evidence: reorder gives the same proposal; duplicates reject", () => {
  const a = propose(F.pairedInput({ assessments: allAs })).value;
  const b = propose(F.pairedInput({ assessments: [...allAs].reverse() })).value;
  assert.equal(a.fingerprint, b.fingerprint);
  assert.ok(codes(propose(F.pairedInput({ assessments: [...allAs, allAs[0]] }))).includes("DUPLICATE_ASSESSMENT"));
  const twin = { ...J(allAs[0]), assessmentId: "qa:twin" };
  assert.ok(codes(propose(F.pairedInput({ assessments: [...allAs, twin] }))).includes("DUPLICATE_EVIDENCE"));
});

check("same-hand dependence: a re-identified decision rejects; extra decisions in one hand add no independent groups", () => {
  // Same (subject, hand, ordinal) under a NEW evidence id: still the same decision.
  const ev = J(hand1.evs[0]); ev.evidenceId = "ev:reissued"; const ev2 = F.refingerprint(ev);
  const a = R.evaluateDecisionQuality(ev2, F.stubEvaluator(), F.opponentModel()).value;
  const idx = F.evidenceIndex([...allEv, ev2]);
  assert.ok(codes(R.proposePairedRatingUpdate(F.pairedInput({ assessments: [...allAs, a] }), model, idx)).includes("DEPENDENCE_DUPLICATE_DECISION"));
  // One hand with two decisions = one group; the audit sees 2 groups for hero over two hands, not 3.
  const w = R.proposePairedRatingUpdateWithAudit(F.pairedInput({ assessments: allAs }), model, F.evidenceIndex(allEv));
  assert.equal(w.value.privateAudit.participants[0].qualityGroups.length, 2);
  assert.equal(w.value.privateAudit.participants[0].qualityGroups.find((g) => g.groupId === "hand:m1:h1").decisions, 2);
});

check("quality farming: splitting one hand's value across more decisions does not add weight", () => {
  // Hand h1 with both decisions vs hand h1 with only its first decision, same group mean.
  const one = F.assessHand(F.rawHand({ handId: "h1" }), [{ ordinal: 3, street: "flop" }], { value: 0.5 });
  const two = F.assessHand(F.rawHand({ handId: "h1" }), [{ ordinal: 3, street: "flop" }, { ordinal: 5, street: "turn" }], { value: 0.5 });
  const d1 = R.proposePairedRatingUpdate(F.pairedInput({ assessments: one.as }), model, F.evidenceIndex(one.evs)).value.participants[0].delta;
  const d2 = R.proposePairedRatingUpdate(F.pairedInput({ assessments: two.as }), model, F.evidenceIndex(two.evs)).value.participants[0].delta;
  assert.ok(Math.abs(d1 - d2) < 1e-12, `${d1} vs ${d2}`);
});

check("causal quality contribution with outcome and opponent held fixed", () => {
  const lo = F.assessHand(F.rawHand({ handId: "h1" }), [{ ordinal: 3, street: "flop" }], { value: -0.5 });
  const hi = F.assessHand(F.rawHand({ handId: "h1" }), [{ ordinal: 3, street: "flop" }], { value: 0.5 });
  for (const c of ["joint_latent_outcome_quality", "bounded_uncertainty_shrunk_quality"]) {
    const m = F.makeModel(c);
    const dl = R.proposePairedRatingUpdate(F.pairedInput({ candidate: c, assessments: lo.as }), m, F.evidenceIndex(lo.evs)).value.participants;
    const dh = R.proposePairedRatingUpdate(F.pairedInput({ candidate: c, assessments: hi.as }), m, F.evidenceIndex(hi.evs)).value.participants;
    assert.ok(dh[0].delta > dl[0].delta, `${c}: better quality, higher delta`);
    assert.equal(dh[1].delta, dl[1].delta, `${c}: opponent unaffected by hero's quality`);
  }
  // The baseline cannot see quality at all (research compute only; it never runs as a V1 policy).
  const b = F.makeModel("outcome_only_baseline");
  const bound = (v) => ({ outcome: { kind: "participant_win", winnerSubjectId: "u-hero" }, participants: [
    { subjectId: "u-hero", participantKind: "human", estimate: 0.2, uncertainty: F.snapshot("u-hero", 0.2, 0.5, F.V("p")).uncertainty },
    { subjectId: "ai-viv", participantKind: "ai_persona", estimate: 0.4, uncertainty: F.snapshot("ai-viv", 0.4, 0.3, F.V("p")).uncertainty }],
  quality: { "u-hero": { groups: [{ groupId: "g", values: [v], uncertainties: [{ status: "estimated", methodRef: F.ASSESS_U, parameters: { variance: 0.25 }, coverageRef: null }] }] } } });
  assert.equal(b.compute(bound(-1)).value.participants[0].estimate, b.compute(bound(1)).value.participants[0].estimate);
});

check("bounded candidate clamps the quality adjustment to the supplied bound", () => {
  const huge = F.assessHand(F.rawHand({ handId: "h1" }), [{ ordinal: 3, street: "flop" }], { value: 1000 });
  const m = F.makeModel("bounded_uncertainty_shrunk_quality");
  const w = R.proposePairedRatingUpdateWithAudit(F.pairedInput({ candidate: "bounded_uncertainty_shrunk_quality", assessments: huge.as }), m, F.evidenceIndex(huge.evs));
  assert.equal(w.value.privateAudit.participants[0].qualityTerm, F.PARAMS.bounded_uncertainty_shrunk_quality.adjustmentBound);
});

check("paired participant mismatch rejects", () => {
  const cases = [
    (i) => { i.participants[1].subjectId = "u-hero"; i.participants[1].current.subjectId = "u-hero"; },
    (i) => { i.participants.pop(); },
    (i) => { i.completedOutcome.winnerSubjectId = "someone-else"; },
    (i) => { i.participants[0].opponentPolicyRef = F.V("persona-policy-fixture", "2"); },
    (i) => { i.participants[1].personaPolicyRef = null; },
    (i) => { i.completedOutcome.netChipsBySubject[1].subjectId = "u-hero"; },
    (i) => { i.participants[0].current.subjectId = "ai-viv"; },
  ];
  for (const f of cases) { const i = F.pairedInput({ assessments: allAs }); f(i); assert.ok(codes(propose(i)).includes("PAIRED_PARTICIPANT_MISMATCH"), f.toString()); }
  // Evidence of a third party cannot be attached to this pair.
  const x = J(hand2.evs[0]); x.opponentId = "ai-other"; x.informationSet.publicStacks[1].participantId = "ai-other";
  x.informationSet.publicCommitments[1].participantId = "ai-other";
  x.informationSet.publicActionPrefix.forEach((a) => { if (a.participantId === "ai-viv") a.participantId = "ai-other"; });
  const xe = F.refingerprint(x);
  const xa = R.evaluateDecisionQuality(xe, F.stubEvaluator(), F.opponentModel()).value;
  assert.ok(codes(R.proposePairedRatingUpdate(F.pairedInput({ assessments: [xa] }), model, F.evidenceIndex([xe]))).includes("PAIRED_PARTICIPANT_MISMATCH"));
});

check("outcome eligibility: no-contest, unknown and ineligible never become rated results; tie names no winner", () => {
  const nc = F.pairedInput(); nc.completedOutcome.kind = "no_contest"; nc.completedOutcome.winnerSubjectId = null;
  assert.deepEqual(codes(propose(nc)), ["NO_CONTEST_NOT_RATED"]);
  const un = F.pairedInput(); un.completedOutcome.eligibility = "unknown";
  assert.deepEqual(codes(propose(un)), ["OUTCOME_ELIGIBILITY_UNKNOWN"]);
  const inel = F.pairedInput(); inel.completedOutcome.eligibility = "ineligible";
  assert.deepEqual(codes(propose(inel)), ["OUTCOME_INELIGIBLE"]);
  const tie = F.pairedInput({ winner: null }); tie.completedOutcome.winnerSubjectId = "u-hero";
  assert.ok(codes(propose(tie)).includes("invalid-winner"));
  assert.equal(propose(F.pairedInput({ winner: null })).ok, true);
});

check("provenance and policy drift: missing evidence index, unknown evaluator, changed opponent policy reject", () => {
  assert.ok(codes(R.proposePairedRatingUpdate(F.pairedInput({ assessments: allAs }), model, null)).includes("ASSESSMENT_OWNERSHIP_UNRESOLVED"));
  assert.ok(codes(R.proposePairedRatingUpdate(F.pairedInput({ assessments: allAs }), model, new Map())).includes("MISSING_PROVENANCE"));
  const drifted = F.pairedInput({ assessments: allAs });
  drifted.participants[0].opponentPolicyRef = F.V("persona-policy-fixture", "4");
  drifted.participants[1].personaPolicyRef = F.V("persona-policy-fixture", "4");
  assert.ok(codes(propose(drifted)).includes("POLICY_DRIFT"));
  const m2cfg = F.candidateConfig("joint_latent_outcome_quality"); m2cfg.evaluatorRefs = [F.V("evaluator-fixture", "2")];
  const m2 = R.candidates.createJointLatentOutcomeQuality(m2cfg).value;
  assert.ok(codes(propose(F.pairedInput({ assessments: allAs }), m2)).includes("unknown-version"));
  const wrongPolicy = F.pairedInput(); wrongPolicy.participants[0].current.policyRef = F.V("legacy-elo");
  assert.ok(codes(propose(wrongPolicy)).includes("RATING_POLICY_MISMATCH"));
});

check("proposal mistaken for commit rejects everywhere", () => {
  const p = propose(F.pairedInput({ assessments: allAs })).value;
  assert.ok(codes(R.validateCommittedRatingResult(p)).includes("PROPOSAL_NOT_COMMIT"));
  assert.ok(codes(R.projectCommittedRatingResult(p, F.visibility())).includes("PROPOSAL_NOT_COMMIT"));
  const stamped = { ...J(p), state: "committed" };
  assert.ok(codes(R.validatePairedRatingProposal(stamped)).includes("PROPOSAL_NOT_COMMIT"));
  const withCommitFields = { ...J(p), committedAt: "2026-10-01T12:31:00Z" };
  assert.ok(codes(R.validatePairedRatingProposal(withCommitFields)).includes("PROPOSAL_NOT_COMMIT"));
});

check("committed result: valid against its proposal; stale expected revision and proposal mismatch reject", () => {
  const p = propose(F.pairedInput({ assessments: allAs })).value;
  const pcs = [placementFor("u-hero"), placementFor("ai-viv")];
  const c = commit(p, pcs);
  assert.equal(R.validateCommittedRatingResult(c, { acceptedProposal: p, expectedPriorRevisions: { "u-hero": 4, "ai-viv": 4 } }).ok, true);
  assert.ok(codes(R.validateCommittedRatingResult(c, { acceptedProposal: p, expectedPriorRevisions: { "u-hero": 5, "ai-viv": 4 } })).includes("STALE_EXPECTED_REVISION"));
  assert.ok(codes(R.validateCommittedRatingResult(commit(p, pcs, { revisionOverride: 9 }))).includes("revision-sequence"));
  const tampered = commit(p, pcs); tampered.participants[0].delta += 1; tampered.participants[0].after.estimate += 1;
  assert.ok(codes(R.validateCommittedRatingResult(tampered, { acceptedProposal: p })).includes("COMMIT_PROPOSAL_MISMATCH"));
  const newerModel = commit(p, pcs); newerModel.modelRef = F.V("exp-joint_latent_outcome_quality", "2");
  assert.ok(codes(R.validateCommittedRatingResult(newerModel, { acceptedProposal: p })).includes("COMMIT_PROPOSAL_MISMATCH"));
});

check("public projection: allowlist, both participants, readable AI identity retained", () => {
  const p = propose(F.pairedInput({ assessments: allAs })).value;
  const c = commit(p, [placementFor("u-hero"), placementFor("ai-viv")]);
  assert.ok(codes(R.projectCommittedRatingResult(c, null)).includes("POLICY_UNSELECTED"));
  const r = R.projectCommittedRatingResult(c, F.visibility());
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  const pub = r.value;
  const ai = pub.participants.find((x) => x.subjectId === "ai-viv");
  const hu = pub.participants.find((x) => x.subjectId === "u-hero");
  assert.deepEqual(ai.aiBadge, { text: "AI", accessibleLabel: "AI player" });
  assert.equal(ai.isAi, true); assert.equal(ai.participantKind, "ai_persona");
  assert.equal(hu.aiBadge, null); assert.equal(hu.isAi, false);
  const text = JSON.stringify(pub);
  for (const banned of ["privateAuditRef", "privateReasonCodes", "actionValues", "CANDIDATE:", "QUALITY_GROUPS", "variance", "settlementId", "acceptedProposalFingerprint"]) {
    assert.ok(!text.includes(banned), `public result leaks ${banned}`);
  }
  const badReason = J(c); badReason.participants[0].publicReasons = [{ code: "EVALUATOR_PARAM_X", text: "x" }];
  assert.ok(codes(R.projectCommittedRatingResult(badReason, F.visibility())).includes("PUBLIC_REASON_NOT_ALLOWLISTED"));
});

check("untrusted client fact and unknown versions at the paired input", () => {
  const i = F.pairedInput({ assessments: allAs }); i.authority = "server"; i.clientOutcome = "win";
  assert.ok(codes(propose(i)).includes("unknown-field"));
  const v = F.pairedInput({ assessments: allAs }); v.schemaVersion = 2;
  assert.ok(codes(propose(v)).includes("unknown-schema-version"));
  const fmt = F.pairedInput({ assessments: allAs }); fmt.formatRef = F.V("hu-nlhe-fixture", "2");
  assert.ok(codes(propose(fmt)).includes("POLICY_MISMATCH"));
});

console.log(`rating proposals: ${checks} checks passed`);
