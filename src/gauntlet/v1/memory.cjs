"use strict";
// Relationship memory (F52-V1-CONTRACT-1 §10): bounded, legitimate narrative memory between a subject
// and a rival. It sits beside the existing server BotMemory (one doc per human x journey bot holding
// the bot's adaptive read of the human's observed public actions plus a rivalry tally) and never
// reads, writes or replaces it. In particular the adaptive `opponentModel` is not a memory fact and is
// rejected here, so new relationship text cannot silently change bot play.
//
// Admissible content: encounter outcomes, rematch/review/detour history and main-admitted summaries of
// public actions (by reference). Not admissible: concealed or future cards, inferred intent or
// psychological labels. Every bound (entries, text length, retention, deletion, selection) comes from
// the supplied policy; an unselected or incomplete policy blocks retention (fails closed).
//
// suppliedMemoryPolicy = {
//   policy: RelationshipMemoryPolicy                         contract type, status "accepted"
//   selectRetained?(entries, incoming) -> memoryId[]          main's selection rule, consulted only when
//                                                            retaining `incoming` would exceed maximumEntries
// }
// Deletion: main records tombstones in snapshot.tombstoneRefs (recordId = deletionScopeId). A fact in a
// tombstoned scope is never retained again, so replay cannot restore removed memory.

const C = require("./common.cjs");
const { getBotById } = require("../../data/botRoster");
const { NARRATIVE_BY_RIVAL_ID } = require("./rivals.cjs");

const FACT_KINDS = ["encounter_completed", "rematch_requested", "review_acknowledged", "learning_detour", "public_observation_summary"];
const FACT_KEYS = ["contractId", "schemaVersion", "memoryId", "fingerprint", "subjectId", "rivalId", "kind", "encounterId", "source", "policyRef",
  "observedAt", "publicObservationSummaryRef", "narrativeFact", "deletionScopeId"];
const POLICY_KEYS = ["contractId", "schemaVersion", "policy", "status", "allowedFactKinds", "visibilityPolicyRef", "maximumEntries", "maximumTextLength",
  "retentionPolicyRef", "deletionPolicyRef", "selectionPolicyRef", "acceptanceRef"];
const SNAPSHOT_KEYS = ["contractId", "schemaVersion", "subjectId", "rivalId", "revision", "policyRef", "entries", "processedFacts", "tombstoneRefs", "updatedAt"];
const NEEDS_ENCOUNTER = ["encounter_completed", "review_acknowledged"];

// Card notation in free text: suit glyphs, or two adjacent rank+suit tokens such as "AsKd".
// Case-sensitive on purpose: uppercase rank, lowercase suit (so ordinary words like "asks" pass).
const CARD_TOKENS = /[♠♥♦♣]|\b(?:[2-9TJQKA][shdc]){2,}\b/;
const CARD_WORDS = /\b(?:10|[2-9]|ten|jack|queen|king|ace)s?\s+of\s+(?:spades|hearts|diamonds|clubs)\b/i;
const CARD_TEXT = { test: (s) => CARD_TOKENS.test(s) || CARD_WORDS.test(s) };
// Unsupported psychological or intent labels (§10). A guard, not a classifier: main's policy decides
// what text is admitted; this only refuses the obvious cases.
const PSYCH_TEXT = /\b(tilt(?:ed|ing)?|scared|afraid|nervous|desperate|coward(?:ly)?|panic(?:ked|king)?|intimidated|frustrated|emotional|wants to|trying to|intends? to)\b/i;

function checkMemoryPolicy(supplied, p) {
  const pol = C.isObj(supplied) ? supplied.policy : undefined;
  if (!C.isObj(pol) || pol.status === "unselected") { p.push(C.problem("POLICY_UNSELECTED", "suppliedMemoryPolicy.policy", "no reviewed memory policy: nothing is retained")); return null; }
  const before = p.length;
  C.checkEnvelope(pol, p, "suppliedMemoryPolicy.policy.");
  C.closedKeys(pol, POLICY_KEYS, p, "suppliedMemoryPolicy.policy.");
  if (p.length > before) return null;
  const incomplete = (path) => p.push(C.problem("POLICY_INCOMPLETE", `suppliedMemoryPolicy.policy.${path}`));
  if (pol.status !== "accepted") incomplete("status");
  if (!C.isVersionRef(pol.policy)) incomplete("policy");
  if (!Array.isArray(pol.allowedFactKinds) || pol.allowedFactKinds.length === 0 || !pol.allowedFactKinds.every((k) => FACT_KINDS.includes(k))) incomplete("allowedFactKinds");
  for (const k of ["visibilityPolicyRef", "retentionPolicyRef", "deletionPolicyRef", "selectionPolicyRef"]) if (!C.isVersionRef(pol[k])) incomplete(k);
  if (!(Number.isSafeInteger(pol.maximumEntries) && pol.maximumEntries > 0)) incomplete("maximumEntries");
  if (!C.isCount(pol.maximumTextLength)) incomplete("maximumTextLength");
  if (!C.isSourceRef(pol.acceptanceRef)) incomplete("acceptanceRef");
  return p.length > before ? null : pol;
}

