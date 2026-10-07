"use strict";
// §7 placement and provisional context (F52-V1-CONTRACT-1). Every threshold comes from the supplied
// placement policy; none is chosen here. A missing policy/threshold yields unknown eligibility and
// incomplete progress, never "placed". Generic games played, legacy synthetic histories,
// refunds/cancelled entries and lesson retries are never admissible placement sources.

const C = require("./common.cjs");
const { problem, ok, fail, isObj, isStr, isNum, isCount } = C;

const STATES = ["unassessed", "provisional", "placed", "suspended"];
const ELIGIBILITY = ["eligible", "ineligible", "unknown"];
// Contract-denied source kinds (§7), regardless of any supplied policy.
const DENIED_SOURCE_KINDS = ["generic_games_played", "legacy_synthetic_history", "refund", "cancelled_entry", "lesson_retry"];
const CONTEXT_KEYS = ["contractId", "schemaVersion", "subjectId", "populationRef", "formatRef", "policyRef", "state",
  "standingEligibility", "evidence", "progress", "uncertainty", "reasonCodes", "updatedFromReceiptId"];

const nullableCount = (v) => v === null || isCount(v);

// validatePlacementContext(context) -> Result<PlacementContext>
function validatePlacementContext(ctx) {
  const problems = [];
  if (!C.checkEnvelope(ctx, problems)) return fail(problems);
  C.closedKeys(ctx, CONTEXT_KEYS, problems);
  C.requireKeys(ctx, CONTEXT_KEYS, problems);
  if (!isStr(ctx.subjectId)) problems.push(problem("invalid-id", "subjectId"));
  C.checkVersionRef(ctx.populationRef, problems, "populationRef");
  C.checkVersionRef(ctx.formatRef, problems, "formatRef");
  C.checkVersionRef(ctx.policyRef, problems, "policyRef", { nullable: true });
  if (!STATES.includes(ctx.state)) problems.push(problem("invalid-state", "state"));
  if (!ELIGIBILITY.includes(ctx.standingEligibility)) problems.push(problem("invalid-eligibility", "standingEligibility"));
  const ev = ctx.evidence;
  if (!isObj(ev) || !nullableCount(ev.eligibleMatchCount) || !nullableCount(ev.eligibleDecisionCount) || !isObj(ev.opponentClassCounts)
    || !nullableCount(ev.opponentClassCounts.human) || !nullableCount(ev.opponentClassCounts.ai_persona)) {
    problems.push(problem("invalid-evidence-summary", "evidence"));
  } else C.checkSourceRef(ev.windowRef, problems, "evidence.windowRef", { nullable: true });
  if (!isObj(ctx.progress) || !nullableCount(ctx.progress.completed) || !nullableCount(ctx.progress.required)) problems.push(problem("invalid-progress", "progress"));
  C.checkUncertainty(ctx.uncertainty, problems, "uncertainty");
  if (!Array.isArray(ctx.reasonCodes) || !ctx.reasonCodes.every(isStr)) problems.push(problem("invalid-reason-codes", "reasonCodes"));
  if (!(ctx.updatedFromReceiptId === null || isStr(ctx.updatedFromReceiptId))) problems.push(problem("invalid-id", "updatedFromReceiptId"));
  // Invariants: no policy -> never placed and never eligible; placed <-> eligible.
  if (ctx.policyRef === null && (ctx.state === "placed" || ctx.standingEligibility === "eligible")) {
    problems.push(problem("POLICY_UNSELECTED", "state", "without a placement policy a subject cannot be placed"));
  }
  if ((ctx.state === "placed") !== (ctx.standingEligibility === "eligible")) problems.push(problem("placement-eligibility-contradiction", "state"));
  if (isObj(ctx.progress) && ctx.state === "placed" && (ctx.progress.required === null || ctx.progress.completed === null || ctx.progress.completed < ctx.progress.required)) {
    problems.push(problem("placement-progress-contradiction", "progress"));
  }
  if (problems.length) return fail(problems);
  return ok(C.deepFreeze(C.clone(ctx)));
}

