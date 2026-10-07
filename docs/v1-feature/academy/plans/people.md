# Track 7 lesson plans: Reading People

Three v1 nodes from `src/learn/v1/academyTree.mjs`. Format: `../LESSON-PLAN-FORMAT.md`. Every number is asserted by `check-postflop-to-formats.mjs`. Ranges reuse the illustrative caller range from `postflop.md`; player-type statistics are invented illustrations and are captioned that way on every screen they appear.

Reading people here means reading **actions**: what a player bets, calls and shows down, over enough hands to mean something. Nothing in this track reads hidden cards or a future card.

---

## `h-range-narrowing` — Narrowing Ranges Street by Street

Track 7, Reading People. Prerequisites: `f-ranges`, `f-cbet`. Legacy concept `t5-range-narrowing` (no lesson yet).

| Field | Plan |
|---|---|
| One idea | Each action removes hands; track what remains. |
| Belief it fixes | "Ranges stay the same after the flop." |
| Hook | "He called three times. Is his range the same as before the flop?" |
| Predict | Before anything moves: tap *same size* / *about half* / *almost nothing left* for his river range. |
| Build | Worked, with the violet range bar shrinking street by street on J♥ 8♣ 4♦, 2♠, K♥. Before the flop: 186 combos. The flop's cards remove 24: 162. He calls your flop bet with any pair or draw (rule of thumb, labelled): 118 (72.8% of 162). He calls the turn with a pair of eights or better or a straight draw, and the 2♠ removes its combos: 85 (72.0% of 118). The river K♥ removes three more: 82. |
| Prove | The river bar sorts: 18 two pair or better, 48 one pair, 16 missed draws, 0 with nothing. Each removed slice stays visible, greyed, labelled with the action that removed it, so the learner sees the range as a history, not a guess. |
| Transfer | Same range, flop Q♦ 6♣ 3♠, same flop rule. The learner predicts the share that calls before the bar moves: 171 live, 79 call (6 two pair or better, 15 top pair, 54 weaker pairs, 4 draws), 92 fold. |
| Rule | "Start wide, then let every action take hands out. Keep the list, not one guess." |
| Checks | New spots (server keys by main): which group a call removes; which hand still fits after two calls; a river count estimate. Delayed check by policy. |
| Formats | worked + decision |
| Characters | Reina (coach). Rival `balanced`. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → the hand plays on the real table one street at a time; after each action the table dims and the bar narrows → river sort → transfer → rule → spots.

**Truth sheet.** 186 → 162 → 118 → 85 → 82 and the river tiers 18 / 48 / 16 / 0 are enumerated with card removal by the check script; the transfer counts 171 / 79 / 92 with tiers 6 / 15 / 54 / 4 likewise. Both calling rules are labelled illustrations.

---

## `h-player-types` — Player Types

Track 7, Reading People. Prerequisites: `h-range-narrowing`. Legacy concept `t5-player-typing` (no lesson yet). Practice opponent: `calling-station`.

| Field | Plan |
|---|---|
| One idea | Spot calling stations, nits, TAGs, LAGs, trappers, drawers and sharks from what they do, measured against a balanced baseline. (No roster bot plays the `balanced` archetype as a type to spot; it is the reference.) |
| Belief it fixes | "Read people from body language online." |
| Hook | "You can't see his face. What can you see?" |
| Predict | Three short action strips (call, call, call / fold, fold, raise / raise, raise, raise). Tap the rival each one belongs to. |
| Build | Two habits define a type: how many hands a player plays, and how many of those he raises. An illustrative table, per 100 hands, played / raised: calling station 45 / 6, nit 12 / 10, TAG 22 / 18, LAG 34 / 27, trapper 20 / 12 (checks big hands), drawer 38 / 10 (calls with draws), shark 25 / 20, and the balanced baseline 24 / 19. Captioned: "Illustration. Real players vary." |
| Prove | A sample is not a type. A true 22% player seen for 100 hands shows anywhere from about 13.7% to 30.3% (two standard errors of 4.1 points); after 1,000 hands the error is 1.3 points. The film runs a counter that tightens as hands accumulate, so the label appears only once the band is narrow. |
| Transfer | Match: the learner plays a short Gauntlet session against an unlabelled rival, logs played / raised, then names the type. |
| Rule | "Type players by what they do, over enough hands to trust it." |
| Checks | Comprehension taps in the film (not evidence); the match naming check (server-graded by main if adopted). Delayed check by policy. |
| Formats | film + match |
| Characters | The Gauntlet rival cast as cameos, one per type: `calling-station`, `nit`, `tag`, `lag`, `trapper`, `drawer`, `shark`, with `balanced` as the reference. Reina narrates captions. |
| Cinematic plates | Existing Gauntlet rival cast art only, as character cameos at their type cards. No new generated plates. |
| Sound | Silent-complete captions; narration later. |

