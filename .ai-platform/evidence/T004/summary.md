# T004 Release Hardening Evidence Summary

Task: T004
Status: Needs_Review
Date: 2026-08-15
Implementation commit: `5cb66b6`
Decision: GO for public preview

## Scope Completed

- Resolved RA-001 through RA-012 without weakening lifecycle assertions.
- Added content-aware residue attribution and deterministic system observers.
- Added working Docker tarball mounts and content-addressed, label-verified runner images.
- Added exact update-target and post-update assembly/runtime assertions.
- Added full-suite five-attempt execution, canonical semantic digests, flaky classification and repeatability report projections.
- Added immutable GitHub Action pins, release metadata, coverage gates and community health files.
- Created the immutable local implementation commit on `codex/release-hardening`.

## Primary Changed Surfaces

- Lifecycle and observers: `src/adapters/dsh/npm-adapter.ts`, `src/observers/snapshot.ts`, `src/worker/**`.
- Repeatability and contracts: `src/cli.ts`, `src/domain/repeatability.ts`, `src/domain/report.ts`, reporters and report schemas.
- Runner identity: `src/runners/docker.ts`, `assets/runner.Dockerfile`, runner lock.
- Regressions: unit/integration tests, six real-host fixtures and packed-consumer smoke.
- Distribution: `package.json`, README, Action/workflow, `SECURITY.md`, `CHANGELOG.md`, issue and PR templates.
- Governance: T004 packet, canonical TDR/CLI/data-model documents and release acceptance evidence.

## Reviews

- Spec compliance: Passed. Full/flaky, tarball, update, cleanup, identity and report contracts are executable.
- Bug and code quality: Passed. No open P0, P1 or P2 finding remains.
- QA acceptance: Passed. Real DSH, default Docker, clean Linux, packed consumer and static CI checks are green.
- Release acceptance: GO for public preview. Publication itself remains a separate user-controlled operation.

## Residual Risks

- Docker is a practical default boundary, not a hardened malware sandbox.
- Network tracing remains unsupported in v0.1 and produces `unsupported` when required.
- GitHub-hosted Action execution begins after the public repository exists; local structural and package integration gates pass.
- Whole-source statement coverage is 49.70% because the large adapter and Docker transport execute in child processes; real-host E2E is the primary behavior proof for those paths.
- Public field criteria require adoption and do not block the initial preview.
