# Interface acknowledgement: F52-V1-CONTRACT-1

| Field | Value |
|---|---|
| Contract ID | F52-V1-CONTRACT-1 |
| Schema version | 1 |
| Contract file | `C:/Code/Programming/flop52/docs/V1-SHARED-INTERFACES-2026-10-06.md` (43,464 bytes) |
| SHA256 computed in this pass | `475556803d1daf196edddf42631a5cb6c617182d218c81d631b993c09db776a9` |
| Expected SHA256 (assignment and transfer record) | `475556803d1daf196edddf42631a5cb6c617182d218c81d631b993c09db776a9`: **match** |
| Repository | poker-core, detached worktree |
| Absolute checkout | `C:/Code/Programming/flop52/.dev-servers/claude-v1-core-2026-10-06` |
| Baseline commit (`git rev-parse HEAD`) | `6382201ae2d0ea965cd8c1d2cda72225d08466c8`: equals the recorded baseline and assignment commit |
| Baseline manifest | `.dev-servers/v1-two-session-2026-10-06/source-baseline.json`, SHA256 `b71396f42032c76ae91df3b460b361003304b5ab5e22c5a0ce826a548db94c20` (equals `assignment.json` → `baseline.sha256`) |
| Milestone | M2 (non-render audit and acknowledgement) |
| Date | 2026-10-06 (UTC) |

## Baseline guard result: PASS

1. **My own recompute (read-only).** `git -C <wt> ls-files` lists 114 tracked files. I
   computed the SHA256 and byte count of each file and compared them with
   `claudeWorktree.trackedMembers`: **114 match, 0 mismatch, 0 missing, 0 extra**. The
   recomputed digest (SHA256 of sorted-key compact JSON of the rows, the same method as
   `prepare-source-baseline.py`) is `b9793865e26f80a560dcd8b19fcf3c3df0b1574e91fccddcb890ee10f01b3ea8`.
   It equals the recorded `trackedDigest`.
2. **`verify-claude-boundary.py`.** I read it first: it only reads, hashes and runs
   `git rev-parse` / `git ls-files`, and writes nothing. I then ran it before writing any
   file. Exit code 0, output
   `{"passed": true, ..., "protectedTrackedFiles": 114, "ownedNewFiles": 0, ...}`.
3. **Git state before writing.** `git status --porcelain` shows 78 newline-related ` M `
   entries plus the untracked `.handoff/` inputs. This is expected and protected; none of
   these entries was touched, normalized, staged, reset, cleaned or stashed.
   `git diff --check` exited 0 with no whitespace errors; it printed only Git's LF→CRLF
   warnings.

## Owned paths

Relative to the checkout above. M2 is open now. M3–M5 are written here for binding only;
their gates are below.

| Milestone | Exclusive new-file paths |
|---|---|
| M2 | `docs/v1-feature/` (this file, `LESSON-AUDIT.md`, `PROPOSALS.md`, `receipt.json`) |
| M3 learning foundation | `src/learn/v1/`, `test/v1/learn/` |
| M4 rating / placement / season research | `src/rating/v1/`, `research/v1-rating/`, `test/v1/rating/` |
| M5 living Gauntlet / identity | `src/gauntlet/v1/`, `src/profile/v1/`, `test/v1/gauntlet/`, `test/v1/profile/` |

Main keeps everything else:

- all 114 existing tracked files, including `package.json`, the existing `index` and export
  files, lesson and media definitions, the roster, bands and progression formulas;
- `.handoff/`;
- every server, web and native file;
- root `docs/` and all release and credential material.

New modules will be imported directly by file path in tests. I will not edit any manifest or
export.

## Acceptance of ownership and authority rules

I accept the following as binding for M3–M5:

- **Three data classes (§3).** A client assertion or command is untrusted and never sets
  correctness, eligibility, rating, outcome, placement, mastery, ownership or committed
  state. An admitted private server fact is supplied by main after main has validated it at
  the server boundary; pure code checks only its shape and invariants. A string such as
  `authority: "server"` or a matching hash is never proof of trust. A public snapshot is an
  allowlisted projection of committed facts and is never a live writer.
