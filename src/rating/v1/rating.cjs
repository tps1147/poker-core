"use strict";
// §6 candidate policy, paired proposals and committed rating results (F52-V1-CONTRACT-1).
// Pure reducers: they bind both participants of one completed match, refuse unresolved policy, never
// stamp "committed", never count a dependence group twice and never fall back to fixed-K Elo,
// zero-quality or a default cap. Only main constructs CommittedRatingResult after its atomic settlement.

const C = require("./common.cjs");
const { problem, ok, fail, isObj, isStr, isNum, isCount } = C;
const { validateQualityAssessment, dependenceGroupFor } = require("./evidence.cjs");
const { validatePlacementContext, projectPlacementContext, checkVisibility, projectUncertainty } = require("./placement.cjs");

const POLICY_CANDIDATES = ["joint_latent_outcome_quality", "bounded_uncertainty_shrunk_quality"];
const KINDS = ["human", "ai_persona"];
const AI_BADGE = Object.freeze({ text: "AI", accessibleLabel: "AI player" }); // §6: fixed by the contract

const POLICY_KEYS = ["contractId", "schemaVersion", "policy", "status", "candidate", "formatRef", "populationRef",
  "parameterSchemaRef", "parameters", "placementPolicyRef", "opponentAdmissionPolicyRef", "qualityAdmissionPolicyRef",
  "uncertaintyPolicyRef", "dependencePolicyRef", "publicReasonPolicyRef", "validationRefs", "acceptanceRef"];
const REQUIRED_POLICY_REFS = ["placementPolicyRef", "opponentAdmissionPolicyRef", "qualityAdmissionPolicyRef",
  "uncertaintyPolicyRef", "dependencePolicyRef", "publicReasonPolicyRef"];
const INPUT_KEYS = ["contractId", "schemaVersion", "matchId", "resultSource", "formatRef", "populationRef", "participants",
  "completedOutcome", "admittedQualityAssessments", "admittedEvidenceSetRef", "policy"];
const PROPOSAL_KEYS = ["contractId", "schemaVersion", "proposalId", "fingerprint", "matchId", "state", "inputRef", "modelRef",
  "evaluatorRefs", "ratingPolicyRef", "opponentPolicyRefs", "participants", "privateAuditRef"];
const PART_PROPOSAL_KEYS = ["subjectId", "participantKind", "before", "after", "delta", "assessmentStatus", "publicReasonCodes", "privateReasonCodes"];
const RESULT_KEYS = ["contractId", "schemaVersion", "settlementId", "resultId", "matchId", "state", "committedAt", "committedSource",
  "acceptedProposalId", "acceptedProposalFingerprint", "modelRef", "evaluatorRefs", "ratingPolicyRef", "opponentPolicyRefs",
  "participants", "privateAuditRef"];
const COMMITTED_ONLY = ["settlementId", "resultId", "committedAt", "committedSource", "acceptedProposalId", "acceptedProposalFingerprint", "committedRevision"];

