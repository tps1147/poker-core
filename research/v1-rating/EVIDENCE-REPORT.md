# M4 evidence report: rating research machinery

Contract: F52-V1-CONTRACT-1 (SHA256 `475556803d1daf196edddf42631a5cb6c617182d218c81d631b993c09db776a9`).
Checkout: `C:/Code/Programming/flop52/.dev-servers/claude-v1-core-2026-10-06`, HEAD `6382201ae2d0ea965cd8c1d2cda72225d08466c8`.
Date: 2026-10-06. Runtime: Node v24.19.0 on Windows. There was no network, install, build, render,
server or commit. Every computation below finishes in under a second.

## What this report claims, and what it does not

**Machinery only.** The toy games check that the exact tools and the reducer plumbing behave as
specified. They say nothing about whether any rating candidate is good. **No metric, rejection
rule, coefficient, threshold, placement count, tie rule or season rule has been selected.** Main
must agree on primary metrics and rejection rules before any fitted experiment. **Success on Kuhn
or Leduc does not validate Hold'em**: Hold'em needs separate evidence and acceptance owned by main.
The harness fits nothing (`fitted: false`). Its metrics and rejection rules are recorded as
`UNSELECTED`. Every number in the candidate configs, priors and assessment variances is a
labelled machinery fixture. None is a proposed production value.

## What ran (exact commands and final lines)

```text
node test/v1/rating/evidence.test.cjs          -> rating evidence: 12 checks passed
node test/v1/rating/placement-season.test.cjs  -> rating placement+season: 11 checks passed
node test/v1/rating/rating.test.cjs            -> rating proposals: 16 checks passed
node test/v1/rating/research.test.cjs          -> rating research: 5 checks passed
node research/v1-rating/kuhn.cjs               -> KUHN EXACT CHECKS PASSED
node research/v1-rating/leduc.cjs 300          -> LEDUC EXACT CHECKS PASSED
node research/v1-rating/harness.cjs --write    -> HARNESS MACHINERY CHECKS PASSED
```

`--write` stored the full run record at `research/v1-rating/runs/kuhn-machinery-run.json`.

## Facts verified by code

### Kuhn (exact rationals, BigInt)

- 6 deals and 12 information sets, 6 per player.
- For α ∈ {0, 1/12, 1/6, 1/4, 1/3}, the equilibrium family has game value exactly **−1/18**,
  BR₀ = −1/18, BR₁ = +1/18 and exploitability exactly **0**.
- Four perturbations outside the family are exploitable: Q call at pb = 2/3 gives 1/72; Q call
  facing b = 1/2 gives 1/72; J bet after p = 1/2 gives 1/36; Q open-bet = 1/10 gives 1/240.
- The uniform profile has NashConv exactly **11/12** (exploitability 11/24). This equals the
  published reference value, which was recalled, not fetched (PROPOSALS-M4 R13).
- At every equilibrium information set with a mixed choice (J, K, Jp, Qb, Qpb), the actions in the
  support have identical exact values. A mixed equilibrium choice therefore has zero regret and is
  never labelled an error.
- Information-set action values use only (own card, public history) plus the opponent policy. They
  integrate the hidden card through the posterior and never read the actual concealed card.
- A float sanity run of 2,000 CFR iterations gives value ≈ −0.05538, exploitability ≈ 0.0045 and a
  K-bet/J-bet ratio ≈ 3.02, consistent with the family.

### Leduc hold'em

- One betting round has 6 decision nodes and 5 continuing closes.
- There are **288** suit-isomorphic and **936** suit-distinct information sets. Both enumeration
  over all 120 deals and an independent formula give these counts.
- The uniform profile was evaluated exactly in rationals:
  - value **−5/64**;
  - BR₀ = 167/80 and BR₁ = 383/144;
  - NashConv **1709/360** ≈ 4.747222 (equal to the recalled published reference).
  - The float evaluator agrees within 1e-9.
- Rules unit-checked: the raise cap, round breaks, showdown pairing, splits and fold payoffs.
- A float sanity run of 300 CFR iterations gives value ≈ −0.0864 and exploitability ≈ 0.0292.
  After 30 iterations the exploitability is ≈ 0.139, so it decreases. This is a sanity check of
  the evaluator, not an equilibrium claim.

### Harness controls

