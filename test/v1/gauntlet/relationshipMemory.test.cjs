// Relationship memory against F52-V1-CONTRACT-1 §10 (bounded legitimate memory) and §11 fixtures.
//   node test/v1/gauntlet/relationshipMemory.test.cjs
"use strict";
const assert = require("node:assert/strict");
const G = require("../../../src/gauntlet/v1/index.cjs");
const { fingerprintOf, CONTRACT_ID, SCHEMA_VERSION } = require("../../../src/gauntlet/v1/common.cjs");

const ENV = { contractId: CONTRACT_ID, schemaVersion: SCHEMA_VERSION };
const V = (id, version = "1") => ({ id, version, sha256: null });
const S = (kind, recordId) => ({ kind, recordId, recordVersion: "1", sourceHash: null });
const codes = (r) => (r.ok ? [] : r.problems.map((x) => x.code));
const fp = (o) => ({ ...o, fingerprint: fingerprintOf(o) });

let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (e) { console.error(`FAIL ${name}`); throw e; } };

const memPolicy = (over = {}) => ({ ...ENV, policy: V("memory-policy"), status: "accepted",
  allowedFactKinds: ["encounter_completed", "rematch_requested", "review_acknowledged", "learning_detour", "public_observation_summary"],
  visibilityPolicyRef: V("memory-vis"), maximumEntries: 3, maximumTextLength: 120,
  retentionPolicyRef: V("memory-retention"), deletionPolicyRef: V("memory-deletion"), selectionPolicyRef: V("memory-selection"),
  acceptanceRef: S("receipt", "memory-accept"), ...over });
const supplied = (over = {}, extra = {}) => ({ policy: memPolicy(over), ...extra });

let n = 0;
const fact = (over = {}) => {
  n += 1;
  return fp({ ...ENV, memoryId: `mem-${n}`, subjectId: "user-1", rivalId: "rival-rookie-bob", kind: "encounter_completed", encounterId: `enc-${n}`,
    source: S("encounter_result", `res-${n}`), policyRef: V("memory-policy"), observedAt: new Date(Date.UTC(2026, 9, 6, 19, 0, n)).toISOString().replace(".000Z", "Z"),
    publicObservationSummaryRef: null, narrativeFact: { code: "rival.match.loss", text: "Bob called your river bet and won the match." },
    deletionScopeId: "scope-user-1", ...over });
};

check("unset / unselected / incomplete memory policy blocks retention (fails closed)", () => {
  const f = fact();
  assert.ok(codes(G.reduceRelationshipMemory(null, f, undefined)).includes("POLICY_UNSELECTED"));
  assert.ok(codes(G.reduceRelationshipMemory(null, f, { policy: null })).includes("POLICY_UNSELECTED"));
  assert.ok(codes(G.reduceRelationshipMemory(null, f, supplied({ status: "unselected" }))).includes("POLICY_UNSELECTED"));
  assert.ok(codes(G.reduceRelationshipMemory(null, f, supplied({ maximumEntries: null }))).includes("POLICY_INCOMPLETE"));
  assert.ok(codes(G.reduceRelationshipMemory(null, f, supplied({ maximumTextLength: null }))).includes("POLICY_INCOMPLETE"));
  assert.ok(codes(G.reduceRelationshipMemory(null, f, supplied({ deletionPolicyRef: null }))).includes("POLICY_INCOMPLETE"));
  assert.ok(codes(G.reduceRelationshipMemory(null, f, supplied({ acceptanceRef: null }))).includes("POLICY_INCOMPLETE"));
  assert.ok(codes(G.reduceRelationshipMemory(null, f, supplied({ schemaVersion: 2 }))).includes("unknown-schema-version"));
});

