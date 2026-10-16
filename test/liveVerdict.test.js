// The table coach's live verdict (src/review/liveVerdict.js) must match the stored story the
// server builds from the same hand, decision for decision: one verdict per spot.
const assert = require('assert');
const { buildMatchStoryFromDocs, buildReplayTimeline, liveSpotVerdict, getReviewEngine } = require('../src/review');

const HERO = 'hero-1';
const OPP = 'opp-1';
const card = (rank, suit) => ({ rank, suit });
const act = (playerId, phase, action, amount) => ({ playerId, phase, action, amount });

const mkHand = (id, handNumber, heroCards, community, actions, heroStart = 10000, oppStart = 10000) => ({
  _id: id,
  handNumber,
  players: [
    { userId: HERO, username: 'hero', position: 'BTN', startingChips: heroStart, cards: heroCards, isDealer: true, isSmallBlind: true },
    { userId: OPP, username: 'maya', position: 'BB', startingChips: oppStart, cards: [card('7', '♦'), card('7', '♣')], isBigBlind: true },
  ],
  communityCards: community,
  actions,
});

const hands = [
  // Top pair folds the turn to a bet it should call; calls the flop.
  mkHand('a', 1, [card('A', '♠'), card('K', '♠')], [card('K', '♥'), card('7', '♥'), card('2', '♠'), card('J', '♥')], [
    act(HERO, 'blinds', 'small blind', 50), act(OPP, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'raise', 250), act(OPP, 'preflop', 'call', 200),
    act(OPP, 'flop', 'raise', 400), act(HERO, 'flop', 'call', 400),
    act(OPP, 'turn', 'raise', 900), act(HERO, 'turn', 'fold', 0),
  ]),
  // Calls a river shove with nothing, then nothing else.
  mkHand('b', 2, [card('9', '♣'), card('8', '♦')], [card('K', '♠'), card('Q', '♦'), card('4', '♣'), card('4', '♥'), card('2', '♥')], [
    act(HERO, 'blinds', 'small blind', 50), act(OPP, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'call', 50), act(OPP, 'preflop', 'check', 0),
    act(OPP, 'flop', 'check', 0), act(HERO, 'flop', 'check', 0),
    act(OPP, 'turn', 'check', 0), act(HERO, 'turn', 'check', 0),
    act(OPP, 'river', 'all-in', 1900), act(HERO, 'river', 'call', 1900),
  ], 10000, 2000),
  // Checks back the river with a big hand (missed value); faces a raised pot preflop.
  mkHand('c', 3, [card('Q', '♣'), card('Q', '♦')], [card('Q', '♠'), card('8', '♦'), card('3', '♣'), card('2', '♠'), card('9', '♥')], [
    act(HERO, 'blinds', 'small blind', 50), act(OPP, 'blinds', 'big blind', 100),
    act(HERO, 'preflop', 'call', 50), act(OPP, 'preflop', 'raise', 200),
    act(HERO, 'preflop', 'call', 200),
    act(OPP, 'flop', 'check', 0), act(HERO, 'flop', 'raise', 300), act(OPP, 'flop', 'call', 300),
    act(OPP, 'turn', 'check', 0), act(HERO, 'turn', 'check', 0),
    act(OPP, 'river', 'check', 0), act(HERO, 'river', 'check', 0),
  ]),
];

const engine = getReviewEngine();
const { story } = buildMatchStoryFromDocs(hands, HERO, engine);
const ROUND = { blinds: 'preflop', preflop: 'preflop', flop: 'flop', turn: 'turn', river: 'river' };

let compared = 0;
let judged = 0;
hands.forEach((doc) => {
  const timeline = buildReplayTimeline(doc, HERO);
  let raisedPreflop = false;
  timeline.frames.forEach((frame) => {
    if (frame.isHeroDecision) {
      const live = liveSpotVerdict({
        handId: doc._id,
        handNumber: doc.handNumber,
        phase: frame.phase,
        holeCards: timeline.hero.cards,
        board: frame.boardCards,
        action: frame.action,
        amount: frame.amount,
        toCall: frame.toCall,
        potBefore: frame.potBefore,
        bigBlind: timeline.bigBlind,
        raisedPreflop,
      }, engine);
      const stored = story.spots.find((s) => s.handId === doc._id && s.frameIndex === frame.index);
      assert.ok(stored, `stored spot for ${doc._id}:${frame.index}`);
      assert.ok(live, `live verdict for ${doc._id}:${frame.index}`);
      const pick = (s) => ({ phase: s.phase, action: s.action, playerGrade: s.playerGrade, sharePct: s.sharePct, pricePct: s.pricePct, costEst: s.costEst, better: s.better });
      assert.deepStrictEqual(pick(live.spot), pick(stored), `same verdict at ${doc._id}:${frame.index}`);
      compared += 1;
      if (live.copy) judged += 1;
    }
    if (ROUND[frame.phase] === 'preflop' && frame.actor !== 'blinds' && /raise|all-in/.test(String(frame.action))) raisedPreflop = true;
  });
});
assert.ok(compared >= 9, `compared ${compared} decisions`);
assert.ok(judged >= 3, `${judged} judged decisions carry copy`);

// The copy is verdictCopy's three parts, never an opponent detail.
const shove = liveSpotVerdict({
  handId: 'b', phase: 'river', holeCards: hands[1].players[0].cards, board: hands[1].communityCards,
  action: 'call', amount: 1900, toCall: 1900, potBefore: 2100, bigBlind: 100,
});
assert.strictEqual(shove.copy.headline, 'Paid too much');
assert.match(shove.copy.why, /^You needed \d+% to call and had about \d+%, so folding saves chips\.$/);
assert.match(shove.copy.stake, /^[\d,]+ chips overpaid \(est\.\)$/);
assert.strictEqual(shove.grade.label, 'Punt');
assert.ok(!/bot|\bAI\b|maya/i.test(JSON.stringify(shove.copy)), 'copy names nobody');

// An unjudged decision (a preflop open) has a spot but no copy; bad input is null.
const open = liveSpotVerdict({ phase: 'preflop', holeCards: hands[0].players[0].cards, board: [], action: 'raise', amount: 250, toCall: 50, potBefore: 150, bigBlind: 100 });
assert.strictEqual(open.copy, null);
assert.strictEqual(liveSpotVerdict({ phase: 'flop', holeCards: [], action: 'call' }), null);
assert.strictEqual(liveSpotVerdict(null), null);

console.log(`liveVerdict: ${compared} live verdicts match the stored story (${judged} judged)`);
