"use strict";
// Leduc hold'em (Southey et al. 2005), exact. RESEARCH ONLY (machinery validation; not Hold'em evidence).
// Deck J J Q Q K K (two suits), ante 1 each, one private card each, one public card after round 1.
// Fixed bet 2 in round 1 and 4 in round 2, at most two bets (bet + raise) per round, player 0 acts first
// in both rounds. Showdown: pairing the board wins, else the higher rank; equal ranks split.
// History: round-1 actions, "/" when round 1 closes, round-2 actions. k=check b=bet c=call f=fold r=raise.
//   node research/v1-rating/leduc.cjs [cfrIterations]   runs the exact checks and prints a JSON summary
const X = require("./exact.cjs");

const DECK = ["Js", "Jh", "Qs", "Qh", "Ks", "Kh"];
const RANK = { J: 0, Q: 1, K: 2 };
const BET = [2, 4];

// Replays a history; returns the public state. Pure function of h.
function state(h) {
  const contrib = [1, 1];
  let round = 0; let player = 0; let bets = 0; let roundHist = ""; let closedRound = false;
  for (const ch of h) {
    if (ch === "/") { if (!closedRound || round !== 0) throw new Error(`bad round break in ${h}`); round = 1; player = 0; bets = 0; roundHist = ""; closedRound = false; continue; }
    if (closedRound) throw new Error(`action after closed round in ${h}`);
    const other = 1 - player;
    if (ch === "f") return { terminal: true, folder: player, contrib, round };
    if (ch === "k") { roundHist += ch; if (roundHist === "kk") { if (round === 1) return { terminal: true, showdown: true, contrib, round }; closedRound = true; } }
    else if (ch === "b") { contrib[player] = contrib[other] + BET[round]; bets = 1; roundHist += ch; }
    else if (ch === "r") { contrib[player] = contrib[other] + BET[round]; bets = 2; roundHist += ch; }
    else if (ch === "c") { contrib[player] = contrib[other]; roundHist += ch; if (round === 1) return { terminal: true, showdown: true, contrib, round }; closedRound = true; }
    else throw new Error(`bad action ${ch}`);
    player = other;
  }
  if (closedRound) return { closed: true, contrib, round };
  const facing = roundHist.endsWith("b") || roundHist.endsWith("r");
  return { terminal: false, player, round, contrib, legal: facing ? (bets < 2 ? ["f", "c", "r"] : ["f", "c"]) : ["k", "b"] };
}

const memo = new Map();
const S = (h) => { if (!memo.has(h)) memo.set(h, state(h)); return memo.get(h); };

const leduc = {
  name: "leduc",
  ROOT: "",
  deals(F = X.Float) {
    this._deals = this._deals || new Map();
    if (!this._deals.has(F.name)) {
      const out = [];
      for (let a = 0; a < 6; a += 1) for (let b = 0; b < 6; b += 1) for (let c = 0; c < 6; c += 1) {
        if (a !== b && a !== c && b !== c) out.push(Object.freeze({ prob: F.of(1, 120), cards: [a, b, c] }));
      }
      this._deals.set(F.name, Object.freeze(out));
    }
    return this._deals.get(F.name);
  },
  isTerminal: (deal, h) => S(h).terminal === true,
  player: (h) => S(h).player,
  actions: (h) => S(h).legal,
  child(h, a) { const n = h + a; return S(n).closed ? `${n}/` : n; },
  // Default key: suit-isomorphic (ranks only), the standard Leduc information set.
  infoKey(deal, h, p) {
    const own = DECK[deal.cards[p]][0];
    const board = h.includes("/") ? DECK[deal.cards[2]][0] : "";
    return `${own}${board}:${h}`;
  },
  utility(deal, h, F) {
    const s = S(h);
    if (s.folder !== undefined) return F.of(s.folder === 0 ? -s.contrib[0] : s.contrib[1]);
    const r = (i) => RANK[DECK[deal.cards[i]][0]];
    const b = r(2); const pair0 = r(0) === b; const pair1 = r(1) === b;
    let w = 0;
    if (pair0 !== pair1) w = pair0 ? 1 : -1; else if (r(0) !== r(1)) w = r(0) > r(1) ? 1 : -1;
    return F.of(w * s.contrib[0]); // contributions are equal at showdown
  },
};
// Same game, suit-distinct information sets (no isomorphism) - for the enumeration cross-check only.
const leducSuited = { ...leduc, infoKey(deal, h, p) {
  const own = DECK[deal.cards[p]]; const board = h.includes("/") ? DECK[deal.cards[2]] : "";
  return `${own}${board}:${h}`;
} };

