// Learn v1 plan and evidence modules against F52-V1-CONTRACT-1 §4 and the §11 rejection fixtures.
//   node test/v1/learn/learningEvidence.test.cjs
"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const L = require("../../../src/learn/v1/index.cjs");

const V = (id, version = "1") => ({ id, version, sha256: null });
const S = (kind, recordId) => ({ kind, recordId, recordVersion: "1", sourceHash: null });
const ENV = { contractId: L.CONTRACT_ID, schemaVersion: L.SCHEMA_VERSION };
const codes = (r) => (r.ok ? [] : r.problems.map((x) => x.code));

(async () => {
  let checks = 0;
  const check = async (name, fn) => { try { await fn(); checks += 1; } catch (e) { console.error(`FAIL ${name}`); throw e; } };

  // Real shared definition, loaded read-only through dynamic import (INTERFACE-ACK item 1).
  const lessonPath = path.join(__dirname, "../../../src/learn/lessons/pot-odds-workspace-v2.v2.mjs");
  const mod = await import(pathToFileURL(lessonPath).href);
  const def = mod.default || Object.values(mod).find((x) => x && x.id === "pot-odds-workspace-v2");
  assert.ok(def && def.id === "pot-odds-workspace-v2" && def.version === 2, "loaded pot-odds v2");
  const index = new Map([[`${def.id}@${def.version}`, def]]);
  const freshIdx = def.stages.findIndex((s) => s.spotId === "pot2-fresh");
  const guidedIdx = def.stages.findIndex((s) => s.spotId === "pot2-guided");

  const plan = () => ({
    ...ENV, plan: V("plan-pot-odds-alt"), conceptId: "t1-pot-odds",
    existingLesson: { lessonId: def.id, contentVersion: 2 }, prerequisiteConceptIds: ["t1-outs-rule-24"],
    objective: "Price = your call over the final pot; call when your chance is at least the price.",
    accessPolicyRef: V("access-inherited"),
    loop: {
      learnRefs: [S("film", "potodds-alt-river-v1")],
      decisionRefs: [{ lessonId: def.id, contentVersion: 2, stageIndex: freshIdx, spotId: "pot2-fresh" }],
      whyRefs: [S("explanation", "pot2-fresh")],
      variationRefs: [{ variation: V("var-river-pot-size"), conceptId: "t1-pot-odds", role: "fresh", sourceSpot: null,
        publicDefinitionRef: S("variation", "var-river-pot-size"), assessmentPolicyRef: null, noveltyPolicyRef: V("novelty-1"), delayedSchedulePolicyRef: null }],
      masteryEvidencePolicyRef: null,
    },
    provenance: { sourceRefs: [S("truth", "truth.json")], authoringRecordRef: S("receipt", "receipt-v1"), mathTruthRef: S("truth", "math-check"),
      assumptions: ["heads-up river", "all-in"], mediaRefs: [], rightsRefs: [], verificationRefs: [], acceptanceRef: null },
    format: { storyboardRef: S("doc", "storyboard-v1"), transcriptRef: null, captionsRef: null, accessibilityRef: null },
  });

  await check("a well-formed plan against the real definition validates and comes back frozen", () => {
    const r = L.validateLearningPlan(plan(), index);
    assert.ok(r.ok, JSON.stringify(r.problems));
    assert.ok(Object.isFrozen(r.value) && Object.isFrozen(r.value.loop.decisionRefs));
  });
  await check("plan: unknown contract version, unknown lesson version, concept mismatch", () => {
    assert.ok(codes(L.validateLearningPlan({ ...plan(), schemaVersion: 2 }, index)).includes("unknown-schema-version"));
    assert.ok(codes(L.validateLearningPlan({ ...plan(), existingLesson: { lessonId: def.id, contentVersion: 9 } }, index)).includes("unknown-lesson-version"));
    assert.ok(codes(L.validateLearningPlan({ ...plan(), conceptId: "t1-ev" }, index)).includes("concept-mismatch"));
  });
  await check("plan: an answer key or correct-action marker anywhere is rejected", () => {
    const p = plan(); p.loop.whyRefs[0].answerKey = "call";
    assert.ok(codes(L.validateLearningPlan(p, index)).includes("private-field"));
    const q = plan(); q.loop.variationRefs[0].correctAction = "fold";
    assert.ok(codes(L.validateLearningPlan(q, index)).includes("private-field"));
  });
  await check("plan: a decision ref must point at the real stage; a fresh variation needs a novelty policy", () => {
    const p = plan(); p.loop.decisionRefs[0].stageIndex = guidedIdx;
    assert.ok(codes(L.validateLearningPlan(p, index)).includes("spot-not-at-stage"));
    const q = plan(); q.loop.variationRefs[0].noveltyPolicyRef = null;
    assert.ok(codes(L.validateLearningPlan(q, index)).includes("fresh-needs-novelty-policy"));
  });
  await check("plan: a variation cannot rename an existing stage's role; media needs rights; provenance is required", () => {
    const p = plan(); p.loop.variationRefs[0].sourceSpot = { lessonId: def.id, contentVersion: 2, stageIndex: guidedIdx, spotId: "pot2-guided" };
    assert.ok(codes(L.validateLearningPlan(p, index)).includes("role-rename"));
    const q = plan(); q.provenance.mediaRefs = [S("film", "x")];
    assert.ok(codes(L.validateLearningPlan(q, index)).includes("media-without-rights"));
    const r = plan(); r.provenance.sourceRefs = [];
    assert.ok(codes(L.validateLearningPlan(r, index)).includes("missing-provenance"));
  });

  // ── evidence
  const POL = { exposure: V("exposure-1"), scoring: V("scoring-1"), elig: V("elig-1"), schedule: V("sched-1"), ev: V("evidence-pot-odds-1") };
  const ctx = (over = {}) => ({
    policies: Object.fromEntries(Object.values(POL).map((r) => [`${r.id}@${r.version}`, true])),
    evidencePolicyFor: (concept, lessonId) => (concept === "t1-pot-odds" && lessonId === def.id ? POL.ev : null),
    priorEvidence: () => null, ...over,
  });
  const fact = (over = {}) => {
    const f = {
      ...ENV, evidenceId: "ev-1", fingerprint: "", subjectId: "user-1", source: S("lessonRunAttempt", "att-1"),
      lesson: { lessonId: def.id, contentVersion: 2 }, run: { runId: "run-1", revision: 3 },
      spot: { lessonId: def.id, contentVersion: 2, stageIndex: freshIdx, spotId: "pot2-fresh" }, variation: null,
      conceptId: "t1-pot-odds", role: "fresh", issuedAt: "2026-10-06T10:00:00Z", decidedAt: "2026-10-06T10:00:20Z", recordedAt: "2026-10-06T10:00:21Z",
      assessment: { status: "supported", correct: true, score: 1, scoringPolicyRef: POL.scoring },
      exposure: { priorIssuances: 0, priorAnswers: 0, hintBeforeDecision: false, solutionViewedBeforeDecision: false, materialPreviouslyViewed: false,
        assisted: false, repeated: false, noveltyVerified: true, exposurePolicyRef: POL.exposure },
      delayed: { priorEvidenceId: null, scheduledAt: null, notBefore: null, schedulePolicyRef: null },
      eligibility: { independentLearningEvidence: true, competitiveEvidence: false, reasonCodes: ["first-try-fresh"], policyRef: POL.elig },
    };
    const merged = JSON.parse(JSON.stringify({ ...f, ...over }));
    for (const k of ["exposure", "eligibility", "assessment", "delayed"]) if (over[k]) merged[k] = { ...f[k], ...over[k] };
    merged.fingerprint = L.fingerprintOf(merged);
    return merged;
  };

  await check("a clean first-try fresh fact validates", () => { const r = L.validateLearningEvidenceFact(fact(), ctx()); assert.ok(r.ok, JSON.stringify(r.problems)); });
  await check("hinted, repeated, viewed or unknown exposure cannot be independent evidence", () => {
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ exposure: { hintBeforeDecision: true } }), ctx())).includes("assisted-claimed-independent"));
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ exposure: { repeated: true } }), ctx())).includes("assisted-claimed-independent"));
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ exposure: { materialPreviouslyViewed: true } }), ctx())).includes("assisted-claimed-independent"));
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ exposure: { solutionViewedBeforeDecision: null } }), ctx())).includes("unknown-exposure-claimed-independent"));
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ exposure: { noveltyVerified: null } }), ctx())).includes("novelty-unverified-claimed-independent"));
    // The same hinted attempt is fine when it is not claimed as independent.
    assert.ok(L.validateLearningEvidenceFact(fact({ exposure: { hintBeforeDecision: true }, eligibility: { independentLearningEvidence: false } }), ctx()).ok);
  });
  await check("guided/practice roles and unassessable results cannot be independent", () => {
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ role: "guided" }), ctx())).includes("role-not-independent"));
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ assessment: { status: "unassessable", correct: null, score: null } }), ctx())).includes("unsupported-claimed-independent"));
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ assessment: { status: "unassessable", correct: true } }), ctx())).includes("unassessable-has-result"));
  });
  await check("teaching evidence is never competitive evidence", () => {
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ eligibility: { competitiveEvidence: true } }), ctx())).includes("competitive-not-admissible"));
  });
  await check("unknown policy versions, bad timestamps, tampered payloads and unknown fields fail closed", () => {
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ exposure: { exposurePolicyRef: V("exposure-1", "9") } }), ctx())).includes("unknown-policy-version"));
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ decidedAt: "2026-10-06 10:00" }), ctx())).includes("invalid-timestamp"));
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ decidedAt: "2026-10-06T09:00:00Z" }), ctx())).includes("timestamps-out-of-order"));
    const t = fact(); t.assessment.correct = false;
    assert.ok(codes(L.validateLearningEvidenceFact(t, ctx())).includes("fingerprint-mismatch"));
    const u = fact(); u.authority = "server"; u.fingerprint = L.fingerprintOf(u);
    assert.ok(codes(L.validateLearningEvidenceFact(u, ctx())).includes("unknown-field"), "a client cannot add an authority claim");
    const k = fact(); k.opponentCards = ["As", "Kd"]; k.fingerprint = L.fingerprintOf(k);
    assert.ok(codes(L.validateLearningEvidenceFact(k, ctx())).includes("private-field"));
  });
  await check("delayed evidence needs an admitted earlier fact for the same subject and concept, and a satisfied schedule", () => {
    const d = { role: "delayed", issuedAt: "2026-10-09T10:00:00Z", decidedAt: "2026-10-09T10:00:30Z", recordedAt: "2026-10-09T10:00:31Z",
      delayed: { priorEvidenceId: "ev-1", scheduledAt: "2026-10-09T00:00:00Z", notBefore: "2026-10-09T00:00:00Z", schedulePolicyRef: POL.schedule } };
    assert.ok(codes(L.validateLearningEvidenceFact(fact(d), ctx())).includes("delayed-without-admitted-prior"));
    const prior = { subjectId: "user-1", conceptId: "t1-pot-odds", recordedAt: "2026-10-06T10:00:21Z" };
    assert.ok(L.validateLearningEvidenceFact(fact(d), ctx({ priorEvidence: (id) => (id === "ev-1" ? prior : null) })).ok);
    assert.ok(codes(L.validateLearningEvidenceFact(fact({ ...d, delayed: { ...d.delayed, notBefore: "2026-10-10T00:00:00Z" } }), ctx({ priorEvidence: () => prior }))).includes("delayed-too-early"));
    assert.ok(codes(L.validateLearningEvidenceFact(fact(d), ctx({ priorEvidence: () => ({ ...prior, subjectId: "user-2" }) }))).includes("delayed-prior-mismatch"));
  });
  await check("reducer: applied, duplicate replay, conflicting reuse, subject mismatch, missing policy", () => {
    const a = L.reduceLearningEvidence(null, fact(), ctx());
    assert.equal(a.disposition, "applied"); assert.equal(a.value.revision, 1);
    assert.equal(a.value.conceptEvidence[0].independentCount, 1);
    assert.equal(a.value.conceptEvidence[0].uncertainty.status, "unknown", "no invented uncertainty");
    const again = L.reduceLearningEvidence(a.value, fact(), ctx());
    assert.equal(again.disposition, "duplicate"); assert.equal(again.value.revision, 1);
    assert.ok(codes(L.reduceLearningEvidence(a.value, fact({ assessment: { correct: false } }), ctx())).includes("evidence-id-conflict"));
    assert.ok(codes(L.reduceLearningEvidence(a.value, fact({ evidenceId: "ev-9", subjectId: "user-2" }), ctx())).includes("subject-mismatch"));
    assert.ok(codes(L.reduceLearningEvidence(null, fact(), ctx({ evidencePolicyFor: () => null }))).includes("no-evidence-policy"));
  });
  await check("reducer: excluded and uncertain facts count separately; roles are tallied; input is not mutated", () => {
    let s = L.reduceLearningEvidence(null, fact(), ctx()).value;
    const before = JSON.stringify(s);
    s = L.reduceLearningEvidence(s, fact({ evidenceId: "ev-2", role: "guided", eligibility: { independentLearningEvidence: false } }), ctx()).value;
    s = L.reduceLearningEvidence(s, fact({ evidenceId: "ev-3", role: "practice", assessment: { status: "uncertain", correct: null, score: null }, eligibility: { independentLearningEvidence: false } }), ctx()).value;
    const e = s.conceptEvidence[0];
    assert.deepEqual([e.independentCount, e.excludedCount, e.uncertainCount], [1, 1, 1]);
    assert.deepEqual(e.roleCounts, { guided: 1, practice: 1, fresh: 1, delayed: 0 });
    assert.equal(s.revision, 3);
    assert.equal(JSON.stringify(L.reduceLearningEvidence(null, fact(), ctx()).value), before);
  });
  await check("projection is an allowlist: no evidence ids or fingerprints, counts only by policy, mastery only from a receipt", () => {
    const s = L.reduceLearningEvidence(null, fact(), ctx()).value;
    const vis = { policyRef: V("vis-1"), known: true, showCounts: false, reasonCodes: () => ["supported-attempts"], masteryReceipts: {} };
    const pub = L.projectLearningEvidence(s, vis).value;
    const txt = JSON.stringify(pub);
    assert.ok(!txt.includes("ev-1") && !txt.includes(s.processedEvidence[0].fingerprint) && !txt.includes("evidenceIds"));
    assert.equal(pub.concepts[0].independentCount, null);
    assert.equal(pub.concepts[0].committedMasteryReceiptId, null);
    const shown = L.projectLearningEvidence(s, { ...vis, showCounts: true, masteryReceipts: { "t1-pot-odds": "mr-77" } }).value;
    assert.equal(shown.concepts[0].independentCount, 1); assert.equal(shown.concepts[0].committedMasteryReceiptId, "mr-77");
    assert.ok(codes(L.projectLearningEvidence(s, { known: false })).includes("unknown-visibility-policy"));
  });

  console.log(`learningEvidence: ${checks} checks passed`);
})().catch((e) => { console.error(e); process.exit(1); });
