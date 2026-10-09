// The early tracks of the academy (welcome, rules, board, math, preflop, postflop): the why steps and
// v2 yourTurn pauses on the shipped definitions, and every answer key, recomputed here with the
// shared evaluator, exact pot-odds arithmetic, or the plan check script line that asserts it.
//   node test/academyEarly.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as learn from "../src/learn/index.mjs";
import { lessonRepeats } from "../scripts/lib/stageRepeats.mjs";

const require = createRequire(import.meta.url);
const { evaluateHand, compareHands } = require("../src/eval/pokerEvaluator.js");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILMS = JSON.parse(readFileSync(join(ROOT, "test/fixtures/academyFilmsEarly.json"), "utf8")).films;
const PLANS = join(ROOT, "docs/v1-feature/academy/plans");
const { FILM_FIRST_LESSONS, NODES, lessonHands, decisionStages, nodeOfLesson, filmIdOfNode, filmFolderOfNode, completingCards, whyStages, whyResult } = learn;
const EARLY = ["welcome", "rules", "board", "math", "preflop", "postflop"];

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };
const keysOf = async (node) => (await import(`../answerKeys/${node}.mjs`)).default;

// ── cards and arithmetic ────────────────────────────────────────────────────────────────────────
const SYMBOL = { s: "♠", h: "♥", d: "♦", c: "♣" };
const ev = (cards) => evaluateHand(cards.map((c) => ({ rank: c[0], suit: SYMBOL[c[1]] })));
const DECK = [..."23456789TJQKA"].flatMap((r) => [..."shdc"].map((s) => r + s));
const unseen = (known) => DECK.filter((c) => !known.includes(c));
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
// The price of a call: call ÷ (pot before + bet + call).
const price = (pot, bet, call = bet) => call / (pot + bet + call);
// A plan check script holds this exact assertion line (and the script passes, below).
const scriptText = (name) => readFileSync(join(PLANS, name), "utf8");
const asserts = (name, snippet) => assert.ok(scriptText(name).includes(snippet), `${name} asserts ${snippet}`);
const MP = "check-math-preflop.mjs";
// A key is one of the spot's own answers: a band, a choice, a value inside the range, or five cards.
const kindOf = (spot) => spot.kind ?? spot.decision;
const keyFits = (spot, k) => kindOf(spot) === "estimate" ? spot.bands.some((b) => (b.id ?? b) === k.band)
  : kindOf(spot) === "action" ? spot.choices.some((c) => (c?.id ?? c) === k.action)
    : kindOf(spot) === "count" ? Number.isInteger(k.value) && k.value >= spot.range[0] && k.value <= spot.range[1]
      : kindOf(spot) === "best-five" ? k.cards?.length === 5 && k.cards.every((c) => [...spot.hero, ...spot.board].includes(c)) : false;
const PF = "check-postflop-to-formats.mjs";

// ── the shipped definitions in the early tracks ─────────────────────────────────────────────────
const shipped = FILM_FIRST_LESSONS.filter((d) => EARLY.includes(nodeOfLesson(d.id)?.track));

check("18 shipped definitions sit in the early tracks", () => {
  assert.equal(shipped.length, 18);
});

for (const def of shipped) {
  const node = nodeOfLesson(def.id).id;
  const keys = await keysOf(node);
  check(`${def.id}: one why step, right after the film, with its key kept apart`, () => {
    const whys = whyStages(def);
    assert.equal(whys.length, 1);
    const [why] = whys;
    assert.equal(why.index, 2, "right after the film");
    assert.equal(why.options.length, 3);
    assert.ok(why.prompt && why.options.every((o) => o.id && o.text && o.fix));
    assert.ok(why.options.every((o) => !("correct" in o)), "correct never ships");
    assert.deepEqual([keys.lessonId, keys.node, keys.contentVersion, keys.additions], [def.id, node, def.version, true]);
    assert.deepEqual(keys.stageShift, { from: 2, by: 1 });
    assert.equal(keys.why.stage, 2);
    assert.deepEqual(keys.why.options, why.options.map((o) => o.id));
    assert.ok(keys.why.options.includes(keys.why.key.option));
    assert.ok(keys.why.options.includes(keys.why.misconception) && keys.why.misconception !== keys.why.key.option);
    assert.equal(whyResult(why, keys.why.key.option, keys.why.key).correct, true);
    assert.ok(why.options.filter((o) => o.id !== keys.why.key.option).every((o) => whyResult(why, o.id, keys.why.key).correct === false));
  });
  check(`${def.id}: the v2 film's yourTurn pause, where that film has one`, () => {
    const film = def.stages[1];
    const anchors = FILMS[node];
    assert.equal(anchors.film, filmFolderOfNode(node), "the fixture names the render folder");
    if (anchors.yourTurn == null) {
      assert.ok(!film.pause?.film, "no v2 pause");
      assert.equal(keys.film, undefined);
      return;
    }
    const p = film.pause;
    assert.deepEqual([p.at, p.anchor, p.film], [anchors.yourTurn, "yourTurn", anchors.film]);
    assert.ok(p.at < anchors.duration && p.spotId && p.spot.prompt && p.spot.explanation);
    assert.deepEqual([keys.film.stage, keys.film.at, keys.film.filmId, keys.film.spotId, keys.film.decision], [1, p.at, p.film, p.spotId, p.spot.decision]);
    assert.ok(keyFits(p.spot, keys.film.key), "the pause key is one of its own answers");
  });
}

// ── the why keys and the pause answers, recomputed ──────────────────────────────────────────────
const key = async (id) => (await keysOf(nodeOfLesson(id).id)).film.key;
check("why: the numbers the reasons quote", () => {
  // a full house is rarer than a flush (exact counts of five-card hands)
  const C = (n, k) => { let r = 1; for (let i = 0; i < k; i += 1) r = (r * (n - i)) / (i + 1); return r; };
  const fullHouse = 13 * C(4, 3) * 12 * C(4, 2);
  const flush = C(13, 5) * 4 - 40;
  assert.deepEqual([fullHouse, flush], [3744, 5108]);
  assert.ok(fullHouse < flush);
  assert.ok(near(price(200, 25), 0.1), "outs: 25 ÷ 250");
  assert.ok(near(price(120, 40), 0.2) && 8 * 2 < 20, "rule of 2: 16% under a 20% price");
  assert.equal(0.35 * 120, 42);
  assert.ok(near(price(150, 50), 0.2) && near(50 / 200, 0.25) && near(50 / 150, 1 / 3), "pot odds: 20%, not the slips");
  assert.ok(near(price(100, 75), 0.3) && near(75 / (250 + 250), 0.15), "implied odds: 30% direct, 15% with the river 250");
  assert.ok(near(0.3 * (200 + 50 + 50) - 50, 40), "EV +40");
  assert.ok(near(Math.min(300, 900) / 300, 1), "SPR 1");
  assert.ok(near(15 / 55, 0.2727272727272727) && Math.round(1000 * 15 / 55) / 10 === 27.3, "blind defense: 15 ÷ 55");
});

