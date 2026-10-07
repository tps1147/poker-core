// Profile identity, reward claims and cosmetics against F52-V1-CONTRACT-1 §9/§11 fixtures.
//   node test/v1/profile/profileIdentity.test.cjs
"use strict";
const assert = require("node:assert/strict");
const P = require("../../../src/profile/v1/index.cjs");
const { fingerprintOf, CONTRACT_ID, SCHEMA_VERSION, deepFreeze } = require("../../../src/gauntlet/v1/common.cjs");

const ENV = { contractId: CONTRACT_ID, schemaVersion: SCHEMA_VERSION };
const V = (id, version = "1") => ({ id, version, sha256: null });
const S = (kind, recordId) => ({ kind, recordId, recordVersion: "1", sourceHash: null });
const codes = (r) => (r.ok ? [] : r.problems.map((x) => x.code));
const fp = (o) => ({ ...o, fingerprint: fingerprintOf(o) });
const clone = (v) => JSON.parse(JSON.stringify(v));

let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (e) { console.error(`FAIL ${name}`); throw e; } };

const CAT_REF = V("cosmetics-catalog");
const item = (cosmeticId, kind, existingAssetId = null) => ({ cosmeticId, catalogRef: CAT_REF, kind, assetRef: S("asset", `asset-${cosmeticId}`),
  unlockPolicyRef: V("unlock-by-grant"), existingAssetId });
const CATALOG = { catalogRef: CAT_REF, items: [item("cb-gauntlet-bronze", "card_back"), item("cb-classic-red", "card_back", "classic_red"), item("title-first-rival", "title")] };
const achievement = (over = {}) => ({ ...ENV, achievement: V("ach-first-rival"), title: "First Rival", description: "Finish a match against your first Gauntlet rival.",
  evidencePolicyRef: V("evidence-encounter-result"), repeatPolicyRef: V("repeat-once"), visibilityPolicyRef: V("vis-public"),
  cosmeticRewardIds: ["cb-gauntlet-bronze", "title-first-rival"], existingAchievementName: null, ...over });
const rewardPolicy = (over = {}) => ({ policy: V("reward-policy"), status: "accepted", acceptanceRef: S("receipt", "reward-accept"),
  achievements: { "ach-first-rival@1": achievement() }, catalog: CATALOG,
  idempotencyKeyFor: (subjectId, ref, scopeId) => `${subjectId}|${ref.id}@${ref.version}|${scopeId}`, ...over });
const eligibility = (over = {}) => fp({ ...ENV, eligibilityId: "elig-1", subjectId: "user-1", achievementRef: V("ach-first-rival"), scopeId: "lifetime",
  evidenceRefs: [S("encounter_result", "res-1")], policyRef: V("evidence-encounter-result"), eligible: true, reasonCodes: ["encounter_completed"],
  recordedAt: "2026-10-06T20:00:00Z", ...over });
const grantFrom = (proposal, over = {}) => ({ ...ENV, grantId: "grant-1", claimId: proposal.claimId, idempotencyKey: proposal.idempotencyKey,
  proposalFingerprint: proposal.fingerprint, subjectId: proposal.subjectId, achievementRef: proposal.achievementRef, scopeId: proposal.scopeId,
  evidenceRefs: [S("encounter_result", "res-1")], cosmeticRewardIds: proposal.cosmeticRewardIds, rewardCatalogRef: proposal.rewardCatalogRef,
  committedSource: S("reward_settlement", "rs-1"), committedAt: "2026-10-06T20:01:00Z", state: "committed", ...over });
const equipPolicy = (over = {}) => ({ policy: V("equip-policy"), status: "accepted", acceptanceRef: S("receipt", "equip-accept"), existingOwnedAssetIds: ["classic_red"], ...over });

const proposal = () => P.proposeRewardClaim(eligibility(), rewardPolicy(), {}).value;
const inventory = () => P.reduceRewardInventory(null, grantFrom(proposal()), CATALOG).value;

