# DSH Testkit Delivery Index

Version: v0.1
Status: Confirmed
Last updated: 2026-08-15

## Active Release

- Feature: `lifecycle-runner`
- Work graph: `.ai-platform/specs/lifecycle-runner/tasks.md`
- Product contract: `.ai-platform/docs/product-design.md`
- Technical decisions: `.ai-platform/docs/technology-decision-record.md`
- Analysis: `.ai-platform/specs/lifecycle-runner/analysis.md`

## Release Gate

The four governed tasks execute sequentially. Each task requires its packet, RED/GREEN evidence and two-pass review before the next task begins. User acceptance is required before any task becomes `Accepted` or the release report becomes final.

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
Complete the confirmed lifecycle-runner feature work graph and release-hardening gate.

Allowed files:
- `.ai-platform/specs/lifecycle-runner/tasks.md` defines task-level ownership.

Test targets:
- Task-specific targets are defined in the feature work graph.

Deliverables:
- T001 through T004 implementation, evidence and review.

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
- Feature packets are `.ai-platform/specs/lifecycle-runner/packets/T001.yaml` through `T004.yaml`.

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
