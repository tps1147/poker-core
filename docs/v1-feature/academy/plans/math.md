# Lesson plans: Track 3, The Math Spine (draft 0, 2026-10-06)

Nine nodes from `src/learn/v1/academyTree.mjs` (`math` track), in tree order. Format: `../LESSON-PLAN-FORMAT.md`. Pattern: the accepted M1 v1 PotOdds film (`storyboard-v1.md`, `truth-sheet.md`, `IDEAS-NEXT.md`), so every film runs **predict → build → price/count → compare → prove over many repetitions → stamp → faded transfer → rule**.

Every number below is computed and asserted by `check-math-preflop.mjs` in this folder (exact fractions; outs verified with `src/eval/pokerEvaluator.js`). Run: `node docs/v1-feature/academy/plans/check-math-preflop.mjs`.

## Shared rules for this track

- **Where a chance comes from.** Either *counted*: outs over 47 unseen cards (flop) or 46 (turn), under the stated rule "a completed draw wins, any other card loses"; or *given*: "You win about N% against their range (given)". No chance is ever read from a particular hidden card. Opponent cards stay face down for the whole track.
- **Assumptions line** (footer on every math beat): heads-up, no rake, ties ignored, and no more betting after the call unless the lesson says otherwise.
- **Colour** (one meaning everywhere): green = your chance (and the out cards that make it), blue = your call or the price, coral = their bet, gold = the final pot, white = chips already in. Non-outs are dim grey.
- **Results never grade decisions.** Single outcomes appear only as a labelled sample beside the many-repetitions view.
- **Cinematic plates:** none in this track. Rings, card grids, tallies and the table are code-drawn and deterministic. Optional: one coach cameo still per lesson (existing cast art, no generation).
- **Coach:** Mina, as in the existing math lessons. Cameo only at Predict and at the contrast beat (IDEAS-NEXT 8).
- **Sound:** silent-complete captions first (54 px at 1080 wide, 3–6 s dwell); narration later, timed to captions.
- **Checks** are server-graded decisions authored by main from these fixtures. This plan gives the math only; no server key was read or copied.

---

## m-chance-as-share · Chance as a Share

New lesson (no legacy). Prereqs: `w-luck-and-skill`. Formats: film, toy.

| Field | Plan |
|---|---|
| One idea | A chance is a share of possible outcomes: 1 in 4 is 25%, and repeated many times the share is what you get. |
| Belief it fixes | "30% means it won't happen." |
| Hook | "One card from a shuffled deck. How often is it a heart?" |
| Predict | Tap one: *Rarely* / *1 time in 4* / *Half the time*. No grade; revisited at Prove. |
| Build | The 52 cards fall into four suit columns of 13; the hearts column turns green. A share bar fills: 13 of 52 → ¼ → 25%. Beside it, "3 misses for every hit" (39 grey to 13 green). |
| Prove | 100 draws flip into a 10 × 10 grid; the expected 25 are green, evenly spread, labelled "the expected share, not a forecast of one draw". Then the misconception: a 30% bar becomes 30 of 100 dots lit. "30% happens, 3 times in 10." |
| Transfer | Faded worked example: "an ace?" with blanks `? ÷ 52 = ?` filling one term at a time: 4 ÷ 52 = 1 in 13, about 7.7%, about 8 in 100 draws. |
| Rule | "Chance = the outcomes you want ÷ all outcomes. Repeat it, and that share is what you get." |
| Toy | Share slider 0–100%: the 10 × 10 grid lights that many dots; a toggle redraws the same share at 10, 100 and 1,000 tries (expected counts only). |
| Checks | Guided: chance the next card is a heart (25%). Practice: a red card (50%). Fresh: a jack, queen or king (12 of 52 = 3 in 13, about 23.1%). Delayed: by policy. Comprehension tap (not evidence): "30%: out of 10 tries, about how many happen?" (3). |
| Characters | Mina cameo at Predict. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | A deck riffles; one card hovers face down | One card. How often is it a heart? |
| 4–9 | Predict | RARELY / 1 IN 4 / HALF, think bar | Predict first. |
| 9–18 | Build | 52 cards drop into four columns of 13; hearts turn green; "13 of 52" | 13 of the 52 cards are hearts. |
| 18–24 | Share | Bar fills to ¼, slams "25%"; 39 grey vs 13 green, "3 misses for every hit" | 13 ÷ 52 is one quarter: 25%. |
| 24–33 | Prove | 100 draws flip in rows; counter rolls to 25 green | Draw 100 times and expect about 25 hearts. |
| 33–40 | Misconception | Bar at 30%; 30 of 100 dots light; stamp "IT HAPPENS" | 30% isn't "no". It's 3 times in 10. |
| 40–52 | Transfer | "An ace?" Blanks `? ÷ 52 = ?` fill: 4 ÷ 52 = 1 in 13 ≈ 7.7% | Your turn: 4 aces in 52 cards. |
| 52–56 | Transfer result | 100-dot grid, about 8 lit | About 8 draws in 100. |
| 56–62 | Rule | Glass card: chance = wanted ÷ all; mini grids for 25% and 30% | Chance is a share. Repeat it, and the share is what you get. |

**Truth sheet:** 52 cards, 13 hearts, 13/52 = 1/4 = 25%, 39 : 13 = 3 to 1; 25 expected in 100; 30% → 30 of 100, 3 of 10; 4/52 = 1/13 ≈ 7.7%, ≈ 8 in 100; 26/52 = 50%; 12/52 = 3/13 ≈ 23.1%. All grids show expected counts and are labelled so; nothing is simulated.

