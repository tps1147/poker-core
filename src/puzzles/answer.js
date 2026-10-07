'use strict';

// Answering a puzzle: the buttons a spot offers, the grade, the maths behind the answer, the rest of
// the board to deal, and when the next puzzle comes.
//
// GRADING. Actions are compared in canonical form: lower case, 'bet' is 'raise' (the generator and
// the server say 'raise' for a bet into an unopened pot), 'all in' is 'all-in'. A puzzle with no
// answer key grades as null (the verdict is 'open').
//
// THE BUTTONS follow poker-core/state's legal actions for the spot (the rule the phone's rail
// already uses): fold unless the pot is unopened with nothing to call, check with nothing to call,
// call with something to call, and a raise, labelled Bet when there is nothing to call.
//
// THE RUNOUT. The generator's progression holds the whole five-card board: the board the puzzle
// was dealt on, then a fixed runout. dealPlan deals the rest from ANY starting street. It deals
// nothing if the progression does not continue the board on the table or would deal a card that is
// already out, so a mismatched runout can never replace the board.
//
// ADVANCING. A correct answer moves on by itself after CORRECT_ADVANCE_MS; a wrong one (and an
// ungraded one) waits for Next.

const { normalizePuzzleState } = require('../state/normalizePuzzleState');
const { PUZZLE_COPY } = require('./copy');

const A = PUZZLE_COPY.actions;
const CORRECT_ADVANCE_MS = 1100;

const ACTION_ALIASES = Object.freeze({ bet: 'raise', 'all in': 'all-in', allin: 'all-in', all_in: 'all-in' });

function canonicalAction(action) {
  if (typeof action !== 'string') return null;
  const a = action.trim().toLowerCase();
  if (!a) return null;
  return Object.prototype.hasOwnProperty.call(ACTION_ALIASES, a) ? ACTION_ALIASES[a] : a;
}

// The puzzle's answer, canonical, wherever the payload keeps it (generated puzzles:
// progression.correctAction; library and lesson puzzles may use the older fields).
function answerKeyOf(puzzle) {
  if (!puzzle || typeof puzzle !== 'object') return null;
  const solution = puzzle.solution;
  const candidates = [
    puzzle.progression && puzzle.progression.correctAction,
    puzzle.correctAction,
    solution && typeof solution === 'object' ? solution.action : solution,
    puzzle.answer,
  ];
  for (const candidate of candidates) {
    const a = canonicalAction(candidate);
    if (a) return a;
  }
  return null;
}

function explanationOf(puzzle) {
  if (!puzzle || typeof puzzle !== 'object') return '';
  const text = (puzzle.progression && puzzle.progression.explanation) || puzzle.explanation || puzzle.rationale || '';
  return typeof text === 'string' ? text : '';
}

// The spot at the decision: what there is to call, and whether a raise reads as a bet.
function spotOf(puzzle) {
  const normalized = normalizePuzzleState(puzzle && typeof puzzle === 'object' ? puzzle : {});
  const state = normalized.activeHandState || {};
  const la = normalized.legalActions || {};
  const toCall = Number.isFinite(Number(la.toCall)) ? Number(la.toCall) : (Number(state.opponentBet) || 0);
  const unopened = state.action === 'unopened_pot';
  const flag = (value, fallback) => (typeof value === 'boolean' ? value : fallback);
  return {
    toCall,
    betLabel: toCall === 0 || unopened,
    canFold: flag(la.canFold, !(unopened && toCall === 0)),
    canCheck: flag(la.canCheck, toCall === 0),
    canCall: flag(la.canCall, toCall > 0),
    canRaise: flag(la.canRaise, true),
  };
}

// The buttons for a spot, in rail order: [{ action, label, amount? }]. `action` is what grading and
// the attempt use; `label` is what the button says.
function puzzleActions(puzzle) {
  const spot = spotOf(puzzle);
  const out = [];
  if (spot.canFold) out.push({ action: 'fold', label: A.fold });
  if (spot.canCheck) out.push({ action: 'check', label: A.check });
  if (spot.canCall) out.push({ action: 'call', label: A.call, amount: spot.toCall });
  if (spot.canRaise) out.push({ action: 'raise', label: spot.betLabel ? A.bet : A.raise });
  return out;
}

// The label for an action. With the puzzle, a raise into nothing reads Bet; without it, the word
// the caller used decides. (Named puzzleActionLabel, not actionLabel: poker-core/learn already
// exports actionLabel(spot, action), a different function with its arguments the other way round.)
function puzzleActionLabel(action, puzzle) {
  const a = canonicalAction(action);
  if (!a) return null;
  if (a === 'raise') {
    if (puzzle) return spotOf(puzzle).betLabel ? A.bet : A.raise;
    return action.trim().toLowerCase() === 'bet' ? A.bet : A.raise;
  }
  return Object.prototype.hasOwnProperty.call(A, a) ? A[a] : null;
}

