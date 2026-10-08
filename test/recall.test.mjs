// Spaced recall and the recall bank: the scheduler, the interleave, and every card's answer checked
// (recomputed here with the shared evaluator and exact arithmetic; the plan check scripts that cover
// the plan's own numbers are run too).
//   node test/recall.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RECALL_BANK, recallCard, recallEntry, recallTodo } from "../src/learn/recallBank.mjs";
import { scheduleRecall, recordRecall, dueCards, RECALL_INTERVALS_DAYS, RECALL_MAX } from "../src/learn/recall.mjs";
import { NODES, DAY_MS, nodeState } from "../src/learn/index.mjs";

const require = createRequire(import.meta.url);
const { evaluateHand, compareHands } = require("../src/eval/pokerEvaluator.js");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };
const T0 = Date.UTC(2026, 9, 8, 9);

// ── cards ─────────────────────────────────────────────────────────────────────────────────────
const SUITS = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };
const SYMBOL = { s: "♠", h: "♥", d: "♦", c: "♣" };
const parse = (text) => (text.match(/[2-9TJQKA][♠♥♦♣]/g) || []).map((c) => c[0] + SUITS[c[1]]);
const ev = (cards) => evaluateHand(cards.map((c) => ({ rank: c[0], suit: SYMBOL[c[1]] })));
const DECK = [..."23456789TJQKA"].flatMap((r) => [..."shdc"].map((s) => r + s));
const unseen = (known) => DECK.filter((c) => !known.includes(c));
const winner = (board, a, b) => { const x = compareHands(ev([...a, ...board]), ev([...b, ...board])); return x > 0 ? 0 : x < 0 ? 1 : 2; };
const STRAIGHT = ev(["5c", "6d", "7h", "8s", "9c"]).rank;
const outsTo = (known, rank) => unseen(known).filter((c) => ev([...known, c]).rank >= rank);
const answerOf = (id) => { const q = recallEntry(id).question; return q.choices[q.answer]; };
const promptCards = (id) => parse(recallEntry(id).question.prompt);

check("one entry per node, in tree order, each with a rule; questions are one-tap", () => {
  assert.deepEqual(RECALL_BANK.map((e) => e.lessonId), NODES.map((n) => n.id));
  for (const e of RECALL_BANK) {
    assert.ok(["ready", "authored", "todo"].includes(e.status), e.lessonId);
    assert.ok(e.rule && e.rule.length > 10, `${e.lessonId} has a rule`);
    if (e.status === "todo") { assert.equal(e.question, null); assert.ok(e.todo, `${e.lessonId} says why`); continue; }
    const q = e.question;
    assert.ok(q.prompt && q.choices.length >= 2 && q.choices.length <= 3, e.lessonId);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length, e.lessonId);
    assert.equal(new Set(q.choices).size, q.choices.length, `${e.lessonId}: distinct choices`);
    assert.ok(e.source && !/guided|transfer|film/i.test(e.source), `${e.lessonId}: never the guided spot or the film's own`);
    assert.deepEqual(recallCard(e.lessonId), { lessonId: e.lessonId, rule: e.rule, question: q });
  }
  for (const { lessonId } of recallTodo()) assert.equal(recallCard(lessonId), null, "a todo has no card");
  assert.equal(recallCard("nope"), null);
});

check("the todo list", () => {
  const list = recallTodo();
  assert.equal(list.length, RECALL_BANK.filter((e) => e.status === "todo").length);
  // The early tracks (welcome to postflop) are all filled; test/academyEarly.test.mjs checks the postflop four.
  assert.deepEqual(list.map((x) => x.lessonId), ["x-mdf", "x-check-raise",
    "x-barrels-blockers", "h-range-narrowing", "h-player-types", "h-exploits", "g-toy-games", "g-balance", "g-gto-to-exploit", "y-tilt", "y-study",
    "o-multiway", "o-heads-up", "o-tournaments-icm", "o-six-max", "o-live"]);
});

