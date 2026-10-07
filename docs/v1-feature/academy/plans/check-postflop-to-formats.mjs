// Truth sheet for the Postflop, Pressure, People, Theory, Player and Other-tables lesson plans
// (postflop.md, pressure.md, people.md, theory.md, player.md, formats.md).
// Every number those plans put on screen is computed or asserted here, with exact fractions.
// Plain Node, no dependencies:  node docs/v1-feature/academy/plans/check-postflop-to-formats.mjs
//
// What it does:
//   1. Tree: every node of the six tracks has a section in its plan, with the tree's id, prereqs
//      and formats exactly; `scope: "later"` nodes are marked as outline plans.
//   2. Math: break-even fold rate bet/(pot+bet), MDF pot/(pot+bet), caller's price
//      call/(final pot), balanced bluff share bet/(pot+2·bet), SPR, two-branch EV, combo counts,
//      outs (enumerated), Kuhn poker equilibrium (verified by best response), toy ruin model, ICM.
//   3. Cards: range combos and hand strength by an independent best-five scorer with full
//      kicker tie-breaks, cross-checked by category against src/eval/pokerEvaluator.js.
//   4. Numbers: every number written in each plan must be one this script asserted for that plan
//      (after removing card codes, code spans and named terms such as "3-bet"), and film beat
//      tables must be contiguous from 0 to the stated target length.
// Ranges here are ILLUSTRATIONS (rules of thumb written into the plans as such), never solver output.

import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NODES, TRACKS, validateTree } from "../../../../src/learn/v1/academyTree.mjs";

const require = createRequire(import.meta.url);
const { evaluateHand } = require("../../../../src/eval/pokerEvaluator.js");
const HERE = dirname(fileURLToPath(import.meta.url));

let passed = 0;
const failures = [];
const check = (name, ok, detail = "") => { if (ok) passed += 1; else failures.push(`${name}${detail ? `: ${detail}` : ""}`); };

// ── exact rationals ───────────────────────────────────────────────────────────────────────────────
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
class Q {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new Error("zero denominator");
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    this.n = n / g; this.d = d / g;
  }
  add(o) { o = q(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = q(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = q(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) { o = q(o); return new Q(this.n * o.d, this.d * o.n); }
  neg() { return new Q(-this.n, this.d); }
  eq(o) { o = q(o); return this.n === o.n && this.d === o.d; }
  lt(o) { o = q(o); return this.n * o.d < o.n * this.d; }
  gt(o) { o = q(o); return this.n * o.d > o.n * this.d; }
  pow(k) { let r = q(1); for (let i = 0; i < k; i++) r = r.mul(this); return r; }
  num() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}
// q(3) = 3, q("3/7") = 3/7, q(0.25) exact for decimals written in the plans.
function q(x, d) {
  if (x instanceof Q) return x;
  if (d !== undefined) return new Q(x, d);
  if (typeof x === "string" && x.includes("/")) { const [a, b] = x.split("/"); return new Q(a, b); }
  const s = String(x);
  if (s.includes(".")) { const [i, f] = s.split("."); const den = 10n ** BigInt(f.length); return new Q(BigInt(i.replace("-", "") + f) * (s.startsWith("-") ? -1n : 1n), den); }
  return new Q(BigInt(s));
}
const eqQ = (name, a, b) => check(name, q(a).eq(q(b)), `${q(a)} ≠ ${q(b)}`);

// The poker formulas the plans use, all exact.
const beFold = (pot, bet) => q(bet).div(q(pot).add(bet));                 // bluff break-even fold rate
const mdf = (pot, bet) => q(pot).div(q(pot).add(bet));                    // minimum defense frequency
const price = (pot, bet) => q(bet).div(q(pot).add(bet).add(bet));         // caller's price: call ÷ final pot
const bluffShare = (pot, bet) => q(bet).div(q(pot).add(q(bet).mul(2)));   // balanced bluff share of a bet
const spr = (stack, pot) => q(stack).div(pot);
// Two-branch EV of a bet, counted as chips won from this point: fold → win the pot;
// called → share × final pot − bet.
const calledBranch = (pot, bet, chance) => q(chance).mul(q(pot).add(bet).add(bet)).sub(bet);
const betEV = (pot, bet, fold, chance) => q(fold).mul(pot).add(q(1).sub(fold).mul(calledBranch(pot, bet, chance)));
const checkEV = (pot, chance) => q(chance).mul(pot); // check, the rest is checked through

// ── numbers each plan may print ──────────────────────────────────────────────────────────────────
const FILES = ["postflop", "pressure", "people", "theory", "player", "formats"];
const allowed = Object.fromEntries(FILES.map((f) => [f, new Set()]));
const say = (file, ...vals) => { for (const v of vals.flat()) allowed[file].add(Number(v)); };
const round = (x, dp) => Number((x instanceof Q ? x.num() : x).toFixed(dp));
// Register a fraction with its numerator/denominator and its percentage at dp decimals.
const pct = (file, x, dp = 1) => { x = q(x); say(file, round(x.num() * 100, dp)); return round(x.num() * 100, dp); };
const frac = (file, x) => { x = q(x); say(file, Number(x.n < 0n ? -x.n : x.n), Number(x.d)); return x; };
const num = (file, x, dp = 0) => { x = q(x); const v = Math.abs(round(x.num(), dp)); say(file, v); return v; };

// ── cards ─────────────────────────────────────────────────────────────────────────────────────────
const RANKS = "23456789TJQKA";
const SUITS = ["s", "h", "d", "c"];
const UNI = { s: "♠", h: "♥", d: "♦", c: "♣" };
const DECK = [...RANKS].flatMap((r) => SUITS.map((s) => r + s));
const ri = (c) => RANKS.indexOf(c[0]);
const B = (s) => s.split(" ");
const toShared = (cs) => cs.map((c) => ({ rank: c[0], suit: UNI[c[1]] }));
function score5(cs) {
  const rs = cs.map(ri).sort((a, b) => b - a);
  const flush = cs.every((c) => c[1] === cs[0][1]);
  const uniq = [...new Set(rs)];
  let sh = -1;
  if (uniq.length === 5) {
    if (rs[0] - rs[4] === 4) sh = rs[0];
    else if (rs[0] === 12 && rs[1] === 3 && rs[4] === 0) sh = 3;
  }
  const cnt = new Map();
  for (const r of rs) cnt.set(r, (cnt.get(r) || 0) + 1);
  const g = [...cnt.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const shape = g.map((x) => x[1]).join("");
  const ord = g.map((x) => x[0]);
  if (sh >= 0 && flush) return [9, sh];
  if (shape === "41") return [8, ...ord];
  if (shape === "32") return [7, ...ord];
  if (flush) return [6, ...rs];
  if (sh >= 0) return [5, sh];
  if (shape === "311") return [4, ...ord];
  if (shape === "221") return [3, ...ord];
  if (shape === "2111") return [2, ...ord];
  return [1, ...rs];
}
const cmpv = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] ?? -1) - (b[i] ?? -1); if (d) return d; } return 0; };
function best(cards) {
  let top = null;
  const rec = (s, pick) => {
    if (pick.length === 5) { const v = score5(pick); if (!top || cmpv(v, top) > 0) top = v; return; }
    for (let i = s; i <= cards.length - (5 - pick.length); i++) { pick.push(cards[i]); rec(i + 1, pick); pick.pop(); }
  };
  rec(0, []);
  return top;
}
// Category cross-check against the shared evaluator (its royal is 10; ours scores a royal as 9).
let crossChecked = 0;
function bestChecked(cards) {
  const v = best(cards);
  const s = evaluateHand(toShared(cards));
  const sc = s.rank === 10 ? 9 : s.rank;
  if (sc !== v[0]) failures.push(`evaluator category mismatch on ${cards.join(" ")}: ref ${v[0]} vs shared ${s.rank}`);
  else crossChecked += 1;
  return v;
}
const compare = (a, b) => cmpv(bestChecked(a), bestChecked(b));
function expand(cls) {
  const [a, b, t] = cls;
  const out = [];
  if (a === b) { for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) out.push([a + SUITS[i], a + SUITS[j]]); }
  else if (t === "s") for (const s of SUITS) out.push([a + s, b + s]);
  else for (const s of SUITS) for (const u of SUITS) if (s !== u) out.push([a + s, b + u]);
  return out;
}
const live = (classes, dead) => classes.flatMap(expand).filter((h) => !h.some((c) => dead.includes(c)));
const pairsFrom = (lo, hi) => RANKS.slice(ri(lo), ri(hi) + 1).split("").map((r) => r + r);
const suitedRun = (hi, lo, to) => RANKS.slice(ri(lo), ri(to) + 1).split("").map((r) => hi + r + "s");
function windows(rankSet) { const rs = new Set(rankSet); if (rs.has(12)) rs.add(-1); const out = []; for (let lo = -1; lo <= 8; lo++) { let k = 0; for (let r = lo; r < lo + 5; r++) if (rs.has(r)) k++; out.push(k); } return out; }
const straightDraw = (cards) => { const w = windows(cards.map(ri)); return !w.includes(5) && w.some((k) => k >= 4); };
const flushDraw = (hole, board) => SUITS.some((s) => [...hole, ...board].filter((c) => c[1] === s).length === 4 && hole.some((c) => c[1] === s));
// "A straight draw is possible" = some two-card hand holds four to a straight now (lesson 16's strict definition).
const boardAllowsStraightDraw = (board) => windows(board.map(ri)).some((k) => k >= 2);
const boardAllowsFlushDraw = (board) => SUITS.some((s) => board.filter((c) => c[1] === s).length >= 2);
// Hand strength tiers used by the plans (names as on screen):
//   strong = two pair or better that uses a hole card (sets, trips, two pair, straights, flushes...)
//   top    = top pair or an overpair
//   pair   = a weaker pair (a pocket pair below the top card, or a hole card pairing a lower card)
//   draw   = no pair but four to a straight or a flush
//   air    = none of these
function tier(h, b) {
  const br = b.map(ri), top = Math.max(...br), hr = h.map(ri), pp = hr[0] === hr[1];
  const cnt = (x) => br.filter((y) => y === x).length;
  const v = bestChecked([...h, ...b]);
  if (v[0] >= 5) return "strong";
  if (pp && cnt(hr[0]) >= 1) return "strong";
  if (!pp && cnt(hr[0]) >= 1 && cnt(hr[1]) >= 1) return "strong";
  if (hr.some((x) => cnt(x) >= 2)) return "strong";
  if (pp && hr[0] > top) return "top";
  if (hr.some((x) => x === top)) return "top";
  if (pp || hr.some((x) => cnt(x) >= 1)) return "pair";
  return straightDraw([...h, ...b]) || flushDraw(h, b) ? "draw" : "air";
}
function tally(hands, b) { const t = { n: hands.length, strong: 0, top: 0, pair: 0, draw: 0, air: 0 }; for (const h of hands) t[tier(h, b)] += 1; return t; }
const unseen = (...known) => DECK.filter((c) => !known.flat().includes(c));
const C2 = (n) => (n * (n - 1)) / 2;

