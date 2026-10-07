"use strict";
// §5 private decision-time evidence and quality evaluation (F52-V1-CONTRACT-1).
// PrivateDecisionEvidence is a CLOSED type: any field outside the contract (opponent hole cards,
// future board, final winner, later observations, client legal-action lists...) is rejected, and the
// evaluator only ever receives a frozen copy rebuilt field by field from the allowlist below.
// Pure: no I/O, clock or randomness. Main owns upstream extraction from server state.

const C = require("./common.cjs");
const { problem, ok, fail, isObj, isStr, isNum, isCount, isTs } = C;

const STREETS = ["preflop", "flop", "turn", "river"];
const KINDS = ["human", "ai_persona"];
const COMPLETENESS = ["complete", "partial", "unassessable"];
const STATUSES = ["supported", "uncertain", "unassessable"];
const STATUS_RANK = { unassessable: 0, uncertain: 1, supported: 2 };

const EVIDENCE_KEYS = ["contractId", "schemaVersion", "evidenceId", "fingerprint", "source", "subjectId", "matchId", "handId",
  "actionOrdinal", "formatRef", "opponentId", "participantKind", "opponentKind", "opponentPolicyRef", "extractorRef",
  "visibilityPolicyRef", "observedAt", "informationSet", "chosenAction", "opponentModel", "completeness"];
const INFOSET_KEYS = ["street", "ownCards", "visibleBoardCards", "position", "publicStacks", "publicCommitments",
  "potBeforeAction", "amountToCall", "blinds", "legalActions", "publicActionPrefix"];
const ASSESSMENT_KEYS = ["contractId", "schemaVersion", "assessmentId", "evidenceId", "evidenceFingerprint", "evaluatorRef",
  "opponentPolicyRef", "calibrationRef", "status", "actionValues", "chosenActionAssessment", "dependenceGroupId",
  "privateReasonCodes", "executionRef"];

// One hand's outcome and all of its decisions share one dependence group (§5). Derived from the
// bound match/hand ids, never chosen by an evaluator.
const dependenceGroupFor = (ev) => `hand:${ev.matchId}:${ev.handId}`;

// ---------------------------------------------------------------- version context
// Supplied by main: which format/extractor/visibility/amount-semantics versions are admitted, and the
// format geometry (card alphabet, hole cards, board cards per street). No format is assumed here.
function checkVersionContext(ctx, problems, path = "versionContext") {
  if (!isObj(ctx)) { problems.push(problem("POLICY_UNSELECTED", path, "no supplied decision version context")); return false; }
  for (const k of ["formatRefs", "extractorRefs", "visibilityPolicyRefs", "amountSemanticsRefs"]) {
    if (!Array.isArray(ctx[k]) || ctx[k].length === 0 || !ctx[k].every(C.isVersionRef)) problems.push(problem("POLICY_INCOMPLETE", `${path}.${k}`));
  }
  const g = ctx.formatGeometry;
  if (!isObj(g) || !isStr(g.ranks) || !isStr(g.suits) || !isCount(g.holeCards) || !isObj(g.boardCardsByStreet)
    || !STREETS.every((s) => isCount(g.boardCardsByStreet[s]))) {
    problems.push(problem("POLICY_INCOMPLETE", `${path}.formatGeometry`));
  }
  return problems.length === 0;
}

function checkCard(card, geometry, problems, path) {
  if (!isObj(card) || Object.keys(card).some((k) => !["rank", "suit"].includes(k)) || !isStr(card.rank) || !isStr(card.suit)
    || card.rank.length !== 1 || card.suit.length !== 1 || !geometry.ranks.includes(card.rank) || !geometry.suits.includes(card.suit)) {
    problems.push(problem("invalid-card", path));
    return null;
  }
  return `${card.rank}${card.suit}`;
}

function checkChipRows(rows, ids, problems, path) {
  if (!Array.isArray(rows)) { problems.push(problem("invalid-chip-rows", path)); return; }
  const seen = new Set();
  rows.forEach((r, i) => {
    if (!isObj(r) || Object.keys(r).some((k) => !["participantId", "chips"].includes(k)) || !isStr(r.participantId) || !isNum(r.chips) || r.chips < 0) {
      problems.push(problem("invalid-chip-row", `${path}[${i}]`));
      return;
    }
    if (seen.has(r.participantId)) problems.push(problem("duplicate-participant-row", `${path}[${i}]`));
    seen.add(r.participantId);
    if (!ids.includes(r.participantId)) problems.push(problem("unbound-participant", `${path}[${i}].participantId`));
  });
  for (const id of ids) if (!seen.has(id)) problems.push(problem("missing-participant-row", path, `no row for ${id}`));
}

