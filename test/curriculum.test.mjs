// The curriculum: built from the academy tree (11 tracks as chapters, 59 lessons in tree order), the
// gate, the compatibility layer, the lesson loop and the chapter hand.
//   node test/curriculum.test.mjs
import assert from "node:assert/strict";
import * as learn from "../src/learn/index.mjs";
import { PUZZLE_TOPICS } from "../src/puzzles/index.js";

const {
  LEVELS, COURSES, CHAPTERS, TRACK_CHAPTERS, LEGACY_CHAPTERS, LEGACY_CHAPTER_TRACKS, TRACK_LEVELS, LOOP_STEPS, DRILL_TARGET, HAND_SPOTS, HAND_PASS,
  COURSE_ORDER, FILM_FIRST_LESSONS, filmFirstLesson, learnPath, courseSize, roadmapSize, chapterOfLesson, lessonSlot, chapterById,
  nodeOfLesson, lessonOfNode, lessonLoop, chapterHandResult, chapterStanding, TRACKS, NODES,
} = learn;

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };
const ARCHETYPES = ["calling-station", "nit", "tag", "lag", "trapper", "shark", "drawer", "balanced"];
const COACHES = ["ada", "mina", "reina", "vale", "knox", "sera"];

check("five levels, rating bands that meet, each track in a level", () => {
  assert.deepEqual(LEVELS.map((l) => l.number), [1, 2, 3, 4, 5]);
  for (let i = 1; i < LEVELS.length; i += 1) assert.equal(LEVELS[i].band[0], LEVELS[i - 1].band[1], `${LEVELS[i].id} starts where ${LEVELS[i - 1].id} ends`);
  assert.equal(LEVELS[0].access, "free", "Level 1 is free");
  const levels = new Set(LEVELS.map((l) => l.id));
  for (const t of TRACKS) assert.ok(levels.has(TRACK_LEVELS[t.id]), `${t.id} sits in a level`);
  for (const course of COURSES) assert.ok(levels.has(course.level), `${course.id} in a level`);
});

check("11 track chapters in track order, each holding its nodes in tree order, 59 in all", () => {
  assert.deepEqual(TRACK_CHAPTERS.map((c) => c.id), TRACKS.map((t) => t.id));
  assert.deepEqual(TRACK_CHAPTERS.flatMap((c) => c.lessons.map((s) => s.node)), NODES.map((n) => n.id), "tree order");
  assert.equal(TRACK_CHAPTERS.flatMap((c) => c.lessons).length, 59);
  for (const ch of TRACK_CHAPTERS) {
    assert.ok(COACHES.includes(ch.coach), `${ch.id} has a coach`);
    assert.ok(ch.topic === null || PUZZLE_TOPICS.includes(ch.topic), `${ch.id}: its hand topic is a puzzle topic`);
    assert.equal(ch.blurb, TRACKS.find((t) => t.id === ch.id).promise);
    for (const slot of ch.lessons) {
      assert.ok(slot.topic === null || PUZZLE_TOPICS.includes(slot.topic), `${slot.node}: topic`);
      assert.ok(slot.opponent === null || ARCHETYPES.includes(slot.opponent), `${slot.node}: opponent`);
      assert.ok(["free", "pro"].includes(slot.access), `${slot.node}: access`);
    }
  }
  assert.equal(new Set(CHAPTERS.map((c) => c.id)).size, CHAPTERS.length, "chapter ids are unique");
});

check("nothing is hidden by scope: the four later Other Tables lessons are in the curriculum", () => {
  const formats = TRACK_CHAPTERS.find((c) => c.id === "formats").lessons.map((s) => s.node);
  for (const id of ["o-heads-up", "o-tournaments-icm", "o-six-max", "o-live"]) {
    assert.ok(formats.includes(id), id);
    assert.equal(lessonSlot(id).scope, "later", `${id} keeps its scope note`);
  }
  assert.equal(learnPath().total, 59, "without a resolver the path lists all 59");
});