---

## m-outs · Outs

Legacy: `t1-outs-rule-24`, `outs-workspace-v1` v2, **KEEP** (9 / 8 / 4 outs verified). This plan is a new film and new fixtures; the existing lesson stays as is. Prereqs: `b-made-vs-draw`, `m-chance-as-share`. Formats: film, decision. Practice: pot-odds vs drawer.

| Field | Plan |
|---|---|
| Objective (tree) | Count the unseen cards that turn your hand into the winner; a dirty out improves you but also gives them a better hand, so it does not count. |
| One idea | Count the unseen cards that turn your hand into the winner, and only those. |
| Belief it fixes | "Every card that improves you is an out." |
| Hook | "You need help. How many cards in this deck save you?" |
| Predict | Number pad: how many outs? (any whole number; revisited at Compare). |
| Build | Real table: your J♣ T♣, board 9♣ 4♦ 2♣ K♥ (turn). Stated rule on screen: "Their range: two pair or better (given). A completed straight or flush wins; nothing else does." Then the table leaves: the 46 unseen cards (52 − 2 − 4) fan into a 4 × 13 grid. Clubs light green (9). Queens light green (4); Q♣ is already lit and pulses "counted once". |
| Compare | Tally: 9 + 4 − 1 = **12 outs**. Contrast beat: the jacks and tens (6 cards) light amber, "they improve you to a pair… which still loses here", then drop to grey. 18 is the wrong count. |
| Prove | Every possible river, once each: the 46 cards flip in order; 12 green, 34 grey. "12 in 46, about 26.1%." This is a full enumeration, not a sample. |
| Transfer | Faded: Q♦ J♦ on T♠ 9♣ 3♥ (flop). Learner counts first; then 47 unseen, kings and eights light one rank at a time: **8 outs**; the queens and jacks (6) go amber then grey. 8 in 47 ≈ 17.0%. |
| Rule | "An out is a card that makes you the winner. Count each card once." |
| Checks | Guided: the film spot (12). Practice: the transfer (8). Fresh: K♣ J♦ on Q♥ 9♠ 4♣ 2♦ (turn): 4 outs (the tens); the 10 distractor adds the six pairing cards. Delayed: by policy. |
| Characters | Mina cameo at Predict and at the amber contrast. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | J♣ T♣ glow; deck shadow behind | You need help. How many cards save you? |
| 4–9 | Predict | Number pad, think bar | Predict: how many outs? |
| 9–15 | Spot | Table: board 9♣ 4♦ 2♣ K♥; rule pill "Their range: two pair or better · given" | A straight or a flush wins here. Nothing else does. |
| 15–21 | Unseen | Table leaves; 46 cards fan into a grid; "52 − 6 = 46" | 46 cards are still unseen. |
| 21–28 | Clubs | Nine clubs light green, count-up 1→9 | Any club makes your flush: 9 cards. |
| 28–34 | Queens | Four queens light; Q♣ pulses "once" | A queen makes your straight. The queen of clubs is already counted. |
| 34–38 | Tally | 9 + 4 − 1 = 12, slam | 12 outs. |
| 38–44 | Contrast | Jacks and tens turn amber, then grey; "18" struck through | A pair improves you, but still loses. Not an out. |
| 44–50 | Prove | 46 rivers flip in order: 12 green, 34 grey; "12 in 46 ≈ 26.1%" | Every river once: 12 of 46 win. |
| 50–62 | Transfer | Q♦ J♦ · T♠ 9♣ 3♥; blanks fill: kings 4, eights 4, total 8; 47 unseen | Your turn. On the flop, 47 cards are unseen. |
| 62–66 | Transfer result | "8 in 47 ≈ 17.0%"; the six Q/J pairing cards dim | 8 outs. The pairing cards don't count. |
| 66–71 | Rule | Glass card | An out makes you the winner. Count each card once. |

**Truth sheet:** film 46 unseen; outs 12 = 9 clubs + 4 queens − Q♣; 6 pairing cards (J, T) are not outs; 12/46 ≈ 26.1%. Transfer 47 unseen, 8 outs (K, 8), 6 pairing cards, 8/47 ≈ 17.0%. Fresh 4 outs (T), distractor 10, 4/46 ≈ 8.7%. Evaluator confirms each out makes a straight or better and each starting hand is below a straight.

**Dirty outs (tree objective, 2026-10-06).** The objective now names dirty outs: a card that improves you but also gives them a better hand is not an out. The film's spots stay clean by their stated rule. Owed before production: one paired-board contrast spot (a flush card that also fills their full house), with its fixture asserted in `check-math-preflop.mjs` first.

---

## m-rule-2-4 · Rule of 2 and 4

Legacy: `t1-outs-rule-24`, `rule-2-4-workspace-v1` v2, **KEEP** (exact 17.4% and 31.5% notes verified). New film; the existing lesson stays. Prereqs: `m-outs`. Formats: film, decision.

