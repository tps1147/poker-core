// The 20 film-first lessons and the shared lesson model (mobile-lessons-v2 SPEC 3.2, 7).
//   node test/learnLessons.test.mjs
// Plain Node, no network. The CDN check is scripts/check-learn-media.mjs (not part of npm test).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as learn from "../src/learn/index.mjs";
import * as scriptedHandModule from "../src/learn/scriptedHand.mjs";
import * as filmWatchModule from "../src/learn/filmWatch.mjs";
import * as motionModule from "../src/learn/motion.mjs";
import * as lessonsModule from "../src/learn/lessons/index.mjs";
import * as lessonModelModule from "../src/learn/lessonModel.mjs";
import { mediaUrls, portraitGaps } from "../scripts/check-learn-media.mjs";

const LEARN_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "learn");
const AREAS = ["rabbits-burrow", "croquet-lawn", "tea-garden", "hall-of-mirrors", "clubshire-court", "diamond-vault", "spade-keep", "heart-throne"];
const ROLES = ["guided", "practice", "fresh"];
const {
  COURSE_ORDER, FILM_FIRST_LESSONS, filmFirstLesson, coursePosition, nextInCourse, decisionStages, lessonHands,
  validateDefinitionHands, expandScript, initialState, stateAfter, runUntilBlocked,
} = learn;

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };
const lesson = (id) => {
  const definition = filmFirstLesson(id);
  assert.ok(definition, `${id} is registered`);
  return definition;
};
const readMedia = (definition) => JSON.parse(readFileSync(join(LEARN_DIR, definition.media), "utf8"));

// ---- the namespace ------------------------------------------------------------------------------
check("every module's exports reach poker-core/learn (no silent export * clash)", () => {
  const modules = { scriptedHand: scriptedHandModule, filmWatch: filmWatchModule, motion: motionModule, lessons: lessonsModule, lessonModel: lessonModelModule };
  const owners = {};
  for (const [name, mod] of Object.entries(modules)) {
    for (const key of Object.keys(mod)) {
      if (key === "default") continue;
      assert.ok(!owners[key], `${key} is exported by both ${owners[key]} and ${name}`);
      owners[key] = name;
      assert.ok(key in learn, `poker-core/learn exports ${key} (from ${name})`);
      assert.equal(learn[key], mod[key], `poker-core/learn.${key} is ${name}'s`);
    }
  }
});

check("the names SPEC 3.2 promises are exported", () => {
  const names = [
    // lessons/index.mjs
    "COURSE_ORDER", "FILM_FIRST_LESSONS", "filmFirstLesson", "coursePosition", "nextInCourse", "decisionStages", "lessonHands",
    // lessonModel.mjs
    "railSegments", "segmentForStep", "tablePlan", "releasedAnswers", "spotLadder", "chipScore", "handName", "recapRows", "entryState", "filmMeta",
    "DEFAULT_ACTION_LABELS", "actionLabel", "answerText", "cardText", "planHand", "fitsActionBar", "priceLine", "ledgerLines", "feedbackCopy",
    "verdictTone", "completingCards",
    // motion.mjs, now re-exported
    "MOVE", "CHIP_TO_POT_MS", "CHIP_TO_WINNER_MS", "CHIP_STAGGER_S", "STREAM_CHIPS", "FLIP_S", "REVEAL_STAGGER_S", "COMMUNITY_STAGGER", "HOLE_STAGGER", "POT_ROLL_MS", "SPRING_SETTLE",
    // unchanged surface the app and web already import
    "handRankingsV2", "createLessonRunController", "WATCH_SHARE", "hasWatched", "mountState", "tableProps", "stateAfter", "runUntilBlocked", "validateDefinitionHands",
    "ACTIONS", "HERO", "anchorFor",
  ];
  for (const name of names) assert.ok(learn[name] !== undefined, `poker-core/learn exports ${name}`);
  assert.equal(learn.handRankingsV2, FILM_FIRST_LESSONS[0], "handRankingsV2 is lesson 1");
});

// ---- the course ---------------------------------------------------------------------------------
check("COURSE_ORDER and FILM_FIRST_LESSONS: 20 unique lessons, same order", () => {
  assert.equal(COURSE_ORDER.length, 20);
  assert.equal(new Set(COURSE_ORDER).size, 20);
  assert.equal(FILM_FIRST_LESSONS.length, 20);
  assert.deepEqual(FILM_FIRST_LESSONS.map((definition) => definition.id), [...COURSE_ORDER]);
  assert.ok(Object.isFrozen(COURSE_ORDER) && Object.isFrozen(FILM_FIRST_LESSONS));
  assert.equal(new Set(FILM_FIRST_LESSONS.map((definition) => definition.media)).size, 20, "one media json per lesson");
});

