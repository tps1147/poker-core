// THE FILMS' OWN TIMING (2026-10-08, the "Your turn" timing fix): when each lesson film actually
// speaks, and when its picture moves around the two places it can ask. The caption cues are gapless
// (a cue ends where the next begins), so they cannot say when a line has finished, and the anchors do
// not say where the picture wipes; filmV2 filmAskPlan needs both to ask after a line (never inside a
// word) over a still frame. Writes src/learn/filmSpeech.mjs (generated: never edit it by hand; rerun
// this whenever a film is re-cut, the filmV2 test fails on a stale version).
//
// Per film (node id) it reads, from the motion-draft work folder:
//   src-academy-<folder>-v2/timing.json   `captions` [{ start, end, text }] (the published WebVTT's
//                                         cues exactly) and `audio` (the voice track, public/<audio>,
//                                         16-bit PCM on the film's clock)
//   src-academy-<folder>-v2/words.json    [{ word, start }] word onsets, where present (one film has
//                                         none: its cue windows are used alone)
//   publish/films-v2/<id>/<version>/<id>-1080.mp4  the published picture, at full size
// and writes:
//   speech      the voice as spoken spans [start, end]: voice split wherever it stays under
//               SILENCE_DB for SILENT_RUN seconds. A line's last word ends where its span ends.
//   cues        per cue [start, end, lastOnset, asks, unfinished]: lastOnset is when the cue's last
//               word starts (words.json; without it, the last span that starts in the cue's window);
//               asks is 1 when the text asks (ends in "?" or a trailing "..."), as filmV2 reads it;
//               unfinished is 1 when its sentence runs on into the next cue (ends in , ; : or a dash)
//   upNextLine  the start of the cue that says "Up next", or null
//   motion      where the picture moves, [start, end], inside `windows`: frame-to-frame change of at
//               least MOTION (mean of 0-255 grey at 54 x 96, 30 fps), MOTION_PEAK at its peak
//   windows     the stretches measured: the yourTurn beat (anchor to MOTION_AFTER_TURN after it) and
//               the film's last MOTION_BEFORE_END seconds before its up-next. Outside them nothing
//               is known about the picture.
//   hold        [cueStart, at, placement]: where the "Your turn" card holds and where it sits, for
//               the ask filmV2 askBasis places in this film (the lesson's film stage). `at` is the
//               SETTLED frame (the middle of a frame, so a seek shows that frame): in the window
//               askBasis gives (from the cue's last word to before the next word, the next caption
//               and the stop), the first frame that is still against both neighbours (change under
//               STILL) after every card entrance that finishes inside the window (a run of change
//               peaking at MOTION_PEAK or more); failing that, the first still frame in the window;
//               failing that, the last still frame before it, back to the cue's start (an end ask)
//               or HOLD_SLACK into the last word's tail (a mid-film ask whose next word follows at
//               once); failing that, the quietest of those frames. `placement` is the
//               half of that frame the card covers ("bottom" or "top"): the bottom, unless the
//               film's own content (edge density over INK, REGIONS) sits there and the top is all
//               but empty (TOP_EMPTY, TOP_MARGIN). Null when the film does not ask.
//   holds       a film with several pauses (filmV2 pauseBases): [pauseAt, at, placement] per pause,
//               each measured the same way in its own window (from the end of the voice before the
//               pause's `before` word to just before that word), and `hold` stays null.
//
//   node scripts/sync-film-speech.mjs [workDir]   (or FILMS_V2_WORK; default: the Codex motion draft)
// Needs ffmpeg on the PATH for the picture.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { NODES } from "../src/learn/academyTree.mjs";
import { filmSourceDir, askBasis, pauseBases, HOLD_SLACK } from "../src/learn/filmV2.mjs";
import { academyLesson } from "../src/learn/lessons/index.mjs";
import { lessonOfNode } from "../src/learn/curriculum.mjs";

