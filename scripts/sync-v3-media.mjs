// Copy every published academy-film-v2 media file (publish/films-v2/<id>/<id>.v3.json) into
// src/learn/media/<id>.v3.json, byte for byte, as f99fe0e did for the first three. Clients import
// them by path (poker-core/learn/media/<id>.v3.json); nothing else registers them.
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
import { filmIdOfNode, openerIdOfTrack } from "../src/learn/filmV2.mjs";

const DEFAULT = "C:/Users/tps11/Documents/Codex/2026-10-05/task-5/claude-motion-draft-2026-10-06/publish/films-v2";
const from = process.argv[2] || process.env.FILMS_V2_PUBLISH || DEFAULT;
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
  const bytes = readFileSync(src);
  try {
    const json = JSON.parse(bytes.toString("utf8"));
    if (json.format !== "academy-film-v2" || json.id !== id) { bad.push(`${id} (format ${json.format}, id ${json.id})`); continue; }
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
if (extra.length) console.log(`  published but not a node film or opener ${extra.length}: ${extra.join(", ")}`);
console.log(`  missing ${missing.length} of ${expected.length}${missing.length ? `: ${missing.join(", ")}` : ""}`);
process.exit(missing.length || bad.length ? 1 : 0);
