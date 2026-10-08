// FILM V2: the rules for the narrated v2 films and the track openers (ACADEMY-LEARNING-LOOP and
// LESSONS-UI-PLAN, 2026-10-07). Pure functions over a film's media data, no I/O.
//
// A film's MEDIA is any object with some of:
//   duration | durationSeconds   seconds
//   anchors   { name: seconds | { start } }   the canonical anchors (the v3 media file's own)
//   captions  [{ at, start, end, text }]      the timing.json shape: `at` names the anchor a caption
//                                             starts on, so an anchor with no explicit time falls
//                                             back to the start of the caption that carries it
//   kind      'lesson' | 'opener'             (an id starting "open-" or "academy-open-" is an opener)
//   chapters  [{ at, label }]                 explicit scrub marks (else built from the anchors)
// Canonical anchors: every lesson has hook, yourTurn, rule and upNext; every opener has first. An
// explicit `anchors` entry always wins over a caption, because the timing.json names are each film's
// own and are not canonical yet (the anchor pass adds them; anchorProblems lists what is missing).
//
// THE WATCH RULE on a v2 film runs to the film's stop point, not its full length: a first watch
// stops at upNext (before the film's own "up next" end card), so WATCH_SHARE is measured against
// that stop. A replay runs to the end, can be skipped and scrubbed.
import { hasWatched } from "./filmWatch.mjs";
import { NODES, TRACKS, PATHS } from "./academyTree.mjs";
import { nodeState } from "./nodeState.mjs";

export const LESSON_ANCHORS = Object.freeze(["hook", "yourTurn", "rule", "upNext"]);
export const OPENER_ANCHORS = Object.freeze(["first"]);
const ANCHOR_LABELS = Object.freeze({ hook: "The question", yourTurn: "Your turn", rule: "The rule", upNext: "Up next", first: "First up" });

// Film ids that differ from their node ids (the three Welcome films were cut under short names).
export const FILM_ID_ALIASES = Object.freeze({
  "w-luck-and-skill": "w-luck",
  "w-how-deep": "w-deep",
  "w-the-academy": "w-academy",
});
// A node's film id, and a film id's node (or null).
export const filmIdOfNode = (nodeId) => FILM_ID_ALIASES[nodeId] || nodeId;
export function nodeIdOfFilm(filmId) {
  const bare = String(filmId || "").replace(/^academy-/, "").replace(/-v\d+$/, "");
  const aliased = Object.keys(FILM_ID_ALIASES).find((nodeId) => FILM_ID_ALIASES[nodeId] === bare);
  const id = aliased || bare;
  return NODES.some((n) => n.id === id) ? id : null;
}
// A track's opener film id ("open-<track>").
export const openerIdOfTrack = (trackId) => (TRACKS.some((t) => t.id === trackId) ? `open-${trackId}` : null);

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const durationOf = (media) => num(media?.durationSeconds) ?? num(media?.duration) ?? null;
const isOpener = (media) => media?.kind === "opener" || /^(academy-)?open-/.test(String(media?.id || ""));

function anchorSeconds(media, name) {
  const explicit = media?.anchors?.[name];
  if (num(explicit) != null) return explicit;
  if (explicit && num(explicit.start) != null) return explicit.start;
  const caption = Array.isArray(media?.captions) ? media.captions.find((c) => c && c.at === name) : null;
  return caption && num(caption.start) != null ? caption.start : null;
}

// THE CANON: { kind, duration, anchors, chapters, missing }. `anchors` maps every canonical name of
// the film's kind to its seconds (null when missing); `chapters` are the scrub marks.
export function canon(media) {
  const kind = isOpener(media) ? "opener" : "lesson";
  const names = kind === "opener" ? OPENER_ANCHORS : LESSON_ANCHORS;
  const anchors = {};
  for (const name of names) anchors[name] = anchorSeconds(media, name);
  const missing = names.filter((name) => anchors[name] == null);
  const chapters = Array.isArray(media?.chapters) && media.chapters.length
    ? media.chapters.filter((c) => num(c?.at) != null).map((c) => ({ at: c.at, label: c.label || "" }))
    : names.filter((name) => anchors[name] != null && name !== "upNext").map((name) => ({ at: anchors[name], key: name, label: ANCHOR_LABELS[name] }));
  chapters.sort((a, b) => a.at - b.at);
  return { kind, duration: durationOf(media), anchors, chapters, missing };
}

