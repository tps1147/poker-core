# Lesson plans: Track 4, Preflop (draft 0, 2026-10-06)

Five nodes from `src/learn/v1/academyTree.mjs` (`preflop` track), in tree order. Format: `../LESSON-PLAN-FORMAT.md`. Film pattern: the accepted M1 v1 PotOdds film (predict → build → price → compare → prove → stamp → faded transfer → rule).

Every number below is computed and asserted by `check-math-preflop.mjs` in this folder, including the size of each rule-of-thumb chart. Run: `node docs/v1-feature/academy/plans/check-math-preflop.mjs`.

## Shared rules for this track

- **Table:** six-handed, blinds 5 / 10, everyone starts with 1,000 (100 big blinds), no antes, no rake, opens to 25. These match the existing preflop lessons.
- **Seat names:** UTG, MP, CO, BTN, SB, BB. The existing lessons and the native ring say **MP** ("middle position") for the seat the brief calls HJ. These plans keep MP for consistency and add "also called the hijack" once, in `p-position-value`. See tree note 1.
- **Ranges are rules of thumb.** Every chart is labelled "a common rule of thumb for six-handed play, not solver output". The charts are written out below so the check script can count them; main may swap them, and the script recounts.
- **No hidden cards are read.** Opponents' hands stay face down. A range is something the lesson states; where hands are counted (combos, blockers), it is counting the deck, not guessing a holding.
- **Colour:** blue = your call or price, coral = their raise, gold = the pot after you call, white = chips already in (the blinds), green = hands in the range or your chance. Seats keep their ring positions on the real Flop52 table.
- **Results never grade decisions.** Every hand stops once you act; no flop is dealt in a preflop check spot, as in the existing lessons.
- **Cinematic plates:** none. The real Flop52 table (BaseTable), real cards and the code-drawn 13 × 13 hand grid carry every beat. Optional coach cameo stills from existing cast art.
- **Coach:** Reina (positions, starting hands, opening, blind defense), Knox (3-betting), matching the existing lessons.
- **Sound:** silent-complete captions first; narration later.
- **Checks** are server-graded decisions main authors from these fixtures; no server key was read or copied.

### Rule-of-thumb charts (asserted sizes)

| Chart | Hands | Combos | Share of 1,326 |
|---|---|---|---|
| UTG open | 66+, A9s+, A5s, KTs+, QTs+, JTs, T9s, 98s, AJo+, KQo | 158 | 12% |
| MP open | 55+, A8s+, A5s–A4s, K9s+, Q9s+, J9s+, T9s, 98s, 87s, ATo+, KJo+ | 212 | 16% |
| CO open | 33+, A2s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 87s, 76s, 65s, A9o+, KTo+, QTo+, JTo | 320 | 24% |
| BTN open | 22+, A2s+, K2s+, Q5s+, J7s+, T7s+, 96s+, 86s+, 75s+, 65s, 54s, A2o+, K8o+, Q9o+, J9o+, T9o | 538 | 41% |
| BB defend vs a BTN open to 25 | 22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 95s+, 85s+, 74s+, 63s+, 53s+, 43s, A2o+, K7o+, Q8o+, J8o+, T8o+, 98o, 87o | 650 | 49% |
| 3-bet (this lesson) | value QQ+, AK; pressure A5s, A4s | 42 | 3.2% |

Each opening chart contains the one before it (asserted). They agree with the public explanations of the existing RFI lesson: A5s opens on the button, JTo folds under the gun, KTo opens in the cutoff.

---

## p-position-value · Why Acting Last Wins

Legacy: `t0-positions`, `positions-workspace-v1` v2, **KEEP** (seat counts and the 5 / 10 blinds verified). New film; the existing lesson stays. Prereqs: `r-streets`, `m-chance-as-share`. Formats: table, film.