| Field | Plan |
|---|---|
| Objective (tree) | Estimate your chance from outs: about 2% per out with one card to come, about 4% with two. |
| One idea | Outs × 2 estimates one card to come; outs × 4 only when both cards come for this one price. |
| Belief it fixes | "The 4 rule applies when you'll face another bet." |
| Hook | "Two cards to come. Do you multiply by 4?" |
| Predict | Tap: *×4, two cards are coming* / *×2, I only paid for one*. Two versions of the same flop are shown side by side: they go all-in / they bet half the pot. |
| Build | J♦ 9♦ on K♦ 5♦ 2♠ (flop), rule "only a diamond wins". 9 outs as green cards. Two lanes: TURN and RIVER. All-in lane: both lanes open, "you see both cards for this price" → 9 × 4 = 36%. Bet lane: the river lane is locked behind a coral chip "another bet may come" → 9 × 2 = 18%. |
| Compare | Exact beside each estimate: turn only 9 ÷ 47 ≈ 19.1% vs 18%; both cards 1 − (38 × 37) ÷ (47 × 46) = 378/1081 ≈ 35.0% vs 36%. "Close enough to decide with." |
| Prove | Every turn-and-river pair (1,081 of them) as a dense dot field; 378 green. Count-up to 35.0%. Full enumeration, labelled. |
| Transfer | Faded: T♥ 9♥ on 8♣ 7♦ 2♠, all-in on the flop. Learner picks the multiplier first; then 8 outs × 4 = 32%, exact ≈ 31.5%. Footnote card: big draws run high (15 outs: ×4 = 60%, exact ≈ 54.1%). |
| Rule | "×2 for one card. ×4 only when you'll see both for this price." |
| Checks | Guided: the all-in film spot (×4, 36%). Practice: A♠ Q♣ on K♦ T♠ 6♥ 3♣ (turn), a gutshot: 4 × 2 = 8% (exact ≈ 8.7%). Fresh: 7♠ 6♠ on 5♥ 4♣ K♦ (flop), facing a bet that is not all-in: 8 × 2 = 16%; the 32% distractor is the ×4 slip; exact next card ≈ 17.0%. Delayed: by policy. |
| Characters | Mina cameo at Predict. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Flop K♦ 5♦ 2♠; two face-down lanes TURN · RIVER | Two cards to come. Multiply by 4? |
| 4–10 | Predict | Split screen: coral ALL-IN vs coral BET; ×4 / ×2 buttons | Predict: same flop, two bets. Which rule fits each? |
| 10–17 | Outs | 9 diamonds light green; "9 outs" | Any diamond wins: 9 outs. |
| 17–25 | All-in lane | Both lanes open; 9 × 4 = 36% slams green | All-in: you see both cards for this price. 9 × 4 ≈ 36%. |
| 25–33 | Bet lane | River lane locks behind a coral chip; 9 × 2 = 18% | Not all-in: you paid for one card. 9 × 2 ≈ 18%. |
| 33–40 | Exact | Estimate vs exact chips: 18% / 19.1%, 36% / 35.0% | The exact shares are close: 19.1% and 35.0%. |
| 40–47 | Prove | 1,081 turn-river pairs; 378 green; counter | Every turn and river pair: 378 of 1,081. |
| 47–60 | Transfer | T♥ 9♥ · 8♣ 7♦ 2♠, all-in; blanks: outs ?, × ?, = ?; fill 8, 4, 32% | Your turn: all-in on the flop with 8 outs. |
| 60–64 | Transfer result | "≈ 31.5% exact"; footnote chip "15 outs: 60% vs 54.1%" | Close again. Big draws run a little high. |
| 64–70 | Rule | Glass card, the two lanes as icons | ×2 for one card. ×4 only when both come for this price. |

**Truth sheet:** 9 outs; 18% / 36% estimates; exact 9/47 ≈ 19.1%; exact two-card 378/1081 ≈ 35.0% (enumerated over all pairs, diamonds only); transfer 8 outs, 32%, exact ≈ 31.5%; 15 outs 60% vs ≈ 54.1%; practice 4 outs, 8%, ≈ 8.7%; fresh 8 outs, 16% (slip 32%), ≈ 17.0%.

---

## m-equity · Equity: Your Share of the Pot

Legacy: `t1-equity`, `equity-workspace-v1` v2, **REVISE** (8 s film, three cues, no worked number). This plan is the replacement film the audit asks for: a worked share-of-pot example (pot × chance = chips) plus a share-of-pot toy; the three estimate spots can stay (new content version, main approves). Prereqs: `m-rule-2-4`. Formats: film, toy, decision.

