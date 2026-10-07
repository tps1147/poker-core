"use strict";
// §8 seasons, freeze and supplied tie policy (F52-V1-CONTRACT-1). The reducer moves a SeasonSnapshot
// through draft -> scheduled -> active -> freezing -> frozen -> rewarding -> archived only on admitted
// events and only when every policy that transition needs is named by the definition AND supplied as
// accepted. No ranking weight, reset, tie winner, reward cutoff or duration is chosen here. A frozen
// input hash/reward snapshot cannot be changed by late or replayed events; rewards are recorded once.

const C = require("./common.cjs");
const { problem, ok, fail, isObj, isStr, isNum, isCount, isTs } = C;
const { checkVisibility } = require("./placement.cjs");
const { AI_BADGE } = require("./rating.cjs");

const PHASES = ["draft", "scheduled", "active", "freezing", "frozen", "rewarding", "archived"];
const DEF_KEYS = ["contractId", "schemaVersion", "season", "startsAt", "endsAt", "populationRef", "formatRef", "enrollmentPolicyRef",
  "ratingCarryoverPolicyRef", "eligibleEvidencePolicyRef", "standingsPolicyRef", "tiePolicyRef", "rewardPolicyRef", "archivePolicyRef"];
const POLICY_FIELDS = DEF_KEYS.slice(7);
const SNAPSHOT_KEYS = ["contractId", "schemaVersion", "seasonId", "revision", "phase", "definitionRef", "processedEventRefs",
  "enrollmentSnapshotRef", "cutoff", "freeze", "archiveRef"];
const EVENT_KEYS = ["contractId", "schemaVersion", "eventId", "fingerprint", "command", "seasonId", "source", "occurredAt", "kind", "payload"];

// kind -> [from phase(s), to phase, required definition policy fields, closed payload keys]
const TRANSITIONS = {
  season_scheduled: [["draft"], "scheduled", [], []],
  season_activated: [["scheduled"], "active", ["enrollmentPolicyRef", "ratingCarryoverPolicyRef", "eligibleEvidencePolicyRef", "standingsPolicyRef"], ["enrollmentSnapshotRef"]],
  result_admitted: [["active", "freezing"], null, ["eligibleEvidencePolicyRef"], ["resultRef", "completedAt", "receiptWatermark"]],
  cutoff_reached: [["active"], "freezing", ["eligibleEvidencePolicyRef", "standingsPolicyRef"], ["endedAt", "admittedReceiptWatermark"]],
  season_frozen: [["freezing"], "frozen", ["standingsPolicyRef", "tiePolicyRef", "rewardPolicyRef"], ["freezeId", "inputHash", "standingsSnapshotRef", "tiePolicyRef", "rewardSnapshotRef"]],
  rewards_committed: [["frozen"], "rewarding", ["rewardPolicyRef"], ["rewardSnapshotRef", "grantBatchRef"]],
  season_archived: [["rewarding"], "archived", ["archivePolicyRef"], ["archiveRef"]],
};

function validateSeasonDefinition(def) {
  const problems = [];
  if (!C.checkEnvelope(def, problems)) return fail(problems);
  C.closedKeys(def, DEF_KEYS, problems);
  C.requireKeys(def, DEF_KEYS, problems);
  C.checkVersionRef(def.season, problems, "season");
  C.checkVersionRef(def.populationRef, problems, "populationRef");
  C.checkVersionRef(def.formatRef, problems, "formatRef");
  for (const k of POLICY_FIELDS) C.checkVersionRef(def[k], problems, k, { nullable: true });
  if (!isTs(def.startsAt)) problems.push(problem("invalid-timestamp", "startsAt"));
  if (!isTs(def.endsAt)) problems.push(problem("invalid-timestamp", "endsAt"));
  if (isTs(def.startsAt) && isTs(def.endsAt) && Date.parse(def.endsAt) <= Date.parse(def.startsAt)) problems.push(problem("invalid-season-window", "endsAt"));
  if (problems.length) return fail(problems);
  return ok(C.deepFreeze(C.clone(def)));
}

