// THE RANKED RATING (v2, owner-approved 2026-10-12: "intuitive and creative, not classic -- we
// should truly try and capture a player's skill level"). CommonJS, pure, no I/O. The server settles
// with it; the phone and the web print its steps on the result screen.
//
// One match moves each player's rating by five rules, in order:
//   1. THE RESULT SETS THE SIGN. A win gains at least 1 and a loss costs at least 1. Nothing
//      below can flip it.
//   2. THE BASE is Elo's: K x (result - expected), expected from the two ratings.
//      K follows experience: 40 for the first 15 ranked matches (the rating is still finding
//      you), 24 after, 16 from 1,800 up (strong ratings move steadily).
//   3. HOW YOU PLAYED SETS THE SIZE. The match's graded decisions become a PLAY RATING: the
//      rating a player with that accuracy usually holds (accuracy 70% plays like 1,000; each
//      point is worth 50). Played above your rating: a win gains more, a loss costs less. Played
//      below it: a win gains less, a loss costs more. At most 25% either way, and only when the
//      match gave at least MIN_GRADED graded decisions (fewer is not enough to judge).
//   4. SHORT MATCHES COUNT LESS. Decided in 1 or 2 hands (a coin-flip shove), the move is 0.6x.
//      A forfeit (leaving the table) always takes the full loss and is never softened.
//   5. LIMITS. At most 40 a match; never below 100; and the first loss after reaching a new arena
//      cannot drop you out of it (the arena shield, used up by that loss).
//
// Each side also carries a FORM: a running read of the play rating (30% this match, 70% before),
// so a player can see the level they are playing at, separate from where the ladder has them.

const { ARENAS } = require('../data');

const RULES = Object.freeze({
  K_PROVISIONAL: 40,
  PROVISIONAL_MATCHES: 15,
  K_NORMAL: 24,
  K_HIGH: 16,
  HIGH_FROM: 1800,
  PLAY_SWING: 0.25,
  PLAY_SCALE: 2000, // rating points between play rating and rating for the full swing (25%)
  MIN_GRADED: 3,
  SHORT_HANDS: 2,
  SHORT_FACTOR: 0.6,
  CAP: 40,
  FLOOR: 100,
  FORM_WEIGHT: 0.3,
  // accuracy -> play rating: 70% is 1,000, each point 50.
  ACC_AT_1000: 70,
  POINTS_PER_ACC: 50,
  PLAY_MIN: 100,
  PLAY_MAX: 2600,
});

const num = (v, d = null) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const arenaIndex = (rating) => {
  let i = 0;
  ARENAS.forEach((a, k) => { if (rating >= a.minRating) i = k; });
  return i;
};

const kFor = (rating, matches) => (matches < RULES.PROVISIONAL_MATCHES ? RULES.K_PROVISIONAL
  : rating >= RULES.HIGH_FROM ? RULES.K_HIGH : RULES.K_NORMAL);

const expectedScore = (rating, opponent) => 1 / (1 + 10 ** ((opponent - rating) / 400));

// Accuracy (0-100) -> the rating a player with that accuracy usually holds.
const playRatingFor = (accuracyPct) => {
  const a = num(accuracyPct);
  if (a === null) return null;
  return Math.round(clamp(1000 + (a - RULES.ACC_AT_1000) * RULES.POINTS_PER_ACC, RULES.PLAY_MIN, RULES.PLAY_MAX));
};