// ---------------------------------------------------------------- policy
function validateRatingPolicy(policy) {
  const problems = [];
  if (!C.checkEnvelope(policy, problems)) return fail(problems);
  C.closedKeys(policy, POLICY_KEYS, problems);
  C.requireKeys(policy, POLICY_KEYS, problems);
  C.checkVersionRef(policy.policy, problems, "policy");
  C.checkVersionRef(policy.formatRef, problems, "formatRef");
  C.checkVersionRef(policy.populationRef, problems, "populationRef");
  C.checkVersionRef(policy.parameterSchemaRef, problems, "parameterSchemaRef", { nullable: true });
  for (const k of REQUIRED_POLICY_REFS) C.checkVersionRef(policy[k], problems, k, { nullable: true });
  if (!Array.isArray(policy.validationRefs)) problems.push(problem("invalid-source-refs", "validationRefs"));
  else policy.validationRefs.forEach((r, i) => C.checkSourceRef(r, problems, `validationRefs[${i}]`));
  C.checkSourceRef(policy.acceptanceRef, problems, "acceptanceRef", { nullable: true });
  if (!["unselected", "candidate", "accepted"].includes(policy.status)) problems.push(problem("invalid-status", "status"));
  if (!(policy.parameters === null || isObj(policy.parameters))) problems.push(problem("invalid-parameters", "parameters"));
  else if (isObj(policy.parameters)) C.scanNumbers(policy.parameters, problems, "parameters");
  if (problems.length) return fail(problems);
  if (policy.status === "unselected") {
    if (policy.candidate !== null || policy.parameters !== null) problems.push(problem("unselected-policy-with-parameters", "candidate"));
  } else {
    if (!POLICY_CANDIDATES.includes(policy.candidate)) problems.push(problem("unknown-candidate", "candidate", "outcome-only is a baseline, never a V1 policy candidate"));
    if (policy.parameterSchemaRef === null || policy.parameters === null) problems.push(problem("POLICY_INCOMPLETE", "parameters"));
    for (const k of REQUIRED_POLICY_REFS) if (policy[k] === null) problems.push(problem("POLICY_INCOMPLETE", k));
    if (policy.status === "accepted" && policy.acceptanceRef === null) problems.push(problem("POLICY_INCOMPLETE", "acceptanceRef", "accepted configuration requires an acceptance receipt"));
  }
  if (problems.length) return fail(problems);
  return ok(C.deepFreeze(C.clone(policy)));
}

function checkSnapshot(s, problems, path) {
  if (!isObj(s)) { problems.push(problem("invalid-rating-snapshot", path)); return; }
  C.closedKeys(s, ["subjectId", "revision", "estimate", "uncertainty", "modelRef", "policyRef"], problems, `${path}.`);
  if (!isStr(s.subjectId)) problems.push(problem("invalid-id", `${path}.subjectId`));
  if (!isCount(s.revision)) problems.push(problem("invalid-revision", `${path}.revision`));
  if (!(s.estimate === null || isNum(s.estimate))) problems.push(problem("invalid-estimate", `${path}.estimate`));
  C.checkUncertainty(s.uncertainty, problems, `${path}.uncertainty`);
  C.checkVersionRef(s.modelRef, problems, `${path}.modelRef`);
  C.checkVersionRef(s.policyRef, problems, `${path}.policyRef`);
}

// ---------------------------------------------------------------- proposal
// proposePairedRatingUpdate(input, suppliedModel, suppliedEvidenceIndex?) -> Result<PairedRatingProposal>
// suppliedEvidenceIndex (PROPOSALS-M4 R1, interim): Map/object evidenceId -> admitted PrivateDecisionEvidence,
// needed because PrivateQualityAssessment carries no subject/match binding of its own.
function proposePairedRatingUpdate(input, suppliedModel, suppliedEvidenceIndex = null) {
  const r = proposePairedRatingUpdateWithAudit(input, suppliedModel, suppliedEvidenceIndex);
  return r.ok ? ok(r.value.proposal, r.disposition) : r;
}

