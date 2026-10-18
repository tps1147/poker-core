// The sit-and-go: the blind clock, knockouts and places, the moving button, a full game to a winner.
//   node test/sitAndGo.test.js
const assert = require('node:assert/strict');
const { SitAndGo, SNG_STRUCTURES, levelAt, placementScore } = require('../src/table');

// The clock.
{
  const st = SNG_STRUCTURES.turbo6;
  assert.equal(levelAt(st, 0).index, 0);
  assert.equal(levelAt(st, st.levelMs - 1).index, 0);
  assert.equal(levelAt(st, st.levelMs).index, 1);
  assert.equal(levelAt(st, st.levelMs * 99).index, st.levels.length - 1, 'the last level holds');
  assert.equal(levelAt(st, st.levelMs * 99).endsInMs, null);
  assert.equal(levelAt(st, 1000).endsInMs, st.levelMs - 1000);
  assert.deepEqual([placementScore(1, 6), placementScore(6, 6), placementScore(3, 5)], [1, 0, 0.5]);
}

const players = Array.from({ length: 6 }, (_, i) => ({ id: `u${i}`, username: `U${i}` }));

// Seats, stacks, the level jump.
{
  const sng = new SitAndGo({ players, now: 0, seatOrder: true, buttonSeat: 0 });
  assert.equal(sng.seats.length, 6);
  assert.ok(sng.seats.every((s) => s.chips === 1500));
  sng.jumpToLevel(4, 1000);
  assert.equal(sng.level(1000).index, 4);
  const hand = sng.startHand({ now: 1000 });
  assert.equal(hand.blinds.ante, 15, 'antes from level five');
  assert.equal(sng.view('u1', 1000).level.number, 5);
}

// Knockouts: two out on one hand, the bigger starting stack places higher.
{
  const sng = new SitAndGo({ players: players.slice(0, 4), now: 0, seatOrder: true, buttonSeat: 0 });
  sng.seats[1].chips = 100; sng.seats[2].chips = 300; sng.seats[3].chips = 4600; sng.seats[0].chips = 1000;
  const h = sng.startHand({
    now: 0,
    // dealt from the small blind (u1): u1, u2, u3, u0, then again; u3 makes quads.
    deck: ['2c', '3d', 'Ah', '7s', '2d', '4c', 'As', '8s', 'Jh', 'Ad', 'Ac', '9d', 'Kh', 'Qs', '5h', 'Th'],
  });
  h.act('u3', 'all-in'); // UTG... four-handed the first to act is CO, seat 3
  h.act('u0', 'fold');
  h.act('u1', 'call');
  h.act('u2', 'call');
  assert.ok(h.result);
  const { knockedOut } = sng.finishHand();
  assert.deepEqual(knockedOut.map((k) => [k.id, k.place]), [['u1', 4], ['u2', 3]]);
  assert.equal(sng.alive().length, 2);
  assert.equal(sng.buttonSeat, 3, 'the button moves to the next seat with chips');
}

// A whole tournament of random play ends with one player holding every chip and six places.
{
  let seed = 11;
  const rng = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let game = 0; game < 30; game++) {
    let now = 0;
    const sng = new SitAndGo({ players, structure: 'hyper6', now, rng });
    let hands = 0;
    while (!sng.over && hands++ < 3000) {
      const h = sng.startHand({ now });
      while (!h.result) {
        const id = h.toAct;
        const l = h.legalActions(id);
        const r = rng();
        if (r < 0.3 && l.canFold) h.act(id, 'fold');
        else if (r < 0.45 && l.canRaise) h.act(id, 'all-in');
        else if (l.canCheck) h.act(id, 'check');
        else h.act(id, 'call');
      }
      sng.finishHand();
      now += 20000;
      assert.equal(sng.seats.reduce((t, s) => t + s.chips, 0), 6 * 500, 'chips are conserved');
    }
    assert.ok(sng.over, 'the tournament finishes');
    assert.deepEqual(sng.places.map((p) => p.place).sort(), [1, 2, 3, 4, 5, 6]);
    const winner = sng.places.find((p) => p.place === 1);
    assert.equal(sng.seatOf(winner.id).chips, 3000);
    assert.throws(() => sng.startHand({ now }), /over/);
  }
}

console.log('sitAndGo: ok');