| Field | Plan |
|---|---|
| Objective (tree) | Equity is your chance to win expressed as your share of the pot. |
| One idea | Equity is your chance to win taken as your share of the pot: chance × pot = the chips that are yours on average. |
| Belief it fixes | "Equity is the chips you have already put in." |
| Hook | "There are 230 chips in the middle. How many are yours?" |
| Predict | Tap: *80, I put them in* / *All 230 or nothing* / *Some share*. |
| Build | Table: K♣ J♣ on Q♣ 7♦ 3♣ 2♥ (turn); both players all-in, no more betting. The pot splits into its sources: 80 from you (white), 80 from them, 70 from players who folded. The table leaves. Gold ring = the 230 pot. 9 outs (clubs) of 46 → green share 9/46 ≈ 19.6% sweeps the ring. |
| Compare | Centre rolls: 9/46 × 230 = **45 chips**. Contrast: the white 80 "chips you put in" floats beside it, struck: "what you paid isn't what you own". |
| Prove | All 46 rivers, each once: 9 green cards each win 230, 37 grey win 0. Tally [9] × [230] = 2,070; ÷ 46 = 45. Full enumeration, not a sample. |
| Transfer | Faded, given chance: pot 150, "You win about 40% against their range (given)". Blanks `? × ? = ?` fill: 40% × 150 = 60. |
| Rule | "Equity = your chance × the pot." Then "Next: what it costs to chase it." |
| Toy | Drag the chance 0–100%: the green slice and the chip count move together (0 → 0, 100% → all 230). The white "chips in" marker never moves. |
| Checks | Keep the three existing estimate spots, or move to these: Guided: the film spot (45; bands 0 / 45 / 80 / 230, where 80 is the chips-in slip). Practice: the transfer (60). Fresh: 6♣ 5♣ on 7♥ 4♦ K♠ J♦ (turn), pot 115, 8 outs (3 or 8): 8/46 × 115 = 20 chips (×2 estimate 18.4). Delayed: by policy. |
| Characters | Mina cameo at the contrast. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Gold pot 230 glows | 230 chips in the middle. How many are yours? |
| 4–9 | Predict | 80 / ALL OR NOTHING / A SHARE | Predict first. |
| 9–17 | Spot | Table: K♣ J♣ · Q♣ 7♦ 3♣ 2♥; ALL-IN chips; pot splits 80 white / 80 / 70 | Both all-in. No more betting. You put in 80. |
| 17–24 | Chance | Table leaves; 9 clubs green of 46; "9 in 46 ≈ 19.6%" | Any club wins it: 9 of 46 cards. |
| 24–31 | Share | Gold ring 230; green slice sweeps to 19.6%; centre rolls to 45 | Your share: 19.6% of 230 is 45 chips. |
| 31–37 | Contrast | White 80 beside the green 45; 80 struck | The 80 you put in isn't yours anymore. The share is. |
| 37–46 | Prove | 46 rivers flip: 9 × 230 = 2,070; ÷ 46 = 45 | Every river once: 2,070 chips over 46 rivers. 45 each. |
| 46–49 | Stamp | "45 = YOUR EQUITY" stamp | That's your equity. |
| 49–60 | Transfer | Pot 150, "40% against their range · given"; blanks fill 40% × 150 = 60 | Your turn: a given 40% of a 150 pot. |
| 60–66 | Rule | Glass card: equity = chance × pot; the two rings | Equity is your chance times the pot. |

**Truth sheet:** 9 outs (clubs; no one-card straight); 80 + 80 + 70 = 230; 9/46 ≈ 19.6%; 9/46 × 230 = 45; 9 × 230 = 2,070; 2,070/46 = 45. Transfer 40% × 150 = 60. Fresh 8 outs, 8/46 × 115 = 20; 16% × 115 = 18.4.

---

## m-pot-odds · Pot Odds: Find Your Price

Legacy: `t1-pot-odds`, `pot-odds-workspace-v2` v2, **KEEP** and protected (150 + 50 + 50 = 250 → 20%). This node is planned **as the accepted M1 v1 film** (`potodds-alt-river-v1`, same truth pack) plus the two IDEAS-NEXT additions: the leave-out-your-call contrast inside the film and the drag-the-bet toy after it. The existing lesson's spots and server keys are untouched. Prereqs: `m-equity`. Formats: film, worked, contrast, decision. Practice: pot-odds vs drawer.

| Field | Plan |
|---|---|
| One idea | Price = your call ÷ the final pot. Call when your chance is at least the price. |
| Belief it fixes | "Leave your own call out of the pot." |
| Hook | "30%. Is that enough?" |
| Predict | YOUR MOVE · CALL 50 OR FOLD? (interactive version waits for the tap). |
| Build | River, heads-up, "You win 30% against their range (given)", both hands face down. Final-pot ring builds: 100 white, their 50 coral, your 50 blue; centre 100 → 150 → 200, legend rows appear with each segment. |
| Price | Other segments dim; the blue slice glows with quarter ticks: 50 ÷ 200 = 25%, "win 1 time in 4 to break even". |
| Contrast (new) | The blue slice lifts out of the ring; the ring shrinks to 150: 50 ÷ 150 ≈ 33.3%, and the 30% now looks short (30% < 33.3%). The slice snaps back in: 25%. "Your call is in the final pot." |
| Compare | Price ring left, green chance ring right: 30% > 25%. |
| Prove | 100 identical calls flip, the expected 30 green spread evenly ("the expected share, not a forecast of one river"). Tally [30] × [+150] = +4,500; [70] × [−50] = −3,500; net +1,000. CALL stamp: "+10 chips a call, vs folding, on average"; 0.30 × 200 − 50 = +10. |
| Transfer | Faded: same table, coral 100 slams, still 30%. Blanks fill: 100 + 100 + 100 = 300; blue third with thirds ticks; 100 ÷ 300 = one third, about 33.3%; 30% < 33.3%; FOLD stamp, 0.30 × 300 − 100 = −10. |
| Rule | Glass card: price = your call ÷ final pot; "Call when your chance is at least the price"; both spots as mini rings, CALL and FOLD. |
| Toy (new, after the film) | Drag their bet from 10 to 200 into a pot of 100; the final-pot ring and blue price slice move; the 30% green ring stays fixed. The learner finds the flip: exactly 75 into 100 → 75 ÷ 250 = 30% (74 still a call, 76 a fold). Endpoints: 10 → about 8.3%, 200 → 40%; the price never reaches 50%. No progress is awarded by the toy. |
| Checks | Guided: the film's main spot (call; EV +10). Practice: river, pot 120, bet 40, 25% given → final 200, price 20%, EV +10. Fresh: river, pot 90, bet 60, 20% given → final 210, price ≈ 28.6%, EV −18; distractors 60 ÷ 150 = 40% (call left out) and 60 ÷ 90 ≈ 66.7% (bet ÷ pot). Delayed: by policy. |
| Characters | Mina cameo at Predict and at the contrast; optional rival portrait flash on the coral slam (IDEAS-NEXT 9). |