// The two illustrative ranges every postflop plan shares (rules of thumb, not solver output).
// RAISER: a button raise. CALLER: a big-blind call that has re-raised AA–JJ, AK, AQ and KQ suited.
const RAISER = [...pairsFrom("2", "A"), ...suitedRun("A", "2", "K"), "KQs", "KJs", "KTs", "QJs", "QTs", "JTs", "T9s", "98s", "87s", "76s", "AKo", "AQo", "AJo", "ATo", "KQo", "KJo", "QJo"];
const CALLER = [...pairsFrom("2", "T"), ...suitedRun("A", "2", "J"), "KJs", "KTs", "QJs", "QTs", "JTs", "T9s", "98s", "87s", "76s", "65s", "54s", "KJo", "QJo", "JTo", "ATo"];

// ── tree ─────────────────────────────────────────────────────────────────────────────────────────
const TRACK_FILE = { postflop: "postflop", pressure: "pressure", people: "people", theory: "theory", player: "player", formats: "formats" };
check("tree validates", validateTree().length === 0, validateTree().join("; "));
const myNodes = NODES.filter((n) => TRACK_FILE[n.track]);
check("node count in the six tracks", myNodes.length === 26, `${myNodes.length}`);
for (const t of TRACKS) if (TRACK_FILE[t.id]) say(TRACK_FILE[t.id], t.n);

