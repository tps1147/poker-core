# poker-core

Shared, **no-build, all-CommonJS** poker logic for the Poker.com stack. This is
the single source of truth for poker rules, the AI insight engine, Match Review,
hand insights, ratings, and game-state normalization — consumed by both the
**mobile app** (Metro / React Native) and the **Next.js web app** (turbopack),
and runnable under **plain node** for tests.

Every module is CommonJS (`require` / `module.exports`), except the film-first
lessons under `src/learn`, which are `.mjs` ES modules (see "Learn" below).
There is no `type` field in `package.json`, no transpile step, and no
dependencies — Metro, turbopack, and node all consume the files directly.

## Install / consume

It's a plain folder package (workspace / file dependency). Import by subpath:

```js
const { buildMatchReview, gradeHand, buildReplayTimeline } = require('poker-core/review');
const { computeHandInsights, createOpponentTracker } = require('poker-core/insights');
const { calculateAiRatingDelta, deriveBandRating } = require('poker-core/rating');
const { normalizeGameState, normalizePuzzleState } = require('poker-core/state');
const { evaluateHand, compareHands } = require('poker-core/eval');
const AIPlayer = require('poker-core/ai');
const { getArchetypeScout, BOT_ROSTER, getBotById } = require('poker-core/data');

// …or everything from the top-level barrel:
const core = require('poker-core');
```

## Layout

```
poker-core/
  package.json          name "poker-core", CommonJS, zero deps, exports map
  README.md
  .gitignore            node_modules
  src/
    index.js            main barrel (re-exports the whole surface)
    eval/
      pokerEvaluator.js       evaluateHand / compareHands   (ESM→CJS)
    ai/
      aiPlayer.js             AIPlayer insight engine class (ESM→CJS)
    insights/
      handInsightsMath.js     pure HUD/opponent math        (CJS, verbatim)
      handInsights.js         computeHandInsights(...)       (NEW, pure port of useHandInsights)
      opponentRead.js         createOpponentTracker(...)     (NEW, pure port of useOpponentRead)
      index.js                barrel
    review/
      replayTimeline.js       buildReplayTimeline            (CJS, verbatim)
      gradeDecisions.js       gradeHand / classifyAction     (CJS, 1 require path fixed)
      matchReview.js          buildMatchReview               (CJS, verbatim)
      drillFromFrame.js       toDrillPuzzle                  (CJS, verbatim)
      frameToHeroState.js     frameToHeroState / terminal    (CJS, verbatim)
      gradeTheme.js           grade colors/labels/copy       (CJS, verbatim)
      index.js                barrel
    rating/
      journeyProgress.js      bot-journey progression model  (CJS, +optional clock param)
      ratingBands.js          ROOM_RATING_BAND / band math   (NEW, extracted from botJourneyWorld)
      index.js                barrel
    state/
      gameModes.js            GAME_MODES + normalizers       (ESM→CJS, BOM stripped)
      normalizeGameState.js   normalizeGameState / players   (ESM→CJS, BOM stripped)
      normalizePuzzleState.js normalizePuzzleState           (ESM→CJS, BOM stripped)
      index.js                barrel
    data/
      archetypeScout.js       ARCHETYPE_SCOUT / _META         (NEW, extracted from botProfiles)
      botRoster.js            BOT_ROSTER / getBotById          (NEW, canonical 16-bot ladder,
                                                               ratings derived via ratingBands)
      index.js                barrel
    learn/                    ES modules (.mjs): see "Learn" below
      index.mjs               the poker-core/learn entry point (re-exports all of it)
      scriptedHand.mjs        the scripted-hand driver
      filmWatch.mjs           the film watch rule (WATCH_SHARE)
      lessonRunController.mjs the lesson-run save controller
      motion.mjs              table timings the driver schedules against
      lessonModel.mjs         the pure lesson model (rail, ladder, score, recap, labels)
      lessons/index.mjs       COURSE_ORDER, FILM_FIRST_LESSONS, lookups
      lessons/<id>.v<n>.mjs   the 20 film-first definitions
      media/<id>.v<n>.json    their film media (poker-core/learn/media/*)
  scripts/
    check-learn-media.mjs     HEAD-checks every learn film url on the CDN (network)
  test/
    handInsightsMath.test.js  plain-node
    review.test.js            plain-node (engine + review pipeline, real AIPlayer)
    frameToHeroState.test.js  plain-node
    botRoster.test.js         plain-node (roster shape, derived ratings, lookups)
    loads.test.js             smoke: index + every subpath export is callable
    learn.test.mjs            learn entry point smoke
    learnLessons.test.mjs     the 20 lessons, their media json and the lesson model
```

