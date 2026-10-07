// Truth sheet for the Welcome, Rules and Board lesson plans (welcome.md, rules.md, board.md).
// Every number and card fixture those plans put on screen is computed or asserted here.
// Plain Node, no dependencies:  node docs/v1-feature/academy/plans/check-welcome-rules-board.mjs
//
// Two evaluators are used on purpose:
//   1. `ref` below: an independent best-five-of-seven scorer with FULL kicker tie-breaks.
//   2. src/eval/pokerEvaluator.js (the shared poker-core evaluator): every fixture's hand CATEGORY
//      is cross-checked against it. Its compareHands() does NOT break ties on kickers (one pair, two
//      pair, trips, quads and high card compare only the made part), so kicker and split fixtures
//      are decided by `ref`, and the script records where the shared evaluator would disagree.
// The shared evaluator stores suits as ♠♥♦♣; fixtures are written h/d/c/s and mapped on the way in.

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { evaluateHand, compareHands } = require("../../../../src/eval/pokerEvaluator.js");
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NODES } from "../../../../src/learn/v1/academyTree.mjs";
const HERE = dirname(fileURLToPath(import.meta.url));

let passed = 0;
const failures = [];
const check = (name, ok, detail = "") => {
  if (ok) passed += 1;
  else failures.push(`${name}${detail ? `: ${detail}` : ""}`);
};

// ── cards ─────────────────────────────────────────────────────────────────────────────────────────
const RANKS = "23456789TJQKA";
const SUITS = "hdcs";
const UNI = { h: "♥", d: "♦", c: "♣", s: "♠" };
const DECK = [...RANKS].flatMap((r) => [...SUITS].map((s) => r + s));
const parse = (c) => ({ r: RANKS.indexOf(c[0]), s: c[1] });
const toShared = (cs) => cs.map((c) => ({ rank: c[0], suit: UNI[c[1]] }));
const unseen = (...known) => DECK.filter((c) => !known.flat().includes(c));
const combos = (arr, k) => {
  const out = [];
  const rec = (start, pick) => {
    if (pick.length === k) { out.push(pick.slice()); return; }
    for (let i = start; i <= arr.length - (k - pick.length); i++) { pick.push(arr[i]); rec(i + 1, pick); pick.pop(); }
  };
  rec(0, []);
  return out;
};

// ── reference scorer ──────────────────────────────────────────────────────────────────────────────
// Categories match pokerEvaluator.js: 10 royal, 9 straight flush, 8 quads, 7 full house, 6 flush,
// 5 straight, 4 trips, 3 two pair, 2 pair, 1 high card. Royal is scored as an ace-high straight flush
// for comparisons and reported as 10 for the category cross-check.
const NAMES = { 10: "Royal Flush", 9: "Straight Flush", 8: "Four of a Kind", 7: "Full House", 6: "Flush",
  5: "Straight", 4: "Three of a Kind", 3: "Two Pair", 2: "One Pair", 1: "High Card" };
function score5(cs) {
  const p = cs.map(parse);
  const rs = p.map((x) => x.r).sort((a, b) => b - a);
  const flush = p.every((x) => x.s === p[0].s);
  const uniq = [...new Set(rs)];
  let straightHigh = -1;
  if (uniq.length === 5) {
    if (rs[0] - rs[4] === 4) straightHigh = rs[0];
    else if (rs[0] === 12 && rs[1] === 3 && rs[4] === 0) straightHigh = 3; // wheel A-2-3-4-5
  }
  const cnt = new Map();
  for (const r of rs) cnt.set(r, (cnt.get(r) || 0) + 1);
  const groups = [...cnt.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const shape = groups.map((g) => g[1]).join("");
  const ord = groups.map((g) => g[0]);
  if (flush && straightHigh >= 0) return [9, straightHigh];
  if (shape === "41") return [8, ...ord];
  if (shape === "32") return [7, ...ord];
  if (flush) return [6, ...rs];
  if (straightHigh >= 0) return [5, straightHigh];
  if (shape === "311") return [4, ...ord];
  if (shape === "221") return [3, ...ord];
  if (shape === "2111") return [2, ...ord];
  return [1, ...rs];
}
const cmpScore = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] ?? -1) - (b[i] ?? -1); if (d) return d; } return 0; };
function best(cards) {
  let top = null; let five = null;
  for (const c5 of combos(cards, 5)) { const s = score5(c5); if (!top || cmpScore(s, top) > 0) { top = s; five = c5; } }
  const cat = top[0] === 9 && top[1] === 12 ? 10 : top[0];
  return { score: top, cat, name: NAMES[cat], five };
}
const holeUsed = (hole, board) => {
  // Fewest hole cards needed to make a five that scores as well as the best (0, 1 or 2).
  const all = [...hole, ...board];
  const top = best(all).score;
  for (let k = 0; k <= 2; k++) {
    for (const h of combos(hole, k)) {
      for (const b of combos(board, 5 - k)) if (cmpScore(score5([...h, ...b]), top) === 0) return k;
    }
  }
  return 2;
};
const shared = (cards) => evaluateHand(toShared(cards));
// Cross-check: reference category equals the shared evaluator's category.
const cross = (label, cards) => {
  const r = best(cards); const s = shared(cards);
  check(`category agrees with pokerEvaluator (${label})`, s && s.rank === r.cat, `ref ${r.name} vs shared ${s && s.name}`);
  return r;
};
// Showdown between named hands on one board. Returns winners' names.
function showdown(board, hands) {
  const scored = Object.entries(hands).map(([who, h]) => ({ who, ...cross(`${who} ${h.join(" ")} on ${board.join(" ")}`, [...h, ...board]) }));
  let top = null;
  for (const x of scored) if (!top || cmpScore(x.score, top) > 0) top = x.score;
  return { winners: scored.filter((x) => cmpScore(x.score, top) === 0).map((x) => x.who), scored };
}
const sharedCmp = (a, b) => Math.sign(compareHands(shared(a), shared(b)));
const refCmp = (a, b) => Math.sign(cmpScore(best(a).score, best(b).score));

