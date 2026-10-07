// Living Gauntlet journey against F52-V1-CONTRACT-1 §10 and the §11 rejection fixtures.
//   node test/v1/gauntlet/livingGauntlet.test.cjs
"use strict";
const assert = require("node:assert/strict");
const G = require("../../../src/gauntlet/v1/index.cjs");
const { fingerprintOf, CONTRACT_ID, SCHEMA_VERSION } = require("../../../src/gauntlet/v1/common.cjs");
const { RIVAL_NARRATIVES, NARRATIVE_PACK_REF } = require("../../../src/gauntlet/v1/rivals.cjs");
const { BOT_ROSTER } = require("../../../src/data/botRoster");

const ENV = { contractId: CONTRACT_ID, schemaVersion: SCHEMA_VERSION };
const V = (id, version = "1") => ({ id, version, sha256: null });
const S = (kind, recordId) => ({ kind, recordId, recordVersion: "1", sourceHash: null });
const codes = (r) => (r.ok ? [] : r.problems.map((x) => x.code));
const fp = (o) => ({ ...o, fingerprint: fingerprintOf(o) });
const clone = (v) => JSON.parse(JSON.stringify(v));

let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (e) { console.error(`FAIL ${name}`); throw e; } };

const rivalDef = (botId, extra = {}) => ({ ...ENV, rivalId: `rival-${botId}`, canonicalBotId: botId, definitionRef: V(`rivaldef-${botId}`),
  stylePolicyRef: V(`style-${botId}`), narrativePackRef: { ...NARRATIVE_PACK_REF }, learningPlanRefs: [V("plan-starting-hands")], accessPolicyRef: V("access-inherited"), ...extra });
const RIVALS = { "rival-rookie-bob": rivalDef("rookie-bob"), "rival-slow-steve": rivalDef("slow-steve") };
let allowed = new Set(["rival-rookie-bob", "rival-slow-steve"]);
const policies = (over = {}) => ({
  definitionRef: V("journey-gauntlet"),
  progressionPolicy: { policy: V("progression-existing-win-rules"), status: "accepted", acceptanceRef: S("receipt", "prog-accept") },
  rivals: RIVALS, isChallengeAllowed: (rivalId) => allowed.has(rivalId), detourPlans: { "plan-starting-hands@1": true }, ...over,
});

let n = 0;
const ev = (kind, payload, expectedRevision, over = {}) => {
  n += 1;
  return fp({ ...ENV, eventId: `ev-${n}`, command: { commandId: `cmd-${n}`, expectedRevision }, subjectId: "user-1", journeyId: "gauntlet-1",
    source: S("journey_admission", `adm-${n}`), occurredAt: new Date(Date.UTC(2026, 9, 6, 18, 0, n)).toISOString().replace(".000Z", "Z"), kind, payload, ...over });
};
const binding = (matchId = "match-1", prep = "prep-1") => ({ matchId, preparationReceiptId: prep, canonicalBotId: "rookie-bob" });
const result = (over = {}) => fp({ ...ENV, encounterId: "enc-1", resultId: "res-1", subjectId: "user-1", journeyId: "gauntlet-1", matchId: "match-1",
  rivalId: "rival-rookie-bob", canonicalBotId: "rookie-bob", rivalDefinitionRef: V("rivaldef-rookie-bob"), stylePolicyRef: V("style-rookie-bob"),
  resultSource: S("game_settlement", "settle-1"), committedAt: "2026-10-06T18:30:00Z", outcome: "loss",
  existingJourneyReceiptRef: S("journey_result", "jr-1"), admittedProgressionReceiptRef: null, reviewSourceRef: S("review", "rv-1"), rewardGrantRefs: [], ...over });

// Applies a list of [kind, payload] steps and returns the final snapshot, asserting each applied.
function run(steps, start = null) {
  let snap = start;
  for (const [kind, payload, over] of steps) {
    const r = G.reduceJourneyCheckpoint(snap, ev(kind, payload, snap ? snap.revision : 0, over), policies());
    assert.ok(r.ok, `${kind}: ${JSON.stringify(r.problems)}`);
    assert.equal(r.disposition, "applied", kind);
    snap = r.value;
  }
  return snap;
}
const toInMatch = () => run([
  ["introduced", {}], ["rival_selected", { rivalId: "rival-rookie-bob" }],
  ["preparation_committed", { encounterId: "enc-1", matchBinding: binding() }],
  ["match_started", { encounterId: "enc-1", matchBinding: binding() }],
]);

