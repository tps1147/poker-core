// THE MULTI-SEAT HAND. One hand of no-limit hold'em for 2 to 9 players: antes and blinds (a short
// stack posts what it has), the deal, four betting rounds, side pots, and the showdown. Pure and
// synchronous; the caller owns timers, sockets and persistence. Heads-up follows the heads-up rule
// (the button posts the small blind, acts first before the flop and last after it), so the same
// engine can deal the last two players of a sit-and-go.
//
// Rules that are easy to get wrong, written down once:
//   - A raise must be at least the last full raise on this street (the big blind before any). An
//     all-in for less is allowed, but it does not reopen the betting: a player who has already
//     acted since the last full raise may only call or fold.
//   - At the end of each betting round, the part of the top bet nobody matched goes back to its
//     owner (the uncalled bet), so it never sits in a pot nobody contested.
//   - Pots are built from what each player put in over the whole hand. Folded chips stay in the
//     pots; a folded player is never eligible. The odd chip of a split goes to the first winner
//     left of the button.
//   - When at most one player can still bet, the board runs out. With `paced: true` the hand stops
//     with `runout: true` and the caller deals each street with advanceRunout(), so a live table
//     can show the board card by card.
'use strict';

const { evaluateHand, compareHands } = require('../eval/pokerEvaluator');

const PHASES = Object.freeze({ PREFLOP: 'preflop', FLOP: 'flop', TURN: 'turn', RIVER: 'river', SHOWDOWN: 'showdown', DONE: 'done' });
const NEXT_STREET = { preflop: 'flop', flop: 'turn', turn: 'river' };
const STREET_CARDS = { flop: 3, turn: 1, river: 1 };

const RANKS = '23456789TJQKA';
const SUITS = '♠♥♦♣';

function freshDeck() {
  const cards = [];
  for (const suit of SUITS) for (const rank of RANKS) cards.push({ rank, suit });
  return cards;
}

function shuffle(cards, rng = Math.random) {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const cardKey = (c) => `${c.rank}${c.suit}`;

// A stacked deck: the cards named first come off first, then the rest of a shuffled deck. Cards
// may be written 'As' / 'Td' or as { rank, suit }. Lets tests and the dev panel deal a known spot.
const LETTER_SUITS = { s: '♠', h: '♥', d: '♦', c: '♣' };
function parseCard(c) {
  if (c && typeof c === 'object') return { rank: c.rank, suit: LETTER_SUITS[c.suit] || c.suit };
  const s = String(c);
  return { rank: s[0].toUpperCase(), suit: LETTER_SUITS[s[1].toLowerCase()] || s[1] };
}
function stackedDeck(top = [], rng = Math.random) {
  const wanted = top.map(parseCard);
  const used = new Set(wanted.map(cardKey));
  if (used.size !== wanted.length) throw new Error('stackedDeck: a card is named twice');
  return wanted.concat(shuffle(freshDeck().filter((c) => !used.has(cardKey(c))), rng));
}

// Position names by table size, starting from the button and going round to the left.
const POSITION_NAMES = {
  2: ['BTN', 'BB'],
  3: ['BTN', 'SB', 'BB'],
  4: ['BTN', 'SB', 'BB', 'CO'],
  5: ['BTN', 'SB', 'BB', 'HJ', 'CO'],
  6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'],
  7: ['BTN', 'SB', 'BB', 'UTG', 'LJ', 'HJ', 'CO'],
  8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'LJ', 'HJ', 'CO'],
  9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO'],
};

