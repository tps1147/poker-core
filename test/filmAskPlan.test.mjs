// THE ASK RULE over every lesson film (2026-10-08, Tyler: "the questions when asked at the end of the
// videos break the video timing"). For all 59 film-first definitions, filmAskPlan against the film's
// own measured speech and picture (filmSpeech.mjs):
//   - the measurements are current for the published media (same version)
//   - askAt falls at or after the end of the last word of its cue, and never inside spoken words
//   - askAt comes before upNext (and before a spoken "Up next" line)
//   - the held frame is still (never a frame of a wipe or a reveal in motion), at or before askAt
//   - "pause" resumes into the reveal from the held frame; "end" and "handoff" never resume
//   - every end film here asked and answered its own question already: it hands off (no ask)
//   - the held frame is the settled one measured on the 1080 render (FILM_SPEECH hold): still,
//     after the last word, before the next word and caption; the card's placement is measured too
//   - one ask per watch, played through with askGate at a player's poll steps; a resume never
//     re-asks; a user seek back before the ask re-arms it on a first watch; a replay never asks
//   node test/filmAskPlan.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as learn from "../src/learn/index.mjs";
import { FILM_SPEECH } from "../src/learn/filmSpeech.mjs";

const {
  FILM_FIRST_LESSONS, ACADEMY_V2_EARLY_LESSONS, ACADEMY_V2_LATER_LESSONS, nodeOfLesson, canon,
  filmAskPlan, askGate, askEntry, filmSpeech, QUESTION_CUES, ASK_LOOKAHEAD, filmOwnPause, askBasis, HOLD_SLACK, filmTurnPlan,
} = learn;

const ALL = [...FILM_FIRST_LESSONS, ...ACADEMY_V2_EARLY_LESSONS, ...ACADEMY_V2_LATER_LESSONS];
const mediaOf = (id) => JSON.parse(readFileSync(new URL(`../src/learn/media/${id}.v3.json`, import.meta.url), "utf8"));
const FILMS = ALL.map((definition) => {
  const node = nodeOfLesson(definition.id)?.id || definition.id;
  const media = mediaOf(node);
  const stage = definition.stages.find((s) => s.kind === "film");
  return { definition, node, media, stage, plan: filmAskPlan(stage, media), timing: FILM_SPEECH[node] };
});

let checks = 0;
const check = (name, fn) => {
  try { fn(); checks += 1; } catch (error) { console.error(`FAIL ${name}`); throw error; }
};

// The end of the spoken span holding a cue's last word (the test's own reading of the data).
const wordEnd = (timing, cue) => {
  const row = timing.cues.find(([s]) => Math.abs(s - cue.start) < 0.005);
  const onset = row[2];
  const span = timing.speech.find(([s, e]) => s <= onset + 0.05 && e > onset) || timing.speech.find(([s]) => s >= onset - 0.05);
  return Math.max(span[1], onset);
};
const inSpeech = (timing, t) => timing.speech.some(([s, e]) => t > s + 1e-6 && t < e - 1e-6);
const moving = (timing, t) => timing.motion.some(([a, b]) => t > a + 0.001 && t <= b + 0.001);

check("59 films, each measured for its published version", () => {
  assert.equal(FILMS.length, 59);
  assert.equal(new Set(FILMS.map((f) => f.node)).size, 59);
  for (const f of FILMS) {
    assert.ok(f.timing, `${f.node} measured`);
    assert.equal(f.timing.version, f.media.version, `${f.node}: filmSpeech.mjs is stale, rerun scripts/sync-film-speech.mjs`);
    assert.equal(filmSpeech(f.media), f.timing);
  }
});