check("narratives cover all 16 roster bots once, archetypes match, roster untouched", () => {
  assert.equal(BOT_ROSTER.length, 16);
  assert.equal(RIVAL_NARRATIVES.length, 16);
  assert.deepEqual(RIVAL_NARRATIVES.map((r) => r.canonicalBotId), BOT_ROSTER.map((b) => b.id));
  for (const r of RIVAL_NARRATIVES) assert.equal(r.archetype, BOT_ROSTER.find((b) => b.id === r.canonicalBotId).archetype);
  const archetypes = new Set(BOT_ROSTER.map((b) => b.archetype));
  for (const a of archetypes) assert.ok(["calling-station", "nit", "tag", "lag", "trapper", "shark", "drawer", "balanced"].includes(a));
  for (const r of RIVAL_NARRATIVES) for (const line of Object.values(r.lines)) assert.ok(!/master/i.test(line), `no mastery claim in ${r.rivalId}`);
  assert.ok(Object.isFrozen(BOT_ROSTER) && Object.isFrozen(RIVAL_NARRATIVES));
});

check("validateRivalDefinition: valid, unknown bot, bot mismatch, unknown pack version, unknown supplied ref", () => {
  assert.ok(G.validateRivalDefinition(rivalDef("rookie-bob")).ok);
  assert.ok(codes(G.validateRivalDefinition(rivalDef("phantom-bot"))).includes("unknown-canonical-bot"));
  assert.ok(codes(G.validateRivalDefinition({ ...rivalDef("rookie-bob"), canonicalBotId: "slow-steve" })).includes("rival-bot-mismatch"));
  assert.ok(codes(G.validateRivalDefinition(rivalDef("rookie-bob", { narrativePackRef: { ...NARRATIVE_PACK_REF, version: "9" } }))).includes("unknown-narrative-pack-version"));
  assert.ok(codes(G.validateRivalDefinition({ ...rivalDef("rookie-bob"), schemaVersion: 2 })).includes("unknown-schema-version"));
  assert.ok(codes(G.validateRivalDefinition(rivalDef("rookie-bob"), { knownRefs: {} })).includes("unknown-version"));
  assert.ok(codes(G.validateRivalDefinition({ ...rivalDef("rookie-bob"), rating: 1560 })).includes("unknown-field"));
});

check("happy path with disconnect/resume: introduced -> selected -> ready -> in_match -> result_pending -> reviewed -> next_choice", () => {
  let s = toInMatch();
  assert.equal(s.phase, "in_match");
  const before = clone(s);
  s = run([["match_disconnected", { encounterId: "enc-1", matchId: "match-1" }]], s);
  assert.equal(s.phase, "in_match");
  assert.deepEqual(s.matchBinding, before.matchBinding, "disconnect keeps the same bound encounter/match");
  assert.equal(s.encounterId, "enc-1");
  s = run([["match_resumed", { encounterId: "enc-1", matchBinding: binding() }]], s);
  s = run([["result_committed", { result: result() }]], s);
  assert.equal(s.phase, "result_pending");
  assert.equal(s.resultReceiptId, "res-1");
  s = run([["review_acknowledged", { resultId: "res-1", acknowledgementId: "ack-1" }]], s);
  assert.equal(s.phase, "reviewed");
  s = run([["next_choice_requested", { choice: "continue", rivalId: null, learningPlanRef: null }]], s);
  assert.equal(s.phase, "next_choice");
  assert.ok(Object.isFrozen(s) && Object.isFrozen(s.processedEventRefs));
});