check("legitimate fact applies; replay is duplicate; changed payload under the same id conflicts", () => {
  const f = fact();
  const r = G.reduceRelationshipMemory(null, f, supplied());
  assert.ok(r.ok, JSON.stringify(r.problems));
  assert.equal(r.value.entries.length, 1);
  assert.equal(r.value.revision, 1);
  assert.ok(Object.isFrozen(r.value));
  const again = G.reduceRelationshipMemory(r.value, f, supplied());
  assert.equal(again.disposition, "duplicate");
  const changed = fp({ ...f, narrativeFact: { code: "rival.match.win", text: "You won." } });
  assert.deepEqual(codes(G.reduceRelationshipMemory(r.value, changed, supplied())), ["memory-id-conflict"]);
});

check("hidden-card data is rejected from memory (fields and card text)", () => {
  const f = fact();
  assert.ok(codes(G.reduceRelationshipMemory(null, { ...f, holeCards: [{ rank: "A", suit: "s" }] }, supplied())).includes("private-field"));
  assert.ok(codes(G.reduceRelationshipMemory(null, fp({ ...fact(), narrativeFact: { code: "rival.read", text: "Bob held AsKs on that river." } }), supplied())).includes("card-data-in-memory"));
  assert.ok(codes(G.reduceRelationshipMemory(null, fp({ ...fact(), narrativeFact: { code: "rival.read", text: "He had the A♠ the whole time." } }), supplied())).includes("card-data-in-memory"));
  assert.ok(codes(G.reduceRelationshipMemory(null, fp({ ...fact(), narrativeFact: { code: "rival.read", text: "The king of hearts was coming on the river." } }), supplied())).includes("card-data-in-memory"));
  // Ordinary words are not mistaken for cards.
  assert.ok(G.reduceRelationshipMemory(null, fp({ ...fact(), narrativeFact: { code: "rival.rematch", text: "Bob asks for a rematch as soon as the chips settle." } }), supplied()).ok);
});

check("the adaptive BotMemory read, intent and psychological labels are not memory", () => {
  const f = fact();
  assert.ok(codes(G.reduceRelationshipMemory(null, { ...f, opponentModel: { foldToRaise: 0.5 } }, supplied())).includes("private-field"));
  assert.ok(codes(G.reduceRelationshipMemory(null, fp({ ...fact(), narrativeFact: { code: "rival.read", text: "Bob was tilted after the flop." } }), supplied())).includes("unsupported-label-in-memory"));
  assert.ok(codes(G.reduceRelationshipMemory(null, fp({ ...fact(), narrativeFact: { code: "rival.read", text: "Bob is trying to bully you." } }), supplied())).includes("unsupported-label-in-memory"));
});

check("public-action summaries come only by admitted reference", () => {
  const ok = fp({ ...fact(), kind: "public_observation_summary", encounterId: null, publicObservationSummaryRef: S("public_action_summary", "pas-1"),
    narrativeFact: { code: "rival.habit.calls", text: "Bob called most river bets in your last match." } });
  assert.ok(G.reduceRelationshipMemory(null, ok, supplied()).ok);
  const noRef = fp({ ...fact(), kind: "public_observation_summary", encounterId: null, publicObservationSummaryRef: null });
  assert.ok(codes(G.reduceRelationshipMemory(null, noRef, supplied())).includes("missing-provenance"));
  assert.ok(codes(G.reduceRelationshipMemory(null, fp({ ...fact(), publicObservationSummaryRef: S("x", "y") }), supplied())).includes("unexpected-observation-summary"));
  assert.ok(codes(G.reduceRelationshipMemory(null, fp({ ...fact(), source: null }), supplied())).includes("missing-provenance"));
});

