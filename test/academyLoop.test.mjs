// The lesson loop's shared rules (academyLoop.mjs) and the film's Your-turn pause (filmV2.mjs), with
// the cases the two apps' own tests pinned before the rules moved here (Poker.com
// src/learning/academy/academyLoop.test.mjs, web src/lib/academy/academyV2Model.test.js and
// src/components/learn/player/filmV2Model.test.js), and the merged 59-lesson path.
//   node test/academyLoop.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  filmFirstLesson, decisionStages, academyLesson, learnPath, NODES, TRACKS,
  ACADEMY_V2_EARLY_LESSONS, ACADEMY_V2_LATER_LESSONS, FILM_FIRST_LESSONS,
  freshEvidence, recapTally, whyOf, isWhyStage, trackPlace, nextAfter,
  parseVtt, filmPauseAt, filmOwnPause, filmTurnPlan, PAUSE_WINDOW,
} from "../src/learn/index.mjs";

let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (error) { console.error(`FAIL ${name}`); throw error; } };
const media = (id) => JSON.parse(readFileSync(new URL(`../src/learn/media/${id}.v3.json`, import.meta.url), "utf8"));

// ---- the merged path -----------------------------------------------------------------------------
check("learnPath(academyLesson) lists all 59: the shipped 20, the early 22 and the later 17", () => {
  const path = learnPath(academyLesson);
  assert.equal(FILM_FIRST_LESSONS.length, 20);
  assert.equal(ACADEMY_V2_EARLY_LESSONS.length, 22);
  assert.equal(ACADEMY_V2_LATER_LESSONS.length, 17);
  assert.equal(path.total, 59);
  assert.equal(NODES.length, 59, "one lesson per node");
  const slots = path.chapters.flatMap((c) => c.lessons);
  assert.deepEqual(slots.map((s) => s.node), NODES.map((n) => n.id), "in tree order");
  assert.deepEqual(slots.map((s) => s.number), slots.map((_, i) => i + 1));
  assert.ok(slots.every((s) => s.definition && s.definition === academyLesson(s.lesson)));
  assert.equal(new Set(slots.map((s) => s.definition.id)).size, 59);
  assert.equal(path.chapters.length, TRACKS.length);
  assert.equal(academyLesson("w-what-is-poker"), ACADEMY_V2_EARLY_LESSONS[0], "early first");
  assert.equal(academyLesson("o-live"), ACADEMY_V2_LATER_LESSONS.at(-1), "then later");
  assert.equal(academyLesson("pot-odds-workspace-v2"), filmFirstLesson("pot-odds-workspace-v2"), "then the shipped 20");
  assert.equal(academyLesson("nope"), null);
});

// ---- freshEvidence and the tally (mobile's cases) -------------------------------------------------
check("freshEvidence and recapTally", () => {
  const def = filmFirstLesson("pot-odds-workspace-v2");
  const freshSpot = decisionStages(def).find((s) => s.role === "fresh").spotId;
  const now = Date.UTC(2026, 9, 8);
  assert.equal(freshEvidence(def, { history: [] }, now), null, "fresh hand not answered: no evidence");
  assert.equal(freshEvidence({ stages: [] }, { history: [] }, now), null, "no fresh hand: no evidence");
  assert.deepEqual(freshEvidence(def, { history: [{ spotId: freshSpot, correct: true }] }, now), { firstTry: true, hints: 0, assisted: false, at: now });
  assert.deepEqual(freshEvidence(def, { history: [{ spotId: freshSpot, correct: false }, { spotId: freshSpot, correct: true, assisted: true }] }, now), { firstTry: false, hints: 0, assisted: true, at: now });
  assert.equal(freshEvidence(def, { history: [{ spotId: freshSpot, correct: true }], hints: { [freshSpot]: true } }, now).hints, 1, "a hint up counts");
  assert.equal(freshEvidence(def, { history: [{ spotId: freshSpot, correct: true, usedHint: true }] }, now).hints, 1, "so does a hinted first try");
  assert.equal(freshEvidence(def, { history: [{ spotId: freshSpot, correct: true }] }, new Date(now)).at, now, "a Date reads as its time");
  const tally = recapTally(def, { history: [{ spotId: "pot2-guided", correct: true }, { spotId: "pot2-practice", correct: false }, { spotId: "pot2-practice", correct: true }, { spotId: freshSpot, correct: true }], hints: { "pot2-practice": true } });
  assert.deepEqual(tally, { decisions: 3, firstTry: 2, hints: 1 });
  assert.deepEqual(recapTally(def, null), { decisions: 3, firstTry: 0, hints: 0 });
});