// The pauses: the answers the v2 films reveal.
const pauses = {
  "positions-workspace-v1": async () => {
    // After the flop the first seat left of the button acts first; the button side acts last.
    const POSTFLOP = ["SB", "BB", "UTG", "MP", "CO", "BTN"];
    const order = POSTFLOP.filter((s) => ["CO", "BB"].includes(s));
    assert.equal(order.at(-1), "CO");
    assert.deepEqual(await key("positions-workspace-v1"), { band: "co" });
  },
  "outs-workspace-v1": async () => {
    assert.equal(completingCards(["Qd", "Jd"], ["Ts", "9c", "3h"], "straight").length, 8);
    assert.equal((await key("outs-workspace-v1")).value, 8);
  },
  "rule-2-4-workspace-v1": async () => {
    assert.equal(completingCards(["Th", "9h"], ["8c", "7d", "2s"], "straight").length, 8);
    // all-in on the flop: both cards are seen for this one price, so ×4: 32%
    assert.deepEqual(await key("rule-2-4-workspace-v1"), { band: "x4" });
  },
  "equity-workspace-v1": async () => {
    assert.equal(0.4 * 150, 60);
    assert.deepEqual(await key("equity-workspace-v1"), { band: "about-60" });
  },
  "pot-odds-workspace-v2": async () => {
    assert.ok(price(100, 100) > 0.3, "33.3% price against a 30% chance");
    assert.deepEqual(await key("pot-odds-workspace-v2"), { action: "fold" });
  },
  "implied-odds-workspace-v1": async () => {
    const outs = completingCards(["Jd", "Td"], ["Qc", "8h", "3s", "2c"], "straight").length;
    assert.equal(outs, 4);
    const needed = 20 / (outs / 46) - (60 + 20 + 20);
    assert.ok(near(needed, 130) && needed > 90);
    assert.deepEqual(await key("implied-odds-workspace-v1"), { action: "fold" });
  },
  "ev-workspace-v1": async () => {
    const outs = completingCards(["Ah", "Th"], ["8h", "6c", "3h", "Ks"], "flush").length;
    assert.equal(outs, 9);
    const value = (outs / 46) * (150 + 40 + 40) - 40;
    assert.ok(near(value, 5) && value > 0);
    assert.deepEqual(await key("ev-workspace-v1"), { action: "call" });
  },
  "spr-workspace-v1": async () => {
    assert.equal(Math.min(1000, 240) / 120, 2);
    assert.equal((await key("spr-workspace-v1")).value, 2);
  },
  "starting-hands-workspace-v1": async () => {
    asserts(MP, 'check(n, "practice 9♥8♥ BTN in chart", inChart(CHART.BTN, ["9h", "8h"]), true);');
    assert.deepEqual(await key("starting-hands-workspace-v1"), { action: "raise" });
  },
  "rfi-position-workspace-v1": async () => {
    asserts(MP, 'check(n, "practice 7♥6♥ MP out", inChart(CHART.MP, ["7h", "6h"]), false);');
    assert.deepEqual(await key("rfi-position-workspace-v1"), { action: "fold" });
  },
  "blind-defense-workspace-v1": async () => {
    asserts(MP, 'check(n, "transfer BB owes 30", 40 - 10, 30);');
    assert.equal((await key("blind-defense-workspace-v1")).value, 40 - 10);
  },
  "three-betting-workspace-v1": async () => {
    asserts(MP, 'check(n, "value QQ+ AK", 18 + 16, 34);');
    asserts(MP, 'check(n, "OOP 3-bet to 100", 25 * 4, 100);');
    assert.deepEqual(await key("three-betting-workspace-v1"), { action: "raise" });
  },
  "ranges-workspace-v1": async () => {
    asserts(PF, 'check("transfer pair+ 93", t2.strong + t2.top + t2.pair === 93)');
    assert.equal(Math.round(100 * 93 / 146), 64);
    assert.deepEqual(await key("ranges-workspace-v1"), { band: "about-64" });
  },
  "board-texture-workspace-v1": async () => {
    asserts(PF, 'check("QQ5 raiser", r3.n === 215 && r3.strong + r3.top === 42');
    asserts(PF, 'check("QQ5 caller", c3.n === 170 && c3.strong + c3.top === 13');
    assert.ok(42 / 215 > 13 / 170);
    assert.deepEqual(await key("board-texture-workspace-v1"), { band: "raiser" });
  },
  "cbetting-workspace-v1": async () => {
    asserts(PF, 'check("883 raiser", r5.n === 235 && r5.strong + r5.top === 46');
    assert.ok(46 / 235 > 22 / 171, "19.6% for the raiser against 12.9% for the caller");
    assert.deepEqual(await key("cbetting-workspace-v1"), { action: "bet" });
  },
  "bet-sizing-workspace-v1": async () => {
    // The worse pairs call the third: a third of the pot offers 1/5 and needs folds 1 time in 4.
    assert.ok(near(price(3, 1, 1), 1 / 5) && near(1 / (3 + 1), 1 / 4));
    assert.deepEqual(await key("bet-sizing-workspace-v1"), { band: "third" });
  },
};
for (const def of shipped) {
  const keys = await keysOf(nodeOfLesson(def.id).id);
  if (!keys.film) continue;
  assert.ok(pauses[def.id], `${def.id} has a pause check`);
  await pauses[def.id]();
  checks += 1;
}

// ── the 22 node-id definitions (lessons/academy, ACADEMY_V2_EARLY_LESSONS) ──────────────────────
const { ACADEMY_V2_EARLY_LESSONS, academyLesson, validateDefinitionHands, expandScript, initialState, stateAfter, runUntilBlocked, lessonOfNode, lessonSlot, learnPath } = learn;
const pct2 = (n, d) => (Math.round((1000 * n) / d) / 10).toFixed(1);
const WHO_IDS = ["you", "andy", "split"];
const winnerOf = (spot) => { const x = compareHands(ev([...spot.hero, ...spot.board]), ev([...spot.versus, ...spot.board])); return x > 0 ? "you" : x < 0 ? "andy" : "split"; };
const RANK = Object.fromEntries(["High Card", "Pair", "Two Pair", "Three of a Kind", "Straight", "Flush", "Full House", "Four of a Kind", "Straight Flush"].map((n) => [n, ev(n === "High Card" ? ["2c", "5d", "9h", "Js", "Kc"] : n === "Pair" ? ["2c", "2d", "9h", "Js", "Kc"] : n === "Two Pair" ? ["2c", "2d", "9h", "9s", "Kc"] : n === "Three of a Kind" ? ["2c", "2d", "2h", "9s", "Kc"] : n === "Straight" ? ["5c", "6d", "7h", "8s", "9c"] : n === "Flush" ? ["2c", "5c", "9c", "Jc", "Kc"] : n === "Full House" ? ["2c", "2d", "2h", "9s", "9c"] : n === "Four of a Kind" ? ["2c", "2d", "2h", "2s", "9c"] : ["5c", "6c", "7c", "8c", "9c"]).rank]));
const combos = (pool) => { const out = []; for (let i = 0; i < pool.length; i += 1) for (let j = i + 1; j < pool.length; j += 1) out.push([pool[i], pool[j]]); return out; };
const bestFive = (seven) => {
  let best = null; let bestSet = [];
  for (let a = 0; a < 7; a += 1) for (let b = a + 1; b < 7; b += 1) {
    const five = seven.filter((_, i) => i !== a && i !== b);
    const h = ev(five); const c = best ? compareHands(h, best) : 1;
    if (c > 0) { best = h; bestSet = [five]; } else if (c === 0) bestSet.push(five);
  }
  return bestSet;
};
// The nuts on a board: the two-card hands (any unseen-to-the-board cards) that make the best hand.
const nutsOf = (board) => {
  let best = null; let hands = [];
  for (const h of combos(unseen(board))) { const x = ev([...h, ...board]); const c = best ? compareHands(x, best) : 1; if (c > 0) { best = x; hands = [h]; } else if (c === 0) hands.push(h); }
  return { best, hands };
};
const possible = (board) => new Set(combos(unseen(board)).map((h) => ev([...h, ...board]).name));
const earlyKeys = async (id) => (await import(`../answerKeys/${id}.mjs`)).default;
const neutral = (spot) => spot.decision === "action" ? { action: spot.choices.includes("call") ? "call" : spot.choices[0], correct: null } : { response: {}, correct: null };
const walkHand = (def, handId) => {
  const h = def.hands[handId]; let state = initialState(h); let next = 0; const answers = {}; const performed = []; const reached = [];
  for (let g = 0; g < 50; g += 1) {
    const r = runUntilBlocked(h, state, next, { answers, performed }, { reduce: true }); state = r.state; next = r.next;
    if (!r.blocked) break;
    if (r.blocked.kind === "decide") { reached.push(r.blocked.spotId); answers[r.blocked.spotId] = neutral(def.spots[r.blocked.spotId]); }
    else if (r.blocked.kind === "action") performed.push(r.blocked.index);
    else return { finished: false, reached };
  }
  return { finished: next === expandScript(h).length, reached };
};
const walkKeys = (value, visit, trail = "") => {
  if (Array.isArray(value)) value.forEach((x, i) => walkKeys(x, visit, `${trail}[${i}]`));
  else if (value && typeof value === "object") for (const [k, x] of Object.entries(value)) { visit(k, `${trail}.${k}`); walkKeys(x, visit, `${trail}.${k}`); }
};

