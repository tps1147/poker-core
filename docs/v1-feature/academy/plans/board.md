# Track 2 lesson plans: Reading the Board

Plans for every `board` node of `src/learn/v1/academyTree.mjs` (draft 0), in the field list of `../LESSON-PLAN-FORMAT.md`. Every card and count here is enumerated by `check-welcome-rules-board.mjs` in this folder, which tries every possible opponent hand or next card. Nothing is estimated.

## Direction for the whole track

The board is the star of this track. Diagram beats lift the board off the table into a glass "lens": the five shared cards enlarged, with code overlays showing which cards connect, match suits or pair. Table beats put it back on the real Flop52 felt. Game feel goes where the answer lands. A "possible hands" counter rolls up or down as each street slams in. The nuts gets a crown-shaped highlight ring (a code glyph). A counterfeited hand cracks and greys. Results never grade a decision, so in every lesson the many-repetitions view is the **full list of hands**, not a single opponent. No percentages are shown here, because `m-outs` and the Math Spine come next. Counts are fine, and they set up outs.

Colour carries the house meanings: green is your hand, coral is hands that beat you, gold is the pot. This track adds one meaning: **grey marks a tie or a card that doesn't play.**

Cinematic plates in this track are limited to one short (2–3 s) establishing plate per film. Every card, count and highlight is code.

| Node | Legacy | Film |
|---|---|---|
| `b-made-vs-draw` | none (new) | 55 s |
| `b-the-nuts` | none (new) | 65 s |
| `b-what-beats-you` | none (new) | 70 s |
| `b-kickers-counterfeit` | none (new) | 65 s |
| `b-texture-read` | none (new; feeds `f-board-texture`) | 60 s |

---

## `b-made-vs-draw`: Made Hands and Draws

| Field | Plan |
|---|---|
| Node and track | `b-made-vs-draw`, track 2 Board. Prereqs: `r-best-five`. |
| Objective (tree) | A made hand already ranks; a draw needs more cards to become one. |
| One idea | A made hand already ranks. A draw is not a hand yet: it needs more cards to become one. |
| Belief it fixes | "A four-card flush is a flush." |
| Hook | "Four hearts. Do you have a flush?" |
| Predict | You hold A♥ 5♥ on K♥ 9♥ 2♣ 7♠: **Flush** / **Not yet**. |
| Build | The board lens. Your four hearts glow with an empty fifth slot outlined in dashes. The hand label reads **ACE HIGH**, so the evaluator itself says it's not a flush. Then the unseen cards fan out as a strip and the ones that fill the slot light up: **9 of the 46**. A second draw, the open-ended straight 8♠ 7♦ on 6♣ 5♥ K♦, has two dashed slots, one at each end, and **8 cards** (four 4s, four 9s) light up out of 47. A made hand for contrast: K♣ J♠ on K♦ 8♥ 3♣ already reads **PAIR OF KINGS**, with no dashed slot. |
| Prove | The same draw shown on many runouts: the strip of unseen cards. Most cards miss and only the lit ones complete it, so "a draw is a hand" fails on most of the strip. |
| Transfer | Faded: J♦ T♥ 3♠ with 9♣ 8♣ (two dashed ends: 7 or Q, 8 cards) against 9♣ 7♣ (one dashed gap: only an 8, 4 cards). The learner taps the cards that complete each. |
| Rule | "A draw is a promise, not a hand. Read what you have now." |
| Checks | Guided → practice → fresh: *Made hand or draw?* and *which cards complete it?* (server-graded on the set of ranks or suits). |
| Formats | table, decision |
| Characters | None. |
| Sound | Silent-complete. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate (2 s): a hand fanning cards close to the chest, backs only. Cut: A♥ 5♥ + K♥ 9♥ 2♣ 7♠ | Four hearts. Do you have a flush? |
| 4–7 | Predict | FLUSH / NOT YET | Predict first. |
| 7–15 | Not yet | Lens: four hearts, dashed fifth slot; label ACE HIGH | Four hearts isn't a flush. Right now you have ace high. |
| 15–24 | What completes it | 46-card strip; 9 hearts light up and tally | 9 of the 46 cards you can't see would make it. |
| 24–28 | Answer | NOT YET stamps | A draw needs another card. |
| 28–38 | Straight draw | 8♠ 7♦ on 6♣ 5♥ K♦; dashed slots at both ends; 4s and 9s light (8) | Four in a row, open at both ends: 8 cards complete it. |
| 38–46 | Made hand | K♣ J♠ on K♦ 8♥ 3♣; label PAIR OF KINGS; no dashed slot | A made hand already ranks. It doesn't need help. |
| 46–55 | Rule | Rule card; Next: The nuts | A draw is a promise, not a hand. |