class MultiwayHand {
  /**
   * @param {object} o
   * @param {Array<{id,username?,chips,seat}>} o.players  everyone sitting with chips, any order
   * @param {number} o.buttonSeat  the seat number holding the button (must be a player's seat)
   * @param {{small:number,big:number,ante?:number}} o.blinds
   * @param {Array} [o.deck]  the deck to deal from, top card first (default: a fresh shuffle)
   * @param {boolean} [o.paced]  stop at an all-in and let the caller deal the runout
   * @param {number} [o.handNumber]
   */
  constructor({ players, buttonSeat, blinds, deck, paced = false, handNumber = 1, rng = Math.random }) {
    const seated = (players || []).filter((p) => p && p.chips > 0).slice().sort((a, b) => a.seat - b.seat);
    if (seated.length < 2) throw new Error('MultiwayHand: at least two players with chips');
    if (seated.length > 9) throw new Error('MultiwayHand: at most nine players');
    // Order from the button round to the left.
    let b = seated.findIndex((p) => p.seat === buttonSeat);
    if (b < 0) b = seated.findIndex((p) => p.seat > buttonSeat) >= 0 ? seated.findIndex((p) => p.seat > buttonSeat) : 0;
    const order = seated.slice(b).concat(seated.slice(0, b));
    const names = POSITION_NAMES[order.length];
    this.players = order.map((p, i) => ({
      id: String(p.id),
      username: p.username || String(p.id),
      seat: p.seat,
      chips: p.chips,
      startingChips: p.chips,
      cards: [],
      bet: 0,
      committed: 0,
      folded: false,
      allIn: false,
      acted: false,
      actedOnRaise: -1,
      lastAction: null,
      position: names[i],
    }));
    this.blinds = { small: blinds.small, big: blinds.big, ante: blinds.ante || 0 };
    this.deck = deck ? deck.map(parseCard) : shuffle(freshDeck(), rng);
    this.paced = paced;
    this.handNumber = handNumber;
    this.buttonSeat = order[0].seat;
    this.board = [];
    this.phase = PHASES.PREFLOP;
    this.currentBet = 0;
    this.minRaise = this.blinds.big;
    this.fullRaiseCount = 0; // bumps on each full raise; an all-in for less leaves it alone
    this.toAct = null;
    this.runout = false;
    this.history = [];
    this.result = null;
    this.uncalled = [];
    this.started = false;
  }

  get headsUp() { return this.players.length === 2; }
  byId(id) { return this.players.find((p) => p.id === String(id)) || null; }
  indexOf(id) { return this.players.findIndex((p) => p.id === String(id)); }
  live() { return this.players.filter((p) => !p.folded); }
  canBet() { return this.players.filter((p) => !p.folded && !p.allIn); }

  // The next player at or after index i (going left) who can still bet.
  nextBettor(i) {
    const n = this.players.length;
    for (let k = 0; k < n; k++) {
      const p = this.players[(i + k) % n];
      if (!p.folded && !p.allIn) return p;
    }
    return null;
  }

  log(p, action, amount = 0) {
    this.history.push({ playerId: p.id, position: p.position, action, amount, phase: this.phase, bet: p.bet, chips: p.chips, currentBet: this.currentBet });
  }

  put(p, amount) {
    const paid = Math.max(0, Math.min(amount, p.chips));
    p.chips -= paid;
    p.bet += paid;
    p.committed += paid;
    if (p.chips === 0) p.allIn = true;
    return paid;
  }

  start() {
    if (this.started) throw new Error('MultiwayHand: already started');
    this.started = true;
    const ps = this.players;
    if (this.blinds.ante > 0) {
      // Antes go straight to the pot, not into the bet to match.
      for (const p of ps) {
        const paid = this.put(p, this.blinds.ante);
        p.bet -= paid;
        this.history.push({ playerId: p.id, position: p.position, action: 'ante', amount: paid, phase: 'blinds' });
      }
    }
    const sbIndex = this.headsUp ? 0 : 1;
    const bbIndex = this.headsUp ? 1 : 2;
    const sb = ps[sbIndex];
    const bb = ps[bbIndex];
    const sbPaid = this.put(sb, this.blinds.small);
    this.history.push({ playerId: sb.id, position: sb.position, action: 'small blind', amount: sbPaid, phase: 'blinds' });
    const bbPaid = this.put(bb, this.blinds.big);
    this.history.push({ playerId: bb.id, position: bb.position, action: 'big blind', amount: bbPaid, phase: 'blinds' });
    this.sbId = sb.id;
    this.bbId = bb.id;
    this.currentBet = Math.max(...ps.map((p) => p.bet));
    this.minRaise = this.blinds.big;
    // Two cards each, one at a time from the small blind, as a dealer would.
    for (let round = 0; round < 2; round++) {
      for (let k = 0; k < ps.length; k++) ps[(sbIndex + k) % ps.length].cards.push(this.deck.shift());
    }
    const first = this.nextBettor(bbIndex + 1);
    this.toAct = first ? first.id : null;
    this.settleIfRoundOver();
    return this;
  }

