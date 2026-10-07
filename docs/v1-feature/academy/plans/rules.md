# Track 1 lesson plans: How a Hand Plays

Plans for every `rules` node of `src/learn/v1/academyTree.mjs` (draft 0), in the field list of `../LESSON-PLAN-FORMAT.md`. The game is **No-Limit Texas Hold'em**. Every card, chip count and pot below is checked by `check-welcome-rules-board.mjs` in this folder. The table stakes match the shipped lessons: blinds 5 / 10, 1,000-chip stacks, no antes, no rake.

## Direction for the whole track

These are table lessons first. Most beats run on the real Flop52 table, cards and ActionBar. Diagram beats (glass on near-black) appear only when a rule needs to be pulled apart: the ranking ladder, the best-five picker, the side-pot stack. Cinematic plates are used sparingly in this track. Each film gets at most a 2–4 s establishing plate behind its hook, so the track keeps the Welcome films' look without burying the rules. Game feel goes where the answer lands: the five cards that play lift and lock, chips slide into the right pot with a count-up, and a "SPLIT" stamp cuts a pot in two. Results never grade a decision. Captions are silent-complete.

Colour carries the house meanings. Green is your hand or chance, blue is your call, coral is their bet, gold is the pot, and white is chips already in. This track adds one rules-only colour: **violet marks the button and the order-of-action arrow**. It is used nowhere else in this track. (Postflop proposes the same BitBlur violet `#5d5afd` for range tiles; that is a plan note only, and the two uses must stay visually distinct.)

| Node | Legacy lesson | Film |
|---|---|---|
| `r-the-deck` | none (new) | 50 s |
| `r-hand-rankings` | `hand-rankings-workspace-v1` **REVISE** | 65 s |
| `r-best-five` | none (new; reuses the best-five picker) | 70 s |
| `r-seats-blinds` | none (new; the shipped `positions-workspace-v1` maps to `p-position-value`) | 55 s |
| `r-actions` | `betting-actions-workspace-v1` **KEEP** (glossary fix) | 60 s |
| `r-streets` | none (new) | 55 s |
| `r-showdown` | none (new) | 60 s |
| `r-all-in-side-pots` | none (new) | 75 s |
| `r-first-hand` | none (new, guided hand) | 45 s intro, then a played hand |

---

## `r-the-deck`: The Deck: 52 Cards

| Field | Plan |
|---|---|
| Node and track | `r-the-deck`, track 1 Rules. Prereqs: `w-what-is-poker`. |
| Objective (tree) | Four suits, thirteen ranks, no jokers; suits never outrank each other in Hold'em. |
| One idea | Four suits of thirteen ranks, no jokers, and no suit outranks another. |
| Belief it fixes | "Some suits are worth more than others." |
| Hook | "Your ace of spades against their ace of hearts. Whose is better?" |
| Predict | Tap one: **Spades** / **Hearts** / **Neither**. |
| Build | **Toy:** 52 cards arrive face up in a heap and the learner sorts them into a 4 × 13 grid, one row per suit, ranks 2 → A left to right. The film shows the same sort happening at speed. A rank rail then marks A as the top card, with a ghost A at the low end tagged "also low in one straight: A-2-3-4-5". |
| Prove | A showdown on the real table. On Q♥ J♦ T♣ 4♠ 3♥, your A♠ K♦ meets their A♥ K♣. Both make the same ace-high straight. The pot splits down the middle with a SPLIT stamp. Suits did not break the tie. |
| Transfer | Two quick cards on the toy: *Which is higher, 9♣ or 9♦?* (equal) · *How many cards of each rank?* (four) |
| Rule | "52 cards: 13 ranks × 4 suits. Ranks matter. Suits only matter for flushes." |
| Checks | Guided: drag the grid's last three cards into place. Practice: the split showdown above, asked as *Who wins?* (split). Fresh: Q♦ J♥ T♠ 4♣ 2♦, K♥ 9♣ against K♠ 9♦: both K-high straights, split. |
| Formats | table, toy |
| Characters | None. |
| Sound | Silent-complete. Later: card riffle on the sort. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate (2 s): a dealer's hands riffle a deck in close-up, backs only; cut to A♠ and A♥ face to face | Ace of spades against ace of hearts. Whose is better? |
| 4–7 | Predict | SPADES / HEARTS / NEITHER | Predict first. |
| 7–17 | The sort | 52 cards fly into a 4 × 13 grid; row labels ♠ ♥ ♦ ♣; column ranks 2–A | Four suits. Thirteen ranks in each. 52 cards, no jokers. |
| 17–24 | Rank rail | Rail 2 → A; ace glows; ghost ace at the low end | Aces are highest, and can also start the lowest straight. |
| 24–36 | The tie | Real table: board Q♥ J♦ T♣ 4♠ 3♥; A♠ K♦ vs A♥ K♣; both fives lift; SPLIT stamp, pot halves slide | Same five ranks, same hand. The pot splits. |
| 36–44 | Answer | NEITHER stamps; suits row dims, rank rail stays lit | No suit beats another. Suits only matter for flushes. |
| 44–50 | Rule | Rule card; Next: Hand rankings | 13 ranks × 4 suits. Ranks decide. |

