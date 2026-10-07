# Track 5 lesson plans: Postflop

Seven v1 nodes from `src/learn/v1/academyTree.mjs`. Format: `../LESSON-PLAN-FORMAT.md`. Every number and card below is asserted by `check-postflop-to-formats.mjs` in this folder (run it with plain Node; it must pass before media is made).

**Shared fixtures.** Two illustrative ranges carry the whole track so a learner meets the same "people" lesson after lesson. They are rules of thumb written for teaching, labelled on screen as *illustration*, never as solver output:

- **Raiser** (a button raise), 250 combos: every pair `22–AA` (13 classes), suited aces `A2s–AKs` (12), `KQs KJs KTs QJs QTs JTs T9s 98s 87s 76s` (10), offsuit `AKo AQo AJo ATo KQo KJo QJo` (7).
- **Caller** (a big-blind call that has re-raised `AA–JJ`, `AK`, `AQ`, `KQs`), 186 combos: pairs `22–TT` (9), suited aces `A2s–AJs` (10), `KJs KTs QJs QTs JTs T9s 98s 87s 76s 65s 54s` (11), offsuit `KJo QJo JTo ATo` (4).
- Strength tiers, used with the same names everywhere: **two pair or better** (using a hole card), **top pair or overpair**, **weaker pair**, **draw** (no pair, four to a straight or flush), **nothing**. Combos are counted after removing every card the learner can see.

**Colour.** The house colours keep their meanings (green your chance, blue your call or price, coral their bet, gold the final pot, white chips already in). Range tiles need one more meaning: *note (accepted as a plan note, not a tree field)* — a range is drawn in BitBlur violet `#5d5afd`, brighter for stronger tiers, and never in green, blue, coral or gold. Review before production; the Rules track's violet button and action arrow use the same hue, so the two must stay visually distinct.

---

## `f-ranges` — Ranges, Not Hands

Track 5, Postflop. Prerequisites: `p-open-raise`, `m-equity`. Legacy: `t3-ranges` / `ranges-workspace-v1` (KEEP; its spots stay, this plan adds the toy and film beats around them). Practice: hand-reading vs `balanced`.

| Field | Plan |
|---|---|
| One idea | Put opponents on every hand their actions allow, weighted, not on one guess. |
| Belief it fixes | "You can read one exact hand from a bet." |
| Hook | "He called your raise. Which hand does he have?" |
| Predict | Tap one hand from six face-down pairs of cards (`77`, `AJs`, `KQo`, `98s`, `A5s`, `QJo`). No grade; the tap returns at the reveal. |
| Build | Toy: the 13 × 13 hand grid fills in violet as the caller's range, class by class. Each tile shows its combos (pairs 6, suited 4, offsuit 12; all 1,326 starting combos = 13 × 6 + 78 × 4 + 78 × 12). Your A♠ Q♠ greys out the combos it blocks: 186 become 168. |
| Prove | Flop T♦ 7♣ 3♥ removes more combos: 145 remain. The range sorts into a stacked bar: 9 two pair or better, 29 top pair or overpair, 46 weaker pair, 12 draws, 49 nothing. The learner's single guess lights up: if it was `77`, it is 3 of 145 combos (2.1%). "Pair or better" is 84 of 145 (57.9%): a share, not a hand. |
| Transfer | Same range, flop J♣ 9♦ 2♥. The bar is blank; the learner drags the split first, then it fills: 146 live, 6 / 35 / 52 / 11 / 42, pair or better 93 (63.7%). |
| Rule | "Put him on a range, then ask what share of it beats you." |
| Checks | Keep `rng1-guided`, `rng1-practice-*`, `rng1-fresh-*` (server-graded). Add one toy check (not evidence): "Which tier is biggest on T♦ 7♣ 3♥?" Delayed: a fresh-flop range split scheduled by policy. |
| Formats | toy + decision |
| Characters | Vale (coach) reads the grid in the thinking beat. Rival: the `balanced` Gauntlet bot in practice. |
| Cinematic plates | None. |
| Sound | Silent-complete captions; narration later. |

**Lesson sequence.** Hook card → predict tap → grid builds (toy, learner can tap tiles) → flop arrives on the real table, then the table leaves for the bar → reveal of the single guess → transfer bar → rule card → spots.

**Truth sheet.** Range sizes 186 and 168 (after A♠ Q♠), 145 on T♦ 7♣ 3♥ and 146 on J♣ 9♦ 2♥, with every tier count, are enumerated by the check script with full card removal and cross-checked by category against `src/eval/pokerEvaluator.js`. The range is labelled an illustration on screen.

---

