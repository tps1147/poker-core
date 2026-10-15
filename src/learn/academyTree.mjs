// THE ACADEMY TREE, draft 0 (2026-10-06): every concept a player learns, from never having seen a
// deck to theory, with its prerequisites, the one idea it teaches, the misconception it targets, the
// lesson format it suits and how it is checked.
// PROMOTED 2026-10-07 (was src/learn/v1/academyTree.mjs, which now re-exports this file): the tree is
// the LIVE curriculum. curriculum.mjs builds its chapters from TRACKS (11 tracks, one chapter each)
// and its lessons from NODES in this order. Lesson definitions, server keys and the apps' concept
// mastery (deriveMasteredSet) stay where they are; see curriculum.mjs and nodeState.mjs.
// `legacy` ties a node to the existing concept id (native/web conceptMap.js) and the existing shared
// lesson with its M2 audit verdict, so nothing already built is lost; curriculum.mjs maps the old
// lesson ids to nodes through `legacy.lesson`.
// `scope`: "v1" (before the Pro tester stage) or "later" (tournaments, six-player and solver work).
// SCOPE NOTE (2026-10-07): `scope` records the plan's original staging and nothing reads it as a
// filter. All 59 lessons ship, the four "later" Other Tables lessons (o-heads-up, o-tournaments-icm,
// o-six-max, o-live) included, by Tyler's call to finish the full academy: their films exist. No node
// is hidden from the curriculum because of its scope.
// `formats` use the M1 v1 language: film (a short diagram film), table (a walkthrough on the real
// Flop52 table), toy (a manipulative), worked (worked example then faded transfer), contrast (the
// mistake shown beside the fix), decision (graded spots), drill (puzzles), match (a Gauntlet rival).
// 2026-10-06: the accepted TREE-PROPOSALS.md edits are applied (wording, prerequisites, the positions
// lesson remap and formats); the plans in docs/v1-feature/academy/plans copy these fields exactly.
// Pure data, no imports.

export const ACADEMY_TREE_VERSION = "academy-tree-draft-0";

export const TRACKS = Object.freeze([
  { id: "welcome", n: 0, title: "Welcome to Poker", promise: "What the game is, where it came from, and why skill beats luck over time." },
  { id: "rules", n: 1, title: "How a Hand Plays", promise: "Play a full hand without a question about the rules." },
  { id: "board", n: 2, title: "Reading the Board", promise: "Know what you have, what beats you and what could still come." },
  { id: "math", n: 3, title: "The Math Spine", promise: "Turn cards into chances and chances into prices." },
  { id: "preflop", n: 4, title: "Preflop", promise: "Which hands to play, from which seat, for how much." },
  { id: "postflop", n: 5, title: "Postflop", promise: "Think in ranges, read the flop, bet with a reason and a size." },
  { id: "pressure", n: 6, title: "Pressure and Defense", promise: "Make others fold, and know when not to." },
  { id: "people", n: 7, title: "Reading People", promise: "Narrow ranges and adjust to the player in front of you." },
  { id: "theory", n: 8, title: "Game Theory", promise: "Why balance works, and when to leave it on purpose." },
  { id: "player", n: 9, title: "The Player", promise: "Bankroll, tilt and study: the skills that protect the others." },
  { id: "formats", n: 10, title: "Other Tables", promise: "Multiway pots, tournaments, heads-up and live play." },
]);

const node = (id, track, title, prereqs, objective, misconception, formats, extra = {}) =>
  Object.freeze({ id, track, title, prereqs: Object.freeze(prereqs), objective, misconception, formats: Object.freeze(formats),
    legacy: null, practice: null, scope: "v1", ...extra });
const L = (concept, lesson = null, verdict = null) => ({ legacy: { concept, lesson, verdict } });
const P = (topic = null, opponent = null) => ({ practice: { topic, opponent } });

