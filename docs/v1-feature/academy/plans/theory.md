# Track 8 lesson plans: Game Theory

Three v1 nodes from `src/learn/v1/academyTree.mjs`. Format: `../LESSON-PLAN-FORMAT.md`. Every number is asserted by `check-postflop-to-formats.mjs`; the Kuhn poker facts are not quoted from memory but **verified by the script**: it evaluates the strategy profile exactly and checks every pure deviation for both players (64 pure strategies each) so no player can do better.

The track never presents solver output for full Hold'em. Its claims are about a toy game that can be solved exactly, and about the two fractions that fall out of it (bluff share and defense), which earlier tracks already proved.

---

## `g-toy-games` — Poker in Miniature

Track 8, Game Theory. Prerequisites: `x-bluffing`, `m-ev`. New lesson.

| Field | Plan |
|---|---|
| One idea | A three-card game shows why bluffing at the right rate is required, not optional. |
| Belief it fixes | "Game theory is only for computers." |
| Hook | "Three cards. One bet. Should you ever bluff?" |
| Predict | Kuhn poker: you hold the jack, the worst card. *Never bluff* / *Sometimes* / *Always*. |
| Build | The rules on the real table with three cards only: J, Q, K; each player antes 1 (pot 2); the first player may bet 1 or check; one bet, no raises. Toy: the learner sets two dials, "how often the J bets" and "how often the Q calls", and watches each player's average chips per hand update exactly (all 6 deals weighted equally). |
| Prove | The verified balance: the first player bets the K three times as often as he bluffs the J (bluff rate anywhere from 0 to 1/3), so 1 bet in 4 is a bluff, exactly bet ÷ (pot + 2·bet) = 1 ÷ (2 + 2). The second player calls with the Q 1/3 of the time; against that, the J's bet and the J's check are worth the same, −1 chip on average, so the bluffer cannot gain by changing. Call the Q more (1/2) and the J's bluff loses more than checking; never call and the bluff wins. Neither player can beat the other's strategy: the first player's value is −1/18 chip a hand (about 5.6 chips per 100 hands) however he picks his bluff rate in that range. |
| Transfer | Faded: in the same game, the second player holding the J after a check. The learner predicts how often it should bet before the reveal: 1/3 in the verified equilibrium. |
| Rule | "If you never bluff, your bets fold everyone. Bluff at the rate that leaves the caller nothing to gain." |
| Checks | Toy dial challenges (not evidence); one server-graded decision: pick the bluff share for a one-bet game with pot 2 and bet 1. Delayed check by policy. |
| Formats | toy + film |
| Characters | None in the film; Reina on the welcome card. |
| Cinematic plates | None. |
| Sound | Silent-complete captions; narration later. |

### Film beats (target 70 s, 360×640 review draft)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–5 | Hook | Three cards J, Q, K on the table | Three cards. One bet. Should you ever bluff? |
| 5–12 | Rules | Ante 1 each, pot 2; one bet of 1 | Each antes 1. One bet of 1. Highest card wins. |
| 12–18 | Predict | You hold J; NEVER / SOMETIMES / ALWAYS | Predict: does the jack ever bet? |
| 18–30 | Never | J never bets; the caller's Q dial drops to "fold to every bet" | Never bluff, and every bet means a king. He folds. |
| 30–42 | Always | J always bets; the Q dial rises to "always call" | Always bluff, and he calls. The bluffs pay him. |
| 42–54 | Balance | 3 king bets : 1 jack bet; 1 ÷ (2 + 2) = 1/4; Q calls 1/3; both J lines read −1 | One bluff in four bets. Now bluffing or not, the jack is worth the same. |
| 54–62 | Value | Counter: −1/18 a hand, about −5.6 per 100 | Even played perfectly, acting first costs 1/18 of a chip a hand. |
| 62–70 | Rule | Glass card | Bluff at the rate that leaves him nothing to gain. |

**Truth sheet.** Standard parameterisation: cards J < Q < K, antes 1, one bet of 1, first player acts first, 6 equally likely deals. Profile: first player bets J with α, K with 3α, checks Q, calls a bet with Q at α + 1/3 and with K always; second player calls a bet with K always and Q at 1/3, bets after a check with K always and J at 1/3. For α = 0, 1/6 and 1/3 the script asserts: game value −1/18 for the first player; no pure deviation by either player changes it; bluff share α ÷ 4α = 1/4 (for α > 0); the J's bet and check are both worth −1 against Q calling 1/3; Q calling 1/2 makes the bluff worse than checking, never calling makes it better; MDF in this game 2 ÷ 3 = 2/3. The script proves the profile is an equilibrium; it does not prove it is the only one (the uniqueness of the second player's strategy is a known result, **unverified here**), so the plan never says "the only way".

