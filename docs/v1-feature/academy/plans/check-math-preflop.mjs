// Truth checks for the Math Spine (math.md) and Preflop (preflop.md) lesson plans, 2026-10-06.
// Every number those plans put on screen or in a caption is computed here and asserted.
// Plain Node, no installs: `node docs/v1-feature/academy/plans/check-math-preflop.mjs`.
// Exact fractions use BigInt. Outs and made hands are verified with poker-core's evaluator.
// Chances are either counted from outs under the plan's stated rule ("a completed draw wins,
// nothing else does") or are GIVEN against a range; nothing reads a particular hidden card.
// No server answer key is read or copied. Exit code 1 on any failed check.

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { evaluateHand } = require("../../../../src/eval/pokerEvaluator.js");
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NODES } from "../../../../src/learn/v1/academyTree.mjs";
const HERE = dirname(fileURLToPath(import.meta.url));

// ── exact fractions ────────────────────────────────────────────────────────────────────────────
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const Q = (n, d = 1n) => {
  n = BigInt(n); d = BigInt(d);
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
};
const add = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => Q(a.n * b.n, a.d * b.d);
const div = (a, b) => Q(a.n * b.d, a.d * b.n);
const cmp = (a, b) => { const x = a.n * b.d - b.n * a.d; return x > 0n ? 1 : x < 0n ? -1 : 0; };
const qs = (q) => (q.d === 1n ? `${q.n}` : `${q.n}/${q.d}`);
// Round half up to `dp` decimals of (q × scale), as a string.
const fixed = (q, dp = 1, scale = 1n) => {
  const m = 10n ** BigInt(dp);
  let num = q.n * scale * m, den = q.d;
  const neg = num < 0n; if (neg) num = -num;
  const r = (2n * num + den) / (2n * den);
  const s = (r / m).toString() + (dp ? "." + (r % m).toString().padStart(dp, "0") : "");
  return (neg && r !== 0n ? "-" : "") + s;
};
const pct = (q, dp = 1) => fixed(q, dp, 100n) + "%";
const P = (x) => Q(x, 100); // percent as an exact fraction
const C = (n, k) => { if (k < 0 || k > n) return 0n; let r = 1n; for (let i = 0; i < k; i++) r = (r * BigInt(n - i)) / BigInt(i + 1); return r; };

// ── reporting ──────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0; const per = {};
const check = (node, label, actual, expected) => {
  const ok = typeof actual === "object" && actual && "n" in actual
    ? (typeof expected === "string" ? qs(actual) === expected : cmp(actual, expected) === 0)
    : actual === expected;
  per[node] = per[node] || { pass: 0, fail: 0 };
  if (ok) { pass++; per[node].pass++; }
  else { fail++; per[node].fail++; console.log(`FAIL ${node}: ${label}: got ${typeof actual === "object" ? qs(actual) : actual}, expected ${typeof expected === "object" ? qs(expected) : expected}`); }
};

// ── cards ──────────────────────────────────────────────────────────────────────────────────────
const RANKS = "23456789TJQKA";
const SUIT = { s: "♠", h: "♥", d: "♦", c: "♣" };
const card = (c) => ({ rank: c[0], suit: SUIT[c[1]] });
const DECK = [...RANKS].flatMap((r) => "shdc".split("").map((s) => r + s));
const unseen = (known) => DECK.filter((c) => !known.includes(c));
const handRank = (cards) => evaluateHand(cards.map(card)).rank;
const STRAIGHT = 5, FLUSH = 6;
const noDupes = (cards) => new Set(cards).size === cards.length && cards.every((c) => DECK.includes(c));
// One-card outs: unseen cards that lift the hand to `target` category or better.
const outsList = (hero, board, target) => {
  const known = [...hero, ...board];
  return unseen(known).filter((c) => handRank([...known, c]) >= target);
};
// Hole-card pairing cards: improve the hand, but are not outs under the plan's rule.
const pairCards = (hero, board) => unseen([...hero, ...board]).filter((c) => hero.some((h) => h[0] === c[0]));
// Two-card completion by enumeration, counting only the stated draw (suit count for a flush).
const twoCardFlushShare = (hero, board, suit) => {
  const u = unseen([...hero, ...board]); let hit = 0n, all = 0n;
  for (let i = 0; i < u.length; i++) for (let j = i + 1; j < u.length; j++) {
    all++; const seven = [...hero, ...board, u[i], u[j]];
    if (seven.filter((c) => c[1] === suit).length >= 5) hit++;
  }
  return Q(hit, all);
};
const twoCardStraightShare = (hero, board) => {
  const u = unseen([...hero, ...board]); let hit = 0n, all = 0n;
  for (let i = 0; i < u.length; i++) for (let j = i + 1; j < u.length; j++) {
    all++; if (handRank([...hero, ...board, u[i], u[j]]) >= STRAIGHT) hit++;
  }
  return Q(hit, all);
};
const missBoth = (outs, unseenN) => Q(BigInt((unseenN - outs) * (unseenN - outs - 1)), BigInt(unseenN * (unseenN - 1)));
const atLeastOne = (outs, unseenN) => sub(Q(1), missBoth(outs, unseenN));

// ── pot math ───────────────────────────────────────────────────────────────────────────────────
const finalPot = (pot, bet, callAmt) => pot + bet + callAmt;
const price = (callAmt, pot, bet) => Q(callAmt, finalPot(pot, bet, callAmt));
// EV of calling relative to folding (fold = 0): chance × final pot − call.
const evCall = (chance, final, callAmt) => sub(mul(chance, Q(final)), Q(callAmt));
// Implied odds: extra chips X you must win when you hit so chance × (final + X) = call.
const neededFuture = (chance, final, callAmt) => sub(div(Q(callAmt), chance), Q(final));
// Pot-sized bets until all-in at a given SPR: smallest k with (3^k − 1)/2 ≥ SPR.
const betsToAllIn = (spr) => { let k = 0; while (cmp(Q((3n ** BigInt(k) - 1n), 2n), spr) < 0) k++; return k; };
const ladder = (pot, eff) => { const steps = []; let stack = eff; while (stack > 0) { const b = Math.min(pot, stack); steps.push(b); stack -= b; pot += 2 * b; } return { steps, finalPot: pot }; };

