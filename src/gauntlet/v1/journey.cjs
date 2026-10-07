"use strict";
// Living Gauntlet journey (F52-V1-CONTRACT-1 §10): rival definitions, encounter results, the resumable
// checkpoint reducer and its allowlisted public projection. This coordinates narrative around main's
// existing canonical roster, match engine and progression receipts. It adds no roster, mastery rule,
// unlock rule or store, and never infers progression or mastery from a win (handoff M5 note).
//
// suppliedJourneyPolicies = {
//   definitionRef: VersionRef                       the journey definition the checkpoint belongs to
//   progressionPolicy: { policy: VersionRef, status: "accepted", acceptanceRef: SourceRef }
//                                                   reviewed progression policy; unset fails closed
//   rivals: { [rivalId]: RivalDefinition }          main-approved rival definitions
//   knownRefs?: { [id@version]: true }              when given, every rival ref must be listed
//   isChallengeAllowed(rivalId, canonicalBotId) -> boolean
//                                                   main's existing access answer (gauntletAccess +
//                                                   server mastery); this module never computes it
//   detourPlans: { [id@version]: true }             learning plans a detour may open
// }
//
// processedEventRefs holds SourceRef-shaped receipts of what was applied, so replays are detectable:
//   journey_event        recordId = eventId,      recordVersion = commandId, sourceHash = event fingerprint
//   encounter            recordId = encounterId,  recordVersion = rivalId
//   encounter_result     recordId = resultId,     recordVersion = encounterId, sourceHash = result fingerprint
//   review_ack           recordId = acknowledgementId
//   detour_evidence      recordId = admittedEvidenceId
//   cancellation_receipt recordId = receipt recordId (main's unplayed-cancellation receipt)

const C = require("./common.cjs");
const { getBotById } = require("../../data/botRoster");
const { NARRATIVE_PACK_REF, NARRATIVE_BY_RIVAL_ID } = require("./rivals.cjs");

const PHASES = ["not_entered", "introduced", "selected", "ready", "in_match", "result_pending", "reviewed", "next_choice", "learning_detour"];
const OUTCOMES = ["win", "loss", "tie", "cancelled_unplayed"];
const CHOICES = ["rematch", "rival", "lesson", "drill", "continue"];
const RIVAL_KEYS = ["contractId", "schemaVersion", "rivalId", "canonicalBotId", "definitionRef", "stylePolicyRef", "narrativePackRef", "learningPlanRefs", "accessPolicyRef"];
const RESULT_KEYS = ["contractId", "schemaVersion", "encounterId", "resultId", "fingerprint", "subjectId", "journeyId", "matchId", "rivalId", "canonicalBotId",
  "rivalDefinitionRef", "stylePolicyRef", "resultSource", "committedAt", "outcome", "existingJourneyReceiptRef", "admittedProgressionReceiptRef",
  "reviewSourceRef", "rewardGrantRefs"];
const EVENT_KEYS = ["contractId", "schemaVersion", "eventId", "fingerprint", "command", "subjectId", "journeyId", "source", "occurredAt", "kind", "payload"];
const CHECKPOINT_KEYS = ["contractId", "schemaVersion", "subjectId", "journeyId", "revision", "definitionRef", "phase", "rivalId", "encounterId", "matchBinding",
  "resultReceiptId", "reviewAcknowledgementId", "detour", "processedEventRefs", "updatedAt"];
const BINDING_KEYS = ["matchId", "preparationReceiptId", "canonicalBotId"];
// Closed payloads by kind (§10: "Missing, mismatched or extra payload fields reject").
const PAYLOAD_KEYS = {
  introduced: [],
  rival_selected: ["rivalId"],
  preparation_committed: ["encounterId", "matchBinding"],
  match_started: ["encounterId", "matchBinding"],
  match_disconnected: ["encounterId", "matchId"],
  match_resumed: ["encounterId", "matchBinding"],
  result_committed: ["result"],
  review_acknowledged: ["resultId", "acknowledgementId"],
  next_choice_requested: ["choice", "rivalId", "learningPlanRef"],
  detour_completed: ["learningPlanRef", "admittedEvidenceId"],
  detour_exited: ["learningPlanRef"],
  preparation_cancelled: ["encounterId", "cancellationReceipt"],
};

