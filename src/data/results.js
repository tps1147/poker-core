// RESULTS BY MODE (2.0): one skeleton for every post-match screen. Each mode fills the same five
// parts: mode tag, outcome, centrepiece, coach line, one button. The server builds the payload
// (resultFor per mode); both apps render it through resultSkeleton().
//
//   ranked    heads-up ranked     outcome win | loss       centrepiece seal (fills on a win; steel stamp + one spot on a loss)
//   sixmax    six-max             outcome place 1..6       centrepiece podium of chips
//   gauntlet  Gauntlet character  outcome win | loss       centrepiece the character's last line, mastery pips, reward
//   crown     Crown Hour          outcome place of N       centrepiece final-table slice, medal
//   friend    friend match        outcome win | loss       centrepiece head-to-head bar, Rematch
//
// House rule: a result never carries a rating figure or its breakdown. FORBIDDEN_RESULT_FIELDS
// lists the keys that must never reach a result payload; stripForbidden() removes them (deeply) and
// the server's tests assert they are absent.

const RESULT_MODES = Object.freeze(['ranked', 'sixmax', 'gauntlet', 'crown', 'friend']);

const MODE_META = Object.freeze({
  ranked: Object.freeze({ tag: 'RANKED · HEADS-UP', centrepiece: 'seal', outcomes: ['win', 'loss'], button: { win: 'Continue', loss: 'Review the spot' } }),
  sixmax: Object.freeze({ tag: 'SIX-MAX', centrepiece: 'podium', outcomes: ['place'], button: { any: 'Play again' } }),
  gauntlet: Object.freeze({ tag: 'GAUNTLET', centrepiece: 'character', outcomes: ['win', 'loss'], button: { win: 'Next on the road', loss: 'Try again' } }),
  crown: Object.freeze({ tag: 'CROWN HOUR', centrepiece: 'finalTable', outcomes: ['place'], button: { any: 'See the final table' } }),
  friend: Object.freeze({ tag: 'FRIEND MATCH', centrepiece: 'headToHead', outcomes: ['win', 'loss'], button: { any: 'Rematch' } }),
});

const FORBIDDEN_RESULT_FIELDS = Object.freeze([
  'rating', 'ratingDelta', 'newRating', 'prevRating', 'ratingBefore', 'ratingAfter', 'delta', 'elo',
  'breakdown', 'ratingBreakdown', 'playSwing', 'baseDelta', 'grade', 'grades', 'leaks', 'winRate', 'chipCount',
]);

const ORDINAL = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

function outcomeLabel(mode, payload) {
  const p = payload || {};
  if (mode === 'sixmax' || mode === 'crown') {
    const place = Number(p.place) || 0;
    if (mode === 'crown' && place && p.of) return { kind: place === 1 ? 'win' : 'place', text: `${ORDINAL(place)} of ${p.of}` };
    if (place === 1) return { kind: 'win', text: 'FIRST' };
    return { kind: 'place', text: place ? ORDINAL(place).toUpperCase() : '' };
  }
  if (p.outcome === 'win') return { kind: 'win', text: mode === 'gauntlet' ? 'BEATEN' : 'VICTORY' };
  return { kind: 'loss', text: mode === 'gauntlet' ? 'NOT YET' : 'DEFEAT' };
}

// { mode, modeTag, outcome: { kind: 'win'|'loss'|'place', text }, centrepiece, coachLine, button }
function resultSkeleton(mode, payload = {}) {
  const meta = MODE_META[mode];
  if (!meta) return null;
  const outcome = outcomeLabel(mode, payload);
  const b = meta.button;
  return {
    mode,
    modeTag: meta.tag,
    outcome,
    centrepiece: meta.centrepiece,
    coachLine: payload.coachLine || null,
    button: b.any || b[outcome.kind === 'win' ? 'win' : 'loss'] || b.win,
  };
}

function stripForbidden(value) {
  if (Array.isArray(value)) return value.map(stripForbidden);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (FORBIDDEN_RESULT_FIELDS.includes(k)) continue;
    out[k] = stripForbidden(v);
  }
  return out;
}

module.exports = { RESULT_MODES, RESULT_MODE_META: MODE_META, FORBIDDEN_RESULT_FIELDS, resultSkeleton, stripForbidden };
