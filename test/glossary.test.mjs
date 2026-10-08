// The glossary and the prerequisite lint over the v2 films' captions.
//   node test/glossary.test.mjs
// The captions live in the film work folder (src-academy-<film id>-v2/timing.json, captions[].text),
// outside this repo. Set ACADEMY_FILMS_DIR to point at it; when it is missing the caption lint is
// skipped with a message and only the glossary's own checks run.
//
// The lint REPORTS caption hits; it does not fix captions (those belong to the film pass). The hits
// found on 2026-10-08 are listed in KNOWN_PREREQ_HITS: the test fails on any hit not on the list,
// and on a listed hit that no longer occurs (so the list shrinks as captions are fixed).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GLOSSARY, glossaryTerm, termsIn, lintableCaptions, prereqHits, synonymHits } from "../src/learn/glossary.mjs";
import { NODES, filmFolderOfNode } from "../src/learn/index.mjs";

let checks = 0;
const check = (name, fn) => { fn(); checks += 1; };
const FILMS = process.env.ACADEMY_FILMS_DIR || "C:/Users/tps11/Documents/Codex/2026-10-05/task-5/claude-motion-draft-2026-10-06";

// lesson node -> terms its captions use before the node that introduces them.
const KNOWN_PREREQ_HITS = Object.freeze({
  "w-what-is-poker": ["best five", "straight"],
  "w-luck-and-skill": ["all-in", "straight", "river", "flush"],
  "w-how-deep": ["suited", "offsuit", "flop", "the turn", "river", "preflop", "button", "big blind", "all-in"],
  "r-the-deck": ["straight", "showdown", "flush"],
  "r-seats-blinds": ["flop", "street"],
  "r-actions": ["flop"],
  "m-rule-2-4": ["price"],
  "m-equity": ["range"],
  "m-pot-odds": ["range", "break-even"],
  "m-ev": ["range"],
  "m-implied-odds": ["break-even"],
  "p-starting-hands": ["range"],
  "p-open-raise": ["range"],
  "f-cbet": ["bluff"],
  "f-bet-sizing": ["bluff"],
  "x-fold-equity": ["bluff"],
});

check("every term names a real node; terms and forms are unique", () => {
  const ids = new Set(NODES.map((n) => n.id));
  for (const e of GLOSSARY) {
    assert.ok(ids.has(e.node), `${e.term}: ${e.node}`);
    assert.ok(e.forms.length > 0, e.term);
  }
  assert.equal(new Set(GLOSSARY.map((e) => e.term)).size, GLOSSARY.length);
  const forms = GLOSSARY.flatMap((e) => e.forms.map((f) => f.toLowerCase()));
  assert.equal(new Set(forms).size, forms.length, "no form belongs to two terms");
  assert.equal(glossaryTerm("price").node, "m-pot-odds");
  assert.equal(glossaryTerm("nope"), null);
});

check("termsIn matches whole words and phrases, case rules for acronyms", () => {
  assert.deepEqual(termsIn("Your price is 25%.").map((x) => x.term), ["price"]);
  assert.deepEqual(termsIn("No priceless moments.").map((x) => x.term), []);
  assert.deepEqual(termsIn("Count the  outs.").map((x) => x.form), ["outs"]);
  assert.deepEqual(termsIn("Go all-in now").map((x) => x.term), ["all-in"]);
  assert.deepEqual(termsIn("The SPR is 4").map((x) => x.term), ["SPR"]);
  assert.deepEqual(termsIn("spring").map((x) => x.term), []);
  assert.deepEqual(termsIn("Then check-raise").map((x) => x.term), ["check-raise"]);
  assert.ok(termsIn("A flush draw").some((x) => x.term === "flush draw"));
});

check("prereqHits flags later terms only, and skips the end card", () => {
  const caps = [
    { at: "a", start: 0, text: "Count your outs." },
    { at: "b", start: 3, text: "Against their range, your equity is 40%." },
    { at: "upNext", start: 9, text: "Up next: ranges." },
    { at: "c", start: 10, text: "Now bluff them." },
  ];
  assert.deepEqual(lintableCaptions(caps).map((c) => c.at), ["a", "b"]);
  assert.deepEqual(prereqHits("m-equity", caps).map((h) => [h.term, h.introducedAt]), [["range", "f-ranges"]]);
  assert.deepEqual(prereqHits("f-ranges", caps), [], "a term at its own node is fine");
  assert.deepEqual(prereqHits("m-chance-as-share", caps).map((h) => h.term), ["outs", "equity", "range"]);
  assert.deepEqual(prereqHits("nope", caps), []);
  assert.deepEqual(synonymHits("m-ev", [{ start: 0, text: "They shove 40 into 150." }]).map((h) => h.synonym), ["shove"]);
});

if (!existsSync(FILMS)) {
  console.log(`glossary: the film folder is missing (${FILMS}); set ACADEMY_FILMS_DIR to lint captions. Caption lint SKIPPED.`);
} else {
  check("the prerequisite lint over every lesson's captions", () => {
    const found = {};
    const detail = [];
    const synonyms = [];
    const missing = [];
    for (const node of NODES) {
      const file = join(FILMS, `src-academy-${filmFolderOfNode(node.id)}-v2`, "timing.json");
      if (!existsSync(file)) { missing.push(node.id); continue; }
      const captions = JSON.parse(readFileSync(file, "utf8")).captions || [];
      for (const h of prereqHits(node.id, captions)) {
        (found[h.lesson] ||= new Set()).add(h.term);
        detail.push(`${h.lesson}: "${h.form}" (taught at ${h.introducedAt}) in "${h.caption}"`);
      }
      synonyms.push(...synonymHits(node.id, captions).map((h) => `${h.lesson}: "${h.synonym}" for "${h.term}" in "${h.caption}"`));
    }
    const unexpected = [];
    for (const [lesson, terms] of Object.entries(found)) for (const term of terms) if (!KNOWN_PREREQ_HITS[lesson]?.includes(term)) unexpected.push(`${lesson} ${term}`);
    const stale = [];
    for (const [lesson, terms] of Object.entries(KNOWN_PREREQ_HITS)) for (const term of terms) if (!found[lesson]?.has(term)) stale.push(`${lesson} ${term}`);
    const pairs = Object.values(found).reduce((s, set) => s + set.size, 0);
    console.log(`glossary: prereq lint read ${NODES.length - missing.length} films${missing.length ? ` (missing: ${missing.join(", ")})` : ""}; ${pairs} lesson/term hits, ${detail.length} captions:`);
    for (const line of detail) console.log(`  prereq  ${line}`);
    for (const line of synonyms) console.log(`  synonym ${line}`);
    assert.deepEqual(unexpected, [], `captions use a term taught at a later node:\n${unexpected.join("\n")}`);
    assert.deepEqual(stale, [], `listed hits no longer occur; remove them from KNOWN_PREREQ_HITS:\n${stale.join("\n")}`);
  });
}

console.log(`glossary checks passed (${checks}), ${GLOSSARY.length} terms`);