**Cinematic plates (generate):** P1, close-up of a dealer's hands riffling a deck, only plain card backs visible, warm overhead light, macro locked-off camera, 2 s. Code-drawn: every card face, the grid, the rail, the table and the split.

**Truth sheet:** 4 × 13 = 52. Q♥ J♦ T♣ 4♠ 3♥, with A♠ K♦ against A♥ K♣: both make a straight (A-K-Q-J-T), and it splits (`deck: ...`). A-2-3-4-5 is a straight and Q-K-A-2-3 is not (`rankings: ...`).

---

## `r-hand-rankings`: Hand Rankings (REVISE of `hand-rankings-workspace-v1`)

| Field | Plan |
|---|---|
| Node and track | `r-hand-rankings`, track 1 Rules. Prereqs: `r-the-deck`. Legacy: `t0-hand-rankings`, `hand-rankings-workspace-v1`, REVISE. |
| Objective (tree) | Know the ten hand categories in order and why rarer hands rank higher. |
| One idea | There are ten hand categories, in a fixed order, and a rarer hand beats a more common one. |
| Belief it fixes | "A flush beats a full house because it looks prettier." |
| Hook | "Flush or full house: which one wins?" |
| Predict | Tap one: **Flush** / **Full house**. |
| Build | The ladder: ten glass rungs from high card to royal flush. Each rung slams in with one example five (code cards). Beside it is a count bar showing how many of the 2,598,960 five-card hands make that category. The bars shrink as the ladder rises, so "rarer ranks higher" is something you see. The flush and full-house rungs flash together: full house **3,744** against flush **5,108**. |
| Prove | All 2,598,960 five-card hands, counted exactly. Every step up the ladder is rarer than the one below (royal 4, straight flush 36, quads 624, full house 3,744, flush 5,108, straight 10,200, trips 54,912, two pair 123,552, pair 1,098,240, high card 1,302,540). The order is not taste; it is counting. |
| Transfer | Three hands on the real table, each read **before** any chips (below). |
| Rule | "Rarer beats more common. Learn the ladder top to bottom." |
| Checks | Guided → practice → fresh "name the hand" decisions, server-graded on the category and the five cards chosen. Delayed check: a mixed ladder-order drag. |
| Formats | table, decision |
| Characters | Ada (the existing coach), on the guided hand only. |
| Sound | Silent-complete. |

**REVISE: what changes from the shipped lesson.** The audit found two problems. The film says a misread "leaves value behind", but the scripted guided hand auto-plays "Call 40 and see the showdown". And every hand ends on a scripted `result winner hero`. The revised lesson makes these changes:

1. The learner's job is to **name the hand and pick the five**. That is the only graded answer. There is no auto-played call, and the copy no longer talks about value: that claim belongs to `f-value-betting`.
2. After the answer, the hand plays out with both hands **revealed neutrally**. The opponent's hand is revealed only after the answer is saved, as `scriptedHand.validateHand` already enforces. There is no "you win" banner. If the learner's hand wins, the pot slides with no grade attached. The fixtures below are chosen to read clearly, not to win.
3. The existing best-five picker and server registry pattern stay. New spot ids and new keys are needed on the server; the definitions here carry no keys.

| Spot | Hero | Board | Correct read | The decoy |
|---|---|---|---|---|
| guided (Ada) | K♥ Q♥ | A♥ 9♥ K♣ 4♥ K♠ | **Flush**, A-K-Q-9-4 of hearts | three kings is right there too, but the flush outranks it |
| practice | 7♣ 7♦ | 7♥ J♣ J♦ 2♠ 9♥ | **Full house**, sevens full of jacks | "a pair of jacks on board" |
| fresh | 6♠ 5♦ | 4♣ 7♥ 8♦ Q♠ Q♥ | **Straight**, 4-5-6-7-8 | the board's pair of queens |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate (2 s): spotlight on an empty felt; cut to two fives face up, a flush and a full house | Flush or full house: which one wins? |
| 4–7 | Predict | FLUSH / FULL HOUSE | Predict first. |
| 7–30 | The ladder | Ten rungs slam in bottom to top, each with its five and its count bar; bars shrink upward | Ten hands, lowest to highest. Each step up is rarer. |
| 30–40 | The pair that matters | Full house 3,744 and flush 5,108 rungs pulse; counts tally | Full house: 3,744 ways. Flush: 5,108. Rarer wins. |
| 40–47 | Answer | FULL HOUSE stamps | A full house beats a flush. |
| 47–58 | Read first | Real table: Ada's K♥ Q♥ on A♥ 9♥ K♣ 4♥ K♠; three kings glow, then the five hearts lift over them | Seven cards can hide two hands. Name the higher one. |
| 58–65 | Rule | Ladder compresses to a strip; Next: Your best five | Rarer beats more common. Name your hand before you bet. |

