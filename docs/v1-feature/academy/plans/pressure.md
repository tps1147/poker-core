# Track 6 lesson plans: Pressure and Defense

Five v1 nodes from `src/learn/v1/academyTree.mjs`. Format: `../LESSON-PLAN-FORMAT.md`; film pattern from the accepted M1 v1 pot-odds storyboard (predict → build → reveal → prove over many repetitions → stamp → faded transfer → rule). Every number is asserted by `check-postflop-to-formats.mjs`. Ranges reuse the Postflop track's illustrative caller range (see `postflop.md`) and are labelled as illustrations.

The formulas this track puts on screen, always in these words:

- **Break-even fold rate** of a bet = bet ÷ (pot + bet).
- **Minimum defense frequency** = pot ÷ (pot + bet), the other side of the same fraction.
- **Two-branch EV** of a bet = fold share × pot + call share × (your chance × final pot − bet), against **check EV** = your chance × pot when the rest is checked through. Folds, chances and calls are *given* in each spot (labelled), never read from hidden cards.

---

## `x-fold-equity` — Fold Equity and Semi-Bluffs

Track 6, Pressure and Defense. Prerequisites: `f-cbet`, `m-ev`. Legacy: `t4-fold-equity-semibluff` / `semibluff-workspace-v1` (REVISE: the film was a short clip with no numbers; the spots need the break-even formula and the two-branch EV, which the new film shows). Practice: bluffing vs `drawer`.

| Field | Plan |
|---|---|
| One idea | A bet wins when they fold or when you hit: break-even fold rate = bet ÷ (pot + bet). |
| Belief it fixes | "A semi-bluff only works if they fold." |
| Hook | "He might fold. You might hit. What is the bet worth?" |
| Predict | Turn, 8♦ 7♦ on K♦ T♦ 3♠ 2♣, pot 100, checked to you. *Bet 75* / *Check*. Waits for a tap in the app. |
| Build | Two branches drawn as a fork. Fold branch (given: he folds 40%): the gold 100 slides to you. Call branch: the final-pot ring 100 + 75 + 75 = 250, your blue 75, the green 20% chance (given; a 9-out flush draw is 9 of 46, 19.6%, rounded for the film): 0.2 × 250 − 75 = −25. |
| Prove | 100 identical bets flip: 40 folds × +100 = +4,000; of the 60 calls, 12 hit × +175 = +2,100 and 48 miss × −75 = −3,600. Net +2,500: +25 a bet. 100 checks: 20 hits × +100 = +2,000, +20 a check. Contrast: the same bet with no outs (pure bluff) at the same 40% folds: +4,000 − 4,500 = −500, −5 a bet, because 40% is below the break-even 75 ÷ 175 = 3/7 = 42.9%. The outs, not only the folds, make the semi-bluff beat the check. |
| Transfer | Faded worked example on a new spot: pot 160, bet 100, given folds 25%, given chance 25%. Blanks fill one at a time after the learner tries: 100 ÷ (160 + 100) = 38.5%; called 0.25 × 360 − 100 = −10; bet 0.25 × 160 + 0.75 × (−10) = 40 − 7.5 = 32.5; check 0.25 × 160 = 40. CHECK stamp. |
| Rule | "Break-even = bet ÷ (pot + bet). A semi-bluff adds the chance you hit when called." |
| Checks | Keep `sb1-guided` (50 ÷ 150 = 33.3%; bet 37 vs check 30), `sb1-practice` (80 ÷ 200 = 40%; bet −20 vs check 0), `sb1-fresh` (100 ÷ 200 = 50%; bet −16.8 vs check 18), all server-graded and re-verified by the script. Add one film pause decision (the predict). Delayed check by policy. |
| Formats | film + worked + decision |
| Characters | Knox (coach) at the predict beat only. Rival `drawer` in practice. |
| Cinematic plates | None. |
| Sound | Silent-complete captions; narration later. |

