# T016 Adoption And Release Readiness

Status: Running
Executor: Codex, direct execution; no delegation authorized.
Base: `59773eae27043154945954f6e03938218d8d9021`
Branch: `feat/t016-adoption-readiness`
Approval: User approved all four next-stage items and this repository's PR/merge after validation. No npm publication, release tags or external repository writes.

## Implementation Scope

- Installed-tarball consumer and read-only Action acceptance against a pinned external template copy.
- Separate test-only real-web onboarding/editor acceptance, without changing the public smoke or injecting status DOM.
- Unreleased notes, release gate, and scheduled-monitor ownership/freshness/failure runbook.
- T015 acceptance and current task index.

## Validation

Focused RED: New browser module was absent and the adoption CI job was absent; both test suites failed as expected.
Focused GREEN: 4 tests passed after implementation.
Initial full validation exposed an omitted explicit `include-hidden-files: false` on the new upload. The existing safety contract failed and the upload was corrected rather than weakening the test.
Actionlint 1.7.12 passes the CI workflow.

Linux real-host, external consumer/Action and visual review are required before merge; results belong in `test-results.md`.

## Review Boundaries

- External validation is a technical rehearsal, not confirmed maintainer adoption.
- The intentional failure is an invalid Testkit row expectation, not an upstream plugin defect.
- Browser coverage is native onboarding and an unsent editor draft, not model response quality or arbitrary plugin UI.
- The 2026-09-08 natural schedule success predates T015. A post-T015 scheduled event needs its own receipt.
- T016 user acceptance and publication remain separate gates.