- **Allowlist public projection.** Every `project*` function builds its output field by field
  from an explicit allowlist. Nothing is built by spread-then-delete. Private inputs,
  evaluator outputs, key references and private reason codes never reach a public result.
- **Idempotent events.** Every applied event has a stable id plus a canonical payload
  fingerprint. The same id with the same fingerprint gives `duplicate` (a no-op). The same id
  with different data is a conflict problem. Reducer deduplication is not durable authority:
  main enforces persisted uniqueness. Pure modules never stamp `committed` on a proposal.
- **Fail closed.** Unknown contract or schema versions, unresolved ownership, mismatched
  source/model/policy versions and unselected or incomplete policies return problems
  (`POLICY_UNSELECTED` / `POLICY_INCOMPLETE`), never defaults. There is no silent fixed-K Elo,
  zero-quality, default cap, default placement count, default memory limit or default
  schedule. Existing records stay intact when a new contract cannot assess them.
- **No mastery from watching.** Watching, completing a run, reaching the takeaway, a hinted,
  repeated, assisted or previously viewed item, a role label alone, or one Gauntlet win never
  becomes independent learning evidence or mastery. Unknown exposure or novelty is not a
  clean attempt. A delayed label needs an admitted earlier-evidence link and a satisfied
  supplied schedule policy. The audit found that every existing lesson lacks this.
- **No hidden cards or future runout in grading (§5).** Decision evidence carries only the
  closed information-set type. Opponent concealed cards, later board cards, final winner,
  later observations and client-supplied legal actions are not fields. Tests will show that
  changing unavailable information in a raw fixture cannot change the extracted evidence or
  the quality result.
- **No answer keys in my outputs.** Neither `LearningPlan` nor `VariationRef` nor any file I
  write contains answer keys, correct-action markers, concealed cards or private-key URIs.
  The M2 audit loaded registry entries for structure only and recorded no key values.
- **Main-owned boundaries (§2).** I create no replacement lesson-run, mastery, matchmaking,
  settlement, memory or reward store. I do not reinterpret existing stage roles or rewrite
  keys. I make no choice of rating coefficients, placement counts, season rules, progression
  criteria or memory bounds. At an unassigned dependency I return a proposal instead.

## Specific discrepancies and ambiguities

I acknowledge the contract as written. The items below are for main to resolve or version.
Until main answers, I will apply the interim reading given in each item; none of them blocks
M2.

1. **§4, §5, §9, §10: export module format.** The contract says "Exports from
   `src/learn/v1/index.cjs`" (and `src/rating/v1/index.cjs`, `src/profile/v1/index.cjs`,
   `src/gauntlet/v1/index.cjs`). However, every existing learn module, including the 20
   lesson definitions, is ESM `.mjs` (`package.json` `"./learn": "./src/learn/index.mjs"`),
   and the package root is CommonJS. A `.cjs` index cannot statically import those `.mjs`
   definitions. *Interim reading:* `.cjs` is intended. The v1 modules will import no existing
   `.mjs` file and will receive definitions only through `suppliedDefinitionIndex`. Tests may
   load real definitions with dynamic `import()`. Please confirm.
