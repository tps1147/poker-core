// Single source of truth for Match Review grade presentation: chess-style
// colors, labels, and icons for the five grades produced by gradeDecisions.js.
// CommonJS (like the review engine) so plain-node tests can require it too.

const GRADE_THEME = {
  brilliant: {
    label: 'Brilliant',
    short: '!!',
    color: '#26C2A3', // teal — the celebration grade
    icon: 'star-four-points',
  },
  good: {
    label: 'Good',
    short: 'OK',
    color: '#22c55e', // COLORS.success
    icon: 'check-circle-outline',
  },
  inaccuracy: {
    label: 'Inaccuracy',
    short: '?!',
    color: '#F5C242', // amber
    icon: 'help-circle-outline',
  },
  mistake: {
    label: 'Mistake',
    short: '?',
    color: '#F97316', // orange
    icon: 'alert-circle-outline',
  },
  blunder: {
    label: 'Blunder',
    short: '??',
    color: '#ef4444', // COLORS.error
    icon: 'close-circle-outline',
  },
};

// Display order: best to worst (histograms, legends).
const GRADE_ORDER = ['brilliant', 'good', 'inaccuracy', 'mistake', 'blunder'];

// Grades bad enough to offer "Drill this spot".
const DRILLABLE_GRADES = ['inaccuracy', 'mistake', 'blunder'];

const gradeTheme = (grade) => GRADE_THEME[grade] || GRADE_THEME.good;

// Coach-card copy for matchReview's leak tags.
const LEAK_TAG_COPY = {
  'overfolding-to-aggression': {
    title: 'Folding Under Fire',
    body: 'You folded clearly profitable calls more than once when the bot bet big. Check the price before letting a hand go.',
    icon: 'shield-off-outline',
  },
  'chasing-bad-prices': {
    title: 'Chasing Bad Prices',
    body: 'You paid for cards your equity could not justify more than once. Compare your equity to the price before calling.',
    icon: 'cash-remove',
  },
  'missing-value-bets': {
    title: 'Missing Value Bets',
    body: 'You checked back strong hands on the river more than once. Big hands want one more bet, not a free showdown.',
    icon: 'cash-plus',
  },
};

// Reason chips on key-hand rows.
const KEY_REASON_LABELS = {
  blunder: 'Blunder',
  mistake: 'Mistake',
  'all-in': 'All-in',
  'big-swing': 'Big swing',
};

module.exports = {
  GRADE_THEME,
  GRADE_ORDER,
  DRILLABLE_GRADES,
  gradeTheme,
  LEAK_TAG_COPY,
  KEY_REASON_LABELS,
};
