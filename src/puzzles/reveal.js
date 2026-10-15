'use strict';

// The reveal: what the answer panel shows after a pick, beyond the verdict line.
//
//   puzzleDuel(maths)   the equity bar against the price line: { equity, price, edge, favours }.
//                       edge is equity minus price (in points), favours 'call' when the equity
//                       clears the price and 'fold' when it falls short. null with nothing to call
//                       (no price) or no equity.
//   puzzleCount(puzzle) "Show the count": every card the player cannot see, and the ones that
//                       improve their hand, grouped by what they make, with the chance to hit.
//                       null preflop, on the river, or with no outs.
//
// COUNTING OUTS. A card is an out when it lifts the player's hand to two pair or better AND past
// what the board alone (with that card) makes, so a card that only pairs the board is not an out.
// A card that pairs the board and not the player's hand never counts for two pair or trips (the
// board paired, not the player); it still counts when it completes a straight, flush or better. Cards that make only one pair (overcards) are listed separately as 'pairs' and
// are not in the count: they may well not be good. The opponent's cards are unknown, so they are
// among the unseen cards, as the player would count it.
//
// THE CHANCE TO HIT: with one card to come, outs / unseen; with two (on the flop), 1 minus the
// chance both miss. Whole percent. This is the chance to make the hand, not the equity against the
// opponent's range (the duel's figure), and the copy says so.

const { evaluateHand } = require('../eval/pokerEvaluator');
const { PUZZLE_COPY } = require('./copy');

const RANKS = '23456789TJQKA';
const SUITS = '♠♥♦♣';
const SUIT_ALIAS = { s: '♠', h: '♥', d: '♦', c: '♣', S: '♠', H: '♥', D: '♦', C: '♣' };

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function puzzleDuel(maths) {
  if (!maths || !isNum(maths.equity) || !isNum(maths.price)) return null;
  const edge = Math.round((maths.equity - maths.price) * 10) / 10;
  return { equity: maths.equity, price: maths.price, edge, favours: edge >= 0 ? 'call' : 'fold' };
}

function toCard(raw) {
  if (!raw) return null;
  let rank;
  let suit;
  if (typeof raw === 'string') {
    const s = raw.trim();
    rank = s.slice(0, -1);
    suit = s.slice(-1);
  } else if (typeof raw === 'object') {
    rank = raw.rank !== undefined ? raw.rank : raw.value;
    suit = raw.suit;
  }
  rank = String(rank === undefined ? '' : rank).toUpperCase();
  if (rank === '10') rank = 'T';
  suit = SUIT_ALIAS[suit] || suit;
  if (!RANKS.includes(rank) || rank.length !== 1 || !SUITS.includes(suit)) return null;
  return { rank, suit };
}

const key = (c) => `${c.rank}${c.suit}`;

// The board's own made hand with fewer than five cards: pairs, trips and quads only.
function boardRank(cards) {
  if (cards.length >= 5) return evaluateHand(cards).rank;
  const counts = {};
  cards.forEach((c) => { counts[c.rank] = (counts[c.rank] || 0) + 1; });
  const groups = Object.values(counts).sort((a, b) => b - a);
  if (groups[0] >= 4) return 8;
  if (groups[0] === 3) return 4;
  if (groups[0] === 2 && groups[1] === 2) return 3;
  if (groups[0] === 2) return 2;
  return 1;
}

// What a made hand is called in the count's groups.
const GROUP_OF = { 10: 'straight-flush', 9: 'straight-flush', 8: 'quads', 7: 'full-house', 6: 'flush', 5: 'straight', 4: 'trips', 3: 'two-pair' };
const GROUP_LABEL = PUZZLE_COPY.count;
const GROUP_ORDER = ['straight-flush', 'quads', 'full-house', 'flush', 'straight', 'trips', 'two-pair'];

function heroAndBoard(puzzle) {
  const state = (puzzle && (puzzle.initialState || puzzle.state)) || {};
  const hero = (state.playerCards || []).map(toCard);
  const board = (state.communityCards || []).map(toCard);
  if (hero.length !== 2 || hero.some((c) => !c) || board.some((c) => !c)) return null;
  return { hero, board };
}

function puzzleCount(puzzle) {
  const cards = heroAndBoard(puzzle);
  if (!cards) return null;
  const { hero, board } = cards;
  if (board.length !== 3 && board.length !== 4) return null;
  const seen = new Set([...hero, ...board].map(key));
  if (seen.size !== hero.length + board.length) return null;
  const unseen = [];
  for (const suit of SUITS) for (const rank of RANKS) if (!seen.has(rank + suit)) unseen.push({ rank, suit });

  const before = evaluateHand([...hero, ...board]).rank;
  const heroRanks = new Set(hero.map((c) => c.rank));
  const boardRanks = new Set(board.map((c) => c.rank));
  const groups = {};
  const pairs = [];
  const tiles = unseen.map((card) => {
    const after = evaluateHand([...hero, ...board, card]).rank;
    const boardAlone = boardRank([...board, card]);
    const pairsBoardOnly = boardRanks.has(card.rank) && !heroRanks.has(card.rank);
    let group = null;
    if (after > before && after > boardAlone) {
      if (after >= 3 && !(pairsBoardOnly && after <= 4)) group = GROUP_OF[after];
      else if (after === 2) group = 'pair';
    }
    if (group === 'pair') pairs.push(card);
    else if (group) (groups[group] = groups[group] || []).push(card);
    return { card, group };
  });

  const outGroups = GROUP_ORDER.filter((g) => groups[g]).map((g) => ({ id: g, label: GROUP_LABEL[g], cards: groups[g], count: groups[g].length }));
  const outs = outGroups.reduce((n, g) => n + g.count, 0);
  if (!outs) return null;
  const n = unseen.length;
  const toCome = board.length === 3 ? 2 : 1;
  const hit = toCome === 1 ? outs / n : 1 - ((n - outs) * (n - outs - 1)) / (n * (n - 1));
  const hitPct = Math.round(hit * 100);
  // The quick rule: outs x 2 with one card to come, x 4 with two.
  const rulePct = Math.min(100, outs * (toCome === 1 ? 2 : 4));
  return {
    unseen: n,
    outs,
    toCome,
    hitPct,
    rulePct,
    groups: outGroups,
    pairs: { label: PUZZLE_COPY.count.pairs, cards: pairs, count: pairs.length },
    tiles: tiles.map((t) => ({ rank: t.card.rank, suit: t.card.suit, group: t.group })),
    line: toCome === 1
      ? `${outs} outs of ${n} unseen cards: ${outs} ÷ ${n} = ${hitPct}% to hit on the river.`
      : `${outs} outs of ${n} unseen cards: about ${hitPct}% to hit by the river.`,
  };
}

module.exports = { puzzleDuel, puzzleCount };
