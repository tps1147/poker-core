// The curriculum: levels, courses, chapters, the lesson loop and the chapter hand.
//   node test/curriculum.test.mjs
import assert from "node:assert/strict";
import * as learn from "../src/learn/index.mjs";
import { PUZZLE_TOPICS } from "../src/puzzles/index.js";

const {
  LEVELS, COURSES, CHAPTERS, LOOP_STEPS, DRILL_TARGET, HAND_SPOTS, HAND_PASS,
  COURSE_ORDER, filmFirstLesson, learnPath, courseSize, roadmapSize, chapterOfLesson, lessonSlot,
  lessonLoop, chapterHandResult, chapterStanding,
} = learn;

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };
const ARCHETYPES = ["calling-station", "nit", "tag", "lag", "trapper", "shark", "drawer", "balanced"];
const COACHES = ["ada", "mina", "reina", "vale", "knox", "sera"];

check("five levels, rating bands that meet", () => {
  assert.deepEqual(LEVELS.map((l) => l.number), [1, 2, 3, 4, 5]);
  for (let i = 1; i < LEVELS.length; i += 1) assert.equal(LEVELS[i].band[0], LEVELS[i - 1].band[1], `${LEVELS[i].id} starts where ${LEVELS[i - 1].id} ends`);
  assert.equal(LEVELS[0].access, "free", "Level 1 is free");
});

check("every course sits in a level, every chapter in a course", () => {
  const levels = new Set(LEVELS.map((l) => l.id));
  const courses = new Set(COURSES.map((c) => c.id));
  for (const course of COURSES) assert.ok(levels.has(course.level), `${course.id} in a level`);
  for (const ch of CHAPTERS) {
    assert.ok(courses.has(ch.course), `${ch.id} in a course`);
    assert.ok(COACHES.includes(ch.coach), `${ch.id} has a coach`);
    assert.ok(ch.topic === null || PUZZLE_TOPICS.includes(ch.topic), `${ch.id}: its hand topic is a puzzle topic`);
    for (const slot of ch.lessons) {
      assert.ok(slot.topic === null || PUZZLE_TOPICS.includes(slot.topic), `${slot.name}: topic`);
      assert.ok(slot.opponent === null || ARCHETYPES.includes(slot.opponent), `${slot.name}: opponent`);
    }
  }
  assert.equal(new Set(CHAPTERS.map((c) => c.id)).size, CHAPTERS.length, "chapter ids are unique");
});

check("the live slots are the 20 film-first lessons, each once, in course order", () => {
  const liveIds = learnPath().chapters.flatMap((ch) => ch.lessons.map((s) => s.lesson));
  assert.deepEqual(liveIds, [...COURSE_ORDER], "the path runs in COURSE_ORDER");
  for (const id of liveIds) assert.ok(filmFirstLesson(id), `${id} resolves`);
});

check("the roadmap is 118 lessons, 20 live", () => {
  assert.deepEqual(roadmapSize(), { lessons: 118, live: 20, planned: 98 });
  assert.equal(courseSize("core-1"), 7);
  assert.equal(courseSize("core-2"), 13);
  assert.equal(courseSize("player-types"), 8);
});

check("the path: six live chapters, numbered, lessons numbered 1 to 20", () => {
  const path = learnPath(filmFirstLesson);
  assert.equal(path.total, 20);
  assert.deepEqual(path.chapters.map((c) => c.id), ["table-literacy", "math-spine-1", "math-spine-2", "preflop-discipline", "postflop-fundamentals", "pressure"]);
  assert.deepEqual(path.chapters.map((c) => c.number), [1, 2, 3, 4, 5, 6]);
  const numbers = path.chapters.flatMap((c) => c.lessons.map((s) => s.number));
  assert.deepEqual(numbers, Array.from({ length: 20 }, (_, i) => i + 1));
  assert.equal(path.chapters[1].lessons[3].definition.id, "pot-odds-workspace-v2", "resolved definitions ride along");
  assert.equal(path.chapters[0].level, "foundations");
  assert.equal(path.chapters[2].courseTitle, "The Core Course");
  // A lesson whose definition does not resolve is dropped, never shown.
  const partial = learnPath((id) => (id === "bluffing-workspace-v1" ? null : filmFirstLesson(id)));
  assert.equal(partial.total, 19);
  // Planned chapters never reach the path.
  assert.ok(!path.chapters.some((c) => c.id === "how-a-hand-plays"));
});

check("lookups", () => {
  assert.equal(chapterOfLesson("pot-odds-workspace-v2").id, "math-spine-1");
  assert.equal(lessonSlot("pot-odds-workspace-v2").opponent, "drawer");
  assert.equal(chapterOfLesson("nope"), null);
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
  // A legacy proof record counts.
  assert.equal(lessonLoop(potOdds, { proved: true }).done, 2);
  // A lesson with no topic or opponent has a shorter loop, never an impossible step.
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
  const math1 = path.chapters[1];
  const allMath = new Set(math1.lessons.map((s) => s.lesson));
  const threeMath = new Set(math1.lessons.slice(0, 3).map((s) => s.lesson));
  assert.deepEqual(chapterStanding(math1, { provedIds: threeMath }), { proved: 3, total: 4, complete: false, sealed: false, handOpen: false, hasHand: true });
  assert.equal(chapterStanding(math1, { provedIds: allMath }).handOpen, true, "every lesson proved opens the hand");
  assert.equal(chapterStanding(math1, { provedIds: allMath, seals: { "math-spine-1": { at: 1 } } }).sealed, true);
  // Table Literacy has no hand: proving its lessons seals it.
  const table = path.chapters[0];
  const tableSt = chapterStanding(table, { provedIds: new Set(table.lessons.map((s) => s.lesson)) });
  assert.deepEqual([tableSt.sealed, tableSt.hasHand, tableSt.handOpen], [true, false, false]);
});

check("covers: every live lesson has one, each names a live lesson, paths are CDN-relative", () => {
  const { LESSON_COVERS, lessonCover, COVER_ASPECT } = learn;
  const live = CHAPTERS.flatMap((c) => c.lessons.map((s) => s.lesson).filter(Boolean));
  for (const id of live) assert.ok(LESSON_COVERS[id], `${id} has a cover`);
  for (const id of Object.keys(LESSON_COVERS)) assert.ok(live.includes(id), `${id} is a live lesson`);
  assert.deepEqual(lessonCover("pot-odds-workspace-v2"), {
    still: "/academy/covers/pot-odds-workspace-v2.jpg",
    loop: "/academy/covers/pot-odds-workspace-v2.mp4",
  });
  assert.equal(lessonCover("no-such-lesson"), null);
  assert.equal(lessonCover(null), null);
  assert.equal(COVER_ASPECT, 1.5);
  const { SKILL_MEDALS, skillMedal } = learn;
  assert.equal(SKILL_MEDALS.length, 28, 'one medallion per skill node');
  assert.equal(new Set(SKILL_MEDALS).size, 28);
  assert.equal(skillMedal('t1-pot-odds'), '/academy/skills/t1-pot-odds.webp');
  assert.equal(skillMedal('t9-nope'), null);
});

console.log(`curriculum checks passed (${checks}): five levels, the course tree, 20 live lessons in course order, a 118-lesson roadmap, the path, the lesson loop, the chapter hand, the covers`);
