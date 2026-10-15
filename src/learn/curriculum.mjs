// THE CURRICULUM: how the course is laid out. Since 2026-10-07 it is built from the academy tree
// (academyTree.mjs): each of its 11 TRACKS is one chapter, and each chapter holds that track's NODES
// in tree order, one lesson slot per node, 59 in all. Nothing is hidden by `scope`: the four "later"
// Other Tables lessons ship too.
//
// A slot is { lesson, node, name, topic, opponent, access, legacy, scope }:
//   lesson    the lesson definition id the apps open. A node that maps to one of the 20 shipped
//             lessons (`legacy.lesson`) keeps that id, so saved runs, server keys and links still
//             line up; every other node's definition id is the node id itself (the convention new
//             definitions follow).
//   node      the tree node id.
//   legacy    true when `lesson` is one of the 20 shipped lessons.
//   access    'free' or 'pro' (see THE GATE below).
// learnPath(resolve) drops a slot whose definition does not resolve, exactly as before, so an app
// only ever shows a lesson it can open: today that is the 20 shipped lessons, now in tree order and
// in their tracks, and each new definition appears the moment it is registered.
//
// THE LOOP and THE CHAPTER HAND are unchanged. Every lesson is tied to three systems:
//   watch  the film            (the lesson run passes the film)
//   prove  the decision hands  (the lesson run reaches its takeaway)
//   drill  a puzzle topic      (DRILL_TARGET correct generated puzzles in the topic)
//   beat   an opponent         (the Gauntlet opponent of that archetype beaten)
// A lesson with no topic or no opponent has no drill or beat step. `topic` values are
// poker-core/puzzles topics; `opponent` values are the Gauntlet archetypes. Every chapter ends in a
// CHAPTER HAND: HAND_SPOTS spots on its topic with no hints, HAND_PASS right seals it. A chapter with
// no topic is sealed by proving all its lessons. (The node states open / filled / sealed are
// nodeState.mjs; it explains how they relate to chapterStanding.)
//
// THE GATE. LEVELS keep today's semantics: 'free' (all of it), 'preview' (the first lesson of every
// chapter free, the rest Pro), 'pro'. Each track sits in a level (TRACK_LEVELS), chosen so every
// shipped lesson keeps the access it has today. A slot's access is its shipped definition's own
// `access` when it has one (that field is what the server enforces today, so no shipped lesson
// changes tier), else its track level's rule. In the beta Pro is free anyway (the server's
// LESSON_PRO_GATE switch); this is the gate the switch turns back on.
//
// COMPATIBILITY (until web, mobile and the server move to track ids):
//   CHAPTERS   the 11 track chapters, then the retired chapters of the old 20-lesson path
//              (LEGACY_CHAPTERS, flagged `legacy: true`; the old "pressure" is left out because the
//              Pressure track owns that id). The retired ones stay findable by id, so
//              old chapter-hand links, old seals and the server's `CHAPTERS.find(id && topic)` keep
//              working; learnPath, lessonSlot and chapterOfLesson never return them.
//              TRACK_CHAPTERS is the clean list of the 11.
//   lessonSlot / chapterOfLesson accept an old definition id or a node id.
//   COURSE_ORDER, coursePosition and nextInCourse (lessons/index.mjs) still describe the old 20.
//
// Pure data and functions; it imports only the tree and the shipped definitions (both pure data).
import { TRACKS, NODES } from "./academyTree.mjs";
import { filmFirstLesson } from "./lessons/index.mjs";
import { OPENER_NARRATOR, OPENER_PRESENTER, TRACK_NARRATOR, TRACK_PRESENTER } from "./narrators.mjs";

export const DRILL_TARGET = 5;
export const HAND_SPOTS = 5;
export const HAND_PASS = 4;

// The loop's steps, in order, with the words both apps print.
export const LOOP_STEPS = Object.freeze([
  Object.freeze({ key: "watch", label: "Watch", line: "The coach makes the play" }),
  Object.freeze({ key: "prove", label: "Prove", line: "You make the same call" }),
  Object.freeze({ key: "drill", label: "Drill", line: "Puzzles on it" }),
  Object.freeze({ key: "beat", label: "Beat", line: "The opponent who punishes it" }),
]);

