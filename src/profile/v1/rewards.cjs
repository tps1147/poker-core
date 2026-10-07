"use strict";
// Achievement claims and cosmetic ownership (F52-V1-CONTRACT-1 §9). Pure: a claim is only ever a
// proposal; ownership comes only from a grant main committed; equip eligibility derives, never writes.
// Existing AchievementService grants (name/date/icon rows on User.achievements), card-back ownership
// and entitlements stay authoritative and are not changed or re-derived here.
//
// suppliedCatalog = { catalogRef: VersionRef, items: CosmeticCatalogItem[] }
// suppliedRewardPolicy = { policy: VersionRef, status: "accepted", acceptanceRef: SourceRef,
//   achievements: { [id@version]: AchievementDefinition }, catalog: suppliedCatalog,
//   idempotencyKeyFor(subjectId, achievementRef, scopeId) -> string     main's key under the repeat policy }
// existingGrantIndex = { [idempotencyKey]: { grantId, proposalFingerprint } }   main's persisted grants
// suppliedEquipPolicy = { policy: VersionRef, status: "accepted", acceptanceRef: SourceRef,
//   existingOwnedAssetIds: string[] }      existing earned/owned asset ids from the current user record

const C = require("../../gauntlet/v1/common.cjs");

const KINDS = ["card_back", "avatar", "title", "table"];
const ACH_KEYS = ["contractId", "schemaVersion", "achievement", "title", "description", "evidencePolicyRef", "repeatPolicyRef", "visibilityPolicyRef",
  "cosmeticRewardIds", "existingAchievementName"];
const ITEM_KEYS = ["cosmeticId", "catalogRef", "kind", "assetRef", "unlockPolicyRef", "existingAssetId"];
const ELIG_KEYS = ["contractId", "schemaVersion", "eligibilityId", "fingerprint", "subjectId", "achievementRef", "scopeId", "evidenceRefs", "policyRef",
  "eligible", "reasonCodes", "recordedAt"];
const GRANT_KEYS = ["contractId", "schemaVersion", "grantId", "claimId", "idempotencyKey", "proposalFingerprint", "subjectId", "achievementRef", "scopeId",
  "evidenceRefs", "cosmeticRewardIds", "rewardCatalogRef", "committedSource", "committedAt", "state"];
const INVENTORY_KEYS = ["contractId", "schemaVersion", "subjectId", "revision", "processedGrants", "grants", "ownership"];
// Fields that would let a reward touch competition or access (§9: cosmetics cannot change them).
const FORBIDDEN = new Set(["entitlements", "pro", "proLessonsOpen", "rating", "elo", "placement", "mastery", "seasonHighest", "skill"]);

function scanForbidden(v, p, path = "") {
  if (Array.isArray(v)) { v.forEach((x, i) => scanForbidden(x, p, `${path}[${i}]`)); return; }
  if (!C.isObj(v)) return;
  for (const k of Object.keys(v)) {
    const at = `${path}${path ? "." : ""}${k}`;
    if (FORBIDDEN.has(k)) p.push(C.problem("competitive-or-entitlement-field", at, "rewards and cosmetics cannot carry rating, mastery or entitlement data"));
    scanForbidden(v[k], p, at);
  }
}
const checkIdList = (list, p, path) => {
  if (!Array.isArray(list) || !list.every(C.isStr)) { p.push(C.problem("invalid-id-list", path)); return false; }
  if (new Set(list).size !== list.length) { p.push(C.problem("duplicate-id", path)); return false; }
  return true;
};
const checkEvidenceRefs = (refs, p, path) => {
  if (!Array.isArray(refs) || refs.length === 0) { p.push(C.problem("missing-provenance", path, "at least one admitted evidence ref is required")); return; }
  refs.forEach((r, i) => C.checkSourceRef(r, p, `${path}[${i}]`));
};

