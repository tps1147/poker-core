// The leak ladder (src/ladder): leak counts from stored stories, mastery, the rest-and-check-in
// schedule, rung building and the verdict copy.
const assert = require('assert');
const {
  buildLeakProfile, buildLadder, stateAfterMatch, ladderVerdict, tallyStory, effectiveStatus,
  LEAKS, BOX_DAYS, RUNGS,
} = require('../src/ladder');
const { BOT_ROSTER: roster } = require('../src/data/botRoster');

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-16T08:00:00Z');

const spot = (action, playerGrade, extra = {}) => ({ action, playerGrade, toCall: 0, phase: 'river', costEst: null, ...extra });
const fold = (grade, cost = null) => spot('fold', grade, { toCall: 400, costEst: cost });
const call = (grade, cost = null) => spot('call', grade, { toCall: 400, costEst: cost });

// Counting: a fold or call facing a bet is a chance for both price leaks; only the wrong one errs.
const t = tallyStory({ spots: [fold('punt', 900), fold('solid'), call('leak', 300), spot('check', 'loose', { costEst: 120 }), spot('raise', 'solid'), spot('raise', null), spot('fold', 'punt', { toCall: 0, phase: 'preflop' })] });
assert.deepStrictEqual(t['overfolding-to-aggression'], { opportunities: 3, errors: 1, cost: 900 });
assert.deepStrictEqual(t['chasing-bad-prices'], { opportunities: 3, errors: 1, cost: 300 });
assert.deepStrictEqual(t['missing-value-bets'], { opportunities: 2, errors: 1, cost: 120 });

// A player who folds too much: that leak is learning and leans hard; the clean families are clear.
const foldy = Array.from({ length: 4 }, () => ({ spots: [fold('punt', 500), fold('leak', 200), call('solid'), call('solid')] }));
let p = buildLeakProfile({ stories: foldy, now });
const over = p.leaks.find((l) => l.tag === 'overfolding-to-aggression');
assert.strictEqual(over.status, 'learning');
assert.strictEqual(over.errors, 8);
assert.ok(over.lean >= 0.9, 'a 50% slip rate leans near full');
assert.strictEqual(p.leaks.find((l) => l.tag === 'chasing-bad-prices').status, 'clear');
assert.strictEqual(p.leaks.find((l) => l.tag === 'missing-value-bets').lean, 0);
assert.deepStrictEqual(p.pass, []);

// Only the latest 20 stories count, so an old habit fades out.
const old = Array.from({ length: 20 }, () => ({ spots: [call('solid')] }));
p = buildLeakProfile({ stories: [...old, ...foldy], now });
assert.strictEqual(p.leaks.find((l) => l.tag === 'overfolding-to-aggression').status, 'clear');

// 95% with enough evidence passes: it rests and is due back in one day.
const fixed = [{ spots: [fold('leak', 100)] }, ...Array.from({ length: 12 }, () => ({ spots: [call('solid'), call('solid'), call('clutch')] }))];
p = buildLeakProfile({ stories: fixed, retries: [{ leakTag: 'overfolding-to-aggression', attempts: 4, correctCount: 4 }], now });
const passed = p.leaks.find((l) => l.tag === 'overfolding-to-aggression');
assert.deepStrictEqual(p.pass, ['overfolding-to-aggression']);
assert.strictEqual(passed.status, 'resting');
assert.strictEqual(passed.lean, 0, 'the bot eases off a passed leak');
assert.ok(passed.mastery >= 0.95);
assert.strictEqual(new Date(passed.nextCheckAt).getTime(), now.getTime() + BOX_DAYS[0] * DAY);

// Too little evidence never passes, however clean.
p = buildLeakProfile({ stories: [{ spots: [fold('leak'), call('solid'), call('solid')] }], states: { 'overfolding-to-aggression': { status: 'learning', box: 0 } }, now });
assert.strictEqual(p.leaks.find((l) => l.tag === 'overfolding-to-aggression').status, 'learning');

// Resting comes due: a check-in leans lightly.
const resting = { status: 'resting', box: 1, nextCheckAt: new Date(now.getTime() - 1000).toISOString() };
assert.strictEqual(effectiveStatus(resting, now), 'checkin');
assert.strictEqual(effectiveStatus({ ...resting, nextCheckAt: new Date(now.getTime() + DAY).toISOString() }, now), 'resting');
p = buildLeakProfile({ stories: foldy, states: { 'overfolding-to-aggression': resting }, now });
assert.strictEqual(p.leaks.find((l) => l.tag === 'overfolding-to-aggression').lean, 0.4);