check("achievement definitions: valid; unknown cosmetic; unknown existing alias; competitive/entitlement fields rejected", () => {
  assert.ok(P.validateAchievementDefinition(achievement(), { catalog: CATALOG }).ok);
  assert.ok(codes(P.validateAchievementDefinition(achievement({ cosmeticRewardIds: ["cb-nope"] }), { catalog: CATALOG })).includes("unknown-cosmetic"));
  assert.ok(codes(P.validateAchievementDefinition(achievement({ existingAchievementName: "Made Up" }), { existingAchievementNames: ["First Victory"] })).includes("unknown-existing-achievement"));
  assert.ok(P.validateAchievementDefinition(achievement({ existingAchievementName: "First Victory" }), { existingAchievementNames: ["First Victory"] }).ok);
  assert.ok(codes(P.validateAchievementDefinition({ ...achievement(), entitlements: { pro: true } })).includes("competitive-or-entitlement-field"));
  assert.ok(codes(P.validateAchievementDefinition({ ...achievement(), contractId: "F52-V0" })).includes("unknown-contract"));
});

check("proposeRewardClaim returns a proposal only, never a commit", () => {
  const r = P.proposeRewardClaim(eligibility(), rewardPolicy(), {});
  assert.ok(r.ok, JSON.stringify(r.problems));
  const c = r.value;
  assert.equal(c.state, "proposed");
  assert.equal(c.fingerprint, fingerprintOf(c));
  assert.ok(!("grantId" in c) && !("committedAt" in c) && !("committedSource" in c));
  assert.deepEqual(c.cosmeticRewardIds, ["cb-gauntlet-bronze", "title-first-rival"]);
  assert.equal(c.idempotencyKey, "user-1|ach-first-rival@1|lifetime");
  assert.ok(Object.isFrozen(c));
  // Deterministic: same eligibility gives the same claim.
  assert.deepEqual(P.proposeRewardClaim(eligibility(), rewardPolicy(), {}).value, c);
});

check("claims are once-only and fail closed on missing policy, index, provenance or eligibility", () => {
  const key = "user-1|ach-first-rival@1|lifetime";
  assert.deepEqual(codes(P.proposeRewardClaim(eligibility(), rewardPolicy(), { [key]: { grantId: "grant-1", proposalFingerprint: "0".repeat(64) } })), ["already-granted"]);
  assert.deepEqual(codes(P.proposeRewardClaim(eligibility(), rewardPolicy(), undefined)), ["grant-index-required"]);
  assert.ok(codes(P.proposeRewardClaim(eligibility(), undefined, {})).includes("POLICY_UNSELECTED"));
  assert.ok(codes(P.proposeRewardClaim(eligibility(), rewardPolicy({ status: "unselected" }), {})).includes("POLICY_UNSELECTED"));
  assert.ok(codes(P.proposeRewardClaim(eligibility(), rewardPolicy({ acceptanceRef: null }), {})).includes("POLICY_INCOMPLETE"));
  assert.ok(codes(P.proposeRewardClaim(eligibility(), rewardPolicy({ idempotencyKeyFor: undefined }), {})).includes("POLICY_INCOMPLETE"));
  assert.ok(codes(P.proposeRewardClaim(eligibility({ evidenceRefs: [] }), rewardPolicy(), {})).includes("missing-provenance"));
  assert.deepEqual(codes(P.proposeRewardClaim(eligibility({ eligible: false }), rewardPolicy(), {})), ["not-eligible"]);
  assert.ok(codes(P.proposeRewardClaim(eligibility({ achievementRef: V("ach-first-rival", "2") }), rewardPolicy(), {})).includes("unknown-achievement-version"));
  assert.ok(codes(P.proposeRewardClaim(eligibility({ policyRef: V("evidence-other") }), rewardPolicy(), {})).includes("policy-version-mismatch"));
  // A client cannot hand-edit admitted eligibility: the fingerprint no longer matches.
  assert.ok(codes(P.proposeRewardClaim({ ...eligibility(), subjectId: "user-2" }, rewardPolicy(), {})).includes("fingerprint-mismatch"));
  assert.ok(codes(P.proposeRewardClaim(eligibility(), rewardPolicy({ achievements: { "ach-first-rival@1": achievement({ cosmeticRewardIds: ["cb-nope"] }) } }), {})).includes("unknown-cosmetic"));
});