// ---------------------------------------------------------------- rival definitions

function validateRivalDefinition(def, suppliedIndex = null) {
  const p = [];
  C.checkEnvelope(def, p);
  if (!C.isObj(def)) return C.fail(p);
  C.closedKeys(def, RIVAL_KEYS, p);
  C.scanPrivate(def, p);
  if (!C.isStr(def.rivalId)) p.push(C.problem("invalid-id", "rivalId"));
  const bot = getBotById(def.canonicalBotId);
  if (!bot) p.push(C.problem("unknown-canonical-bot", "canonicalBotId", "rivals must reference an existing roster bot"));
  const narrative = NARRATIVE_BY_RIVAL_ID[def.rivalId];
  if (!narrative) p.push(C.problem("unknown-rival-narrative", "rivalId"));
  else if (narrative.canonicalBotId !== def.canonicalBotId) p.push(C.problem("rival-bot-mismatch", "canonicalBotId"));
  for (const k of ["definitionRef", "stylePolicyRef", "narrativePackRef", "accessPolicyRef"]) C.checkVersionRef(def[k], p, k);
  if (C.isVersionRef(def.narrativePackRef) && !(def.narrativePackRef.id === NARRATIVE_PACK_REF.id && def.narrativePackRef.version === NARRATIVE_PACK_REF.version
    && (def.narrativePackRef.sha256 === null || def.narrativePackRef.sha256 === NARRATIVE_PACK_REF.sha256))) {
    p.push(C.problem("unknown-narrative-pack-version", "narrativePackRef"));
  }
  if (!Array.isArray(def.learningPlanRefs)) p.push(C.problem("invalid-learning-plan-refs", "learningPlanRefs"));
  else {
    def.learningPlanRefs.forEach((r, i) => C.checkVersionRef(r, p, `learningPlanRefs[${i}]`));
    if (new Set(def.learningPlanRefs.map(C.refKey)).size !== def.learningPlanRefs.length) p.push(C.problem("duplicate-learning-plan-ref", "learningPlanRefs"));
  }
  if (suppliedIndex && C.isObj(suppliedIndex.knownRefs)) {
    const refs = ["definitionRef", "stylePolicyRef", "accessPolicyRef"].map((k) => [k, def[k]])
      .concat((Array.isArray(def.learningPlanRefs) ? def.learningPlanRefs : []).map((r, i) => [`learningPlanRefs[${i}]`, r]));
    for (const [k, r] of refs) if (C.isVersionRef(r) && !suppliedIndex.knownRefs[C.refKey(r)]) p.push(C.problem("unknown-version", k, `${C.refKey(r)} is not supplied`));
  }
  if (p.length) return C.fail(p);
  return C.ok(C.deepFreeze(C.clone(def)));
}

// ---------------------------------------------------------------- encounter results

