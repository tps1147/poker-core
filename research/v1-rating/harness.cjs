"use strict";
// Rating research harness (F52-V1-CONTRACT-1 §11). RESEARCH ONLY.
// Records exact candidate/config/source hashes, seed/deal/seat controls, policy-family and
// chronological holdout splits, and runs the abuse-case fixtures. It FITS NOTHING and selects no
// metric or rejection rule: those are main's to agree before any fitted experiment. With no supplied
// metric spec the run is recorded with metrics "UNSELECTED". Toy-game behaviour validates machinery only.
//   node research/v1-rating/harness.cjs [--write]
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const X = require("./exact.cjs");
const { kuhn, profile, equilibrium } = require("./kuhn.cjs");
const C = require("../../src/rating/v1/common.cjs");
const cands = require("../../src/rating/v1/candidates.cjs");
const { runAbuseCases } = require("./fixtures/abuse-cases.cjs");

const fileHash = (rel) => createHash("sha256").update(fs.readFileSync(path.join(__dirname, rel))).digest("hex");

// Deterministic PRNG (mulberry32). Seed is part of the run record.
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------------------------------------------------------------- Kuhn policy families (versioned)
const Q = X.Rational;
const q = (n, d) => Q.of(n, d);
const FAMILIES = {
  "eq-alpha-0@1": () => equilibrium(q(0, 1)),
  "eq-alpha-1/6@1": () => equilibrium(q(1, 6)),
  "eq-alpha-1/3@1": () => equilibrium(q(1, 3)),
  "station@1": () => profile({ J: q(0, 1), Q: q(0, 1), K: q(1, 2), Jpb: q(1, 1), Qpb: q(1, 1), Kpb: q(1, 1), Jb: q(1, 1), Qb: q(1, 1), Kb: q(1, 1), Jp: q(0, 1), Qp: q(0, 1), Kp: q(1, 2) }),
  "maniac@1": () => profile({ J: q(1, 1), Q: q(1, 1), K: q(1, 1), Jpb: q(1, 2), Qpb: q(1, 1), Kpb: q(1, 1), Jb: q(1, 2), Qb: q(1, 1), Kb: q(1, 1), Jp: q(1, 1), Qp: q(1, 1), Kp: q(1, 1) }),
  "nit@1": () => profile({ J: q(0, 1), Q: q(0, 1), K: q(1, 1), Jpb: q(0, 1), Qpb: q(0, 1), Kpb: q(1, 1), Jb: q(0, 1), Qb: q(0, 1), Kb: q(1, 1), Jp: q(0, 1), Qp: q(0, 1), Kp: q(1, 1) }),
};
const isP0Key = (k) => k.length === 1 || k.endsWith("pb");
function seatProfile(seat0Policy, seat1Policy) {
  const m = new Map();
  for (const [k, v] of seat0Policy) if (isP0Key(k)) m.set(k, v);
  for (const [k, v] of seat1Policy) if (!isP0Key(k)) m.set(k, v);
  return m;
}

// Exact decision quality = chosen action value - best action value at the information set, with the
// opponent's hidden card integrated through the opponent policy (the "oracle opponent model" of this
// toy: research only, it is the true policy, which a live model never is).
function makeQualityOracle() {
  const cache = new Map();
  return (seat0Id, seat1Id, player, key, actionIndex) => {
    const ck = `${seat0Id}|${seat1Id}|${key}`;
    if (!cache.has(ck)) {
      const r = X.infoSetActionValues(kuhn, seatProfile(FAMILIES[seat0Id](), FAMILIES[seat1Id]()), player, key, Q);
      cache.set(ck, r && r.values ? r.values.map(Q.toNumber) : null);
    }
    const v = cache.get(ck);
    if (!v) return null;
    return v[actionIndex] - Math.max(...v);
  };
}

function sampleHand(cards, sigma, rand) {
  let h = ""; const decisions = [];
  while (!kuhn.isTerminal({ cards }, h)) {
    const p = kuhn.player(h); const key = kuhn.infoKey({ cards }, h, p);
    const pb = Q.toNumber(sigma.get(key)[1]);
    const a = rand() < pb ? 1 : 0;
    decisions.push({ player: p, key, actionIndex: a, ordinal: h.length });
    h += kuhn.actions(h)[a];
  }
  return { h, decisions, u0: Q.toNumber(kuhn.utility({ cards }, h, Q)) };
}

