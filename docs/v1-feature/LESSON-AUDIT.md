# M2 lesson audit: the 20 existing film-first lessons

Milestone: M2 (audit and contract acknowledgement). Contract: F52-V1-CONTRACT-1, schema 1.
Checkout: `C:/Code/Programming/flop52/.dev-servers/claude-v1-core-2026-10-06` at
`6382201ae2d0ea965cd8c1d2cda72225d08466c8`. Written 2026-10-06 (UTC). Read-only audit: no
existing file was changed, nothing was rendered, built, installed or uploaded.

## Evidence labels

- **[V]** verified from source in this pass: read the file, or ran a read-only Node check
  against it (`node --input-type=module -` from stdin, no files written).
- **[I]** inferred: a judgement, or a claim about runtime behaviour that the read source does
  not prove on its own.

Private answer keys in `pokerServer/src/data/lessonRuns/*.js` were loaded only to compare
structure: stage kinds, spot ids, decision kinds, choices, band ids, ranges and key field
*names*. No key value, correct-action marker or tolerance appears in this document. Where a
public explanation says which way a price comparison points, this audit gives only the two
numbers.

Sources read: core `src/learn/lessons/*.mjs` (20 definitions plus `index.mjs`),
`src/learn/index.mjs`, `src/learn/media/*.json` (20), `curriculum.mjs`, the
`scriptedHand.mjs` header and validator, and `lessonModel.mjs` (hint ladder and chip score);
server `src/data/lessonRuns/index.js` (registry and validator), the 27 entry files (structure
only), `src/services/lessonRunState.js` and `src/controllers/lessonRunController.js`; native
`src/learning/film/lessons.js`, `courseVideoPlan.js`, `lessonPacks.js` (headers and ids),
`academyLessonProductionPackage.js` (header), `mastery.js`, `dailySession.js` (header) and
`conceptMap.js`, plus `src/components/learn/film/PriceWorkbench.js`; web
`src/components/learn/player/PriceWorkbench.js`, `priceWorkbenchModel.js` (gate line) and
`src/data/academy/lessons/` (file list and `LESSON_VERSIONS`).

## 1. Summary

| Result | Count | Lessons |
|---|---|---|
| KEEP | 15 | 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18 |
| REVISE | 5 | 1, 6, 17, 19, 20 |
| REWRITE | 0 | none |

- KEEP: keep these bytes under their current version. V1 plan metadata goes beside them, as
  the contract's §4 requires.
- REVISE: change content before V1 acceptance. Each change needs a **new content version** so
  that saved runs at the old version still open (§3).
- No lesson needs a rewrite. Every fixture I recomputed is correct (§5). The problems are
  format depth, mixed messages, cross-lesson novelty and missing delayed evidence.

## 2. Lesson table

Conventions in this table:

- Stage list: W = welcome, F = film, then the decision roles in order, T = takeaway. Every
  lesson has `flow: "film-first"` [V].
- "Film" is the retained source interval of the original coach film, recorded in media
  `sourceInterval`. All 20 are `continuous-coach-v4`, 1280×720 at 24 fps,
  `audioStatus: narrated-review`, with an AI-voice disclosure, captions and transcript paths,
  and 8 area variants [V]. "Pause" means the film stage has a local, ungraded guess (the
  pot-odds lesson comment says so [V]; the client handling was not read [I]).
- "Server keys" means the private registry entries that exist for that lesson id, by version
  number. All 27 entries passed the registry's own `validateEntry` at load [V].
- Stated prerequisites come from native `conceptMap.js` `prereqs` [V]. "Implied" means the
  lesson's content uses the concept but does not list it [I].