// ═══ POSTFLOP ════════════════════════════════════════════════════════════════════════════════════
{
  const F = "postflop";
  // Combo arithmetic shown in f-ranges.
  check("1,326 combos", 13 * 6 + 78 * 4 + 78 * 12 === 1326 && C2(52) === 1326);
  say(F, 1326, 13, 6, 78, 4, 12, 52, 51, 2);
  eqQ("pair combos", expand("77").length, 6); eqQ("suited combos", expand("AKs").length, 4); eqQ("offsuit combos", expand("AKo").length, 12);
  check("raiser range 250", live(RAISER, []).length === 250);
  check("caller range 186", live(CALLER, []).length === 186);
  say(F, 250, 186);
  // Range class counts written in the plan: caller = 9 pairs, 10 suited aces, 11 suited others, 4 offsuit.
  check("caller classes", CALLER.length === 9 + 10 + 11 + 4); say(F, 9, 10, 11, 4);
  check("raiser classes", RAISER.length === 13 + 12 + 10 + 7); say(F, 13, 12, 10, 7);

  // f-ranges: you raised A♠Q♠, he called; flop T♦ 7♣ 3♥; transfer flop J♣ 9♦ 2♥.
  const hero = B("As Qs");
  const pre = live(CALLER, hero);
  check("f-ranges preflop live 168", pre.length === 168); say(F, 168);
  const f1 = B("Td 7c 3h"), t1 = tally(live(CALLER, [...hero, ...f1]), f1);
  check("f-ranges flop tally", JSON.stringify(t1) === JSON.stringify({ n: 145, strong: 9, top: 29, pair: 46, draw: 12, air: 49 }), JSON.stringify(t1));
  say(F, 145, 9, 29, 46, 12, 49);
  check("pair or better 84", t1.strong + t1.top + t1.pair === 84); say(F, 84); pct(F, q(84, 145));
  const sevens = live(["77"], [...hero, ...f1]).length;
  check("one guess: 77 has 3 combos", sevens === 3); say(F, 3, 77); pct(F, q(3, 145));
  const f2 = B("Jc 9d 2h"), t2 = tally(live(CALLER, [...hero, ...f2]), f2);
  check("f-ranges transfer tally", JSON.stringify(t2) === JSON.stringify({ n: 146, strong: 6, top: 35, pair: 52, draw: 11, air: 42 }), JSON.stringify(t2));
  say(F, 146, 6, 35, 52, 11, 42); say(F, 93); check("transfer pair+ 93", t2.strong + t2.top + t2.pair === 93); pct(F, q(93, 146));

  // f-board-texture: A♣ K♦ 4♠ vs 9♦ 7♦ 6♣, transfer Q♣ Q♦ 5♠ (ranges by board only).
  const AK4 = B("Ac Kd 4s"), r1 = tally(live(RAISER, AK4), AK4), c1 = tally(live(CALLER, AK4), AK4);
  check("AK4 raiser", r1.n === 204 && r1.strong + r1.top === 77, JSON.stringify(r1));
  check("AK4 caller", c1.n === 163 && c1.strong + c1.top === 41, JSON.stringify(c1));
  say(F, 204, 77, 163, 41); pct(F, q(77, 204)); pct(F, q(41, 163));
  const N976 = B("9d 7d 6c"), r2 = tally(live(RAISER, N976), N976), c2 = tally(live(CALLER, N976), N976);
  check("976 raiser", r2.n === 233 && r2.strong === 11 && r2.draw === 45, JSON.stringify(r2));
  check("976 caller", c2.n === 168 && c2.strong === 11 && c2.draw === 58, JSON.stringify(c2));
  say(F, 233, 11, 45, 168, 58, 56, 69);
  check("976 strong+draw", r2.strong + r2.draw === 56 && c2.strong + c2.draw === 69);
  pct(F, q(11, 233)); pct(F, q(11, 168)); pct(F, q(45, 233)); pct(F, q(58, 168)); pct(F, q(56, 233)); pct(F, q(69, 168));
  const QQ5 = B("Qc Qd 5s"), r3 = tally(live(RAISER, QQ5), QQ5), c3 = tally(live(CALLER, QQ5), QQ5);
  check("QQ5 raiser", r3.n === 215 && r3.strong + r3.top === 42, JSON.stringify(r3));
  check("QQ5 caller", c3.n === 170 && c3.strong + c3.top === 13, JSON.stringify(c3));
  say(F, 215, 42, 170); pct(F, q(42, 215)); pct(F, q(13, 170)); say(F, 13);

  // f-cbet: guided K♦ 7♣ 2♠ (A♣ Q♦), pot 60, c-bet 20; contrast 9♦ 7♦ 6♣; fresh 8♠ 8♦ 3♣ (A♥ T♦), pot 90, c-bet 30.
  const K72 = B("Kd 7c 2s");
  check("K♦7♣2♠: no straight draw possible", boardAllowsStraightDraw(K72) === false);
  check("K♦7♣2♠: no flush draw possible", boardAllowsFlushDraw(K72) === false);
  check("9♦7♦6♣: straight and flush draws possible", boardAllowsStraightDraw(N976) && boardAllowsFlushDraw(N976));
  const r4 = tally(live(RAISER, K72), K72), c4 = tally(live(CALLER, K72), K72);
  check("K72 raiser", r4.n === 224 && r4.strong + r4.top === 54 && r4.draw === 0, JSON.stringify(r4));
  check("K72 caller", c4.n === 171 && c4.strong + c4.top === 21 && c4.draw === 0, JSON.stringify(c4));
  say(F, 224, 54, 171, 21); pct(F, q(54, 224)); pct(F, q(21, 171));
  const P88 = B("8s 8d 3c"), r5 = tally(live(RAISER, P88), P88), c5 = tally(live(CALLER, P88), P88);
  check("883 raiser", r5.n === 235 && r5.strong + r5.top === 46, JSON.stringify(r5));
  check("883 caller", c5.n === 171 && c5.strong + c5.top === 22, JSON.stringify(c5));
  say(F, 235, 46, 22); pct(F, q(46, 235)); pct(F, q(22, 171));
  for (const [pot, bet] of [[60, 20], [90, 30]]) {
    eqQ(`c-bet ${bet} is a third of ${pot}`, q(bet, pot), q(1, 3));
    say(F, pot, bet, pot + bet, pot + 2 * bet);
    eqQ(`c-bet ${bet}/${pot} break-even fold`, beFold(pot, bet), q(1, 4));
    eqQ(`c-bet ${bet}/${pot} caller price`, price(pot, bet), q(1, 5));
  }
  pct(F, q(1, 4), 0); pct(F, q(1, 5), 0); say(F, 1, 3, 5);

  // f-bet-sizing: the size table, fractions of the pot.
  const table = [["1/4", "1/6", "1/5"], ["1/3", "1/5", "1/4"], ["1/2", "1/4", "1/3"], ["2/3", "2/7", "2/5"], ["3/4", "3/10", "3/7"], ["1", "1/3", "1/2"], ["2", "2/5", "2/3"]];
  for (const [b, p, f] of table) {
    eqQ(`size ${b}: price`, price(1, q(b)), q(p)); eqQ(`size ${b}: break-even fold`, beFold(1, q(b)), q(f));
    frac(F, q(b)); frac(F, q(p)); frac(F, q(f)); pct(F, q(p)); pct(F, q(f));
  }
  // Guided: K♠K♦ on J♥ 8♥ 3♣ 2♠, pot 120; 40 (a third) or 90 (three quarters); his flush draw: 9 outs of 46.
  const turn = B("Jh 8h 3c 2s");
  check("hearts left for a flush draw: 9", 13 - 2 - 2 === 9);
  say(F, 120, 40, 90, 200, 300, 46, 18, 2, 30, 20);
  const draw = q(9, 46); pct(F, draw);
  eqQ("40 into 120 price", price(120, 40), q(1, 5)); eqQ("90 into 120 price", price(120, 90), q(3, 10));
  eqQ("draw EV vs 40", draw.mul(200).sub(40), q(-20, 23)); frac(F, q(-20, 23)); frac(F, q(-720, 23)); num(F, draw.mul(200).sub(40), 2);
  eqQ("draw EV vs 90", draw.mul(300).sub(90), q(-720, 23)); num(F, draw.mul(300).sub(90), 1);
  check("turn board has no pair", new Set(turn.map(ri)).size === 4);
  check("rule of 2 gives 18%", 9 * 2 === 18);

  // f-value-betting: A♥ J♦ on J♣ 9♠ 5♦ 3♥ 2♣, pot 200, bet 100. Rule of thumb: he calls with a pair of nines or better.
  const vh = B("Ah Jd"), vb = B("Jc 9s 5d 3h 2c");
  const vr = live(CALLER, [...vh, ...vb]);
  const calls = vr.filter((h) => { const t = tier(h, vb); if (t === "strong" || t === "top") return true; if (t === "pair") { const v = bestChecked([...h, ...vb]); return v[0] === 2 && v[1] >= ri("9"); } return false; });
  let w = 0, l = 0, t = 0; const beatsYou = [];
  for (const h of calls) { const c = compare([...vh, ...vb], [...h, ...vb]); if (c > 0) w++; else if (c < 0) { l++; beatsYou.push(h.join("")); } else t++; }
  check("value: 128 live, 54 call", vr.length === 128 && calls.length === 54, `${vr.length} ${calls.length}`);
  check("value: 38 worse, 1 tie, 15 better", w === 38 && t === 1 && l === 15, `${w} ${t} ${l}`);
  check("value: the 15 better are sets of 2s 3s 5s 9s and the wheel A4s", beatsYou.join(" ") === "2s2h 2s2d 2h2d 3s3d 3s3c 3d3c 5s5h 5s5c 5h5c 9h9d 9h9c 9d9c As4s Ad4d Ac4c", beatsYou.join(" "));
  say(F, 128, 54, 38, 1, 15, 100, 200, 50);
  pct(F, q(38, 54)); eqQ("value net", 38 * 100 - 15 * 100, 2300); say(F, 2300, 3800, 1500); num(F, q(2300, 54), 1);
  check("value: worse callers are more than half", q(38, 54).gt(q(1, 2)));

  // f-pot-control: pot 100, half-pot bets. Three streets: 50 + 100 + 200 = 350, pot 800. Two streets (check the turn): 50 + 100 = 150, pot 400.
  eqQ("three half-pot bets", 100 * 2 * 2 * 2, 800); eqQ("hero in, three bets", 50 + 100 + 200, 350);
  eqQ("two half-pot bets", 100 * 2 * 2, 400); eqQ("hero in, two bets", 50 + 100, 150);
  say(F, 100, 50, 200, 800, 350, 400, 150, 8, 4, 0);
  // 9♠9♥ in position on K♣ 6♦ 3♠ 2♥: a medium hand; the free river shows 2 nines left of 46 unseen.
  const pc = B("Kc 6d 3s 2h");
  check("2 nines unseen", unseen(B("9s 9h"), pc).filter((c) => c[0] === "9").length === 2 && unseen(B("9s 9h"), pc).length === 46);
  pct(F, q(2, 46)); say(F, 2, 46);
  check("9♠9♥ is a pair below the king", tier(B("9s 9h"), pc) === "pair");

  // f-playing-draws: 6♣5♣ on K♣ 9♣ 2♦ facing 50 into 100.
  const dh = B("6c 5c"), db = B("Kc 9c 2d"), un = unseen(dh, db);
  const outs = un.filter((c) => bestChecked([...dh, ...db, c])[0] >= 6).length;
  check("flush outs 9 of 47", outs === 9 && un.length === 47);
  let both = 0; for (let i = 0; i < un.length; i++) for (let j = i + 1; j < un.length; j++) if (bestChecked([...dh, ...db, un[i], un[j]])[0] >= 6) both++;
  check("flush by the river 378 of 1,081", both === 378 && C2(47) === 1081, `${both}`);
  say(F, 9, 47, 378, 1081, 38, 703, 36, 18, 100, 50, 150, 200, 40, 400);
  check("misses both 703", C2(38) === 703);
  pct(F, q(9, 47)); pct(F, q(378, 1081)); pct(F, q(1, 4), 0);
  eqQ("price 50 into 100", price(100, 50), q(1, 4));
  const need = q(50).div(q(9, 47)).sub(200);
  eqQ("implied chips needed", need, q(550, 9)); frac(F, need); num(F, need, 1); say(F, 62);
  check("62 is the first whole number above", need.lt(62) && need.gt(61)); say(F, 61);
  const allin = q(378, 1081).mul(200).sub(50);
  eqQ("transfer price 60 into 120", price(120, 60), q(1, 4)); const need2 = q(60).div(q(9, 47)).sub(240);
  eqQ("transfer chips needed", need2, q(220, 3)); num(F, need2, 1); check("74 first whole number above", need2.gt(73) && need2.lt(74)); say(F, 60, 120, 240, 300, 74);
  eqQ("all-in call EV", allin, q(75600, 1081).sub(50)); num(F, allin, 1); num(F, q(378, 1081).mul(200), 1);
}