function validateEncounterResult(fact, suppliedJourneyPolicies) {
  const p = [];
  C.checkEnvelope(fact, p);
  if (!C.isObj(fact)) return C.fail(p);
  C.closedKeys(fact, RESULT_KEYS, p);
  C.scanPrivate(fact, p);
  for (const k of ["encounterId", "resultId", "subjectId", "journeyId", "matchId", "rivalId", "canonicalBotId"]) if (!C.isStr(fact[k])) p.push(C.problem("invalid-id", k));
  C.checkFingerprint(fact, p);
  C.checkVersionRef(fact.rivalDefinitionRef, p, "rivalDefinitionRef");
  C.checkVersionRef(fact.stylePolicyRef, p, "stylePolicyRef");
  C.checkSourceRef(fact.resultSource, p, "resultSource");
  if (!C.isTs(fact.committedAt)) p.push(C.problem("invalid-timestamp", "committedAt"));
  if (!OUTCOMES.includes(fact.outcome)) p.push(C.problem("unknown-outcome", "outcome"));
  for (const k of ["existingJourneyReceiptRef", "admittedProgressionReceiptRef", "reviewSourceRef"]) C.checkSourceRef(fact[k], p, k, { nullable: true });
  if (!Array.isArray(fact.rewardGrantRefs)) p.push(C.problem("invalid-reward-grant-refs", "rewardGrantRefs"));
  else fact.rewardGrantRefs.forEach((r, i) => C.checkSourceRef(r, p, `rewardGrantRefs[${i}]`));
  if (!getBotById(fact.canonicalBotId)) p.push(C.problem("unknown-canonical-bot", "canonicalBotId"));

  // An unplayed cancellation awards nothing: no journey receipt, progression, review or reward (§10).
  if (fact.outcome === "cancelled_unplayed") {
    if (fact.existingJourneyReceiptRef !== null || fact.admittedProgressionReceiptRef !== null || fact.reviewSourceRef !== null
      || (Array.isArray(fact.rewardGrantRefs) && fact.rewardGrantRefs.length > 0)) {
      p.push(C.problem("unplayed-cancellation-awards", "outcome", "an unplayed cancellation cannot carry a journey, progression, review or reward receipt"));
    }
  }
  const rival = C.isObj(suppliedJourneyPolicies?.rivals) ? suppliedJourneyPolicies.rivals[fact.rivalId] : undefined;
  if (!rival) p.push(C.problem("unknown-rival", "rivalId", "no supplied rival definition"));
  else {
    if (rival.canonicalBotId !== fact.canonicalBotId) p.push(C.problem("rival-bot-mismatch", "canonicalBotId"));
    if (!C.sameRef(rival.definitionRef, fact.rivalDefinitionRef)) p.push(C.problem("rival-definition-version-mismatch", "rivalDefinitionRef"));
    if (!C.sameRef(rival.stylePolicyRef, fact.stylePolicyRef)) p.push(C.problem("style-policy-version-mismatch", "stylePolicyRef"));
  }
  if (p.length) return C.fail(p);
  return C.ok(C.deepFreeze(C.clone(fact)));
}

// ---------------------------------------------------------------- events and policies

function validateEvent(ev) {
  const p = [];
  C.checkEnvelope(ev, p);
  if (!C.isObj(ev)) return p;
  C.closedKeys(ev, EVENT_KEYS, p);
  C.scanPrivate(ev, p);
  for (const k of ["eventId", "subjectId", "journeyId"]) if (!C.isStr(ev[k])) p.push(C.problem("invalid-id", k));
  C.checkFingerprint(ev, p);
  if (!C.isObj(ev.command) || !C.isStr(ev.command.commandId) || !C.isCount(ev.command.expectedRevision) || Object.keys(ev.command).length !== 2) {
    p.push(C.problem("invalid-command", "command"));
  }
  C.checkSourceRef(ev.source, p, "source");
  if (!C.isTs(ev.occurredAt)) p.push(C.problem("invalid-timestamp", "occurredAt"));
  const keys = PAYLOAD_KEYS[ev.kind];
  if (!keys) p.push(C.problem("unknown-event-kind", "kind"));
  else if (!C.isObj(ev.payload)) p.push(C.problem("invalid-payload", "payload"));
  else C.closedKeys(ev.payload, keys, p, "payload.");
  return p;
}

