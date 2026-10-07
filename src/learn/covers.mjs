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

// Skill medallions: one brass medallion per skill-tree node (the 28 concept nodes the apps' tree
// draws), cut round with a transparent edge so it sits on either theme:
//   /academy/skills/<node id>.webp   320 x 320
// A node missing here has no medallion yet; clients draw their plain dot.
export const SKILL_MEDALS = Object.freeze([
  "t0-hand-rankings", "t0-positions", "t0-betting-actions",
  "t1-outs-rule-24", "t1-equity", "t1-pot-odds", "t1-implied-odds", "t1-ev", "t1-spr",
  "t2-starting-hands", "t2-rfi-by-position", "t2-blind-defense", "t2-3betting",
  "t3-ranges", "t3-board-texture", "t3-cbetting", "t3-bet-sizing",
  "t4-fold-equity-semibluff", "t4-bluffing", "t4-mdf-bluffcatch", "t4-barreling-blockers",
  "t5-range-narrowing", "t5-player-typing", "t5-gto-to-exploit",
  "t6-bankroll", "t6-tilt", "t6-icm", "t6-multiway",
]);
const MEDAL_SET = new Set(SKILL_MEDALS);

// A skill node's medallion as a CDN-relative path, or null.
export function skillMedal(nodeId) {
  return nodeId && MEDAL_SET.has(nodeId) ? `/academy/skills/${nodeId}.webp` : null;
}

// Chapter art: each chapter's world, its lessons' islands joined into one larger island with a
// winding path and the chip hero at its start, shown at the top of the chapter page (16:9):
//   /academy/chapters/<chapter id>.jpg   the still, 1600 x 900
//   /academy/chapters/<chapter id>.mp4   a seamless loop (when `loop`; the first set is stills only)
export const CHAPTER_ART_ASPECT = 16 / 9;
export const CHAPTER_ART = Object.freeze({
  "table-literacy": Object.freeze({ loop: false }),
  "math-spine-1": Object.freeze({ loop: false }),
  "math-spine-2": Object.freeze({ loop: false }),
  "preflop-discipline": Object.freeze({ loop: false }),
  "postflop-fundamentals": Object.freeze({ loop: false }),
  "pressure": Object.freeze({ loop: false }),
});

export function chapterArt(id) {
  const entry = id ? CHAPTER_ART[id] : null;
  if (!entry) return null;
  return {
    still: `/academy/chapters/${id}.jpg`,
    loop: entry.loop ? `/academy/chapters/${id}.mp4` : null,
  };
}

// The chapter hand's own art: its opening (the chip hero at a spotlit table, five cards face down,
// the seal stamp waiting; 3:2, a still for now, loop null) and the seal it awards (cut round).
export const CHAPTER_HAND_ART = Object.freeze({
  still: "/academy/chapter-hand/intro.jpg",
  loop: null,
  seal: "/academy/chapter-hand/seal.webp",
});

// The Stats page's six skill rings wear these medallions (the tree node closest to what each
// ring reads).
export const RING_MEDALS = Object.freeze({
  pokerMath: "t1-pot-odds",
  handSelection: "t2-starting-hands",
  aggression: "t2-3betting",
  discipline: "t2-blind-defense",
  postflop: "t3-cbetting",
  steadiness: "t6-tilt",
});

export const ringMedal = (ringKey) => skillMedal(RING_MEDALS[ringKey]);