check("resume with a different match binding cannot allocate a new encounter", () => {
  const s = toInMatch();
  const r = G.reduceJourneyCheckpoint(s, ev("match_resumed", { encounterId: "enc-1", matchBinding: binding("match-2") }, s.revision), policies());
  assert.ok(codes(r).includes("match-binding-mismatch"));
  const r2 = G.reduceJourneyCheckpoint(s, ev("match_started", { encounterId: "enc-1", matchBinding: binding() }, s.revision), policies());
  assert.ok(codes(r2).includes("invalid-transition"));
});

check("rematch after a loss uses a newly issued encounter and preserves history; reused encounter id rejects", () => {
  let s = toInMatch();
  s = run([["result_committed", { result: result() }], ["review_acknowledged", { resultId: "res-1", acknowledgementId: "ack-1" }],
    ["next_choice_requested", { choice: "rematch", rivalId: "rival-rookie-bob", learningPlanRef: null }]], s);
  assert.equal(s.phase, "selected");
  assert.equal(s.rivalId, "rival-rookie-bob");
  assert.equal(s.encounterId, null);
  assert.ok(s.processedEventRefs.some((r) => r.kind === "encounter_result" && r.recordId === "res-1"), "history kept");
  const reused = G.reduceJourneyCheckpoint(s, ev("preparation_committed", { encounterId: "enc-1", matchBinding: binding("match-2", "prep-2") }, s.revision), policies());
  assert.ok(codes(reused).includes("encounter-id-reused"));
  s = run([["preparation_committed", { encounterId: "enc-2", matchBinding: binding("match-2", "prep-2") }]], s);
  assert.equal(s.phase, "ready");
  const wrongRival = G.reduceJourneyCheckpoint(s, ev("rival_selected", { rivalId: "rival-slow-steve" }, s.revision), policies());
  assert.ok(codes(wrongRival).includes("invalid-transition"));
});

check("learning detour from next_choice returns to next_choice; evidence id recorded, never mastery", () => {
  let s = toInMatch();
  s = run([["result_committed", { result: result({ outcome: "win" }) }], ["review_acknowledged", { resultId: "res-1", acknowledgementId: "ack-1" }],
    ["next_choice_requested", { choice: "continue", rivalId: null, learningPlanRef: null }],
    ["next_choice_requested", { choice: "lesson", rivalId: null, learningPlanRef: V("plan-starting-hands") }]], s);
  assert.equal(s.phase, "learning_detour");
  assert.deepEqual(s.detour, { learningPlanRef: V("plan-starting-hands"), returnPhase: "next_choice", admittedEvidenceId: null });
  const wrongPlan = G.reduceJourneyCheckpoint(s, ev("detour_completed", { learningPlanRef: V("plan-other"), admittedEvidenceId: "evi-1" }, s.revision), policies());
  assert.ok(codes(wrongPlan).includes("detour-plan-mismatch"));
  s = run([["detour_completed", { learningPlanRef: V("plan-starting-hands"), admittedEvidenceId: "evi-1" }]], s);
  assert.equal(s.phase, "next_choice");
  assert.equal(s.detour.admittedEvidenceId, "evi-1");
  assert.ok(!JSON.stringify(s).match(/master/i));
  // Unknown plan and payload/choice mismatch reject.
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("next_choice_requested", { choice: "drill", rivalId: null, learningPlanRef: V("plan-unknown") }, s.revision), policies())).includes("unknown-learning-plan"));
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("next_choice_requested", { choice: "lesson", rivalId: "rival-rookie-bob", learningPlanRef: V("plan-starting-hands") }, s.revision), policies())).includes("choice-payload-mismatch"));
  // Re-using the same detour evidence for a second detour cannot complete it twice.
  s = run([["next_choice_requested", { choice: "drill", rivalId: null, learningPlanRef: V("plan-starting-hands") }]], s);
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("detour_completed", { learningPlanRef: V("plan-starting-hands"), admittedEvidenceId: "evi-1" }, s.revision), policies())).includes("detour-evidence-reused"));
  s = run([["detour_exited", { learningPlanRef: V("plan-starting-hands") }]], s);
  assert.equal(s.phase, "next_choice");
});

