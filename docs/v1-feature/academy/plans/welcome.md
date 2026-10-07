# Track 0 lesson plans: Welcome to Poker

Plans for every `welcome` node of `src/learn/v1/academyTree.mjs` (draft 0), in the field list of `../LESSON-PLAN-FORMAT.md`. Every number and card here is checked by `check-welcome-rules-board.mjs` in this folder (`node docs/v1-feature/academy/plans/check-welcome-rules-board.mjs`); a truth-sheet line names the check that covers it.

## Direction for the whole track

The owner wants the Welcome track much more animated and gripping. These films should pull a new player into learning and into a first game. Each film has three layers:

1. **Cinematic plates (generated).** Atmosphere, place and people: a riverboat at dusk, a smoky card room, a stadium-lit final table, a server hall. Generated plates never contain text, numbers, chips with readable values, or cards with readable ranks or suits. Each node lists them on a "Cinematic plates" line with subject, mood, camera and length.
2. **The code-drawn diagram.** Every number, card, chip count, grid and timeline year is drawn by code from the truth sheet. It sits on the BitBlur near-black ground with glass panels, and it slides or matte-cuts over a plate. It never sits under the plate.
3. **The real Flop52 table.** Table beats use the shipped table, cards and ActionBar, so the film already looks like the game the learner is about to play.

Game feel goes where the answer lands, in the style of Balatro and Clash Royale. Cards slam onto the felt. Chip totals count up. A count × value tally stamps. A winning five lifts and locks with a short shake. Nothing is spent on decoration. Results never grade a decision: when a hand is won or lost, the next beat shows the many-repetitions view. Every film is silent-complete, with captions of 3–6 s each, at least 54 px at 1080 wide.

The track ends at the table. Each Welcome film's last card offers two buttons, **Next lesson** and **Play a hand**. Play a hand opens a no-stakes heads-up hand against a rookie bot, so learning and playing are offered together from the first minute.

| Node | Status | Film length |
|---|---|---|
| `w-what-is-poker` | **Planned and approved**: `../SAMPLE-LESSON-w-what-is-poker.md`. Included by reference, not rewritten here. | 60 s |
| `w-history` | Planned below. History claims sourced 2026-10-06 (`HISTORY-SOURCES.md`). | 70 s |
| `w-luck-and-skill` | Planned below | 65 s |
| `w-how-deep` | Planned below | 55 s |
| `w-the-academy` | Planned below | 50 s |

For `w-what-is-poker`, this pass adds only a plate list and leaves the approved plan as it is. Plates: (a) a slow push-in on an empty card room at night, warm pendant light over felt, 4 s, behind the hook; (b) a crowd of faceless silhouettes at many tables, shot from above with a slow crane, 3 s, behind the 10 × 10 grid beat. The deck fan, the cards, the table and the grid stay code-drawn as the sample specifies.

---

## `w-history`: A Short History

| Field | Plan |
|---|---|
| Node and track | `w-history`, track 0 Welcome. Prereqs: `w-what-is-poker`. |
| One idea | Across two hundred years the game kept changing shape, but it always rewarded the player who thought better. In the end even computers won by thinking better, not by luck. |
| Belief it fixes | "Poker is a casino game like slots, where the house picks the winner." |
| Hook | "Riverboats, Texas and a computer. What do they have in common?" |
| Predict | Tap one: *In poker, who takes your chips?* **The house** / **The other players**. The answer is revealed at 52 s: other players. The house only takes a fee. |
| Build | A code-drawn timeline rail runs across the bottom third. Each era is a node that lights as its plate plays above it. Years are drawn type. Each era gets one icon chip, a code-drawn glyph: paddle wheel, a Texas star, a bracelet, a laptop, a chip die. No logos and no real people's likenesses. |
| Prove | A side-by-side ends the film. On the left is a slot reel (code-drawn and abstract, with no symbols that look like a real machine) feeding a house bar. On the right is a heads-up table where chips move only between the two players and a thin rake sliver goes to the house. Caption: in poker the chips move between players. |
| Transfer | One tap after the film: *A pro wins a tournament after years of study. Who paid the prize?* **The other players' buy-ins** / **The casino**. The coach explains: the buy-ins, minus a fee. |
| Rule | "Poker is played against people, not the house. Better thinking has always won." |
| Checks | Two comprehension taps, not mastery evidence: Who takes the chips you lose? (the other players) · What did the poker computers do to win? (decide better over many hands) |
| Formats | film |
| Characters | None in the film. The welcome card carries a coach greeting. No real people appear on screen as likeness or generated face. The captions name no real people; sourced names stay in the truth sheet. |
| Sound | Silent-complete. Later: period-flavoured score stings per era, kept off the captions. |