check("old lesson ids map to nodes through legacy.lesson, both ways", () => {
  assert.equal(COURSE_ORDER.length, 20);
  for (const id of COURSE_ORDER) {
    const node = nodeOfLesson(id);
    assert.ok(node, id);
    assert.equal(node.legacy.lesson, id);
    assert.equal(lessonOfNode(node.id), id);
    const slot = lessonSlot(id);
    assert.equal(slot.lesson, id, "a shipped lesson keeps its definition id in its slot");
    assert.equal(slot.legacy, true);
  }
  assert.equal(nodeOfLesson("positions-workspace-v1").id, "p-position-value", "positions maps to p-position-value");
  assert.equal(nodeOfLesson("lesson-pot-odds-001").id, "m-pot-odds", "a catalog id resolves through the definition");
  assert.equal(lessonOfNode("b-the-nuts"), "b-the-nuts", "a new node's definition id is its node id");
  assert.equal(lessonSlot("b-the-nuts").legacy, false);
  assert.equal(nodeOfLesson("nope"), null);
  assert.equal(lessonOfNode("nope"), null);
});

check("the gate: every shipped lesson keeps its tier; new lessons follow their track's level", () => {
  for (const d of FILM_FIRST_LESSONS) assert.equal(lessonSlot(d.id).access, d.access, `${d.id} keeps ${d.access}`);
  const access = (id) => lessonSlot(id).access;
  for (const t of ["welcome", "rules", "board"]) for (const s of TRACK_CHAPTERS.find((c) => c.id === t).lessons) assert.equal(s.access, "free", s.node);
  assert.equal(access("m-chance-as-share"), "free", "preview: a new first lesson is free");
  assert.equal(access("m-variance"), "pro", "preview: a new later lesson is Pro");
  assert.equal(access("f-value-betting"), "pro");
  assert.equal(access("y-bankroll"), "pro", "intermediate is Pro");
  assert.equal(access("o-live"), "pro");
  assert.equal(access("f-ranges"), "pro", "a shipped definition's tier wins over the preview rule");
});

check("the path: the shipped lessons, in tree order, in their tracks, numbered 1 to 20", () => {
  const path = learnPath(filmFirstLesson);
  assert.equal(path.total, 20);
  assert.deepEqual(path.chapters.map((c) => c.id), ["rules", "math", "preflop", "postflop", "pressure"]);
  assert.deepEqual(path.chapters.map((c) => c.number), [1, 2, 3, 4, 5]);
  const numbers = path.chapters.flatMap((c) => c.lessons.map((s) => s.number));
  assert.deepEqual(numbers, Array.from({ length: 20 }, (_, i) => i + 1));
  const ids = path.chapters.flatMap((c) => c.lessons.map((s) => s.lesson));
  const treeOrder = NODES.map((n) => n.legacy?.lesson).filter(Boolean);
  assert.deepEqual(ids, treeOrder, "the path runs in tree order");
  assert.deepEqual(new Set(ids), new Set(COURSE_ORDER), "the same 20 lessons as before");
  assert.equal(path.chapters[1].lessons[3].definition.id, "pot-odds-workspace-v2", "resolved definitions ride along");
  assert.equal(path.chapters[0].level, "foundations");
  assert.equal(path.chapters[1].courseTitle, "The Math Spine");
  const partial = learnPath((id) => (id === "bluffing-workspace-v1" ? null : filmFirstLesson(id)));
  assert.equal(partial.total, 19, "a lesson whose definition does not resolve is dropped");
  assert.ok(!path.chapters.some((c) => c.legacy), "retired chapters never reach the path");
});

check("sizes", () => {
  assert.deepEqual(roadmapSize(), { lessons: 59, live: 20, planned: 39 });
  assert.equal(courseSize("rules"), 9);
  assert.equal(courseSize("math"), 9);
  assert.equal(courseSize("formats"), 5);
  assert.equal(courseSize("core-1"), 0, "the old courses are gone");
  assert.deepEqual(roadmapSize(() => true), { lessons: 59, live: 59, planned: 0 });
});

