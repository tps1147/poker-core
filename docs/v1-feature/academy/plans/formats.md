# Track 10 lesson plans: Other Tables

Five nodes from `src/learn/v1/academyTree.mjs`: one v1 lesson with a full plan, four `scope: "later"` nodes with outline plans only (no media, no spots until the tournament / six-player stage is opened). Format: `../LESSON-PLAN-FORMAT.md`. Every number is asserted by `check-postflop-to-formats.mjs`.

---

## `o-multiway` — Multiway Pots

Track 10, Other Tables. Prerequisites: `f-board-texture`, `m-equity`, `x-fold-equity`. Legacy concept `t6-multiway` (no lesson yet).

| Field | Plan |
|---|---|
| One idea | Hands lose value as players are added; bluff less, value bet tighter. |
| Belief it fixes | "More callers means more value for any hand." |
| Hook | "Top pair against one player is strong. Against three?" |
| Predict | A♦ J♣ on J♥ 7♠ 3♦. Tap how often *someone* already beats you: against 1, 2 and 3 opponents. |
| Build | Worked, labelled "against random hands, an illustration": against one random hand, 43 of the 1,081 possible hands are ahead of top pair right now (4.0%). Against two it is 7.8% of all deals, against three 11.5%. Each extra player adds hands that already beat you; nothing about future cards is used. |
| Prove | The bluff side: a 2/3-pot bluff needs 40% folds. If each opponent folds 60% of the time on his own (given, independent), all of them fold 60% heads-up, 36% three-handed and 21.6% four-handed. The same bluff that works against one player fails against two. |
| Transfer | Faded: the learner fills "all fold" for two opponents at a given 70% each before the reveal, and decides bet or check. |
| Rule | "Every extra player is another range to beat. Bluff less and value bet stronger hands." |
| Checks | New spots (server keys by main): value bet or check top pair three-way; bluff or check two-way. Delayed check by policy. |
| Formats | worked + decision |
| Characters | Vale. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → the table fills to four seats one at a time with the "someone is ahead" counter updating → bluff fold chain (0.6, then 0.6 × 0.6, then 0.6 × 0.6 × 0.6) → faded transfer → rule → spots.

**Truth sheet.** Exact enumeration with card removal: 1,081 single hands (43 ahead); 535,095 disjoint pairs of hands (493,233 with neither ahead); 161,063,595 disjoint triples (142,476,648 with none ahead). 2/3-pot break-even = 2/5; 0.6, 0.36, 0.216. The transfer's 70% is a given; its answer, 0.7 × 0.7 = 0.49, is checked in the script.

---

## `o-heads-up` — Heads-Up Play

Track 10, Other Tables. Prerequisites: `p-blind-defense`, `h-player-types`.

**Outline plan (scope: later).** Objective: "Wider ranges and constant pressure when only two players remain." Belief it fixes: "Play the same hands heads-up as at a full table."

| Field | Plan |
|---|---|
| Formats | match |
| Outline | One match lesson against the Gauntlet cast: the button posts the small blind and acts first before the flop and last after it; opening and defending ranges widen; `lag` and `nit` rivals show the two failure modes. Numbers (range sizes, defense rates) to be computed in this script when the lesson is opened. |
| Cinematic plates | Existing Gauntlet rival cast art as cameos. |

---

## `o-tournaments-icm` — Tournaments and ICM

Track 10, Other Tables. Prerequisites: `m-ev`, `m-spr`. Legacy concept `t6-icm`.

**Outline plan (scope: later).** Objective: "Tournament chips are not money; survival value changes calls." Belief it fixes: "Chip EV and money EV are the same in tournaments."

| Field | Plan |
|---|---|
| Formats | worked |
| Outline | One worked example, already verified: three players with 5,000 / 3,000 / 2,000 chips (50% / 30% / 20% of the 10,000 in play) and payouts of 50% / 30% / 20% of the prize pool. By the Malmuth–Harville model their prize shares are 38.4% / 32.8% / 28.9%: flatter than the chips, so the big stack's chips are each worth less and the short stack's more. The lesson then shows why a chip-even call can be a money-losing call near the payouts. |
| Cinematic plates | None. |

---

## `o-six-max` — Six-Handed Tables

Track 10, Other Tables. Prerequisites: `p-open-raise`, `o-multiway`.

**Outline plan (scope: later).** Objective: "More seats change opening ranges and multiway frequency." Belief it fixes: "Open the same hands from every seat at every table size."

| Field | Plan |
|---|---|
| Formats | table |
| Outline | A table walkthrough on the six-seat Flop52 table: seat names, how many players are left to act from each, and why that changes opening ranges; reuses `o-multiway`'s "someone is ahead" counter. Numbers to be computed here when opened. |
| Cinematic plates | None. |

---

## `o-live` — Live Poker

Track 10, Other Tables. Prerequisites: `r-first-hand`, `h-player-types`.

**Outline plan (scope: later).** Objective: "Table etiquette, dealing, string bets and live tells." Belief it fixes: "Online rules and live rules are the same."

| Field | Plan |
|---|---|
| Formats | film |
| Outline | A short film of live-table conventions (announcing actions, one motion to bet, protecting cards) with a separate, clearly labelled note that tells are weak evidence compared with betting patterns, tying back to `h-player-types`. Rules of etiquette need a cited house-rules source before production. |
| Cinematic plates | Possibly the existing Gauntlet rival cast art as cameos; no new plates proposed. |