| Field | Plan |
|---|---|
| Objective (tree) | Acting last lets you see what others do before you decide. |
| One idea | Acting last lets you see what the others do before you decide, on every street after the flop. |
| Belief it fixes | "Position only matters preflop." |
| Hook | "Same cards, same flop. Why is one seat easier?" |
| Predict | Tap: *Only the preflop seat matters* / *Acting last helps on every street*. |
| Build | Real table, six-handed. Preflop order lights UTG → MP → CO → BTN → SB → BB, with "players behind you" counts 5 · 4 · 3 · 2 · 1 · 0. The button opens to 25, the big blind calls: pot 55. Then the flop order relights: SB → BB → UTG → MP → CO → BTN. The big blind acted last before the flop and now acts **first** on every later street. |
| Compare | Two replays of one flop, your A♥ J♣ on T♦ 7♠ 2♥. Replay 1, you are the BB: you must act first, blind to what they'll do. Replay 2, you are the BTN: the BB checks, and you choose knowing that. No result is shown in either replay; only who knew more when they chose. |
| Prove | Counting, not results: heads-up BTN vs BB, the button acts last on 3 of the 4 rounds (flop, turn, river). Over 100 hands that reach the flop, that is 300 decisions made after seeing the other player act. Tally [100] × [3] = 300. |
| Transfer | Faded: "CO vs BB after the flop. Who acts last?" The learner taps first; then the order lights: CO. |
| Rule | "After the flop, the seat closest to the button's left acts first and the button acts last. Acting last is information." Seat note: MP is also called the hijack. |
| Checks | Guided: BTN vs BB, who acts last on the turn? (BTN). Practice: MP vs SB (MP). Fresh: UTG vs BTN (BTN); plus "How many players act after you under the gun preflop?" (5). Delayed: by policy. |
| Characters | Reina cameo at Predict. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Two seats glow, BTN and BB | Same cards, same flop. Why is one seat easier? |
| 4–9 | Predict | PREFLOP ONLY / EVERY STREET | Predict first. |
| 9–18 | Preflop order | Order lights UTG → BB; counts 5 4 3 2 1 0 | Before the flop, the big blind acts last. |
| 18–24 | Open and call | BTN raises to 25 (coral); BB calls 15 (blue); pot 55 (gold) | The button raises to 25. The big blind calls. |
| 24–31 | Flop order | Flop T♦ 7♠ 2♥; order relights SB → BTN; BB badge flips to FIRST | After the flop, the big blind acts first. The button acts last. |
| 31–40 | Replay as BB | Your A♥ J♣ in the BB; think bar, nothing known | In the big blind, you choose first, knowing nothing. |
| 40–48 | Replay as BTN | Same cards on the button; BB checks; then you choose | On the button, you see their check, then choose. |
| 48–54 | Prove | [100] × [3] = 300 count-up | 100 flops: 300 choices made after seeing theirs. |
| 54–62 | Transfer | CO vs BB; tap, then CO lights | Your turn: cutoff against big blind. Who acts last? |
| 62–68 | Rule | Glass card with the postflop order ring | Position matters on every street. Acting last is information. |

**Truth sheet:** players behind preflop UTG 5, MP 4, CO 3, BTN 2, SB 1, BB 0. Postflop order SB, BB, UTG, MP, CO, BTN. Button acts last on 3 of 4 rounds vs the big blind; 100 × 3 = 300. Blinds 5 + 10 = 15; open to 25, BB owes 15, pot after the call 55. Last to act: BTN vs BB → BTN; CO vs BB → CO; MP vs SB → MP; UTG vs BTN → BTN. Cards A♥ J♣ T♦ 7♠ 2♥ distinct.

---

## p-starting-hands · Starting Hands

Legacy: `t2-starting-hands`, `starting-hands-workspace-v1` v1, **KEEP** (pots 15 → 40 verified; classification labelled as a rule of thumb). New film and fixtures. Prereqs: `p-position-value`, `m-chance-as-share`. Formats: toy, decision. Practice: vs calling-station.