check("every early-track node with no shipped lesson has a node-id definition, registered", () => {
  const missing = NODES.filter((n) => EARLY.includes(n.track) && lessonOfNode(n.id) === n.id).map((n) => n.id);
  assert.deepEqual(ACADEMY_V2_EARLY_LESSONS.map((d) => d.id).sort(), missing.sort());
  assert.equal(missing.length, 22);
  for (const d of ACADEMY_V2_EARLY_LESSONS) assert.equal(academyLesson(d.id), d);
  assert.equal(academyLesson("pot-odds-workspace-v2"), FILM_FIRST_LESSONS.find((d) => d.id === "pot-odds-workspace-v2"));
  assert.equal(learnPath(academyLesson).total, 20 + 22 + 17, "the shipped 20, the early 22 and the later 17");
});

for (const def of ACADEMY_V2_EARLY_LESSONS) {
  const node = def.id;
  const keys = await earlyKeys(node);
  const anchors = FILMS[node];
  check(`${node}: shape, film, why and takeaway`, () => {
    assert.deepEqual(def.stages.map((s) => s.kind), ["welcome", "film", "why", "decision", "decision", "decision", "takeaway"]);
    assert.deepEqual(def.stages.slice(3, 6).map((s) => s.role), ["guided", "practice", "fresh"]);
    // Content version 2 (2026-10-09): the guided hand left the film's own question, and an end film
    // hands off instead of asking it again. Version 1 stays registered on the server.
    // Content version 3 for w-what-is-poker (2026-10-09): the welcome rebuild's v3 film, four pauses.
    assert.deepEqual([def.node, def.version, def.flow, def.format, def.filmVersion], [node, node === "w-what-is-poker" ? 3 : 2, "film-first", "academy-v2", 2]);
    assert.equal(def.access, lessonSlot(node).access, "the curriculum's tier");
    assert.deepEqual(validateDefinitionHands(def), []);
    for (const hand of lessonHands(def)) { const w = walkHand(def, hand.hand); assert.ok(w.finished, `${hand.hand} finishes`); assert.deepEqual(w.reached, [hand.hand]); }
    const film = def.stages[1];
    assert.equal(film.media, filmIdOfNode(node));
    assert.equal(def.media, filmIdOfNode(node));
    assert.equal(film.pause.film, filmIdOfNode(node), "the media id, not the render folder");
    assert.equal(film.pause.at, anchors.yourTurn, "canon.yourTurn, or null");
    if (anchors.pauses) {
      // Several in-film pauses (filmV2 multiPause): one per film anchor, in film order, the first the stage's own.
      assert.equal(film.pause.anchor, "pauses");
      assert.deepEqual(film.pause.pauses.map((p) => p.anchor), Object.keys(anchors.pauses));
      assert.deepEqual([film.pause.spotId, film.pause.spot], [film.pause.pauses[0].spotId, film.pause.pauses[0].spot]);
      for (const p of film.pause.pauses) assert.match(p.spotId, /-turn(-\w+)?$/, "each pause is its own <prefix>-turn spot");
    } else assert.equal(film.pause.anchor, anchors.yourTurn == null ? "end" : "yourTurn");
    // Every end film here asks its question first and answers it itself: the lesson skips the end ask.
    assert.equal(film.pause.endAsk, anchors.yourTurn == null ? "skip" : undefined, "an end film hands off");
    const guided = def.stages[3].spotId;
    assert.ok(film.pause.spot && film.pause.spot !== def.spots[guided], "the film's question is its own spot");
    assert.deepEqual(lessonRepeats(def), [], "no step repeats the film's question or another step");
    assert.equal(film.pause.spotId, guided.replace(/-guided$/, "-turn"));
    const why = def.stages[2];
    assert.equal(why.options.length, 3);
    assert.ok(why.prompt && why.options.every((o) => o.id && o.text && o.fix && !("correct" in o)));
    const take = def.stages.at(-1);
    if (anchors.ruleCard) assert.deepEqual(take.ruleCard, anchors.ruleCard, "the film's RuleCard");
    else assert.deepEqual(take.ruleCard, { lines: anchors.ruleCaptions, sub: null }, "the film's rule captions");
    assert.ok(take.rule && take.recapLabels.length === 3);
    walkKeys(def, (k, trail) => assert.ok(!["key", "correct", "correctAction", "answer", "misconception"].includes(k), `${node}${trail} ships a key`));
    // Opponent cards ship only where the question already names them (a showdown read), and then
    // a showdown step turns them up right before the decision.
    for (const [id, hand] of Object.entries(def.hands)) {
      const versus = def.spots[id]?.versus;
      if (!versus) { assert.deepEqual(hand.opponent || {}, {}, `${id}: no opponent cards ship on a hand`); continue; }
      assert.deepEqual(hand.opponent, { reveal: versus }, `${id}: the reveal is the cards the question names`);
      const at = hand.script.findIndex((step) => step.do === "decide");
      assert.equal(hand.script[at - 1]?.do, "showdown", `${id}: the cards turn up right before the decision`);
    }
    const [g, , f] = def.stages.slice(3, 6).map((s) => def.spots[s.spotId]);
    assert.notEqual(JSON.stringify([f.hero, f.board, f.potBefore, f.bet, f.prompt]), JSON.stringify([g.hero, g.board, g.potBefore, g.bet, g.prompt]), "the fresh spot is changed");
  });
  check(`${node}: the key file matches the definition`, () => {
    assert.deepEqual([keys.lessonId, keys.node, keys.contentVersion, keys.access], [node, node, def.version, def.access]);
    assert.deepEqual(keys.stages.map((s) => s.spotId || s.kind), def.stages.map((s) => s.spotId || s.kind));
    // The film's own question keeps its key (an end film that skips its ask never sends one).
    assert.deepEqual([keys.film.stage, keys.film.at, keys.film.spotId], [1, def.stages[1].pause.at, def.stages[1].pause.spotId]);
    assert.ok(keyFits(def.stages[1].pause.spot, keys.film.key), "the film key is one of its question's answers");
    // The other pauses' keys (filmPauses), each on the film stage, its spot id and anchor the definition's.
    const rest = (def.stages[1].pause.pauses || []).slice(1);
    assert.deepEqual((keys.filmPauses || []).map((k) => [k.stage, k.spotId, k.anchor]), rest.map((p) => [1, p.spotId, p.anchor]));
    for (const [i, k] of (keys.filmPauses || []).entries()) {
      assert.ok(keyFits(rest[i].spot, k.key), `${k.spotId} key is one of its answers`);
      assert.equal(k.predict === true, rest[i].predict === true, `${k.spotId}: a prediction on both sides`);
    }
    // One lit button per action pause, and it is the key: the film's hand cannot be lost.
    for (const [i, p] of (def.stages[1].pause.pauses || []).entries()) {
      if (p.spot.decision !== "action") continue;
      const k = i === 0 ? keys.film : keys.filmPauses[i - 1];
      assert.deepEqual(p.spot.enabled, [k.key.action], `${p.spotId}: only the key's button is lit`);
    }
    const ids = def.stages[2].options.map((o) => o.id);
    assert.deepEqual(keys.why.options, ids);
    assert.ok(ids.includes(keys.why.key.option) && ids.includes(keys.why.misconception) && keys.why.misconception !== keys.why.key.option);
    for (const [id, k] of Object.entries(keys.spots)) {
      assert.equal(def.stages[k.stage].spotId, id);
      assert.ok(keyFits(def.spots[id], k.key), `${id} key is one of its answers`);
    }
  });
}

