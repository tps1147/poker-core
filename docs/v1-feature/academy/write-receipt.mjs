// Writes docs/v1-feature/academy/receipt.json: hashes of the academy draft in this worktree and of the
// sample-lesson draft in the M1 scratch folder.   node docs/v1-feature/academy/write-receipt.mjs
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const W = "C:/Code/Programming/flop52/.dev-servers/claude-v1-core-2026-10-06";
const D = "C:/Users/tps11/Documents/Codex/2026-10-05/task-5/claude-motion-draft-2026-10-06";
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const list = (root, items) => items.flatMap((d) => { const p = join(root, d); return !existsSync(p) ? [] : statSync(p).isDirectory() ? walk(p) : [p]; })
  .map((p) => ({ path: relative(root, p).replace(/\\/g, "/"), bytes: statSync(p).size, sha256: sha(p) }))
  .filter((f) => f.path !== "docs/v1-feature/academy/receipt.json");

const receipt = {
  milestone: "Academy structure draft 0 (feeds M3)", recordedAt: new Date().toISOString(),
  decision: { file: "decisions/DECISION-RECEIPT-2026-10-06-b.json", sha256: sha(join(D, "decisions/DECISION-RECEIPT-2026-10-06-b.json")) },
  contract: { id: "F52-V1-CONTRACT-1", sha256: sha("C:/Code/Programming/flop52/docs/V1-SHARED-INTERFACES-2026-10-06.md") },
  checkout: { path: W, head: "6382201ae2d0ea965cd8c1d2cda72225d08466c8",
    boundary: "verify-claude-boundary.py passed (114 protected tracked files unchanged); git diff --check exit 0; git status shows only docs/v1-feature/, src/learn/v1/, test/v1/ untracked" },
  tree: { module: "src/learn/v1/academyTree.mjs", version: "academy-tree-draft-0", nodes: 59, tracks: 11,
    test: "node test/v1/learn/academyTree.test.mjs: 10 checks passed",
    coverage: "All 20 existing shared lessons and all 28 existing concept ids are mapped; prerequisites are acyclic and point only to the same or earlier tracks" },
  reviewPage: { artifact: "https://claude.ai/artifact/RqKjBJhgFateZQ4DW7NoYY", source: "docs/v1-feature/academy/academy-tree.html, built by build-tree-page.mjs from the module" },
  sampleLesson: {
    plan: "docs/v1-feature/academy/SAMPLE-LESSON-w-what-is-poker.md", format: "docs/v1-feature/academy/LESSON-PLAN-FORMAT.md",
    composition: "academy-w-what-is-poker-v0", design: "1080x1920", output: "360x640", fps: 30, frames: 1800, seconds: 60, audio: "none",
    ffprobe: "h264 video 360x640 30/1, 1800 frames, 60.000 s, no audio stream",
    visualSources: "Values transcribed from flop52web table-base.css, board.css, ShowcaseCard.js, surface-palette.css and table-theme.css. Fonts: Poker.com Archivo-Variable.ttf and a Geist variable woff2 from flop52web's .next dev media (a regenerated build file). Icon: flop52web public/icons-3d/chip.png. All copied into scratch public/academy-w1; nothing downloaded.",
    handCheck: "K-high straight beats a pair of jacks, verified with src/eval/pokerEvaluator.js. Pots 15/20/60/140 follow captions.json potNotes.",
    rejected: [
      "A module-level font hold stalled the full render twice (timeouts at frames 375 and 413). Replaced with CSS @font-face, which the renderer waits on after every seek.",
      "Hook: the lifted K and Q overlapped the title; the fan was moved down.",
      "Predict button text overflowed, and the hero cards covered the nameplate; both fixed.",
    ],
  },
  renderWindow: "Codex paused per the transfer; no other render or build process was seen. Markers in logs/render-academy-w1-*.",
  observation: "During probe renders, Edge's own updater left two 24 KB BITS temp folders in scratch tmp/ (msedgeedge_BITS_*). Remotion never downloaded a browser (onBrowserDownload throws). The folders were deleted.",
  model: "claude-opus-5-5[1m] (this session)", runtime: `Node ${process.version}, Remotion 4.0.484 (read only), Edge 154.0.4258.53 headless-shell`,
  notValidated: ["Tree content not reviewed by a poker educator", "History facts for w-history not yet sourced", "No device playback or full-resolution render", "No learning-effect claim", "One sample lesson; no batch produced"],
  worktreeFiles: list(W, ["docs/v1-feature/academy", "src/learn/v1", "test/v1/learn"]),
  scratchFiles: list(D, ["src-academy-w1", "out-academy-w1", "public/academy-w1", "tools/render-academy-w1.mjs", "decisions/DECISION-RECEIPT-2026-10-06-b.json"]),
};
writeFileSync(join(W, "docs/v1-feature/academy/receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
console.log(`receipt: ${receipt.worktreeFiles.length} worktree files, ${receipt.scratchFiles.length} scratch files`);
