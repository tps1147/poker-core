// The leak ladder: a practice climb of openly labelled bots that play to the player's own leaks.
//
// Pure, no I/O. The server feeds it the player's stored match stories (MatchStory.story, newest
// first), their Retry rows (ReviewSpot) and the saved per-leak state, and stores what comes back.
//
// What a leak is: a count of the player's graded decisions per spot family, read from the stored
// review so the ladder agrees with the review word for word. Three families, the review's own
// leak tags (review/matchReview LEAK_TAGS):
//   overfolding-to-aggression  facing a bet, folded where the price said call
//   chasing-bad-prices         facing a bet, called where the price said fold
//   missing-value-bets         checked a hand that wanted a bet
//
// Mastery is the share of right decisions in that family (plays plus Retry answers), with one
// right and one wrong added so a few spots never read as certain. A leak counts as passed at 95%
// with at least 20 decisions behind it. A passed leak rests, then comes back for a check-in after
// 1, 3, 7 and 21 days (the Retry deck's own boxes). A clean check-in moves it a box on; a slip
// sends it back to learning.
//
// Nothing here reads or writes rating, placement or matchmaking. Practice results never feed ranked.

const DAY_MS = 24 * 60 * 60 * 1000;
const BOX_DAYS = Object.freeze([1, 3, 7, 21]);
const PASS_AT = 0.95;
const MIN_EVIDENCE = 20;
const STORY_WINDOW = 20;
const RUNGS = 5;
const ERROR_GRADES = Object.freeze(['loose', 'leak', 'punt']);
const JUDGED_GRADES = Object.freeze(['clutch', 'solid', 'loose', 'leak', 'punt']);

const LEAKS = Object.freeze({
  'overfolding-to-aggression': Object.freeze({
    tag: 'overfolding-to-aggression',
    label: 'Folding to big bets',
    noticed: 'fold to big bets',
    errorAction: 'fold',
    headlineMiss: 'Folded early',
    holdWord: 'calls',
    whyMiss: (e, n) => `You folded ${e} of ${n} times the price said to call.`,
    whyHold: (n) => `You faced ${n} ${n === 1 ? 'bet' : 'bets'} and folded none the price said to call.`,
    stakeWord: 'left on the table',
    // Bots that pile on pressure: they bet and barrel more, so the spot keeps coming up.
    archetypes: Object.freeze(['lag', 'drawer', 'trapper', 'shark']),
  }),
  'chasing-bad-prices': Object.freeze({
    tag: 'chasing-bad-prices',
    label: 'Paying bad prices',
    noticed: 'pay too much to chase',
    errorAction: 'call',
    headlineMiss: 'Paid too much',
    holdWord: 'folds',
    whyMiss: (e, n) => `You paid ${e} of ${n} prices your share of the pot did not cover.`,
    whyHold: (n) => `You faced ${n} ${n === 1 ? 'price' : 'prices'} and paid none your share did not cover.`,
    stakeWord: 'overpaid',
    // Tight value bots: they bet big when they have it, so a chase is never cheap.
    archetypes: Object.freeze(['nit', 'tag', 'shark']),
  }),
  'missing-value-bets': Object.freeze({
    tag: 'missing-value-bets',
    label: 'Checking strong hands',
    noticed: 'check back hands that should bet',
    errorAction: 'check',
    headlineMiss: 'Missed value',
    holdWord: 'bets',
    whyMiss: (e, n) => `You checked ${e} of ${n} hands that wanted a bet.`,
    whyHold: (n) => `You had ${n} ${n === 1 ? 'hand' : 'hands'} worth a bet and bet every one.`,
    stakeWord: 'left on the table',
    // Passive bots that check to you and pay off: the value bet is yours to make.
    archetypes: Object.freeze(['calling-station', 'trapper', 'tag']),
  }),
});
const LEAK_ORDER = Object.freeze(Object.keys(LEAKS));

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = (v) => Math.round(v * 100) / 100;
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('en-US');
const isError = (spot) => ERROR_GRADES.includes(spot && spot.playerGrade);
const facingBet = (spot) => Number(spot && spot.toCall) > 0;
const aggressive = (a) => a === 'bet' || a === 'raise';

