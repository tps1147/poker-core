"use strict";
// Profile identity v1 (F52-V1-CONTRACT-1 §9) pure modules. Main wires package exports after acceptance;
// tests import this file directly. Shared helpers are ../../gauntlet/v1/common.cjs (same M5 owner).
const { validateAchievementDefinition, proposeRewardClaim, reduceRewardInventory, deriveCosmeticEquipEligibility } = require("./rewards.cjs");
const { projectProfileIdentity } = require("./identity.cjs");

module.exports = { validateAchievementDefinition, proposeRewardClaim, reduceRewardInventory, deriveCosmeticEquipEligibility, projectProfileIdentity };
