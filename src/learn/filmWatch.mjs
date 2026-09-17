// When the film counts as watched (learn-flow-2026-09-16 SPEC 1.2, D2). Pure, no imports, so
// filmWatch.test.js runs under plain Node.
// The film counts as watched once the learner has actually played WATCH_SHARE of it: the sum of the
// ranges the playhead crossed while playing, never the playhead's position, so scrubbing to the end
// earns nothing. Ranges are [start, end] pairs in seconds.
export const WATCH_SHARE = 0.85;

export function mergeRanges(ranges) {
  const sorted = (ranges || [])
    .filter((range) => Array.isArray(range) && Number.isFinite(range[0]) && Number.isFinite(range[1]) && range[1] > range[0])
    .map(([start, end]) => [Math.max(0, start), end])
    .sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [start, end] of sorted) {
    const last = out.at(-1);
    if (last && start <= last[1] + 0.05) last[1] = Math.max(last[1], end);
    else out.push([start, end]);
  }
  return out;
}

export function playedSeconds(ranges, duration = Infinity) {
  return mergeRanges(ranges).reduce((sum, [start, end]) => sum + Math.max(0, Math.min(end, duration) - Math.min(start, duration)), 0);
}

export function playedShare(ranges, duration) {
  return duration > 0 ? Math.min(1, playedSeconds(ranges, duration) / duration) : 0;
}

export const hasWatched = (ranges, duration) => duration > 0 && playedShare(ranges, duration) >= WATCH_SHARE;

// A media element's TimeRanges (HTMLMediaElement.played) as [start, end] pairs.
export function timeRanges(list) {
  const out = [];
  for (let i = 0; i < (list?.length || 0); i += 1) out.push([list.start(i), list.end(i)]);
  return out;
}