// Which family a graded spot is a chance to show, or null. Bets made with nothing to call count
// as chances to value bet, so a player who bets their strong hands builds mastery there too.
function familiesOf(spot) {
  if (!spot || !JUDGED_GRADES.includes(spot.playerGrade)) return [];
  if (facingBet(spot) && (spot.action === 'fold' || spot.action === 'call')) {
    return ['overfolding-to-aggression', 'chasing-bad-prices'];
  }
  if (!facingBet(spot) && spot.phase !== 'preflop' && (spot.action === 'check' || aggressive(spot.action))) {
    return ['missing-value-bets'];
  }
  return [];
}

const emptyTally = () => Object.fromEntries(LEAK_ORDER.map((tag) => [tag, { opportunities: 0, errors: 0, cost: 0 }]));

// One match story → { tag: { opportunities, errors, cost } }.
function tallyStory(story) {
  const tally = emptyTally();
  const spots = story && Array.isArray(story.spots) ? story.spots : [];
  for (const spot of spots) {
    for (const tag of familiesOf(spot)) {
      const row = tally[tag];
      row.opportunities += 1;
      if (isError(spot) && spot.action === LEAKS[tag].errorAction) {
        row.errors += 1;
        row.cost += Number(spot.costEst) || 0;
      }
    }
  }
  return tally;
}

// Stories newest first; only the latest STORY_WINDOW count, so old habits fade out.
function tallyStories(stories) {
  const total = emptyTally();
  (Array.isArray(stories) ? stories : []).slice(0, STORY_WINDOW).forEach((story) => {
    const t = tallyStory(story);
    for (const tag of LEAK_ORDER) {
      total[tag].opportunities += t[tag].opportunities;
      total[tag].errors += t[tag].errors;
      total[tag].cost += t[tag].cost;
    }
  });
  return total;
}

// Retry rows (ReviewSpot) → { tag: { attempts, correct } }.
function tallyRetries(rows) {
  const out = Object.fromEntries(LEAK_ORDER.map((tag) => [tag, { attempts: 0, correct: 0 }]));
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const entry = row && out[row.leakTag];
    if (!entry) return;
    entry.attempts += Math.max(0, Number(row.attempts) || 0);
    entry.correct += Math.max(0, Number(row.correctCount) || 0);
  });
  return out;
}

function masteryOf({ opportunities = 0, errors = 0, attempts = 0, correct = 0 } = {}) {
  const right = Math.max(0, opportunities - errors) + correct;
  const total = opportunities + attempts;
  return { mastery: (right + 1) / (total + 2), evidence: total };
}

// Saved state + clock → the state the ladder acts on. A resting leak whose check-in date came
// round is due for a check-in; nothing is written here.
function effectiveStatus(state, now = new Date()) {
  if (!state || !state.status) return null;
  const due = state.nextCheckAt && new Date(state.nextCheckAt).getTime() <= now.getTime();
  if ((state.status === 'resting' || state.status === 'mastered') && due) return 'checkin';
  return state.status;
}

// How hard a rung leans on a leak, 0..1. Learning leaks lean by how often the player slips;
// a check-in leans lightly, just enough to see whether the fix holds; a rested leak not at all.
function leanFor(leak) {
  if (!leak) return 0;
  if (leak.status === 'learning') {
    const rate = leak.opportunities ? leak.errors / leak.opportunities : 0;
    return round2(clamp(0.35 + rate * 2, 0.35, 1));
  }
  if (leak.status === 'checkin') return 0.4;
  return 0;
}

