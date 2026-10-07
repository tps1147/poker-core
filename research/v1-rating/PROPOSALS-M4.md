# M4 proposals: rating, placement and season discrepancies

These are discrepancies or gaps found while implementing M4 against F52-V1-CONTRACT-1 (§5–§8, §11).
None of them edits the contract. Each item gives the interim reading that the code in
`src/rating/v1/` uses now. Main resolves or versions them. The numbering continues after
`docs/v1-feature/PROPOSALS.md` (P1–P7) with an R prefix.

## R1. Quality assessments carry no participant or match binding

`PrivateQualityAssessment` (§5) has `evidenceId`, `evidenceFingerprint` and `dependenceGroupId`.
It has no `subjectId`, `matchId`, `handId` or `actionOrdinal`. `PairedRatingInput` (§6) carries
the assessments but not the evidence. As a result, `proposePairedRatingUpdate(input, suppliedModel)`
cannot check from its two arguments alone that an assessment belongs to one of the bound
participants, which §6 requires ("participant-owned assessments", "rejects … unmatched participants").
It also cannot detect the same decision submitted under two evidence ids.

**Interim reading.** `proposePairedRatingUpdate(input, suppliedModel, suppliedEvidenceIndex)` takes an
optional third argument: a Map of admitted `PrivateDecisionEvidence` keyed by `evidenceId`. When
there are assessments but no index, the function fails with `ASSESSMENT_OWNERSHIP_UNRESOLVED`.

**Proposal.** Pick one of the following:

- (a) add `subjectId`, `matchId`, `handId` and `actionOrdinal` to `PrivateQualityAssessment`; or
- (b) add `admittedDecisionEvidence: PrivateDecisionEvidence[]` to `PairedRatingInput`.

Either option makes the third argument unnecessary.

## R2. Unspecified signatures and supplied-object shapes

The contract names these functions but not all of their arguments. The code uses the following
interim signatures:

- `validateDecisionEvidence(evidence, suppliedVersionContext)`. The context lists the admitted
  `formatRefs`, `extractorRefs`, `visibilityPolicyRefs`, `amountSemanticsRefs` and an optional
  `opponentPolicyRefs`. It also gives the format geometry: card ranks, suits, hole-card count and
  board cards per street. A missing context returns `POLICY_UNSELECTED`. No format is assumed.
- `evaluateDecisionQuality(evidence, suppliedEvaluator, suppliedOpponentModel)`.
  - `suppliedEvaluator = { evaluatorRef, valueSemanticsRef, qualitySemanticsRef, calibrationRef, versionContext, evaluate }`.
  - `suppliedOpponentModel = { modelRef, opponentPolicyRef, uncertaintyRef, view }`.
- `validateQualityAssessment(assessment, evidence = null)`.
- `validateCommittedRatingResult(result, { acceptedProposal, expectedPriorRevisions })`.
- `projectPlacementContext(context, suppliedVisibilityPolicy)`, `projectSeason(snapshot, suppliedVisibilityPolicy, standings)`.
- Supplied rating model (`suppliedModel`):
  `{ candidate, modelRef, parameterSchemaRef, configHash, evaluatorRefs, qualitySemanticsRef, uncertaintyMethodRef, assessmentUncertaintyMethodRef, usesQuality, compute(boundView) }`.
  `configHash` must equal the hash of `policy.parameters`. This ties the model to the exact policy
  parameters.
- Visibility policy: `{ policy, publicReasonCodes, exposeUncertaintyParameters }`.

**Proposal.** Main names these shapes in the next contract revision, or replaces them.

## R3. The closed decision type is Hold'em-shaped

The `street` enum, `ownCards` and `visibleBoardCards` cannot describe Kuhn or Leduc. The research
harness therefore runs the candidates' `compute` on toy-game bound views and never uses
`PrivateDecisionEvidence`. That is intended (§11: Kuhn and Leduc validate machinery only), but it
should be stated. Board-count validation per street comes from the supplied geometry, not from code.

## R4. The outcome-only baseline and "an explicit labeled baseline result"

§6 allows "an explicit labeled baseline result" when values are missing. However,
`RatingPolicy.candidate` cannot name the baseline.

**Interim reading.** The baseline never passes through `proposePairedRatingUpdate`, which returns
`BASELINE_NOT_A_V1_UPDATE`. It runs only in the research harness, labelled `comparison-baseline`.

**Proposal.** If main wants baseline proposals in production shadow mode, add a separate
`baselineResult` type that can never be committed.

## R5. Carryover from current outcome Elo

`proposePairedRatingUpdate` requires `participants[i].current.policyRef` to equal the input
policy. Otherwise it fails with `RATING_POLICY_MISMATCH`. A first V1 update therefore needs an
initial snapshot under the new policy.