// ══ m-chance-as-share ══════════════════════════════════════════════════════════════════════════
{
  const n = "m-chance-as-share";
  const hearts = DECK.filter((c) => c[1] === "h").length;
  check(n, "52-card deck", DECK.length, 52);
  check(n, "hearts", hearts, 13);
  check(n, "non-hearts", 52 - hearts, 39);
  check(n, "heart share 13/52", Q(hearts, 52), "1/4");
  check(n, "heart share %", pct(Q(13, 52), 0), "25%");
  check(n, "misses for each hit (3 to 1)", Q(52 - 13, 13), "3");
  check(n, "expected hearts in 100 draws", mul(Q(13, 52), Q(100)), "25");
  check(n, "30% of 100 happens", mul(P(30), Q(100)), "30");
  check(n, "30% of 10 happens", mul(P(30), Q(10)), "3");
  check(n, "ace share", Q(4, 52), "1/13");
  check(n, "ace share %", pct(Q(4, 52)), "7.7%");
  check(n, "aces expected in 100 draws ≈ 8", fixed(mul(Q(4, 52), Q(100)), 0), "8");
  check(n, "red share", pct(Q(26, 52), 0), "50%");
  check(n, "face card share (J Q K = 12)", Q(12, 52), "3/13");
  check(n, "face card share %", pct(Q(12, 52)), "23.1%");
}

// ══ m-outs ═════════════════════════════════════════════════════════════════════════════════════
{
  const n = "m-outs";
  // Film: J♣T♣ on 9♣ 4♦ 2♣ K♥ (turn)
  const h = ["Jc", "Tc"], b = ["9c", "4d", "2c", "Kh"];
  check(n, "film cards valid", noDupes([...h, ...b]), true);
  check(n, "film unseen on the turn", unseen([...h, ...b]).length, 46);
  check(n, "film starts below a straight", handRank([...h, ...b]) < STRAIGHT, true);
  const o = outsList(h, b, STRAIGHT);
  check(n, "film outs (straight or flush)", o.length, 12);
  check(n, "film flush outs", o.filter((c) => c[1] === "c").length, 9);
  check(n, "film queens", o.filter((c) => c[0] === "Q").length, 4);
  check(n, "film overlap Q♣ counted once", o.filter((c) => c === "Qc").length, 1);
  check(n, "film 9 + 4 − 1 = 12", 9 + 4 - 1, 12);
  check(n, "film pairing cards (J, T) improve but are not outs", pairCards(h, b).length, 6);
  check(n, "film pairing cards are not in the outs", pairCards(h, b).some((c) => o.includes(c)), false);
  check(n, "film wrong count with pairs 12 + 6", 12 + 6, 18);
  check(n, "film 12 in 46", pct(Q(12, 46)), "26.1%");
  check(n, "film losing rivers", 46 - o.length, 34);
  // Transfer: Q♦J♦ on T♠ 9♣ 3♥ (flop)
  const h2 = ["Qd", "Jd"], b2 = ["Ts", "9c", "3h"];
  check(n, "transfer valid", noDupes([...h2, ...b2]), true);
  check(n, "transfer unseen on the flop", unseen([...h2, ...b2]).length, 47);
  const o2 = outsList(h2, b2, STRAIGHT);
  check(n, "transfer outs (K or 8)", o2.length, 8);
  check(n, "transfer outs are kings and eights", o2.every((c) => c[0] === "K" || c[0] === "8"), true);
  check(n, "transfer pairing cards", pairCards(h2, b2).length, 6);
  check(n, "transfer 8 in 47", pct(Q(8, 47)), "17.0%");
  // Fresh: K♣J♦ on Q♥ 9♠ 4♣ 2♦ (turn)
  const h3 = ["Kc", "Jd"], b3 = ["Qh", "9s", "4c", "2d"];
  check(n, "fresh valid", noDupes([...h3, ...b3]), true);
  const o3 = outsList(h3, b3, STRAIGHT);
  check(n, "fresh outs (tens)", o3.length, 4);
  check(n, "fresh outs all tens", o3.every((c) => c[0] === "T"), true);
  check(n, "fresh distractor with pairs 4 + 6", 4 + pairCards(h3, b3).length, 10);
  check(n, "fresh 4 in 46", pct(Q(4, 46)), "8.7%");
}

// ══ m-rule-2-4 ═════════════════════════════════════════════════════════════════════════════════
{
  const n = "m-rule-2-4";
  // Film: J♦9♦ on K♦ 5♦ 2♠ (flop), only a diamond counts
  const h = ["Jd", "9d"], b = ["Kd", "5d", "2s"];
  check(n, "film valid", noDupes([...h, ...b]), true);
  const flushOuts = unseen([...h, ...b]).filter((c) => c[1] === "d");
  check(n, "film flush outs", flushOuts.length, 9);
  check(n, "film flush outs make a flush (evaluator)", flushOuts.every((c) => handRank([...h, ...b, c]) >= FLUSH), true);
  check(n, "film ×4 estimate", 9 * 4, 36);
  check(n, "film ×2 estimate", 9 * 2, 18);
  check(n, "film exact turn only 9/47", pct(Q(9, 47)), "19.1%");
  const two = twoCardFlushShare(h, b, "d");
  check(n, "film exact both cards (enumerated) = 1 − 38·37/(47·46)", two, atLeastOne(9, 47));
  check(n, "film exact both cards fraction", two, "378/1081");
  check(n, "film exact both cards %", pct(two), "35.0%");
  check(n, "film turn-river pairs", Number(C(47, 2)), 1081);
  // Transfer: T♥9♥ on 8♣ 7♦ 2♠ (flop), only a straight counts
  const h2 = ["Th", "9h"], b2 = ["8c", "7d", "2s"];
  check(n, "transfer valid", noDupes([...h2, ...b2]), true);
  check(n, "transfer outs (J or 6)", outsList(h2, b2, STRAIGHT).length, 8);
  check(n, "transfer ×4", 8 * 4, 32);
  check(n, "transfer exact both cards (8 outs only)", pct(atLeastOne(8, 47)), "31.5%");
  // Big draw note: 15 outs on the flop
  check(n, "15 outs ×4", 15 * 4, 60);
  check(n, "15 outs exact both cards", pct(atLeastOne(15, 47)), "54.1%");
  // Practice: A♠Q♣ on K♦ T♠ 6♥ 3♣ (turn), gutshot
  const h3 = ["As", "Qc"], b3 = ["Kd", "Ts", "6h", "3c"];
  check(n, "practice valid", noDupes([...h3, ...b3]), true);
  check(n, "practice outs (jacks)", outsList(h3, b3, STRAIGHT).length, 4);
  check(n, "practice ×2", 4 * 2, 8);
  check(n, "practice exact 4/46", pct(Q(4, 46)), "8.7%");
  // Fresh: 7♠6♠ on 5♥ 4♣ K♦ (flop), facing a bet that is not all-in → ×2
  const h4 = ["7s", "6s"], b4 = ["5h", "4c", "Kd"];
  check(n, "fresh valid", noDupes([...h4, ...b4]), true);
  check(n, "fresh outs (8 or 3)", outsList(h4, b4, STRAIGHT).length, 8);
  check(n, "fresh ×2 (one card at this price)", 8 * 2, 16);
  check(n, "fresh ×4 slip", 8 * 4, 32);
  check(n, "fresh exact next card 8/47", pct(Q(8, 47)), "17.0%");
}

