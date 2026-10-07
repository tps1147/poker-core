"use strict";
// validateLearningPlan (F52-V1-CONTRACT-1 §4). A plan references existing lesson definitions; it never
// renames roles, changes stage order, carries answer keys or asserts mastery. Definitions come only
// through the supplied index (INTERFACE-ACK item 1), keyed by lesson id and content version.

const C = require("./common.cjs");

const ROLES = ["guided", "practice", "fresh", "delayed"];
const PLAN_KEYS = ["contractId", "schemaVersion", "plan", "conceptId", "existingLesson", "prerequisiteConceptIds", "objective",
  "accessPolicyRef", "loop", "provenance", "format"];

const lookup = (index, lessonId, contentVersion) => {
  if (!index) return null;
  if (typeof index === "function") return index(lessonId, contentVersion) || null;
  if (typeof index.get === "function") return index.get(`${lessonId}@${contentVersion}`) || null;
  return index[`${lessonId}@${contentVersion}`] || null;
};

function checkSpotRef(ref, index, problems, path) {
  if (!C.isObj(ref) || !C.isStr(ref.lessonId) || !Number.isSafeInteger(ref.contentVersion) || !C.isCount(ref.stageIndex) || !C.isStr(ref.spotId)) {
    problems.push(C.problem("invalid-spot-ref", path));
    return null;
  }
  const def = lookup(index, ref.lessonId, ref.contentVersion);
  if (!def) { problems.push(C.problem("unknown-lesson-version", path, `${ref.lessonId}@${ref.contentVersion} is not in the supplied index`)); return null; }
  const stage = def.stages?.[ref.stageIndex];
  if (!stage || stage.spotId !== ref.spotId) { problems.push(C.problem("spot-not-at-stage", path, `${ref.spotId} is not stage ${ref.stageIndex}`)); return null; }
  return { def, stage };
}

