"use strict";
// Shared helpers for the F52-V1-CONTRACT-1 rating v1 pure modules (§5-§8). Copied from the helper
// style of src/learn/v1/common.cjs so the two module sets do not couple at runtime; the canonical
// form and fingerprint rule are identical (INTERFACE-ACK item 3 / PROPOSALS P5).
// Shape and invariant checks only: nothing here authenticates input or makes it committed (§3).
// No I/O, no clocks, no randomness.

const { createHash } = require("node:crypto");

const CONTRACT_ID = "F52-V1-CONTRACT-1";
const SCHEMA_VERSION = 1;
// Interim reading of INTERFACE-ACK item 4: UTC ISO with a Z suffix, optional milliseconds.
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;

// Field names that must never appear in a decision-time or rating object: answer keys, concealed
// holdings, future runout, final winner and later observations (§5).
const PRIVATE_FIELDS = new Set(["answerKey", "answerKeys", "correctAction", "correctChoice", "solution", "solutionKey",
  "privateKey", "privateKeyUri", "keyUri", "opponentCards", "opponentHoleCards", "concealedCards", "holeCards",
  "futureBoard", "futureCards", "runout", "finalBoard", "showdownCards", "finalWinner", "handWinner",
  "laterObservations", "futureActions", "graderSecret"]);

const problem = (code, path = null, message = code) => ({ code, path, message });
const ok = (value, disposition = "applied") => ({ ok: true, value, disposition });
const fail = (problems) => ({ ok: false, problems });

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string" && v.length > 0;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isCount = (v) => Number.isSafeInteger(v) && v >= 0;
const isTs = (v) => typeof v === "string" && TIMESTAMP.test(v) && !Number.isNaN(Date.parse(v));

// Canonical JSON: sorted keys, compact, UTF-8. undefined and non-finite numbers are refused.
function canonical(v) {
  if (v === undefined) throw new Error("undefined is not canonical");
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (isObj(v)) {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  }
  if (typeof v === "number" && !Number.isFinite(v)) throw new Error("non-finite number");
  return JSON.stringify(v);
}
const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");
function fingerprintOf(obj) {
  const { fingerprint, ...rest } = obj; // eslint-disable-line no-unused-vars
  return sha256Hex(canonical(rest));
}
const hashOf = (v) => sha256Hex(canonical(v));

function deepFreeze(v) {
  if (v && typeof v === "object" && !Object.isFrozen(v)) { Object.freeze(v); for (const k of Object.keys(v)) deepFreeze(v[k]); }
  return v;
}
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

function checkEnvelope(o, problems, path = "") {
  if (!isObj(o)) { problems.push(problem("not-an-object", path || null)); return false; }
  if (o.contractId !== CONTRACT_ID) problems.push(problem("unknown-contract", `${path}contractId`, `expected ${CONTRACT_ID}`));
  if (o.schemaVersion !== SCHEMA_VERSION) problems.push(problem("unknown-schema-version", `${path}schemaVersion`));
  return true;
}
const isVersionRef = (r) => isObj(r) && isStr(r.id) && isStr(r.version) && (r.sha256 === null || SHA256_HEX.test(r.sha256 ?? ""))
  && Object.keys(r).every((k) => ["id", "version", "sha256"].includes(k));
function checkVersionRef(r, problems, path, { nullable = false } = {}) {
  if (r === null && nullable) return true;
  if (!isVersionRef(r)) { problems.push(problem("invalid-version-ref", path)); return false; }
  return true;
}
const isSourceRef = (r) => isObj(r) && isStr(r.kind) && isStr(r.recordId) && isStr(r.recordVersion)
  && (r.sourceHash === null || isStr(r.sourceHash)) && Object.keys(r).every((k) => ["kind", "recordId", "recordVersion", "sourceHash"].includes(k));
