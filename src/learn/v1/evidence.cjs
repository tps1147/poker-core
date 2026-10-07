"use strict";
// Learning evidence (F52-V1-CONTRACT-1 §4): validate a main-admitted fact, reduce it into a
// per-subject snapshot, and project an allowlisted public view. Nothing here grants mastery,
// trusts a client, or chooses an uncertainty number: policies are supplied, unset policy fails closed.
//
// suppliedPolicyContext = {
//   policies: { [id@version]: true }            every VersionRef the fact may cite must be known
//   evidencePolicyFor(conceptId, lessonId, contentVersion) -> VersionRef | null
//                                                 which evidence policy pools this content (ACK item 5)
//   priorEvidence(evidenceId) -> { subjectId, conceptId, recordedAt } | null   admitted earlier facts
//   uncertaintyMethod?: { ref: VersionRef, estimate(entry) -> object }        optional supplied method
//   windowRef?: SourceRef | null
// }

const C = require("./common.cjs");
const { ROLES } = require("./plan.cjs");

const FACT_KEYS = ["contractId", "schemaVersion", "evidenceId", "fingerprint", "subjectId", "source", "lesson", "run", "spot", "variation",
  "conceptId", "role", "issuedAt", "decidedAt", "recordedAt", "assessment", "exposure", "delayed", "eligibility"];
const STATUSES = ["supported", "uncertain", "unassessable"];
const EXPOSURE_FLAGS = ["hintBeforeDecision", "solutionViewedBeforeDecision", "materialPreviouslyViewed", "assisted", "repeated"];
const unknownUncertainty = () => ({ status: "unknown", methodRef: null, parameters: null, coverageRef: null });

function knownPolicy(ctx, ref, p, path) {
  if (!ref) return;
  if (!ctx || !ctx.policies || !ctx.policies[C.refKey(ref)]) p.push(C.problem("unknown-policy-version", path, `${C.refKey(ref)} is not a supplied policy`));
}