check("compatibility: retired chapter ids still resolve, and lookups take old ids", () => {
  assert.deepEqual(LEGACY_CHAPTERS.map((c) => c.id), ["table-literacy", "math-spine-1", "math-spine-2", "preflop-discipline", "postflop-fundamentals", "pressure"]);
  assert.equal(LEGACY_CHAPTERS.flatMap((c) => c.lessons).length, 20);
  for (const ch of LEGACY_CHAPTERS) {
    assert.equal(ch.legacy, true);
    assert.ok(TRACKS.some((t) => t.id === ch.track), `${ch.id} names its track`);
    assert.equal(LEGACY_CHAPTER_TRACKS[ch.id], ch.track);
  }
  // The server's and the web chapter-hand page's own lookup: CHAPTERS.find(id && topic).
  for (const id of ["math-spine-1", "math-spine-2", "preflop-discipline", "postflop-fundamentals", "pressure", "math", "preflop", "postflop", "people"]) {
    assert.ok(CHAPTERS.find((ch) => ch.id === id && ch.topic), `${id} has a chapter hand`);
  }
  assert.equal(chapterById("math-spine-1").legacy, true);
  assert.equal(chapterById("pressure").legacy, false, "the Pressure track owns its id");
  assert.equal(chapterById("math").lessons.length, 9);
  assert.equal(chapterById("nope"), null);
  assert.equal(chapterOfLesson("pot-odds-workspace-v2").id, "math");
  assert.equal(chapterOfLesson("m-pot-odds").id, "math");
  assert.equal(chapterOfLesson("positions-workspace-v1").id, "preflop");
  assert.equal(lessonSlot("pot-odds-workspace-v2").opponent, "drawer");
  assert.equal(chapterOfLesson("nope"), null);
  // Every shipped lesson keeps the topic and opponent its old slot had.
  for (const ch of LEGACY_CHAPTERS) for (const old of ch.lessons) {
    const slot = lessonSlot(old.lesson);
    assert.equal(slot.topic, old.topic, `${old.lesson} topic`);
    assert.equal(slot.opponent, old.opponent, `${old.lesson} opponent`);
  }
});

check("the loop: the steps a lesson has, and what closes each", () => {
  assert.deepEqual(LOOP_STEPS.map((s) => s.key), ["watch", "prove", "drill", "beat"]);
  const potOdds = lessonSlot("pot-odds-workspace-v2");
  const fresh = lessonLoop(potOdds, {});
  assert.deepEqual(fresh.steps.map((s) => s.key), ["watch", "prove", "drill", "beat"]);
  assert.equal(fresh.done, 0);
  assert.equal(fresh.next, "watch");
  const midway = lessonLoop(potOdds, { run: "progress" });
  assert.deepEqual([midway.done, midway.next], [1, "prove"], "a run past the film has watched");
  const proved = lessonLoop(potOdds, { run: "complete", topicCorrect: DRILL_TARGET - 1 });
  assert.deepEqual([proved.done, proved.next], [2, "drill"]);
  const drilled = lessonLoop(potOdds, { run: "complete", topicCorrect: DRILL_TARGET, beaten: false });
  assert.deepEqual([drilled.done, drilled.next], [3, "beat"]);
  const closed = lessonLoop(potOdds, { run: "complete", topicCorrect: 9, beaten: true });
  assert.deepEqual([closed.done, closed.total, closed.next], [4, 4, null]);
  assert.equal(lessonLoop(potOdds, { proved: true }).done, 2, "a legacy proof record counts");
  const handRankings = lessonLoop(lessonSlot("hand-rankings-workspace-v1"), { run: "complete" });
  assert.deepEqual(handRankings.steps.map((s) => s.key), ["watch", "prove"]);
  assert.equal(handRankings.next, null);
  const spr = lessonLoop(lessonSlot("spr-workspace-v1"), {});
  assert.deepEqual(spr.steps.map((s) => s.key), ["watch", "prove", "beat"]);
});