  legalActions(playerId) {
    const p = this.byId(playerId);
    const none = { canFold: false, canCheck: false, canCall: false, canRaise: false, callAmount: 0, minRaiseTo: 0, maxRaiseTo: 0, isBet: false };
    if (!p || this.toAct !== p.id || this.result || this.runout) return none;
    const owe = Math.max(0, this.currentBet - p.bet);
    const maxRaiseTo = p.bet + p.chips;
    const reopened = !p.acted || p.actedOnRaise < this.fullRaiseCount;
    // Someone else must be able to answer a raise.
    const othersCanBet = this.players.some((q) => q !== p && !q.folded && !q.allIn);
    const canRaise = reopened && othersCanBet && maxRaiseTo > this.currentBet;
    const minRaiseTo = Math.min(maxRaiseTo, this.currentBet + this.minRaise);
    return {
      canFold: owe > 0,
      canCheck: owe === 0,
      canCall: owe > 0,
      callAmount: Math.min(owe, p.chips),
      canRaise,
      minRaiseTo: canRaise ? minRaiseTo : 0,
      maxRaiseTo: canRaise ? maxRaiseTo : 0,
      isBet: this.currentBet === 0,
    };
  }

  /**
   * One decision. `amount` for bet/raise is the total the player's bet becomes this street.
   * Returns { ok, error }.
   */
  act(playerId, action, amount = 0) {
    const p = this.byId(playerId);
    if (!p) return { ok: false, error: 'not at this table' };
    if (this.result || this.runout) return { ok: false, error: 'the hand is not taking actions' };
    if (this.toAct !== p.id) return { ok: false, error: 'not your turn' };
    const legal = this.legalActions(p.id);
    let a = String(action).toLowerCase();
    if (a === 'allin' || a === 'all_in') a = 'all-in';
    if (a === 'bet') a = 'raise';
    if (a === 'all-in') {
      const to = p.bet + p.chips;
      if (to <= this.currentBet) a = 'call';
      else if (legal.canRaise) { a = 'raise'; amount = to; }
      else a = 'call';
    }
    switch (a) {
      case 'fold':
        if (!legal.canFold) {
          if (!legal.canCheck) return { ok: false, error: 'cannot fold' };
          // Folding when you could check is allowed at a real table; it is still a fold.
        }
        p.folded = true;
        p.lastAction = 'fold';
        this.log(p, 'fold');
        break;
      case 'check':
        if (!legal.canCheck) return { ok: false, error: 'cannot check, there is a bet to face' };
        p.lastAction = 'check';
        this.log(p, 'check');
        break;
      case 'call': {
        if (!legal.canCall) return { ok: false, error: 'nothing to call' };
        const paid = this.put(p, this.currentBet - p.bet);
        p.lastAction = p.allIn ? 'all-in' : 'call';
        this.log(p, p.lastAction, paid);
        break;
      }
      case 'raise': {
        if (!legal.canRaise) return { ok: false, error: 'cannot raise' };
        const to = Math.floor(Number(amount));
        if (!Number.isFinite(to)) return { ok: false, error: 'raise needs an amount' };
        const allInTo = p.bet + p.chips;
        if (to > allInTo) return { ok: false, error: 'more than your stack' };
        if (to < legal.minRaiseTo && to !== allInTo) return { ok: false, error: `raise to at least ${legal.minRaiseTo}` };
        const increment = to - this.currentBet;
        const wasBet = this.currentBet === 0;
        this.put(p, to - p.bet);
        if (increment >= this.minRaise) {
          this.minRaise = increment;
          this.fullRaiseCount += 1;
        }
        this.currentBet = to;
        p.lastAction = p.allIn ? 'all-in' : wasBet ? 'bet' : 'raise';
        this.log(p, p.lastAction, to);
        break;
      }
      default:
        return { ok: false, error: `unknown action ${action}` };
    }
    p.acted = true;
    p.actedOnRaise = this.fullRaiseCount;
    const i = this.indexOf(p.id);
    if (this.live().length === 1) {
      this.finishByFold();
      return { ok: true };
    }
    const next = this.nextBettor(i + 1);
    this.toAct = next ? next.id : null;
    this.settleIfRoundOver();
    return { ok: true };
  }