- The record carries `configHash` and the SHA256 of `candidates.cjs`, `harness.cjs`, `exact.cjs`
  and `kuhn.cjs`.
- Seed control: seed 20261006 with a mulberry32 PRNG. The deal-schedule and seat-schedule hashes
  are recorded.
- Seat control: duplicate deals with seats swapped.
- Splits:
  - policy family: train is {eq-α0, eq-α1/3, station, maniac}, holdout is {eq-α1/6, nit};
  - chronological: cutoff at match ordinal 16.
  - The harness asserts both splits are disjoint, and refuses a config whose family lists overlap.
- Determinism: the same seed gives a byte-identical record; a different seed changes the
  deal-schedule hash.
- Refusal: a candidate config with empty parameters is refused with `POLICY_INCOMPLETE`, once per
  missing parameter.
- Exact Kuhn decision quality (chosen value minus best value at the information set): between
  equilibrium players the worst quality is exactly 0. Exploitable families do produce negative
  quality.
- Causal check (first match, outcome and opponent held fixed, the subject's quality replaced by two
  constants):
  - the joint and bounded candidates move the subject in the expected direction and leave the
    opponent unchanged;
  - the outcome-only baseline does not move.

### Abuse-case fixtures (`research/v1-rating/fixtures/abuse-cases.cjs`, all PASS)

| Category | Case | Result |
|---|---|---|
| Quality farming | split-hand | Splitting one hand into more decisions does not change the delta |
| Quality farming | unbounded-value | The bounded candidate's quality term equals its supplied bound |
| Duplicate evidence | replayed assessment | `DUPLICATE_ASSESSMENT` |
| Duplicate evidence | same decision under a new evidence id | `DEPENDENCE_DUPLICATE_DECISION` |
| Reordered evidence | reordered assessments | Same proposal fingerprint |
| Policy drift | opponent persona policy version changed | `POLICY_DRIFT` |
| Policy drift | evaluator version not in the model | `unknown-version` |
| Policy drift | model not built from the policy's parameters | `POLICY_MISMATCH` |
| Provisional | no placement policy with 10,000 matches | Never placed; eligibility unknown |
| Smurf | legacy synthetic history recast as placement | `INADMISSIBLE_PLACEMENT_SOURCE` |
| Opponent selection | AI-only record under a supplied human minimum | Provisional |
| Opponent selection | one-sided update | `PAIRED_PARTICIPANT_MISMATCH` |

## Contract §11 rejection fixtures covered by `test/v1/rating`

| Fixture | Codes or behaviour tested |
|---|---|
| Untrusted client fact | `authority`, `clientVerified` and client outcome fields rejected as `unknown-field`; a forged "supported" assessment fails every invariant |
| Concealed or future data | Opponent hole cards, future board, final winner, later observations, concealed cards in the opponent model, showdown and client legal actions rejected; a future board card, future prefix action and illegal choice rejected |
| Raw-fixture property | Changing the villain's cards, the future turn and river, the winner, or later actions and showdown in the raw record leaves the extracted evidence fingerprint and the quality hash unchanged; the evaluator receives only the frozen allowlisted keys |
| Unknown versions | Contract, schema, extractor, format, visibility, amount semantics, persona policy, evaluator, paired-input schema and format |
| Changed payload under a reused id | `FINGERPRINT_MISMATCH` (evidence and season event); `EVENT_CONFLICT` (season) |
| Missing numerical policy | Every candidate refuses a missing parameter; null or non-experimental config refused |
| Missing rating policy | `POLICY_UNSELECTED` / `POLICY_INCOMPLETE` |
| Missing placement policy | Unknown eligibility and incomplete progress, never placed |
| Missing season policy | Activation, freeze and cutoff blocked |
| Paired participant mismatch | Seven variants, plus third-party evidence |
| Same-hand dependence | Same decision under a new evidence id rejected; one hand gives one group; a split hand does not change the delta |
| Stale expected revision | `STALE_EXPECTED_REVISION` on the committed result and on the season command |
| Proposal mistaken for commit | Rejected by `validateCommittedRatingResult` and by projection; a stamped or committed-field proposal is rejected |
| Duplicated season reward | Replay is a duplicate; a second batch gives `SEASON_REWARD_ALREADY_RECORDED`; reward snapshot mismatch rejected; late result while frozen gives `SEASON_FROZEN`; freeze hash unchanged by replay |
| Readable AI identity | Public rating result and season standings keep `participantKind`, `isAi` and `aiBadge {text: "AI", accessibleLabel: "AI player"}`; humans get `null` |