const DEFAULT = "C:/Users/tps11/Documents/Codex/2026-10-05/task-5/claude-motion-draft-2026-10-06";
const work = process.argv[2] || process.env.FILMS_V2_WORK || DEFAULT;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOP = 0.01;
const SILENCE_DB = -50;
const SILENT_RUN = 0.12;
const VOICED_RUN = 0.03;
const FPS = 30;
const FW = 54;
const FH = 96;
const MOTION = 2;
const MOTION_PEAK = 3;
const MOTION_AFTER_TURN = 30;
const MOTION_AFTER_PAUSE = 3;
const MOTION_BEFORE_END = 12;
// The held frame: still means a change under STILL (mean of 0-255 grey at HW x HH) against both
// neighbouring frames; a mid-film hold may step back at most HOLD_SLACK (filmV2) before its window.
const STILL = 0.2;
const HW = 135;
const HH = 240;
// Where the card can go, measured on the film's own content (shares of its height): the top half
// under the header strip, or the bottom half above the burned-in caption (the card restates the
// caption and offers its own choices, so covering the caption and the film's drawn action buttons
// is by design). The card moves to the top only when the top is all but empty (under TOP_EMPTY ink)
// and the bottom holds the film's content (TOP_MARGIN times the top's ink, or less, up there).
const REGIONS = { top: [0.1, 0.48], bottom: [0.52, 0.84] };
const INK = 28;
const TOP_EMPTY = 0.02;
const TOP_MARGIN = 0.4;

function envelope(path) {
  const buf = readFileSync(path);
  let off = 12; let fmt = null; let data = null;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4); const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") fmt = { ch: buf.readUInt16LE(off + 10), rate: buf.readUInt32LE(off + 12), bits: buf.readUInt16LE(off + 22) };
    if (id === "data") { data = { off: off + 8, size: Math.min(size, buf.length - off - 8) }; break; }
    off += 8 + size + (size & 1);
  }
  if (!fmt || !data || fmt.bits !== 16) throw new Error(`${path}: not 16-bit PCM`);
  const frame = fmt.ch * 2; const n = Math.floor(data.size / frame); const per = Math.round(fmt.rate * HOP);
  const db = new Float64Array(Math.ceil(n / per));
  for (let k = 0; k < db.length; k += 1) {
    let sum = 0; let count = 0;
    for (let i = k * per; i < Math.min(n, (k + 1) * per); i += 1) {
      for (let ch = 0; ch < fmt.ch; ch += 1) { const v = buf.readInt16LE(data.off + i * frame + ch * 2) / 32768; sum += v * v; count += 1; }
    }
    db[k] = count ? 10 * Math.log10(sum / count + 1e-12) : -120;
  }
  return db;
}

const r2 = (v) => Math.round(v * 100) / 100;
const asks = (text) => /\?\s*$/.test(text) || /(\.\.\.|…)\s*$/.test(text);
const unfinished = (text) => /[,;:\u2014-]\s*$/.test(text);

// The voice track as spoken spans: [start, end] stretches of voice, split wherever it stays under
// SILENCE_DB for SILENT_RUN seconds (a 10 ms dip inside a word never splits it).
function spans(db) {
  const out = [];
  const quiet = Math.round(SILENT_RUN / HOP);
  const loud = Math.round(VOICED_RUN / HOP);
  let k = 0;
  while (k < db.length) {
    while (k < db.length && db[k] <= SILENCE_DB) k += 1;
    if (k >= db.length) break;
    const from = k;
    let lastVoiced = k;
    while (k < db.length) {
      if (db[k] > SILENCE_DB) { lastVoiced = k; k += 1; continue; }
      let j = k;
      while (j < db.length && db[j] <= SILENCE_DB && j - k < quiet) j += 1;
      if (j - k >= quiet || j >= db.length) break;
      k = j;
    }
    if (lastVoiced + 1 - from >= loud) out.push([r2(from * HOP), r2((lastVoiced + 1) * HOP)]);
    k = lastVoiced + 1;
  }
  return out;
}

