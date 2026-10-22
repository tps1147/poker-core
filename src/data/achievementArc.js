// THE ACHIEVEMENT ARC (2.0): five tracks of steps, each with what to do, why it matters and what it
// grants. It replaces the volume and chip badges, which move to a plain Milestones shelf.
//
//   ARC_TRACKS [{ id, name, steps: [{ id, title, goal: { metric, target }, why, reward }] }]
//   arcStep(trackId, progress)   -> { track, done, current, next, stepIndex } for a track's metric values
//
// metric is a counter the server keeps per player (arc.metrics); reward is a collectible id
// (collectibles.js) or null. Steps on a track run in order; a step is done when its metric reaches
// its target.

const TRACKS = [
  {
    id: 'climb', name: 'The Climb',
    steps: [
      ['climb-1', 'Place', 'placementDone', 1, 'Ten matches tell the game where you start.', 'medal-placement'],
      ['climb-2', 'First gate', 'gatesCrossed', 1, 'Every arena above you plays a little tighter.', 'back-first-gate'],
      ['climb-3', 'Three gates', 'gatesCrossed', 3, 'Mirrors is where the reads start to matter.', null],
      ['climb-4', 'Clubshire', 'arenaReached', 4, 'The suit courts. Fewer free chips, better opponents.', null],
      ['climb-5', 'The Throne', 'arenaReached', 7, 'The top of the road. The ring turns gold.', 'medal-throne'],
    ],
  },
  {
    id: 'craft', name: 'Craft',
    steps: [
      ['craft-1', 'Solid match', 'solidMatches', 1, 'A match with no costly mistakes.', null],
      ['craft-2', 'Five solid', 'solidMatches', 5, 'Good habits, repeated, are what moves you.', null],
      ['craft-3', 'Sharp match', 'sharpMatches', 1, 'Every big decision right.', 'button-brass'],
      ['craft-4', 'Heater', 'bestHeater', 5, 'Five good matches in a row.', 'back-heater'],
    ],
  },
  {
    id: 'study', name: 'Study',
    steps: [
      ['study-1', 'First review', 'reviewsOpened', 1, 'The match review shows the one spot that mattered.', null],
      ['study-2', 'Patch a leak', 'leaksPatched', 1, 'Drill the spot you lost chips in.', null],
      ['study-3', 'Daily Three', 'dailyThreeStreak', 7, 'A week of three puzzles a day.', null],
      ['study-4', 'Five leaks', 'leaksPatched', 5, 'The leaks that cost the most, closed.', null],
    ],
  },
  {
    id: 'rivals', name: 'Rivals',
    steps: [
      ['rivals-1', 'Add a friend', 'friends', 1, 'The climb is better with someone to race.', null],
      ['rivals-2', 'Friend match', 'friendMatches', 1, 'Settle it at the table.', null],
      ['rivals-3', 'Pass a friend', 'friendsPassed', 1, 'Move ahead of a friend on the road.', 'button-rival'],
      ['rivals-4', 'Giant killer', 'beatHigherArena', 1, 'Beat a player two arenas above you.', 'back-giant-killer'],
    ],
  },
  {
    id: 'events', name: 'Events',
    steps: [
      ['events-1', 'Crown Hour', 'crownHourPlayed', 1, 'One hour, one table, one crown.', null],
      ['events-2', 'Final table', 'crownFinalTables', 1, 'Reach the last six.', null],
      ['events-3', 'Six-max podium', 'sixmaxPodiums', 1, 'Finish top three at six-max.', 'medal-sixmax-podium'],
      ['events-4', 'Crown', 'crownWins', 1, 'Win Crown Hour.', 'back-crown-hour'],
    ],
  },
];

const ARC_TRACKS = Object.freeze(TRACKS.map((t) => Object.freeze({
  id: t.id,
  name: t.name,
  steps: Object.freeze(t.steps.map(([id, title, metric, target, why, reward]) => Object.freeze({
    id, title, goal: Object.freeze({ metric, target }), why, reward,
  }))),
})));

const ARC_METRICS = Object.freeze([...new Set(ARC_TRACKS.flatMap((t) => t.steps.map((s) => s.goal.metric)))]);

function arcStep(trackId, metrics = {}) {
  const track = ARC_TRACKS.find((t) => t.id === trackId);
  if (!track) return null;
  const done = [];
  let stepIndex = track.steps.length;
  for (let i = 0; i < track.steps.length; i += 1) {
    const s = track.steps[i];
    if ((Number(metrics[s.goal.metric]) || 0) >= s.goal.target) done.push(s.id);
    else { stepIndex = i; break; }
  }
  const current = track.steps[stepIndex] || null;
  return { track: track.id, done, stepIndex, current, next: track.steps[stepIndex + 1] || null };
}

// Steps newly completed between two metric snapshots (in track order), for the medal moment.
function arcNewlyDone(before = {}, after = {}) {
  const out = [];
  for (const t of ARC_TRACKS) {
    const a = new Set(arcStep(t.id, before).done);
    for (const id of arcStep(t.id, after).done) if (!a.has(id)) out.push({ track: t.id, step: id, reward: t.steps.find((s) => s.id === id).reward });
  }
  return out;
}

module.exports = { ARC_TRACKS, ARC_METRICS, arcStep, arcNewlyDone };