// ══ m-equity ═══════════════════════════════════════════════════════════════════════════════════
{
  const n = "m-equity";
  // Film: K♣J♣ on Q♣ 7♦ 3♣ 2♥ (turn), both all-in, pot 230 (80 from you, 80 from them, 70 dead)
  const h = ["Kc", "Jc"], b = ["Qc", "7d", "3c", "2h"];
  check(n, "film valid", noDupes([...h, ...b]), true);
  const o = outsList(h, b, STRAIGHT);
  check(n, "film outs (clubs only, no one-card straight)", o.length, 9);
  check(n, "film outs are all clubs", o.every((c) => c[1] === "c"), true);
  check(n, "film pot parts 80 + 80 + 70", 80 + 80 + 70, 230);
  check(n, "film chance 9/46", pct(Q(9, 46)), "19.6%");
  const share = mul(Q(9, 46), Q(230));
  check(n, "film share 9/46 × 230", share, "45");
  check(n, "film 46 rivers: 9 × 230", 9 * 230, 2070);
  check(n, "film losing rivers", 46 - 9, 37);
  check(n, "film 2070 ÷ 46", Q(2070, 46), "45");
  check(n, "film chips in (80) ≠ share (45)", 80 !== 45, true);
  // Transfer (given): pot 150, 40% given against a range
  check(n, "transfer share 40% × 150", mul(P(40), Q(150)), "60");
  // Toy endpoints
  check(n, "toy 0% share", mul(P(0), Q(230)), "0");
  check(n, "toy 100% share", mul(P(100), Q(230)), "230");
  // Fresh: 6♣5♣ on 7♥ 4♦ K♠ J♦ (turn), pot 115
  const h3 = ["6c", "5c"], b3 = ["7h", "4d", "Ks", "Jd"];
  check(n, "fresh valid", noDupes([...h3, ...b3]), true);
  check(n, "fresh outs (8 or 3)", outsList(h3, b3, STRAIGHT).length, 8);
  check(n, "fresh share 8/46 × 115", mul(Q(8, 46), Q(115)), "20");
  check(n, "fresh ×2 estimate 16% × 115", fixed(mul(P(16), Q(115)), 1), "18.4");
}

// ══ m-pot-odds (the accepted M1 v1 film plus IDEAS-NEXT) ═══════════════════════════════════════
{
  const n = "m-pot-odds";
  check(n, "main pot now 100 + 50", 100 + 50, 150);
  check(n, "main final pot", finalPot(100, 50, 50), 200);
  check(n, "main price 50/200", price(50, 100, 50), "1/4");
  check(n, "main price %", pct(price(50, 100, 50), 0), "25%");
  check(n, "main 30% ≥ 25%", cmp(P(30), price(50, 100, 50)) >= 0, true);
  check(n, "main EV", evCall(P(30), 200, 50), "10");
  check(n, "main EV by branches 0.3×150 − 0.7×50", sub(mul(P(30), Q(150)), mul(P(70), Q(50))), "10");
  check(n, "main 100 calls 30×150", 30 * 150, 4500);
  check(n, "main 100 calls 70×50", 70 * 50, 3500);
  check(n, "main 100 calls net", 30 * 150 - 70 * 50, 1000);
  check(n, "main break-even at the price", evCall(Q(1, 4), 200, 50), "0");
  // Contrast: leave your call out
  check(n, "contrast wrong price 50/150", Q(50, 150), "1/3");
  check(n, "contrast wrong price %", pct(Q(50, 150)), "33.3%");
  check(n, "contrast makes 30% look short", cmp(P(30), Q(50, 150)) < 0, true);
  // Transfer: pot-size all-in
  check(n, "transfer pot now", 100 + 100, 200);
  check(n, "transfer final", finalPot(100, 100, 100), 300);
  check(n, "transfer price", price(100, 100, 100), "1/3");
  check(n, "transfer price %", pct(price(100, 100, 100)), "33.3%");
  check(n, "transfer 30% < 33.3%", cmp(P(30), price(100, 100, 100)) < 0, true);
  check(n, "transfer EV", evCall(P(30), 300, 100), "-10");
  check(n, "transfer break-even", evCall(Q(1, 3), 300, 100), "0");
  // Toy: drag their bet into a pot of 100, chance fixed at 30%
  const toy = (b) => price(b, 100, b);
  check(n, "toy flip point 75 into 100", toy(75), "3/10");
  check(n, "toy flip final pot 250", finalPot(100, 75, 75), 250);
  check(n, "toy 74 still a call", cmp(P(30), toy(74)) >= 0, true);
  check(n, "toy 76 a fold", cmp(P(30), toy(76)) < 0, true);
  check(n, "toy 10", pct(toy(10)), "8.3%");
  check(n, "toy 200", pct(toy(200), 0), "40%");
  check(n, "toy price stays below 50%", cmp(toy(1_000_000), Q(1, 2)) < 0, true);
  // Practice: river, pot 120, bet 40, given 25%
  check(n, "practice final", finalPot(120, 40, 40), 200);
  check(n, "practice price", pct(price(40, 120, 40), 0), "20%");
  check(n, "practice EV", evCall(P(25), 200, 40), "10");
  // Fresh: river, pot 90, bet 60, given 20%
  check(n, "fresh final", finalPot(90, 60, 60), 210);
  check(n, "fresh price", pct(price(60, 90, 60)), "28.6%");
  check(n, "fresh EV", evCall(P(20), 210, 60), "-18");
  check(n, "fresh slip: call left out 60/150", pct(Q(60, 150), 0), "40%");
  check(n, "fresh slip: bet ÷ pot 60/90", pct(Q(60, 90)), "66.7%");
}