// Independent combinatorial count from one round's betting tree.
function roundTree() {
  const decisions = []; const closes = [];
  const walk = (h) => {
    const s = state(h);
    if (s.terminal && !s.showdown) return; // fold
    if (s.closed || s.showdown) { closes.push(h); return; }
    decisions.push(h);
    for (const a of s.legal) walk(h + a);
  };
  walk("");
  return { decisions: decisions.length, closes: closes.length };
}

function run(cfrIterations = 300) {
  const t = roundTree();
  const ranks = 3; const cards = 6;
  const formula = {
    suitIsomorphic: ranks * t.decisions + t.closes * ranks * ranks * t.decisions,
    suitDistinct: cards * t.decisions + t.closes * cards * (cards - 1) * t.decisions,
  };
  const enumerated = { suitIsomorphic: X.infoSets(leduc).size, suitDistinct: X.infoSets(leducSuited).size };
  // Exact evaluator sanity on known profiles (float field; 120 deals).
  const F = X.Float;
  const uni = X.uniformStrategy(leduc, F);
  const uniEx = X.exploitability(leduc, uni, F);
  const uniEv = X.expectedValue(leduc, uni, F);
  // The same uniform profile in exact rationals (Leduc is small enough).
  const R = X.Rational;
  const uniQ = X.uniformStrategy(leduc, R);
  const uniQex = X.exploitability(leduc, uniQ, R);
  const uniformExact = { value: R.str(X.expectedValue(leduc, uniQ, R)), br0: R.str(uniQex.br0), br1: R.str(uniQex.br1),
    nashConv: R.str(uniQex.nashConv), exploitability: R.str(uniQex.exploitability) };
  // Zero-sum symmetry check: a profile's value plus its seat-swapped value is computed by BR identities.
  const avg = X.cfr(leduc, cfrIterations);
  const cfrEx = X.exploitability(leduc, avg, F);
  const cfrEv = X.expectedValue(leduc, avg, F);
  const short = X.exploitability(leduc, X.cfr(leduc, Math.max(1, Math.floor(cfrIterations / 10))), F);
  return { game: "leduc", deals: leduc.deals().length, roundTree: t, infoSets: { enumerated, formula },
    uniformExact,
    uniform: { value: uniEv, br0: uniEx.br0, br1: uniEx.br1, nashConv: uniEx.nashConv, exploitability: uniEx.exploitability },
    cfr: { iterations: cfrIterations, value: cfrEv, exploitability: cfrEx.exploitability, shortRunExploitability: short.exploitability } };
}

if (require.main === module) {
  const iters = Number(process.argv[2] || 300);
  const out = run(iters);
  console.log(JSON.stringify(out, null, 1));
  const ok = Math.abs(X.Rational.toNumber(new X.Q(BigInt(out.uniformExact.nashConv.split("/")[0]), BigInt(out.uniformExact.nashConv.split("/")[1]))) - out.uniform.nashConv) < 1e-9
    && out.infoSets.enumerated.suitIsomorphic === out.infoSets.formula.suitIsomorphic
    && out.infoSets.enumerated.suitDistinct === out.infoSets.formula.suitDistinct
    && out.uniform.br0 >= out.uniform.value && out.uniform.br1 >= -out.uniform.value && out.uniform.exploitability > 0
    && out.cfr.exploitability >= 0 && out.cfr.exploitability < out.cfr.shortRunExploitability && out.cfr.exploitability < out.uniform.exploitability;
  console.log(ok ? "LEDUC EXACT CHECKS PASSED" : "LEDUC EXACT CHECKS FAILED");
  process.exitCode = ok ? 0 : 1;
}

module.exports = { leduc, leducSuited, state, roundTree, run, DECK };