2. **CLAUDE-V1-HANDOFF ("Main reserves … exports/index files") vs contract §4–§10 ("Exports
   from `src/…/v1/index.cjs`").** The handoff could be read as reserving the new
   `src/*/v1/index.cjs` files too. *Interim reading:* the reservation covers existing index
   and export files and package exports. New `index.cjs` files inside my assigned
   directories are mine to create. Please confirm.
3. **§3: "Every applied event has a stable ID plus canonical payload fingerprint."** The
   canonicalization is not specified: the hash algorithm, the canonical JSON form, which
   fields are excluded (at least `fingerprint` itself), and whether `contractId` and
   `schemaVersion` are included. A main-side fingerprint and a reducer-side check must agree.
   *Interim reading:* SHA256 hex over sorted-key, compact UTF-8 JSON of the object without
   its `fingerprint` field. This is the method `prepare-source-baseline.py` already uses. I
   propose this formally in PROPOSALS P5.
4. **§3: `timestamp` is used in the types but not defined** beyond "UTC ISO timestamps
   supplied by main". *Interim reading:* the string must match
   `YYYY-MM-DDTHH:MM:SS(.sss)?Z`. Anything else is a problem. Comparison is lexical only after
   that check.
5. **§4: `LearningPlan.conceptId` with `existingLesson` is a single lesson, and
   `conceptEvidence` aggregates by `conceptId`.** Lessons #4 (`outs-workspace-v1`) and #5
   (`rule-2-4-workspace-v1`) share `conceptId: "t1-outs-rule-24"` [verified]. It is not stated
   whether evidence from the two lessons pools under one concept. *Interim reading:* the
   reducer keeps separate `contentRefs` and aggregates per (concept, evidence policy) only
   when the supplied policy lists both lessons; otherwise it returns a problem.
6. **§4: "Main supplies the mapping to existing source/run stages."** The audit verified that
   server registry stages carry no `role`; roles exist only in the public shared core
   definitions. The contract does not say which artifact is the admitted source of `role`.
   *Interim reading:* `role` on a `LearningEvidenceFact` is accepted only as main supplies
   it. Plan validation checks the role against the supplied definition index at the exact
   (lessonId, contentVersion, stageIndex, spotId). See PROPOSALS P1.
7. **§3: `Result.disposition`, "applied" | "duplicate" | "unchanged".** The difference
   between `duplicate` and `unchanged` is not defined. *Interim reading:* `duplicate` means a
   replay of an (id, fingerprint) pair that was already processed. `unchanged` means a new,
   valid input that the supplied policy declares a no-op, so the snapshot and its revision
   stay the same. Recording a fact as excluded still counts as `applied`. Please confirm or
   narrow.
8. **§5: `publicStacks: { participantId, chips }[]`, `publicCommitments`, and the element
   type of `publicActionPrefix`** have untyped fields. *Interim reading:* `participantId` is
   a string, `chips` and `amount` are finite nonnegative numbers, `ordinal` is a nonnegative
   safe integer, and `action` is a string that must belong to the supplied legal-action
   semantics.
9. **§6: `CommittedParticipantRating = ParticipantRatingProposal & {…}`** inherits
   `privateReasonCodes`. That is consistent with the rule that private material stays out of
   projections, but `CommittedRatingResult` is then a private type, and the contract does not
   name the public result type. *Interim reading:* `projectCommittedRatingResult` returns a
   separately allowlisted public shape: IDs and kinds, before/after estimates, delta,
   uncertainty, provisional context, model/policy refs, `publicReasons`, and the trusted AI
   flag. Main should name that type in a later revision.
10. **Process.** `docs/CLAUDE-RUN-TRANSFER-2026-10-06.md` says "HOLD … Do not begin the M2
    audit while waiting unless I explicitly answer Yes to question 7". This M2 pass ran on
    the instruction of the coordinating session that assigned it. I cannot see Tyler's
    answer to question 7. Main should record that answer in the dated decision receipt the
    transfer document requires.
11. **Trivial.** §1 has "all114" (a missing space). No action needed unless a revision is
    issued.

## Dependency gaps

These are listed so main can plan around them; details and proposed interfaces are in
`PROPOSALS.md`.

- No admitted source of stage role (P1).
- No exposure tracking across lessons, versions or equivalence families (P2).
- No delayed issuance (P3).
- No reviewed bridge from lesson-run evidence to `mastery.js`, which today treats one beaten
  bot as mastered (P4).
- Fingerprint canonicalization (P5).
- Module format confirmation (P6).
- `correctAction` fields in native `courseVideoPlan.js`, and plan numbers that diverge from
  the shared lessons (P7).

## Resource window

None was used. M2 performed no render, simulation, build, full test suite, server start,
install, download, network or provider call. It ran only read-only `git`, `python` hashing
and `node` stdin inspection commands (listed in `receipt.json`).

## Gates

**M3–M5 stay held until Tyler's M1 visual acceptance.** The M1 draft was reviewed and not
accepted, and its revision answers are pending. This acknowledgement satisfies only the
"Claude exact contract acknowledgement" prerequisite in `.handoff/assignment.json`. If the
contract changes, main issues a new revision and hash, and I write a new acknowledgement.