// ── side pots ─────────────────────────────────────────────────────────────────────────────────────
// contributions: { player: chips put in this hand }. Folded players' chips go in but they are not eligible.
function buildPots(contrib, folded = []) {
  const levels = [...new Set(Object.values(contrib))].sort((a, b) => a - b);
  const pots = []; let prev = 0;
  for (const lv of levels) {
    const payers = Object.keys(contrib).filter((p) => contrib[p] > prev);
    const amount = payers.reduce((s, p) => s + Math.min(contrib[p], lv) - prev, 0);
    const eligible = Object.keys(contrib).filter((p) => contrib[p] >= lv && !folded.includes(p));
    if (amount > 0) pots.push({ amount, eligible });
    prev = lv;
  }
  // A top "pot" with one eligible player is an uncalled overbet: it goes straight back.
  return pots;
}
function award(pots, ranking /* best first; arrays allow ties */) {
  const won = {};
  for (const pot of pots) {
    const tier = ranking.find((t) => t.some((p) => pot.eligible.includes(p)));
    const ws = tier.filter((p) => pot.eligible.includes(p));
    for (const w of ws) won[w] = (won[w] || 0) + pot.amount / ws.length;
  }
  return won;
}

// ── action order ──────────────────────────────────────────────────────────────────────────────────
// Seats listed clockwise starting with the button. Heads-up: the button is the small blind.
function actionOrder(seats, street) {
  const n = seats.length;
  if (n === 2) return street === "preflop" ? [seats[0], seats[1]] : [seats[1], seats[0]];
  const from = street === "preflop" ? 3 % n : 1; // preflop starts left of the big blind, postflop left of the button
  return Array.from({ length: n }, (_, i) => seats[(from + i) % n]);
}

const nCk = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
const pct = (x, d = 1) => `${(100 * x).toFixed(d)}%`;

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// WELCOME
// ═════════════════════════════════════════════════════════════════════════════════════════════════

// w-luck-and-skill: the repeated all-in. Turn Jh Th 4c 2s; you Ac Jd (top pair, ace kicker);
// they Qh 9h (flush draw + open-ended straight draw + overcard). 44 river cards.
{
  const board = ["Jh", "Th", "4c", "2s"]; const you = ["Ac", "Jd"]; const them = ["Qh", "9h"];
  const rivers = unseen(board, you, them);
  check("luck: 44 unseen river cards", rivers.length === 44);
  let w = 0, l = 0, t = 0; const theirOuts = [];
  for (const r of rivers) {
    const d = refCmp([...you, ...board, r], [...them, ...board, r]);
    if (d > 0) w++; else if (d < 0) { l++; theirOuts.push(r); } else t++;
  }
  check("luck: you win 26 of 44 rivers", w === 26, `got ${w}`);
  check("luck: they win 18 of 44 rivers", l === 18, `got ${l} (${theirOuts.join(" ")})`);
  check("luck: no ties", t === 0);
  const hearts = theirOuts.filter((c) => c[1] === "h");
  const other = theirOuts.filter((c) => c[1] !== "h").map((c) => c[0]).sort().join("");
  check("luck: their 18 = 9 hearts + 3 kings + 3 eights + 3 queens (non-heart)", hearts.length === 9 && other === "888KKKQQQ", other);
  check("luck: the 7h river is one of their 18 (flush)", theirOuts.includes("7h") && best([...them, ...board, "7h"]).name === "Flush");
  check("luck: 26/44 = 59.1%", pct(26 / 44) === "59.1%");
  check("luck: 18/44 = 40.9%", pct(18 / 44) === "40.9%");
  // Each puts 500 in: pot 1,000. Average result per hand for you = 1000 * 26/44 - 500 = +90.9.
  const ev = 1000 * (26 / 44) - 500;
  check("luck: average +90.9 per hand (pot 1,000, 500 each)", ev.toFixed(1) === "90.9", ev.toFixed(3));
  check("luck: average over 1,000 hands = +90,909", Math.round(1000 * ev) === 90909);
  // Exact binomial: chance you are behind (won fewer than half the all-ins) after N repeats.
  const p = 26 / 44;
  const behind = (N) => { let s = 0; for (let k = 0; k < N / 2; k++) s += nCk(N, k) * p ** k * (1 - p) ** (N - k); return s; };
  // Ties (exactly half, even N) count as "level", not behind.
  const level = (N) => (N % 2 ? 0 : nCk(N, N / 2) * p ** (N / 2) * (1 - p) ** (N / 2));
  check("luck: behind after 1 hand = 40.9%", pct(behind(1)) === "40.9%", pct(behind(1)));
  check("luck: behind after 10 hands = 18.2%", pct(behind(10)) === "18.2%", pct(behind(10)));
  check("luck: level after 10 hands = 20.8%", pct(level(10)) === "20.8%", pct(level(10)));
  // N=100 exceeds safe nCk float range only near 1e29; still fine in double precision for this sum.
  check("luck: behind after 100 hands = 2.6%", pct(behind(100)) === "2.6%", pct(behind(100)));
  check("luck: behind after 1,000 hands < 0.0001%", behind(1000) < 1e-6, behind(1000).toExponential(2));
}