check("a proposal mistaken for a commit cannot establish ownership", () => {
  const c = proposal();
  assert.deepEqual(codes(P.reduceRewardInventory(null, c, CATALOG)), ["not-a-committed-grant"]);
  const relabelled = { ...c, state: "committed" };
  const r = P.reduceRewardInventory(null, relabelled, CATALOG);
  assert.ok(!r.ok);
  assert.ok(codes(r).includes("missing-field") && codes(r).includes("unknown-field"));
  assert.ok(codes(P.reduceRewardInventory(null, grantFrom(c, { committedSource: null }), CATALOG)).includes("missing-provenance"));
  assert.ok(codes(P.reduceRewardInventory(null, grantFrom(c, { evidenceRefs: [] }), CATALOG)).includes("missing-provenance"));
});

check("committed grant gives ownership once; replay duplicate; changed grant and reused key conflict", () => {
  const c = proposal();
  const r = P.reduceRewardInventory(null, grantFrom(c), CATALOG);
  assert.ok(r.ok, JSON.stringify(r.problems));
  assert.deepEqual(r.value.ownership.map((o) => o.cosmeticId), ["cb-gauntlet-bronze", "title-first-rival"]);
  assert.equal(r.value.revision, 1);
  const dup = P.reduceRewardInventory(r.value, grantFrom(c), CATALOG);
  assert.equal(dup.disposition, "duplicate");
  assert.equal(dup.value.ownership.length, 2);
  assert.deepEqual(codes(P.reduceRewardInventory(r.value, grantFrom(c, { proposalFingerprint: "f".repeat(64) }), CATALOG)), ["grant-id-conflict"]);
  assert.deepEqual(codes(P.reduceRewardInventory(r.value, grantFrom(c, { grantId: "grant-2" }), CATALOG)), ["idempotency-key-conflict"]);
});

check("unknown cosmetic, catalog version mismatch and invalid ownership reject", () => {
  const c = proposal();
  assert.ok(codes(P.reduceRewardInventory(null, grantFrom(c, { cosmeticRewardIds: ["cb-ghost"] }), CATALOG)).includes("unknown-cosmetic"));
  assert.ok(codes(P.reduceRewardInventory(null, grantFrom(c, { rewardCatalogRef: V("cosmetics-catalog", "2") }), CATALOG)).includes("catalog-version-mismatch"));
  assert.ok(codes(P.reduceRewardInventory(inventory(), grantFrom(c, { grantId: "grant-9", idempotencyKey: "k9", subjectId: "user-2" }), CATALOG)).includes("subject-mismatch"));
  assert.ok(codes(P.reduceRewardInventory(null, grantFrom(c), undefined)).includes("unknown-catalog"));
  assert.ok(codes(P.reduceRewardInventory(null, { ...grantFrom(c), entitlements: { pro: true } }, CATALOG)).includes("competitive-or-entitlement-field"));
  assert.ok(codes(P.deriveCosmeticEquipEligibility(inventory(), "cb-ghost", CATALOG, equipPolicy())).includes("unknown-cosmetic"));
});

check("equip eligibility derives from ownership and never creates it", () => {
  const inv = deepFreeze(inventory());
  const before = clone(inv);
  const owned = P.deriveCosmeticEquipEligibility(inv, "cb-gauntlet-bronze", CATALOG, equipPolicy());
  assert.ok(owned.ok, JSON.stringify(owned.problems));
  assert.equal(owned.disposition, "unchanged");
  assert.equal(owned.value.eligible, true);
  assert.equal(owned.value.basis, "v1_grant");
  assert.equal(owned.value.grantId, "grant-1");
  const existing = P.deriveCosmeticEquipEligibility(inv, "cb-classic-red", CATALOG, equipPolicy());
  assert.equal(existing.value.basis, "existing_ownership", "existing earned assets stay authoritative via alias");
  const notOwned = P.deriveCosmeticEquipEligibility(inv, "cb-classic-red", CATALOG, equipPolicy({ existingOwnedAssetIds: [] }));
  assert.equal(notOwned.value.eligible, false);
  assert.deepEqual(notOwned.value.reasonCodes, ["not_owned"]);
  assert.deepEqual(inv, before, "inventory unchanged by equip derivation");
  assert.ok(codes(P.deriveCosmeticEquipEligibility(inv, "cb-gauntlet-bronze", CATALOG, undefined)).includes("POLICY_UNSELECTED"));
  assert.ok(codes(P.deriveCosmeticEquipEligibility(inv, "cb-gauntlet-bronze", CATALOG, equipPolicy({ existingOwnedAssetIds: undefined }))).includes("POLICY_INCOMPLETE"));
});