// ═══ PRESSURE ════════════════════════════════════════════════════════════════════════════════════
{
  const F = "pressure";
  // x-fold-equity film: pot 100, bet 75; given: he folds 40%; your draw wins 20% when called.
  const P = 100, b = 75;
  const fh = B("8d 7d"), fb = B("Kd Td 3s 2c"), fu = unseen(fh, fb);
  check("film hand: 9 flush outs of 46", fu.length === 46 && fu.filter((c) => bestChecked([...fh, ...fb, c])[0] >= 6).length === 9);
  check("film hand: no straight draw", !straightDraw([...fh, ...fb]));
  pct(F, q(9, 46)); say(F, 46, 360, 640);
  eqQ("film break-even fold", beFold(P, b), q(3, 7)); pct(F, q(3, 7)); frac(F, q(3, 7));
  eqQ("called branch", calledBranch(P, b, "0.2"), -25);
  eqQ("bet EV", betEV(P, b, "0.4", "0.2"), 25); eqQ("check EV", checkEV(P, "0.2"), 20);
  eqQ("pure bluff EV", betEV(P, b, "0.4", 0), -5);
  say(F, 100, 75, 175, 250, 40, 20, 60, 25, 5, 0.4, 0.6, 0.2, 50);
  // 100 bets: 40 folds +100; 60 calls: 12 hit +175, 48 miss −75.
  eqQ("tally hits", 60 * 0.2, 12); say(F, 12, 48, 4000, 2100, 3600, 2500, 2000, 4500, 500, 175);
  eqQ("tally", 40 * 100 + 12 * 175 - 48 * 75, 2500); eqQ("check tally", 20 * 100, 2000); eqQ("pure bluff tally", 4000 - 60 * 75, -500);
  check("40% is below 3/7, yet the semi-bluff beats checking", q(2, 5).lt(q(3, 7)) && q(25).gt(20));
  // Semi-bluff break-even fold vs checking: f·100 + (1 − f)(−25) = 20 → f = 9/25.
  const fStar = q(20 + 25, 125); eqQ("semi-bluff break-even vs check", betEV(P, b, fStar, "0.2"), 20); eqQ("9/25", fStar, q(9, 25)); pct(F, fStar, 0); frac(F, fStar); say(F, 125, 45);
  // Transfer: pot 160, bet 100; given fold 25%, chance 25%.
  eqQ("transfer break-even", beFold(160, 100), q(5, 13)); pct(F, q(5, 13)); frac(F, q(5, 13));
  eqQ("transfer called", calledBranch(160, 100, "0.25"), -10); eqQ("transfer check", checkEV(160, "0.25"), 40);
  eqQ("transfer bet", betEV(160, 100, "0.25", "0.25"), q("32.5")); say(F, 160, 100, 360, 260, 25, 10, 40, 32.5, 0.25, 0.75, 7.5, 90);
  const f2 = q(50, 170); eqQ("transfer semi break-even", betEV(160, 100, f2, "0.25"), 40); eqQ("5/17", f2, q(5, 17)); pct(F, f2); frac(F, f2); say(F, 170);
  // Existing sb1 spots, re-verified (kept as the lesson's checks).
  eqQ("sb1-guided BE", beFold(100, 50), q(1, 3)); pct(F, q(1, 3));
  eqQ("sb1-guided bet EV", betEV(100, 50, "0.3", "0.3"), 37); eqQ("sb1-guided check", checkEV(100, "0.3"), 30);
  eqQ("sb1-practice BE", beFold(120, 80), q(2, 5)); eqQ("sb1-practice bet", betEV(120, 80, "0.3", 0), -20);
  eqQ("sb1-fresh BE", beFold(100, 100), q(1, 2)); eqQ("sb1-fresh bet", betEV(100, 100, "0.2", "0.18"), q("-16.8")); eqQ("sb1-fresh check", checkEV(100, "0.18"), 18);
  say(F, 50, 150, 33.3, 37, 30, 120, 80, 200, 40, 20, 16.8, 18, 15, 9);
  check("sb1-guided 15 outs → 30% by rule of 2", 15 * 2 === 30); check("sb1-fresh 9 outs → 18%", 9 * 2 === 18); say(F, 2);

  // x-bluffing: J♣9♣ on Q♠ T♦ 5♣ 4♥ 2♠; pot 150, bet 100.
  const hero = B("Jc 9c"), R = B("Qs Td 5c 4h 2s"), flop = R.slice(0, 3), turn = R.slice(0, 4);
  let rr = live(CALLER, [...hero, ...R]);
  check("bluff: 135 live", rr.length === 135);
  rr = rr.filter((h) => tier(h, flop) !== "air"); check("bluff: 102 call the flop", rr.length === 102);
  rr = rr.filter((h) => tier(h, turn) !== "air"); check("bluff: 102 still there after the turn", rr.length === 102);
  const callers = rr.filter((h) => ["strong", "top"].includes(tier(h, R)));
  const folders = rr.filter((h) => !callers.includes(h));
  const youBeat = rr.filter((h) => compare([...hero, ...R], [...h, ...R]) > 0);
  check("bluff: 25 call, 77 fold", callers.length === 25 && folders.length === 77);
  check("bluff: every caller beats J-high", callers.every((h) => compare([...hero, ...R], [...h, ...R]) < 0));
  check("bluff: you beat 3 at showdown, all of them folders", youBeat.length === 3 && youBeat.every((h) => folders.includes(h)) && youBeat.map((h) => h.join("")).join(" ") === "9s8s 9h8h 9d8d");
  check("bluff: sample caller Q♥J♥ is in the calling range", callers.some((h) => h.join("") === "QhJh"));
  const tr = tally(rr, R);
  check("bluff: river tiers", JSON.stringify(tr) === JSON.stringify({ n: 102, strong: 16, top: 9, pair: 59, draw: 18, air: 0 }), JSON.stringify(tr));
  say(F, 135, 102, 25, 77, 3, 16, 9, 59, 18, 74, 150, 100, 250, 40, 98, 500, 700); // 500 and 700: the old lesson's scripted result lines, quoted for removal
  check("74 folders beat you", folders.length - youBeat.length === 74);
  eqQ("bluff BE", beFold(150, 100), q(2, 5)); pct(F, q(77, 102)); pct(F, q(25, 102));
  const bluffEV = q(150 * 77 - 100 * 25, 102), chk = q(150 * 3, 102);
  eqQ("bluff EV", bluffEV, q(9050, 102)); num(F, bluffEV, 1); num(F, chk, 1); say(F, 11550, 2500, 9050, 450);
  // Station: calls with any pair → 84 call, 18 fold.
  const st = rr.filter((h) => ["strong", "top", "pair"].includes(tier(h, R)));
  check("station: 84 call, 18 fold", st.length === 84);
  pct(F, q(18, 102)); const stEV = q(150 * 18 - 100 * 84, 102); num(F, stEV, 1); say(F, 84, 2700, 8400, 5700);
  check("station bluff loses", stEV.lt(0) && q(18, 102).lt(q(2, 5)));

  // x-mdf: sizes and the worked range.
  for (const [b2, m] of [["1/3", "3/4"], ["1/2", "2/3"], ["3/4", "4/7"], ["1", "1/2"], ["2", "1/3"]]) { eqQ(`MDF ${b2}`, mdf(1, q(b2)), q(m)); frac(F, q(b2)); frac(F, q(m)); pct(F, q(m)); eqQ(`MDF + BE = 1 at ${b2}`, mdf(1, q(b2)).add(beFold(1, q(b2))), 1); }
  eqQ("worked MDF", mdf(100, 75), q(4, 7)); eqQ("defend 24 of 42", q(42).mul(q(4, 7)), 24); say(F, 42, 24, 18);
  eqQ("bluffer EV at your 60% folds", q("0.6").mul(100).sub(q("0.4").mul(75)), 30); say(F, 60, 30, 6000, 3000);
  eqQ("tally 100 bluffs", 60 * 100 - 40 * 75, 3000); eqQ("bluffer EV at exactly 3/7 folds", q(3, 7).mul(100).sub(q(4, 7).mul(75)), 0);
  eqQ("transfer MDF", mdf(90, 60), q(3, 5)); eqQ("defend 21 of 35", q(35).mul(q(3, 5)), 21); say(F, 90, 60, 35, 21); pct(F, q(3, 5), 0); frac(F, q(3, 5));

  // x-check-raise: 9♠ 6♦ 2♣; pot 60, he bets 20, you raise to 70.
  eqQ("his price vs the raise", q(50).div(60 + 70 + 70), q(1, 4)); say(F, 60, 20, 70, 50, 200, 80, 100);
  eqQ("raise as a bluff BE", beFold(80, 70), q(7, 15)); pct(F, q(7, 15)); frac(F, q(7, 15));
  check("6♣6♥ is a set on 9♠6♦2♣", tier(B("6c 6h"), B("9s 6d 2c")) === "strong");
  const sh = B("8s 7s"), sb = B("9s 6d 2c"), su = unseen(sh, sb);
  const sOuts = su.filter((c) => bestChecked([...sh, ...sb, c])[0] >= 5).length;
  check("8♠7♠: 8 straight outs (fives and tens)", sOuts === 8 && su.length === 47);
  let sBoth = 0; for (let i = 0; i < su.length; i++) for (let j = i + 1; j < su.length; j++) if (bestChecked([...sh, ...sb, su[i], su[j]])[0] >= 5) sBoth++;
  // Two-card count includes runner-runner straights/flushes; the plan quotes the clean 8-out figure.
  eqQ("8 outs over two cards", q(1).sub(q(C2(39), C2(47))), q(340, 1081)); say(F, 8, 47, 340, 1081, 39, 741);
  check("39 choose 2", C2(39) === 741);
  pct(F, q(8, 47)); pct(F, q(340, 1081));
  check("runner-runner adds to the clean figure", sBoth >= 340);

  // x-barrels-blockers: three half-pot bets with 350 behind; spade combos on K♠ 9♠ 4♦ 2♠ 7♥.
  eqQ("geometry", 100 + 2 * 350, 800); eqQ("bets", 50 + 100 + 200, 350); eqQ("SPR 3.5", spr(350, 100), q(7, 2)); say(F, 350, 800, 3.5, 400, 200, 50);
  const rb = B("Ks 9s 4d 2s 7h");
  const spadesLeft = unseen(rb).filter((c) => c[1] === "s");
  check("10 spades unseen", spadesLeft.length === 10); check("45 two-spade combos", C2(10) === 45);
  check("9 nut-flush combos with the A♠", spadesLeft.filter((c) => c !== "As").length === 9);
  check("A♠ in your hand leaves 36", C2(9) === 36);
  say(F, 10, 45, 9, 36, 20, 0); pct(F, q(9, 45), 0);
  pct(F, q(60, 105)); pct(F, q(60, 96)); say(F, 60, 105, 96); eqQ("3/4 pot BE", beFold(4, 3), q(3, 7)); pct(F, q(3, 7));
  pct(F, q(30, 75), 0); pct(F, q(30, 66)); say(F, 30, 75, 66);
  check("blocker cannot rescue the wider-calling line", q(30, 66).gt(q(3, 7)) && q(30, 75).lt(q(3, 7)));
  num(F, (q(60, 96).sub(q(60, 105))).mul(100), 1);
}