function validateMemoryFact(fact, pol, p) {
  C.checkEnvelope(fact, p, "fact.");
  if (!C.isObj(fact)) return;
  C.closedKeys(fact, FACT_KEYS, p, "fact.");
  C.scanPrivate(fact, p, "fact");
  for (const k of ["memoryId", "subjectId", "rivalId", "deletionScopeId"]) if (!C.isStr(fact[k])) p.push(C.problem("invalid-id", `fact.${k}`));
  C.checkFingerprint(fact, p, "fact.fingerprint");
  if (!NARRATIVE_BY_RIVAL_ID[fact.rivalId]) p.push(C.problem("unknown-rival", "fact.rivalId"));
  if (!FACT_KINDS.includes(fact.kind)) p.push(C.problem("unknown-fact-kind", "fact.kind"));
  else if (!pol.allowedFactKinds.includes(fact.kind)) p.push(C.problem("fact-kind-not-allowed", "fact.kind", "the supplied policy does not retain this kind"));
  if (NEEDS_ENCOUNTER.includes(fact.kind) ? !C.isStr(fact.encounterId) : !(fact.encounterId === null || C.isStr(fact.encounterId))) {
    p.push(C.problem("invalid-encounter-id", "fact.encounterId"));
  }
  C.checkSourceRef(fact.source, p, "fact.source");
  C.checkVersionRef(fact.policyRef, p, "fact.policyRef");
  if (C.isVersionRef(fact.policyRef) && !C.sameRef(fact.policyRef, pol.policy)) p.push(C.problem("policy-version-mismatch", "fact.policyRef"));
  if (!C.isTs(fact.observedAt)) p.push(C.problem("invalid-timestamp", "fact.observedAt"));
  // A public-action summary is admitted by reference to main's summary record, never inline.
  if (fact.kind === "public_observation_summary") C.checkSourceRef(fact.publicObservationSummaryRef, p, "fact.publicObservationSummaryRef");
  else if (fact.publicObservationSummaryRef !== null) p.push(C.problem("unexpected-observation-summary", "fact.publicObservationSummaryRef"));
  const nf = fact.narrativeFact;
  if (!C.isObj(nf) || !C.isStr(nf.code) || !(nf.text === null || typeof nf.text === "string") || Object.keys(nf).length !== 2) {
    p.push(C.problem("invalid-narrative-fact", "fact.narrativeFact"));
  } else {
    if (nf.text !== null && nf.text.length > pol.maximumTextLength) p.push(C.problem("memory-text-too-long", "fact.narrativeFact.text"));
    for (const s of [nf.code, nf.text ?? ""]) {
      if (CARD_TEXT.test(s)) p.push(C.problem("card-data-in-memory", "fact.narrativeFact", "memory cannot hold card data"));
      if (PSYCH_TEXT.test(s)) p.push(C.problem("unsupported-label-in-memory", "fact.narrativeFact", "memory cannot hold intent or psychological labels"));
    }
  }
}

const emptyMemory = (fact, pol) => ({
  contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, subjectId: fact.subjectId, rivalId: fact.rivalId, revision: 0,
  policyRef: C.copyVersionRef(pol.policy), entries: [], processedFacts: [], tombstoneRefs: [], updatedAt: fact.observedAt,
});