Additional checks: no-contest, unknown or ineligible outcomes are never rated; a tie names no
winner; the baseline is refused as a V1 update; deterministic tie ordering under a supplied tie
policy, independent of input order; and the public projections leak no private fields (audit,
private codes, action values, variance, settlement fields).

## Not validated

- Any rating candidate's accuracy, calibration, uncertainty coverage or robustness on real play.
  No metric or rejection rule has been agreed and nothing was fitted.
- Hold'em evaluation. The stub evaluator in the tests is a plumbing fixture, not a poker evaluator.
  The real evaluator, calibration and opponent model are main-owned future work.
- Upstream extraction from server state, persistence, uniqueness, transactions, concurrency and
  the API, native or web surfaces, including the actual AI-badge rendering.
- Decision-time availability of opponent evidence (R7) and carryover from the current Elo (R5).
- Whether the recalled external reference values (R13) match their sources. The code's exact
  values are internally consistent; the external match has not been re-checked in this run.

## File inventory (SHA256; this report excluded)

| File | SHA256 |
|---|---|
| `research/v1-rating/PROPOSALS-M4.md` | `0dec66012eb4ea84b7b87b245c636307e23f140a9ab4db42716cb42f2f6ce399` |
| `research/v1-rating/exact.cjs` | `939fec146c37be965a539f032ff862c020fccf1c7d76d80ce241d07211228d49` |
| `research/v1-rating/fixtures/abuse-cases.cjs` | `d63d6e2eaa5120e96c4e3e2ff215354586ccb2b7698e7cef1ad6d45cfee534b5` |
| `research/v1-rating/harness.cjs` | `08be15479d38d04b140f2ec1c201d42f113317ddaef1f5e50f6040b84abeb7f8` |
| `research/v1-rating/kuhn.cjs` | `6015d717664c9ff8894ec6e7a54757482c7c016745d746b47d21a025b1bba3ad` |
| `research/v1-rating/leduc.cjs` | `2a89fd5184cf5e564e411b4b2f494d2e83349df55c51920de3145e2c00de5807` |
| `research/v1-rating/runs/kuhn-machinery-run.json` | `d0a299c628f65eb630527877fefc32808c2ec00c5c82c779ec1d76363b6ffabc` |
| `src/rating/v1/candidates.cjs` | `9a2c9c76cdcf77ddf9efe8737bd8c7c8149aa28cd2ab960ecccbddafa79c60c6` |
| `src/rating/v1/common.cjs` | `fc05c741effd2ca56821196239b9c390ef52bb427fad5d606fca890e4b612457` |
| `src/rating/v1/evidence.cjs` | `c5cd7f24e2af5f63f904348139ecac2af69cfb62e751b962643cc01dae931de3` |
| `src/rating/v1/index.cjs` | `e2dbafd962f4765973657fc5eac94e7c2d1b4a83081b2a01dd0b1857ec74ea30` |
| `src/rating/v1/placement.cjs` | `fc0786c8b38360adfb4be4127d2cfc5c8e81e630a1d1214f1e7bcea887986b53` |
| `src/rating/v1/rating.cjs` | `04988778cfcf6865fe6f1bef63c45492a549e4211a4e40e2edb9b6119e20f6ff` |
| `src/rating/v1/season.cjs` | `5a58cf643663d476ef25b54d35345eb678c0aec643af8d646e02025896903f2a` |
| `test/v1/rating/evidence.test.cjs` | `a1a34234e554ae375e4ab880b182349542a938d432e6fa2076305cfdd7522844` |
| `test/v1/rating/fixtures.cjs` | `8ee8b8f5afc671b4f52327c402c5270022ffa089fcbda6d3bf7a32a4ba8c4492` |
| `test/v1/rating/placement-season.test.cjs` | `c6358be6f05caad784e403ccae2d8222e5b7b9d7945f513b30b8cd898de6f3ca` |
| `test/v1/rating/rating.test.cjs` | `851a4f4ae74814c838a354ec7970e79a2b61f834c7b2b4bd456ac6a9c4aca6d5` |
| `test/v1/rating/research.test.cjs` | `d9f2c88307f0b8bbc9e5e38534a3c5869ee3b991e3f94bd2379e279601023bea` |