// Returns a Map cosmeticId -> item, or null with problems.
function catalogIndex(cat, p, path = "suppliedCatalog") {
  if (!C.isObj(cat) || !C.isVersionRef(cat.catalogRef) || !Array.isArray(cat.items)) { p.push(C.problem("unknown-catalog", path)); return null; }
  const before = p.length;
  const map = new Map();
  cat.items.forEach((it, i) => {
    const at = `${path}.items[${i}].`;
    if (!C.isObj(it)) { p.push(C.problem("invalid-catalog-item", at)); return; }
    C.closedKeys(it, ITEM_KEYS, p, at);
    scanForbidden(it, p, at);
    if (!C.isStr(it.cosmeticId)) p.push(C.problem("invalid-id", `${at}cosmeticId`));
    else if (map.has(it.cosmeticId)) p.push(C.problem("duplicate-id", `${at}cosmeticId`));
    if (!C.sameRef(it.catalogRef, cat.catalogRef)) p.push(C.problem("catalog-version-mismatch", `${at}catalogRef`));
    if (!KINDS.includes(it.kind)) p.push(C.problem("unknown-cosmetic-kind", `${at}kind`));
    C.checkSourceRef(it.assetRef, p, `${at}assetRef`);
    C.checkVersionRef(it.unlockPolicyRef, p, `${at}unlockPolicyRef`);
    if (!(it.existingAssetId === null || C.isStr(it.existingAssetId))) p.push(C.problem("invalid-id", `${at}existingAssetId`));
    map.set(it.cosmeticId, it);
  });
  return p.length > before ? null : map;
}

// suppliedIndex (optional) = { catalog?: suppliedCatalog, existingAchievementNames?: string[] }
function validateAchievementDefinition(def, suppliedIndex = null) {
  const p = [];
  C.checkEnvelope(def, p);
  if (!C.isObj(def)) return C.fail(p);
  C.closedKeys(def, ACH_KEYS, p);
  C.scanPrivate(def, p);
  scanForbidden(def, p);
  C.checkVersionRef(def.achievement, p, "achievement");
  for (const k of ["title", "description"]) if (!C.isStr(def[k])) p.push(C.problem("invalid-text", k));
  for (const k of ["evidencePolicyRef", "repeatPolicyRef", "visibilityPolicyRef"]) C.checkVersionRef(def[k], p, k);
  const idsOk = checkIdList(def.cosmeticRewardIds, p, "cosmeticRewardIds");
  if (!(def.existingAchievementName === null || C.isStr(def.existingAchievementName))) p.push(C.problem("invalid-text", "existingAchievementName"));
  if (suppliedIndex && Array.isArray(suppliedIndex.existingAchievementNames) && C.isStr(def.existingAchievementName)
    && !suppliedIndex.existingAchievementNames.includes(def.existingAchievementName)) {
    p.push(C.problem("unknown-existing-achievement", "existingAchievementName", "aliases must name an existing achievement"));
  }
  if (suppliedIndex && suppliedIndex.catalog !== undefined && idsOk) {
    const map = catalogIndex(suppliedIndex.catalog, p);
    if (map) def.cosmeticRewardIds.forEach((id, i) => { if (!map.has(id)) p.push(C.problem("unknown-cosmetic", `cosmeticRewardIds[${i}]`)); });
  }
  if (p.length) return C.fail(p);
  return C.ok(C.deepFreeze(C.clone(def)));
}

function validateEligibility(f, p) {
  C.checkEnvelope(f, p, "admittedEligibility.");
  if (!C.isObj(f)) return;
  C.closedKeys(f, ELIG_KEYS, p, "admittedEligibility.");
  C.scanPrivate(f, p, "admittedEligibility");
  for (const k of ["eligibilityId", "subjectId", "scopeId"]) if (!C.isStr(f[k])) p.push(C.problem("invalid-id", `admittedEligibility.${k}`));
  C.checkFingerprint(f, p, "admittedEligibility.fingerprint");
  C.checkVersionRef(f.achievementRef, p, "admittedEligibility.achievementRef");
  C.checkVersionRef(f.policyRef, p, "admittedEligibility.policyRef");
  checkEvidenceRefs(f.evidenceRefs, p, "admittedEligibility.evidenceRefs");
  if (typeof f.eligible !== "boolean") p.push(C.problem("invalid-eligible", "admittedEligibility.eligible"));
  if (!Array.isArray(f.reasonCodes) || !f.reasonCodes.every(C.isStr)) p.push(C.problem("invalid-reason-codes", "admittedEligibility.reasonCodes"));
  if (!C.isTs(f.recordedAt)) p.push(C.problem("invalid-timestamp", "admittedEligibility.recordedAt"));
}