// Levels: a stage of the player's life, tied to a puzzle rating band. `access`: 'free' (all of
// it), 'preview' (the first lesson of every chapter free, the rest Pro), 'pro'.
export const LEVELS = Object.freeze([
  Object.freeze({ id: "foundations", number: 1, title: "Foundations", band: Object.freeze([0, 1150]), access: "free" }),
  Object.freeze({ id: "fundamentals", number: 2, title: "Fundamentals", band: Object.freeze([1150, 1350]), access: "preview" }),
  Object.freeze({ id: "intermediate", number: 3, title: "Intermediate", band: Object.freeze([1350, 1550]), access: "pro" }),
  Object.freeze({ id: "advanced", number: 4, title: "Advanced", band: Object.freeze([1550, 1750]), access: "pro" }),
  Object.freeze({ id: "mastery", number: 5, title: "Mastery", band: Object.freeze([1750, null]), access: "pro" }),
]);

// The level each track sits in. Welcome, rules and the board are free, as Table Literacy is today.
// The Math Spine, Preflop, Postflop and Pressure are Fundamentals ('preview'): their shipped lessons
// keep their own tier (outs to pot odds and the first two preflop lessons free, the rest Pro), and a
// new lesson is free only as its track's first. People and the Player are Intermediate, Game Theory
// Advanced and Other Tables Mastery, as the old roadmap placed hand reading, the mental game, game
// theory, tournaments, heads-up and live play.
export const TRACK_LEVELS = Object.freeze({
  welcome: "foundations", rules: "foundations", board: "foundations",
  math: "fundamentals", preflop: "fundamentals", postflop: "fundamentals", pressure: "fundamentals",
  people: "intermediate", player: "intermediate", theory: "advanced", formats: "mastery",
});

// Each track's coach, its presenter (narrators.mjs TRACK_PRESENTER: the same gender as the track's
// narrator), and its chapter-hand puzzle topic (null: sealed by proving every lesson). The topics are
// the old chapters' own.
const TRACK_COACH = TRACK_PRESENTER;
const TRACK_TOPIC = Object.freeze({
  math: "pot-odds", preflop: "starting-hands", postflop: "postflop-cbet", pressure: "bluffing", people: "hand-reading",
});

const levelById = (id) => LEVELS.find((level) => level.id === id) || null;

// A slot's access: the shipped definition's own tier, else the track level's rule.
function accessFor(levelAccess, indexInTrack, definition) {
  if (definition?.access === "free" || definition?.access === "pro") return definition.access;
  if (levelAccess === "free") return "free";
  if (levelAccess === "preview") return indexInTrack === 0 ? "free" : "pro";
  return "pro";
}

const nodeSlot = (node, indexInTrack, levelAccess) => {
  const legacyId = node.legacy?.lesson || null;
  const definition = legacyId ? filmFirstLesson(legacyId) : null;
  return Object.freeze({
    lesson: legacyId || node.id,
    node: node.id,
    name: node.title,
    topic: node.practice?.topic || null,
    opponent: node.practice?.opponent || null,
    access: accessFor(levelAccess, indexInTrack, definition),
    legacy: !!legacyId,
    scope: node.scope,
  });
};

// The 11 track chapters, in track order, each with its node slots in tree order.
export const TRACK_CHAPTERS = Object.freeze(TRACKS.map((track) => {
  const level = TRACK_LEVELS[track.id];
  const levelAccess = levelById(level)?.access || "pro";
  const lessons = NODES.filter((node) => node.track === track.id).map((node, i) => nodeSlot(node, i, levelAccess));
  return Object.freeze({
    id: track.id, course: track.id, track: track.id, n: track.n, title: track.title, coach: TRACK_COACH[track.id],
    narrator: TRACK_NARRATOR[track.id],
    opener: Object.freeze({ id: `open-${track.id}`, narrator: OPENER_NARRATOR, coach: OPENER_PRESENTER }),
    topic: TRACK_TOPIC[track.id] || null, blurb: track.promise, level, legacy: false, lessons: Object.freeze(lessons),
  });
}));