### Film beats (target 60 s, 360×640 review draft)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | A table of avatars, faces blank | You can't see his face. What can you see? |
| 4–9 | Predict | Three action strips, three rival cards to match | Predict: which player made each line? |
| 9–17 | Two habits | Two meters: hands played, hands raised | Two habits: how often he plays, how often he raises. |
| 17–35 | The cast | Rival cameos slide in with their illustrative numbers, two at a time | Station 45 / 6. Nit 12 / 10. TAG 22 / 18. LAG 34 / 27 … (illustration) |
| 35–47 | Sample size | A 22% player's counter after 100 hands; band 13.7%–30.3% narrows to 1.3 points at 1,000 | 100 hands is a hint. 1,000 is a read. |
| 47–55 | Reveal | The predict strips flip to their rivals | Lines, not faces, gave them away. |
| 55–60 | Rule | Glass card | Type players by what they do, over enough hands. |

**Truth sheet.** The per-100 table is an illustration (asserted only for raised ≤ played). Standard error √(0.22 × 0.78 ÷ 100) ≈ 4.1 points; 22 ± 2 × 4.1 ≈ 13.7 to 30.3; at 1,000 hands ≈ 1.3. Archetype ids are the Gauntlet ids.

---

## `h-exploits` — Beating Each Type

Track 7, Reading People. Prerequisites: `h-player-types`.

| Field | Plan |
|---|---|
| One idea | One adjustment per type: value bet the station, bluff the nit, trap the LAG. |
| Belief it fixes | "One style beats everyone." |
| Hook | "Same river bet. Two rivals. Same answer?" |
| Predict | River, pot 90, you hold nothing. Bluff 60 into the nit, then into the station: *bet* / *check* for each. |
| Build | The break-even fold rate stays 60 ÷ 150 = 40% for both. Only the given fold rate changes: the nit folds 70% (given): 0.7 × 90 − 0.3 × 60 = 63 − 18 = +45. The station folds 20% (given): 18 − 48 = −30. |
| Prove | The mirror: a thin value bet of 60 with a medium pair. Against the station 60% of his calls are worse (given): 36 − 24 = +12 a call. Against the nit only 20% are worse (given): 12 − 48 = −36. Then the LAG: checked to, he bets 60 into 90 three times in four (given) and half of those bets are bluffs (given); your call's price is 60 ÷ 210 = 28.6%, and a bluff-catcher call earns ½ × 150 − ½ × 60 = 75 − 30 = +45. Checking lets him do the betting. |
| Transfer | Match: three short Gauntlet sessions, one per type; before each the learner picks the one adjustment, after it the session log shows the adjustment's EV given the rival's set frequencies (never the session's result). |
| Rule | "Find the leak, then make the one move that punishes it." |
| Checks | Decision spots per type (server keys by main); the match picks are logged, not graded by results. Delayed check by policy. |
| Formats | match + decision |
| Characters | Rival cameos: `calling-station`, `nit`, `lag`, and `trapper` for the "trap" contrast. |
| Cinematic plates | Existing Gauntlet rival cast art as cameos only. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → paired predict → same break-even, two fold rates → value mirror → LAG trap beat → match picks → rule → spots.

**Truth sheet.** 60/150 = 2/5; nit bluff +45; station bluff −30; station value +12; nit value −36; LAG call +45 at price 2/7 (28.6%). Every frequency is a stated given for that rival.