// ---------------------------------------------------------------- run
function validateHarnessConfig(cfg) {
  const problems = [];
  if (!C.isObj(cfg)) return ["no harness config"];
  if (!Number.isSafeInteger(cfg.seed)) problems.push("seed");
  if (!Number.isSafeInteger(cfg.matches) || cfg.matches < 2) problems.push("matches");
  if (!Number.isSafeInteger(cfg.dealPairsPerMatch) || cfg.dealPairsPerMatch < 1) problems.push("dealPairsPerMatch");
  if (!Array.isArray(cfg.trainFamilies) || !Array.isArray(cfg.holdoutFamilies)) problems.push("family split");
  else if (cfg.trainFamilies.some((f) => cfg.holdoutFamilies.includes(f))) problems.push("policy-family split overlaps");
  for (const f of [...(cfg.trainFamilies || []), ...(cfg.holdoutFamilies || [])]) if (!FAMILIES[f]) problems.push(`unknown family ${f}`);
  if (!Number.isSafeInteger(cfg.chronologicalCutoffOrdinal)) problems.push("chronologicalCutoffOrdinal");
  if (!C.isTs(cfg.recordedAt)) problems.push("recordedAt (supplied, not read from a clock)");
  if (!C.isObj(cfg.assessmentVariance) || !C.isNum(cfg.assessmentVariance.value)) problems.push("assessmentVariance (machinery fixture, supplied)");
  if (!C.isObj(cfg.prior) || !C.isNum(cfg.prior.estimate) || !C.isNum(cfg.prior.variance)) problems.push("prior (machinery fixture, supplied)");
  if (!Array.isArray(cfg.candidateConfigs) || cfg.candidateConfigs.length === 0) problems.push("candidateConfigs");
  return problems;
}

// Guard used by any future fitting step: fit and evaluation sets must be disjoint.
function assertDisjoint(fitIds, evalIds) {
  const s = new Set(fitIds);
  const overlap = evalIds.filter((x) => s.has(x));
  if (overlap.length) throw new Error(`fit/evaluation overlap: ${overlap.slice(0, 3).join(",")}`);
}

function schedule(cfg) {
  const rand = rng(cfg.seed);
  const families = [...cfg.trainFamilies, ...cfg.holdoutFamilies];
  const matches = [];
  for (let m = 0; m < cfg.matches; m += 1) {
    const a = families[Math.floor(rand() * families.length)];
    let b = families[Math.floor(rand() * families.length)];
    if (b === a) b = families[(families.indexOf(a) + 1) % families.length];
    const deals = [];
    for (let d = 0; d < cfg.dealPairsPerMatch; d += 1) {
      const c0 = Math.floor(rand() * 3); const c1 = (c0 + 1 + Math.floor(rand() * 2)) % 3;
      deals.push([c0, c1]);
    }
    matches.push({ matchId: `km-${m}`, ordinal: m, players: [`P:${a}`, `P:${b}`], families: [a, b], deals,
      split: { chronological: m < cfg.chronologicalCutoffOrdinal ? "train" : "holdout",
        policyFamily: cfg.holdoutFamilies.includes(a) || cfg.holdoutFamilies.includes(b) ? "holdout" : "train" } });
  }
  return matches;
}

// Plays each deal twice with seats swapped (duplicate format); decisions carry exact quality.
function playMatches(cfg, matches) {
  const rand = rng(cfg.seed ^ 0x9e3779b9);
  const oracle = makeQualityOracle();
  for (const m of matches) {
    const [fa, fb] = m.families; let netA = 0; m.hands = [];
    m.deals.forEach((cards, di) => {
      for (const swap of [false, true]) {
        const seat0 = swap ? fb : fa; const seat1 = swap ? fa : fb;
        const sigma = seatProfile(FAMILIES[seat0](), FAMILIES[seat1]());
        const dealCards = swap ? [cards[1], cards[0]] : cards; // same cards follow the seat
        const hand = sampleHand(dealCards, sigma, rand);
        const handId = `${m.matchId}:d${di}:${swap ? "s" : "o"}`;
        netA += swap ? -hand.u0 : hand.u0;
        m.hands.push({ handId, seat0, seat1, decisions: hand.decisions.map((d) => ({ ...d,
          subject: (d.player === 0) !== swap ? m.players[0] : m.players[1],
          quality: oracle(seat0, seat1, d.player, d.key, d.actionIndex) })) });
      }
    });
    m.netA = netA;
  }
  return matches;
}

