// THE 2026-10-09 ACADEMY AUDIT's regressions, pinned:
//   - a recap row keeps a choice's own capitals ("A♦ Q♦", "Q-9", "Ace Andy"), lower-casing only a
//     plain first word ("About 16%" -> "about 16%");
//   - a count over 99 (chips) steps by its `step`, and every key sits on that step, so the stepper
//     reaches the answer without hundreds of taps;
//   - a dock prompt never repeats the spot's own title (one heading on screen, not two).
//   node test/academyAudit.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as learn from "../src/learn/index.mjs";

const ALL = [...learn.FILM_FIRST_LESSONS, ...learn.ACADEMY_V2_EARLY_LESSONS, ...learn.ACADEMY_V2_LATER_LESSONS];
let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (error) { console.error(`FAIL ${name}`); throw error; } };

check("inSentence keeps cards, names and capitals", () => {
  assert.equal(learn.inSentence("A♦ Q♦: the ace-high flush"), "A♦ Q♦: the ace-high flush");
  assert.equal(learn.inSentence("Q-9: a queen-high straight"), "Q-9: a queen-high straight");
  assert.equal(learn.inSentence("Ace Andy, without showing"), "Ace Andy, without showing");
  assert.equal(learn.inSentence("LAG"), "LAG");
  assert.equal(learn.inSentence("About 16%"), "about 16%");
  assert.equal(learn.inSentence("Small bet 40"), "small bet 40");
});

check("recap rows keep the band's capitals", () => {
  const nuts = learn.academyLesson("b-the-nuts");
  const answers = { "nu-practice": { correct: true, response: { band: "aq" } } };
  const rows = learn.recapRows(nuts, { history: [{ spotId: "nu-practice", correct: true }], answers });
  const practice = rows.find((row) => row.key === "nu-practice");
  assert.ok(practice.facts.includes("A♦ Q♦: the ace-high flush"), practice.facts.join(" | "));
});

const keyFile = (node) => path.resolve(import.meta.dirname, "..", "answerKeys", `${node}.mjs`);
for (const definition of ALL) {
  const node = learn.nodeOfLesson(definition.id)?.id || definition.id;
  const film = definition.stages.find((stage) => stage.kind === "film");
  const spots = [...Object.entries(definition.spots), ...(film?.pause?.spot ? [[film.pause.spotId, film.pause.spot]] : [])];
  check(`${node}: big counts step, one heading`, () => {
    for (const [id, spot] of spots) {
      if (spot.title && spot.dockPrompt) assert.notEqual(spot.dockPrompt.trim().toLowerCase(), spot.title.trim().toLowerCase(), `${node} ${id}: the dock prompt repeats the title`);
      if (spot.decision === "count" && Array.isArray(spot.range) && spot.range[1] > 100) assert.ok(spot.step > 1, `${node} ${id}: a count to ${spot.range[1]} needs a step`);
    }
  });
  if (fs.existsSync(keyFile(node))) {
    const key = (await import(pathToFileURL(keyFile(node)).href)).default;
    const keyed = { ...(key.spots || {}), ...(key.film?.spotId ? { [key.film.spotId]: key.film } : {}) };
    check(`${node}: count keys sit on their step`, () => {
      for (const [id, spot] of spots) {
        const value = keyed[id]?.key?.value;
        if (spot.decision === "count" && spot.step > 1 && value != null) assert.equal((value - spot.range[0]) % spot.step, 0, `${node} ${id}: ${value} is off the ${spot.step} step`);
      }
    });
  }
}
console.log(`academyAudit ok (${checks} checks)`);