function proposePairedRatingUpdateWithAudit(input, model, evidenceIndex = null) {
  const problems = [];
  if (!C.checkEnvelope(input, problems)) return fail(problems);
  C.closedKeys(input, INPUT_KEYS, problems);
  C.requireKeys(input, INPUT_KEYS, problems);
  if (problems.length) return fail(problems);
  // Policy first: an unselected/incomplete policy blocks everything (§6).
  if (!isObj(input.policy)) return fail([problem("POLICY_UNSELECTED", "policy")]);
  if (input.policy.status === "unselected") return fail([problem("POLICY_UNSELECTED", "policy.status", "no rating policy is selected")]);
  const pv = validateRatingPolicy(input.policy);
  if (!pv.ok) return pv;
  const policy = pv.value;
  if (!isObj(model) || typeof model.compute !== "function") return fail([problem("POLICY_UNSELECTED", "suppliedModel", "no model supplied")]);
  if (model.candidate !== policy.candidate) {
    return fail([problem(model.candidate === "outcome_only_baseline" ? "BASELINE_NOT_A_V1_UPDATE" : "POLICY_MISMATCH", "suppliedModel.candidate")]);
  }
  if (model.configHash !== C.hashOf(policy.parameters)) problems.push(problem("POLICY_MISMATCH", "suppliedModel.configHash", "model was not built from this policy's parameters"));
  if (!C.sameRef(model.parameterSchemaRef, policy.parameterSchemaRef)) problems.push(problem("POLICY_MISMATCH", "suppliedModel.parameterSchemaRef"));

  if (!isStr(input.matchId)) problems.push(problem("invalid-id", "matchId"));
  C.checkSourceRef(input.resultSource, problems, "resultSource");
  C.checkSourceRef(input.admittedEvidenceSetRef, problems, "admittedEvidenceSetRef");
  C.checkVersionRef(input.formatRef, problems, "formatRef");
  C.checkVersionRef(input.populationRef, problems, "populationRef");
  if (!C.sameRef(input.formatRef, policy.formatRef) || !C.sameRef(input.populationRef, policy.populationRef)) problems.push(problem("POLICY_MISMATCH", "formatRef", "policy scope differs from the match"));

  // Both participants, bound together.
  const parts = input.participants;
  if (!Array.isArray(parts) || parts.length !== 2) return fail([...problems, problem("PAIRED_PARTICIPANT_MISMATCH", "participants", "exactly two participants")]);
  parts.forEach((p, i) => {
    const path = `participants[${i}]`;
    if (!isObj(p)) { problems.push(problem("invalid-participant", path)); return; }
    C.closedKeys(p, ["subjectId", "participantKind", "current", "personaPolicyRef", "opponentPolicyRef"], problems, `${path}.`);
    if (!isStr(p.subjectId)) problems.push(problem("invalid-id", `${path}.subjectId`));
    if (!KINDS.includes(p.participantKind)) problems.push(problem("invalid-kind", `${path}.participantKind`));
    checkSnapshot(p.current, problems, `${path}.current`);
    C.checkVersionRef(p.personaPolicyRef, problems, `${path}.personaPolicyRef`, { nullable: true });
    C.checkVersionRef(p.opponentPolicyRef, problems, `${path}.opponentPolicyRef`, { nullable: true });
  });
  if (problems.length) return fail(problems);
  const [A, B] = parts;
  if (A.subjectId === B.subjectId) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", "participants", "participants must be distinct"));
  parts.forEach((p, i) => {
    const other = parts[1 - i];
    const path = `participants[${i}]`;
    if (p.current.subjectId !== p.subjectId) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", `${path}.current.subjectId`));
    if (!C.sameRef(p.current.policyRef, policy.policy)) problems.push(problem("RATING_POLICY_MISMATCH", `${path}.current.policyRef`, "carryover between policies is main's explicit policy"));
    if (p.participantKind === "ai_persona" && p.personaPolicyRef === null) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", `${path}.personaPolicyRef`, "an AI persona names its versioned policy"));
    if (p.participantKind === "human" && p.personaPolicyRef !== null) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", `${path}.personaPolicyRef`));
    if (!C.sameRef(p.opponentPolicyRef, other.personaPolicyRef)) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", `${path}.opponentPolicyRef`, "opponent policy differs from the bound opponent"));
  });

  // Outcome semantics and eligibility.
  const o = input.completedOutcome;
  const ids = [A.subjectId, B.subjectId];
  if (!isObj(o)) problems.push(problem("invalid-outcome", "completedOutcome"));
  else {
    C.closedKeys(o, ["outcomeRef", "completedAt", "outcomeSemanticsRef", "kind", "winnerSubjectId", "netChipsBySubject", "eligibility"], problems, "completedOutcome.");
    C.checkSourceRef(o.outcomeRef, problems, "completedOutcome.outcomeRef");
    C.checkVersionRef(o.outcomeSemanticsRef, problems, "completedOutcome.outcomeSemanticsRef");
    if (!C.isTs(o.completedAt)) problems.push(problem("invalid-timestamp", "completedOutcome.completedAt"));
    if (!["participant_win", "tie", "no_contest"].includes(o.kind)) problems.push(problem("invalid-outcome-kind", "completedOutcome.kind"));
    if (o.kind === "participant_win" && !ids.includes(o.winnerSubjectId)) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", "completedOutcome.winnerSubjectId", "a win names exactly one bound participant"));
    if (o.kind !== "participant_win" && o.winnerSubjectId !== null) problems.push(problem("invalid-winner", "completedOutcome.winnerSubjectId", "tie/no-contest names no winner"));
    const rows = Array.isArray(o.netChipsBySubject) ? o.netChipsBySubject : null;
    if (!rows || rows.length !== 2 || !rows.every((r) => isObj(r) && ids.includes(r.subjectId) && (r.netChips === null || isNum(r.netChips)))
      || rows[0].subjectId === rows[1].subjectId) {
      problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", "completedOutcome.netChipsBySubject"));
    } else if (o.kind === "participant_win" && ids.includes(o.winnerSubjectId) && rows.every((r) => isNum(r.netChips))) {
      const w = rows.find((r) => r.subjectId === o.winnerSubjectId); const l = rows.find((r) => r.subjectId !== o.winnerSubjectId);
      if (w.netChips <= l.netChips) problems.push(problem("outcome-contradiction", "completedOutcome", "winner's net chips do not exceed the loser's"));
    }
    if (!["eligible", "ineligible", "unknown"].includes(o.eligibility)) problems.push(problem("invalid-eligibility", "completedOutcome.eligibility"));
  }
  if (problems.length) return fail(problems);
  if (o.kind === "no_contest") return fail([problem("NO_CONTEST_NOT_RATED", "completedOutcome.kind", "a no-contest never becomes a rated result")]);
  if (o.eligibility === "unknown") return fail([problem("OUTCOME_ELIGIBILITY_UNKNOWN", "completedOutcome.eligibility")]);
  if (o.eligibility === "ineligible") return fail([problem("OUTCOME_INELIGIBLE", "completedOutcome.eligibility")]);

  // Assessments: provenance, ownership, dependence.
  const list = input.admittedQualityAssessments;
  if (!Array.isArray(list)) return fail([problem("invalid-assessments", "admittedQualityAssessments")]);
  const getEv = (id) => (evidenceIndex instanceof Map ? evidenceIndex.get(id) : isObj(evidenceIndex) ? evidenceIndex[id] : undefined);
  if (list.length && evidenceIndex === null) return fail([problem("ASSESSMENT_OWNERSHIP_UNRESOLVED", "admittedQualityAssessments", "no admitted evidence index binds assessments to participants")]);
  const seenA = new Set(); const seenE = new Set(); const seenDecision = new Set();
  const quality = { [A.subjectId]: new Map(), [B.subjectId]: new Map() };
  const counts = { [A.subjectId]: { supported: 0, uncertain: 0, unassessable: 0 }, [B.subjectId]: { supported: 0, uncertain: 0, unassessable: 0 } };
  const evaluatorRefs = new Map();
  const sorted = [...list].sort((x, y) => (String(x && x.assessmentId) < String(y && y.assessmentId) ? -1 : 1));
  sorted.forEach((a, i) => {
    const path = `admittedQualityAssessments[${a && a.assessmentId ? a.assessmentId : i}]`;
    if (!isObj(a)) { problems.push(problem("invalid-assessment", path)); return; }
    if (seenA.has(a.assessmentId)) { problems.push(problem("DUPLICATE_ASSESSMENT", path)); return; }
    seenA.add(a.assessmentId);
    if (seenE.has(a.evidenceId)) { problems.push(problem("DUPLICATE_EVIDENCE", path, "one decision assessed twice")); return; }
    seenE.add(a.evidenceId);
    const ev = getEv(a.evidenceId);
    if (!isObj(ev)) { problems.push(problem("MISSING_PROVENANCE", path, "assessment has no admitted evidence")); return; }
    if (ev.fingerprint !== C.fingerprintOf(ev)) { problems.push(problem("FINGERPRINT_MISMATCH", `${path}.evidence`)); return; }
    const av = validateQualityAssessment(a, ev);
    if (!av.ok) { for (const p of av.problems) problems.push(problem(p.code === "policy-drift" ? "POLICY_DRIFT" : p.code, `${path}.${p.path}`, p.message)); return; }
    if (ev.matchId !== input.matchId) { problems.push(problem("EVIDENCE_MATCH_MISMATCH", path)); return; }
    const owner = parts.find((p) => p.subjectId === ev.subjectId);
    const opp = parts.find((p) => p.subjectId === ev.opponentId);
    if (!owner || !opp || owner === opp || ev.participantKind !== owner.participantKind || ev.opponentKind !== opp.participantKind) {
      problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", path, "evidence does not belong to the bound pair")); return;
    }
    if (!C.sameRef(ev.opponentPolicyRef, owner.opponentPolicyRef)) { problems.push(problem("POLICY_DRIFT", path, "opponent policy changed between evidence and match")); return; }
    if (!C.refIn(a.evaluatorRef, model.evaluatorRefs)) { problems.push(problem("unknown-version", `${path}.evaluatorRef`)); return; }
    if (!C.sameRef(a.chosenActionAssessment.qualitySemanticsRef, model.qualitySemanticsRef)) { problems.push(problem("POLICY_DRIFT", `${path}.qualitySemanticsRef`)); return; }
    const decisionKey = `${ev.subjectId}|${ev.handId}|${ev.actionOrdinal}`;
    if (seenDecision.has(decisionKey)) { problems.push(problem("DEPENDENCE_DUPLICATE_DECISION", path, "the same decision under a second evidence id")); return; }
    seenDecision.add(decisionKey);
    counts[ev.subjectId][a.status] += 1;
    evaluatorRefs.set(C.refKey(a.evaluatorRef) + (a.evaluatorRef.sha256 || ""), a.evaluatorRef);
    if (a.status !== "supported") return;
    const gid = dependenceGroupFor(ev);
    const m = quality[ev.subjectId];
    if (!m.has(gid)) m.set(gid, { groupId: gid, values: [], uncertainties: [] });
    m.get(gid).values.push(a.chosenActionAssessment.value);
    m.get(gid).uncertainties.push(a.chosenActionAssessment.uncertainty);
  });
  if (problems.length) return fail(problems);

  const bound = C.deepFreeze({
    matchId: input.matchId, formatRef: C.clone(input.formatRef), populationRef: C.clone(input.populationRef),
    outcome: { kind: o.kind, winnerSubjectId: o.winnerSubjectId },
    participants: parts.map((p) => ({ subjectId: p.subjectId, participantKind: p.participantKind, estimate: p.current.estimate, uncertainty: C.clone(p.current.uncertainty) })),
    quality: Object.fromEntries(ids.map((id) => [id, { groups: [...quality[id].values()].sort((x, y) => (x.groupId < y.groupId ? -1 : 1)) }])),
  });
  let res;
  try { res = model.compute(bound); } catch (err) { return fail([problem("MODEL_FAILED", "suppliedModel", String(err && err.message))]); }
  if (!res || !res.ok) return res && res.problems ? res : fail([problem("MODEL_FAILED", "suppliedModel")]);
  const outs = res.value.participants;
  if (!Array.isArray(outs) || outs.length !== 2 || !ids.every((id) => outs.some((x) => x.subjectId === id))) return fail([problem("MODEL_FAILED", "suppliedModel", "model output does not bind both participants")]);

  const inputHash = C.hashOf({ ...input, admittedQualityAssessments: sorted }); // sorted: reordering cannot change the proposal
  const proposalId = `prop:${C.hashOf({ inputHash, modelRef: model.modelRef, configHash: model.configHash })}`;
  const statusOf = (id) => (counts[id].supported ? "supported" : counts[id].uncertain ? "uncertain" : "unassessable");
  const proposal = {
    contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, proposalId, fingerprint: null, matchId: input.matchId,
    state: "proposed",
    inputRef: { kind: "paired-rating-input", recordId: input.matchId, recordVersion: inputHash.slice(0, 16), sourceHash: inputHash },
    modelRef: C.clone(model.modelRef),
    evaluatorRefs: [...evaluatorRefs.values()].map(C.clone).sort((x, y) => (C.refKey(x) < C.refKey(y) ? -1 : 1)),
    ratingPolicyRef: C.clone(policy.policy),
    opponentPolicyRefs: parts.map((p) => p.personaPolicyRef).filter(Boolean).map(C.clone),
    participants: parts.map((p) => {
      const x = outs.find((y) => y.subjectId === p.subjectId);
      const after = { subjectId: p.subjectId, revision: p.current.revision + 1, estimate: x.estimate, uncertainty: C.clone(x.uncertainty),
        modelRef: C.clone(model.modelRef), policyRef: C.clone(policy.policy) };
      return { subjectId: p.subjectId, participantKind: p.participantKind, before: C.clone(p.current), after,
        delta: isNum(p.current.estimate) && isNum(x.estimate) ? x.estimate - p.current.estimate : null,
        assessmentStatus: statusOf(p.subjectId), publicReasonCodes: [...x.publicReasonCodes], privateReasonCodes: [...x.privateReasonCodes] };
    }),
    privateAuditRef: { kind: "rating-private-audit", recordId: proposalId, recordVersion: model.modelRef.version, sourceHash: C.hashOf(res.value.audit) },
  };
  proposal.fingerprint = C.fingerprintOf(proposal);
  const check = validatePairedRatingProposal(proposal);
  if (!check.ok) return check;
  return ok({ proposal: check.value, privateAudit: C.deepFreeze(C.clone(res.value.audit)) });
}