check("lookups: definition id, sourceLessonId and videoLessonId", () => {
  assert.equal(filmFirstLesson("pilot-pot-odds")?.id, "pot-odds-workspace-v2");
  assert.equal(filmFirstLesson("pilot-pot-odds")?.version, 2);
  assert.equal(filmFirstLesson("lesson-pot-odds-001"), filmFirstLesson("pilot-pot-odds"));
  assert.equal(filmFirstLesson("pot-odds-workspace-v2"), filmFirstLesson("pilot-pot-odds"));
  assert.equal(filmFirstLesson("lesson-3betting-001")?.id, "three-betting-workspace-v1");
  assert.equal(filmFirstLesson("lesson-fold-equity-semibluff-001")?.id, "semibluff-workspace-v1");
  for (const definition of FILM_FIRST_LESSONS) {
    assert.equal(filmFirstLesson(definition.id), definition);
    assert.equal(filmFirstLesson(definition.sourceLessonId), definition, `${definition.id} by sourceLessonId`);
    assert.equal(filmFirstLesson(definition.videoLessonId), definition, `${definition.id} by videoLessonId`);
  }
  assert.equal(filmFirstLesson("no-such-lesson"), null);
  assert.equal(filmFirstLesson(""), null);
  assert.equal(filmFirstLesson(undefined), null);
});

check("coursePosition and nextInCourse chain 1 to 20", () => {
  COURSE_ORDER.forEach((id, index) => {
    const position = coursePosition(id);
    assert.equal(position.number, index + 1);
    assert.equal(position.total, 20);
    assert.equal(position.foundations, index < 6);
    assert.equal(nextInCourse(id), FILM_FIRST_LESSONS[index + 1] || null);
  });
  assert.equal(coursePosition("equity-workspace-v1").milestone, "foundations");
  assert.equal(coursePosition("bluffing-workspace-v1").milestone, "course");
  assert.equal(coursePosition("outs-workspace-v1").milestone, null);
  assert.equal(nextInCourse(lesson("hand-rankings-workspace-v1")).id, "positions-workspace-v1", "accepts a definition");
  assert.equal(nextInCourse("bluffing-workspace-v1"), null);
  assert.equal(coursePosition("pilot-pot-odds"), null, "positions are by definition id");
});

// ---- every definition -----------------------------------------------------------------------------
function walk(value, visit, trail = "") {
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visit, `${trail}[${index}]`));
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) { visit(key, `${trail}.${key}`); walk(item, visit, `${trail}.${key}`); }
}

