// Copy every published academy-film-v2 media file (publish/films-v2/<id>/<id>.v3.json) into
// src/learn/media/<id>.v3.json, as f99fe0e did for the first three, with the film's words EMBEDDED:
//   cues            [{ start, end, text }] the caption cues, parsed from the published <id>.vtt in the
//                   film's version folder (else from src-academy-<source>-v2/timing.json captions)
//   transcriptText  the published <id>.transcript.txt (else the cue texts joined)
// so no client has to fetch the VTT or the transcript at run time (the CDN cached those without CORS
// headers, 2026-10-09). The captions / transcript URLs stay for a fallback. Clients import the files
// by path (poker-core/learn/media/<id>.v3.json); nothing else registers them.
//
// The expected set is every node's film (filmIdOfNode: the node id) plus every track's opener (openerIdOfTrack):
// 59 + 11 = 70. The script lists what it copied, what was already current, what is still missing
// from the publish folder, and any published id
// that is not in the expected set (copied too).
//
//   node scripts/sync-v3-media.mjs [publishDir]
//   (or set FILMS_V2_PUBLISH; default: the Codex motion-draft publish folder)
// Exits 1 when an expected film is missing.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { NODES, TRACKS } from "../src/learn/academyTree.mjs";
import { filmIdOfNode, openerIdOfTrack, parseVtt } from "../src/learn/filmV2.mjs";

const DEFAULT = "C:/Users/tps11/Documents/Codex/2026-10-05/task-5/claude-motion-draft-2026-10-06/publish/films-v2";
const from = process.argv[2] || process.env.FILMS_V2_PUBLISH || DEFAULT;
const work = join(from, "..", "..");
const r3 = (x) => Math.round(x * 1000) / 1000;
// The film's words, from its published files, else its timing.json.
function words(id, json) {
  const vdir = json.version ? join(from, id, json.version) : join(from, id);
  const vtt = join(vdir, `${id}.vtt`), txt = join(vdir, `${id}.transcript.txt`);
  let cues = existsSync(vtt) ? parseVtt(readFileSync(vtt, "utf8")) : [];
  if (!cues.length) {
    const tp = join(work, `src-academy-${json.sourceId || id}-v2`, "timing.json");
    if (existsSync(tp)) cues = (JSON.parse(readFileSync(tp, "utf8")).captions || []).map((c) => ({ start: c.start, end: c.end, text: c.text }));
  }
  cues = cues.filter((c) => Number.isFinite(c.start) && Number.isFinite(c.end) && c.text).map((c) => ({ start: r3(c.start), end: r3(c.end), text: c.text }));
  const transcriptText = existsSync(txt) ? readFileSync(txt, "utf8").replace(/\r\n?/g, "\n").trim() : cues.map((c) => c.text).join(" ");
  return { cues, transcriptText };
}
const noWords = [];

const to = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "learn", "media");

if (!existsSync(from)) {
  console.error(`sync-v3-media: no publish folder at ${from}`);
  process.exit(1);
}

const expected = [...NODES.map((n) => filmIdOfNode(n.id)), ...TRACKS.map((t) => openerIdOfTrack(t.id))];
const published = readdirSync(from, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(from, d.name, `${d.name}.v3.json`)))
  .map((d) => d.name);

const copied = [];
const current = [];
const bad = [];
for (const id of published) {
  const src = join(from, id, `${id}.v3.json`);
  let bytes;
  try {
    const json = JSON.parse(readFileSync(src, "utf8"));
    if (json.format !== "academy-film-v2" || json.id !== id) { bad.push(`${id} (format ${json.format}, id ${json.id})`); continue; }
    const w = words(id, json);
    if (!w.cues.length) noWords.push(id);
    bytes = Buffer.from(JSON.stringify({ ...json, ...w }, null, 2) + "\n");
  } catch (error) {
    bad.push(`${id} (${error.message})`);
    continue;
  }
  const dest = join(to, `${id}.v3.json`);
  if (existsSync(dest) && readFileSync(dest).equals(bytes)) { current.push(id); continue; }
  writeFileSync(dest, bytes);
  copied.push(id);
}

const have = new Set(published);
const missing = expected.filter((id) => !have.has(id));
const extra = published.filter((id) => !expected.includes(id));

console.log(`sync-v3-media: ${from}`);
console.log(`  copied ${copied.length}${copied.length ? `: ${copied.join(", ")}` : ""}`);
console.log(`  already current ${current.length}`);
if (bad.length) console.log(`  skipped (not a v3 film file) ${bad.length}: ${bad.join("; ")}`);
if (noWords.length) console.log(`  no caption cues found ${noWords.length}: ${noWords.join(", ")}`);
if (extra.length) console.log(`  published but not a node film or opener ${extra.length}: ${extra.join(", ")}`);
console.log(`  missing ${missing.length} of ${expected.length}${missing.length ? `: ${missing.join(", ")}` : ""}`);
process.exit(missing.length || bad.length || noWords.length ? 1 : 0);