// ═══ PEOPLE ══════════════════════════════════════════════════════════════════════════════════════
{
  const F = "people";
  // h-range-narrowing: caller range on J♥ 8♣ 4♦ / 2♠ / K♥.
  const fl = B("Jh 8c 4d"), tu = [...fl, "2s"], rv = [...tu, "Kh"];
  const s0 = live(CALLER, []); const s1 = live(CALLER, fl);
  const s2 = s1.filter((h) => tier(h, fl) !== "air");
  const s3 = s2.filter((h) => !h.includes("2s")).filter((h) => { const x = tier(h, tu); if (x === "strong" || x === "top") return true; if (x === "pair") return bestChecked([...h, ...tu])[1] >= ri("8"); return straightDraw([...h, ...tu]); });
  const s4 = s3.filter((h) => !h.includes("Kh"));
  const t4 = tally(s4, rv);
  check("narrow 186 → 162 → 118 → 85 → 82", [s0, s1, s2, s3, s4].map((x) => x.length).join(" ") === "186 162 118 85 82", [s0, s1, s2, s3, s4].map((x) => x.length).join(" "));
  check("river tiers", t4.strong === 18 && t4.top === 0 && t4.pair === 48 && t4.draw === 16 && t4.air === 0, JSON.stringify(t4));
  say(F, 186, 162, 118, 85, 82, 18, 48, 16, 0, 8);
  pct(F, q(118, 162)); pct(F, q(85, 118));
  // Transfer: same range, flop Q♦ 6♣ 3♠, same flop rule.
  const tf = B("Qd 6c 3s"), tl = live(CALLER, tf), tc = tl.filter((h) => tier(h, tf) !== "air"), tt = tally(tl, tf);
  check("transfer flop", tl.length === 171 && tc.length === 79 && tc.length === tl.length - tt.air, `${tl.length} ${tc.length} ${JSON.stringify(tt)}`);
  say(F, tl.length, tc.length, tt.air, tt.strong, tt.top, tt.pair, tt.draw);
  // h-player-types: illustrative 100-hand counts (played, raised).
  const types = { "calling-station": [45, 6], nit: [12, 10], tag: [22, 18], lag: [34, 27], trapper: [20, 12], drawer: [38, 10], shark: [25, 20], balanced: [24, 19] };
  for (const [k, [p, r]] of Object.entries(types)) { check(`${k}: raised ≤ played`, r <= p); say(F, p, r); }
  say(F, 100, 1000);
  const se = (p, n) => Math.sqrt(p * (1 - p) / n);
  say(F, round(se(0.22, 100) * 100, 1), round((0.22 - 2 * se(0.22, 100)) * 100, 1), round((0.22 + 2 * se(0.22, 100)) * 100, 1), round(se(0.22, 1000) * 100, 1));
  check("SE at 100 hands 4.1 points", round(se(0.22, 100) * 100, 1) === 4.1);
  check("±2 SE band 13.7–30.3", round((0.22 - 2 * se(0.22, 100)) * 100, 1) === 13.7 && round((0.22 + 2 * se(0.22, 100)) * 100, 1) === 30.3);
  check("SE at 1,000 hands 1.3 points", round(se(0.22, 1000) * 100, 1) === 1.3);
  say(F, 2, 22);
  // h-exploits: river, pot 90, bet 60.
  eqQ("BE 60 into 90", beFold(90, 60), q(2, 5)); pct(F, q(2, 5), 0); frac(F, q(2, 5)); frac(F, q(2, 7)); say(F, 90, 60, 150, 0.7, 0.3, 0.22, 0.78, 360, 640);
  eqQ("bluff the nit (folds 70%)", q("0.7").mul(90).sub(q("0.3").mul(60)), 45); say(F, 70, 63, 45);
  eqQ("bluff the station (folds 20%)", q("0.2").mul(90).sub(q("0.8").mul(60)), -30); say(F, 20, 48, 30);
  eqQ("value vs station (60% of calls worse)", q("0.6").mul(60).sub(q("0.4").mul(60)), 12); say(F, 12, 36, 24);
  eqQ("value vs nit (20% of calls worse)", q("0.2").mul(60).sub(q("0.8").mul(60)), -36);
  // LAG: bets 75% when checked to with a range that is 1/2 bluffs (given); you call 60 into 90 holding a bluff-catcher.
  eqQ("calling the LAG", q(1, 2).mul(150).sub(q(1, 2).mul(60)), 45); eqQ("price vs his 60", price(90, 60), q(2, 7)); pct(F, q(2, 7)); pct(F, q(1, 2), 0);
  say(F, 75, 50, 210, 28.6);
}