for (const definition of FILM_FIRST_LESSONS) {
  const id = definition.id;
  check(`${id}: shape`, () => {
    assert.equal(definition.flow, "film-first");
    assert.ok(Number.isInteger(definition.version) && definition.version >= 1);
    assert.ok(definition.sourceLessonId && definition.videoLessonId, `${id} catalog ids`);
    assert.ok(["free", "pro"].includes(definition.access), `${id} access`);
    assert.ok(definition.coach && definition.title && definition.feedback?.found && definition.feedback?.missed && definition.feedback?.open, `${id} coach, title, feedback`);
    assert.match(definition.media, /^media\/[a-z0-9-]+\.v\d+\.json$/, `${id} media path`);
  });

  check(`${id}: validateDefinitionHands`, () => assert.deepEqual(validateDefinitionHands(definition), []));

  check(`${id}: stage grammar`, () => {
    const kinds = definition.stages.map((stage) => stage.kind);
    assert.equal(kinds[0], "welcome", `${id} opens on the entry card`);
    assert.equal(kinds[1], "film", `${id} then the film`);
    assert.equal(kinds.filter((kind) => kind === "film").length, 1, `${id} one film`);
    assert.equal(kinds.at(-1), "takeaway", `${id} ends on the recap`);
    assert.ok(kinds.slice(2, -1).length > 0 && kinds.slice(2, -1).every((kind) => kind === "decision"), `${id} decisions between film and recap`);
    const decisions = decisionStages(definition);
    for (const stage of decisions) {
      assert.ok(definition.hands[stage.hand], `${stage.spotId} plays on a registered hand`);
      assert.ok(ROLES.includes(stage.role), `${stage.spotId} role`);
      assert.ok(definition.spots[stage.spotId], `${stage.spotId} spot`);
      assert.ok(stage.label && stage.next, `${stage.spotId} label and next`);
    }
    assert.deepEqual(Object.keys(definition.spots).sort(), decisions.map((stage) => stage.spotId).sort(), `${id} one stage per spot`);
    const hands = lessonHands(definition);
    assert.deepEqual([...new Set(hands.map((hand) => hand.role))], ROLES, `${id} guided, practice, fresh, in that order`);
    assert.equal(new Set(hands.map((hand) => hand.hand)).size, hands.length, `${id} a hand is never revisited later`);
    const labels = definition.stages.at(-1).recapLabels;
    assert.ok(Array.isArray(labels) && labels.length === hands.length, `${id} one recap label per hand`);
  });

  check(`${id}: no answer keys, opponent cards only as an earned reveal`, () => {
    walk(definition, (key, trail) => {
      assert.ok(!["key", "correct", "correctAction", "answer"].includes(key), `${id}${trail} must not ship a key`);
      if (key !== "opponent") return;
      const seat = /.seats.opponent$/.test(trail);
      const hand = /^.hands.[^.]+.opponent$/.test(trail);
      assert.ok(seat || hand, `${id}${trail} must not ship an opponent hand`);
    });
    for (const owner of [definition, ...Object.values(definition.hands || {})]) {
      const seat = owner.seats?.opponent;
      if (seat) assert.ok(Object.keys(seat).every((key) => ["name", "stack", "botId"].includes(key)), `${id} opponent seat carries no cards`);
    }
    for (const [handId, hand] of Object.entries(definition.hands || {})) {
      assert.ok(Object.keys(hand.opponent || {}).every((key) => key === "reveal"), `${handId} opponent`);
      if (hand.opponent?.reveal) {
        const decide = hand.script.findIndex((step) => step.do === "decide");
        assert.ok(decide >= 0 && hand.script.findIndex((step) => step.do === "showdown") > decide, `${handId} reveals only at a showdown after the decision`);
      }
    }
  });

  check(`${id}: no six-max hand has a showdown (the ring has no reveal path)`, () => {
    for (const [handId, hand] of Object.entries(definition.hands)) {
      if (hand.layout !== "six-max") continue;
      assert.ok(!expandScript(hand).some((step) => step.do === "showdown"), `${handId} is six-max and shows down`);
      assert.ok(!learn.handSeats(hand).some((seat) => seat.reveal), `${handId} is six-max and reveals a seat`);
    }
  });

  check(`${id}: media json`, () => {
    const file = join(LEARN_DIR, definition.media);
    assert.ok(existsSync(file), `${definition.media} exists`);
    const media = readMedia(definition);
    assert.equal(media.contentId, id, `${id} media contentId`);
    assert.equal(media.contentVersion, definition.version, `${id} media contentVersion`);
    assert.ok(media.durationSeconds > 0, `${id} durationSeconds`);
    assert.ok(Array.isArray(media.cues) && media.cues.length > 0, `${id} cues`);
    assert.ok(media.beats && typeof media.beats === "object" && Object.keys(media.beats).length > 0, `${id} beats`);
    assert.ok(AREAS.includes(media.defaultArea), `${id} defaultArea`);
    assert.deepEqual(Object.keys(media.videoByArea || {}).sort(), [...AREAS].sort(), `${id} videoByArea has the 8 areas`);
    for (const area of AREAS) assert.ok(media.videoByArea[area].video && media.videoByArea[area].poster, `${id} ${area} film and poster`);
    // The portrait rule (SPEC 3.3): both fields or neither, and then every area.
    assert.equal(!!media.portraitByArea, !!media.portraitFrame, `${id} portraitByArea only with portraitFrame`);
    if (media.portraitByArea) {
      assert.deepEqual(Object.keys(media.portraitByArea).sort(), [...AREAS].sort(), `${id} portraitByArea has the 8 areas`);
      for (const area of AREAS) assert.ok(media.portraitByArea[area].video && media.portraitByArea[area].poster, `${id} ${area} portrait film and poster`);
      assert.deepEqual(portraitGaps(media), []);
    }
    // What the film step and the hands read from it.
    const film = definition.stages.find((stage) => stage.kind === "film");
    // A beat is a time, or a list of timed marks (rfi "seats"); either way it must exist.
    for (const chapter of film.chapters || []) if (chapter.beat != null) assert.ok(media.beats[chapter.beat] != null, `${id} chapter beat ${chapter.beat}`);
    if (film.pause) assert.ok(film.pause.at > 0 && film.pause.at < media.durationSeconds, `${id} pause inside the film`);
    for (const [spotId, spot] of Object.entries(definition.spots)) {
      if (spot.hear != null) assert.ok(Number.isInteger(spot.hear) && spot.hear >= 0 && spot.hear < media.cues.length, `${spotId} hear cue`);
    }
  });

  // The walk (SPEC 7): every hand, played with neutral answers, reaches its decisions in stage order
  // and finishes. Then every choice of every action spot finishes the hand too (branches included).
  const neutral = (spot) => {
    if (spot.decision === "action") return { action: spot.choices.includes("call") ? "call" : spot.choices[0], correct: null };
    if (spot.decision === "count") return { response: { value: 0 }, correct: null };
    if (spot.decision === "estimate") return { response: { band: spot.bands[0].id ?? spot.bands[0] }, correct: null };
    return { response: { cards: [...spot.hero, ...spot.board].slice(0, 5) }, correct: null };
  };
  const play = (hand, choose) => {
    const from = hand.startAt || 0;
    const answers = {};
    const performed = [];
    const reached = [];
    let state = from > 0 ? stateAfter(hand, from, { answers }) : initialState(hand);
    let next = from;
    for (let guard = 0; guard < 100; guard += 1) {
      const run = runUntilBlocked(hand, state, next, { answers, performed }, { reduce: true });
      state = run.state;
      next = run.next;
      if (!run.blocked) return { reached, finished: next === expandScript(hand).length, state };
      if (run.blocked.kind === "decide") {
        reached.push(run.blocked.spotId);
        answers[run.blocked.spotId] = choose(run.blocked.spotId);
      } else if (run.blocked.kind === "action") performed.push(run.blocked.index);
      else return { reached, finished: false, blocked: run.blocked, state };
    }
    return { reached, finished: false, blocked: "loop", state };
  };

  check(`${id}: every hand plays through its decisions`, () => {
    for (const hand of lessonHands(definition)) {
      const script = definition.hands[hand.hand];
      const result = play(script, (spotId) => neutral(definition.spots[spotId]));
      assert.ok(result.finished, `${hand.hand} finishes (blocked on ${JSON.stringify(result.blocked)})`);
      assert.deepEqual(result.reached, hand.stages.map((stage) => stage.spotId), `${hand.hand} reaches its decisions in stage order`);
      for (const stage of hand.stages) {
        const spot = definition.spots[stage.spotId];
        if (spot.decision !== "action") continue;
        for (const choice of spot.choices) {
          const branch = play(script, (spotId) => (spotId === stage.spotId ? { action: choice, correct: null } : neutral(definition.spots[spotId])));
          assert.ok(branch.finished, `${hand.hand}: ${stage.spotId} = ${choice} finishes (blocked on ${JSON.stringify(branch.blocked)})`);
        }
      }
    }
  });
}