// Every key, recomputed.
const K = {};
for (const def of ACADEMY_V2_EARLY_LESSONS) K[def.id] = { def, keys: await earlyKeys(def.id) };
const keyOf = (node, spotId) => K[node].keys.spots[spotId].key;
const spotOf = (node, spotId) => K[node].def.spots[spotId];

check("who wins: every showdown key is the evaluator's", () => {
  let n = 0;
  for (const { def, keys } of Object.values(K)) for (const [id, spot] of Object.entries(def.spots)) {
    if (!spot.versus || spot.decision !== "estimate" || !spot.bands.every((b) => WHO_IDS.includes(b.id))) continue;
    assert.equal(keys.spots[id].key.band, winnerOf(spot), id);
    n += 1;
  }
  assert.equal(n, 10);
});

check("best five: the unique best five of the seven", () => {
  for (const [node, id] of [["r-best-five", "b5-guided"], ["r-best-five", "b5-fresh"]]) {
    const spot = spotOf(node, id);
    const best = bestFive([...spot.hero, ...spot.board]);
    assert.equal(best.length, 1, `${id}: one best five`);
    assert.deepEqual([...best[0]].sort(), [...keyOf(node, id).cards].sort());
  }
  // the fresh five uses exactly one hole card
  assert.equal(keyOf("r-best-five", "b5-fresh").cards.filter((c) => spotOf("r-best-five", "b5-fresh").hero.includes(c)).length, 1);
  // r-best-five v2: the film's question (pocket aces on 9-8-7-6-5) is its own spot; none of the aces play.
  const b5film = K["r-best-five"].def.stages[1].pause.spot;
  const b5filmBest = bestFive([...b5film.hero, ...b5film.board]);
  assert.equal(b5filmBest.length, 1);
  assert.deepEqual([...b5filmBest[0]].sort(), [...K["r-best-five"].keys.film.key.cards].sort());
  assert.equal(K["r-best-five"].keys.film.key.cards.filter((c) => b5film.hero.includes(c)).length, 0);
  // guided: Q♣ Q♦ on K♥ J♥ 9♥ 6♥ 2♥, the board's flush is the best five: none of the queens play.
  const b5g = spotOf("r-best-five", "b5-guided");
  assert.equal(ev(keyOf("r-best-five", "b5-guided").cards).name, "Flush");
  assert.equal(keyOf("r-best-five", "b5-guided").cards.filter((c) => b5g.hero.includes(c)).length, 0);
  // practice: Q♠ 8♦ against Q♣ J♥ on Q♥ T♠ 7♦ 5♣ 3♠, the same pair: his jack kicker wins.
  const b5p = spotOf("r-best-five", "b5-practice");
  assert.deepEqual([ev([...b5p.hero, ...b5p.board]).name, ev([...b5p.versus, ...b5p.board]).name], ["One Pair", "One Pair"]);
  assert.equal(winnerOf(b5p), "andy"); assert.equal(keyOf("r-best-five", "b5-practice").band, "andy");
});

check("welcome: counts and the plan's comprehension answers", () => {
  // The film's own question in each welcome lesson (content version 2: it left the guided hand).
  const filmSpot = (node) => K[node].def.stages[1].pause.spot;
  const filmKey = (node) => K[node].keys.film.key;
  // River counts: [rivers, wins for the hero, ties], every unseen card once.
  const riverCount = (s) => {
    const rivers = unseen([...s.hero, ...s.versus, ...s.board]);
    const res = rivers.map((r) => compareHands(ev([...s.hero, ...s.board, r]), ev([...s.versus, ...s.board, r])));
    return [rivers.length, res.filter((x) => x > 0).length, res.filter((x) => x === 0).length];
  };
  const loses = (s, r) => compareHands(ev([...s.hero, ...s.board, r]), ev([...s.versus, ...s.board, r])) < 0;
  // w-luck-and-skill, the film: 26 of 44 rivers win for A♣ J♦ against Q♥ 9♥ on J♥ T♥ 4♣ 2♠, no ties.
  assert.deepEqual(riverCount(filmSpot("w-luck-and-skill")), [44, 26, 0]);
  assert.equal(filmKey("w-luck-and-skill").value, 26);
  assert.ok(near((1000 * 26) / 44 - 500, 90.9090909090909));
  // guided: A♦ A♣ against 8♠ 7♠ on K♠ 9♠ 2♦ 4♥: only the 9 spades lose, 35 of 44 win.
  const s = spotOf("w-luck-and-skill", "wl-guided");
  assert.deepEqual(riverCount(s), [44, 35, 0]);
  assert.deepEqual(unseen([...s.hero, ...s.versus, ...s.board]).filter((r) => loses(s, r)).map((r) => r[1]), Array(9).fill("s"));
  assert.equal(keyOf("w-luck-and-skill", "wl-guided").value, 35);
  // practice: the same hand lost to the 3♠; pot 440, 220 each: 440 × 35 ÷ 44 − 220 = +130.
  const p = spotOf("w-luck-and-skill", "wl-practice");
  assert.deepEqual([p.hero, p.board, p.versus, K["w-luck-and-skill"].def.hands["wl-practice"].start.pot], [s.hero, s.board, s.versus, 440]);
  assert.ok(loses(p, "3s"), "the 3♠ is one of his rivers");
  assert.equal((440 * 35) / 44 - 220, 130); assert.equal(keyOf("w-luck-and-skill", "wl-practice").band, "avg");
  // fresh: T♠ T♥ against A♣ 5♣ on 8♣ 7♦ 3♣ 2♥, 330 each, lost to the 9♣: still 29 of 44, +105.
  const f = spotOf("w-luck-and-skill", "wl-fresh");
  assert.deepEqual(riverCount(f), [44, 29, 0]);
  assert.ok(loses(f, "9c"), "the 9♣ is one of his rivers");
  assert.equal(K["w-luck-and-skill"].def.hands["wl-fresh"].start.pot, 660);
  assert.equal((660 * 29) / 44 - 330, 105); assert.equal(keyOf("w-luck-and-skill", "wl-fresh").band, "no");
  // w-what-is-poker, the film: K♥ Q♥'s straight beats A♣ J♦'s pair of jacks.
  assert.ok(compareHands(ev(["Kh", "Qh", "Jh", "Tc", "4h", "2s", "9d"]), ev(["Ac", "Jd", "Jh", "Tc", "4h", "2s", "9d"])) > 0);
  // Content version 3: the film's WHO WINS? prediction (its last pause) keys who the film shows winning.
  const wins = K["w-what-is-poker"].keys.filmPauses.find((k) => k.spotId === "wip-turn-wins");
  assert.equal(winnerOf({ ...K["w-what-is-poker"].def.stages[1].pause.pauses.at(-1).spot, versus: ["Ac", "Jd"] }), "you"); assert.equal(wins.key.band, "you");
  assert.equal(wins.predict, true, "a prediction: recorded, never graded wrong");
  assert.deepEqual(K["w-what-is-poker"].keys.filmPauses.map((k) => k.key.action ?? k.key.band), ["call", "bet", "you"]);
  assert.equal(filmKey("w-what-is-poker").action, "call");
  // guided: 7♥ 6♥'s straight beats K♠ K♦'s three kings on 8♥ 5♣ K♣ 2♥ 9♠.
  const g = spotOf("w-what-is-poker", "wip-guided");
  assert.deepEqual([ev([...g.hero, ...g.board]).name, ev([...g.versus, ...g.board]).name], ["Three of a Kind", "Straight"]);
  assert.equal(winnerOf(g), "andy"); assert.equal(keyOf("w-what-is-poker", "wip-guided").band, "andy");
  // w-how-deep, the film: 1,326 two-card starts, folding into 169 kinds.
  assert.equal((52 * 51) / 2, 1326); assert.equal(13 + 78 + 78, 169); assert.equal((13 * 12) / 2, 78);
  assert.equal(filmKey("w-how-deep").band, "1326");
  // guided: a pair of aces is 4 × 3 ÷ 2 = 6 starts; practice: ace-king is 4 × 4 = 16 (4 suited, 12 offsuit).
  const aces = DECK.filter((c) => c[0] === "A");
  const kings = DECK.filter((c) => c[0] === "K");
  assert.equal(aces.flatMap((a, i) => aces.slice(i + 1).map((b) => [a, b])).length, 6);
  const ak = aces.flatMap((a) => kings.map((k) => [a, k]));
  assert.deepEqual([ak.length, ak.filter(([a, k]) => a[1] === k[1]).length], [16, 4]);
  assert.deepEqual([keyOf("w-how-deep", "wd-guided").band, keyOf("w-how-deep", "wd-practice").band], ["6", "16"]);
  assert.equal(NODES.find((n) => n.id === "f-bet-sizing").track, "postflop");
  assert.equal(keyOf("w-how-deep", "wd-fresh").band, "postflop");
  // w-history guided: 4 × 200 at the table, 20 in fees: 780 left between the players.
  assert.equal(4 * 200 - 20, 780); assert.equal(keyOf("w-history", "wh-guided").band, "780");
  // practice: a 150 pot, 75 of it yours, a 5 fee: 70 won from the other players.
  assert.equal(150 - 75 - 5, 70); assert.equal(keyOf("w-history", "wh-practice").band, "70");
  // comprehension answers stated in the plan
  const welcome = readFileSync(join(PLANS, "welcome.md"), "utf8");
  assert.ok(welcome.includes("Who takes the chips you lose? (the other players)") && filmKey("w-history").band === "players");
  assert.ok(welcome.includes("the buy-ins, minus a fee") && keyOf("w-history", "wh-fresh").band === "buyins");
  assert.ok(welcome.includes("DECIDE 10 AND CHECK") && filmKey("w-the-academy").band === "decide");
  // w-the-academy guided: reviews spaced over days, each lifting the curve back up.
  assert.ok(welcome.includes("each stamp lifts it back up") && keyOf("w-the-academy", "wa-guided").band === "spaced");
  const LOOP = ["Learn the idea", "Decide with it", "See why", "Try a new spot", "Prove it later"];
  assert.ok(LOOP.every((step) => welcome.includes(step)));
  assert.equal(LOOP[LOOP.indexOf("Decide with it") + 1], "See why"); assert.equal(keyOf("w-the-academy", "wa-practice").band, "why");
  assert.equal(LOOP[LOOP.indexOf("Prove it later") - 1], "Try a new spot"); assert.equal(keyOf("w-the-academy", "wa-fresh").band, "new");
  // w-what-is-poker: the fold wins without a showdown (the last player in takes the pot)
  const h = K["w-what-is-poker"].def.hands["wip-fresh"];
  const folded = { ...h, script: [...h.script.slice(0, -1), { do: "act", seat: "hero", action: "fold" }] };
  const st = stateAfter(folded, expandScript(folded).length);
  assert.equal(st.seats.filter((x) => !x.folded).length, 1);
  assert.equal(keyOf("w-what-is-poker", "wip-fresh").band, "andy");
});