check("stale expected revision rejects", () => {
  const s = toInMatch();
  const r = G.reduceJourneyCheckpoint(s, ev("match_disconnected", { encounterId: "enc-1", matchId: "match-1" }, s.revision - 1), policies());
  assert.deepEqual(codes(r), ["stale-revision"]);
  const r2 = G.reduceJourneyCheckpoint(s, ev("match_disconnected", { encounterId: "enc-1", matchId: "match-1" }, s.revision + 1), policies());
  assert.deepEqual(codes(r2), ["stale-revision"]);
});

check("same event replay is a duplicate; changed payload under a reused event id is a conflict", () => {
  const s0 = run([["introduced", {}]]);
  const e = ev("rival_selected", { rivalId: "rival-rookie-bob" }, s0.revision);
  const s1 = G.reduceJourneyCheckpoint(s0, e, policies()).value;
  const again = G.reduceJourneyCheckpoint(s1, e, policies());
  assert.equal(again.disposition, "duplicate");
  assert.equal(again.value.revision, s1.revision);
  const changed = fp({ ...e, payload: { rivalId: "rival-slow-steve" } });
  assert.deepEqual(codes(G.reduceJourneyCheckpoint(s1, changed, policies())), ["event-id-conflict"]);
  // Tampered payload without a matching fingerprint is rejected at shape check.
  assert.ok(codes(G.reduceJourneyCheckpoint(s0, { ...e, payload: { rivalId: "rival-slow-steve" } }, policies())).includes("fingerprint-mismatch"));
  // Same command id under a new event id.
  const cmdReuse = fp({ ...ev("preparation_committed", { encounterId: "enc-1", matchBinding: binding() }, s1.revision), command: { commandId: e.command.commandId, expectedRevision: s1.revision } });
  assert.ok(codes(G.reduceJourneyCheckpoint(s1, cmdReuse, policies())).includes("command-id-conflict"));
});

check("duplicated encounter result under a new event id awards nothing twice; changed result conflicts", () => {
  let s = toInMatch();
  s = run([["result_committed", { result: result({ outcome: "win", admittedProgressionReceiptRef: S("progression", "pr-1"), rewardGrantRefs: [S("grant", "g-1")] }) }]], s);
  const rev = s.revision;
  const dup = G.reduceJourneyCheckpoint(s, ev("result_committed", { result: result({ outcome: "win", admittedProgressionReceiptRef: S("progression", "pr-1"), rewardGrantRefs: [S("grant", "g-1")] }) }, rev), policies());
  assert.equal(dup.disposition, "duplicate");
  assert.equal(dup.value.revision, rev);
  assert.equal(dup.value.processedEventRefs.filter((r) => r.kind === "encounter_result").length, 1);
  const changed = G.reduceJourneyCheckpoint(s, ev("result_committed", { result: result({ outcome: "loss" }) }, rev), policies());
  assert.deepEqual(codes(changed), ["result-id-conflict"]);
  const other = G.reduceJourneyCheckpoint(s, ev("result_committed", { result: result({ resultId: "res-2" }) }, rev), policies());
  assert.deepEqual(codes(other), ["encounter-already-resulted"]);
  // Duplicated review acknowledgement is a no-op too.
  s = run([["review_acknowledged", { resultId: "res-1", acknowledgementId: "ack-1" }]], s);
  const dupAck = G.reduceJourneyCheckpoint(s, ev("review_acknowledged", { resultId: "res-1", acknowledgementId: "ack-1" }, s.revision), policies());
  assert.equal(dupAck.disposition, "duplicate");
});