// ---- the lesson model -----------------------------------------------------------------------------
const {
  railSegments, segmentForStep, tablePlan, planHand, releasedAnswers, answersSignature, spotLadder, chipScore, handName, recapRows,
  entryState, filmMeta, actionLabel, answerText, cardText, fitsActionBar, priceLine, ledgerLines, feedbackCopy, verdictTone, verdictWords,
  feedbackBody, hintText, hintLabel, tableHighlights, outsSummary, completingCards, stageHand,
} = learn;
const outs = lesson("outs-workspace-v1");
const stageOf = (definition, spotId) => definition.stages.findIndex((stage) => stage.spotId === spotId);
const attempt = (spotId, correct, extra = {}) => ({ spotId, correct, ...extra });

check("railSegments: one segment per hand (outs: Film, Mina’s hand, Practice, Fresh hand, Recap)", () => {
  const segments = railSegments(outs, null);
  assert.deepEqual(segments.map((segment) => segment.label), ["Film", "Mina’s hand", "Practice", "Fresh hand", "Recap"]);
  assert.deepEqual(segments.map((segment) => segment.key), ["film", "outs2-guided", "outs2-practice", "outs2-fresh", "recap"]);
  assert.deepEqual(segments.map((segment) => segment.number), [1, 2, 3, 4, 5]);
  assert.deepEqual(segments[2].stages, [3, 4], "the practice hand holds two decisions");
  assert.ok(segments.every((segment) => !segment.complete));
  assert.deepEqual(segments.map((segment) => segment.reachable), [false, false, false, false, false]);
  const run = { furthest: 4, watched: { 1: true }, answers: { "outs2-guided-call": { action: "call" }, "outs2-practice-count": { response: { value: 8 } } } };
  const later = railSegments(outs, run);
  assert.deepEqual(later.map((segment) => segment.complete), [true, true, false, false, false], "a hand fills only when all its decisions are answered");
  assert.deepEqual(later.map((segment) => segment.reachable), [true, true, true, false, false]);
  assert.equal(segmentForStep(later, 4).key, "outs2-practice");
  assert.equal(segmentForStep(later, 0), null, "the entry card is not on the rail");
  const lesson1 = railSegments(lesson("hand-rankings-workspace-v1"), null);
  assert.equal(new Set(lesson1.map((segment) => segment.key)).size, lesson1.length, "unique keys");
});