function checkPlacementPolicy(policy, problems) {
  if (!C.checkEnvelope(policy, problems, "policy.")) return false;
  C.closedKeys(policy, ["contractId", "schemaVersion", "policy", "status", "populationRef", "formatRef", "requiredEligibleMatches",
    "requiredEligibleDecisions", "opponentClassMinimums", "admissibleSourceKinds", "uncertaintyGate", "acceptanceRef"], problems, "policy.");
  C.checkVersionRef(policy.policy, problems, "policy.policy");
  C.checkVersionRef(policy.populationRef, problems, "policy.populationRef");
  C.checkVersionRef(policy.formatRef, problems, "policy.formatRef");
  if (!["unselected", "candidate", "accepted"].includes(policy.status)) problems.push(problem("invalid-status", "policy.status"));
  if (policy.status === "accepted") C.checkSourceRef(policy.acceptanceRef, problems, "policy.acceptanceRef");
  else C.checkSourceRef(policy.acceptanceRef ?? null, problems, "policy.acceptanceRef", { nullable: true });
  if (!nullableCount(policy.requiredEligibleMatches)) problems.push(problem("invalid-count", "policy.requiredEligibleMatches"));
  if (!nullableCount(policy.requiredEligibleDecisions)) problems.push(problem("invalid-count", "policy.requiredEligibleDecisions"));
  const m = policy.opponentClassMinimums;
  if (!(m === null || (isObj(m) && nullableCount(m.human) && nullableCount(m.ai_persona)))) problems.push(problem("invalid-count", "policy.opponentClassMinimums"));
  if (!Array.isArray(policy.admissibleSourceKinds) || !policy.admissibleSourceKinds.every(isStr)) problems.push(problem("invalid-source-kinds", "policy.admissibleSourceKinds"));
  else for (const k of policy.admissibleSourceKinds) if (DENIED_SOURCE_KINDS.includes(k)) problems.push(problem("INADMISSIBLE_PLACEMENT_SOURCE", "policy.admissibleSourceKinds", `${k} is never placement evidence`));
  const g = policy.uncertaintyGate;
  if (!(g === null || (isObj(g) && C.isVersionRef(g.methodRef) && isStr(g.parameter) && isNum(g.maximum)))) problems.push(problem("invalid-uncertainty-gate", "policy.uncertaintyGate"));
  return true;
}

function checkSummary(s, problems) {
  if (!C.checkEnvelope(s, problems, "summary.")) return false;
  C.closedKeys(s, ["contractId", "schemaVersion", "subjectId", "populationRef", "formatRef", "receiptId", "windowRef",
    "eligibleMatchCount", "eligibleDecisionCount", "opponentClassCounts", "sourceCounts", "suspension"], problems, "summary.");
  if (!isStr(s.subjectId) || !isStr(s.receiptId)) problems.push(problem("invalid-id", "summary"));
  C.checkVersionRef(s.populationRef, problems, "summary.populationRef");
  C.checkVersionRef(s.formatRef, problems, "summary.formatRef");
  C.checkSourceRef(s.windowRef, problems, "summary.windowRef", { nullable: true });
  if (!nullableCount(s.eligibleMatchCount) || !nullableCount(s.eligibleDecisionCount)) problems.push(problem("invalid-count", "summary"));
  if (!isObj(s.opponentClassCounts) || !nullableCount(s.opponentClassCounts.human) || !nullableCount(s.opponentClassCounts.ai_persona)) {
    problems.push(problem("invalid-count", "summary.opponentClassCounts"));
  }
  if (!Array.isArray(s.sourceCounts) || !s.sourceCounts.every((r) => isObj(r) && isStr(r.kind) && isCount(r.matches))) {
    problems.push(problem("invalid-source-counts", "summary.sourceCounts"));
  } else {
    for (const r of s.sourceCounts) if (DENIED_SOURCE_KINDS.includes(r.kind)) problems.push(problem("INADMISSIBLE_PLACEMENT_SOURCE", "summary.sourceCounts", `${r.kind} is never placement evidence`));
    if (isCount(s.eligibleMatchCount) && s.sourceCounts.reduce((a, r) => a + r.matches, 0) !== s.eligibleMatchCount) {
      problems.push(problem("source-count-mismatch", "summary.sourceCounts"));
    }
  }
  if (!(s.suspension === null || (isObj(s.suspension) && isStr(s.suspension.receiptId) && isStr(s.suspension.reasonCode)))) problems.push(problem("invalid-suspension", "summary.suspension"));
  return true;
}

