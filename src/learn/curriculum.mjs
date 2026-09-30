// THE CURRICULUM: how the course is laid out and how it grows. Levels hold courses, courses hold
// chapters, chapters hold lesson slots. A live slot names a film-first definition (lessons/index.mjs);
// a planned slot is on the roadmap only (docs: Poker.com/docs/LEARNING-ROADMAP.md) and no app shows
// it. Adding a lesson is flipping a slot to live (or adding one) plus its definition, media and
// answer key: both apps draw the Learn tab from here, so no app change is needed.
//
// Every lesson is tied to three systems, which is what turns a film into training (THE LOOP):
//   watch  the film            (the lesson run passes the film)
//   prove  the decision hands  (the lesson run reaches its takeaway)
//   drill  a puzzle topic      (DRILL_TARGET correct generated puzzles in the topic)
//   beat   an opponent         (the Gauntlet opponent of that archetype beaten)
// A lesson with no topic or no opponent has no drill or beat step: its loop is shorter, never a
// step shown and impossible. `topic` values are poker-core/puzzles topics; `opponent` values are the
// Gauntlet archetypes (calling-station, nit, tag, lag, trapper, shark, drawer, balanced).
//
// Every chapter ends in a CHAPTER HAND: HAND_SPOTS spots on its topic with no hints; HAND_PASS right
// seals it. A chapter with no topic is sealed by proving all its lessons.
//
// Pure data and functions, no imports: the web, the app and the server test all load it.

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

const live = (lesson, name, fields = {}) => Object.freeze({ lesson, name, topic: null, opponent: null, ...fields });
const planned = (name, fields = {}) => Object.freeze({ lesson: null, name, topic: null, opponent: null, ...fields });
const chapter = (fields) => Object.freeze({ topic: null, blurb: "", ...fields, lessons: Object.freeze(fields.lessons || []) });

