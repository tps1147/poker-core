// A six-max hand in Match Review (2.0 finish): the replay timeline reads it against the field, and
// the stored story grades only the spots where one opponent was left.
const assert = require('assert');
const { buildMatchStoryFromDocs, buildReplayTimeline, getReviewEngine } = require('../src/review');

const HERO = 'hero-1';
const card = (rank, suit) => ({ rank, suit });
const act = (playerId, phase, action, amount) => ({ playerId, phase, action, amount });
const seat = (userId, username, s, extra = {}) => ({ userId, username, seat: s, startingChips: 1500, cards: [], ...extra });

const doc = {
  _id: 'm1',
  handNumber: 1,
  players: [
    seat('a', 'ava', 'BTN'), seat('b', 'ben', 'SB'), seat('c', 'cal', 'BB'),
    seat(HERO, 'hero', 'UTG', { cards: [card('A', '♠'), card('K', '♠')] }),
    seat('d', 'dee', 'HJ', { cards: [card('Q', '♥'), card('Q', '♦')] }), seat('e', 'eli', 'CO'),
  ],
  communityCards: [card('K', '♥'), card('7', '♥'), card('2', '♠'), card('J', '♥'), card('3', '♣')],
  actions: [
    act('a', 'blinds', 'ante', 10), act('b', 'blinds', 'small blind', 10), act('c', 'blinds', 'big blind', 20),
    act(HERO, 'preflop', 'raise', 60), act('d', 'preflop', 'call', 60), act('e', 'preflop', 'fold', 0),
    act('a', 'preflop', 'fold', 0), act('b', 'preflop', 'fold', 0), act('c', 'preflop', 'call', 40),
    // Three-way flop: shown, not graded.
    act('c', 'flop', 'check', 0), act(HERO, 'flop', 'bet', 100), act('d', 'flop', 'raise', 300), act('c', 'flop', 'fold', 0),
    // Heads-up from here: graded.
    act(HERO, 'flop', 'call', 200),
    act(HERO, 'turn', 'check', 0), act('d', 'turn', 'bet', 400), act(HERO, 'turn', 'fold', 0),
  ],
  winner: { userId: 'd', amount: 1240 },
  showdown: { occurred: false },
};

const t = buildReplayTimeline(doc, HERO);
assert.ok(t, 'a six-max hand has a timeline');
assert.equal(t.field, 6);
assert.equal(t.hero.seat, 'UTG');
assert.equal(t.opponent.name, 'dee', 'the opponent is the player left against the hero');
assert.deepEqual(t.opponent.cards, [], 'no showdown, no cards');
const at = (i) => t.frames[i];
assert.equal(at(0).potAfter, 10, 'the ante goes to the pot');
assert.equal(at(3).toCall, 20, 'the hero faces the big blind; the ante is not a bet');
assert.equal(at(3).liveOpponents, 5);
assert.equal(at(3).isHeroDecision, false, 'five opponents in: shown, not graded');
assert.equal(at(10).isHeroDecision, false, 'a three-way flop is not graded');
assert.equal(at(13).toCall, 200, 'the hero faces the raise of the deepest bet in front');
assert.equal(at(13).liveOpponents, 1);
assert.equal(at(13).isHeroDecision, true);
assert.equal(at(16).toCall, 400);
assert.equal(at(16).potBefore, 10 + 10 + 20 + 60 + 60 + 40 + 100 + 300 + 200 + 400);
assert.equal(at(16).isHeroDecision, true);

const { story } = buildMatchStoryFromDocs([doc], HERO, getReviewEngine());
assert.equal(story.beads.length, 1);
const judged = story.spots.filter((s) => s.playerGrade);
assert.ok(judged.length >= 1 && judged.length <= 2, 'only the heads-up spots are judged');
assert.ok(judged.every((s) => s.spotId.endsWith(':13') || s.spotId.endsWith(':16')));

// Heads-up docs keep the heads-up path.
const hu = { ...doc, players: doc.players.slice(3, 5), actions: [act(HERO, 'blinds', 'small blind', 10), act('d', 'blinds', 'big blind', 20), act(HERO, 'preflop', 'fold', 0)] };
assert.equal(buildReplayTimeline(hu, HERO).field, undefined);

console.log('multiwayReview: ok');