// validateDecisionEvidence(evidence, suppliedVersionContext) -> Result<PrivateDecisionEvidence>
function validateDecisionEvidence(evidence, suppliedVersionContext) {
  const problems = [];
  if (!checkVersionContext(suppliedVersionContext, problems)) return fail(problems);
  const ctx = suppliedVersionContext;
  if (!C.checkEnvelope(evidence, problems)) return fail(problems);
  C.scanPrivate(evidence, problems);
  C.closedKeys(evidence, EVIDENCE_KEYS, problems);
  C.requireKeys(evidence, EVIDENCE_KEYS, problems);
  for (const k of ["evidenceId", "subjectId", "matchId", "handId", "opponentId"]) if (!isStr(evidence[k])) problems.push(problem("invalid-id", k));
  if (evidence.subjectId === evidence.opponentId) problems.push(problem("participant-mismatch", "opponentId", "subject and opponent must differ"));
  if (!isCount(evidence.actionOrdinal)) problems.push(problem("invalid-ordinal", "actionOrdinal"));
  if (!isTs(evidence.observedAt)) problems.push(problem("invalid-timestamp", "observedAt"));
  C.checkSourceRef(evidence.source, problems, "source");
  for (const k of ["formatRef", "extractorRef", "visibilityPolicyRef"]) C.checkVersionRef(evidence[k], problems, k);
  C.checkVersionRef(evidence.opponentPolicyRef, problems, "opponentPolicyRef", { nullable: true });
  if (!KINDS.includes(evidence.participantKind)) problems.push(problem("invalid-kind", "participantKind"));
  if (!KINDS.includes(evidence.opponentKind)) problems.push(problem("invalid-kind", "opponentKind"));
  if (evidence.opponentKind === "ai_persona" && evidence.opponentPolicyRef === null) {
    problems.push(problem("opponent-policy-required", "opponentPolicyRef", "an AI persona opponent names its versioned policy"));
  }
  if (problems.length) return fail(problems);

  // Unknown versions fail closed.
  if (!C.refIn(evidence.formatRef, ctx.formatRefs)) problems.push(problem("unknown-version", "formatRef"));
  if (!C.refIn(evidence.extractorRef, ctx.extractorRefs)) problems.push(problem("unknown-version", "extractorRef"));
  if (!C.refIn(evidence.visibilityPolicyRef, ctx.visibilityPolicyRefs)) problems.push(problem("unknown-version", "visibilityPolicyRef"));
  if (Array.isArray(ctx.opponentPolicyRefs) && evidence.opponentPolicyRef !== null && !C.refIn(evidence.opponentPolicyRef, ctx.opponentPolicyRefs)) {
    problems.push(problem("unknown-version", "opponentPolicyRef"));
  }
  if (evidence.fingerprint !== C.fingerprintOf(evidence)) problems.push(problem("FINGERPRINT_MISMATCH", "fingerprint"));

  const is = evidence.informationSet;
  const g = ctx.formatGeometry;
  if (!isObj(is)) problems.push(problem("invalid-information-set", "informationSet"));
  else {
    C.closedKeys(is, INFOSET_KEYS, problems, "informationSet.");
    C.requireKeys(is, INFOSET_KEYS, problems, "informationSet.");
    if (!STREETS.includes(is.street)) problems.push(problem("invalid-street", "informationSet.street"));
    const seen = new Set();
    const cards = (list, path, n) => {
      if (!Array.isArray(list) || (n !== null && list.length !== n)) { problems.push(problem("invalid-card-count", path)); return; }
      list.forEach((c, i) => {
        const key = checkCard(c, g, problems, `${path}[${i}]`);
        if (key && seen.has(key)) problems.push(problem("duplicate-card", `${path}[${i}]`));
        if (key) seen.add(key);
      });
    };
    cards(is.ownCards, "informationSet.ownCards", g.holeCards);
    cards(is.visibleBoardCards, "informationSet.visibleBoardCards", STREETS.includes(is.street) ? g.boardCardsByStreet[is.street] : null);
    if (!isStr(is.position)) problems.push(problem("invalid-position", "informationSet.position"));
    const ids = [evidence.subjectId, evidence.opponentId];
    checkChipRows(is.publicStacks, ids, problems, "informationSet.publicStacks");
    checkChipRows(is.publicCommitments, ids, problems, "informationSet.publicCommitments");
    if (!isNum(is.potBeforeAction) || is.potBeforeAction < 0) problems.push(problem("invalid-amount", "informationSet.potBeforeAction"));
    if (!isNum(is.amountToCall) || is.amountToCall < 0) problems.push(problem("invalid-amount", "informationSet.amountToCall"));
    if (!isObj(is.blinds) || Object.keys(is.blinds).some((k) => !["smallBlind", "bigBlind"].includes(k))
      || !isNum(is.blinds.smallBlind) || !isNum(is.blinds.bigBlind) || is.blinds.smallBlind <= 0 || is.blinds.bigBlind < is.blinds.smallBlind) {
      problems.push(problem("invalid-blinds", "informationSet.blinds"));
    }
    if (!Array.isArray(is.legalActions) || is.legalActions.length === 0) problems.push(problem("invalid-legal-actions", "informationSet.legalActions"));
    else {
      const names = new Set();
      is.legalActions.forEach((a, i) => {
        const p = `informationSet.legalActions[${i}]`;
        if (!isObj(a)) { problems.push(problem("invalid-legal-action", p)); return; }
        C.closedKeys(a, ["action", "minimumAmount", "maximumAmount", "amountSemanticsRef"], problems, `${p}.`);
        if (!isStr(a.action)) problems.push(problem("invalid-legal-action", `${p}.action`));
        if (names.has(a.action)) problems.push(problem("duplicate-legal-action", `${p}.action`));
        names.add(a.action);
        for (const k of ["minimumAmount", "maximumAmount"]) if (!(a[k] === null || (isNum(a[k]) && a[k] >= 0))) problems.push(problem("invalid-amount", `${p}.${k}`));
        if (isNum(a.minimumAmount) && isNum(a.maximumAmount) && a.minimumAmount > a.maximumAmount) problems.push(problem("invalid-amount-range", p));
        if (C.checkVersionRef(a.amountSemanticsRef, problems, `${p}.amountSemanticsRef`) && !C.refIn(a.amountSemanticsRef, ctx.amountSemanticsRefs)) {
          problems.push(problem("unknown-version", `${p}.amountSemanticsRef`));
        }
      });
    }
    if (!Array.isArray(is.publicActionPrefix)) problems.push(problem("invalid-action-prefix", "informationSet.publicActionPrefix"));
    else {
      let last = -1;
      is.publicActionPrefix.forEach((a, i) => {
        const p = `informationSet.publicActionPrefix[${i}]`;
        if (!isObj(a)) { problems.push(problem("invalid-prefix-entry", p)); return; }
        C.closedKeys(a, ["ordinal", "participantId", "street", "action", "amount"], problems, `${p}.`);
        if (!isCount(a.ordinal) || a.ordinal <= last) problems.push(problem("prefix-order", `${p}.ordinal`));
        else last = a.ordinal;
        if (isCount(a.ordinal) && isCount(evidence.actionOrdinal) && a.ordinal >= evidence.actionOrdinal) {
          problems.push(problem("future-action-in-prefix", `${p}.ordinal`, "only actions before this decision are visible"));
        }
        if (![evidence.subjectId, evidence.opponentId].includes(a.participantId)) problems.push(problem("unbound-participant", `${p}.participantId`));
        if (!STREETS.includes(a.street) || STREETS.indexOf(a.street) > STREETS.indexOf(is.street)) problems.push(problem("future-street-in-prefix", `${p}.street`));
        if (!isStr(a.action)) problems.push(problem("invalid-prefix-entry", `${p}.action`));
        if (!(a.amount === null || (isNum(a.amount) && a.amount >= 0))) problems.push(problem("invalid-amount", `${p}.amount`));
      });
    }
  }
  const ca = evidence.chosenAction;
  if (!isObj(ca) || Object.keys(ca).some((k) => !["action", "amount"].includes(k)) || !isStr(ca.action) || !(ca.amount === null || isNum(ca.amount))) {
    problems.push(problem("invalid-chosen-action", "chosenAction"));
  } else if (isObj(is) && Array.isArray(is.legalActions)) {
    const legal = is.legalActions.find((a) => isObj(a) && a.action === ca.action);
    if (!legal) problems.push(problem("illegal-chosen-action", "chosenAction.action"));
    else if (ca.amount !== null && ((isNum(legal.minimumAmount) && ca.amount < legal.minimumAmount) || (isNum(legal.maximumAmount) && ca.amount > legal.maximumAmount))) {
      problems.push(problem("illegal-chosen-amount", "chosenAction.amount"));
    }
  }
  const om = evidence.opponentModel;
  if (!isObj(om)) problems.push(problem("invalid-opponent-model", "opponentModel"));
  else {
    C.closedKeys(om, ["modelRef", "uncertaintyRef", "admittedDecisionTimeEvidenceRefs"], problems, "opponentModel.");
    C.checkVersionRef(om.modelRef, problems, "opponentModel.modelRef", { nullable: true });
    C.checkSourceRef(om.uncertaintyRef, problems, "opponentModel.uncertaintyRef", { nullable: true });
    if (!Array.isArray(om.admittedDecisionTimeEvidenceRefs)) problems.push(problem("invalid-source-refs", "opponentModel.admittedDecisionTimeEvidenceRefs"));
    else om.admittedDecisionTimeEvidenceRefs.forEach((r, i) => C.checkSourceRef(r, problems, `opponentModel.admittedDecisionTimeEvidenceRefs[${i}]`));
  }
  const cp = evidence.completeness;
  if (!isObj(cp) || !COMPLETENESS.includes(cp.status) || !Array.isArray(cp.missingFields) || !Array.isArray(cp.reasonCodes)
    || !cp.missingFields.every(isStr) || !cp.reasonCodes.every(isStr)) {
    problems.push(problem("invalid-completeness", "completeness"));
  } else {
    C.closedKeys(cp, ["status", "missingFields", "reasonCodes"], problems, "completeness.");
    if (cp.status === "complete" && cp.missingFields.length) problems.push(problem("completeness-contradiction", "completeness", "complete evidence lists no missing fields"));
  }
  if (problems.length) return fail(problems);
  return ok(C.deepFreeze(closedCopy(evidence)));
}