// ---- why stages (mobile's cases) ------------------------------------------------------------------
check("whyOf and isWhyStage", () => {
  const why = { type: "why", prompt: "Why call?", options: [{ id: "a", text: "Price", correct: true }, { id: "b", text: "It looks short", correct: false, fix: "Your call is in the pot." }, { id: "c", text: "Near miss", correct: false }] };
  assert.deepEqual(whyOf(why).options.map((o) => [o.id, o.correct, o.fix]), [["a", true, null], ["b", false, "Your call is in the pot."], ["c", false, null]]);
  assert.equal(whyOf({ ...why, kind: "why", type: undefined }).prompt, "Why call?");
  assert.equal(whyOf({ kind: "decision" }), null);
  assert.equal(whyOf({ ...why, options: why.options.map((o) => ({ ...o, correct: true })) }), null, "exactly one right reason");
  assert.equal(whyOf({ ...why, prompt: "" }), null);
  assert.equal(isWhyStage(why), true);
  assert.equal(isWhyStage({ kind: "film" }), false);
  const shipped = ACADEMY_V2_EARLY_LESSONS[0].stages.find(isWhyStage);
  assert.ok(shipped, "the definitions carry kind: why");
  assert.equal(whyOf(shipped), null, "a shipped why stage carries no key: the server grades it (lessonModel whyResult)");
});

// ---- the path place and next step (web's cases) ---------------------------------------------------
check("trackPlace: Lesson n among all of the track's nodes", () => {
  const potOdds = filmFirstLesson("pot-odds-workspace-v2");
  assert.deepEqual(trackPlace(potOdds), { node: "m-pot-odds", track: "math", trackTitle: "The Math Spine", trackNumber: 3, number: 5, total: 9, last: false });
  assert.equal(trackPlace("m-pot-odds").number, 5, "by node id too");
  assert.equal(trackPlace("nope"), null);
  for (const node of NODES) {
    const inTrack = NODES.filter((n) => n.track === node.track);
    const place = trackPlace(node.id);
    assert.equal(place.number, inTrack.indexOf(node) + 1, `${node.id}: mobile's trackIndex`);
    assert.equal(place.total, inTrack.length);
  }
});

check("nextAfter: the next playable slot along the path", () => {
  const resolve = (id) => filmFirstLesson(id);
  const next = nextAfter(filmFirstLesson("pot-odds-workspace-v2"), { resolve });
  assert.equal(next.slot.node, "m-ev");
  assert.equal(next.newTrack, false);
  const spr = nextAfter("spr-workspace-v1", { resolve });
  assert.equal(spr.newTrack, true);
  assert.equal(spr.track, "preflop");
  assert.deepEqual(spr.chapterHand, { track: "math", open: false });
  // With all 59 resolving, every lesson's next is the following node.
  for (let i = 0; i < NODES.length - 1; i += 1) {
    const after = nextAfter(NODES[i].id, { resolve: academyLesson });
    assert.equal(after.slot.node, NODES[i + 1].id);
    assert.equal(after.definition, academyLesson(after.slot.lesson));
    assert.equal(after.newTrack, NODES[i + 1].track !== NODES[i].track);
  }
  const last = nextAfter(NODES.at(-1).id, { resolve: academyLesson });
  assert.equal(last.slot, null);
  assert.equal(nextAfter("nope"), null);
});