**Cinematic plates (generate):** P1, a single overhead spotlight falling on an empty green felt, dust in the beam, a slow push-down, 2 s. Code-drawn: the ladder, every example hand, every count and the table.

**Truth sheet:** all ten five-card category counts, totalling 2,598,960 and each rarer than the last (`rankings: ...`, a full enumeration). Every ladder hand is named by both the reference scorer and `pokerEvaluator.js` (`ladder: ...`). The three spots read Flush, Full House (sevens full of jacks) and Straight (8-high) (`hand-rankings ...`).

---

## `r-best-five`: Your Best Five of Seven

| Field | Plan |
|---|---|
| Node and track | `r-best-five`, track 1 Rules. Prereqs: `r-hand-rankings`. |
| Objective (tree) | Your hand is the best five cards from your two plus the five on the board; kickers break ties and pots can split. |
| One idea | Your hand is the best five of seven: your two cards plus the five on the board. You may use two, one or none of your own cards. Kickers break ties, and an exact tie splits the pot. |
| Belief it fixes | "You must use both of your hole cards." |
| Hook | "Pocket aces, and they don't play. How?" |
| Predict | *How many of your own cards must you use?* **Both** / **At least one** / **Any number, even zero**. |
| Build | The best-five picker: seven cards in a row, and the learner taps five. The five that play lift and lock with a "click", and a counter reads "your cards used: 2 / 1 / 0". There are three panels, in order: **two** (K♥ Q♥ on J♥ T♣ 4♥ 2♠ 9♦ makes the K-high straight), **one** (A♥ 3♣ on K♥ Q♥ 8♥ 5♥ 2♦ makes the ace-high flush with just the A♥), and **zero** (A♣ A♦ on 9♣ 8♦ 7♥ 6♠ 5♣, where the board's 9-high straight plays and the aces sit out). |
| Prove | Two contrasts on the real table. **Kicker plays:** on A♦ 9♠ 7♣ 4♥ 2♦, A♥ K♦ beats A♣ Q♠. Both have a pair of aces, and the king kicker wins. **Kicker doesn't play:** on A♠ K♦ Q♣ J♥ 9♠, A♥ 2♣ and A♦ 3♠ both make A-A-K-Q-J. Neither low card is in the best five, so the pot splits. Then the zero-card board again, A♣ A♦ against K♠ J♥: SPLIT. Against T♠ 2♥ instead, the ten makes a higher straight and wins. |
| Transfer | Faded worked example: a new seven cards with the five pre-picked except one slot, then a fully open pick. |
| Rule | "Best five of seven. Use two, one or none of yours." |
| Checks | Guided (picker with hints) → practice → fresh pick-five, server-graded on the five chosen. Then one fresh *Who wins?* spot with a kicker. |
| Formats | table, worked, decision |
| Characters | None in the film. A rival, Ace Andy, sits on the table beats. |
| Sound | Silent-complete. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Real table: A♣ A♦ glow, then dim | Pocket aces, and they don't play. How? |
| 4–8 | Predict | BOTH / AT LEAST ONE / ANY NUMBER | Predict first: how many of yours must you use? |
| 8–18 | Two | K♥ Q♥ + J♥ T♣ 4♥ 2♠ 9♦; five lift: K Q J T 9; counter "2" | Two from your hand, three from the board. |
| 18–27 | One | A♥ 3♣ + K♥ Q♥ 8♥ 5♥ 2♦; hearts lift; counter "1" | One from your hand: the ace makes the flush. |
| 27–37 | Zero | A♣ A♦ + 9♣ 8♦ 7♥ 6♠ 5♣; board straight lifts; aces stay down; counter "0" | None of yours. The board's straight is your best five. |
| 37–43 | Answer | ANY NUMBER stamps | Two, one or none: whatever makes the best five. |
| 43–54 | Kicker plays | A♦ 9♠ 7♣ 4♥ 2♦: A♥ K♦ vs A♣ Q♠; the K and Q face off; K wins (slam) | Same pair? The next-highest card, the kicker, decides. |
| 54–64 | Kicker doesn't | A♠ K♦ Q♣ J♥ 9♠: A♥ 2♣ vs A♦ 3♠; both fives A A K Q J; SPLIT | If your kicker isn't in the best five, it doesn't count. Split. |
| 64–70 | Rule | Rule card; Next: Seats and blinds | Best five of seven. Use two, one or none. |

**Cinematic plates:** none. This is a pure table and picker lesson. Code-drawn throughout.

**Truth sheet:** the two-, one- and zero-card examples, with their categories and the minimum hole cards used (2 / 1 / 0), are computed from all 21 five-card subsets (`best-five ...`). The board straight splits A♣ A♦ with K♠ J♥, and T♠ 2♥ wins with a T-high straight (`best-five: ...`). A-K beats A-Q on A♦ 9♠ 7♣ 4♥ 2♦ (`kicker: ...`). A♥ 2♣ and A♦ 3♠ split on A♠ K♦ Q♣ J♥ 9♠ with best five A-A-K-Q-J. **Engine note:** the shared `compareHands` in `src/eval/pokerEvaluator.js` reports the A-K against A-Q spot as a tie, because it never compares kickers. Any signed-out preview that decides a winner with it would be wrong here. The script records the disagreement.

---

## `r-seats-blinds`: Seats, Button and Blinds

| Field | Plan |
|---|---|
| Node and track | `r-seats-blinds`, track 1 Rules. Prereqs: `r-the-deck`. New lesson: a short film plus table checks. |
| Objective (tree) | The button moves every hand; the two blinds post before cards so there is always something to win. Heads-up, the button posts the small blind, acts first preflop and last on every later street. |
| One idea | The button moves one seat clockwise every hand. The two seats after it post the blinds before any cards, so every hand starts with something to win. |
| Belief it fixes | "The blinds are a fee to the house." |
| Hook | "Fifteen chips are in the pot before anyone sees a card. Whose are they?" |
| Predict | Tap one: **The house's** / **Two players'**. |
| Build | Real six-max table. A violet button disc slides seat to seat over three hands. Small blind 5 and big blind 10 chips step out of the two seats after it, and the pot reads 15 (gold). An order-of-action arrow (violet) sweeps preflop UTG → HJ → CO → BTN → SB → BB. Then the table collapses to **heads-up**, Flop52's own game. There the **button posts the small blind and acts first preflop**, and the big blind acts first on every later street. |
| Prove | Three hands in a row on the six-max table with the button moving. Everyone pays each blind once per orbit, so over many hands the cost is the same for every seat. The pot always goes to a player; nothing goes to the house. |
| Transfer | Heads-up quiz on the table: *You are on the button. Who posts the small blind? Who acts first before the flop? Who acts first on the flop?* (you, you, them) |
| Rule | "The button moves every hand. Blinds come from players and go to whoever wins the pot. Heads-up: the button is the small blind." |
| Checks | Guided → practice → fresh: tap the seat that posts the small blind / acts first, on six-max and heads-up tables (server-graded). The existing `positions-workspace-v1` hands belong to `p-position-value` (see below). |
| Formats | table, film |
| Characters | Reina (the coach of the shipped positions lesson), on the welcome card. |
| Sound | Silent-complete. |

**Legacy remap (tree, 2026-10-06).** The shipped `positions-workspace-v1` is correct (seat counts, 5/10 blinds, pot 15, 10 to call, raise to 25). But it teaches **opening ranges by seat**, so the tree now maps it to `p-position-value` only (KEEP there); `p-open-raise` keeps its own `rfi-position-workspace-v1`. This node is a new lesson: a short table-literacy film with seat-tap checks, reusing that lesson's six-max ring and blind values so the two look the same.

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Six-max table; 5 and 10 chips slide in; pot 15 | 15 chips before anyone sees a card. Whose are they? |
| 4–7 | Predict | THE HOUSE'S / TWO PLAYERS' | Predict first. |
| 7–16 | The button | Violet disc; seats label BTN SB BB UTG HJ CO | The button marks the dealer seat. It moves one seat every hand. |
| 16–24 | The blinds | SB posts 5, BB posts 10 (white chips), pot 15 (gold) | The two seats after it post blinds: 5 and 10. |
| 24–32 | Order | Violet arrow sweeps UTG → … → BB | Before the flop, the seat after the big blind acts first. |
| 32–40 | It rotates | Three quick hands: disc moves, blinds move with it | Everyone pays each blind once per lap of the table. |
| 40–49 | Heads-up | Table collapses to two seats. Button + SB on one; BB on the other; arrow preflop BTN → BB, then postflop BB → BTN | Heads-up, the button posts the small blind and acts first before the flop, last after it. |
| 49–55 | Rule | TWO PLAYERS' stamps; rule card | Blinds are players' chips. Whoever wins the pot takes them. |

**Cinematic plates:** none. Code-drawn throughout (the real table).

**Truth sheet:** pot 5 + 10 = 15. Order of action: six-max preflop UTG HJ CO BTN SB BB, postflop SB BB UTG HJ CO BTN; heads-up preflop BTN/SB then BB, postflop BB then BTN/SB; three-handed preflop BTN SB BB, postflop SB BB BTN (`order: ...`). **Engine confirm:** Flop52's heads-up engine posts SB on the button and orders actions as above. This plan did not read the engine, so check it before the film is drawn.

---

## `r-actions`: Fold, Check, Call, Bet, Raise (KEEP `betting-actions-workspace-v1`)

| Field | Plan |
|---|---|
| Node and track | `r-actions`, track 1 Rules. Prereqs: `r-seats-blinds`. Legacy: `t0-betting-actions`, `betting-actions-workspace-v1`, KEEP. |
| Objective (tree) | What each action means, when it is allowed and what it costs. In no-limit a raise must be at least the size of the last bet or raise, and when everyone just calls, the big blind keeps the option to check or raise. |
| One idea | Fold gives up the hand. Check passes for free when nothing is owed. Call matches the bet. Bet puts the first chips in a round. Raise makes the bet bigger. In no-limit you can bet any amount up to your stack, and a raise must be at least as big as the last bet or raise. |
| Belief it fixes | "Checking and calling are the same thing." |
| Hook | "Two buttons both keep you in the hand. One costs nothing. Which?" |
| Predict | Facing a bet of 40: *Can you check?* **Yes** / **No**. |
| Build | The real ActionBar. Beside it, a glass panel lists which buttons are **legal right now**, and it updates live as the hand moves. With no bet the legal buttons are Check and Bet. Facing a bet they are Fold, Call (blue, with the amount) and Raise. The minimum-raise rule is drawn as two stacked bars at 5/10. The first raise must go to at least 20 (the 10 bet plus a 10 increment). After a raise to 30, an increment of 20, the next raise must go to at least 50. The limp case: heads-up, the button calls 5 more, the pot is 20, and the big blind owes nothing, so it can **check** (its "option") or raise. |
| Prove | One hand stepped through four times on the same table. Each time a different action is taken at the same moment, and the panel shows what changed in the pot and in who acts next. |
| Transfer | Three quick legality taps: *Nothing to call. Which buttons can you press?* (check, bet; fold is allowed but pointless) · *Facing 40: what does Call cost?* (40) · *Raise to 30 just happened. Smallest re-raise?* (to 50) |
| Rule | "Check costs nothing, and only when nothing is owed. Call matches. Bet starts, raise grows." |
| Checks | The shipped lesson's three hands stay (Ada's flop Q♠ J♥ on Q♦ 8♣ 3♠ facing 30 into 120; the missed river draw facing 100 into 200; the flopped set facing 40 into 120), server-graded by its existing registry. Add the three legality taps above as new guided checks. |
| Formats | table, decision |
| Characters | Ada, as in the shipped lesson. |
| Sound | Silent-complete. |

