# T016 Adoption And Release Readiness

Status: Accepted
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

Implementation `785a37b7a90724037b5baf35184476240c51e124` passes 228 local tests and all 18 Linux CI jobs in run `34213179544`, including five supported hosts, installed external consumer, intentional failure/correction, source Action and independent desktop/mobile interaction. CodeQL passes. Both screenshots were visually inspected. Exact identities and artifact replay receipts are in `test-results.md`.

Spec and code-quality review found no remaining actionable issue: execution stays in owned Docker profiles, external source remains pinned and isolated, negative verdicts remain intact, and public runtime/schema/default-host contracts are unchanged. Test-only browser ownership and asynchronous editor readiness failures have focused regression coverage.

Release preparation is complete. The user accepted continuation of the remaining acceptance/release work on 2026-09-09. The bounded schedule follow-up `dsh` is paused at the user's request; the first post-T015 natural schedule remains an explicitly unverified external event. Publication is governed by T017's separate explicit approval.

## Review Boundaries

- External validation is a technical rehearsal, not confirmed maintainer adoption.
- The intentional failure is an invalid Testkit row expectation, not an upstream plugin defect.
- Browser coverage is native onboarding and an unsent editor draft, not model response quality or arbitrary plugin UI.
- The 2026-09-08 natural schedule success predates T015. A post-T015 scheduled event needs its own receipt.
- T016 user acceptance and publication remain separate gates.