### Film beats (70 s)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate: riverboat at dusk. Timeline rail draws in empty | Riverboats, Texas and a computer. What do they have in common? |
| 4–8 | Predict | Two code buttons: THE HOUSE / THE OTHER PLAYERS | Predict first: in poker, who takes your chips? |
| 8–16 | Riverboats | Plate: lamp-lit cabin, hands and silhouettes, cards face down. Rail node lights at "1830" | By about 1830, poker was played on Mississippi riverboats. [H1 · S1, S2] |
| 16–23 | The deck grows | Code: a 20-card fan (A K Q J T in four suits) opens out into 52 | The first games used just 20 cards. Later the full 52-card deck took over. [H2, H3 · S1, S2, S3] |
| 23–31 | Texas | Plate: dusty small-town street, heat haze, slow dolly. Rail node: "early 1900s" with a star glyph | Tradition says Texas Hold'em, two cards each and five shared, began in Texas. [H4 · S5] |
| 31–38 | Las Vegas and the World Series | Plate: neon street at night (no readable signs), then a crowded tournament hall. Rail nodes: "1960s", then 1970 with a bracelet glyph | Hold'em reached Las Vegas in the 1960s. A world championship began there in 1970. [H5, H6 · S5, S6, S7] |
| 38–45 | The boom | Plate: a living room lit by a laptop, then a packed stadium table. Rail node: 2003. Code counter rolls 839 → 8,773 players (2003 → 2006) | In 2003 an amateur who qualified online won. Three years later the field was ten times bigger. [H8, H9 · S8] |
| 45–52 | The machines | Plate: a cold server hall, slow lateral track. Rail node: 2017, 2019 with a chip-die glyph | Then computers learned it. In 2017 and 2019 programs beat top pros at no-limit Hold'em. [H11, H12 · S11–S15] |
| 52–60 | Answer | Code split screen: slot reel to house bar, versus chips sliding player to player with a rake sliver. Predict answer stamps: THE OTHER PLAYERS | Slots pay the house. Poker chips move between players. The house only takes a fee. [H13 · S16] |
| 60–66 | The thread | Timeline compresses; every node pulses in turn | Every era rewarded the same thing: better decisions. |
| 66–70 | Rule | Rule card. Buttons: Next lesson · Play a hand | Played against people, won by thinking. Next: luck and skill. |

**Cinematic plates (generate):**

| # | Subject | Mood | Camera | Length |
|---|---|---|---|---|
| P1 | Mississippi-style paddle steamer at dusk on a wide river | warm amber, hazy | slow push-in from the bank | 4 s |
| P2 | Lamp-lit riverboat cabin, period clothes, hands around a table, cards face down, faces in shadow | intimate, candle warm | slow orbit at table height | 8 s |
| P3 | Small Texas town main street, early 1900s, empty | heat haze, dusty gold | slow dolly forward | 7 s |
| P4 | Neon-lit desert-city street at night, signs blurred to light only | saturated, electric | high crane down | 3 s |
| P5 | Crowded tournament hall from behind the rail, players as silhouettes | buzzing, spotlight | slow lateral track | 4 s |
| P6 | Dark living room lit only by a laptop screen (screen content blurred) | quiet, blue glow | slow push-in | 3 s |
| P7 | Stadium-lit final table from high above, crowd in darkness | big, theatrical | descending crane | 4 s |
| P8 | Long cold server hall, status LEDs | cool cyan, clinical | slow lateral track | 7 s |

Code-drawn: the timeline rail, every year, every glyph, the 20-card to 52-card fan, the 839 → 8,773 field counter, the slot-versus-table split, the rake sliver, the predict buttons and the rule card.

### Truth sheet: history claims, sourced 2026-10-06

Every claim was checked against the sources in `HISTORY-SOURCES.md` (ids S1–S16). Captions use only the verified wording below. Status: VERIFIED (source supports it), CORRECTED (the planned claim was wrong or imprecise; the wording below replaces it), UNVERIFIED (not stated in the film). No real person is named on screen; names here are for the record only.