**Cinematic plates (generate):** P1, a player's hand tilting two face-down cards up to peek (backs only, no faces visible), a tight close-up, soft side light, slow push-in, 2 s.

**Truth sheet:** A♥ 5♥ on K♥ 9♥ 2♣ 7♠ is High Card, cross-checked with `pokerEvaluator.js`; 9 of 46 rivers make a flush. 8♠ 7♦ on 6♣ 5♥ K♦ is eight high; 8 of 47 turn cards (every 4 and 9) make a straight. K♣ J♠ on K♦ 8♥ 3♣ is One Pair. 9♣ 8♣ on J♦ T♥ 3♠ has 8 completing cards (7, Q); 9♣ 7♣ has 4 (the 8s) (`draw: ...`).

---

## `b-the-nuts`: The Nuts

| Field | Plan |
|---|---|
| Node and track | `b-the-nuts`, track 2 Board. Prereqs: `b-made-vs-draw`. |
| Objective (tree) | The best possible hand on a given board, and how it changes street by street. |
| One idea | The nuts is the best possible hand on this board, and it can change with every card that comes. |
| Belief it fixes | "Top pair is always the nuts." |
| Hook | "You have top pair with the best kicker. Is anything better possible?" |
| Predict | A♣ K♣ on K♠ Q♦ 7♥ 4♣ 2♠: **Nothing beats it** / **Something could**. |
| Build | **Toy: "Find the nuts."** The board sits in the lens and the learner drags any two cards from a 47-card tray into a hole slot. The hand label updates live, and a crown ring appears when the pair dropped in is the best possible. On K♠ Q♦ 7♥ 4♣ 2♠ (no flush and no straight possible) the crown goes to **K-K, a set of kings**, and only three combos get it. A♣ K♣ reads pair of kings, with no crown. |
| Prove | The nuts changes street by street on one board, and the toy is re-scored on every card. **Flop 9♠ 8♠ 2♦:** the crown sits on a set of nines; no straight or flush is possible yet. **Turn 7♠:** the crown jumps to **J♠ T♠**, a jack-high straight flush and the only combo that makes it. T♠ 6♠ is a straight flush too, but lower. **River 2♣:** the board pairs, but the crown stays on J♠ T♠. Two more boards: **A♥ K♥ 7♥** gives the crown to **Q♥ J♥** alone (an A-K-Q-J-7 flush). A **royal flush on the board** puts the crown on every hand: all **1,081** combos tie. |
| Transfer | A fresh board in the toy. The learner places the nuts first; the crown confirms. |
| Rule | "The nuts is the best hand this board allows. Recheck it every street." |
| Checks | Guided (toy with hints) → practice → fresh: *Which two cards are the nuts?* (server-graded against the full enumeration). |
| Formats | toy, decision |
| Characters | None. |
| Sound | Silent-complete. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate (2 s): a crown-shaped glint of light on dark felt (abstract, no cards). Cut: A♣ K♣ on K♠ Q♦ 7♥ 4♣ 2♠ | Top pair, best kicker. Is anything better possible? |
| 4–7 | Predict | NOTHING BEATS IT / SOMETHING COULD | Predict first. |
| 7–17 | Find it | Toy: pairs drop into the slot; K-K takes the crown; A-K label "pair of kings" | Try every two cards. Best possible here: a set of kings. |
| 17–21 | Answer | SOMETHING COULD stamps | Top pair isn't the nuts. A set beats it. |
| 21–30 | Flop | 9♠ 8♠ 2♦; crown on 9-9 | On this flop, the nuts is a set of nines. |
| 30–42 | Turn | 7♠ slams; crown flies to J♠ T♠; label JACK-HIGH STRAIGHT FLUSH; T♠ 6♠ shown below it, smaller | One card changes it. Now only jack-ten of spades is the nuts. |
| 42–48 | River | 2♣ slams; board pairs; crown holds | The board paired, and the crown didn't move. |
| 48–56 | Two more | A♥ K♥ 7♥: crown on Q♥ J♥. Royal on board: crown on every seat, "1,081 tie" | Sometimes one hand is the nuts. Sometimes everyone is. |
| 56–65 | Rule | Rule card; Next: What beats you | The nuts is the best this board allows. Recheck every street. |

**Cinematic plates (generate):** P1, an abstract golden glint sweeping across dark green felt, with no cards and no objects, a slow lateral move, 2 s.

