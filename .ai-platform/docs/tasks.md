# DSH Testkit Delivery Index

Version: v0.4.0
Status: Confirmed
Last updated: 2026-08-26

## Active Release

- Feature: `lifecycle-runner`
- Work graph: `.ai-platform/specs/lifecycle-runner/tasks.md`
- Product contract: `.ai-platform/docs/product-design.md`
- Technical decisions: `.ai-platform/docs/technology-decision-record.md`
- Analysis: `.ai-platform/specs/lifecycle-runner/analysis.md`

## Release Gate

The governed tasks execute sequentially. Each behavior task requires its packet, RED/GREEN evidence and review before release. User acceptance is required before any task becomes `Accepted` or the release report becomes final.

## Governed Task Index

### T000: Deliver Lifecycle Runner MVP

Status: Needs_Review
Priority: P0
Depends on: None
Blocks: None
Story / Requirement: US-001 through US-005, FR-001 through FR-018, NFR-001 through NFR-012
Parallel: No
Conflicts with: None

Goal:
Complete the confirmed lifecycle-runner work graph, native DSH bundle and release gates.

Allowed files:
- `.ai-platform/specs/lifecycle-runner/tasks.md` defines task-level ownership.

Test targets:
- Task-specific targets are defined in the feature work graph.

Deliverables:
- T001 through T006 implementation, evidence and review.

Acceptance criteria:
- Confirmed Product Design acceptance criteria pass.

Definition of Done:
- Full validation, release evidence and user acceptance exist.

Validation commands:
- `pnpm validate`
- `pnpm test:e2e`
- `pnpm test:pack`

TDD plan:
- RED: Each feature task records its own expected failing test.
- GREEN: Each feature task implements the minimum behavior.
- REFACTOR: Full validation stays green.

Packet path:
- Feature packets are `.ai-platform/specs/lifecycle-runner/packets/T001.yaml` through `T006.yaml`.

Evidence required:
- Task evidence summaries, diffs, test results and residual risks.

#### Work Item T001: Foundation, Domain And Reporters

Status: Needs_Review
Source: `.ai-platform/specs/lifecycle-runner/tasks.md#t001-foundation-domain-and-reporters`
Packet: `.ai-platform/specs/lifecycle-runner/packets/T001.yaml`

#### Work Item T002: Real DSH Worker, Runners And CLI

Status: Needs_Review
Source: `.ai-platform/specs/lifecycle-runner/tasks.md#t002-real-dsh-worker-runners-and-cli`
Packet: `.ai-platform/specs/lifecycle-runner/packets/T002.yaml`

#### Work Item T003: Fixtures, Real-Host Proof And Distribution

Status: Needs_Review
Source: `.ai-platform/specs/lifecycle-runner/tasks.md#t003-fixtures-real-host-proof-and-distribution`
Packet: `.ai-platform/specs/lifecycle-runner/packets/T003.yaml`

#### Work Item T004: Release Hardening And Acceptance

Status: Needs_Review
Source: `.ai-platform/specs/lifecycle-runner/tasks.md#t004-release-hardening-and-acceptance`
Packet: `.ai-platform/specs/lifecycle-runner/packets/T004.yaml`

#### Work Item T005: v0.1.2 Contract, CI And Release Hardening

Status: Needs_Review
Source: `.ai-platform/specs/lifecycle-runner/tasks.md#t005-v012-contract-ci-and-release-hardening`
Packet: `.ai-platform/specs/lifecycle-runner/packets/T005.yaml`

#### Work Item T006: Native DSH Bundle And v0.2.0 Release

Status: Needs_Review
Source: `.ai-platform/specs/lifecycle-runner/tasks.md#t006-native-dsh-bundle-and-v020-release`
Packet: `.ai-platform/specs/lifecycle-runner/packets/T006.yaml`

#### Work Item T007: v0.2.1 Community Proof And Release Automation

Status: Needs_Review
Source: `.ai-platform/specs/lifecycle-runner/tasks.md#t007-v021-community-proof-and-release-automation`
Packet: `.ai-platform/specs/lifecycle-runner/packets/T007.yaml`

#### Work Item T008: v0.3.0 One-Command Adoption And Agent Skill

Status: Needs_Review
Source: `.ai-platform/specs/lifecycle-runner/tasks.md#t008-v030-one-command-adoption-and-agent-skill`
Packet: `.ai-platform/specs/lifecycle-runner/packets/T008.yaml`

#### Work Item T009: Nested Plugin Root And Design-Partner Pilot

Status: Needs_Review
Source: `.ai-platform/specs/lifecycle-runner/tasks.md#t009-nested-plugin-root-and-design-partner-pilot`
Packet: `.ai-platform/specs/lifecycle-runner/packets/T009.yaml`

#### Work Item T010: Deterministic Loopback HTTP Route Assertions

Status: Accepted
Source: `.ai-platform/specs/lifecycle-runner/tasks.md#t010-deterministic-loopback-http-route-assertions`
Packet: `.ai-platform/specs/lifecycle-runner/packets/T010.yaml`
