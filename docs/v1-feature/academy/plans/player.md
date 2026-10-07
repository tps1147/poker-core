# Track 9 lesson plans: The Player

Three v1 nodes from `src/learn/v1/academyTree.mjs`. Format: `../LESSON-PLAN-FORMAT.md`. Every number is asserted by `check-postflop-to-formats.mjs`. Bankroll figures are **labelled examples**, and the ruin chances come from a stated toy model; neither is a recommendation. This track gives no personal financial advice: the bankroll lesson says so on its welcome card, and it talks about chips and buy-ins, not about what anyone should spend.

---

## `y-bankroll` — Bankroll

Track 9, The Player. Prerequisites: `w-luck-and-skill`, `r-actions`. Legacy concept `t6-bankroll` (no lesson yet).

| Field | Plan |
|---|---|
| One idea | Play stakes your bankroll can survive through normal variance. |
| Belief it fixes | "A good player can't go broke." |
| Hook | "You win more sessions than you lose. Can you still go broke?" |
| Predict | *No* / *Yes*. |
| Build | Buy-ins as the unit, with labelled examples: a bankroll of 2,000 chips is 20 buy-ins at a 100-chip game and 40 at a 50-chip game. Toy model, captioned as one: each session wins or loses one buy-in, and this player wins 55% of sessions (an edge of 0.1 buy-in a session, 10%). |
| Prove | Under that model the chance of ever losing the whole bankroll is (45/55)^N = (9/11)^N for N buy-ins: 5 buy-ins 36.7%, 10 buy-ins 13.4%, 20 buy-ins 1.8%, 40 buy-ins 0.033%. The same winning player, the same edge; only the cushion changed. Many paths are drawn as faint lines from a code-seeded model, labelled "illustration", with the ruin share read from the formula, not from the drawing. |
| Transfer | The learner picks the game for a 2,000-chip bankroll from two labelled examples (20 or 40 buy-ins) and says which ruin row applies. |
| Rule | "Count your bankroll in buy-ins, and keep enough of them that a bad run is a dip, not the end." |
| Checks | Comprehension taps (not evidence): count buy-ins for one example; pick the row. Delayed check by policy. |
| Formats | film + toy |
| Characters | None. |
| Cinematic plates | None. |
| Sound | Silent-complete captions; narration later. |

### Film beats (target 60 s, 360×640 review draft)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | A chip stack and a rising line | You win more sessions than you lose. Can you still go broke? |
| 4–8 | Predict | NO / YES | Predict first. |
| 8–18 | Buy-ins | 2,000 chips split into 20 stacks of 100, then 40 of 50 | Count your bankroll in buy-ins. (Examples.) |
| 18–28 | Toy model | Win 55%, lose 45%, one buy-in a session | A toy model: this player wins 55% of sessions. |
| 28–44 | Ruin rows | 5 → 36.7%, 10 → 13.4%, 20 → 1.8%, 40 → 0.033%, each row slamming in | Same player, same edge. Only the cushion changes. |
| 44–54 | Reveal | The predict flips: YES | Yes. A winning player can go broke with too few buy-ins. |
| 54–60 | Rule | Glass card | Keep enough buy-ins that a bad run is a dip, not the end. |

**Truth sheet.** 2,000 ÷ 100 = 20; 2,000 ÷ 50 = 40 (labelled examples). Gambler's-ruin result for a player with no target and win chance p > ½: ruin = ((1 − p) ÷ p)^N; with p = 0.55, (9/11)^N: 36.7%, 13.4%, 1.8%, 0.033% for N = 5, 10, 20, 40. Edge 0.55 − 0.45 = 0.1 buy-in a session. The path drawing must be generated from a fixed seed in code and is decoration for the formula, never a source of a number.

---

## `y-tilt` — Tilt and the Mental Game

Track 9, The Player. Prerequisites: `m-ev`, `m-variance`. Legacy concept `t6-tilt` (no lesson yet).

