// The multi-seat hand: blinds and positions, action order, raise rules, side pots, the runout.
//   node test/multiwayHand.test.js
const assert = require('node:assert/strict');
const { MultiwayHand, stackedDeck } = require('../src/table');

const six = (chips = [1000, 1000, 1000, 1000, 1000, 1000]) =>
  chips.map((c, i) => ({ id: `p${i}`, username: `P${i}`, chips: c, seat: i }));
const total = (h) => h.players.reduce((t, p) => t + p.chips, 0) + h.players.reduce((t, p) => t + p.committed, 0) * (h.result ? 0 : 1);

// Positions and blinds at six seats, button on seat 2.
{
  const h = new MultiwayHand({ players: six(), buttonSeat: 2, blinds: { small: 10, big: 20 } }).start();
  assert.deepEqual(h.players.map((p) => `${p.seat}:${p.position}`), ['2:BTN', '3:SB', '4:BB', '5:UTG', '0:HJ', '1:CO']);
  assert.equal(h.byId('p3').bet, 10);
  assert.equal(h.byId('p4').bet, 20);
  assert.equal(h.toAct, 'p5', 'UTG is first before the flop');
  assert.equal(h.players.every((p) => p.cards.length === 2), true);
  // Everyone folds round to the big blind.
  for (const id of ['p5', 'p0', 'p1', 'p2', 'p3']) assert.equal(h.act(id, 'fold').ok, true);
  assert.equal(h.result.wonBy, 'fold');
  assert.equal(h.byId('p4').chips, 1010, 'the big blind takes the small blind');
}

// Limp round: the big blind still has the option, then the flop starts left of the button.
{
  const h = new MultiwayHand({ players: six(), buttonSeat: 0, blinds: { small: 10, big: 20 } }).start();
  for (const id of ['p3', 'p4', 'p5', 'p0']) h.act(id, 'call');
  h.act('p1', 'call');
  assert.equal(h.toAct, 'p2');
  assert.equal(h.legalActions('p2').canCheck, true);
  assert.equal(h.legalActions('p2').canRaise, true);
  h.act('p2', 'check');
  assert.equal(h.phase, 'flop');
  assert.equal(h.board.length, 3);
  assert.equal(h.pot, 120);
  assert.equal(h.toAct, 'p1', 'the small blind acts first after the flop');
}

// Raise sizes: the min raise is the last full raise; an under-raise all-in does not reopen.
{
  const h = new MultiwayHand({ players: six([1000, 1000, 1000, 1000, 1000, 130]), buttonSeat: 0, blinds: { small: 10, big: 20 } }).start();
  // p3 UTG raises to 60 (a raise of 40), p4 calls, p5 (130 chips) shoves to 130 (a raise of 70).
  assert.equal(h.legalActions('p3').minRaiseTo, 40);
  assert.equal(h.act('p3', 'raise', 30).ok, false, 'below the min raise');
  h.act('p3', 'raise', 60);
  assert.equal(h.legalActions('p4').minRaiseTo, 100);
  h.act('p4', 'call');
  h.act('p5', 'all-in');
  assert.equal(h.currentBet, 130);
  assert.equal(h.minRaise, 70, 'a 70 raise is a full raise over 40');
  h.act('p0', 'fold'); h.act('p1', 'fold'); h.act('p2', 'fold');
  // p3 faced a full raise, so may raise again.
  assert.equal(h.legalActions('p3').canRaise, true);
}
{
  // Under-raise: UTG raises to 100 (raise of 80), the short stack shoves 150 (raise of 50 < 80).
  const h = new MultiwayHand({ players: six([1000, 1000, 1000, 1000, 150, 1000]), buttonSeat: 0, blinds: { small: 10, big: 20 } }).start();
  h.act('p3', 'raise', 100);
  h.act('p4', 'all-in');
  assert.equal(h.currentBet, 150);
  assert.equal(h.minRaise, 80, 'the short all-in does not change the raise size');
  for (const id of ['p5', 'p0', 'p1', 'p2']) h.act(id, 'fold');
  const legal = h.legalActions('p3');
  assert.equal(legal.canCall, true);
  assert.equal(legal.canRaise, false, 'the betting is not reopened for the raiser');
  h.act('p3', 'call');
  assert.equal(h.result.wonBy, 'showdown', 'nobody left to bet: the board runs out');
  assert.equal(h.board.length, 5);
}

// Side pots: three all-ins of different sizes, the shortest stack has the best hand.
{
  const deck = stackedDeck([
    // dealt from the small blind: p1, p2, p0 (button) then again
    'As', 'Kd', 'Qc',
    'Ah', 'Ks', 'Qd',
    // burn, flop, burn, turn, burn, river
    '2c', '7h', '8c', '3d', '4s', '9h', '5c', 'Jd',
  ]);
  const players = [
    { id: 'p0', chips: 300, seat: 0 },
    { id: 'p1', chips: 100, seat: 1 },
    { id: 'p2', chips: 200, seat: 2 },
  ];
  const h = new MultiwayHand({ players, buttonSeat: 0, blinds: { small: 10, big: 20 }, deck }).start();
  assert.equal(h.toAct, 'p0', 'three-handed the button is first before the flop');
  h.act('p0', 'all-in');
  h.act('p1', 'call');
  h.act('p2', 'call');
  assert.equal(h.result.wonBy, 'showdown');
  const pots = h.result.pots;
  assert.deepEqual(pots.map((p) => p.amount), [300, 200], 'main pot 3x100, side pot 2x100; p0 gets 100 uncalled back');
  assert.deepEqual(h.result.uncalled, [{ playerId: 'p0', amount: 100, phase: 'preflop' }]);
  assert.equal(h.byId('p1').chips, 300, 'aces win the main pot');
  assert.equal(h.byId('p2').chips, 200, 'kings win the side pot');
  assert.equal(h.byId('p0').chips, 100, 'queens get only the uncalled chips back');
  assert.equal(h.players.reduce((t, p) => t + p.chips, 0), 600);
}