**KEEP note, glossary fix.** The shipped film says "enough equity" three lessons before `m-equity` defines it. Replace the caption with "enough chance to win", and keep "equity" for the Math Spine. No spot, read or key changes.

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | ActionBar with Check and Call side by side | Two buttons keep you in. One costs nothing. Which? |
| 4–7 | Predict | Facing 40: CAN YOU CHECK? YES / NO | Predict first. |
| 7–15 | Nothing owed | Legal panel: CHECK, BET | Nothing to call? You can check for free, or bet. |
| 15–24 | Facing a bet | Coral 40 slides in; panel: FOLD, CALL 40 (blue), RAISE | Facing a bet, you fold, call the 40, or raise. No check. |
| 24–30 | Answer | NO stamps on the predict card | Checking is only allowed when nothing is owed. |
| 30–42 | No-limit raises | Bars at 5/10: raise to ≥ 20; after a raise to 30, re-raise to ≥ 50; slider caps at the stack | Bet any amount up to your stack. A raise must be at least the last raise. |
| 42–52 | The option | Heads-up: button completes 5; pot 20; BB's panel: CHECK, RAISE | Called to the big blind? It can check or raise: its option. |
| 52–60 | Rule | Rule card; Next: the four betting rounds | Check is free. Call matches. Bet starts, raise grows. |

