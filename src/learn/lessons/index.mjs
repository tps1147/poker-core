// The 20 film-first lessons in course order (courseManifest catalog order 1 to 20). Pure data and
// lookups, no imports beyond the definitions, so every client and the server test can load it.
// Web and app import the definitions from here (mobile-lessons-v2 SPEC 3.2). Each definition's
// `media` field names its film json in ../media; clients import that json by path
// (poker-core/learn/media/<id>.v<n>.json), never through this module.
//
// One version per lesson: the film-first one. The version-1 workspace definitions stay in the web
// app; the server registry (pokerServer/src/data/lessonRuns) keeps the answer keys.
import handRankings from "./hand-rankings-workspace-v1.v2.mjs";
import positions from "./positions-workspace-v1.v2.mjs";
import bettingActions from "./betting-actions-workspace-v1.v2.mjs";
import outs from "./outs-workspace-v1.v2.mjs";
import rule24 from "./rule-2-4-workspace-v1.v2.mjs";
import equity from "./equity-workspace-v1.v2.mjs";
import potOdds from "./pot-odds-workspace-v2.v2.mjs";
import impliedOdds from "./implied-odds-workspace-v1.v1.mjs";
import ev from "./ev-workspace-v1.v1.mjs";
import spr from "./spr-workspace-v1.v1.mjs";
import startingHands from "./starting-hands-workspace-v1.v1.mjs";
import rfiPosition from "./rfi-position-workspace-v1.v1.mjs";
import blindDefense from "./blind-defense-workspace-v1.v1.mjs";
import threeBetting from "./three-betting-workspace-v1.v1.mjs";
import ranges from "./ranges-workspace-v1.v1.mjs";
import boardTexture from "./board-texture-workspace-v1.v1.mjs";
import cbetting from "./cbetting-workspace-v1.v1.mjs";
import betSizing from "./bet-sizing-workspace-v1.v1.mjs";
import semibluff from "./semibluff-workspace-v1.v1.mjs";
import bluffing from "./bluffing-workspace-v1.v1.mjs";

// Web lessons/index.js COURSE_ORDER: lessons 1 to 6 are the foundations; pot odds (7), the deeper
// math (8 to 10), the preflop tier (11 to 14), the postflop fundamentals (15 to 18) and pressure
// (19 to 20) follow them.
export const COURSE_ORDER = Object.freeze([
  "hand-rankings-workspace-v1", "positions-workspace-v1", "betting-actions-workspace-v1",
  "outs-workspace-v1", "rule-2-4-workspace-v1", "equity-workspace-v1", "pot-odds-workspace-v2",
  "implied-odds-workspace-v1", "ev-workspace-v1", "spr-workspace-v1",
  "starting-hands-workspace-v1", "rfi-position-workspace-v1", "blind-defense-workspace-v1", "three-betting-workspace-v1",
  "ranges-workspace-v1", "board-texture-workspace-v1", "cbetting-workspace-v1", "bet-sizing-workspace-v1",
  "semibluff-workspace-v1", "bluffing-workspace-v1",
]);
export const FOUNDATIONS_COUNT = 6;

// The definitions, in COURSE_ORDER.
export const FILM_FIRST_LESSONS = Object.freeze([
  handRankings, positions, bettingActions, outs, rule24, equity, potOdds,
  impliedOdds, ev, spr,
  startingHands, rfiPosition, blindDefense, threeBetting,
  ranges, boardTexture, cbetting, betSizing,
  semibluff, bluffing,
]);

// A definition by its own id, or by the catalog ids it was built from (`sourceLessonId`,
// `videoLessonId`): pot odds opens as pilot-pot-odds from the Learn tab and as lesson-pot-odds-001
// from a proof (web lessons/index.js latestDefinition, the same rule).
export function filmFirstLesson(id) {
  if (typeof id !== "string" || !id) return null;
  return FILM_FIRST_LESSONS.find((definition) => definition.id === id)
    || FILM_FIRST_LESSONS.find((definition) => definition.sourceLessonId === id || definition.videoLessonId === id)
    || null;
}

const idOf = (value) => (typeof value === "string" ? value : value?.id);