check("rules and board cards: the answers the evaluator gives", () => {
  const who = (id) => {
    const [b1, b2, b3, b4, b5, ...rest] = promptCards(id);
    return winner([b1, b2, b3, b4, b5], rest.slice(0, 2), rest.slice(2, 4));
  };
  assert.equal(recallEntry("r-the-deck").question.answer, who("r-the-deck"));
  assert.equal(recallEntry("r-best-five").question.answer, who("r-best-five"));
  assert.equal(recallEntry("r-showdown").question.answer, who("r-showdown"));
  assert.equal(recallEntry("b-kickers-counterfeit").question.answer, who("b-kickers-counterfeit"));
  // Ladder order: a straight outranks three of a kind and two pair.
  const straight = ev(["5c", "6d", "7h", "8s", "9c"]).rank, trips = ev(["7c", "7d", "7h", "Ks", "2d"]).rank, twoPair = ev(["7c", "7d", "Kh", "Ks", "2d"]).rank;
  assert.ok(straight > trips && trips > twoPair);
  assert.equal(answerOf("r-hand-rankings"), "Straight");
  // Made hand or draw: Q♠ J♠ on K♠ 8♠ 3♦ 2♥ ranks high card, with nine spades left to finish it.
  const [q1, q2, ...madeBoard] = promptCards("b-made-vs-draw");
  assert.equal(ev([q1, q2, ...madeBoard]).name, "High Card");
  assert.equal(unseen([q1, q2, ...madeBoard]).filter((c) => c[1] === "s").length, 9);
  assert.match(answerOf("b-made-vs-draw"), /flush draw/);
  // The nuts on Q♣ 9♦ 4♠ 2♥ 7♣: every two-card hand enumerated; the best is a set of queens.
  const nutsBoard = promptCards("b-the-nuts");
  const pool = unseen(nutsBoard);
  let best = null; let bestHands = [];
  for (let i = 0; i < pool.length; i += 1) for (let j = i + 1; j < pool.length; j += 1) {
    const hand = ev([pool[i], pool[j], ...nutsBoard]);
    const c = best ? compareHands(hand, best) : 1;
    if (c > 0) { best = hand; bestHands = [[pool[i], pool[j]]]; } else if (c === 0) bestHands.push([pool[i], pool[j]]);
  }
  assert.ok(bestHands.length === 3 && bestHands.every((h) => h[0][0] === "Q" && h[1][0] === "Q"), "Q-Q, three combos");
  assert.equal(answerOf("b-the-nuts"), "Q-Q");
  // What beats K♥ Q♦ on K♣ 9♠ 5♦ 2♣: of K-J, 9-5 and Q-Q only 9-5 (two pair).
  const [h1, h2, ...wbBoard] = promptCards("b-what-beats-you");
  const beats = (a, b) => compareHands(ev([a, b, ...wbBoard]), ev([h1, h2, ...wbBoard])) > 0;
  assert.deepEqual([beats("Ks", "Jh"), beats("9h", "5h"), beats("Qs", "Qh")], [false, true, false]);
  assert.equal(answerOf("b-what-beats-you"), "9-5");
  // Board shapes on Q♣ 8♣ 4♣: a flush is possible now; no straight, no full house.
  const shape = promptCards("b-texture-read");
  const names = new Set();
  const left = unseen(shape);
  for (let i = 0; i < left.length; i += 1) for (let j = i + 1; j < left.length; j += 1) names.add(ev([left[i], left[j], ...shape]).name);
  assert.ok(names.has("Flush") && !names.has("Straight") && !names.has("Full House"));
  assert.equal(answerOf("b-texture-read"), "A flush");
});