export const NODES = Object.freeze([
  // ── 0 Welcome (new, animated, no prerequisites). Order 2026-10-09 (the welcome rebuild): What Poker Really Is,
  // Luck and Skill, How Deep, The Academy, then A Short History last as a bonus (its film ends "Up next: the deck").
  node("w-what-is-poker", "welcome", "What Poker Really Is", [], "Poker is a game of hidden cards and chip decisions, won by deciding better than the other players over many hands.", "Poker is mostly about being dealt good cards.", ["film", "table"]),
  node("w-luck-and-skill", "welcome", "Luck Decides a Hand, Skill Decides a Thousand", ["w-what-is-poker"], "One hand can go either way; across many hands the better decisions take the chips.", "A loss means the decision was bad, a win means it was good.", ["film", "toy"]),
  node("w-how-deep", "welcome", "How Deep the Game Goes", ["w-luck-and-skill"], "1,326 starting combinations, four betting rounds and hidden information make poker a game you can study for life, one idea at a time.", "Poker is simple once you know the hand rankings.", ["film"]),
  node("w-the-academy", "welcome", "How Flop52 Makes You Better", ["w-how-deep"], "The path: learn an idea, decide with it, see why, try it in a new spot, then prove it later and at the table.", "Watching lessons is the same as learning them.", ["film", "toy"]),
  node("w-history", "welcome", "A Short History", ["w-what-is-poker"], "From 1800s riverboat games to Texas Hold'em, the World Series and computers that beat the best pros: the game kept rewarding better thinking.", "Poker is a casino game like slots, where the house picks the winner.", ["film"]),

  // ── 1 Rules
  node("r-the-deck", "rules", "The Deck: 52 Cards", ["w-what-is-poker"], "Four suits, thirteen ranks, no jokers; suits never outrank each other in Hold'em.", "Some suits are worth more than others.", ["table", "toy"]),
  node("r-hand-rankings", "rules", "Hand Rankings", ["r-the-deck"], "Know the ten hand categories in order and why rarer hands rank higher.", "A flush beats a full house because it looks prettier.", ["table", "decision"], { ...L("t0-hand-rankings", "hand-rankings-workspace-v1", "REVISE") }),
  node("r-best-five", "rules", "Your Best Five of Seven", ["r-hand-rankings"], "Your hand is the best five cards from your two plus the five on the board; kickers break ties and pots can split.", "You must use both of your hole cards.", ["table", "worked", "decision"]),
  node("r-seats-blinds", "rules", "Seats, Button and Blinds", ["r-the-deck"], "The button moves every hand; the two blinds post before cards so there is always something to win. Heads-up, the button posts the small blind, acts first preflop and last on every later street.", "The blinds are a fee to the house.", ["table", "film"]),
  node("r-actions", "rules", "Fold, Check, Call, Bet, Raise", ["r-seats-blinds"], "What each action means, when it is allowed and what it costs. In no-limit a raise must be at least the size of the last bet or raise, and when everyone just calls, the big blind keeps the option to check or raise.", "Checking and calling are the same thing.", ["table", "decision"], { ...L("t0-betting-actions", "betting-actions-workspace-v1", "KEEP") }),
  node("r-streets", "rules", "The Four Betting Rounds", ["r-actions"], "Preflop, flop, turn and river: who acts first on each and when the round closes.", "The player who bet last always acts first on the next street.", ["table"]),
  node("r-showdown", "rules", "Showdown and Split Pots", ["r-best-five", "r-streets"], "How a pot is won without a showdown, how hands are compared at showdown, and when chips are split.", "You must show your cards to win.", ["table", "decision"]),
  node("r-all-in-side-pots", "rules", "All-Ins and Side Pots", ["r-showdown"], "A player can only win what they matched; extra chips form a side pot.", "An all-in player can win chips they never covered.", ["table", "worked"]),
  node("r-first-hand", "rules", "Your First Full Hand", ["r-all-in-side-pots"], "Play one guided hand start to finish on the real table with every rule in action.", "", ["table", "decision"]),

  // ── 2 Reading the board
  node("b-made-vs-draw", "board", "Made Hands and Draws", ["r-best-five"], "A made hand already ranks; a draw needs more cards to become one.", "A four-card flush is a flush.", ["table", "decision"]),
  node("b-the-nuts", "board", "The Nuts", ["b-made-vs-draw"], "The best possible hand on a given board, and how it changes street by street.", "Top pair is always the nuts.", ["toy", "decision"]),
  node("b-what-beats-you", "board", "What Beats You", ["b-the-nuts"], "List the hands that beat yours on this board before you put more chips in.", "If you can't see a better hand, there isn't one.", ["worked", "decision"]),
  node("b-kickers-counterfeit", "board", "Kickers and Counterfeits", ["b-what-beats-you"], "How the board can play for everyone or make your hand worse.", "Two pair on the board helps the player with the pocket pair most.", ["contrast", "decision"]),
  node("b-texture-read", "board", "Board Shapes", ["b-made-vs-draw"], "Paired, suited, connected, dry: what each shape allows.", "Every flop is equally dangerous.", ["toy", "decision"]),

  // ── 3 Math spine
  node("m-chance-as-share", "math", "Chance as a Share", ["w-luck-and-skill"], "A chance is a share of possible outcomes: 1 in 4 is 25%, and repeated many times the share is what you get.", "30% means it won't happen.", ["film", "toy"]),
  node("m-outs", "math", "Outs", ["b-made-vs-draw", "m-chance-as-share"], "Count the unseen cards that turn your hand into the winner; a dirty out improves you but also gives them a better hand, so it does not count.", "Every card that improves you is an out.", ["film", "decision"], { ...L("t1-outs-rule-24", "outs-workspace-v1", "KEEP"), ...P("pot-odds", "drawer") }),
  node("m-rule-2-4", "math", "Rule of 2 and 4", ["m-outs"], "Estimate your chance from outs: about 2% per out with one card to come, about 4% with two.", "The 4 rule applies when you'll face another bet.", ["film", "decision"], { ...L("t1-outs-rule-24", "rule-2-4-workspace-v1", "KEEP"), ...P("pot-odds", "drawer") }),
  node("m-equity", "math", "Equity: Your Share of the Pot", ["m-rule-2-4"], "Equity is your chance to win expressed as your share of the pot.", "Equity is the chips you have already put in.", ["film", "toy", "decision"], { ...L("t1-equity", "equity-workspace-v1", "REVISE"), ...P("pot-odds", "drawer") }),
  node("m-pot-odds", "math", "Pot Odds: Find Your Price", ["m-equity"], "Price = your call ÷ the final pot. Call when your chance is at least the price.", "Leave your own call out of the pot.", ["film", "worked", "contrast", "decision"], { ...L("t1-pot-odds", "pot-odds-workspace-v2", "KEEP"), ...P("pot-odds", "drawer"), sample: "M1 v1 film" }),
  node("m-ev", "math", "Expected Value", ["m-pot-odds"], "Average result over many identical decisions; a good call can lose and still be right.", "The result of one hand tells you if the decision was right.", ["film", "worked", "decision"], { ...L("t1-ev", "ev-workspace-v1", "KEEP"), ...P("pot-odds", "balanced") }),
  node("m-variance", "math", "Variance and Sample Size", ["m-ev"], "How far short-run results swing around the average, and how many hands it takes to see skill.", "Ten winning sessions prove you are good.", ["toy", "film"]),
  node("m-implied-odds", "math", "Implied Odds", ["m-pot-odds"], "Chips you can still win later can justify a call the price alone rejects, if stacks allow it.", "Implied odds make every draw a call.", ["film", "worked", "decision"], { ...L("t1-implied-odds", "implied-odds-workspace-v1", "KEEP"), ...P("pot-odds", "calling-station") }),
  node("m-spr", "math", "Stack-to-Pot Ratio", ["m-implied-odds"], "Stack ÷ pot tells you how committed you are and how many bets remain.", "Deep stacks always favor the better hand.", ["toy", "decision"], { ...L("t1-spr", "spr-workspace-v1", "KEEP"), ...P(null, "trapper") }),

  // ── 4 Preflop
  node("p-position-value", "preflop", "Why Acting Last Wins", ["r-streets", "m-chance-as-share"], "Acting last lets you see what others do before you decide.", "Position only matters preflop.", ["table", "film"], { ...L("t0-positions", "positions-workspace-v1", "KEEP") }),
  node("p-starting-hands", "preflop", "Starting Hands", ["p-position-value", "m-chance-as-share"], "Play hands that win big pots and avoid hands that get dominated.", "Any two suited cards are worth playing.", ["toy", "decision"], { ...L("t2-starting-hands", "starting-hands-workspace-v1", "KEEP"), ...P("starting-hands", "calling-station") }),
  node("p-open-raise", "preflop", "Opening by Position", ["p-starting-hands"], "Open tighter early and wider late, because fewer players are left to act.", "Limping in is a cheap way to see flops.", ["toy", "decision"], { ...L("t2-rfi-by-position", "rfi-position-workspace-v1", "KEEP"), ...P("starting-hands", "nit") }),
  node("p-blind-defense", "preflop", "Defending the Blinds", ["p-open-raise", "m-pot-odds"], "The chips you already posted improve your price; defend enough, not everything.", "The blind is your money, so always protect it.", ["film", "worked", "decision"], { ...L("t2-blind-defense", "blind-defense-workspace-v1", "KEEP"), ...P("starting-hands", "lag") }),
  node("p-three-bet", "preflop", "3-Betting", ["p-open-raise", "m-pot-odds"], "Re-raise for value with the best hands and for pressure with hands that block them.", "Only 3-bet aces and kings.", ["film", "worked", "decision"], { ...L("t2-3betting", "three-betting-workspace-v1", "KEEP"), ...P("starting-hands", "lag") }),

  // ── 5 Postflop
  node("f-ranges", "postflop", "Ranges, Not Hands", ["p-open-raise", "m-equity"], "Put opponents on every hand their actions allow, weighted, not on one guess.", "You can read one exact hand from a bet.", ["toy", "decision"], { ...L("t3-ranges", "ranges-workspace-v1", "KEEP"), ...P("hand-reading", "balanced") }),
  node("f-board-texture", "postflop", "Board Texture and Ranges", ["f-ranges", "b-texture-read"], "Which player's range the flop helps more, and why that sets the plan.", "The flop helps whoever has the better hand.", ["toy", "decision"], { ...L("t3-board-texture", "board-texture-workspace-v1", "KEEP"), ...P("postflop-cbet", "tag") }),
  node("f-cbet", "postflop", "Continuation Betting", ["f-board-texture"], "Bet the flop after raising preflop when the board favors your range.", "Always c-bet because you raised.", ["contrast", "decision"], { ...L("t3-cbetting", "cbetting-workspace-v1", "REVISE"), ...P("postflop-cbet", "tag") }),
  node("f-bet-sizing", "postflop", "Bet Sizing", ["f-cbet", "m-spr"], "Size bets for a purpose: what you want called, what you want folded, and the price you give.", "Bigger bets always win more.", ["toy", "decision"], { ...L("t3-bet-sizing", "bet-sizing-workspace-v1", "KEEP"), ...P("postflop-cbet", "calling-station") }),
  node("f-value-betting", "postflop", "Value Betting", ["f-bet-sizing", "b-what-beats-you"], "Bet when worse hands will call; size for the hands that pay.", "Always check strong hands to trap.", ["worked", "decision"]),
  node("f-pot-control", "postflop", "Pot Control and Free Cards", ["f-value-betting", "p-position-value"], "Keep pots small with medium hands and take free cards in position.", "Checking is weak.", ["contrast", "decision"]),
  node("f-playing-draws", "postflop", "Playing Draws", ["f-cbet", "m-implied-odds"], "Choose between calling, raising and folding a draw from price, position and stacks.", "Draws should always be played passively.", ["worked", "decision"]),

  // ── 6 Pressure and defense
  node("x-fold-equity", "pressure", "Fold Equity and Semi-Bluffs", ["f-cbet", "m-ev"], "A bet wins when they fold or when you hit: break-even fold rate = bet ÷ (pot + bet).", "A semi-bluff only works if they fold.", ["film", "worked", "decision"], { ...L("t4-fold-equity-semibluff", "semibluff-workspace-v1", "REVISE"), ...P("bluffing", "drawer") }),
  node("x-bluffing", "pressure", "Bluffing with a Story", ["x-fold-equity", "f-ranges"], "Bluff when your line is believable and their range can fold; judge the decision, not the result.", "A bluff that got called was a bad bluff.", ["contrast", "decision"], { ...L("t4-bluffing", "bluffing-workspace-v1", "REVISE"), ...P("bluffing", "lag") }),
  node("x-mdf", "pressure", "Defending Against Bets", ["f-ranges", "m-pot-odds", "p-blind-defense"], "Minimum defense frequency: fold too often and any bluff profits.", "Fold whenever you might be beaten.", ["toy", "decision"], { ...L("t4-mdf-bluffcatch") }),
  node("x-check-raise", "pressure", "The Check-Raise", ["x-mdf", "f-value-betting"], "Check-raise for value and as a balanced bluff from out of position.", "A check-raise always means a monster.", ["worked", "decision"]),
  node("x-barrels-blockers", "pressure", "Barrels and Blockers", ["x-bluffing", "f-bet-sizing"], "Plan bets across streets and pick bluffs that remove the opponent's best hands.", "Blockers matter more than the board.", ["worked", "decision"], { ...L("t4-barreling-blockers") }),

  // ── 7 Reading people
  node("h-range-narrowing", "people", "Narrowing Ranges Street by Street", ["f-ranges", "f-cbet"], "Each action removes hands; track what remains.", "Ranges stay the same after the flop.", ["worked", "decision"], { ...L("t5-range-narrowing") }),
  node("h-player-types", "people", "Player Types", ["h-range-narrowing"], "Spot calling stations, nits, TAGs, LAGs, trappers, drawers and sharks from what they do, measured against a balanced baseline.", "Read people from body language online.", ["film", "match"], { ...L("t5-player-typing"), ...P(null, "calling-station") }),
  node("h-exploits", "people", "Beating Each Type", ["h-player-types"], "One adjustment per type: value bet the station, bluff the nit, trap the LAG.", "One style beats everyone.", ["match", "decision"]),

  // ── 8 Game theory
  node("g-toy-games", "theory", "Poker in Miniature", ["x-bluffing", "m-ev"], "A three-card game shows why bluffing at the right rate is required, not optional.", "Game theory is only for computers.", ["toy", "film"]),
  node("g-balance", "theory", "Balance and Indifference", ["g-toy-games", "x-mdf"], "Bet value and bluffs in a ratio that leaves the caller indifferent.", "Balanced means unpredictable at random.", ["toy", "worked"]),
  node("g-gto-to-exploit", "theory", "From Balance to Exploit", ["g-balance", "h-exploits"], "Start balanced; move away only when you have evidence of a leak.", "GTO and exploiting are opposites.", ["contrast", "decision"], { ...L("t5-gto-to-exploit") }),

  // ── 9 The player
  node("y-bankroll", "player", "Bankroll", ["w-luck-and-skill", "r-actions"], "Play stakes your bankroll can survive through normal variance.", "A good player can't go broke.", ["film", "toy"], { ...L("t6-bankroll") }),
  node("y-tilt", "player", "Tilt and the Mental Game", ["m-ev", "m-variance"], "Notice when results are steering decisions and reset to the math.", "Tilt only means getting angry.", ["film"], { ...L("t6-tilt") }),
  node("y-study", "player", "How to Study", ["w-the-academy", "m-variance"], "Review decisions, not results; spaced practice beats cramming.", "Playing more hands is the best way to improve.", ["film"]),

  // ── 10 Other tables (mostly later)
  node("o-multiway", "formats", "Multiway Pots", ["f-board-texture", "m-equity", "x-fold-equity"], "Hands lose value as players are added; bluff less, value bet tighter.", "More callers means more value for any hand.", ["worked", "decision"], { ...L("t6-multiway") }),
  node("o-heads-up", "formats", "Heads-Up Play", ["p-blind-defense", "h-player-types"], "Wider ranges and constant pressure when only two players remain.", "Play the same hands heads-up as at a full table.", ["match"], { scope: "later" }),
  node("o-tournaments-icm", "formats", "Tournaments and ICM", ["m-ev", "m-spr"], "Tournament chips are not money; survival value changes calls.", "Chip EV and money EV are the same in tournaments.", ["worked"], { ...L("t6-icm"), scope: "later" }),
  node("o-six-max", "formats", "Six-Handed Tables", ["p-open-raise", "o-multiway"], "More seats change opening ranges and multiway frequency.", "Open the same hands from every seat at every table size.", ["table"], { scope: "later" }),
  node("o-live", "formats", "Live Poker", ["r-first-hand", "h-player-types"], "Table etiquette, dealing, string bets and live tells.", "Online rules and live rules are the same.", ["film"], { scope: "later" }),
]);