function boundFor(m, ratings, cfgUncertaintyMethod, assessU, variance, { qualityOverride = null } = {}) {
  const groups = { [m.players[0]]: [], [m.players[1]]: [] };
  for (const h of m.hands) {
    for (const pid of m.players) {
      const vals = h.decisions.filter((d) => d.subject === pid && d.quality !== null).map((d) => (qualityOverride ? qualityOverride(pid, d) : d.quality));
      if (vals.length) groups[pid].push({ groupId: `hand:${m.matchId}:${h.handId}`, values: vals,
        uncertainties: vals.map(() => ({ status: "estimated", methodRef: assessU, parameters: { variance }, coverageRef: null })) });
    }
  }
  return C.deepFreeze({
    outcome: m.netA === 0 ? { kind: "tie", winnerSubjectId: null } : { kind: "participant_win", winnerSubjectId: m.netA > 0 ? m.players[0] : m.players[1] },
    participants: m.players.map((pid, i) => ({ subjectId: pid, participantKind: i === 0 ? "human" : "ai_persona", estimate: ratings[pid].estimate,
      uncertainty: { status: "estimated", methodRef: cfgUncertaintyMethod, parameters: { variance: ratings[pid].variance }, coverageRef: null } })),
    quality: Object.fromEntries(m.players.map((pid) => [pid, { groups: groups[pid] }])),
  });
}