function validateLearningEvidenceFact(fact, ctx) {
  const p = [];
  C.checkEnvelope(fact, p);
  if (!C.isObj(fact)) return C.fail(p);
  C.closedKeys(fact, FACT_KEYS, p);
  C.scanPrivate(fact, p);
  for (const k of ["evidenceId", "subjectId", "conceptId"]) if (!C.isStr(fact[k])) p.push(C.problem("invalid-id", k));
  if (!/^[0-9a-f]{64}$/.test(fact.fingerprint ?? "")) p.push(C.problem("invalid-fingerprint", "fingerprint"));
  else { try { if (C.fingerprintOf(fact) !== fact.fingerprint) p.push(C.problem("fingerprint-mismatch", "fingerprint")); } catch { p.push(C.problem("non-finite-number", null)); } }
  C.checkSourceRef(fact.source, p, "source");
  if (!C.isObj(fact.lesson) || !C.isStr(fact.lesson.lessonId) || !Number.isSafeInteger(fact.lesson.contentVersion)) p.push(C.problem("invalid-lesson", "lesson"));
  if (!C.isObj(fact.run) || !C.isStr(fact.run.runId) || !C.isCount(fact.run.revision)) p.push(C.problem("invalid-run", "run"));
  C.checkVersionRef(fact.variation ?? null, p, "variation", { nullable: true });
  if (!ROLES.includes(fact.role)) p.push(C.problem("unknown-role", "role"));
  for (const k of ["issuedAt", "decidedAt", "recordedAt"]) if (!C.isTs(fact[k])) p.push(C.problem("invalid-timestamp", k));
  if (C.isTs(fact.issuedAt) && C.isTs(fact.decidedAt) && C.isTs(fact.recordedAt)
    && !(fact.issuedAt <= fact.decidedAt && fact.decidedAt <= fact.recordedAt)) p.push(C.problem("timestamps-out-of-order", "decidedAt"));

  const a = fact.assessment;
  if (!C.isObj(a) || !STATUSES.includes(a.status)) p.push(C.problem("invalid-assessment", "assessment"));
  else {
    C.checkVersionRef(a.scoringPolicyRef, p, "assessment.scoringPolicyRef"); knownPolicy(ctx, a.scoringPolicyRef, p, "assessment.scoringPolicyRef");
    if (a.status === "supported" && typeof a.correct !== "boolean") p.push(C.problem("supported-needs-correct", "assessment.correct"));
    if (a.status === "unassessable" && (a.correct !== null || a.score !== null)) p.push(C.problem("unassessable-has-result", "assessment"));
    if (a.score !== null && a.score !== undefined && !Number.isFinite(a.score)) p.push(C.problem("invalid-score", "assessment.score"));
  }

  const e = fact.exposure;
  const el = fact.eligibility;
  if (!C.isObj(e)) p.push(C.problem("invalid-exposure", "exposure"));
  else { C.checkVersionRef(e.exposurePolicyRef, p, "exposure.exposurePolicyRef"); knownPolicy(ctx, e.exposurePolicyRef, p, "exposure.exposurePolicyRef"); }
  if (!C.isObj(el) || !Array.isArray(el.reasonCodes)) p.push(C.problem("invalid-eligibility", "eligibility"));
  else { C.checkVersionRef(el.policyRef, p, "eligibility.policyRef"); knownPolicy(ctx, el.policyRef, p, "eligibility.policyRef"); }

  if (C.isObj(e) && C.isObj(el)) {
    const independent = el.independentLearningEvidence === true;
    if (independent) {
      // Eligibility must agree with admitted exposure (§4): unknown is not clean, any assistance disqualifies.
      for (const k of EXPOSURE_FLAGS) {
        if (e[k] === null || e[k] === undefined) p.push(C.problem("unknown-exposure-claimed-independent", `exposure.${k}`));
        else if (e[k] === true) p.push(C.problem("assisted-claimed-independent", `exposure.${k}`));
      }
      if (e.noveltyVerified !== true) p.push(C.problem("novelty-unverified-claimed-independent", "exposure.noveltyVerified"));
      if (!(e.priorAnswers === 0)) p.push(C.problem("prior-answers-claimed-independent", "exposure.priorAnswers"));
      if (!["fresh", "delayed"].includes(fact.role)) p.push(C.problem("role-not-independent", "role"));
      if (!C.isObj(a) || a.status !== "supported") p.push(C.problem("unsupported-claimed-independent", "assessment.status"));
    }
    // Teaching material is never competitive evidence in this module (§4).
    if (el.competitiveEvidence === true) p.push(C.problem("competitive-not-admissible", "eligibility.competitiveEvidence"));
  }

  const d = fact.delayed;
  if (!C.isObj(d)) p.push(C.problem("invalid-delayed", "delayed"));
  else if (fact.role === "delayed") {
    const prior = d.priorEvidenceId && typeof ctx?.priorEvidence === "function" ? ctx.priorEvidence(d.priorEvidenceId) : null;
    if (!prior) p.push(C.problem("delayed-without-admitted-prior", "delayed.priorEvidenceId"));
    else {
      if (prior.subjectId !== fact.subjectId || prior.conceptId !== fact.conceptId) p.push(C.problem("delayed-prior-mismatch", "delayed.priorEvidenceId"));
      if (!(prior.recordedAt < fact.issuedAt)) p.push(C.problem("delayed-prior-not-earlier", "delayed.priorEvidenceId"));
    }
    if (!C.isTs(d.scheduledAt) || !C.isTs(d.notBefore)) p.push(C.problem("delayed-without-schedule", "delayed"));
    else if (C.isTs(fact.decidedAt) && fact.decidedAt < d.notBefore) p.push(C.problem("delayed-too-early", "delayed.notBefore"));
    C.checkVersionRef(d.schedulePolicyRef, p, "delayed.schedulePolicyRef"); knownPolicy(ctx, d.schedulePolicyRef, p, "delayed.schedulePolicyRef");
  }

  if (p.length) return C.fail(p);
  return C.ok(C.deepFreeze(C.clone(fact)));
}

const emptySnapshot = (subjectId) => ({ contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, subjectId, revision: 0, processedEvidence: [], conceptEvidence: [] });