function verdictFor(correct) {
  const tone = correct === true ? 'correct' : correct === false ? 'wrong' : 'open';
  return { tone, kicker: PUZZLE_COPY.verdict[tone] };
}

// gradeAnswer(puzzle, action) -> { correct, chosen, best, explanation, verdict }.
//   correct      true / false, or null when the puzzle has no answer key;
//   chosen/best  { action, label } (best is null with no answer key);
//   explanation  the puzzle's own explanation, the same whether the answer was right or wrong;
//   verdict      { tone: 'correct' | 'wrong' | 'open', kicker }.
function gradeAnswer(puzzle, action) {
  const best = answerKeyOf(puzzle);
  const picked = canonicalAction(action);
  const correct = best ? picked === best : null;
  return {
    correct,
    chosen: picked ? { action: picked, label: puzzleActionLabel(picked, puzzle) } : null,
    best: best ? { action: best, label: puzzleActionLabel(best, puzzle) } : null,
    explanation: explanationOf(puzzle),
    verdict: verdictFor(correct),
  };
}

const pctOrNull = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

// The maths behind the answer, from the generator's meta, in percent: { equity, price }. price is
// null when there is no bet to call. null when the puzzle carries no equity.
function answerMaths(puzzle) {
  const meta = puzzle && typeof puzzle === 'object' ? puzzle.meta : null;
  if (!meta || typeof meta !== 'object') return null;
  const equity = pctOrNull(meta.equity);
  if (equity === null) return null;
  return { equity, price: pctOrNull(meta.requiredEquity) };
}

// 'Equity 34% vs price 25%', or 'Equity 62%' with nothing to call. Whole percents, unless the two
// would round to the same figure, when both show one decimal. '' with no maths.
function formatAnswerMaths(maths) {
  if (!maths || typeof maths.equity !== 'number' || !Number.isFinite(maths.equity)) return '';
  const M = PUZZLE_COPY.maths;
  const fmt = (n, digits) => (digits ? n.toFixed(digits) : String(Math.round(n)));
  if (typeof maths.price !== 'number' || !Number.isFinite(maths.price)) return `${M.equity} ${fmt(maths.equity, 0)}%`;
  const digits = maths.equity !== maths.price && Math.round(maths.equity) === Math.round(maths.price) ? 1 : 0;
  return `${M.equity} ${fmt(maths.equity, digits)}% ${M.versus} ${M.price} ${fmt(maths.price, digits)}%`;
}

// ---------------------------------------------------------------------------
// Cards and the board
// ---------------------------------------------------------------------------
const RANKS = '23456789TJQKA';
const SUIT_KEYS = Object.freeze({
  '♠': 's', '♤': 's', s: 's', spade: 's', spades: 's',
  '♥': 'h', '♡': 'h', h: 'h', heart: 'h', hearts: 'h',
  '♦': 'd', '♢': 'd', d: 'd', diamond: 'd', diamonds: 'd',
  '♣': 'c', '♧': 'c', c: 'c', club: 'c', clubs: 'c',
});

// 'As', 'Td' ... for a card object ({ rank, suit }) or a short string ('A♠', '10h'); null if it is
// not a card.
function cardKey(card) {
  let rank;
  let suit;
  if (typeof card === 'string') {
    const s = card.trim();
    rank = s.slice(0, -1);
    suit = s.slice(-1);
  } else if (card && typeof card === 'object') {
    rank = card.rank;
    suit = card.suit;
  } else {
    return null;
  }
  let r = String(rank == null ? '' : rank).trim().toUpperCase();
  if (r === '10') r = 'T';
  const k = SUIT_KEYS[String(suit == null ? '' : suit).trim().toLowerCase()];
  return r.length === 1 && RANKS.includes(r) && k ? `${r}${k}` : null;
}

const PHASE_BOARD_COUNT = Object.freeze({ preflop: 0, flop: 3, turn: 4, river: 5 });
const STREET_OF_SLOT = Object.freeze(['flop', 'flop', 'flop', 'turn', 'river']);

function phaseOf(puzzle) {
  if (!puzzle || typeof puzzle !== 'object') return null;
  const state = puzzle.initialState || {};
  const phase = String(state.phase || puzzle.startingPhase || puzzle.phase || puzzle.street || '').toLowerCase();
  return Object.prototype.hasOwnProperty.call(PHASE_BOARD_COUNT, phase) ? phase : null;
}