// Each cue: [start, end, lastOnset, asks, unfinished].
function cueRows(cues, words, speech) {
  return cues.map((cue, i) => {
    const limit = cues[i + 1] ? cues[i + 1].start : Infinity;
    const inCue = words.filter((w) => w.start >= cue.start - 0.02 && w.start < limit - 0.02);
    let lastOnset = inCue.length ? inCue[inCue.length - 1].start : null;
    if (lastOnset == null) {
      const begun = speech.filter(([s]) => s >= cue.start - 0.05 && s < limit);
      lastOnset = begun.length ? begun[begun.length - 1][0] : cue.start;
    }
    const text = String(cue.text || "");
    return [r2(cue.start), r2(cue.end), r2(lastOnset), asks(text) ? 1 : 0, unfinished(text) ? 1 : 0];
  });
}

// Where the picture moves inside [from, to]: [start, end] runs of frames that change by MOTION or
// more, joined across a single still frame, kept when they peak at MOTION_PEAK or more. Frame i of
// the read is at from + i / FPS; a change between frames i-1 and i is the picture moving into i.
function motion(video, from, to) {
  const size = FW * FH;
  const buf = execFileSync("ffmpeg", ["-v", "error", "-ss", String(from), "-i", video, "-t", String(to - from),
    "-vf", `fps=${FPS},scale=${FW}:${FH},format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 28 });
  const n = Math.floor(buf.length / size);
  const out = [];
  let run = null;
  for (let i = 1; i < n; i += 1) {
    let sum = 0;
    for (let p = 0; p < size; p += 1) sum += Math.abs(buf[(i - 1) * size + p] - buf[i * size + p]);
    const d = sum / size;
    const t = from + i / FPS;
    if (d >= MOTION) {
      if (run && t - run.end <= 1.5 / FPS) { run.end = t; run.peak = Math.max(run.peak, d); }
      else { if (run) out.push(run); run = { start: t - 1 / FPS, end: t, peak: d }; }
    }
  }
  if (run) out.push(run);
  return out.filter((r) => r.peak >= MOTION_PEAK).map((r) => [r2(r.start), r2(r.end)]);
}

// Grey frames of the picture from frame k0, count of them, at w x h.
function frames(video, k0, count, w, h) {
  const size = w * h;
  const buf = execFileSync("ffmpeg", ["-v", "error", "-ss", (k0 / FPS).toFixed(4), "-i", video, "-frames:v", String(count),
    "-vf", `scale=${w}:${h},format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 29 });
  return { n: Math.floor(buf.length / size), at: (i) => buf.subarray(i * size, (i + 1) * size) };
}
const change = (a, b) => { let sum = 0; for (let p = 0; p < a.length; p += 1) sum += Math.abs(a[p] - b[p]); return sum / a.length; };
const r3 = (v) => Math.round(v * 1000) / 1000;