**Truth sheet:** K♠ Q♦ 7♥ 4♣ 2♠: the nuts is three of a kind, K-K only, 3 combos; A-K is below it. 9♠ 8♠ 2♦: the nuts is a set of nines. Turn 7♠: J♠ T♠ straight flush is the unique nut combo, and T♠ 6♠ is a lower straight flush. River 2♣: still J♠ T♠ alone. A♥ K♥ 7♥: Q♥ J♥ is the unique nut flush. A royal on the board: all C(47,2) = 1,081 combos tie (`nuts: ...`, a full enumeration of all two-card hands).

---

## `b-what-beats-you`: What Beats You

| Field | Plan |
|---|---|
| Node and track | `b-what-beats-you`, track 2 Board. Prereqs: `b-the-nuts`. |
| Objective (tree) | List the hands that beat yours on this board before you put more chips in. |
| One idea | Before you put more chips in, list the hands that beat yours on this board. |
| Belief it fixes | "If you can't see a better hand, there isn't one." |
| Hook | "Top pair, good kicker. How many hands beat you?" |
| Predict | A♥ Q♦ on the turn A♦ J♠ 8♠ 4♣. Drag a marker: **0 · about 10 · about 60 · about 300**. |
| Build | The **beat list**, built on the board lens. The learner works it as a worked example: *What could beat a pair of aces here?* Coral rows slide in one family at a time, each with a count × combos tally that stamps. **Sets: 10** (A-A 1, J-J 3, 8-8 3, 4-4 3). **Two pair: 45** (A-J 6, A-8 6, A-4 6, J-8 9, J-4 9, 8-4 9). **A better kicker: 8** (A-K). Running total **63**. A grey row: **6 combos tie** (the other A-Q). A struck-through row: **straights and flushes: none yet**. |
| Prove | The full grid: all **1,035** two-card hands the opponent could hold (46 unseen cards), drawn as a dot field. 63 coral, 6 grey, the rest green. The total is many-hands honest: it shows how many hands beat you, not whether this opponent has one. |
| Transfer | Faded: the river 5♠ lands and the learner adds the new rows first. Then the reveal: **flushes 45** (any two of the 10 unseen spades) and **straights 30** (7-6 and 3-2; the 7♠ 6♠ and 3♠ 2♠ combos count as flushes instead). |
| Rule | "Name what beats you before you bet." |
| Checks | Guided (beat-list builder) → practice → fresh: *Tap every hand family that beats you* (server-graded on families; counts shown afterwards). |
| Formats | worked, decision |
| Characters | Mina (the Math Spine coach) previews the counting habit on the welcome card. |
| Sound | Silent-complete. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate (2 s): a rival's eyes in shadow over steepled hands (a stylised generated figure, not a real person). Cut: A♥ Q♦ on A♦ J♠ 8♠ 4♣ | Top pair, good kicker. How many hands beat you? |
| 4–8 | Predict | Marker 0 · ~10 · ~60 · ~300 | Predict first. |
| 8–18 | Sets | Row: A-A 1, J-J 3, 8-8 3, 4-4 3 → 10 stamps | Any pair that matches the board: 10 sets. |
| 18–30 | Two pair | Row: six pairings, combos tally to 45 | Two board cards in their hand: 45 ways to two pair. |
| 30–36 | Kicker | Row: A-K 8 | Same pair, higher kicker: 8 more. |
| 36–42 | Total | Counter 63 (coral) and tie 6 (grey) | 63 hands beat you, and 6 tie. |
| 42–47 | Answer | ~60 stamps | More than you'd see at a glance. |
| 47–56 | The field | 1,035-dot field; 63 coral, 6 grey | Out of 1,035 possible hands. Most are worse, but not all. |
| 56–65 | River | 5♠ slams; new rows: flushes 45, straights 30 | One card adds flushes and straights to the list. |
| 65–70 | Rule | Rule card; Next: Kickers and counterfeits | Name what beats you before you bet. |

**Cinematic plates (generate):** P1, a stylised, non-photoreal rival figure at a dim table, steepled hands, eyes in shadow, an anonymous invented character, a slow push-in, 2 s. It must not resemble any real player.

**Truth sheet:** 46 unseen cards make 1,035 combos. 63 beat A♥ Q♦ on A♦ J♠ 8♠ 4♣: 10 sets (A-A 1, J-J 3, 8-8 3, 4-4 3), 45 two pair, and 8 A-K. 6 tie. No straight or flush is possible on the turn. River 5♠: 45 flush combos beat you, and 30 straight combos (7-6 and 3-2, excluding the two suited spade combos that are flushes) (`beats: ...`).

