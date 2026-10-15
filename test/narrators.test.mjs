// The face beside the voice: every lesson's presenter (its `coach`) and every opener's presenter
// read as the same gender as the narrator of that film (narrators.mjs).
//   node test/narrators.test.mjs
import assert from "node:assert/strict";
import * as learn from "../src/learn/index.mjs";

const { NARRATORS, TRACK_NARRATOR, OPENER_NARRATOR, COACH_GENDER, TRACK_CHAPTERS, TRACKS, academyLesson } = learn;

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };
const genderOf = (narrator) => NARRATORS[narrator]?.gender;
const COACH_NAMES = Object.fromEntries(Object.keys(COACH_GENDER).map((id) => [id, id[0].toUpperCase() + id.slice(1)]));

check("four narrators, one per track and one for the openers", () => {
  assert.deepEqual(Object.values(NARRATORS).map((n) => [n.id, n.name, n.gender]), [["nathan", "Nathan", "m"], ["sarah", "Sarah", "f"], ["max", "Max", "m"], ["justin", "Justin", "m"]]);
  assert.deepEqual(Object.keys(TRACK_NARRATOR), TRACKS.map((t) => t.id));
  for (const [track, id] of Object.entries(TRACK_NARRATOR)) assert.equal(id, { people: "sarah", player: "sarah", theory: "max" }[track] || "nathan", track);
  assert.equal(OPENER_NARRATOR, "justin");
});

check("every track chapter names its narrator, and its presenter matches that voice", () => {
  for (const chapter of TRACK_CHAPTERS) {
    assert.equal(chapter.narrator, TRACK_NARRATOR[chapter.id], chapter.id);
    assert.equal(COACH_GENDER[chapter.coach], genderOf(chapter.narrator), `${chapter.id}: ${chapter.coach} presents ${chapter.narrator}`);
  }
});

check("every opener's presenter matches the opener's narrator", () => {
  for (const chapter of TRACK_CHAPTERS) {
    assert.equal(chapter.opener.id, `open-${chapter.id}`);
    assert.equal(chapter.opener.narrator, OPENER_NARRATOR, chapter.id);
    assert.equal(COACH_GENDER[chapter.opener.coach], genderOf(chapter.opener.narrator), `${chapter.opener.id}: ${chapter.opener.coach} presents ${chapter.opener.narrator}`);
  }
});

check("every lesson names its track's narrator, and its presenter matches that voice", () => {
  let lessons = 0;
  for (const chapter of TRACK_CHAPTERS) {
    for (const slot of chapter.lessons) {
      const definition = academyLesson(slot.lesson);
      assert.ok(definition, `${slot.node} resolves`);
      assert.equal(definition.narrator, TRACK_NARRATOR[chapter.id], `${definition.id}: narrator`);
      assert.equal(definition.coach, chapter.coach, `${definition.id}: the track's presenter`);
      assert.equal(COACH_GENDER[definition.coach], genderOf(definition.narrator), `${definition.id}: ${definition.coach} presents ${definition.narrator}`);
      lessons += 1;
    }
  }
  assert.equal(lessons, 59);
});

check("a lesson's labels name no coach but its presenter", () => {
  for (const chapter of TRACK_CHAPTERS) {
    for (const slot of chapter.lessons) {
      const definition = academyLesson(slot.lesson);
      const others = Object.entries(COACH_NAMES).filter(([id]) => id !== definition.coach).map(([, name]) => name);
      const strings = definition.stages.flatMap((stage) => [stage.label, stage.coachLine, stage.cta, ...(stage.recapLabels || [])]).filter(Boolean);
      for (const text of strings) for (const name of others) assert.ok(!new RegExp(`\b${name}\b`).test(text), `${definition.id}: "${text}" names ${name}`);
    }
  }
});

console.log(`narrators checks passed (${checks}): every lesson and opener presented by a face that matches its voice`);
