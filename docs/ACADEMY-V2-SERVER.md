# Academy v2: notes for the server worker

poker-core `claude/academy-v2-rework`, 2026-10-08, after the defs-a and defs-b merge. This covers
what pokerServer needs to grade the 59 academy v2 lessons. The definitions live in
`src/learn/lessons/` (the shipped 20) and `src/learn/lessons/academy/` (the 39 new ones).
`academyLesson(id)` resolves a definition: early 22 first, then later 17, then the shipped 20.

## 1. Where the answer keys live, and their format

`answerKeys/<node>.mjs`, one file per tree node (59 in all). The folder is at the package root,
outside `src`, so `npm pack` leaves it out (`"files"` lists `src` only) and no client bundle gets a
key. Copy or convert them into `pokerServer/src/data/lessonRuns/` as CommonJS. Each file's header
comment names its target file.

There are two shapes.

**New lessons (39): a full entry**, target `<node>.v1.js`:

```js
export default {
  lessonId: "x-mdf", node: "x-mdf", contentVersion: 1, flow: "film-first", access: "pro",
  conceptId: "t4-mdf-bluffcatch",               // or null, see section 5
  stages: [{kind:"welcome"}, {kind:"film"}, {kind:"why"},
           {kind:"decision", spotId:"md-guided"}, {kind:"decision", spotId:"md-practice"},
           {kind:"decision", spotId:"md-fresh"}, {kind:"takeaway"}],
  film: { stage: 1, at: 66.97, spotId: "md-turn", decision: "estimate", bands: [...], key: { band: "keep-21" } },
  why:  { stage: 2, options: ["mdf", "beaten", "breakeven"], key: { option: "mdf" } },
  spots: { "md-guided": { stage: 3, decision: "estimate", bands: [...], key: { band: "keep-24" } }, ... },
};
```