// ═══ THEORY ══════════════════════════════════════════════════════════════════════════════════════
{
  const F = "theory";
  // Kuhn poker: cards J < Q < K, ante 1 each (pot 2), one bet of 1. P1 acts first.
  // Strategy: b1[c] P1 bets first; c1[c] P1 calls after check-bet; c2[c] P2 calls a bet; b2[c] P2 bets after a check.
  const cards = [0, 1, 2]; // J Q K
  function value(s1, s2) { // P1's expected net per hand
    let v = q(0);
    for (const x of cards) for (const y of cards) {
      if (x === y) continue;
      const win = x > y ? 1 : -1;
      const pr = q(1, 6);
      const b1 = q(s1.b[x]), c1 = q(s1.c[x]), c2 = q(s2.c[y]), b2 = q(s2.b[y]);
      // P1 bets: P2 calls (±2) or folds (+1).
      let e = b1.mul(c2.mul(2 * win).add(q(1).sub(c2).mul(1)));
      // P1 checks: P2 bets → P1 calls (±2) or folds (−1); P2 checks → showdown ±1.
      const afterCheck = b2.mul(c1.mul(2 * win).add(q(1).sub(c1).mul(-1))).add(q(1).sub(b2).mul(win));
      e = e.add(q(1).sub(b1).mul(afterCheck));
      v = v.add(pr.mul(e));
    }
    return v;
  }
  const pures = (n) => { const out = []; for (let m = 0; m < 1 << n; m++) out.push([...Array(n)].map((_, i) => (m >> i) & 1)); return out; };
  const p1Pure = pures(6).map((a) => ({ b: a.slice(0, 3), c: a.slice(3) }));
  const p2Pure = pures(6).map((a) => ({ c: a.slice(0, 3), b: a.slice(3) }));
  const P2 = { c: [0, q(1, 3), 1], b: [q(1, 3), 0, 1] };
  for (const alpha of [q(0), q(1, 6), q(1, 3)]) {
    const P1 = { b: [alpha, 0, alpha.mul(3)], c: [0, alpha.add(q(1, 3)), 1] };
    const v = value(P1, P2);
    eqQ(`Kuhn value at α=${alpha}`, v, q(-1, 18));
    const br1 = p1Pure.map((s) => value(s, P2)).reduce((a, b) => (b.gt(a) ? b : a));
    const br2 = p2Pure.map((s) => value(P1, s)).reduce((a, b) => (b.lt(a) ? b : a));
    eqQ(`Kuhn: P1 cannot beat P2's strategy (α=${alpha})`, br1, q(-1, 18));
    eqQ(`Kuhn: P2 cannot beat P1's strategy (α=${alpha})`, br2, q(-1, 18));
    if (alpha.gt(0)) eqQ(`Kuhn: bluff share of P1's bets (α=${alpha})`, alpha.div(alpha.add(alpha.mul(3))), q(1, 4));
  }
  // The J bluff is indifferent because P2's queen calls 1/3: P1's J, bet vs check, against P2's strategy.
  const jBet = { b: [1, 0, 0], c: [0, q(1, 3), 1] }, jCheck = { b: [0, 0, 0], c: [0, q(1, 3), 1] };
  const jOnly = (s) => { let v = q(0); for (const y of [1, 2]) { const c2 = q(P2.c[y]), b2 = q(P2.b[y]); const win = -1; const e = q(s.b[0]).mul(c2.mul(2 * win).add(q(1).sub(c2))).add(q(1).sub(s.b[0]).mul(b2.mul(-1).add(q(1).sub(b2).mul(win)))); v = v.add(e.mul(q(1, 2))); } return v; };
  eqQ("Kuhn: J bet = J check against Q calling 1/3", jOnly(jBet), jOnly(jCheck)); eqQ("Kuhn: J is worth −1 either way", jOnly(jBet), -1);
  // With Q calling 1/2 instead, the J bluff loses more than checking; at 0 it gains.
  const jWithQ = (cq) => { let v = q(0); for (const y of [1, 2]) { const c2 = y === 1 ? q(cq) : q(1); v = v.add(c2.mul(-2).add(q(1).sub(c2)).mul(q(1, 2))); } return v; };
  // Film beats "never bluff → the Q folds" and "always bluff → the Q calls": the Q's best reply.
  const qReply = (jBets) => { const call = jBets ? q(1, 2).mul(2).add(q(1, 2).mul(-2)) : q(-2); return call.gt(-1) ? "call" : "fold"; };
  check("Kuhn: if the J never bets, the Q folds to a bet", qReply(false) === "fold"); check("Kuhn: if the J always bets, the Q calls", qReply(true) === "call");
  check("Kuhn: Q calling 1/2 makes the J bluff worse than checking", jWithQ(q(1, 2)).lt(-1)); check("Kuhn: Q never calling makes the J bluff better", jWithQ(0).gt(-1));
  eqQ("Kuhn bluff share = bet/(pot + 2·bet)", bluffShare(2, 1), q(1, 4)); eqQ("Kuhn caller MDF", mdf(2, 1), q(2, 3));
  say(F, 3, 1, 2, 4, 18, 6, 0, 64, 360, 640); check("64 pure strategies each", p1Pure.length === 64 && p2Pure.length === 64); frac(F, q(1, 3)); frac(F, q(1, 4)); frac(F, q(1, 18)); frac(F, q(1, 6)); frac(F, q(2, 3)); frac(F, q(1, 2)); pct(F, q(1, 4), 0); pct(F, q(1, 18)); say(F, 100, 5.6);
  // g-balance.
  for (const [b2, s] of [["1/3", "1/5"], ["1/2", "1/4"], ["2/3", "2/7"], ["3/4", "3/10"], ["1", "1/3"], ["2", "2/5"]]) { eqQ(`bluff share ${b2}`, bluffShare(1, q(b2)), q(s)); frac(F, q(b2)); frac(F, q(s)); pct(F, q(s)); }
  eqQ("value:bluff at pot size 2:1", q(1).add(1).div(1), 2); eqQ("value:bluff at half pot 3:1", q(1).add(q(1, 2)).div(q(1, 2)), 3);
  eqQ("20 value → 10 bluffs at pot size", q(20).mul(bluffShare(100, 100)).div(q(1).sub(bluffShare(100, 100))), 10);
  eqQ("bluff-catcher indifferent", q(10, 30).mul(200).sub(q(20, 30).mul(100)), 0); num(F, q(10, 30).mul(200), 1);
  say(F, 100, 200, 20, 10, 30, 66.7);
  eqQ("transfer: 25 value → 10 bluffs at 80 into 120", q(25).mul(bluffShare(120, 80)).div(q(1).sub(bluffShare(120, 80))), 10);
  eqQ("transfer ratio 5:2", q(120 + 80, 80), q(5, 2)); eqQ("transfer indifferent", q(10, 35).mul(200).sub(q(25, 35).mul(80)), 0); num(F, q(2000, 35), 1);
  say(F, 120, 80, 25, 35, 200, 5, 2000, 57.1);
  // g-gto-to-exploit: pot 100, bet 100, call EV = s·200 − (1 − s)·100.
  const callEV = (s) => q(s).mul(200).sub(q(1).sub(s).mul(100));
  eqQ("balanced → 0", callEV(q(1, 3)), 0); eqQ("10% bluffs → −70", callEV("0.1"), -70); eqQ("50% bluffs → +50", callEV("0.5"), 50);
  say(F, 70, 50, 0.1, 0.5, 90, 33.3);
  eqQ("0 bluffs in 5 showdowns", q(2, 3).pow(5), q(32, 243)); pct(F, q(32, 243)); say(F, 32, 243, 5);
  eqQ("0 bluffs in 15 showdowns", q(2, 3).pow(15), q(32768, 14348907)); pct(F, q(32768, 14348907), 2); say(F, 15, 32768, 14348907);
}