| # | Shared id | Ver | conceptId | sourceLessonId / videoLessonId | Coach, access | Stated prereqs (implied) | Stage roles | Film (s), pause | Server keys | Rec. | Reason |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | hand-rankings-workspace-v1 | 2 | t0-hand-rankings | lesson-hand-rankings-001 / same | ada, free | none | W F guided practice fresh T (best-five ×3) | 29.58, no | v1, v2 | REVISE | The film says a misread "leaves value behind", but the scripted guided hand auto-plays "Call 40 and see the showdown". Each hand also ends on a scripted `result winner hero` [V]. |
| 2 | positions-workspace-v1 | 2 | t0-positions | lesson-positions-001 / same | reina, free | none | W F guided practice fresh T | 29.5, no | v1, v2 | KEEP | Seat counts and the 5/10 blinds (pot 15, 10 to call, raise to 25) agree in every prompt. The ranges are labelled rules of thumb [V]. |
| 3 | betting-actions-workspace-v1 | 2 | t0-betting-actions | lesson-betting-actions-001 / same | ada, free | none (t1-equity: the film says "enough equity") | W F guided practice fresh T | 19, no | v1, v2 | KEEP | Each read is supplied and labelled, and the hand descriptions check out [V]. Glossary note: the film uses "equity" three lessons before lesson 6 defines it [V]. |
| 4 | outs-workspace-v1 | 2 | t1-outs-rule-24 | lesson-outs-001 / same | mina, free | t0-hand-rankings | W F(pause) guided practice×2 fresh×2 T | 29.875, 16.25 s count | v1, v2 | KEEP | Outs 9 / 8 / 4 and prices 10% / 10% / 25% verified [V]. The film introduces dirty-vs-clean outs, but no spot exercises a dirty out [V]. |
| 5 | rule-2-4-workspace-v1 | 2 | t1-outs-rule-24 (shared with #4) | lesson-rule-2-4-001 / same | mina, free | t0-hand-rankings | W F(pause) guided×2 practice×2 fresh×2 T | 26.75, 15 s count | v1, v2 | KEEP | The ×2 and ×4 estimates and the 20% price are verified. The "exact share a little higher" note is true: 8/46 = 17.4% and 1−(39/47)(38/46) = 31.5% [V]. |
| 6 | equity-workspace-v1 | 2 | t1-equity | lesson-equity-001 / same | mina, free | t1-outs-rule-24 | W F guided practice fresh T (estimate ×3) | **8.0**, no | v1, v2 | REVISE | The film is 8 s with 3 cues and no worked number. The concept is taught only through the spots. A share-of-pot diagram or worked example is missing [V]. The math (42 / 60 / 100 chips) is correct [V]. |
| 7 | pot-odds-workspace-v2 | 2 | t1-pot-odds | lesson-pot-odds-001 / pilot-pot-odds | mina, free | t1-outs-rule-24 (t1-equity) | W F(pause) guided practice fresh T | 20.25, 14.417 s count | v1, v2 | KEEP | Protected: 150+50+50 = 250 → 20%. All three prices and given chances are verified (20/30, 20/24, 25/16). M1's alternate film is a comparison only [V]. The 15/12/8 outs match the cards [V]. |
| 8 | implied-odds-workspace-v1 | 1 | t1-implied-odds | lesson-implied-odds-001 / same | mina, pro | t1-pot-odds | W F guided practice×2 fresh×2 T | 20, no | v1 | KEEP | Direct 30% / 30% / 20% and implied 15% / 25% / 10% verified. Stacks behind (1,125 / 50 / 1,150) agree with the seats [V]. |
| 9 | ev-workspace-v1 | 1 | t1-ev | lesson-ev-001 / same | mina, pro | t1-pot-odds | W F(pause) guided practice×2 fresh×2 T | 17.875, 12.958 s count | v1 | KEEP | EV +40 / −10 / +11 and prices 16.7% / 20% / 12.5% verified [V]. The film pause asks for an integer % where the answer is 16.67 (rounding) [V]. |
| 10 | spr-workspace-v1 | 1 | t1-spr | lesson-spr-001 / same | mina, pro | t1-ev | W F guided×2 practice×2 fresh×2 T | 21, no | v1 | KEEP | SPR 1 / 2 / 13, the bets-until-all-in counts 1 / 2 / 3, and every distractor band value are verified [V]. |
| 11 | starting-hands-workspace-v1 | 1 | t2-starting-hands | lesson-starting-hands-001 / same | reina, free | t0-positions, t1-pot-odds | W F guided practice×2 fresh×2 T | 33.875, no | v1 | KEEP | Seat counts and pots (15, then 40 after a raise to 25) verified. The classification is a labelled rule of thumb [V]. |
| 12 | rfi-position-workspace-v1 | 1 | t2-rfi-by-position | lesson-rfi-position-001 / same | reina, free | t2-starting-hands | W F guided practice×2 fresh×2 T | 30.25, no | v1 | KEEP | Players behind (5 from UTG, 3 from the cutoff) verified against the ring [V]. |
| 13 | blind-defense-workspace-v1 | 1 | t2-blind-defense | lesson-blind-defense-001 / same | reina, pro | t2-rfi-by-position, t1-pot-odds | W F guided practice×2 fresh×2 T | 31.75, no | v1 | KEEP | 15/55 = 27%, 20/65 = 31%, 10/45 = 22%, and the distractors 44 / 67 / 29 / 50% verified. Seat names agree with the six-max ring [V]. |
| 14 | three-betting-workspace-v1 | 1 | t2-3betting | lesson-3betting-001 / same | knox, pro | t2-rfi-by-position | W F guided practice×2 fresh×2 T | 29.79, no | v1 | KEEP | Pots and amounts to call (40 and 15 / 25 / 20) verified, and the prompts agree with each hand's `players` ring. The cast is reordered between hands (cosmetic only) [V]. |
| 15 | ranges-workspace-v1 | 1 | t3-ranges | lesson-ranges-001 / same | vale, pro | t2-rfi-by-position | W F guided practice×2 fresh×2 T | 30.75, no | v1 | KEEP | Pots 140 → 230 after 45 / 45 and stacks of 930 verified. Good fear-reading contrast [V]. |
| 16 | board-texture-workspace-v1 | 1 | t3-board-texture | lesson-board-texture-001 / same | vale, pro | t3-ranges | W F guided×2 practice×2 fresh×2 T | 32.42, no | v1 | KEEP | Draw definitions are explicit, and every draw and made-straight claim was checked by hand (KQ and Q8 on JT9; 43 on 652; no draw on K83r) [V]. |
| 17 | cbetting-workspace-v1 | 1 | t3-cbetting | lesson-cbetting-001 / same | vale, pro | t3-board-texture | W F guided practice×2 fresh×2 T | 27.875, no | v1 | REVISE | It calls K♦7♣2♠ "hardly any straight draw", but under lesson 16's strict definition that board has none [V]. Its fresh spot (K♥Q♥ on A-8-3 rainbow, no pair) repeats lesson 18's fresh spot structure [V]. |
| 18 | bet-sizing-workspace-v1 | 1 | t3-bet-sizing | lesson-bet-sizing-001 / same | vale, pro | t3-cbetting, t1-spr | W F guided practice fresh T | 20.42, no | v1 | KEEP | Third-pot and three-quarter-pot sizes (40/90, 80/180, 60/135; "risks 75 more") verified. The novelty overlap with #17 is listed in §4.3 [V]. |
| 19 | semibluff-workspace-v1 | 1 | t4-fold-equity-semibluff | lesson-fold-equity-semibluff-001 / same | knox, pro | t3-cbetting, t1-equity (t1-ev) | W F guided×2 practice×2 fresh×2 T | **8.75**, no | v1 | REVISE | The film is 8.75 s with no numbers. The spots require the break-even formula bet/(pot+bet) and two-branch EV, which the film never shows. The EVs (+37 vs 30, −20, −17 vs 18) are correct [V]. |
| 20 | bluffing-workspace-v1 | 1 | t4-bluffing | lesson-bluffing-001 / same | knox, pro | t4-fold-equity-semibluff | W F guided practice×2 fresh×2 T | 33.29, no | v1 | REVISE | The scripted result depends on the answer: a bet gets "Ace Andy folds. You win 500", a check gets a showdown loss, and the fresh bet gets "calls and wins 700". The immediate outcome becomes the verdict, against the roadmap's rule that decision quality is separate from the result [V]. |

The guided stage label: in film-first lessons the guided hand is the coach's own example hand.
In 13 of 20 lessons, the native `courseVideoPlan.js` spot has the same hero and board as the
guided spot. Every plan entry carries a `correctAction` field [V]. That film-side field is
client-shipped teaching data, not the server key. For a guided hand the coach demonstrates
the play anyway [I], but main should confirm the field is acceptable in client bundles
(PROPOSALS P7).

### Recommended REVISE work (each needs a new content version, so main must approve)

1. **#1 hand rankings (low priority).** Make the auto-played action agree with the film's
   value message, or state that the lesson grades only the best five. Main must choose any
   change to the post-answer action and decide whether to keep the scripted showdown
   result [I].
2. **#6 equity.** Add a worked share-of-pot example to the film (pot × chance = chips), or
   add a manipulative "share of pot" diagram. Keep the three estimate spots [I].
3. **#17 c-betting.** Change "hardly any straight draw" to wording that matches lesson 16's
   definition. Replace or change the fresh spot so it is not the same structure as lesson
   18's fresh spot, or record both as one equivalence family [I].
4. **#19 semibluff.** Add a worked example covering break-even folds and the bet-vs-check EV
   tree, as film plus diagram. Add t1-ev to the stated prerequisites in main-owned
   `conceptMap.js` [I].
5. **#20 bluffing.** Separate the post-answer outcome from the verdict. For example, show the
   decision's reasoning first, then a labelled single sample outcome, or remove the
   conditional result lines. Keep the story/target questions [I].

## 3. Version compatibility: what must stay byte-stable

- **27 (lessonId, contentVersion) pairs are live** on the server registry and in web
  `LESSON_VERSIONS` [V]. Seven lessons (#1–#7) have a legacy v1 workspace flow and a v2
  film-first flow. The other 13 have only v1, which is already film-first. Native imports only
  the 20 film-first definitions [V]. A run's id is `userId:lessonId:version` [V], so every pair
  must stay resolvable.
- **Structural fields of each existing film-first definition** must not change under the same
  version. These are: stage order and kinds, `spotId` for each stage, decision kinds, choices,
  band id lists, count ranges and stage indexes. The server `validateEntry` requires
  `spot.stage === stage.index`, and run history records spot ids [V]. I compared all 20
  film-first pairs against the server entries: stage kinds, spot ids, decision kinds,
  choices, bands and ranges match [V].
- **Public text** (prompts, hints, explanations, film cues) has no server parity check [V].
  Evidence provenance still treats a version as immutable: an attempt recorded at a version
  should map to the text shown at that version [I]. Use the per-file SHA256 already recorded
  in `source-baseline.json` as `VersionRef.sha256` for each definition and media file.
  **Any text change means a version bump** [I].
- **Media JSON** `<id>.v<n>.json` is named by the definition's `media` field. Asset paths
  carry the version (`/academy/<id>/v2/…`), and `sourceSha256` binds the film's source [V].
  A revised film needs a new media file, not an edited one.
- **Identifiers used elsewhere**: `conceptId` (native mastery, daily session, concept map),
  `sourceLessonId`/`videoLessonId` routes (`pilot-pot-odds`, `lesson-pot-odds-001`), and the
  `COURSE_ORDER` position ("Lesson N of 20"). The pot-odds shared id ends in `-v2` while its
  content version is 2; the id is not a version, so do not rename it [V].
- **Legacy record shapes**: attempts saved before 15 September 2026 carry `expected` in their
  history. `withoutKey` strips it from evidence [V]. Only film-first runs carry `watched`; v1
  snapshots keep their exact shape [V].
- **A REVISE ships as a new version** (#1 → v3, #6 → v3, #17/#19/#20 → v2). Each new version
  needs: a new core definition and media file, a new server key file, a new web
  `LESSON_VERSIONS` entry and a new native media import. The old version stays registered.
  All of these are main-owned [V for ownership in contract §2].

## 4. Maps

### 4.1 Misconception map

| Concept (lesson) | Likely misconception | Spot or fixture that targets it |
|---|---|---|
| Hand rankings (#1) | Reading only your hole cards; trips mistaken for a full house; a board pair or scary board trusted over a made straight or flush | hr2-guided (99 on board + A pair), hr2-practice (straight vs board 33), hr2-fresh (flush vs trips) [V] |
| Positions (#2) | "The button plays everything"; the same hand plays the same from every seat | pos2-fresh (94o on BTN), pos2-practice (Q9o UTG) [V] |
| Betting actions (#3) | Pressing the button that feels safe; raising into only better hands; slow-playing a set | act2-guided, act2-practice, act2-fresh [V] |
| Outs (#4) | Counting non-completing cards, for example a third suited card counted as a flush out; calling because you hold a draw | outs2-fresh-count, outs2-fresh-call [V]. **Dirty outs: none** (the assumption makes every completing card clean) |
| Rule of 2/4 (#5) | Using ×4 with one card to come; a real draw taken to justify any price | rule2-fresh-estimate (36% distractor), rule2-guided-call (16 vs 20) [V] |
| Equity (#6) | "No pair means nothing"; "a pair means the whole pot"; percent confused with chips | eq2 band distractors (0 / 250 chips), eq2-practice [V] |
| Pot odds (#7) | Leaving your own call out of the final pot; calling because of a draw | pot2-practice explanation (30/120 = 25% slip), pot2-fresh [V] |
| Implied odds (#8) | Counting chips the opponent does not have; dividing by the pot before the bet | imp1-practice-most (1,125 distractor), imp1-fresh-price (33% distractor) [V]. **Reverse implied odds: none** |
| EV (#9) | Judging a call by whether it wins this hand; forgetting the cost of the call | ev1-guided note ("loses about 7 times in 10"), ev1-practice-ev (lose-50 distractor) [V] |
| SPR (#10) | Using the bigger stack or the sum of stacks | spr1-*-ratio distractors (3/4, 8/10, 15/28) [V] |
| Starting hands (#11) | "A face card is playable"; ignoring domination by the opener's range | sh1-guided (Q7o), sh1-fresh-read/act (KTo vs UTG) [V] |
| RFI (#12) | Folding every non-premium hand late; miscounting players behind | rfi1-guided, rfi1-fresh-open, rfi1-*-behind bands [V] |
| Blind defense (#13) | Wrong price denominator; defending because the blind is posted | bd1-*-price distractors (44/67%, 29/50%), bd1-practice-call [V] |
| 3-betting (#14) | Only 3-betting premiums; confusing the blocker reason with the value reason | tb1-fresh-action, tb1-practice-job [V] |
| Ranges (#15) | Fear reading (one scary hand); not removing hands that would have re-raised | rng1-guided, rng1-fresh-preflop [V] |
| Board texture (#16) | "Low boards are dry"; "rainbow boards have no draws" (A72r still has some) | bt1-fresh-*, assumption text [V]. **Paired boards: none**, although the curriculum title promises "Paired, Connected" [V] |
| C-betting (#17) | Auto c-betting because you raised | cb1-practice-cbet [V] |
| Bet sizing (#18) | One size on every board; a large bluff with no backup | bs1-fresh [V] |
| Semi-bluff (#19) | Fold-equity denominator slips; firing with no backup; "a draw makes any bet good" | sb1-practice-price distractors (29/67%), sb1-practice-bet, sb1-fresh-bet [V] |
| Bluffing (#20) | Bluffing because the draw missed; targeting hands you already beat | bl1-fresh-action, bl1-practice-target [V] |
| Cross-course | Judging a decision by its outcome | The EV notes counter it. **#1 and #20's scripted results reinforce it** [V/I] |
| Cross-course | Ties and split pots, rake, multiway pots | **none** (all excluded by the assumptions) [V] |

### 4.2 Fixture map and math checks

`final = potBefore + bet + call` and `price = call / final`. I recomputed every value below in
this pass. "Given" is the exercise's stated chance, not equity derived from cards. Outs were
counted by hand from the visible cards [V].

| Lesson / spot | Hero · board | pot / bet / call → final | price | Given / check | Result |
|---|---|---|---|---|---|
| #1 hr2-guided/practice/fresh | A♠9♦ · A♥9♣9♠4♦2♣; J♣T♦ · 9♠8♥Q♦3♣3♠; K♥J♥ · Q♥9♥2♥K♣K♠ | 160/40/40, 80/20/20, 120/30/30 | n/a (best-five) | Full house, straight, flush; showdown reveals A♣K♣, Q♣9♦, A♠K♦ do not collide with visible cards | ok |
| #2 pos2-* | K♦9♣ BTN, Q♠9♦ UTG, 9♥4♣ BTN | blinds 5/10 → 15 in, owe 10, raise to 25 | n/a | Players behind 2 / 5 / 2 | ok |
| #3 act2-* | Q♠J♥ · Q♦8♣3♠; 7♥6♥ · K♠9♥5♥J♣2♠; 8♠8♥ · K♣8♦3♥ | 120/30/30, 200/100/100, 120/40/40 | n/a | "Both draws missed, king high" holds; set of eights holds | ok |
| #4 outs2-guided | K♥Q♥ · A♠7♥2♣9♥ | 200/25/25 → 250 | 10% | 9 outs, 18% | ok |
| #4 outs2-practice | J♠T♠ · 9♦8♣2♥K♠ | 200/25/25 → 250 | 10% | 8 outs (Q or 7), 16%; no single-card spade flush | ok |
| #4 outs2-fresh | 9♠8♠ · J♦7♣2♥K♠ | 100/50/50 → 200 | 25% | 4 outs (T), 8%; three spades make no flush | ok |
| #5 rule2-guided | J♠T♠ · 9♣8♦2♥A♣ | 120/40/40 → 200 | 20% | 8 outs ×2 = 16% (exact 17.4%) | ok |
| #5 rule2-practice | 6♠5♠ · 7♦8♣K♥ (flop, pot 60) | n/a | n/a | 8 outs ×4 = 32% (exact 31.5%) | ok |
| #5 rule2-fresh | J♥T♥ · K♥6♠2♥4♦ (pot 100) | n/a | n/a | 9 outs ×2 = 18%; the 36% distractor is the ×4 slip | ok |
| #6 eq2-* | A♥K♦ · Q♥T♣3♠; 7♠6♠ · 8♦5♣K♥; 9♣9♦ · J♥T♥4♣2♠ | pots 120 / 200 / 250, no bet | n/a | 35% → 42, 30% → 60, 40% → 100 chips | ok |
| #7 pot2-guided | K♥Q♥ · J♥T♣4♥2♠ | 150/50/50 → 250 | 20% | 15 outs, 30% | ok |
| #7 pot2-practice | J♦T♦ · 8♦7♣2♦A♠ | 90/30/30 → 150 | 20% | 12 outs, 24%; the 30/120 = 25% slip is stated | ok |
| #7 pot2-fresh | 6♠5♠ · K♠8♦4♣2♥ | 120/60/60 → 240 | 25% | 8 outs (3 or 7), 16% | ok |
| #7 film pause | n/a | 50 / 250 | 20% | integer answer | ok |
| #8 imp1-guided | A♥J♥ · K♥8♣4♥2♠ | 100/75/75 → 250 | 30% | 9 outs, 18%; 75/(250+250) = 15%; 1,200−75 = 1,125 behind | ok |
| #8 imp1-practice | A♠7♠ · Q♠9♦5♠2♣ | 100/75/75 → 250 | 30% | 9 outs, 18%; opponent stack 125−75 = 50; 75/300 = 25% | ok |
| #8 imp1-fresh | 8♦7♦ · 9♣6♠2♥K♣ | 150/50/50 → 250 | 20% | 8 outs, 16%; 50/500 = 10%; 33% distractor = 50/150 | ok |
| #9 ev1-guided | Q♠J♠ · T♠9♣2♥4♠ | 200/50/50 → 300 | 16.7% | 15 outs, 30%; 0.30×300 − 50 = +40 | ok |
| #9 ev1-practice | J♦T♣ · 9♠8♥2♣K♦ | 150/50/50 → 250 | 20% | 8 outs, 16%; 40 − 50 = −10 | ok |
| #9 ev1-fresh | 7♣6♣ · K♣J♦2♣9♥ | 150/25/25 → 200 | 12.5% ("about 13%") | 9 outs, 18%; 36 − 25 = +11; "loses more than 4 in 5" holds (82%) | ok |
| #9 film pause | n/a | 50 / 300 | 16.67% | **integer-answer range for a non-integer value; rounding depends on client tolerance, not checked** | wording |
| #10 spr1-* | A♦K♣ · K♠8♥3♣; Q♥J♥ · Q♣7♦2♠; A♠T♠ · A♥9♣5♦ | pots 300 / 120 / 100; effective 300 / 240 / 1,300 | n/a | SPR 1 / 2 / 13; pot-sized bets 1 / 2 / 3 (100 → 300 → 900) | ok |
| #11 sh1-* | Q♦7♣ UTG; A♥J♥ MP; K♣T♦ BTN vs UTG raise to 25 | 15 → 40 after the raise | n/a | Players behind 5 / 4 / 2 | ok |
| #12 rfi1-* | A♠5♠ BTN; J♣T♥ UTG; K♦T♣ CO | 15 in, owe 10 | n/a | Players behind 2 / 5 / 3 | ok |
| #13 bd1-guided | J♣T♣ BB vs BTN raise to 25 | 40 + 15 → 55 | 27.3% | ok | ok |
| #13 bd1-practice | K♦4♣ BB vs UTG raise to 30 | 45 + 20 → 65 | 30.8% | distractors 20/45 = 44%, 20/30 = 67% | ok |
| #13 bd1-fresh | 9♠8♠ BB vs MP raise to 20 | 35 + 10 → 45 | 22.2% | distractors 10/35 = 29%, 10/20 = 50% | ok |
| #14 tb1-* | A♠5♠ BB; A♦K♣ BTN; A♥4♥ SB | 40 in; owe 15 / 25 / 20 | n/a | 3-bet sizes 100 / 75 / 100 match the stated rule | ok |
| #15 rng1-* | K♣Q♣ · K♠8♦3♥; A♦J♣ · Q♥7♣2♦; K♦J♦ · A♥8♠4♣ | 140, then +45 +45 → 230 | n/a | stacks 1,000 − 70 = 930 | ok |
| #16 bt1-* | A♥Q♦ · J♠T♠9♥; A♠K♦ · K♣8♦3♥; J♣J♦ · 6♥5♥2♣ | pot 60, 970 each | n/a | wet / dry / wet; made straights KQ, Q8, 43 | ok |
| #17 cb1-* | A♣Q♦ · K♦7♣2♠; K♣Q♠ · 8♥7♥6♦; K♥Q♥ · A♦8♣3♠ | pots 60 / 60 / 45; c-bets 20 / 20 / 15 = 1/3 | n/a | Straights on 876 (T9, 54) correct; **"hardly any straight draw" on K72r contradicts #16's definition, which gives zero** | wording |
| #18 bs1-* | A♥K♦ · K♠7♣2♦; Q♥J♥ · K♥T♥4♣2♠; K♥Q♥ · A♠8♦3♣ | pots 120 / 240 / 180 | n/a | 1/3 and 3/4 sizes exact; flush draw + OESD (A or 9) on KT42 holds; "runner-runner only" on A83r holds | ok |
| #19 sb1-guided | 8♥7♥ · 9♥6♣2♥K♠ | pot 100, bet 50 | 50/150 = 33.3% | 15 outs, 30%; bet EV 30 + 0.7×(60−50) = 37 vs check 30 | ok |
| #19 sb1-practice | J♣T♣ · Q♦9♠3♣2♥5♦ | pot 120, bet 80 | 80/200 = 40% | distractors 29% / 67%; bet EV 36 − 56 = −20 vs check 0 | ok |
| #19 sb1-fresh | 6♦5♦ · K♦J♣9♦2♠ | pot 100, bet 100 | 50% | 9 outs, 18%; bet EV 20 − 0.8×46 = −16.8 ("about 17") vs check 18 | ok |
| #20 bl1-* | A♠J♠ · K♦Q♠4♣8♥2♦; A♥Q♥ · K♥9♣4♥7♠2♦; J♣T♣ · A♦8♣3♣4♠K♦ | pot 300, bet 200, 850 behind | n/a | "win 500" and "wins 700" totals hold; reveals 9♦8♦ and 8♠7♠ are distinct from visible cards, and the pair claims hold | ok |

Mechanical checks run on all 20 lessons [V]:

- `validateDefinitionHands` returns no errors.
- Every spot's hero/board cards are valid codes with no duplicates.
- Board length matches the street.
- Spot hero/board/street equals its hand's `start`.
- No revealed opponent card collides with a visible card.

Schema-semantics note [V]: in preflop spots, `potBefore`/`bet`/`call` are normalised so that
the three add up to the final pot. They are not the literal story amounts. For example, in
bd1-guided `potBefore` is 25, but the prompt says the pot is 40. Any V1 module that reads
these fields must use the sum, not `potBefore` alone [I].

### 4.3 Cross-lesson novelty: same hero hand or same structure reused

Under the contract's exposure rule, "the assessed item or its equivalence family", these
overlaps matter. Main decides the families; this list only reports them [V].

- K♥Q♥: #4 guided (flush draw), #7 guided (flush + straight draw), #17 fresh (A♦8♣3♠, no
  pair) and #18 fresh (A♠8♦3♣, no pair). **#17 fresh and #18 fresh have the same
  structure.**
- J♠T♠ on 9-8-2-x, 8 outs: #4 practice and #5 guided.
- 6♠5♠: #5 practice (OESD) and #7 fresh (gutshot).
- K-8-3 rainbow flop: #10 guided, #15 guided and #16 practice.
- Others with the same hero hand only: 9♠8♠ (#4, #13), A♥K♦ (#6, #18), A♥J♥ (#8, #11),
  A♦K♣ (#10, #14), Q♥J♥ (#10, #18), A♠5♠ (#12, #14), J♣T♣ (#13, #19, #20).

### 4.4 Format map

Formats come from the roadmap's reusable list. ● = strong fit, ○ = possible [I].

| # | Short film | Manipulative diagram | Worked example | Contrast / mistake demo | Guided decision | Fresh check |
|---|---|---|---|---|---|---|
| 1 Hand rankings | ● | ○ (pick five) | ○ | ● (trips vs full house) | ● | ● |
| 2 Positions | ● | ● (seats-behind ring) | | ● (same hand, two seats) | ● | ● |
| 3 Betting actions | ● | | | ● (three jobs) | ● | ● |
| 4 Outs | ○ | ● (highlight completing cards) | ● | ● (dirty vs clean) | ● | ● |
| 5 Rule 2/4 | ○ | ● (multiplier vs exact) | ● | ● (×4 on the turn) | ● | ● |
| 6 Equity | ● (needs content) | ● (share of pot) | ● | ● (pair now vs share) | ● | ● |
| 7 Pot odds | ● (existing + M1 alternate) | ● (PriceWorkbench) | ● | ● (own call omitted) | ● | ● |
| 8 Implied odds | ○ | ● (stacks-behind cap) | ● | ● (no stack behind) | ● | ● |
| 9 EV | ● | ● (repeated-trials bar) | ● | ● (win rate vs EV) | ● | ● |
| 10 SPR | ○ | ● (stack ÷ pot, bet ladder) | ● | ● (non-effective stack) | ● | ● |
| 11 Starting hands | ● | ○ | | ● (face card trap) | ● | ● |
| 12 RFI | ● | ● (open range by seat) | | ● | ● | ● |
| 13 Blind defense | ● | ● (price + position + playability) | ● | ● (dominated hand) | ● | ● |
| 14 3-betting | ● | ○ (blocker combos) | ○ | ● (value vs pressure) | ● | ● |
| 15 Ranges | ● | ● (range filter street by street) | ● | ● (fear reading) | ● | ● |
| 16 Board texture | ● | ● (draw finder) | | ● (dry vs wet) | ● | ● |
| 17 C-betting | ● | ○ (range advantage) | | ● (auto c-bet) | ● | ● |
| 18 Bet sizing | ● | ○ | ○ | ● (same size everywhere) | ● | ● |
| 19 Semi-bluff | ● (needs content) | ● (two-branch EV tree) | ● | ● (no backup) | ● | ● |
| 20 Bluffing | ● | | | ● (story vs target) | ● | ● (outcome framing to fix) |

No lesson has a delayed-retrieval check; that is a gap for every row (see §6).

## 5. Wording and math inconsistencies found

All of these were found by me in this pass. No fixture number is wrong.

1. **#17 vs #16 definitions.** cb1-guided calls K♦7♣2♠ "hardly any straight draw". Under
   #16's stated definition (four to a straight that some two-card hand holds now), that flop
   has none: K-7, 7-2 and K-2 each span more than five ranks, and no wheel is possible [V].
2. **#1 action mixed message.** The film cue says "If you misread this as trips, you leave
   value behind". The native production script says "raise for value". The shared scripted
   guided hand plays "Call 40 and see the showdown" [V].
3. **#9 film pause.** The pause asks for an integer % on range 0–99, but the true value is
   16.67% ("about 17%"). Grading is client-local and unscored [V/I]. If the pause becomes
   evidence, it needs an explicit tolerance [I].
4. **Terminology order.** "Equity" appears in the #3 film ("enough equity") and the #4 film
   ("roughly 18% equity") before #6 defines it [V].
5. **Native plan divergence.** `courseVideoPlan.js` calls itself "the single source of truth
   for producing every lesson video". In 7 lessons (#2, 7, 8, 10, 16, 18, 19) its spot cards
   differ from the shared guided spot, and its pot/bet numbers differ in more (for example
   #6, #13, #14) [V]. The shipped film-first media are retained intervals of the original
   films, and their `workedExample` cards match the shared guided spot in all 20 lessons
   [V]. A re-render from that plan would not match the current lessons [I].
6. **#16 curriculum title.** The title is "Board Texture: Dry, Wet, Paired, Connected", but no
   spot uses a paired board [V].
7. **#14 cast ring.** The order of names in `players` differs between hands (Kit and Ivy
   swap). Each prompt matches its own ring [V]. This is cosmetic only.

## 6. Gaps against the V1 learning contract

- **No delayed role anywhere.** All 20 lessons use only guided, practice and fresh [V]. No
  existing record links a later attempt to an earlier one under a schedule. Delayed evidence
  needs new main-owned issuance (PROPOSALS P3).
- **The server registry has no `role`.** Stage roles exist only in the public shared
  definitions; registry stages carry kind and spotId [V]. A `LearningEvidenceFact.role`
  therefore needs a main-supplied mapping (PROPOSALS P1).
- **Exposure is per (user, lesson, version) record only.** `assisted` is true if the run's
  hint was used, there is a prior attempt, or a hint was ever used at that version [V].
  Nothing records exposure across lessons or versions, or to the same equivalence family
  (see §4.3) [V]. "Fresh" therefore means fresh within the lesson, not verified novel
  (PROPOSALS P2).
- **Watching gates the hands and carries over to new runs** ("Watching is evidence the
  learner already has") [V]. That is a gate, not mastery. It is consistent with the contract,
  but V1 modules must not count it as evidence [I].
- **The curriculum "prove" step means the run reached `complete`** (the takeaway), not that
  the answers were correct [V]. It must not be read as independent learning evidence [I].
- **Native mastery treats one beaten archetype bot as mastered** (`source: 'milestone'`,
  score 1) [V]. The curriculum loop's "beat" step does the same. Neither may be treated as
  concept mastery under the contract. The bridge is main-owned (PROPOSALS P4).
- **The lesson-run controller writes no mastery or progress bridge** (its own comment) [V].
- **PriceWorkbench awards no progress.** The web component holds only local `useState`, and
  its model gates it to `pot-odds-workspace-v2` v2 spots with `ledger: "price"`. The native
  component has no save, fetch, API or award calls [V]. It is a manipulative with no evidence
  path, as the contract expects.
- **Two lessons share one concept.** #4 and #5 share `t1-outs-rule-24`, so concept-level
  aggregation pools them unless the plan separates them (INTERFACE-ACK item 5).
- **Prerequisites the content implies but `conceptMap.js` does not state** [I]:
  t1-equity → t1-pot-odds (pot odds compares price with a chance of winning); t1-ev →
  t4-fold-equity-semibluff (the spots are EV trees); and t1-equity → t0-betting-actions,
  through the film's vocabulary only.
- **Unexercised concepts**: dirty outs, reverse implied odds, paired boards, ties and split
  pots, multiway pots [V].
- **Concept nodes with no lesson** (9 of 28): t4-mdf-bluffcatch, t4-barreling-blockers,
  t5-range-narrowing, t5-player-typing, t5-gto-to-exploit, t6-bankroll, t6-tilt, t6-icm,
  t6-multiway [V]. This is a scope observation only. Adding lessons for these nodes is
  outside M2.

## 7. Not validated

- No client was run, so pause grading tolerance, preview rules and real playback were not
  observed.
- No server tests were run, and no database was read.
- Native `lessonHandModel.js` and the web `LessonPlayer` were not read.
- No accessibility review of the films was done, and no learning effect is claimed.
- Server key values were deliberately not compared with public explanations.
- Equity "given" values (#6, #19, #20 reads) are stated exercise values. I did not check
  them against any range.
