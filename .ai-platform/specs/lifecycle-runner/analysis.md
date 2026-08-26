# DSH Testkit Spec Consistency Analysis

Version: v0.4.0
Status: Completed
Scope: lifecycle-runner, native DSH bundle, adoption workflow and loopback route assertions
Last updated: 2026-08-26

## Inputs

- Constitution: `.ai-platform/memory/constitution.md`
- Product/spec: `.ai-platform/docs/product-design.md`
- Requirements checklist: `.ai-platform/specs/lifecycle-runner/checklists/requirements.md`
- Plan/TDR: `.ai-platform/docs/technology-decision-record.md`, `.ai-platform/specs/lifecycle-runner/plan.md`
- Work graph: `.ai-platform/specs/lifecycle-runner/tasks.md`
- Packets: `.ai-platform/specs/lifecycle-runner/packets/T001.yaml` through `T010.yaml`

## Coverage

- Requirements covered by tasks: FR-001 through FR-018 and NFR-001 through NFR-012 map to T001 through T005; FR-019 through FR-022 and SC-011 through SC-012 map to T006; FR-023 through FR-028, NFR-013 through NFR-014 and SC-013 through SC-016 map to T007; FR-029 through FR-036, NFR-015 through NFR-018 and SC-017 through SC-020 map to T008; FR-037 through FR-039, NFR-019 through NFR-020 and SC-021 map to T009; FR-040 through FR-042 and NFR-021 map to T010.
- Requirements without task coverage: None.
- Tasks without requirement/plan mapping: None.
- Ready tasks without packet: None.
- Packets missing required fields: None.

## Constitution Check

- Violations: None.
- Risk accepted by user: No exception required.

## Consistency Check

- Terminology drift: None. `scenario`, `stage`, `runner`, `adapter`, `observer`, `probe` and `report` have stable meanings.
- Conflicting requirements or decisions: None after FR-007 and FR-012 review resolutions.
- Placeholder/status conflicts: None.
- Parallel/conflict contradictions: None; all tasks are sequential.
- Ownership ambiguity: None. `init` owns one plugin-root scenario plus two repository-root integration targets, refuses symlink/containment boundaries and does not touch manifests, lockfiles or `AGENTS.md`.
- External-policy conflict: None. The official integration is an Ideas discussion because DeepSeek Harness currently declines external pull requests; the template integration uses a normal PR.

## Non-Functional Requirements

- Validation coverage: Determinism, identity, isolation, security, performance budget, cleanup, adapter boundaries, observer coverage, portability, usability, offline execution and schema stability have unit, integration or E2E task coverage.
- Gaps: Network and canary egress are capability-aware in v0.1 and cannot be claimed when unavailable. This is an explicit supported state, not a hidden test gap.
- Adoption validation: Scaffold safety/idempotence, Skill routing/size, optional runtime registration, CLI compatibility, packed consumption and real-host discovery have focused T008 coverage. T009 adds a structurally distinct nested-plugin pilot; five independent external adopters remain a post-release field metric.

## T009 Risk Check

- Critical/High findings: None.
- Medium: Automatic Git-root discovery can widen the write boundary. TDR-024 requires the nearest real non-symlink marker, plugin containment and an explicit override; cross-root writes remain one transaction.
- Medium: A volunteer's repositories do not establish market demand. The pilot is classified only as technical compatibility evidence and receives a fixed two-plugin scope.
- Low: The partner has not yet confirmed deterministic exercise expectations. Scaffold and boot/register evidence can proceed; named capability claims wait for maintainer confirmation.

## Findings

### Low: Real DSH E2E depends on npm and Docker availability

- Location: T003 validation.
- Impact: External infrastructure can fail independently of product behavior.
- Recommended action: Keep fake-DSH integration tests deterministic and classify real-host download failures as infrastructure errors.

### Low: DSH tool APIs remain release-candidate contracts

- Location: TDR-015 and TDR-016.
- Impact: A future DSH release can require a peer range, tool-schema or Cordis adapter update.
- Recommended action: Keep the supported-version registry explicit and require one real-host bundle case for each added DSH version.

### Low: Universal Agent discovery is outside repository control

- Location: TDR-022 and T008 external distribution.
- Impact: Shipping a valid Skill does not make every coding Agent load it unless the project, template or official guidance exposes the Skill directory.
- Recommended action: Treat project scaffold, DSH runtime registration and upstream/template placement as separate measured surfaces; do not claim automatic universal discovery.

## Execute Gate

- Result: Clear.
- Reason: No unresolved Critical or High finding; confirmed requirements, TDR, work graph and packets are complete.
