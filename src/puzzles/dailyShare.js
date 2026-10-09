'use strict';

// The daily hand as an event: its number, how every player answered it, and the share card.
//
//   dailyNumber(dayKey)       'Daily #N', counted from DAILY_EPOCH (#1). The same everywhere.
//   dailySplit(counts, puzzle) the answers to the day's daily as percentages that add up to 100
//                             (largest remainder), in the table's button order:
//                             [{ action, label, count, pct }]. counts: { fold: 12, call: 40, ... }.
//                             The server sends the counts only once the player has answered.
//   dailyShareText(...)       plain text that copies cleanly into any chat. It says what the
//                             player chose and how many agreed, never the answer itself.

const { dayNumber } = require('./daily');
const { puzzleActions, puzzleActionLabel, canonicalAction } = require('./answer');
const { PUZZLE_COPY } = require('./copy');
const { difficultyLabel } = require('./bands');

const DAILY_EPOCH = '2026-01-01';
const ACTION_ORDER = ['fold', 'check', 'call', 'raise', 'all-in'];

function dailyNumber(dayKey) {
  return dayNumber(dayKey) - dayNumber(DAILY_EPOCH) + 1;
}

function dailySplit(counts, puzzle) {
  const clean = {};
  if (counts && typeof counts === 'object') {
    Object.keys(counts).forEach((k) => {
      const a = canonicalAction(k);
      const n = Number(counts[k]);
      if (a && Number.isFinite(n) && n > 0) clean[a] = (clean[a] || 0) + Math.floor(n);
    });
  }
  const offered = puzzle ? puzzleActions(puzzle).map((b) => b.action) : [];
  const actions = [...offered, ...ACTION_ORDER.filter((a) => !offered.includes(a) && clean[a])];
  const total = actions.reduce((n, a) => n + (clean[a] || 0), 0);
  const rows = actions.map((action) => {
    const count = clean[action] || 0;
    const exact = total ? (count * 100) / total : 0;
    return { action, label: puzzleActionLabel(action, puzzle) || action, count, pct: Math.floor(exact), rem: exact - Math.floor(exact) };
  });
  let left = total ? 100 - rows.reduce((n, r) => n + r.pct, 0) : 0;
  [...rows].sort((a, b) => b.rem - a.rem).forEach((r) => { if (left > 0) { r.pct += 1; left -= 1; } });
  return { total, rows: rows.map(({ rem, ...r }) => r) };
}

// dailyShareText({ dayKey, topic, difficulty, chose, agreedPct, correct, run, url })
function dailyShareText({ dayKey, topic, difficulty, chose, agreedPct, correct, run, url = 'flop52s.com' } = {}) {
  const lines = [`Flop52 Daily #${dailyNumber(dayKey)}`];
  const topicLabel = PUZZLE_COPY.topics[topic];
  lines.push([topicLabel, difficulty ? difficultyLabel(difficulty) : null].filter(Boolean).join(' · '));
  const label = puzzleActionLabel(chose);
  if (label) {
    lines.push(Number.isFinite(agreedPct) ? `I chose ${label.toLowerCase()} (${agreedPct}% of players agreed)` : `I chose ${label.toLowerCase()}`);
  }
  if (correct === true) lines.push(Number(run) > 1 ? `Right, on a run of ${Math.floor(run)}` : 'Right');
  else if (correct === false) lines.push('Missed it');
  lines.push(url);
  return lines.filter(Boolean).join('\n');
}

module.exports = { DAILY_EPOCH, dailyNumber, dailySplit, dailyShareText };
