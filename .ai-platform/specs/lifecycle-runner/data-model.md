# DSH Testkit Data Model

Version: v0.1
Status: Confirmed
Last updated: 2026-08-15

## Entities

### Scenario

- `schemaVersion`: scenario contract version, currently `1`.
- `name`: stable human-readable scenario name.
- `suite`: `quick` or `full`.
- `subject`: plugin source and optional update source.
- `dsh.version`: exact npm version.
- `expect`: expected rows, services, tools and boot outcome.
- `exercise`: zero or more deterministic tool calls.
- `recovery`: action when an expected or unexpected boot failure occurs.
- `observers`: required, preferred or disabled capabilities.
- `timeouts`: per-stage timeout overrides.

### RunRequest

- `runId`: controller-generated sortable identifier.
- `scenario`: fully resolved Scenario.
- `outputDir`: absolute controller-owned output directory.
- `runner`: Docker or unsafe local selection.
- `unsafeLocal`: explicit local execution consent.
- `allowMutableSource`: whether mutable source may execute; such a run cannot produce reproducible `passed`.

### SubjectIdentity

- `input`: original source spec.
- `kind`: local-directory, tarball, npm or git.
- `packageName`: installed package identity.
- `packageVersion`: package manifest version.
- `sourceDigest`: SHA-256 of tarball or immutable source descriptor.
- `gitCommit`: exact commit when applicable.
- `mutable`: whether identity can change without input text changing.

### StageResult

- `id`: ordered lifecycle stage ID.
- `status`: passed, failed, skipped or unsupported.
- `startedAt`, `endedAt`, `durationMs`.
- `summary`: short human diagnosis.
- `failureKind`: assertion, subject, dsh, infrastructure, timeout or cleanup.
- `command`: sanitized executable and arguments where applicable.
- `exitCode`, `signal`.
- `assertions`: typed Assertion records.
- `artifacts`: paths relative to run output.

### Assertion

- `id`: stable assertion key.
- `status`: passed, failed or unsupported.
- `expected`, `actual`: JSON-safe values.
- `message`: actionable explanation.
- `evidence`: relative artifact paths.

### ObserverCoverage

- `filesystem`: DSH-home and workspace checkpoints plus owned-root removal confirmation.
- `process`: stage-boundary snapshot.
- `ports`: stage-boundary snapshot.
- `network`: proxy, trace or unsupported.
- `canary`: log, egress or unsupported.
- Each value carries `mode`, `available`, and `limitations`.

### EnvironmentFingerprint

- Testkit version and report schema.
- DSH version and package integrity.
- Runner kind, image name and image ID.
- OS, architecture, Node and pnpm versions.
- Started timestamp and relevant non-secret configuration.

### RunReport

- Identity, timestamps and overall verdict.
- Scenario identity includes its name, suite, schema version, profile and canonical SHA-256 digest; the resolved snapshot is retained as `evidence/scenario.json`.
- SubjectIdentity binds the packed plugin artifact.
- EnvironmentFingerprint and ObserverCoverage.
- Ordered StageResults.
- Canonical artifacts and cleanup status.
- Reproduction command with secrets removed.
- Repeated runs include `repeatability`: requested and completed run counts, consistency, and each attempt's verdict, semantic digest and report path.

### Repeatability

- Quick executes once unless `--repeat` is supplied.
- Full executes at least five independent lifecycle attempts.
- Semantic comparison excludes timestamps, durations, run IDs, commands and artifact paths while retaining identities, environment, coverage, stage status and assertions.
- Inconsistent non-infrastructure outcomes produce `flaky`; an inconsistent set containing an infrastructure error retains the higher-precedence infrastructure verdict and records `consistent: false`.

## State Transitions

```text
created
  -> resolving
  -> installing_dsh
  -> packaging
  -> installing_plugin
  -> assembling
  -> booting
  -> registering
  -> exercising
  -> updating? -> assembling -> booting -> registering -> exercising
  -> uninstalling
  -> rebooting
  -> recovering?
  -> cleaning
  -> completed
```

- A required failed stage skips dependent stages but never skips cleanup.
- Expected boot failure can transition to recovery without making the scenario fail when the expected error assertion passes.
- Unsupported required observer assertions produce overall `unsupported`.
- Infrastructure failures are distinct from subject test failures.
- Cleanup failure can upgrade a passed run to infrastructure error.

## Verdict Precedence

From highest to lowest precedence:

1. `invalid`
2. `infrastructure_error`
3. `failed`
4. `unsupported`
5. `flaky` for inconsistent repeated semantic outcomes without a higher-precedence result
6. `passed`

Expected negative cases are represented by passing assertions inside a stage; they do not weaken precedence rules.