// { stories, retries, states: { tag: state }, now } → the player's private leak profile.
// `pass` lists leaks that just reached 95% and should be saved as resting.
function buildLeakProfile({ stories = [], retries = [], states = {}, now = new Date() } = {}) {
  const plays = tallyStories(stories);
  const drills = tallyRetries(retries);
  const pass = [];
  const leaks = LEAK_ORDER.map((tag) => {
    const p = plays[tag];
    const r = drills[tag];
    const { mastery, evidence } = masteryOf({ opportunities: p.opportunities, errors: p.errors, attempts: r.attempts, correct: r.correct });
    const saved = states && states[tag];
    let status = effectiveStatus(saved, now);
    if (!status || status === 'learning') {
      if (evidence >= MIN_EVIDENCE && mastery >= PASS_AT && (p.errors > 0 || status === 'learning')) {
        status = 'resting';
        pass.push(tag);
      } else if (p.errors > 0 || status === 'learning') {
        status = 'learning';
      } else {
        status = 'clear';
      }
    }
    const leak = {
      tag,
      label: LEAKS[tag].label,
      opportunities: p.opportunities,
      errors: p.errors,
      cost: Math.round(p.cost),
      mastery: round2(mastery),
      evidence,
      status,
      box: saved && Number.isInteger(saved.box) ? saved.box : 0,
      nextCheckAt: saved && saved.nextCheckAt && status !== 'learning' ? new Date(saved.nextCheckAt).toISOString() : null,
    };
    if (pass.includes(tag)) {
      leak.box = 0;
      leak.nextCheckAt = new Date(now.getTime() + BOX_DAYS[0] * DAY_MS).toISOString();
    }
    leak.lean = leanFor(leak);
    return leak;
  });
  return { leaks, pass };
}

// The saved state after a ladder match that leaned on `tag`, given that match's tally for it.
function stateAfterMatch(prev, matchTally, now = new Date()) {
  const status = effectiveStatus(prev, now) || 'learning';
  const n = Number(matchTally && matchTally.opportunities) || 0;
  const e = Number(matchTally && matchTally.errors) || 0;
  const box = prev && Number.isInteger(prev.box) ? prev.box : 0;
  if (!n) return prev ? { ...prev } : { status: 'learning', box: 0, nextCheckAt: null };
  if (e > 0) return { status: 'learning', box: 0, nextCheckAt: null, slippedAt: now.toISOString() };
  if (status === 'checkin') {
    const next = box + 1;
    if (next >= BOX_DAYS.length) {
      return { status: 'mastered', box: BOX_DAYS.length - 1, nextCheckAt: new Date(now.getTime() + BOX_DAYS[BOX_DAYS.length - 1] * DAY_MS).toISOString() };
    }
    return { status: 'resting', box: next, nextCheckAt: new Date(now.getTime() + BOX_DAYS[next] * DAY_MS).toISOString() };
  }
  return prev ? { ...prev } : { status: 'learning', box: 0, nextCheckAt: null };
}