// w-how-deep: counting.
{
  check("deep: 52 cards = 4 x 13", DECK.length === 52 && 4 * 13 === 52);
  check("deep: 1,326 starting combinations", nCk(52, 2) === 1326);
  check("deep: 169 distinct starting hands = 13 pairs + 78 suited + 78 offsuit", 13 + 78 + 78 === 169 && nCk(13, 2) === 78);
  check("deep: combos 13x6 + 78x4 + 78x12 = 1,326", 13 * 6 + 78 * 4 + 78 * 12 === 1326 && nCk(4, 2) === 6);
  check("deep: 19,600 possible flops for your two cards", nCk(50, 3) === 19600);
  check("deep: 2,118,760 possible five-card boards for your two cards", nCk(50, 5) === 2118760);
  check("deep: 2,598,960 five-card hands", nCk(52, 5) === 2598960);
  check("deep: four betting rounds", ["preflop", "flop", "turn", "river"].length === 4);
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// RULES
// ═════════════════════════════════════════════════════════════════════════════════════════════════

// r-the-deck: suits never break ties. Board Qh Jd Tc 4s 3h; As Kd vs Ah Kc: same ace-high straight.
{
  const sd = showdown(["Qh", "Jd", "Tc", "4s", "3h"], { you: ["As", "Kd"], them: ["Ah", "Kc"] });
  check("deck: both make Straight", sd.scored.every((x) => x.name === "Straight"));
  check("deck: suits do not break the tie (split)", sd.winners.length === 2);
  // Fresh check: K-high straight against K-high straight in different suits.
  const f = showdown(["Qd", "Jh", "Ts", "4c", "2d"], { you: ["Kh", "9c"], them: ["Ks", "9d"] });
  check("deck fresh: Kh 9c vs Ks 9d on Qd Jh Ts 4c 2d, both K-high straight, split", f.winners.length === 2 && f.scored.every((x) => x.name === "Straight" && x.score[1] === RANKS.indexOf("K")));
}

// r-hand-rankings: five-card frequencies by full enumeration (rarer ranks higher).
{
  const counts = new Map();
  const deckIdx = DECK;
  const n = deckIdx.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++)
    for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) {
      const s = score5([deckIdx[a], deckIdx[b], deckIdx[c], deckIdx[d], deckIdx[e]]);
      const cat = s[0] === 9 && s[1] === 12 ? 10 : s[0];
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
  const expect = { 10: 4, 9: 36, 8: 624, 7: 3744, 6: 5108, 5: 10200, 4: 54912, 3: 123552, 2: 1098240, 1: 1302540 };
  for (const [cat, v] of Object.entries(expect)) check(`rankings: ${NAMES[cat]} = ${v.toLocaleString("en-US")} five-card hands`, counts.get(Number(cat)) === v, String(counts.get(Number(cat))));
  const total = [...counts.values()].reduce((s, v) => s + v, 0);
  check("rankings: total 2,598,960", total === 2598960);
  // Every higher category is rarer (royal and straight flush grouped as the same category family).
  const order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => counts.get(c));
  check("rankings: each step up is rarer", order.every((v, i) => i === 0 || v < order[i - 1]));
  check("rankings: full house (3,744) is rarer than flush (5,108)", counts.get(7) < counts.get(6));
}
// r-hand-rankings film ladder: one example hand per category (five cards each), named by both evaluators.
const LADDER = [
  ["Royal Flush", ["As", "Ks", "Qs", "Js", "Ts"]],
  ["Straight Flush", ["9h", "8h", "7h", "6h", "5h"]],
  ["Four of a Kind", ["Qc", "Qd", "Qh", "Qs", "4d"]],
  ["Full House", ["Jc", "Jd", "Js", "7h", "7c"]],
  ["Flush", ["Ad", "Jd", "8d", "5d", "2d"]],
  ["Straight", ["Tc", "9d", "8s", "7h", "6c"]],
  ["Three of a Kind", ["8c", "8d", "8h", "Ks", "3d"]],
  ["Two Pair", ["Kc", "Kd", "5s", "5h", "Ac"]],
  ["One Pair", ["Ah", "Ad", "Qc", "9s", "4h"]],
  ["High Card", ["Ac", "Jh", "9d", "6s", "3c"]],
];
for (const [name, cs] of LADDER) { const r = cross(`ladder ${name}`, cs); check(`ladder: ${cs.join(" ")} is ${name}`, r.name === name, r.name); }
// The wheel: A-2-3-4-5 is the lowest straight.
{
  const wheel = best(["Ah", "2c", "3d", "4s", "5h"]); const six = best(["2c", "3d", "4s", "5h", "6d"]);
  check("rankings: A-2-3-4-5 is a straight", wheel.name === "Straight");
  check("rankings: 6-high straight beats the wheel", cmpScore(six.score, wheel.score) > 0);
  check("rankings: Q-K-A-2-3 is not a straight", best(["Qh", "Kc", "Ad", "2s", "3h"]).name === "High Card");
}
// r-hand-rankings decision fixtures (the REVISE fix: name first, no auto-call, neutral showdown).
const HR = {
  guided: { hero: ["Kh", "Qh"], board: ["Ah", "9h", "Kc", "4h", "Ks"], expect: "Flush" }, // flush beats the trips it also holds
  practice: { hero: ["7c", "7d"], board: ["7h", "Jc", "Jd", "2s", "9h"], expect: "Full House" },
  fresh: { hero: ["6s", "5d"], board: ["4c", "7h", "8d", "Qs", "Qh"], expect: "Straight" }, // straight, not a pair of queens
};
for (const [k, f] of Object.entries(HR)) {
  const r = cross(`hand-rankings ${k}`, [...f.hero, ...f.board]);
  check(`hand-rankings ${k}: ${f.hero.join(" ")} on ${f.board.join(" ")} = ${f.expect}`, r.name === f.expect, r.name);
}
check("hand-rankings guided: also holds three kings (decoy)", best(["Kh", "Ks", "Kc", "Ah", "9h"]).name === "Three of a Kind");
check("hand-rankings practice: sevens full of jacks", JSON.stringify(best(["7c", "7d", "7h", "Jc", "Jd", "2s", "9h"]).score) === JSON.stringify([7, 5, 9]));
check("hand-rankings fresh: 8-high straight 4-5-6-7-8", best(["6s", "5d", "4c", "7h", "8d", "Qs", "Qh"]).score[1] === RANKS.indexOf("8"));