check("modes: 31 ask mid-film, 25 hand off at the end, 3 never ask", () => {
  const by = (mode) => FILMS.filter((f) => f.plan.mode === mode).map((f) => f.node);
  assert.equal(by("pause").length, 31);
  assert.equal(by("end").length, 0, "no end film re-asks the question it already answered");
  assert.equal(by("handoff").length, 25);
  for (const f of FILMS.filter((x) => x.plan.mode === "handoff")) {
    assert.equal(filmOwnPause(f.stage, f.media.id).endAsk, "skip", f.node);
    assert.equal(f.plan.cardPlacement, null, `${f.node}: nothing asked, no card`);
    assert.equal(filmTurnPlan(f.stage, f.media).at, null);
  }
  // The "end" mode still asks for a definition whose end spot is a transfer (or that predates endAsk).
  const end = FILMS.find((x) => x.plan.mode === "handoff");
  const variant = { ...end.stage, pause: { ...end.stage.pause, endAsk: "variant" } };
  assert.equal(filmAskPlan(variant, end.media).mode, "end");
  assert.equal(filmAskPlan(variant, end.media).cardPlacement, "bottom");
  assert.deepEqual(by("none").sort(), ["r-actions", "r-hand-rankings", "x-bluffing"], "the three v1-built lessons carry no v2 pause");
  for (const f of FILMS) {
    const own = filmOwnPause(f.stage, f.media.id);
    if (own?.anchor === "end") assert.equal(f.plan.mode, own.endAsk === "skip" ? "handoff" : "end", f.node);
    if (f.plan.mode === "pause") assert.ok(canon(f.media).anchors.yourTurn != null, `${f.node} has a yourTurn beat`);
  }
});

check("askAt is after the cue's last word, never inside a spoken word", () => {
  for (const f of FILMS.filter((x) => x.plan.mode !== "none")) {
    const { askAt, cue } = f.plan;
    assert.ok(cue, `${f.node} names its cue`);
    const end = wordEnd(f.timing, cue);
    assert.ok(askAt >= end - 1e-6, `${f.node}: askAt ${askAt} before the last word ends at ${end}`);
    assert.ok(!inSpeech(f.timing, askAt), `${f.node}: askAt ${askAt} is inside speech`);
    // No word starts between the cue's end-of-speech and the ask.
    assert.ok(!f.timing.speech.some(([s]) => s > end + 1e-6 && s <= askAt), `${f.node}: a word starts before the ask`);
    // The captions are burned in: the held frame never shows the next line's caption.
    const next = f.timing.cues[f.timing.cues.findIndex(([s]) => s === cue.start) + 1];
    if (next && end < next[0]) assert.ok(askAt < next[0] && f.plan.holdFrameAt < next[0], `${f.node}: ${askAt} shows the next caption (${next[0]})`);
  }
});

check("askAt comes before upNext, and before a spoken Up next line", () => {
  for (const f of FILMS.filter((x) => x.plan.mode !== "none")) {
    const c = canon(f.media);
    assert.ok(f.plan.askAt < c.anchors.upNext, `${f.node}: ${f.plan.askAt} >= upNext ${c.anchors.upNext}`);
    if (f.timing.upNextLine != null) assert.ok(f.plan.askAt < f.timing.upNextLine, `${f.node}: asks after "Up next" starts`);
    if (f.plan.mode === "pause") assert.ok(f.plan.askAt > c.anchors.yourTurn, `${f.node}: asks after its beat starts`);
  }
});

check("the end ask follows the last line before upNext; the mid-film ask follows its question", () => {
  for (const f of FILMS.filter((x) => x.plan.mode === "end" || x.plan.mode === "handoff")) {
    const c = canon(f.media);
    const stop = Math.min(c.anchors.upNext, f.timing.upNextLine ?? Infinity);
    const before = f.timing.cues.filter(([s]) => s < stop - 0.05);
    assert.equal(f.plan.cue.start, before.at(-1)[0], `${f.node}: the last line before the up-next`);
    assert.equal(f.plan.resumeTo, null, `${f.node}: an end ask never resumes the film`);
  }
  for (const f of FILMS.filter((x) => x.plan.mode === "pause")) {
    const row = f.timing.cues.find(([s]) => s === f.plan.cue.start);
    const named = QUESTION_CUES[f.node];
    assert.ok(row[3] === 1 || named || row[0] <= canon(f.media).anchors.yourTurn + 0.05 || f.timing.cues[f.timing.cues.indexOf(row) - 1][4] === 1,
      `${f.node}: the cue asks, is named, is the beat's own, or finishes its sentence`);
    assert.equal(f.plan.resumeTo, f.plan.holdFrameAt, `${f.node}: resumes from the held frame`);
  }
  for (const [id, named] of Object.entries(QUESTION_CUES)) {
    assert.ok(FILM_SPEECH[id].cues.some(([s]) => s === named.at), `${id}: QUESTION_CUES names ${named.at}, no longer a cue start (re-timed film?)`);
    assert.equal(FILMS.find((f) => f.node === id).plan.cue.start, named.at);
  }
});

