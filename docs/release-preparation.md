# v0.4.3 Release Gate

Published baseline: `dsh-testkit@0.4.2` and Action `v0`.
Candidate: `dsh-testkit@0.4.3`. Publication is user-authorized on 2026-09-09, conditional on all mandatory checks.

## Scope

The release includes accepted T015/T016 delivery: exact DSH `0.1.2-rc.1` support, shared fail-closed evidence staging, complete Release Watch summaries, an isolated external-template adoption check, and independent visible-host browser acceptance. The default host remains `0.1.1-rc.2`; v1 schemas and exit codes are unchanged. Alpha hosts remain canary-only.

The independent browser harness is repository test infrastructure, not a new public scenario mode. Its named contract is native onboarding and an unsent editor draft, not arbitrary plugin UI coverage or model execution.

## Publication Gate

1. T015/T016 are accepted and `0.4.3` publication is explicitly authorized. T017 owns execution and final receipts.
2. Align package/runtime versions, bilingual README, changelog and package contents at `0.4.3` in a reviewed release PR.
3. Require clean install, full supported-host and positive/negative Action matrix, installed tarball execution, native bundle acceptance, and all evidence safety checks at that exact release commit.
4. Use the existing protected trusted-publishing workflow. Verify npm tarball identity, provenance and package contents, immutable release tag, GitHub Release, and `v0` Action target after publication.
5. Re-run the published consumer and Action entry points. Source-commit tests and an unpublished tarball are preparation evidence, not proof of registry distribution.

Release operations must not bypass failed checks or combine unrelated dependency upgrades. PR #35 is closed as an optional type-major update with unrelated lockfile changes; this release retains the tested dependencies. Paused automations stay paused. External repository writes are outside this release.

## References

- [Unreleased changes](../CHANGELOG.md)
- [T017 plan](../.ai-platform/specs/lifecycle-runner/t017-plan.md)
- [Monitoring operations](monitoring-operations.md)
