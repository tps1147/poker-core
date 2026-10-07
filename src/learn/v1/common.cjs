"use strict";
// Shared helpers for the F52-V1-CONTRACT-1 pure modules (learn v1). Shape and invariant checks only:
// nothing here authenticates an input or makes it a committed fact (contract §3). No I/O, no clocks,
// no randomness.

const { createHash } = require("node:crypto");

const CONTRACT_ID = "F52-V1-CONTRACT-1";
const SCHEMA_VERSION = 1;
// Interim reading of INTERFACE-ACK item 4: UTC ISO with a Z suffix, optional milliseconds.
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
// Field names that must never appear in a plan or an evidence fact (keys, verdict markers, hidden cards).
const PRIVATE_FIELDS = new Set(["answerKey", "answerKeys", "correctAction", "correctChoice", "solution", "solutionKey",
  "privateKey", "privateKeyUri", "keyUri", "opponentCards", "concealedCards", "holeCards", "futureBoard", "runout", "graderSecret"]);

const problem = (code, path = null, message = code) => ({ code, path, message });
const ok = (value, disposition = "applied") => ({ ok: true, value, disposition });
const fail = (problems) => ({ ok: false, problems });

const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string" && v.length > 0;
const isCount = (v) => Number.isSafeInteger(v) && v >= 0;
const isTs = (v) => typeof v === "string" && TIMESTAMP.test(v) && !Number.isNaN(Date.parse(v));

// Canonical JSON: sorted keys, compact, UTF-8 (INTERFACE-ACK item 3 / PROPOSALS P5).
function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (isObj(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  if (typeof v === "number" && !Number.isFinite(v)) throw new Error("non-finite number");
  return JSON.stringify(v);
}
function fingerprintOf(obj) {
  const { fingerprint, ...rest } = obj; // eslint-disable-line no-unused-vars
  return createHash("sha256").update(canonical(rest), "utf8").digest("hex");
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
function checkVersionRef(r, problems, path, { nullable = false } = {}) {
  if (r === null && nullable) return;
  if (!isObj(r) || !isStr(r.id) || !isStr(r.version) || !(r.sha256 === null || /^[0-9a-f]{64}$/.test(r.sha256 ?? ""))) {
    problems.push(problem("invalid-version-ref", path));
  }
}
function checkSourceRef(r, problems, path, { nullable = false } = {}) {
  if (r === null && nullable) return;
  if (!isObj(r) || !isStr(r.kind) || !isStr(r.recordId) || !isStr(r.recordVersion) || !(r.sourceHash === null || isStr(r.sourceHash))) {
    problems.push(problem("invalid-source-ref", path));
  }
}
// Walks any value and reports private field names and non-finite numbers.
function scanPrivate(v, problems, path = "") {
  if (Array.isArray(v)) { v.forEach((x, i) => scanPrivate(x, problems, `${path}[${i}]`)); return; }
  if (isObj(v)) {
    for (const k of Object.keys(v)) {
      if (PRIVATE_FIELDS.has(k)) problems.push(problem("private-field", `${path}${path ? "." : ""}${k}`, "private grading or hidden-card data is not allowed here"));
      scanPrivate(v[k], problems, `${path}${path ? "." : ""}${k}`);
    }
    return;
  }
  if (typeof v === "number" && !Number.isFinite(v)) problems.push(problem("non-finite-number", path || null));
}
function closedKeys(o, allowed, problems, path = "") {
  for (const k of Object.keys(o || {})) if (!allowed.includes(k)) problems.push(problem("unknown-field", `${path}${k}`));
}
const refKey = (r) => (r ? `${r.id}@${r.version}` : null);

module.exports = { CONTRACT_ID, SCHEMA_VERSION, PRIVATE_FIELDS, problem, ok, fail, isObj, isStr, isCount, isTs,
  canonical, fingerprintOf, deepFreeze, clone, checkEnvelope, checkVersionRef, checkSourceRef, scanPrivate, closedKeys, refKey };