// The settled frame for an ask (see the header): its frame number.
function settledFrame(video, basis) {
  const floor = Math.max(0, basis.floor);
  const back = basis.mode === "pause" ? floor - HOLD_SLACK : Math.min(floor, basis.cue.start);
  const k0 = Math.max(1, Math.floor(back * FPS) - 1);
  const kLimit = Math.ceil(basis.limit * FPS);
  const read = frames(video, k0, Math.max(3, kLimit - k0 + 3), HW, HH);
  const d = [];
  for (let i = 1; i < read.n; i += 1) d[i] = change(read.at(i - 1), read.at(i));
  const k = (i) => k0 + i;
  const still = (i) => d[i] != null && d[i + 1] != null && d[i] < STILL && d[i + 1] < STILL;
  // Frame k shows over [k, k + 1) / FPS: in the window it starts at or after floor and ends by limit.
  const inWindow = (i) => k(i) / FPS >= floor - 1e-6 && (k(i) + 1) / FPS <= basis.limit + 1e-6;
  const idx = d.map((_, i) => i).filter((i) => i >= 1 && i < read.n - 1);
  const win = idx.filter(inWindow);
  // Card entrances that finish inside the window: runs of change that peak at MOTION_PEAK.
  let entered = -1; let run = null;
  for (const i of win) {
    if (d[i] >= MOTION) run = run ? { ...run, peak: Math.max(run.peak, d[i]), end: i } : { start: i, end: i, peak: d[i] };
    else if (run) { if (run.peak >= MOTION_PEAK) entered = run.end; run = null; }
  }
  const quiet = (list) => [...list].sort((a, b) => (d[a] + (d[a + 1] ?? 9)) - (d[b] + (d[b + 1] ?? 9)))[0];
  // Before the window: a mid-film ask may step back HOLD_SLACK into the last word's tail, an end ask
  // back to its line's start (the card it shows is up by then).
  const before = idx.filter((i) => k(i) / FPS < floor && (k(i) + 1) / FPS >= back - 1e-6);
  const pick = win.find((i) => i > entered && still(i)) ?? win.find(still)
    ?? before.filter(still).at(-1)
    ?? quiet([...before, ...win].length ? [...before, ...win] : idx);
  return { k: k(pick), still: still(pick), how: win.find((i) => i > entered && still(i)) === pick ? "settled" : win.find(still) === pick ? "first-still" : "fallback" };
}

// The half of the held frame the card should cover: the one with less of the film's ink.
function placement(video, k) {
  const w = 270; const h = 480;
  const f = frames(video, k, 1, w, h).at(0);
  const ink = ([a, b]) => {
    let on = 0; let all = 0;
    for (let y = Math.max(1, Math.floor(a * h)); y < Math.min(h - 1, Math.floor(b * h)); y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const g = Math.abs(f[y * w + x + 1] - f[y * w + x - 1]) + Math.abs(f[(y + 1) * w + x] - f[(y - 1) * w + x]);
        if (g >= INK) on += 1;
        all += 1;
      }
    }
    return on / all;
  };
  const top = ink(REGIONS.top); const bottom = ink(REGIONS.bottom);
  return { place: top < TOP_EMPTY && top < bottom * TOP_MARGIN ? "top" : "bottom", top: r3(top), bottom: r3(bottom) };
}