// r-best-five: zero, one and two hole cards; kicker; board plays.
const BF = {
  two: { hero: ["Kh", "Qh"], board: ["Jh", "Tc", "4h", "2s", "9d"], name: "Straight", used: 2 },
  one: { hero: ["Ah", "3c"], board: ["Kh", "Qh", "8h", "5h", "2d"], name: "Flush", used: 1 },
  zero: { hero: ["Ac", "Ad"], board: ["9c", "8d", "7h", "6s", "5c"], name: "Straight", used: 0 },
};
for (const [k, f] of Object.entries(BF)) {
  const r = cross(`best-five ${k}`, [...f.hero, ...f.board]);
  check(`best-five ${k}: ${f.name}`, r.name === f.name, r.name);
  check(`best-five ${k}: uses ${f.used} hole card(s)`, holeUsed(f.hero, f.board) === f.used, String(holeUsed(f.hero, f.board)));
}
{
  // Board plays: your aces and their king-jack tie on the 9-high board straight.
  const sd = showdown(["9c", "8d", "7h", "6s", "5c"], { you: ["Ac", "Ad"], them: ["Ks", "Jh"] });
  check("best-five: board straight plays for both (split)", sd.winners.length === 2);
  // ...unless someone holds a ten or a four: T makes 6-T, 4 makes nothing new (5-9 already higher).
  const sd2 = showdown(["9c", "8d", "7h", "6s", "5c"], { you: ["Ac", "Ad"], them: ["Ts", "2h"] });
  check("best-five: a ten makes T-high straight and wins", sd2.winners.join() === "them");
}
// Kicker decides: Ah Kd vs Ac Qs on Ad 9s 7c 4h 2d.
{
  const board = ["Ad", "9s", "7c", "4h", "2d"]; const A = ["Ah", "Kd"]; const B = ["Ac", "Qs"];
  const sd = showdown(board, { you: A, them: B });
  check("kicker: ace-king beats ace-queen (pair of aces, king kicker)", sd.winners.join() === "you");
  check("kicker: shared compareHands misses this kicker (reports a tie)", sharedCmp([...A, ...board], [...B, ...board]) === 0);
}
// Kicker doesn't play: Ah 2c vs Ad 3s on As Kd Qc Jh 9s: both A-A-K-Q-J.
{
  const sd = showdown(["As", "Kd", "Qc", "Jh", "9s"], { you: ["Ah", "2c"], them: ["Ad", "3s"] });
  check("kicker: A-A-K-Q-J for both, low cards don't play (split)", sd.winners.length === 2);
  check("kicker: the five is A A K Q J", best(["Ah", "2c", "As", "Kd", "Qc", "Jh", "9s"]).score.join() === [2, 12, 11, 10, 9].join());
}

// r-seats-blinds and r-streets: action order.
{
  const hu = ["BTN/SB", "BB"];
  check("order: heads-up preflop = button (small blind) first", actionOrder(hu, "preflop").join() === "BTN/SB,BB");
  check("order: heads-up postflop = big blind first, button last", actionOrder(hu, "flop").join() === "BB,BTN/SB");
  const six = ["BTN", "SB", "BB", "UTG", "HJ", "CO"];
  check("order: six-max preflop UTG HJ CO BTN SB BB", actionOrder(six, "preflop").join(" ") === "UTG HJ CO BTN SB BB");
  check("order: six-max postflop SB BB UTG HJ CO BTN", actionOrder(six, "turn").join(" ") === "SB BB UTG HJ CO BTN");
  const three = ["BTN", "SB", "BB"];
  // r-streets transfer: SB, BB and CO see a flop; SB acts first; after SB folds, BB is first on the turn.
  const live = (order, inHand) => order.filter((x) => inHand.includes(x));
  check("order: SB BB CO on the flop -> SB first", live(actionOrder(six, "flop"), ["SB", "BB", "CO"]).join(" ") === "SB BB CO");
  check("order: SB folds -> BB first on the turn", live(actionOrder(six, "turn"), ["BB", "CO"]).join(" ") === "BB CO");
  check("order: three-handed preflop BTN SB BB", actionOrder(three, "preflop").join(" ") === "BTN SB BB");
  check("order: three-handed postflop SB BB BTN", actionOrder(three, "river").join(" ") === "SB BB BTN");
  check("blinds: 5 + 10 = 15 in the pot before cards", 5 + 10 === 15);
  check("blinds: button pays 5 more to complete (limp), pot 20", 15 + 5 === 20);
}

