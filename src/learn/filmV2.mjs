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
import { FILM_SPEECH } from "./filmSpeech.mjs";

export const LESSON_ANCHORS = Object.freeze(["hook", "yourTurn", "rule", "upNext"]);
export const OPENER_ANCHORS = Object.freeze(["first"]);
const ANCHOR_LABELS = Object.freeze({ hook: "The question", yourTurn: "Your turn", rule: "The rule", upNext: "Up next", first: "First up" });

// THE MEDIA ID of a node's film is the node id, everywhere: the v3 media file is
// src/learn/media/<node id>.v3.json, its `id` is the node id, and a definition's `media` and
// `pause.film` name it. Only the render tooling still knows the three Welcome films by the short
// folder names they were cut under (src-academy-<folder>-v2): FILM_FOLDER_ALIASES / filmFolderOfNode,
// for tooling only, never for a media lookup.
export const FILM_FOLDER_ALIASES = Object.freeze({
  "w-luck-and-skill": "w-luck",
  "w-how-deep": "w-deep",
  "w-the-academy": "w-academy",
});
// A node's film media id (the node id itself), its render folder name (tooling), and a film id's
// node (or null): a media id, a folder name or a render id ("academy-w-luck-v2") all resolve.
export const filmIdOfNode = (nodeId) => nodeId;
export const filmFolderOfNode = (nodeId) => FILM_FOLDER_ALIASES[nodeId] || nodeId;
export function nodeIdOfFilm(filmId) {
  const bare = String(filmId || "").replace(/^academy-/, "").replace(/-v\d+$/, "");
  const aliased = Object.keys(FILM_FOLDER_ALIASES).find((nodeId) => FILM_FOLDER_ALIASES[nodeId] === bare);
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

// THE YOUR-TURN PAUSE (moved from web's filmV2Model.js, 2026-10-08; same rule, so web and mobile
// pause on the same frame). The `yourTurn` anchor marks where the beat STARTS ("Your turn. Now they
// go all-in for 100."); the spot is still being described for a few seconds after it, and the film
// asks its question last ("Still 30%. Call or fold?"). So the pause lands at the end of the first cue,
// from the anchor on, that asks (ends in "?" or a trailing "..."), within PAUSE_WINDOW seconds;
// failing that, at the end of the cue the anchor starts; with no cue there, on the anchor itself.
// CUES are [{ start, end, text }]: parseVtt of the film's WebVTT, or the timing.json captions.
export const PAUSE_WINDOW = 15;

const vttStamp = (text) => {
  const match = /^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/.exec(String(text).trim());
  if (!match) return null;
  const [, h, m, s, ms] = match;
  return Number(h || 0) * 3600 + Number(m) * 60 + Number(s) + Number((ms || "0").padEnd(3, "0")) / 1000;
};

// WebVTT text -> [{ start, end, text }] in file order. Cue settings and identifiers are dropped;
// voice and styling tags are stripped from the text.
export function parseVtt(text) {
  if (typeof text !== "string" || !text.trim()) return [];
  const blocks = text.replace(/\r\n?/g, "\n").split(/\n{2,}/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim() !== "");
    const at = lines.findIndex((line) => line.includes("-->"));
    if (at < 0) continue;
    const [from, rest] = lines[at].split("-->");
    const start = vttStamp(from);
    const end = vttStamp(String(rest).trim().split(/\s+/)[0]);
    if (start == null || end == null) continue;
    const body = lines.slice(at + 1).join(" ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    cues.push({ start, end, text: body });
  }
  return cues;
}

const asks = (text) => /\?\s*$/.test(text) || /(\.\.\.|…)\s*$/.test(text);
const cueList = (list) => list.filter((c) => c && num(c.start) != null && num(c.end) != null).map((c) => ({ start: c.start, end: c.end, text: String(c.text || "") }));
const cuesOf = (media) => (Array.isArray(media?.cues) ? cueList(media.cues) : Array.isArray(media?.captions) ? cueList(media.captions) : []);

// The film's caption cues ([{ start, end, text }]) as its v3 media file embeds them (scripts/sync-v3-media.mjs),
// or null when the file has none, so a client falls back to fetching `captions` (the WebVTT URL).
export function filmCues(media) {
  return Array.isArray(media?.cues) && media.cues.length ? cueList(media.cues) : null;
}

// The film's transcript text as its v3 media file embeds it, or null (fall back to fetching `transcript`).
export function filmTranscriptText(media) {
  return typeof media?.transcriptText === "string" && media.transcriptText.trim() ? media.transcriptText : null;
}

// The pause point for a film's "Your turn" beat, in seconds, or null when it has no yourTurn anchor.
// `cues` default to the media's own timing captions (a v3 media file names its VTT by URL, so pass
// parseVtt of it). `explicit` (a number) wins outright.
export function filmPauseAt(media, { cues = null, explicit = null } = {}) {
  if (typeof explicit === "number" && Number.isFinite(explicit)) return explicit;
  const yourTurn = canon(media).anchors.yourTurn;
  if (typeof yourTurn !== "number" || !Number.isFinite(yourTurn)) return null;
  const list = Array.isArray(cues) ? cues : cuesOf(media);
  const after = list.filter((cue) => cue.start >= yourTurn - 0.05 && cue.start <= yourTurn + PAUSE_WINDOW);
  const question = after.find((cue) => asks(cue.text));
  if (question) return question.end;
  const opening = list.find((cue) => cue.start <= yourTurn + 0.05 && cue.end > yourTurn) || after[0];
  return opening ? opening.end : yourTurn;
}

// The definition's own pause for this film (the film stage's `pause: { at, anchor, film, spotId, spot }`),
// or null. `film` names the film it was written for: a v1 film's pause never applies to its v2 film.
export function filmOwnPause(stage, filmId) {
  const pause = stage?.pause;
  return pause && filmId && pause.film === filmId ? pause : null;
}

// THE ASK RULE (2026-10-08, Tyler: the questions asked at the end "break the video timing"; and
// 2026-10-09: "the stop needs to be correctly when the card turns so the transparent look blends
// correctly and the text is readable"). One plan, read by the web and the app alike, says when a
// film asks its "Your turn" question and over which frame:
//
//   { askAt, holdFrameAt, resumeTo, mode, cue, cardPlacement }
//   mode         "pause"    the film asks mid-film (its yourTurn beat) and plays its reveal after
//                "end"      the film plays out its last spoken line before upNext, then asks, and the
//                           lesson goes straight on (the film's own "up next" card never plays). Only
//                           a definition whose end ask is a transfer the film never answered
//                           (pause.endAsk "variant", or an older definition with no endAsk) asks here
//                "handoff"  an end film that has already asked and answered its own question
//                           (pause.endAsk "skip"): it plays out its last line, comes to rest on its
//                           settled frame at askAt, and the lesson moves straight on to its next
//                           step. Nothing is asked again over the frame
//                "none"     the film does not ask (a replay, an opener, a film with no Your turn)
//   askAt        playback crossing it asks, or hands off (seconds; null for "none")
//   holdFrameAt  the frame the card holds over: the SETTLED frame, measured on the published 1080
//                render (FILM_SPEECH hold, scripts/sync-film-speech.mjs): the first still frame after
//                the cue's last spoken word and after any card the film brings in around it, before
//                the next word, the next caption (burned in) and any wipe. Never a frame inside a
//                wipe or a caption change. When it lies after the ask point the film simply plays on
//                to it (silence, no new caption) and askAt moves up to it, so the pause lands on the
//                card already turned. Unmeasured (a film re-cut since): askAt, or the still frame
//                the movement under it starts from (FILM_SPEECH.motion).
//   resumeTo     where the film plays on from after the pick ("pause": holdFrameAt, into the reveal);
//                null for "end", "handoff" (the lesson moves to its next step) and "none"
//   cue          { start, end } the caption cue the ask follows (the question, or the last line
//                before upNext): the card's prompt reads the cues up to its end, and a film left
//                with its question unanswered starts again from its start (askEntry)
//   cardPlacement "bottom" | "top": where the Your turn card sits over the held frame, the half of
//                the frame with less of the film's own content (its question card, table, numbers),
//                measured on the held frame (FILM_SPEECH hold), so the card never covers the film's
//                own question text. "bottom" when unmeasured; null when nothing is asked.
//
// WHERE: never inside a spoken word. The caption cues are gapless (a cue ends where the next one
// starts), so the ask is placed on the film's measured speech (FILM_SPEECH, filmSpeech.mjs): the
// end of the spoken span holding the cue's last word, plus ASK_TAIL (or half the silence to the next
// word when that silence is shorter), and never onto the next cue's caption (burned into the film).
//   "pause"  the cue is the film's question: the first cue from the yourTurn anchor that asks (ends
//            in "?" or a trailing "..."), within PAUSE_WINDOW seconds; failing that, the cue the
//            anchor starts. A cue whose sentence runs on (ends in a comma) takes the rest of its
//            sentence with it. Where a film sets its spot out without a question mark, QUESTION_CUES
//            names the cue by hand (the last line before the reveal, by its start; only over the
//            film's current measurements, so a re-timed film without that cue falls back to the
//            rule). The definition's own `at` is the beat's START (canon yourTurn), never the pause.
//   "end", "handoff"  the cue is the last line the film speaks before its up-next: before upNext,
//            and before the cue that says "Up next" when a film speaks it ahead of its anchor. The
//            ask lands at least END_GUARD before that point and never before the line's last word
//            ends; the films start their wipe into the up-next card up to half a second before it,
//            so the held frame is the settled one before that wipe.
// Without measured speech (a film not measured yet, or re-cut since) the cue's own end stands in
// for its last word's end.
//
// ONCE PER WATCH: a replay never asks. A first watch asks (or hands off) when playback crosses
// askAt; a user seek back before askAt re-arms it, nothing else does (askGate).
export const ASK_TAIL = 0.12;
export const END_GUARD = 0.25;
export const END_ASK = Object.freeze({ skip: "skip", variant: "variant" });
const ASK_NONE = Object.freeze({ askAt: null, holdFrameAt: null, resumeTo: null, mode: "none", cue: null, cardPlacement: null });

// The question cue (its start, seconds) of the films whose spot is set out without a "?" in a cue,
// read off each film's own words (2026-10-08): the last line before the film starts answering.
export const QUESTION_CUES = Object.freeze({
  "m-rule-2-4": { at: 68.38 },      // "Pick the rule first."
  "m-implied-odds": { at: 73.94 },  // "Pot 60, bet 20, 90 behind."
  "m-ev": { at: 65.4 },             // "They shove 40 into 150."
  "f-ranges": { at: 86.09 },        // "Drag your split first... then watch it fill."
  "f-cbet": { at: 72.09 },          // "Read the bars."
  "f-bet-sizing": { at: 74.72 },    // "A river where you want his weaker pairs to call."
  "x-fold-equity": { at: 63.41 },   // "He folds a quarter, you hit a quarter... both given."
  "f-value-betting": { at: 76.08 }, // "Sort the callers first."
  "f-playing-draws": { at: 70.1 },  // "He bets 60 into 120, with 300 behind."
});

const r3 = (v) => Math.round(v * 1000) / 1000;
const unfinished = (text) => /[,;:—-]\s*$/.test(text);

// A film's measured speech while it is current for this media ({ version, upNextLine, cues,
// speech, windows, motion, hold }), or null.
export function filmSpeech(media) {
  const id = nodeIdOfFilm(media?.id) || media?.id;
  const entry = id ? FILM_SPEECH[id] : null;
  if (!entry) return null;
  if (media?.version && entry.version && entry.version !== media.version) return null;
  return entry;
}

// The cues the rule reads ({ start, end, lastOnset, asks, runsOn }): the measured ones when present,
// else `cues` (parseVtt of the film's WebVTT) or the media's own timing captions.
function askCues(media, measured, cues) {
  if (measured) return measured.cues.map(([start, end, lastOnset, q, on]) => ({ start, end, lastOnset, asks: q === 1, runsOn: on === 1 }));
  const list = Array.isArray(cues) ? cues : cuesOf(media);
  return list.map((cue) => ({ start: cue.start, end: cue.end, lastOnset: null, asks: asks(String(cue.text || "")), runsOn: unfinished(String(cue.text || "")) }));
}

// When the cue's last word has been said, when the next word starts, and when the next caption
// shows (Infinity: none).
function spokenAround(list, cue, spans) {
  const next = list[list.indexOf(cue) + 1];
  const caption = next ? next.start : Infinity;
  if (!spans || cue.lastOnset == null) return { end: cue.end, nextStart: caption, caption };
  const onset = cue.lastOnset;
  const span = spans.find(([s, e]) => s <= onset + 0.05 && e > onset) || spans.find(([s]) => s >= onset - 0.05);
  const end = span ? Math.max(span[1], onset) : cue.end;
  const after = spans.find(([s]) => s > end + 0.001);
  return { end, nextStart: after ? after[0] : Infinity, caption };
}

// A mid-film hold may sit this far inside the last word's fading tail (the resume replays it).
export const HOLD_SLACK = 0.1;
// After the word: ASK_TAIL, or half the silence to the next word, and never onto the next caption
// (the films burn their captions in: a frame past the next cue's start would show the next line).
// A held frame keeps WORD_LEAD clear of the next word, so the resume never clips it.
export const CAPTION_LEAD = 0.02;
export const WORD_LEAD = 0.03;
const placeAfter = ({ end, nextStart, caption }) => Math.max(end, Math.min(end + Math.min(ASK_TAIL, Math.max(0, (nextStart - end) / 2)), caption - CAPTION_LEAD));

// The unmeasured fallback: askAt itself unless the picture is moving there (a wipe or a reveal
// already under way); then the still frame the movement starts from, when that is no earlier than
// `floor`. No motion data: askAt.
function stillAt(at, measured, floor) {
  const moving = (measured?.motion || []).find(([a, b]) => at > a + 0.001 && at <= b + 0.001);
  return moving && moving[0] >= floor - 0.001 ? r3(moving[0]) : at;
}

// The question cue of a "pause" film.
function questionCue(media, list, beat, measured) {
  const named = QUESTION_CUES[nodeIdOfFilm(media?.id) || media?.id];
  if (named && measured) {
    const cue = list.find((x) => Math.abs(x.start - named.at) < 0.02);
    if (cue) return cue;
  }
  const window = list.filter((x) => x.start >= beat - 0.05 && x.start <= beat + PAUSE_WINDOW);
  let cue = window.find((x) => x.asks) || list.find((x) => x.start <= beat + 0.05 && x.end > beat) || window[0] || null;
  while (cue && cue.runsOn && list[list.indexOf(cue) + 1]) cue = list[list.indexOf(cue) + 1];
  return cue;
}

// THE ASK BASIS: what the plan is built on, before the held frame is chosen. { mode, cue, askAt,
// wordEnd, floor, limit, measured }, or null when the film does not ask. The held frame belongs in
// [floor, limit): from the end of the cue's last word to before the next caption, the next word (a
// "pause" film resumes from it) and the film's stop. Where the next word follows at once, a mid-film
// hold may sit up to HOLD_SLACK inside the last word's fading tail (the resume replays it). scripts/sync-film-speech.mjs measures
// the settled frame in that window on the published render; filmAskPlan reads it back.
export function askBasis(stage, media, { replay = false, cues = null, speech } = {}) {
  const c = canon(media);
  if (replay || c.kind === "opener") return null;
  const own = filmOwnPause(stage, media?.id);
  const measured = speech === undefined ? filmSpeech(media) : speech;
  const list = askCues(media, measured, cues);
  const spans = measured?.speech || null;
  const beat = c.anchors.yourTurn ?? num(own?.at);

  if (beat != null && own?.anchor !== "end") {
    const cue = questionCue(media, list, beat, measured);
    if (!cue) return { mode: "pause", cue: null, askAt: r3(beat), wordEnd: beat, floor: beat, limit: beat, measured };
    const said = spokenAround(list, cue, spans);
    return { mode: "pause", cue: { start: cue.start, end: cue.end }, askAt: r3(placeAfter(said)), wordEnd: said.end,
      floor: said.end, limit: Math.min(said.caption - CAPTION_LEAD, said.nextStart - WORD_LEAD), measured };
  }

  if (own?.anchor === "end") {
    const mode = own.endAsk === END_ASK.skip ? "handoff" : "end";
    const line = num(measured?.upNextLine);
    const upNext = c.anchors.upNext ?? c.duration;
    const stop = line != null && (upNext == null || line < upNext) ? line : upNext;
    if (stop == null) return null;
    const before = list.filter((x) => x.start < stop - 0.05);
    const cue = before[before.length - 1];
    if (!cue) { const at = r3(Math.max(0, stop - END_GUARD)); return { mode, cue: null, askAt: at, wordEnd: at, floor: at, limit: at, measured }; }
    const said = spokenAround(list, cue, spans);
    const askAt = r3(Math.max(Math.min(said.end, stop), Math.min(placeAfter(said), stop - END_GUARD)));
    return { mode, cue: { start: cue.start, end: Math.min(cue.end, stop) }, askAt, wordEnd: Math.min(said.end, stop),
      floor: Math.min(said.end, stop), limit: Math.min(said.caption - CAPTION_LEAD, stop - CAPTION_LEAD), measured };
  }
  return null;
}

// The measured settled frame for this ask ({ at, place }), while it was measured for this cue.
function measuredHold(measured, cue) {
  const hold = measured?.hold;
  if (!Array.isArray(hold) || !cue || Math.abs(hold[0] - cue.start) > 0.02 || num(hold[1]) == null) return null;
  return { at: hold[1], place: hold[2] === "top" ? "top" : "bottom" };
}

// The plan for one watch of one film. `stage`: the lesson's film stage (its `pause` is the
// definition's own Your turn when written for this film). `replay`: the run has the film watched.
// `cues`: parseVtt of the film's WebVTT, read only when the film has no measured speech. `speech`:
// overrides the measured speech (null: none), for tests.
export function filmAskPlan(stage, media, opts = {}) {
  const basis = askBasis(stage, media, opts);
  if (!basis) return ASK_NONE;
  const { mode, cue, measured } = basis;
  if (!cue) return { askAt: basis.askAt, holdFrameAt: basis.askAt, resumeTo: mode === "pause" ? basis.askAt : null, mode, cue: null, cardPlacement: mode === "handoff" ? null : "bottom" };
  const hold = measuredHold(measured, cue);
  const holdFrameAt = hold ? hold.at : stillAt(basis.askAt, measured, mode === "pause" ? basis.wordEnd - HOLD_SLACK : cue.start);
  // A settled frame after the ask point: the film plays on to it (no word, no new caption between).
  const askAt = holdFrameAt > basis.askAt ? holdFrameAt : basis.askAt;
  const cardPlacement = mode === "handoff" ? null : hold?.place || "bottom";
  return { askAt, holdFrameAt, resumeTo: mode === "pause" ? holdFrameAt : null, mode, cue, cardPlacement };
}

// THE ASK GATE: the one-ask-per-watch rule as playback sees it, shared by both players. Feed it the
// playhead on every time update and every user seek; it says when to ask (for a "handoff" plan:
// when to hand the lesson on, the same crossing with no card).
//   tick(prev, now, playing)  true once, when playing playback crosses askAt (prev < askAt <= now in
//                             a step under a second: a jump past it is a seek, not a crossing)
//   seek(to)                  a user seek (scrub, skip, restart): one back before askAt re-arms it.
//                             The player's own seeks (holding the frame, resuming) are not reported.
//   lead(now, playing)        seconds to the ask while it is armed and at most ASK_LOOKAHEAD away,
//                             so a player that polls can time the pause to the frame (a timer
//                             that fires a hair early ticks short and is set again from lead)
//   armed                     whether the next crossing asks
// A replay's plan is "none": its gate never asks, and no seek re-arms it.
export const ASK_LOOKAHEAD = 0.6;
export function askGate(plan) {
  const askAt = plan && plan.mode !== "none" && num(plan.askAt) != null ? plan.askAt : null;
  let armed = askAt != null;
  return {
    get armed() { return armed; },
    get askAt() { return askAt; },
    tick(prev, now, playing = true) {
      if (!armed || !playing || num(prev) == null || num(now) == null) return false;
      if (prev < askAt && now >= askAt && now - prev < 1) { armed = false; return true; }
      return false;
    },
    seek(to) { if (askAt != null && num(to) != null && to < askAt - 0.01) armed = true; },
    lead(now, playing = true) {
      if (!armed || !playing || num(now) == null) return null;
      const left = askAt - now;
      return left >= 0 && left <= ASK_LOOKAHEAD ? left : null;
    },
  };
}

// Where a film entered at `at` starts: at or past an unanswered ask, from the start of the asking
// cue (so the learner hears the question again and the film asks), never playing on past it.
export function askEntry(plan, at, { answered = false } = {}) {
  const from = Math.max(0, num(at) ?? 0);
  if (!plan || plan.mode === "none" || answered || num(plan.askAt) == null || from < plan.askAt - 0.3) return from;
  return Math.max(0, Math.min(plan.cue?.start ?? plan.askAt - 2, plan.askAt - 0.5));
}

// The older reading, { at, atEnd }, for callers that still take it: `at` is filmAskPlan's askAt.
export function filmTurnPlan(stage, media, { cues = null, replay = false } = {}) {
  const plan = filmAskPlan(stage, media, { cues, replay });
  // A handoff asks nothing.
  return plan.mode === "handoff" ? { at: null, atEnd: false } : { at: plan.askAt, atEnd: plan.mode === "end" };
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
