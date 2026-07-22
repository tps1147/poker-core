# poker-core

Shared, **no-build, all-CommonJS** poker logic for the Poker.com stack. This is
the single source of truth for poker rules, the AI insight engine, Match Review,
hand insights, ratings, and game-state normalization — consumed by both the
**mobile app** (Metro / React Native) and the **Next.js web app** (turbopack),
and runnable under **plain node** for tests.

Every module is CommonJS (`require` / `module.exports`). There is no `type`
field in `package.json`, no transpile step, and no dependencies — Metro,
turbopack, and node all consume the `.js` files directly.

## Install / consume

It's a plain folder package (workspace / file dependency). Import by subpath:

```js
const { buildMatchReview, gradeHand, buildReplayTimeline } = require('poker-core/review');
const { computeHandInsights, createOpponentTracker } = require('poker-core/insights');
const { calculateAiRatingDelta, deriveBandRating } = require('poker-core/rating');
const { normalizeGameState, normalizePuzzleState } = require('poker-core/state');
const { evaluateHand, compareHands } = require('poker-core/eval');
const AIPlayer = require('poker-core/ai');
const { getArchetypeScout } = require('poker-core/data');

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
  test/
    handInsightsMath.test.js  plain-node
    review.test.js            plain-node (engine + review pipeline, real AIPlayer)
    frameToHeroState.test.js  plain-node
    loads.test.js             smoke: index + every subpath export is callable
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
```

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