const out = {};
const missing = [];
const report = [];
for (const node of NODES) {
  const id = node.id;
  const mediaPath = join(root, "src", "learn", "media", `${id}.v3.json`);
  const media = existsSync(mediaPath) ? JSON.parse(readFileSync(mediaPath, "utf8")) : null;
  // The film's source folder: the one its media names (a v3 re-cut), else src-academy-<folder>-v2.
  const dir = join(work, media?.source || filmSourceDir(id));
  if (!existsSync(join(dir, "timing.json")) || !media) { missing.push(id); continue; }
  const timing = JSON.parse(readFileSync(join(dir, "timing.json"), "utf8"));
  const wav = join(work, "public", timing.audio);
  const video = join(work, "publish", "films-v2", id, String(media.version), `${id}-1080.mp4`);
  if (!existsSync(wav)) { missing.push(`${id} (no ${timing.audio})`); continue; }
  if (!existsSync(video)) { missing.push(`${id} (no ${video})`); continue; }
  const words = existsSync(join(dir, "words.json")) ? JSON.parse(readFileSync(join(dir, "words.json"), "utf8")).filter((w) => typeof w.start === "number") : [];
  const cues = (timing.captions || []).filter((c) => typeof c.start === "number" && typeof c.end === "number").sort((a, b) => a.start - b.start);
  const speech = spans(envelope(wav));
  const line = cues.find((c) => /^\s*up next\b/i.test(String(c.text || "")));
  const duration = Number(media.durationSeconds) || timing.duration;
  const upNext = Number.isFinite(media.anchors?.upNext) ? media.anchors.upNext : duration;
  const end = line && line.start < upNext ? line.start : upNext;
  const windows = [];
  const definition = academyLesson(lessonOfNode(id));
  const stage = definition?.stages?.find((st) => st.kind === "film") || null;
  // A film with several pauses: a window over each (its anchor to MOTION_AFTER_PAUSE past its word).
  const listed = stage ? pauseBases(stage, { ...media, id }, { speech: null }) : [];
  if (listed.length) for (const b of listed) windows.push([r2(b.at), r2(Math.min(duration, b.before + MOTION_AFTER_PAUSE))]);
  else if (Number.isFinite(media.anchors?.yourTurn)) windows.push([r2(media.anchors.yourTurn), r2(Math.min(duration, media.anchors.yourTurn + MOTION_AFTER_TURN))]);
  windows.push([r2(Math.max(0, end - MOTION_BEFORE_END)), r2(Math.min(duration, upNext + 0.5))]);
  const moving = windows.flatMap(([a, b]) => motion(video, a, b));
  const entry = { version: media.version || null, upNextLine: line ? r2(line.start) : null, cues: cueRows(cues, words, speech), speech, windows, motion: moving, hold: null };
  // Each listed pause's held frame: the settled frame in its window, measured like the single ask's.
  if (listed.length) {
    entry.holds = [];
    for (const b of pauseBases(stage, { ...media, id }, { speech: entry })) {
      const held = settledFrame(video, b);
      const at = r3((held.k + 0.5) / FPS);
      const place = placement(video, held.k);
      entry.holds.push([b.at, at, place.place]);
      report.push({ id, mode: b.mode, key: b.key, cue: b.cue?.start ?? null, wordEnd: r3(b.wordEnd), askAt: b.askAt, limit: r3(b.limit), at, how: held.how, still: held.still, ...place });
    }
  }
  const basis = stage && !listed.length ? askBasis(stage, { ...media, id }, { speech: entry }) : null;
  if (basis?.cue) {
    const held = settledFrame(video, basis);
    const at = r3((held.k + 0.5) / FPS);
    const place = basis.mode === "handoff" ? { place: "bottom", top: null, bottom: null } : placement(video, held.k);
    entry.hold = [basis.cue.start, at, place.place];
    report.push({ id, mode: basis.mode, cue: basis.cue.start, wordEnd: r3(basis.wordEnd), askAt: basis.askAt, limit: r3(basis.limit), at, how: held.how, still: held.still, ...place });
  }
  out[id] = entry;
}

const body = Object.keys(out).sort().map((id) => `  ${JSON.stringify(id)}: {
    version: ${JSON.stringify(out[id].version)},
    upNextLine: ${JSON.stringify(out[id].upNextLine)},
    cues: ${JSON.stringify(out[id].cues)},
    speech: ${JSON.stringify(out[id].speech)},
    windows: ${JSON.stringify(out[id].windows)},
    motion: ${JSON.stringify(out[id].motion)},
    hold: ${JSON.stringify(out[id].hold)},${out[id].holds ? `
    holds: ${JSON.stringify(out[id].holds)},` : ""}
  },`).join("\n");
writeFileSync(join(root, "src", "learn", "filmSpeech.mjs"), `// GENERATED by scripts/sync-film-speech.mjs from the films' voice tracks and pictures: do not edit
// by hand. Per lesson film (node id), in seconds: the v3 media version it was measured for; each
// caption cue as [start, end, lastOnset, asks, unfinished]; the start of its "Up next" line; the
// voice as spoken spans [start, end]; where the picture moves, [start, end], inside the measured
// windows; and the held "Your turn" frame, [cueStart, at, placement] (a film with several pauses:
// holds, one [pauseAt, at, placement] per pause). The script says how each is measured.
export const FILM_SPEECH = Object.freeze({
${body}
});
`);
if (process.env.HOLD_REPORT) writeFileSync(process.env.HOLD_REPORT, JSON.stringify(report, null, 1));
console.log(`sync-film-speech: ${Object.keys(out).length} films, ${report.length} held frames${missing.length ? `; missing ${missing.join(", ")}` : ""}`);
if (missing.length) process.exit(1);