// One side. me: { rating, matches, accuracyPct, graded, form, shieldArena }, opp: { rating }.
// -> { before, after, delta, k, base, play, factor, steps[], form, shieldArena }
function settleSide(me, opp, { won, hands, forfeit }) {
  const before = Math.round(num(me.rating, 1000));
  const oppRating = Math.round(num(opp.rating, 1000));
  const matches = Math.max(0, Math.floor(num(me.matches, 0)));
  const steps = [];

  const k = kFor(before, matches);
  const expected = expectedScore(before, oppRating);
  const base = k * ((won ? 1 : 0) - expected);
  steps.push({ code: 'base', value: Math.round(base * 10) / 10, k, expectedPct: Math.round(expected * 100),
    provisional: matches < RULES.PROVISIONAL_MATCHES });

  let size = Math.abs(base);

  const graded = Math.max(0, Math.floor(num(me.graded, 0)));
  const play = graded >= RULES.MIN_GRADED ? playRatingFor(me.accuracyPct) : null;
  let factor = 1;
  if (play !== null && !forfeit) {
    const q = clamp((play - before) / RULES.PLAY_SCALE, -RULES.PLAY_SWING, RULES.PLAY_SWING);
    factor = won ? 1 + q : 1 - q;
    size *= factor;
    steps.push({ code: 'play', play, accuracyPct: Math.round(num(me.accuracyPct, 0)), factor: Math.round(factor * 100) / 100 });
  } else if (!forfeit) {
    steps.push({ code: 'play-unread', graded });
  }

  const h = Math.max(0, Math.floor(num(hands, 0)));
  if (!forfeit && h > 0 && h <= RULES.SHORT_HANDS) {
    size *= RULES.SHORT_FACTOR;
    steps.push({ code: 'short', hands: h, factor: RULES.SHORT_FACTOR });
  }
  if (forfeit && !won) steps.push({ code: 'forfeit' });

  let magnitude = clamp(Math.round(size), 1, RULES.CAP);
  if (Math.round(size) > RULES.CAP) steps.push({ code: 'cap', cap: RULES.CAP });
  let delta = won ? magnitude : -magnitude;

  let shieldArena = Number.isInteger(me.shieldArena) ? me.shieldArena : null;
  const fromArena = arenaIndex(before);
  if (!won) {
    if (before + delta < RULES.FLOOR) {
      delta = Math.min(0, RULES.FLOOR - before);
      steps.push({ code: 'floor', floor: RULES.FLOOR });
    }
    if (shieldArena === fromArena && arenaIndex(before + delta) < fromArena) {
      const floorRating = ARENAS[fromArena].minRating;
      delta = Math.min(0, floorRating - before);
      steps.push({ code: 'shield', arena: ARENAS[fromArena].name, rating: floorRating });
    }
    shieldArena = null; // any loss uses the shield up
  }
  const after = before + delta;
  if (won && arenaIndex(after) > fromArena) {
    shieldArena = arenaIndex(after);
    steps.push({ code: 'promoted', arena: ARENAS[shieldArena].name });
  }

  const prevForm = num(me.form);
  const form = play === null ? (prevForm === null ? null : Math.round(prevForm))
    : Math.round(prevForm === null ? play : prevForm * (1 - RULES.FORM_WEIGHT) + play * RULES.FORM_WEIGHT);

  steps.push({ code: 'total', delta });
  return { before, after, delta, k, base: Math.round(base * 10) / 10, play, factor: Math.round(factor * 100) / 100, steps, form, shieldArena };
}

// input: { winner: side, loser: side, hands, forfeit }  (side as settleSide's `me`)
// -> { winner: settled, loser: settled }
function computeRankedOutcome({ winner = {}, loser = {}, hands = 0, forfeit = false } = {}) {
  return {
    winner: settleSide(winner, loser, { won: true, hands, forfeit: false }),
    loser: settleSide(loser, winner, { won: false, hands, forfeit: !!forfeit }),
  };
}

// The steps as short lines for a result screen: "Base −8 (K 24, 44% to win)", "Played like 1,350 ×0.88", ...
function describeRankedSteps(steps = []) {
  const sign = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;
  return steps.map((s) => {
    switch (s.code) {
      case 'base': return `Result ${sign(Math.round(s.value))} · ${s.expectedPct}% to win${s.provisional ? ' · new to ranked' : ''}`;
      case 'play': return `Played like ${s.play.toLocaleString('en-US')} (${s.accuracyPct}% accuracy) ×${s.factor.toFixed(2)}`;
      case 'play-unread': return 'Too few graded decisions to read your play';
      case 'short': return `Decided in ${s.hands} hand${s.hands === 1 ? '' : 's'} ×${s.factor}`;
      case 'forfeit': return 'Left the table: full loss';
      case 'cap': return `Capped at ${s.cap}`;
      case 'floor': return `Rating floor ${s.floor}`;
      case 'shield': return `Arena shield: you stay in ${s.arena}`;
      case 'promoted': return `Reached ${s.arena}: your first loss here can't drop you out`;
      case 'total': return `Total ${sign(s.delta)}`;
      default: return null;
    }
  }).filter(Boolean);
}

module.exports = { RANKED_RULES: RULES, computeRankedOutcome, playRatingFor, describeRankedSteps };