### Film beats (target 75 s, 360×640 review draft)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Gold 100 pot, a blue bet chip hovering | He might fold. You might hit. What is the bet worth? |
| 4–10 | Spot | Real table: 8♦ 7♦ on K♦ T♦ 3♠ 2♣, pot 100, he checks | Turn. Flush draw. Checked to you. |
| 10–14 | Predict | BET 75 / CHECK, think bar | Predict first: bet or check? |
| 14–22 | Fold branch | Table leaves; fork drawn; left branch: 40% (given), gold 100 slides to you | Branch one: he folds 40% of the time (given). You win 100. |
| 22–31 | Call branch | Ring builds 100 white + 75 coral + 75 blue = 250; green 20% arc | Branch two: he calls. Final pot 250. You win it 20% (given). |
| 31–37 | Combine | 0.2 × 250 − 75 = −25 slams; 0.4 × 100 + 0.6 × (−25) = +25 count-up | Called, the bet loses 25 on average. Together: +25. |
| 37–41 | Check line | 0.2 × 100 = 20 | Checking wins 20. |
| 41–50 | Prove | 100 bets grid: 40 folds, 12 hits, 48 misses; tally +4,000 +2,100 −3,600 = +2,500 | Over 100 bets: +2,500. Over 100 checks: +2,000. |
| 50–55 | Pure bluff | Same grid without the green: 4,000 − 4,500 = −500; 75 ÷ 175 = 3/7 = 42.9% | With no outs, 40% folds is not enough: break-even is 42.9%. |
| 55–58 | Stamp | BET stamp, sparks | The outs make this bet worth +5 more than checking. |
| 58–70 | New spot | Pot 160, bet 100, folds 25%, chance 25% (given); blanks fill: 38.5%, −10, 32.5 vs 40 | Your turn. Fill the blanks. 32.5 < 40. |
| 70–75 | Rule | Glass card: break-even = bet ÷ (pot + bet); bet = folds × pot + calls × (chance × final pot − bet) | Two ways to win. Count both. |

**Truth sheet.** 8♦ 7♦ on K♦ T♦ 3♠ 2♣: 9 flush outs of 46 unseen (19.6%), no straight draw; the film's 20% is a labelled given. Film: 3/7; −25; +25; 20; −5; tally +2,500 / +2,000 / −500. Semi-bluff break-even against checking: f × 100 + (1 − f) × (−25) = 20 gives f = 9/25 = 36% (shown in the toy, not in the film). Transfer: 5/13 = 38.5%; −10; 32.5; 40; its semi-bluff break-even against checking is 5/17 = 29.4%, so 25% folds is short. Existing sb1 numbers re-verified.

---

## `x-bluffing` — Bluffing with a Story

Track 6, Pressure and Defense. Prerequisites: `x-fold-equity`, `f-ranges`. Legacy: `t4-bluffing` / `bluffing-workspace-v1` (REVISE: the scripted result after the answer acted as the verdict). Practice: bluffing vs `lag`.

| Field | Plan |
|---|---|
| One idea | Bluff when your line is believable and their range can fold; judge the decision, not the result. |
| Belief it fixes | "A bluff that got called was a bad bluff." |
| Hook | "Your draw missed. Is that a reason to bluff?" |
| Predict | J♣ 9♣ on Q♠ T♦ 5♣ 4♥ 2♠ (the straight draw missed), pot 150, he checks. *Bet 100* / *Check*. |
| Build | The story: you raised, bet the flop and bet the turn; that line holds the queens and better. His range after calling twice (illustration: the caller range keeping every pair and draw): 102 combos. The river splits it: 16 two pair or better, 9 top pair, 59 weaker pairs, 18 missed draws. Rule of thumb, labelled: against 100 into 150 he calls with top pair or better (25 combos) and folds the rest (77). |
| Prove | Break-even 100 ÷ 250 = 40%; his folds are 77 of 102 (75.5%). Over the 102 combos: 77 × +150 = +11,550 and 25 × −100 = −2,500, net +9,050, about 88.7 a bluff. Checking wins only against the 3 combos you beat (`98s`), about 4.4. The targets are the 74 folding combos that beat you. Then, and only after the verdict, one labelled sample: "One hand of many: this time he calls with Q♥ J♥." The verdict stays BET; the sample is 1 of the 25 calls (24.5% of the time) the EV already counted. |
| Transfer | Same river, different player (given): a station who calls with any pair. The learner predicts first; then 84 call and 18 fold (17.6%, below 40%): the bluff loses about 55.9 a try, and checking (4.4) is better. Same story, no audience. |
| Rule | "Bluff when the story is believable and the hands that fold beat you. A call is one sample, not the grade." |
| Checks | Keep `bl1-guided`, `bl1-practice-target`, `bl1-fresh-*` and their story/target questions, but **remove the conditional result lines** ("folds, you win 500", "calls and wins 700"): after the answer, show the reasoning card first, then a labelled single sample outcome that does not depend on the answer (new content version; main approves). Delayed check by policy. |
| Formats | contrast + decision |
| Characters | Knox. Rival `lag` in practice. The station in the transfer uses the `calling-station` rival art as a cameo. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → line replay on the table (bet, call, bet, call) → table leaves for the range bar → fold/call split → tally → verdict stamp → labelled single sample → station contrast → rule → spots.