check("the held frame is the settled one: measured, still, after the word, before the next word and caption", () => {
  for (const f of FILMS.filter((x) => x.plan.mode !== "none")) {
    const { askAt, holdFrameAt, cue } = f.plan;
    const basis = askBasis(f.stage, f.media);
    assert.ok(f.timing.hold && Math.abs(f.timing.hold[0] - cue.start) < 0.02, `${f.node}: the held frame is measured for this ask (rerun sync-film-speech)`);
    assert.equal(holdFrameAt, f.timing.hold[1]);
    assert.ok(holdFrameAt <= askAt + 1e-9, `${f.node}: the film rests on the held frame when it asks`);
    // A frame's middle: a seek there shows exactly that frame.
    assert.ok(Math.abs(holdFrameAt * 30 - Math.floor(holdFrameAt * 30) - 0.5) < 0.02, `${f.node}: ${holdFrameAt} is a frame's middle`);
    assert.ok(!moving(f.timing, holdFrameAt), `${f.node}: holds ${holdFrameAt}, a moving frame`);
    assert.ok(holdFrameAt < basis.limit + 1e-6 || holdFrameAt < basis.wordEnd, `${f.node}: before the next word, caption and stop`);
    if (f.plan.mode === "pause") {
      assert.ok(holdFrameAt >= wordEnd(f.timing, cue) - HOLD_SLACK - 1e-6, `${f.node}: a resume replays at most the last word's tail`);
      assert.ok(!f.timing.speech.some(([s]) => s > wordEnd(f.timing, cue) + 1e-6 && s <= holdFrameAt), `${f.node}: no word starts before the held frame`);
    } else assert.ok(holdFrameAt >= cue.start, `${f.node}: holds its last line's frame (the rule card)`);
    if (f.plan.mode === "handoff") assert.equal(f.plan.cardPlacement, null);
    else assert.ok(["top", "bottom"].includes(f.plan.cardPlacement) && f.plan.cardPlacement === f.timing.hold[2], f.node);
  }
  // The card turns before the pause: where a film's card comes in after the question's last word
  // (p-starting-hands, p-open-raise, p-position-value), the hold waits for it to land.
  for (const id of ["p-starting-hands", "p-open-raise", "p-position-value"]) {
    const f = FILMS.find((x) => x.node === id);
    assert.ok(f.plan.holdFrameAt > wordEnd(f.timing, f.plan.cue) + 0.25, `${id}: holds after the card lands`);
  }
});

// A player polling the playhead every `step` seconds (with jitter), timing its last step to the
// ask with gate.lead as the apps do. At the ask it holds, then resumes to resumeTo (its own seek, never
// reported to the gate) or, for an end ask, leaves for the next step.
function playThrough(plan, to, opts = {}) {
  const gate = askGate(plan);
  let prev = opts.from ?? 0; let now = prev; let asks = 0; let k = 0; const out = [];
  let rewound = false;
  while (now < to && out.length < 20) {
    k += 1;
    const lead = gate.lead(now, true);
    const step = (opts.step ?? 0.25) + ((k % 3) - 1) * (opts.jitter ?? 0.07);
    prev = now;
    now = lead != null && lead <= step ? now + lead : now + step;
    if (gate.tick(prev, now, true)) {
      asks += 1;
      out.push(now);
      if (plan.resumeTo == null) return { asks, at: out, left: true };
      now = plan.resumeTo; // the player's own seek: not reported to the gate
      if (opts.slip) now -= opts.slip; // a native seek can land early
      continue;
    }
    if (opts.rewindAfterAsk && asks === 1 && !rewound) { rewound = true; now = Math.max(0, plan.askAt - 4); gate.seek(now); }
  }
  return { asks, at: out, left: false };
}