**Cinematic plates:** none. Code-drawn throughout.

**Truth sheet:** minimum raise at 5/10: to 20; after a raise to 30, to 50 (`actions: ...`). Limped heads-up pot 20, with the big blind owing 0 (`blinds: ...`). The shipped spots are untouched and were verified in the audit. **Engine confirm:** that Flop52 enforces the standard no-limit minimum-raise rule and the big blind's option. Not read by this plan.

---

## `r-streets`: The Four Betting Rounds

| Field | Plan |
|---|---|
| Node and track | `r-streets`, track 1 Rules. Prereqs: `r-actions`. |
| Objective (tree) | Preflop, flop, turn and river: who acts first on each and when the round closes. |
| One idea | Preflop, flop, turn, river. Before the flop, the seat after the big blind acts first. After it, the first seat left of the button still in the hand acts first. A round ends when everyone still in has acted and all bets are matched. |
| Belief it fixes | "The player who bet last always acts first on the next street." |
| Hook | "You raised last before the flop. Who speaks first on the flop?" |
| Predict | Heads-up, you are on the button and raised preflop: **You** / **Them**. |
| Build | A street rail across the top (Preflop · Flop · Turn · River). Each segment fills as its round closes. The violet action arrow shows who is to act. A "round closed" lock snaps when bets are matched and everyone has acted. The board deals three cards, then one, then one, with a card slam each time. |
| Prove | The same seat order on all three later streets, whoever bet last. Shown heads-up and then six-max: the button acts last on flop, turn and river every time. |
| Transfer | Six-max quiz: *SB, BB and CO see a flop. Who acts first?* (SB) · *SB folds. Who is first on the turn?* (BB) |
| Rule | "After the flop, the first seat left of the button acts first, every street." |
| Checks | Guided → practice → fresh: tap who acts next, and tap when the round is closed (server-graded). |
| Formats | table |
| Characters | None. |
| Sound | Silent-complete. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Heads-up: you (BTN) raise to 30, they call | You raised last before the flop. Who speaks first on the flop? |
| 4–7 | Predict | YOU / THEM | Predict first. |
| 7–15 | Preflop | Rail: PREFLOP fills; arrow BTN → BB; lock snaps on the call; pot 60 | Preflop: button first heads-up. The round closes when bets match. |
| 15–23 | Flop | Three cards slam; arrow jumps to BB | The flop: three shared cards. The big blind acts first now. |
| 23–28 | Answer | THEM stamps | Order follows the seats, not who bet last. |
| 28–36 | Turn, river | One card each; arrow BB first both times; button last | Turn and river: one card each, same order. |
| 36–48 | Six-max | Table opens to six; flop with SB, BB, CO; arrow SB → BB → CO; SB folds; turn arrow BB → CO | With more players, the first seat left of the button still in acts first. |
| 48–55 | Rule | Rule card; Next: Showdown | Four rounds. After the flop, left of the button speaks first. |

