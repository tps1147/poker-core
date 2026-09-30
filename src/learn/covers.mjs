// Lesson covers: each lesson's key art, the Flop52 chip hero on a floating island staging the
// lesson's idea (the stair of hands for Hand Rankings, the scale for Pot Odds ...), shown wherever a
// lesson is offered (Learn's Up next, the chapter page, the web hub) in place of the coach's face.
//
// The art lives on the media CDN beside the course films (public/academy/covers/ in flop52web,
// uploaded by its scripts/media/sync-media.mjs):
//   /academy/covers/<lesson id>.jpg   the still, 1500 x 1000 (3:2)
//   /academy/covers/<lesson id>.mp4   a 5 s seamless loop of the same frame (when `loop`)
// Paths here are CDN-relative; each client resolves them with its own mediaUrl. A lesson missing
// from LESSON_COVERS has no cover yet and clients fall back to its film poster, so a new lesson can
// ship before its art does. Adding a cover = the files above + one line here.

export const COVER_ASPECT = 3 / 2;

export const LESSON_COVERS = Object.freeze({
  "hand-rankings-workspace-v1": Object.freeze({ loop: true }),
  "positions-workspace-v1": Object.freeze({ loop: true }),
  "betting-actions-workspace-v1": Object.freeze({ loop: true }),
  "outs-workspace-v1": Object.freeze({ loop: true }),
  "rule-2-4-workspace-v1": Object.freeze({ loop: true }),
  "equity-workspace-v1": Object.freeze({ loop: true }),
  "pot-odds-workspace-v2": Object.freeze({ loop: true }),
  "implied-odds-workspace-v1": Object.freeze({ loop: true }),
  "ev-workspace-v1": Object.freeze({ loop: true }),
  "spr-workspace-v1": Object.freeze({ loop: true }),
  "starting-hands-workspace-v1": Object.freeze({ loop: true }),
  "rfi-position-workspace-v1": Object.freeze({ loop: true }),
  "blind-defense-workspace-v1": Object.freeze({ loop: true }),
  "three-betting-workspace-v1": Object.freeze({ loop: true }),
  "ranges-workspace-v1": Object.freeze({ loop: true }),
  "board-texture-workspace-v1": Object.freeze({ loop: true }),
  "cbetting-workspace-v1": Object.freeze({ loop: true }),
  "bet-sizing-workspace-v1": Object.freeze({ loop: true }),
  "semibluff-workspace-v1": Object.freeze({ loop: true }),
  "bluffing-workspace-v1": Object.freeze({ loop: true }),
});

// A lesson's cover as CDN-relative paths, { still, loop } (loop null when it has none), or null
// when the lesson has no cover yet.
export function lessonCover(id) {
  const entry = id ? LESSON_COVERS[id] : null;
  if (!entry) return null;
  return {
    still: `/academy/covers/${id}.jpg`,
    loop: entry.loop ? `/academy/covers/${id}.mp4` : null,
  };
}
