// Simulated equity for the grader (2026-10-12). CommonJS, plain-node safe.
//
// The strength score the grader used on the flop and turn read an unpaired hand as near 0%:
// T8 on Q-3-2 scored 12% when it has about 35% against a random hand, so an ordinary call was
// graded a blunder (production audit, 2026-10-12). This runs the hand out instead.
//
// THE OPPONENT IS NOT A RANDOM HAND. Facing a bet, the opponent holds something more often than
// a random hand does, so every sampled opponent hand that holds nothing (no pair, no draw) on
// the current board is kept with probability 1 - min(0.6, toCall / pot): a half-pot bet keeps
// about two thirds of them, a pot-sized bet or bigger keeps 40%. Not facing a bet, the opponent
// is a random hand.
//
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

// Does this opponent hand hold anything on this board: a pair or better, or a four-card flush or
// open straight draw? Used only to shape the range facing a bet.
function holdsSomething(hole, board) {
  const made = evaluateHand(hole.concat(board));
  if (made && made.rank >= 1) return true;
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
function simulatedEquity(holeIn, boardIn, { toCall = 0, pot = 0, trials = 600 } = {}) {
  if (!Array.isArray(holeIn) || holeIn.length !== 2 || !Array.isArray(boardIn) || boardIn.length < 3) return null;
  const hole = holeIn.map(asCard);
  const board = boardIn.map(asCard);
  if (!hole.every(Boolean) || !board.every(Boolean)) return null;
  const used = new Set(hole.concat(board).map(keyOf));
  if (used.size !== hole.length + board.length) return null;
  const rest = DECK.filter((c) => !used.has(keyOf(c)));
  if (rest.length !== 52 - used.size) return null;
  const keepNothing = toCall > 0 && pot > 0 ? 1 - Math.min(0.6, toCall / pot) : 1;
  const next = rng(hashSeed(`${hole.map(keyOf).join('')}|${board.map(keyOf).join('')}|${toCall}|${pot}`));
  const need = 5 - board.length;
  let score = 0;
  let kept = 0;
  let draws = 0;
  while (kept < trials && draws < trials * 6) {
    draws += 1;
    // Partial Fisher-Yates: the first 2 + need cards of a shuffled copy.
    const deck = rest.slice();
    for (let i = 0; i < 2 + need; i += 1) {
      const j = i + Math.floor(next() * (deck.length - i));
      const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    const opp = [deck[0], deck[1]];
    if (keepNothing < 1 && !holdsSomething(opp, board) && next() > keepNothing) continue;
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

module.exports = { simulatedEquity, holdsSomething };