// Rebuilds the evidence field by field from the allowlist (never spread). Used for the evaluator view.
function closedCopy(ev) {
  const is = ev.informationSet;
  return {
    contractId: ev.contractId, schemaVersion: ev.schemaVersion, evidenceId: ev.evidenceId, fingerprint: ev.fingerprint,
    source: C.clone(ev.source), subjectId: ev.subjectId, matchId: ev.matchId, handId: ev.handId, actionOrdinal: ev.actionOrdinal,
    formatRef: C.clone(ev.formatRef), opponentId: ev.opponentId, participantKind: ev.participantKind, opponentKind: ev.opponentKind,
    opponentPolicyRef: C.clone(ev.opponentPolicyRef), extractorRef: C.clone(ev.extractorRef),
    visibilityPolicyRef: C.clone(ev.visibilityPolicyRef), observedAt: ev.observedAt,
    informationSet: {
      street: is.street,
      ownCards: is.ownCards.map((c) => ({ rank: c.rank, suit: c.suit })),
      visibleBoardCards: is.visibleBoardCards.map((c) => ({ rank: c.rank, suit: c.suit })),
      position: is.position,
      publicStacks: is.publicStacks.map((r) => ({ participantId: r.participantId, chips: r.chips })),
      publicCommitments: is.publicCommitments.map((r) => ({ participantId: r.participantId, chips: r.chips })),
      potBeforeAction: is.potBeforeAction, amountToCall: is.amountToCall,
      blinds: { smallBlind: is.blinds.smallBlind, bigBlind: is.blinds.bigBlind },
      legalActions: is.legalActions.map((a) => ({ action: a.action, minimumAmount: a.minimumAmount, maximumAmount: a.maximumAmount,
        amountSemanticsRef: C.clone(a.amountSemanticsRef) })),
      publicActionPrefix: is.publicActionPrefix.map((a) => ({ ordinal: a.ordinal, participantId: a.participantId, street: a.street,
        action: a.action, amount: a.amount })),
    },
    chosenAction: { action: ev.chosenAction.action, amount: ev.chosenAction.amount },
    opponentModel: { modelRef: C.clone(ev.opponentModel.modelRef), uncertaintyRef: C.clone(ev.opponentModel.uncertaintyRef),
      admittedDecisionTimeEvidenceRefs: C.clone(ev.opponentModel.admittedDecisionTimeEvidenceRefs) },
    completeness: { status: ev.completeness.status, missingFields: [...ev.completeness.missingFields], reasonCodes: [...ev.completeness.reasonCodes] },
  };
}