// ══ m-ev ═══════════════════════════════════════════════════════════════════════════════════════
{
  const n = "m-ev";
  // Film: river, pot 100, bet 100, given 40%
  check(n, "film final", finalPot(100, 100, 100), 300);
  check(n, "film price", pct(price(100, 100, 100)), "33.3%");
  check(n, "film EV", evCall(P(40), 300, 100), "20");
  check(n, "film win branch 0.4 × +200", mul(P(40), Q(200)), "80");
  check(n, "film lose branch 0.6 × −100", mul(P(60), Q(-100)), "-60");
  check(n, "film branches sum", add(mul(P(40), Q(200)), mul(P(60), Q(-100))), "20");
  check(n, "film 10 calls 4×200 − 6×100", 4 * 200 - 6 * 100, 200);
  check(n, "film 100 calls 40×200", 40 * 200, 8000);
  check(n, "film 100 calls 60×100", 60 * 100, 6000);
  check(n, "film 100 calls net", 8000 - 6000, 2000);
  check(n, "film one lost call is −100 though the call is +20", cmp(evCall(P(40), 300, 100), Q(0)) > 0, true);
  check(n, "fold baseline", evCall(Q(0), 0, 0), "0");
  // Transfer: turn all-in, counted outs. Pot 150, all-in 40, call 40, 9 outs of 46
  const h = ["Ah", "Th"], b = ["8h", "6c", "3h", "Ks"];
  check(n, "transfer valid", noDupes([...h, ...b]), true);
  check(n, "transfer outs (hearts only)", outsList(h, b, STRAIGHT).length, 9);
  check(n, "transfer final", finalPot(150, 40, 40), 230);
  check(n, "transfer price", pct(price(40, 150, 40)), "17.4%");
  check(n, "transfer chance", pct(Q(9, 46)), "19.6%");
  check(n, "transfer EV", evCall(Q(9, 46), 230, 40), "5");
  check(n, "transfer net when you win", 230 - 40, 190);
  check(n, "transfer 46 rivers 9×190 − 37×40", 9 * 190 - 37 * 40, 230);
  check(n, "transfer 230 ÷ 46", Q(230, 46), "5");
  check(n, "transfer ×2 estimate 18% vs 17.4%", cmp(P(18), price(40, 150, 40)) > 0, true);
  // Practice: Q♥T♥ on J♥ 8♠ 4♥ 2♣ (turn), all-in 50 into 130
  const h2 = ["Qh", "Th"], b2 = ["Jh", "8s", "4h", "2c"];
  check(n, "practice valid", noDupes([...h2, ...b2]), true);
  check(n, "practice outs (hearts + nines − 9♥)", outsList(h2, b2, STRAIGHT).length, 12);
  check(n, "practice final", finalPot(130, 50, 50), 230);
  check(n, "practice price", pct(price(50, 130, 50)), "21.7%");
  check(n, "practice chance", pct(Q(12, 46)), "26.1%");
  check(n, "practice EV", evCall(Q(12, 46), 230, 50), "10");
  // Fresh: river, pot 200, bet 100, given 20%
  check(n, "fresh final", finalPot(200, 100, 100), 400);
  check(n, "fresh price", pct(price(100, 200, 100), 0), "25%");
  check(n, "fresh EV", evCall(P(20), 400, 100), "-20");
}

// ══ m-variance ═════════════════════════════════════════════════════════════════════════════════
{
  const n = "m-variance";
  // Exact binomial tail: P(K ≤ m) or P(K ≥ m) for K ~ Bin(N, 3/10).
  const binLE = (N, m) => { let s = 0n; for (let k = 0; k <= m; k++) s += C(N, k) * 3n ** BigInt(k) * 7n ** BigInt(N - k); return Q(s, 10n ** BigInt(N)); };
  const binGE = (N, m) => sub(Q(1), binLE(N, m - 1));
  // Spot A, the +10 call: win +150, lose −50. Behind after N when 200k − 50N < 0.
  const behindA = (N) => { const m = Math.ceil(N / 4) - 1; return binLE(N, m); };
  check(n, "A EV per call", evCall(P(30), 200, 50), "10");
  check(n, "A behind after 10 (k ≤ 2)", pct(behindA(10), 0), "38%");
  check(n, "A behind after 100 (k ≤ 24)", pct(behindA(100), 0), "11%");
  check(n, "A behind after 1000 (k ≤ 249)", pct(behindA(1000), 1), "0.0%");
  check(n, "A behind after 1000 below 0.05%", cmp(behindA(1000), Q(5, 10000)) < 0, true);
  check(n, "A level after 100 needs exactly 25 wins", 25 * 200 - 50 * 100, 0);
  check(n, "A expected after 100", 100 * 10, 1000);
  check(n, "A expected after 1000", 1000 * 10, 10000);
  // Standard deviation per call: 200 × √0.21 ≈ 91.7; after 100 calls ≈ 917.
  const sd1 = 200 * Math.sqrt(0.21);
  check(n, "A SD per call ≈ 92", Math.round(sd1), 92);
  check(n, "A SD after 100 ≈ 917", Math.round(sd1 * 10), 917);
  check(n, "A one swing below", 1000 - 917, 83);
  check(n, "A one swing above", 1000 + 917, 1917);
  // Spot B, the −10 call (the pot-size spot): win +200, lose −100. Ahead after N when 300k > 100N.
  check(n, "B EV per call", evCall(P(30), 300, 100), "-10");
  const aheadB = (N) => binGE(N, Math.floor(N / 3) + 1);
  check(n, "B ahead after 10 (k ≥ 4)", pct(aheadB(10), 0), "35%");
  check(n, "B ahead after 100 (k ≥ 34)", pct(aheadB(100), 0), "22%");
  check(n, "B ahead after 1000 (k ≥ 334)", pct(aheadB(1000), 1), "1.1%");
  check(n, "B of 1,000 players after 10 calls ≈ 350 ahead", fixed(mul(aheadB(10), Q(1000)), 0), "350");
  check(n, "B no exact tie at 10 (300k = 1000 has no integer k)", 1000 % 300 !== 0, true);
}