**Cinematic plates:** none. Code-drawn throughout.

**Truth sheet:** action orders on every street (`order: ...`). Preflop pot 15 + 25 + 20 = 60 (`first hand: pot 60 after preflop`).

---

## `r-showdown`: Showdown and Split Pots

| Field | Plan |
|---|---|
| Node and track | `r-showdown`, track 1 Rules. Prereqs: `r-best-five`, `r-streets`. |
| Objective (tree) | How a pot is won without a showdown, how hands are compared at showdown, and when chips are split. |
| One idea | A pot is won when everyone else folds, with no cards shown, or at showdown, where the best five wins and exact ties split the pot evenly. If there was a river bet, the last player to bet or raise shows first. If the river checks through, the first player left of the button shows first. |
| Belief it fixes | "You must show your cards to win." |
| Hook | "Four players, one pot, and no one shows a card. Who wins it?" |
| Predict | *Can you win a pot without showing your cards?* **Yes** / **No**. |
| Build | Two ends of a hand on the real table. (a) A bet, everyone folds, the pot slides to the bettor, and the cards go face down into the muck. (b) Showdown: the cards turn in order (a violet "shows first" tag on the last river aggressor), both best fives lift, and the winner's five locks. Split-pot rules are drawn as a pot cutting into equal stacks. |
| Prove | Three splits. Heads-up on K♣ K♦ 9♥ 9♠ A♥: Q♠ J♦ and Q♥ T♣ both play the board (K-K-9-9-A), so 300 splits 150 / 150. Change one card: against 9♣ 2♦, the nine makes nines full of kings and wins outright. Three-way on T♠ 9♦ 8♣ 2♥ 2♠: J♣ 7♦ and J♥ 7♠ both make the J-high straight and split 450 at 225 each; A♣ A♦ (aces and twos) gets nothing. |
| Transfer | A fresh showdown where the learner taps the winner, or "split", before the reveal. |
| Rule | "Win when they fold, or with the best five at showdown. Exact ties split." |
| Checks | Guided → practice → fresh *Who wins?* (winner or split), server-graded. A delayed check mixes in a kicker spot from `r-best-five`. |
| Formats | table, decision |
| Characters | Ace Andy as the rival on the table beats. |
| Sound | Silent-complete. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Four-handed: a bet, three folds, pot slides; no card turns | One pot, no cards shown. Who won it? |
| 4–7 | Predict | YES / NO: win without showing? | Predict first. |
| 7–14 | No showdown | The bettor's cards go face down into the muck | Everyone else folded. The last player in wins without showing. |
| 14–18 | Answer | YES stamps | You don't need to show to win. |
| 18–30 | Showdown order | Heads-up river: Andy bets, you call; violet "SHOWS FIRST" tag on Andy; then a checked-through river with the tag on the big blind | Called on the river? The last bettor shows first. Checked through? First seat left of the button. |
| 30–40 | Split | K♣ K♦ 9♥ 9♠ A♥; Q♠ J♦ vs Q♥ T♣; fives lift identical; SPLIT; 300 → 150 + 150 | Same best five? The pot splits evenly. |
| 40–47 | One card changes it | Swap Andy's hand to 9♣ 2♦; full house locks; pot slides whole | One card in the right hand breaks the tie. |
| 47–55 | Three-way | T♠ 9♦ 8♣ 2♥ 2♠; two J-high straights split 450 → 225 each; aces dim | Ties can cut a pot between any number of players. |
| 55–60 | Rule | Rule card; Next: All-ins and side pots | Win when they fold, or with the best five. Exact ties split. |