function validateLearningPlan(plan, suppliedDefinitionIndex) {
  const p = [];
  C.checkEnvelope(plan, p);
  if (!C.isObj(plan)) return C.fail(p);
  C.closedKeys(plan, PLAN_KEYS, p);
  C.scanPrivate(plan, p);
  C.checkVersionRef(plan.plan, p, "plan");
  C.checkVersionRef(plan.accessPolicyRef, p, "accessPolicyRef");
  if (!C.isStr(plan.conceptId)) p.push(C.problem("invalid-concept", "conceptId"));
  if (!C.isStr(plan.objective)) p.push(C.problem("missing-objective", "objective"));
  if (!Array.isArray(plan.prerequisiteConceptIds) || !plan.prerequisiteConceptIds.every(C.isStr)) p.push(C.problem("invalid-prerequisites", "prerequisiteConceptIds"));
  else if (plan.prerequisiteConceptIds.includes(plan.conceptId)) p.push(C.problem("self-prerequisite", "prerequisiteConceptIds"));

  const lesson = plan.existingLesson;
  let def = null;
  if (!C.isObj(lesson) || !C.isStr(lesson.lessonId) || !Number.isSafeInteger(lesson.contentVersion)) p.push(C.problem("invalid-existing-lesson", "existingLesson"));
  else {
    def = lookup(suppliedDefinitionIndex, lesson.lessonId, lesson.contentVersion);
    if (!def) p.push(C.problem("unknown-lesson-version", "existingLesson", "the supplied index has no such definition"));
    else if (def.conceptId !== plan.conceptId) p.push(C.problem("concept-mismatch", "conceptId", `definition teaches ${def.conceptId}`));
  }

  const loop = plan.loop;
  if (!C.isObj(loop)) p.push(C.problem("missing-loop", "loop"));
  else {
    for (const k of ["learnRefs", "whyRefs"]) {
      if (!Array.isArray(loop[k])) p.push(C.problem("invalid-loop-refs", `loop.${k}`));
      else loop[k].forEach((r, i) => C.checkSourceRef(r, p, `loop.${k}[${i}]`));
    }
    if (!Array.isArray(loop.decisionRefs)) p.push(C.problem("invalid-loop-refs", "loop.decisionRefs"));
    else loop.decisionRefs.forEach((r, i) => {
      const hit = checkSpotRef(r, suppliedDefinitionIndex, p, `loop.decisionRefs[${i}]`);
      if (hit && hit.stage.kind !== "decision") p.push(C.problem("not-a-decision-stage", `loop.decisionRefs[${i}]`));
    });
    if (!Array.isArray(loop.variationRefs)) p.push(C.problem("invalid-loop-refs", "loop.variationRefs"));
    else loop.variationRefs.forEach((v, i) => {
      const path = `loop.variationRefs[${i}]`;
      if (!C.isObj(v)) { p.push(C.problem("invalid-variation", path)); return; }
      C.checkVersionRef(v.variation, p, `${path}.variation`);
      if (!ROLES.includes(v.role)) p.push(C.problem("unknown-role", `${path}.role`));
      if (v.conceptId !== plan.conceptId) p.push(C.problem("concept-mismatch", `${path}.conceptId`));
      C.checkSourceRef(v.publicDefinitionRef, p, `${path}.publicDefinitionRef`);
      for (const k of ["assessmentPolicyRef", "noveltyPolicyRef", "delayedSchedulePolicyRef"]) C.checkVersionRef(v[k], p, `${path}.${k}`, { nullable: true });
      if (v.role === "fresh" && !v.noveltyPolicyRef) p.push(C.problem("fresh-needs-novelty-policy", `${path}.noveltyPolicyRef`));
      if (v.role === "delayed" && !v.delayedSchedulePolicyRef) p.push(C.problem("delayed-needs-schedule-policy", `${path}.delayedSchedulePolicyRef`));
      if (v.sourceSpot !== null && v.sourceSpot !== undefined) {
        const hit = checkSpotRef(v.sourceSpot, suppliedDefinitionIndex, p, `${path}.sourceSpot`);
        // A plan never renames an existing stage's role (§4).
        if (hit && hit.stage.role && hit.stage.role !== v.role) p.push(C.problem("role-rename", `${path}.role`, `stage role is ${hit.stage.role}`));
      }
    });
    C.checkVersionRef(loop.masteryEvidencePolicyRef ?? null, p, "loop.masteryEvidencePolicyRef", { nullable: true });
  }

  const pv = plan.provenance;
  if (!C.isObj(pv)) p.push(C.problem("missing-provenance", "provenance"));
  else {
    if (!Array.isArray(pv.sourceRefs) || pv.sourceRefs.length === 0) p.push(C.problem("missing-provenance", "provenance.sourceRefs"));
    else pv.sourceRefs.forEach((r, i) => C.checkSourceRef(r, p, `provenance.sourceRefs[${i}]`));
    C.checkSourceRef(pv.authoringRecordRef, p, "provenance.authoringRecordRef");
    C.checkSourceRef(pv.mathTruthRef, p, "provenance.mathTruthRef");
    if (!Array.isArray(pv.assumptions)) p.push(C.problem("missing-provenance", "provenance.assumptions"));
    for (const k of ["mediaRefs", "rightsRefs", "verificationRefs"]) {
      if (!Array.isArray(pv[k])) p.push(C.problem("missing-provenance", `provenance.${k}`));
      else pv[k].forEach((r, i) => C.checkSourceRef(r, p, `provenance.${k}[${i}]`));
    }
    if (Array.isArray(pv.mediaRefs) && pv.mediaRefs.length && (!Array.isArray(pv.rightsRefs) || !pv.rightsRefs.length)) p.push(C.problem("media-without-rights", "provenance.rightsRefs"));
    C.checkSourceRef(pv.acceptanceRef ?? null, p, "provenance.acceptanceRef", { nullable: true });
  }
  const fm = plan.format;
  if (!C.isObj(fm)) p.push(C.problem("missing-format", "format"));
  else for (const k of ["storyboardRef", "transcriptRef", "captionsRef", "accessibilityRef"]) C.checkSourceRef(fm[k] ?? null, p, `format.${k}`, { nullable: true });

  if (p.length) return C.fail(p);
  return C.ok(C.deepFreeze(C.clone(plan)));
}

module.exports = { validateLearningPlan, ROLES };
