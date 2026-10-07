import assert from "node:assert/strict";
import { handRankingsV2, validateDefinitionHands, mountState, tableProps, hasWatched, FILM_FIRST_LESSONS, filmFirstLesson, MOVE, railSegments } from "../src/learn/index.mjs";

assert.deepEqual(validateDefinitionHands(handRankingsV2), []);
const table = tableProps(mountState(handRankingsV2.hands["hr2-guided"]));
assert.equal(table.seats.length, 2);
assert.equal(hasWatched([[0, 26]], 29.6), true);
assert.equal(hasWatched([[0, 5], [25, 29.6]], 29.6), false);
// The course, the table timings and the lesson model ride on the same entry point
// (test/learnLessons.test.mjs covers them in depth).
assert.equal(FILM_FIRST_LESSONS[0], handRankingsV2);
assert.equal(filmFirstLesson("lesson-hand-rankings-001"), handRankingsV2);
assert.equal(MOVE.dimTo, 0.38);
assert.equal(railSegments(handRankingsV2, null).length, 5);
console.log("learn ok");