function reduceLearningEvidence(snapshot, admittedFact, ctx) {
  const v = validateLearningEvidenceFact(admittedFact, ctx);
  if (!v.ok) return v;
  const fact = v.value;
  const snap = snapshot ? C.clone(snapshot) : emptySnapshot(fact.subjectId);
  const p = [];
  C.checkEnvelope(snap, p, "snapshot.");
  if (snap.subjectId !== fact.subjectId) p.push(C.problem("subject-mismatch", "subjectId"));
  if (!C.isCount(snap.revision)) p.push(C.problem("invalid-revision", "snapshot.revision"));
  if (p.length) return C.fail(p);

  const seen = snap.processedEvidence.find((x) => x.evidenceId === fact.evidenceId);
  if (seen) {
    if (seen.fingerprint === fact.fingerprint) return C.ok(C.deepFreeze(snap), "duplicate");
    return C.fail([C.problem("evidence-id-conflict", "evidenceId", "the same id arrived with different data")]);
  }
  const policyRef = typeof ctx?.evidencePolicyFor === "function" ? ctx.evidencePolicyFor(fact.conceptId, fact.lesson.lessonId, fact.lesson.contentVersion) : null;
  if (!policyRef) return C.fail([C.problem("no-evidence-policy", "conceptId", "no supplied evidence policy pools this content")]);
  if (!ctx.policies?.[C.refKey(policyRef)]) return C.fail([C.problem("unknown-policy-version", "evidencePolicyRef")]);

  let entry = snap.conceptEvidence.find((x) => x.conceptId === fact.conceptId && C.refKey(x.evidencePolicyRef) === C.refKey(policyRef));
  if (!entry) {
    entry = { conceptId: fact.conceptId, contentRefs: [], evidencePolicyRef: policyRef, evidenceIds: [], independentCount: 0, excludedCount: 0,
      uncertainCount: 0, roleCounts: { guided: 0, practice: 0, fresh: 0, delayed: 0 }, windowRef: ctx.windowRef ?? null, uncertainty: unknownUncertainty() };
    snap.conceptEvidence.push(entry);
  }
  const content = { id: fact.lesson.lessonId, version: String(fact.lesson.contentVersion), sha256: null };
  if (!entry.contentRefs.some((r) => C.refKey(r) === C.refKey(content))) entry.contentRefs.push(content);
  entry.evidenceIds.push(fact.evidenceId);
  entry.roleCounts[fact.role] += 1;
  if (fact.eligibility.independentLearningEvidence === true) entry.independentCount += 1;
  else if (fact.assessment.status === "uncertain") entry.uncertainCount += 1;
  else entry.excludedCount += 1;
  // Uncertainty is never invented: only a supplied method may fill it.
  if (ctx.uncertaintyMethod && typeof ctx.uncertaintyMethod.estimate === "function") {
    entry.uncertainty = { status: "estimated", methodRef: ctx.uncertaintyMethod.ref, parameters: ctx.uncertaintyMethod.estimate(C.clone(entry)), coverageRef: null };
  }
  snap.processedEvidence.push({ evidenceId: fact.evidenceId, fingerprint: fact.fingerprint });
  snap.revision += 1;
  return C.ok(C.deepFreeze(snap), "applied");
}

// suppliedVisibilityPolicy = { policyRef: VersionRef, known: true, showCounts: boolean,
//   reasonCodes(entry) -> string[] (public codes only), masteryReceipts: { [conceptId]: receiptId } }
function projectLearningEvidence(snapshot, policy) {
  const p = [];
  C.checkEnvelope(snapshot, p, "snapshot.");
  if (!policy || policy.known !== true) p.push(C.problem("unknown-visibility-policy", "policy"));
  else C.checkVersionRef(policy.policyRef, p, "policy.policyRef");
  if (p.length) return C.fail(p);
  const concepts = snapshot.conceptEvidence.map((e) => ({
    conceptId: e.conceptId,
    contentRefs: e.contentRefs.map((r) => ({ id: r.id, version: r.version, sha256: r.sha256 })),
    evidencePolicyRef: { id: e.evidencePolicyRef.id, version: e.evidencePolicyRef.version, sha256: e.evidencePolicyRef.sha256 },
    independentCount: policy.showCounts ? e.independentCount : null,
    excludedCount: policy.showCounts ? e.excludedCount : null,
    uncertainCount: policy.showCounts ? e.uncertainCount : null,
    windowRef: e.windowRef ? { kind: e.windowRef.kind, recordId: e.windowRef.recordId, recordVersion: e.windowRef.recordVersion, sourceHash: e.windowRef.sourceHash } : null,
    uncertainty: { status: e.uncertainty.status, methodRef: e.uncertainty.methodRef, parameters: e.uncertainty.parameters, coverageRef: e.uncertainty.coverageRef },
    publicReasonCodes: typeof policy.reasonCodes === "function" ? policy.reasonCodes(C.clone(e)).filter(C.isStr) : [],
    // Mastery is shown only when main committed a receipt; this module never certifies it.
    committedMasteryReceiptId: policy.masteryReceipts?.[e.conceptId] ?? null,
  }));
  return C.ok(C.deepFreeze({ contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, subjectId: snapshot.subjectId, revision: snapshot.revision, concepts }));
}

module.exports = { validateLearningEvidenceFact, reduceLearningEvidence, projectLearningEvidence, emptySnapshot };