// After a check-in: clean moves a box on (1 → 3 → 7 → 21 days), a slip goes back to learning,
// a match where the spot never came up changes nothing.
let s = stateAfterMatch(resting, { opportunities: 3, errors: 0 }, now);
assert.deepStrictEqual([s.status, s.box], ['resting', 2]);
assert.strictEqual(new Date(s.nextCheckAt).getTime(), now.getTime() + BOX_DAYS[2] * DAY);
s = stateAfterMatch({ status: 'resting', box: 3, nextCheckAt: now.toISOString() }, { opportunities: 2, errors: 0 }, now);
assert.strictEqual(s.status, 'mastered');
s = stateAfterMatch(resting, { opportunities: 3, errors: 1 }, now);
assert.deepStrictEqual([s.status, s.box, s.nextCheckAt], ['learning', 0, null]);
assert.deepStrictEqual(stateAfterMatch(resting, { opportunities: 0, errors: 0 }, now), resting);

// The ladder: five rungs, climbing in tier, each pressing a live leak with a bot whose style fits.
p = buildLeakProfile({ stories: foldy, now });
let ladder = buildLadder({ profile: p, roster });
assert.strictEqual(ladder.rungs.length, RUNGS);
assert.deepStrictEqual(ladder.rungs.map((r) => r.difficulty), ['BEGINNER', 'INTERMEDIATE', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']);
assert.ok(ladder.rungs.every((r) => r.leakTag === 'overfolding-to-aggression'));
assert.ok(ladder.rungs.every((r) => LEAKS['overfolding-to-aggression'].archetypes.includes(r.archetype)), 'pressure bots press a folder');
assert.strictEqual(ladder.rungs[0].status, 'current');
assert.ok(ladder.rungs[4].lean >= ladder.rungs[3].lean, 'the boss never leans softer');
assert.strictEqual(ladder.rungs[4].label, 'Boss');
assert.match(ladder.rungs[0].notice, /has noticed you fold to big bets\.$/);
for (let i = 1; i < RUNGS; i += 1) assert.notStrictEqual(ladder.rungs[i].botId, ladder.rungs[i - 1].botId);

// Cleared rungs keep the bot they were beaten with; the rest follow the leaks as they are now.
const clears = [{ botId: 'lucky-larry', botName: 'Lucky Larry', difficulty: 'BEGINNER', archetype: 'drawer', leakTag: 'overfolding-to-aggression' }];
const chaser = Array.from({ length: 4 }, () => ({ spots: [call('punt', 600), call('leak', 100), fold('solid')] }));
ladder = buildLadder({ profile: buildLeakProfile({ stories: chaser, now }), roster, clears });
assert.strictEqual(ladder.rungs[0].status, 'cleared');
assert.strictEqual(ladder.rungs[0].botId, 'lucky-larry');
assert.strictEqual(ladder.rungs[1].status, 'current');
assert.strictEqual(ladder.rungs[1].leakTag, 'chasing-bad-prices');
assert.ok(LEAKS['chasing-bad-prices'].archetypes.includes(ladder.rungs[1].archetype));
assert.strictEqual(ladder.current, 2);

// No leaks yet: plain scouting rungs, no lean, still a full climb.
ladder = buildLadder({ profile: buildLeakProfile({ stories: [], now }), roster });
assert.ok(ladder.rungs.every((r) => r.lean === 0 && r.leakTag === null));
assert.match(ladder.rungs[0].notice, /is watching how you play\.$/);

// A check-in rung says so.
ladder = buildLadder({ profile: buildLeakProfile({ stories: foldy, states: { 'overfolding-to-aggression': resting }, now }), roster });
assert.match(ladder.rungs[0].notice, /wants to see if you still fold to big bets\.$/);

// Verdicts: two words, one line of why, chips at stake on a miss; never about the bot.
let v = ladderVerdict({ tag: 'overfolding-to-aggression', tally: { opportunities: 5, errors: 2, cost: 1240 }, won: false });
assert.deepStrictEqual(v, { headline: 'Folded early', why: 'You folded 2 of 5 times the price said to call.', stake: '1,240 chips left on the table (est.)' });
v = ladderVerdict({ tag: 'chasing-bad-prices', tally: { opportunities: 4, errors: 0, cost: 0 }, won: true });
assert.deepStrictEqual(v, { headline: 'Clutch folds', why: 'You faced 4 prices and paid none your share did not cover.', stake: null });
v = ladderVerdict({ tag: 'missing-value-bets', tally: { opportunities: 1, errors: 0 }, won: false });
assert.strictEqual(v.headline, 'Good bets');
assert.strictEqual(ladderVerdict({ tag: 'missing-value-bets', tally: { opportunities: 0 } }).headline, 'Quiet test');
for (const verdict of [v, ladderVerdict({ tag: null, won: true })]) {
  assert.strictEqual(verdict.headline.split(' ').length, 2);
  assert.ok(!/opponent|bot|they/i.test(verdict.why));
}

console.log('leakLadder tests passed');
