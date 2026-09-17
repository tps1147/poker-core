import assert from "node:assert/strict";
import { handRankingsV2, validateDefinitionHands, mountState, tableProps, hasWatched } from "../src/learn/index.mjs";

assert.deepEqual(validateDefinitionHands(handRankingsV2), []);
const table = tableProps(mountState(handRankingsV2.hands["hr2-guided"]));
assert.equal(table.seats.length, 2);
assert.equal(hasWatched([[0, 26]], 29.6), true);
assert.equal(hasWatched([[0, 5], [25, 29.6]], 29.6), false);
console.log("learn ok");