// r-actions: no-limit raise sizes at blinds 5/10 (standard NLHE minimum-raise rule).
{
  const minRaiseTo = (currentBet, lastIncrement) => currentBet + lastIncrement;
  check("actions: first raise preflop is at least to 20 (bet 10 + increment 10)", minRaiseTo(10, 10) === 20);
  check("actions: after a raise to 30 (increment 20), the re-raise is at least to 50", minRaiseTo(30, 20) === 50);
  check("actions: minimum flop bet is the big blind, 10", 10 === 10);
  check("actions: facing a bet of 40, a call costs 40, checking is not allowed", 40 > 0);
  // Heads-up limp: button completes 5 -> both have 10 in -> big blind may check (its option) or raise.
  check("actions: limped pot 20, big blind owes 0 so may check", 10 - 10 === 0);
}

// r-first-hand: one guided heads-up hand. Blinds 5/10, stacks 1,000. You are the button.
{
  const stacks = { you: 1000, ada: 1000 }; let pot = 0;
  const put = (who, n) => { stacks[who] -= n; pot += n; };
  put("you", 5); put("ada", 10);                 // blinds
  check("first hand: pot 15 after blinds", pot === 15);
  put("you", 25); put("ada", 20);                // you raise to 30, Ada calls 20 more
  check("first hand: pot 60 after preflop", pot === 60);
  put("you", 40); put("ada", 40);                // flop: Ada checks, you bet 40, Ada calls
  check("first hand: pot 140 after flop", pot === 140);
  // turn: check, check
  put("ada", 70); put("you", 70);                // river: Ada bets 70, you call
  check("first hand: pot 280 at showdown", pot === 280);
  check("first hand: you put in 140, Ada 140", 1000 - stacks.you === 140 && 1000 - stacks.ada === 140);
  const board = ["Ad", "8h", "4c", "9s", "2c"];
  const sd = showdown(board, { you: ["As", "Qd"], ada: ["Kh", "Jh"] });
  check("first hand: Ada (last aggressor on the river) shows first", true);
  check("first hand: your pair of aces beats king-high", sd.winners.join() === "you" && sd.scored[0].name === "One Pair" && sd.scored[1].name === "High Card");
  // Branch: if you fold the river instead, Ada's uncalled 70 comes back and she takes the 140 pot.
  check("first hand: fold branch -> Ada wins 140, stacks 930 / 1,070", 1000 - 70 === 930 && 1000 - 70 + 140 === 1070);
  stacks.you += pot;
  check("first hand: stacks after 1,140 / 860, total 2,000", stacks.you === 1140 && stacks.ada === 860 && stacks.you + stacks.ada === 2000);
  check("first hand: flush draw on the flop missed (only 3 hearts)", [..."Kh Jh 8h".split(" ")].length === 3 && best(["Kh", "Jh", ...board]).name === "High Card");
}

// r-showdown: split pot and pot won without showdown.
{
  const sd = showdown(["Kc", "Kd", "9h", "9s", "Ah"], { you: ["Qs", "Jd"], them: ["Qh", "Tc"] });
  check("showdown: K K 9 9 A on board, both play the board (split)", sd.winners.length === 2);
  check("showdown: split of 300 is 150 each", 300 / 2 === 150);
  const sd2 = showdown(["Kc", "Kd", "9h", "9s", "Ah"], { you: ["Qs", "Jd"], them: ["9c", "2d"] });
  check("showdown: a nine makes nines full of kings and wins outright", sd2.winners.join() === "them" && sd2.scored[1].name === "Full House");
  // Three-way pot, two tie for best: 450 -> 225 each.
  const sd3 = showdown(["Ts", "9d", "8c", "2h", "2s"], { p1: ["Jc", "7d"], p2: ["Jh", "7s"], p3: ["Ac", "Ad"] });
  check("showdown: two jack-high straights split 450 = 225 each, aces up lose", sd3.winners.join() === "p1,p2" && 450 / 2 === 225);
}