// ══ m-implied-odds ═════════════════════════════════════════════════════════════════════════════
{
  const n = "m-implied-odds";
  // Film: 8♠7♠ on K♠ Q♦ 3♠ 2♥ (turn), pot 100, bet 45, 300 behind them
  const h = ["8s", "7s"], b = ["Ks", "Qd", "3s", "2h"];
  check(n, "film valid", noDupes([...h, ...b]), true);
  check(n, "film outs (spades only)", outsList(h, b, STRAIGHT).length, 9);
  check(n, "film final now", finalPot(100, 45, 45), 190);
  check(n, "film price", pct(price(45, 100, 45)), "23.7%");
  check(n, "film chance next card", pct(Q(9, 46)), "19.6%");
  check(n, "film direct price says no", cmp(Q(9, 46), price(45, 100, 45)) < 0, true);
  check(n, "film needed future winnings", neededFuture(Q(9, 46), 190, 45), "40");
  check(n, "film implied price 45/(190+40)", Q(45, 230), Q(9, 46));
  check(n, "film implied price %", pct(Q(45, 230)), "19.6%");
  check(n, "film room behind 300 ≥ 40", 300 >= 40, true);
  check(n, "film EV if you win 40 more is 0", evCall(Q(9, 46), 190 + 40, 45), "0");
  // Contrast: only 25 behind
  check(n, "contrast best case 45/(190+25)", pct(Q(45, 215)), "20.9%");
  check(n, "contrast still short", cmp(Q(9, 46), Q(45, 215)) < 0, true);
  check(n, "contrast best-case EV", fixed(evCall(Q(9, 46), 215, 45), 1), "-2.9");
  // Practice: J♦T♦ on Q♣ 8♥ 3♠ 2♣ (turn), pot 60, bet 20, 90 behind
  const h2 = ["Jd", "Td"], b2 = ["Qc", "8h", "3s", "2c"];
  check(n, "practice valid", noDupes([...h2, ...b2]), true);
  check(n, "practice outs (nines)", outsList(h2, b2, STRAIGHT).length, 4);
  check(n, "practice final", finalPot(60, 20, 20), 100);
  check(n, "practice price", pct(price(20, 60, 20), 0), "20%");
  check(n, "practice chance", pct(Q(4, 46)), "8.7%");
  check(n, "practice needed", neededFuture(Q(4, 46), 100, 20), "130");
  check(n, "practice behind 90 < 130", 90 < 130, true);
  // Fresh: 9♣8♣ on T♦ 7♥ 2♠ K♥ (turn), pot 90, bet 40, 500 behind
  const h3 = ["9c", "8c"], b3 = ["Td", "7h", "2s", "Kh"];
  check(n, "fresh valid", noDupes([...h3, ...b3]), true);
  check(n, "fresh outs (J or 6)", outsList(h3, b3, STRAIGHT).length, 8);
  check(n, "fresh final", finalPot(90, 40, 40), 170);
  check(n, "fresh price", pct(price(40, 90, 40)), "23.5%");
  check(n, "fresh chance", pct(Q(8, 46)), "17.4%");
  check(n, "fresh needed", neededFuture(Q(8, 46), 170, 40), "60");
  check(n, "fresh behind 500 ≥ 60", 500 >= 60, true);
  check(n, "fresh slip: their stack as winnings 40/(170+500)", pct(Q(40, 670), 0), "6%");
}

// ══ m-spr ══════════════════════════════════════════════════════════════════════════════════════
{
  const n = "m-spr";
  // Film: you 600, them 900, flop pot 150
  const eff = Math.min(600, 900);
  check(n, "film effective stack", eff, 600);
  check(n, "film SPR", Q(eff, 150), "4");
  check(n, "film slip: bigger stack 900/150", Q(900, 150), "6");
  check(n, "film slip: sum 1500/150", Q(1500, 150), "10");
  const L1 = ladder(150, 600);
  check(n, "film ladder bets", L1.steps.join(","), "150,450");
  check(n, "film bets to all-in", betsToAllIn(Q(4)), 2);
  check(n, "film after the first bet: pot 450, 450 left", [150 + 2 * 150, 600 - 150].join(","), "450,450");
  check(n, "film ladder final pot", L1.finalPot, 1350);
  // Low vs high SPR: final pot in pots
  check(n, "SPR 1 final pot = 3 pots", Q(100 + 2 * 100, 100), "3");
  check(n, "SPR 13 final pot = 27 pots", Q(100 + 2 * 1300, 100), "27");
  check(n, "SPR 1 bets", betsToAllIn(Q(1)), 1);
  check(n, "SPR 13 bets", betsToAllIn(Q(13)), 3);
  check(n, "SPR 13 ladder", ladder(100, 1300).steps.join(","), "100,300,900");
  // Set from a pocket pair on the flop (deep-stack note)
  check(n, "set or better on the flop", pct(sub(Q(1), Q(C(48, 3), C(50, 3)))), "11.8%");
  // Transfer: you 1,000, them 240, pot 120
  check(n, "transfer effective", Math.min(1000, 240), 240);
  check(n, "transfer SPR", Q(240, 120), "2");
  check(n, "transfer slip 1000/120", fixed(Q(1000, 120), 1), "8.3");
  check(n, "transfer ladder", ladder(120, 240).steps.join(","), "120,120");
  check(n, "transfer bets", betsToAllIn(Q(2)), 2);
  check(n, "transfer final pot", ladder(120, 240).finalPot, 600);
  // Fresh: you 2,000, them 1,800, pot 150
  check(n, "fresh SPR", Q(1800, 150), "12");
  check(n, "fresh ladder", ladder(150, 1800).steps.join(","), "150,450,1200");
  check(n, "fresh bets", betsToAllIn(Q(12)), 3);
}

// ══ Preflop: shared seat facts (six-handed, blinds 5/10, 1,000 stacks) ═══════════════════════════
const PRE = ["UTG", "MP", "CO", "BTN", "SB", "BB"];
const POST = ["SB", "BB", "UTG", "MP", "CO", "BTN"];
const behindPre = (seat) => PRE.length - 1 - PRE.indexOf(seat);
const lastPost = (a, b) => (POST.indexOf(a) > POST.indexOf(b) ? a : b);