function createDraftSeasonSnapshot(def) {
  const v = validateSeasonDefinition(def);
  if (!v.ok) return v;
  return ok(C.deepFreeze({ contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, seasonId: def.season.id, revision: 0,
    phase: "draft", definitionRef: C.clone(def.season), processedEventRefs: [], enrollmentSnapshotRef: null, cutoff: null, freeze: null, archiveRef: null }));
}

function validateSeasonSnapshot(s) {
  const problems = [];
  if (!C.checkEnvelope(s, problems)) return fail(problems);
  C.closedKeys(s, SNAPSHOT_KEYS, problems);
  C.requireKeys(s, SNAPSHOT_KEYS, problems);
  if (!isStr(s.seasonId)) problems.push(problem("invalid-id", "seasonId"));
  if (!isCount(s.revision)) problems.push(problem("invalid-revision", "revision"));
  if (!PHASES.includes(s.phase)) problems.push(problem("invalid-phase", "phase"));
  C.checkVersionRef(s.definitionRef, problems, "definitionRef");
  if (!Array.isArray(s.processedEventRefs)) problems.push(problem("invalid-source-refs", "processedEventRefs"));
  else s.processedEventRefs.forEach((r, i) => C.checkSourceRef(r, problems, `processedEventRefs[${i}]`));
  C.checkSourceRef(s.enrollmentSnapshotRef, problems, "enrollmentSnapshotRef", { nullable: true });
  C.checkSourceRef(s.archiveRef, problems, "archiveRef", { nullable: true });
  if (!(s.cutoff === null || (isObj(s.cutoff) && isTs(s.cutoff.endedAt) && isStr(s.cutoff.admittedReceiptWatermark)))) problems.push(problem("invalid-cutoff", "cutoff"));
  if (s.freeze !== null) {
    const f = s.freeze;
    if (!isObj(f) || !isStr(f.freezeId) || !/^[0-9a-f]{64}$/.test(f.inputHash ?? "")) problems.push(problem("invalid-freeze", "freeze"));
    else { C.checkSourceRef(f.standingsSnapshotRef, problems, "freeze.standingsSnapshotRef"); C.checkVersionRef(f.tiePolicyRef, problems, "freeze.tiePolicyRef"); C.checkSourceRef(f.rewardSnapshotRef, problems, "freeze.rewardSnapshotRef"); }
  }
  const idx = PHASES.indexOf(s.phase);
  if (idx >= PHASES.indexOf("freezing") && s.cutoff === null) problems.push(problem("phase-invariant", "cutoff"));
  if (idx >= PHASES.indexOf("frozen") && s.freeze === null) problems.push(problem("phase-invariant", "freeze"));
  if (problems.length) return fail(problems);
  return ok(s);
}

// Hash of everything the frozen standings depend on: admitted result refs (order-independent) + cutoff.
function seasonInputHash(snapshot) {
  const results = snapshot.processedEventRefs.filter((r) => r.kind === "season-result")
    .map((r) => `${r.recordId}|${r.recordVersion}|${r.sourceHash}`).sort();
  return C.hashOf({ seasonId: snapshot.seasonId, definitionRef: snapshot.definitionRef, results, cutoff: snapshot.cutoff });
}