check("tablePlan and planHand: held behind the film, live on a decision, settled when revisited", () => {
  assert.deepEqual(tablePlan(outs, 0, null), { handId: "outs2-guided", mode: "held" });
  assert.deepEqual(tablePlan(outs, 1, null), { handId: "outs2-guided", mode: "held" });
  assert.deepEqual(tablePlan(outs, 3, { furthest: 3 }), { handId: "outs2-practice", mode: "live" });
  const answered = { furthest: 6, answers: { "outs2-practice-count": { response: { value: 8 } }, "outs2-practice-call": { action: "call" } } };
  assert.deepEqual(tablePlan(outs, 3, answered), { handId: "outs2-practice", mode: "settled" });
  assert.deepEqual(tablePlan(outs, 7, answered), { handId: "outs2-fresh", mode: "settled" });
  const guided = outs.hands["outs2-guided"];
  const held = planHand(outs, { handId: "outs2-guided", mode: "held" });
  assert.equal(held.startAt, 1);
  assert.deepEqual(held.script, guided.script.slice(0, 1));
  assert.equal(planHand(outs, { handId: "outs2-guided", mode: "live" }), guided);
  assert.equal(planHand(outs, { handId: "outs2-fresh", mode: "settled" }).startAt, expandScript(outs.hands["outs2-fresh"]).length);
  assert.equal(planHand(outs, { handId: null, mode: "held" }), null);
  assert.equal(stageHand(outs, 3), outs.hands["outs2-practice"]);
  assert.equal(stageHand(outs, 1), null);
});

check("releasedAnswers: an action at once; a wrong count held until its stage is passed", () => {
  const count = stageOf(outs, "outs2-practice-count");
  const wrongCount = { response: { value: 6 }, correct: false };
  const wrongCall = { action: "fold", correct: false };
  const run = { answers: { "outs2-practice-count": wrongCount, "outs2-guided-call": wrongCall } };
  assert.deepEqual(releasedAnswers(outs, run, count), { "outs2-guided-call": wrongCall }, "the wrong count never opens the call on the same deal");
  assert.deepEqual(releasedAnswers(outs, run, count + 1), { "outs2-guided-call": wrongCall, "outs2-practice-count": wrongCount }, "Continue anyway releases it");
  const right = { response: { value: 8 }, correct: true };
  assert.deepEqual(releasedAnswers(outs, { answers: { "outs2-practice-count": right } }, count), { "outs2-practice-count": right });
  const open = { response: { value: 8 }, correct: null };
  assert.deepEqual(releasedAnswers(outs, { answers: { "outs2-practice-count": open } }, count), { "outs2-practice-count": open }, "an ungraded answer releases");
  assert.deepEqual(releasedAnswers(outs, null, count), {});
});

check("answersSignature: stable for the same attempts, changes with a new one", () => {
  const a = { x: { attemptNumber: 1, correct: false, response: { value: 3 } }, y: { attemptNumber: 1, correct: true, action: "call" } };
  const b = { y: { ...a.y }, x: { ...a.x } };
  assert.equal(answersSignature(a), answersSignature(b));
  assert.notEqual(answersSignature(a), answersSignature({ ...a, x: { ...a.x, attemptNumber: 2 } }));
  assert.equal(answersSignature({}), "");
  assert.equal(answersSignature(null), "");
});

