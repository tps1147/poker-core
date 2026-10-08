// Film v2: anchors, the stop point, skip, the opener rule and the feedback voice.
//   node test/filmV2.test.mjs
import assert from "node:assert/strict";
import {
  canon, anchorProblems, filmStop, filmWatched, canSkip, openerDue, openerStop, voiceGroup, nextVoiceLine,
  VOICE_GROUPS, VOICE_LINES, VOICE_SILENT, voiceLineFile, FILM_ID_ALIASES, filmIdOfNode, nodeIdOfFilm, openerIdOfTrack,
  LESSON_ANCHORS,
} from "../src/learn/filmV2.mjs";
import { NODES, TRACKS, DAY_MS } from "../src/learn/index.mjs";

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };

// A timing.json-shaped lesson (captions name their anchors), and a v3-shaped one (explicit anchors).
const timing = {
  duration: 93,
  captions: [
    { at: "hook", start: 1.15, end: 5.1, text: "You need help." },
    { at: "rule", start: 7.6, end: 9, text: "So a straight or a flush wins." },
    { at: "yourTurn", start: 71.3, end: 74, text: "Your turn." },
    { at: "upNext", start: 91.4, end: 93, text: "Up next: the rule of two and four." },
  ],
};
const v3 = { durationSeconds: 93, anchors: { hook: 1.15, yourTurn: 71.3, rule: { start: 88.1 }, upNext: 91.4 }, captions: timing.captions };
const opener = { id: "open-math", duration: 18.5, captions: [{ at: "chapter", start: 0.4 }, { at: "first", start: 14.2 }] };

check("canon resolves the anchors from explicit seconds first, then captions", () => {
  const c = canon(v3);
  assert.equal(c.kind, "lesson");
  assert.equal(c.duration, 93);
  assert.deepEqual(c.anchors, { hook: 1.15, yourTurn: 71.3, rule: 88.1, upNext: 91.4 });
  assert.deepEqual(c.missing, []);
  assert.deepEqual(c.chapters.map((x) => x.key), ["hook", "yourTurn", "rule"], "scrub marks from the anchors, sorted, upNext left off");
  assert.equal(canon(timing).anchors.rule, 7.6, "a caption's own anchor when there is no explicit one");
  assert.deepEqual(canon({ duration: 50 }).missing, LESSON_ANCHORS);
  assert.equal(canon(null).duration, null);
  const marked = canon({ ...v3, chapters: [{ at: 30, label: "B" }, { at: 10, label: "A" }] });
  assert.deepEqual(marked.chapters, [{ at: 10, label: "A" }, { at: 30, label: "B" }], "explicit chapters win");
  const o = canon(opener);
  assert.equal(o.kind, "opener");
  assert.deepEqual(o.anchors, { first: 14.2 });
});

check("anchorProblems: missing, out of order, past the end", () => {
  assert.deepEqual(anchorProblems(v3), []);
  assert.deepEqual(anchorProblems(timing), ["rule comes before yourTurn"], "a film-specific 'rule' caption early in the film is not the rule card");
  assert.deepEqual(anchorProblems({ duration: 10, anchors: { hook: 1, yourTurn: 2, rule: 3, upNext: 12 } }), ["upNext is past the end"]);
  assert.deepEqual(anchorProblems({ duration: 10 }), ["missing hook", "missing yourTurn", "missing rule", "missing upNext"]);
  assert.deepEqual(anchorProblems(opener), []);
  assert.deepEqual(anchorProblems({ id: "open-board", duration: 20 }), ["missing first"]);
});

check("filmStop: upNext on a first watch, the end on a replay", () => {
  assert.equal(filmStop(v3), 91.4);
  assert.equal(filmStop(v3, { replay: false }), 91.4);
  assert.equal(filmStop(v3, { replay: true }), 93);
  assert.equal(filmStop({ duration: 60 }), 60, "no upNext: the end");
  assert.equal(filmStop(null), null);
  assert.equal(filmStop(opener), 18.5, "an opener's own stop is openerStop");
});

check("filmWatched measures the watch share to the stop point", () => {
  assert.equal(filmWatched([[0, 78]], v3), true, "78 of 91.4 is over 85%");
  assert.equal(filmWatched([[0, 77]], v3), false);
  assert.equal(filmWatched([[0, 78]], v3, { replay: true }), false, "a replay measures to the end");
  assert.equal(filmWatched([[80, 93]], v3), false, "scrubbing to the end earns nothing");
  assert.equal(filmWatched([[0, 10]], null), false);
});

check("canSkip: never on a first watch", () => {
  assert.equal(canSkip({ watched: false }), false);
  assert.equal(canSkip({}), false);
  assert.equal(canSkip(), false);
  assert.equal(canSkip({ watched: true }), true);
});