---

## `g-balance` — Balance and Indifference

Track 8, Game Theory. Prerequisites: `g-toy-games`, `x-mdf`. New lesson.

| Field | Plan |
|---|---|
| One idea | Bet value and bluffs in a ratio that leaves the caller indifferent. |
| Belief it fixes | "Balanced means unpredictable at random." |
| Hook | "20 value hands bet the pot. How many bluffs go with them?" |
| Predict | Slider: 0 to 20 bluffs. |
| Build | Toy: bluff share = bet ÷ (pot + 2·bet). Snaps: 1/3 pot → 1/5 (20%), 1/2 → 1/4 (25%), 2/3 → 2/7 (28.6%), 3/4 → 3/10 (30%), pot → 1/3 (33.3%), 2 × pot → 2/5 (40%). Value to bluffs: 2:1 at pot size, 3:1 at half pot. |
| Prove | Worked: pot 100, bet 100, 20 value combos → 10 bluffs (10 of 30 = 1/3). The caller's bluff-catcher: 10/30 × 200 − 20/30 × 100 = 66.7 − 66.7 = 0. Change the bluffs by one in either direction and one of the caller's options starts winning: shown as the EV needle tipping. "Balanced" is a ratio, not a coin flip. |
| Transfer | Faded: pot 120, bet 80, 25 value combos. The learner fills the ratio 200 : 80 = 5 : 2 and the bluff count 10 before the reveal; check: 10/35 × 200 − 25/35 × 80 = 57.1 − 57.1 = 0. |
| Rule | "Bluffs ÷ all bets = bet ÷ (pot + 2·bet)." |
| Checks | New spots (server keys by main): bluff count for two sizes; which change makes a caller's call profitable. Delayed check by policy. |
| Formats | toy + worked |
| Characters | Reina. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → slider predict → bluff-share toy → worked pot-size example → EV needle → faded transfer → rule → spots.

**Truth sheet.** Six bluff shares exact; 2:1 and 3:1; 20 value → 10 bluffs at pot size; caller EV 0 in both the worked and transfer spots (2,000/30 − 2,000/30 and 2,000/35 − 2,000/35); 25 value → 10 bluffs at 80 into 120.

---

## `g-gto-to-exploit` — From Balance to Exploit

Track 8, Game Theory. Prerequisites: `g-balance`, `h-exploits`. Legacy concept `t5-gto-to-exploit` (no lesson yet).

| Field | Plan |
|---|---|
| One idea | Start balanced; move away only when you have evidence of a leak. |
| Belief it fixes | "GTO and exploiting are opposites." |
| Hook | "He has shown no bluffs. Should you stop calling?" |
| Predict | River, pot 100, he bets 100, you hold a bluff-catcher. *Call* / *Fold*, with "he showed 0 bluffs in 5 showdowns". |
| Build | Contrast: one formula, three opponents. Call EV = bluff share × 200 − (1 − bluff share) × 100. Balanced (1/3): 0. Under-bluffer (10%, given): 20 − 90 = −70: fold. Over-bluffer (50%, given): 100 − 50 = +50: call. Exploiting is the same formula with a measured input. |
| Prove | Evidence beat: if he were balanced (1/3 bluffs), 0 bluffs in 5 showdowns still happens (2/3)⁵ = 32/243 = 13.2% of the time: weak evidence. 0 in 15 happens 0.23% of the time: strong evidence. The needle moves from "balanced" to "exploit" only with the second. |
| Transfer | Match: a Gauntlet rival whose bluff frequency is set by the session (`nit` or `lag`); the learner decides when the log justifies leaving the MDF default, and the session log shows the decision's EV given the rival's set frequency. |
| Rule | "Balanced until the evidence says otherwise; then exploit, and keep checking the evidence." |
| Checks | Decision spots (server keys by main) with a stated showdown history; the delayed check repeats with a different history. |
| Formats | contrast + decision |
| Characters | Reina; rival cameos `nit` and `lag` from the Gauntlet cast. |
| Cinematic plates | Existing Gauntlet rival cast art as cameos only. |
| Sound | Silent-complete captions. |

**Lesson sequence.** Hook → predict → three-opponent contrast → evidence beat → match → rule → spots.

**Truth sheet.** Call EV at 1/3, 10% and 50% bluffs: 0, −70, +50 (exact); (2/3)⁵ = 32/243; (2/3)¹⁵ = 32,768/14,348,907 ≈ 0.23%. The 10% and 50% are given rival settings.