**Truth sheet.** 135 live caller combos; 102 keep a pair or draw on the flop and all 102 still do on the turn; river tiers 16 / 9 / 59 / 18; 25 callers (each beats jack-high, checked), 77 folders, 3 you beat (`98s` combos), 74 folders that beat you; Q♥ J♥ is in the calling set. EVs: 9,050/102 ≈ 88.7, 450/102 ≈ 4.4, station (2,700 − 8,400)/102 ≈ −55.9.

---

## `x-mdf` — Defending Against Bets

Track 6, Pressure and Defense. Prerequisites: `f-ranges`, `m-pot-odds`, `p-blind-defense`. Legacy concept `t4-mdf-bluffcatch` (no lesson yet).

| Field | Plan |
|---|---|
| One idea | Minimum defense frequency: fold too often and any bluff profits. |
| Belief it fixes | "Fold whenever you might be beaten." |
| Hook | "He bets. You might be beaten. How often can you fold?" |
| Predict | River, pot 100, he bets 75. Slider: how much of your range do you keep? |
| Build | Toy: the coral bet on the gold pot; the MDF bar is the same fraction the bluffer needs, seen from your side. Snaps: 1/3 pot → 3/4 (75.0%), 1/2 → 2/3 (66.7%), 3/4 → 4/7 (57.1%), pot → 1/2 (50.0%), 2 × pot → 1/3 (33.3%). MDF + break-even fold = 1 at every size. |
| Prove | If you fold 60% against 75 into 100, any two cards bluff: 100 bluffs give 60 × +100 − 40 × 75 = +3,000 for him, +30 a bluff. At exactly 3/7 folds his bluffs earn 0. Worked: your 42 river combos (illustration); defend at least 42 × 4/7 = 24, folding the weakest 18. |
| Transfer | Pot 90, bet 60, your range 35 combos: the learner fills MDF = 90 ÷ 150 = 3/5 (60%) and defends 21 before the reveal. |
| Rule | "Keep at least pot ÷ (pot + bet) of your range. Fold less than that and his bluffs print." |
| Checks | New spots (server keys by main): pick the defend count at two sizes; one spot with a given read that this rival never bluffs, flagged as the bridge to `g-gto-to-exploit` (MDF is the default, not a law). Delayed check by policy. |
| Formats | toy + decision |
| Characters | Knox. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → slider predict → MDF toy → his-side tally → worked defend count → transfer → rule → spots.

**Truth sheet.** MDF fractions exact; MDF + break-even = 1 asserted at each size; 42 × 4/7 = 24; 35 × 3/5 = 21; bluffer EV +30 at 60% folds and 0 at 3/7. The 42 and 35 are given range sizes, labelled.

---

## `x-check-raise` — The Check-Raise

Track 6, Pressure and Defense. Prerequisites: `x-mdf`, `f-value-betting`. New lesson.