## `f-board-texture` — Board Texture and Ranges

Track 5, Postflop. Prerequisites: `f-ranges`, `b-texture-read`. Legacy: `t3-board-texture` / `board-texture-workspace-v1` (KEEP). Practice: postflop c-bet vs `tag`.

| Field | Plan |
|---|---|
| One idea | Which player's range the flop helps more, and why that sets the plan. |
| Belief it fixes | "The flop helps whoever has the better hand." |
| Hook | "Same two players. Two flops. Whose flop is it?" |
| Predict | Two flops side by side, A♣ K♦ 4♠ and 9♦ 7♦ 6♣. For each, tap *Raiser* or *Caller*. |
| Build | Two violet range bars, raiser above, caller below, built on the board only (no hero cards). A♣ K♦ 4♠: raiser 77 of 204 combos with top pair or better (37.7%); caller 41 of 163 (25.2%). The re-raised hands (`AK`, `AQ`, `AA–JJ`) light up as the reason. |
| Prove | 9♦ 7♦ 6♣: two pair or better is 11 combos for each player, but that is 4.7% of the raiser's 233 and 6.5% of the caller's 168. Draws: 45 for the raiser (19.3%), 58 for the caller (34.5%). Strong hands plus draws: 56 (24.0%) against 69 (41.1%). The caller's suited connectors and small pairs are where this flop lives. |
| Transfer | Paired flop Q♣ Q♦ 5♠ (no existing lesson uses a paired board). The learner predicts, then: raiser 42 of 215 with top pair or better (19.5%), caller 13 of 170 (7.6%). |
| Rule | "Before your hand, ask whose range the flop hits." |
| Checks | Keep `bt1-*` (server-graded). Add one fresh range-advantage read on a paired flop. Delayed check by policy. |
| Formats | toy + decision |
| Characters | Vale. Rival `tag` in practice. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → two-flop predict → bar race on the high flop → bar race on the connected flop (table leaves, bars only) → paired-flop transfer → rule → spots.

**Truth sheet.** All six bars are enumerated by the check script from the two shared ranges with board removal. Shares are of live combos on that board.

---

## `f-cbet` — Continuation Betting

Track 5, Postflop. Prerequisites: `f-board-texture`. Legacy: `t3-cbetting` / `cbetting-workspace-v1` (REVISE). Practice: postflop c-bet vs `tag`.