// THE RETIRED PATH: the six chapters of the old 20-lesson path, kept verbatim (ids, coaches, hand
// topics, slot names) so old ids still resolve. `track` names the track most of its lessons moved to.
const live = (lesson, name, fields = {}) => Object.freeze({ lesson, name, topic: null, opponent: null, ...fields });
const retired = (fields) => Object.freeze({ topic: null, blurb: "", ...fields, legacy: true, lessons: Object.freeze(fields.lessons || []) });
export const LEGACY_CHAPTERS = Object.freeze([
  retired({
    id: "table-literacy", course: "core-1", track: "rules", title: "Table Literacy", coach: "ada",
    blurb: "Read the hand, the seat and the action before anything else.",
    lessons: [
      live("hand-rankings-workspace-v1", "Hand Rankings: Know What Beats What"),
      live("positions-workspace-v1", "Table Positions: Why Acting Last Wins"),
      live("betting-actions-workspace-v1", "Betting Actions: Fold, Call, Raise"),
    ],
  }),
  retired({
    id: "math-spine-1", course: "core-1", track: "math", title: "Math Spine I", coach: "mina", topic: "pot-odds",
    blurb: "Count your outs, turn them into equity, and price every call before you make it.",
    lessons: [
      live("outs-workspace-v1", "Outs: Count The Cards That Save You", { topic: "pot-odds", opponent: "drawer" }),
      live("rule-2-4-workspace-v1", "Rule of 2 and 4: Estimate Equity Fast", { topic: "pot-odds", opponent: "drawer" }),
      live("equity-workspace-v1", "Equity: Your Share Of The Pot", { topic: "pot-odds", opponent: "drawer" }),
      live("pot-odds-workspace-v2", "Pot Odds in 60 Seconds", { topic: "pot-odds", opponent: "drawer" }),
    ],
  }),
  retired({
    id: "math-spine-2", course: "core-2", track: "math", title: "Math Spine II", coach: "mina", topic: "pot-odds",
    blurb: "Money you can still win, decisions over results, and how deep the stacks are.",
    lessons: [
      live("implied-odds-workspace-v1", "Implied Odds: Future Winnings Matter", { topic: "pot-odds", opponent: "calling-station" }),
      live("ev-workspace-v1", "Expected Value: Good Decisions Can Lose", { topic: "pot-odds", opponent: "balanced" }),
      live("spr-workspace-v1", "Stack-to-Pot Ratio: Commitment Changes", { opponent: "trapper" }),
    ],
  }),
  retired({
    id: "preflop-discipline", course: "core-2", track: "preflop", title: "Preflop Discipline", coach: "reina", topic: "starting-hands",
    blurb: "Which hands to play, from which seat, and when to raise again.",
    lessons: [
      live("starting-hands-workspace-v1", "Starting Hands: Stop Playing Dominated Trash", { topic: "starting-hands", opponent: "calling-station" }),
      live("rfi-position-workspace-v1", "RFI By Position: Open Wider Late", { topic: "starting-hands", opponent: "nit" }),
      live("blind-defense-workspace-v1", "Blind Defense: Defend Enough, Not Everything", { topic: "starting-hands", opponent: "lag" }),
      live("three-betting-workspace-v1", "3-Betting: Value, Pressure, Blockers", { topic: "starting-hands", opponent: "lag" }),
    ],
  }),
  retired({
    id: "postflop-fundamentals", course: "core-2", track: "postflop", title: "Postflop Fundamentals", coach: "vale", topic: "postflop-cbet",
    blurb: "Think in ranges, read the flop, and bet with a reason and a size.",
    lessons: [
      live("ranges-workspace-v1", "Ranges: Stop Guessing One Hand", { topic: "hand-reading", opponent: "balanced" }),
      live("board-texture-workspace-v1", "Board Texture: Dry, Wet, Paired, Connected", { topic: "postflop-cbet", opponent: "tag" }),
      live("cbetting-workspace-v1", "C-Betting: When The Flop Favors You", { topic: "postflop-cbet", opponent: "tag" }),
      live("bet-sizing-workspace-v1", "Bet Sizing: Price The Story Correctly", { topic: "postflop-cbet", opponent: "calling-station" }),
    ],
  }),
  retired({
    id: "pressure", course: "core-2", track: "pressure", title: "Pressure", coach: "knox", topic: "bluffing",
    blurb: "Aggression with a backup plan, and bluffs that tell a story.",
    lessons: [
      live("semibluff-workspace-v1", "Semi-Bluffing: Equity Plus Fold Equity", { topic: "bluffing", opponent: "drawer" }),
      live("bluffing-workspace-v1", "Bluffing: Tell A Story They Can Fold To", { topic: "bluffing", opponent: "lag" }),
    ],
  }),
]);