// derivePlacementContext(ratingSnapshot, admittedEvidenceSummary, suppliedPlacementPolicy) -> Result<PlacementContext>
function derivePlacementContext(ratingSnapshot, summary, policy) {
  const problems = [];
  if (!isObj(ratingSnapshot) || !isStr(ratingSnapshot.subjectId)) return fail([problem("invalid-rating-snapshot", "ratingSnapshot")]);
  C.checkUncertainty(ratingSnapshot.uncertainty, problems, "ratingSnapshot.uncertainty");
  checkSummary(summary, problems);
  if (problems.length) return fail(problems);
  if (summary.subjectId !== ratingSnapshot.subjectId) return fail([problem("subject-mismatch", "summary.subjectId")]);

  const evidence = { eligibleMatchCount: summary.eligibleMatchCount, eligibleDecisionCount: summary.eligibleDecisionCount,
    opponentClassCounts: { human: summary.opponentClassCounts.human, ai_persona: summary.opponentClassCounts.ai_persona },
    windowRef: C.clone(summary.windowRef) };
  const base = (policyRef, state, standingEligibility, required, reasonCodes) => ({
    contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, subjectId: summary.subjectId,
    populationRef: C.clone(summary.populationRef), formatRef: C.clone(summary.formatRef), policyRef, state, standingEligibility,
    evidence, progress: { completed: summary.eligibleMatchCount, required }, uncertainty: C.clone(ratingSnapshot.uncertainty),
    reasonCodes, updatedFromReceiptId: summary.receiptId });

  if (policy === null || policy === undefined || (isObj(policy) && policy.status === "unselected")) {
    return validatePlacementContext(base(policy ? C.clone(policy.policy) : null, "unassessed", "unknown", null, ["POLICY_UNSELECTED"]));
  }
  checkPlacementPolicy(policy, problems);
  if (problems.length) return fail(problems);
  if (!C.sameRef(policy.populationRef, summary.populationRef) || !C.sameRef(policy.formatRef, summary.formatRef)) {
    return fail([problem("placement-scope-mismatch", "policy", "policy population/format differ from the evidence")]);
  }
  for (const r of summary.sourceCounts) {
    if (!policy.admissibleSourceKinds.includes(r.kind)) return fail([problem("INADMISSIBLE_PLACEMENT_SOURCE", "summary.sourceCounts", `${r.kind} is not admitted by the policy`)]);
  }
  const policyRef = C.clone(policy.policy);
  if (summary.suspension) return validatePlacementContext(base(policyRef, "suspended", "ineligible", policy.requiredEligibleMatches, ["SUSPENDED", summary.suspension.reasonCode]));

  const reasons = [];
  let unknown = false; let unmet = false;
  if (policy.requiredEligibleMatches === null) { unknown = true; reasons.push("POLICY_INCOMPLETE"); }
  if (summary.eligibleMatchCount === null) { unknown = true; reasons.push("EVIDENCE_COUNT_UNKNOWN"); }
  if (!unknown && summary.eligibleMatchCount < policy.requiredEligibleMatches) { unmet = true; reasons.push("PLACEMENT_MATCHES_INCOMPLETE"); }
  if (policy.requiredEligibleDecisions !== null) {
    if (summary.eligibleDecisionCount === null) { unknown = true; reasons.push("DECISION_COUNT_UNKNOWN"); }
    else if (summary.eligibleDecisionCount < policy.requiredEligibleDecisions) { unmet = true; reasons.push("PLACEMENT_DECISIONS_INCOMPLETE"); }
  }
  if (policy.opponentClassMinimums) {
    for (const k of ["human", "ai_persona"]) {
      const need = policy.opponentClassMinimums[k];
      if (need === null) continue;
      const have = summary.opponentClassCounts[k];
      if (have === null) { unknown = true; reasons.push(`OPPONENT_CLASS_COUNT_UNKNOWN:${k}`); }
      else if (have < need) { unmet = true; reasons.push(`OPPONENT_CLASS_MINIMUM_UNMET:${k}`); }
    }
  }
  if (policy.uncertaintyGate) {
    const g = policy.uncertaintyGate; const u = ratingSnapshot.uncertainty;
    const val = u.status === "estimated" && C.sameRef(u.methodRef, g.methodRef) && isObj(u.parameters) ? u.parameters[g.parameter] : undefined;
    if (!isNum(val)) { unknown = true; reasons.push("UNCERTAINTY_UNKNOWN"); }
    else if (val > g.maximum) { unmet = true; reasons.push("UNCERTAINTY_ABOVE_GATE"); }
  }
  const anyEvidence = (summary.eligibleMatchCount ?? 0) > 0;
  let state; let elig;
  if (unknown) { state = anyEvidence ? "provisional" : "unassessed"; elig = "unknown"; }
  else if (unmet) { state = anyEvidence ? "provisional" : "unassessed"; elig = "ineligible"; }
  else { state = "placed"; elig = "eligible"; reasons.push("PLACEMENT_REQUIREMENTS_MET"); }
  return validatePlacementContext(base(policyRef, state, elig, policy.requiredEligibleMatches, reasons));
}