| Field | Plan |
|---|---|
| One idea | Notice when results are steering decisions and reset to the math. |
| Belief it fixes | "Tilt only means getting angry." |
| Hook | "Three good calls. Three losses. What do you do on the fourth?" |
| Predict | *Stop calling* / *Keep making the right call*. |
| Build | The M1 pot-odds spot returns: 30% chance against a 25% price, a call worth +10 on average (0.3 × 200 − 50). Then three losses in a row, played on the real table without commentary. |
| Prove | Three losses in a row at 30% to win happen 0.7³ = 34.3% of the time; five in a row 16.8%. The film names the quiet forms of tilt as actions, not feelings: calling less after losses, chasing after losses, playing longer to "get it back", or folding a good call to avoid the feeling. |
| Transfer | Same spot after the streak; the learner decides, then the rule card shows the call is still +10. |
| Rule | "Grade the decision by the math, not by the last three results." |
| Checks | Comprehension taps (not evidence); the spot is a repeat of a mastered M1 decision and is logged as such. |
| Formats | film |
| Characters | A coach thinking beat (Knox) at the streak. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

### Film beats (target 45 s, 360×640 review draft)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Three red losses stacked | Three good calls. Three losses. |
| 4–8 | Predict | STOP / KEEP CALLING | What do you do on the fourth? |
| 8–16 | The call | 30% vs 25%; 0.3 × 200 − 50 = +10 | The call is worth +10 on average. |
| 16–26 | The streak | Three losses on the table; then 0.7³ = 34.3% | Three in a row happens 34.3% of the time. |
| 26–38 | Quiet tilt | Four action cards: call less, chase, play longer, fold to avoid the feeling | Tilt is any time results steer the decision. |
| 38–45 | Rule | Glass card; the call stamped +10 | Grade the decision by the math. |

**Truth sheet.** 0.3 × 200 − 50 = 10 (the M1 truth pack); 0.7³ = 343/1,000; 0.7⁵ = 16,807/100,000.

---

## `y-study` — How to Study

Track 9, The Player. Prerequisites: `w-the-academy`, `m-variance`.

| Field | Plan |
|---|---|
| One idea | Review decisions, not results; spaced practice beats cramming. |
| Belief it fixes | "Playing more hands is the best way to improve." |
| Hook | "Which hand should you review: the one you lost, or the one you weren't sure about?" |
| Predict | *The loss* / *The unsure one*. |
| Build | A session log on screen: every hand tagged by how sure the decision felt, not by the result. The unsure decisions go to the review queue. |
| Prove | The M1 call is +10 a call and still loses 70 times in 100, so reviewing losses mostly reviews good decisions. Then the Academy's own loop on screen: fresh decisions now, a delayed check later, scheduled by policy. |
| Transfer | The learner tags three hands from a short log before the reveal of which go to review. |
| Rule | "Review the decisions you weren't sure of, and come back to them later." |
| Checks | Comprehension taps (not evidence). |
| Formats | film |
| Characters | None. |
| Cinematic plates | None. |
| Sound | Silent-complete captions. |

### Film beats (target 45 s, 360×640 review draft)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–5 | Hook | Two hands: a loss, an unsure call | Which hand should you review? |
| 5–9 | Predict | THE LOSS / THE UNSURE ONE | Predict first. |
| 9–20 | Tag decisions | Log rows gain sure / unsure tags; results greyed | Tag how sure you were, not whether you won. |
| 20–30 | Why | +10 call losing 70 of 100 | Good calls lose often. Losses are a bad filter. |
| 30–39 | Spacing | Review queue: now, later | Come back later. Spaced practice sticks. |
| 39–45 | Rule | Glass card | Review the decisions you weren't sure of. |

**Truth sheet.** 70 of 100 from the M1 30% call. The spacing claim needs a citation check before production; proposed sources: Cepeda et al. (2006), a review of distributed practice in *Psychological Bulletin*, and Roediger and Karpicke (2006) on retrieval practice in *Psychological Science* (**unverified here: no network was used**).
