"use strict";
// Research rating candidates (F52-V1-CONTRACT-1 §6). RESEARCH ONLY: there are no production defaults,
// no accepted weights and no fallback values in this file. Every coefficient comes from an explicit
// experimental config; a missing, extra or out-of-range parameter refuses to build a model.
//
//   outcome_only_baseline               labelled comparison baseline, never the V1 update
//   joint_latent_outcome_quality        one Newton (Laplace) step on a Gaussian latent skill that sees the
//                                       outcome likelihood and per-dependence-group quality observations
//   bounded_uncertainty_shrunk_quality  outcome step plus a quality adjustment shrunk by its own
//                                       measurement uncertainty and clamped to a supplied bound
//
// Dependence (§5): each dependence group (one hand) contributes ONE quality observation, its mean, with
// the group's measurement variance not divided by its decision count, so splitting a hand into more
// decisions cannot add independent weight.

const C = require("./common.cjs");
const { problem, ok, fail, isObj, isNum } = C;

const CANDIDATES = ["outcome_only_baseline", "joint_latent_outcome_quality", "bounded_uncertainty_shrunk_quality"];

const positive = (v) => isNum(v) && v > 0;
const finite = (v) => isNum(v);
const scores = (v) => isObj(v) && Object.keys(v).length === 3 && ["win", "tie", "loss"].every((k) => isNum(v[k]))
  && v.win > v.tie && v.tie > v.loss;

// Parameter schemas: the KEYS and admissible ranges only. No value is chosen here.
const PARAMETER_SCHEMAS = {
  outcome_only_baseline: { logisticScale: positive, stepSize: positive, outcomeScores: scores },
  joint_latent_outcome_quality: { logisticScale: positive, outcomeScores: scores, qualityLoading: finite,
    qualityIntercept: finite, qualityNoiseVariance: positive, varianceFloor: positive },
  bounded_uncertainty_shrunk_quality: { logisticScale: positive, stepSize: positive, outcomeScores: scores,
    qualityGain: finite, qualityReference: finite, priorQualityVariance: positive, adjustmentBound: positive },
};
const USES_QUALITY = { outcome_only_baseline: false, joint_latent_outcome_quality: true, bounded_uncertainty_shrunk_quality: true };
const NEEDS_VARIANCE = { outcome_only_baseline: false, joint_latent_outcome_quality: true, bounded_uncertainty_shrunk_quality: false };

// validateCandidateConfig(config) -> Result<config>
function validateCandidateConfig(config) {
  const problems = [];
  if (!isObj(config)) return fail([problem("POLICY_UNSELECTED", "config", "no experimental configuration supplied")]);
  C.closedKeys(config, ["candidate", "experimental", "configId", "parameterSchemaRef", "uncertaintyMethodRef",
    "assessmentUncertaintyMethodRef", "qualitySemanticsRef", "evaluatorRefs", "parameters"], problems, "config.");
  if (!CANDIDATES.includes(config.candidate)) problems.push(problem("unknown-candidate", "config.candidate"));
  if (config.experimental !== true) problems.push(problem("not-experimental", "config.experimental", "research candidates run only under an explicitly experimental config"));
  C.checkVersionRef(config.configId, problems, "config.configId");
  C.checkVersionRef(config.parameterSchemaRef, problems, "config.parameterSchemaRef");
  C.checkVersionRef(config.uncertaintyMethodRef, problems, "config.uncertaintyMethodRef");
  const q = USES_QUALITY[config.candidate];
  if (q) {
    C.checkVersionRef(config.assessmentUncertaintyMethodRef, problems, "config.assessmentUncertaintyMethodRef");
    C.checkVersionRef(config.qualitySemanticsRef, problems, "config.qualitySemanticsRef");
    if (!Array.isArray(config.evaluatorRefs) || config.evaluatorRefs.length === 0 || !config.evaluatorRefs.every(C.isVersionRef)) {
      problems.push(problem("POLICY_INCOMPLETE", "config.evaluatorRefs"));
    }
  } else if (CANDIDATES.includes(config.candidate)) {
    for (const k of ["assessmentUncertaintyMethodRef", "qualitySemanticsRef"]) if (config[k] !== null) problems.push(problem("baseline-takes-no-quality", `config.${k}`));
    if (!Array.isArray(config.evaluatorRefs) || config.evaluatorRefs.length !== 0) problems.push(problem("baseline-takes-no-quality", "config.evaluatorRefs"));
  }
  if (!isObj(config.parameters)) problems.push(problem("POLICY_INCOMPLETE", "config.parameters", "parameters are required; none are defaulted"));
  else if (CANDIDATES.includes(config.candidate)) {
    const schema = PARAMETER_SCHEMAS[config.candidate];
    for (const k of Object.keys(schema)) {
      if (!(k in config.parameters)) problems.push(problem("POLICY_INCOMPLETE", `config.parameters.${k}`, "missing parameter; no default exists"));
      else if (!schema[k](config.parameters[k])) problems.push(problem("parameter-out-of-range", `config.parameters.${k}`));
    }
    for (const k of Object.keys(config.parameters)) if (!(k in schema)) problems.push(problem("unknown-parameter", `config.parameters.${k}`));
  }
  if (problems.length) return fail(problems);
  return ok(C.deepFreeze(C.clone(config)));
}

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const outcomeScore = (outcome, subjectId, s) => (outcome.kind === "tie" ? s.tie : outcome.winnerSubjectId === subjectId ? s.win : s.loss);