// Every chapter id the apps or the server may hold: the tracks first, then the retired chapters.
// The old "pressure" chapter shares its id with the Pressure track, so the track owns "pressure"
// (an old "pressure" seal now reads as the Pressure track's) and the retired copy stays only in
// LEGACY_CHAPTERS.
const TRACK_IDS = new Set(TRACK_CHAPTERS.map((ch) => ch.id));
export const CHAPTERS = Object.freeze([...TRACK_CHAPTERS, ...LEGACY_CHAPTERS.filter((ch) => !TRACK_IDS.has(ch.id))]);

// Retired chapter id -> the track most of its lessons moved to.
export const LEGACY_CHAPTER_TRACKS = Object.freeze(Object.fromEntries(LEGACY_CHAPTERS.map((ch) => [ch.id, ch.track])));

// Courses: one per track, ordered within its level (the path order is the track order).
export const COURSES = Object.freeze(TRACKS.map((track) => Object.freeze({
  id: track.id, level: TRACK_LEVELS[track.id], order: track.n, title: track.title,
})));

const courseById = (id) => COURSES.find((course) => course.id === id) || null;
const trackChapter = (id) => TRACK_CHAPTERS.find((ch) => ch.id === id) || null;

// A chapter by id: a track id, or a retired chapter id (which resolves to the retired chapter).
export function chapterById(id) {
  if (typeof id !== "string" || !id) return null;
  return trackChapter(id) || LEGACY_CHAPTERS.find((ch) => ch.id === id) || null;
}

// The tree node for a lesson: by node id, or by an old definition id through `legacy.lesson`
// (also accepting the catalog ids a shipped definition was built from).
export function nodeOfLesson(id) {
  if (typeof id !== "string" || !id) return null;
  const direct = NODES.find((node) => node.id === id) || NODES.find((node) => node.legacy?.lesson === id);
  if (direct) return direct;
  const definition = filmFirstLesson(id);
  return definition ? NODES.find((node) => node.legacy?.lesson === definition.id) || null : null;
}

// The definition id a node opens: its shipped lesson's id, else the node id.
export function lessonOfNode(nodeId) {
  const node = NODES.find((n) => n.id === nodeId);
  return node ? node.legacy?.lesson || node.id : null;
}

// The lessons a course holds (one course per track).
export function courseSize(courseId) {
  return trackChapter(courseId)?.lessons.length || 0;
}

// The whole curriculum's size: { lessons, live, planned }. `live` counts slots whose definition
// resolves (`resolve`, default the shipped definitions), `planned` the rest.
export function roadmapSize(resolve = filmFirstLesson) {
  const slots = TRACK_CHAPTERS.flatMap((ch) => ch.lessons);
  const liveCount = slots.filter((slot) => resolve(slot.lesson)).length;
  return { lessons: slots.length, live: liveCount, planned: slots.length - liveCount };
}

// THE PATH the Learn tab draws: the track chapters with at least one lesson, in order, each with its
// course, level, number (1..n along the path) and its slots, each slot numbered along the whole path.
// `resolve(definitionId)` (optional) returns the definition; a slot whose definition does not
// resolve is dropped, so an app never shows a lesson it cannot open. Without `resolve` every slot of
// the 59 is listed. Retired chapters never reach the path.
export function learnPath(resolve = null) {
  const chapters = [];
  let lessonNumber = 0;
  for (const ch of TRACK_CHAPTERS) {
    const slots = ch.lessons
      .filter((slot) => slot.lesson && (!resolve || resolve(slot.lesson)))
      .map((slot) => {
        lessonNumber += 1;
        return { ...slot, number: lessonNumber, chapterId: ch.id, definition: resolve ? resolve(slot.lesson) : null };
      });
    if (!slots.length) continue;
    const course = courseById(ch.course);
    chapters.push({ ...ch, number: chapters.length + 1, courseTitle: course.title, level: course.level, lessons: slots });
  }
  return { chapters, total: lessonNumber };
}

