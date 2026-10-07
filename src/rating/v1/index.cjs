"use strict";
// Rating v1 (F52-V1-CONTRACT-1 §5-§8) pure modules. Main wires package exports after acceptance;
// tests and the research harness import this file directly. Research candidates live in
// ./candidates.cjs and are RESEARCH ONLY (no production defaults, no accepted weights).
const evidence = require("./evidence.cjs");
const rating = require("./rating.cjs");
const placement = require("./placement.cjs");
const season = require("./season.cjs");
const candidates = require("./candidates.cjs");
const { fingerprintOf, hashOf, CONTRACT_ID, SCHEMA_VERSION } = require("./common.cjs");

module.exports = {
  // §5
  validateDecisionEvidence: evidence.validateDecisionEvidence,
  evaluateDecisionQuality: evidence.evaluateDecisionQuality,
  validateQualityAssessment: evidence.validateQualityAssessment,
  dependenceGroupFor: evidence.dependenceGroupFor,
  // §6
  validateRatingPolicy: rating.validateRatingPolicy,
  proposePairedRatingUpdate: rating.proposePairedRatingUpdate,
  proposePairedRatingUpdateWithAudit: rating.proposePairedRatingUpdateWithAudit,
  validatePairedRatingProposal: rating.validatePairedRatingProposal,
  validateCommittedRatingResult: rating.validateCommittedRatingResult,
  projectCommittedRatingResult: rating.projectCommittedRatingResult,
  AI_BADGE: rating.AI_BADGE,
  // §7
  derivePlacementContext: placement.derivePlacementContext,
  projectPlacementContext: placement.projectPlacementContext,
  validatePlacementContext: placement.validatePlacementContext,
  DENIED_PLACEMENT_SOURCE_KINDS: placement.DENIED_SOURCE_KINDS,
  // §8
  validateSeasonDefinition: season.validateSeasonDefinition,
  reduceSeason: season.reduceSeason,
  deriveSeasonStandings: season.deriveSeasonStandings,
  projectSeason: season.projectSeason,
  createDraftSeasonSnapshot: season.createDraftSeasonSnapshot,
  seasonInputHash: season.seasonInputHash,
  // research candidates (§6 families + labelled baseline)
  candidates,
  fingerprintOf, hashOf, CONTRACT_ID, SCHEMA_VERSION,
};
