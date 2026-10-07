// Rating v1 §7 placement/provisional and §8 seasons/freeze/ties.
//   node test/v1/rating/placement-season.test.cjs
"use strict";
const assert = require("node:assert/strict");
const F = require("./fixtures.cjs");
const { R, V, S, ENV, codes } = F;

let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (e) { console.error(`FAIL ${name}`); throw e; } };
const snap = (variance = 0.5) => F.snapshot("u-hero", 0.2, variance, V("p"));

// ---------------------------------------------------------------- placement
check("missing placement policy: unknown eligibility, incomplete progress, never placed", () => {
  for (const pol of [null, F.placementPolicy({ status: "unselected" })]) {
    const r = R.derivePlacementContext(snap(), F.summary({ eligibleMatchCount: 500, sourceCounts: [{ kind: "ranked_settlement", matches: 500 }] }), pol);
    assert.equal(r.ok, true, JSON.stringify(r.problems));
    assert.equal(r.value.state, "unassessed"); assert.equal(r.value.standingEligibility, "unknown");
    assert.equal(r.value.progress.required, null); assert.ok(r.value.reasonCodes.includes("POLICY_UNSELECTED"));
  }
  const r = R.derivePlacementContext(snap(), F.summary(), F.placementPolicy({ requiredEligibleMatches: null }));
  assert.equal(r.value.standingEligibility, "unknown"); assert.notEqual(r.value.state, "placed");
  assert.ok(r.value.reasonCodes.includes("POLICY_INCOMPLETE"));
});

check("placement uses only the supplied count", () => {
  assert.equal(R.derivePlacementContext(snap(), F.summary(), F.placementPolicy()).value.state, "placed");
  const pr = R.derivePlacementContext(snap(), F.summary({ eligibleMatchCount: 2, sourceCounts: [{ kind: "ranked_settlement", matches: 2 }] }), F.placementPolicy());
  assert.equal(pr.value.state, "provisional"); assert.equal(pr.value.standingEligibility, "ineligible");
  assert.deepEqual(pr.value.progress, { completed: 2, required: 3 });
});

check("legacy/generic/refund/lesson-retry sources are never placement evidence", () => {
  for (const kind of R.DENIED_PLACEMENT_SOURCE_KINDS) {
    const s = F.summary({ sourceCounts: [{ kind: "ranked_settlement", matches: 2 }, { kind, matches: 1 }] });
    assert.ok(codes(R.derivePlacementContext(snap(), s, F.placementPolicy())).includes("INADMISSIBLE_PLACEMENT_SOURCE"), kind);
    assert.ok(codes(R.derivePlacementContext(snap(), F.summary(), F.placementPolicy({ admissibleSourceKinds: ["ranked_settlement", kind] }))).includes("INADMISSIBLE_PLACEMENT_SOURCE"));
  }
});

check("smurf/opponent-selection: class minimums and uncertainty gate keep a subject provisional", () => {
  const pol = F.placementPolicy({ opponentClassMinimums: { human: 2, ai_persona: null } });
  const farmAi = F.summary({ opponentClassCounts: { human: 0, ai_persona: 3 } });
  const r = R.derivePlacementContext(snap(), farmAi, pol);
  assert.equal(r.value.state, "provisional"); assert.ok(r.value.reasonCodes.includes("OPPONENT_CLASS_MINIMUM_UNMET:human"));
  const unk = R.derivePlacementContext(snap(), F.summary({ opponentClassCounts: { human: null, ai_persona: 3 } }), pol);
  assert.equal(unk.value.standingEligibility, "unknown");
  const gate = F.placementPolicy({ uncertaintyGate: { methodRef: F.RATING_U, parameter: "variance", maximum: 0.2 } });
  assert.equal(R.derivePlacementContext(snap(0.5), F.summary(), gate).value.state, "provisional");
  assert.equal(R.derivePlacementContext(snap(0.1), F.summary(), gate).value.state, "placed");
  const unknownU = { ...snap(), uncertainty: { status: "unknown", methodRef: null, parameters: null, coverageRef: null } };
  assert.equal(R.derivePlacementContext(unknownU, F.summary(), gate).value.standingEligibility, "unknown");
  const susp = R.derivePlacementContext(snap(0.1), F.summary({ suspension: { receiptId: "sus-1", reasonCode: "INTEGRITY_REVIEW" } }), gate);
  assert.equal(susp.value.state, "suspended"); assert.equal(susp.value.standingEligibility, "ineligible");
});