check("bounds come only from the supplied policy: text length, kinds, entry cap with supplied selection", () => {
  assert.ok(codes(G.reduceRelationshipMemory(null, fp({ ...fact(), narrativeFact: { code: "c", text: "x".repeat(121) } }), supplied())).includes("memory-text-too-long"));
  assert.ok(codes(G.reduceRelationshipMemory(null, fact(), supplied({ allowedFactKinds: ["rematch_requested"] }))).includes("fact-kind-not-allowed"));
  let snap = null;
  for (let i = 0; i < 3; i += 1) snap = G.reduceRelationshipMemory(snap, fact(), supplied()).value;
  assert.equal(snap.entries.length, 3);
  const extra = fact();
  assert.ok(codes(G.reduceRelationshipMemory(snap, extra, supplied())).includes("POLICY_INCOMPLETE"), "no default eviction");
  const keepNewest = (entries, incoming) => entries.slice(1).map((e) => e.memoryId).concat([incoming.memoryId]);
  const r = G.reduceRelationshipMemory(snap, extra, supplied({}, { selectRetained: keepNewest }));
  assert.ok(r.ok, JSON.stringify(r.problems));
  assert.equal(r.value.entries.length, 3);
  const dropped = snap.entries[0];
  assert.ok(!r.value.entries.some((e) => e.memoryId === dropped.memoryId));
  // A replay of the dropped fact cannot restore it.
  const replay = G.reduceRelationshipMemory(r.value, dropped, supplied({}, { selectRetained: keepNewest }));
  assert.equal(replay.disposition, "duplicate");
  assert.ok(!replay.value.entries.some((e) => e.memoryId === dropped.memoryId));
  const bad = G.reduceRelationshipMemory(snap, fact(), supplied({}, { selectRetained: () => ["a", "b", "c", "d"] }));
  assert.ok(codes(bad).includes("invalid-selection"));
});

check("tombstoned deletion scope is never retained again", () => {
  const first = G.reduceRelationshipMemory(null, fact(), supplied()).value;
  const tombstoned = { ...JSON.parse(JSON.stringify(first)), entries: [], tombstoneRefs: [S("deletion", "scope-user-1")] };
  const r = G.reduceRelationshipMemory(tombstoned, fact(), supplied());
  assert.equal(r.disposition, "unchanged");
  assert.equal(r.value.entries.length, 0);
  assert.equal(r.value.revision, tombstoned.revision);
});

check("invalid ownership and version mismatches reject", () => {
  const snap = G.reduceRelationshipMemory(null, fact(), supplied()).value;
  assert.ok(codes(G.reduceRelationshipMemory(snap, fact({ subjectId: "user-2" }), supplied())).includes("subject-mismatch"));
  assert.ok(codes(G.reduceRelationshipMemory(snap, fact({ rivalId: "rival-slow-steve" }), supplied())).includes("rival-mismatch"));
  assert.ok(codes(G.reduceRelationshipMemory(snap, fact({ policyRef: V("memory-policy", "2") }), supplied())).includes("policy-version-mismatch"));
  assert.ok(codes(G.reduceRelationshipMemory(null, fact({ rivalId: "rival-nobody" }), supplied())).includes("unknown-rival"));
  assert.ok(codes(G.reduceRelationshipMemory(null, fact({ encounterId: null }), supplied())).includes("invalid-encounter-id"));
});

check("public projection: readable AI identity, allowlisted fields, text hidden unless allowed", () => {
  const snap = G.reduceRelationshipMemory(null, fact(), supplied()).value;
  const r = G.projectRelationshipMemory(snap, { known: true, policyRef: V("memory-vis"), showText: true });
  assert.ok(r.ok, JSON.stringify(r.problems));
  assert.equal(r.value.rival.displayName, "Rookie Bob");
  assert.equal(r.value.rival.participantKind, "ai_persona");
  assert.deepEqual(r.value.rival.aiBadge, { text: "AI", accessibleLabel: "AI player" });
  const text = JSON.stringify(r.value);
  assert.ok(!text.includes("scope-user-1") && !text.includes("deletionScopeId") && !text.includes("\"source\"") && !text.includes("fingerprint"));
  assert.equal(r.value.entries[0].narrative.text, "Bob called your river bet and won the match.");
  const hidden = G.projectRelationshipMemory(snap, { known: true, policyRef: V("memory-vis"), showText: false });
  assert.equal(hidden.value.entries[0].narrative.text, null);
  assert.ok(codes(G.projectRelationshipMemory(snap, null)).includes("unknown-visibility-policy"));
});

console.log(`relationship memory: ${checks} checks passed`);