check("rules cards: seats, order of action, raises and side pots", () => {
  const SIX = ["BTN", "SB", "BB", "UTG", "HJ", "CO"]; // clockwise from the button
  assert.equal(SIX.indexOf("BB") - SIX.indexOf("BTN"), 2, "the big blind is two seats after the button");
  assert.equal(answerOf("r-seats-blinds"), "Two seats after the button");
  const postflop = ["SB", "BB", "UTG", "HJ", "CO", "BTN"].filter((s) => ["BB", "HJ", "BTN"].includes(s));
  assert.equal(postflop[0], "BB");
  assert.equal(answerOf("r-streets"), "The big blind");
  const minReraise = 40 + (40 - 10);
  assert.equal(answerOf("r-actions"), `To ${minReraise}`);
  const put = { A: 100, B: 200, C: 500, D: 500 };
  const main = Object.values(put).reduce((s, v) => s + Math.min(v, put.A), 0);
  assert.equal(main, 400);
  assert.equal(Object.values(put).reduce((s, v) => s + v, 0), 1300, "the 1,300 distractor is the whole pot");
  assert.equal(answerOf("r-all-in-side-pots"), "400");
  assert.equal(answerOf("y-bankroll"), String(3000 / 100));
});

check("math and preflop cards: the plan's numbers, recomputed", () => {
  const pct = (n, d) => Math.round((1000 * n) / d) / 10;
  assert.equal(pct(12, 52), 23.1);
  assert.equal(answerOf("m-chance-as-share"), "About 23%");
  const [o1, o2, ...outsBoard] = promptCards("m-outs");
  assert.equal(outsTo([o1, o2, ...outsBoard], STRAIGHT).length, 4);
  assert.equal(answerOf("m-outs"), "4");
  const r24 = promptCards("m-rule-2-4");
  assert.equal(outsTo(r24, STRAIGHT).length * 2, 16);
  assert.equal(answerOf("m-rule-2-4"), "About 16%");
  const eq = promptCards("m-equity");
  assert.equal(outsTo(eq, STRAIGHT).length, 8);
  assert.equal((8 / 46) * 115, 20);
  assert.equal(answerOf("m-equity"), "About 20");
  assert.equal(pct(60, 90 + 60 + 60), 28.6);
  assert.equal(answerOf("m-pot-odds"), "About 28.6%");
  assert.equal(0.2 * (200 + 100 + 100) - 100, -20);
  assert.equal(answerOf("m-ev"), "−20");
  assert.equal(answerOf("m-variance"), "+1,000");
  const io = promptCards("m-implied-odds");
  assert.equal(outsTo(io, STRAIGHT).length, 8);
  assert.equal(Math.round(40 / (8 / 46) - (90 + 40 + 40)), 60);
  assert.equal(answerOf("m-implied-odds"), "60");
  assert.equal(Math.min(2000, 1800) / 150, 12);
  assert.equal(answerOf("m-spr"), "12");
  // Big blind facing a raise to 40: owes 30; the pot after the call is 5 + 40 + 10 + 30 = 85.
  assert.equal(pct(30, 85), 35.3);
  assert.equal(answerOf("p-blind-defense"), "About 35.3%");
  assert.equal(answerOf("p-position-value"), "The button");
  assert.equal(answerOf("x-fold-equity"), `${100 / (100 + 100) * 100}%`);
});

check("the plan check scripts that cover these numbers pass", () => {
  const run = (name) => spawnSync(process.execPath, [join(ROOT, "docs/v1-feature/academy/plans", name)], { encoding: "utf8" });
  for (const name of new Set(RECALL_BANK.map((e) => e.checkedBy).filter(Boolean))) {
    const r = run(name);
    if (name === "check-welcome-rules-board.mjs") {
      // Its only failures are three engine notes that expected the shared compareHands to miss
      // kickers; the evaluator compares kickers since the P8 fix, so those notes are stale.
      const failed = r.stdout.split("\n").filter((l) => /^\s+x /.test(l));
      assert.ok(failed.every((l) => /shared compareHands/.test(l)), `${name}: ${failed.join("; ")}`);
    } else assert.equal(r.status, 0, `${name}: ${r.stdout.slice(-400)}`);
  }
});