check("openerDue: plays once per track, cuts at first when you are past lesson 1", () => {
  assert.deepEqual(openerDue("math", {}), { play: true, cutAtFirst: false });
  assert.deepEqual(openerDue("math", { openers: { math: Date.UTC(2026, 9, 7) } }), { play: false, cutAtFirst: false });
  const filledFirst = { nodes: { "m-chance-as-share": { watched: true, handsDone: true } } };
  assert.deepEqual(openerDue("math", filledFirst), { play: true, cutAtFirst: true });
  const legacyFirst = { nodes: { "r-the-deck": { legacyProved: true } } };
  assert.equal(openerDue("rules", legacyFirst).cutAtFirst, true, "legacy progress counts");
  assert.equal(openerDue("math", {}, "m-outs").cutAtFirst, true, "placed later in this track");
  assert.equal(openerDue("math", {}, { start: "m-chance-as-share" }).cutAtFirst, false, "placed at lesson 1");
  assert.equal(openerDue("rules", {}, { path: "knows-rules" }).cutAtFirst, true, "placed past the whole track");
  assert.equal(openerDue("math", {}, { path: "knows-rules" }).cutAtFirst, false, "knows-rules starts at the math track's lesson 1");
  assert.equal(openerDue("math", {}, { path: "home-game" }).cutAtFirst, true, "home-game starts at m-outs");
  assert.equal(openerDue("preflop", {}, { start: "w-history" }).cutAtFirst, false, "placed in an earlier track");
  assert.deepEqual(openerDue("nope", {}), { play: false, cutAtFirst: false });
  assert.equal(openerStop(opener, { cutAtFirst: true }), 14.2);
  assert.equal(openerStop(opener, { cutAtFirst: false }), 18.5);
  assert.equal(openerStop({ id: "open-x", duration: 20 }, { cutAtFirst: true }), 20, "no first anchor: play it out");
});

check("film ids: three Welcome aliases, opener ids, round trips", () => {
  assert.deepEqual(FILM_ID_ALIASES, { "w-luck-and-skill": "w-luck", "w-how-deep": "w-deep", "w-the-academy": "w-academy" });
  for (const n of NODES) assert.equal(nodeIdOfFilm(filmIdOfNode(n.id)), n.id, n.id);
  assert.equal(nodeIdOfFilm("academy-w-luck-v2"), "w-luck-and-skill");
  assert.equal(nodeIdOfFilm("m-outs-v2"), "m-outs");
  assert.equal(nodeIdOfFilm("open-math"), null);
  assert.equal(openerIdOfTrack("math"), "open-math");
  assert.equal(openerIdOfTrack("nope"), null);
  assert.equal(TRACKS.map((t) => openerIdOfTrack(t.id)).length, 11);
});

check("voiceGroup maps every moment to one of the ten groups", () => {
  assert.deepEqual(VOICE_GROUPS, ["correct", "helped", "notquite", "open", "hint", "retry", "streak", "lesson", "clean", "chapter"]);
  assert.equal(voiceGroup("answer", { correct: true, assisted: false }), "correct");
  assert.equal(voiceGroup("answer", { correct: true, assisted: true }), "helped");
  assert.equal(voiceGroup("answer", { correct: false }), "notquite");
  assert.equal(voiceGroup("answer", { correct: null }), "open", "not graded");
  assert.equal(voiceGroup("answer", {}), "open");
  assert.equal(voiceGroup({ type: "verdict", correct: true }), "correct", "the event object can carry the result");
  assert.equal(voiceGroup("hint"), "hint");
  assert.equal(voiceGroup("retry"), "retry");
  assert.equal(voiceGroup("streak", { streak: 2 }), "streak");
  assert.equal(voiceGroup("streak", { streak: 1 }), null, "a streak speaks from 2 days");
  assert.equal(voiceGroup("lesson", { clean: true }), "clean");
  assert.equal(voiceGroup("lesson", { clean: false }), "lesson");
  assert.equal(voiceGroup("takeaway", {}), "lesson");
  assert.equal(voiceGroup("chapter"), "chapter");
  assert.equal(voiceGroup("showdown", { won: true }), null, "results never pick a line");
  assert.equal(voiceGroup(null), null);
});

check("nextVoiceLine rotates without repeating; the bank is the 31 Nichalia lines", () => {
  const counts = Object.fromEntries(Object.entries(VOICE_LINES).map(([g, l]) => [g, l.length]));
  assert.deepEqual(counts, { correct: 6, helped: 3, notquite: 6, open: 2, hint: 2, retry: 2, streak: 3, lesson: 3, clean: 2, chapter: 2 });
  const all = Object.values(VOICE_LINES).flat();
  assert.equal(all.length, 31);
  assert.equal(new Set(all.map((l) => l.id)).size, 31);
  const chars = all.reduce((sum, l) => sum + l.line.length, 0);
  assert.equal(chars, 961, "961 characters of spoken text, as the narration sheet counts");
  for (const g of VOICE_GROUPS) {
    const ids = VOICE_LINES[g].map((l) => l.id);
    assert.ok(ids.every((id) => id.startsWith(`${g}-`)), g);
    let last = null;
    const seen = [];
    for (let i = 0; i < ids.length * 2; i += 1) {
      const next = nextVoiceLine(g, last);
      assert.notEqual(next, last, `${g}: never the same line twice in a row`);
      seen.push(next);
      last = next;
    }
    assert.deepEqual(new Set(seen), new Set(ids), `${g}: every line comes round`);
  }
  assert.equal(nextVoiceLine("correct", "helped-01"), "correct-01", "a line from another group starts the rotation");
  assert.equal(nextVoiceLine("nope"), null);
  assert.equal(voiceLineFile("clean-02"), "/academy/voice/drills/nichalia/clean-02.mp3");
  assert.equal(VOICE_SILENT, true, "silent until the sound-library pass");
  assert.equal(DAY_MS, 86400000);
});

console.log(`filmV2 checks passed (${checks})`);