// Paths through the tree: where a player starts and what they meet first.
export const PATHS = Object.freeze([
  { id: "brand-new", title: "Never played", start: "w-what-is-poker", note: "Welcome → How a Hand Plays → Reading the Board → Math Spine, in order." },
  { id: "knows-rules", title: "Knows the rules", start: "m-chance-as-share", note: "Welcome films stay open; a short rules check proves How a Hand Plays and Reading the Board instead of re-teaching them." },
  { id: "home-game", title: "Plays with friends", start: "m-outs", note: "Placement spots on rules and board reading; the Math Spine is the first required track." },
]);

// Structural checks: unique ids, known tracks, prerequisites that exist and come from the same or an
// earlier track, and no cycles. Returns a list of problems (empty when valid).
export function validateTree(nodes = NODES, tracks = TRACKS) {
  const problems = [];
  const byId = new Map();
  const trackN = new Map(tracks.map((t) => [t.id, t.n]));
  for (const n of nodes) {
    if (byId.has(n.id)) problems.push(`duplicate id ${n.id}`);
    byId.set(n.id, n);
    if (!trackN.has(n.track)) problems.push(`${n.id}: unknown track ${n.track}`);
  }
  for (const n of nodes) {
    for (const p of n.prereqs) {
      const q = byId.get(p);
      if (!q) { problems.push(`${n.id}: missing prereq ${p}`); continue; }
      if (trackN.get(q.track) > trackN.get(n.track)) problems.push(`${n.id}: prereq ${p} is in a later track`);
      if (q.scope === "later" && n.scope === "v1") problems.push(`${n.id}: v1 node depends on later node ${p}`);
    }
  }
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { problems.push(`cycle: ${[...trail, id].join(" → ")}`); return; }
    state.set(id, 1);
    for (const p of byId.get(id)?.prereqs || []) visit(p, [...trail, id]);
    state.set(id, 2);
  };
  for (const n of nodes) visit(n.id, []);
  return problems;
}

// Prerequisite depth (0 for roots): the shortest honest order a learner can meet a node.
export function depthOf(id, nodes = NODES) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const memo = new Map();
  const d = (x) => {
    if (memo.has(x)) return memo.get(x);
    const n = byId.get(x);
    const v = !n || !n.prereqs.length ? 0 : 1 + Math.max(...n.prereqs.map(d));
    memo.set(x, v);
    return v;
  };
  return d(id);
}