| # | Claim as captioned | Verified wording | Status | Sources |
|---|---|---|---|---|
| H1 | By about 1830, poker was played on Mississippi riverboats | Poker was played on Mississippi steamboats by about 1830, and in New Orleans in 1829 (Joseph Cowell's account) | VERIFIED | S1, S2 |
| H2 | The first games used just 20 cards | The earliest recorded American game used a 20-card deck (A K Q J T). Cowell's first-hand account is of New Orleans in 1829, published 1844; Jonathan H. Green's book is 1843. Was: "Green / Cowell in the 1830s" | CORRECTED | S1, S2, S3, S4 |
| H3 | Later the full 52-card deck took over | The 52-card deck replaced the 20-card deck later; draw poker appeared about 1860. Dropped: "by the mid-1800s" and "stud spread around the Civil War" (no reliable source, UNVERIFIED) | CORRECTED | S1, S3 |
| H4 | Tradition says Texas Hold'em began in Texas | By tradition the first hand was dealt in Robstown, Texas, in the early 1900s; the Texas Legislature recognised Robstown as the birthplace in 2007 (H.C.R. 109). Tradition, not documented fact, so the caption says "tradition says". Was: "is traced to Texas" | CORRECTED | S5 |
| H5 | Hold'em reached Las Vegas in the 1960s | Sources disagree on year and place: H.C.R. 109 says the Golden Nugget in 1967; other accounts credit Corky McCorquodale at the California Club in 1963. Caption says only "the 1960s"; no person or casino named. Was: "around 1967, Corky McCorquodale, Golden Nugget" | CORRECTED | S5, S6 |
| H6 | A world championship began there in 1970 | The World Series of Poker began in 1970 at Binion's Horseshoe, Las Vegas (Benny Binion); Johnny Moss was named champion by a player vote | VERIFIED | S5, S7 |
| H7 | (not captioned, background) | From 1971 the championship was a freezeout, won again by Moss. Accounts differ on the 1971 field (six or seven), so no field size is stated | VERIFIED | S7 |
| H8 | In 2003 an amateur who qualified online won | Chris Moneymaker, an amateur (an accountant) who qualified through an online PokerStars satellite, won the 2003 WSOP Main Event. Buy-in and prize figures stay off screen | VERIFIED | S8 |
| H9 | Three years later the field was ten times bigger | WSOP Main Event entrants: 839 in 2003, 8,773 in 2006 (10.5×). Was: "Millions started playing", which has no sourced figure. The World Poker Tour hole-card camera detail rests only on tertiary sources (UNVERIFIED) and is not captioned | CORRECTED | S8 |
| H10 | (optional beat, not captioned) | Polaris (University of Alberta) beat a team of pros at heads-up limit Hold'em in Las Vegas, July 2008; Cepheus "essentially solved" heads-up limit Hold'em (Science, 9 January 2015) | VERIFIED | S9, S10 |
| H11 | In 2017 a program beat top pros at no-limit Hold'em | Libratus (Carnegie Mellon) beat four top pros at heads-up no-limit Hold'em over 120,000 hands, January 2017 (Science, 2018). DeepStack (Alberta) beat pros at heads-up no-limit over 44,000 hands (Science, 2017) | VERIFIED | S11, S12, S13 |
| H12 | In 2019 a program beat top pros | Pluribus (Carnegie Mellon and Facebook AI) beat elite pros at six-player no-limit Hold'em (Science, July 2019) | VERIFIED | S14, S15 |
| H13 | The house only takes a fee | In poker the house does not play against you; it takes a fee (the rake) for running the game. Time charges are not captioned | VERIFIED | S16 |

---

## `w-luck-and-skill`: Luck Decides a Hand, Skill Decides a Thousand

| Field | Plan |
|---|---|
| Node and track | `w-luck-and-skill`, track 0 Welcome. Prereqs: `w-what-is-poker`. |
| One idea | One hand can go either way. Repeat the same good decision many times and it takes the chips. |
| Belief it fixes | "A loss means the decision was bad, a win means it was good." |
| Hook | "You got your chips in ahead and lost. Did you play it wrong?" |
| Predict | Tap one: **Yes, I lost** / **Not necessarily**. No grade. The answer is revisited at the end. |
| Build | Real table, heads-up, on the turn. You hold A♣ J♦ on J♥ T♥ 4♣ 2♠: a pair of jacks with an ace kicker. They hold Q♥ 9♥: four hearts and four to a straight. Both are all-in for 500, so the pot is 1,000. Then the 44 unseen river cards fan out as a code-drawn strip. Each card flips to green (you win) or coral (they win), with a count-up tally: **26 green, 18 coral**. Colours follow house style: green means your chance, coral means their side. |
| Prove | **Toy: "Run it 100 times."** A 10 × 10 grid of players. Each one plays this same all-in N times. The learner drags N: 1 → 10 → 100 → 1,000. Each cell shows whether that player is ahead, level or behind. The share behind is computed exactly by binomial, never by random draws. About 41 in 100 are behind after 1 hand, about 18 in 100 after 10 (and about 21 level), about 3 in 100 after 100, and essentially none after 1,000. Beside the grid, the average per hand stamps: **+90.9 chips**. Over 1,000 hands it counts up to **+90,909**. The grid is labelled "exact odds for this one spot, not a forecast of your results". |
| Transfer | A second river, shown first as a result only: they hit a heart and win. The learner taps *Was getting all-in a mistake?* before the 26/18 strip is replayed for them. Feedback shows the strip, never "wrong". |
| Rule | "Judge the decision by what happens over many hands, not by this one." |
| Checks | Comprehension taps: You lose one hand where you were ahead. What does that tell you about the decision? (nothing by itself) · Which grows more reliable: the result of 1 hand or of 1,000? (1,000) |
| Formats | film, toy |
| Characters | A rival, "Ace Andy", on the table beat, so the all-in has a face. No coach in the film. |
| Sound | Silent-complete. Later: a heartbeat under the river flip, a tally tick per card. |

### Film beats (65 s)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate: a player's silhouette slumps as chips slide away, 2 s; then hard cut to code | You got your chips in ahead and lost. Did you play it wrong? |
| 4–8 | Predict | YES, I LOST / NOT NECESSARILY | Predict first. |
| 8–16 | The spot | Real table: your A♣ J♦, the board J♥ T♥ 4♣ 2♠, Andy's all-in, your call, pot 1,000 counts up (gold) | You have top pair. Andy has a draw. You're both all-in. |
| 16–22 | The reveal | Andy's Q♥ 9♥ flips. Hearts glow; the straight cards (K, 8, Q) outline | He needs a heart, a straight or a queen. |
| 22–32 | All the rivers | 44 cards fan into a strip and flip one by one, accelerating. Green and coral tallies count up and stamp: 26 / 18 | Of the 44 cards left, 26 win for you and 18 win for him. |
| 32–36 | This river | The 7♥ drops on the felt (slam). Andy wins. A small "this hand" label | This time the river is a heart. He wins this hand. |
| 36–48 | Run it again | Table leaves. The 10 × 10 grid appears and N steps 1 → 10 → 100 → 1,000. Coral cells drain away, and the counter reads 41 → 18 → 3 → 0 behind out of 100 | Play this spot again and again. The more you play it, the fewer players end up behind. |
| 48–56 | The average | Chip line rises. +90.9 per hand stamps, then a 1,000-hand count-up to +90,909 | On average, this call earns about 91 chips every time. |
| 56–61 | Answer | Predict answer returns: NOT NECESSARILY stamps | Losing this hand didn't make the decision wrong. |
| 61–65 | Rule | Rule card. Buttons: Next lesson · Play a hand | Luck decides a hand. Skill decides a thousand. |

**Cinematic plates (generate):** P1, a player at a dim card table seen from behind, slumping as an anonymous pile of chips slides away (chips without readable values), moody tungsten light, locked-off camera with a slight push, 2 s. P2, an optional cutaway behind the grid: a crowded hall of tables from high above, figures as silhouettes, slow crane, cool light, 4 s, kept at 30% under the glass panel.

Code-drawn: the table, all cards, the 44-card strip, the tallies, the grid, the counters, the chip line and every number.

### Truth sheet

- Turn J♥ T♥ 4♣ 2♠, your A♣ J♦ against Q♥ 9♥. There are 44 unseen rivers: you win 26 and they win 18, with no ties. Their 18 are 9 hearts, the 3 non-heart kings, 3 non-heart eights and 3 non-heart queens. (Checks `luck: ...` and `category agrees with pokerEvaluator`.)
- Pot 1,000 (500 each). Average for you = 1,000 × 26/44 − 500 = +90.9 per hand, or +90,909 over 1,000 hands.
- Exact binomial with p = 26/44, read as "behind" meaning fewer than half the all-ins won. After 1 hand 40.9% are behind. After 10 hands 18.2% are behind and 20.8% exactly level. After 100 hands 2.6% are behind. After 1,000 hands it is below 0.0001%. On screen these show as "out of 100 players": 41, 18, 3, 0.
- The film shows counts, not percentages, because percentages are taught later in `m-chance-as-share`.
- The 7♥ river: Q♥ 9♥ makes a heart flush and wins. It is one of the 18.

---

## `w-how-deep`: How Deep the Game Goes

| Field | Plan |
|---|---|
| Node and track | `w-how-deep`, track 0 Welcome. Prereqs: `w-luck-and-skill`. |
| One idea | 1,326 starting combinations, four betting rounds and hidden cards make poker a game you can study for life, one idea at a time. |
| Belief it fixes | "Poker is simple once you know the hand rankings." |
| Hook | "You know the rules. How many different ways can a hand start?" |
| Predict | Drag a slider: *How many two-card starting hands are there?* (10 → 10,000, log scale). No grade. The true value lands at 14 s. |
| Build | A code-drawn explosion of counts, each one a count-up with a stamp. The 52-card deck gives 1,326 starting combinations, which fold into 169 distinct starting hands (13 pairs, 78 suited, 78 offsuit), then 19,600 possible flops for your two cards, then 2,118,760 possible five-card boards. Four betting rounds sit as a stacked rail: preflop, flop, turn, river. Each round branches into fold / call / raise, drawn as a decision tree that fans out and then collapses into one highlighted path. |
| Prove | The same hand, K♥ Q♥, is shown in three different spots: on the button facing nothing, in the big blind facing a raise, and facing an all-in. Three different right answers are marked as "it depends", and the badge names the lesson that answers each one (Position, Pot odds, Defending). No answers are given here; it is a map, not a grade. |
| Transfer | Tap the track chip that answers a question: *"Should I call this bet?"* → Math Spine. *"Which hands should I play from this seat?"* → Preflop. Feedback lights the chip. |
| Rule | "Simple to learn, deep to master: one idea at a time." |
| Checks | Comprehension taps: How many betting rounds are in a hand? (four) · Is the same hand always played the same way? (no, it depends on the spot) |
| Formats | film |
| Characters | None. |
| Sound | Silent-complete. Later: a rising whoosh on each count-up. |

### Film beats (55 s)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate: slow drift through a vast dark space of floating face-down cards, backs only | You know the rules. How many ways can a hand start? |
| 4–9 | Predict | Log slider 10 → 10,000 | Predict first: how many two-card starts? |
| 9–15 | 1,326 | Code: deck splits into pairs of cards; counter slams 1,326; predict marker sits beside it | 52 cards make 1,326 different two-card starts. |
| 15–21 | 169 | The 1,326 collapse into a 13 × 13 grid: pairs on the diagonal, suited above, offsuit below; legend 13 / 78 / 78 | They fold into 169 kinds of hand: pairs, suited and offsuit. |
| 21–28 | Boards | Counter 19,600 flops, then 2,118,760 boards, digits rolling | For your two cards, 19,600 possible flops and over two million boards. |
| 28–38 | Four rounds | Stacked rail preflop/flop/turn/river; a fold/call/raise tree fans out at each, then one path lights gold | Four betting rounds, and a decision at every one. |
| 38–48 | It depends | K♥ Q♥ placed in three spots; each gets a track badge (Position, Pot odds, Defending) | The same hand plays differently in every spot. |
| 48–55 | Rule | Track map chips light one by one; rule card; Next lesson · Play a hand | Simple to learn, deep to master: one idea at a time. |

**Cinematic plates (generate):** P1, a weightless drift through a dark void of floating playing cards seen only from the back (plain backs, no faces, no marks), deep blue and gold rim light, slow forward dolly, 4 s. P2, an optional bridge under the decision tree: a branching river delta seen from far above at night, silver water, a slow top-down rotation, 6 s, at 25% under the glass.

Code-drawn: every count, the 13 × 13 grid, the betting-round rail, the decision tree, the three K♥ Q♥ spots and the track badges.

### Truth sheet

- 52 = 4 × 13. C(52,2) = 1,326. 169 = 13 + 78 + 78, with C(13,2) = 78. 13 × 6 + 78 × 4 + 78 × 12 = 1,326 (6 combos per pair, 4 per suited hand, 12 per offsuit hand).
- Flops for your two cards: C(50,3) = 19,600. Five-card boards: C(50,5) = 2,118,760. Five-card poker hands: C(52,5) = 2,598,960 (used again in `r-hand-rankings`).
- Four betting rounds. The three K♥ Q♥ spots carry no claimed answer.
- (Checks `deep: ...`.)

---

## `w-the-academy`: How Flop52 Makes You Better

| Field | Plan |
|---|---|
| Node and track | `w-the-academy`, track 0 Welcome. Prereqs: `w-how-deep`. |
| One idea | You get better by deciding, seeing why, and trying it again in a new spot later. Watching alone is not enough. |
| Belief it fixes | "Watching lessons is the same as learning them." |
| Hook | "Watch a hundred lessons, or play ten hands and check each one. Which makes you better?" |
| Predict | Tap one: **Watch 100** / **Decide 10 and check**. No grade. The answer is revisited. |
| Build | The loop drawn as a five-node ring, each node a glass chip that lights as the film reaches it: **Learn the idea → Decide with it → See why → Try a new spot → Prove it later**. An outer ring then adds **At the table** (a Gauntlet rival icon). One real example runs around the ring, using the pot-odds sample's own spot names from the M1 v1 film, with no numbers on screen. |
| Prove | A code-drawn forgetting curve, drawn as an illustration with no invented percentages and no y-axis values. One line drops after a single viewing. A second line has review stamps at spaced points, and each stamp lifts it back up. Labelled "illustration". |
| Transfer | **Toy:** the five ring chips are shuffled and the learner drags them into order. A wrong order gets a hint, not a fail. |
| Rule | "Learn it, decide it, see why, try it new, prove it later." |
| Checks | Comprehension taps: What comes right after you decide? (see why) · Why does a lesson come back days later? (to prove you still know it) |
| Formats | film, toy |
| Characters | Coach cameo: the three coaches (Ada, Reina, Mina) appear once each on ring nodes as the "voice" of that step. They are existing coach art, not generated faces. |
| Sound | Silent-complete. |

### Film beats (50 s)

| Time (s) | Beat | On screen | Caption |
|---|---|---|---|
| 0–4 | Hook | Plate: a player alone at a desk at night, a screen glow, then a lit card table in the next room | Watch 100 lessons, or decide 10 hands and check each one? |
| 4–8 | Predict | WATCH 100 / DECIDE 10 AND CHECK | Predict first. |
| 8–16 | Learn, Decide | Ring draws; node 1 lights with a film thumbnail; node 2 lights on the real ActionBar | Learn one idea. Then decide with it yourself. |
| 16–23 | See why | Node 3: a reason panel slides out of the decision | See why the decision works, whatever the result. |
| 23–30 | Try new | Node 4: the same idea on a changed table | Try it in a new spot, so it isn't memorised. |
| 30–37 | Prove later | Node 5: a calendar tick days later; the outer "at the table" ring with a Gauntlet rival icon | Days later it comes back. Then you prove it against a rival. |
| 37–45 | The curve | Forgetting curve illustration; review stamps lift the line | One viewing fades. Spaced practice holds on. [L1 · S17] |
| 45–50 | Rule | Predict answer stamps DECIDE 10 AND CHECK; rule card; Start learning · Play a hand | Learn it, decide it, see why, try it new, prove it later. [L2 · S18] |

**Cinematic plates (generate):** P1, a young adult at a desk late at night with a phone glow on their face (the screen content not visible), soft blue light, slow push-in, 2 s. P2, a doorway into a warm, lit card room with empty chairs waiting, golden light spilling out, a slow dolly toward the door, 2 s.

Code-drawn: the ring, its chips, the ActionBar, the reason panel, the calendar tick, the curve and every label.

### Truth sheet

- No numbers on screen. The forgetting curve is an unlabelled illustration with no axis values and no invented rates, and it is captioned as such.
- L1, VERIFIED [S17]: spacing study sessions apart improves long-term retention over massed study (Cepeda et al., Psychological Bulletin, 2006, a meta-analysis of 317 experiments). The caption "Spaced practice holds on" states only this general effect; the curve's shape stays an illustration with no rates.
- L2, VERIFIED [S18]: practising recall improves long-term retention more than restudying (Roediger & Karpicke, Psychological Science, 2006). The predict answer (deciding and checking beats watching) rests on this as an analogy; the film does not claim a poker-specific study.
- Sources are listed in `HISTORY-SOURCES.md`.