check("rules: seats, order, pots and legal actions", () => {
  assert.equal("9c"[0], "9d"[0]); assert.equal(ev(["9c", "2d", "4h", "7s", "Kc"]).rank, ev(["9d", "2c", "4h", "7s", "Kc"]).rank);
  assert.equal(keyOf("r-the-deck", "dk-practice").band, "equal");
  // r-the-deck v2: the film's split (A♠ K♦ against A♥ K♣) is its own spot; the guided K♠ J♦ against
  // K♥ J♣ on K♦ 8♣ 8♥ 5♠ 2♣ is the same two pair and kicker for both: a split.
  const dkFilm = K["r-the-deck"].def.stages[1].pause.spot;
  assert.equal(winnerOf(dkFilm), "split"); assert.equal(K["r-the-deck"].keys.film.key.band, "split");
  const dkg = spotOf("r-the-deck", "dk-guided");
  assert.equal(ev([...dkg.hero, ...dkg.board]).name, "Two Pair");
  assert.equal(winnerOf(dkg), "split"); assert.equal(keyOf("r-the-deck", "dk-guided").band, "split");
  // blinds: posted by two players; heads-up the button posts the small blind and acts first preflop
  const blindsOf = (hand) => stateAfter(hand, expandScript(hand).findIndex((x) => x.do === "decide"));
  // r-seats-blinds v2 guided: blinds of 10 and 20, you in the big blind: 20 of the 30 are yours.
  const big = blindsOf(K["r-seats-blinds"].def.hands["sb-guided"]);
  assert.equal(big.pot, 30);
  const bigIds = big.seats.map((x) => x.id); const bigBtn = bigIds.indexOf(big.dealerId);
  assert.equal(bigIds[(bigBtn + 2) % bigIds.length], "hero", "you are two seats after the button: the big blind");
  assert.equal(big.seats.find((x) => x.id === "hero").currentBet, 20); assert.equal(keyOf("r-seats-blinds", "sb-guided").band, "twenty");
  assert.ok(big.seats.filter((x) => x.currentBet > 0).every((x) => x.id !== big.dealerId), "the blinds are two players’ chips, the button posts none");
  // practice: the button moved one seat on from you, so you are the first seat after it: the small blind, 5.
  const six = blindsOf(K["r-seats-blinds"].def.hands["sb-practice"]);
  assert.equal(six.pot, 15);
  const ids = six.seats.map((x) => x.id); const btn = ids.indexOf(six.dealerId);
  assert.equal(ids[(btn + 1) % ids.length], "hero", "you sit right after the button");
  assert.equal(six.seats.find((x) => x.currentBet === 5).id, "hero");
  assert.equal(six.seats.find((x) => x.currentBet === 10).id, ids[(btn + 2) % ids.length]);
  assert.equal(keyOf("r-seats-blinds", "sb-practice").band, "small");
  // fresh: heads-up with the button on Ace Andy: he posts the small blind, you the big blind.
  const hu = blindsOf(K["r-seats-blinds"].def.hands["sb-fresh"]);
  assert.equal(hu.dealerId, "opponent");
  assert.deepEqual([hu.seats.find((x) => x.id === "opponent").currentBet, hu.seats.find((x) => x.id === "hero").currentBet], [5, 10]);
  assert.equal(keyOf("r-seats-blinds", "sb-fresh").band, "andy");
  // r-first-hand v2: the film's question (who acts first before the flop: you, on the button) is its
  // own spot; the guided hand asks what a call costs there: 10 − 5 = 5 more.
  const fh = blindsOf(K["r-first-hand"].def.hands["fh-guided"]);
  assert.equal(fh.currentTurnId, "hero"); assert.equal(K["r-first-hand"].keys.film.key.band, "you");
  const fhHero = fh.seats.find((x) => x.id === "hero"); const fhAda = fh.seats.find((x) => x.id === "opponent");
  assert.deepEqual([fhHero.currentBet, fhAda.currentBet], [5, 10]);
  assert.equal(fhAda.currentBet - fhHero.currentBet, 5); assert.equal(keyOf("r-first-hand", "fh-guided").band, "five");
  // order after the flop: the first seat left of the button still in
  const POSTFLOP = ["SB", "BB", "UTG", "MP", "CO", "BTN"];
  const first = (seats) => POSTFLOP.find((s) => seats.includes(s));
  // r-streets v2: the film's flop (you on the button, Ace Andy the big blind) is its own spot: he acts first.
  assert.equal(first(["BB", "BTN"]), "BB"); assert.equal(K["r-streets"].keys.film.key.band, "andy");
  // guided: Ace Andy on the button, you the big blind, he bet the flop last: you still act first on the turn.
  const stg = blindsOf(K["r-streets"].def.hands["st-guided"]);
  assert.deepEqual([stg.dealerId, stg.street], ["opponent", "turn"]);
  assert.equal(first(["BB", "BTN"]), "BB"); assert.equal(keyOf("r-streets", "st-guided").band, "you");
  // practice: the big blind, middle position and the cutoff (you) see the flop: the big blind first.
  const stp = blindsOf(K["r-streets"].def.hands["st-practice"]);
  assert.equal(stp.pot, 95);
  assert.equal(stp.seats.filter((x) => !x.folded).length, 3);
  assert.equal(first(["BB", "MP", "CO"]), "BB"); assert.equal(keyOf("r-streets", "st-practice").band, "bb");
  assert.equal(first(["UTG", "CO", "BTN"]), "UTG"); assert.equal(keyOf("r-streets", "st-fresh").band, "utg");
  // nothing owed on the flop: check or bet are the legal choices
  const fp = stateAfter(K["r-first-hand"].def.hands["fh-practice"], expandScript(K["r-first-hand"].def.hands["fh-practice"]).length);
  assert.equal(fp.currentBet, 0); assert.equal(keyOf("r-first-hand", "fh-practice").band, "checkbet");
  assert.equal(40 + 40 + 30 + 30, keyOf("r-first-hand", "fh-fresh").value);
  // side pots: a player can win every layer up to his own all-in (each layer: the chips between two
  // all-in lines, from every player who put in at least the upper line's worth).
  const canWin = (put, who) => Object.values(put).reduce((t, v) => t + Math.min(v, put[who]), 0);
  // r-all-in-side-pots v2: the film's question (Ada all-in for 50 in a 1,000 pot) is its own spot: 200.
  const put = { A: 50, B: 150, C: 400, D: 400 };
  assert.equal(canWin(put, "A"), K["r-all-in-side-pots"].keys.film.key.value);
  assert.equal(Object.values(put).reduce((t, v) => t + v, 0), 1000);
  // guided: Ada 60, Bo 200, you and Di 500 (1,260): Bo can win 240 + 420 = 660.
  const four = { A: 60, B: 200, C: 500, D: 500 };
  assert.equal(Object.values(four).reduce((t, v) => t + v, 0), 1260);
  assert.equal(K["r-all-in-side-pots"].def.hands["ap-guided"].start.pot, 1260);
  assert.equal(60 * 4 + (200 - 60) * 3, 660);
  assert.equal(canWin(four, "B"), keyOf("r-all-in-side-pots", "ap-guided").value);
  const three = { A: 100, B: 300, C: 300 };
  assert.equal([three.B, three.C].reduce((t, v) => t + (v - three.A), 0), keyOf("r-all-in-side-pots", "ap-practice").value);
  assert.equal(800 - Math.min(800, 300), keyOf("r-all-in-side-pots", "ap-fresh").value);
  // r-showdown v2: the film's question (Ace Andy bets, everyone folds) is its own spot: yes, he wins.
  // guided: you bet the river with nine high and Ace Andy folds: one player left, no showdown, no show.
  assert.equal(K["r-showdown"].keys.film.key.band, "yes");
  const sdg = blindsOf(K["r-showdown"].def.hands["sd-guided"]);
  assert.deepEqual(sdg.seats.filter((x) => !x.folded).map((x) => x.id), ["hero"]);
  assert.equal(sdg.pot, 140 + 70);
  assert.equal(ev([...spotOf("r-showdown", "sd-guided").hero, ...spotOf("r-showdown", "sd-guided").board]).name, "High Card");
  assert.equal(keyOf("r-showdown", "sd-guided").band, "no");
  // practice: K♠ K♥ (three kings) against 9♦ 2♣ on 5♣ 6♦ 7♥ 8♠ K♣: his nine makes a straight and wins.
  const sdp = spotOf("r-showdown", "sd-practice");
  assert.deepEqual([ev([...sdp.hero, ...sdp.board]).name, ev([...sdp.versus, ...sdp.board]).name], ["Three of a Kind", "Straight"]);
  assert.equal(winnerOf(sdp), "andy"); assert.equal(keyOf("r-showdown", "sd-practice").band, "andy");
});