// What the anchor lint reports for one film: missing canonical anchors, anchors out of order
// (hook, yourTurn, rule, upNext) and anchors past the film's end. Empty when the film is canonical.
export function anchorProblems(media) {
  const c = canon(media);
  const out = c.missing.map((name) => `missing ${name}`);
  const names = c.kind === "opener" ? OPENER_ANCHORS : LESSON_ANCHORS;
  const present = names.filter((name) => c.anchors[name] != null);
  for (let i = 1; i < present.length; i += 1) {
    if (c.anchors[present[i]] < c.anchors[present[i - 1]]) out.push(`${present[i]} comes before ${present[i - 1]}`);
  }
  if (c.duration != null) for (const name of present) if (c.anchors[name] > c.duration) out.push(`${name} is past the end`);
  return out;
}

// Where playback stops, in seconds: a first watch stops at upNext; a replay runs to the end. With
// no upNext anchor (or no media), the film's duration; null when that is unknown too.
export function filmStop(media, { replay = false } = {}) {
  const c = canon(media);
  if (replay || c.kind === "opener") return c.duration;
  return c.anchors.upNext ?? c.duration;
}

// Whether the learner has watched the film: WATCH_SHARE of it played, measured to its stop point.
export function filmWatched(ranges, media, { replay = false } = {}) {
  const stop = filmStop(media, { replay });
  return stop != null && stop > 0 && hasWatched(ranges, stop);
}

// Skip shows only once the film has been watched: never on a first watch.
export const canSkip = ({ watched } = {}) => watched === true;

// THE OPENER RULE. A track's 18-second opener plays the first time the learner enters the track
// (`progress.openers[trackId]` unset); it can always be replayed from the track header. It cuts at
// its `first` anchor (before "First up") when the learner is past the track's first lesson: that
// lesson is filled or sealed, or placement started them later in the track or in a later track.
// `placement`: a node id, { start: nodeId }, or { path: PATHS id } (null: no placement).
export function openerDue(trackId, progress = {}, placement = null) {
  const track = TRACKS.find((t) => t.id === trackId);
  if (!track) return { play: false, cutAtFirst: false };
  const play = !progress?.openers?.[trackId];
  const nodes = NODES.filter((n) => n.track === trackId);
  const first = nodes[0];
  let cutAtFirst = !!first && nodeState(first.id, progress) !== "open";
  const start = placementStart(placement);
  if (!cutAtFirst && start) {
    const startTrack = TRACKS.find((t) => t.id === start.track);
    if (startTrack && startTrack.n > track.n) cutAtFirst = true;
    else if (start.track === trackId && nodes.findIndex((n) => n.id === start.id) > 0) cutAtFirst = true;
  }
  return { play, cutAtFirst };
}

function placementStart(placement) {
  if (!placement) return null;
  const id = typeof placement === "string" ? placement
    : placement.start || PATHS.find((p) => p.id === placement.path)?.start || null;
  return NODES.find((n) => n.id === id) || null;
}

// Where an opener stops: its `first` anchor when cut, else its end.
export function openerStop(media, { cutAtFirst = false } = {}) {
  const c = canon(media);
  return cutAtFirst ? c.anchors.first ?? c.duration : c.duration;
}