function checkParticipantProposal(p, problems, path, { committed }) {
  if (!isObj(p)) { problems.push(problem("invalid-participant", path)); return; }
  const keys = committed ? [...PART_PROPOSAL_KEYS, "committedRevision", "placementContext", "publicReasons"] : PART_PROPOSAL_KEYS;
  for (const k of Object.keys(p)) {
    if (!keys.includes(k)) problems.push(problem(COMMITTED_ONLY.includes(k) ? "PROPOSAL_NOT_COMMIT" : "unknown-field", `${path}.${k}`));
  }
  if (!isStr(p.subjectId)) problems.push(problem("invalid-id", `${path}.subjectId`));
  if (!KINDS.includes(p.participantKind)) problems.push(problem("invalid-kind", `${path}.participantKind`));
  checkSnapshot(p.before, problems, `${path}.before`);
  checkSnapshot(p.after, problems, `${path}.after`);
  if (isObj(p.before) && isObj(p.after)) {
    if (p.before.subjectId !== p.subjectId || p.after.subjectId !== p.subjectId) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", `${path}.subjectId`));
    if (isCount(p.before.revision) && p.after.revision !== p.before.revision + 1) problems.push(problem("revision-sequence", `${path}.after.revision`));
    const expect = isNum(p.before.estimate) && isNum(p.after.estimate) ? p.after.estimate - p.before.estimate : null;
    if (!((p.delta === null && expect === null) || (isNum(p.delta) && isNum(expect) && Math.abs(p.delta - expect) <= 1e-9 * Math.max(1, Math.abs(expect))))) {
      problems.push(problem("delta-mismatch", `${path}.delta`));
    }
  }
  if (!["supported", "uncertain", "unassessable"].includes(p.assessmentStatus)) problems.push(problem("invalid-status", `${path}.assessmentStatus`));
  for (const k of ["publicReasonCodes", "privateReasonCodes"]) if (!Array.isArray(p[k]) || !p[k].every(isStr)) problems.push(problem("invalid-reason-codes", `${path}.${k}`));
}

