"use strict";
// Original narrative pack for the living Gauntlet (F52-V1-CONTRACT-1 §10). One entry per existing
// canonical roster bot (src/data/botRoster.js, read only, 16 ids); this adds no bot, rating, style or
// unlock rule. Lines describe only what a player can see at the table (public betting habits) and
// never claim to know cards, intent or feelings. After-win lines never call a single result mastery.
//
// `canonicalBotId` and `archetype` are checked against the roster at load; a mismatch throws, so the
// pack cannot drift from the canonical ladder silently.

const { BOT_ROSTER_BY_ID } = require("../../data/botRoster");
const { canonical, sha256, deepFreeze } = require("./common.cjs");

const PACK_ID = "gauntlet-rival-narratives";
const PACK_VERSION = "1";

const R = (canonicalBotId, archetype, epithet, tableHabit, intro, rematch, afterWin, afterLoss, afterTie) => ({
  rivalId: `rival-${canonicalBotId}`, canonicalBotId, archetype, epithet, tableHabit, lines: { intro, rematch, afterWin, afterLoss, afterTie },
});

const RIVALS = [
  // Clubshire
  R("rookie-bob", "calling-station", "The Open Door",
    "Calls most bets and rarely raises.",
    "Bob keeps a seat warm at the first table and calls just about anything. Bet your good hands.",
    "Bob already has the chips stacked. Same table, new match.",
    "Bob pushes his chips over. One match is one match; the habits show over many.",
    "Bob scoops it. He called a lot, so the next question is what you bet and when.",
    "Even. Bob shrugs and deals again."),
  R("slow-steve", "nit", "The Long Wait",
    "Plays few hands and bets small when he does.",
    "Steve folds and folds, then shows up with a bet. When he finally puts chips in, notice the size.",
    "Steve is back in his chair, still in no hurry.",
    "You took this one from Steve. Keep an eye on what his bet sizes told you.",
    "Steve waited and it worked for him today. Look back at the hands he chose to play.",
    "A draw. Steve nods and settles back in."),
  R("lucky-larry", "drawer", "The Long Shot",
    "Chases draws and bets them hard.",
    "Larry loves a draw and will pay to see the next card. Make him pay the right price.",
    "Larry says the cards owe him one. They don't, but here he is.",
    "Larry's draws missed enough tonight. A short match can swing either way.",
    "Larry got there this time. Check whether the price he paid was ever right.",
    "Split down the middle. Larry calls it a sign."),
  R("friendly-frank", "calling-station", "The Good Sport",
    "Calls wide and almost never raises first.",
    "Frank is happy to call and happy to chat. Thin value bets are how you get paid here.",
    "Frank waves you back over for another round.",
    "Frank tips his cap. Winning once doesn't mean the lesson is learned; the review will show it.",
    "Frank's calls held up. See which of your bets he was always going to call.",
    "Frank laughs. A tie suits him fine."),
  // Chip Mine
  R("cautious-claire", "nit", "The Careful Count",
    "Opens a tight range and gives up when raised.",
    "Claire opens only strong hands and rarely fights back after a raise. Your seat matters here.",
    "Claire has the ledger open again.",
    "You won this one. Claire writes it down without comment.",
    "Claire's tight opens paid off. Compare her ranges to yours in the review.",
    "Level. Claire marks it and resets the stacks."),
  R("solid-sarah", "tag", "The Straight Line",
    "Plays a solid range and bets most flops she raised.",
    "Sarah plays straightforward poker: fewer hands, more bets. The flop texture is where to push back.",
    "Sarah nods. She plays it the same way every time.",
    "Sarah shakes your hand. The result is recorded; the read takes more hands.",
    "Sarah's steady bets held up. Look at the boards where you let her take the pot.",
    "Even match. Sarah already has the next deck out."),
  R("tricky-tom", "trapper", "The Quiet Check",
    "Checks strong hands and raises late.",
    "Tom checks when you'd expect a bet and raises when you'd expect a fold. Count the checks.",
    "Tom is back, checking his chips.",
    "You got past Tom's checks this time. One match won't show every trick.",
    "Tom's late raises caught you. The review walks through the spots where he checked.",
    "A draw with Tom. He seems fine with that."),
  R("aggressive-alex", "lag", "The Full Throttle",
    "Raises often and keeps betting on later streets.",
    "Alex raises a lot and keeps the pressure on. Pick the hands you defend with before the bets start.",
    "Alex is already raising the first hand back.",
    "You held up against Alex's pressure today. Pressure is a long game.",
    "Alex's bets kept coming. The review shows where folding was cheaper.",
    "Neither side broke. Alex wants another."),
  // Spade Keep
  R("position-pete", "tag", "The Late Seat",
    "Plays many more hands in late position than early.",
    "Pete likes acting last and plays far more hands from the button. Watch where he sits each hand.",
    "Pete has the button again, as usual.",
    "You beat Pete. His seat habits still show up over many hands.",
    "Pete's position did the work. Note which hands he played from late seats.",
    "Square. Pete moves the button and goes again."),
  R("mathematical-mike", "shark", "The Price Check",
    "Bets sizes that match the pot and calls at fair prices.",
    "Mike sizes every bet to the pot and calls when the price is right. Know your price before he does.",
    "Mike has his numbers ready for another match.",
    "Mike concedes. A single match is a small sample, and he'd say so.",
    "Mike priced it better tonight. Go over the calls where the pot gave you a number.",
    "Even. Mike calls it a fair result."),
  R("iron-warden", "shark", "The Steady Hand",
    "Mixes value bets and bluffs with the same sizes.",
    "The Warden uses the same bet sizes with strong hands and bluffs. The size alone won't tell you which.",
    "The Warden is waiting at the gate again.",
    "You got through the Warden today. Balance like his shows over many hands, not one.",
    "The Warden held. The review shows the spots where his sizes looked the same.",
    "Level match. The Warden stays put."),
  R("shade-stalker", "trapper", "The Low Light",
    "Slowplays big hands and check-raises often.",
    "The Stalker checks big hands and check-raises when you bet. Ask why the action stayed quiet.",
    "The Stalker is back, waiting for you to bet first.",
    "You won this one. The Stalker's check-raises take more than one match to map.",
    "The check-raises worked for the Stalker. The review marks each one.",
    "Draw. The Stalker deals again without a word."),
  // Final Table
  R("gem-golem", "shark", "The Solid Stack",
    "Builds pots carefully and sizes for the whole hand.",
    "The Golem plans its bets across every street. Think about the river before you call the flop.",
    "The Golem is stacked and ready.",
    "You chipped the Golem down. A win is a result, not a finished study.",
    "The Golem's sizing set up the river. The review traces the pot street by street.",
    "Even. The Golem rebuilds its stack."),
  R("neon-jester", "lag", "The Bright Noise",
    "Raises and re-raises very often.",
    "The Jester raises and re-raises constantly. Decide which hands stay in before the noise starts.",
    "The Jester is already raising.",
    "You outlasted the Jester today. It will be just as loud next time.",
    "The Jester's raises kept you off balance. See which folds were too quick.",
    "A tie with the Jester. It wants a rematch now."),
  R("mirage", "trapper", "The Heat Shimmer",
    "Checks and calls with a wide range, then bets late.",
    "Mirage calls with a wide range and bets late streets. Think about every hand that would play it that way.",
    "Mirage is back at the table, hard to pin down as ever.",
    "You won against Mirage. Reading a wide range takes many hands, not one.",
    "Mirage's late bets landed. The review lists the ranges that fit its line.",
    "Level. Mirage shuffles and waits."),
  R("the-house", "shark", "The Last Table",
    "Plays a balanced, patient game and closes out matches.",
    "The House plays patient, balanced poker and rarely gives anything away. Every chip counts here.",
    "The House is open for another match.",
    "You beat The House this time. The record keeps it; the next match starts fresh.",
    "The House closed it out. The review shows where the match turned.",
    "Even with The House. It deals again."),
];