check("unplayed cancellation awards nothing: preparation cancel and cancelled_unplayed result", () => {
  let s = run([["introduced", {}], ["rival_selected", { rivalId: "rival-rookie-bob" }], ["preparation_committed", { encounterId: "enc-1", matchBinding: binding() }]]);
  s = run([["preparation_cancelled", { encounterId: "enc-1", cancellationReceipt: S("unplayed_cancellation", "cx-1") }]], s);
  assert.equal(s.phase, "selected");
  assert.equal(s.resultReceiptId, null);
  assert.equal(s.matchBinding, null);
  assert.ok(!s.processedEventRefs.some((r) => r.kind === "encounter_result"));
  const noReceipt = G.reduceJourneyCheckpoint(s, ev("preparation_cancelled", { encounterId: null, cancellationReceipt: null }, s.revision), policies());
  assert.ok(codes(noReceipt).includes("invalid-transition"));

  let m = toInMatch();
  const awarding = G.reduceJourneyCheckpoint(m, ev("result_committed", { result: result({ outcome: "cancelled_unplayed", existingJourneyReceiptRef: null, reviewSourceRef: null, rewardGrantRefs: [S("grant", "g-x")] }) }, m.revision), policies());
  assert.ok(codes(awarding).includes("unplayed-cancellation-awards"));
  const asLoss = G.validateEncounterResult(result({ outcome: "cancelled_unplayed", admittedProgressionReceiptRef: S("progression", "pr-x"), existingJourneyReceiptRef: null, reviewSourceRef: null }), policies());
  assert.ok(codes(asLoss).includes("unplayed-cancellation-awards"));
  m = run([["result_committed", { result: result({ outcome: "cancelled_unplayed", existingJourneyReceiptRef: null, reviewSourceRef: null }) }]], m);
  assert.equal(m.phase, "next_choice");
  const proj = G.projectLivingGauntlet(m, { known: true, visibilityPolicyRef: V("vis-1"), rivals: RIVALS,
    results: { "res-1": result({ outcome: "cancelled_unplayed", existingJourneyReceiptRef: null, reviewSourceRef: null }) } });
  assert.ok(proj.ok, JSON.stringify(proj.problems));
  assert.equal(proj.value.result.progressionReceiptId, null);
  assert.deepEqual(proj.value.result.rewardGrantIds, []);
  // Review cannot be acknowledged for an unplayed cancellation.
  assert.ok(codes(G.reduceJourneyCheckpoint(m, ev("review_acknowledged", { resultId: "res-1", acknowledgementId: "ack-x" }, m.revision), policies())).includes("invalid-transition"));
});

check("missing / unselected / incomplete progression policy fails closed", () => {
  const e = ev("introduced", {}, 0);
  assert.ok(codes(G.reduceJourneyCheckpoint(null, e, undefined)).includes("POLICY_UNSELECTED"));
  assert.ok(codes(G.reduceJourneyCheckpoint(null, e, policies({ progressionPolicy: undefined }))).includes("POLICY_UNSELECTED"));
  assert.ok(codes(G.reduceJourneyCheckpoint(null, e, policies({ progressionPolicy: { policy: V("p"), status: "unselected", acceptanceRef: null } }))).includes("POLICY_UNSELECTED"));
  assert.ok(codes(G.reduceJourneyCheckpoint(null, e, policies({ progressionPolicy: { policy: V("p"), status: "accepted", acceptanceRef: null } }))).includes("POLICY_INCOMPLETE"));
  assert.ok(codes(G.reduceJourneyCheckpoint(null, e, policies({ isChallengeAllowed: undefined }))).includes("POLICY_INCOMPLETE"));
});

check("invalid ownership: subject or journey mismatch on event and result", () => {
  const s = toInMatch();
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("match_disconnected", { encounterId: "enc-1", matchId: "match-1" }, s.revision, { subjectId: "user-2" }), policies())).includes("subject-mismatch"));
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("match_disconnected", { encounterId: "enc-1", matchId: "match-1" }, s.revision, { journeyId: "other" }), policies())).includes("journey-mismatch"));
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("result_committed", { result: result({ subjectId: "user-2" }) }, s.revision), policies())).includes("subject-mismatch"));
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("result_committed", { result: result({ matchId: "match-9" }) }, s.revision), policies())).includes("match-binding-mismatch"));
});

