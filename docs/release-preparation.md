# v0.4.4 Release Gate

Published baseline: `dsh-testkit@0.4.4`, immutable `v0.4.4` and Action `v0` at `acc50b4dc307dbd40e621832329aaeac34614e90`. Publication is explicitly user-authorized on 2026-09-10 and all mandatory distribution gates pass. T023 owns execution and distribution receipts; final user acceptance is pending.

## Scope

The release includes exact DSH `0.1.5-rc.1` support, isolated web probes without desktop auto-open, Playwright Core `1.63.0`, coordinated Vitest/coverage `5.0.0` and pnpm setup `6.1.0` pins. The default host remains `0.1.1-rc.2`; v1 schemas and exit codes are unchanged. Alpha hosts remain canary-only.

The independent browser harness is repository test infrastructure, not a new public scenario mode. Its named contract is native onboarding and an unsent editor draft, not arbitrary plugin UI coverage or model execution.

## Publication Gate

1. Merged maintenance PRs #44 and #46 through #50 are the release inputs. T023 owns execution and final receipts.
2. Align package/runtime versions, bilingual README, changelog and package contents at `0.4.4` in a reviewed release PR.
3. Require clean install, full supported-host and positive/negative Action matrix, installed tarball execution, native bundle acceptance, and all evidence safety checks at that exact release commit.
4. Use the existing protected trusted-publishing workflow. Verify npm tarball identity, provenance and package contents, immutable release tag, GitHub Release, and `v0` Action target after publication.
5. Re-run the published consumer and Action entry points against DSH `0.1.5-rc.1`. Source-commit tests and an unpublished tarball are preparation evidence, not proof of registry distribution.

Release operations must not bypass failed checks or combine unrelated dependency upgrades. This release retains the tested dependency graph. Paused automations stay paused. External repository writes are outside this release.

## References

- [Published release and verification](../.ai-platform/docs/release-report.md)
- [Release changes](../CHANGELOG.md)
- [T023 plan](../.ai-platform/specs/lifecycle-runner/t023-plan.md)
- [Monitoring operations](monitoring-operations.md)