// reduceSeason(snapshot, admittedSeasonEvent, suppliedSeasonPolicies) -> Result<SeasonSnapshot>
// suppliedSeasonPolicies = { definition: SeasonDefinition, acceptedPolicyRefs: VersionRef[],
//                            cutoffPolicy: { policy: VersionRef, lateResults: "reject" | "admit_until_freeze" } | null }
function reduceSeason(snapshot, event, supplied) {
  const sv = validateSeasonSnapshot(snapshot);
  if (!sv.ok) return sv;
  const problems = [];
  if (!isObj(supplied)) return fail([problem("POLICY_UNSELECTED", "suppliedSeasonPolicies")]);
  const dv = validateSeasonDefinition(supplied.definition);
  if (!dv.ok) return dv;
  const def = dv.value;
  if (!C.sameRef(def.season, snapshot.definitionRef) || def.season.id !== snapshot.seasonId) return fail([problem("definition-mismatch", "suppliedSeasonPolicies.definition")]);
  if (!Array.isArray(supplied.acceptedPolicyRefs) || !supplied.acceptedPolicyRefs.every(C.isVersionRef)) return fail([problem("POLICY_INCOMPLETE", "suppliedSeasonPolicies.acceptedPolicyRefs")]);

  if (!C.checkEnvelope(event, problems)) return fail(problems);
  C.closedKeys(event, EVENT_KEYS, problems);
  C.requireKeys(event, EVENT_KEYS, problems);
  if (!isStr(event.eventId)) problems.push(problem("invalid-id", "eventId"));
  if (!isObj(event.command) || !isStr(event.command.commandId) || !isCount(event.command.expectedRevision)) problems.push(problem("invalid-command", "command"));
  C.checkSourceRef(event.source, problems, "source");
  if (!isTs(event.occurredAt)) problems.push(problem("invalid-timestamp", "occurredAt"));
  if (event.seasonId !== snapshot.seasonId) problems.push(problem("season-mismatch", "seasonId"));
  if (!(event.kind in TRANSITIONS)) problems.push(problem("unknown-event-kind", "kind"));
  if (!isObj(event.payload)) problems.push(problem("invalid-payload", "payload"));
  if (problems.length) return fail(problems);
  const fp = C.fingerprintOf(event);
  if (event.fingerprint !== fp) return fail([problem("FINGERPRINT_MISMATCH", "fingerprint")]);

  // Replay: same id + fingerprint is a no-op; same id with changed payload is a conflict.
  const prior = snapshot.processedEventRefs.find((r) => r.kind.startsWith("season-event/") && r.recordId === event.eventId);
  if (prior) {
    if (prior.sourceHash === fp) return ok(snapshot, "duplicate");
    return fail([problem("EVENT_CONFLICT", "eventId", "reused event id with a changed payload")]);
  }
  if (event.command.expectedRevision !== snapshot.revision) return fail([problem("STALE_EXPECTED_REVISION", "command.expectedRevision")]);

  const [from, to, needs, payloadKeys] = TRANSITIONS[event.kind];
  const pl = event.payload;
  C.closedKeys(pl, payloadKeys, problems, "payload.");
  C.requireKeys(pl, payloadKeys, problems, "payload.");
  if (problems.length) return fail(problems);

  if (!from.includes(snapshot.phase)) {
    if (event.kind === "result_admitted" && ["frozen", "rewarding", "archived"].includes(snapshot.phase)) return fail([problem("SEASON_FROZEN", "phase", "late results cannot change a frozen season")]);
    if (event.kind === "rewards_committed" && ["rewarding", "archived"].includes(snapshot.phase)) return fail([problem("SEASON_REWARD_ALREADY_RECORDED", "phase", "season rewards are recorded once")]);
    return fail([problem("invalid-transition", "kind", `${event.kind} is not allowed in phase ${snapshot.phase}`)]);
  }
  for (const k of needs) {
    if (def[k] === null) problems.push(problem("POLICY_UNSELECTED", `definition.${k}`, `${event.kind} needs ${k}`));
    else if (!C.refIn(def[k], supplied.acceptedPolicyRefs)) problems.push(problem("POLICY_INCOMPLETE", `definition.${k}`, `${k} is not supplied as accepted`));
  }
  if (problems.length) return fail(problems);

  const next = C.clone(snapshot);
  const eventRef = { kind: `season-event/${event.kind}`, recordId: event.eventId, recordVersion: String(snapshot.revision), sourceHash: fp };
  switch (event.kind) {
    case "season_scheduled": break;
    case "season_activated":
      if (!C.checkSourceRef(pl.enrollmentSnapshotRef, problems, "payload.enrollmentSnapshotRef")) break;
      if (Date.parse(event.occurredAt) < Date.parse(def.startsAt) || Date.parse(event.occurredAt) >= Date.parse(def.endsAt)) problems.push(problem("outside-season-window", "occurredAt"));
      next.enrollmentSnapshotRef = C.clone(pl.enrollmentSnapshotRef);
      break;
    case "result_admitted": {
      if (!C.checkSourceRef(pl.resultRef, problems, "payload.resultRef") || !isTs(pl.completedAt) || !isStr(pl.receiptWatermark)) { problems.push(problem("invalid-payload", "payload")); break; }
      const t = Date.parse(pl.completedAt);
      if (t < Date.parse(def.startsAt) || t >= Date.parse(def.endsAt)) { problems.push(problem("outside-season-window", "payload.completedAt")); break; }
      if (snapshot.phase === "freezing") {
        const cp = supplied.cutoffPolicy;
        if (!isObj(cp) || !C.isVersionRef(cp.policy)) { problems.push(problem("POLICY_UNSELECTED", "suppliedSeasonPolicies.cutoffPolicy")); break; }
        if (cp.lateResults !== "admit_until_freeze" || t >= Date.parse(snapshot.cutoff.endedAt) || pl.receiptWatermark > snapshot.cutoff.admittedReceiptWatermark) {
          problems.push(problem("LATE_RESULT_REJECTED", "payload", "the supplied cutoff policy does not admit this result")); break;
        }
      }
      if (snapshot.processedEventRefs.some((r) => r.kind === "season-result" && r.recordId === pl.resultRef.recordId)) {
        problems.push(problem("DUPLICATE_RESULT", "payload.resultRef", "the same result under a second event id")); break;
      }
      next.processedEventRefs.push({ kind: "season-result", recordId: pl.resultRef.recordId, recordVersion: pl.resultRef.recordVersion, sourceHash: pl.resultRef.sourceHash });
      break;
    }
    case "cutoff_reached": {
      const cp = supplied.cutoffPolicy;
      if (!isObj(cp) || !C.isVersionRef(cp.policy) || !["reject", "admit_until_freeze"].includes(cp.lateResults)) { problems.push(problem("POLICY_UNSELECTED", "suppliedSeasonPolicies.cutoffPolicy")); break; }
      if (!isTs(pl.endedAt) || !isStr(pl.admittedReceiptWatermark)) { problems.push(problem("invalid-payload", "payload")); break; }
      if (Date.parse(pl.endedAt) < Date.parse(def.endsAt)) { problems.push(problem("cutoff-before-season-end", "payload.endedAt")); break; }
      next.cutoff = { endedAt: pl.endedAt, admittedReceiptWatermark: pl.admittedReceiptWatermark };
      break;
    }
    case "season_frozen": {
      if (!isStr(pl.freezeId) || !C.checkSourceRef(pl.standingsSnapshotRef, problems, "payload.standingsSnapshotRef")
        || !C.checkSourceRef(pl.rewardSnapshotRef, problems, "payload.rewardSnapshotRef") || !C.checkVersionRef(pl.tiePolicyRef, problems, "payload.tiePolicyRef")) { problems.push(problem("invalid-payload", "payload")); break; }
      if (!C.sameRef(pl.tiePolicyRef, def.tiePolicyRef)) { problems.push(problem("POLICY_MISMATCH", "payload.tiePolicyRef")); break; }
      if (pl.inputHash !== seasonInputHash(snapshot)) { problems.push(problem("FREEZE_INPUT_MISMATCH", "payload.inputHash", "freeze must cover exactly the admitted inputs")); break; }
      next.freeze = { freezeId: pl.freezeId, inputHash: pl.inputHash, standingsSnapshotRef: C.clone(pl.standingsSnapshotRef),
        tiePolicyRef: C.clone(pl.tiePolicyRef), rewardSnapshotRef: C.clone(pl.rewardSnapshotRef) };
      break;
    }
    case "rewards_committed":
      if (!C.checkSourceRef(pl.rewardSnapshotRef, problems, "payload.rewardSnapshotRef") || !C.checkSourceRef(pl.grantBatchRef, problems, "payload.grantBatchRef")) break;
      if (C.canonical(pl.rewardSnapshotRef) !== C.canonical(snapshot.freeze.rewardSnapshotRef)) problems.push(problem("REWARD_SNAPSHOT_MISMATCH", "payload.rewardSnapshotRef"));
      break;
    case "season_archived":
      if (!C.checkSourceRef(pl.archiveRef, problems, "payload.archiveRef")) break;
      next.archiveRef = C.clone(pl.archiveRef);
      break;
    default: problems.push(problem("unknown-event-kind", "kind"));
  }
  if (problems.length) return fail(problems);
  if (to) next.phase = to;
  next.processedEventRefs.push(eventRef);
  next.revision = snapshot.revision + 1;
  return ok(C.deepFreeze(next));
}