function reduceRelationshipMemory(snapshot, admittedFact, suppliedMemoryPolicy) {
  const p = [];
  const pol = checkMemoryPolicy(suppliedMemoryPolicy, p);
  if (!pol) return C.fail(p);
  validateMemoryFact(admittedFact, pol, p);
  if (p.length) return C.fail(p);
  const fact = admittedFact;
  const snap = snapshot ? C.clone(snapshot) : emptyMemory(fact, pol);
  C.checkEnvelope(snap, p, "snapshot.");
  C.closedKeys(snap, SNAPSHOT_KEYS, p, "snapshot.");
  if (snap.subjectId !== fact.subjectId) p.push(C.problem("subject-mismatch", "fact.subjectId", "the fact belongs to another subject"));
  if (snap.rivalId !== fact.rivalId) p.push(C.problem("rival-mismatch", "fact.rivalId"));
  if (!C.sameRef(snap.policyRef, pol.policy)) p.push(C.problem("policy-version-mismatch", "snapshot.policyRef"));
  if (!C.isCount(snap.revision)) p.push(C.problem("invalid-revision", "snapshot.revision"));
  if (p.length) return C.fail(p);

  const seen = snap.processedFacts.find((x) => x.memoryId === fact.memoryId);
  if (seen) {
    if (seen.fingerprint === fact.fingerprint) return C.ok(C.deepFreeze(snap), "duplicate");
    return C.fail([C.problem("memory-id-conflict", "fact.memoryId", "the same memory id arrived with different data")]);
  }
  if (snap.tombstoneRefs.some((t) => t.recordId === fact.deletionScopeId)) return C.ok(C.deepFreeze(snap), "unchanged");

  let entries = snap.entries.concat([C.clone(fact)]);
  if (entries.length > pol.maximumEntries) {
    if (typeof suppliedMemoryPolicy.selectRetained !== "function") {
      return C.fail([C.problem("POLICY_INCOMPLETE", "suppliedMemoryPolicy.selectRetained", "the bound is reached and no selection rule was supplied")]);
    }
    const keep = suppliedMemoryPolicy.selectRetained(C.clone(snap.entries), C.clone(fact));
    const ids = new Set(entries.map((e) => e.memoryId));
    if (!Array.isArray(keep) || keep.length > pol.maximumEntries || new Set(keep).size !== keep.length || !keep.every((id) => ids.has(id))) {
      return C.fail([C.problem("invalid-selection", "suppliedMemoryPolicy.selectRetained", "selection must return at most maximumEntries known ids")]);
    }
    entries = entries.filter((e) => keep.includes(e.memoryId));
  }
  snap.entries = entries;
  // Dropped ids stay processed, so a replay cannot bring them back.
  snap.processedFacts.push({ memoryId: fact.memoryId, fingerprint: fact.fingerprint });
  snap.revision += 1;
  if (fact.observedAt > snap.updatedAt) snap.updatedAt = fact.observedAt;
  return C.ok(C.deepFreeze(snap), "applied");
}

// suppliedVisibilityPolicy = { known: true, policyRef: VersionRef, showText: boolean }
function projectRelationshipMemory(snapshot, suppliedVisibilityPolicy) {
  const p = [];
  C.checkEnvelope(snapshot, p, "snapshot.");
  const vis = suppliedVisibilityPolicy;
  if (!C.isObj(vis) || vis.known !== true || !C.isVersionRef(vis.policyRef)) p.push(C.problem("unknown-visibility-policy", "suppliedVisibilityPolicy"));
  const narrative = C.isObj(snapshot) ? NARRATIVE_BY_RIVAL_ID[snapshot.rivalId] : undefined;
  const bot = narrative ? getBotById(narrative.canonicalBotId) : undefined;
  if (C.isObj(snapshot) && !bot) p.push(C.problem("unknown-rival", "snapshot.rivalId"));
  if (p.length) return C.fail(p);
  return C.ok(C.deepFreeze({
    contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, subjectId: snapshot.subjectId, revision: snapshot.revision,
    visibilityPolicyRef: C.copyVersionRef(vis.policyRef),
    rival: { rivalId: narrative.rivalId, canonicalBotId: bot.id, displayName: bot.name, participantKind: "ai_persona", aiBadge: C.aiBadgeFor("ai_persona") },
    entries: snapshot.entries.map((e) => ({
      memoryId: e.memoryId, kind: e.kind, encounterId: e.encounterId, observedAt: e.observedAt,
      narrative: { code: e.narrativeFact.code, text: vis.showText === true ? e.narrativeFact.text : null },
    })),
    updatedAt: snapshot.updatedAt,
  }));
}

module.exports = { reduceRelationshipMemory, projectRelationshipMemory, FACT_KINDS };
