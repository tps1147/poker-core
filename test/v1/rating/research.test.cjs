// Research machinery: exact Kuhn, Leduc enumeration/evaluator, harness controls and abuse fixtures.
// Small exact computations only (well under a second each).
//   node test/v1/rating/research.test.cjs
"use strict";
const assert = require("node:assert/strict");
const X = require("../../../research/v1-rating/exact.cjs");
const K = require("../../../research/v1-rating/kuhn.cjs");
const L = require("../../../research/v1-rating/leduc.cjs");
const H = require("../../../research/v1-rating/harness.cjs");

let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (e) { console.error(`FAIL ${name}`); throw e; } };
const Q = X.Rational;

check("Kuhn: 12 information sets, equilibrium family exact (value -1/18, exploitability 0)", () => {
  const r = K.run();
  assert.equal(r.facts.infoSets, 12);
  assert.deepEqual(r.facts.infoSetsByPlayer, [6, 6]);
  assert.ok(r.family.length === 5 && r.family.every((f) => f.exact && f.value === "-1/18" && f.exploitability === "0"));
  assert.ok(r.outOfFamily.every((o) => o.positive));
  assert.equal(r.uniform.nashConv, "11/12"); // published reference value (OpenSpiel uniform-random Kuhn NashConv)
  assert.ok(r.indifference.length >= 4 && r.indifference.every((i) => i.indifferent));
  assert.ok(Math.abs(r.cfr.value - (-1 / 18)) < 0.01 && r.cfr.exploitability < 0.01);
});

check("Kuhn info-set values never read the opponent's actual card", () => {
  // Same key under every deal consistent with it gives one value; the function takes only (key, profile).
  const eq = K.equilibrium(Q.of(1, 6));
  const a = X.infoSetActionValues(K.kuhn, eq, 1, "Qb", Q);
  assert.deepEqual(a.values.map(Q.str), ["-1", "-1"]);
});

check("Leduc: 288 suit-isomorphic / 936 suit-distinct information sets, by enumeration and by formula", () => {
  const r = L.run(20);
  assert.deepEqual(r.roundTree, { decisions: 6, closes: 5 });
  assert.deepEqual(r.infoSets.enumerated, { suitIsomorphic: 288, suitDistinct: 936 });
  assert.deepEqual(r.infoSets.formula, r.infoSets.enumerated);
  assert.equal(r.deals, 120);
  // Exact rational evaluation of the uniform profile.
  assert.equal(r.uniformExact.value, "-5/64");
  assert.equal(r.uniformExact.nashConv, "1709/360"); // = 4.747222..., the published uniform-random Leduc NashConv
  assert.ok(Math.abs(r.uniform.nashConv - 1709 / 360) < 1e-9);
  assert.ok(r.cfr.exploitability < r.cfr.shortRunExploitability);
});

check("Leduc rules: fold, raise cap, round break, showdown payoffs", () => {
  assert.deepEqual(L.state("").legal, ["k", "b"]);
  assert.deepEqual(L.state("b").legal, ["f", "c", "r"]);
  assert.deepEqual(L.state("br").legal, ["f", "c"], "two bets per round at most");
  assert.equal(L.state("kk").closed, true);
  assert.deepEqual(L.state("brc/").contrib, [5, 5]);
  assert.equal(L.state("bc/brc").terminal, true);
  assert.deepEqual(L.state("bc/brc").contrib, [11, 11]);
  const deal = (a, b, c) => ({ cards: [L.DECK.indexOf(a), L.DECK.indexOf(b), L.DECK.indexOf(c)] });
  assert.equal(L.leduc.utility(deal("Js", "Kh", "Jh"), "kk/kk", X.Float), 1, "pair beats high card");
  assert.equal(L.leduc.utility(deal("Qs", "Kh", "Js"), "kk/kk", X.Float), -1);
  assert.equal(L.leduc.utility(deal("Qs", "Qh", "Js"), "kk/kk", X.Float), 0, "split");
  assert.equal(L.leduc.utility(deal("Qs", "Kh", "Js"), "bf", X.Float), 1);
  assert.throws(() => L.state("k/"), /bad round break/);
});

check("harness: config required, split overlap refused, deterministic under seed, abuse fixtures pass, nothing fitted", () => {
  assert.equal(H.run(null).ok, false);
  assert.equal(H.run({ ...H.MACHINERY_CONFIG, holdoutFamilies: ["station@1"] }).ok, false);
  const a = H.run(H.MACHINERY_CONFIG); const b = H.run(H.MACHINERY_CONFIG);
  assert.equal(JSON.stringify(a.record), JSON.stringify(b.record));
  const c = H.run({ ...H.MACHINERY_CONFIG, seed: H.MACHINERY_CONFIG.seed + 1 });
  assert.notEqual(c.record.controls.dealScheduleHash, a.record.controls.dealScheduleHash);
  assert.equal(a.record.metrics, "UNSELECTED"); assert.equal(a.record.rejectionRules, "UNSELECTED"); assert.equal(a.record.fitted, false);
  assert.ok(a.record.abuseCases.length >= 10 && a.record.abuseCases.every((x) => x.pass), JSON.stringify(a.record.abuseCases.filter((x) => !x.pass)));
  assert.equal(a.record.machineryChecks.equilibriumVsEquilibriumMaxRegret, 0);
  assert.throws(() => H.assertDisjoint(["km-1"], ["km-1"]), /overlap/);
  const refused = H.run({ ...H.MACHINERY_CONFIG, candidateConfigs: [{ ...H.MACHINERY_CONFIG.candidateConfigs[2], parameters: {} }] });
  assert.ok(refused.record.candidates[0].refused.includes("POLICY_INCOMPLETE"));
  for (const k of ["candidatesSha256", "harnessSha256", "exactSha256", "kuhnSha256"]) assert.match(a.record.sources[k], /^[0-9a-f]{64}$/);
});

console.log(`rating research: ${checks} checks passed`);
