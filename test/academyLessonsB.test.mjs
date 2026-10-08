// The academy v2 definitions of the later tracks (pressure, people, theory, player, Other Tables):
// the 17 node-id lessons in lessons/academy, the why step and "Your turn" pause added to the two
// shipped pressure lessons, their answer keys (answerKeys/<node>.mjs) and their recall cards.
// Every correct answer and every number a spot states is recomputed here: exact fractions, the
// shared evaluator, an independent range enumeration, Kuhn poker by best response, ICM by the
// Harville recursion; the plan's own check script runs too.
//   node test/academyLessonsB.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as learn from "../src/learn/index.mjs";

const require = createRequire(import.meta.url);
const { evaluateHand } = require("../src/eval/pokerEvaluator.js");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const {
  ACADEMY_V2_LATER_LESSONS, academyLesson, filmFirstLesson, NODES, lessonOfNode, learnPath, validateDefinitionHands,
  expandScript, initialState, stateAfter, runUntilBlocked, lessonHands, decisionStages, recallEntry, prereqHits, synonymHits,
  whyStages, whyResult, tablePlan, completingCards, WHY_KIND,
} = learn;

let checks = 0;
const check = (name, fn) => { try { fn(); } catch (error) { error.message = `${name}: ${error.message}`; throw error; } checks += 1; };
const LATER_TRACKS = ["pressure", "people", "theory", "player", "formats"];
const ROLES = ["guided", "practice", "fresh"];