| Field | Plan |
|---|---|
| One idea | Check-raise for value and as a balanced bluff from out of position. |
| Belief it fixes | "A check-raise always means a monster." |
| Hook | "Out of position with a set. Bet, or let him bet first?" |
| Predict | Big blind, 6♣ 6♥ on 9♠ 6♦ 2♣, pot 60. *Lead* / *Check, planning to raise*. |
| Build | Worked: he bets 20; you raise to 70. His price to call the extra 50: 50 ÷ (60 + 70 + 70) = 50 ÷ 200 = 25%. The pot after his call is 200, against 100 if you had just called his 20. |
| Prove | The same check-raise with 8♠ 7♠ (8 straight outs: fives and tens) as the bluff half. As a pure bluff it risks 70 to win 80: break-even 70 ÷ 150 = 7/15 = 46.7%. When called, the draw still has 8 of 47 (17.0%) next card, 340 of 1,081 (31.5%) by the river counting only the clean 8 outs. Value and draws raise together, so the raise does not announce which. |
| Transfer | Faded: the same flop, he bets 20, and you hold a weaker pair. The learner works out that a raise folds out worse and keeps better: call instead. |
| Rule | "Check-raise your strongest hands and your best draws together." |
| Checks | New spots (server keys by main): set, combo draw, and a medium pair that should call. Delayed check by policy. |
| Formats | worked + decision |
| Characters | Knox. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → his bet, your raise on the table → price and pot readouts → draw half → transfer → rule → spots.

**Truth sheet.** 6♣ 6♥ is a set on 9♠ 6♦ 2♣ (tier check); 8♠ 7♠ has exactly 8 turn outs to a straight of 47 unseen (enumerated); 1 − C(39, 2)/C(47, 2) = 340/1,081 (with 741 two-card misses); runner-runner straights and flushes only add to it, which the script also checks. 50/200 = 1/4; 70/150 = 7/15.

---

## `x-barrels-blockers` — Barrels and Blockers

Track 6, Pressure and Defense. Prerequisites: `x-bluffing`, `f-bet-sizing`. Legacy concept `t4-barreling-blockers` (no lesson yet).

| Field | Plan |
|---|---|
| One idea | Plan bets across streets and pick bluffs that remove the opponent's best hands. |
| Belief it fixes | "Blockers matter more than the board." |
| Hook | "Three streets, 350 behind. How do you get it in?" |
| Predict | Pot 100, stacks 350. Tap the flop size that makes three bets fit. |
| Build | Barrel plan toy: three half-pot bets, 50 → 100 → 200, take the pot 100 → 200 → 400 → 800 = 100 + 2 × 350: all in by the river. SPR 3.5 shown at the start. Then the blocker grid on the river K♠ 9♠ 4♦ 2♠ 7♥: 10 spades unseen make 45 two-spade flush combos, 9 of them with the A♠. |
| Prove | Holding A♠ Q♦: his flush combos fall from 45 to 36 (a fifth, 20%) and the nut ones to 0. With 60 one-pair combos that fold (illustration, none holding the A♠), his fold share moves from 60 of 105 (57.1%) to 60 of 96 (62.5%): a 5.4-point nudge. Change the line instead (illustration: he also calls with 30 of those pairs): 30 of 75 (40%) is below the 3/4-pot break-even 3/7 (42.9%), and the A♠ lifts it only to 30 of 66 (45.5%). The line and board set the range; the blocker adjusts it. |
| Transfer | Faded: a blocker that removes his calling hands is worse than useless for a bluff. The learner sorts two river cards before the reveal. |
| Rule | "Plan the size for all three streets; pick the bluff that blocks his calls, after the board says he can fold." |
| Checks | New spots (server keys by main): choose a three-street size; choose the better bluff of two by blockers on the same line. Delayed check by policy. |
| Formats | worked + decision |
| Characters | Knox. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → barrel plan toy → river blocker grid → fold-share nudge → line change contrast → transfer → rule → spots.

**Truth sheet.** 100 + 2 × 350 = 800; 50 + 100 + 200 = 350; SPR 350/100 = 3.5. Unseen spades on K♠ 9♠ 4♦ 2♠ 7♥ = 10, C(10, 2) = 45, A♠ combos 9, C(9, 2) = 36. Fold shares 60/105, 60/96, 30/75, 30/66 against 3/7, with the 60 and 30 labelled as illustrative counts.
