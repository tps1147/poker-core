// THE SIT-AND-GO. One table, everyone starts with the same stack, the blinds go up on a clock,
// and play goes on until one player has every chip. Pure: the caller passes the time in and
// drives each hand through `sng.hand` (a MultiwayHand). Places are decided here; what a place is
// worth (rating) is the server's business.
//
//   const sng = new SitAndGo({ players, structure: 'turbo6', now });
//   sng.startHand({ now });          // deals the next hand at the current level's blinds
//   sng.hand.act(id, 'call');        // ...until sng.hand.result
//   sng.finishHand({ now });         // settles stacks, knocks out the busted, moves the button
//   sng.over / sng.places            // 1st is the last player standing
//
// Two knocked out on the same hand: the one who started that hand with more chips finishes
// higher (the usual rule); equal stacks go by seat, so a place is never shared.
'use strict';

const { MultiwayHand, shuffle } = require('./multiwayHand');

const LEVELS = Object.freeze([
  { small: 10, big: 20, ante: 0 },
  { small: 15, big: 30, ante: 0 },
  { small: 25, big: 50, ante: 0 },
  { small: 50, big: 100, ante: 0 },
  { small: 75, big: 150, ante: 15 },
  { small: 100, big: 200, ante: 25 },
  { small: 150, big: 300, ante: 40 },
  { small: 200, big: 400, ante: 50 },
  { small: 300, big: 600, ante: 75 },
  { small: 400, big: 800, ante: 100 },
  { small: 600, big: 1200, ante: 150 },
  { small: 1000, big: 2000, ante: 250 },
]);

// A level is three minutes: a six-player turbo lasts about twenty-five minutes on a phone.
const STRUCTURES = Object.freeze({
  turbo6: Object.freeze({ id: 'turbo6', seats: 6, startingStack: 1500, levelMs: 3 * 60 * 1000, levels: LEVELS }),
  hyper6: Object.freeze({ id: 'hyper6', seats: 6, startingStack: 500, levelMs: 60 * 1000, levels: LEVELS }),
});

function structureOf(s) {
  if (s && typeof s === 'object') return s;
  return STRUCTURES[s] || STRUCTURES.turbo6;
}

// Where a level stands at a given time.
function levelAt(structure, elapsedMs) {
  const st = structureOf(structure);
  const raw = Math.floor(Math.max(0, elapsedMs) / st.levelMs);
  const index = Math.min(st.levels.length - 1, raw);
  const endsInMs = index === st.levels.length - 1 ? null : (index + 1) * st.levelMs - Math.max(0, elapsedMs);
  return { index, blinds: st.levels[index], next: st.levels[index + 1] || null, endsInMs };
}

// A finish as a score from 1 (won) to 0 (first out), for anything that rates a place.
function placementScore(place, field) {
  if (field <= 1) return 1;
  return (field - place) / (field - 1);
}

class SitAndGo {
  constructor({ players, structure = 'turbo6', now = Date.now(), rng = Math.random, seatOrder = null, buttonSeat = null }) {
    this.structure = structureOf(structure);
    const st = this.structure;
    if (!players || players.length < 2) throw new Error('SitAndGo: at least two players');
    if (players.length > st.seats) throw new Error(`SitAndGo: at most ${st.seats} players`);
    const order = seatOrder ? players.slice() : shuffle(players, rng);
    this.seats = order.map((p, seat) => ({ id: String(p.id), username: p.username || String(p.id), seat, chips: st.startingStack }));
    this.field = this.seats.length;
    this.startedAt = now;
    this.clockOffsetMs = 0; // the dev panel moves the clock with jumpToLevel
    this.buttonSeat = buttonSeat != null ? buttonSeat : this.seats[Math.floor(rng() * this.seats.length)].seat;
    this.handNumber = 0;
    this.hand = null;
    this.places = []; // { id, place, handNumber }
    this.rng = rng;
  }

  alive() { return this.seats.filter((s) => s.chips > 0); }
  get over() { return this.alive().length <= 1; }
  elapsed(now) { return now - this.startedAt + this.clockOffsetMs; }
  level(now = Date.now()) { return levelAt(this.structure, this.elapsed(now)); }

  jumpToLevel(index, now = Date.now()) {
    const target = Math.max(0, Math.min(this.structure.levels.length - 1, index)) * this.structure.levelMs;
    this.clockOffsetMs += target - this.elapsed(now);
  }

  startHand({ now = Date.now(), deck = null, paced = false } = {}) {
    if (this.over) throw new Error('SitAndGo: the tournament is over');
    if (this.hand && !this.hand.result) throw new Error('SitAndGo: a hand is still being played');
    this.handNumber += 1;
    const { blinds, index } = this.level(now);
    this.levelIndex = index;
    this.hand = new MultiwayHand({
      players: this.alive().map((s) => ({ id: s.id, username: s.username, chips: s.chips, seat: s.seat })),
      buttonSeat: this.buttonSeat,
      blinds,
      deck,
      paced,
      handNumber: this.handNumber,
      rng: this.rng,
    }).start();
    this.buttonSeat = this.hand.buttonSeat;
    return this.hand;
  }

  // After the hand has a result: stacks back to the seats, the busted knocked out, button moved.
  finishHand() {
    const hand = this.hand;
    if (!hand || !hand.result) throw new Error('SitAndGo: no finished hand');
    if (hand.settledIntoTable) return { knockedOut: [] };
    hand.settledIntoTable = true;
    for (const p of hand.players) this.seatOf(p.id).chips = p.chips;
    const busted = hand.players
      .filter((p) => p.chips === 0)
      .sort((a, b) => (a.startingChips - b.startingChips) || (b.seat - a.seat));
    // Worst finish first: the smallest starting stack is the first out.
    const knockedOut = [];
    for (const p of busted) {
      const place = this.alive().length + (busted.length - knockedOut.length);
      knockedOut.push({ id: p.id, place, handNumber: this.handNumber });
    }
    this.places.push(...knockedOut);
    if (this.over) {
      const champ = this.alive()[0];
      if (champ) this.places.push({ id: champ.id, place: 1, handNumber: this.handNumber });
    } else {
      this.buttonSeat = this.nextSeatWithChips(this.buttonSeat);
    }
    return { knockedOut };
  }

  seatOf(id) { return this.seats.find((s) => s.id === String(id)) || null; }

  nextSeatWithChips(fromSeat) {
    const n = this.structure.seats;
    for (let k = 1; k <= n; k++) {
      const seat = (fromSeat + k) % n;
      const s = this.seats.find((x) => x.seat === seat);
      if (s && s.chips > 0) return seat;
    }
    return fromSeat;
  }

  placeOf(id) {
    const p = this.places.find((x) => x.id === String(id));
    return p ? p.place : null;
  }

  // The table as anyone may see it, plus that player's own hand.
  view(forId = null, now = Date.now()) {
    const level = this.level(now);
    return {
      structure: this.structure.id,
      field: this.field,
      left: this.alive().length,
      level: { index: level.index, number: level.index + 1, blinds: level.blinds, next: level.next, endsInMs: level.endsInMs },
      buttonSeat: this.buttonSeat,
      seats: this.seats.map((s) => ({ id: s.id, username: s.username, seat: s.seat, chips: s.chips, place: this.placeOf(s.id) })),
      places: this.places.slice().sort((a, b) => a.place - b.place),
      over: this.over,
      hand: this.hand ? this.hand.view(forId) : null,
    };
  }
}

module.exports = { SitAndGo, SNG_STRUCTURES: STRUCTURES, SNG_LEVELS: LEVELS, levelAt, placementScore };