function heroCards(puzzle) {
  if (!puzzle || typeof puzzle !== 'object') return [];
  const state = puzzle.initialState || {};
  const list = [state.playerCards, state.heroCards, puzzle.holeCards, puzzle.playerCards].find(Array.isArray);
  return list ? list.slice(0, 2) : [];
}

// The whole board from the progression, slot by slot, up to the first card it does not carry.
function progressionBoard(puzzle) {
  const p = (puzzle && typeof puzzle === 'object' && puzzle.progression) || {};
  const flop = Array.isArray(p.flopCards) ? p.flopCards : [];
  const slots = [flop[0], flop[1], flop[2], p.turnCard, p.riverCard];
  const out = [];
  for (const card of slots) {
    if (!cardKey(card)) break;
    out.push(card);
  }
  return out;
}

// The board on the table at the decision: the dealt community cards (never more than the street
// shows), or, for a puzzle that stores only its progression, the street's share of it.
function startingBoard(puzzle) {
  if (!puzzle || typeof puzzle !== 'object') return [];
  const state = puzzle.initialState || {};
  const phase = phaseOf(puzzle);
  const count = phase ? PHASE_BOARD_COUNT[phase] : null;
  const dealt = [state.communityCards, puzzle.board, puzzle.communityCards].find(Array.isArray);
  if (dealt) return dealt.slice(0, count === null ? 5 : count);
  return count === null ? [] : progressionBoard(puzzle).slice(0, count);
}

// dealPlan(puzzle) -> [{ street, slot, card }], the rest of the board in dealing order (slot is the
// board position 0-4). [] when there is nothing to deal, or the progression does not continue this
// board.
function dealPlan(puzzle) {
  const start = startingBoard(puzzle);
  const full = progressionBoard(puzzle);
  if (full.length <= start.length) return [];
  for (let i = 0; i < start.length; i += 1) {
    if (cardKey(start[i]) !== cardKey(full[i])) return [];
  }
  const used = new Set([...start, ...heroCards(puzzle)].map(cardKey).filter(Boolean));
  const plan = [];
  for (let slot = start.length; slot < full.length; slot += 1) {
    const key = cardKey(full[slot]);
    if (used.has(key)) return [];
    used.add(key);
    plan.push({ street: STREET_OF_SLOT[slot], slot, card: full[slot] });
  }
  return plan;
}

// The same plan grouped by street, in order: [{ street, cards }].
function dealStreets(puzzle) {
  const streets = [];
  dealPlan(puzzle).forEach(({ street, card }) => {
    const last = streets[streets.length - 1];
    if (last && last.street === street) last.cards.push(card);
    else streets.push({ street, cards: [card] });
  });
  return streets;
}

// A puzzle's identity, for effects that must re-run when the puzzle changes (the server gives
// every generated puzzle in a topic the same title): generated puzzles are topic, difficulty and
// seed; library puzzles their id; the title last; '' for nothing.
function puzzleIdentity(puzzle) {
  if (!puzzle || typeof puzzle !== 'object') return '';
  const meta = puzzle.meta || {};
  if (meta.topic && meta.seed !== undefined && meta.seed !== null) {
    return `gen:${meta.topic}:${puzzle.difficulty || ''}:${meta.seed}`;
  }
  const id = puzzle._id !== undefined && puzzle._id !== null ? puzzle._id : puzzle.id;
  if (id !== undefined && id !== null && String(id)) return `id:${String(id)}`;
  return puzzle.title ? `title:${puzzle.title}` : '';
}

// After the verdict: { auto: true, delayMs } for a correct answer; wrong and ungraded answers wait
// for Next.
function advanceRule(correct) {
  return correct === true ? { auto: true, delayMs: CORRECT_ADVANCE_MS } : { auto: false, delayMs: null };
}

// Everything the table shows after an answer, in one call: the grade, the maths, the cards to deal
// and the advance rule.
function resolveAnswer(puzzle, action) {
  const grade = gradeAnswer(puzzle, action);
  const maths = answerMaths(puzzle);
  return {
    ...grade,
    maths,
    mathsLine: formatAnswerMaths(maths),
    deal: dealPlan(puzzle),
    advance: advanceRule(grade.correct),
  };
}

module.exports = {
  CORRECT_ADVANCE_MS,
  PHASE_BOARD_COUNT,
  canonicalAction,
  answerKeyOf,
  puzzleActions,
  puzzleActionLabel,
  gradeAnswer,
  answerMaths,
  formatAnswerMaths,
  cardKey,
  heroCards,
  startingBoard,
  dealPlan,
  dealStreets,
  puzzleIdentity,
  advanceRule,
  resolveAnswer,
};
