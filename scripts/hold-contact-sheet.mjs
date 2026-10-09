// THE HELD-FRAME CONTACT SHEET: every lesson film that asks (or hands off), at the frame filmV2
// filmAskPlan holds (holdFrameAt), cut from the published 1080 render, with the region the "Your
// turn" card covers marked (cardPlacement: the card's band over the bottom or the top of the frame;
// none for a handoff). One labelled tile per film: node, held time, mode, placement. For reading by
// eye after scripts/sync-film-speech.mjs.
//
//   node scripts/hold-contact-sheet.mjs <out.jpg> [workDir]   (needs ffmpeg; Windows font for labels)
import { mkdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import * as learn from "../src/learn/index.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node scripts/hold-contact-sheet.mjs <out.jpg> [workDir]"); process.exit(1); }
const work = process.argv[3] || process.env.FILMS_V2_WORK || "C:/Users/tps11/Documents/Codex/2026-10-05/task-5/claude-motion-draft-2026-10-06";
const root = join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const W = 216; const H = 384; const COLS = 8;
// The card's band over the frame, as shares of its height (scripts/sync-film-speech.mjs REGIONS).
const BAND = { top: [0.07, 0.5], bottom: [0.52, 0.95] };
const FONT = "C\\:/Windows/Fonts/arial.ttf";

const ALL = [...learn.FILM_FIRST_LESSONS, ...learn.ACADEMY_V2_EARLY_LESSONS, ...learn.ACADEMY_V2_LATER_LESSONS];
const tiles = join(tmpdir(), `hold-sheet-${process.pid}`);
rmSync(tiles, { recursive: true, force: true });
mkdirSync(tiles, { recursive: true });
let n = 0;
const rows = [];
for (const definition of ALL) {
  const node = learn.nodeOfLesson(definition.id)?.id || definition.id;
  const media = JSON.parse(readFileSync(join(root, "src", "learn", "media", `${node}.v3.json`), "utf8"));
  const plan = learn.filmAskPlan(definition.stages.find((s) => s.kind === "film"), media);
  if (plan.mode === "none") continue;
  const video = join(work, "publish", "films-v2", node, String(media.version), `${node}-1080.mp4`);
  if (!existsSync(video)) { console.error(`no ${video}`); continue; }
  const filters = [`scale=${W}:${H}`];
  if (plan.cardPlacement) {
    const [a, b] = BAND[plan.cardPlacement];
    const y = Math.round(a * H); const h = Math.round((b - a) * H);
    filters.push(`drawbox=x=4:y=${y}:w=${W - 8}:h=${h}:color=yellow@0.18:t=fill`, `drawbox=x=4:y=${y}:w=${W - 8}:h=${h}:color=yellow@0.95:t=2`);
  }
  const label = `${node}  ${plan.holdFrameAt.toFixed(2)}s  ${plan.mode}${plan.cardPlacement ? ` ${plan.cardPlacement}` : ""}`.replace(/:/g, " ");
  filters.push(`drawtext=fontfile='${FONT}':text='${label}':x=4:y=${H - 16}:fontsize=11:fontcolor=white:box=1:boxcolor=black@0.75:boxborderw=3`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(plan.holdFrameAt), "-i", video, "-frames:v", "1", "-vf", filters.join(","), join(tiles, `${String(n).padStart(3, "0")}.png`)]);
  rows.push({ node, mode: plan.mode, holdFrameAt: plan.holdFrameAt, askAt: plan.askAt, cardPlacement: plan.cardPlacement });
  n += 1;
}
const R = Math.ceil(n / COLS);
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "1", "-i", join(tiles, "%03d.png"), "-vf", `tile=${COLS}x${R}:padding=4:color=0x10151c`, "-frames:v", "1", "-q:v", "3", out]);
rmSync(tiles, { recursive: true, force: true });
console.log(`hold-contact-sheet: ${n} films -> ${out}`);
for (const r of rows) console.log(`${r.node.padEnd(22)} ${r.mode.padEnd(8)} hold ${r.holdFrameAt.toFixed(3)} ask ${r.askAt.toFixed(3)} ${r.cardPlacement || "-"}`);