// Where a lesson sits: "Lesson 8 of 20". `milestone` marks the end of the foundations (6) and of the
// course (20), where the recap shows its marker.
export function coursePosition(id) {
  const index = COURSE_ORDER.indexOf(idOf(id));
  if (index < 0) return null;
  const number = index + 1;
  const total = COURSE_ORDER.length;
  return { number, total, foundations: number <= FOUNDATIONS_COUNT, milestone: number === FOUNDATIONS_COUNT ? "foundations" : number === total ? "course" : null };
}

// The next lesson's definition in COURSE_ORDER, or null after lesson 20.
export function nextInCourse(id) {
  const index = COURSE_ORDER.indexOf(idOf(id));
  return index < 0 ? null : FILM_FIRST_LESSONS[index + 1] || null;
}

// The stage index of each decision and the decision stages in order.
export function decisionStages(definition) {
  return definition.stages.map((stage, index) => ({ ...stage, index })).filter((stage) => stage.kind === "decision");
}

// The hands of a film-first lesson in play order, each with its decision stages.
export function lessonHands(definition) {
  const hands = [];
  for (const stage of decisionStages(definition)) {
    const last = hands.at(-1);
    if (last && last.hand === stage.hand) last.stages.push(stage);
    else hands.push({ hand: stage.hand, role: stage.role, label: stage.label, stages: [stage] });
  }
  return hands;
}

// ── ACADEMY V2: the node-id definitions of the early tracks (welcome, rules, board, math, preflop and
// postflop), 22 lessons whose definition id is their tree node id (curriculum.mjs). They are not in
// FILM_FIRST_LESSONS or COURSE_ORDER, which still describe the shipped 20. `academyLesson(id)`
// resolves a node-id definition first, then any shipped one; pass it to learnPath to list them.
// Built from lessons/academy/kitEarly.mjs; answer keys in answerKeys/<node>.mjs (not shipped).
// MERGE NOTE: defs-b adds ACADEMY_V2_LATER_LESSONS and its own academyLesson in a block like this
// one; the merged academyLesson searches both lists, then the shipped 20.
import wWhatIsPoker from "./academy/w-what-is-poker.mjs";
import wHistory from "./academy/w-history.mjs";
import wLuckAndSkill from "./academy/w-luck-and-skill.mjs";
import wHowDeep from "./academy/w-how-deep.mjs";
import wTheAcademy from "./academy/w-the-academy.mjs";
import rTheDeck from "./academy/r-the-deck.mjs";
import rBestFive from "./academy/r-best-five.mjs";
import rSeatsBlinds from "./academy/r-seats-blinds.mjs";
import rStreets from "./academy/r-streets.mjs";
import rShowdown from "./academy/r-showdown.mjs";
import rAllInSidePots from "./academy/r-all-in-side-pots.mjs";
import rFirstHand from "./academy/r-first-hand.mjs";
import bMadeVsDraw from "./academy/b-made-vs-draw.mjs";
import bTheNuts from "./academy/b-the-nuts.mjs";
import bWhatBeatsYou from "./academy/b-what-beats-you.mjs";
import bKickersCounterfeit from "./academy/b-kickers-counterfeit.mjs";
import bTextureRead from "./academy/b-texture-read.mjs";
import mChanceAsShare from "./academy/m-chance-as-share.mjs";
import mVariance from "./academy/m-variance.mjs";
import fValueBetting from "./academy/f-value-betting.mjs";
import fPotControl from "./academy/f-pot-control.mjs";
import fPlayingDraws from "./academy/f-playing-draws.mjs";

export const ACADEMY_V2_EARLY_LESSONS = Object.freeze([
  wWhatIsPoker, wHistory, wLuckAndSkill, wHowDeep, wTheAcademy,
  rTheDeck, rBestFive, rSeatsBlinds, rStreets, rShowdown, rAllInSidePots, rFirstHand,
  bMadeVsDraw, bTheNuts, bWhatBeatsYou, bKickersCounterfeit, bTextureRead,
  mChanceAsShare, mVariance,
  fValueBetting, fPotControl, fPlayingDraws,
]);

export function academyLesson(id) {
  if (typeof id !== "string" || !id) return null;
  return ACADEMY_V2_EARLY_LESSONS.find((definition) => definition.id === id) || filmFirstLesson(id);
}