// validatePairedRatingProposal(proposal) -> Result<PairedRatingProposal>
function validatePairedRatingProposal(p) {
  const problems = [];
  if (!C.checkEnvelope(p, problems)) return fail(problems);
  for (const k of Object.keys(p)) {
    if (!PROPOSAL_KEYS.includes(k)) problems.push(problem(COMMITTED_ONLY.includes(k) ? "PROPOSAL_NOT_COMMIT" : "unknown-field", k));
  }
  C.requireKeys(p, PROPOSAL_KEYS, problems);
  if (p.state !== "proposed") problems.push(problem("PROPOSAL_NOT_COMMIT", "state", "a pure proposal is never committed"));
  for (const k of ["proposalId", "matchId"]) if (!isStr(p[k])) problems.push(problem("invalid-id", k));
  C.checkSourceRef(p.inputRef, problems, "inputRef");
  C.checkSourceRef(p.privateAuditRef, problems, "privateAuditRef");
  C.checkVersionRef(p.modelRef, problems, "modelRef");
  C.checkVersionRef(p.ratingPolicyRef, problems, "ratingPolicyRef");
  for (const k of ["evaluatorRefs", "opponentPolicyRefs"]) if (!Array.isArray(p[k]) || !p[k].every(C.isVersionRef)) problems.push(problem("invalid-version-refs", k));
  if (!Array.isArray(p.participants) || p.participants.length !== 2) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", "participants"));
  else {
    p.participants.forEach((x, i) => checkParticipantProposal(x, problems, `participants[${i}]`, { committed: false }));
    if (isObj(p.participants[0]) && isObj(p.participants[1]) && p.participants[0].subjectId === p.participants[1].subjectId) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", "participants"));
  }
  if (!problems.length && p.fingerprint !== C.fingerprintOf(p)) problems.push(problem("FINGERPRINT_MISMATCH", "fingerprint"));
  if (problems.length) return fail(problems);
  return ok(C.deepFreeze(C.clone(p)));
}