Beats follow v1 with the contrast inserted (+6 s), prove and transfer each tightened by 2 s: 74 s.

| Time (s) | Chapter | On screen | Caption |
|---|---|---|---|
| 0–3.5 | 01 Predict | 30% sweeps into a green ring. "IS THAT ENOUGH?" | 30%. Is that enough? |
| 3.5–9.5 | 01 | Range haze, pot 100; coral 50 slams, pot rolls to 150; "You win 30% against their range · given" | They go all-in for 50. You win 30% against their range. |
| 9.5–13.5 | 01 | CALL 50 OR FOLD? think bar | Your move. Call 50, or fold? |
| 13.5–23 | 02 Build | Ring: 100 white, 50 coral, 50 blue; centre 100 → 150 → 200 | If you call, the final pot is 200. |
| 23–30 | 03 Price | Blue slice glows, quarter ticks; 50 ÷ 200 = 25% | Your call is a quarter of it: 25%. Win 1 time in 4 to break even. |
| 30–36 | 03 Contrast | Blue slice lifts out; ring 150; 50 ÷ 150 ≈ 33.3% struck; slice snaps back | Leave your call out and it looks like 33.3%. Your call is in the pot. |
| 36–39.5 | 03 Compare | Price ring left, chance ring right: 30% > 25% | 30% beats a 25% price. |
| 39.5–43.5 | 04 Prove | 100 calls flip; 30 green | Make this call 100 times: about 30 wins. |
| 43.5–48 | 04 | [30] × [+150] = +4,500; [70] × [−50] = −3,500; net +1,000 | Wins pay 4,500. Losses cost 3,500. |
| 48–51 | 04 | CALL stamp, sparks; 0.30 × 200 − 50 = +10 | +10 chips a call, vs folding, on average. |
| 51–58 | 05 New spot | Coral 100 slams, pot 200, still 30% | New spot: all-in for 100. Still 30%. |
| 58–63 | 05 | Blanks fill 100 + 100 + 100 = 300; blue third; 100 ÷ 300 ≈ 33.3% | Final pot 300. Your call is one third, about 33.3%. |
| 63–65.5 | 05 | 30% < 33.3% | 30% is short of the price. |
| 65.5–68 | 05 | FOLD stamp; 0.30 × 300 − 100 = −10 | Fold. Calling loses 10 a call on average. |
| 68–74 | 06 Rule | Glass card, two mini rings | Price = your call ÷ the final pot. Call when your chance is at least the price. |

**Truth sheet:** inherits `truth-sheet.md` unchanged (100 / 50 / 50 → 200, 25%, EV +10, 4,500 − 3,500 = 1,000; 100 / 100 / 100 → 300, ⅓ ≈ 33.3%, EV −10; break-even EV 0 at the price). Additions: contrast 50/150 = ⅓ ≈ 33.3%; toy 75/250 = 3/10, 10/120 ≈ 8.3%, 200/500 = 40%, limit below 50%; practice 40/200 = 20%, EV +10; fresh 60/210 ≈ 28.6%, EV −18, slips 40% and ≈ 66.7%.

---

## m-ev · Expected Value

Legacy: `t1-ev`, `ev-workspace-v1` v1, **KEEP** (EV +40 / −10 / +11 verified). The audit notes the film pause asks for an integer % where the answer is 16.67%; this plan's pause asks for chips (+20), an exact integer. New film; the existing spots can stay. Prereqs: `m-pot-odds`. Formats: film, worked, decision. Practice: pot-odds vs balanced.

| Field | Plan |
|---|---|
| Objective (tree) | Average result over many identical decisions; a good call can lose and still be right. |
| One idea | EV is the average result of a decision over many identical tries, measured against folding; a good call can lose and still be right. |
| Belief it fixes | "The result of one hand tells you if the decision was right." |
| Hook | "You called. You lost 100. Was it a mistake?" |
| Predict | Tap: *Yes, I lost* / *Can't tell from one hand*. |
| Build | River, pot 100, coral all-in 100, "You win 40% against their range (given)". Final pot 300 (gold), price 100 ÷ 300 ≈ 33.3% (blue). Two branches as a score bar (IDEAS-NEXT 4): WIN 40% × [+200] = +80; LOSE 60% × [−100] = −60. FOLD sits at 0 as the baseline. |
| Compare | Net slams: +80 − 60 = **+20 a call, vs folding**. Pause (interactive): "How many chips does this call make on average?" answer +20 (integer). |
| Prove | 10 calls: 4 × 200 − 6 × 100 = +200. Then 100 calls: [40] × [+200] = 8,000; [60] × [−100] = −6,000; net +2,000. The opening lost call reappears as one grey dot inside the 100, labelled "one sample". |
| Transfer | Faded, counted chance: A♥ T♥ on 8♥ 6♣ 3♥ K♠ (turn), pot 150, all-in 40, call 40 → final 230. 9 outs of 46 (hearts). Blanks: chance 9/46 × 230 − 40 = 45 − 40 = **+5**. Check by every river: 9 × (+190) + 37 × (−40) = 230; ÷ 46 = 5. Price 40 ÷ 230 ≈ 17.4% vs chance ≈ 19.6%. |
| Rule | "EV = chance × final pot − your call. Judge the decision by its average, not by one river." |
| Checks | Guided: the film spot (+20). Practice: Q♥ T♥ on J♥ 8♠ 4♥ 2♣ (turn), all-in 50 into 130 → final 230, 12 outs (9 hearts + 4 nines − 9♥), chance 12/46 ≈ 26.1% vs price ≈ 21.7%, EV 60 − 50 = +10. Fresh: river, pot 200, bet 100, 20% given → final 400, price 25%, EV 80 − 100 = −20. Delayed: by policy. |
| Characters | Mina cameo at Predict. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | A call; chips slide away; "−100" | You called and lost 100. Was it a mistake? |
| 4–9 | Predict | YES / CAN'T TELL, think bar | Predict: does one hand tell you? |
| 9–16 | Spot | Pot 100; coral 100 slams; "40% against their range · given"; ring 300, blue third | Pot 100, all-in 100. You win 40% against their range. |
| 16–24 | Branches | Score bar: 40% × +200 = +80; 60% × −100 = −60; FOLD = 0 | Win: +200, 40% of the time. Lose: −100, 60%. |
| 24–29 | EV | +80 − 60 → +20 slams; pause for the chip answer | On average, +20 a call compared with folding. |
| 29–34 | 10 calls | 10 dots, 4 green; 4 × 200 − 6 × 100 = +200 | Ten calls: about +200. |
| 34–41 | 100 calls | [40] × [+200] = 8,000; [60] × [−100] = −6,000; +2,000 | A hundred calls: about +2,000. |
| 41–45 | One sample | The opening loss is one grey dot among 100; CALL stamp | The lost hand was one of these. The call was right. |
| 45–58 | Transfer | A♥ T♥ · 8♥ 6♣ 3♥ K♠, all-in 40; blanks 9/46 × 230 − 40 = 45 − 40 = +5 | Your turn: 9 outs, final pot 230, call 40. |
| 58–63 | Every river | 46 rivers: 9 × (+190), 37 × (−40), total 230 ÷ 46 = 5 | Every river once: +5 a call. |
| 63–69 | Rule | Glass card: EV = chance × final pot − call; FOLD = 0 | Judge the decision by its average, not one river. |