| Field | Plan |
|---|---|
| One idea | Bet the flop after raising preflop when the board favors your range. |
| Belief it fixes | "Always c-bet because you raised." |
| Hook | "You raised. He checked. Do you have to bet?" |
| Predict | *Bet* / *Check* on K♦ 7♣ 2♠ with A♣ Q♦, pot 60, before any explanation. |
| Build | The two range bars from `f-board-texture` on K♦ 7♣ 2♠: raiser 54 of 224 combos with top pair or better (24.1%), caller 21 of 171 (12.3%). Then the board read, **reworded for the audit**: "No straight draw and no flush draw is possible on this flop" (three suits; no two of K, 7, 2 fit inside five ranks). The c-bet appears as a coral chip of 20 into the gold 60. |
| Prove | Contrast (mistake beside fix): the same raise on 9♦ 7♦ 6♣, where the caller's strong hands and draws are 41.1% of his range against 24.0% of yours. The auto-c-bet (left) is stamped *not earned*; the check (right) *earned*. Price beat: a third-pot c-bet asks a bluff to work 1 time in 4 (20 ÷ (60 + 20) = 25%) and offers him a price of 20 ÷ 100 = 20%. |
| Transfer | **New fresh spot (audit: the old one repeated `f-bet-sizing`'s)**: A♥ T♦ on the paired flop 8♠ 8♦ 3♣, pot 90, c-bet 30. Raiser 46 of 235 with top pair or better (19.6%), caller 22 of 171 (12.9%). The learner reads the bars, then decides; the same 25% and 20% hold because the size is again a third. |
| Rule | "C-bet when the flop favors your range and the board lets you; raising first is not the reason." |
| Checks | Guided `cb1-guided` (explanation reworded: "dry: no flush draw and no straight draw is possible"); practice `cb1-practice-*` kept; fresh replaced by the 8♠ 8♦ 3♣ spot above (new content version; main approves, server keys written by main). Delayed check by policy. |
| Formats | contrast + decision |
| Characters | Vale. Rival `tag`. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → bars on K♦ 7♣ 2♠ → board read caption → contrast split-screen on 9♦ 7♦ 6♣ → price beat → paired-flop transfer → rule → spots.

**Truth sheet.** "No straight draw possible" is computed by the strict definition (some two-card hand holds four to a straight now) and "no flush draw possible" by suit count; both false on K♦ 7♣ 2♠ and both true on 9♦ 7♦ 6♣. A third of 60 is 20 and of 90 is 30; bluff break-even 1/4 and caller's price 1/5 in both. Range bars enumerated.

---

## `f-bet-sizing` — Bet Sizing

Track 5, Postflop. Prerequisites: `f-cbet`, `m-spr`. Legacy: `t3-bet-sizing` / `bet-sizing-workspace-v1` (KEEP). Practice: postflop c-bet vs `calling-station`.

| Field | Plan |
|---|---|
| One idea | Size bets for a purpose: what you want called, what you want folded, and the price you give. |
| Belief it fixes | "Bigger bets always win more." |
| Hook | "Same hand, two sizes. Which one does the job?" |
| Predict | K♠ K♦ on J♥ 8♥ 3♣ 2♠, pot 120. Tap *40* or *90* to stop a flush draw from calling cheaply. |
| Build | Toy: a size slider on the gold pot. As the coral bet grows, two readouts move: his price (blue slice of the final pot) and the fold rate a bluff of that size needs. Table rows snap at 1/4 pot (price 1/6, bluff needs 1/5), 1/3 (1/5, 1/4), 1/2 (1/4, 1/3), 2/3 (2/7, 2/5), 3/4 (3/10, 3/7), pot (1/3, 1/2) and 2 × pot (2/5, 2/3). |
| Prove | The draw's side: 9 hearts are left of the 46 cards he cannot see, 19.6% with one card to come (rule of 2: about 18%). Against 40 his price is 40 ÷ 200 = 20%: he loses only 0.87 a call, close to a fair price. Against 90 the price is 90 ÷ 300 = 30%: he loses 31.3 a call. Bigger is right here because of what it does to his price, not because bigger wins more. |
| Transfer | Faded example: a river where you want weaker one-pair hands to call (illustration). The learner fills price and bluff-need for a third-pot and a three-quarter-pot bet from the slider table before the reveal, then picks the size that keeps the callers. |
| Rule | "Pick the size from the job: charge draws, invite worse hands, or make folds cheap to win." |
| Checks | Keep `bs1-*` (server-graded); the fresh spot stays as is because `f-cbet` now owns a different structure. Delayed check by policy. |
| Formats | toy + decision |
| Characters | Vale. Rival `calling-station`. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → slider toy (learner drags) → draw-price comparison → faded transfer → rule → spots.

**Truth sheet.** Price = bet ÷ (pot + 2·bet) and bluff break-even = bet ÷ (pot + bet) for all seven sizes, exact. Hearts: 13 − 2 on the board − 2 in his hand = 9; unseen to him 46; 9/46; EVs −20/23 and −720/23 chips, shown as 0.87 and 31.3. Price-only view, labelled (no implied odds here).

---

## `f-value-betting` — Value Betting

Track 5, Postflop. Prerequisites: `f-bet-sizing`, `b-what-beats-you`. New lesson.

| Field | Plan |
|---|---|
| One idea | Bet when worse hands will call; size for the hands that pay. |
| Belief it fixes | "Always check strong hands to trap." (Narrowed so it does not clash with `h-exploits`, where trapping the LAG is right.) |
| Hook | "Top pair on the river. Check and hope, or bet?" |
| Predict | A♥ J♦ on J♣ 9♠ 5♦ 3♥ 2♣, pot 200, he checks. *Check* / *Bet 100*. |
| Build | Worked: the caller range on this river (128 live combos). Rule of thumb, labelled: he calls a 100 bet with a pair of nines or better. The calling hands step forward: 54 combos. They split into a green stack (you beat them: 38), a white tie (1, the other ace-jack) and a coral stack (they beat you: 15, the sets of deuces, threes, fives and nines and the wheel `A4s`). |
| Prove | The tally over the 54 calls: 38 × +100 and 15 × −100 = +2,300, about 42.6 a call. Contrast: the check line wins nothing more from the 38 worse hands (3,800 left behind) to save the 1,500. Worse callers are 70.4% of the calls: more than half, so the bet is value. |
| Transfer | Same hand, one change given: he now calls only with two pair or better. The learner sorts the callers first (all of them beat you), then sees the bet lose. |
| Rule | "Bet when more than half of the hands that call are worse than yours." |
| Checks | New guided / practice / fresh spots (server keys by main): this river, a thinner river, and a river where checking is right. Delayed check by policy. |
| Formats | worked + decision |
| Characters | Vale. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → callers step forward (table) → table leaves; green / white / coral stacks → tally → contrast with the check → transfer → rule → spots.

**Truth sheet.** 128 live combos, 54 callers, 38 worse / 1 tie / 15 better are enumerated with full kicker comparison by the check script's best-five scorer; the 15 are listed in the script. Raises are ignored, and that simplification is captioned.

---

## `f-pot-control` — Pot Control and Free Cards

Track 5, Postflop. Prerequisites: `f-value-betting`, `p-position-value`. New lesson.

| Field | Plan |
|---|---|
| One idea | Keep pots small with medium hands and take free cards in position. |
| Belief it fixes | "Checking is weak." |
| Hook | "A pair of nines. How big a pot do you want?" |
| Predict | 9♠ 9♥ in position on K♣ 6♦ 3♠, pot 100 on the flop, the turn will be 2♥. Tap *bet all three streets* / *bet two of them*. |
| Build | Pot geometry toy: three half-pot bets take the gold pot from 100 to 800 with your 50 + 100 + 200 = 350 in it (the pot doubles each street, 8 times in all). Bet, check the turn, bet: 50 + 100 = 150 in, pot 400 (4 times). |
| Prove | Contrast: the same nines on the three-bet line meet only the hands that keep calling, the part of his range that beats a medium pair; on the two-bet line most of his weaker pairs still pay once. The check behind on the turn is a free card: the river costs 0, and 2 nines are left of 46 unseen (4.3%) for a set. |
| Transfer | Out of position with the same hand: the learner works out that a check now gives him the choice, so the free card is his, not yours. |
| Rule | "Medium hand, small pot: two streets of value, and take the free card when you are last." |
| Checks | New spots (server keys by main): check-behind turn with a medium pair; a value hand that must not pot-control; out-of-position version. Delayed check by policy. |
| Formats | contrast + decision |
| Characters | Vale. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → pot geometry toy → contrast lines → free-card beat → transfer → rule → spots.

**Truth sheet.** 100 × 2 × 2 × 2 = 800 and 50 + 100 + 200 = 350; 100 × 2 × 2 = 400 and 50 + 100 = 150. 9♠ 9♥ is a weaker pair on K♣ 6♦ 3♠ 2♥ (tier check); 2 nines unseen of 46 (2/46).

---

## `f-playing-draws` — Playing Draws

Track 5, Postflop. Prerequisites: `f-cbet`, `m-implied-odds`. New lesson.

| Field | Plan |
|---|---|
| One idea | Choose between calling, raising and folding a draw from price, position and stacks. |
| Belief it fixes | "Draws should always be played passively." |
| Hook | "A flush draw faces a bet. Call, raise or fold?" |
| Predict | 6♣ 5♣ on K♣ 9♣ 2♦; he bets 50 into 100. Three buttons. |
| Build | Worked: 9 outs of 47 unseen. The green chance with one card: 19.1%. The blue price: 50 ÷ 200 = 25%. On price alone the draw is short. The implied-odds bar shows what is missing: about 61.1 more chips must come in later when you hit, so at least 62. |
| Prove | Three stacks, three answers: 40 behind (the most you could ever win later is short of 62: fold on this price), 400 behind (room for the extra chips: call), and his 50 all-in (no more betting, both cards come: 378 of 1,081 two-card runouts make the flush, 35.0% > 25%: call, worth about 19.9 chips a call on average). Rule of 4 check: 36%. |
| Transfer | Faded: a 9-out draw facing 60 into 120 with 300 behind. The learner fills price (25%) and the chips needed later (at least 74) before the reveal. The raise branch appears greyed with "Next track: fold equity": a preview only, which `x-fold-equity` teaches (the tree keeps this node in Postflop). |
| Rule | "Price first; then ask what the stacks let you win later, and whether a raise wins it now." |
| Checks | New spots (server keys by main): call with deep stacks, fold short, call the all-in. Delayed check by policy. |
| Formats | worked + decision |
| Characters | Vale. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → outs on the real table, then the table leaves for the price and chance rings → implied-odds bar → three stacks → faded transfer → rule → spots.

**Truth sheet.** Outs enumerated: 9 of the 47 unseen turn cards make the flush; 378 of 1,081 turn-and-river pairs make it (703 miss both). Implied chips needed: 50 ÷ (9/47) − 200 = 550/9 ≈ 61.1. All-in EV: 378/1,081 × 200 − 50 ≈ 19.9. The flush is assumed to win, as in the rule of 2 and 4, and that is captioned. Transfer: 60 ÷ 240 = 25%; chips needed later 60 ÷ (9/47) − 240 ≈ 73.3, so at least 74, and 300 behind leaves room.