// Rule-of-thumb charts (plan data, not solver output). Notation: 66+, A9s+, A5s, A5s-A4s, KQo.
const RI = (r) => RANKS.indexOf(r);
const parseChart = (spec) => {
  const out = new Set();
  for (const tok of spec.split(",").map((t) => t.trim()).filter(Boolean)) {
    const m = tok.match(/^([2-9TJQKA])([2-9TJQKA])([so]?)(\+?)(?:-([2-9TJQKA])([2-9TJQKA])([so]?))?$/);
    if (!m) throw new Error("bad token " + tok);
    const [, a, b, s, plus, , b2] = m;
    if (a === b) {
      const lo = RI(a), hi = plus ? 12 : b2 ? RI(b2) : lo;
      for (let i = Math.min(lo, hi); i <= Math.max(lo, hi); i++) out.add(RANKS[i] + RANKS[i]);
    } else {
      const top = RI(a), k = RI(b);
      const hi = plus ? top - 1 : k, lo = b2 ? RI(b2) : k;
      for (let i = Math.min(lo, hi); i <= Math.max(lo, hi); i++) out.add(a + RANKS[i] + s);
    }
  }
  return out;
};
const combosOf = (cls, dead = []) => {
  const [a, b, s] = [cls[0], cls[1], cls[2] || ""];
  const cs = [];
  for (const x of "shdc") for (const y of "shdc") {
    if (a === b) { if (x >= y) continue; }
    else if (s === "s" ? x !== y : x === y) continue;
    const c1 = a + x, c2 = b + y;
    if (dead.includes(c1) || dead.includes(c2)) continue;
    cs.push([c1, c2]);
  }
  return cs;
};
const chartCombos = (set, dead = []) => [...set].reduce((t, c) => t + combosOf(c, dead).length, 0);
const inChart = (set, hand) => {
  const [c1, c2] = hand; const r1 = c1[0], r2 = c2[0];
  const [hi, lo] = RI(r1) >= RI(r2) ? [r1, r2] : [r2, r1];
  const cls = hi === lo ? hi + lo : hi + lo + (c1[1] === c2[1] ? "s" : "o");
  return set.has(cls);
};
const CHART = {
  UTG: parseChart("66+, A9s+, A5s, KTs+, QTs+, JTs, T9s, 98s, AJo+, KQo"),
  MP: parseChart("55+, A8s+, A5s-A4s, K9s+, Q9s+, J9s+, T9s, 98s, 87s, ATo+, KJo+"),
  CO: parseChart("33+, A2s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 87s, 76s, 65s, A9o+, KTo+, QTo+, JTo"),
  BTN: parseChart("22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, A2o+, K8o+, Q9o+, J9o+, T9o"),
  BB_VS_BTN: parseChart("22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 95s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o+, K7o+, Q8o+, J8o+, T8o+, 98o, 87o"),
};

// ══ p-position-value ═══════════════════════════════════════════════════════════════════════════
{
  const n = "p-position-value";
  check(n, "players behind UTG", behindPre("UTG"), 5);
  check(n, "players behind MP", behindPre("MP"), 4);
  check(n, "players behind CO", behindPre("CO"), 3);
  check(n, "players behind BTN", behindPre("BTN"), 2);
  check(n, "players behind SB", behindPre("SB"), 1);
  check(n, "players behind BB", behindPre("BB"), 0);
  check(n, "BTN vs BB: BTN last after the flop", lastPost("BTN", "BB"), "BTN");
  check(n, "BB acts last preflop", PRE[PRE.length - 1], "BB");
  check(n, "BB acts first of the two after the flop", POST.indexOf("BB") < POST.indexOf("BTN"), true);
  check(n, "streets after the flop", ["flop", "turn", "river"].length, 3);
  const rounds = [["preflop", PRE], ["flop", POST], ["turn", POST], ["river", POST]];
  check(n, "BTN acts last on 3 of 4 rounds vs BB", rounds.filter(([, o]) => o.indexOf("BTN") > o.indexOf("BB")).length, 3);
  check(n, "100 flops × 3 streets seen first", 100 * 3, 300);
  check(n, "transfer CO vs BB: CO last", lastPost("CO", "BB"), "CO");
  check(n, "practice MP vs SB: MP last", lastPost("MP", "SB"), "MP");
  check(n, "fresh UTG vs BTN: BTN last", lastPost("UTG", "BTN"), "BTN");
  check(n, "blinds 5 + 10 in the middle", 5 + 10, 15);
  check(n, "film open to 25, BB owes 15", 25 - 10, 15);
  check(n, "film pot after BB calls", 25 + 25 + 5, 55);
  // Film board for the two replays: no evaluation shown, cards only
  check(n, "film cards valid", noDupes(["Ah", "Jc", "Td", "7s", "2h"]), true);
}

// ══ p-starting-hands ═══════════════════════════════════════════════════════════════════════════
{
  const n = "p-starting-hands";
  check(n, "two-card combinations", Number(C(52, 2)), 1326);
  check(n, "hand classes 13 + 78 + 78", 13 + Number(C(13, 2)) * 2, 169);
  check(n, "pair combos", combosOf("77").length, 6);
  check(n, "suited combos", combosOf("K7s").length, 4);
  check(n, "offsuit combos", combosOf("K7o").length, 12);
  check(n, "suited combinations", 78 * 4, 312);
  check(n, "suited share of all hands", pct(Q(78 * 4, 1326), 1), "23.5%");
  // Flush in your suit by the river with two suited hole cards: ≥ 3 of the 11 left among 5 of 50.
  const flushBy = Q(C(11, 3) * C(39, 2) + C(11, 4) * C(39, 1) + C(11, 5), C(50, 5));
  check(n, "suited flush by the river", pct(flushBy), "6.4%");
  check(n, "≈ 1 time in 16", fixed(div(Q(1), flushBy), 0), "16");
  check(n, "pocket pair: set or better on the flop", pct(sub(Q(1), Q(C(48, 3), C(50, 3)))), "11.8%");
  // K♠7♠: hands holding a king with a better kicker, after removing your two cards.
  const dead = ["Ks", "7s"];
  check(n, "remaining two-card hands", Number(C(50, 2)), 1225);
  const better = ["A", "Q", "J", "T", "9", "8"];
  // classes are written high card first, so AK, not KA
  const domAll2 = better.reduce((t, r) => { const cls = RI(r) > RI("K") ? r + "K" : "K" + r; return t + combosOf(cls + "s", dead).length + combosOf(cls + "o", dead).length; }, 0);
  check(n, "king with a better kicker, all hands", domAll2, 72);
  check(n, "share of all remaining hands", pct(Q(domAll2, 1225)), "5.9%");
  // Inside the UTG rule-of-thumb chart (with card removal)
  const utgCombos = chartCombos(CHART.UTG, dead);
  const domInUtg = ["AKs", "AKo", "KQs", "KQo", "KJs", "KTs"].filter((c) => CHART.UTG.has(c)).reduce((t, c) => t + combosOf(c, dead).length, 0);
  check(n, "UTG chart hands that out-kick K7 (AK, KQ, KJs, KTs)", domInUtg, 30);
  const cnt = (cls) => cls.reduce((t, c) => t + combosOf(c, dead).length, 0);
  check(n, "AK left with K♠ dead", cnt(["AKs", "AKo"]), 12);
  check(n, "KQ left with K♠ dead", cnt(["KQs", "KQo"]), 12);
  check(n, "KJs left", cnt(["KJs"]), 3);
  check(n, "KTs left", cnt(["KTs"]), 3);
  check(n, "KJo is not in the UTG chart", CHART.UTG.has("KJo"), false);
  check(n, "UTG chart combos left with K♠7♠ dead", utgCombos, 142);
  check(n, "share of UTG chart that out-kicks K7", pct(Q(domInUtg, utgCombos)), "21.1%");
  check(n, "K7s is not in the UTG chart", inChart(CHART.UTG, ["Ks", "7s"]), false);
  check(n, "K7s is in the BTN chart", inChart(CHART.BTN, ["Ks", "7s"]), true);
  check(n, "film pot after UTG raises to 25", 5 + 10 + 25, 40);
  check(n, "film CO owes 25", 25, 25);
  check(n, "practice 9♥8♥ BTN in chart", inChart(CHART.BTN, ["9h", "8h"]), true);
  check(n, "fresh Q♣4♣ UTG not in chart", inChart(CHART.UTG, ["Qc", "4c"]), false);
  check(n, "fresh Q♣4♣ BTN not in chart either", inChart(CHART.BTN, ["Qc", "4c"]), false);
}

