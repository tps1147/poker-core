// Simulated equity for the grader (2026-10-12). CommonJS, plain-node safe.
//
// The strength score the grader used on the flop and turn read an unpaired hand as near 0%:
// T8 on Q-3-2 scored 12% when it has about 35% against a random hand, so an ordinary call was
// graded a blunder (production audit, 2026-10-12). This runs the hand out instead.
//
// THE OPPONENT IS NOT A RANDOM HAND. Facing a bet, the opponent's range leans to the hands that
// bet: each sampled opponent hand is scored on the current board (high card 0.15, a pair 0.35 to
// 0.6 by its rank, a four-card draw 0.45, two pair 0.75, trips 0.85, a straight or better 0.95)
// and kept with probability 0.2 + 0.8 x score^(3 x bet/pot). Facing a half-pot bet a top pair is
// kept about twice as often as a hand with nothing; facing a pot-sized bet or more the range is
// mostly two pair and up. The 0.2 floor is the bluffs: every betting range has some. Not facing
// a bet, the opponent is a random hand.

// DETERMINISTIC. The sampler is seeded from the cards and the price, so the phone and the server
// grade the same decision to the same number and a review never changes between two openings.

const { evaluateHand, compareHands } = require('../eval/pokerEvaluator');

const RANKS = '23456789TJQKA';
const SUITS = ['♠', '♥', '♦', '♣'];
const DECK = [];
for (const r of RANKS) for (const s of SUITS) DECK.push({ rank: r, suit: s });

const SUIT_OF = { s: '♠', h: '♥', d: '♦', c: '♣', spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const suitOf = (suit) => (SUITS.includes(suit) ? suit : SUIT_OF[String(suit || '').toLowerCase()] || null);
const asCard = (c) => (c && suitOf(c.suit) ? { rank: c.rank, suit: suitOf(c.suit) } : null);
const keyOf = (c) => `${c.rank}${c.suit}`;
const BLUFF_FLOOR = 0.2;

// mulberry32: small, fast, seedable.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

// How much an opponent hand likes this board, 0..1 (see the range note above).
function holdingScore(hole, board) {
  const made = evaluateHand(hole.concat(board));
  // pokerEvaluator ranks: 1 high card, 2 pair, 3 two pair, 4 trips, 5 straight and up.
  const rank = made ? made.rank : 1;
  if (rank >= 5) return 0.95;
  if (rank === 4) return 0.85;
  if (rank === 3) return 0.75;
  if (rank === 2) {
    const boardRanks = board.map((c) => RANKS.indexOf(c.rank));
    const top = Math.max(...boardRanks);
    const pairRank = typeof made.value === 'number' ? made.value : -1;
    return pairRank >= top ? 0.6 : 0.35 + 0.2 * Math.max(0, pairRank) / 12;
  }
  return holdsDraw(hole, board) ? 0.45 : 0.15;
}

// A four-card flush draw or open-ended straight draw that uses a hole card.
function holdsDraw(hole, board) {
  const cards = hole.concat(board);
  const suits = {};
  cards.forEach((c) => { suits[c.suit] = (suits[c.suit] || 0) + 1; });
  const holeSuits = new Set(hole.map((c) => c.suit));
  if (Object.entries(suits).some(([s, n]) => n >= 4 && holeSuits.has(s))) return true;
  const ranks = new Set(cards.map((c) => RANKS.indexOf(c.rank)));
  if (ranks.has(12)) ranks.add(-1);
  for (let lo = -1; lo <= 9; lo += 1) {
    let n = 0;
    for (let k = 0; k < 5; k += 1) if (ranks.has(lo + k)) n += 1;
    if (n >= 4 && hole.some((c) => { const r = RANKS.indexOf(c.rank); return (r >= lo && r <= lo + 4) || (c.rank === 'A' && lo === -1); })) return true;
  }
  return false;
}

// hole: 2 engine cards, board: 3-5 engine cards. -> equity percent (0-100), or null if the cards
// cannot be read. trials: the number of opponent hands and run-outs kept.
function simulatedEquity(holeIn, boardIn, { toCall = 0, pot = 0, trials = 500 } = {}) {
  if (!Array.isArray(holeIn) || holeIn.length !== 2 || !Array.isArray(boardIn) || boardIn.length < 3) return null;
  const hole = holeIn.map(asCard);
  const board = boardIn.map(asCard);
  if (!hole.every(Boolean) || !board.every(Boolean)) return null;
  const used = new Set(hole.concat(board).map(keyOf));
  if (used.size !== hole.length + board.length) return null;
  const rest = DECK.filter((c) => !used.has(keyOf(c)));
  if (rest.length !== 52 - used.size) return null;
  const shape = toCall > 0 && pot > 0 ? 3 * Math.min(1.5, toCall / pot) : 0;
  const next = rng(hashSeed(`${hole.map(keyOf).join('')}|${board.map(keyOf).join('')}|${toCall}|${pot}`));
  const need = 5 - board.length;
  let score = 0;
  let kept = 0;
  let draws = 0;
  while (kept < trials && draws < trials * 25) {
    draws += 1;
    // Partial Fisher-Yates: the first 2 + need cards of a shuffled copy.
    const deck = rest.slice();
    for (let i = 0; i < 2 + need; i += 1) {
      const j = i + Math.floor(next() * (deck.length - i));
      const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    const opp = [deck[0], deck[1]];
    if (shape > 0 && next() > BLUFF_FLOOR + (1 - BLUFF_FLOOR) * holdingScore(opp, board) ** shape) continue;
    const runout = board.concat(deck.slice(2, 2 + need));
    const mine = evaluateHand(hole.concat(runout));
    const theirs = evaluateHand(opp.concat(runout));
    if (!mine || !theirs) return null;
    const c = compareHands(mine, theirs);
    score += c > 0 ? 1 : c === 0 ? 0.5 : 0;
    kept += 1;
  }
  return kept ? Math.round((1000 * score) / kept) / 10 : null;
}

module.exports = { simulatedEquity, holdingScore };