// Split pot with an odd chip: the first winner left of the button gets it.
{
  // p1 and p2 both play the board's straight; p0 folds a blind.
  const deck = stackedDeck(['2c', '3c', '4d', '2d', '3d', '4h', '9c', 'Ts', 'Jh', 'Qd', '8c', 'Kc', '5c', 'As']);
  const players = [{ id: 'p0', chips: 1000, seat: 0 }, { id: 'p1', chips: 1000, seat: 1 }, { id: 'p2', chips: 1000, seat: 2 }];
  const h = new MultiwayHand({ players, buttonSeat: 0, blinds: { small: 5, big: 10, ante: 1 }, deck }).start();
  h.act('p0', 'call');
  h.act('p1', 'call');
  h.act('p2', 'check');
  h.act('p1', 'bet', 10); h.act('p2', 'call'); h.act('p0', 'fold');
  for (let s = 0; s < 2; s++) { h.act('p1', 'check'); h.act('p2', 'check'); }
  assert.equal(h.result.wonBy, 'showdown');
  assert.equal(h.result.pots.length, 1);
  assert.equal(h.result.pots[0].amount, 53);
  assert.deepEqual(h.result.pots[0].winners, ['p1', 'p2']);
  assert.equal(h.byId('p1').chips - h.byId('p2').chips, 1, 'the small blind, left of the button, gets the odd chip');
}

// Heads-up follows the heads-up rule.
{
  const h = new MultiwayHand({ players: [{ id: 'a', chips: 500, seat: 0 }, { id: 'b', chips: 500, seat: 3 }], buttonSeat: 3, blinds: { small: 10, big: 20 } }).start();
  assert.equal(h.byId('b').position, 'BTN');
  assert.equal(h.byId('b').bet, 10, 'the button posts the small blind');
  assert.equal(h.toAct, 'b', 'and acts first before the flop');
  h.act('b', 'call'); h.act('a', 'check');
  assert.equal(h.toAct, 'a', 'the big blind acts first after the flop');
}

// A paced runout stops with the hands open and deals street by street.
{
  const h = new MultiwayHand({ players: six([200, 1000, 1000, 1000, 1000, 1000]), buttonSeat: 0, blinds: { small: 10, big: 20 }, paced: true }).start();
  h.act('p3', 'fold'); h.act('p4', 'fold'); h.act('p5', 'fold');
  h.act('p0', 'all-in'); h.act('p1', 'fold'); h.act('p2', 'call');
  assert.equal(h.runout, true);
  assert.equal(h.board.length, 0);
  assert.ok(h.view('p3').players.find((p) => p.id === 'p0').cards, 'hands are tabled in a runout');
  assert.equal(h.view('p3').players.find((p) => p.id === 'p1').cards, null, 'folded hands stay hidden');
  assert.equal(h.advanceRunout(), null); assert.equal(h.board.length, 3);
  assert.equal(h.advanceRunout(), null); assert.equal(h.board.length, 4);
  assert.equal(h.advanceRunout(), null); assert.equal(h.board.length, 5);
  assert.ok(h.advanceRunout().wonBy === 'showdown');
}

// The view hides other players' cards mid-hand.
{
  const h = new MultiwayHand({ players: six(), buttonSeat: 0, blinds: { small: 10, big: 20 } }).start();
  const v = h.view('p2');
  assert.equal(v.players.filter((p) => p.cards).length, 1);
  assert.equal(v.legal.canFold, false, 'not p2s turn');
  assert.equal(h.view('p3').legal.canFold, true);
}

// Random play never creates or loses a chip, and every hand finishes.
{
  let seed = 7;
  const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let n = 0; n < 4000; n++) {
    const count = 2 + Math.floor(rng() * 5);
    const players = Array.from({ length: count }, (_, i) => ({ id: `x${i}`, chips: 1 + Math.floor(rng() * 600), seat: i * 1 }));
    const before = players.reduce((t, p) => t + p.chips, 0);
    const h = new MultiwayHand({ players, buttonSeat: Math.floor(rng() * count), blinds: { small: 5, big: 10, ante: rng() < 0.3 ? 2 : 0 }, rng }).start();
    let guard = 0;
    while (!h.result && guard++ < 200) {
      const id = h.toAct;
      assert.ok(id, `hand ${n} stalled with no one to act`);
      const l = h.legalActions(id);
      const r = rng();
      if (r < 0.15 && l.canFold) h.act(id, 'fold');
      else if (r < 0.35 && l.canRaise) {
        const to = l.minRaiseTo + Math.floor(rng() * (l.maxRaiseTo - l.minRaiseTo + 1));
        assert.equal(h.act(id, 'raise', to).ok, true);
      } else if (r < 0.42 && l.canRaise) h.act(id, 'all-in');
      else if (l.canCheck) h.act(id, 'check');
      else assert.equal(h.act(id, 'call').ok, true);
    }
    assert.ok(h.result, `hand ${n} finished`);
    assert.equal(h.players.reduce((t, p) => t + p.chips, 0), before, `hand ${n} kept every chip`);
    assert.ok(h.players.every((p) => p.chips >= 0));
  }
}

void total;
console.log('multiwayHand: ok');
