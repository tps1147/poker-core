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

const require = createRequire(import.meta.url);
const { evaluateHand, compareHands } = require("../src/eval/pokerEvaluator.js");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILMS = JSON.parse(readFileSync(join(ROOT, "test/fixtures/academyFilmsEarly.json"), "utf8")).films;
const PLANS = join(ROOT, "docs/v1-feature/academy/plans");
const { FILM_FIRST_LESSONS, NODES, lessonHands, decisionStages, nodeOfLesson, filmIdOfNode, completingCards, whyStages, whyResult } = learn;
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
  : kindOf(spot) === "action" ? spot.choices.includes(k.action)
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
    assert.equal(anchors.film, filmIdOfNode(node));
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

check("the plan check scripts behind these keys pass", () => {
  for (const name of [MP, PF]) {
    const r = spawnSync(process.execPath, [join(PLANS, name)], { encoding: "utf8" });
    assert.equal(r.status, 0, `${name}: ${r.stdout.slice(-400)}`);
  }
});

console.log(`academy early checks passed (${checks})`);