function run(cfg, { metricSpec = null } = {}) {
  const bad = validateHarnessConfig(cfg);
  if (bad.length) return { ok: false, problems: bad };
  const matches = playMatches(cfg, schedule(cfg));
  const record = {
    harness: "v1-rating-kuhn-machinery", recordedAt: cfg.recordedAt,
    sources: { candidatesSha256: fileHash("../../src/rating/v1/candidates.cjs"), harnessSha256: fileHash("harness.cjs"),
      exactSha256: fileHash("exact.cjs"), kuhnSha256: fileHash("kuhn.cjs") },
    configHash: C.hashOf({ ...cfg, candidateConfigs: cfg.candidateConfigs.map((c) => C.hashOf(c)) }),
    controls: { seed: cfg.seed, matches: cfg.matches, dealPairsPerMatch: cfg.dealPairsPerMatch, seatControl: "duplicate deal, seats swapped",
      dealScheduleHash: C.hashOf(matches.map((m) => m.deals)), seatScheduleHash: C.hashOf(matches.map((m) => m.families)) },
    splits: {
      policyFamily: { train: cfg.trainFamilies, holdout: cfg.holdoutFamilies,
        trainMatches: matches.filter((m) => m.split.policyFamily === "train").map((m) => m.matchId),
        holdoutMatches: matches.filter((m) => m.split.policyFamily === "holdout").map((m) => m.matchId) },
      chronological: { cutoffOrdinal: cfg.chronologicalCutoffOrdinal,
        train: matches.filter((m) => m.split.chronological === "train").map((m) => m.matchId),
        holdout: matches.filter((m) => m.split.chronological === "holdout").map((m) => m.matchId) },
    },
    metrics: metricSpec === null ? "UNSELECTED" : "NOT_IMPLEMENTED_PENDING_MAIN_AGREEMENT",
    rejectionRules: "UNSELECTED",
    fitted: false,
    candidates: [], machineryChecks: {}, abuseCases: null,
  };
  assertDisjoint(record.splits.chronological.train, record.splits.chronological.holdout);
  assertDisjoint(record.splits.policyFamily.trainMatches, record.splits.policyFamily.holdoutMatches);

  // Exact quality sanity: equilibrium players never incur negative quality against each other (mixed
  // actions are indifferent), while exploitable families do somewhere.
  const eqEq = matches.filter((m) => m.families.every((f) => f.startsWith("eq-")));
  const regrets = (pred) => matches.flatMap((m) => m.hands.flatMap((h) => h.decisions.filter((d) => pred(m, h, d)).map((d) => d.quality))).filter((x) => x !== null);
  const eqVsEq = regrets((m) => m.families.every((f) => f.startsWith("eq-")));
  record.machineryChecks.equilibriumVsEquilibriumMaxRegret = eqVsEq.length ? Math.min(...eqVsEq) : null;
  record.machineryChecks.equilibriumVsEquilibriumMatches = eqEq.length;
  record.machineryChecks.anyNegativeQualityOverall = regrets(() => true).some((x) => x < -1e-12);

  for (const cc of cfg.candidateConfigs) {
    const factory = { outcome_only_baseline: cands.createOutcomeOnlyBaseline, joint_latent_outcome_quality: cands.createJointLatentOutcomeQuality,
      bounded_uncertainty_shrunk_quality: cands.createBoundedUncertaintyShrunkQuality }[cc.candidate];
    const built = factory ? factory(cc) : { ok: false, problems: [{ code: "unknown-candidate" }] };
    if (!built.ok) { record.candidates.push({ candidate: cc.candidate, refused: built.problems.map((p) => p.code) }); continue; }
    const model = built.value;
    const ratings = {};
    for (const m of matches) for (const pid of m.players) ratings[pid] = ratings[pid] || { estimate: cfg.prior.estimate, variance: cfg.prior.variance };
    const trajectory = [];
    for (const m of matches) {
      const r = model.compute(boundFor(m, ratings, model.uncertaintyMethodRef, model.assessmentUncertaintyMethodRef, cfg.assessmentVariance.value));
      if (!r.ok) { trajectory.push({ matchId: m.matchId, problems: r.problems.map((p) => p.code) }); continue; }
      for (const o of r.value.participants) ratings[o.subjectId] = { estimate: o.estimate, variance: o.uncertainty && o.uncertainty.parameters ? o.uncertainty.parameters.variance : ratings[o.subjectId].variance };
      trajectory.push({ matchId: m.matchId, after: r.value.participants.map((o) => [o.subjectId, o.estimate]) });
    }
    // Causal check: first match, outcome and opponent fixed, quality replaced by two constants.
    const m0 = matches[0];
    const fresh = Object.fromEntries(m0.players.map((pid) => [pid, { estimate: cfg.prior.estimate, variance: cfg.prior.variance }]));
    const at = (c) => model.compute(boundFor(m0, fresh, model.uncertaintyMethodRef, model.assessmentUncertaintyMethodRef, cfg.assessmentVariance.value,
      { qualityOverride: (pid, d) => (pid === m0.players[0] ? c : d.quality) })).value.participants;
    const lo = at(-0.5); const hi = at(0);
    record.candidates.push({ candidate: cc.candidate, label: model.label, modelRef: model.modelRef, configHash: model.configHash,
      finalRatingsHash: C.hashOf(ratings), trajectoryHash: C.hashOf(trajectory),
      causalQualityCheck: { qualityChangesSubjectDelta: hi[0].estimate !== lo[0].estimate, opponentUnchanged: hi[1].estimate === lo[1].estimate,
        direction: Math.sign(hi[0].estimate - lo[0].estimate) } });
  }
  record.abuseCases = runAbuseCases();
  return { ok: true, record };
}