**Proposal.** Main defines a carryover policy (prior estimate and uncertainty from the existing
Elo and career) and issues the initial snapshot. The pure code never invents a prior; it fails with
`RATING_PRIOR_UNKNOWN` or `RATING_UNCERTAINTY_UNKNOWN`.

## R6. A "supported" assessment requires calibration

§5 says persona policy and synthetic provenance "do not establish calibration automatically".

**Interim reading.** An assessment can have status `supported` only when it has a non-null
`calibrationRef`. Partial evidence, or evidence with no admitted opponent model, is capped at
`uncertain` (`EVALUATOR_OVERCLAIM`). Please confirm.

## R7. Decision-time availability of opponent evidence cannot be checked here

`opponentModel.admittedDecisionTimeEvidenceRefs` are SourceRefs with no timestamp. Pure code can
check their shape only.

**Proposal.** Main certifies availability at the original action time. Alternatively, the type
gains an `availableAt` field that is compared with `observedAt`.

## R8. The season event type and the result ledger are not in the contract

§8 names `reduceSeason(snapshot, admittedSeasonEvent, …)` but defines no event type. It also gives
`SeasonSnapshot` no place for admitted result ids.

**Interim reading.**

- Events are `Envelope & { eventId, fingerprint, command: CommandRef, seasonId, source, occurredAt, kind, payload }`.
- The kinds are `season_scheduled`, `season_activated`, `result_admitted`, `cutoff_reached`,
  `season_frozen`, `rewards_committed` and `season_archived`. Each has a closed payload.
- Admitted results are kept as `season-result` SourceRefs inside `processedEventRefs`, next to the
  `season-event/<kind>` refs.
- The freeze `inputHash` must equal `seasonInputHash(snapshot)`, an order-independent hash of the
  admitted results and the cutoff.
- Rewards are recorded once, as one `rewards_committed` batch that matches the frozen reward
  snapshot. A second batch returns `SEASON_REWARD_ALREADY_RECORDED`. Per-subject grants stay with
  profile and main.

**Proposal.** Main names the event type and either adds an `admittedResultRefs` field or endorses
this layout.

## R9. Placement summary and policy shapes

`derivePlacementContext(ratingSnapshot, admittedEvidenceSummary, suppliedPlacementPolicy)` names two
shapes the contract does not define.

**Interim reading.**

- Summary: counts, `opponentClassCounts`, `sourceCounts[{kind, matches}]`, `suspension`, `receiptId`.
- Policy: `requiredEligibleMatches`, `requiredEligibleDecisions`, `opponentClassMinimums`,
  `admissibleSourceKinds`, `uncertaintyGate { methodRef, parameter, maximum }`.
- The contract-denied categories have these labels in the code: `generic_games_played`,
  `legacy_synthetic_history`, `refund`, `cancelled_entry` and `lesson_retry`. They are rejected
  whatever the policy says. Main should map the real source kinds onto these labels.

## R10. The public rating result type is unnamed (repeats INTERFACE-ACK item 9)

`projectCommittedRatingResult` returns an allowlisted shape:

- result, match, model and policy ids;
- per participant: id, kind, `isAi`, `aiBadge { text: "AI", accessibleLabel: "AI player" }` or
  null, before and after estimates, uncertainty status and method (parameters only when the
  visibility policy allows), delta, assessment status, projected placement and public reasons.

A public reason whose code is not on the visibility allowlist rejects the projection
(`PUBLIC_REASON_NOT_ALLOWLISTED`). Projected placement reason codes that are not on the allowlist
are dropped.

## R11. The dependence group id

§5 says one hand's outcome and decisions share a group, but it names no id.

**Interim reading.** The code derives `hand:<matchId>:<handId>`. Evaluators cannot choose it. The
candidates use one observation per group: the group mean, with the group variance not divided by
its decision count.

**Proposal.** Main confirms the id form and states whether groups can span hands, for example for
a cross-hand read.

## R12. The private audit object

`PairedRatingProposal` carries `privateAuditRef` but nothing returns the audit itself.

**Interim reading.** `proposePairedRatingUpdateWithAudit` returns `{ proposal, privateAudit }`. The
`privateAuditRef.sourceHash` is the canonical hash of that audit.

## R13. Reference values used by the research tests

The research tests compare against two published values that were recalled, not fetched (this run
used no network):

- Kuhn uniform-random NashConv `11/12`;
- Leduc uniform-random NashConv `1709/360`, approximately 4.747222.

The code computed both values exactly. Before relying on them, main should check them against the
cited sources (OpenSpiel's exploitability tests). The Leduc information-set counts, 288 with suits
merged and 936 with suits distinct, are checked against an independent formula inside the code.