  roundOver() {
    const bettors = this.canBet();
    const maxBet = Math.max(0, ...this.live().map((p) => p.bet));
    if (bettors.length === 0) return true;
    // One player left who can bet: they are done once they have matched everyone else (raising
    // would be pointless, nobody could answer).
    if (bettors.length === 1) return bettors[0].bet >= maxBet;
    return bettors.every((p) => p.acted && p.bet === this.currentBet);
  }

  // The part of the top bet nobody matched goes back to whoever bet it.
  returnUncalled() {
    const sorted = this.players.map((p) => p.bet).sort((a, b) => b - a);
    const top = sorted[0];
    const second = sorted[1] || 0;
    if (top > second) {
      const owner = this.players.find((p) => p.bet === top);
      const back = top - second;
      owner.bet -= back;
      owner.committed -= back;
      owner.chips += back;
      if (owner.chips > 0) owner.allIn = false;
      this.uncalled.push({ playerId: owner.id, amount: back, phase: this.phase });
    }
  }

  settleIfRoundOver() {
    if (this.result) return;
    if (!this.roundOver()) return;
    this.returnUncalled();
    for (const p of this.players) { p.bet = 0; p.acted = false; p.actedOnRaise = -1; if (!p.folded && !p.allIn) p.lastAction = null; }
    this.currentBet = 0;
    this.minRaise = this.blinds.big;
    this.fullRaiseCount = 0;
    if (this.phase === PHASES.RIVER) { this.showdown(); return; }
    if (this.canBet().length <= 1) {
      // Nobody left to bet against: the board runs out.
      this.toAct = null;
      if (this.paced) { this.runout = true; return; }
      while (this.phase !== PHASES.RIVER) this.dealStreet();
      this.showdown();
      return;
    }
    this.dealStreet();
    // After the flop the first player left of the button acts; heads-up that is the big blind.
    const first = this.nextBettor(1 % this.players.length);
    this.toAct = first ? first.id : null;
    if (this.headsUp) {
      const bb = this.byId(this.bbId);
      if (bb && !bb.folded && !bb.allIn) this.toAct = bb.id;
    }
  }

  dealStreet() {
    const next = NEXT_STREET[this.phase];
    if (!next) return;
    this.deck.shift(); // burn
    for (let k = 0; k < STREET_CARDS[next]; k++) this.board.push(this.deck.shift());
    this.phase = next;
  }

  // One street of a paced runout. Returns the result once the river is out and the pots are paid.
  advanceRunout() {
    if (!this.runout) return this.result;
    if (this.phase !== PHASES.RIVER) { this.dealStreet(); return null; }
    this.runout = false;
    this.showdown();
    return this.result;
  }

  finishRunout() {
    let guard = 0;
    while (this.runout && guard++ < 5) this.advanceRunout();
    return this.result;
  }

  finishByFold() {
    // Every chip in front goes in first; then the last player standing takes it all.
    this.returnUncalled();
    const winner = this.live()[0];
    const total = this.players.reduce((t, p) => t + p.committed, 0);
    winner.chips += total;
    for (const p of this.players) p.bet = 0;
    this.toAct = null;
    const endedOn = this.phase;
    this.phase = PHASES.DONE;
    this.result = {
      wonBy: 'fold',
      endedOn,
      pots: [{ amount: total, eligible: [winner.id], winners: [winner.id] }],
      awards: [{ playerId: winner.id, amount: total }],
      hands: {},
      uncalled: this.uncalled,
      board: this.board.slice(),
    };
  }