**Cinematic plates (generate):** P1, low-angle close-up of a hand sliding two face-down cards into a pile of other face-down cards (backs only), cool rim light, slow motion, 2 s, behind the "muck" beat. Code-drawn: everything else.

**Truth sheet:** the K K 9 9 A board splits Q♠ J♦ with Q♥ T♣. 9♣ 2♦ makes a full house and wins. 300 / 2 = 150. T♠ 9♦ 8♣ 2♥ 2♠: J♣ 7♦ and J♥ 7♠ split, A♣ A♦ loses, and 450 / 2 = 225 (`showdown: ...`). **Engine confirm:** odd-chip handling on an uneven split, and the show-order rule if Flop52 lets a loser muck. All split pots in this plan are even, so no odd chip appears on screen.

---

## `r-all-in-side-pots`: All-Ins and Side Pots

| Field | Plan |
|---|---|
| Node and track | `r-all-in-side-pots`, track 1 Rules. Prereqs: `r-showdown`. |
| Objective (tree) | A player can only win what they matched; extra chips form a side pot. |
| One idea | You can only win from each opponent what you matched. Chips beyond the shortest all-in form a side pot that only the players who paid into it can win. |
| Belief it fixes | "An all-in player can win chips they never covered." |
| Hook | "She's all-in for 50. The pot is 1,000. How much can she win?" |
| Predict | Drag a marker: **0 · 50 · 200 · 500 · 1,000**. |
| Build | **Stacked-pot diagram** (glass, on near-black). Each player's contribution is a column of white chips. Horizontal cut lines at each all-in level slice the columns into layers, and each layer slides into its own gold pot labelled with who is eligible. Worked in three steps: **heads-up** (you are all-in for 400, they have 1,000: they put in only 400, the pot is 800, and the rest never leaves their stack), then **three-way**, then **four-way**. |
| Prove | The four-way hand played out on the real table. A is all-in for 50, B for 150, and C and D both put in 400. **Main pot 200** (50 × 4, all four eligible), **side pot 1: 300** (100 × 3, B C D), **side pot 2: 500** (250 × 2, C D), total 1,000. Board Q♠ J♦ 7♣ 7♥ 2♠. B (Q♣ Q♦, queens full) wins main + side 1 = **500**. A (7♠ 2♦, sevens full, the second-best hand) wins **nothing**: B beat A in the only pot A could win. D (J♣ T♣, two pair) wins side 2 = **500** over C (A♥ K♥, a pair). Payouts total 1,000. |
| Transfer | Worked → faded. Three-way: A is all-in for 100, B for 300, and C covers both and calls 300. The learner builds the cut lines: **main 300** (A B C), **side 400** (B C), total 700. Then the faded step: *A has the best hand and C beats B. Who gets what?* (A 300, C 400, B 0). Finally an uncalled bet: you shove 600 and they call all-in for 250, so 500 is contested and **350 comes straight back to you**. |
| Rule | "Win only what you matched. The rest is a side pot for those who paid it." |
| Checks | Guided (cut-line builder) → practice (three-way payouts) → fresh (a new four-way), server-graded on the pot amounts and winners. |
| Formats | table, worked |
| Characters | A rival's all-in moment, Ace Andy's shove, sits on the hook for drama. |
| Sound | Silent-complete. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate (2 s): a tall chip tower topples in slow motion. Cut: A's 50 all-in, the pot rises to 1,000 | She's all-in for 50. The pot is 1,000. What can she win? |
| 4–8 | Predict | Marker 0 · 50 · 200 · 500 · 1,000 | Predict first. |
| 8–18 | Heads-up | You shove 400, they have 1,000 and call; only 400 of theirs moves; pot 800 | You can only be called for what you have. Pot: 800. |
| 18–34 | Cut lines | Four columns 50 / 150 / 400 / 400; cuts at 50 and 150; layers slide: 200 (ABCD), 300 (BCD), 500 (CD) | Each all-in cuts a layer. Each layer is its own pot. |
| 34–40 | Answer | 200 stamps on A's marker | She can win the 200 main pot, no more. |
| 40–58 | Showdown | Board Q♠ J♦ 7♣ 7♥ 2♠; hands flip; B's queens full takes 200 + 300 (count-up 500); A's sevens full gets nothing; D's two pair beats C for 500 | Best hand takes the pots it's in. The next pot goes to the best hand left. |
| 58–66 | Second best, nothing | A's 7♠ 2♦ highlighted, empty tray; D's tray 500 | The second-best hand can win nothing, and a weaker one can win the biggest pot. |
| 66–71 | Uncalled | You shove 600, they call 250; 350 slides back | Chips nobody can match come straight back. |
| 71–75 | Rule | Rule card; Next: Your first full hand | Win only what you matched. |