check("spotLadder: levels 0, 1, 2; retry then show; fresh continueAnyway from the second attempt", () => {
  const spotId = "outs2-fresh-count";
  const none = spotLadder({}, spotId, "fresh");
  assert.deepEqual([none.hintLevel, none.primary, none.continueAnyway, none.attempts], [0, null, false, 0]);
  const hinted = spotLadder({ hints: { [spotId]: true } }, spotId, "fresh");
  assert.equal(hinted.hintLevel, 1);
  const miss = { correct: false };
  const once = spotLadder({ history: [attempt(spotId, false)], answers: { [spotId]: miss } }, spotId, "fresh");
  assert.deepEqual([once.hintLevel, once.primary, once.continueAnyway], [1, "retry", false], "fresh: no Continue anyway on the first miss");
  const twice = spotLadder({ history: [attempt(spotId, false), attempt(spotId, false)], answers: { [spotId]: miss } }, spotId, "fresh");
  assert.deepEqual([twice.hintLevel, twice.primary, twice.continueAnyway, twice.wrong], [2, "show", true, 2]);
  const practice = spotLadder({ history: [attempt("outs2-practice-count", false)], answers: { "outs2-practice-count": miss } }, "outs2-practice-count", "practice");
  assert.equal(practice.continueAnyway, true, "practice: Continue anyway after the first miss");
  const fixed = spotLadder({ history: [attempt(spotId, false), attempt(spotId, false), attempt(spotId, true)], answers: { [spotId]: { correct: true } } }, spotId, "fresh");
  assert.deepEqual([fixed.hintLevel, fixed.primary, fixed.continueAnyway], [1, "continue", false], "a correct answer drops the focus level");
});

check("chipScore: 3, 2, 1", () => {
  const fresh = ["outs2-fresh-count", "outs2-fresh-call"];
  const clean = fresh.map((spotId) => attempt(spotId, true));
  assert.equal(chipScore(outs, { history: clean }).score, 3);
  assert.equal(chipScore(outs, { history: [attempt("outs2-guided-call", false, { assisted: false }), attempt("outs2-guided-call", true, { assisted: true }), ...clean] }).score, 3, "one assisted attempt keeps 3");
  const twoAssisted = [attempt("outs2-guided-call", true, { assisted: true }), attempt("outs2-practice-count", true, { assisted: true }), ...clean];
  assert.equal(chipScore(outs, { history: twoAssisted }).score, 2);
  assert.equal(chipScore(outs, { history: [attempt("outs2-fresh-count", true, { usedHint: true }), attempt("outs2-fresh-call", true)] }).score, 2, "a hint on the fresh hand costs a chip");
  assert.equal(chipScore(outs, { history: [attempt("outs2-fresh-count", false), attempt("outs2-fresh-count", true), attempt("outs2-fresh-call", true)] }).score, 1);
  assert.equal(chipScore(outs, null).score, 1);
  assert.match(chipScore(outs, { history: clean }).reason, /first try/);
});

check("recapRows: one row per hand, labelled per hand", () => {
  const history = [
    attempt("outs2-guided-call", true), attempt("outs2-practice-count", false), attempt("outs2-practice-count", true, { assisted: true }),
    attempt("outs2-practice-call", true), attempt("outs2-fresh-count", false),
  ];
  const answers = {
    "outs2-guided-call": { action: "call", correct: true }, "outs2-practice-count": { response: { value: 8 }, correct: true },
    "outs2-practice-call": { action: "call", correct: true }, "outs2-fresh-count": { response: { value: 6 }, correct: false },
  };
  const rows = recapRows(outs, { history, answers });
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((row) => row.label), ["Mina’s hand", "Practice", "Fresh hand"]);
  assert.deepEqual(rows.map((row) => row.words), ["first try", "after a retry", "missed"]);
  assert.deepEqual(rows[1].facts, ["8 outs", "call"]);
  assert.deepEqual([rows[2].missed, rows[2].missedStage, rows[2].firstStage], [true, stageOf(outs, "outs2-fresh-count"), stageOf(outs, "outs2-fresh-count")]);
  assert.equal(rows[0].missedStage, null);
  const hr = lesson("hand-rankings-workspace-v1");
  const spotId = decisionStages(hr)[0].spotId;
  const five = ["Ah", "Kh", "Qh", "Jh", "Th"];
  const [first] = recapRows(hr, { history: [attempt(spotId, true)], answers: { [spotId]: { correct: true, response: { cards: five }, expected: { cards: five } } } });
  assert.deepEqual(first.cards, five);
  assert.equal(first.facts[0], handName(five));
});

check("entryState and filmMeta", () => {
  assert.deepEqual(entryState(outs, null), { status: "new", resumeStep: 1, watched: false });
  const progress = entryState(outs, { furthest: 4, stage: 4, watched: { 1: true } });
  assert.deepEqual([progress.status, progress.resumeStep, progress.resumeLabel], ["progress", 4, "Practice"]);
  assert.equal(entryState(outs, { furthest: 2, stage: 1, watched: { 1: true } }).resumeStep, 2, "a watched film resumes on the hands");
  assert.equal(entryState(outs, { furthest: outs.stages.length - 1 }).status, "complete");
  const media = readMedia(outs);
  assert.deepEqual(filmMeta(outs, media), { seconds: Math.round(media.durationSeconds), hands: 3, minutes: outs.meta.minutes });
});