// validateCommittedRatingResult(result, { acceptedProposal, expectedPriorRevisions }) -> Result<CommittedRatingResult>
// expectedPriorRevisions: { [subjectId]: revision read at settlement } - stale revisions reject.
function validateCommittedRatingResult(r, { acceptedProposal = null, expectedPriorRevisions = null } = {}) {
  const problems = [];
  if (!C.checkEnvelope(r, problems)) return fail(problems);
  if (r.state !== "committed" || "proposalId" in r || "inputRef" in r) {
    return fail([problem("PROPOSAL_NOT_COMMIT", "state", "a proposal is not proof of saved state")]);
  }
  C.closedKeys(r, RESULT_KEYS, problems);
  C.requireKeys(r, RESULT_KEYS, problems);
  for (const k of ["settlementId", "resultId", "matchId", "acceptedProposalId"]) if (!isStr(r[k])) problems.push(problem("invalid-id", k));
  if (!/^[0-9a-f]{64}$/.test(r.acceptedProposalFingerprint ?? "")) problems.push(problem("invalid-fingerprint", "acceptedProposalFingerprint"));
  if (!C.isTs(r.committedAt)) problems.push(problem("invalid-timestamp", "committedAt"));
  C.checkSourceRef(r.committedSource, problems, "committedSource");
  C.checkSourceRef(r.privateAuditRef, problems, "privateAuditRef");
  C.checkVersionRef(r.modelRef, problems, "modelRef");
  C.checkVersionRef(r.ratingPolicyRef, problems, "ratingPolicyRef");
  for (const k of ["evaluatorRefs", "opponentPolicyRefs"]) if (!Array.isArray(r[k]) || !r[k].every(C.isVersionRef)) problems.push(problem("invalid-version-refs", k));
  if (!Array.isArray(r.participants) || r.participants.length !== 2) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", "participants"));
  else r.participants.forEach((x, i) => {
    const path = `participants[${i}]`;
    checkParticipantProposal(x, problems, path, { committed: true });
    if (!isObj(x)) return;
    if (!isCount(x.committedRevision) || !isObj(x.after) || x.committedRevision !== x.after.revision) problems.push(problem("revision-sequence", `${path}.committedRevision`));
    const pc = validatePlacementContext(x.placementContext);
    if (!pc.ok) for (const q of pc.problems) problems.push(problem(q.code, `${path}.placementContext.${q.path}`, q.message));
    else if (pc.value.subjectId !== x.subjectId) problems.push(problem("PAIRED_PARTICIPANT_MISMATCH", `${path}.placementContext.subjectId`));
    if (!Array.isArray(x.publicReasons) || !x.publicReasons.every((q) => isObj(q) && Object.keys(q).length === 2 && isStr(q.code) && isStr(q.text))) {
      problems.push(problem("invalid-public-reasons", `${path}.publicReasons`));
    }
    if (expectedPriorRevisions && isObj(x.before) && expectedPriorRevisions[x.subjectId] !== x.before.revision) {
      problems.push(problem("STALE_EXPECTED_REVISION", `${path}.before.revision`, "the participant's revision moved before settlement"));
    }
  });
  if (acceptedProposal !== null) {
    const pv = validatePairedRatingProposal(acceptedProposal);
    if (!pv.ok) problems.push(...pv.problems.map((q) => problem(q.code, `acceptedProposal.${q.path}`, q.message)));
    else {
      const ap = pv.value;
      if (ap.proposalId !== r.acceptedProposalId || ap.fingerprint !== r.acceptedProposalFingerprint) problems.push(problem("COMMIT_PROPOSAL_MISMATCH", "acceptedProposalFingerprint"));
      if (ap.matchId !== r.matchId || !C.sameRef(ap.modelRef, r.modelRef) || !C.sameRef(ap.ratingPolicyRef, r.ratingPolicyRef)
        || C.canonical(ap.evaluatorRefs) !== C.canonical(r.evaluatorRefs) || C.canonical(ap.opponentPolicyRefs) !== C.canonical(r.opponentPolicyRefs)
        || C.canonical(ap.privateAuditRef) !== C.canonical(r.privateAuditRef)) {
        problems.push(problem("COMMIT_PROPOSAL_MISMATCH", "modelRef", "same-match results keep the original model/policy"));
      }
      if (Array.isArray(r.participants)) ap.participants.forEach((q, i) => {
        const x = r.participants[i];
        if (!isObj(x) || PART_PROPOSAL_KEYS.some((k) => C.canonical(q[k]) !== C.canonical(x[k]))) problems.push(problem("COMMIT_PROPOSAL_MISMATCH", `participants[${i}]`));
      });
    }
  }
  if (problems.length) return fail(problems);
  return ok(C.deepFreeze(C.clone(r)));
}