// ══ p-open-raise ═══════════════════════════════════════════════════════════════════════════════
{
  const n = "p-open-raise";
  const size = (s) => chartCombos(CHART[s]);
  check(n, "UTG chart combos", size("UTG"), 158);
  check(n, "UTG chart %", pct(Q(size("UTG"), 1326), 0), "12%");
  check(n, "MP chart combos", size("MP"), 212);
  check(n, "MP chart %", pct(Q(size("MP"), 1326), 0), "16%");
  check(n, "CO chart combos", size("CO"), 320);
  check(n, "CO chart %", pct(Q(size("CO"), 1326), 0), "24%");
  check(n, "BTN chart combos", size("BTN"), 538);
  check(n, "BTN chart %", pct(Q(size("BTN"), 1326), 0), "41%");
  check(n, "charts widen in seat order", size("UTG") < size("MP") && size("MP") < size("CO") && size("CO") < size("BTN"), true);
  check(n, "every UTG hand is in MP", [...CHART.UTG].every((c) => CHART.MP.has(c)), true);
  check(n, "every MP hand is in CO", [...CHART.MP].every((c) => CHART.CO.has(c)), true);
  check(n, "every CO hand is in BTN", [...CHART.CO].every((c) => CHART.BTN.has(c)), true);
  // Premium behind you (JJ+ or AK = 40 combos), treating the other hands as independent.
  const q = Q(4 * 6 + 16, 1326);
  check(n, "premium combos JJ+ AK", 4 * 6 + 16, 40);
  check(n, "premium share", pct(q), "3.0%");
  const atLeast = (k) => sub(Q(1), Q((q.d - q.n) ** BigInt(k), q.d ** BigInt(k)));
  check(n, "≥1 premium among 5 behind (UTG)", pct(atLeast(5), 0), "14%");
  check(n, "≥1 premium among 2 behind (BTN)", pct(atLeast(2), 0), "6%");
  // Limp vs raise
  check(n, "limp: pot after a limp", 5 + 10 + 10, 25);
  check(n, "limp: BB owes", 10 - 10, 0);
  check(n, "raise: pot after a raise to 25", 5 + 10 + 25, 40);
  check(n, "raise: BB owes", 25 - 10, 15);
  check(n, "raise: BB price", pct(Q(15, 55)), "27.3%");
  // Fixtures
  check(n, "film A♠8♦ UTG out", inChart(CHART.UTG, ["As", "8d"]), false);
  check(n, "film A♠8♦ MP out", inChart(CHART.MP, ["As", "8d"]), false);
  check(n, "film A♠8♦ CO out", inChart(CHART.CO, ["As", "8d"]), false);
  check(n, "film A♠8♦ BTN in", inChart(CHART.BTN, ["As", "8d"]), true);
  check(n, "practice 7♥6♥ MP out", inChart(CHART.MP, ["7h", "6h"]), false);
  check(n, "practice 7♥6♥ CO in", inChart(CHART.CO, ["7h", "6h"]), true);
  check(n, "fresh Q♠T♠ UTG in", inChart(CHART.UTG, ["Qs", "Ts"]), true);
  // Agreement with the public explanations of the existing RFI lesson (not its keys)
  check(n, "existing: A5s opens on the BTN", inChart(CHART.BTN, ["As", "5s"]), true);
  check(n, "existing: JTo folds UTG", inChart(CHART.UTG, ["Jc", "Th"]), false);
  check(n, "existing: KTo opens in the CO", inChart(CHART.CO, ["Kd", "Tc"]), true);
}