// deriveSeasonStandings(admittedRows, suppliedStandingsPolicy, suppliedTiePolicy) -> Result<Standings>
// rows: [{ subjectId, participantKind, values: { [field]: number|null }, receiptRef }]
// standings policy: { policy, keys: [{ field, order: "asc"|"desc" }], requiredFields: string[] }
// tie policy: { policy, method: "shared_rank"|"ordered_tiebreak", tieBreakKeys: [{field, order}], finalOrder: "subjectId_ascending"|null }
function deriveSeasonStandings(rows, sp, tp) {
  const problems = [];
  if (!isObj(sp)) return fail([problem("POLICY_UNSELECTED", "suppliedStandingsPolicy")]);
  if (!isObj(tp)) return fail([problem("POLICY_UNSELECTED", "suppliedTiePolicy", "no tie policy; no tie winner is chosen here")]);
  const keyList = (ks, path) => {
    if (!Array.isArray(ks) || !ks.every((k) => isObj(k) && isStr(k.field) && ["asc", "desc"].includes(k.order))) problems.push(problem("POLICY_INCOMPLETE", path));
  };
  C.checkVersionRef(sp.policy, problems, "suppliedStandingsPolicy.policy");
  keyList(sp.keys, "suppliedStandingsPolicy.keys");
  if (Array.isArray(sp.keys) && sp.keys.length === 0) problems.push(problem("POLICY_INCOMPLETE", "suppliedStandingsPolicy.keys"));
  if (!Array.isArray(sp.requiredFields) || !sp.requiredFields.every(isStr)) problems.push(problem("POLICY_INCOMPLETE", "suppliedStandingsPolicy.requiredFields"));
  C.checkVersionRef(tp.policy, problems, "suppliedTiePolicy.policy");
  if (!["shared_rank", "ordered_tiebreak"].includes(tp.method)) problems.push(problem("POLICY_INCOMPLETE", "suppliedTiePolicy.method"));
  keyList(tp.tieBreakKeys, "suppliedTiePolicy.tieBreakKeys");
  if (!(tp.finalOrder === null || tp.finalOrder === "subjectId_ascending")) problems.push(problem("POLICY_INCOMPLETE", "suppliedTiePolicy.finalOrder"));
  if (!Array.isArray(rows)) problems.push(problem("invalid-rows", "admittedRows"));
  if (problems.length) return fail(problems);
  const seen = new Set();
  const included = []; const excluded = [];
  rows.forEach((r, i) => {
    if (!isObj(r) || !isStr(r.subjectId) || !["human", "ai_persona"].includes(r.participantKind) || !isObj(r.values) || !C.isSourceRef(r.receiptRef)) {
      problems.push(problem("invalid-row", `admittedRows[${i}]`)); return;
    }
    if (seen.has(r.subjectId)) { problems.push(problem("DUPLICATE_STANDINGS_ROW", `admittedRows[${i}]`)); return; }
    seen.add(r.subjectId);
    for (const v of Object.values(r.values)) if (!(v === null || isNum(v))) problems.push(problem("invalid-value", `admittedRows[${i}].values`));
    const fields = [...sp.keys, ...(tp.method === "ordered_tiebreak" ? tp.tieBreakKeys : [])].map((k) => k.field);
    if ([...sp.requiredFields, ...fields].some((f) => !isNum(r.values[f]))) excluded.push({ subjectId: r.subjectId, reasonCode: "REQUIRED_FIELD_UNKNOWN" });
    else included.push(r);
  });
  if (problems.length) return fail(problems);
  const cmpKeys = (ks) => (x, y) => {
    for (const k of ks) { const d = x.values[k.field] - y.values[k.field]; if (d !== 0) return k.order === "asc" ? d : -d; }
    return 0;
  };
  const primary = cmpKeys(sp.keys);
  const secondary = tp.method === "ordered_tiebreak" ? cmpKeys(tp.tieBreakKeys) : () => 0;
  const tieCmp = (x, y) => primary(x, y) || secondary(x, y);
  const bySubject = (x, y) => (x.subjectId < y.subjectId ? -1 : x.subjectId > y.subjectId ? 1 : 0);
  const distinct = tp.method === "ordered_tiebreak" && tp.finalOrder === "subjectId_ascending";
  // Deterministic listing for any input order; subjectId ordering only decides RANK when the policy says so.
  included.sort((x, y) => tieCmp(x, y) || bySubject(x, y));
  const fieldsShown = [...new Set([...sp.keys, ...(tp.method === "ordered_tiebreak" ? tp.tieBreakKeys : [])].map((k) => k.field))];
  const out = [];
  included.forEach((r, i) => {
    const prev = included[i - 1];
    const tiedPrev = prev && tieCmp(prev, r) === 0;
    const next = included[i + 1];
    const tiedNext = next && tieCmp(r, next) === 0;
    const rank = distinct ? i + 1 : tiedPrev ? out[i - 1].rank : i + 1;
    out.push({ rank, subjectId: r.subjectId, participantKind: r.participantKind,
      values: Object.fromEntries(fieldsShown.map((f) => [f, r.values[f]])), tied: !distinct && Boolean(tiedPrev || tiedNext),
      receiptRef: C.clone(r.receiptRef) });
  });
  excluded.sort(bySubject);
  const inputHash = C.hashOf({ rows: [...rows].map((r) => ({ s: r.subjectId, k: r.participantKind, v: r.values, r: r.receiptRef })).sort((x, y) => (x.s < y.s ? -1 : x.s > y.s ? 1 : 0)) });
  return ok(C.deepFreeze({ standingsPolicyRef: C.clone(sp.policy), tiePolicyRef: C.clone(tp.policy), inputHash, rows: out, excluded }));
}