// ── exact fractions ───────────────────────────────────────────────────────────────────────────
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
class Q {
  constructor(n, d = 1n) { n = BigInt(n); d = BigInt(d); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; this.n = n / g; this.d = d / g; }
  add(o) { o = q(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = q(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = q(o); return new Q(this.n * o.n, this.d * o.d); }
  div(o) { o = q(o); return new Q(this.n * o.d, this.d * o.n); }
  eq(o) { o = q(o); return this.n === o.n && this.d === o.d; }
  lt(o) { o = q(o); return this.n * o.d < o.n * this.d; }
  gt(o) { o = q(o); return this.n * o.d > o.n * this.d; }
  pow(k) { let r = q(1); for (let i = 0; i < k; i += 1) r = r.mul(this); return r; }
  num() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}
function q(x, d) {
  if (x instanceof Q) return x;
  if (d !== undefined) return new Q(x, d);
  const s = String(x);
  if (s.includes("/")) { const [a, b] = s.split("/"); return new Q(a, b); }
  if (s.includes(".")) { const [i, f] = s.split("."); return new Q(BigInt(i.replace("-", "") + f) * (s.startsWith("-") ? -1n : 1n), 10n ** BigInt(f.length)); }
  return new Q(BigInt(s));
}
const eqQ = (a, b, msg) => assert.ok(q(a).eq(q(b)), `${msg}: ${q(a)} ≠ ${q(b)}`);
const pct = (x, dp = 1) => Number((q(x).num() * 100).toFixed(dp));
const beFold = (pot, bet) => q(bet).div(q(pot).add(bet));                    // a bluff's break-even fold rate
const mdf = (pot, bet) => q(pot).div(q(pot).add(bet));                       // minimum defense
const price = (pot, bet) => q(bet).div(q(pot).add(bet).add(bet));            // caller's price
const bluffShare = (pot, bet) => q(bet).div(q(pot).add(q(bet).mul(2)));      // balanced bluff share
const callEV = (pot, bet, win) => q(win).mul(q(pot).add(bet).add(bet)).sub(bet);

// ── cards ─────────────────────────────────────────────────────────────────────────────────────
const RANKS = "23456789TJQKA";
const SUITS = ["s", "h", "d", "c"];
const SYMBOL = { s: "♠", h: "♥", d: "♦", c: "♣" };
const DECK = [...RANKS].flatMap((r) => SUITS.map((s) => r + s));
const ri = (c) => RANKS.indexOf(c[0]);
const ev = (cards) => evaluateHand(cards.map((c) => ({ rank: c[0], suit: SYMBOL[c[1]] })));
const unseen = (...known) => DECK.filter((c) => !known.flat().includes(c));
const pairsOf = (cards) => { const out = []; for (let i = 0; i < cards.length; i += 1) for (let j = i + 1; j < cards.length; j += 1) out.push([cards[i], cards[j]]); return out; };
const RANK = { straight: ev(["5c", "6d", "7h", "8s", "9c"]).rank, trips: ev(["7c", "7d", "7h", "Ks", "2d"]).rank, pair: ev(["7c", "7d", "9h", "Ks", "2d"]).rank };

// An independent best-five scorer (the plan script's), for the range tiers and their kickers.
function score5(cs) {
  const rs = cs.map(ri).sort((a, b) => b - a);
  const flush = cs.every((c) => c[1] === cs[0][1]);
  const uniq = [...new Set(rs)];
  let sh = -1;
  if (uniq.length === 5) { if (rs[0] - rs[4] === 4) sh = rs[0]; else if (rs[0] === 12 && rs[1] === 3 && rs[4] === 0) sh = 3; }
  const cnt = new Map(); for (const r of rs) cnt.set(r, (cnt.get(r) || 0) + 1);
  const g = [...cnt.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const shape = g.map((x) => x[1]).join(""); const ord = g.map((x) => x[0]);
  if (sh >= 0 && flush) return [9, sh]; if (shape === "41") return [8, ...ord]; if (shape === "32") return [7, ...ord];
  if (flush) return [6, ...rs]; if (sh >= 0) return [5, sh]; if (shape === "311") return [4, ...ord];
  if (shape === "221") return [3, ...ord]; if (shape === "2111") return [2, ...ord]; return [1, ...rs];
}
const cmpv = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i += 1) { const d = (a[i] ?? -1) - (b[i] ?? -1); if (d) return d; } return 0; };
function best(cards) {
  let top = null;
  const rec = (s, pick) => { if (pick.length === 5) { const v = score5(pick); if (!top || cmpv(v, top) > 0) top = v; return; } for (let i = s; i <= cards.length - (5 - pick.length); i += 1) { pick.push(cards[i]); rec(i + 1, pick); pick.pop(); } };
  rec(0, []);
  // Cross-check the category with the shared evaluator (its royal flush is 10).
  const shared = ev(cards).rank;
  assert.equal(shared === 10 ? 9 : shared, top[0], `scorer and evaluator agree on ${cards.join(" ")}`);
  return top;
}
function expand(cls) {
  const [a, b, t] = cls; const out = [];
  if (a === b) { for (let i = 0; i < 4; i += 1) for (let j = i + 1; j < 4; j += 1) out.push([a + SUITS[i], a + SUITS[j]]); }
  else if (t === "s") for (const s of SUITS) out.push([a + s, b + s]);
  else for (const s of SUITS) for (const u of SUITS) if (s !== u) out.push([a + s, b + u]);
  return out;
}
const live = (classes, dead) => classes.flatMap(expand).filter((h) => !h.some((c) => dead.includes(c)));
const pairsFrom = (lo, hi) => RANKS.slice(ri(lo), ri(hi) + 1).split("").map((r) => r + r);
const suitedRun = (hi, lo, to) => RANKS.slice(ri(lo), ri(to) + 1).split("").map((r) => `${hi}${r}s`);
function windows(rankSet) { const rs = new Set(rankSet); if (rs.has(12)) rs.add(-1); const out = []; for (let lo = -1; lo <= 8; lo += 1) { let k = 0; for (let r = lo; r < lo + 5; r += 1) if (rs.has(r)) k += 1; out.push(k); } return out; }
const straightDraw = (cards) => { const w = windows(cards.map(ri)); return !w.includes(5) && w.some((k) => k >= 4); };
const flushDraw = (hole, board) => SUITS.some((s) => [...hole, ...board].filter((c) => c[1] === s).length === 4 && hole.some((c) => c[1] === s));
function tier(h, b) {
  const br = b.map(ri), top = Math.max(...br), hr = h.map(ri), pp = hr[0] === hr[1];
  const cnt = (x) => br.filter((y) => y === x).length;
  const v = best([...h, ...b]);
  if (v[0] >= 5) return "strong";
  if (pp && cnt(hr[0]) >= 1) return "strong";
  if (!pp && cnt(hr[0]) >= 1 && cnt(hr[1]) >= 1) return "strong";
  if (hr.some((x) => cnt(x) >= 2)) return "strong";
  if (pp && hr[0] > top) return "top";
  if (hr.some((x) => x === top)) return "top";
  if (pp || hr.some((x) => cnt(x) >= 1)) return "pair";
  return straightDraw([...h, ...b]) || flushDraw(h, b) ? "draw" : "air";
}
const tally = (hands, b) => { const t = { n: hands.length, strong: 0, top: 0, pair: 0, draw: 0, air: 0 }; for (const h of hands) t[tier(h, b)] += 1; return t; };
// The Postflop track's illustrative caller range (plans/postflop.md), 186 combos.
const CALLER = [...pairsFrom("2", "T"), ...suitedRun("A", "2", "J"), "KJs", "KTs", "QJs", "QTs", "JTs", "T9s", "98s", "87s", "76s", "65s", "54s", "KJo", "QJo", "JTo", "ATo"];

// ── Kuhn poker (exact) and ICM (Harville) ─────────────────────────────────────────────────────
function kuhnValue(s1, s2) { // first player's average net per hand; cards 0 J, 1 Q, 2 K; ante 1, one bet of 1
  let v = q(0);
  for (const x of [0, 1, 2]) for (const y of [0, 1, 2]) {
    if (x === y) continue;
    const win = x > y ? 1 : -1;
    const b1 = q(s1.b[x]), c1 = q(s1.c[x]), c2 = q(s2.c[y]), b2 = q(s2.b[y]);
    const afterBet = c2.mul(2 * win).add(q(1).sub(c2));
    const afterCheck = b2.mul(c1.mul(2 * win).add(q(1).sub(c1).mul(-1))).add(q(1).sub(b2).mul(win));
    v = v.add(q(1, 6).mul(b1.mul(afterBet).add(q(1).sub(b1).mul(afterCheck))));
  }
  return v;
}
const pures = () => { const out = []; for (let m = 0; m < 64; m += 1) out.push([...Array(6)].map((_, i) => (m >> i) & 1)); return out; };
const KUHN_P2 = { c: [0, q(1, 3), 1], b: [q(1, 3), 0, 1] };
const kuhnP1 = (alpha) => ({ b: [alpha, 0, q(alpha).mul(3)], c: [0, q(alpha).add(q(1, 3)), 1] });

function icm(stacks, pay) {
  const eq = stacks.map(() => q(0));
  const go = (left, place, p) => {
    if (place >= pay.length || !left.length) return;
    const total = left.reduce((a, i) => a + stacks[i], 0);
    for (const i of left) { const pi = p.mul(q(stacks[i], total)); eq[i] = eq[i].add(pi.mul(pay[place])); go(left.filter((j) => j !== i), place + 1, pi); }
  };
  go(stacks.map((_, i) => i).filter((i) => stacks[i] > 0), 0, q(1));
  stacks.forEach((s, i) => { if (s === 0) eq[i] = eq[i].add(pay[stacks.length - 1]); }); // one bust takes the last paid place
  return eq;
}
const PAY = [q(1, 2), q(3, 10), q(1, 5)];

// ── helpers over definitions and keys ─────────────────────────────────────────────────────────
const KEYS = {};
for (const id of [...ACADEMY_V2_LATER_LESSONS.map((d) => d.id), "x-fold-equity", "x-bluffing"]) {
  KEYS[id] = (await import(pathToFileURL(join(ROOT, "answerKeys", `${id}.mjs`)).href)).default;
}
const def = (id) => academyLesson(id) || filmFirstLesson(lessonOfNode(id));
const keyOf = (node, spotId) => {
  const k = KEYS[node];
  const entry = k.film?.spotId === spotId ? k.film : k.spots?.[spotId];
  assert.ok(entry, `${node}: a key for ${spotId}`);
  return entry.key.action ?? entry.key.band;
};
const whyKey = (node) => KEYS[node].why.key.option;
const spotOf = (node, spotId) => { const d = def(node); const film = d.stages[1]; return film.pause?.spotId === spotId ? film.pause.spot : d.spots[spotId]; };
const bandLabel = (node, spotId) => { const spot = spotOf(node, spotId); return spot.bands.find((b) => b.id === keyOf(node, spotId)).label; };
const cardsIn = (text) => (text.match(/[2-9TJQKA][♠♥♦♣]/g) || []).map((c) => c[0] + { "♠": "s", "♥": "h", "♦": "d", "♣": "c" }[c[1]]);

// The films' canon.yourTurn times (seconds; null: the film has no yourTurn anchor), from each
// src-academy-<id>-v2/timing.json. Cross-checked against the work folder when it is on this machine.
const FILM_TURN = {
  "x-fold-equity": 59.9, "x-bluffing": null, "x-mdf": 66.97, "x-check-raise": 60.83, "x-barrels-blockers": 64.66,
  "h-range-narrowing": 64.31, "h-player-types": null, "h-exploits": null,
  "g-toy-games": null, "g-balance": 66.15, "g-gto-to-exploit": null,
  "y-bankroll": null, "y-tilt": null, "y-study": null,
  "o-multiway": 69.34, "o-heads-up": null, "o-tournaments-icm": 67.51, "o-six-max": 48.69, "o-live": 50.5,
};
const WORK = "C:/Users/tps11/Documents/Codex/2026-10-05/task-5/claude-motion-draft-2026-10-06";

// ═══ structure ════════════════════════════════════════════════════════════════════════════════
check("the 17 node-id lessons cover every later-track node without a shipped definition", () => {
  const missing = NODES.filter((n) => LATER_TRACKS.includes(n.track) && lessonOfNode(n.id) === n.id).map((n) => n.id);
  assert.deepEqual(ACADEMY_V2_LATER_LESSONS.map((d) => d.id).sort(), missing.sort());
  assert.equal(ACADEMY_V2_LATER_LESSONS.length, 17);
  assert.ok(Object.isFrozen(ACADEMY_V2_LATER_LESSONS));
  for (const d of ACADEMY_V2_LATER_LESSONS) assert.equal(academyLesson(d.id), d);
  assert.equal(academyLesson("pot-odds-workspace-v2"), filmFirstLesson("pot-odds-workspace-v2"), "falls back to the shipped 20");
  assert.equal(academyLesson("nope"), null);
  const path = learnPath(academyLesson);
  assert.equal(path.total, 37, "the 20 shipped plus the 17 later-track lessons");
  assert.ok(path.chapters.filter((c) => LATER_TRACKS.includes(c.id)).every((c) => c.lessons.length === NODES.filter((n) => n.track === c.id).length), "every later track is complete");
});

if (existsSync(WORK)) {
  check("FILM_TURN matches each film's timing.json canon.yourTurn", () => {
    for (const [node, at] of Object.entries(FILM_TURN)) {
      const timing = JSON.parse(readFileSync(join(WORK, `src-academy-${node}-v2`, "timing.json"), "utf8"));
      const anchor = timing.canon?.yourTurn ?? null;
      assert.equal(anchor == null ? null : timing.phrases[anchor], at, node);
    }
  });
}

const walk = (value, visit, trail = "") => {
  if (Array.isArray(value)) value.forEach((item, i) => walk(item, visit, `${trail}[${i}]`));
  else if (value && typeof value === "object") for (const [k, item] of Object.entries(value)) { visit(k, `${trail}.${k}`); walk(item, visit, `${trail}.${k}`); }
};
const neutral = (spot) => {
  if (spot.decision === "action") return { action: spot.choices.includes("call") ? "call" : spot.choices[0], correct: null };
  return { response: { band: spot.bands[0].id }, correct: null };
};
const play = (hand, choose) => {
  const answers = {}; const performed = []; const reached = [];
  let state = initialState(hand); let next = 0;
  for (let guard = 0; guard < 100; guard += 1) {
    const run = runUntilBlocked(hand, state, next, { answers, performed }, { reduce: true });
    state = run.state; next = run.next;
    if (!run.blocked) return { reached, finished: next === expandScript(hand).length };
    if (run.blocked.kind === "decide") { reached.push(run.blocked.spotId); answers[run.blocked.spotId] = choose(run.blocked.spotId); }
    else if (run.blocked.kind === "action") performed.push(run.blocked.index);
    else return { reached, finished: false, blocked: run.blocked };
  }
  return { reached, finished: false };
};
const learnerText = (d) => {
  const out = [d.title, d.kicker, d.assumptions];
  for (const s of d.stages) {
    out.push(s.heading, s.em, s.lead, s.prompt, s.coachLine, s.next, s.rule, s.upNext);
    for (const o of s.options || []) out.push(o.text, o.fix);
    const p = s.pause?.spot;
    if (p) out.push(p.title, p.prompt, p.hint, p.explanation, p.dockPrompt, ...(p.bands || []).map((b) => b.label));
  }
  for (const spot of Object.values(d.spots)) out.push(spot.title, spot.prompt, spot.hint, spot.explanation, spot.dockPrompt, spot.note, ...(spot.bands || []).map((b) => b.label));
  return out.filter(Boolean).map((text) => ({ text }));
};

for (const d of ACADEMY_V2_LATER_LESSONS) {
  const id = d.id;
  check(`${id}: shape`, () => {
    const node = NODES.find((n) => n.id === id);
    assert.ok(node && LATER_TRACKS.includes(node.track), `${id} is a later-track node`);
    assert.equal(d.node, id); assert.equal(lessonOfNode(id), id, "curriculum opens it by node id");
    assert.equal(d.media, id, "the media id is the node"); assert.equal(d.flow, "film-first"); assert.equal(d.version, 1);
    assert.equal(d.conceptId, node.legacy?.concept ?? null, "concept id from the tree");
    assert.ok(["free", "pro"].includes(d.access) && d.coach && d.title && d.assumptions && d.feedback.found && d.feedback.missed && d.feedback.open);
  });

  check(`${id}: validateDefinitionHands`, () => assert.deepEqual(validateDefinitionHands(d), []));

  check(`${id}: the loop, film -> why -> guided -> practice -> fresh -> takeaway`, () => {
    const kinds = d.stages.map((s) => s.kind);
    assert.deepEqual(kinds.slice(0, 3), ["welcome", "film", WHY_KIND]);
    assert.equal(kinds.at(-1), "takeaway");
    assert.ok(kinds.slice(3, -1).every((k) => k === "decision"));
    const hands = lessonHands(d);
    assert.deepEqual(hands.map((h) => h.role), ROLES, "one guided, one practice and one fresh hand, in order");
    for (const stage of decisionStages(d)) assert.ok(d.hands[stage.hand] && d.spots[stage.spotId] && stage.label && stage.next && stage.coachLine);
    assert.deepEqual(Object.keys(d.spots).sort(), decisionStages(d).map((s) => s.spotId).sort());
    assert.equal(d.stages.at(-1).recapLabels.length, hands.length);
    assert.equal(tablePlan(d, 2, {}).mode, "held", "the table waits behind the why step");
  });

  check(`${id}: the film pauses at canon.yourTurn for the Your turn spot`, () => {
    const film = d.stages[1];
    assert.equal(film.media, id);
    assert.equal(film.pause.film, id);
    assert.equal(film.pause.at, FILM_TURN[id]);
    assert.equal(film.pause.anchor, FILM_TURN[id] == null ? "end" : "yourTurn");
    const spot = film.pause.spot;
    assert.ok(spot.prompt && spot.hint && spot.explanation && spot.title);
    if (spot.decision === "action") assert.ok(spot.choices.length >= 2);
    else { assert.equal(spot.decision, "estimate"); assert.ok(spot.bands.length >= 2 && new Set(spot.bands.map((b) => b.id)).size === spot.bands.length); }
  });

  check(`${id}: the why step, three reasons, each with a one-line fix`, () => {
    const [why] = whyStages(d);
    assert.equal(why.index, 2);
    assert.ok(why.prompt);
    assert.equal(why.options.length, 3);
    assert.equal(new Set(why.options.map((o) => o.id)).size, 3);
    for (const o of why.options) {
      assert.ok(o.text && o.fix && o.fix.length < 200, `${o.id} has a short fix`);
      assert.ok(!("correct" in o), "no key ships in the definition");
    }
    assert.ok(why.options.some((o) => o.id === whyKey(id)), "the key names an option");
    assert.equal(whyResult(why, whyKey(id), KEYS[id].why.key).correct, true);
    assert.equal(why.options.filter((o) => whyResult(why, o.id, KEYS[id].why.key).correct).length, 1);
  });

  check(`${id}: no keys and no opponent cards in the definition`, () => {
    walk(d, (k, trail) => {
      assert.ok(!["key", "correct", "correctAction", "answer"].includes(k), `${id}${trail} ships a key`);
      if (k === "opponent") assert.ok(/.seats.opponent$/.test(trail) || /^.hands.[^.]+.opponent$/.test(trail), `${id}${trail}`);
    });
    for (const hand of Object.values(d.hands)) assert.ok(Object.keys(hand.opponent || {}).length === 0, "no reveal");
  });

  check(`${id}: every hand plays through every choice`, () => {
    for (const hand of lessonHands(d)) {
      const script = d.hands[hand.hand];
      const result = play(script, (spotId) => neutral(d.spots[spotId]));
      assert.ok(result.finished, `${hand.hand} finishes`);
      assert.deepEqual(result.reached, hand.stages.map((s) => s.spotId));
      for (const stage of hand.stages) {
        const spot = d.spots[stage.spotId];
        if (spot.decision !== "action") continue;
        for (const choice of spot.choices) assert.ok(play(script, (s) => (s === stage.spotId ? { action: choice } : neutral(d.spots[s]))).finished, `${stage.spotId}=${choice}`);
      }
    }
  });

  check(`${id}: the answer key mirrors the definition`, () => {
    const k = KEYS[id];
    assert.equal(k.lessonId, id); assert.equal(k.node, id); assert.equal(k.contentVersion, d.version); assert.equal(k.access, d.access);
    assert.deepEqual(k.stages.map((s) => s.kind), d.stages.map((s) => s.kind));
    d.stages.forEach((s, i) => { if (s.kind === "decision") assert.equal(k.stages[i].spotId, s.spotId); });
    const film = d.stages[1].pause;
    assert.equal(k.film.spotId, film.spotId); assert.equal(k.film.at, film.at); assert.equal(k.film.decision, film.spot.decision);
    const inSpot = (entry, spot) => (spot.decision === "action"
      ? (assert.deepEqual(entry.choices, spot.choices), spot.choices.includes(entry.key.action))
      : (assert.deepEqual(entry.bands, spot.bands.map((b) => b.id)), entry.bands.includes(entry.key.band)));
    assert.ok(inSpot(k.film, film.spot), "film key is a choice");
    assert.deepEqual(k.why.options, d.stages[2].options.map((o) => o.id)); assert.equal(k.why.stage, 2);
    assert.deepEqual(Object.keys(k.spots).sort(), Object.keys(d.spots).sort());
    for (const [spotId, entry] of Object.entries(k.spots)) {
      assert.equal(entry.stage, d.stages.findIndex((s) => s.spotId === spotId));
      assert.equal(entry.decision, d.spots[spotId].decision);
      assert.ok(inSpot(entry, d.spots[spotId]), `${spotId} key is a choice`);
    }
  });

  check(`${id}: the rule card is the recall card's rule, and the text passes the lints`, () => {
    const takeaway = d.stages.at(-1);
    assert.equal(takeaway.rule, recallEntry(id).rule);
    assert.deepEqual(prereqHits(id, learnerText(d)), [], "no term from a later node");
    assert.deepEqual(synonymHits(id, learnerText(d)), [], "no banned synonym");
  });

  check(`${id}: every card a spot names is the table's`, () => {
    for (const [spotId, spot] of Object.entries(d.spots)) {
      const named = cardsIn(`${spot.prompt} ${spot.explanation}`);
      const visible = [...(spot.hero || []), ...(spot.board || [])];
      const extra = named.filter((c) => !visible.includes(c));
      // Cards outside the table are the hypothetical hands the spot asks about.
      const allowed = { "rn-practice": ["Th", "9h", "Kc", "Tc", "7s", "7d"], "rn-fresh": ["Qd", "6c", "3s"] }[spotId] || [];
      assert.deepEqual(extra.filter((c) => !allowed.includes(c)), [], `${spotId} names ${extra.join(" ")}`);
      if (spot.hero && spot.board) assert.equal(new Set(visible).size, visible.length, `${spotId} distinct cards`);
    }
  });
}

// ═══ the two shipped pressure lessons ═══════════════════════════════════════════════════════════
check("x-fold-equity and x-bluffing: a why step after the film; the yourTurn pause only where the v2 film has one", () => {
  for (const node of ["x-fold-equity", "x-bluffing"]) {
    const d = def(node);
    assert.equal(d.stages[2].kind, WHY_KIND, `${node} why at index 2`);
    assert.equal(d.stages[2].options.length, 3);
    assert.deepEqual(KEYS[node].why.options, d.stages[2].options.map((o) => o.id));
    assert.ok(d.stages[2].options.every((o) => o.fix && !("correct" in o)));
    assert.deepEqual(validateDefinitionHands(d), []);
    assert.deepEqual(KEYS[node].stageShift, { from: 2, by: 1 });
    assert.deepEqual(prereqHits(node, learnerText(d)), []); assert.deepEqual(synonymHits(node, learnerText(d)), []);
  }
  const sb = def("x-fold-equity").stages[1].pause;
  assert.equal(sb.at, FILM_TURN["x-fold-equity"]); assert.equal(sb.film, "x-fold-equity"); assert.equal(KEYS["x-fold-equity"].film.spotId, sb.spotId);
  assert.equal(def("x-bluffing").stages[1].pause, undefined, "the bluffing v2 film has no yourTurn anchor");
  assert.equal(KEYS["x-bluffing"].film, null);
});

// ═══ the numbers ════════════════════════════════════════════════════════════════════════════════
check("x-fold-equity: pot 160, bet 100, folds 25%, hit 25% (given) -> check", () => {
  eqQ(beFold(160, 100), q(5, 13), "break-even"); assert.equal(pct(q(5, 13)), 38.5);
  const called = q("0.25").mul(360).sub(100); eqQ(called, -10, "called");
  const bet = q("0.25").mul(160).add(q("0.75").mul(called)); eqQ(bet, q("32.5"), "bet");
  const chk = q("0.25").mul(160); eqQ(chk, 40, "check");
  assert.equal(keyOf("x-fold-equity", "sb1-turn"), bet.gt(chk) ? "bet" : "check");
  assert.equal(whyKey("x-fold-equity"), "both-branches");
});

check("x-bluffing: the v2 film's verdict, 77 of 102 fold against a 40% break-even", () => {
  eqQ(beFold(150, 100), q(2, 5), "break-even");
  assert.equal(pct(q(77, 102)), 75.5);
  const perBluff = q(77 * 150 - 25 * 100, 102); assert.equal(Number(perBluff.num().toFixed(1)), 88.7);
  assert.ok(q(77, 102).gt(q(2, 5)));
  assert.equal(whyKey("x-bluffing"), "story-target");
});

check("x-mdf: keep pot ÷ (pot + bet) of the range", () => {
  for (const [spotId, pot, bet, range] of [["md-turn", 90, 60, 35], ["md-guided", 100, 75, 42], ["md-practice", 100, 50, 30], ["md-fresh", 120, 40, 32]]) {
    const spot = spotOf("x-mdf", spotId);
    assert.equal(spot.range, range);
    const keep = mdf(pot, bet).mul(range); assert.equal(keep.d, 1n, `${spotId} whole combos`);
    assert.equal(keyOf("x-mdf", spotId), `keep-${keep}`);
    eqQ(mdf(pot, bet).add(beFold(pot, bet)), 1, `${spotId} MDF + break-even = 1`);
  }
  // The guided spot's "fold 60% and his bluffs make 30 each".
  eqQ(q("0.6").mul(100).sub(q("0.4").mul(75)), 30, "bluffer at 60% folds");
  assert.equal(whyKey("x-mdf"), "mdf");
  assert.equal(Number(beFold(90, 60).mul(35).num()), 14, "the near-miss keeps 14");
});

check("x-check-raise: hand classes, outs and the raise's price", () => {
  eqQ(q(70 - 20).div(60 + 70 + 70), q(1, 4), "his price to call the raise");
  assert.equal(60 + 20 + 20, 100, "just calling makes 100");
  const [six, seven, tens, nine] = [["6c", "6h", "9s", "6d", "2c"], ["7h", "7c", "9s", "6d", "2c"], ["Ts", "9s", "Js", "8d", "3s"], ["9d", "9s", "Qh", "7c", "4s"]];
  assert.equal(ev(six).rank, RANK.trips, "a set");
  assert.equal(ev(seven).rank, RANK.pair); assert.ok(ri("7h") < ri("9s"), "sevens are below the top card");
  assert.equal(ev(nine).rank, RANK.pair); assert.ok(ri("9d") < ri("Qh"), "nines are below the queen");
  assert.equal(completingCards(["Ts", "9s"], ["Js", "8d", "3s"], "straight").length, 15, "15 outs to a straight or better");
  assert.equal(unseen(tens).length, 47);
  assert.deepEqual(["cr-turn", "cr-guided", "cr-practice", "cr-fresh"].map((s) => keyOf("x-check-raise", s)), ["call", "raise", "raise", "call"]);
  assert.equal(whyKey("x-check-raise"), "folds-worse");
});

check("x-barrels-blockers: the three-street sizes and the blocker counts", () => {
  const plan = (pot, frac) => { let p = q(pot); let total = q(0); for (let i = 0; i < 3; i += 1) { const b = p.mul(frac); total = total.add(b); p = p.add(b.mul(2)); } return { total, final: p }; };
  const fits = (spotId, pot, stack) => {
    const spot = spotOf("x-barrels-blockers", spotId);
    const good = spot.bands.filter((b) => { const size = Number(b.id.split("-")[1]); return plan(pot, q(size, pot)).total.eq(stack); });
    assert.equal(good.length, 1, `${spotId}: one size fits`);
    return good[0].id;
  };
  assert.equal(keyOf("x-barrels-blockers", "bk-guided"), fits("bk-guided", 100, 350));
  eqQ(plan(100, q(1, 2)).final, 800, "pot ends at 800"); eqQ(q(350, 100), q(7, 2), "SPR 3.5");
  assert.equal(keyOf("x-barrels-blockers", "bk-practice"), fits("bk-practice", 50, 650));
  eqQ(plan(50, q(1, 2)).total, 175, "half pot reaches 175");
  eqQ(q(100).add(q(250).mul(2)), 600, "twice the pot puts 600 in by the turn");
  // The film's river: 10 unseen spades, 45 two-spade combos, 9 with the A♠.
  const river = ["Ks", "9s", "4d", "2s", "7h"];
  const spades = unseen(river).filter((c) => c[1] === "s");
  assert.equal(spades.length, 10); assert.equal(pairsOf(spades).length, 45);
  assert.equal(pairsOf(spades).filter((h) => h.includes("As")).length, 9); assert.equal(pairsOf(spades.filter((c) => c !== "As")).length, 36);
  assert.equal(keyOf("x-barrels-blockers", "bk-turn"), "ace-spades");
  // Fresh: straights on T♣ 9♦ 8♠ 4♥ 2♣ with the J♥ held against without a jack.
  const board = ["Tc", "9d", "8s", "4h", "2c"];
  const straights = (dead) => pairsOf(unseen(board, dead)).filter((h) => ev([...h, ...board]).rank === RANK.straight).length;
  assert.equal(straights(["5c"]), 48); assert.equal(straights(["Jh", "5c"]), 40);
  const need = beFold(150, 100); eqQ(need, q(2, 5), "40%");
  assert.ok(q(30, 78).lt(need) && q(30, 70).gt(need)); assert.equal(pct(q(30, 78)), 38.5); assert.equal(pct(q(30, 70)), 42.9);
  assert.equal(ev(["Jh", "5c", ...board]).rank, ev(["2d", "3d", "5h", "7c", "Kd"]).rank, "jack high");
  assert.equal(keyOf("x-barrels-blockers", "bk-fresh"), "bet");
  assert.equal(whyKey("x-barrels-blockers"), "blocks-calls");
});

check("h-range-narrowing: every count enumerated from the caller range", () => {
  const flopRule = (h, b) => tier(h, b) !== "air";
  const fl = ["Jh", "8c", "4d"], tu = [...fl, "2s"], rv = [...tu, "Kh"];
  const turnRule = (h) => { const x = tier(h, tu); if (x === "strong" || x === "top") return true; if (x === "pair") return best([...h, ...tu])[1] >= ri("8"); return straightDraw([...h, ...tu]); };
  const s1 = live(CALLER, fl), s2 = s1.filter((h) => flopRule(h, fl)), s3 = s2.filter((h) => !h.includes("2s")).filter(turnRule), s4 = s3.filter((h) => !h.includes("Kh"));
  assert.deepEqual([live(CALLER, []).length, s1.length, s2.length, s3.length, s4.length], [186, 162, 118, 85, 82]);
  const t4 = tally(s4, rv);
  assert.deepEqual([t4.strong, t4.top + t4.pair, t4.draw, t4.air], [18, 48, 16, 0]);
  const biggest = [["strong", t4.strong], ["one-pair", t4.top + t4.pair], ["missed", t4.draw]].sort((a, b) => b[1] - a[1])[0][0];
  assert.equal(keyOf("h-range-narrowing", "rn-guided"), biggest);
  const near = (n, spotId) => spotOf("h-range-narrowing", spotId).bands.map((b) => b.id).sort((a, b) => Math.abs(n - Number(a.split("-")[1])) - Math.abs(n - Number(b.split("-")[1])))[0];
  const tf = ["Qd", "6c", "3s"], tl = live(CALLER, tf), tt = tally(tl, tf);
  assert.deepEqual([tl.length, tl.length - tt.air, tt.air, tt.strong, tt.top, tt.pair, tt.draw], [171, 79, 92, 6, 15, 54, 4]);
  assert.equal(keyOf("h-range-narrowing", "rn-turn"), near(79, "rn-turn"));
  const ff = ["Td", "5s", "2c"], fl2 = live(CALLER, ff), ft = tally(fl2, ff);
  assert.deepEqual([fl2.length, fl2.length - ft.air, ft.air, ft.strong, ft.top, ft.pair, ft.draw], [162, 98, 64, 9, 33, 48, 8]);
  assert.equal(keyOf("h-range-narrowing", "rn-fresh"), near(98, "rn-fresh"));
  // Practice: which hand still fits after the flop and turn calls.
  const fits = { t9: ["Th", "9h"], kt: ["Kc", "Tc"], 77: ["7s", "7d"] };
  const still = Object.entries(fits).filter(([, h]) => live(CALLER, fl).some((x) => x.join() === h.join() || x.join() === [...h].reverse().join()) && flopRule(h, fl) && turnRule(h)).map(([k]) => k);
  assert.deepEqual(still, ["t9"]);
  assert.equal(flopRule(fits.kt, fl), false, "K♣ T♣ folds the flop"); assert.ok(flopRule(fits[77], fl) && !turnRule(fits[77]), "7♠ 7♦ folds the turn");
  assert.equal(keyOf("h-range-narrowing", "rn-practice"), "t9");
  assert.equal(whyKey("h-range-narrowing"), "removes");
});

check("h-player-types: the habits table and the sample bands", () => {
  const types = { station: [45, 6], nit: [12, 10], tag: [22, 18], lag: [34, 27], balanced: [24, 19] };
  const nearest = (played, raised, ids) => ids.sort((a, b) => Math.hypot(types[a][0] - played, types[a][1] - raised) - Math.hypot(types[b][0] - played, types[b][1] - raised))[0];
  assert.equal(keyOf("h-player-types", "pt-guided"), nearest(45, 6, ["station", "nit", "lag"]));
  assert.equal(keyOf("h-player-types", "pt-practice"), nearest(34, 27, ["tag", "lag", "station"]));
  assert.equal(keyOf("h-player-types", "pt-turn"), "nit");
  assert.ok(types.nit[0] < types.balanced[0] && types.nit[1] / types.nit[0] > 0.8, "the nit plays few and raises most");
  const se = (p, n) => Math.sqrt((p * (1 - p)) / n);
  assert.equal(Number((se(0.22, 100) * 100).toFixed(1)), 4.1);
  assert.equal(Number(((0.22 + 2 * se(0.22, 100)) * 100 - (0.22 - 2 * se(0.22, 100)) * 100).toFixed(0)), 17, "a band about 17 points wide");
  const lo = 0.45 - 2 * se(0.45, 20), hi = 0.45 + 2 * se(0.45, 20);
  assert.deepEqual([Math.round(lo * 100), Math.round(hi * 100)], [23, 67]);
  assert.ok(lo < 0.24, "the band still holds the baseline's 24%");
  assert.equal(keyOf("h-player-types", "pt-fresh"), "not-yet");
  assert.equal(whyKey("h-player-types"), "habits");
});

check("h-exploits: one break-even, a different given habit each time", () => {
  const bluff = (pot, bet, fold) => q(fold).mul(pot).sub(q(1).sub(fold).mul(bet));
  eqQ(beFold(90, 60), q(2, 5), "40%");
  eqQ(bluff(90, 60, "0.2"), -30, "station"); eqQ(bluff(90, 60, "0.7"), 45, "nit");
  assert.equal(keyOf("h-exploits", "ex-turn"), bluff(90, 60, "0.2").gt(0) ? "bet" : "check");
  eqQ(beFold(90, 30), q(1, 4), "a 30 bluff needs 25%"); assert.ok(q("0.2").lt(q(1, 4)));
  const value = (bet, worse) => q(worse).mul(bet).sub(q(1).sub(worse).mul(bet));
  eqQ(value(60, "0.6"), 12, "station value"); eqQ(value(60, "0.2"), -36, "nit value");
  assert.equal(keyOf("h-exploits", "ex-guided"), "bet"); assert.equal(keyOf("h-exploits", "ex-practice"), "check");
  eqQ(price(120, 80), q(2, 7), "28.6%"); assert.equal(pct(q(2, 7)), 28.6);
  const lag = q(1, 2).mul(200).sub(q(1, 2).mul(80)); eqQ(lag, 60, "+60");
  assert.equal(keyOf("h-exploits", "ex-fresh"), lag.gt(0) ? "call" : "fold");
  const hands = { "ex-guided": ["9h", "9c", "Kh", "8d", "5c", "3s", "2h"], "ex-practice": ["Th", "9d", "Ts", "7h", "4c", "3d", "2c"], "ex-fresh": ["Jc", "Jd", "Ad", "9s", "6h", "4c", "2d"] };
  for (const cards of Object.values(hands)) assert.equal(ev(cards).rank, RANK.pair, "a one-pair bluff-catcher or medium pair");
  assert.equal(whyKey("h-exploits"), "folds");
});

check("g-toy-games: Kuhn poker verified by best response, and the same rates at the table", () => {
  for (const alpha of [q(0), q(1, 6), q(1, 3)]) {
    const p1 = kuhnP1(alpha);
    eqQ(kuhnValue(p1, KUHN_P2), q(-1, 18), `value at α=${alpha}`);
    const br1 = pures().map((a) => kuhnValue({ b: a.slice(0, 3), c: a.slice(3) }, KUHN_P2)).reduce((x, y) => (y.gt(x) ? y : x));
    const br2 = pures().map((a) => kuhnValue(p1, { c: a.slice(0, 3), b: a.slice(3) })).reduce((x, y) => (y.lt(x) ? y : x));
    eqQ(br1, q(-1, 18), "no first-player deviation gains"); eqQ(br2, q(-1, 18), "no second-player deviation gains");
    if (alpha.gt(0)) eqQ(alpha.div(alpha.mul(4)), q(1, 4), "1 bet in 4 is a bluff");
  }
  // "Sometimes": against the queen's reply to never and always, the jack's best rate is strictly between.
  const jBluff = (callQ) => q(1, 2).mul(q(callQ).mul(-2).add(q(1).sub(callQ))).add(q(1, 2).mul(-2)); // vs Q (calls callQ) and K (always calls)
  eqQ(jBluff(q(1, 3)), -1, "the jack's bet is worth −1 against the queen calling 1/3"); // checking the jack is always −1
  assert.ok(jBluff(0).gt(-1) && jBluff(1).lt(-1), "never-calling rewards the bluff, always-calling punishes it");
  assert.equal(keyOf("g-toy-games", "tg-turn"), "sometimes");
  eqQ(bluffShare(2, 1), q(1, 4), "Kuhn 1 ÷ (2 + 2)"); eqQ(bluffShare(100, 50), q(1, 4), "half pot at the table");
  assert.equal(keyOf("g-toy-games", "tg-guided"), "quarter");
  eqQ(mdf(100, 50), q(2, 3), "keep 2/3"); eqQ(mdf(2, 1), q(2, 3), "Kuhn's caller");
  eqQ(q(1, 3).add(1).div(2), q(2, 3), "against the jack's bluff the queen and king call 2/3");
  assert.equal(keyOf("g-toy-games", "tg-practice"), "two-thirds");
  eqQ(q(0).mul(200).sub(q(1).mul(50)), -50, "calling a bettor who never bluffs loses 50");
  assert.equal(keyOf("g-toy-games", "tg-fresh"), "fold");
  assert.equal(whyKey("g-toy-games"), "mix");
  // Never bluffing: his queen's best reply to a bet is to fold; always bluffing: to call.
  const qCall = (jBets) => (jBets ? q(1, 2).mul(2).add(q(1, 2).mul(-2)) : q(-2));
  assert.ok(qCall(false).lt(-1) && qCall(true).gt(-1));
});

check("g-balance: bluffs ÷ all bets = bet ÷ (pot + 2·bet), and the caller is indifferent", () => {
  for (const [spotId, pot, bet, value] of [["ba-turn", 120, 80, 25], ["ba-guided", 100, 100, 20], ["ba-practice", 100, 50, 24], ["ba-fresh", 90, 60, 20]]) {
    const s = bluffShare(pot, bet);
    const bluffs = q(value).mul(s).div(q(1).sub(s)); assert.equal(bluffs.d, 1n, `${spotId} whole bluffs`);
    assert.equal(keyOf("g-balance", spotId), `bluffs-${bluffs}`);
    const total = bluffs.add(value);
    eqQ(bluffs.div(total).mul(pot + bet).sub(q(value).div(total).mul(bet)), 0, `${spotId} call worth 0`);
    eqQ(q(pot + bet, bet), q(value).div(bluffs), `${spotId} value : bluffs = (pot + bet) : bet`);
  }
  eqQ(bluffShare(120, 80), q(2, 7), "2/7"); eqQ(beFold(120, 80), q(2, 5), "the near-miss uses 2/5");
  eqQ(bluffShare(100, 50), q(1, 4)); eqQ(bluffShare(100, 100), q(1, 3)); eqQ(bluffShare(100, 200), q(2, 5));
  assert.equal(Number(q(2000, 35).num().toFixed(1)), 57.1); assert.equal(Number(q(8 * 150, 28).num().toFixed(1)), 42.9);
  assert.equal(whyKey("g-balance"), "ratio");
});

check("g-gto-to-exploit: one formula, a measured input, and the weight of the evidence", () => {
  const callPot = (s) => q(s).mul(200).sub(q(1).sub(s).mul(100));
  eqQ(callPot(q(1, 3)), 0, "balanced"); eqQ(callPot("0.1"), -70, "under-bluffer"); eqQ(callPot("0.5"), 50, "over-bluffer");
  assert.equal(keyOf("g-gto-to-exploit", "ge-guided"), "fold"); assert.equal(keyOf("g-gto-to-exploit", "ge-practice"), "call");
  const p5 = q(2, 3).pow(5), p15 = q(2, 3).pow(15), p20 = q(2, 3).pow(20);
  eqQ(p5, q(32, 243), "(2/3)^5"); assert.equal(pct(p5), 13.2); assert.equal(pct(p15, 2), 0.23); assert.equal(pct(p20, 3), 0.03);
  // Weak evidence (a balanced bettor shows it more than 5% of the time) keeps the default call;
  // strong evidence (under 1%) moves to the exploit, a fold.
  const decide = (p) => (p.gt(q(1, 20)) ? "call" : p.lt(q(1, 100)) ? "fold" : null);
  assert.equal(keyOf("g-gto-to-exploit", "ge-turn"), decide(p5)); assert.equal(keyOf("g-gto-to-exploit", "ge-fresh"), decide(p20));
  assert.equal(whyKey("g-gto-to-exploit"), "weak");
});

check("y-bankroll: buy-ins and the toy model's ruin rows", () => {
  const ruin = (n) => q(45, 55).pow(n);
  eqQ(q(45, 55), q(9, 11), "9/11");
  assert.deepEqual([5, 10, 20].map((n) => pct(ruin(n))), [36.7, 13.4, 1.8]); assert.equal(pct(ruin(40), 3), 0.033);
  eqQ(q("0.55").sub("0.45"), q(1, 10), "edge");
  assert.equal(keyOf("y-bankroll", "br-turn"), ruin(5).gt(0) ? "yes" : "no");
  assert.equal(keyOf("y-bankroll", "br-guided"), `bi-${2000 / 100}`);
  const pick = (bank, games, under) => games.filter((g) => ruin(bank / g).lt(q(under, 100)));
  assert.deepEqual(pick(2000, [100, 50], 1), [50]); assert.equal(keyOf("y-bankroll", "br-practice"), "game-50");
  assert.deepEqual(pick(1500, [150, 75], 5), [75]); assert.equal(keyOf("y-bankroll", "br-fresh"), "game-75");
  assert.equal(whyKey("y-bankroll"), "cushion");
});

check("y-tilt: price against chance, whatever the streak", () => {
  const decide = (pot, bet, win) => (q(win).gt(price(pot, bet)) ? "call" : "fold");
  eqQ(price(100, 50), q(1, 4)); eqQ(callEV(100, 50, "0.3"), 10, "+10");
  assert.equal(keyOf("y-tilt", "tl-turn"), decide(100, 50, "0.3")); assert.equal(keyOf("y-tilt", "tl-guided"), decide(100, 50, "0.3"));
  eqQ(price(120, 60), q(1, 4)); eqQ(callEV(120, 60, "0.2"), -12, "−12"); assert.equal(keyOf("y-tilt", "tl-practice"), decide(120, 60, "0.2"));
  eqQ(price(150, 50), q(1, 5)); eqQ(callEV(150, 50, "0.25"), q("12.5"), "+12.5"); assert.equal(keyOf("y-tilt", "tl-fresh"), decide(150, 50, "0.25"));
  assert.equal(pct(q("0.7").pow(3)), 34.3); assert.equal(pct(q("0.7").pow(5)), 16.8);
  assert.equal(whyKey("y-tilt"), "math");
});

check("y-study: losses are a bad filter; the unsure decision goes to review", () => {
  eqQ(q(1).sub("0.3").mul(100), 70, "the +10 call loses 70 in 100");
  for (const spotId of ["sd-turn", "sd-guided", "sd-fresh"]) assert.match(keyOf("y-study", spotId), /^unsure/);
  assert.equal(keyOf("y-study", "sd-practice"), "later");
  assert.equal(whyKey("y-study"), "unsure");
});

check("o-multiway: hands ahead against random hands, and folds that multiply", () => {
  const hero = ["Ad", "Jc"], board = ["Jh", "7s", "3d"];
  const mine = ev([...hero, ...board]);
  const hands = pairsOf(unseen(hero, board));
  const ahead = hands.filter((h) => learn.compareHands ? learn.compareHands(ev([...h, ...board]), mine) > 0 : require("../src/eval/pokerEvaluator.js").compareHands(ev([...h, ...board]), mine) > 0).length;
  assert.equal(hands.length, 1081); assert.equal(ahead, 43); assert.equal(pct(q(43, 1081)), 4.0);
  // 7.8% and 11.5% (two and three opponents) are enumerated exactly by the plan script below.
  assert.equal(keyOf("o-multiway", "mw-guided"), "p11");
  const need = (pot, bet) => beFold(pot, bet);
  eqQ(need(90, 60), q(2, 5)); eqQ(need(90, 45), q(1, 3));
  const all = (f, n) => q(f).pow(n);
  assert.equal(keyOf("o-multiway", "mw-turn"), all("0.7", 2).gt(need(90, 60)) ? "bet" : "check"); eqQ(all("0.7", 2), q("0.49"), "49%");
  assert.equal(keyOf("o-multiway", "mw-practice"), all("0.6", 3).gt(need(90, 60)) ? "bet" : "check"); eqQ(all("0.6", 3), q("0.216"), "21.6%");
  assert.equal(keyOf("o-multiway", "mw-fresh"), all("0.6", 2).gt(need(90, 45)) ? "bet" : "check"); eqQ(all("0.6", 2), q("0.36"), "36%");
  eqQ(all("0.7", 3), q("0.343"), "three at 70%");
  assert.equal(whyKey("o-multiway"), "both");
});

check("o-heads-up: what waiting costs, and who acts when", () => {
  const cost = (players) => q(3, 2).div(players);
  assert.equal(Number(cost(9).num().toFixed(2)), 0.17); eqQ(cost(2), q(3, 4)); eqQ(cost(2).div(cost(9)), q(9, 2), "4.5 times");
  assert.equal(keyOf("o-heads-up", "hu-practice"), "bb-075");
  eqQ(cost(2).div(cost(6)), 3, "3 times six-handed"); assert.equal(keyOf("o-heads-up", "hu-fresh"), "x3");
  assert.equal(pct(q(78, 1326)), 5.9); assert.equal(13 * 6, 78);
  assert.equal(keyOf("o-heads-up", "hu-guided"), "button"); assert.equal(keyOf("o-heads-up", "hu-turn"), "wider");
  assert.equal(whyKey("o-heads-up"), "cost");
});

check("o-tournaments-icm: prize shares by the Harville recursion", () => {
  const now = icm([5000, 3000, 2000], PAY), win = icm([3000, 3000, 4000], PAY), lose = icm([7000, 3000, 0], PAY);
  assert.deepEqual(now.map((x) => pct(x)), [38.4, 32.8, 28.9]); eqQ(now.reduce((a, b) => a.add(b)), 1, "sum");
  assert.equal(pct(win[2]), 35.4); assert.equal(pct(lose[2]), 20.0);
  const avg = (i, w = q(1, 2)) => w.mul(win[i]).add(q(1).sub(w).mul(lose[i]));
  assert.equal(pct(avg(2)), 27.7); assert.ok(avg(2).lt(now[2])); assert.equal(keyOf("o-tournaments-icm", "ic-guided"), "fold");
  assert.equal(pct(avg(0)), 38.1); assert.ok(avg(0).lt(now[0])); assert.equal(keyOf("o-tournaments-icm", "ic-turn"), "loses");
  assert.equal(pct(avg(1)), 34.1); assert.ok(avg(1).gt(now[1])); assert.equal(keyOf("o-tournaments-icm", "ic-practice"), "gains");
  const fresh = avg(2, q(55, 100));
  assert.equal(pct(fresh), 28.5); assert.ok(fresh.lt(now[2])); assert.ok(q(55, 100).mul(4000).gt(2000), "chip-positive");
  assert.equal(keyOf("o-tournaments-icm", "ic-fresh"), "fold");
  // Recall: whose chips are each worth the most prize money.
  const perChip = now.map((x, i) => x.div([5000, 3000, 2000][i]));
  assert.ok(perChip[2].gt(perChip[1]) && perChip[1].gt(perChip[0]));
  assert.equal(whyKey("o-tournaments-icm"), "places");
});

check("o-six-max: players still to act behind each seat", () => {
  const SIX = ["UTG", "MP", "CO", "BTN", "SB", "BB"];
  const behind = (seat, folded = []) => SIX.slice(SIX.indexOf(seat) + 1).filter((s) => !folded.includes(s)).length;
  assert.equal(keyOf("o-six-max", "sm-turn"), `behind-${behind("CO")}`);
  assert.equal(keyOf("o-six-max", "sm-guided"), `behind-${behind("UTG")}`);
  assert.equal(keyOf("o-six-max", "sm-fresh"), `behind-${behind("MP", ["UTG"])}`);
  const fullBehind = (seatNumber) => 9 - seatNumber; // seat 1 is first to act at a full table of 9
  assert.equal(fullBehind(1), 8); assert.equal(fullBehind(4), behind("UTG"));
  assert.equal(keyOf("o-six-max", "sm-practice"), "seat-4");
  assert.equal(pct(q(40, 1326)), 3.0); assert.equal(6 * 4 + 16, 40, "JJ, QQ, KK, AA and AK: 24 + 16 combos");
  assert.equal(whyKey("o-six-max"), "behind");
});

check("o-live: the house-rule table (Poker TDA, as common house rules)", () => {
  const HOUSE = { oversizedChipFacingBet: "call", verbalInTurnBinding: true, stringBetCountsFirstMotion: true, tellsAreWeakEvidence: true };
  assert.equal(keyOf("o-live", "lv-turn"), HOUSE.oversizedChipFacingBet);
  assert.equal(keyOf("o-live", "lv-guided"), HOUSE.verbalInTurnBinding ? "call" : "raise");
  assert.equal(keyOf("o-live", "lv-practice"), HOUSE.stringBetCountsFirstMotion ? "first" : "all");
  assert.equal(keyOf("o-live", "lv-fresh"), HOUSE.tellsAreWeakEvidence ? "betting" : "shaking");
  const d = def("o-live");
  assert.match(d.assumptions, /common house rules/); assert.match(d.assumptions, /Poker TDA/); assert.match(d.assumptions, /weak evidence/);
  assert.match(d.stages[1].pause.spot.prompt, /^Facing a bet/, "the single-chip rule is worded for facing a bet");
  assert.equal(whyKey("o-live"), "no-word");
});

// ═══ recall cards ═══════════════════════════════════════════════════════════════════════════════
const recallAnswer = (id) => { const qn = recallEntry(id).question; return qn.choices[qn.answer]; };
check("recall cards of the later tracks: every answer recomputed, none the lesson's own spot", () => {
  const LATER = NODES.filter((n) => LATER_TRACKS.includes(n.track)).map((n) => n.id);
  for (const id of LATER) {
    const e = recallEntry(id);
    assert.ok(e.question, `${id} has a card`);
    const d = def(id);
    const prompts = [d.stages[1].pause?.spot?.prompt, ...Object.values(d.spots).map((s) => s.prompt)].filter(Boolean);
    assert.ok(!prompts.includes(e.question.prompt), `${id}: the card is not a lesson spot`);
  }
  assert.equal(recallAnswer("x-mdf"), String(mdf(100, 100)));
  assert.equal(recallAnswer("x-check-raise"), `About ${pct(q(100 - 30).div(90 + 100 + 100), 0)}%`);
  const plan = (pot, bet) => { let p = q(pot); let t = q(0); for (let i = 0; i < 3; i += 1) { const b = p.mul(q(bet, pot)); t = t.add(b); p = p.add(b.mul(2)); } return t; };
  assert.deepEqual(["Bet 50", "Bet 100", "Bet 200"].filter((c) => plan(200, Number(c.split(" ")[1])).eq(700)), [recallAnswer("x-barrels-blockers")]);
  assert.equal(recallAnswer("h-range-narrowing"), "60");
  assert.equal(recallAnswer("h-player-types"), "Nit");
  assert.equal(recallAnswer("h-exploits"), q("0.75").mul(100).sub(q("0.25").mul(100)).gt(0) && q("0.75").gt(beFold(100, 100)) ? "Bluff" : "Check");
  assert.equal(recallAnswer("g-toy-games"), q(0).mul(300).sub(q(1).mul(100)).lt(0) ? "Fold" : "Call");
  assert.equal(recallAnswer("g-balance"), String(bluffShare(100, 200)));
  assert.equal(recallAnswer("g-gto-to-exploit"), `About ${pct(q(2, 3).pow(3), 0)}%`);
  assert.equal(recallAnswer("y-tilt"), q("0.25").gt(price(120, 40)) ? "Call" : "Fold");
  assert.equal(recallAnswer("y-study"), "The unsure check that won");
  assert.ok(q("0.5").pow(3).lt(q(1, 5))); assert.equal(recallAnswer("o-multiway"), `No: all three fold only ${pct(q("0.5").pow(3))}%`);
  assert.equal(recallAnswer("o-heads-up"), "The button");
  assert.equal(recallAnswer("o-tournaments-icm"), "The short stack’s");
  assert.equal(recallAnswer("o-six-max"), "8");
  assert.equal(recallAnswer("o-live"), "A raise", "a verbal raise in turn is binding");
});

// ═══ the plan's check script (the plan numbers: narrowing, Kuhn, 7.8% / 11.5%, bluffing 102 / 77) ═══
check("the plan's check script passes", () => {
  const run = spawnSync(process.execPath, [join(ROOT, "docs/v1-feature/academy/plans/check-postflop-to-formats.mjs")], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const text = readFileSync(join(ROOT, "docs/v1-feature/academy/plans/check-postflop-to-formats.mjs"), "utf8");
  for (const needle of ["2 opponents exact", "3 opponents exact", "narrow 186 → 162 → 118 → 85 → 82", "Kuhn value at", "ICM shares 38.4 / 32.8 / 28.9"]) assert.ok(text.includes(needle), needle);
});

console.log(`academyLessonsB ok (${checks} checks, ${ACADEMY_V2_LATER_LESSONS.length} new lessons + 2 shipped)`);