function checkPolicies(pol, p) {
  if (!C.isObj(pol)) { p.push(C.problem("POLICY_UNSELECTED", "suppliedJourneyPolicies", "no journey policies were supplied")); return false; }
  const accepted = C.checkAcceptedPolicy(pol.progressionPolicy, p, "suppliedJourneyPolicies.progressionPolicy");
  let complete = true;
  if (!C.isVersionRef(pol.definitionRef)) { p.push(C.problem("POLICY_INCOMPLETE", "suppliedJourneyPolicies.definitionRef")); complete = false; }
  if (!C.isObj(pol.rivals)) { p.push(C.problem("POLICY_INCOMPLETE", "suppliedJourneyPolicies.rivals")); complete = false; }
  if (typeof pol.isChallengeAllowed !== "function") { p.push(C.problem("POLICY_INCOMPLETE", "suppliedJourneyPolicies.isChallengeAllowed")); complete = false; }
  if (!C.isObj(pol.detourPlans)) { p.push(C.problem("POLICY_INCOMPLETE", "suppliedJourneyPolicies.detourPlans")); complete = false; }
  return accepted && complete;
}

const emptyCheckpoint = (ev, pol) => ({
  contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, subjectId: ev.subjectId, journeyId: ev.journeyId, revision: 0,
  definitionRef: C.copyVersionRef(pol.definitionRef), phase: "not_entered", rivalId: null, encounterId: null, matchBinding: null,
  resultReceiptId: null, reviewAcknowledgementId: null, detour: null, processedEventRefs: [], updatedAt: ev.occurredAt,
});

const sameBinding = (a, b) => C.isObj(a) && C.isObj(b) && BINDING_KEYS.every((k) => a[k] === b[k]) && Object.keys(b).length === BINDING_KEYS.length;
const findRef = (snap, kind, recordId) => snap.processedEventRefs.find((r) => r.kind === kind && r.recordId === recordId);
const addRef = (snap, kind, recordId, recordVersion, sourceHash = null) => snap.processedEventRefs.push({ kind, recordId, recordVersion, sourceHash });

// Resolves a rival the journey may challenge right now: defined, valid, on the roster, allowed by main.
function allowedRival(pol, rivalId, p, path) {
  const def = C.isStr(rivalId) ? pol.rivals[rivalId] : undefined;
  if (!def) { p.push(C.problem("unknown-rival", path)); return null; }
  const v = validateRivalDefinition(def, pol);
  if (!v.ok) { p.push(...v.problems.map((x) => ({ ...x, path: `${path}:${x.path}` }))); return null; }
  if (pol.isChallengeAllowed(def.rivalId, def.canonicalBotId) !== true) { p.push(C.problem("challenge-not-allowed", path, "main's access policy does not allow this challenge")); return null; }
  return def;
}

// ---------------------------------------------------------------- checkpoint reducer