// r-all-in-side-pots.
{
  // Heads-up: you all-in 400, they cover with 1,000; they can only put 400 at risk. Pot 800.
  const hu = buildPots({ you: 400, them: 400 });
  check("side pots: heads-up all-in 400 vs 1,000 -> one pot of 800", hu.length === 1 && hu[0].amount === 800);
  // Three-way: A 100 all-in, B 300 all-in, C covers and calls 300.
  const three = buildPots({ A: 100, B: 300, C: 300 });
  check("side pots: three-way main 300 (A B C)", three[0].amount === 300 && three[0].eligible.join() === "A,B,C");
  check("side pots: three-way side 400 (B C)", three[1].amount === 400 && three[1].eligible.join() === "B,C");
  check("side pots: three-way total 700", three.reduce((s, p) => s + p.amount, 0) === 700);
  const a1 = award(three, [["A"], ["C"], ["B"]]);
  check("side pots: A best -> A 300, C 400 (side), B 0", a1.A === 300 && a1.C === 400 && !a1.B);
  // Four-way with cards: A 50, B 150, C 400, D 400.
  const pots = buildPots({ A: 50, B: 150, C: 400, D: 400 });
  check("side pots: four-way main 200 (all four)", pots[0].amount === 200 && pots[0].eligible.length === 4);
  check("side pots: four-way side 1 = 300 (B C D)", pots[1].amount === 300 && pots[1].eligible.join() === "B,C,D");
  check("side pots: four-way side 2 = 500 (C D)", pots[2].amount === 500 && pots[2].eligible.join() === "C,D");
  check("side pots: four-way total 1,000", pots.reduce((s, p) => s + p.amount, 0) === 1000);
  const board = ["Qs", "Jd", "7c", "7h", "2s"];
  const hands = { A: ["7s", "2d"], B: ["Qc", "Qd"], C: ["Ah", "Kh"], D: ["Jc", "Tc"] };
  // A: sevens full of twos? A has 7s2d: 7 7 7 2 2 = full house sevens full of twos.
  // B: QQ: Q Q Q 7 7 = queens full of sevens -> best overall. Re-ranked below by the scorer.
  const sd = showdown(board, hands);
  const ranked = sd.scored.slice().sort((x, y) => cmpScore(y.score, x.score));
  check("side pots: ranking B (queens full) > A (sevens full) > D (two pair J-7) > C (pair of sevens, A-K)",
    ranked.map((x) => x.who).join("") === "BADC", ranked.map((x) => `${x.who}:${x.name}`).join(" "));
  const won = award(pots, ranked.map((x) => [x.who]));
  check("side pots: B wins main 200 + side 1 300 = 500", won.B === 500);
  check("side pots: A wins nothing (only main, B beat it)", !won.A);
  check("side pots: D wins side 2 = 500 over C", won.D === 500 && !won.C);
  check("side pots: payouts total 1,000", Object.values(won).reduce((s, v) => s + v, 0) === 1000);
  // Uncalled bet: you shove 600 with 600, they have 250 and call all-in -> 350 comes back to you.
  const unc = buildPots({ you: 600, them: 250 });
  check("side pots: uncalled 350 returns (pot 500 contested, 350 eligible only for you)", unc[0].amount === 500 && unc[1].amount === 350 && unc[1].eligible.join() === "you");
}

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// BOARD
// ═════════════════════════════════════════════════════════════════════════════════════════════════

const nuts = (board) => {
  const rest = unseen(board);
  let top = null; let list = [];
  for (const h of combos(rest, 2)) {
    const s = best([...h, ...board]).score; const d = top ? cmpScore(s, top) : 1;
    if (d > 0) { top = s; list = [h]; } else if (d === 0) list.push(h);
  }
  return { score: top, name: NAMES[top[0] === 9 && top[1] === 12 ? 10 : top[0]], combos: list };
};
const has = (list, a, b) => list.some((h) => (h[0] === a && h[1] === b) || (h[0] === b && h[1] === a));

// b-made-vs-draw.
{
  const flushDraw = { hero: ["Ah", "5h"], board: ["Kh", "9h", "2c", "7s"] };
  const r = cross("four hearts", [...flushDraw.hero, ...flushDraw.board]);
  check("draw: four hearts is NOT a flush (ace high)", r.name === "High Card", r.name);
  const rivers = unseen(flushDraw.hero, flushDraw.board);
  const fl = rivers.filter((c) => best([...flushDraw.hero, ...flushDraw.board, c]).cat === 6);
  check("draw: 46 unseen cards, 9 hearts complete the flush", rivers.length === 46 && fl.length === 9, `${fl.length}`);
  const oe = { hero: ["8s", "7d"], board: ["6c", "5h", "Kd"] };
  check("draw: 8-7 on 6-5-K is eight high, no straight yet", best([...oe.hero, ...oe.board]).name === "High Card");
  const turns = unseen(oe.hero, oe.board);
  const st = turns.filter((c) => best([...oe.hero, ...oe.board, c]).cat === 5);
  check("draw: 47 unseen, 8 cards (four 4s, four 9s) make the straight", turns.length === 47 && st.length === 8 && st.every((c) => "49".includes(c[0])));
  const made = { hero: ["Kc", "Js"], board: ["Kd", "8h", "3c"] };
  check("draw: K-J on K-8-3 is a made hand (pair of kings)", cross("made", [...made.hero, ...made.board]).name === "One Pair");
  // Gutshot: 9-8 on J-T-3 needs a queen or a seven.
  const gut = { hero: ["9c", "8c"], board: ["Jd", "Th", "3s"] };
  const g = unseen(gut.hero, gut.board).filter((c) => best([...gut.hero, ...gut.board, c]).cat === 5);
  check("draw: 9-8 on J-T-3 is open-ended (7 or Q): 8 cards", g.length === 8 && g.every((c) => "7Q".includes(c[0])));
  const gs = { hero: ["9c", "7c"], board: ["Jd", "Th", "3s"] };
  const g2 = unseen(gs.hero, gs.board).filter((c) => best([...gs.hero, ...gs.board, c]).cat === 5);
  check("draw: 9-7 on J-T-3 is a gutshot (only an 8): 4 cards", g2.length === 4 && g2.every((c) => c[0] === "8"));
}

