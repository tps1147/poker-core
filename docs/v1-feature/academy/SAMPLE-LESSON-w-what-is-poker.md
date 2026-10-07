# Sample lesson plan: What Poker Really Is (`w-what-is-poker`)

Track 0, Welcome to Poker. The first lesson anyone opens. No prerequisites. Free.

| Field | Plan |
|---|---|
| One idea | Poker is a game of hidden cards and chip decisions, and over many hands the better decisions take the chips. |
| Belief it fixes | "Poker is mostly about being dealt good cards." |
| Hook | "52 cards. Two are yours. What decides who wins?" |
| Predict | Tap one: *The cards* / *The decisions*. No grade; the answer is revisited at the end. |
| Build | On the real Flop52 table: the deal (your two cards face up to you, theirs hidden), the five shared cards arriving flop / turn / river, and the pot growing as chips go in. |
| Prove | One hand: anyone can win it. Then a 10 × 10 grid of hands: the same good decision repeated wins chips on average, even though many single hands are lost. Labelled as an illustration of averages, not a forecast. |
| Transfer | Two ways to win a pot, shown on the table: the best five cards at showdown, or everyone else folds. The learner predicts which happened before it is revealed. |
| Rule | "Cards decide a hand. Decisions decide a thousand." Then the map of the tracks ahead, and "Next: the 52-card deck". |
| Checks | Three comprehension taps (not mastery evidence): Can they see your cards? (no) · How many shared cards can you use? (all five) · Can you win without showing your hand? (yes, if everyone else folds). |
| Formats | film + table |
| Characters | None in the film. A coach greeting can sit on the lesson's welcome card. |
| Sound | Silent-complete; narration later. |

## Film beats (target 60 s, 360×640 review draft)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | A deck fans out into 52 cards; two lift out and glow | 52 cards. Two are yours. What decides who wins? |
| 4–8 | Predict | THE CARDS / THE DECISIONS, think bar | Predict first: the cards, or the decisions? |
| 8–15 | Deal | Real table, heads-up. Your K♥ Q♥ face up; theirs face down | You see your two cards. They can't. |
| 15–23 | Board | Flop J♥ T♣ 4♥, turn 2♠, river 9♦ arrive in three steps | Five shared cards come out in three steps. Both players use them. |
| 23–31 | Chips | Blinds, a bet, a call; the pot rolls up; action buttons light | Every round, each player decides: fold, call or raise. |
| 31–38 | Showdown | Their A♣ J♦ flips. Your best five K-Q-J-T-9 lights up: a straight beats their pair of jacks | Best five cards wins at showdown. Your straight beats a pair. |
| 38–42 | Other way | Replay ghost: a bet, they fold, you take the pot unseen | Or win without showing: everyone else folds. |
| 42–52 | Many hands | 10 × 10 grid; one hand flips red, then the grid fills to a rising chip line labelled "average" | One hand can go either way. Over many hands, better decisions take the chips. |
| 52–57 | The path | Track chips light in order: Rules → Board → Math → Preflop → Postflop → Pressure → People → Theory | Flop52 teaches those decisions, one idea at a time. |
| 57–60 | Rule | "Cards decide a hand. Decisions decide a thousand." Next: the deck | Next: the 52-card deck. |

## Truth sheet

- Deck: 4 suits × 13 ranks = 52. Starting combinations: 52 × 51 ÷ 2 = 1,326 (asserted in `test/v1/learn/academyTree.test.mjs`).
- Showdown: K♥ Q♥ on J♥ T♣ 4♥ 2♠ 9♦ makes a K-high straight; A♣ J♦ makes a pair of jacks. Verified with `src/eval/pokerEvaluator.js` (`Straight` rank 5 vs `One Pair` rank 2).
- The many-hands grid is an illustration and is labelled so; it shows no invented win rate.
- History facts belong to `w-history`, not this lesson; that lesson needs cited sources before production.