// ═══ PLAYER ══════════════════════════════════════════════════════════════════════════════════════
{
  const F = "player";
  // y-bankroll: labelled examples only.
  eqQ("2,000 at 100 a buy-in", q(2000, 100), 20); eqQ("2,000 at 50 a buy-in", q(2000, 50), 40); say(F, 2000, 100, 20, 50, 40);
  // Toy model: each session wins or loses one buy-in, wins 55%. Ruin chance from N buy-ins = (45/55)^N.
  const r = q(9, 11);
  eqQ("45/55 = 9/11", q(45, 55), r); say(F, 55, 45, 9, 11, 1);
  for (const [n, dp] of [[5, 1], [10, 1], [20, 1], [40, 3]]) { say(F, n); pct(F, r.pow(n), dp); }
  check("ruin 5 → 36.7%", pct(F, r.pow(5)) === 36.7); check("ruin 40 → 0.033%", pct(F, r.pow(40), 3) === 0.033);
  check("toy model edge per session", q("0.55").sub("0.45").eq(q(1, 10))); say(F, 0.1, 10);
  // y-tilt: the M1 call, +10 a call; three and five losses in a row at 30%.
  eqQ("M1 call EV", q("0.3").mul(200).sub(50), 10); say(F, 30, 200, 50, 10, 25);
  eqQ("three losses in a row", q("0.7").pow(3), q(343, 1000)); pct(F, q(343, 1000)); say(F, 3, 70);
  eqQ("five losses in a row", q("0.7").pow(5), q(16807, 100000)); pct(F, q(16807, 100000)); say(F, 5, 100);
  // y-study: the M1 call still loses 70 times in 100.
  say(F, 2006, 2, 360, 640, 0.55, 0.45, 0.3, 0.7, 343, 1000, 16807, 100000);
}