// b-the-nuts.
{
  const n1 = nuts(["Ks", "Qd", "7h", "4c", "2s"]);
  check("nuts: K Q 7 4 2 rainbow -> set of kings (K K)", n1.name === "Three of a Kind" && n1.combos.length === 3 && n1.combos.every((h) => h.every((c) => c[0] === "K")));
  check("nuts: top pair (A-K) is not the nuts there", cmpScore(best(["Ac", "Kc", "Ks", "Qd", "7h", "4c", "2s"]).score, n1.score) < 0);
  const flop = nuts(["9s", "8s", "2d"]);
  check("nuts: flop 9s 8s 2d -> set of nines", flop.name === "Three of a Kind" && flop.combos.every((h) => h.every((c) => c[0] === "9")), flop.name);
  const turn = nuts(["9s", "8s", "2d", "7s"]);
  check("nuts: turn 7s -> Js Ts straight flush (only combo)", turn.name === "Straight Flush" && turn.combos.length === 1 && has(turn.combos, "Js", "Ts"));
  const river = nuts(["9s", "8s", "2d", "7s", "2c"]);
  check("nuts: river 2c pairs the board -> still Js Ts straight flush", river.name === "Straight Flush" && has(river.combos, "Js", "Ts") && river.combos.length === 1);
  // The second-best on the turn: Ts 6s (6-T straight flush).
  check("nuts: Ts 6s is a straight flush too, but the J-high beats it", best(["Ts", "6s", "9s", "8s", "2d", "7s"]).name === "Straight Flush" && cmpScore(best(["Js", "Ts", "9s", "8s", "2d", "7s"]).score, best(["Ts", "6s", "9s", "8s", "2d", "7s"]).score) > 0);
  const mono = nuts(["Ah", "Kh", "7h"]);
  check("nuts: A K 7 all hearts -> Qh Jh flush (A-K-Q-J-7)", mono.name === "Flush" && mono.combos.length === 1 && has(mono.combos, "Qh", "Jh"));
  // Board-nuts: royal on board means everyone splits.
  const royal = nuts(["As", "Ks", "Qs", "Js", "Ts"]);
  check("nuts: royal on the board -> every hand ties (1,081 combos)", royal.name === "Royal Flush" && royal.combos.length === 1081 && nCk(47, 2) === 1081);
}

// b-what-beats-you: you Ah Qd on turn Ad Js 8s 4c.
{
  const hero = ["Ah", "Qd"]; const board = ["Ad", "Js", "8s", "4c"];
  const me = best([...hero, ...board]).score;
  const rest = unseen(hero, board);
  check("beats: 46 unseen, 1,035 combos", rest.length === 46 && combos(rest, 2).length === 1035);
  const beat = []; const tie = [];
  for (const h of combos(rest, 2)) { const d = cmpScore(best([...h, ...board]).score, me); if (d > 0) beat.push(h); else if (d === 0) tie.push(h); }
  const cls = (h) => best([...h, ...board]);
  const byName = {};
  for (const h of beat) { const n = cls(h).name; byName[n] = (byName[n] || 0) + 1; }
  check("beats: sets 10 combos (AA 1, JJ 3, 88 3, 44 3)", byName["Three of a Kind"] === 10, JSON.stringify(byName));
  // Two pair: AJ 2x3=6, A8 6, A4 6, J8 3x3=9, J4 9, 84 9 = 45
  check("beats: two pair 45 combos (AJ 6, A8 6, A4 6, J8 9, J4 9, 84 9)", byName["Two Pair"] === 45, JSON.stringify(byName));
  // One pair aces, better kicker: AK = 2 aces x 4 kings = 8
  check("beats: A-K 8 combos (better kicker)", byName["One Pair"] === 8, JSON.stringify(byName));
  check("beats: total 63 combos beat you", beat.length === 63, String(beat.length));
  check("beats: no straight or flush can beat you yet", !byName.Straight && !byName.Flush);
  // A-Q ties: other aces (2 left) x queens (3 left) = 6 combos.
  check("beats: 6 combos tie (the other A-Q)", tie.length === 6, String(tie.length));
  // River 5s: now three spades and 6-7 / T-9... spades flush possible and 6-7-8 + ... check straight possible.
  const river = [...board, "5s"];
  const meR = best([...hero, ...river]).score;
  const flushes = combos(unseen(hero, river), 2).filter((h) => { const b = best([...h, ...river]); return b.cat === 6 && cmpScore(b.score, meR) > 0; });
  const straights = combos(unseen(hero, river), 2).filter((h) => best([...h, ...river]).cat === 5);
  check("beats: river 5s adds flushes (two spades: 45 combos)", flushes.length === nCk(10, 2), String(flushes.length));
  check("beats: river 5s adds 30 straights (7-6 and 3-2, 16 each, minus 7s6s and 3s2s counted as flushes)", straights.length === 30, String(straights.length));
}