// Roster check at load: every rival names a real roster bot with the same archetype, ids unique.
const seen = new Set();
for (const r of RIVALS) {
  const bot = BOT_ROSTER_BY_ID[r.canonicalBotId];
  if (!bot) throw new Error(`rival narrative names unknown roster bot ${r.canonicalBotId}`);
  if (bot.archetype !== r.archetype) throw new Error(`rival narrative archetype drift for ${r.canonicalBotId}`);
  if (seen.has(r.rivalId)) throw new Error(`duplicate rival ${r.rivalId}`);
  seen.add(r.rivalId);
}

const RIVAL_NARRATIVES = deepFreeze(RIVALS);
const NARRATIVE_PACK_SHA256 = sha256(canonical({ id: PACK_ID, version: PACK_VERSION, rivals: RIVAL_NARRATIVES }));
const NARRATIVE_PACK_REF = deepFreeze({ id: PACK_ID, version: PACK_VERSION, sha256: NARRATIVE_PACK_SHA256 });
const NARRATIVE_BY_RIVAL_ID = deepFreeze(Object.fromEntries(RIVAL_NARRATIVES.map((r) => [r.rivalId, r])));

module.exports = { RIVAL_NARRATIVES, NARRATIVE_PACK_REF, NARRATIVE_BY_RIVAL_ID };
