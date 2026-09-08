# T016 Adoption And Release Readiness

Status: Confirmed
Date: 2026-09-08
Approval: User explicitly approved the four-step next-stage plan and requested completion; authorized this repository's PR and merge after validation. External repositories are isolated copies only. Publication is not authorized.

## Scope And Sequence

One sequential task covers US-007/US-008 and the approved browser evidence improvement:

1. Record T015 acceptance and prepare an unreleased delivery checklist and notes. Preserve package version, npm and tags.
2. Pin `bugmaker2/dsh-plugin-template` to `31af7ebeb8d07cff73253f52f9a9f530cde9de9a`. Run installed-package init twice, inspect the generated scenario/workflow/Skill, execute Docker lifecycle, inject an explicitly missing-row expectation, correct that configuration and rerun. Exercise the source Action in this repository's PR. Do not claim an upstream defect or maintainer adoption.
3. Add a separate test-only real-web browser lane. Use the existing lifecycle adapter inside the same restricted Docker image, replace only its internal browser observation callback for this test, and exercise native visible host controls without inserting DOM, suppressing overlays, or writing acknowledgement storage. Preserve public browser smoke and v1 schemas. Capture desktop/mobile screenshots after token-free authentication and explicit UI onboarding, recording the exact tested flow.
4. Verify actual scheduled-run event/SHA/status, document ownership, freshness and failure handling, and track the first post-merge scheduled run if it has not occurred. Do not represent workflow_dispatch as schedule or silently enable privileged notifications.

## Task T016

Status: Ready
Priority: P1
Depends on: T015
Blocks: Publication review
Parallel: No
Conflicts with: Release operations
Allowed files: `.ai-platform/**`, `tests/e2e/**`, `tests/unit/**`, `tests/contracts/**`, `.github/workflows/ci.yml`, `package.json`, `CHANGELOG.md`, `docs/**`, `README.md`, `README.zh-CN.md`.
The evidence and documentation globs cover the single delivery record and related current-state reference pages, not unrelated refactoring.

## Validation And Definition Of Done

- RED/GREEN tests for bounded browser interactions and adoption workflow contracts.
- `pnpm validate`, actionlint, full five-host Linux CI, clean installed consumer and read-only external-subject Action.
- Verify actual screenshots and rescan new evidence manifests; retain intentional negative verdicts.
- Record exact scheduled-event evidence and distinguish completed verification from pending external events.
- Review scope, credential handling, cleanup and public claims before protected merge. User acceptance of T016 remains separate.

## Checklist And Analysis

- Requirements have separate install/adoption, browser, publication and monitoring outcomes.
- No model calls, user credentials, public-schema changes, default-host change, npm publication, release tags or external writes are permitted.
- External scripts execute only in Docker; controller init inspects manifests without running plugin code.
- Browser evidence is independent of injected TurnStatus, and cannot claim full product or arbitrary plugin UI coverage.
- No Critical/High contract conflicts. Natural scheduling and maintainer adoption are external-state gates; only the former is a requested verification outcome, the latter is explicitly not claimed.

Packet: `.ai-platform/specs/lifecycle-runner/packets/T016.yaml`