`film` is the in-film "Your turn" spot. Its `at` is `canon.yourTurn` and can be null when the film
has no yourTurn anchor (the definition's pause is then `anchor: "end"`). Spot keys use the same
decision vocabulary as the shipped keys: `{ action }`, `{ band }`, `{ count }` and so on, depending
on `decision`.

**Shipped lessons (20): additions only**, merged into the existing
`pokerServer/src/data/lessonRuns/<definitionId>.v<n>.js`:

```js
export default {
  lessonId: "pot-odds-workspace-v2", node: "m-pot-odds", contentVersion: 2, additions: true,
  stageShift: { from: 2, by: 1 },
  film: { stage: 1, at: 65.56, filmId: "m-pot-odds", spotId: "pot2-turn", decision: "action", choices: [...], key: { action: "fold" } },
  why:  { stage: 2, options: ["a", "b", "c"], key: { option: "c" }, misconception: "a" },
};
```

The existing spot keys don't change. Only their stage indices move (section 2).

Every key is recomputed by `test/academyEarly.test.mjs` (welcome to postflop) and
`test/academyLessonsB.test.mjs` (pressure to Other Tables).

## 2. Stage indices moved by +1 in the lessons that already existed

The why stage is inserted at index 2, right after the film. Every stage after the film is now one
index later. This applies to every lesson the server already had: the shipped 20. These are exactly
the 20 answer-key files that carry `stageShift`. (The brief said 38. The repo shows 20 shifted and
39 new; the new ones were written with the why stage at index 2 from the start, so nothing moved
for them.)

```
before:  0 welcome  1 film  2 guided  3 practice  4 fresh  5 takeaway
after:   0 welcome  1 film  2 why     3 guided    4 practice  5 fresh  6 takeaway
```

- The additions files say this as `stageShift: { from: 2, by: 1 }`. Any server table indexed by
  stage (run cursor, `furthest`, stage-kind validation) must shift indices `>= 2` by one.
- The registry validator currently allows only decisions between the film and the takeaway. It has
  to admit `kind: "why"` at index 2.
- **Saved runs.** A run saved before the shift has `stage` and `furthest` in the old numbering.
  Either bump `contentVersion`, which starts a fresh run, or map old index `i >= 2` to `i + 1` when
  the run is loaded. Answers are keyed by `spotId`, so they are not affected.
- On the shipped films, the old in-film guess moved, unchanged, from `pause` to `legacyPause`. The
  new `pause` belongs to the v2 film (section 4).

## 3. The why answer: the command web sends

Web (`flop52web` `LessonPlayer.js`, `WhyStep`) sends the pick over the live lesson-run socket as an
ordinary answer:

```js
{ type: "answer", spotId, option }   // option: the picked option id, e.g. "mdf" or "c"
```

The expected verdict, as poker-core grades it (`lessonModel.whyResult(stage, optionId, key)`):
`{ option, correct, fix }`. `correct` is `key.option === option`. `fix` is the picked option's
`fix` line, from the definition. The definition ships no `correct` flags, so the server's key is
the only grader.

**Open point: the why stage has no `spotId` yet.** Neither the definitions nor the answer keys give
the why stage a `spotId`. Web sends only when `stage.spotId` is set, so right now it sends nothing.
Pick one of these and tell the definitions owner:

- (a) give each why stage a `spotId` (for example `<prefix>-why`, matching `-turn` and `-guided`),
  added to both the definition and the key; or
- (b) accept `{ type: "answer", stage: 2, option }` and look up `why.stage`.

(a) needs no new command shape.

## 4. The film watch check is measured to `filmStop`

`filmWatched(ranges, media)` in `src/learn/filmV2.mjs` is true when `WATCH_SHARE` of the film has
played, measured against `filmStop(media)`, not against the full duration:

- First watch: the stop is `anchors.upNext` (the film stops before its own "up next" end card).
- Replay (`{ replay: true }`): the full duration, and the film can be skipped.
- Openers: their duration, or the `first` anchor when `openerStop(media, { cutAtFirst: true })`.

Any server-side check on a "watched" claim (played ranges, or a minimum time on the film step)
must use the same stop. Measured against the full duration, a learner who stopped at upNext would
fail. The media files are `src/learn/media/<filmId>.v3.json` (`durationSeconds`, `anchors`). All 70
are now in the package; `scripts/sync-v3-media.mjs` refreshes them.

The "Your turn" pause comes from the definition's `pause` (`filmTurnPlan` / `filmOwnPause`). If a
film has none, `filmPauseAt` places it after the film asks its question. The film spot's key is in
`film` (section 1), with `spotId` `<prefix>-turn`.

Watch out for the three Welcome films with aliased ids. `filmIdOfNode` maps them to `w-luck`,
`w-deep` and `w-academy`, but they were published (and copied) under their node ids:
`w-luck-and-skill`, `w-how-deep` and `w-the-academy`. Resolve these through the node id until the
alias table and the publish agree.

## 5. `conceptId` is null on 30 lessons

Each key carries the definition's `conceptId` (the old `t<n>-...` concept-map id the server uses
for concept progress and proof routing). The 30 new nodes below have no matching old concept, so
their `conceptId` is `null`:

b-kickers-counterfeit, b-made-vs-draw, b-texture-read, b-the-nuts, b-what-beats-you,
f-playing-draws, f-pot-control, f-value-betting, g-balance, g-toy-games, h-exploits,
m-chance-as-share, m-variance, o-heads-up, o-live, o-six-max, r-all-in-side-pots, r-best-five,
r-first-hand, r-seats-blinds, r-showdown, r-streets, r-the-deck, w-history, w-how-deep,
w-luck-and-skill, w-the-academy, w-what-is-poker, x-check-raise, y-study.

The server must accept `conceptId: null`. Skip the concept-progress write for these lessons and
don't reject the registry entry. Web's `academyLessonHref` already drops a concept param that
doesn't match `t[0-6]-...`. Node progress goes by `node` (nodeState), not by concept.
