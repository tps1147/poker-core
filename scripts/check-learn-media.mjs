// Is every film a poker-core/learn media json names actually on the CDN? (mobile-lessons-v2 SPEC 3.3)
//
// HEAD-checks each media json's landscape films and posters (`videoByArea`, the default `video` and
// `poster`), its portrait cut (`portraitByArea`) and its `captions` against
// https://d1hqwog3kp9rf1.cloudfront.net/media<path>, prints a table and exits 1 on any failure.
// Network only: it is not part of `npm test`.
//
//   node scripts/check-learn-media.mjs                read-only (the default)
//   node scripts/check-learn-media.mjs --fix          also removes `portraitByArea` and `portraitFrame`
//                                                     from a json whose portrait set is incomplete
//   node scripts/check-learn-media.mjs outs-workspace-v1.v2.json …   only these files
//   --cdn <origin>   another CDN origin (or LEARN_MEDIA_CDN), no trailing `/media`
//
// The portrait rule: a json carries portraitByArea and portraitFrame only when every area's portrait
// `video` and `poster` return 200. `--fix` is a local file edit (line endings and 2-space layout
// kept); it never uploads anything. A portrait failure that `--fix` removed no longer fails the run;
// a landscape, poster or captions failure always does.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MEDIA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "learn", "media");
const DEFAULT_CDN = "https://d1hqwog3kp9rf1.cloudfront.net";
const CONCURRENCY = 8;
const TIMEOUT_MS = 15000;

function parseArgs(argv) {
  const out = { fix: false, cdn: process.env.LEARN_MEDIA_CDN || DEFAULT_CDN, files: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--fix") out.fix = true;
    else if (arg === "--cdn") out.cdn = argv[++i];
    else if (arg.startsWith("--cdn=")) out.cdn = arg.slice(6);
    else if (arg === "--help" || arg === "-h") out.help = true;
    else out.files.push(arg.replace(/^.*[\\/]/, ""));
  }
  out.cdn = String(out.cdn || "").trim().replace(/\/+$/, "").replace(/\/media$/, "");
  return out;
}

// Every url a client may load from one media json, grouped the way the table reports them.
export function mediaUrls(media) {
  const urls = [];
  const add = (group, area, field, path) => { if (typeof path === "string" && path) urls.push({ group, area, field, path }); };
  add("landscape", "default", "video", media.video);
  add("poster", "default", "poster", media.poster);
  add("captions", "default", "captions", media.captions);
  for (const [area, film] of Object.entries(media.videoByArea || {})) {
    add("landscape", area, "video", film?.video);
    add("landscape", area, "poster", film?.poster);
  }
  for (const [area, film] of Object.entries(media.portraitByArea || {})) {
    add("portrait", area, "video", film?.video);
    add("portrait", area, "poster", film?.poster);
  }
  return urls;
}

// A portrait set is complete when it covers every landscape area with a video and a poster, and the
// json carries the frame the portrait cut was composed in.
export function portraitGaps(media) {
  if (!media.portraitByArea && !media.portraitFrame) return [];
  const gaps = [];
  if (!media.portraitByArea) gaps.push("portraitFrame without portraitByArea");
  if (!media.portraitFrame) gaps.push("portraitByArea without portraitFrame");
  for (const area of Object.keys(media.videoByArea || {})) {
    const film = media.portraitByArea?.[area];
    if (media.portraitByArea && (!film?.video || !film?.poster)) gaps.push(`no portrait for ${area}`);
  }
  return gaps;
}

const resolve = (cdn, path) => (/^https?:\/\//i.test(path) ? path : `${cdn}/media${path.startsWith("/") ? "" : "/"}${path}`);

async function head(url) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });
      return { status: response.status, ok: response.status === 200 };
    } catch (error) {
      if (attempt === 2) return { status: error?.name === "TimeoutError" ? "timeout" : "error", ok: false };
    }
  }
  return { status: "error", ok: false };
}