// projectCommittedRatingResult(result, suppliedVisibilityPolicy) -> Result<PublicRatingResult>
// Allowlist build. Omits the private audit, raw decisions, action values, evaluator parameters and
// private reason codes. Keeps the trusted participant kind and the readable AI badge.
function projectCommittedRatingResult(result, vis) {
  const v = validateCommittedRatingResult(result);
  if (!v.ok) return v;
  const problems = checkVisibility(vis);
  if (problems.length) return fail(problems);
  const r = v.value;
  for (const [i, x] of r.participants.entries()) {
    for (const q of x.publicReasons) if (!vis.publicReasonCodes.includes(q.code)) problems.push(problem("PUBLIC_REASON_NOT_ALLOWLISTED", `participants[${i}].publicReasons`, q.code));
  }
  if (problems.length) return fail(problems);
  const participants = [];
  for (const x of r.participants) {
    const pc = projectPlacementContext(x.placementContext, vis);
    if (!pc.ok) return pc;
    participants.push({
      subjectId: x.subjectId, participantKind: x.participantKind, isAi: x.participantKind === "ai_persona",
      aiBadge: x.participantKind === "ai_persona" ? { text: AI_BADGE.text, accessibleLabel: AI_BADGE.accessibleLabel } : null,
      before: { estimate: x.before.estimate, uncertainty: projectUncertainty(x.before.uncertainty, vis) },
      after: { estimate: x.after.estimate, uncertainty: projectUncertainty(x.after.uncertainty, vis) },
      delta: x.delta, assessmentStatus: x.assessmentStatus, placement: pc.value,
      publicReasons: x.publicReasons.map((q) => ({ code: q.code, text: q.text })),
    });
  }
  return ok(C.deepFreeze({ contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, resultId: r.resultId, matchId: r.matchId,
    committedAt: r.committedAt, modelRef: C.clone(r.modelRef), ratingPolicyRef: C.clone(r.ratingPolicyRef),
    visibilityPolicyRef: C.clone(vis.policy), participants }));
}

module.exports = { AI_BADGE, validateRatingPolicy, proposePairedRatingUpdate, proposePairedRatingUpdateWithAudit,
  validatePairedRatingProposal, validateCommittedRatingResult, projectCommittedRatingResult };