check("one ask per watch, timed to the frame, never again after the resume", () => {
  for (const f of FILMS.filter((x) => x.plan.mode !== "none")) {
    const stop = canon(f.media).anchors.upNext;
    for (const step of [0.25, 0.1, 0.5]) {
      const run = playThrough(f.plan, stop, { step });
      assert.equal(run.asks, 1, `${f.node} at ${step}s polls: ${run.asks} asks`);
      assert.ok(Math.abs(run.at[0] - f.plan.askAt) < 1e-6, `${f.node}: asked at ${run.at[0]}, not ${f.plan.askAt}`);
      if (f.plan.mode !== "pause") assert.ok(run.left, `${f.node}: the end goes straight on`);
    }
    // A native seek that lands a hair early never re-asks.
    if (f.plan.mode === "pause") assert.equal(playThrough(f.plan, stop, { slip: 0.4 }).asks, 1, `${f.node}: re-asked after an early-landing resume`);
  }
  assert.ok(ASK_LOOKAHEAD >= 0.5, "a 250 ms poll always sees the ask coming");
});

check("a user seek back before the ask re-arms it on a first watch; a replay never asks", () => {
  for (const f of FILMS.filter((x) => x.plan.mode === "pause")) {
    const stop = canon(f.media).anchors.upNext;
    assert.equal(playThrough(f.plan, stop, { rewindAfterAsk: true }).asks, 2, `${f.node}: rewinding past the ask asks again`);
  }
  for (const f of FILMS) {
    const replay = filmAskPlan(f.stage, f.media, { replay: true });
    assert.equal(replay.mode, "none", f.node);
    assert.equal(replay.askAt, null);
    const gate = askGate(replay);
    assert.equal(gate.tick(0, canon(f.media).duration, true), false);
    gate.seek(0);
    assert.equal(gate.armed, false, `${f.node}: a replay's seek never arms an ask`);
  }
  // A jump past the ask (a seek forward) is not a crossing.
  const f = FILMS.find((x) => x.plan.mode === "pause");
  const gate = askGate(f.plan);
  assert.equal(gate.tick(f.plan.askAt - 5, f.plan.askAt + 1, true), false);
  assert.equal(gate.tick(f.plan.askAt - 0.1, f.plan.askAt + 0.1, false), false, "paused playback never asks");
  assert.equal(gate.tick(f.plan.askAt - 0.1, f.plan.askAt, true), true);
  assert.equal(gate.tick(f.plan.askAt - 0.1, f.plan.askAt, true), false, "once");
});

check("askEntry: entering at or past an unanswered ask starts at its cue", () => {
  const f = FILMS.find((x) => x.node === "m-pot-odds");
  assert.equal(askEntry(f.plan, 10), 10);
  assert.equal(askEntry(f.plan, f.plan.askAt + 3), f.plan.cue.start);
  assert.equal(askEntry(f.plan, f.plan.askAt + 3, { answered: true }), f.plan.askAt + 3);
  assert.equal(askEntry({ mode: "none" }, 50), 50);
  const end = FILMS.find((x) => x.node === "b-the-nuts");
  assert.equal(askEntry(end.plan, end.plan.askAt), end.plan.cue.start);
});

check("the reported fix: b-the-nuts hands off after its rule line, over the rule card, before the wipe", () => {
  const f = FILMS.find((x) => x.node === "b-the-nuts");
  assert.equal(f.plan.mode, "handoff");
  assert.ok(f.plan.askAt > 91 && f.plan.askAt < 91.46 - 0.2, `askAt ${f.plan.askAt}`);
  assert.ok(f.plan.holdFrameAt < 91.26, "before the flip wipe into the up-next card");
});

console.log(`filmAskPlan ok (${checks} checks): ${FILMS.filter((f) => f.plan.mode !== "none").length} asking films, one ask per watch`);