// Chapters, in course order within each course. `coach` is a coach id (ada, mina, reina, vale, knox,
// sera). `topic` is the chapter hand's puzzle topic.
export const CHAPTERS = Object.freeze([
  // ---- The Core Course, part 1 (Foundations): live ----
  chapter({
    id: "table-literacy", course: "core-1", title: "Table Literacy", coach: "ada",
    blurb: "Read the hand, the seat and the action before anything else.",
    lessons: [
      live("hand-rankings-workspace-v1", "Hand Rankings: Know What Beats What"),
      live("positions-workspace-v1", "Table Positions: Why Acting Last Wins"),
      live("betting-actions-workspace-v1", "Betting Actions: Fold, Call, Raise"),
    ],
  }),
  chapter({
    id: "math-spine-1", course: "core-1", title: "Math Spine I", coach: "mina", topic: "pot-odds",
    blurb: "Count your outs, turn them into equity, and price every call before you make it.",
    lessons: [
      live("outs-workspace-v1", "Outs: Count The Cards That Save You", { topic: "pot-odds", opponent: "drawer" }),
      live("rule-2-4-workspace-v1", "Rule of 2 and 4: Estimate Equity Fast", { topic: "pot-odds", opponent: "drawer" }),
      live("equity-workspace-v1", "Equity: Your Share Of The Pot", { topic: "pot-odds", opponent: "drawer" }),
      live("pot-odds-workspace-v2", "Pot Odds in 60 Seconds", { topic: "pot-odds", opponent: "drawer" }),
    ],
  }),
  // ---- The Core Course, part 2 (Fundamentals): live ----
  chapter({
    id: "math-spine-2", course: "core-2", title: "Math Spine II", coach: "mina", topic: "pot-odds",
    blurb: "Money you can still win, decisions over results, and how deep the stacks are.",
    lessons: [
      live("implied-odds-workspace-v1", "Implied Odds: Future Winnings Matter", { topic: "pot-odds", opponent: "calling-station" }),
      live("ev-workspace-v1", "Expected Value: Good Decisions Can Lose", { topic: "pot-odds", opponent: "balanced" }),
      live("spr-workspace-v1", "Stack-to-Pot Ratio: Commitment Changes", { opponent: "trapper" }),
    ],
  }),
  chapter({
    id: "preflop-discipline", course: "core-2", title: "Preflop Discipline", coach: "reina", topic: "starting-hands",
    blurb: "Which hands to play, from which seat, and when to raise again.",
    lessons: [
      live("starting-hands-workspace-v1", "Starting Hands: Stop Playing Dominated Trash", { topic: "starting-hands", opponent: "calling-station" }),
      live("rfi-position-workspace-v1", "RFI By Position: Open Wider Late", { topic: "starting-hands", opponent: "nit" }),
      live("blind-defense-workspace-v1", "Blind Defense: Defend Enough, Not Everything", { topic: "starting-hands", opponent: "lag" }),
      live("three-betting-workspace-v1", "3-Betting: Value, Pressure, Blockers", { topic: "starting-hands", opponent: "lag" }),
    ],
  }),
  chapter({
    id: "postflop-fundamentals", course: "core-2", title: "Postflop Fundamentals", coach: "vale", topic: "postflop-cbet",
    blurb: "Think in ranges, read the flop, and bet with a reason and a size.",
    lessons: [
      live("ranges-workspace-v1", "Ranges: Stop Guessing One Hand", { topic: "hand-reading", opponent: "balanced" }),
      live("board-texture-workspace-v1", "Board Texture: Dry, Wet, Paired, Connected", { topic: "postflop-cbet", opponent: "tag" }),
      live("cbetting-workspace-v1", "C-Betting: When The Flop Favors You", { topic: "postflop-cbet", opponent: "tag" }),
      live("bet-sizing-workspace-v1", "Bet Sizing: Price The Story Correctly", { topic: "postflop-cbet", opponent: "calling-station" }),
    ],
  }),
  chapter({
    id: "pressure", course: "core-2", title: "Pressure", coach: "knox", topic: "bluffing",
    blurb: "Aggression with a backup plan, and bluffs that tell a story.",
    lessons: [
      live("semibluff-workspace-v1", "Semi-Bluffing: Equity Plus Fold Equity", { topic: "bluffing", opponent: "drawer" }),
      live("bluffing-workspace-v1", "Bluffing: Tell A Story They Can Fold To", { topic: "bluffing", opponent: "lag" }),
    ],
  }),

  // ---- Planned (the roadmap): no app shows these until a slot goes live ----
  chapter({ id: "how-a-hand-plays", course: "hand-plays", title: "How a Hand Plays", coach: "ada", lessons: [
    planned("Blinds and the Button"), planned("The Betting Rounds"), planned("All-Ins and Side Pots"),
    planned("Showdown and Chopped Pots"), planned("Reading the Action"), planned("Table Manners"),
  ] }),
  chapter({ id: "reading-the-board", course: "reading-board", title: "Reading the Board", coach: "ada", lessons: [
    planned("The Nuts"), planned("Kickers and Counterfeits"), planned("Paired Boards"), planned("Flush Boards"), planned("What Beats You"),
  ] }),
  chapter({ id: "position-play", course: "position-play", title: "Position Play", coach: "reina", lessons: [
    planned("In Position vs Out"), planned("Pot Control"), planned("Free Cards"), planned("Checking Back"), planned("Stealing"),
  ] }),
  chapter({ id: "value-betting", course: "value-betting", title: "Value Betting", coach: "vale", lessons: [
    planned("Thin Value"), planned("Sizing for Value"), planned("Check-Raising for Value"), planned("River Value"), planned("Who Pays You"),
  ] }),
  chapter({ id: "playing-draws", course: "playing-draws", title: "Playing Draws", coach: "mina", lessons: [
    planned("Draw Strength"), planned("Semi-Bluff Lines"), planned("When to Just Call"), planned("Bricked Rivers"),
  ] }),
  chapter({ id: "beating-player-types", course: "player-types", title: "Beating Player Types", coach: "sera", lessons: [
    planned("The Calling Station", { opponent: "calling-station" }), planned("The Nit", { opponent: "nit" }),
    planned("The TAG", { opponent: "tag" }), planned("The LAG", { opponent: "lag" }), planned("The Trapper", { opponent: "trapper" }),
    planned("The Shark", { opponent: "shark" }), planned("The Drawer", { opponent: "drawer" }), planned("The Balanced Player", { opponent: "balanced" }),
  ] }),
]);

