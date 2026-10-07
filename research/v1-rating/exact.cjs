"use strict";
// Exact two-player zero-sum extensive-form machinery for the toy games (Kuhn, Leduc). RESEARCH ONLY.
// Algorithms are generic over a numeric field so Kuhn runs in exact rationals (BigInt) and Leduc in
// floats. Chance is folded into an explicit list of equally likely deals; the game supplies
//   deals(F): [{ prob (in field F), cards }], ROOT, isTerminal(deal, h), utility(deal, h) (payoff to player 0),
//   player(h), actions(h), child(h, a), infoKey(deal, h, p)
// No randomness, no I/O.

// ---------------------------------------------------------------- fields
function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; }
class Q {
  constructor(n, d = 1n) {
    if (d === 0n) throw new Error("zero denominator");
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    this.n = n / g; this.d = d / g;
    Object.freeze(this);
  }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}
const Rational = {
  name: "rational",
  zero: new Q(0n), one: new Q(1n),
  of: (n, d = 1) => new Q(BigInt(n), BigInt(d)),
  add: (a, b) => new Q(a.n * b.d + b.n * a.d, a.d * b.d),
  sub: (a, b) => new Q(a.n * b.d - b.n * a.d, a.d * b.d),
  mul: (a, b) => new Q(a.n * b.n, a.d * b.d),
  div: (a, b) => new Q(a.n * b.d, a.d * b.n),
  neg: (a) => new Q(-a.n, a.d),
  cmp: (a, b) => { const x = a.n * b.d - b.n * a.d; return x > 0n ? 1 : x < 0n ? -1 : 0; },
  eq: (a, b) => a.n === b.n && a.d === b.d,
  toNumber: (a) => Number(a.n) / Number(a.d),
  str: (a) => a.toString(),
};
const Float = {
  name: "float",
  zero: 0, one: 1, of: (n, d = 1) => n / d,
  add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b, neg: (a) => -a,
  cmp: (a, b) => (a > b ? 1 : a < b ? -1 : 0), eq: (a, b) => a === b, toNumber: (a) => a, str: (a) => String(a),
};

// ---------------------------------------------------------------- enumeration
// All decision states: [{ dealIndex, h, player, key }]
function decisionStates(game) {
  const out = [];
  game.deals(Rational).forEach((deal, dealIndex) => {
    const walk = (h) => {
      if (game.isTerminal(deal, h)) return;
      const p = game.player(h);
      out.push({ dealIndex, h, player: p, key: game.infoKey(deal, h, p) });
      for (const a of game.actions(h)) walk(game.child(h, a));
    };
    walk(game.ROOT);
  });
  return out;
}
function infoSets(game) {
  const map = new Map();
  for (const s of decisionStates(game)) {
    if (!map.has(s.key)) map.set(s.key, { key: s.key, player: s.player, actions: game.actions(s.h), depth: depthOf(s.h) });
  }
  return map;
}
const depthOf = (h) => h.replace(/[^a-z]/g, "").length;

// ---------------------------------------------------------------- evaluation
// sigma: Map infoKey -> probabilities aligned with game.actions(h) (field values)
function expectedValue(game, sigma, F) {
  let total = F.zero;
  for (const deal of game.deals(F)) {
    const val = (h) => {
      if (game.isTerminal(deal, h)) return game.utility(deal, h, F);
      const p = game.player(h);
      const probs = sigma.get(game.infoKey(deal, h, p));
      if (!probs) throw new Error(`no strategy at ${game.infoKey(deal, h, p)}`);
      let v = F.zero;
      game.actions(h).forEach((a, i) => { if (F.cmp(probs[i], F.zero) !== 0) v = F.add(v, F.mul(probs[i], val(game.child(h, a)))); });
      return v;
    };
    total = F.add(total, F.mul(deal.prob, val(game.ROOT)));
  }
  return total;
}

// Exact best response of player p to sigma (sigma entries for p are ignored). Processes p's information
// sets deepest-first; each choice maximises the reach-weighted value over every state in the set.
function bestResponse(game, sigma, p, F) {
  const deals = game.deals(F);
  const sign = (u) => (p === 0 ? u : F.neg(u));
  const states = new Map(); // key -> [{dealIndex, h, weight}]
  deals.forEach((deal, di) => {
    const walk = (h, oppReach) => {
      if (game.isTerminal(deal, h)) return;
      const q = game.player(h);
      const key = game.infoKey(deal, h, q);
      const acts = game.actions(h);
      if (q === p) {
        if (!states.has(key)) states.set(key, []);
        states.get(key).push({ dealIndex: di, h, weight: F.mul(deal.prob, oppReach) });
        for (const a of acts) walk(game.child(h, a), oppReach);
      } else {
        const probs = sigma.get(key);
        acts.forEach((a, i) => { if (F.cmp(probs[i], F.zero) !== 0) walk(game.child(h, a), F.mul(oppReach, probs[i])); });
      }
    };
    walk(game.ROOT, F.one);
  });
  const choice = new Map();
  const memo = new Map();
  const val = (di, h) => {
    const mk = `${di}|${h}`;
    if (memo.has(mk)) return memo.get(mk);
    const deal = deals[di];
    let v;
    if (game.isTerminal(deal, h)) v = sign(game.utility(deal, h, F));
    else {
      const q = game.player(h);
      const key = game.infoKey(deal, h, q);
      const acts = game.actions(h);
      if (q === p) v = val(di, game.child(h, acts[choice.get(key)]));
      else {
        const probs = sigma.get(key);
        v = F.zero;
        acts.forEach((a, i) => { if (F.cmp(probs[i], F.zero) !== 0) v = F.add(v, F.mul(probs[i], val(di, game.child(h, a)))); });
      }
    }
    memo.set(mk, v);
    return v;
  };
  const keys = [...states.keys()].sort((a, b) => depthOf(states.get(b)[0].h) - depthOf(states.get(a)[0].h) || (a < b ? -1 : 1));
  for (const key of keys) {
    const list = states.get(key);
    const acts = game.actions(list[0].h);
    let best = -1; let bestV = null;
    acts.forEach((a, i) => {
      let v = F.zero;
      for (const s of list) if (F.cmp(s.weight, F.zero) !== 0) v = F.add(v, F.mul(s.weight, val(s.dealIndex, game.child(s.h, a))));
      if (bestV === null || F.cmp(v, bestV) > 0) { best = i; bestV = v; }
    });
    choice.set(key, best);
  }
  let value = F.zero;
  deals.forEach((deal, di) => { value = F.add(value, F.mul(deal.prob, val(di, game.ROOT))); });
  return { value, choice };
}