const TIER_FOR_RUNG = Object.freeze(['BEGINNER', 'INTERMEDIATE', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']);

// The leaks a ladder leans on, most urgent first: check-ins (so a fix is tested on time), then
// learning leaks by how hard they lean.
function targetsOf(leaks) {
  const live = (leaks || []).filter((l) => l.lean > 0);
  return live.sort((a, b) => {
    if ((a.status === 'checkin') !== (b.status === 'checkin')) return a.status === 'checkin' ? -1 : 1;
    return (b.lean - a.lean) || (b.cost - a.cost) || (LEAK_ORDER.indexOf(a.tag) - LEAK_ORDER.indexOf(b.tag));
  });
}

// Picks the tier's bot whose style best presses the leak, avoiding the bot used on the rung below.
// `season` rotates ties so a fresh climb meets new faces.
function pickBot(roster, tier, tag, avoidId, season = 0) {
  const inTier = (roster || []).filter((b) => b.difficulty === tier);
  if (!inTier.length) return null;
  const wanted = tag ? LEAKS[tag].archetypes : [];
  const scored = inTier.map((b, i) => {
    const rank = wanted.indexOf(b.archetype);
    return { b, score: rank === -1 ? 99 : rank, spin: (i + season) % inTier.length };
  }).sort((x, y) => (x.score - y.score) || (x.spin - y.spin));
  return (scored.find((s) => s.b.id !== avoidId) || scored[0]).b;
}

function noticeLine(botName, leak) {
  if (!leak) return `${botName} is watching how you play.`;
  const what = LEAKS[leak.tag].noticed;
  return leak.status === 'checkin'
    ? `${botName} wants to see if you still ${what}.`
    : `${botName} has noticed you ${what}.`;
}

const rungLabel = (i) => (i === RUNGS - 1 ? 'Boss' : `Rung ${i + 1}`);

// { profile, roster, clears, season } → the ladder the player sees. Cleared rungs keep the bot and
// leak they were cleared against; the rest are drawn from the leaks as they stand now, so the
// ladder changes as the player improves. With no leaks yet every rung is a plain scouting match.
function buildLadder({ profile, roster, clears = [], season = 0 } = {}) {
  const leaks = (profile && profile.leaks) || [];
  const targets = targetsOf(leaks);
  const byTag = new Map(leaks.map((l) => [l.tag, l]));
  const done = (Array.isArray(clears) ? clears : []).slice(0, RUNGS);
  const rungs = [];
  for (let i = 0; i < RUNGS; i += 1) {
    const cleared = done[i];
    if (cleared) {
      rungs.push({ rung: i + 1, label: rungLabel(i), status: 'cleared', botId: cleared.botId, botName: cleared.botName,
        difficulty: cleared.difficulty || TIER_FOR_RUNG[i], archetype: cleared.archetype || null,
        leakTag: cleared.leakTag || null, lean: 0, notice: null });
      continue;
    }
    const target = targets.length ? (i === RUNGS - 1 ? targets[0] : targets[i % targets.length]) : null;
    const below = rungs[i - 1];
    const bot = pickBot(roster, TIER_FOR_RUNG[i], target && target.tag, below && below.botId, season);
    if (!bot) continue;
    // The boss leans a notch harder on the leak that costs most.
    const lean = target ? round2(clamp(target.lean + (i === RUNGS - 1 ? 0.15 : 0), 0, 1)) : 0;
    rungs.push({ rung: i + 1, label: rungLabel(i), status: i === done.length ? 'current' : 'locked', botId: bot.id,
      botName: bot.name, difficulty: bot.difficulty, archetype: bot.archetype || null,
      leakTag: target ? target.tag : null, lean, notice: noticeLine(bot.name, target) });
  }
  return { rungs, current: Math.min(done.length, RUNGS - 1) + 1, cleared: done.length >= RUNGS, season };
}

// The ladder match's result in the shared verdict format (two-word headline, one line of why,
// chips at stake). It speaks only about the player's own decisions, never the bot.
function ladderVerdict({ tag, tally, won } = {}) {
  const leak = LEAKS[tag];
  const n = Number(tally && tally.opportunities) || 0;
  const e = Number(tally && tally.errors) || 0;
  if (!leak) {
    return { headline: won ? 'Good climb' : 'Tough climb', why: won ? 'You took the match and the ladder learned how you play.' : 'The ladder learned how you play; the rung is still yours to take.', stake: null };
  }
  if (!n) return { headline: 'Quiet test', why: 'That spot never came up this match, so the ladder will set it again.', stake: null };
  if (e > 0) {
    const cost = Number(tally.cost) || 0;
    return { headline: leak.headlineMiss, why: leak.whyMiss(e, n), stake: cost > 0 ? `${fmt(cost)} chips ${leak.stakeWord} (est.)` : null };
  }
  return { headline: won && n >= 3 ? `Clutch ${leak.holdWord}` : `Good ${leak.holdWord}`, why: leak.whyHold(n), stake: null };
}

module.exports = {
  LEAKS, LEAK_ORDER, BOX_DAYS, PASS_AT, MIN_EVIDENCE, STORY_WINDOW, RUNGS, TIER_FOR_RUNG,
  familiesOf, tallyStory, tallyStories, tallyRetries, masteryOf, effectiveStatus, leanFor,
  buildLeakProfile, stateAfterMatch, targetsOf, pickBot, noticeLine, buildLadder, ladderVerdict,
};