check("labels: actionLabel (choiceLabels win), answerText, cardText, handName", () => {
  const sizing = lesson("bet-sizing-workspace-v1");
  const guided = sizing.spots[decisionStages(sizing)[0].spotId];
  assert.equal(actionLabel(guided, "bet"), guided.choiceLabels.bet);
  assert.equal(actionLabel(guided, "large-bet"), guided.choiceLabels["large-bet"]);
  const acts = lesson("betting-actions-workspace-v1");
  const spot = acts.spots[decisionStages(acts)[0].spotId];
  assert.equal(actionLabel(spot, "raise"), `Raise to ${spot.sizes.raise}`);
  assert.equal(actionLabel(spot, "call"), `Call ${spot.call}`);
  assert.equal(actionLabel(spot, "fold"), "Fold");
  assert.equal(actionLabel({}, "large-bet"), "Bet big");
  assert.equal(actionLabel({}, "shove"), "shove");
  assert.equal(answerText("count", { value: 8 }, { unit: "outs" }), "8 outs");
  assert.equal(answerText("estimate", { band: "b" }, { bands: [{ id: "a", label: "About 10%" }, { id: "b", label: "About 20%" }] }), "About 20%");
  assert.equal(answerText("best-five", { cards: ["Th", "As"] }), "10♥ A♠");
  assert.equal(cardText("Kd"), "K♦");
  assert.equal(handName(["Ah", "Kh", "Qh", "Jh", "Th"]), "Royal flush");
  assert.equal(handName(["Ah", "Kh"]), null);
});

check("fitsActionBar, priceLine, ledgerLines, feedbackCopy", () => {
  assert.equal(fitsActionBar(["fold", "call", "raise"]), true);
  assert.equal(fitsActionBar(["check", "bet"]), true);
  assert.equal(fitsActionBar(["fold", "call"]), true);
  assert.equal(fitsActionBar(["bet", "large-bet"]), false, "two sizes need the choice dock");
  assert.equal(fitsActionBar(["check", "call"]), false);
  const guided = outs.spots["outs2-guided-call"];
  assert.equal(priceLine(guided), "25 ÷ 250 = 10%");
  assert.deepEqual(ledgerLines(guided, null, null), [
    { key: "chance", label: "Mina’s estimate", value: "9 outs · roughly 18%" },
    { key: "price", label: "The price", value: "25 ÷ 250 = 10%" },
  ]);
  const hidden = outs.spots["outs2-fresh-call"];
  assert.deepEqual(ledgerLines(hidden, null, { hintLevel: 1 }).map((line) => line.key), ["chance"], "hidePrice hides the price before an answer");
  assert.deepEqual(ledgerLines(hidden, null, { hintLevel: 2 }).map((line) => line.key), ["chance", "price"]);
  assert.deepEqual(ledgerLines(hidden, { action: "fold" }, null).map((line) => line.key), ["chance", "price"]);
  assert.equal(ledgerLines(outs.spots["outs2-practice-count"], null, null), null);
  const call = outs.stages[stageOf(outs, "outs2-guided-call")];
  assert.equal(feedbackCopy(outs, call).found, "You found the price.");
  assert.equal(feedbackCopy(outs, outs.stages[stageOf(outs, "outs2-practice-count")]).found, "You counted it.");
});

check("verdict, feedback body and hint copy", () => {
  assert.equal(verdictTone({ correct: true }), "ok");
  assert.equal(verdictTone({ correct: false }), "miss");
  assert.equal(verdictTone({ correct: null }), "open");
  assert.equal(verdictTone(null), null);
  const copy = feedbackCopy(outs, outs.stages[stageOf(outs, "outs2-practice-count")]);
  assert.equal(verdictWords({ correct: false }, copy), copy.missed);
  assert.equal(verdictWords(null, copy), null);
  const spot = outs.spots["outs2-practice-count"];
  assert.equal(feedbackBody(spot, { correct: false }, { wrong: 1 }), spot.hint);
  assert.equal(feedbackBody(spot, { correct: false }, { wrong: 2 }), "Look at the lit cards, or let us show you.");
  assert.equal(feedbackBody(spot, { correct: true }, { wrong: 0 }), spot.explanation);
  assert.equal(feedbackBody(spot, null, null), null);
  assert.equal(hintText(spot, { hintLevel: 0 }), null);
  assert.equal(hintText(spot, { hintLevel: 1 }), spot.hint);
  assert.equal(hintText(spot, { hintLevel: 2 }), `${spot.hint} The lit cards are the place to start.`);
  assert.equal(hintLabel("fresh"), "Hint · costs a chip");
  assert.equal(hintLabel("guided"), "Hint");
});