function proposeRewardClaim(admittedEligibility, suppliedRewardPolicy, existingGrantIndex) {
  const p = [];
  const pol = suppliedRewardPolicy;
  const accepted = C.checkAcceptedPolicy(pol, p, "suppliedRewardPolicy");
  validateEligibility(admittedEligibility, p);
  if (!accepted || p.length) return C.fail(p);
  if (!C.isObj(pol.achievements) || typeof pol.idempotencyKeyFor !== "function") return C.fail([C.problem("POLICY_INCOMPLETE", "suppliedRewardPolicy")]);
  if (!C.isObj(existingGrantIndex)) return C.fail([C.problem("grant-index-required", "existingGrantIndex", "once-only cannot be checked without main's grant index")]);
  const f = admittedEligibility;
  if (f.eligible !== true) return C.fail([C.problem("not-eligible", "admittedEligibility.eligible")]);

  const def = pol.achievements[C.refKey(f.achievementRef)];
  if (!def || !C.sameRef(def.achievement, f.achievementRef)) return C.fail([C.problem("unknown-achievement-version", "admittedEligibility.achievementRef")]);
  const dv = validateAchievementDefinition(def, { catalog: pol.catalog });
  if (!dv.ok) return C.fail(dv.problems.map((x) => ({ ...x, path: `achievement.${x.path ?? ""}` })));
  if (!C.sameRef(f.policyRef, def.evidencePolicyRef)) return C.fail([C.problem("policy-version-mismatch", "admittedEligibility.policyRef", "eligibility was decided under another evidence policy")]);

  const key = pol.idempotencyKeyFor(f.subjectId, C.copyVersionRef(f.achievementRef), f.scopeId);
  if (!C.isStr(key)) return C.fail([C.problem("POLICY_INCOMPLETE", "suppliedRewardPolicy.idempotencyKeyFor", "main's idempotency key is required")]);
  if (Object.prototype.hasOwnProperty.call(existingGrantIndex, key)) {
    return C.fail([C.problem("already-granted", "existingGrantIndex", `grant ${existingGrantIndex[key]?.grantId ?? "(unknown)"} already holds this key`)]);
  }
  const proposal = {
    contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION,
    claimId: `claim-${C.sha256(key).slice(0, 32)}`, idempotencyKey: key,
    subjectId: f.subjectId, achievementRef: C.copyVersionRef(f.achievementRef), scopeId: f.scopeId, eligibilityId: f.eligibilityId,
    rewardCatalogRef: C.copyVersionRef(pol.catalog.catalogRef), cosmeticRewardIds: def.cosmeticRewardIds.slice(),
    state: "proposed", // never "committed": only main's settlement creates a CommittedRewardGrant
  };
  proposal.fingerprint = C.fingerprintOf(proposal);
  return C.ok(C.deepFreeze(proposal), "applied");
}

const emptyInventory = (subjectId) => ({ contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, subjectId, revision: 0, processedGrants: [], grants: [], ownership: [] });