check("the chapter hand and the chapter's standing", () => {
  assert.deepEqual([HAND_SPOTS, HAND_PASS], [5, 4]);
  assert.equal(chapterHandResult(4).passed, true);
  assert.equal(chapterHandResult(3).passed, false);
  const path = learnPath(filmFirstLesson);
  const math = path.chapters.find((c) => c.id === "math");
  const all = new Set(math.lessons.map((s) => s.lesson));
  const some = new Set(math.lessons.slice(0, 3).map((s) => s.lesson));
  assert.deepEqual(chapterStanding(math, { provedIds: some }), { proved: 3, total: 7, complete: false, sealed: false, handOpen: false, hasHand: true });
  assert.equal(chapterStanding(math, { provedIds: all }).handOpen, true, "every lesson proved opens the hand");
  assert.equal(chapterStanding(math, { provedIds: all, seals: { math: { at: 1 } } }).sealed, true);
  const rules = path.chapters.find((c) => c.id === "rules");
  const st = chapterStanding(rules, { provedIds: new Set(rules.lessons.map((s) => s.lesson)) });
  assert.deepEqual([st.sealed, st.hasHand, st.handOpen], [true, false, false], "a track with no hand is sealed by its lessons");
  // The full track (all 9 nodes, node ids for the new ones) needs every lesson.
  const fullMath = chapterById("math");
  assert.equal(chapterStanding(fullMath, { provedIds: all }).complete, false, "the 7 shipped are not the whole track");
});

check("covers, art and leak fixes", () => {
  const { LESSON_COVERS, lessonCover, COVER_ASPECT } = learn;
  for (const id of COURSE_ORDER) assert.ok(LESSON_COVERS[id], `${id} has a cover`);
  for (const id of Object.keys(LESSON_COVERS)) assert.ok(COURSE_ORDER.includes(id), `${id} is a shipped lesson`);
  assert.deepEqual(lessonCover("pot-odds-workspace-v2"), {
    still: "/academy/covers/pot-odds-workspace-v2.jpg",
    loop: "/academy/covers/pot-odds-workspace-v2.mp4",
  });
  assert.equal(lessonCover("no-such-lesson"), null);
  assert.equal(lessonCover(null), null);
  assert.equal(COVER_ASPECT, 1.5);
  const { SKILL_MEDALS, skillMedal } = learn;
  assert.equal(SKILL_MEDALS.length, 28, "one medallion per skill node");
  assert.equal(new Set(SKILL_MEDALS).size, 28);
  assert.equal(skillMedal("t1-pot-odds"), "/academy/skills/t1-pot-odds.webp");
  assert.equal(skillMedal("t9-nope"), null);
  const { chapterArt, CHAPTER_ART, CHAPTER_HAND_ART } = learn;
  for (const ch of LEGACY_CHAPTERS) assert.ok(CHAPTER_ART[ch.id], `${ch.id} (retired) keeps its art`);
  assert.deepEqual(chapterArt("pressure"), { still: "/academy/chapters/pressure.jpg", loop: null });
  assert.equal(chapterArt("math"), null, "a track has no art yet; apps fall back");
  assert.ok(CHAPTER_HAND_ART.still && CHAPTER_HAND_ART.seal);
  const { RING_MEDALS, ringMedal, LEAK_LESSONS, leakFix } = learn;
  for (const key of Object.keys(RING_MEDALS)) assert.ok(ringMedal(key), `${key} wears a medallion`);
  for (const key of Object.keys(LEAK_LESSONS)) { const fix = leakFix(key); assert.ok(fix && fix.name && fix.topic, `${key}: a lesson with a drill topic`); }
  assert.deepEqual(leakFix("leak-passive"), { lesson: "cbetting-workspace-v1", name: "Continuation Betting", topic: "postflop-cbet", opponent: "tag", chapter: "postflop" });
  assert.equal(leakFix("leak-none"), null);
});

console.log(`curriculum checks passed (${checks}): 11 tracks as chapters, 59 lessons in tree order, the gate, the old-id layer, the path, the loop, the chapter hand, the covers`);