// THE FEEDBACK VOICE (silent until the sound-library pass): the moments that speak, and the lines
// each rotates through. Ids mirror NARRATION-drills-nichalia.md (Nichalia, take 1); the file for an
// id is academy/voice/drills/nichalia/<id>.mp3.
export const VOICE_SILENT = true;
export const VOICE_GROUPS = Object.freeze(["correct", "helped", "notquite", "open", "hint", "retry", "streak", "lesson", "clean", "chapter"]);
export const VOICE_LINES = Object.freeze({
  correct: Object.freeze([
    { id: "correct-01", line: "That's the one." },
    { id: "correct-02", line: "Good read. That holds up." },
    { id: "correct-03", line: "Yes. You thought that through." },
    { id: "correct-04", line: "Clean decision. Well done." },
    { id: "correct-05", line: "Right call, for the right reasons." },
    { id: "correct-06", line: "Exactly how I'd think about it." },
  ]),
  helped: Object.freeze([
    { id: "helped-01", line: "There it is. You worked it out." },
    { id: "helped-02", line: "Good. Next time, try it alone." },
    { id: "helped-03", line: "That's it. The help did its job." },
  ]),
  notquite: Object.freeze([
    { id: "notquite-01", line: "Not quite. Let's look again." },
    { id: "notquite-02", line: "Close. Check the reasoning once more." },
    { id: "notquite-03", line: "Not this time. Walk through it with me." },
    { id: "notquite-04", line: "Good instinct, wrong conclusion. Let's see why." },
    { id: "notquite-05", line: "A common one. Let's untangle it." },
    { id: "notquite-06", line: "Not quite. The why is right below." },
  ]),
  open: Object.freeze([
    { id: "open-01", line: "Here's how I'd think about it." },
    { id: "open-02", line: "Sign in, and I'll check these." },
  ]),
  hint: Object.freeze([
    { id: "hint-01", line: "Let's slow down together." },
    { id: "hint-02", line: "Here's where I'd start." },
  ]),
  retry: Object.freeze([
    { id: "retry-01", line: "Same hand. Fresh eyes." },
    { id: "retry-02", line: "Again, with a little help." },
  ]),
  streak: Object.freeze([
    { id: "streak-01", line: "Back again. That's how it sticks." },
    { id: "streak-02", line: "Another day at the table. Good." },
    { id: "streak-03", line: "You keep showing up. It shows." },
  ]),
  lesson: Object.freeze([
    { id: "lesson-01", line: "That's the lesson. Nicely done." },
    { id: "lesson-02", line: "Good work. Now take it to the table." },
    { id: "lesson-03", line: "Lesson done. The misses taught you most." },
  ]),
  clean: Object.freeze([
    { id: "clean-01", line: "Clean run. Every one, first try." },
    { id: "clean-02", line: "Not one miss. Lovely work." },
  ]),
  chapter: Object.freeze([
    { id: "chapter-01", line: "That's the whole chapter. Well played." },
    { id: "chapter-02", line: "Chapter finished. Proud of that work." },
  ]),
});
export const voiceLineFile = (id) => `/academy/voice/drills/nichalia/${id}.mp3`;

// The voice group for a moment, or null when the moment does not speak. `event` is a type string or
// { type, ... }; `summary` carries what the moment knows:
//   answer   { correct: true | false | null, assisted }  null: not graded (preview) -> open
//   hint, retry, chapter                                  always speak
//   streak   { streak }                                   only a streak of 2 days or more
//   lesson   { clean }                                    a clean run -> clean, else lesson
// Results never pick a line: an answer is graded by its decision (`correct`), never by the hand.
export function voiceGroup(event, summary = {}) {
  const type = typeof event === "string" ? event : event?.type;
  const s = { ...(typeof event === "object" && event ? event : {}), ...(summary || {}) };
  switch (type) {
    case "answer":
    case "verdict":
      if (s.correct == null) return "open";
      if (s.correct === true) return s.assisted ? "helped" : "correct";
      return "notquite";
    case "hint": return "hint";
    case "retry": return "retry";
    case "streak": return Number(s.streak) >= 2 ? "streak" : null;
    case "lesson":
    case "takeaway": return s.clean === true ? "clean" : "lesson";
    case "chapter": return "chapter";
    default: return null;
  }
}

// The next line id in a group, never the one just played: the line after `lastId` in the group's
// order (wrapping), or the group's first line. Null for an unknown group.
export function nextVoiceLine(group, lastId = null) {
  const lines = VOICE_LINES[group];
  if (!lines || !lines.length) return null;
  const at = lines.findIndex((l) => l.id === lastId);
  return lines[(at + 1) % lines.length].id;
}