// Courses: one theme inside a level. `lessons` on a planned course with no chapters yet is its
// roadmap size. `order` sorts courses within a level.
export const COURSES = Object.freeze([
  Object.freeze({ id: "core-1", level: "foundations", order: 1, title: "The Core Course", part: 1 }),
  Object.freeze({ id: "hand-plays", level: "foundations", order: 2, title: "How a Hand Plays" }),
  Object.freeze({ id: "reading-board", level: "foundations", order: 3, title: "Reading the Board" }),
  Object.freeze({ id: "core-2", level: "fundamentals", order: 1, title: "The Core Course", part: 2 }),
  Object.freeze({ id: "position-play", level: "fundamentals", order: 2, title: "Position Play" }),
  Object.freeze({ id: "value-betting", level: "fundamentals", order: 3, title: "Value Betting" }),
  Object.freeze({ id: "playing-draws", level: "fundamentals", order: 4, title: "Playing Draws" }),
  Object.freeze({ id: "ranges-in-practice", level: "intermediate", order: 1, title: "Ranges in Practice", lessons: 6 }),
  Object.freeze({ id: "defending", level: "intermediate", order: 2, title: "Defending", lessons: 6 }),
  Object.freeze({ id: "multi-street", level: "intermediate", order: 3, title: "Multi-Street Plans", lessons: 6 }),
  Object.freeze({ id: "hand-reading", level: "intermediate", order: 4, title: "Hand Reading", lessons: 5 }),
  Object.freeze({ id: "mental-game", level: "intermediate", order: 5, title: "The Mental Game", lessons: 4 }),
  Object.freeze({ id: "game-theory", level: "advanced", order: 1, title: "Game Theory Basics", lessons: 6 }),
  Object.freeze({ id: "player-types", level: "advanced", order: 2, title: "Beating Player Types" }),
  Object.freeze({ id: "sizing-theory", level: "advanced", order: 3, title: "Sizing Theory", lessons: 5 }),
  Object.freeze({ id: "multiway", level: "advanced", order: 4, title: "Multiway Pots", lessons: 4 }),
  Object.freeze({ id: "tournaments", level: "mastery", order: 1, title: "Tournament Poker", lessons: 8 }),
  Object.freeze({ id: "heads-up", level: "mastery", order: 2, title: "Heads-Up", lessons: 5 }),
  Object.freeze({ id: "solver-spots", level: "mastery", order: 3, title: "Solver Spots", lessons: 5 }),
  Object.freeze({ id: "live-poker", level: "mastery", order: 4, title: "Live Poker", lessons: 5 }),
]);

const levelIndex = (id) => LEVELS.findIndex((level) => level.id === id);
const courseById = (id) => COURSES.find((course) => course.id === id) || null;

// The lessons a course holds on the roadmap: its chapters' slots, else its planned size.
export function courseSize(courseId) {
  const chapters = CHAPTERS.filter((ch) => ch.course === courseId);
  if (chapters.length) return chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  return courseById(courseId)?.lessons || 0;
}

// The whole roadmap's size: { lessons, live, planned } across every course.
export function roadmapSize() {
  const lessons = COURSES.reduce((sum, course) => sum + courseSize(course.id), 0);
  const liveCount = CHAPTERS.reduce((sum, ch) => sum + ch.lessons.filter((slot) => slot.lesson).length, 0);
  return { lessons, live: liveCount, planned: lessons - liveCount };
}

// Chapters in path order: by level, then course order, then their order in CHAPTERS.
function orderedChapters() {
  return CHAPTERS
    .map((ch, index) => ({ ch, index, course: courseById(ch.course) }))
    .filter((row) => row.course)
    .sort((a, b) => (levelIndex(a.course.level) - levelIndex(b.course.level)) || (a.course.order - b.course.order) || (a.index - b.index))
    .map((row) => row.ch);
}

// THE PATH the Learn tab draws: the chapters with at least one live lesson, in order, each with its
// course, level, number (1..n along the path) and its live slots (planned slots dropped), each slot
// numbered along the whole path. `resolve(definitionId)` (optional) returns the definition; a slot
// whose definition does not resolve is dropped, so an app never shows a lesson it cannot open.
export function learnPath(resolve = null) {
  const chapters = [];
  let lessonNumber = 0;
  for (const ch of orderedChapters()) {
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

// The chapter a lesson sits in, by its definition id.
export function chapterOfLesson(definitionId) {
  return CHAPTERS.find((ch) => ch.lessons.some((slot) => slot.lesson === definitionId)) || null;
}

// The slot of a lesson, by its definition id.
export function lessonSlot(definitionId) {
  for (const ch of CHAPTERS) {
    const slot = ch.lessons.find((s) => s.lesson === definitionId);
    if (slot) return slot;
  }
  return null;
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
// proved and a topic to play). `provedIds` is a Set of proved definition ids; `seals` maps chapter
// ids to a truthy seal record.
export function chapterStanding(pathChapter, { provedIds = new Set(), seals = {} } = {}) {
  const lessons = pathChapter?.lessons || [];
  const proved = lessons.filter((slot) => provedIds.has(slot.lesson)).length;
  const all = lessons.length > 0 && proved === lessons.length;
  const hasHand = !!pathChapter?.topic;
  const sealed = hasHand ? !!seals?.[pathChapter.id] : all;
  return { proved, total: lessons.length, complete: all, sealed, handOpen: hasHand && all && !sealed, hasHand };
}