// Group summaries: one observation per dependence group (mean of its supported decision values; the
// group variance is the mean of its decision variances, deliberately NOT divided by the count).
function groupSummaries(groups, methodRef) {
  const out = [];
  for (const g of groups) {
    if (!g.values.length) continue;
    const vars = g.uncertainties.map((u) => (u && u.status === "estimated" && C.sameRef(u.methodRef, methodRef) && isNum(u.parameters && u.parameters.variance)
      && u.parameters.variance >= 0 ? u.parameters.variance : null));
    if (vars.some((v) => v === null)) return { error: problem("assessment-uncertainty-method-mismatch", `quality.${g.groupId}`) };
    out.push({ groupId: g.groupId, mean: g.values.reduce((a, b) => a + b, 0) / g.values.length,
      variance: vars.reduce((a, b) => a + b, 0) / vars.length, decisions: g.values.length });
  }
  return { groups: out };
}

function priorOf(p, cfg, needVariance) {
  if (!isNum(p.estimate)) return { error: problem("RATING_PRIOR_UNKNOWN", `participants.${p.subjectId}.estimate`, "carryover/initial rating is main's policy") };
  if (!needVariance) return { mean: p.estimate, variance: null };
  const u = p.uncertainty;
  if (!u || u.status !== "estimated" || !C.sameRef(u.methodRef, cfg.uncertaintyMethodRef) || !positive(u.parameters && u.parameters.variance)) {
    return { error: problem("RATING_UNCERTAINTY_UNKNOWN", `participants.${p.subjectId}.uncertainty`, "prior variance under the candidate's method is required") };
  }
  return { mean: p.estimate, variance: u.parameters.variance };
}