check("missing provenance and unknown versions reject", () => {
  assert.ok(codes(G.reduceJourneyCheckpoint(null, ev("introduced", {}, 0, { source: null }), policies())).includes("missing-provenance"));
  assert.ok(codes(G.validateEncounterResult(result({ resultSource: null }), policies())).includes("missing-provenance"));
  assert.ok(codes(G.reduceJourneyCheckpoint(null, ev("introduced", {}, 0, { schemaVersion: 2 }), policies())).includes("unknown-schema-version"));
  assert.ok(codes(G.validateEncounterResult(result({ rivalDefinitionRef: V("rivaldef-rookie-bob", "2") }), policies())).includes("rival-definition-version-mismatch"));
  assert.ok(codes(G.validateEncounterResult(result({ stylePolicyRef: V("style-rookie-bob", "7") }), policies())).includes("style-policy-version-mismatch"));
  const s = run([["introduced", {}]]);
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("rival_selected", { rivalId: "rival-rookie-bob" }, s.revision), policies({ definitionRef: V("journey-gauntlet", "2") }))).includes("definition-version-mismatch"));
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("rival_selected", { rivalId: "rival-mirage" }, s.revision), policies())).includes("unknown-rival"));
});

check("closed payloads: missing or extra fields reject; hidden cards and mastery fields in a result reject", () => {
  const s = run([["introduced", {}]]);
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("rival_selected", { rivalId: "rival-rookie-bob", botRating: 1560 }, s.revision), policies())).includes("unknown-field"));
  assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("rival_selected", {}, s.revision), policies())).includes("missing-field"));
  assert.ok(codes(G.validateEncounterResult({ ...result(), holeCards: ["As", "Kd"] }, policies())).includes("private-field"));
  assert.ok(codes(G.validateEncounterResult(fp({ ...result(), conceptMastered: true }), policies())).includes("unknown-field"));
  assert.ok(codes(G.validateEncounterResult(result({ canonicalBotId: "slow-steve" }), policies())).includes("rival-bot-mismatch"));
});

check("challenge must be allowed by main's supplied access answer", () => {
  const s = run([["introduced", {}]]);
  allowed = new Set(["rival-rookie-bob"]);
  try {
    assert.ok(codes(G.reduceJourneyCheckpoint(s, ev("rival_selected", { rivalId: "rival-slow-steve" }, s.revision), policies())).includes("challenge-not-allowed"));
  } finally { allowed = new Set(["rival-rookie-bob", "rival-slow-steve"]); }
});

check("projection: noisy win shows no progression or mastery; readable AI identity; private fields omitted", () => {
  let s = toInMatch();
  const win = result({ outcome: "win" });
  s = run([["result_committed", { result: win }]], s);
  const ctx = { known: true, visibilityPolicyRef: V("vis-1"), rivals: RIVALS, results: { "res-1": win } };
  const r = G.projectLivingGauntlet(s, ctx);
  assert.ok(r.ok, JSON.stringify(r.problems));
  const pub = r.value;
  assert.equal(pub.result.outcome, "win");
  assert.equal(pub.result.progressionReceiptId, null, "a win alone shows no progression");
  const text = JSON.stringify(pub);
  assert.ok(!/master/i.test(text), "no mastery anywhere in the public projection");
  assert.equal(pub.rival.displayName, "Rookie Bob");
  assert.equal(pub.rival.participantKind, "ai_persona");
  assert.deepEqual(pub.rival.aiBadge, { text: "AI", accessibleLabel: "AI player" });
  assert.ok(!text.includes("prep-1") && !text.includes("processedEventRefs") && !text.includes("settle-1") && !text.includes("adm-"));
  assert.equal(pub.line, RIVAL_NARRATIVES[0].lines.afterWin);
  // With main's admitted progression receipt the id is shown, still without any mastery claim.
  const withReceipt = result({ outcome: "win", admittedProgressionReceiptRef: S("progression", "pr-1") });
  const r2 = G.projectLivingGauntlet(s, { ...ctx, results: { "res-1": withReceipt } });
  assert.equal(r2.value.result.progressionReceiptId, "pr-1");
  assert.ok(!/master/i.test(JSON.stringify(r2.value)));
  assert.ok(codes(G.projectLivingGauntlet(s, { ...ctx, known: false })).includes("unknown-visibility-policy"));
  assert.ok(codes(G.projectLivingGauntlet(s, { ...ctx, results: {} })).includes("unknown-result"));
});

console.log(`gauntlet journey: ${checks} checks passed`);