**Truth sheet:** final 300, price ≈ 33.3%; EV 0.40 × 300 − 100 = +20; branches +80 / −60; 10 calls +200; 100 calls 8,000 − 6,000 = +2,000. Transfer 9 outs (hearts only), final 230, price ≈ 17.4%, chance ≈ 19.6%, EV +5; 9 × 190 − 37 × 40 = 230; ×2 estimate 18% also clears the price. Practice 12 outs, final 230, ≈ 21.7% vs ≈ 26.1%, EV +10. Fresh final 400, 25%, EV −20.

---

## m-variance · Variance and Sample Size

New lesson (no legacy). Prereqs: `m-ev`. Formats: toy, film. Uses the two m-pot-odds spots so the numbers are already familiar.

| Field | Plan |
|---|---|
| Objective (tree) | How far short-run results swing around the average, and how many hands it takes to see skill. |
| One idea | Short-run results swing far around the average; it takes hundreds to thousands of decisions before the average shows. |
| Belief it fixes | "Ten winning sessions prove you are good." |
| Hook | "A winning call, ten times in a row. How often are you still behind?" |
| Predict | Slider: after 10 calls of a +10 play, the chance you're behind (0–100%). |
| Build | Two players, each repeating one spot from m-pot-odds. Blue: the +10 call (win +150 at 30%, lose −50). Coral: the −10 call (the pot-size spot: win +200 at 30%, lose −100). A sample-size dial: 10 → 100 → 1,000 calls. |
| Prove | Exact probabilities (binomial, computed, not simulated): the +10 caller is behind after 10 calls about 38% of the time, after 100 about 11%, after 1,000 under 0.05% (shown as "0.0%"). The −10 caller is ahead after 10 calls about 35%, after 100 about 22%, after 1,000 about 1.1%. Picture: 1,000 players make the losing call 10 times; about 350 of them are ahead. |
| Transfer | Faded: "+10 a call. After 100 calls you expect ?" → +1,000; "the typical swing is about ?" → about ±917 (200 × √0.21 ≈ 92 a call, × √100). "One typical swing either way runs from about +83 to about +1,917." |
| Rule | "A few hands show luck. Thousands show the decision." |
| Toy | The dial plus a "behind / ahead" meter for both players at any N from 10 to 1,000, from the exact formula. Labelled "exact chances, not a forecast". |
| Checks | Comprehension and decisions: "Which tells you more: 10 winning hands or the average of 1,000?"; "After 100 calls of a +10 play, the expected total?" (+1,000); "A player is ahead after 10 calls of a −10 play. Was the play good?" (no: it loses 10 a call on average). Delayed: by policy. |
| Characters | None; optional Mina cameo at the rule. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Blue "+10 a call" chip | A winning call, made 10 times. Still behind? |
| 4–9 | Predict | Slider 0–100%, think bar | Predict: how often are you behind after 10? |
| 9–16 | Two players | Blue +10 call (+150 / −50); coral −10 call (+200 / −100); both 30% given | Two players. One makes a +10 call, one a −10 call. |
| 16–24 | 10 calls | Meters: blue behind 38%; coral ahead 35% | After 10 calls, the good play is behind 38% of the time. |
| 24–30 | 1,000 players | 1,000 coral dots; about 350 light up as "ahead" | Of 1,000 bad callers, about 350 are winning. |
| 30–38 | 100 calls | Dial to 100: blue behind 11%; coral ahead 22% | After 100, the gap opens. |
| 38–45 | 1,000 calls | Dial to 1,000: blue behind 0.0%; coral ahead 1.1% | After 1,000, the decision shows. |
| 45–56 | Transfer | Blanks: expected +1,000; swing ±917 | Expect +1,000 after 100 calls, give or take 917. |
| 56–62 | Rule | Glass card | A few hands show luck. Thousands show the decision. |