function reduceJourneyCheckpoint(snapshot, admittedEvent, suppliedJourneyPolicies) {
  const pol = suppliedJourneyPolicies;
  const p = validateEvent(admittedEvent);
  checkPolicies(pol, p);
  if (p.length) return C.fail(p);
  const ev = admittedEvent;
  const snap = snapshot ? C.clone(snapshot) : emptyCheckpoint(ev, pol);

  C.checkEnvelope(snap, p, "snapshot.");
  C.closedKeys(snap, CHECKPOINT_KEYS, p, "snapshot.");
  if (snap.subjectId !== ev.subjectId) p.push(C.problem("subject-mismatch", "subjectId", "the event belongs to another subject"));
  if (snap.journeyId !== ev.journeyId) p.push(C.problem("journey-mismatch", "journeyId"));
  if (!C.sameRef(snap.definitionRef, pol.definitionRef)) p.push(C.problem("definition-version-mismatch", "snapshot.definitionRef"));
  if (!C.isCount(snap.revision)) p.push(C.problem("invalid-revision", "snapshot.revision"));
  if (!PHASES.includes(snap.phase)) p.push(C.problem("unknown-phase", "snapshot.phase"));
  if (!Array.isArray(snap.processedEventRefs)) p.push(C.problem("invalid-processed-refs", "snapshot.processedEventRefs"));
  if (p.length) return C.fail(p);

  // Replay of the same event id: same fingerprint is a no-op, changed payload is a conflict (§3).
  const seen = findRef(snap, "journey_event", ev.eventId);
  if (seen) {
    if (seen.sourceHash === ev.fingerprint) return C.ok(C.deepFreeze(snap), "duplicate");
    return C.fail([C.problem("event-id-conflict", "eventId", "the same event id arrived with different data")]);
  }
  if (snap.processedEventRefs.some((r) => r.kind === "journey_event" && r.recordVersion === ev.command.commandId)) {
    return C.fail([C.problem("command-id-conflict", "command.commandId", "this command was already applied under another event id")]);
  }
  // A result, review or detour completion already applied under another event id cannot apply twice.
  const pl = ev.payload;
  if (ev.kind === "result_committed" && C.isObj(pl.result)) {
    const prior = findRef(snap, "encounter_result", pl.result.resultId);
    if (prior) {
      if (prior.sourceHash === pl.result.fingerprint) return C.ok(C.deepFreeze(snap), "duplicate");
      return C.fail([C.problem("result-id-conflict", "payload.result.resultId", "the same result id arrived with different data")]);
    }
    if (snap.processedEventRefs.some((r) => r.kind === "encounter_result" && r.recordVersion === pl.result.encounterId)) {
      return C.fail([C.problem("encounter-already-resulted", "payload.result.encounterId", "this encounter already has a committed result")]);
    }
  }
  if (ev.kind === "review_acknowledged" && C.isStr(pl.acknowledgementId) && findRef(snap, "review_ack", pl.acknowledgementId)) {
    return C.ok(C.deepFreeze(snap), "duplicate");
  }
  if (ev.kind === "detour_completed" && C.isStr(pl.admittedEvidenceId) && findRef(snap, "detour_evidence", pl.admittedEvidenceId)) {
    return C.fail([C.problem("detour-evidence-reused", "payload.admittedEvidenceId", "this evidence already completed a detour")]);
  }

  if (ev.command.expectedRevision !== snap.revision) {
    return C.fail([C.problem("stale-revision", "command.expectedRevision", `expected revision ${ev.command.expectedRevision}, snapshot is at ${snap.revision}`)]);
  }
  if (snap.revision > 0 && ev.occurredAt < snap.updatedAt) return C.fail([C.problem("event-out-of-order", "occurredAt")]);

  const wrongPhase = (...allowed) => (allowed.includes(snap.phase) ? null
    : C.fail([C.problem("invalid-transition", "kind", `${ev.kind} is not allowed from ${snap.phase}`)]));
  const selectRival = (def) => {
    snap.phase = "selected"; snap.rivalId = def.rivalId; snap.encounterId = null; snap.matchBinding = null;
    snap.resultReceiptId = null; snap.reviewAcknowledgementId = null; snap.detour = null;
  };
  let bad;

  switch (ev.kind) {
    case "introduced":
      if ((bad = wrongPhase("not_entered"))) return bad;
      snap.phase = "introduced";
      break;

    case "rival_selected": {
      if ((bad = wrongPhase("introduced", "next_choice"))) return bad;
      const def = allowedRival(pol, pl.rivalId, p, "payload.rivalId");
      if (!def) return C.fail(p);
      selectRival(def);
      break;
    }

    case "preparation_committed": {
      if ((bad = wrongPhase("selected"))) return bad;
      if (!C.isStr(pl.encounterId)) p.push(C.problem("invalid-id", "payload.encounterId"));
      else if (findRef(snap, "encounter", pl.encounterId)) p.push(C.problem("encounter-id-reused", "payload.encounterId", "each encounter, including a rematch, needs a newly issued id"));
      if (!C.isObj(pl.matchBinding) || !BINDING_KEYS.every((k) => C.isStr(pl.matchBinding[k])) || Object.keys(pl.matchBinding).length !== 3) {
        p.push(C.problem("invalid-match-binding", "payload.matchBinding"));
      }
      const def = allowedRival(pol, snap.rivalId, p, "rivalId");
      if (def && C.isObj(pl.matchBinding) && pl.matchBinding.canonicalBotId !== def.canonicalBotId) p.push(C.problem("rival-bot-mismatch", "payload.matchBinding.canonicalBotId"));
      if (p.length) return C.fail(p);
      snap.phase = "ready"; snap.encounterId = pl.encounterId;
      snap.matchBinding = { matchId: pl.matchBinding.matchId, preparationReceiptId: pl.matchBinding.preparationReceiptId, canonicalBotId: pl.matchBinding.canonicalBotId };
      addRef(snap, "encounter", pl.encounterId, snap.rivalId);
      break;
    }

    case "preparation_cancelled": {
      // Abandoned unplayed preparation: back to the selected rival, no loss and no grant (§10).
      if ((bad = wrongPhase("ready"))) return bad;
      if (pl.encounterId !== snap.encounterId) p.push(C.problem("encounter-mismatch", "payload.encounterId"));
      C.checkSourceRef(pl.cancellationReceipt, p, "payload.cancellationReceipt");
      if (p.length) return C.fail(p);
      snap.phase = "selected"; snap.encounterId = null; snap.matchBinding = null;
      addRef(snap, "cancellation_receipt", pl.cancellationReceipt.recordId, pl.cancellationReceipt.recordVersion, pl.cancellationReceipt.sourceHash);
      break;
    }

    case "match_started":
    case "match_resumed":
      // Start needs the owned ready encounter; resume returns to the same bound encounter and match.
      if ((bad = wrongPhase(ev.kind === "match_started" ? "ready" : "in_match"))) return bad;
      if (pl.encounterId !== snap.encounterId) return C.fail([C.problem("encounter-mismatch", "payload.encounterId")]);
      if (!sameBinding(snap.matchBinding, pl.matchBinding)) return C.fail([C.problem("match-binding-mismatch", "payload.matchBinding")]);
      snap.phase = "in_match";
      break;

    case "match_disconnected":
      // Connection status only: no new encounter, no result, no phase change.
      if ((bad = wrongPhase("in_match"))) return bad;
      if (pl.encounterId !== snap.encounterId) return C.fail([C.problem("encounter-mismatch", "payload.encounterId")]);
      if (pl.matchId !== snap.matchBinding.matchId) return C.fail([C.problem("match-binding-mismatch", "payload.matchId")]);
      break;

    case "result_committed": {
      if ((bad = wrongPhase("in_match"))) return bad;
      const v = validateEncounterResult(pl.result, pol);
      if (!v.ok) return C.fail(v.problems.map((x) => ({ ...x, path: `payload.result.${x.path ?? ""}` })));
      const r = v.value;
      if (r.subjectId !== snap.subjectId) p.push(C.problem("subject-mismatch", "payload.result.subjectId"));
      if (r.journeyId !== snap.journeyId) p.push(C.problem("journey-mismatch", "payload.result.journeyId"));
      if (r.encounterId !== snap.encounterId) p.push(C.problem("encounter-mismatch", "payload.result.encounterId"));
      if (r.matchId !== snap.matchBinding.matchId) p.push(C.problem("match-binding-mismatch", "payload.result.matchId"));
      if (r.rivalId !== snap.rivalId) p.push(C.problem("rival-mismatch", "payload.result.rivalId"));
      if (r.canonicalBotId !== snap.matchBinding.canonicalBotId) p.push(C.problem("rival-bot-mismatch", "payload.result.canonicalBotId"));
      if (p.length) return C.fail(p);
      snap.resultReceiptId = r.resultId;
      // Unplayed: straight to the choice board, nothing to review and nothing awarded.
      snap.phase = r.outcome === "cancelled_unplayed" ? "next_choice" : "result_pending";
      addRef(snap, "encounter_result", r.resultId, r.encounterId, r.fingerprint);
      break;
    }

    case "review_acknowledged":
      if ((bad = wrongPhase("result_pending"))) return bad;
      if (!C.isStr(pl.resultId) || pl.resultId !== snap.resultReceiptId) return C.fail([C.problem("result-mismatch", "payload.resultId", "review must name the committed result")]);
      if (!C.isStr(pl.acknowledgementId)) return C.fail([C.problem("invalid-id", "payload.acknowledgementId")]);
      snap.phase = "reviewed"; snap.reviewAcknowledgementId = pl.acknowledgementId;
      addRef(snap, "review_ack", pl.acknowledgementId, pl.resultId);
      break;

    case "next_choice_requested": {
      if ((bad = wrongPhase("reviewed", "next_choice"))) return bad;
      if (!CHOICES.includes(pl.choice)) return C.fail([C.problem("unknown-choice", "payload.choice")]);
      const wantsRival = pl.choice === "rematch" || pl.choice === "rival";
      const wantsPlan = pl.choice === "lesson" || pl.choice === "drill";
      if (wantsRival ? !C.isStr(pl.rivalId) : pl.rivalId !== null) p.push(C.problem("choice-payload-mismatch", "payload.rivalId"));
      if (wantsPlan ? !C.isVersionRef(pl.learningPlanRef) : pl.learningPlanRef !== null) p.push(C.problem("choice-payload-mismatch", "payload.learningPlanRef"));
      if (p.length) return C.fail(p);
      if (pl.choice === "rematch" && pl.rivalId !== snap.rivalId) return C.fail([C.problem("rematch-rival-mismatch", "payload.rivalId", "a rematch is against the same rival")]);
      if (wantsRival) {
        const def = allowedRival(pol, pl.rivalId, p, "payload.rivalId");
        if (!def) return C.fail(p);
        selectRival(def); // a rematch gets a newly issued encounter at preparation; history stays in processedEventRefs
      } else if (wantsPlan) {
        if (!pol.detourPlans[C.refKey(pl.learningPlanRef)]) return C.fail([C.problem("unknown-learning-plan", "payload.learningPlanRef")]);
        snap.phase = "learning_detour";
        snap.detour = { learningPlanRef: C.copyVersionRef(pl.learningPlanRef), returnPhase: "next_choice", admittedEvidenceId: null };
      } else {
        snap.phase = "next_choice"; // continue arena play: the choice board stays open
      }
      break;
    }

    case "detour_completed":
    case "detour_exited":
      // Returning from a detour records the admitted evidence id only; it never claims mastery.
      if ((bad = wrongPhase("learning_detour"))) return bad;
      if (!C.sameRef(pl.learningPlanRef, snap.detour.learningPlanRef)) return C.fail([C.problem("detour-plan-mismatch", "payload.learningPlanRef")]);
      if (ev.kind === "detour_completed") {
        if (!C.isStr(pl.admittedEvidenceId)) return C.fail([C.problem("missing-provenance", "payload.admittedEvidenceId")]);
        snap.detour.admittedEvidenceId = pl.admittedEvidenceId;
        addRef(snap, "detour_evidence", pl.admittedEvidenceId, C.refKey(pl.learningPlanRef));
      }
      snap.phase = snap.detour.returnPhase;
      break;

    default:
      return C.fail([C.problem("unknown-event-kind", "kind")]);
  }

  addRef(snap, "journey_event", ev.eventId, ev.command.commandId, ev.fingerprint);
  snap.revision += 1;
  snap.updatedAt = ev.occurredAt;
  return C.ok(C.deepFreeze(snap), "applied");
}

