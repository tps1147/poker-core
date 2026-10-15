// THE QUESTION MOMENTS (2026-10-08). Some spots ask a question the table plays no part in (a chance
// from a fresh deck, who pays a tournament prize, a bankroll's buy-ins, a tilt call). They carry
// `scene: "deck" | "question"` (lessonModel.mjs SPOT_SCENES) and the hand step draws a deck or a
// plain question card instead of seats, stacks and a pot. This pins:
//   - the field: only the two values, and the model's readers (spotScene, scenePrompt)
//   - presentation only: every scene spot's answer key (answerKeys/<node>.mjs, which the server
//     copies; keys are on spotId and stage) is the pinned one, its stage and choices still match
//     the definition, and a spot with its scene removed fits the same key
//   - coverage: a spot whose hand has no table action (no board, no bet or check, no showdown) has
//     a scene, unless its question reads the seats or cards the table shows (TABLE_READS)
//   node test/spotScenes.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as learn from "../src/learn/index.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PINNED = JSON.parse(readFileSync(join(ROOT, "test/fixtures/spotScenes.keys.json"), "utf8"));
const { FILM_FIRST_LESSONS, ACADEMY_V2_EARLY_LESSONS, ACADEMY_V2_LATER_LESSONS, SPOT_SCENES, spotScene, scenePrompt, decisionStages } = learn;
const ALL = [...ACADEMY_V2_EARLY_LESSONS, ...ACADEMY_V2_LATER_LESSONS, ...FILM_FIRST_LESSONS]
  .filter((definition, index, list) => list.findIndex((other) => other.id === definition.id) === index);

let checks = 0;
const check = (name, fn) => { try { fn(); checks += 1; } catch (error) { error.message = `${name}: ${error.message}`; throw error; } };
const keysOf = async (node) => (await import(pathToFileURL(join(ROOT, "answerKeys", `${node}.mjs`)).href)).default;

// Spots with no table action whose question still reads the table: the seats (who is on the
// button, how many act behind), the stacks, or the hero's own cards. They keep the table.
const TABLE_READS = Object.freeze({
  "dk-practice": "which of your two nines is higher: the hero's own cards",
  "sb-fresh": "who posts the small blind: the button seat",
  "fh-guided": "what a call costs: the blinds the button and the big blind posted",
  "hu-guided": "who acts first: the button and the big blind",
  "ic-practice": "the middle stack: three stacks at the table",
  "pos2-practice": "fold or raise from the first seat: the hero's cards and seat",
  "sh1-guided": "fold or raise from the first seat: the hero's cards and seat",
  "rfi1-practice-behind": "players behind you: the six seats",
  "rfi1-practice-open": "fold or raise from the first seat: the hero's cards and seat",
});

// A hand's table action: a board, any bet, check or fold before the decision, or a showdown.
function tableAction(hand) {
  if ((hand?.start?.board || []).length) return true;
  return (hand?.script || []).some((step) => (step.do === "act" && step.action !== "answer") || step.do === "showdown");
}

const kindOf = (entry) => entry.kind ?? entry.decision;
const keyFits = (spot, key) => spot.decision === "estimate" ? spot.bands.some((band) => (band.id ?? band) === key.band)
  : spot.decision === "action" ? spot.choices.includes(key.action)
    : spot.decision === "count" ? Number.isInteger(key.value) && key.value >= spot.range[0] && key.value <= spot.range[1]
      : false;

const sceneSpots = ALL.flatMap((definition) => Object.entries(definition.spots)
  .filter(([, spot]) => spot.scene !== undefined).map(([spotId, spot]) => ({ definition, spotId, spot })));

check("the field takes two values, read by spotScene", () => {
  assert.deepEqual([...SPOT_SCENES], ["deck", "question"]);
  assert.equal(spotScene({ scene: "deck" }), "deck");
  assert.equal(spotScene({ scene: "question" }), "question");
  assert.equal(spotScene({ scene: "table" }), null);
  assert.equal(spotScene({}), null);
  assert.equal(spotScene(null), null);
  for (const { spotId, spot } of sceneSpots) assert.ok(SPOT_SCENES.includes(spot.scene), `${spotId} scene "${spot.scene}"`);
});