check("board: draws, nuts, what beats you, shapes", () => {
  // v2 (2026-10-09): the film's own question (pause.spot) keeps its v1 key; the hands are new spots.
  const filmOf = (node) => K[node].def.stages[1].pause.spot;
  const filmKeyOf = (node) => K[node].keys.film.key;
  const mvFilm = filmOf("b-made-vs-draw");
  assert.equal(ev([...mvFilm.hero, ...mvFilm.board]).name, "High Card");
  assert.equal([...mvFilm.hero, ...mvFilm.board].filter((c) => c[1] === "h").length, 4);
  assert.equal(unseen([...mvFilm.hero, ...mvFilm.board]).filter((c) => c[1] === "h").length, 9);
  assert.equal(filmKeyOf("b-made-vs-draw").band, "draw");
  // guided 9♥ 8♥ on 9♣ 6♥ 2♥: a pair of nines made, four hearts still a draw
  const mv = spotOf("b-made-vs-draw", "mv-guided");
  assert.equal(ev([...mv.hero, ...mv.board]).name, "One Pair");
  assert.equal([...mv.hero, ...mv.board].filter((c) => c[1] === "h").length, 4);
  assert.equal(keyOf("b-made-vs-draw", "mv-guided").band, "pair");
  // practice A♣ T♦ on K♣ 8♣ 3♣: 9 flush cards of 47; fresh 9♣ 7♣ on J♦ T♥ 3♠: 4 eights
  assert.deepEqual(["mv-practice", "mv-fresh"].map((id) => keyOf("b-made-vs-draw", id).value), [9, 4]);
  for (const id of ["mv-practice", "mv-fresh"]) { const s = spotOf("b-made-vs-draw", id); assert.equal(completingCards(s.hero, s.board, s.target).length, keyOf("b-made-vs-draw", id).value, id); }
  // the nuts: the film's K-K, then Q-9 (a straight over the guided set), A♦ Q♦ (the flush), 3-3 (quads)
  const nutsKey = { kk: "KK", q9: "9Q", aq: "AQ", 33: "33" };
  const ranksOf = (h) => [h[0][0], h[1][0]].sort().join("");
  for (const [id, spot, k] of [["nu-turn", filmOf("b-the-nuts"), filmKeyOf("b-the-nuts")], ...["nu-guided", "nu-practice", "nu-fresh"].map((x) => [x, spotOf("b-the-nuts", x), keyOf("b-the-nuts", x)])]) {
    const { hands } = nutsOf(spot.board);
    const want = nutsKey[k.band];
    assert.ok(hands.length > 0 && hands.every((h) => ranksOf(h) === want), `${id}: ${want}`);
  }
  assert.equal(nutsOf(spotOf("b-the-nuts", "nu-guided").board).best.name, "Straight");
  assert.ok(compareHands(ev(["Qd", "9d", ...spotOf("b-the-nuts", "nu-guided").board]), ev(["9s", "7s", ...spotOf("b-the-nuts", "nu-guided").board])) > 0, "Q-9 over 9-7");
  assert.deepEqual(nutsOf(spotOf("b-the-nuts", "nu-practice").board).hands, [["Qd", "Ad"]], "only A♦ Q♦");
  const fb = spotOf("b-the-nuts", "nu-fresh").board;
  const notQuads = combos(unseen(fb)).filter((h) => ev([...h, ...fb]).name !== "Four of a Kind");
  let second = null; let secondHands = [];
  for (const h of notQuads) { const x = ev([...h, ...fb]); const c = second ? compareHands(x, second) : 1; if (c > 0) { second = x; secondHands = [h]; } else if (c === 0) secondHands.push(h); }
  assert.ok(secondHands.every((h) => h[0][0] === "K" && h[1][0] === "K"), "kings full is second best");
  // what beats you
  const tally = (spot) => { const m = ev([...spot.hero, ...spot.board]); const r = combos(unseen([...spot.hero, ...spot.board])).map((h) => compareHands(ev([...h, ...spot.board]), m)); return [r.length, r.filter((x) => x > 0).length, r.filter((x) => x === 0).length]; };
  const beatNames = (hero, board) => { const m = ev([...hero, ...board]); return new Set(combos(unseen([...hero, ...board])).filter((h) => compareHands(ev([...h, ...board]), m) > 0).map((h) => ev([...h, ...board]).name)); };
  // the film's A♥ Q♦: 63 beat, 6 tie
  assert.deepEqual(tally(filmOf("b-what-beats-you")), [1035, 63, 6]);
  assert.equal(filmKeyOf("b-what-beats-you").band, "60");
  // guided Q♠ 8♠ on Q♥ 8♣ 3♦: only the 5 sets beat two pair, 4 queen-eights tie
  const wb = spotOf("b-what-beats-you", "wb-guided");
  assert.deepEqual(tally(wb), [1081, 5, 4]);
  assert.deepEqual([...beatNames(wb.hero, wb.board)], ["Three of a Kind"]);
  assert.equal(keyOf("b-what-beats-you", "wb-guided").band, "5");
  // practice A♠ T♦ on T♠ 6♠ 2♦, turn J♠: flushes are the one new family
  const wr = spotOf("b-what-beats-you", "wb-practice");
  const flopBeat = beatNames(wr.hero, wr.board.slice(0, 3)); const turnBeat = beatNames(wr.hero, wr.board);
  assert.deepEqual([...turnBeat].filter((x) => !flopBeat.has(x)), ["Flush"]);
  assert.ok(!turnBeat.has("Straight") && !turnBeat.has("Full House")); assert.equal(keyOf("b-what-beats-you", "wb-practice").band, "fl");
  const wf = spotOf("b-what-beats-you", "wb-fresh");
  const mineF = ev([...wf.hero, ...wf.board]);
  const beats = (h) => compareHands(ev([...h, ...wf.board]), mineF) > 0;
  assert.deepEqual([beats(["As", "Kd"]), beats(["Qs", "Qd"]), beats(["Js", "Ts"])], [false, true, false]); assert.equal(keyOf("b-what-beats-you", "wb-fresh").band, "qq");
  // shapes
  const flop = { k72: ["Kd", "7c", "2s"], kk4: ["Kh", "Kc", "4d"], a83: ["Ah", "8h", "3h"], 987: ["9c", "8d", "7s"], jt4: ["Jh", "Th", "4c"] };
  const withFlush = Object.entries(flop).filter(([, b]) => possible(b).has("Flush")).map(([id]) => id);
  assert.deepEqual(withFlush, ["a83"]); assert.equal(filmKeyOf("b-texture-read").band, "a83");
  assert.equal(combos(unseen(flop.a83)).filter((h) => ev([...h, ...flop.a83]).name === "Flush").length, 45);
  const p987 = possible(flop[987]);
  assert.ok(p987.has("Straight") && !p987.has("Flush") && !p987.has("Full House"));
  assert.equal(combos(unseen(flop[987])).filter((h) => ev([...h, ...flop[987]]).name === "Straight").length, 48);
  // guided: five new flops, a straight only on T♥ 9♣ 6♦ (eight-seven, 16 combos)
  const flop2 = { q72: ["Qh", "7d", "2c"], aa5: ["As", "Ah", "5d"], k83: ["Kc", "8c", "3c"], t96: ["Th", "9c", "6d"], j84: ["Jd", "8s", "4h"] };
  assert.deepEqual(spotOf("b-texture-read", "tx-guided").bands.map((b) => b.id), Object.keys(flop2));
  assert.ok(Object.values(flop2).flat().every((c) => !spotOf("b-texture-read", "tx-guided").hero.includes(c)), "no flop card in your hand");
  const withStraight = Object.entries(flop2).filter(([, b]) => possible(b).has("Straight")).map(([id]) => id);
  assert.deepEqual(withStraight, ["t96"]); assert.equal(keyOf("b-texture-read", "tx-guided").band, "t96");
  assert.equal(combos(unseen(flop2.t96)).filter((h) => ev([...h, ...flop2.t96]).name === "Straight").length, 16);
  // practice 8♥ 7♥ 2♠: a set is possible, no straight or flush yet
  const p872 = possible(spotOf("b-texture-read", "tx-practice").board);
  assert.ok(p872.has("Three of a Kind") && !p872.has("Straight") && !p872.has("Flush")); assert.equal(keyOf("b-texture-read", "tx-practice").band, "set");
  const p66 = possible(spotOf("b-texture-read", "tx-fresh").board);
  assert.ok(p66.has("Four of a Kind") && !p66.has("Flush") && !p66.has("Straight")); assert.equal(keyOf("b-texture-read", "tx-fresh").band, "quads");
  // the counterfeit: on the film's turn both best fives are aces and nines, and the king plays
  const kcFilm = filmOf("b-kickers-counterfeit");
  assert.equal(ev([...kcFilm.hero, ...kcFilm.board]).name, "Two Pair");
  assert.ok(compareHands(ev([...kcFilm.hero, ...kcFilm.board.slice(0, 3)]), ev([...kcFilm.versus, ...kcFilm.board.slice(0, 3)])) > 0, "ahead on the flop");
  assert.equal(winnerOf(kcFilm), filmKeyOf("b-kickers-counterfeit").band); assert.equal(winnerOf(kcFilm), "andy");
  // guided K♠ 9♥ against A♦ K♥: the 4♥ pairs below your nines, and you stay ahead
  const kc = spotOf("b-kickers-counterfeit", "kc-guided");
  assert.ok(compareHands(ev([...kc.hero, ...kc.board.slice(0, 3)]), ev([...kc.versus, ...kc.board.slice(0, 3)])) > 0, "ahead on the flop");
  assert.equal(winnerOf(kc), "you"); assert.equal(keyOf("b-kickers-counterfeit", "kc-guided").band, "you");
  // practice J♠ 4♥ against J♦ 6♣: ahead on the flop, behind on the turn (counterfeited), split on the Q♠ river
  const kp = spotOf("b-kickers-counterfeit", "kc-practice");
  const atStreet = (n) => compareHands(ev([...kp.hero, ...kp.board.slice(0, n)]), ev([...kp.versus, ...kp.board.slice(0, n)]));
  assert.deepEqual([atStreet(3) > 0, atStreet(4) < 0, atStreet(5) === 0], [true, true, true]);
  assert.equal(keyOf("b-kickers-counterfeit", "kc-practice").band, "split");
});

