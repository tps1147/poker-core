"use strict";
// Kuhn poker, exact. RESEARCH ONLY (machinery validation; says nothing about Hold'em).
// Three cards J<Q<K, ante 1 each, one bet of 1. Player 0 acts first. Actions: p (check/fold), b (bet/call).
//   node research/v1-rating/kuhn.cjs        runs the exact checks and prints a JSON summary
const X = require("./exact.cjs");
const { Rational: Qf } = X;

const CARDS = ["J", "Q", "K"];
const TERMINAL = new Set(["pp", "bp", "bb", "pbp", "pbb"]);
const kuhn = {
  name: "kuhn",
  ROOT: "",
  deals(F = Qf) {
    this._deals = this._deals || new Map();
    if (!this._deals.has(F.name)) {
      const out = [];
      for (let a = 0; a < 3; a += 1) for (let b = 0; b < 3; b += 1) if (a !== b) out.push(Object.freeze({ prob: F.of(1, 6), cards: [a, b] }));
      this._deals.set(F.name, Object.freeze(out));
    }
    return this._deals.get(F.name);
  },
  isTerminal: (deal, h) => TERMINAL.has(h),
  player: (h) => h.length % 2,
  actions: () => ["p", "b"],
  child: (h, a) => h + a,
  infoKey: (deal, h, p) => `${CARDS[deal.cards[p]]}${h}`,
  utility(deal, h, F) {
    const hi = deal.cards[0] > deal.cards[1] ? 1 : -1;
    switch (h) {
      case "pp": return F.of(hi);
      case "bb": case "pbb": return F.of(2 * hi);
      case "bp": return F.of(1);
      case "pbp": return F.of(-1);
      default: throw new Error(`not terminal: ${h}`);
    }
  },
};

// Strategy from "probability of b" per information set.
function profile(betProb, F = Qf) {
  const m = new Map();
  for (const [k, p] of Object.entries(betProb)) m.set(k, [F.sub(F.one, p), p]);
  return m;
}
// The known one-parameter equilibrium family (Kuhn 1950): alpha in [0, 1/3] for player 0.
function equilibrium(alpha) {
  const q = (n, d) => Qf.of(n, d);
  return profile({
    J: alpha, Q: q(0, 1), K: Qf.mul(q(3, 1), alpha),
    Jpb: q(0, 1), Qpb: Qf.add(alpha, q(1, 3)), Kpb: q(1, 1),
    Jb: q(0, 1), Qb: q(1, 3), Kb: q(1, 1),
    Jp: q(1, 3), Qp: q(0, 1), Kp: q(1, 1),
  });
}

function run() {
  const F = Qf;
  const info = X.infoSets(kuhn);
  const facts = { game: "kuhn", field: F.name, deals: kuhn.deals().length, infoSets: info.size,
    infoSetsByPlayer: [0, 1].map((p) => [...info.values()].filter((i) => i.player === p).length) };
  const value = F.of(-1, 18);
  const family = [];
  for (const [n, d] of [[0, 1], [1, 12], [1, 6], [1, 4], [1, 3]]) {
    const s = equilibrium(F.of(n, d));
    const ev = X.expectedValue(kuhn, s, F);
    const ex = X.exploitability(kuhn, s, F);
    family.push({ alpha: `${n}/${d}`, value: F.str(ev), exploitability: F.str(ex.exploitability),
      exact: F.eq(ev, value) && F.eq(ex.exploitability, F.zero) && F.eq(ex.br0, value) && F.eq(ex.br1, F.neg(value)) });
  }
  // Out-of-family perturbations must be exploitable.
  const perturb = (key, p) => { const s = equilibrium(F.of(1, 6)); s.set(key, [F.sub(F.one, p), p]); return s; };
  const off = [["Qpb", F.of(2, 3)], ["Qb", F.of(1, 2)], ["Jp", F.of(1, 2)], ["Q", F.of(1, 10)]].map(([k, p]) => {
    const ex = X.exploitability(kuhn, perturb(k, p), F);
    return { infoSet: k, betProb: F.str(p), exploitability: F.str(ex.exploitability), positive: F.cmp(ex.exploitability, F.zero) > 0 };
  });
  const uni = X.exploitability(kuhn, X.uniformStrategy(kuhn, F), F);
  // Mixed equilibrium actions are indifferent: zero regret at every information set in the support.
  const eq = equilibrium(F.of(1, 6));
  const indifference = [];
  for (const [key, inf] of info) {
    const r = X.infoSetActionValues(kuhn, eq, inf.player, key, F);
    if (!r || !r.values) continue;
    const probs = eq.get(key);
    const supp = r.values.filter((_, i) => F.cmp(probs[i], F.zero) > 0);
    if (supp.length > 1) indifference.push({ infoSet: key, values: r.values.map(F.str), indifferent: supp.every((v) => F.eq(v, supp[0])) });
  }
  // Information-set values cannot depend on the opponent's actual card: computed once per key.
  const cfrAvg = X.cfr(kuhn, 2000);
  const cfrEx = X.exploitability(kuhn, cfrAvg, X.Float).exploitability;
  const cfrAlpha = cfrAvg.get("J")[1];
  return { facts, gameValue: F.str(value), family, outOfFamily: off,
    uniform: { nashConv: F.str(uni.nashConv), exploitability: F.str(uni.exploitability) },
    indifference,
    cfr: { iterations: 2000, exploitability: cfrEx, alphaJ: cfrAlpha, kBetOverJBet: cfrAvg.get("K")[1] / cfrAlpha, value: X.expectedValue(kuhn, cfrAvg, X.Float) } };
}

if (require.main === module) {
  const out = run();
  console.log(JSON.stringify(out, null, 1));
  const ok = out.facts.infoSets === 12 && out.family.every((f) => f.exact) && out.outOfFamily.every((o) => o.positive)
    && out.indifference.length > 0 && out.indifference.every((i) => i.indifferent);
  console.log(ok ? "KUHN EXACT CHECKS PASSED" : "KUHN EXACT CHECKS FAILED");
  process.exitCode = ok ? 0 : 1;
}

module.exports = { kuhn, profile, equilibrium, run, CARDS };