check("tableHighlights: focus at level 2, Show me, picks, and the named five", () => {
  const spot = outs.spots["outs2-practice-count"];
  const visible = [...spot.hero, ...spot.board];
  assert.deepEqual(tableHighlights({ spot, ladder: { hintLevel: 1 } }), { highlight: [], dim: [] });
  const focused = tableHighlights({ spot, ladder: { hintLevel: 2 } });
  assert.deepEqual(focused.highlight, spot.focus);
  assert.deepEqual(focused.dim, visible.filter((code) => !spot.focus.includes(code)));
  assert.deepEqual(tableHighlights({ spot, answer: { correct: false }, ladder: { hintLevel: 2 } }), { highlight: [], dim: [] }, "nothing lit while a verdict shows");
  const hr = lesson("hand-rankings-workspace-v1");
  const spotId = decisionStages(hr)[0].spotId;
  const five = hr.spots[spotId];
  const cards = [...five.hero, ...five.board];
  const picks = tableHighlights({ spot: five, spotId, picked: cards.slice(0, 2) });
  assert.deepEqual(picks, { highlight: cards.slice(0, 2), dim: [] }, "picks light without dimming");
  const shown = tableHighlights({ spot: five, spotId, shown: { spotId, cards: cards.slice(0, 5), lit: 3 } });
  assert.deepEqual(shown.highlight, cards.slice(0, 3));
  assert.deepEqual(shown.dim, cards.slice(3));
  const right = tableHighlights({ spot: five, spotId, answer: { correct: true, expected: { cards: cards.slice(2) } } });
  assert.deepEqual(right, { highlight: cards.slice(2), dim: cards.slice(0, 2) });
  assert.deepEqual(tableHighlights({}), { highlight: [], dim: [] });
});

check("completingCards: lesson 4 has 9, 8 and 4 outs", () => {
  const guided = outs.spots["outs2-guided-call"];
  assert.equal(completingCards(guided.hero, guided.board, "flush").length, 9);
  const practice = outs.spots["outs2-practice-count"];
  const practiceOuts = completingCards(practice.hero, practice.board, practice.target);
  assert.equal(practiceOuts.length, 8);
  assert.ok(practiceOuts.every((code) => code[0] === "Q" || code[0] === "7"));
  const fresh = outs.spots["outs2-fresh-count"];
  assert.deepEqual(completingCards(fresh.hero, fresh.board, fresh.target).sort(), ["Tc", "Td", "Th", "Ts"]);
  assert.deepEqual(completingCards(fresh.hero, fresh.board, "full-house"), []);
  const summary = outsSummary(fresh);
  assert.equal(summary.count, 4);
  assert.match(summary.label, /^Your 4 outs: Ten of /);
  assert.equal(outsSummary(guided), null, "no target, no fan");
});

// ---- the media check script's pure helpers ------------------------------------------------------
check("check-learn-media: urls and portrait gaps", () => {
  const media = readMedia(lesson("hand-rankings-workspace-v1"));
  const urls = mediaUrls(media);
  assert.equal(urls.filter((item) => item.group === "landscape").length, 1 + 2 * AREAS.length);
  assert.ok(urls.some((item) => item.group === "captions") && urls.some((item) => item.group === "poster"));
  assert.equal(urls.filter((item) => item.group === "portrait").length, media.portraitByArea ? 2 * AREAS.length : 0);
  assert.deepEqual(portraitGaps({ videoByArea: media.videoByArea }), []);
  assert.deepEqual(portraitGaps({ videoByArea: { a: {} }, portraitByArea: { a: { video: "/v", poster: "/p" } } }), ["portraitByArea without portraitFrame"]);
  assert.deepEqual(portraitGaps({ videoByArea: { a: {}, b: {} }, portraitByArea: { a: { video: "/v", poster: "/p" } }, portraitFrame: {} }), ["no portrait for b"]);
});

console.log(`learnLessons ok (${checks} checks, ${FILM_FIRST_LESSONS.length} lessons)`);