function checkSourceRef(r, problems, path, { nullable = false } = {}) {
  if (r === null && nullable) return true;
  if (!isSourceRef(r)) { problems.push(problem("invalid-source-ref", path)); return false; }
  return true;
}
// UncertaintyValue (§5). No numeric convention is chosen: parameters follow the supplied method schema.
function checkUncertainty(u, problems, path) {
  if (!isObj(u)) { problems.push(problem("invalid-uncertainty", path)); return false; }
  closedKeys(u, ["status", "methodRef", "parameters", "coverageRef"], problems, `${path}.`);
  if (!["estimated", "unknown", "unassessable"].includes(u.status)) problems.push(problem("invalid-uncertainty-status", `${path}.status`));
  checkVersionRef(u.methodRef, problems, `${path}.methodRef`, { nullable: true });
  checkSourceRef(u.coverageRef, problems, `${path}.coverageRef`, { nullable: true });
  if (!(u.parameters === null || isObj(u.parameters))) problems.push(problem("invalid-uncertainty-parameters", `${path}.parameters`));
  if (u.status === "estimated" && (u.methodRef === null || u.parameters === null)) {
    problems.push(problem("uncertainty-method-required", path, "an estimated uncertainty names its method and parameters"));
  }
  if (u.status !== "estimated" && u.parameters !== null) {
    problems.push(problem("uncertainty-parameters-without-estimate", path, "unknown/unassessable uncertainty carries no parameters"));
  }
  if (isObj(u.parameters)) scanNumbers(u.parameters, problems, `${path}.parameters`);
  return true;
}
function scanNumbers(v, problems, path) {
  if (Array.isArray(v)) { v.forEach((x, i) => scanNumbers(x, problems, `${path}[${i}]`)); return; }
  if (isObj(v)) { for (const k of Object.keys(v)) scanNumbers(v[k], problems, `${path}.${k}`); return; }
  if (typeof v === "number" && !Number.isFinite(v)) problems.push(problem("non-finite-number", path));
  if (v === undefined) problems.push(problem("undefined-value", path));
}
// Walks any value and reports private field names and non-finite numbers.
function scanPrivate(v, problems, path = "") {
  if (Array.isArray(v)) { v.forEach((x, i) => scanPrivate(x, problems, `${path}[${i}]`)); return; }
  if (isObj(v)) {
    for (const k of Object.keys(v)) {
      const p = `${path}${path ? "." : ""}${k}`;
      if (PRIVATE_FIELDS.has(k)) problems.push(problem("private-field", p, "concealed, future or key data is not allowed here"));
      scanPrivate(v[k], problems, p);
    }
    return;
  }
  if (typeof v === "number" && !Number.isFinite(v)) problems.push(problem("non-finite-number", path || null));
}
function closedKeys(o, allowed, problems, path = "") {
  for (const k of Object.keys(o || {})) if (!allowed.includes(k)) problems.push(problem("unknown-field", `${path}${k}`, "closed type: field not in the contract"));
}
function requireKeys(o, required, problems, path = "") {
  for (const k of required) if (!isObj(o) || !(k in o)) problems.push(problem("missing-field", `${path}${k}`));
}
const refKey = (r) => (r ? `${r.id}@${r.version}` : null);
// Exact version identity: id, version and (when either side names one) the same sha256.
const sameRef = (a, b) => {
  if (a === null || b === null || a === undefined || b === undefined) return a === b || (a == null && b == null);
  return a.id === b.id && a.version === b.version && (a.sha256 ?? null) === (b.sha256 ?? null);
};
const refIn = (r, list) => Array.isArray(list) && list.some((x) => sameRef(x, r));

module.exports = { CONTRACT_ID, SCHEMA_VERSION, PRIVATE_FIELDS, TIMESTAMP, problem, ok, fail, isObj, isStr, isNum, isCount, isTs,
  canonical, sha256Hex, fingerprintOf, hashOf, deepFreeze, clone, checkEnvelope, isVersionRef, checkVersionRef, isSourceRef,
  checkSourceRef, checkUncertainty, scanNumbers, scanPrivate, closedKeys, requireKeys, refKey, sameRef, refIn };