---

## `b-kickers-counterfeit`: Kickers and Counterfeits

| Field | Plan |
|---|---|
| Node and track | `b-kickers-counterfeit`, track 2 Board. Prereqs: `b-what-beats-you`. |
| Objective (tree) | How the board can play for everyone or make your hand worse. |
| One idea | The board can play for everyone, and a new board card can make your hand worse by "counterfeiting" the part only you had. |
| Belief it fixes | "Two pair on the board helps the player with the pocket pair most." |
| Hook | "You had two pair. A card came that didn't help them, and now you lose. How?" |
| Predict | A♥ 3♣ against A♣ K♦ on A♠ 3♦ 9♣; the turn is 9♥: **You still win** / **They win now**. |
| Build | **Contrast, side by side.** Left: the flop. Your A-A-3-3-9 beats their A-A-9-K-3 (two pair against one pair). Right: the 9♥ lands. Now you have aces and nines with a 3 kicker; they have aces and nines with a **king** kicker. Your threes crack and grey, counterfeited, because the board's pair of nines is better than your threes and everyone shares it. |
| Prove | The double-paired board, run against every opponent. 4♠ 4♦ on K♣ K♥ 9♦ 9♠ Q♣ plays the board: the best five is K-K-9-9-Q, and the fours don't play. It **splits** with J♣ 2♥, which also plays the board, and **loses to any ace** (K-K-9-9-A). Across all **990** opponent hands, **457 beat your fours**. The board's two pair helped every hand except yours. Then a kicker contrast: on A♦ 8♣ 5♥ 3♠ T♣, A♠ K♦ (A-A-K-T-8) beats A♥ J♦ (A-A-J-T-8). |
| Transfer | A fresh river where the learner first marks whether their hand is still theirs or counterfeited. |
| Rule | "When the board pairs, ask: does my hand still use my cards?" |
| Checks | Guided → practice → fresh *Who wins, or split?* with counterfeits and kickers (server-graded). |
| Formats | contrast, decision |
| Characters | Ace Andy holds the A-K, for the "they didn't improve, you got worse" moment. |
| Sound | Silent-complete. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate (2 s): a glass pane cracking in slow motion (abstract). Cut: A♥ 3♣ vs A♣ K♦ on A♠ 3♦ 9♣ | You had two pair. Then you lost. How? |
| 4–8 | Predict | YOU STILL WIN / THEY WIN NOW | Turn: 9♥. Predict first. |
| 8–18 | The flop | Left panel: your five A A 3 3 9 lifts; theirs A A K 9 3 | On the flop, your two pair beats their aces. |
| 18–30 | Counterfeit | 9♥ slams; your threes crack and grey; fives become A A 9 9 3 vs A A 9 9 K; their K wins (slam) | The nines on board outrank your threes. Their king kicker wins. |
| 30–34 | Answer | THEY WIN NOW stamps | They didn't improve. Your hand got worse. |
| 34–46 | Board plays | 4♠ 4♦ on K♣ K♥ 9♦ 9♠ Q♣; fours grey; vs J♣ 2♥ SPLIT; vs A♦ 2♥ they win | Two pair on the board: your fours don't play. |
| 46–55 | The field | 990-dot field; 457 coral | 457 of 990 hands beat your pocket pair here. |
| 55–61 | Kicker | A♦ 8♣ 5♥ 3♠ T♣: A-K vs A-J; K slams over J | Same pair? The kicker decides. |
| 61–65 | Rule | Rule card; Next: Board shapes | When the board pairs, check your hand still uses your cards. |

**Cinematic plates (generate):** P1, an abstract slow-motion crack spreading across a dark glass pane, cold light, locked-off macro, 2 s.

**Truth sheet:** flop A♠ 3♦ 9♣: A♥ 3♣ (two pair) beats A♣ K♦. Turn 9♥: A-A-9-9-3 against A-A-9-9-K, and A-K wins. 4♠ 4♦ on K♣ K♥ 9♦ 9♠ Q♣ plays K-K-9-9-Q, splits with J♣ 2♥, loses to A♦ 2♥, and is beaten by 457 of the 990 opponent combos. A-K beats A-J on A♦ 8♣ 5♥ 3♠ T♣ (`counterfeit: ...`, `kicker: ...`). **Engine note:** the shared `compareHands` calls both the 9♥ turn and the A-K against A-J spot ties, because it doesn't compare two-pair or one-pair kickers. The script records this. Grading must use a kicker-aware comparison.