// ══ p-blind-defense ════════════════════════════════════════════════════════════════════════════
{
  const n = "p-blind-defense";
  const bbPrice = (to) => Q(to - 10, 2 * to + 5); // owe to−10 into 5 + 10 + to
  check(n, "film pot before BB acts (raise to 25)", 5 + 10 + 25, 40);
  check(n, "film BB owes", 25 - 10, 15);
  check(n, "film final", 40 + 15, 55);
  check(n, "film price 15/55", pct(bbPrice(25)), "27.3%");
  check(n, "film formula matches 15/55", bbPrice(25), Q(15, 55));
  // Contrast: same call without a posted blind (button facing a CO raise to 25, blinds in)
  check(n, "contrast: no blind posted 25/65", pct(Q(25, 40 + 25)), "38.5%");
  // Break-even fold rate for the opener's raise to 25 (risk 25 to win 15) and the share the blinds defend
  check(n, "opener risks 25 to win 15", pct(Q(25, 25 + 15)), "62.5%");
  check(n, "blinds together defend at least", pct(sub(Q(1), Q(25, 40))), "37.5%");
  // Rule-of-thumb defend chart vs the button
  const dc = chartCombos(CHART.BB_VS_BTN);
  check(n, "BB-vs-BTN chart combos", dc, 650);
  check(n, "BB-vs-BTN chart %", pct(Q(dc, 1326), 0), "49%");
  check(n, "defend chart is not everything", dc < 1326, true);
  check(n, "film Q♣9♣ in defend chart", inChart(CHART.BB_VS_BTN, ["Qc", "9c"]), true);
  // Transfer: button raises to 40
  check(n, "transfer BB owes 30", 40 - 10, 30);
  check(n, "transfer final 85", 5 + 10 + 40 + 30, 85);
  check(n, "transfer price 30/85", pct(bbPrice(40)), "35.3%");
  check(n, "bigger raise, worse price", cmp(bbPrice(40), bbPrice(25)) > 0, true);
  // Practice: SB facing BTN raise to 25, BB still to act
  check(n, "practice SB owes 20", 25 - 5, 20);
  check(n, "practice SB price 20/60", pct(Q(20, 40 + 20)), "33.3%");
  check(n, "practice BB still behind", behindPre("SB"), 1);
  // Fresh: BB with K♦5♣ vs BTN raise to 40
  check(n, "fresh K♦5♣ not in defend chart", inChart(CHART.BB_VS_BTN, ["Kd", "5c"]), false);
  check(n, "fresh price", pct(bbPrice(40)), "35.3%");
  check(n, "fresh slip: owe ÷ raise 30/40", pct(Q(30, 40), 0), "75%");
  check(n, "fresh slip: call left out 30/55", pct(Q(30, 55)), "54.5%");
}

// ══ p-three-bet ════════════════════════════════════════════════════════════════════════════════
{
  const n = "p-three-bet";
  check(n, "AA + KK combos", 6 + 6, 12);
  check(n, "AA + KK share", pct(Q(12, 1326)), "0.9%");
  check(n, "value QQ+ AK", 18 + 16, 34);
  check(n, "value share", pct(Q(34, 1326)), "2.6%");
  check(n, "pressure A5s A4s", combosOf("A5s").length + combosOf("A4s").length, 8);
  check(n, "value + pressure", 34 + 8, 42);
  check(n, "value + pressure share", pct(Q(42, 1326)), "3.2%");
  check(n, "pressure is 8 of 42", pct(Q(8, 42), 0), "19%");
  // Blockers: holding A♦5♦
  const dead = ["Ad", "5d"];
  check(n, "AA combos left", combosOf("AA", dead).length, 3);
  check(n, "AK combos left", combosOf("AKs", dead).length + combosOf("AKo", dead).length, 12);
  check(n, "KK combos left", combosOf("KK", dead).length, 6);
  check(n, "AA + AK left (vs 22)", 3 + 12, 15);
  check(n, "AA + AK without a blocker", 6 + 16, 22);
  // Sizes: 3× in position, 4× out of position, vs an open to 25
  check(n, "IP 3-bet to 75", 25 * 3, 75);
  check(n, "OOP 3-bet to 100", 25 * 4, 100);
  check(n, "pot before 3-bet", 5 + 10 + 25, 40);
  check(n, "film opener owes to call the 3-bet", 75 - 25, 50);
  // Fixtures
  check(n, "film A♦5♦ cards valid", noDupes(["Ad", "5d"]), true);
  check(n, "practice Q♥Q♣ BB owes after 3-bet to 100", 100 - 10, 90);
  check(n, "fresh K♥J♥ vs UTG: not value (QQ+ AK) and holds no ace", !parseChart("QQ+, AKs, AKo, A5s-A4s").has("KJs"), true);
  check(n, "fresh K♥J♥ vs UTG: pot and owe", [5 + 10 + 25, 25].join(","), "40,25");
  check(n, "pressure 3-bet bluff from the BTN risks 75 to win 40", pct(Q(75, 75 + 40)), "65.2%");
}

// ── tree sync ─────────────────────────────────────────────────────────────────────────────────────
// Each node section of PLANS copies its tree fields exactly: prerequisites, formats, objective,
// misconception and legacy mapping (src/learn/v1/academyTree.mjs, edits accepted 2026-10-06).
function treeSync(plans) {
  const out = [];
  for (const f of plans) {
    const text = readFileSync(join(HERE, `${f}.md`), "utf8");
    for (const nd of NODES.filter((x) => x.track === f)) {
      const m = new RegExp("^## `?" + nd.id + "`?[: ·]", "m").exec(text);
      if (!m) { out.push([nd.id, "plan section", false, `${f}.md has no section`]); continue; }
      const next = text.indexOf("\n## ", m.index + 4);
      const sec = text.slice(m.index, next < 0 ? undefined : next);
      const pre = nd.prereqs.map((p) => `\`${p}\``).join(", ");
      const head = sec.split("\n").find((l) => l.includes("Prereqs:")) || "";
      out.push([nd.id, "prereqs", head.includes(`Prereqs: ${pre}.`), pre]);
      const fm = nd.formats.join(", ");
      out.push([nd.id, "formats", sec.includes(`| Formats | ${fm} |`) || sec.includes(`Formats: ${fm}.`), fm]);
      out.push([nd.id, "objective quoted", sec.includes(nd.objective), nd.objective]);
      if (nd.misconception) out.push([nd.id, "misconception quoted", sec.includes(`"${nd.misconception}"`), nd.misconception]);
      const lg = nd.legacy;
      if (lg?.lesson) out.push([nd.id, "legacy mapping", [`\`${lg.concept}\``, `\`${lg.lesson}\``, lg.verdict].every((k) => head.includes(k)), `${lg.concept} ${lg.lesson} ${lg.verdict}`]);
      else if (lg) out.push([nd.id, "legacy concept", head.includes(`\`${lg.concept}\``), lg.concept]);
      else out.push([nd.id, "no legacy claimed", !head.includes("Legacy:"), "tree has no legacy"]);
    }
  }
  return out;
}
for (const [id, label, ok, detail] of treeSync(["math", "preflop"])) check(id, `tree ${label} (${detail})`, ok, true);

// ── summary ────────────────────────────────────────────────────────────────────────────────────
for (const [k, v] of Object.entries(per)) console.log(`${v.fail ? "FAIL" : "ok  "} ${k.padEnd(18)} ${v.pass} pass${v.fail ? `, ${v.fail} fail` : ""}`);
console.log(`${pass} of ${pass + fail} checks pass`);
process.exit(fail ? 1 : 0);