check("math: shares and expected totals", () => {
  const pct = (n, d) => Math.round((1000 * n) / d) / 10;
  const filmKey = (node) => K[node].keys.film.key;
  assert.equal(pct(4, 52), 7.7); assert.equal(filmKey("m-chance-as-share").band, "7.7");
  const isKA = DECK.filter((c) => c[0] === "K" || c[0] === "A").length;
  assert.equal(isKA, 8); assert.equal(pct(isKA, 52), 15.4); assert.equal(keyOf("m-chance-as-share", "cs-guided").band, "15");
  assert.equal(pct(26, 52), 50); assert.equal(keyOf("m-chance-as-share", "cs-practice").band, "50");
  assert.equal(pct(12, 52), 23.1); assert.equal(keyOf("m-chance-as-share", "cs-fresh").band, "23");
  assert.equal(10 * 100, Number(filmKey("m-variance").band));
  assert.equal(-20 * 30, -600); assert.equal(keyOf("m-variance", "va-guided").band, "minus600");
  assert.ok(-10 < 0 && keyOf("m-variance", "va-practice").band === "no");
  assert.equal(25 * 200, Number(keyOf("m-variance", "va-fresh").band));
  asserts(MP, 'check(n, "A SD after 100 ≈ 917", Math.round(sd1 * 10), 917);');
  asserts(MP, 'check(n, "A one swing below", 1000 - 917, 83);');
  asserts(MP, 'check(n, "A one swing above", 1000 + 917, 1917);');
  asserts(MP, 'check(n, "B ahead after 1000 (k ≥ 334)", pct(aheadB(1000), 1), "1.1%");');
});