function reduceRewardInventory(snapshot, committedGrant, suppliedCatalog) {
  const p = [];
  const g = committedGrant;
  if (C.isObj(g) && g.state !== "committed") {
    return C.fail([C.problem("not-a-committed-grant", "committedGrant.state", "a proposal or unacknowledged claim cannot establish ownership")]);
  }
  C.checkEnvelope(g, p, "committedGrant.");
  if (!C.isObj(g)) return C.fail(p);
  C.closedKeys(g, GRANT_KEYS, p, "committedGrant.");
  C.scanPrivate(g, p, "committedGrant");
  scanForbidden(g, p, "committedGrant");
  for (const k of ["grantId", "claimId", "idempotencyKey", "subjectId", "scopeId"]) if (!C.isStr(g[k])) p.push(C.problem("invalid-id", `committedGrant.${k}`));
  if (!C.isHex64(g.proposalFingerprint)) p.push(C.problem("invalid-fingerprint", "committedGrant.proposalFingerprint"));
  C.checkVersionRef(g.achievementRef, p, "committedGrant.achievementRef");
  C.checkVersionRef(g.rewardCatalogRef, p, "committedGrant.rewardCatalogRef");
  checkEvidenceRefs(g.evidenceRefs, p, "committedGrant.evidenceRefs");
  C.checkSourceRef(g.committedSource, p, "committedGrant.committedSource");
  if (!C.isTs(g.committedAt)) p.push(C.problem("invalid-timestamp", "committedGrant.committedAt"));
  const idsOk = checkIdList(g.cosmeticRewardIds, p, "committedGrant.cosmeticRewardIds");
  const map = catalogIndex(suppliedCatalog, p);
  if (map) {
    if (C.isVersionRef(g.rewardCatalogRef) && !C.sameRef(g.rewardCatalogRef, suppliedCatalog.catalogRef)) p.push(C.problem("catalog-version-mismatch", "committedGrant.rewardCatalogRef"));
    if (idsOk) g.cosmeticRewardIds.forEach((id, i) => { if (!map.has(id)) p.push(C.problem("unknown-cosmetic", `committedGrant.cosmeticRewardIds[${i}]`)); });
  }
  if (p.length) return C.fail(p);

  const snap = snapshot ? C.clone(snapshot) : emptyInventory(g.subjectId);
  C.checkEnvelope(snap, p, "snapshot.");
  C.closedKeys(snap, INVENTORY_KEYS, p, "snapshot.");
  if (snap.subjectId !== g.subjectId) p.push(C.problem("subject-mismatch", "committedGrant.subjectId", "the grant belongs to another subject"));
  if (!C.isCount(snap.revision)) p.push(C.problem("invalid-revision", "snapshot.revision"));
  if (p.length) return C.fail(p);

  const byId = snap.processedGrants.find((x) => x.grantId === g.grantId);
  if (byId) {
    if (byId.idempotencyKey === g.idempotencyKey && byId.proposalFingerprint === g.proposalFingerprint) return C.ok(C.deepFreeze(snap), "duplicate");
    return C.fail([C.problem("grant-id-conflict", "committedGrant.grantId", "the same grant id arrived with different data")]);
  }
  if (snap.processedGrants.some((x) => x.idempotencyKey === g.idempotencyKey)) {
    return C.fail([C.problem("idempotency-key-conflict", "committedGrant.idempotencyKey", "this reward was already granted once")]);
  }
  snap.grants.push(C.clone(g));
  for (const id of g.cosmeticRewardIds) {
    if (snap.ownership.some((o) => o.cosmeticId === id)) continue; // already owned through an earlier grant
    snap.ownership.push({ subjectId: g.subjectId, cosmeticId: id, grantId: g.grantId, catalogRef: C.copyVersionRef(g.rewardCatalogRef), grantedAt: g.committedAt });
  }
  snap.processedGrants.push({ grantId: g.grantId, idempotencyKey: g.idempotencyKey, proposalFingerprint: g.proposalFingerprint });
  snap.revision += 1;
  return C.ok(C.deepFreeze(snap), "applied");
}

// Derivation only (disposition "unchanged"): an equip request never creates ownership.
function deriveCosmeticEquipEligibility(ownershipSnapshot, requestedCosmeticId, suppliedCatalog, suppliedEquipPolicy) {
  const p = [];
  const accepted = C.checkAcceptedPolicy(suppliedEquipPolicy, p, "suppliedEquipPolicy");
  if (accepted && !(Array.isArray(suppliedEquipPolicy.existingOwnedAssetIds) && suppliedEquipPolicy.existingOwnedAssetIds.every(C.isStr))) {
    p.push(C.problem("POLICY_INCOMPLETE", "suppliedEquipPolicy.existingOwnedAssetIds"));
  }
  C.checkEnvelope(ownershipSnapshot, p, "ownershipSnapshot.");
  if (C.isObj(ownershipSnapshot)) C.closedKeys(ownershipSnapshot, INVENTORY_KEYS, p, "ownershipSnapshot.");
  const map = catalogIndex(suppliedCatalog, p);
  if (p.length) return C.fail(p);
  const item = C.isStr(requestedCosmeticId) ? map.get(requestedCosmeticId) : undefined;
  if (!item) return C.fail([C.problem("unknown-cosmetic", "requestedCosmeticId")]);

  const own = ownershipSnapshot.ownership.find((o) => o.cosmeticId === item.cosmeticId && o.subjectId === ownershipSnapshot.subjectId);
  if (own && !C.sameRef(own.catalogRef, suppliedCatalog.catalogRef)) return C.fail([C.problem("catalog-version-mismatch", "ownershipSnapshot.ownership")]);
  const existing = item.existingAssetId !== null && suppliedEquipPolicy.existingOwnedAssetIds.includes(item.existingAssetId);
  const basis = own ? "v1_grant" : existing ? "existing_ownership" : null;
  return C.ok(C.deepFreeze({
    contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, subjectId: ownershipSnapshot.subjectId,
    cosmeticId: item.cosmeticId, kind: item.kind, existingAssetId: item.existingAssetId,
    eligible: basis !== null, basis, grantId: own ? own.grantId : null,
    reasonCodes: [basis === null ? "not_owned" : `owned_${basis}`],
    policyRef: C.copyVersionRef(suppliedEquipPolicy.policy),
  }), "unchanged");
}

module.exports = { validateAchievementDefinition, proposeRewardClaim, reduceRewardInventory, deriveCosmeticEquipEligibility, KINDS };
