// THE NO-REPEAT RULE (2026-10-09, Tyler: "avoid repeating the same question or the exact question
// from the lesson"): in every one of the 59 lessons, no two asking stages (the film's own question,
// the why, guided, practice and fresh) share a spot signature (board, hole cards, pot, bet,
// choices), the film's numbers, or near-identical prompt text (scripts/lib/stageRepeats.mjs). The
// rule itself is checked on made-up repeats first, so a loosened rule cannot pass silently.
//   node test/lessonRepeats.test.mjs
import assert from "node:assert/strict";
import * as learn from "../src/learn/index.mjs";
import { lessonRepeats, repeatOf, askingStages, promptSimilarity, PROMPT_SIMILAR } from "../scripts/lib/stageRepeats.mjs";

const ALL = [...learn.FILM_FIRST_LESSONS, ...learn.ACADEMY_V2_EARLY_LESSONS, ...learn.ACADEMY_V2_LATER_LESSONS];
let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (error) { console.error(`FAIL ${name}`); throw error; } };

const spot = (extra) => ({ decision: "action", choices: ["fold", "call"], hero: ["Ah", "Kd"], board: ["Qs", "Jh", "4c"], potBefore: 100, bet: 50, call: 50, prompt: "Ace-king on queen, jack, four. He bets 50 into 100. Call or fold?", ...extra });
const lesson = (film, guided, practice = spot({ hero: ["7c", "6c"], board: ["9c", "8d", "2s"], potBefore: 60, bet: 20, call: 20, prompt: "Seven-six of clubs on nine, eight, two. He bets 20 into 60." })) => ({
  stages: [
    { kind: "welcome" },
    { kind: "film", pause: { spotId: "x-turn", spot: film } },
    { kind: "why", spotId: "x-why", prompt: "Why?" },
    { kind: "decision", role: "guided", spotId: "x-guided", hand: "x-guided" },
    { kind: "decision", role: "practice", spotId: "x-practice", hand: "x-practice" },
  ],
  spots: { "x-guided": guided, "x-practice": practice },
  hands: {},
});

check("the rule: a copied spot, the film's numbers on new words, and a reworded copy all repeat", () => {
  assert.equal(lessonRepeats(lesson(spot(), spot())).length, 1, "the film's question as the guided hand");
  const numbers = lesson({ decision: "action", choices: ["fold", "call"], potBefore: 100, bet: 50, given: { equity: 30 }, prompt: "All-in for 50 into 100, and you win 30%. Fold or call?" },
    spot({ given: { equity: 30 }, prompt: "Mina's river: all-in for 50 into 100." }));
  assert.match(lessonRepeats(numbers)[0].why, /film's numbers/);
  const worded = lesson({ decision: "count", range: [0, 20], prompt: "You have 1,000, they have 240, the pot is 120. What is the SPR?" },
    spot({ decision: "estimate", choices: undefined, bands: [{ id: "a" }, { id: "b" }], potBefore: 120, bet: 0, prompt: "The pot is 120. You have 1,000 behind and he has 240. What is the stack-to-pot ratio?" }));
  assert.match(lessonRepeats(worded)[0].why, /film's numbers/);
  assert.ok(promptSimilarity("Who acts first before the flop?", "Who acts first before the flop?") >= PROMPT_SIMILAR);
});

check("the rule: guided on the film's idea with new cards and numbers is clean; one hand's two decisions are clean", () => {
  assert.deepEqual(lessonRepeats(lesson(spot(), spot({ hero: ["Ts", "9s"], board: ["Kh", "8s", "3s"], potBefore: 150, bet: 75, call: 75, prompt: "Ten-nine of spades on king, eight, three. He bets 75 into 150." }))), []);
  const count = { role: "guided", id: "a", prompt: "How many outs?", signature: { board: "9d 8c 2h", hero: "Js Ts", pot: 200, bet: 25, choices: "count:0-47:outs", given: null } };
  const call = { role: "guided", id: "b", prompt: "Now, call or fold?", signature: { ...count.signature, choices: "act:fold|call" } };
  assert.equal(repeatOf(count, call), null);
});

for (const definition of ALL) {
  const node = learn.nodeOfLesson(definition.id)?.id || definition.id;
  check(`${node}: no step repeats the film's question or another step`, () => {
    assert.ok(askingStages(definition).length >= 4, `${node} asks in four steps or more`);
    assert.deepEqual(lessonRepeats(definition), [], `${node} repeats a step (node scripts/audit-lesson-repeats.mjs)`);
  });
}

console.log(`lessonRepeats ok (${checks} checks): ${ALL.length} lessons, no step repeats`);
