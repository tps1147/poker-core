# M2 proposals: dependencies that need main-owned changes

These proposals cover unresolved dependencies found in the M2 audit. Each needs main/integration
ownership: server persistence, registry metadata, existing exports, native files or a contract
revision. None of them is implemented here. Each ends with what M3–M5 will do meanwhile, so
that no module creates parallel authoritative state.

Labels: [V] = verified from source in M2; [I] = inferred or proposed.

## P1. Admitted stage-role source

**Gap.** Server registry stages carry `kind` and `spotId` but no `role`. Roles
(guided/practice/fresh) exist only in the public core definitions [V].
`LearningEvidenceFact.role` is required (§4).

**Proposal [I].** Main derives role from the core definition at the exact
(lessonId, contentVersion), using the same Node parity path the server already uses for
structure. It extends the existing web/server registry parity test so that role equality is
asserted for all 20 film-first pairs. Main then supplies the role as part of the admitted
fact. The 7 legacy v1 workspace pairs have no film-first roles, so their facts carry
`role: null`. That would need a contract change, so the alternative is to exclude them: under
§4 they become `unassessable` until main maps them.

Supplied shape for M3 (pure, read-only):

```text
StageRoleIndex = Envelope & { source: SourceRef,
  entries: { lessonId: string, contentVersion: integer, stageIndex: integer,
             spotId: string, role: "guided" | "practice" | "fresh" }[] }
```

**Meanwhile.** `validateLearningPlan` and `validateLearningEvidenceFact` accept a role only if
it matches a supplied `StageRoleIndex` entry. A missing entry is a problem.

## P2. Exposure across lessons, versions and equivalence families

**Gap.** `assisted` and `attemptNumber` are scoped to one
`userId:lessonId:version` record [V]. Identical or structurally identical items recur
across lessons (`LESSON-AUDIT.md` §4.3). For example, the #17 and #18 fresh spots are both
K♥Q♥ on an A-8-3 rainbow flop with no pair [V]. Without cross-record exposure, "fresh" means
"fresh within the lesson", and §4 says that cannot count as `noveltyVerified`.

**Proposal [I].** Two parts:

- Main adds private registry metadata `equivalenceFamilyId` per (lessonId, contentVersion,
  spotId), plus a family policy `VersionRef`.
- When main admits an evidence fact, it computes `exposure.priorIssuances` and
  `exposure.priorAnswers` over every saved run record of the subject that touches the same
  family.

The family assignment is a content decision. This audit's §4.3 list is a starting inventory,
not a decision. Shape for M3:

```text
EquivalenceFamilyIndex = Envelope & { policy: VersionRef, source: SourceRef,
  members: { lessonId: string, contentVersion: integer, spotId: string,
             familyId: string }[] }
```

**Meanwhile.** M3 treats `noveltyVerified: null` as not clean, as §4 requires, and reports
such facts in `uncertainCount`, not `independentCount`.

## P3. Delayed issuance

**Gap.** No lesson has a delayed stage. No record links a later attempt to an earlier
evidence id under a schedule [V].

**Proposal [I].** Main issues delayed variations as new server-owned issuance records:

- a new variation `VersionRef`;
- a private key that stays in the registry;
- `delayed.priorEvidenceId`, plus `scheduledAt` and `notBefore` from a supplied schedule
  policy.

Main persists these, for example as a new collection or as a run kind under the existing
lesson-run model. That is main's choice, and it needs a migration. The variation's public
definition is a `VariationRef` with `role: "delayed"` and `sourceSpot` pointing at the
original spot. Main chooses no interval here.

**Meanwhile.** M3 implements validation only:

- A delayed fact with no `priorEvidenceId`, an unknown prior id, a `decidedAt` earlier than
  `notBefore`, or a missing schedule policy is rejected or recorded as excluded.
- Fixtures cover each of these cases.

## P4. Bridge from lesson evidence to mastery

**Gap.** The lesson-run controller writes no mastery or progress bridge [V]. Native
`mastery.js` declares a node mastered on one beaten archetype bot (`source: 'milestone'`) or
on a ring of 0.8 or more [V]. The curriculum loop's "prove" step means the run reached its
takeaway, not that the answers were correct [V].

**Proposal [I].** Main defines a reviewed adapter. Its input is a
`PublicLearningEvidenceSnapshot` plus a separately committed mastery receipt, which carries
`committedMasteryReceiptId`. Its output feeds `mastery.js` or its successor. Main decides
whether the `milestone` source stays as a separate, labelled journey signal rather than
concept mastery. Changing `mastery.js` is main-owned and outside the M3 paths.

**Meanwhile.** M3 produces aggregates and projections only. It never outputs `mastered`, and
it never sets `committedMasteryReceiptId` itself; it copies the value from supplied committed
input or emits `null`.

## P5. Fingerprint canonicalization (contract revision)

**Gap.** §3 requires a canonical payload fingerprint but defines no canonical form
(INTERFACE-ACK item 3).

**Proposal for the contract's next revision [I].**

```text
fingerprint = lowercase hex SHA256 of UTF-8 bytes of JSON.stringify(canon(x))
canon(x): objects -> keys sorted by UTF-16 code unit, the "fingerprint" key removed at the
          top level only; arrays keep order; numbers must be finite; undefined is not allowed
          (a problem); strings unchanged (no Unicode normalisation).
Includes contractId and schemaVersion (they are part of the envelope).
```

This matches the method `prepare-source-baseline.py` uses for `trackedDigest`
(`json.dumps(rows, sort_keys=True, separators=(',', ':'))`). One caution: Python's
`sort_keys` orders by code point, not by UTF-16 code unit. The two orders differ only for
non-BMP characters in keys, so the revision should say which order wins, or ban non-ASCII
keys [I].

**Meanwhile.** M3–M5 will expose a single `fingerprintOf` helper per module set, so the rule
can change in one place.

## P6. Module format and index ownership

**Proposal [I].** Main confirms `src/*/v1/index.cjs` as CommonJS entry points that import no
existing `.mjs` modules (INTERFACE-ACK items 1 and 2). If main prefers ESM to match
`src/learn/`, it should issue a contract revision naming `index.mjs`. Package `exports`
wiring stays main's work after acceptance.

## P7. Native film plan data (main-owned native files)

**Findings [V].**

- Every one of the 20 entries in `Poker.com/src/learning/courseVideoPlan.js` has a
  `spot.correctAction` field. This is client-shipped film data, not the server key.
- In 13 lessons the plan's hero and board equal the shared guided spot.
- In 7 lessons (#2, 7, 8, 10, 16, 18, 19) the plan's cards differ from the shared lesson,
  and its pot/bet numbers differ in more of them.

**Proposal [I].**

- Main confirms whether `correctAction` ships in the native bundle and whether that is
  acceptable under §3 ("…must never be … placed in lesson/client bundles"). For guided hands
  the coach shows the play anyway.
- Main either marks `courseVideoPlan.js` as describing the original coach-led films only, or
  reconciles it with the shared film-first fixtures before any re-render.

No M3 module will read `courseVideoPlan.js`.

## Not proposed

- No change to existing lesson definitions or keys. The REVISE items in `LESSON-AUDIT.md`
  §2 need new content versions and are content decisions for main and Tyler.
- No new persistence or store from M3–M5.