// ---- the Your-turn pause (web's cases) ------------------------------------------------------------
const VTT = `WEBVTT

21
00:01:01.620 --> 00:01:05.560
10 chips a call, on average, versus folding.

22
00:01:05.560 --> 00:01:08.670
Your turn. Now they go all-in for 100.

23
00:01:08.670 --> 00:01:12.640
Still 30%. Call or fold?

24
00:01:12.640 --> 00:01:18.030
The final pot's 300... your price, about 33%.
`;

check("parseVtt", () => {
  const cues = parseVtt(VTT);
  assert.equal(cues.length, 4);
  assert.deepEqual(cues[1], { start: 65.56, end: 68.67, text: "Your turn. Now they go all-in for 100." });
  assert.deepEqual(parseVtt(""), []);
  assert.deepEqual(parseVtt(VTT.replace(/\n/g, "\r\n")), cues, "CRLF files too");
});

check("filmPauseAt lands after the film asks, not on the anchor", () => {
  const cues = parseVtt(VTT);
  const pot = media("m-pot-odds");
  assert.equal(pot.anchors.yourTurn, 65.56);
  assert.equal(filmPauseAt(pot, { cues }), 72.64);
  assert.equal(filmPauseAt(pot, { cues, explicit: 70 }), 70);
  assert.equal(filmPauseAt(media("w-what-is-poker"), { cues }), null, "no yourTurn anchor: no pause");
  assert.equal(filmPauseAt(pot), 65.56, "no cues: on the anchor");
  assert.equal(PAUSE_WINDOW, 15);
  const queens = { anchors: { yourTurn: 73.1 } };
  const qCues = [{ start: 73.1, end: 75.78, text: "Your turn. Queens, in the big blind." }, { start: 75.78, end: 77.94, text: "The button opens to 25." }, { start: 77.94, end: 79.9, text: "Choose first..." }, { start: 79.9, end: 82, text: "Queens are value." }];
  assert.equal(filmPauseAt(queens, { cues: qCues }), 79.9, "a trailing ellipsis also asks");
  assert.equal(filmPauseAt(queens, { cues: [{ start: 70, end: 75, text: "Your turn, queens." }, { start: 75, end: 80, text: "Pick." }] }), 75, "no question: the end of the cue the anchor starts in");
  assert.equal(filmPauseAt(queens, { cues: [{ start: 100, end: 101, text: "Later?" }] }), 73.1, "no cue in the window: the anchor");
  // The timing.json captions are cues when no VTT is passed.
  assert.equal(filmPauseAt({ ...queens, captions: qCues.map((c) => ({ ...c, at: null })) }), 79.9);
});

check("filmOwnPause and filmTurnPlan: the definition's own pause wins only for its own film", () => {
  const pot = media("m-pot-odds");
  const stage = { kind: "film", pause: { at: null, anchor: "end", film: "m-pot-odds", spotId: "s1", spot: { kind: "choice" } } };
  assert.equal(filmOwnPause(stage, "p-three-bet"), null, "another film's pause never applies");
  assert.equal(filmOwnPause({ pause: { at: 14.4, spot: {} } }, "m-pot-odds"), null, "a v1 pause names no v2 film");
  assert.equal(filmOwnPause(stage, "m-pot-odds"), stage.pause);
  assert.deepEqual(filmTurnPlan(stage, pot), { at: null, atEnd: true });
  assert.deepEqual(filmTurnPlan({ pause: { ...stage.pause, at: 70, anchor: "yourTurn" } }, pot), { at: 70, atEnd: false });
  assert.deepEqual(filmTurnPlan(null, pot, { cues: [{ start: 65.56, end: 68, text: "Call or fold?" }] }), { at: 68, atEnd: false });
  assert.deepEqual(filmTurnPlan({ kind: "film" }, pot, { cues: parseVtt(VTT) }), { at: 72.64, atEnd: false });
});

console.log(`academyLoop ok (${checks} checks): the 59-lesson path, fresh evidence, tally, why, place, next, Your-turn pause`);