// projectSeason(snapshot, suppliedVisibilityPolicy, standings = null) -> Result<PublicSeason>
function projectSeason(snapshot, vis, standings = null) {
  const sv = validateSeasonSnapshot(snapshot);
  if (!sv.ok) return sv;
  const problems = checkVisibility(vis);
  if (problems.length) return fail(problems);
  const s = snapshot;
  const pub = {
    contractId: C.CONTRACT_ID, schemaVersion: C.SCHEMA_VERSION, seasonId: s.seasonId, revision: s.revision, phase: s.phase,
    definitionRef: C.clone(s.definitionRef), cutoffEndedAt: s.cutoff ? s.cutoff.endedAt : null,
    frozen: s.freeze ? { freezeId: s.freeze.freezeId, inputHash: s.freeze.inputHash, tiePolicyRef: C.clone(s.freeze.tiePolicyRef) } : null,
    standings: null,
  };
  if (standings !== null) {
    if (!isObj(standings) || !Array.isArray(standings.rows)) return fail([problem("invalid-standings", "standings")]);
    if (s.freeze && standings.inputHash === undefined) return fail([problem("invalid-standings", "standings.inputHash")]);
    pub.standings = standings.rows.map((r) => ({ rank: r.rank, tied: r.tied, subjectId: r.subjectId, participantKind: r.participantKind,
      isAi: r.participantKind === "ai_persona",
      aiBadge: r.participantKind === "ai_persona" ? { text: AI_BADGE.text, accessibleLabel: AI_BADGE.accessibleLabel } : null,
      values: C.clone(r.values) }));
  }
  return ok(C.deepFreeze(pub));
}

module.exports = { validateSeasonDefinition, createDraftSeasonSnapshot, validateSeasonSnapshot, seasonInputHash, reduceSeason,
  deriveSeasonStandings, projectSeason };
