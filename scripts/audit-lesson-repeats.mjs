// THE REPEAT AUDIT: every academy lesson (the 59 film-first definitions), every pair of asking
// stages (the film's question, the why, guided, practice, fresh) that repeats a spot, the film's
// numbers or a prompt (scripts/lib/stageRepeats.mjs says how). Exit 1 when any lesson repeats.
//
//   node scripts/audit-lesson-repeats.mjs [--all]   (--all also prints the closest prompt pair per lesson)
import * as learn from "../src/learn/index.mjs";
import { askingStages, lessonRepeats, promptSimilarity } from "./lib/stageRepeats.mjs";

const ALL = [...learn.FILM_FIRST_LESSONS, ...learn.ACADEMY_V2_EARLY_LESSONS, ...learn.ACADEMY_V2_LATER_LESSONS];
const verbose = process.argv.includes("--all");
let bad = 0;
for (const definition of ALL) {
  const node = learn.nodeOfLesson(definition.id)?.id || definition.id;
  const repeats = lessonRepeats(definition);
  if (repeats.length) {
    bad += 1;
    console.log(`${node} (v${definition.version})`);
    for (const r of repeats) console.log(`  ${r.a} = ${r.b}: ${r.why}`);
  } else if (verbose) {
    const stages = askingStages(definition);
    let best = { s: 0 };
    for (let i = 0; i < stages.length; i += 1) for (let j = i + 1; j < stages.length; j += 1) {
      const s = promptSimilarity(stages[i].prompt, stages[j].prompt);
      if (s > best.s) best = { s, a: stages[i].id, b: stages[j].id };
    }
    console.log(`${node}: clean (closest prompts ${best.a} / ${best.b} ${best.s.toFixed(2)})`);
  }
}
console.log(`${bad} of ${ALL.length} lessons repeat a step.`);
process.exit(bad ? 1 : 0);