**Cinematic plates (generate):** P1, a tall stack of unmarked poker chips (plain colours, no numbers or logos) toppling in slow motion on felt, a dramatic side light, low locked-off camera, 2 s. Code-drawn: every column, cut line, pot, label, card and payout.

**Truth sheet:** heads-up pot 800. Three-way main 300 (A B C) and side 400 (B C), total 700; with A best then C, A gets 300 and C 400. Four-way pots are 200 / 300 / 500 = 1,000. On Q♠ J♦ 7♣ 7♥ 2♠ the hands rank B (queens full) > A (sevens full) > D (jacks and sevens) > C (pair of sevens, A-K). Payouts: B 500, D 500, A 0, C 0. Uncalled: 500 contested, 350 returned (`side pots: ...`, using `buildPots`/`award` and the scorer).

---

## `r-first-hand`: Your First Full Hand

| Field | Plan |
|---|---|
| Node and track | `r-first-hand`, track 1 Rules. Prereqs: `r-all-in-side-pots`. |
| Objective (tree) | Play one guided hand start to finish on the real table with every rule in action. |
| One idea | You can play a whole hand, blinds to showdown, using every rule from this track. |
| Belief it fixes | none (tree leaves it empty). |
| Hook | "Everything you've learned, in one hand. Ready?" |
| Predict | None; this lesson is the transfer. |
| Build | A 45 s intro film shows the rule chips from this track snapping into a toolbelt. Then a **guided hand on the real table** against Ada. Every decision point pauses with a small rules prompt (*Which buttons are legal?* *Who acts first?* *What's in the pot?*). Those prompts are graded. The poker choices (raise, bet, call) are the learner's own and are **not graded**. |
| Prove | After showdown, a "rule replay" scrubber highlights each rule as it happened: blinds, order, legal actions, round closing, show order, best five. |
| Transfer | The end card goes straight to **Play a hand**: a no-stakes heads-up hand against a rookie bot with the same rule prompts available on request. |
| Rule | "You can play a full hand." |
| Checks | Rules prompts at each pause (server-graded on legality and facts, not strategy). A delayed check: the same prompts on a fresh hand. |
| Formats | table, decision |
| Characters | Ada as the opponent and coach voice. |
| Sound | Silent-complete. |

**The guided hand.** Heads-up, blinds 5 / 10, both stacks 1,000. You are on the button with A♠ Q♦; Ada has K♥ J♥. The script below is the suggested line. Where the learner may choose differently, the hand still plays out legally, and only the rules prompts are graded.

| Step | Action | Pot | Rules prompt (graded) |
|---|---|---|---|
| Blinds | You post 5 (button = small blind), Ada posts 10 | 15 | *Who posts the small blind heads-up?* (you, the button) |
| Preflop | You act first: raise to 30. Ada calls 20 more | 60 | *Who acts first before the flop?* (you) |
| Flop A♦ 8♥ 4♣ | Ada checks. You bet 40. Ada calls | 140 | *Ada checked. Which buttons can you press?* (check or bet) · *Name your hand* (pair of aces) |
| Turn 9♠ | Ada checks, you check | 140 | *Is the round closed?* (yes: both acted, nothing owed) |
| River 2♣ | Ada bets 70. You choose **call** or fold (raise also legal, not prompted) | 280 if called | *What does calling cost?* (70) |
| Showdown | Ada shows first (last river bettor): king high. Your pair of aces wins | 280 → you | *Who shows first?* (Ada) |
| Result | Stacks 1,140 / 860 (if called). If you fold: Ada takes 140 and her 70 comes back, so the stacks are 930 / 1,070 | | none. The caption says the result does not grade the river choice, and that `m-pot-odds` teaches that decision. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–5 | Hook | Plate (3 s): an empty seat pulled out at a lit table, inviting. Cut to the Flop52 table with your seat glowing | Everything you've learned, in one hand. |
| 5–25 | The toolbelt | Rule chips from the track (Deck, Rankings, Best five, Blinds, Actions, Rounds, Showdown, Side pots) slam into a belt one by one | Every rule you need is already in your hands. |
| 25–38 | How it works | Mock pause card: "Who acts first?" with a tap; the decision buttons glow but have no grade marks | We'll pause to check the rules. Your poker choices are yours. |
| 38–45 | Go | Ada sits down; Start hand | Your first full hand. Deal. |

**Cinematic plates (generate):** P1, a chair being pulled out from a warm-lit card table in an otherwise dark room, an inviting mood, a slow push toward the empty seat, 3 s. Code-drawn: the toolbelt chips, the table and the whole hand.

**Truth sheet:** pots 15 → 60 → 140 → 140 → 280. Each player puts in 140. Final stacks 1,140 / 860 (total 2,000); the fold branch gives 930 / 1,070. A♠ Q♦ on A♦ 8♥ 4♣ 9♠ 2♣ is a pair of aces; K♥ J♥ is high card, holding only three hearts (`first hand: ...`).
