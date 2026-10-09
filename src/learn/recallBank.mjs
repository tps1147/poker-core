// THE RECALL BANK: one 20-second recall card per lesson node, 59 entries in tree order
// (ACADEMY-LEARNING-LOOP 2026-10-07, "Recall"). A card is the lesson's rule plus one quick
// question. It comes from the plan's Checks row (docs/v1-feature/academy/plans/<track>.md) and is
// never the film's own spot: the guided spot and the film's transfer are left out.
//
// Each entry: { lessonId, status, source, rule, question, checkedBy, todo }
//   lessonId   the tree node id.
//   status     'ready'    the plan's Checks row names the spot and its answer (most are the fresh
//                         hand or a delayed check the row spells out);
//              'authored' the Checks row names the question type only ("Who wins?", "Which two
//                         cards are the nuts?"), so the spot is written here, changed from every
//                         spot in the plan, and its answer is computed by test/recall.test.mjs with
//                         the shared evaluator;
//              'todo'     the plan has no usable check yet (`todo` says why). No question; the
//                         scheduler never shows it.
//   source     which Checks item the question comes from.
//   rule       the plan's Rule row (for the four outline-only Other Tables lessons, the film's
//              own rule caption).
//   question   { prompt, choices, answer } where `answer` indexes `choices`; one tap.
//   checkedBy  the plan check script that asserts the plan's numbers, where one covers the spot;
//              test/recall.test.mjs recomputes every number and card answer as well.
// Answers ship with the bank: recall is the client's word, like a puzzle answer, until the server
// grades recalls itself. Results never grade decisions: every answer here is a decision or a fact.
// Pure data, no imports.

const ready = (lessonId, source, rule, prompt, choices, answer, checkedBy = null) =>
  Object.freeze({ lessonId, status: "ready", source, rule, question: Object.freeze({ prompt, choices: Object.freeze(choices), answer }), checkedBy, todo: null });
const authored = (lessonId, source, rule, prompt, choices, answer) =>
  Object.freeze({ lessonId, status: "authored", source, rule, question: Object.freeze({ prompt, choices: Object.freeze(choices), answer }), checkedBy: null, todo: null });
const todo = (lessonId, rule, reason) =>
  Object.freeze({ lessonId, status: "todo", source: null, rule, question: null, checkedBy: null, todo: reason });

const MP = "check-math-preflop.mjs";
const PF = "check-postflop-to-formats.mjs";
const WRB = "check-welcome-rules-board.mjs";