check("placement context invariants and projection allowlist", () => {
  const ctx = R.derivePlacementContext(snap(), F.summary(), F.placementPolicy()).value;
  const forged = { ...JSON.parse(JSON.stringify(ctx)), policyRef: null };
  assert.ok(codes(R.validatePlacementContext(forged)).includes("POLICY_UNSELECTED"));
  assert.ok(codes(R.projectPlacementContext(ctx, null)).includes("POLICY_UNSELECTED"));
  const pub = R.projectPlacementContext(ctx, F.visibility()).value;
  assert.equal(pub.provisional, false); assert.equal(pub.uncertainty.parameters, null);
  assert.ok(!("updatedFromReceiptId" in pub) && !("eligibleDecisionCount" in pub.evidence));
});

// ---------------------------------------------------------------- seasons
const POL = { enroll: V("enroll-p"), carry: V("carry-p"), evid: V("evid-p"), stand: V("stand-p"), tie: V("tie-p"), reward: V("reward-p"), archive: V("archive-p") };
const definition = (over = {}) => ({ ...ENV, season: V("season-1"), startsAt: "2026-11-01T00:00:00Z", endsAt: "2026-12-01T00:00:00Z",
  populationRef: F.POPULATION, formatRef: F.FORMAT, enrollmentPolicyRef: POL.enroll, ratingCarryoverPolicyRef: POL.carry,
  eligibleEvidencePolicyRef: POL.evid, standingsPolicyRef: POL.stand, tiePolicyRef: POL.tie, rewardPolicyRef: POL.reward, archivePolicyRef: POL.archive, ...over });
const supplied = (def = definition(), over = {}) => ({ definition: def, acceptedPolicyRefs: Object.values(POL),
  cutoffPolicy: { policy: V("cutoff-p"), lateResults: "reject" }, ...over });
let n = 0;
function ev(snapshot, kind, payload, { at = "2026-11-10T00:00:00Z", id = null, rev = null } = {}) {
  const e = { ...ENV, eventId: id || `se-${++n}`, fingerprint: null, command: { commandId: `cmd-${n}`, expectedRevision: rev ?? snapshot.revision },
    seasonId: "season-1", source: S("season-admin", `src-${n}`), occurredAt: at, kind, payload };
  e.fingerprint = R.fingerprintOf(e); return e;
}
const apply = (s, e, sup = supplied()) => { const r = R.reduceSeason(s, e, sup); if (!r.ok) throw new Error(JSON.stringify(r.problems)); return r.value; };
function toFreezing() {
  let s = R.createDraftSeasonSnapshot(definition()).value;
  s = apply(s, ev(s, "season_scheduled", {}, { at: "2026-10-20T00:00:00Z" }));
  s = apply(s, ev(s, "season_activated", { enrollmentSnapshotRef: S("enrollment", "enr-1") }, { at: "2026-11-01T00:00:00Z" }));
  toFreezing.firstResult = ev(s, "result_admitted", { resultRef: S("rating-result", "rr-1"), completedAt: "2026-11-05T00:00:00Z", receiptWatermark: "w0001" });
  s = apply(s, toFreezing.firstResult);
  s = apply(s, ev(s, "result_admitted", { resultRef: S("rating-result", "rr-2"), completedAt: "2026-11-06T00:00:00Z", receiptWatermark: "w0002" }));
  s = apply(s, ev(s, "cutoff_reached", { endedAt: "2026-12-01T00:00:00Z", admittedReceiptWatermark: "w0002" }, { at: "2026-12-01T00:00:01Z" }));
  return s;
}

check("missing season policy blocks activation/freeze/reward/archive", () => {
  let s = R.createDraftSeasonSnapshot(definition({ standingsPolicyRef: null })).value;
  const sup = supplied(definition({ standingsPolicyRef: null }));
  s = apply(s, ev(s, "season_scheduled", {}), sup);
  assert.ok(codes(R.reduceSeason(s, ev(s, "season_activated", { enrollmentSnapshotRef: S("enrollment", "e") }, { at: "2026-11-01T00:00:00Z" }), sup)).includes("POLICY_UNSELECTED"));
  // Named but not supplied as accepted.
  let t = R.createDraftSeasonSnapshot(definition()).value;
  t = apply(t, ev(t, "season_scheduled", {}));
  assert.ok(codes(R.reduceSeason(t, ev(t, "season_activated", { enrollmentSnapshotRef: S("enrollment", "e") }, { at: "2026-11-01T00:00:00Z" }), supplied(definition(), { acceptedPolicyRefs: [] }))).includes("POLICY_INCOMPLETE"));
  // Freeze needs a tie policy; cutoff needs a cutoff policy.
  const f = toFreezing();
  const noTie = definition({ tiePolicyRef: null });
  const fNoTie = { ...JSON.parse(JSON.stringify(f)) };
  assert.ok(codes(R.reduceSeason(fNoTie, ev(f, "season_frozen", { freezeId: "fz", inputHash: R.seasonInputHash(f), standingsSnapshotRef: S("standings", "st"), tiePolicyRef: POL.tie, rewardSnapshotRef: S("rewards", "rw") }), supplied(noTie))).includes("POLICY_UNSELECTED"));
  let a = R.createDraftSeasonSnapshot(definition()).value;
  a = apply(a, ev(a, "season_scheduled", {}));
  a = apply(a, ev(a, "season_activated", { enrollmentSnapshotRef: S("enrollment", "e") }, { at: "2026-11-01T00:00:00Z" }));
  assert.ok(codes(R.reduceSeason(a, ev(a, "cutoff_reached", { endedAt: "2026-12-01T00:00:00Z", admittedReceiptWatermark: "w" }), supplied(definition(), { cutoffPolicy: null }))).includes("POLICY_UNSELECTED"));
});