check("33 spots are question moments: 6 deck, 27 question", () => {
  assert.equal(sceneSpots.length, 33);
  assert.equal(sceneSpots.filter(({ spot }) => spot.scene === "deck").length, 6);
  assert.equal(sceneSpots.filter(({ spot }) => spot.scene === "question").length, 27);
  assert.deepEqual(sceneSpots.map(({ definition, spotId }) => `${definition.node}/${spotId}`).sort(), Object.keys(PINNED).sort());
});

check("every scene spot has words to set over its choices", () => {
  for (const { spotId, spot } of sceneSpots) assert.ok(scenePrompt(spot), `${spotId} has a prompt`);
  assert.equal(scenePrompt({ dockPrompt: "How often?", title: "A red card." }), "How often?");
  assert.equal(scenePrompt({ title: "Fold or call?" }), "Fold or call?");
});

check("every scene spot is a decision stage on its own hand", () => {
  for (const { definition, spotId } of sceneSpots) {
    const stage = decisionStages(definition).find((item) => item.spotId === spotId);
    assert.ok(stage, `${spotId} is a decision stage`);
    assert.ok(definition.hands?.[stage.hand], `${spotId} keeps its hand`);
    assert.ok(definition.hands[stage.hand].script.some((step) => step.do === "decide" && step.spotId === spotId), `${spotId} hand decides it`);
  }
});

for (const { definition, spotId, spot } of sceneSpots) {
  const keys = await keysOf(definition.node);
  check(`${definition.node}/${spotId}: the answer key is unchanged`, () => {
    const pinned = PINNED[`${definition.node}/${spotId}`];
    assert.equal(pinned.scene, spot.scene);
    assert.equal(keys.lessonId, pinned.lessonId);
    assert.equal(keys.contentVersion, pinned.contentVersion, "content version");
    const entry = keys.spots[spotId];
    assert.deepEqual(entry, pinned.entry, "the key entry, as pinned");
    assert.ok(!("scene" in entry), "the key carries no scene");
    // The registry's checks still hold: stage index, decision kind, the offered choices.
    assert.equal(definition.stages[entry.stage]?.spotId, spotId, "stage index");
    assert.equal(spot.decision, kindOf(entry), "decision kind");
    if (spot.decision === "estimate") assert.deepEqual(spot.bands.map((band) => band.id ?? band), entry.bands, "bands");
    if (spot.decision === "action") assert.deepEqual(spot.choices, entry.choices, "choices");
    // The scene is not part of the answer: without it the spot fits the very same key.
    const { scene, ...bare } = spot;
    assert.ok(scene);
    assert.ok(keyFits(bare, entry.key), "the key fits the spot without its scene");
    assert.ok(keyFits(spot, entry.key), "the key fits the spot with its scene");
  });
}

check("a spot without a table action has a scene, or reads the table", () => {
  const missing = [];
  for (const definition of ALL) {
    for (const stage of decisionStages(definition)) {
      const spot = definition.spots[stage.spotId];
      if (tableAction(definition.hands?.[stage.hand]) || spotScene(spot) || TABLE_READS[stage.spotId]) continue;
      missing.push(`${definition.id}/${stage.spotId}`);
    }
  }
  assert.deepEqual(missing, []);
});

check("every named table read is a real spot with no table action and no scene", () => {
  for (const spotId of Object.keys(TABLE_READS)) {
    const definition = ALL.find((item) => item.spots[spotId]);
    assert.ok(definition, `${spotId} exists`);
    const stage = decisionStages(definition).find((item) => item.spotId === spotId);
    assert.ok(!tableAction(definition.hands[stage.hand]), `${spotId} has no table action`);
    assert.equal(spotScene(definition.spots[spotId]), null, `${spotId} keeps the table`);
  }
});

console.log(`spotScenes: ${checks} checks passed`);
