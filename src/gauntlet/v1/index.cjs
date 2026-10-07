"use strict";
// Living Gauntlet v1 (F52-V1-CONTRACT-1 §10) pure modules. Main wires package exports after acceptance;
// tests import this file directly. Narrative data lives in ./rivals.cjs (not an export of this index).
const { validateRivalDefinition, reduceJourneyCheckpoint, validateEncounterResult, projectLivingGauntlet } = require("./journey.cjs");
const { reduceRelationshipMemory, projectRelationshipMemory } = require("./memory.cjs");

module.exports = { validateRivalDefinition, reduceJourneyCheckpoint, validateEncounterResult, reduceRelationshipMemory, projectLivingGauntlet, projectRelationshipMemory };
