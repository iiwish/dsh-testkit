# DSH Lifecycle Runner Feature Specification

Version: v0.1
Status: Confirmed
Last updated: 2026-08-15
Product contract: `.ai-platform/docs/product-design.md`

## Feature Purpose

The lifecycle runner is the first DSH Testkit release slice. It turns a plugin source and exact DSH version into isolated, reproducible install-to-recovery evidence without using a model.

## Requirement Authority

- User stories: `US-001` through `US-005` in Product Design.
- Functional requirements: `FR-001` through `FR-018` in Product Design.
- Non-functional requirements: `NFR-001` through `NFR-012` in Product Design.
- Success criteria: `SC-001` through `SC-010` in Product Design.
- Acceptance criteria: Product Design section 13.

This feature specification does not redefine those requirements. The Product Design is authoritative when wording differs.

## Feature Scope

- Publishable `dsh-test` CLI.
- Docker-default and explicit unsafe-local runners.
- Exact npm DSH adapter and real Cordis runtime probe.
- Ordered lifecycle stages, conditional update and recovery.
- Capability-aware file, process, port, network and canary observation.
- Canonical JSON plus JUnit, Markdown and terminal projections.
- Healthy and intentionally broken fixtures, real DSH E2E and GitHub Action.

## Feature Non-Goals

- Plugin marketplace or Catalog control plane.
- Cross-Harness conformance.
- Model or Skill quality evaluation.
- General static security scanning.
- Public release or npm publication without a later explicit user approval.

## Planning Sources

- Requirements checklist: `.ai-platform/specs/lifecycle-runner/checklists/requirements.md`
- TDR: `.ai-platform/docs/technology-decision-record.md`
- Plan: `.ai-platform/specs/lifecycle-runner/plan.md`
- Work graph: `.ai-platform/specs/lifecycle-runner/tasks.md`
- Analysis: `.ai-platform/specs/lifecycle-runner/analysis.md`