// projectPlacementContext(context, suppliedVisibilityPolicy) -> Result<PublicPlacementContext>
// Visibility policy: { policy: VersionRef, publicReasonCodes: string[], exposeUncertaintyParameters: boolean }.
// Internal reason codes not on the allowlist are not projected.
function projectPlacementContext(ctx, vis) {
  const v = validatePlacementContext(ctx);
  if (!v.ok) return v;
  const problems = checkVisibility(vis);
  if (problems.length) return fail(problems);
  const c = v.value;
  return ok(C.deepFreeze({
    contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, subjectId: c.subjectId,
    populationRef: C.clone(c.populationRef), formatRef: C.clone(c.formatRef), policyRef: C.clone(c.policyRef),
    state: c.state, standingEligibility: c.standingEligibility, provisional: c.state !== "placed",
    progress: { completed: c.progress.completed, required: c.progress.required },
    evidence: { eligibleMatchCount: c.evidence.eligibleMatchCount,
      opponentClassCounts: { human: c.evidence.opponentClassCounts.human, ai_persona: c.evidence.opponentClassCounts.ai_persona } },
    uncertainty: projectUncertainty(c.uncertainty, vis),
    reasonCodes: c.reasonCodes.filter((r) => vis.publicReasonCodes.includes(r)),
  }));
}

function checkVisibility(vis) {
  const problems = [];
  if (!isObj(vis)) return [problem("POLICY_UNSELECTED", "suppliedVisibilityPolicy", "no visibility policy supplied")];
  C.checkVersionRef(vis.policy, problems, "suppliedVisibilityPolicy.policy");
  if (!Array.isArray(vis.publicReasonCodes) || !vis.publicReasonCodes.every(isStr)) problems.push(problem("POLICY_INCOMPLETE", "suppliedVisibilityPolicy.publicReasonCodes"));
  if (typeof vis.exposeUncertaintyParameters !== "boolean") problems.push(problem("POLICY_INCOMPLETE", "suppliedVisibilityPolicy.exposeUncertaintyParameters"));
  return problems;
}
const projectUncertainty = (u, vis) => ({ status: u.status, methodRef: C.clone(u.methodRef),
  parameters: vis.exposeUncertaintyParameters ? C.clone(u.parameters) : null });

module.exports = { DENIED_SOURCE_KINDS, validatePlacementContext, derivePlacementContext, projectPlacementContext,
  checkVisibility, projectUncertainty };