check("replay, changed payload under reused id, stale expected revision", () => {
  let s = R.createDraftSeasonSnapshot(definition()).value;
  const e1 = ev(s, "season_scheduled", {});
  s = apply(s, e1);
  const dup = R.reduceSeason(s, e1, supplied());
  assert.equal(dup.ok, true); assert.equal(dup.disposition, "duplicate"); assert.equal(dup.value.revision, s.revision);
  const changed = { ...JSON.parse(JSON.stringify(e1)), occurredAt: "2026-10-21T00:00:00Z" }; changed.fingerprint = R.fingerprintOf(changed);
  assert.ok(codes(R.reduceSeason(s, changed, supplied())).includes("EVENT_CONFLICT"));
  assert.ok(codes(R.reduceSeason(s, ev(s, "season_activated", { enrollmentSnapshotRef: S("enrollment", "e") }, { at: "2026-11-01T00:00:00Z", rev: 0 }), supplied())).includes("STALE_EXPECTED_REVISION"));
  const forged = JSON.parse(JSON.stringify(ev(s, "season_activated", { enrollmentSnapshotRef: S("enrollment", "e") }, { at: "2026-11-01T00:00:00Z" })));
  forged.payload.enrollmentSnapshotRef.recordId = "other";
  assert.ok(codes(R.reduceSeason(s, forged, supplied())).includes("FINGERPRINT_MISMATCH"));
});

check("duplicate result under a new event id rejects; late result after cutoff rejects under reject policy", () => {
  let s = R.createDraftSeasonSnapshot(definition()).value;
  s = apply(s, ev(s, "season_scheduled", {}));
  s = apply(s, ev(s, "season_activated", { enrollmentSnapshotRef: S("enrollment", "e") }, { at: "2026-11-01T00:00:00Z" }));
  s = apply(s, ev(s, "result_admitted", { resultRef: S("rating-result", "rr-1"), completedAt: "2026-11-05T00:00:00Z", receiptWatermark: "w1" }));
  assert.ok(codes(R.reduceSeason(s, ev(s, "result_admitted", { resultRef: S("rating-result", "rr-1"), completedAt: "2026-11-05T00:00:00Z", receiptWatermark: "w1" }), supplied())).includes("DUPLICATE_RESULT"));
  const f = toFreezing();
  assert.ok(codes(R.reduceSeason(f, ev(f, "result_admitted", { resultRef: S("rating-result", "rr-late"), completedAt: "2026-11-30T00:00:00Z", receiptWatermark: "w0003" }), supplied())).includes("LATE_RESULT_REJECTED"));
});

check("freeze: input hash must match; frozen hash cannot be changed by late/replayed events; reward recorded once", () => {
  const f = toFreezing();
  const freezePayload = (hash) => ({ freezeId: "fz-1", inputHash: hash, standingsSnapshotRef: S("standings", "st-1"), tiePolicyRef: POL.tie, rewardSnapshotRef: S("rewards", "rw-1") });
  assert.ok(codes(R.reduceSeason(f, ev(f, "season_frozen", freezePayload("0".repeat(64))), supplied())).includes("FREEZE_INPUT_MISMATCH"));
  let s = apply(f, ev(f, "season_frozen", freezePayload(R.seasonInputHash(f))));
  assert.equal(s.phase, "frozen");
  const frozenHash = s.freeze.inputHash;
  // Late result while frozen.
  assert.ok(codes(R.reduceSeason(s, ev(s, "result_admitted", { resultRef: S("rating-result", "rr-9"), completedAt: "2026-11-07T00:00:00Z", receiptWatermark: "w0001" }), supplied())).includes("SEASON_FROZEN"));
  // Replay of an earlier result event is a no-op duplicate.
  const replay = R.reduceSeason(s, toFreezing.firstResult, supplied());
  assert.equal(replay.disposition, "duplicate"); assert.equal(replay.value.freeze.inputHash, frozenHash); assert.equal(replay.value.revision, s.revision);
  const reorderedHash = R.seasonInputHash({ ...f, processedEventRefs: [...f.processedEventRefs].reverse() });
  assert.equal(reorderedHash, R.seasonInputHash(f), "input hash is order-independent");
  const rw = ev(s, "rewards_committed", { rewardSnapshotRef: S("rewards", "rw-1"), grantBatchRef: S("grant-batch", "gb-1") });
  assert.ok(codes(R.reduceSeason(s, ev(s, "rewards_committed", { rewardSnapshotRef: S("rewards", "rw-OTHER"), grantBatchRef: S("grant-batch", "gb-1") }), supplied())).includes("REWARD_SNAPSHOT_MISMATCH"));
  s = apply(s, rw);
  assert.equal(s.phase, "rewarding");
  assert.equal(R.reduceSeason(s, rw, supplied()).disposition, "duplicate");
  assert.ok(codes(R.reduceSeason(s, ev(s, "rewards_committed", { rewardSnapshotRef: S("rewards", "rw-1"), grantBatchRef: S("grant-batch", "gb-2") }), supplied())).includes("SEASON_REWARD_ALREADY_RECORDED"));
  assert.equal(s.freeze.inputHash, frozenHash);
  s = apply(s, ev(s, "season_archived", { archiveRef: S("archive", "ar-1") }));
  assert.equal(s.phase, "archived");
  assert.ok(!("committed" in s) && s.processedEventRefs.every((r) => r.kind !== "committed"));
});