// ---------------------------------------------------------------- quality assessment
// validateQualityAssessment(assessment, evidence = null) -> Result<PrivateQualityAssessment>
function validateQualityAssessment(a, evidence = null) {
  const problems = [];
  if (!C.checkEnvelope(a, problems)) return fail(problems);
  C.scanPrivate(a, problems);
  C.closedKeys(a, ASSESSMENT_KEYS, problems);
  C.requireKeys(a, ASSESSMENT_KEYS, problems);
  for (const k of ["assessmentId", "evidenceId", "dependenceGroupId"]) if (!isStr(a[k])) problems.push(problem("invalid-id", k));
  if (!/^[0-9a-f]{64}$/.test(a.evidenceFingerprint ?? "")) problems.push(problem("invalid-fingerprint", "evidenceFingerprint"));
  C.checkVersionRef(a.evaluatorRef, problems, "evaluatorRef");
  C.checkVersionRef(a.opponentPolicyRef, problems, "opponentPolicyRef", { nullable: true });
  C.checkSourceRef(a.calibrationRef, problems, "calibrationRef", { nullable: true });
  C.checkSourceRef(a.executionRef, problems, "executionRef");
  if (!STATUSES.includes(a.status)) problems.push(problem("invalid-status", "status"));
  if (!Array.isArray(a.privateReasonCodes) || !a.privateReasonCodes.every(isStr)) problems.push(problem("invalid-reason-codes", "privateReasonCodes"));
  if (!Array.isArray(a.actionValues)) problems.push(problem("invalid-action-values", "actionValues"));
  else a.actionValues.forEach((v, i) => {
    const p = `actionValues[${i}]`;
    if (!isObj(v)) { problems.push(problem("invalid-action-value", p)); return; }
    C.closedKeys(v, ["action", "amount", "estimate", "uncertainty", "valueSemanticsRef"], problems, `${p}.`);
    if (!isStr(v.action) || !(v.amount === null || isNum(v.amount))) problems.push(problem("invalid-action-value", p));
    if (!(v.estimate === null || isNum(v.estimate))) problems.push(problem("invalid-estimate", `${p}.estimate`));
    C.checkUncertainty(v.uncertainty, problems, `${p}.uncertainty`);
    C.checkVersionRef(v.valueSemanticsRef, problems, `${p}.valueSemanticsRef`);
    if (v.estimate === null && isObj(v.uncertainty) && v.uncertainty.status === "estimated") problems.push(problem("null-estimate-with-uncertainty", p));
    if (a.status === "unassessable" && v.estimate !== null) problems.push(problem("unassessable-with-value", `${p}.estimate`));
  });
  const ch = a.chosenActionAssessment;
  if (!isObj(ch)) problems.push(problem("invalid-chosen-assessment", "chosenActionAssessment"));
  else {
    C.closedKeys(ch, ["value", "uncertainty", "qualitySemanticsRef"], problems, "chosenActionAssessment.");
    if (!(ch.value === null || isNum(ch.value))) problems.push(problem("invalid-estimate", "chosenActionAssessment.value"));
    C.checkUncertainty(ch.uncertainty, problems, "chosenActionAssessment.uncertainty");
    C.checkVersionRef(ch.qualitySemanticsRef, problems, "chosenActionAssessment.qualitySemanticsRef");
    // Null/unassessable never becomes a perfect score or a default penalty.
    if (a.status === "supported" && (!isNum(ch.value) || !isObj(ch.uncertainty) || ch.uncertainty.status !== "estimated")) {
      problems.push(problem("supported-without-estimate", "chosenActionAssessment", "a supported assessment carries a value and an estimated uncertainty"));
    }
    if (a.status === "supported" && a.calibrationRef === null) {
      problems.push(problem("supported-without-calibration", "calibrationRef", "persona policy or synthetic provenance does not establish calibration"));
    }
    if (a.status === "unassessable" && (ch.value !== null || (isObj(ch.uncertainty) && ch.uncertainty.status !== "unassessable"))) {
      problems.push(problem("unassessable-with-value", "chosenActionAssessment"));
    }
  }
  if (evidence !== null) {
    if (!isObj(evidence)) problems.push(problem("invalid-evidence", null));
    else {
      if (a.evidenceId !== evidence.evidenceId) problems.push(problem("evidence-mismatch", "evidenceId"));
      if (a.evidenceFingerprint !== evidence.fingerprint) problems.push(problem("evidence-mismatch", "evidenceFingerprint"));
      if (!C.sameRef(a.opponentPolicyRef, evidence.opponentPolicyRef)) problems.push(problem("policy-drift", "opponentPolicyRef"));
      if (a.dependenceGroupId !== dependenceGroupFor(evidence)) problems.push(problem("dependence-group-mismatch", "dependenceGroupId"));
    }
  }
  if (problems.length) return fail(problems);
  return ok(C.deepFreeze(C.clone(a)));
}