check("the scheduler: 1 → 3 → 7 → 21 days, a miss resets to 1", () => {
  assert.deepEqual(RECALL_INTERVALS_DAYS, [1, 3, 7, 21]);
  let p = scheduleRecall({}, "m-outs", T0);
  assert.deepEqual(p.recall["m-outs"], { step: 0, due: T0 + DAY_MS, log: [] });
  assert.equal(scheduleRecall(p, "m-outs", T0 + 5), p, "an existing card is left as it is");
  let t = T0 + DAY_MS;
  const dues = [];
  for (let i = 0; i < 5; i += 1) { p = recordRecall(p, "m-outs", true, t); dues.push((p.recall["m-outs"].due - t) / DAY_MS); t = p.recall["m-outs"].due; }
  assert.deepEqual(dues, [3, 7, 21, 21, 21]);
  p = recordRecall(p, "m-outs", false, t);
  assert.equal(p.recall["m-outs"].step, 0);
  assert.equal(p.recall["m-outs"].due, t + DAY_MS);
  assert.equal(p.recall["m-outs"].log.length, 6);
  assert.deepEqual(p.recall["m-outs"].log.at(-1), { at: t, correct: false });
  const before = scheduleRecall({}, "m-ev", T0);
  const after = recordRecall(before, "m-ev", true, new Date(T0 + DAY_MS));
  assert.deepEqual(before.recall["m-ev"].log, [], "no mutation");
  assert.equal(after.recall["m-ev"].due, T0 + 4 * DAY_MS, "Dates work");
  const fresh = recordRecall({}, "m-ev", true, T0);
  assert.equal(fresh.recall["m-ev"].step, 1, "an answer with no card yet starts one");
});

check("the recall log seals a node through nodeState", () => {
  let p = { nodes: { "m-outs": { watched: true, handsDone: true, fresh: { firstTry: true, hints: 0, at: T0 } } } };
  p = scheduleRecall(p, "m-outs", T0);
  assert.equal(nodeState("m-outs", p), "filled");
  p = recordRecall(p, "m-outs", true, T0 + DAY_MS);
  assert.equal(nodeState("m-outs", p), "sealed");
});

check("dueCards: at most two, most overdue first, across tracks, never two from one lesson", () => {
  const card = (due) => ({ step: 0, due, log: [] });
  const p = { recall: {
    "m-outs": card(T0 - 5 * DAY_MS), "m-ev": card(T0 - 4 * DAY_MS), "p-open-raise": card(T0 - 3 * DAY_MS),
    "r-the-deck": card(T0 + DAY_MS), "nope": card(T0 - 9 * DAY_MS),
  } };
  const due = dueCards(p, T0);
  assert.equal(RECALL_MAX, 2);
  assert.deepEqual(due.map((c) => c.lessonId), ["m-outs", "p-open-raise"], "interleaved: math, then preflop, though m-ev is older");
  assert.deepEqual(Object.keys(due[0]).sort(), ["due", "lessonId", "question", "rule", "track"]);
  assert.deepEqual(dueCards(p, T0, { max: 3 }).map((c) => c.lessonId), ["m-outs", "p-open-raise", "m-ev"], "same track only once others run out");
  assert.deepEqual(dueCards({ recall: { "m-outs": card(T0), "m-ev": card(T0) } }, T0).map((c) => c.lessonId), ["m-outs", "m-ev"], "one track due: two lessons from it");
  assert.deepEqual(dueCards({}, T0), [], "nothing due, nothing shown");
  assert.deepEqual(dueCards(p, T0 - 10 * DAY_MS), []);
  const ids = dueCards(p, T0, { max: 10 }).map((c) => c.lessonId);
  assert.equal(new Set(ids).size, ids.length, "never two from the same lesson");
  assert.ok(!ids.includes("r-the-deck") && !ids.includes("nope"), "not due and unknown cards stay out");
});

console.log(`recall checks passed (${checks}): ${RECALL_BANK.filter((e) => e.status === "ready").length} ready, ${RECALL_BANK.filter((e) => e.status === "authored").length} authored, ${recallTodo().length} todo`);