async function checkAll(jobs) {
  const cache = new Map();
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      if (!cache.has(job.url)) cache.set(job.url, head(job.url));
      Object.assign(job, await cache.get(job.url));
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
  return jobs;
}

function writeJson(file, text, media) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  writeFileSync(file, JSON.stringify(media, null, 2).replace(/\n/g, eol) + eol);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("node scripts/check-learn-media.mjs [--fix] [--cdn <origin>] [file.json …]");
    return 0;
  }
  const all = readdirSync(MEDIA_DIR).filter((name) => name.endsWith(".json")).sort();
  const names = args.files.length ? args.files : all;
  const unknown = names.filter((name) => !all.includes(name));
  if (unknown.length) {
    console.error(`Not in src/learn/media: ${unknown.join(", ")}`);
    return 1;
  }

  const files = names.map((name) => {
    const file = join(MEDIA_DIR, name);
    const text = readFileSync(file, "utf8");
    return { name, file, text, media: JSON.parse(text) };
  });
  const jobs = files.flatMap((entry) => mediaUrls(entry.media).map((item) => ({ ...item, name: entry.name, url: resolve(args.cdn, item.path) })));
  console.log(`Checking ${jobs.length} urls in ${files.length} media json against ${args.cdn}/media …\n`);
  await checkAll(jobs);

  const rows = [];
  const failures = [];
  let failed = false;
  for (const entry of files) {
    const mine = jobs.filter((job) => job.name === entry.name);
    const count = (group) => {
      const list = mine.filter((job) => job.group === group);
      return list.length ? `${list.filter((job) => job.ok).length}/${list.length}` : "-";
    };
    const bad = mine.filter((job) => !job.ok);
    const portraitBad = bad.filter((job) => job.group === "portrait");
    const otherBad = bad.filter((job) => job.group !== "portrait");
    const gaps = portraitGaps(entry.media);
    const hasPortrait = !!(entry.media.portraitByArea || entry.media.portraitFrame);
    const portraitIncomplete = hasPortrait && (portraitBad.length > 0 || gaps.length > 0);
    let portrait = hasPortrait ? (portraitIncomplete ? "INCOMPLETE" : "complete") : "none";
    if (portraitIncomplete && args.fix) {
      delete entry.media.portraitByArea;
      delete entry.media.portraitFrame;
      writeJson(entry.file, entry.text, entry.media);
      portrait = "stripped";
    }
    if (otherBad.length || (portraitIncomplete && !args.fix)) failed = true;
    rows.push([entry.name, count("landscape"), count("poster"), count("captions"), count("portrait"), portrait]);
    for (const job of bad) failures.push(`${entry.name}  ${job.group} ${job.area} ${job.field}  ${job.status}  ${job.path}`);
    for (const gap of gaps) failures.push(`${entry.name}  portrait  ${gap}`);
  }

  const header = ["media json", "landscape", "poster", "captions", "portrait", "portrait set"];
  const widths = header.map((title, i) => Math.max(title.length, ...rows.map((row) => String(row[i]).length)));
  const line = (row) => row.map((cell, i) => String(cell).padEnd(widths[i])).join("  ");
  console.log(line(header));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));
  for (const row of rows) console.log(line(row));
  if (failures.length) {
    console.log(`\n${failures.length} problem${failures.length === 1 ? "" : "s"}:`);
    for (const failure of failures) console.log(`  ${failure}`);
  }
  const stripped = rows.filter((row) => row[5] === "stripped").map((row) => row[0]);
  if (stripped.length) console.log(`\nRemoved portraitByArea and portraitFrame from: ${stripped.join(", ")}`);
  console.log(failed ? "\nFAIL" : "\nOK");
  return failed ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(resolvePath(process.argv[1])).href === import.meta.url) {
  main().then((code) => { process.exitCode = code; }, (error) => { console.error(error); process.exitCode = 1; });
}