// The track chapter a lesson sits in, by its definition id or node id.
export function chapterOfLesson(id) {
  const node = nodeOfLesson(id);
  return node ? trackChapter(node.track) : null;
}

// The slot of a lesson, by its definition id or node id.
export function lessonSlot(id) {
  const node = nodeOfLesson(id);
  if (!node) return null;
  return trackChapter(node.track)?.lessons.find((slot) => slot.node === node.id) || null;
}

// THE LOOP for one lesson. `signals`:
//   run          the lesson run's status: 'new' | 'progress' | 'complete' (web lessonStatus rule);
//   watched      a legacy record that the film was watched (the old feed's conceptProgress);
//   proved       a legacy record that the proof was won;
//   topicCorrect correct generated puzzles in the lesson's topic (null: not known);
//   beaten       whether the lesson's opponent archetype has been beaten (null: not known).
// Returns the steps that apply to the lesson ({ key, label, done }), how many are done, and the
// next step to take (null when the loop is closed).
export function lessonLoop(slot, signals = {}) {
  const run = signals.run || "new";
  const proved = run === "complete" || signals.proved === true;
  const watched = proved || run === "progress" || signals.watched === true;
  const steps = [];
  for (const step of LOOP_STEPS) {
    if (step.key === "drill" && !slot?.topic) continue;
    if (step.key === "beat" && !slot?.opponent) continue;
    let done = false;
    if (step.key === "watch") done = watched;
    else if (step.key === "prove") done = proved;
    else if (step.key === "drill") done = Number(signals.topicCorrect) >= DRILL_TARGET;
    else if (step.key === "beat") done = signals.beaten === true;
    steps.push({ key: step.key, label: step.label, line: step.line, done });
  }
  const doneCount = steps.filter((step) => step.done).length;
  return { steps, done: doneCount, total: steps.length, next: steps.find((step) => !step.done)?.key || null, proved, watched };
}

// A chapter hand's result: `correct` of HAND_SPOTS right. Passed at HAND_PASS.
export function chapterHandResult(correct, spots = HAND_SPOTS) {
  const right = Math.max(0, Math.floor(Number(correct) || 0));
  return { correct: right, spots, passed: right >= HAND_PASS, needed: HAND_PASS };
}

// Where a chapter stands: how many of its lessons are proved, whether it is sealed (its hand passed,
// or for a chapter with no topic every lesson proved) and whether its hand is open (every lesson
// proved and a topic to play). `provedIds` is a Set of proved definition ids (nodeState.mjs
// provedLessonIds builds it from node states: filled or sealed counts as proved); `seals` maps
// chapter ids to a truthy seal record.
export function chapterStanding(pathChapter, { provedIds = new Set(), seals = {} } = {}) {
  const lessons = pathChapter?.lessons || [];
  const proved = lessons.filter((slot) => provedIds.has(slot.lesson)).length;
  const all = lessons.length > 0 && proved === lessons.length;
  const hasHand = !!pathChapter?.topic;
  const sealed = hasHand ? !!seals?.[pathChapter.id] : all;
  return { proved, total: lessons.length, complete: all, sealed, handOpen: hasHand && all && !sealed, hasHand };
}

// A detected leak's FIX, the Stats page's "Fix this next": the lesson that teaches it (a shipped
// definition id), and through its curriculum slot the puzzle topic to drill and the Gauntlet
// archetype that punishes it. Leak keys are the apps' stats leak keys. `chapter` is now the track.
export const LEAK_LESSONS = Object.freeze({
  "leak-vpip": "starting-hands-workspace-v1",
  "leak-passive": "cbetting-workspace-v1",
  "leak-fold": "blind-defense-workspace-v1",
  "leak-station": "ranges-workspace-v1",
  "leak-math": "pot-odds-workspace-v2",
});

export function leakFix(leakKey) {
  const lesson = LEAK_LESSONS[leakKey] || null;
  const slot = lesson ? lessonSlot(lesson) : null;
  if (!slot) return null;
  return { lesson, name: slot.name, topic: slot.topic, opponent: slot.opponent, chapter: chapterOfLesson(lesson)?.id || null };
}