---

## `b-texture-read`: Board Shapes

| Field | Plan |
|---|---|
| Node and track | `b-texture-read`, track 2 Board. Prereqs: `b-made-vs-draw`. |
| Objective (tree) | Paired, suited, connected, dry: what each shape allows. |
| One idea | Paired, suited, connected or dry: the shape of the board decides which hands are possible right now and which are only drawing. |
| Belief it fixes | "Every flop is equally dangerous." |
| Hook | "Five flops. On which can someone already have a straight, a flush or a full house?" |
| Predict | Tap the flops where a flush is already possible: K♦ 7♣ 2♠ · K♥ K♣ 4♦ · A♥ 8♥ 3♥ · 9♣ 8♦ 7♠ · J♥ T♥ 4♣. |
| Build | **Toy: the shape sorter.** Five flop cards sit in the lens, and four shape badges (PAIRED, SUITED, CONNECTED, DRY) light from the cards themselves: matching ranks, matching suits, ranks within a five-card window. Under each flop a **"possible now"** strip lists the categories some two cards can already make, computed over every hand. A **"drawing to"** strip lists what needs another card. |
| Prove | All hands, every flop, enumerated: **K♦ 7♣ 2♠** (dry): the best possible now is a set; no straight, flush or full house. **K♥ K♣ 4♦** (paired): a full house and four of a kind are possible now; no straight or flush. **A♥ 8♥ 3♥** (monotone): a flush is possible now, **45 combos** (any two of the 10 unseen hearts); no straight. **9♣ 8♦ 7♠** (connected): a straight is possible now, **48 combos** (J-T, T-6, 6-5); no flush. **J♥ T♥ 4♣** (two-tone, two connected): nothing beyond a set yet, but **55 flush-draw combos** and **48 open-ended straight-draw combos** (K-Q, Q-9, 9-8). |
| Transfer | A fresh flop. The learner sets the badges and the "possible now" strip first, then the toy reveals the enumeration. |
| Rule | "Read the shape first: what's possible now, and what's still coming." |
| Checks | Guided → practice → fresh: *Which hand types are possible right now?* (server-graded against the enumeration). Feeds `f-board-texture`, which adds ranges. |
| Formats | toy, decision |
| Characters | None. |
| Sound | Silent-complete. |

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate (3 s): five different landscapes cross-dissolving, a flat desert, twin peaks, a river delta, a staircase canyon, rolling dunes (texture metaphors, no cards). Cut: five flops in a row | Five flops. Where is a big hand already possible? |
| 4–8 | Predict | Tap flops where a flush is possible | Predict first: where could someone have a flush now? |
| 8–16 | Dry | K♦ 7♣ 2♠; badge DRY; possible now: up to a set | Dry: no pairs, suits or connections. A set is the best hand. |
| 16–24 | Paired | K♥ K♣ 4♦; badge PAIRED; possible now adds full house, four of a kind | Paired: full houses and quads are already possible. |
| 24–33 | Suited | A♥ 8♥ 3♥; badge SUITED (×3); flush 45 combos | Three of one suit: someone can already have a flush. |
| 33–37 | Answer | Only the A♥ 8♥ 3♥ flop stays lit | Only the three-suited flop allows a flush now. |
| 37–46 | Connected | 9♣ 8♦ 7♠; badge CONNECTED; straight 48 combos | Connected: straights are already possible. |
| 46–55 | Drawing | J♥ T♥ 4♣; possible now: up to a set; drawing to: flush 55, open-ended straight 48 | Two-tone and close: nothing big yet, but lots of draws. |
| 55–60 | Rule | Five badges; rule card; Next: the Math Spine | Read the shape first: what's possible now, what's coming. |

**Cinematic plates (generate):** P1, a five-shot cross-dissolve of landscapes (flat desert, twin peaks, a river delta, a stepped canyon, dunes), each at golden hour from a high wide aerial with a slow push, about 0.6 s each, 3 s total. Code-drawn: every card, badge, strip and count.

**Truth sheet:** the best possible category per flop over all two-card hands: K-7-2 rainbow is a set. K-K-4 allows a full house and quads, but no straight or flush. A♥ 8♥ 3♥ allows a flush (45 combos) and no straight. 9-8-7 rainbow allows a straight (48 combos) and no flush. J♥ T♥ 4♣ has no straight or flush yet, 55 two-heart combos and 48 open-ended straight-draw combos (K-Q, Q-9, 9-8) (`texture: ...`).