// ---------------------------------------------------------------- evaluation
// evaluateDecisionQuality(evidence, suppliedEvaluator, suppliedOpponentModel) -> Result<PrivateQualityAssessment>
// suppliedEvaluator = { evaluatorRef, valueSemanticsRef, qualitySemanticsRef, calibrationRef|null,
//                       versionContext, evaluate(frozenClosedEvidence, frozenOpponentModelView|null) }
// suppliedOpponentModel = { modelRef, opponentPolicyRef|null, uncertaintyRef|null, view: object } | null
// The evaluator's return is { status, actionValues:[{action, amount, estimate, uncertainty}],
//   chosenValue, chosenUncertainty, privateReasonCodes }.
function evaluateDecisionQuality(evidence, suppliedEvaluator, suppliedOpponentModel) {
  const problems = [];
  const e = suppliedEvaluator;
  if (!isObj(e) || typeof e.evaluate !== "function") return fail([problem("POLICY_UNSELECTED", "suppliedEvaluator", "no evaluator supplied")]);
  for (const k of ["evaluatorRef", "valueSemanticsRef", "qualitySemanticsRef"]) C.checkVersionRef(e[k], problems, `suppliedEvaluator.${k}`);
  C.checkSourceRef(e.calibrationRef ?? null, problems, "suppliedEvaluator.calibrationRef", { nullable: true });
  if (problems.length) return fail(problems);
  const checked = validateDecisionEvidence(evidence, e.versionContext);
  if (!checked.ok) return checked;
  const ev = checked.value;

  let view = null;
  if (suppliedOpponentModel !== null && suppliedOpponentModel !== undefined) {
    const m = suppliedOpponentModel;
    if (!isObj(m)) return fail([problem("invalid-opponent-model", "suppliedOpponentModel")]);
    C.closedKeys(m, ["modelRef", "opponentPolicyRef", "uncertaintyRef", "view"], problems, "suppliedOpponentModel.");
    C.scanPrivate(m, problems, "suppliedOpponentModel");
    C.checkVersionRef(m.modelRef, problems, "suppliedOpponentModel.modelRef");
    C.checkVersionRef(m.opponentPolicyRef ?? null, problems, "suppliedOpponentModel.opponentPolicyRef", { nullable: true });
    if (!C.sameRef(m.modelRef, ev.opponentModel.modelRef)) problems.push(problem("opponent-model-mismatch", "suppliedOpponentModel.modelRef", "model is not the one admitted for this decision"));
    if (!C.sameRef(m.opponentPolicyRef ?? null, ev.opponentPolicyRef)) problems.push(problem("policy-drift", "suppliedOpponentModel.opponentPolicyRef"));
    if (!isObj(m.view)) problems.push(problem("invalid-opponent-model", "suppliedOpponentModel.view"));
    if (problems.length) return fail(problems);
    view = C.deepFreeze(C.clone(m.view));
  } else if (ev.opponentModel.modelRef !== null) {
    return fail([problem("opponent-model-missing", "suppliedOpponentModel", "the evidence names an admitted model that was not supplied")]);
  }

  const assessmentId = `qa:${C.hashOf({ e: ev.evidenceId, f: ev.fingerprint, r: e.evaluatorRef, m: ev.opponentModel.modelRef })}`;
  const unknownU = (status) => ({ status, methodRef: null, parameters: null, coverageRef: null });
  const base = {
    contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, assessmentId, evidenceId: ev.evidenceId,
    evidenceFingerprint: ev.fingerprint, evaluatorRef: C.clone(e.evaluatorRef), opponentPolicyRef: C.clone(ev.opponentPolicyRef),
    calibrationRef: C.clone(e.calibrationRef ?? null), dependenceGroupId: dependenceGroupFor(ev),
    executionRef: { kind: "pure-evaluation", recordId: assessmentId, recordVersion: e.evaluatorRef.version,
      sourceHash: C.hashOf({ evidence: ev.fingerprint, model: view === null ? null : C.hashOf(view) }) },
  };

  // Incomplete reconstruction stays unassessable; nothing is fabricated (§5).
  if (ev.completeness.status === "unassessable") {
    return validateQualityAssessment({ ...base, status: "unassessable", actionValues: [],
      chosenActionAssessment: { value: null, uncertainty: unknownU("unassessable"), qualitySemanticsRef: C.clone(e.qualitySemanticsRef) },
      privateReasonCodes: ["EVIDENCE_UNASSESSABLE", ...ev.completeness.reasonCodes] }, ev);
  }

  let out;
  try { out = e.evaluate(ev, view); } catch (err) { return fail([problem("EVALUATOR_FAILED", "suppliedEvaluator", String(err && err.message))]); }
  if (!isObj(out)) return fail([problem("EVALUATOR_FAILED", "suppliedEvaluator", "evaluator returned no object")]);
  C.closedKeys(out, ["status", "actionValues", "chosenValue", "chosenUncertainty", "privateReasonCodes"], problems, "evaluatorOutput.");
  if (!STATUSES.includes(out.status)) problems.push(problem("invalid-status", "evaluatorOutput.status"));
  // Ceiling on the claimed status: partial evidence or no admitted opponent model cannot be "supported".
  let ceiling = "supported";
  if (ev.completeness.status === "partial" || ev.opponentModel.modelRef === null) ceiling = "uncertain";
  if (STATUSES.includes(out.status) && STATUS_RANK[out.status] > STATUS_RANK[ceiling]) {
    problems.push(problem("EVALUATOR_OVERCLAIM", "evaluatorOutput.status", `status may not exceed ${ceiling} for this evidence`));
  }
  const legal = new Map(ev.informationSet.legalActions.map((a) => [a.action, a]));
  if (!Array.isArray(out.actionValues)) problems.push(problem("invalid-action-values", "evaluatorOutput.actionValues"));
  else out.actionValues.forEach((v, i) => {
    const l = isObj(v) ? legal.get(v.action) : undefined;
    if (!l) problems.push(problem("illegal-action-value", `evaluatorOutput.actionValues[${i}]`));
    else if (isNum(v.amount) && ((isNum(l.minimumAmount) && v.amount < l.minimumAmount) || (isNum(l.maximumAmount) && v.amount > l.maximumAmount))) {
      problems.push(problem("illegal-action-amount", `evaluatorOutput.actionValues[${i}].amount`));
    }
  });
  if (problems.length) return fail(problems);
  return validateQualityAssessment({
    ...base, status: out.status,
    actionValues: out.actionValues.map((v) => ({ action: v.action, amount: v.amount ?? null, estimate: v.estimate ?? null,
      uncertainty: C.clone(v.uncertainty), valueSemanticsRef: C.clone(e.valueSemanticsRef) })),
    chosenActionAssessment: { value: out.chosenValue ?? null, uncertainty: C.clone(out.chosenUncertainty), qualitySemanticsRef: C.clone(e.qualitySemanticsRef) },
    privateReasonCodes: Array.isArray(out.privateReasonCodes) ? [...out.privateReasonCodes] : [],
  }, ev);
}

module.exports = { validateDecisionEvidence, evaluateDecisionQuality, validateQualityAssessment, dependenceGroupFor,
  EVIDENCE_KEYS, INFOSET_KEYS };