// ---------------------------------------------------------------- public projection

// suppliedProjectionContext = { known: true, visibilityPolicyRef: VersionRef,
//   rivals: { [rivalId]: RivalDefinition }, results?: { [resultId]: EncounterResultFact (validated) } }
function projectLivingGauntlet(checkpoint, ctx) {
  const p = [];
  C.checkEnvelope(checkpoint, p, "checkpoint.");
  if (!C.isObj(ctx) || ctx.known !== true || !C.isVersionRef(ctx.visibilityPolicyRef)) p.push(C.problem("unknown-visibility-policy", "suppliedProjectionContext"));
  if (C.isObj(checkpoint) && !PHASES.includes(checkpoint.phase)) p.push(C.problem("unknown-phase", "checkpoint.phase"));
  if (p.length) return C.fail(p);

  let rival = null;
  if (checkpoint.rivalId !== null) {
    const def = C.isObj(ctx.rivals) ? ctx.rivals[checkpoint.rivalId] : undefined;
    const narrative = NARRATIVE_BY_RIVAL_ID[checkpoint.rivalId];
    const bot = def ? getBotById(def.canonicalBotId) : undefined;
    if (!def || !narrative || !bot) return C.fail([C.problem("unknown-rival", "checkpoint.rivalId")]);
    rival = {
      rivalId: def.rivalId, canonicalBotId: bot.id,
      // Readable AI identity is retained: real persona name plus the trusted AI badge (§6, §11).
      displayName: bot.name, participantKind: "ai_persona", aiBadge: C.aiBadgeFor("ai_persona"),
      archetype: bot.archetype, epithet: narrative.epithet, tableHabit: narrative.tableHabit,
    };
  }

  let result = null;
  if (checkpoint.resultReceiptId !== null) {
    const r = C.isObj(ctx.results) ? ctx.results[checkpoint.resultReceiptId] : undefined;
    if (!r || r.resultId !== checkpoint.resultReceiptId) return C.fail([C.problem("unknown-result", "checkpoint.resultReceiptId")]);
    result = {
      resultId: r.resultId, outcome: r.outcome,
      // Progression is shown only from main's admitted receipt; a win alone shows none (handoff M5 note).
      progressionReceiptId: r.admittedProgressionReceiptRef ? r.admittedProgressionReceiptRef.recordId : null,
      rewardGrantIds: r.rewardGrantRefs.map((g) => g.recordId),
      reviewAvailable: r.reviewSourceRef !== null,
      reviewed: checkpoint.reviewAcknowledgementId !== null,
    };
  }

  let line = null;
  if (rival) {
    const lines = NARRATIVE_BY_RIVAL_ID[rival.rivalId].lines;
    if (["selected", "ready"].includes(checkpoint.phase)) line = lines.intro;
    else if (result && ["result_pending", "reviewed", "next_choice"].includes(checkpoint.phase)) {
      line = { win: lines.afterWin, loss: lines.afterLoss, tie: lines.afterTie, cancelled_unplayed: null }[result.outcome];
    }
  }
  const nextChoices = ["reviewed", "next_choice"].includes(checkpoint.phase) ? CHOICES.filter((c) => c !== "rematch" || rival !== null) : [];

  return C.ok(C.deepFreeze({
    contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION,
    subjectId: checkpoint.subjectId, journeyId: checkpoint.journeyId, revision: checkpoint.revision,
    phase: checkpoint.phase, updatedAt: checkpoint.updatedAt, visibilityPolicyRef: C.copyVersionRef(ctx.visibilityPolicyRef),
    rival, line,
    encounter: checkpoint.encounterId !== null ? { encounterId: checkpoint.encounterId, matchId: checkpoint.matchBinding ? checkpoint.matchBinding.matchId : null } : null,
    result,
    detour: checkpoint.detour ? { learningPlanRef: C.copyVersionRef(checkpoint.detour.learningPlanRef), evidenceRecorded: checkpoint.detour.admittedEvidenceId !== null } : null,
    nextChoices,
  }));
}

module.exports = { validateRivalDefinition, validateEncounterResult, reduceJourneyCheckpoint, projectLivingGauntlet, PHASES, CHOICES };