// ═══ OTHER TABLES ════════════════════════════════════════════════════════════════════════════════
{
  const F = "formats";
  // o-multiway: independent folds (illustration), 2/3-pot bluff needs 40%.
  eqQ("2/3 pot BE", beFold(3, 2), q(2, 5)); pct(F, q(2, 5), 0);
  for (const [n, v] of [[1, "0.6"], [2, "0.36"], [3, "0.216"]]) { eqQ(`all ${n} fold`, q("0.6").pow(n), q(v)); say(F, n); pct(F, q(v)); }
  say(F, 60, 2, 3, 0.6, 0.36, 0.216, 70, 0.7, 4);
  eqQ("transfer: two opponents folding 70% each", q("0.7").pow(2), q("0.49")); say(F, 0.49);
  // Random hands ahead of A♦J♣ on J♥ 7♠ 3♦ right now (illustration: random hands, not ranges).
  const hero = B("Ad Jc"), board = B("Jh 7s 3d"), un = unseen(hero, board);
  const hands = []; for (let i = 0; i < un.length; i++) for (let j = i + 1; j < un.length; j++) hands.push([un[i], un[j]]);
  const hv = bestChecked([...hero, ...board]);
  const ahead = hands.map((h) => cmpv(bestChecked([...h, ...board]), hv) > 0);
  const A1 = ahead.filter(Boolean).length;
  check("1 opponent: 43 of 1,081 ahead", hands.length === 1081 && A1 === 43);
  const idx = new Map(un.map((c, i) => [c, i]));
  const m = hands.map((h) => [idx.get(h[0]), idx.get(h[1])].reduce((acc, i) => (i < 30 ? [acc[0] | (1 << i), acc[1]] : [acc[0], acc[1] | (1 << (i - 30))]), [0, 0]));
  let tot2 = 0, none2 = 0, tot3 = 0, none3 = 0;
  const n = hands.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    if ((m[a][0] & m[b][0]) || (m[a][1] & m[b][1])) continue;
    tot2++; const ab = !ahead[a] && !ahead[b]; if (ab) none2++;
    const lo = m[a][0] | m[b][0], hi = m[a][1] | m[b][1];
    for (let c = b + 1; c < n; c++) { if ((lo & m[c][0]) || (hi & m[c][1])) continue; tot3++; if (ab && !ahead[c]) none3++; }
  }
  check("2 opponents exact", tot2 === 535095 && none2 === 493233, `${tot2} ${none2}`);
  check("3 opponents exact", tot3 === 161063595 && none3 === 142476648, `${tot3} ${none3}`);
  pct(F, q(A1, 1081)); pct(F, q(tot2 - none2, tot2)); pct(F, q(tot3 - none3, tot3)); say(F, 43, 1081, 47, tot2, none2, tot3, none3); frac(F, q(2, 5));
  // ICM outline (o-tournaments-icm): stacks 5,000 / 3,000 / 2,000, payouts 50 / 30 / 20 (% of the prize pool), Malmuth–Harville.
  const st = [5000, 3000, 2000], pay = [q(1, 2), q(3, 10), q(1, 5)], T = 10000;
  const eqs = st.map((s, i) => {
    let e = pay[0].mul(q(s, T));
    for (let j = 0; j < 3; j++) { if (j === i) continue; const pj = q(st[j], T); const pij = pj.mul(q(s, T - st[j])); e = e.add(pay[1].mul(pij)); const k = 3 - i - j; e = e.add(pay[2].mul(pj.mul(q(st[k], T - st[j])))); }
    return e;
  });
  eqQ("ICM shares sum to 1", eqs.reduce((a, b) => a.add(b)), 1);
  const shown = eqs.map((e) => pct(F, e));
  check("ICM shares 38.4 / 32.8 / 28.9", shown.join(" ") === "38.4 32.8 28.9", shown.join(" "));
  say(F, 5000, 3000, 2000, 50, 30, 20, 10000);
  check("chips 50 / 30 / 20 but ICM shares are flatter", eqs[0].lt(q(1, 2)) && eqs[2].gt(q(1, 5)));
}

// ── plan documents ───────────────────────────────────────────────────────────────────────────────
function stripForScan(text) {
  return text
    .replace(/`[^`]*`/g, " ")                                  // code spans: ids, files, range classes
    .replace(/[2-9TJQKA][♠♥♦♣]/g, " ")                          // card codes
    .replace(/\b\d-bet\w*/gi, " ")                              // 3-bet, 4-betting: names, not numbers
    .replace(/\b[A-Za-z]+\d+[A-Za-z0-9]*\b/g, " ")              // M1, v1, t3, H3
    .replace(/https?:\S+/g, " ");
}
for (const f of FILES) {
  const path = join(HERE, `${f}.md`);
  if (!existsSync(path)) { failures.push(`${f}.md missing`); continue; }
  const text = readFileSync(path, "utf8");
  // Node sections: id, prereqs and formats exactly as the tree has them.
  for (const n of myNodes.filter((x) => TRACK_FILE[x.track] === f)) {
    const start = text.indexOf(`## \`${n.id}\``);
    if (start < 0) { failures.push(`${f}.md: no section for ${n.id}`); continue; }
    const next = text.indexOf("\n## `", start + 5);
    const sec = text.slice(start, next < 0 ? undefined : next);
    const pre = n.prereqs.length ? n.prereqs.map((p) => `\`${p}\``).join(", ") : "none";
    check(`${n.id}: prereqs line`, sec.includes(`Prerequisites: ${pre}`), pre);
    check(`${n.id}: formats line`, sec.includes(`| Formats | ${n.formats.join(" + ")}`), n.formats.join(" + "));
    check(`${n.id}: objective quoted`, sec.includes(n.objective), n.objective);
    if (n.misconception) check(`${n.id}: misconception quoted`, sec.includes(n.misconception), n.misconception);
    if (n.scope === "later") check(`${n.id}: outline plan`, sec.includes("Outline plan (scope: later)"));
    else check(`${n.id}: full plan has every field`, ["| One idea |", "| Belief it fixes |", "| Hook |", "| Predict |", "| Build |", "| Prove |", "| Transfer |", "| Rule |", "| Checks |", "| Characters |", "| Cinematic plates |", "| Sound |", "Truth sheet"].every((k) => sec.includes(k)));
    // Film beats: contiguous from 0 to the stated target.
    const target = sec.match(/Film beats \(target (\d+) s/);
    if (target) {
      const rows = [...sec.matchAll(/^\| (\d+(?:\.\d+)?)–(\d+(?:\.\d+)?) \|/gm)].map((r) => [Number(r[1]), Number(r[2])]);
      let t = 0, ok = rows.length > 0;
      for (const [a, b] of rows) { if (a !== t || b <= a) ok = false; t = b; say(f, a, b); }
      check(`${n.id}: film beats contiguous to ${target[1]} s`, ok && t === Number(target[1]), JSON.stringify(rows));
      say(f, Number(target[1]));
    }
  }
  // Every number written in the plan was asserted above for this plan.
  const stray = new Set();
  for (const tok of stripForScan(text).match(/\d[\d,]*(?:\.\d+)?/g) || []) {
    const v = Number(tok.replace(/,/g, ""));
    if (!allowed[f].has(v)) stray.add(tok);
  }
  check(`${f}.md: every number asserted`, stray.size === 0, [...stray].join(" "));
}

console.log(`check-postflop-to-formats: ${passed} passed, ${failures.length} failed (${crossChecked} hands cross-checked with pokerEvaluator.js)`);
for (const f of failures) console.log(`  FAIL ${f}`);
process.exit(failures.length ? 1 : 0);
