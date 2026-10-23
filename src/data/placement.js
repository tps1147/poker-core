// PLACEMENT (2.0): ten matches with weight. Each match gets a stamp from its review accuracy and a
// coach line on the "giggle track" (it teases poor play and praises good play), then the reveal
// lands the player on their arena's seal.
//
//   PLACEMENT_MATCHES = 10
//   STAMPS            ['PUNT', 'LOOSE', 'SOLID', 'SHARP'] (worst to best)
//   stampFor(accuracyPct | null) -> stamp | null   (null: too short to read; the app shows no stamp)
//   placementLine(stamp, index)  -> { id, text }   (index picks a line; the same index gives the same line)
//   placementSummary(stamps)     -> { played, done, counts, best, trend: 'up'|'down'|'flat' }
//
// The thresholds read the match review's decision accuracy (0..100). Lines never name a rating
// figure; they talk about the play.

const PLACEMENT_MATCHES = 10;
const STAMPS = Object.freeze(['PUNT', 'LOOSE', 'SOLID', 'SHARP']);
const STAMP_FLOOR = Object.freeze({ PUNT: 0, LOOSE: 55, SOLID: 70, SHARP: 85 });

const LINES = Object.freeze({
  PUNT: Object.freeze([
    'That was generous. They will remember you fondly.',
    'Bold. Wrong, but bold.',
    'The chips wanted to go home. You let them.',
    'We will call that one research.',
  ]),
  LOOSE: Object.freeze([
    'A few too many calls. The bones are there.',
    'Loose, but you found the big spots.',
    'Tidy the small pots and this becomes solid.',
    'Close. One fold away from a good match.',
  ]),
  SOLID: Object.freeze([
    'Solid. Nothing you would take back.',
    'Clean match. The table noticed.',
    'That is how it is done. Again.',
    'No leaks worth mentioning.',
  ]),
  SHARP: Object.freeze([
    'Sharp. Every big decision right.',
    'That one belongs on a highlight reel.',
    'They never had a read on you.',
    'Textbook. Then better than the textbook.',
  ]),
});

function stampFor(accuracyPct) {
  if (accuracyPct == null || !Number.isFinite(Number(accuracyPct))) return null;
  const a = Number(accuracyPct);
  if (a >= STAMP_FLOOR.SHARP) return 'SHARP';
  if (a >= STAMP_FLOOR.SOLID) return 'SOLID';
  if (a >= STAMP_FLOOR.LOOSE) return 'LOOSE';
  return 'PUNT';
}

function placementLine(stamp, index = 0) {
  const lines = LINES[stamp];
  if (!lines) return null;
  const i = ((Math.floor(Number(index) || 0) % lines.length) + lines.length) % lines.length;
  return { id: `placement.${stamp.toLowerCase()}.${i}`, text: lines[i] };
}

function placementSummary(stamps = []) {
  const list = stamps.filter((s) => STAMPS.includes(s));
  const counts = Object.fromEntries(STAMPS.map((s) => [s, list.filter((x) => x === s).length]));
  const best = list.reduce((b, s) => (b == null || STAMPS.indexOf(s) > STAMPS.indexOf(b) ? s : b), null);
  const score = (arr) => (arr.length ? arr.reduce((n, s) => n + STAMPS.indexOf(s), 0) / arr.length : 0);
  const half = Math.floor(list.length / 2);
  const diff = list.length >= 4 ? score(list.slice(half)) - score(list.slice(0, half)) : 0;
  return {
    played: stamps.length,
    done: stamps.length >= PLACEMENT_MATCHES,
    counts,
    best,
    trend: diff > 0.25 ? 'up' : diff < -0.25 ? 'down' : 'flat',
  };
}

module.exports = { PLACEMENT_MATCHES, STAMPS, STAMP_FLOOR, PLACEMENT_LINES: LINES, stampFor, placementLine, placementSummary };
