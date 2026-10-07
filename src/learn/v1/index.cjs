"use strict";
// Learn v1 (F52-V1-CONTRACT-1 §4) pure modules. Main wires package exports after acceptance; tests
// import this file directly. The academy tree draft is ESM data at ./academyTree.mjs.
const { validateLearningPlan } = require("./plan.cjs");
const { validateLearningEvidenceFact, reduceLearningEvidence, projectLearningEvidence } = require("./evidence.cjs");
const { fingerprintOf, CONTRACT_ID, SCHEMA_VERSION } = require("./common.cjs");

module.exports = { validateLearningPlan, validateLearningEvidenceFact, reduceLearningEvidence, projectLearningEvidence, fingerprintOf, CONTRACT_ID, SCHEMA_VERSION };