// compute(bound) -> Result<{ participants: [...], audit }>, bound being the frozen view built by
// proposePairedRatingUpdate (or by the research harness): { outcome, participants[2], quality }.
function makeCompute(cfg) {
  const P = cfg.parameters;
  return function compute(bound) {
    const problems = [];
    const [a, b] = bound.participants;
    const priors = bound.participants.map((p) => priorOf(p, cfg, NEEDS_VARIANCE[cfg.candidate]));
    for (const pr of priors) if (pr.error) problems.push(pr.error);
    if (problems.length) return fail(problems);
    const out = [];
    const audit = { candidate: cfg.candidate, configId: cfg.configId, participants: [] };
    [a, b].forEach((p, i) => {
      const me = priors[i];
      const opp = priors[1 - i];
      const y = outcomeScore(bound.outcome, p.subjectId, P.outcomeScores);
      const expected = sigmoid((me.mean - opp.mean) / P.logisticScale);
      const q = USES_QUALITY[cfg.candidate] ? groupSummaries((bound.quality[p.subjectId] || { groups: [] }).groups, cfg.assessmentUncertaintyMethodRef) : { groups: [] };
      if (q.error) { problems.push(q.error); return; }
      let estimate; let uncertainty = C.clone(p.uncertainty); let qualityTerm = null;
      if (cfg.candidate === "outcome_only_baseline") {
        estimate = me.mean + P.stepSize * (y - expected);
      } else if (cfg.candidate === "joint_latent_outcome_quality") {
        const gradO = (y - expected) / P.logisticScale;
        const infoO = (expected * (1 - expected)) / (P.logisticScale * P.logisticScale);
        let gradQ = 0; let infoQ = 0;
        for (const g of q.groups) {
          const v = P.qualityNoiseVariance + g.variance;
          gradQ += (P.qualityLoading * (g.mean - P.qualityIntercept - P.qualityLoading * me.mean)) / v;
          infoQ += (P.qualityLoading * P.qualityLoading) / v;
        }
        const precision = 1 / me.variance + infoO + infoQ;
        estimate = me.mean + (gradO + gradQ) / precision;
        qualityTerm = gradQ / precision;
        uncertainty = { status: "estimated", methodRef: C.clone(cfg.uncertaintyMethodRef),
          parameters: { variance: Math.max(1 / precision, P.varianceFloor) }, coverageRef: null };
      } else {
        const n = q.groups.length;
        let adj = 0;
        if (n > 0) {
          const qbar = q.groups.reduce((s, g) => s + g.mean, 0) / n;
          const varQbar = q.groups.reduce((s, g) => s + g.variance, 0) / (n * n);
          const shrink = P.priorQualityVariance / (P.priorQualityVariance + varQbar);
          adj = Math.max(-P.adjustmentBound, Math.min(P.adjustmentBound, P.qualityGain * shrink * (qbar - P.qualityReference)));
        }
        qualityTerm = adj;
        estimate = me.mean + P.stepSize * (y - expected) + adj;
      }
      if (!isNum(estimate)) { problems.push(problem("non-finite-estimate", `participants.${p.subjectId}`)); return; }
      const groupsUsed = q.groups.length;
      out.push({ subjectId: p.subjectId, estimate, uncertainty,
        publicReasonCodes: [y > expected ? "OUTCOME_ABOVE_EXPECTATION" : y < expected ? "OUTCOME_BELOW_EXPECTATION" : "OUTCOME_AT_EXPECTATION",
          ...(USES_QUALITY[cfg.candidate] ? [groupsUsed ? "DECISION_QUALITY_INCLUDED" : "DECISION_QUALITY_UNAVAILABLE"] : [])],
        privateReasonCodes: [`CANDIDATE:${cfg.candidate}`, `QUALITY_GROUPS:${groupsUsed}`] });
      audit.participants.push({ subjectId: p.subjectId, prior: me, expected, outcomeScore: y, qualityGroups: q.groups, qualityTerm, estimate });
    });
    if (problems.length) return fail(problems);
    return ok({ participants: out, audit });
  };
}

function createModel(candidate, config) {
  const v = validateCandidateConfig(config);
  if (!v.ok) return v;
  if (v.value.candidate !== candidate) return fail([problem("unknown-candidate", "config.candidate", `expected ${candidate}`)]);
  const cfg = v.value;
  return ok(Object.freeze({
    candidate, label: candidate === "outcome_only_baseline" ? "comparison-baseline" : "research-candidate", experimental: true,
    modelRef: cfg.configId, parameterSchemaRef: cfg.parameterSchemaRef, configHash: C.hashOf(cfg.parameters),
    evaluatorRefs: cfg.evaluatorRefs, qualitySemanticsRef: cfg.qualitySemanticsRef,
    uncertaintyMethodRef: cfg.uncertaintyMethodRef, assessmentUncertaintyMethodRef: cfg.assessmentUncertaintyMethodRef,
    usesQuality: USES_QUALITY[candidate], compute: makeCompute(cfg),
  }));
}
const createOutcomeOnlyBaseline = (config) => createModel("outcome_only_baseline", config);
const createJointLatentOutcomeQuality = (config) => createModel("joint_latent_outcome_quality", config);
const createBoundedUncertaintyShrunkQuality = (config) => createModel("bounded_uncertainty_shrunk_quality", config);

module.exports = { CANDIDATES, PARAMETER_SCHEMAS, validateCandidateConfig, createOutcomeOnlyBaseline,
  createJointLatentOutcomeQuality, createBoundedUncertaintyShrunkQuality };