export const RECALL_BANK = Object.freeze([
  // ── 0 Welcome: the plans' comprehension taps
  ready("w-what-is-poker", "Checks: comprehension tap", "Cards decide a hand. Decisions decide a thousand.",
    "How many of the shared cards on the table can you use?", ["Two", "Three", "All five"], 2),
  ready("w-luck-and-skill", "Checks: comprehension tap", "Judge the decision by what happens over many hands, not by this one.",
    "You lose one hand where you were ahead. What does that tell you about your decision?", ["It was a bad decision", "Nothing, by itself", "It was a good decision"], 1),
  ready("w-how-deep", "Checks: comprehension tap", "Simple to learn, deep to master: one idea at a time.",
    "Is the same hand always played the same way?", ["Yes, always", "No, it depends on the spot"], 1),
  ready("w-the-academy", "Checks: comprehension tap", "Learn it, decide it, see why, try it new, prove it later.",
    "Why does a lesson come back days later?", ["To prove you still know it", "Because you got it wrong", "To earn points"], 0),
  ready("w-history", "Checks: comprehension tap", "Poker is played against people, not the house. Better thinking has always won.",
    "Who takes the chips you lose at poker?", ["The house", "The other players", "Nobody"], 1),

  // ── 1 Rules
  ready("r-the-deck", "Checks: fresh", "52 cards: 13 ranks × 4 suits. Ranks matter. Suits only matter for flushes.",
    "The board is Q♦ J♥ T♠ 4♣ 2♦. K♥ 9♣ against K♠ 9♦. Who wins?", ["K♥ 9♣", "K♠ 9♦", "Split"], 2, WRB),
  ready("r-hand-rankings", "Checks: delayed (ladder order)", "Rarer beats more common. Learn the ladder top to bottom.",
    "Which of these hands ranks highest?", ["Three of a kind", "Straight", "Two pair"], 1, WRB),
  authored("r-best-five", "Checks: a fresh Who wins? spot with a kicker", "Best five of seven. Use two, one or none of yours.",
    "The board is K♠ 9♦ 6♣ 4♥ 2♠. A♣ K♦ against K♥ Q♣. Who wins?", ["A♣ K♦", "K♥ Q♣", "Split"], 0),
  authored("r-seats-blinds", "Checks: tap the seat that posts a blind (six-max)", "The button moves every hand. Blinds come from players and go to whoever wins the pot. Heads-up: the button is the small blind.",
    "Six players. Which seat posts the big blind?", ["The seat right after the button", "Two seats after the button", "The button"], 1),
  authored("r-actions", "Checks: a legality tap (changed amounts)", "Check costs nothing, and only when nothing is owed. Call matches. Bet starts, raise grows.",
    "Blinds 5 and 10. Someone raises to 40. What is the smallest re-raise?", ["To 50", "To 70", "To 80"], 1),
  authored("r-streets", "Checks: tap who acts next", "After the flop, the first seat left of the button acts first, every street.",
    "Six-max. The big blind, the hijack and the button see the flop. Who acts first?", ["The big blind", "The hijack", "The button"], 0),
  authored("r-showdown", "Checks: a fresh Who wins? (winner or split)", "Win when they fold, or with the best five at showdown. Exact ties split.",
    "The board is 9♠ T♦ J♣ Q♥ K♠. A♦ 3♣ against 8♣ 4♦. Who wins?", ["A♦ 3♣", "8♣ 4♦", "Split"], 0),
  authored("r-all-in-side-pots", "Checks: a new four-way pot", "Win only what you matched. The rest is a side pot for those who paid it.",
    "A is all-in for 100, B for 200, and C and D each put in 500. How big is the pot A can win?", ["100", "400", "1,300"], 1),
  ready("r-first-hand", "Checks: delayed (the same rules prompts on a fresh hand)", "You can play a full hand.",
    "Ada bets the river and you call. Who shows first?", ["You", "Ada, the last bettor", "Whoever has the best hand"], 1),

  // ── 2 Board
  authored("b-made-vs-draw", "Checks: Made hand or draw?", "A draw is a promise, not a hand. Read what you have now.",
    "You hold Q♠ J♠ on K♠ 8♠ 3♦ 2♥. What do you have?", ["A flush", "A flush draw: it needs one more spade", "A pair"], 1),
  authored("b-the-nuts", "Checks: Which two cards are the nuts?", "The nuts is the best hand this board allows. Recheck it every street.",
    "The board is Q♣ 9♦ 4♠ 2♥ 7♣. Which two cards are the nuts?", ["A-Q", "Q-9", "Q-Q"], 2),
  authored("b-what-beats-you", "Checks: tap the hands that beat you", "Name what beats you before you bet.",
    "You hold K♥ Q♦ on K♣ 9♠ 5♦ 2♣. Which of these beats you?", ["K-J", "9-5", "Q-Q"], 1),
  authored("b-kickers-counterfeit", "Checks: Who wins, or split? (a counterfeit)", "When the board pairs, ask: does my hand still use my cards?",
    "The board is 9♥ 9♣ 6♦ 6♠ J♥. 3♣ 3♦ against Q♣ 2♦. Who wins?", ["3♣ 3♦", "Q♣ 2♦", "Split"], 1),
  authored("b-texture-read", "Checks: Which hand types are possible right now?", "Read the shape first: what's possible now, and what's still coming.",
    "The flop is Q♣ 8♣ 4♣. Which hand is already possible?", ["A straight", "A flush", "A full house"], 1),

  // ── 3 Math spine: the plans' fresh spots
  ready("m-chance-as-share", "Checks: fresh", "Chance = the outcomes you want ÷ all outcomes. Repeat it, and that share is what you get.",
    "One card from a shuffled deck. How often is it a jack, a queen or a king?", ["About 8%", "About 23%", "About 25%"], 1, MP),
  ready("m-outs", "Checks: fresh", "An out is a card that makes you the winner. Count each card once.",
    "K♣ J♦ on Q♥ 9♠ 4♣ 2♦, one card to come. Only a straight wins for you. How many outs?", ["4", "8", "10"], 0, MP),
  ready("m-rule-2-4", "Checks: fresh", "×2 for one card. ×4 only when you'll see both for this price.",
    "7♠ 6♠ on 5♥ 4♣ K♦. You face a bet that is not all-in. Your chance to hit the straight on the next card, by the rule?", ["About 16%", "About 32%", "About 8%"], 0, MP),
  ready("m-equity", "Checks: fresh", "Equity = your chance × the pot.",
    "6♣ 5♣ on 7♥ 4♦ K♠ J♦, the pot is 115, and 8 cards make your straight. Your equity, in chips?", ["About 8", "About 20", "About 46"], 1, MP),
  ready("m-pot-odds", "Checks: fresh", "Price = your call ÷ the final pot. Call when your chance is at least the price.",
    "River. The pot is 90 and they bet 60. What is your price?", ["About 28.6%", "40%", "About 66.7%"], 0, MP),
  ready("m-ev", "Checks: fresh", "EV = chance × final pot − your call. Judge the decision by its average, not by one river.",
    "River. The pot is 200, they bet 100, and you win 20% (given). The expected value of calling?", ["+80", "−20", "+20"], 1, MP),
  ready("m-variance", "Checks: decision", "A few hands show luck. Thousands show the decision.",
    "A call is worth +10 on average. After 100 of those calls, what is the expected total?", ["+10", "+100", "+1,000"], 2, MP),
  ready("m-implied-odds", "Checks: fresh", "Needed later = call ÷ chance − final pot. Call only if that much is really there to win.",
    "9♣ 8♣ on T♦ 7♥ 2♠ K♥. The pot is 90 and they bet 40; 8 cards make your straight. How much more must you win later?", ["60", "230", "Nothing more"], 0, MP),
  ready("m-spr", "Checks: fresh", "SPR = effective stack ÷ pot. Low SPR: commit with good hands. High SPR: big pots need big hands.",
    "You have 2,000, they have 1,800, and the pot is 150. What is the SPR?", ["About 13", "12", "About 25"], 1, MP),

  // ── 4 Preflop: the plans' fresh spots
  ready("p-position-value", "Checks: fresh", "After the flop, the seat closest to the button's left acts first and the button acts last. Acting last is information.",
    "Under the gun against the button. Who acts last after the flop?", ["Under the gun", "The button"], 1, MP),
  ready("p-starting-hands", "Checks: fresh", "Play hands that make big hands, from seats that let you. Suited is a bonus, not a ticket.",
    "Q♣ 4♣ under the gun, folded to you. What do you do?", ["Fold", "Call 10", "Raise to 25"], 0, MP),
  ready("p-open-raise", "Checks: fresh", "Count the players behind you. Fewer behind, wider range. Come in with a raise.",
    "Q♠ T♠ under the gun, folded to you. What do you do?", ["Fold", "Call 10", "Raise to 25"], 2, MP),
  ready("p-blind-defense", "Checks: fresh", "Your price = what you owe ÷ the pot after you call. The blind helps the price; it doesn't make the call.",
    "You are the big blind. The button raises to 40 and the small blind folds. What is your price?", ["75%", "About 54.5%", "About 35.3%"], 2, MP),
  ready("p-three-bet", "Checks: fresh", "3-bet the hands that beat their calls, and a few that block their best hands. 3× in position, 4× out.",
    "K♥ J♥ in the cutoff against an under-the-gun open. By this lesson's rule, is it a 3-bet?", ["Yes, for value", "Yes, as a blocker bluff", "No: it is not a value hand and holds no ace"], 2, MP),

  // ── 5 Postflop
  ready("f-ranges", "Checks: fresh (rng1-fresh, kept)", "Put him on a range, then ask what share of it beats you.",
    "Given: before the flop he re-raises aces, kings, queens and ace-king, and calls with every other hand he plays. He called your raise. Which of these still fits his range?", ["Aces", "Ace-king", "Ace-eight"], 2),
  ready("f-board-texture", "Checks: fresh (bt1-fresh, kept)", "Before your hand, ask whose range the flop hits.",
    "The flop is 6♥ 5♥ 2♣. Dry or wet?", ["Dry", "Wet"], 1),
  // The four postflop cards (defs-a, 2026-10-08) come from the lessons' own practice or fresh hands,
  // never the film's spot; test/academyEarly.test.mjs recomputes each answer.
  ready("f-cbet", "Checks: practice (cb1-practice, kept)", "C-bet when the flop favors your range and the board lets you; raising first is not the reason.",
    "K♣ Q♠ on 8♥ 7♥ 6♦, pot 60, checked to you. Given: his call holds more small pairs and suited connectors than your raise. Check, or c-bet 20?", ["Check", "C-bet 20"], 0),
  ready("f-bet-sizing", "Checks: fresh (bs1-fresh, kept)", "Pick the size from the job: charge draws, invite worse hands, or make folds cheap to win.",
    "K♥ Q♥ on A♠ 8♦ 3♣, pot 180, checked to you. His aces call either size and his misses fold to either size. Small bet 60 or large bet 135?", ["Small bet 60", "Large bet 135"], 0),
  ready("f-value-betting", "Checks: fresh (vb-fresh)", "Bet when more than half of the hands that call are worse than yours.",
    "K♠ Q♦ on K♥ 8♣ 6♦ 4♠ 2♥, pot 150, checked to you. Given: 40 hands would call a 75 bet, and 18 of them are worse than yours. Check, or bet 75?", ["Check", "Bet 75"], 0),
  ready("f-pot-control", "Checks: fresh (pc-fresh)", "Medium hand, small pot: two streets of value, and take the free card when you are last.",
    "Flop pot 60. You bet half the pot on the flop, check the turn behind and bet half the pot on the river, and both bets are called. How big is the final pot?", ["120", "240", "480"], 1),
  ready("f-playing-draws", "Checks: fresh (pd-fresh)", "Price first; then ask what the stacks let you win later, and whether a raise wins it now.",
    "8♦ 7♦ on J♦ 5♦ 2♠. He moves all-in for 100 into 100, so you see the turn and the river, and 378 of the 1,081 runouts make your flush. Call or fold?", ["Call", "Fold"], 0),

  // ── 6 Pressure
  ready("x-fold-equity", "Checks: fresh (sb1-fresh, kept)", "Break-even = bet ÷ (pot + bet). A semi-bluff adds the chance you hit when called.",
    "The pot is 100. You bet 100 with nothing to fall back on. How often must he fold for you to break even?", ["About 33%", "50%", "100%"], 1, PF),
  ready("x-bluffing", "Checks: fresh (bl1-fresh, kept)", "Bluff when the story is believable and the hands that fold beat you. A call is one sample, not the grade.",
    "J♣ T♣ on A♦ 8♣ 3♣ 4♠ K♦, checked to you, pot 300. Given: he never folds one pair on the river. Check, or bet 200?", ["Check", "Bet 200"], 0),
  authored("x-mdf", "Checks: pick the defend count (a new size)", "Keep at least pot ÷ (pot + bet) of your range. Fold less than that and his bluffs print.",
    "He bets 100 into a pot of 100. How much of your range must you keep?", ["1/3", "1/2", "2/3"], 1),
  authored("x-check-raise", "Checks: the raise's price (new amounts)", "Check-raise your strongest hands and your best draws together.",
    "You check, he bets 30 into 90, and you raise to 100. What is his price to call?", ["About 24%", "About 35%", "About 70%"], 0),
  authored("x-barrels-blockers", "Checks: choose a three-street size (new stacks)", "Plan the size for all three streets; pick the bluff that blocks his calls, after the board says he can fold.",
    "The pot is 200 and you each have 700 behind. Which flop bet, the same share of the pot on every street, gets it all in by the river?", ["Bet 50", "Bet 100", "Bet 200"], 1),

  // ── 7 Reading people
  authored("h-range-narrowing", "Checks: which group a call removes (new counts)", "Start wide, then let every action take hands out. Keep the list, not one guess.",
    "His range is 150 combos, and 60 of them hold a pair or a draw on this flop. He calls your bet only with a pair or a draw. How many combos are left?", ["60", "90", "150"], 0),
  authored("h-player-types", "Checks: name the type (a long sample)", "Type players by what they do, over enough hands to trust it.",
    "Over 1,000 hands he played 12% and raised 10%. Which type is he?", ["Calling station", "Nit", "LAG"], 1),
  authored("h-exploits", "Checks: a decision spot per type (a new size)", "Find the leak, then make the one move that punishes it.",
    "Pot 100, you hold nothing. The nit folds to a bet of 100 75% of the time (given). Bluff, or check?", ["Bluff", "Check"], 0),

  // ── 8 Game theory
  authored("g-toy-games", "Checks: the never-bluff line (a new seat)", "If you never bluff, your bets fold everyone. Bluff at the rate that leaves the caller nothing to gain.",
    "Your bets are never bluffs, and he knows it. His hand beats only a bluff. What does he do when you bet?", ["Call", "Fold"], 1),
  authored("g-balance", "Checks: bluff share at a new size", "Bluffs ÷ all bets = bet ÷ (pot + 2·bet).",
    "Pot 100, and you bet 200. What share of your bets should be bluffs?", ["1/3", "2/5", "1/2"], 1),
  authored("g-gto-to-exploit", "Checks: a stated showdown history (a new count)", "Balanced until the evidence says otherwise; then exploit, and keep checking the evidence.",
    "A balanced bettor shows value at 2 of every 3 showdowns. How often do 3 showdowns in a row show no bluff anyway?", ["About 13%", "About 30%", "About 67%"], 1),

  // ── 9 The player
  authored("y-bankroll", "Checks: count buy-ins for one example (changed amounts)", "Count your bankroll in buy-ins, and keep enough of them that a bad run is a dip, not the end.",
    "A bankroll of 3,000 chips, at a game with a 100-chip buy-in. How many buy-ins is that?", ["3", "30", "300"], 1),
  authored("y-tilt", "Checks: the same decision after a streak (new price)", "Grade the decision by the math, not by the last three results.",
    "You lost your last four all-in calls. Now they go all-in for 40 into 120, and you win 25% of the time (given). Call, or fold?", ["Call", "Fold"], 0),
  authored("y-study", "Checks: tag a hand for review (a new log)", "Review the decisions you weren't sure of, and come back to them later.",
    "Which hand goes to your review queue: a sure call that lost, or an unsure check that won?", ["The sure call that lost", "The unsure check that won"], 1),

  // ── 10 Other tables
  authored("o-multiway", "Checks: bluff or check against three (new fold rates)", "Every extra player is another range to beat. Bluff less and value bet stronger hands.",
    "Three players each fold 50% of the time, on their own (given). Your bluff needs 20% folds. Bet?", ["Yes: 50% each is plenty", "No: all three fold only 12.5%"], 1),
  authored("o-heads-up", "Checks: the heads-up order of action", "Heads-up, play wider and keep the pressure on, but every chip still needs a reason.",
    "Heads-up, who acts last on every street after the flop?", ["The button", "The big blind"], 0),
  authored("o-tournaments-icm", "Checks: whose chips are worth more (the stated stacks)", "In tournaments, chips aren't money. Survival has a price, so call tighter near the payouts.",
    "Three left with 5,000, 3,000 and 2,000 chips, paid 50%, 30% and 20% of the prize pool. Whose chips are each worth the most prize money?", ["The big stack’s", "The short stack’s", "All the same"], 1),
  authored("o-six-max", "Checks: count the players behind (a full table)", "Fewer seats means fewer players to beat. Count who's behind you, then open wider.",
    "At a full table of 9, how many players are still to act behind the first seat?", ["5", "8", "9"], 1),
  authored("o-live", "Checks: a binding declaration (a new spot)", "At a live table, say what you do, move once, and let the betting do the talking.",
    "Facing a bet, you say “raise” in turn, then put out only enough chips to call. Under common house rules, what stands?", ["A call", "A raise"], 1),
]);

const BY_ID = new Map(RECALL_BANK.map((entry) => [entry.lessonId, entry]));

// A lesson's bank entry, or null.
export const recallEntry = (lessonId) => BY_ID.get(lessonId) || null;

// The card a scheduler shows: { lessonId, rule, question }, or null while the entry is a todo.
export function recallCard(lessonId) {
  const entry = BY_ID.get(lessonId);
  return entry && entry.question ? { lessonId, rule: entry.rule, question: entry.question } : null;
}

// The lessons whose plans have no usable check yet, with the reason.
export const recallTodo = () => RECALL_BANK.filter((entry) => entry.status === "todo").map(({ lessonId, todo: reason }) => ({ lessonId, reason }));
