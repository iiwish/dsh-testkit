# DSH Testkit Post-Spec Work Graph

Version: v0.2
Status: Confirmed
Feature: lifecycle-runner
Source spec: `.ai-platform/docs/product-design.md`
Last updated: 2026-08-15

## 状态定义

- Draft: task 仍需要更多信息。
- Ready: execution packet 完整，可以开始。
- Running: task 正在执行。
- Needs_Review: implementation 和 evidence 已存在。
- Accepted: 已 review 且用户已接受。
- Blocked: dependency、environment 或 requirement 问题阻止推进。

## Planning Notes

- Constitution: `.ai-platform/memory/constitution.md`
- Requirements: `.ai-platform/docs/product-design.md`
- Checklist: `.ai-platform/specs/lifecycle-runner/checklists/requirements.md`
- Analysis: `.ai-platform/specs/lifecycle-runner/analysis.md`
- TDD default: all behavior tasks require verified RED, GREEN and fresh validation.
- Isolation: tasks run sequentially in the current project directory; the user-owned untracked `AGENTS.md` is outside every task boundary.

## Epic E001: Publishable DSH Lifecycle Testkit MVP

Goal:
Plugin authors can run one command against a real DSH version and receive reproducible install-to-recovery evidence.

Stories:
- US-001, US-002, US-003, US-004, US-005

External tracking:
- Issue: None.

## Story Group

User outcome:
A local or CI user can test a packed plugin through the real DSH lifecycle without model credentials, while maintainers can consume stable JSON/JUnit evidence.

Validation:
- `pnpm validate`
- `pnpm test:e2e`
- clean tarball consumer smoke

Tasks:
- [x] T001 [US-001, US-002] Implement package foundation, domain contracts and reporters.
- [x] T002 [US-001, US-003, US-004, US-005] Implement worker, DSH adapter, probe, runners and CLI.
- [x] T003 [US-001, US-002, US-005] Add fixtures, real-host proof, Action, docs and release verification.
- [x] T004 [US-001 through US-005] Resolve release-acceptance findings and prove an immutable release candidate.
- [x] T005 [US-001 through US-005] Harden contracts and CI, complete case reruns, and publish v0.1.2 through a trusted release path.
- [x] T006 [US-006] Publish the same engine as a safe native DSH bundle and release v0.2.0.

## Task Details

### T001: Foundation, Domain And Reporters

Status: Needs_Review
Priority: P0
Depends on: None
Blocks: T002
Story / Requirement: US-001, US-002, FR-001, FR-002, FR-013, FR-014, FR-015, FR-016, NFR-001, NFR-002, NFR-008, NFR-012
Parallel: No
Conflicts with: T002, T003

Goal:
Create a publishable TypeScript package with validated scenario/report contracts, lifecycle stage state, verdict mapping and four report projections.

Allowed files:
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `vitest.config.ts`
- `.gitignore`
- `.npmignore`
- `LICENSE`
- `src/version.ts`
- `src/domain/**`
- `src/config/**`
- `src/reporters/**`
- `tests/unit/**`
- `.ai-platform/evidence/T001/**`

Test targets:
- `tests/unit/scenario.test.ts`
- `tests/unit/lifecycle.test.ts`
- `tests/unit/reporters.test.ts`

Deliverables:
- Validated Scenario and RunReport schemas.
- Stage recorder, verdict and exit-code mapping.
- JSON, JUnit, Markdown and terminal renderers.
- Build, test, typecheck and validation scripts.

Acceptance criteria:
- Invalid DSH ranges and unsafe local selection fail validation.
- Reporters render the same verdict and stage set from one report.
- XML is produced through xmlbuilder2 and parses as valid JUnit.

Definition of Done:
- RED evidence captured before implementation.
- Unit tests, typecheck and build pass.
- T001 evidence exists and review has no blocking finding.

Validation commands:
- `pnpm test -- tests/unit/scenario.test.ts tests/unit/lifecycle.test.ts tests/unit/reporters.test.ts`
- `pnpm typecheck`
- `pnpm build`

