// The academy tree draft: structure, coverage of everything already built, and the facts it states.
//   node test/v1/learn/academyTree.test.mjs
import assert from "node:assert/strict";
import { NODES, TRACKS, PATHS, validateTree, depthOf } from "../../../src/learn/academyTree.mjs";
import { COURSE_ORDER } from "../../../src/learn/lessons/index.mjs";
import { PUZZLE_TOPICS } from "../../../src/puzzles/index.js";

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };
const ARCHETYPES = ["calling-station", "nit", "tag", "lag", "trapper", "shark", "drawer", "balanced"];
// The 28 concept ids of the existing concept map (flop52web/src/lib/academy/conceptMap.js, read 2026-10-06).
const CONCEPTS = ["t0-hand-rankings", "t0-positions", "t0-betting-actions", "t1-outs-rule-24", "t1-equity", "t1-pot-odds",
  "t1-implied-odds", "t1-ev", "t1-spr", "t2-starting-hands", "t2-rfi-by-position", "t2-blind-defense", "t2-3betting",
  "t3-ranges", "t3-board-texture", "t3-cbetting", "t3-bet-sizing", "t4-fold-equity-semibluff", "t4-bluffing",
  "t4-mdf-bluffcatch", "t4-barreling-blockers", "t5-range-narrowing", "t5-player-typing", "t5-gto-to-exploit",
  "t6-bankroll", "t6-tilt", "t6-icm", "t6-multiway"];
const FORMATS = new Set(["film", "table", "toy", "worked", "contrast", "decision", "drill", "match"]);

check("the tree is a valid DAG with known tracks and backward-only prerequisites", () => {
  assert.deepEqual(validateTree(), []);
});
check("the validator catches cycles, missing and forward prerequisites", () => {
  const t = [{ id: "a", track: "math", prereqs: ["b"], scope: "v1" }, { id: "b", track: "math", prereqs: ["a"], scope: "v1" },
    { id: "c", track: "welcome", prereqs: ["a", "zz"], scope: "v1" }];
  const p = validateTree(t);
  assert.ok(p.some((x) => x.startsWith("cycle")), "cycle");
  assert.ok(p.some((x) => x.includes("missing prereq zz")), "missing");
  assert.ok(p.some((x) => x.includes("later track")), "forward");
});
check("every node has an objective and known formats; welcome roots have no prerequisites", () => {
  for (const n of NODES) {
    assert.ok(n.objective.length > 20, n.id);
    assert.ok(n.formats.length > 0 && n.formats.every((f) => FORMATS.has(f)), n.id);
  }
  assert.deepEqual(NODES.filter((n) => !n.prereqs.length).map((n) => n.id), ["w-what-is-poker"]);
});
check("every existing concept id is carried by at least one node", () => {
  const carried = new Set(NODES.map((n) => n.legacy?.concept).filter(Boolean));
  for (const c of CONCEPTS) assert.ok(carried.has(c), c);
});
check("every one of the 20 existing shared lessons is mapped, with its audit verdict", () => {
  assert.equal(COURSE_ORDER.length, 20);
  const mapped = new Map(NODES.filter((n) => n.legacy?.lesson).map((n) => [n.legacy.lesson, n.legacy.verdict]));
  for (const id of COURSE_ORDER) {
    assert.ok(mapped.has(id), id);
    assert.ok(["KEEP", "REVISE"].includes(mapped.get(id)), id);
  }
  const revise = [...mapped].filter(([, v]) => v === "REVISE").map(([k]) => k).sort();
  assert.deepEqual(revise, ["bluffing-workspace-v1", "cbetting-workspace-v1", "equity-workspace-v1", "hand-rankings-workspace-v1", "semibluff-workspace-v1"]);
  // The shipped positions lesson teaches opening ranges: it maps to p-position-value only, and
  // r-seats-blinds is a new lesson (TREE-PROPOSALS.md, accepted 2026-10-06).
  assert.deepEqual(NODES.filter((n) => n.legacy?.lesson === "positions-workspace-v1").map((n) => n.id), ["p-position-value"]);
  assert.equal(NODES.find((n) => n.id === "r-seats-blinds").legacy, null);
});
check("practice links use real puzzle topics and Gauntlet archetypes", () => {
  for (const n of NODES) {
    if (!n.practice) continue;
    if (n.practice.topic) assert.ok(PUZZLE_TOPICS.includes(n.practice.topic) || PUZZLE_TOPICS.some?.((t) => t.id === n.practice.topic), `${n.id} topic ${n.practice.topic}`);
    if (n.practice.opponent) assert.ok(ARCHETYPES.includes(n.practice.opponent), `${n.id} opponent`);
  }
});
check("paths start on real nodes; every track has a node", () => {
  const ids = new Set(NODES.map((n) => n.id));
  for (const p of PATHS) assert.ok(ids.has(p.start), p.id);
  for (const t of TRACKS) assert.ok(NODES.some((n) => n.track === t.id), t.id);
});
check("pot odds sits after outs, the 2/4 rule and equity; the welcome track comes first", () => {
  assert.ok(depthOf("m-pot-odds") > depthOf("m-equity"));
  assert.ok(depthOf("m-equity") > depthOf("m-rule-2-4"));
  assert.equal(depthOf("w-what-is-poker"), 0);
});
check("stated facts: 1,326 starting combinations and 52 cards", () => {
  const combos = (52 * 51) / 2;
  assert.equal(combos, 1326);
  assert.ok(NODES.find((n) => n.id === "w-how-deep").objective.includes("1,326"));
  assert.equal(4 * 13, 52);
});
check("tournaments, heads-up, six-handed and live stay later scope", () => {
  for (const id of ["o-heads-up", "o-tournaments-icm", "o-six-max", "o-live"]) assert.equal(NODES.find((n) => n.id === id).scope, "later", id);
});

console.log(`academyTree: ${checks} checks passed (${NODES.length} nodes, ${TRACKS.length} tracks)`);