const stPol = { policy: V("stand-p"), keys: [{ field: "seasonPoints", order: "desc" }], requiredFields: ["seasonPoints"] };
const rows = [
  { subjectId: "u-b", participantKind: "human", values: { seasonPoints: 10, wins: 3 }, receiptRef: S("row", "b") },
  { subjectId: "ai-a", participantKind: "ai_persona", values: { seasonPoints: 10, wins: 4 }, receiptRef: S("row", "a") },
  { subjectId: "u-c", participantKind: "human", values: { seasonPoints: 12, wins: 1 }, receiptRef: S("row", "c") },
  { subjectId: "u-d", participantKind: "human", values: { seasonPoints: null, wins: 9 }, receiptRef: S("row", "d") },
];

check("standings: no tie policy fails closed; ties deterministic for any input order; no winner invented", () => {
  assert.ok(codes(R.deriveSeasonStandings(rows, stPol, null)).includes("POLICY_UNSELECTED"));
  assert.ok(codes(R.deriveSeasonStandings(rows, null, { policy: V("t"), method: "shared_rank", tieBreakKeys: [], finalOrder: null })).includes("POLICY_UNSELECTED"));
  const shared = { policy: V("tie-p"), method: "shared_rank", tieBreakKeys: [], finalOrder: null };
  const a = R.deriveSeasonStandings(rows, stPol, shared).value;
  const b = R.deriveSeasonStandings([...rows].reverse(), stPol, shared).value;
  assert.equal(R.hashOf(a), R.hashOf(b));
  assert.deepEqual(a.rows.map((r) => [r.subjectId, r.rank, r.tied]), [["u-c", 1, false], ["ai-a", 2, true], ["u-b", 2, true]]);
  assert.deepEqual(a.excluded, [{ subjectId: "u-d", reasonCode: "REQUIRED_FIELD_UNKNOWN" }]);
  const tb = R.deriveSeasonStandings(rows, stPol, { policy: V("tie-p"), method: "ordered_tiebreak", tieBreakKeys: [{ field: "wins", order: "desc" }], finalOrder: null }).value;
  assert.deepEqual(tb.rows.map((r) => [r.subjectId, r.rank]), [["u-c", 1], ["ai-a", 2], ["u-b", 3]]);
  assert.ok(codes(R.deriveSeasonStandings([...rows, rows[0]], stPol, shared)).includes("DUPLICATE_STANDINGS_ROW"));
});

check("season projection keeps the readable AI badge and omits internal refs", () => {
  const f = toFreezing();
  const st = R.deriveSeasonStandings(rows, stPol, { policy: V("tie-p"), method: "shared_rank", tieBreakKeys: [], finalOrder: null }).value;
  assert.ok(codes(R.projectSeason(f, null, st)).includes("POLICY_UNSELECTED"));
  const pub = R.projectSeason(f, F.visibility(), st).value;
  const ai = pub.standings.find((r) => r.subjectId === "ai-a");
  assert.deepEqual(ai.aiBadge, { text: "AI", accessibleLabel: "AI player" });
  assert.equal(pub.standings.find((r) => r.subjectId === "u-b").aiBadge, null);
  const text = JSON.stringify(pub);
  for (const banned of ["processedEventRefs", "enrollmentSnapshotRef", "receiptRef", "admittedReceiptWatermark"]) assert.ok(!text.includes(banned), banned);
});

console.log(`rating placement+season: ${checks} checks passed`);
