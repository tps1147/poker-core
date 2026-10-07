"use strict";
// Shared helpers for the F52-V1-CONTRACT-1 pure modules (gauntlet v1 and profile v1). Copied in style
// from src/learn/v1/common.cjs (not required from it: that directory has another writer). Shape and
// invariant checks only: nothing here authenticates an input or makes it a committed fact (contract
// §3). No I/O, no clocks, no randomness.

const { createHash } = require("node:crypto");

const CONTRACT_ID = "F52-V1-CONTRACT-1";
const SCHEMA_VERSION = 1;
// Interim reading of INTERFACE-ACK item 4: UTC ISO with a Z suffix, optional milliseconds.
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
// Field names that must never appear in a journey, memory, reward or identity input: keys, verdict
// markers, hidden or future cards, the bot's adaptive read, mastery claims and entitlement writes.
const PRIVATE_FIELDS = new Set(["answerKey", "answerKeys", "correctAction", "correctChoice", "solution", "solutionKey",
  "privateKey", "privateKeyUri", "keyUri", "opponentCards", "concealedCards", "holeCards", "hiddenCards", "heroCards",
  "villainCards", "showdownCards", "muckedCards", "futureBoard", "runout", "deck", "graderSecret", "opponentModel"]);

const problem = (code, path = null, message = code) => ({ code, path, message });
const ok = (value, disposition = "applied") => ({ ok: true, value, disposition });
const fail = (problems) => ({ ok: false, problems });

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string" && v.length > 0;
const isCount = (v) => Number.isSafeInteger(v) && v >= 0;
const isTs = (v) => typeof v === "string" && TIMESTAMP.test(v) && !Number.isNaN(Date.parse(v));
const isHex64 = (v) => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);

// Canonical JSON: sorted keys, compact, UTF-8 (INTERFACE-ACK item 3 / PROPOSALS P5).
function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (isObj(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  if (typeof v === "number" && !Number.isFinite(v)) throw new Error("non-finite number");
  if (v === undefined || typeof v === "function") throw new Error("not JSON data");
  return JSON.stringify(v);
}
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
function fingerprintOf(obj) {
  const { fingerprint, ...rest } = obj; // eslint-disable-line no-unused-vars
  return sha256(canonical(rest));
}
// Pushes a problem unless obj.fingerprint is the canonical fingerprint of obj.
function checkFingerprint(obj, p, path = "fingerprint") {
  if (!isHex64(obj.fingerprint)) { p.push(problem("invalid-fingerprint", path)); return; }
  try { if (fingerprintOf(obj) !== obj.fingerprint) p.push(problem("fingerprint-mismatch", path)); } catch { p.push(problem("not-json-data", path)); }
}

function deepFreeze(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) { Object.freeze(v); for (const k of Object.keys(v)) deepFreeze(v[k]); }
  return v;
}
const clone = (v) => JSON.parse(JSON.stringify(v));

function checkEnvelope(o, problems, path = "") {
  if (!isObj(o)) { problems.push(problem("not-an-object", path || null)); return; }
  if (o.contractId !== CONTRACT_ID) problems.push(problem("unknown-contract", `${path}contractId`, `expected ${CONTRACT_ID}`));
  if (o.schemaVersion !== SCHEMA_VERSION) problems.push(problem("unknown-schema-version", `${path}schemaVersion`));
}
const isVersionRef = (r) => isObj(r) && isStr(r.id) && isStr(r.version) && (r.sha256 === null || isHex64(r.sha256))
  && Object.keys(r).length === 3;
function checkVersionRef(r, problems, path, { nullable = false } = {}) {
  if (r === null && nullable) return;
  if (!isVersionRef(r)) problems.push(problem(r === null || r === undefined ? "missing-version-ref" : "invalid-version-ref", path));
}
const isSourceRef = (r) => isObj(r) && isStr(r.kind) && isStr(r.recordId) && isStr(r.recordVersion)
  && (r.sourceHash === null || isStr(r.sourceHash)) && Object.keys(r).length === 4;
function checkSourceRef(r, problems, path, { nullable = false } = {}) {
  if (r === null && nullable) return;
  if (r === null || r === undefined) problems.push(problem("missing-provenance", path));
  else if (!isSourceRef(r)) problems.push(problem("invalid-source-ref", path));
}
// Walks any value and reports private field names and non-finite numbers.
function scanPrivate(v, problems, path = "") {
  if (Array.isArray(v)) { v.forEach((x, i) => scanPrivate(x, problems, `${path}[${i}]`)); return; }
  if (isObj(v)) {
    for (const k of Object.keys(v)) {
      const at = `${path}${path ? "." : ""}${k}`;
      if (PRIVATE_FIELDS.has(k)) problems.push(problem("private-field", at, "private grading, hidden-card or adaptive-read data is not allowed here"));
      scanPrivate(v[k], problems, at);
    }
    return;
  }
  if (typeof v === "number" && !Number.isFinite(v)) problems.push(problem("non-finite-number", path || null));
}
function closedKeys(o, allowed, problems, path = "") {
  for (const k of Object.keys(o || {})) if (!allowed.includes(k)) problems.push(problem("unknown-field", `${path}${k}`));
  for (const k of allowed) if (isObj(o) && !(k in o)) problems.push(problem("missing-field", `${path}${k}`));
}
const refKey = (r) => (r ? `${r.id}@${r.version}` : null);
const sameRef = (a, b) => isObj(a) && isObj(b) && a.id === b.id && a.version === b.version && (a.sha256 ?? null) === (b.sha256 ?? null);
const copyVersionRef = (r) => (r ? { id: r.id, version: r.version, sha256: r.sha256 } : null);
const copySourceRef = (r) => (r ? { kind: r.kind, recordId: r.recordId, recordVersion: r.recordVersion, sourceHash: r.sourceHash } : null);

// A reviewed policy must be supplied and accepted with a receipt; anything else fails closed (§6, §10).
function checkAcceptedPolicy(pol, problems, path) {
  if (!isObj(pol) || pol.status === "unselected" || pol.status === undefined) { problems.push(problem("POLICY_UNSELECTED", path, "no reviewed policy was supplied")); return false; }
  if (pol.status !== "accepted" || !isVersionRef(pol.policy) || !isSourceRef(pol.acceptanceRef)) {
    problems.push(problem("POLICY_INCOMPLETE", path, "policy must be accepted with a policy ref and acceptance receipt")); return false;
  }
  return true;
}

// Readable AI identity (§6): the trusted kind decides the badge; it is never inferred from a name.
const AI_BADGE = Object.freeze({ text: "AI", accessibleLabel: "AI player" });
const aiBadgeFor = (kind) => (kind === "ai_persona" ? { text: AI_BADGE.text, accessibleLabel: AI_BADGE.accessibleLabel } : null);

module.exports = { CONTRACT_ID, SCHEMA_VERSION, PRIVATE_FIELDS, AI_BADGE, problem, ok, fail, isObj, isStr, isCount, isTs, isHex64,
  canonical, sha256, fingerprintOf, checkFingerprint, deepFreeze, clone, checkEnvelope, isVersionRef, checkVersionRef, isSourceRef,
  checkSourceRef, scanPrivate, closedKeys, refKey, sameRef, copyVersionRef, copySourceRef, checkAcceptedPolicy, aiBadgeFor };