**Truth sheet:** +10 call EV 0.30 × 200 − 50 = +10; behind after N means wins < N/4: N = 10 → P(K ≤ 2) ≈ 38%; N = 100 → P(K ≤ 24) ≈ 11% (25 wins is exactly level); N = 1,000 → P(K ≤ 249) < 0.05%. −10 call EV 0.30 × 300 − 100 = −10; ahead means wins > N/3: N = 10 → P(K ≥ 4) ≈ 35% (≈ 350 of 1,000); N = 100 → P(K ≥ 34) ≈ 22%; N = 1,000 → P(K ≥ 334) ≈ 1.1%. K ~ Binomial(N, 0.3), exact sums. SD per call 200 × √0.21 ≈ 92; after 100 ≈ 917; expected +1,000 after 100, +10,000 after 1,000.

---

## m-implied-odds · Implied Odds

Legacy: `t1-implied-odds`, `implied-odds-workspace-v1` v1, **KEEP** (15% / 25% / 10% implied prices verified). New film and fixtures. Prereqs: `m-pot-odds`. Formats: film, worked, decision. Practice: pot-odds vs calling-station. The film below is the worked example, shown as a short diagram sequence.

| Field | Plan |
|---|---|
| Objective (tree) | Chips you can still win later can justify a call the price alone rejects, if stacks allow it. |
| One idea | Chips you can still win after you hit can pay for a call the price alone rejects, but only as many as the stacks allow. |
| Belief it fixes | "Implied odds make every draw a call." |
| Hook | "The price says fold. Can later chips change that?" |
| Predict | Tap: *Always call a draw* / *Only if I can win enough later*. |
| Build | 8♠ 7♠ on K♠ Q♦ 3♠ 2♥ (turn), not all-in: they bet 45 into 100 and have 300 behind. Ring: final pot 190, blue price 45 ÷ 190 ≈ 23.7%; green chance (9 spades of 46) ≈ 19.6%. 19.6% < 23.7%: the price alone says fold. |
| Worked | A dashed gold "future" arc grows on the ring until the price slice shrinks to the chance: needed future winnings = 45 ÷ (9/46) − 190 = 230 − 190 = **40**. Implied price 45 ÷ 230 ≈ 19.6%. "If you win at least 40 more when a spade comes, the call breaks even." |
| Contrast | Same spot, but they have only 25 behind. The dashed arc caps at 25: 45 ÷ 215 ≈ 20.9%, still above 19.6%. Best-case EV ≈ −2.9. FOLD stamp. "You can't win chips they don't have." |
| Prove | Over 46 rivers at the 40-more break-even: EV exactly 0. Shown as the score bar landing on 0 (no simulated runs). |
| Transfer | Faded: J♦ T♦ on Q♣ 8♥ 3♠ 2♣ (turn), a gutshot (4 nines), pot 60, bet 20, 90 behind. Blanks: final 100, price 20%, chance ≈ 8.7%, needed 20 ÷ (4/46) − 100 = 130; 130 > 90 → fold even counting every chip behind. |
| Rule | "Needed later = call ÷ chance − final pot. Call only if that much is really there to win." |
| Checks | Guided: the film spot (needed 40; 300 behind). Practice: the transfer (needed 130; 90 behind). Fresh: 9♣ 8♣ on T♦ 7♥ 2♠ K♥ (turn), pot 90, bet 40, 500 behind: final 170, price ≈ 23.5%, chance 8/46 ≈ 17.4%, needed 60; the ≈ 6% distractor treats their whole stack as already won (40 ÷ 670). Delayed: by policy. Note: whether you will actually be paid 40 or 60 more is a read, taught later; this lesson grades only the arithmetic and the stack cap. |
| Characters | Mina cameo at the contrast. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Blue price 23.7% above green 19.6% | The price says fold. Can later chips change it? |
| 4–9 | Predict | ALWAYS CALL / ONLY IF ENOUGH LATER | Predict first. |
| 9–17 | Spot | Table: 8♠ 7♠ · K♠ Q♦ 3♠ 2♥; coral 45 into 100; "300 behind" | They bet 45 into 100. They have 300 left. |
| 17–24 | Price | Table leaves; ring 190; 45 ÷ 190 ≈ 23.7%; 9 of 46 ≈ 19.6% | 9 spades of 46: 19.6%. The price is 23.7%. |
| 24–34 | Future arc | Dashed gold arc grows to +40; price shrinks to 19.6% | Win 40 more when you hit, and the call breaks even. |
| 34–40 | Formula | 45 ÷ (9/46) − 190 = 230 − 190 = 40 | Needed later: call ÷ chance − final pot. |
| 40–48 | Contrast | "25 behind"; arc caps; 45 ÷ 215 ≈ 20.9%; FOLD stamp | Only 25 behind? You can't win chips they don't have. |
| 48–60 | Transfer | J♦ T♦ · Q♣ 8♥ 3♠ 2♣; blanks fill 100, 20%, 8.7%, 130; "90 behind" | Your turn: a gutshot needs 130 more. Only 90 is there. |
| 60–66 | Rule | Glass card | Count the chips you can still win, and stop at their stack. |