const identity = (over = {}) => ({ subjectId: "user-1", participantKind: "human", displayName: "Player One", avatarAssetId: "avatar-7",
  entitlements: { pro: true, proLessonsOpen: true }, existingAchievements: [{ name: "First Victory", dateUnlocked: "2026-09-01T10:00:00Z" }],
  inventory: inventory(), equipped: { card_back: "classic_red", avatar: null, title: "title-first-rival", table: null },
  skill: { committedResultId: "rating-res-9", estimate: 1234, uncertaintyStatus: "unknown", modelRef: V("rating-model"), policyRef: V("rating-policy") },
  reasonCodes: ["placement_provisional", "internal_audit_code"], ...over });
const VIS = { known: true, policyRef: V("profile-vis"), showActivity: true, showCosmetics: true, reasonText: { placement_provisional: "Rating is provisional." } };

check("entitlements are preserved: never read, projected or changed by any profile operation", () => {
  const src = deepFreeze(identity());
  const snapshot = clone(src.entitlements);
  const r = P.projectProfileIdentity(src, VIS);
  assert.ok(r.ok, JSON.stringify(r.problems));
  const text = JSON.stringify(r.value);
  assert.ok(!text.includes("entitlements") && !text.includes("proLessonsOpen") && !/"pro"/.test(text));
  assert.deepEqual(src.entitlements, snapshot);
  P.deriveCosmeticEquipEligibility(src.inventory, "cb-gauntlet-bronze", CATALOG, equipPolicy());
  assert.deepEqual(src.entitlements, snapshot);
});

check("activity and cosmetics stay separate from skill; skill only from a committed rating projection", () => {
  const a = P.projectProfileIdentity(identity({ inventory: null }), VIS).value;
  const b = P.projectProfileIdentity(identity(), VIS).value;
  assert.deepEqual(a.skill, b.skill, "grants do not move skill");
  assert.equal(a.activity.grantedAchievements.length, 0);
  assert.equal(b.activity.grantedAchievements.length, 1);
  assert.deepEqual(b.cosmetics.owned.map((o) => o.cosmeticId), ["cb-gauntlet-bronze", "title-first-rival"]);
  assert.deepEqual(b.reasons, [{ code: "placement_provisional", text: "Rating is provisional." }], "only allowlisted reason codes are public");
  assert.ok(codes(P.projectProfileIdentity(identity({ skill: { estimate: 1500 } }), VIS)).includes("invalid-skill"));
  const hidden = P.projectProfileIdentity(identity(), { ...VIS, showActivity: false, showCosmetics: false }).value;
  assert.equal(hidden.activity, null);
  assert.equal(hidden.cosmetics, null);
});

check("readable AI identity is retained for AI personas; kind is never inferred", () => {
  const ai = P.projectProfileIdentity(identity({ subjectId: "persona-42", participantKind: "ai_persona", displayName: "Marisol Vega", inventory: null }), VIS);
  assert.ok(ai.ok, JSON.stringify(ai.problems));
  assert.equal(ai.value.identity.displayName, "Marisol Vega");
  assert.deepEqual(ai.value.identity.aiBadge, { text: "AI", accessibleLabel: "AI player" });
  const human = P.projectProfileIdentity(identity(), VIS).value;
  assert.equal(human.identity.aiBadge, null);
  assert.ok(codes(P.projectProfileIdentity(identity({ participantKind: undefined }), VIS)).includes("unknown-participant-kind"));
  assert.ok(codes(P.projectProfileIdentity(identity({ subjectId: "user-2" }), VIS)).includes("subject-mismatch"));
  assert.ok(codes(P.projectProfileIdentity(identity(), { ...VIS, known: false })).includes("unknown-visibility-policy"));
});

console.log(`profile identity: ${checks} checks passed`);