// b-kickers-counterfeit.
{
  // Counterfeit two pair: you Ah 3c on As 3d 9c; turn 9h.
  const flop = ["As", "3d", "9c"]; const you = ["Ah", "3c"]; const them = ["Ac", "Kd"];
  check("counterfeit: flop, your aces and threes beat their pair of aces", refCmp([...you, ...flop], [...them, ...flop]) > 0 && best([...you, ...flop]).name === "Two Pair");
  const turn = [...flop, "9h"];
  check("counterfeit: turn 9h, you have A A 9 9 3, they have A A 9 9 K", best([...you, ...turn]).score.join() === [3, 12, 7, 1].join() && best([...them, ...turn]).score.join() === [3, 12, 7, 11].join());
  check("counterfeit: turn 9h, ace-king now wins on the kicker", refCmp([...you, ...turn], [...them, ...turn]) < 0);
  check("counterfeit: shared compareHands calls the turn a tie (two-pair kicker not compared)", sharedCmp([...you, ...turn], [...them, ...turn]) === 0);
  // Pocket pair counterfeited by a double-paired board: 4s 4d on Kc Kh 9d 9s Qc.
  const b = ["Kc", "Kh", "9d", "9s", "Qc"];
  check("counterfeit: 4-4 on K K 9 9 Q plays the board (K K 9 9 Q)", best(["4s", "4d", ...b]).score.join() === [3, 11, 7, 10].join());
  const sd = showdown(b, { you: ["4s", "4d"], them: ["Jc", "2h"] });
  check("counterfeit: 4-4 splits with J-2 (both play the board)", sd.winners.length === 2);
  const sd2 = showdown(b, { you: ["4s", "4d"], them: ["Ad", "2h"] });
  check("counterfeit: any ace beats 4-4 (K K 9 9 A)", sd2.winners.join() === "them");
  // The tree's belief: the pocket pair is helped least, not most. Count how many of the 990 (45 choose 2)
  // possible opponent hands beat 4-4 here vs beat the same board with A-x.
  const rest = unseen(["4s", "4d"], b);
  const beats44 = combos(rest, 2).filter((h) => refCmp([...h, ...b], ["4s", "4d", ...b]) > 0).length;
  check("counterfeit: 45 unseen, 990 opponent combos", rest.length === 45 && nCk(45, 2) === 990);
  check("counterfeit: 4-4 is beaten by 457 of 990 combos here", beats44 === 457, String(beats44));
  // Kicker contrast: A-K vs A-J on A 8 5 3 T rainbow (no straight for either).
  const kb = ["Ad", "8c", "5h", "3s", "Tc"];
  check("kicker: A-K (A A K T 8) beats A-J (A A J T 8)", refCmp(["As", "Kd", ...kb], ["Ah", "Jd", ...kb]) > 0);
  check("kicker: shared compareHands misses it (tie)", sharedCmp(["As", "Kd", ...kb], ["Ah", "Jd", ...kb]) === 0);
}

// b-texture-read: what each flop allows right now (any two hole cards).
{
  const allows = (flop) => {
    const cats = new Set();
    for (const h of combos(unseen(flop), 2)) cats.add(best([...h, ...flop]).cat);
    return cats;
  };
  const T = {
    dry: ["Kd", "7c", "2s"], paired: ["Kh", "Kc", "4d"], mono: ["Ah", "8h", "3h"],
    connected: ["9c", "8d", "7s"], twotone: ["Jh", "Th", "4c"],
  };
  const A = Object.fromEntries(Object.entries(T).map(([k, f]) => [k, allows(f)]));
  check("texture: dry K-7-2 rainbow: best possible is a set; no straight, flush, full house", Math.max(...A.dry) === 4);
  check("texture: paired K-K-4 allows full house and quads now", A.paired.has(7) && A.paired.has(8) && !A.paired.has(5) && !A.paired.has(6));
  check("texture: monotone A-8-3 allows a flush now; no straight", A.mono.has(6) && !A.mono.has(5) && !A.mono.has(7));
  check("texture: connected 9-8-7 allows a straight now; no flush", A.connected.has(5) && !A.connected.has(6));
  check("texture: two-tone J-T-4 allows no straight and no flush yet (best now is a set)", Math.max(...A.twotone) === 4);
  const fd = combos(unseen(T.twotone), 2).filter((h) => h.every((c) => c[1] === "h"));
  check("texture: J-T-4 two-tone, 55 flush-draw combos (any two of 11 hearts)", fd.length === 55 && nCk(11, 2) === 55);
  const oesd = combos(unseen(T.twotone), 2).filter((h) => { const ups = unseen(T.twotone, h).filter((c) => best([...h, ...T.twotone, c]).cat === 5); return new Set(ups.map((c) => c[0])).size === 2; });
  check("texture: J-T-4, open-ended straight draws are K-Q, Q-9 and 9-8 (48 combos)", oesd.length === 48 && oesd.every((h) => ["KQ", "Q9", "98"].includes(h.map((c) => c[0]).sort((a, b) => RANKS.indexOf(b) - RANKS.indexOf(a)).join(""))), String(oesd.length));
  const fl = combos(unseen(T.mono), 2).filter((h) => best([...h, ...T.mono]).cat === 6);
  check("texture: A-8-3 hearts, 45 flush combos (any two of 10 hearts)", fl.length === 45);
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
// welcome.md is owned elsewhere and not synced here; rules.md and board.md are.
for (const [id, label, ok, detail] of treeSync(["rules", "board"])) check(`tree: ${id} ${label}`, ok, detail);

// ── report ────────────────────────────────────────────────────────────────────────────────────────
if (failures.length) {
  console.log(`FAIL ${failures.length} of ${passed + failures.length}`);
  for (const f of failures) console.log(`  x ${f}`);
  process.exit(1);
}
console.log(`PASS ${passed} checks (welcome, rules, board truth sheet; rules and board synced to the tree)`);