// The machinery run's explicit experimental configuration. Every number is a FIXTURE for exercising code
// paths; none is a proposed production value.
const MACHINERY_CONFIG = Object.freeze({
  seed: 20261006, matches: 24, dealPairsPerMatch: 8, recordedAt: "2026-10-06T00:00:00Z",
  trainFamilies: ["eq-alpha-0@1", "eq-alpha-1/3@1", "station@1", "maniac@1"], holdoutFamilies: ["eq-alpha-1/6@1", "nit@1"],
  chronologicalCutoffOrdinal: 16,
  assessmentVariance: { value: 0.25, note: "machinery fixture" }, prior: { estimate: 0, variance: 1, note: "machinery fixture" },
  candidateConfigs: ["outcome_only_baseline", "joint_latent_outcome_quality", "bounded_uncertainty_shrunk_quality"].map((c) => {
    const params = {
      outcome_only_baseline: { logisticScale: 1, stepSize: 0.2, outcomeScores: { win: 1, tie: 0.5, loss: 0 } },
      joint_latent_outcome_quality: { logisticScale: 1, outcomeScores: { win: 1, tie: 0.5, loss: 0 }, qualityLoading: 0.5, qualityIntercept: 0, qualityNoiseVariance: 1, varianceFloor: 0.01 },
      bounded_uncertainty_shrunk_quality: { logisticScale: 1, stepSize: 0.2, outcomeScores: { win: 1, tie: 0.5, loss: 0 }, qualityGain: 0.3, qualityReference: 0, priorQualityVariance: 1, adjustmentBound: 0.1 },
    }[c];
    const quality = c !== "outcome_only_baseline";
    const V = (id) => ({ id, version: "machinery-1", sha256: null });
    return { candidate: c, experimental: true, configId: V(`kuhn-machinery-${c}`), parameterSchemaRef: V(`schema-${c}`),
      uncertaintyMethodRef: V("gaussian-variance-fixture"), assessmentUncertaintyMethodRef: quality ? V("exact-regret-variance-fixture") : null,
      qualitySemanticsRef: quality ? V("kuhn-regret-fixture") : null, evaluatorRefs: quality ? [V("kuhn-exact-oracle")] : [], parameters: params };
  }),
});

if (require.main === module) {
  const a = run(MACHINERY_CONFIG);
  const b = run(MACHINERY_CONFIG);
  if (!a.ok) { console.error(JSON.stringify(a.problems)); process.exitCode = 1; }
  else {
    const deterministic = C.hashOf(a.record) === C.hashOf(b.record);
    const refused = run({ ...MACHINERY_CONFIG, candidateConfigs: [{ ...MACHINERY_CONFIG.candidateConfigs[1], parameters: {} }] });
    const overlap = run({ ...MACHINERY_CONFIG, holdoutFamilies: ["station@1"] });
    const summary = { ...a.record, determinism: { sameSeedSameRecord: deterministic },
      refusalWithoutParameters: refused.ok ? refused.record.candidates[0].refused : refused.problems,
      overlappingSplitRejected: !overlap.ok };
    if (process.argv.includes("--write")) {
      const dir = path.join(__dirname, "runs"); fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "kuhn-machinery-run.json"), `${JSON.stringify(summary, null, 1)}\n`);
    }
    const ok = deterministic && summary.abuseCases.every((c) => c.pass) && summary.overlappingSplitRejected
      && Array.isArray(summary.refusalWithoutParameters) && summary.refusalWithoutParameters.includes("POLICY_INCOMPLETE")
      && summary.machineryChecks.equilibriumVsEquilibriumMaxRegret !== null && Math.abs(summary.machineryChecks.equilibriumVsEquilibriumMaxRegret) < 1e-12
      && summary.candidates.every((c) => (c.candidate === "outcome_only_baseline" ? !c.causalQualityCheck.qualityChangesSubjectDelta
        : c.causalQualityCheck.qualityChangesSubjectDelta && c.causalQualityCheck.opponentUnchanged && c.causalQualityCheck.direction === 1));
    console.log(JSON.stringify({ configHash: summary.configHash, sources: summary.sources, controls: summary.controls,
      splits: { policyFamilyHoldoutMatches: summary.splits.policyFamily.holdoutMatches.length, chronologicalHoldout: summary.splits.chronological.holdout.length },
      metrics: summary.metrics, machineryChecks: summary.machineryChecks, candidates: summary.candidates.map((c) => ({ candidate: c.candidate, causal: c.causalQualityCheck })),
      abuseCases: summary.abuseCases.map((c) => `${c.pass ? "PASS" : "FAIL"} ${c.id}`), determinism: summary.determinism,
      refusalWithoutParameters: summary.refusalWithoutParameters, overlappingSplitRejected: summary.overlappingSplitRejected }, null, 1));
    console.log(ok ? "HARNESS MACHINERY CHECKS PASSED" : "HARNESS MACHINERY CHECKS FAILED");
    process.exitCode = ok ? 0 : 1;
  }
}

module.exports = { FAMILIES, rng, run, schedule, playMatches, assertDisjoint, validateHarnessConfig, MACHINERY_CONFIG };
