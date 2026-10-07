"use strict";
// Public profile identity (F52-V1-CONTRACT-1 §6, §9, §11): an allowlisted public model built field by
// field. Activity (achievements) and cosmetics are separate sections from skill, and skill comes only
// from a committed public rating projection supplied by main, never from activity. Existing
// entitlements are authoritative: they are read by nothing here, never projected and never changed.
// AI personas keep their readable name and get the trusted AI badge; kind is never inferred.
//
// identitySource = {
//   subjectId, participantKind: "human" | "ai_persona"   (trusted, propagated by main),
//   displayName, avatarAssetId: string | null,
//   entitlements?: object                                 existing User.entitlements; ignored here
//   existingAchievements: { name: string, dateUnlocked: timestamp }[]   current User.achievements rows
//   inventory: RewardInventorySnapshot | null,
//   equipped: { card_back, avatar, title, table }         existing equipped ids or null
//   skill: { committedResultId, estimate: number | null,
//            uncertaintyStatus: "estimated" | "unknown" | "unassessable",
//            modelRef: VersionRef, policyRef: VersionRef } | null
//   reasonCodes: string[]
// }
// suppliedVisibilityPolicy = { known: true, policyRef: VersionRef, showActivity: boolean,
//   showCosmetics: boolean, reasonText: { [code]: string } }   only listed codes are shown

const C = require("../../gauntlet/v1/common.cjs");
const { KINDS } = require("./rewards.cjs");

const KIND_VALUES = ["human", "ai_persona"];
const UNCERTAINTY = ["estimated", "unknown", "unassessable"];

function projectProfileIdentity(identitySource, suppliedVisibilityPolicy) {
  const p = [];
  const s = identitySource;
  const vis = suppliedVisibilityPolicy;
  if (!C.isObj(vis) || vis.known !== true || !C.isVersionRef(vis.policyRef) || !C.isObj(vis.reasonText)) p.push(C.problem("unknown-visibility-policy", "suppliedVisibilityPolicy"));
  if (!C.isObj(s)) return C.fail(p.concat([C.problem("not-an-object", "identitySource")]));
  if (!C.isStr(s.subjectId)) p.push(C.problem("invalid-id", "subjectId"));
  if (!KIND_VALUES.includes(s.participantKind)) p.push(C.problem("unknown-participant-kind", "participantKind", "main must propagate the trusted human/AI kind"));
  if (!C.isStr(s.displayName)) p.push(C.problem("invalid-text", "displayName"));
  if (!(s.avatarAssetId === null || C.isStr(s.avatarAssetId))) p.push(C.problem("invalid-id", "avatarAssetId"));
  if (!Array.isArray(s.existingAchievements) || !s.existingAchievements.every((a) => C.isObj(a) && C.isStr(a.name) && (a.dateUnlocked === null || C.isTs(a.dateUnlocked)))) {
    p.push(C.problem("invalid-existing-achievements", "existingAchievements"));
  }
  const inv = s.inventory;
  if (inv !== null) {
    C.checkEnvelope(inv, p, "inventory.");
    if (C.isObj(inv) && inv.subjectId !== s.subjectId) p.push(C.problem("subject-mismatch", "inventory.subjectId", "inventory belongs to another subject"));
    if (C.isObj(inv) && !(Array.isArray(inv.grants) && Array.isArray(inv.ownership))) p.push(C.problem("invalid-inventory", "inventory"));
  }
  if (!C.isObj(s.equipped) || !KINDS.every((k) => s.equipped[k] === null || C.isStr(s.equipped[k]))) p.push(C.problem("invalid-equipped", "equipped"));
  const sk = s.skill;
  if (sk !== null && !(C.isObj(sk) && C.isStr(sk.committedResultId) && (sk.estimate === null || Number.isFinite(sk.estimate))
    && UNCERTAINTY.includes(sk.uncertaintyStatus) && C.isVersionRef(sk.modelRef) && C.isVersionRef(sk.policyRef))) {
    p.push(C.problem("invalid-skill", "skill", "skill must be a committed public rating projection or null"));
  }
  if (!Array.isArray(s.reasonCodes) || !s.reasonCodes.every(C.isStr)) p.push(C.problem("invalid-reason-codes", "reasonCodes"));
  if (p.length) return C.fail(p);

  const activity = vis.showActivity === true ? {
    existingAchievements: s.existingAchievements.map((a) => ({ name: a.name, dateUnlocked: a.dateUnlocked })),
    grantedAchievements: (inv ? inv.grants : []).map((g) => ({ achievementId: g.achievementRef.id, achievementVersion: g.achievementRef.version, grantId: g.grantId, committedAt: g.committedAt })),
  } : null;
  const cosmetics = vis.showCosmetics === true ? {
    owned: (inv ? inv.ownership : []).map((o) => ({ cosmeticId: o.cosmeticId, grantedAt: o.grantedAt })),
    equipped: Object.fromEntries(KINDS.map((k) => [k, s.equipped[k]])),
  } : null;

  return C.ok(C.deepFreeze({
    contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, subjectId: s.subjectId, visibilityPolicyRef: C.copyVersionRef(vis.policyRef),
    identity: { displayName: s.displayName, participantKind: s.participantKind, aiBadge: C.aiBadgeFor(s.participantKind), avatarAssetId: s.avatarAssetId },
    activity,
    cosmetics,
    skill: sk === null ? null : { committedResultId: sk.committedResultId, estimate: sk.estimate, uncertaintyStatus: sk.uncertaintyStatus,
      modelRef: C.copyVersionRef(sk.modelRef), policyRef: C.copyVersionRef(sk.policyRef) },
    reasons: s.reasonCodes.filter((c) => C.isStr(vis.reasonText[c])).map((c) => ({ code: c, text: vis.reasonText[c] })),
  }), "unchanged");
}

module.exports = { projectProfileIdentity };