check("postflop: value bets, pot control and draws", () => {
  const filmSpot = (node) => K[node].def.stages[1].pause.spot;
  const filmKey = (node) => K[node].keys.film.key;
  // value betting (v2): the film's question, every caller with two pair or better beats top pair
  const vt = filmSpot("f-value-betting");
  const mineT = ev([...vt.hero, ...vt.board]);
  const callersT = combos(unseen([...vt.hero, ...vt.board])).filter((h) => ev([...h, ...vt.board]).rank >= RANK["Two Pair"]);
  assert.ok(callersT.length > 0 && callersT.every((h) => compareHands(ev([...h, ...vt.board]), mineT) > 0));
  assert.equal(filmKey("f-value-betting").action, "check");
  // the film's own first river (38 of 54 worse), which no step replays
  asserts(PF, 'check("value: 128 live, 54 call", vr.length === 128 && calls.length === 54');
  asserts(PF, 'check("value: 38 worse, 1 tie, 15 better", w === 38 && t === 1 && l === 15');
  assert.ok(38 / 54 > 1 / 2 && near(38 * 100 - 15 * 100, 2300) && Math.round(10 * 2300 / 54) / 10 === 42.6 && pct2(38, 54) === "70.4");
  // guided: Q♠ T♥, he calls 80 only with a better queen (A-Q, K-Q, Q-J) or two pair or better
  const vb = spotOf("f-value-betting", "vb-guided");
  assert.deepEqual([vb.hero, vb.board, vb.potBefore, vb.sizes.bet], [["Qs", "Th"], ["Qd", "9c", "5h", "4s", "2d"], 160, 80]);
  const mine = ev([...vb.hero, ...vb.board]);
  const pool = combos(unseen([...vb.hero, ...vb.board]));
  const betterQueen = (h) => h.some((c) => c[0] === "Q") && h.some((c) => "AKJ".includes(c[0])) && ev([...h, ...vb.board]).rank < RANK["Two Pair"];
  const callers = pool.filter((h) => betterQueen(h) || ev([...h, ...vb.board]).rank >= RANK["Two Pair"]);
  assert.ok(callers.length > 0 && callers.every((h) => compareHands(ev([...h, ...vb.board]), mine) > 0), "every caller beats Q♠ T♥");
  assert.ok(pool.some((h) => h.some((c) => c[0] === "Q") && compareHands(ev([...h, ...vb.board]), mine) < 0), "the worse queens fold");
  assert.equal(keyOf("f-value-betting", "vb-guided").action, "check");
  // practice: A♣ 9♣, 24 of 36 callers worse (given), bet 60 into 120
  assert.equal(ev([...spotOf("f-value-betting", "vb-practice").hero, ...spotOf("f-value-betting", "vb-practice").board]).name, "One Pair");
  assert.ok(24 / 36 > 1 / 2 && pct2(24, 36) === "66.7" && 24 * 60 - 12 * 60 === 720 && 720 / 36 === 20);
  assert.equal(keyOf("f-value-betting", "vb-practice").action, "bet");
  assert.ok(18 / 40 < 1 / 2); assert.equal(keyOf("f-value-betting", "vb-fresh").action, "check");
  // pot control (v2): the film's question is his choice; the guided seat flips it to yours
  asserts(PF, 'eqQ("three half-pot bets", 100 * 2 * 2 * 2, 800)');
  asserts(PF, 'eqQ("two half-pot bets", 100 * 2 * 2, 400)');
  assert.equal(pct2(2, 46), "4.3");
  assert.equal(filmKey("f-pot-control").band, "him");
  const pcg = K["f-pot-control"].def.hands["pc-guided"];
  assert.ok(pcg.button === "hero" && pcg.script.some((s) => s.do === "act" && s.seat === "opponent" && s.action === "check"), "guided: he checks, you are last to act");
  assert.equal(keyOf("f-pot-control", "pc-guided").band, "you");
  assert.equal(80 + 40 + 40, spotOf("f-pot-control", "pc-practice").potBefore, "practice: 40 called on an 80 flop");
  assert.equal(keyOf("f-pot-control", "pc-practice").action, "check");
  assert.equal(60 * 2 * 2, keyOf("f-pot-control", "pc-fresh").value);
  // playing draws (v2): price, needed later, and the all-in runouts, on the film's draw and the new one
  const needed = (outs, pot, bet) => bet / (outs / 47) - (pot + bet + bet);
  const pt = filmSpot("f-playing-draws");
  assert.equal(completingCards(pt.hero, pt.board, "flush").length, 9);
  assert.ok(near(price(120, 60), 0.25) && Math.ceil(needed(9, 120, 60)) === 74 && 74 <= 300); assert.equal(filmKey("f-playing-draws").action, "call");
  const pd = spotOf("f-playing-draws", "pd-guided");
  assert.deepEqual([pd.hero, pd.board], [["8d", "7d"], ["Jd", "5d", "2s"]]);
  for (const id of ["pd-practice", "pd-fresh"]) assert.deepEqual([spotOf("f-playing-draws", id).hero, spotOf("f-playing-draws", id).board], [pd.hero, pd.board], `${id}: the same flush draw as guided`);
  const outs = completingCards(pd.hero, pd.board, "flush").length;
  assert.equal(outs, 9); assert.equal(pct2(9, 47), "19.1");
  assert.ok(pct2(40, 180) === "22.2" && price(100, 40) > 9 / 47 && Math.ceil(needed(outs, 100, 40)) === 29 && 29 <= 250); assert.equal(keyOf("f-playing-draws", "pd-guided").action, "call");
  assert.ok(pct2(80, 280) === "28.6" && Math.round(10 * needed(outs, 120, 80)) / 10 === 137.8 && Math.ceil(needed(outs, 120, 80)) === 138 && 138 > 60); assert.equal(keyOf("f-playing-draws", "pd-practice").action, "fold");
  const left = unseen([...pd.hero, ...pd.board]);
  const flushRuns = combos(left).filter((two) => [...pd.hero, ...pd.board, ...two].filter((c) => c[1] === "d").length >= 5).length;
  assert.deepEqual([left.length, combos(left).length, flushRuns], [47, 1081, 378]);
  assert.ok(flushRuns / 1081 > price(100, 100) && pct2(378, 1081) === "35.0"); assert.equal(keyOf("f-playing-draws", "pd-fresh").action, "call");
});

check("recall: the four postflop cards, answered as the lessons answer them", () => {
  const { recallEntry } = learn;
  const answer = (id) => { const q = recallEntry(id).question; return q.choices[q.answer]; };
  assert.ok(FILM_FIRST_LESSONS.find((d) => d.id === "cbetting-workspace-v1").spots["cb1-practice-cbet"].explanation.includes("checking is the play"));
  assert.equal(answer("f-cbet"), "Check");
  assert.ok(18 / 40 < 1 / 2 && answer("f-value-betting") === "Check" && keyOf("f-value-betting", "vb-fresh").action === "check");
  assert.ok(60 * 2 * 2 === Number(answer("f-pot-control")) && keyOf("f-pot-control", "pc-fresh").value === 240);
  assert.ok(378 / 1081 > price(100, 100) && answer("f-playing-draws") === "Call" && keyOf("f-playing-draws", "pd-fresh").action === "call");
  for (const id of ["f-cbet", "f-value-betting", "f-pot-control", "f-playing-draws"]) assert.ok(!/guided|transfer|film/i.test(recallEntry(id).source));
  assert.deepEqual(learn.recallTodo().filter((t) => EARLY.includes(NODES.find((n) => n.id === t.lessonId).track)), [], "no early-track todo left");
});

check("the plan check scripts behind these keys pass", () => {
  for (const name of [MP, PF]) {
    const r = spawnSync(process.execPath, [join(PLANS, name)], { encoding: "utf8" });
    assert.equal(r.status, 0, `${name}: ${r.stdout.slice(-400)}`);
  }
});

console.log(`academy early checks passed (${checks})`);