| Field | Plan |
|---|---|
| Objective (tree) | Play hands that win big pots and avoid hands that get dominated. |
| One idea | Play hands that can win big pots (strong pairs, strong kickers, connected suited cards) and avoid hands that get dominated. |
| Belief it fixes | "Any two suited cards are worth playing." |
| Hook | "Suited cards. How often do they make a flush?" |
| Predict | Slider 0–50%: chance two suited cards make a flush by the river. |
| Build | The 13 × 13 grid: 169 hand types (13 pairs on the diagonal, 78 suited above, 78 offsuit below), and 1,326 two-card combinations (a pair 6, suited 4, offsuit 12). Suited hands light: 23.5% of all combinations. |
| Compare | The flush meter: about 6.4% by the river, about 1 time in 16, the same for 7♠ 2♠ as for A♠ K♠. Beside it, a pocket pair flops a set or better about 11.8%. "Suited is a small bonus, not a reason." |
| Contrast | K♠ 7♠ in the cutoff, UTG raises to 25 (pot 40, you owe 25). With your two cards out of the deck, 72 of the 1,225 other two-card hands hold a king with a better kicker (5.9%). Inside the UTG rule-of-thumb chart it is 30 of the 142 combinations left: about 21.1%. When K7 meets them, it wins small pots and loses big ones. Same hand, folded to you on the button: inside the BTN chart, an open. |
| Prove | No outcome sample: the counts are exact. A "big pot" bar shows which grid cells make strong hands (top pairs with good kickers, sets, nut flushes); labelled as a rule of thumb. |
| Transfer | Faded: 9♥ 8♥ on the button, folded to you. Learner decides first; then the BTN chart lights the cell: open (connected and suited, with position). |
| Rule | "Play hands that make big hands, from seats that let you. Suited is a bonus, not a ticket." |
| Toy | The 13 × 13 grid with a seat selector; tap a cell to see its combos, whether it is in that seat's chart and, for Kx/Ax, how many chart combos out-kick it. |
| Checks | Guided: K♠ 7♠ in the CO vs a UTG raise to 25 (fold by the rule of thumb). Practice: 9♥ 8♥ on the BTN, folded to you (raise to 25). Fresh: Q♣ 4♣ under the gun (fold; it is outside every opening chart, even the button's). Delayed: by policy. |
| Characters | Reina cameo at the contrast. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | 7♠ 2♠ and A♠ K♠ side by side | Suited cards. How often do they make a flush? |
| 4–9 | Predict | Slider 0–50% | Predict first. |
| 9–18 | Grid | 13 × 13 grid builds; 169 types; 1,326 combos; pair 6 · suited 4 · offsuit 12 | 169 kinds of starting hand. 1,326 ways to be dealt one. |
| 18–25 | Flush meter | Meter fills to 6.4%: "1 in 16"; same for both hands | Two suited cards make a flush about 1 time in 16. |
| 25–30 | Set chip | Pocket pair: 11.8% set or better on the flop | A pair flops a set about 12% of the time. |
| 30–40 | Contrast | K♠ 7♠ in the CO; UTG raises to 25; 72 of 1,225; in the UTG chart 30 of 142 ≈ 21.1% | Against a strong opener, a king with a better kicker is common. |
| 40–45 | Stamp | FOLD stamp on K7 vs UTG; then the same hand on the BTN: OPEN | Same hand. On the button, folded to you, it's an open. |
| 45–56 | Transfer | 9♥ 8♥ on the BTN; tap first; BTN chart cell lights | Your turn: nine-eight suited on the button. |
| 56–63 | Rule | Glass card with the grid | Play hands that make big hands, from seats that let you. |

**Truth sheet:** C(52,2) = 1,326; 13 + 78 + 78 = 169; combos 6 / 4 / 12; suited share 312/1,326 ≈ 23.5%; flush in your suit by the river [C(11,3)·C(39,2) + C(11,4)·39 + C(11,5)] / C(50,5) ≈ 6.4% ≈ 1 in 16; set or better on the flop 1 − C(48,3)/C(50,3) ≈ 11.8%. K♠ 7♠ dead: C(50,2) = 1,225 remaining; kings with a better kicker 72 (5.9%); in the UTG chart AK 12 + KQ 12 + KJs 3 + KTs 3 = 30 of 142 ≈ 21.1%. K7s outside UTG, inside BTN; 98s inside BTN; Q4s outside UTG and BTN. Pot after a UTG raise to 25: 40.

---

## p-open-raise · Opening by Position

Legacy: `t2-rfi-by-position`, `rfi-position-workspace-v1` v1, **KEEP** (players behind 2 / 5 / 3 verified). New film and fixtures. Prereqs: `p-starting-hands`. Formats: toy, decision. Practice: vs nit.

| Field | Plan |
|---|---|
| Objective (tree) | Open tighter early and wider late, because fewer players are left to act. |
| One idea | Open tighter early and wider late, because fewer players are left to act behind you; open with a raise, not a limp. |
| Belief it fixes | "Limping in is a cheap way to see flops." |
| Hook | "Ace-eight. Open it, or fold it?" |
| Predict | Tap: *Always open an ace* / *Depends on the seat*. |
| Build | A♠ 8♦ moves seat by seat around the real table: UTG (5 behind), MP (4), CO (3), BTN (2). At each seat the chart grid behind it widens: 12% → 16% → 24% → 41% of hands. A♠ 8♦ lights only on the button. |
| Compare | Why: the chance that someone behind holds a premium (JJ+ or AK, 40 combos, about 3.0% of hands). With 5 behind it is about 14%; with 2 behind about 6%. Stated approximation: treats the other hands as independent and ignores your own cards. |
| Contrast | Limp vs raise from the button. Limp 10: pot 25, the big blind owes nothing and checks for free, and the blinds see a flop cheaply. Raise to 25: pot 40, the big blind owes 15 at a price of about 27.3%, and you can win the 15 right away. "A limp invites everyone in. A raise makes them pay." Rule of thumb, labelled. |
| Prove | The charts' sizes are exact counts (asserted); no outcome sample. |
| Transfer | Faded: 7♥ 6♥ in MP, folded to you. Learner decides first; MP chart: not in it (fold). Same hand in the CO: in it (open). |
| Rule | "Count the players behind you. Fewer behind, wider range. Come in with a raise." |
| Toy | Seat dial: drag the button marker; the chart widens and the "premium behind" meter falls. Tap a cell to see if it opens from this seat. |
| Checks | Guided: A♠ 8♦ on the BTN, folded to you (raise to 25). Practice: 7♥ 6♥ in MP (fold), then "How many players act after you?" (4). Fresh: Q♠ T♠ under the gun (raise to 25; QTs is in the UTG chart). Delayed: by policy. |
| Characters | Reina cameo at Predict. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | A♠ 8♦ glowing | Ace-eight. Open it, or fold it? |
| 4–9 | Predict | ALWAYS AN ACE / DEPENDS ON THE SEAT | Predict first. |
| 9–20 | Seat walk | Hand moves UTG → BTN; counts 5 4 3 2; chart 12% → 41%; A8o lights on the BTN only | The later your seat, the more hands you can open. |
| 20–30 | Premium behind | Meter: 40 premium combos ≈ 3.0%; 5 behind ≈ 14%; 2 behind ≈ 6% | More players behind, more chance one of them is strong. |
| 30–38 | Limp | Limp 10: pot 25; BB "owes 0" | Limp, and the big blind sees a flop for free. |
| 38–45 | Raise | Raise to 25: pot 40; BB owes 15 ≈ 27.3%; RAISE stamp | Raise, and they pay to come in. You can win the 15 now. |
| 45–56 | Transfer | 7♥ 6♥ in MP; tap first; MP chart: out; slide to CO: in | Your turn: seven-six suited in middle position. |
| 56–63 | Rule | Glass card with the four charts | Fewer players behind, wider range. Come in raising. |

**Truth sheet:** chart combos UTG 158 (12%), MP 212 (16%), CO 320 (24%), BTN 538 (41%); each contains the previous. Premium JJ+ AK = 24 + 16 = 40 combos ≈ 3.0%; at least one among 5 others ≈ 14%, among 2 ≈ 6% (independence approximation, stated). Limp: pot 25, BB owes 0. Raise to 25: pot 40, BB owes 15, price 15/55 ≈ 27.3%. A8o out of UTG, MP and CO, in BTN; 76s out of MP, in CO; QTs in UTG. Existing-lesson agreement: A5s BTN in, JTo UTG out, KTo CO in.

---

## p-blind-defense · Defending the Blinds

Legacy: `t2-blind-defense`, `blind-defense-workspace-v1` v1, **KEEP** (15/55, 20/65, 10/45 verified). New film and fixtures. Prereqs: `p-open-raise`, `m-pot-odds`. Formats: film, worked, decision. Practice: vs LAG. The worked example is shown as a short film like the others.

| Field | Plan |
|---|---|
| Objective (tree) | The chips you already posted improve your price; defend enough, not everything. |
| One idea | The blind already in the pot improves your price, so you defend more than you would cold; but defend enough, not everything. |
| Belief it fixes | "The blind is your money, so always protect it." |
| Hook | "You posted 10. Does that mean you have to call?" |
| Predict | Tap: *Yes, protect it* / *Only with the right hands*. |
| Build | Real table: you are the BB with Q♣ 9♣. The button raises to 25; everyone else folds. White chips: SB 5, your 10. Coral: their 25. Pot before you act 40. You owe 15. Gold final pot 55. Blue slice 15 ÷ 55 ≈ 27.3%. |
| Contrast | The same 25 call from a seat with nothing posted (the button facing a CO raise to 25, blinds in): 25 ÷ 65 ≈ 38.5%. "The 10 isn't yours anymore. It just makes calling cheaper." Then "always defend": the whole grid lights (100%), struck. |
| Compare | Defend chart vs a button open to 25 (rule of thumb): 650 combos, about 49% of hands. Q9s is inside it. |
| Prove | "Enough" made exact: the button risks 25 to win the 15 in the blinds, so the raise profits at once if the blinds fold more than 62.5% of the time. Between them, the blinds must continue with at least 37.5% of hands to stop any-two-cards opens. Shown as a 40-chip bar (25 risked, 15 to win). This is a pressure number, not a forecast. |
| Transfer | Faded: the button raises to 40 instead. Blanks: owe 30, final pot 85, price 30 ÷ 85 ≈ 35.3%. "A bigger raise, a worse price: defend fewer hands." |
| Rule | "Your price = what you owe ÷ the pot after you call. The blind helps the price; it doesn't make the call." |
| Checks | Guided: the film spot, Q♣ 9♣ BB vs BTN 25 (price ≈ 27.3%; inside the defend chart: call). Practice: the SB facing the BTN raise to 25, BB still to act: owe 20 into 40, price 20 ÷ 60 ≈ 33.3%, and one player still behind you. Fresh: K♦ 5♣ in the BB vs a BTN raise to 40: price ≈ 35.3%; outside the defend chart (fold); distractors 30 ÷ 40 = 75% and 30 ÷ 55 ≈ 54.5% (your call left out). Delayed: by policy. |
| Characters | Reina cameo at the contrast. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Your 10 in white at the BB | You posted 10. Do you have to call? |
| 4–9 | Predict | PROTECT IT / ONLY THE RIGHT HANDS | Predict first. |
| 9–17 | Spot | Q♣ 9♣ in the BB; BTN raises to 25 (coral); pot 40 | The button raises to 25. The pot is 40. |
| 17–25 | Price | Ring 55; blue 15 slice ≈ 27.3% | You owe 15 more. Final pot 55: a price of 27.3%. |
| 25–32 | Contrast | Same call with nothing posted: 25 ÷ 65 ≈ 38.5% | Without the blind, the same call costs 38.5%. |
| 32–37 | Not everything | Whole grid lights, struck; defend chart ≈ 49% | Cheaper isn't free. Defend about half, not all. |
| 37–46 | Enough | Bar: 25 risked, 15 to win; 62.5% fold line; 37.5% defend line | If the blinds fold over 62.5%, any raise profits. |
| 46–56 | Transfer | Raise to 40; blanks owe 30, final 85, 35.3% | Your turn: they raise to 40. What's the price? |
| 56–63 | Rule | Glass card | The blind helps your price. It doesn't make the call. |

**Truth sheet:** BB vs raise to R: owe R − 10 into 5 + 10 + R, price (R − 10) ÷ (2R + 5). R = 25: pot 40, owe 15, final 55, ≈ 27.3%. No blind posted: 25 ÷ 65 ≈ 38.5%. Opener risks 25 to win 15: break-even folds 25 ÷ 40 = 62.5%; blinds defend at least 37.5% (MDF framing, previewing `x-mdf`). Defend chart 650 combos ≈ 49%; Q9s inside, K5o outside. R = 40: owe 30, final 85, ≈ 35.3%. SB vs 25: owe 20, 20 ÷ 60 ≈ 33.3%, 1 player behind. Fresh slips 75% and ≈ 54.5%.

---

## p-three-bet · 3-Betting

Legacy: `t2-3betting`, `three-betting-workspace-v1` v1, **KEEP** (pots 40, owes 15 / 25 / 20, sizes 100 / 75 / 100 verified). New film and fixtures. Prereqs: `p-open-raise`, `m-pot-odds`. Formats: film, worked, decision. Practice: vs LAG. The worked example is shown as a short film.

| Field | Plan |
|---|---|
| One idea | Re-raise for value with the best hands and for pressure with hands that block them. |
| Belief it fixes | "Only 3-bet aces and kings." |
| Hook | "Someone raised. When do you raise again?" |
| Predict | Tap: *Only aces or kings* / *Best hands plus a few blockers*. |
| Build | The grid. "Only AA, KK" lights 12 combos, 0.9% of hands: the opener learns that a 3-bet means exactly those two and folds everything else. Value range QQ+, AK: 34 combos (2.6%). Pressure hands A5s, A4s: 8 combos. Together 42 (3.2%); pressure is about 19% of the range. |
| Compare | Blockers, counted: you hold A♦ 5♦. Aces left for them: AA drops from 6 combos to 3, AK from 16 to 12; KK stays 6. Their strongest continuing hands (AA + AK) drop from 22 combos to 15. "Your ace removes the hands that would fight back." |
| Worked | Real table: MP raises to 25 (pot 40). You are on the BTN with A♦ 5♦: 3-bet to 75 (3× in position). The opener owes 50 more. Out of position the size is 4×: 100. A pressure 3-bet from the button risks 75 to win 40; how often it must work is `x-fold-equity`'s lesson, shown here only as a preview chip (≈ 65.2%). |
| Prove | Counting only (combos and blockers are exact); no outcome sample. |
| Transfer | Faded: Q♥ Q♣ in the BB, BTN opens to 25. Learner chooses first; then: value 3-bet to 100 (4×, out of position), owing 90 more after the 10 posted. |
| Rule | "3-bet the hands that beat their calls, and a few that block their best hands. 3× in position, 4× out." |
| Checks | Guided: A♦ 5♦ on the BTN vs an MP open to 25: what job does a 3-bet do? (pressure, with a blocker), then fold / call / 3-bet to 75. Practice: Q♥ Q♣ in the BB vs a BTN open: 3-bet to 100 for value. Fresh: K♥ J♥ in the CO vs a UTG open to 25 (pot 40, owe 25): not a value hand and holds no ace, so by this lesson's rule it is not a 3-bet (call or fold is the choice; a later lesson covers flatting). Delayed: by policy. |
| Characters | Knox cameo at Predict; optional opener portrait on the raise. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Coral raise to 25 lands | Someone raised. When do you raise again? |
| 4–9 | Predict | ONLY AA KK / BEST + BLOCKERS | Predict first. |
| 9–17 | Too narrow | Grid lights AA, KK: 12 combos, 0.9% | Only aces and kings: 12 hands in 1,326. Easy to read. |
| 17–25 | Value | QQ+, AK light: 34 combos, 2.6% | 3-bet the hands that beat their calls. |
| 25–31 | Pressure | A5s, A4s light: +8, total 42, 3.2% | Add a few hands for pressure. |
| 31–40 | Blockers | A♦ 5♦; AA 6 → 3, AK 16 → 12; 22 → 15 | Your ace removes aces they could hold. |
| 40–48 | Worked | Table: MP 25, you BTN 3-bet to 75; opener owes 50; OOP size 100 | In position, 3-bet to 75. Out of position, 100. |
| 48–58 | Transfer | Q♥ Q♣ in the BB vs BTN 25; tap first; 3-bet to 100, owe 90 | Your turn: queens in the big blind. |
| 58–65 | Rule | Glass card | Value hands, plus a few blockers. 3× in position, 4× out. |

**Truth sheet:** AA + KK 12 combos ≈ 0.9%; QQ+ AK 18 + 16 = 34 ≈ 2.6%; A5s + A4s 8; total 42 ≈ 3.2%; pressure 8 of 42 ≈ 19%. Holding A♦ 5♦: AA 3, AK 12, KK 6; AA + AK 15 vs 22. Open 25 → 3-bet 75 (3×) or 100 (4×); pot before 40; opener owes 50 vs 75; from the BB after 100 you owe 90. Preview: 75 ÷ (75 + 40) ≈ 65.2%. K♥ J♥ vs UTG: pot 40, owe 25; KJs is in neither the value nor the pressure list.

---

## Tree problems found while planning (applied to the tree 2026-10-06)

1. **Seat names.** The brief says HJ; the existing lessons and native ring use MP for the same six-max seat. Accepted: one name across the Academy (keep MP, mention "hijack" once) and a glossary entry.
2. **`p-three-bet` prereqs.** Its pressure half rests on blockers and fold rates. Applied: `m-pot-odds` added (price of the opener's call); for v1 scope, fold-rate math stays a preview that `x-fold-equity` owns.
3. **`p-blind-defense` → `x-mdf`.** "Defend enough" is MDF in preflop form (37.5% here). Applied: `x-mdf` ← `p-blind-defense`, so the idea is met once preflop before the postflop version.
4. **`p-starting-hands` ← `m-pot-odds`.** The lesson uses one price and no odds math; `m-chance-as-share` covers its counting. Applied: relaxed to `m-chance-as-share` so a "knows-rules" learner can reach preflop sooner. `m-pot-odds` stays on `p-blind-defense`.
5. **Formats.** `p-blind-defense` and `p-three-bet` each play best as a short diagram film. Applied: `film` added to both.