**Truth sheet:** film final 190, price ≈ 23.7%, chance 9/46 ≈ 19.6%, needed 40, implied price 45/230 = 9/46 ≈ 19.6%, EV 0 at +40; contrast 45/215 ≈ 20.9%, best-case EV ≈ −2.9. Transfer final 100, 20%, 4/46 ≈ 8.7%, needed 130 > 90. Fresh final 170, ≈ 23.5%, 8/46 ≈ 17.4%, needed 60, slip 40/670 ≈ 6%. Assumption on screen: if you miss you fold the river and put nothing more in.

---

## m-spr · Stack-to-Pot Ratio

Legacy: `t1-spr`, `spr-workspace-v1` v1, **KEEP** (SPR 1 / 2 / 13 and 1 / 2 / 3 bets verified). New film and fixtures. Prereqs: `m-implied-odds`. Formats: toy, decision. Practice: vs trapper.

| Field | Plan |
|---|---|
| Objective (tree) | Stack ÷ pot tells you how committed you are and how many bets remain. |
| One idea | Effective stack ÷ pot on the flop tells you how many pot-sized bets are left, so how committed a hand already is. |
| Belief it fixes | "Deep stacks always favor the better hand." |
| Hook | "Top pair on the flop. All-in, or careful?" |
| Predict | Tap: *Depends on the cards* / *Depends on the stacks too*. |
| Build | Flop pot 150 (gold). You have 600, they have 900. Only the smaller stack can be won: effective stack 600 (the extra 300 greys out). SPR = 600 ÷ 150 = **4**. Wrong ways struck: 900 ÷ 150 = 6, 1,500 ÷ 150 = 10. |
| Ladder | Pot-sized bets stack up: bet 150 (pot 450, 450 left), bet 450 = all-in. Two bets; final pot 1,350. |
| Contrast | Two ladders side by side: SPR 1 (pot 100, 100 behind) is one bet; the final pot is 3 pots. SPR 13 (pot 100, 1,300 behind) is three bets 100 → 300 → 900; the final pot is 27 pots. "At SPR 1 one good pair is enough to get it in. At SPR 13 the pot can grow 27 times, and one pair is often not enough." Labelled as a rule of thumb. Deep-stack note: deep stacks also give small pairs room: a pocket pair flops a set or better about 11.8% of the time. |
| Prove | No repetition claim; the ladder is exact arithmetic. |
| Transfer | Faded: you 1,000, they 240, pot 120. Blanks: effective 240, SPR 2 (not 1,000 ÷ 120 ≈ 8.3), ladder 120 then the last 120 all-in: two bets, final pot 600. |
| Rule | "SPR = effective stack ÷ pot. Low SPR: commit with good hands. High SPR: big pots need big hands." |
| Toy | Drag stack and pot; the ladder redraws (bets until all-in = smallest k with (3^k − 1)/2 ≥ SPR). |
| Checks | Guided: the film spot (SPR 4; distractors 6 and 10). Practice: the transfer (SPR 2, two bets). Fresh: you 2,000, they 1,800, pot 150: SPR 12, ladder 150 → 450 → 1,200, three bets. Delayed: by policy. |
| Characters | Mina cameo at Predict. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Flop pot 150; two stacks 600 and 900 | Top pair. All-in, or careful? |
| 4–9 | Predict | CARDS / CARDS AND STACKS | Predict first. |
| 9–17 | Effective | 900 stack greys 300; "effective 600" | You can only win what the smaller stack has: 600. |
| 17–23 | SPR | 600 ÷ 150 = 4 slams; 6 and 10 struck | Stack to pot: 600 ÷ 150 = 4. |
| 23–32 | Ladder | Bet 150 → pot 450; bet 450 all-in → 1,350 | Two pot-sized bets and you're all-in. |
| 32–44 | Contrast | SPR 1 ladder (1 bet, 3 pots) vs SPR 13 (100 → 300 → 900, 27 pots) | Low SPR: one bet. High SPR: three, and the pot grows 27 times. |
| 44–48 | Note | Pocket pair chip: set or better ≈ 11.8% | Deep stacks give small pairs room to win big. |
| 48–60 | Transfer | You 1,000 · them 240 · pot 120; blanks 240, 2, 120 + 120, 600 | Your turn: which stack counts? |
| 60–66 | Rule | Glass card, both ladders | SPR = effective stack ÷ pot. It tells you how many bets are left. |

**Truth sheet:** effective 600, SPR 4 (slips 6, 10), ladder 150, 450, final pot 1,350, two bets; SPR 1 → 1 bet, 3 pots; SPR 13 → 100, 300, 900, 3 bets, 27 pots; set or better on the flop 1 − C(48,3)/C(50,3) ≈ 11.8%. Transfer effective 240, SPR 2 (slip ≈ 8.3), ladder 120, 120, final 600. Fresh SPR 12, ladder 150, 450, 1,200, three bets.

---

## Tree problems found while planning (applied to the tree 2026-10-06 unless noted)

1. **`m-spr` prereq.** SPR uses no EV; it leans on stacks-behind from implied odds. Applied: `m-spr` ← `m-implied-odds` instead of `m-ev`.
2. **`m-implied-odds` formats.** The worked example plays best as a short diagram film like the others. Applied: `film` added.
3. **`m-variance` before `y-tilt`.** Tilt ("results steering decisions") reuses the variance numbers. Applied: `y-tilt` ← `m-variance` as well as `m-ev`.
4. **Shared legacy concept.** `m-outs` and `m-rule-2-4` both map to `t1-outs-rule-24`; mastery pools them unless main splits the concept (as the audit notes).
5. **Dirty outs** were unexercised anywhere (audit §6). Applied: the `m-outs` objective now carries them (see the note in `m-outs`); no new node. The film above still states the "a completed draw wins" rule for its own spots.