// NashConv = BR0 + BR1 (each in its own payoff); exploitability = NashConv / 2.
function exploitability(game, sigma, F) {
  const b0 = bestResponse(game, sigma, 0, F).value;
  const b1 = bestResponse(game, sigma, 1, F).value;
  const nashConv = F.add(b0, b1);
  return { br0: b0, br1: b1, nashConv, exploitability: F.div(nashConv, F.of(2)) };
}

// Information-set action values for player p at infoKey under profile sigma: the hidden opponent
// holding is integrated with the posterior implied by chance and the opponent's policy (never the
// actual concealed card). Returns per-action conditional values and the normaliser.
function infoSetActionValues(game, sigma, p, infoKey, F) {
  const deals = game.deals(F);
  const rows = [];
  deals.forEach((deal, di) => {
    const walk = (h, oppReach) => {
      if (game.isTerminal(deal, h)) return;
      const q = game.player(h);
      const key = game.infoKey(deal, h, q);
      const probs = sigma.get(key);
      if (q === p && key === infoKey) rows.push({ di, h, w: F.mul(deal.prob, oppReach) });
      game.actions(h).forEach((a, i) => {
        if (q === p) walk(game.child(h, a), oppReach);
        else if (F.cmp(probs[i], F.zero) !== 0) walk(game.child(h, a), F.mul(oppReach, probs[i]));
      });
    };
    walk(game.ROOT, F.one);
  });
  const sign = (u) => (p === 0 ? u : F.neg(u));
  const val = (deal, h) => {
    if (game.isTerminal(deal, h)) return sign(game.utility(deal, h, F));
    const probs = sigma.get(game.infoKey(deal, h, game.player(h)));
    let v = F.zero;
    game.actions(h).forEach((a, i) => { if (F.cmp(probs[i], F.zero) !== 0) v = F.add(v, F.mul(probs[i], val(deal, game.child(h, a)))); });
    return v;
  };
  if (!rows.length) return null;
  const norm = rows.reduce((s, r) => F.add(s, r.w), F.zero);
  if (F.cmp(norm, F.zero) === 0) return { actions: game.actions(rows[0].h), values: null, reach: norm };
  const acts = game.actions(rows[0].h);
  const values = acts.map((a) => F.div(rows.reduce((s, r) => F.add(s, F.mul(r.w, val(deals[r.di], game.child(r.h, a)))), F.zero), norm));
  return { actions: acts, values, reach: norm };
}

// ---------------------------------------------------------------- CFR (float) for machinery checks
function cfr(game, iterations) {
  const regret = new Map(); const stratSum = new Map();
  const deals = game.deals(Float);
  const current = (key, n) => {
    const r = regret.get(key) || new Array(n).fill(0);
    const pos = r.map((x) => Math.max(x, 0)); const s = pos.reduce((a, b) => a + b, 0);
    return s > 0 ? pos.map((x) => x / s) : new Array(n).fill(1 / n);
  };
  const walk = (deal, h, reach0, reach1, chance) => {
    if (game.isTerminal(deal, h)) return game.utility(deal, h, Float);
    const p = game.player(h); const key = game.infoKey(deal, h, p); const acts = game.actions(h);
    const s = current(key, acts.length);
    const util = new Array(acts.length); let node = 0;
    acts.forEach((a, i) => {
      util[i] = p === 0 ? walk(deal, game.child(h, a), reach0 * s[i], reach1, chance) : walk(deal, game.child(h, a), reach0, reach1 * s[i], chance);
      node += s[i] * util[i];
    });
    const r = regret.get(key) || new Array(acts.length).fill(0);
    const ss = stratSum.get(key) || new Array(acts.length).fill(0);
    const sgn = p === 0 ? 1 : -1; const opp = (p === 0 ? reach1 : reach0) * chance; const own = p === 0 ? reach0 : reach1;
    acts.forEach((_, i) => { r[i] += opp * sgn * (util[i] - node); ss[i] += own * s[i]; });
    regret.set(key, r); stratSum.set(key, ss);
    return node;
  };
  for (let t = 0; t < iterations; t += 1) for (const deal of deals) walk(deal, game.ROOT, 1, 1, deal.prob);
  const avg = new Map();
  for (const [k, ss] of stratSum) { const s = ss.reduce((a, b) => a + b, 0); avg.set(k, s > 0 ? ss.map((x) => x / s) : ss.map(() => 1 / ss.length)); }
  return avg;
}

function uniformStrategy(game, F) {
  const m = new Map();
  for (const [k, info] of infoSets(game)) m.set(k, info.actions.map(() => F.of(1, info.actions.length)));
  return m;
}

module.exports = { Rational, Float, Q, decisionStates, infoSets, depthOf, expectedValue, bestResponse, exploitability,
  infoSetActionValues, cfr, uniformStrategy };
