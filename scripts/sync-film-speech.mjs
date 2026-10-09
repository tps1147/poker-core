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
//   publish/films-v2/<id>/<version>/<id>-720.mp4   the published picture
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
//
//   node scripts/sync-film-speech.mjs [workDir]   (or FILMS_V2_WORK; default: the Codex motion draft)
// Needs ffmpeg on the PATH for the picture.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { NODES } from "../src/learn/academyTree.mjs";
import { filmFolderOfNode } from "../src/learn/filmV2.mjs";

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
const MOTION_BEFORE_END = 12;

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

const out = {};
const missing = [];
for (const node of NODES) {
  const id = node.id;
  const dir = join(work, `src-academy-${filmFolderOfNode(id)}-v2`);
  const mediaPath = join(root, "src", "learn", "media", `${id}.v3.json`);
  if (!existsSync(join(dir, "timing.json")) || !existsSync(mediaPath)) { missing.push(id); continue; }
  const timing = JSON.parse(readFileSync(join(dir, "timing.json"), "utf8"));
  const media = JSON.parse(readFileSync(mediaPath, "utf8"));
  const wav = join(work, "public", timing.audio);
  const video = join(work, "publish", "films-v2", id, String(media.version), `${id}-720.mp4`);
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
  if (Number.isFinite(media.anchors?.yourTurn)) windows.push([r2(media.anchors.yourTurn), r2(Math.min(duration, media.anchors.yourTurn + MOTION_AFTER_TURN))]);
  windows.push([r2(Math.max(0, end - MOTION_BEFORE_END)), r2(Math.min(duration, upNext + 0.5))]);
  const moving = windows.flatMap(([a, b]) => motion(video, a, b));
  out[id] = { version: media.version || null, upNextLine: line ? r2(line.start) : null, cues: cueRows(cues, words, speech), speech, windows, motion: moving };
}

const body = Object.keys(out).sort().map((id) => `  ${JSON.stringify(id)}: {
    version: ${JSON.stringify(out[id].version)},
    upNextLine: ${JSON.stringify(out[id].upNextLine)},
    cues: ${JSON.stringify(out[id].cues)},
    speech: ${JSON.stringify(out[id].speech)},
    windows: ${JSON.stringify(out[id].windows)},
    motion: ${JSON.stringify(out[id].motion)},
  },`).join("\n");
writeFileSync(join(root, "src", "learn", "filmSpeech.mjs"), `// GENERATED by scripts/sync-film-speech.mjs from the films' voice tracks and pictures: do not edit
// by hand. Per lesson film (node id), in seconds: the v3 media version it was measured for; each
// caption cue as [start, end, lastOnset, asks, unfinished]; the start of its "Up next" line; the
// voice as spoken spans [start, end]; and where the picture moves, [start, end], inside the measured
// windows. The script says how each is measured.
export const FILM_SPEECH = Object.freeze({
${body}
});
`);
console.log(`sync-film-speech: ${Object.keys(out).length} films${missing.length ? `; missing ${missing.join(", ")}` : ""}`);
if (missing.length) process.exit(1);