  // Side pots from what each player put in this hand.
  buildPots() {
    const left = new Map(this.players.map((p) => [p.id, p.committed]));
    const pots = [];
    const liveIds = new Set(this.live().map((p) => p.id));
    for (;;) {
      const liveLeft = [...left].filter(([id, v]) => liveIds.has(id) && v > 0);
      if (!liveLeft.length) break;
      const level = Math.min(...liveLeft.map(([, v]) => v));
      let amount = 0;
      for (const [id, v] of left) {
        const take = Math.min(v, level);
        amount += take;
        left.set(id, v - take);
      }
      pots.push({ amount, eligible: liveLeft.map(([id]) => id) });
    }
    const stray = [...left.values()].reduce((t, v) => t + v, 0);
    if (stray > 0 && pots.length) pots[pots.length - 1].amount += stray;
    // Merge neighbours with the same players (they are one pot to the eye).
    const merged = [];
    for (const pot of pots) {
      const prev = merged[merged.length - 1];
      if (prev && prev.eligible.length === pot.eligible.length && prev.eligible.every((id) => pot.eligible.includes(id))) prev.amount += pot.amount;
      else merged.push({ ...pot });
    }
    return merged;
  }

  showdown() {
    this.phase = PHASES.SHOWDOWN;
    this.toAct = null;
    const hands = {};
    for (const p of this.live()) hands[p.id] = evaluateHand([...p.cards, ...this.board]);
    const pots = this.buildPots();
    const awards = new Map();
    for (const pot of pots) {
      let best = [];
      for (const id of pot.eligible) {
        if (!best.length) { best = [id]; continue; }
        const c = compareHands(hands[id], hands[best[0]]);
        if (c > 0) best = [id];
        else if (c === 0) best.push(id);
      }
      // Seat order from the button's left decides who gets an odd chip.
      best.sort((a, b) => ((this.indexOf(a) || this.players.length) - (this.indexOf(b) || this.players.length)));
      const share = Math.floor(pot.amount / best.length);
      let odd = pot.amount - share * best.length;
      for (const id of best) {
        const amt = share + (odd > 0 ? 1 : 0);
        if (odd > 0) odd -= 1;
        awards.set(id, (awards.get(id) || 0) + amt);
      }
      pot.winners = best;
    }
    for (const [id, amt] of awards) this.byId(id).chips += amt;
    for (const p of this.players) p.bet = 0;
    this.phase = PHASES.DONE;
    this.result = {
      wonBy: 'showdown',
      endedOn: 'showdown',
      pots,
      awards: [...awards].map(([playerId, amount]) => ({ playerId, amount })),
      hands: Object.fromEntries(Object.entries(hands).map(([id, h]) => [id, { name: h.name, rank: h.rank }])),
      uncalled: this.uncalled,
      board: this.board.slice(),
    };
  }

  get pot() { return this.players.reduce((t, p) => t + p.committed - p.bet, 0); }

  // What one player may see. Other hands show only at showdown or in an all-in runout.
  view(forId = null) {
    const open = this.runout || (this.result && this.result.wonBy === 'showdown');
    return {
      handNumber: this.handNumber,
      phase: this.phase,
      board: this.board.slice(),
      pot: this.pot,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      toAct: this.toAct,
      buttonSeat: this.buttonSeat,
      blinds: { ...this.blinds },
      runout: this.runout,
      players: this.players.map((p) => ({
        id: p.id,
        username: p.username,
        seat: p.seat,
        position: p.position,
        chips: p.chips,
        startingChips: p.startingChips,
        bet: p.bet,
        committed: p.committed,
        folded: p.folded,
        allIn: p.allIn,
        lastAction: p.lastAction,
        cards: p.id === String(forId) || (open && !p.folded) ? p.cards.slice() : null,
      })),
      legal: forId != null ? this.legalActions(forId) : null,
      result: this.result,
    };
  }
}

module.exports = { MultiwayHand, PHASES, POSITION_NAMES, freshDeck, shuffle, stackedDeck, parseCard };
