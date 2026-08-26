# DSH Testkit Implementation Plan

Version: v0.4.0
Status: Confirmed
Last updated: 2026-08-26
Source: confirmed Product Design and Technology Decision Record

## Goal

Deliver a publishable Node CLI that tests a DSH plugin artifact against exact DSH 0.1.0-rc.6 in Docker by default, produces structured lifecycle evidence, and proves its own negative detection and recovery behavior with fixtures.

## Package Layout

```text
src/
  cli.ts
  domain/
  config/
  reporters/
  runners/
  adapters/dsh/
  worker/
  probe/
assets/
fixtures/
tests/
  unit/
  integration/
  e2e/
.github/actions/dsh-test/action.yml
cordis.patch.yml
```

## Implementation Sequence

### Slice 1: Contracts And Core

- Scaffold publishable TypeScript ESM package.
- Implement Scenario, WorkerRequest, RunReport and stage schemas.
- Implement config merge and exact-version validation.
- Implement lifecycle stage recorder and verdict/exit-code mapping.
- Implement JSON, JUnit, Markdown and terminal reporters.
- Verify pack output contains runtime assets and contracts.

### Slice 2: Real DSH Lifecycle

- Implement command runner with timeouts, cancellation, log redaction and per-stage artifacts.
- Implement local subject copy/pack and npm/tarball/Git subject resolution.
- Install exact DSH in an owned run root.
- Use standard `dsh plugin --profile ... add/remove` and `--dump-config` commands.
- Mount the runtime probe overlay, wait for its artifact, then terminate DSH cleanly.
- Implement update, uninstall, reboot and recovery transitions.
- Implement filesystem, process and port checkpoint observers with capability reporting.
- Implement Docker image build/run and explicit unsafe local runner.
- Connect CLI to worker protocol and reporters.

### Slice 3: Proof And Distribution

- Add healthy, boot-failure, registration-failure, dirty-uninstall and observer fixtures.
- Add fake-DSH integration tests for stage transitions and diagnostics.
- Add opt-in real DSH Docker E2E against rc.6.
- Add composite GitHub Action and CI workflow.
- Write contributor, scenario and architecture documentation.
- Pack and consume the tarball in a clean temporary project.

### Slice 4: Native DSH Bundle

- Add the DSH `dsh.bundle.patch` manifest and Cordis plugin export.
- Register a typed `dsh_test` tool that delegates to the existing CLI engine.
- Require confirmation, constrain workspace paths, disable implicit config and force Docker.
- Forward DSH cancellation through runner-owned subprocesses.
- Verify package contracts, real DSH install/config/tool registration and a healthy Docker invocation.

### Slice 5: v0.2.1 Community Proof And Release-Train Automation

- Publish paired English and Simplified Chinese README entrypoints with current-version checks and a precise comparison boundary.
- Add a credential-free, exact-version community cohort runner that emits aggregate public evidence while retaining detailed local reports.
- Add npm dist-tag discovery and an ephemeral DSH candidate matrix without widening the published support registry.
- Record the evidence-based decision on multi-plugin lifecycle scope.
- Release v0.2.1 through the protected-branch and trusted-publishing path.

### Slice 6: v0.3.0 Adoption And Agent Workflow

- Add an offline `dsh-test init` subcommand that parses the real bundle manifest and patch, then atomically scaffolds the scenario, lifecycle workflow and project Skill.
- Keep initialization non-destructive and idempotent, with containment and symlink checks before any write.
- Define one compact `dsh-testkit` Skill used by the project file and optional DSH runtime registration.
- Prove root CLI compatibility, generated-file contracts, packed consumption and real DSH tool-plus-Skill discovery.
- Update the existing official Show & Tell, submit a policy-compliant official Agent Skill proposal, and open a released integration PR against a maintained public plugin template.
- Release v0.3.0 through the protected-branch and trusted-publishing path.

### Slice 7: Design-Partner Nested Plugin Pilot

- Separate repository-root integrations from plugin-root scenario ownership without changing the lifecycle schema.
- Add automatic Git worktree detection plus an explicit `--repo-root` override for exported or unusual layouts.
- Prove root and nested scaffold transactions through RED/GREEN tests and exact generated paths.
- Validate the released partner tags `dsh-plugin-doctor@v1.14.0` and `dsh-subscribe@v0.3.1` without treating their adoption as market validation.
- Prepare reproducible evidence and a low-cost maintainer follow-up; npm publication remains a separate user-approved operation.

### Slice 8: Deterministic Loopback HTTP Route Assertions

Status: Completed; accepted after local validation and the required real-host Docker matrix.

- Add an optional `http.routes` scenario contract with GET-only, path-safe expectations.
- Start the real DSH web command on a runner-owned loopback port and check routes after boot, before uninstall.
- Persist bounded status, selected JSON fields and response digest evidence with headers and complete bodies redacted.
- Reject HTTP route scenarios in explicit unsafe-local mode and preserve the v1 report schema and lifecycle stage IDs.

## Validation Strategy

- RED/GREEN Vitest tests per task.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` on every slice.
- `pnpm test:integration` after worker implementation.
- `pnpm test:e2e` with Docker for real DSH acceptance.
- `pnpm pack` and clean consumer smoke before release review.
- SSOT validator and placeholder scan before Execute and release.

## Failure Handling

- A command timeout kills the owned process group and records timeout evidence.
- An expected boot failure becomes a passing negative assertion and can enter recovery.
- An unexpected stage failure skips dependent stages but always enters cleanup.
- Missing required observer produces unsupported, not passed.
- Cleanup failure upgrades the overall verdict to infrastructure error.

## Security Review Focus

- No shell interpolation for subject-provided values.
- No plugin code executes in the controller.
- Mount local source read-only; pack from a copied working directory.
- Redact environment values matching secret/token/key patterns and explicit canary values.
- Safe owned-root checks before recursive cleanup.
- Report Docker image identity and unsafe local mode.

## Release Boundary

The MVP is complete when the confirmed Product Design acceptance criteria pass. Public npm publication and GitHub repository creation are separate user-approved release operations.