TDD plan:
- RED: add contract and reporter tests before source modules exist.
- GREEN: implement the smallest schemas, recorder and renderers satisfying tests.
- REFACTOR: centralize status/verdict mappings and keep reporters pure.

Packet path:
- `.ai-platform/specs/lifecycle-runner/packets/T001.yaml`

Evidence required:
- Changed files.
- RED/GREEN/REFACTOR results.
- Validation results.
- Diff summary.
- Residual risks.

### T002: Real DSH Worker, Runners And CLI

Status: Needs_Review
Priority: P0
Depends on: T001
Blocks: T003
Story / Requirement: US-001, US-003, US-004, US-005, FR-003 through FR-012, FR-017, FR-018, NFR-003 through NFR-011
Parallel: No
Conflicts with: T001, T003

Goal:
Execute the complete scenario state machine in Docker or explicit unsafe local mode against a real exact DSH installation.

Allowed files:
- `src/cli.ts`
- `src/domain/lifecycle.ts`
- `src/process/**`
- `src/observers/**`
- `src/runners/**`
- `src/adapters/dsh/**`
- `src/worker/**`
- `src/probe/**`
- `assets/runner.Dockerfile`
- `tests/unit/command.test.ts`
- `tests/unit/runner.test.ts`
- `tests/unit/lifecycle.test.ts`
- `tests/integration/**`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.json`

Test targets:
- `tests/unit/command.test.ts`
- `tests/unit/runner.test.ts`
- `tests/integration/worker.test.ts`
- `tests/integration/cli.test.ts`

Deliverables:
- Command execution with timeout, process cleanup and sanitized logs.
- Exact DSH adapter and versioned runtime probe.
- Subject packaging/install, assemble, boot, register, exercise, update, uninstall, reboot, recover and cleanup.
- Docker default and explicit unsafe local runner.
- User-facing CLI and report output.

Acceptance criteria:
- Controller never loads plugin code.
- Local runner is rejected without explicit unsafe consent.
- Fake DSH integration tests cover success, failure, timeout and recovery transitions.
- Missing required observer produces unsupported.

Definition of Done:
- RED evidence captured before implementation.
- Unit and integration tests, typecheck and build pass.
- T002 evidence exists and review has no blocking finding.

Validation commands:
- `pnpm test -- tests/unit/command.test.ts tests/unit/runner.test.ts tests/integration/worker.test.ts tests/integration/cli.test.ts`
- `pnpm typecheck`
- `pnpm build`

TDD plan:
- RED: add command, runner and fake-DSH integration tests before modules exist.
- GREEN: implement protocol, adapter, worker, runners and CLI to satisfy transitions.
- REFACTOR: separate transport from lifecycle and consolidate owned-root safety checks.

Packet path:
- `.ai-platform/specs/lifecycle-runner/packets/T002.yaml`

Evidence required:
- Changed files.
- RED/GREEN/REFACTOR results.
- Validation results.
- Diff summary.
- Residual risks.

### T003: Fixtures, Real-Host Proof And Distribution

Status: Needs_Review
Priority: P0
Depends on: T002
Blocks: None
Story / Requirement: US-001, US-002, US-005, all acceptance criteria, SC-001 through SC-010
Parallel: No
Conflicts with: T001, T002

Goal:
Prove the tool against healthy and intentionally broken plugins, ship CI integration and make the packed project usable from a clean consumer.

Allowed files:
- `fixtures/**`
- `tests/e2e/**`
- `.github/actions/dsh-test/action.yml`
- `.github/workflows/ci.yml`
- `docs/**`
- `examples/**`
- `README.md`
- `package.json`
- `pnpm-lock.yaml`
- `.npmignore`
- `.ai-platform/evidence/T003/**`
- `.ai-platform/docs/release-report.md`

Test targets:
- `tests/e2e/real-dsh.test.ts`
- packed consumer smoke script under `tests/e2e/`

Deliverables:
- Five fixture classes and real rc.6 E2E.
- Composite GitHub Action and CI workflow.
- Architecture, scenario and contributor docs.
- Packed-package consumer verification and release evidence.

Acceptance criteria:
- Healthy fixture passes lifecycle stages.
- Boot, registration and dirty-uninstall fixtures fail at intended stages or produce intended negative-case pass.
- Real DSH rc.6 result includes probe and environment evidence.
- Packed tarball runs in a clean project.

Definition of Done:
- RED evidence captured before fixture implementations.
- Full `pnpm validate`, E2E and pack consumer smoke pass.
- Spec compliance, engineering review and QA acceptance have no blockers.
- T003 evidence and Draft release report exist.

Validation commands:
- `pnpm validate`
- `pnpm test:e2e`
- `pnpm test:pack`
- `python3 /Users/iiwish/.codex/skills/ai-delivery-governor/scripts/validate_delivery_artifacts.py --root . --feature-id lifecycle-runner`

TDD plan:
- RED: E2E tests reference missing fixtures and Action/package assets.
- GREEN: add fixtures, distribution files and documentation until real-host and consumer tests pass.
- REFACTOR: remove duplicated fixture metadata and tighten release docs while keeping all validation green.

Packet path:
- `.ai-platform/specs/lifecycle-runner/packets/T003.yaml`

Evidence required:
- Changed files.
- RED/GREEN/REFACTOR results.
- Full validation outputs.
- Real DSH report excerpt.
- Diff summary.
- Residual risks.

### T004: Release Hardening And Acceptance

Status: Needs_Review
Priority: P0
Depends on: T003
Blocks: Public release
Story / Requirement: US-001 through US-005, RA-001 through RA-012, all release gates
Parallel: No
Conflicts with: T001, T002, T003

Goal:
Eliminate every release-acceptance finding, make full-suite repeatability and flaky classification executable, and validate an immutable local release candidate.

Allowed files:
- `.ai-platform/**`
- `.github/**`
- `src/**`
- `tests/**`
- `fixtures/**`
- `assets/**`
- `schemas/**`
- `scripts/**`
- `docs/**`
- `examples/**`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `vitest.config.ts`
- `README.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `LICENSE`
- `.npmignore`
- `.dockerignore`
- `.gitignore`

Test targets:
- `tests/unit/**`
- `tests/integration/**`
- `tests/e2e/real-dsh.test.ts`
- `tests/e2e/pack-consumer.mjs`
- release acceptance commands in `.ai-platform/docs/release-acceptance-plan.md`

Deliverables:
- Content-aware cleanup detection and deterministic observers.
- Working local-tarball Docker input and content-addressed runner images.
- Exact update-target and post-update assembly verification.
- Five-attempt full suite, repeatability evidence and reachable flaky verdict.
- Immutable CI action references, package metadata and community health files.
- Measured coverage, retained stage-failure tests and final release evidence.

Acceptance criteria:
- Every RA-001 through RA-012 regression test passes without weakening an assertion.
- `--suite full` runs five attempts and reports inconsistent semantic outcomes as flaky.
- Real DSH directory, tarball, update, residue and observer cases produce expected verdicts.
- The packed package validates in a clean consumer and all published contracts match.
- The reviewed tree has a local immutable Git commit and the acceptance decision is evidence-backed.

Definition of Done:
- RED evidence exists for the release findings.
- Coverage, unit, integration, E2E, pack, static Action and governance validation pass.
- Release report records no unresolved blocker and the exact committed tree is clean.

Validation commands:
- `pnpm validate`
- `pnpm test:coverage`
- `pnpm test:e2e`
- `pnpm test:pack`
- `python3 /Users/iiwish/.codex/skills/ai-delivery-governor/scripts/validate_delivery_artifacts.py --root . --feature-id lifecycle-runner`

TDD plan:
- RED: add focused regressions for every release finding and retain failing outputs.
- GREEN: implement only the lifecycle, runner, contract and release changes required by those regressions.
- REFACTOR: run the full professional acceptance matrix on the immutable candidate.

Packet path:
- `.ai-platform/specs/lifecycle-runner/packets/T004.yaml`

Evidence required:
- Finding-to-test traceability.
- RED/GREEN/REFACTOR results.
- Coverage summary and real DSH reports.
- Packed artifact identity and immutable Git identity.
- Diff summary and residual risks.

### T005: v0.1.2 Contract, CI And Release Hardening

Status: Needs_Review
Priority: P0
Depends on: T004
Blocks: None
Story / Requirement: FR-002, FR-016, FR-018, NFR-002, NFR-007, NFR-008, NFR-012
Parallel: No
Conflicts with: None

Goal:
Close the post-release review findings, preserve v1 contract compatibility, make Action matrix use reliable, and publish v0.1.2 from an auditable release identity.

Allowed files:
- `.ai-platform/**`
- `.github/**`
- `src/**`
- `tests/**`
- `assets/**`
- `schemas/**`
- `scripts/**`
- `docs/**`
- `examples/**`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `vitest.config.ts`
- `README.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `.dockerignore`
- `.gitignore`

Test targets:
- `tests/unit/action-identity.test.ts`
- `tests/integration/cli.test.ts`
- `tests/integration/worker.test.ts`
- `tests/contracts/v1-compatibility.test.ts`
- `tests/e2e/real-dsh.test.ts`
- `tests/e2e/pack-consumer.mjs`

Deliverables:
- Lifecycle-stage case selector and report identity.
- Exact DSH adapter support registry.
- Runtime and published-schema compatibility fixtures.
- Matrix-safe composite Action identities and argument transport.
- Scoped CI and npm trusted-publishing workflow.
- Generated runner lock, embedded source maps and deterministic pack cleanup.

Acceptance criteria:
- Composite Action invocations derive unique output, JUnit check and artifact identities and expose upload metadata.
- Stored v1 scenario and report fixtures validate with both runtime schemas and published JSON Schema.
- `--case <stage>` executes the necessary prefix, skips later stages, always cleans up and appears in the reproduction command.
- Unsupported DSH versions return exit code 4 before runner construction.
- CI permissions are job-scoped, stale runs are cancelled, and a trusted npm release workflow validates tag/version/commit identity.
- Packed consumer checks derive the package version dynamically and clean temporary resources.
- Full validation, real DSH E2E, packed consumption, Action smoke and public package verification pass.

Definition of Done:
- Focused behavior tests demonstrate RED before implementation and GREEN after it.
- Local validation, real-host E2E, packed consumer, actionlint, publint and audits pass.
- Hosted PR matrix passes without artifact/check collisions.
- `v0.1.2` points to the reviewed merge commit and npm exposes the same version with provenance.

Validation commands:
- `pnpm validate`
- `pnpm test:e2e`
- `pnpm test:pack`
- `python3 /Users/iiwish/.codex/skills/ai-delivery-governor/scripts/validate_delivery_artifacts.py --root . --feature-id lifecycle-runner --task-id T005`

TDD plan:
- RED: add regressions for case selection, unsupported DSH, Action identity and stored v1 fixtures.
- GREEN: implement the smallest controller, worker, schema and Action changes that satisfy the regressions.
- REFACTOR: consolidate release identity, lock generation and CI permissions, then run real-host and package gates.

Packet path:
- `.ai-platform/specs/lifecycle-runner/packets/T005.yaml`

Evidence required:
- RED/GREEN results for case selection, support gating, Action identity and compatibility fixtures.
- Full release validation and public CI URLs.
- Commit, tag, GitHub release, npm version and provenance identities.
- Residual risks and external repository-setting changes.

### T006: Native DSH Bundle And v0.2.0 Release

Status: Needs_Review
Priority: P0
Depends on: T005
Blocks: None
Story / Requirement: US-006, FR-019 through FR-022, NFR-002 through NFR-004, NFR-008, NFR-012, SC-011, SC-012
Parallel: No
Conflicts with: None

Goal:
Make `dsh-testkit` a DSH-native installable bundle whose `dsh_test` tool safely delegates to the existing Docker lifecycle engine, then publish and verify v0.2.0.

Allowed files:
- `.ai-platform/**`
- `.github/**`
- `src/**`
- `tests/**`
- `scripts/**`
- `docs/**`
- `examples/**`
- `cordis.patch.yml`
- `package.json`
- `pnpm-lock.yaml`
- `README.md`
- `CHANGELOG.md`

Test targets:
- `tests/unit/dsh-plugin.test.ts`
- `tests/unit/command.test.ts`
- `tests/integration/cli.test.ts`
- `tests/contracts/dsh-bundle.test.ts`
- `tests/e2e/pack-consumer.mjs`
- `tests/e2e/real-dsh-bundle.test.ts`

Deliverables:
- DSH `dsh.bundle.patch` manifest and Cordis plugin export.
- Typed `dsh_test` tool with explicit consent, workspace containment, Docker-only execution, cancellation and bounded structured output.
- Packed-consumer and real DSH install/registration/invocation evidence.
- v0.2.0 npm package, GitHub tag/release, moving `v0` tag and plugin-directory submission.

Acceptance criteria:
- `dsh plugin --profile <name> add <packed-tarball>` activates the Testkit bundle and `--dump-config` contains its row.
- A real DSH runtime probe sees `dsh_test`, and one confirmed call runs the healthy fixture through Docker.
- Missing confirmation, workspace escape and symlink escape fail before runner construction.
- Tool arguments cannot select local execution, mutable inputs, arbitrary output paths or implicit repository configuration.
- DSH cancellation reaches the owned Docker subprocess and settles without leaving the named run container.
- CLI, Action and report compatibility tests remain green.
- v0.2.0 is published from the reviewed merge commit with npm provenance.

Definition of Done:
- Focused tests demonstrate RED before implementation and GREEN after it.
- Full validation, real-host lifecycle, native-bundle E2E and packed-consumer gates pass.
- Protected-branch PR merges, release workflow succeeds and public package/bundle identities verify.
- Plugin-directory PR is open with the released installable package.

Validation commands:
- `pnpm validate`
- `pnpm test:e2e`
- `pnpm test:bundle-e2e`
- `pnpm test:pack`
- `python3 /Users/iiwish/.codex/skills/ai-delivery-governor/scripts/validate_delivery_artifacts.py --root . --feature-id lifecycle-runner --task-id T006`

TDD plan:
- RED: add tool consent, containment, forced-Docker, cancellation, bundle-contract and real-host tests before implementation.
- GREEN: implement the smallest adapter and cancellation plumbing that satisfies those tests.
- REFACTOR: run complete CLI/Action/package regression and real DSH acceptance before release.

Packet path:
- `.ai-platform/specs/lifecycle-runner/packets/T006.yaml`

Evidence required:
- RED/GREEN outputs and security-boundary traceability.
- Full validation, packed consumer and real DSH bundle results.
- Commit, PR, CI, tag, GitHub release, npm provenance and marketplace submission identities.
- Residual risks and any external repository-setting changes.

### T007: v0.2.1 Community Proof And Release Automation

Status: In_Progress
Priority: P0
Depends on: T006
Blocks: v0.2.1 public release
Story / Requirement: US-007, FR-023 through FR-028, NFR-013, NFR-014, SC-013 through SC-016
Parallel: No
Conflicts with: None

Goal:
Publish a bilingual, evidence-led v0.2.1 release; prove the runner against ten exact community bundles; and detect new DSH release candidates without weakening the published compatibility contract.

Allowed files:
- `.ai-platform/**`
- `.github/**`
- `src/**`
- `tests/**`
- `scripts/**`
- `docs/**`
- `examples/**`
- `package.json`
- `pnpm-lock.yaml`
- `README.md`
- `README.zh-CN.md`
- `CHANGELOG.md`
- `SECURITY.md`

Test targets:
- `tests/contracts/dsh-bundle.test.ts`
- `tests/contracts/documentation.test.ts`
- `tests/unit/community-validation.test.ts`
- `tests/unit/dsh-release-train.test.ts`
- `tests/e2e/pack-consumer.mjs`
- `tests/e2e/real-dsh.test.ts`
- `tests/e2e/real-dsh-bundle.test.ts`

Deliverables:
- English and Simplified Chinese README entrypoints with concise positioning, quickstart, lifecycle, evidence, comparison, safety and contribution paths.
- Optional DSH host peer metadata with runtime/declaration independence and warning-free clean/profile installation.
- Exact-version, credential-free community cohort runner plus aggregate public report for ten bundles.
- Scheduled/manual DSH dist-tag watch and ephemeral real-host canary matrix.
- Evidence-based multi-plugin lifecycle decision.
- v0.2.1 npm package, GitHub release, immutable `v0.2.1` tag and moving `v0` tag.

Acceptance criteria:
- Both README files link to each other, document v0.2.1 and rc.6, contain the same safety boundary and ship in the npm tarball.
- Clean installation with automatic peer installation disabled emits no peer warning, installs no DSH host package, and preserves runtime and declaration imports.
- Ten exact npm bundle versions run in Docker with no inherited credentials; public output contains only aggregate results and first-failure-stage counts.
- New npm `latest`/`next` values outside the support registry become canary inputs; a fixture proves candidate detection and disposable source enablement.
- Canary tests use an ephemeral checkout and cannot alter the committed support registry or published package.
- Multi-plugin scope has an explicit TDR grounded in cohort and community evidence.
- Protected-branch PR, CI, trusted npm publication, public install and native DSH bundle verification pass.

Definition of Done:
- Focused contracts demonstrate RED before implementation and GREEN after it.
- Full validation, package, real-host, native-bundle, audit, actionlint and governance gates pass.
- Community cohort results and raw local evidence reconcile to the published aggregate.
- v0.2.1 public identities resolve to one reviewed merge commit and npm provenance verifies.

Validation commands:
- `pnpm validate`
- `pnpm test:e2e`
- `pnpm test:bundle-e2e`
- `pnpm test:pack`
- `node scripts/run-community-validation.mjs --acknowledge-untrusted-code --dsh 0.1.0-rc.6 --plugin <exact-spec> ...`
- `node scripts/check-dsh-release-train.mjs --metadata tests/fixtures/dsh-registry-current.json`
- `python3 /Users/iiwish/.codex/skills/ai-delivery-governor/scripts/validate_delivery_artifacts.py --root . --feature-id lifecycle-runner --task-id T007`

TDD plan:
- RED: add bilingual/package contracts, immutable cohort/credential rules and DSH dist-tag candidate fixtures before implementation.
- GREEN: implement the smallest documentation, runner and release-watch changes that satisfy those contracts.
- REFACTOR: run ten public artifacts, publish only aggregate evidence, then complete full release validation.

Packet path:
- `.ai-platform/specs/lifecycle-runner/packets/T007.yaml`

Evidence required:
- RED/GREEN results, README parity, warning-free package/profile installs, cohort protocol and aggregate reconciliation.
- DSH release discovery/canary fixtures and hosted workflow evidence.
- Full release validation, commit/PR/CI/tag/GitHub/npm/provenance identities and residual risks.

## Gate

- User explicitly authorized continuation on 2026-08-15.
- Checklist is Completed and analysis has no unresolved Critical/High findings.
- Each task executes only from its packet and remains `Needs_Review` until final user acceptance.
- The user explicitly approved T004 and all release fixes on 2026-08-15.
- The user explicitly approved the native DSH bundle direction and v0.2.0 release on 2026-08-15.
- The user explicitly approved v0.2.1 and optimization items 1 through 5 on 2026-08-15.