## Learn (film-first lessons)

`poker-core/learn` is the one source of the film-first lessons for the web
player, the phone player and the server's parity test. Unlike the rest of the
package it is ES modules (`.mjs`), relative imports with extensions only, so
plain node, Metro and the web bundler all load it unchanged:

```js
import {
  FILM_FIRST_LESSONS, COURSE_ORDER, filmFirstLesson, nextInCourse, lessonHands,
  mountState, runUntilBlocked, tableProps,        // the driver
  railSegments, releasedAnswers, spotLadder, chipScore, recapRows, // the lesson model
} from 'poker-core/learn';
import outsMedia from 'poker-core/learn/media/outs-workspace-v1.v2.json';
```

- **Definitions.** The 20 lessons in course order (`FILM_FIRST_LESSONS`,
  `COURSE_ORDER`). `filmFirstLesson(id)` accepts the definition id or the
  catalog ids it was built from (`sourceLessonId`, `videoLessonId`), so pot odds
  resolves as `pilot-pot-odds` and as `lesson-pot-odds-001`. No answer keys
  ship here: the server registry grades.
- **Media.** One json per lesson, named by the definition's `media` field.
  Clients import it by path; there is no media index and no JSON import
  attribute. A json carries `portraitByArea` and `portraitFrame` only when
  every area's portrait film and poster is live on the CDN (HEAD 200); until
  then the lesson plays its landscape film.
- **One namespace.** `index.mjs` re-exports every module with `export *`, and
  two `export *` of one name silently drop it, so a new export must not reuse
  a name another learn module exports (`learnLessons.test.mjs` checks).

Check the films before every commit that touches `src/learn/media` (a running
portrait render writes portrait entries into these files before it uploads):

```
node scripts/check-learn-media.mjs         # read-only table, exit 1 on any failure
node scripts/check-learn-media.mjs --fix   # also strips an incomplete portrait set
```

## The insight engine

`gradeDecisions` / `matchReview` and `computeHandInsights` take the insight
**engine as an injected parameter** — an `AIPlayer` instance (from
`poker-core/ai`). Callers construct one long-lived engine and pass it in; the
review modules never import `AIPlayer` directly (they only need its
`evaluateHandStrength` / `hasFlushDraw` / `evaluateDrawingHands` /
`analyzeBoardTexture` / `countOvercards` surface, plus an optional
`evaluateHand` gate). Tests inject either the real engine or a scripted stub.

## Tests

Zero dependencies, so no install is needed:

```
npm test
```

which runs each file under plain node:

```
node test/handInsightsMath.test.js
node test/review.test.js
node test/frameToHeroState.test.js
node test/loads.test.js
node test/learn.test.mjs
node test/learnLessons.test.mjs
```

(`scripts/check-learn-media.mjs` needs the network and is not part of `npm test`.)

## Purity notes (impurities intentionally left in)

`rating/journeyProgress.js` reads wall-clock time in two places:

- `createReviewSeed` / `recordBotMatchResult` — now accept an **optional
  trailing `clock` param** (default `() => new Date().toISOString()`). Existing
  2-arg calls are unchanged; pass a fixed clock for deterministic seeds. This is
  the only behavioral change made during extraction.
- `buildConceptLessonLink` stamps `learnNonce: String(Date.now())`. Left as-is:
  it's an exported helper the UI calls directly, so adding a clock param would
  change a public signature. It's cosmetic (a cache-busting nonce on a deep
  link), not part of any graded/deterministic result.

Everything else in the package is pure and null-safe.

## Provenance

Extracted (read-only) from the mobile app at `Poker.com/src/**`. Nothing in the
mobile app was modified. The ESM→CJS conversions changed only module boundaries
(`import`→`require`, `export`→`module.exports`); logic bodies are unchanged. The
mobile app's original `useHandInsights` / `useOpponentRead` React hooks can be
reimplemented as thin wrappers over `computeHandInsights` / `createOpponentTracker`.
```
