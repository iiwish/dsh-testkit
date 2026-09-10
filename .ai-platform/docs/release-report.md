# DSH Testkit v0.4.4 Release Report

Version: v0.4.4
Status: Preparing
Decision: User-authorized publication after mandatory gates
Release channel: Public preview
Last updated: 2026-09-10

## Release Scope

Reviewed maintenance adds exact DSH `0.1.5-rc.1` support, suppresses desktop auto-open in isolated web probes, updates Playwright Core to `1.63.0`, coordinates Vitest/coverage `5.0.0` with sequential lifecycle suites and retained coverage thresholds, and aligns pnpm setup `6.1.0` Action pins. Default DSH `0.1.1-rc.2`, v1 schemas, stable exit codes and Docker isolation are unchanged.

The user explicitly authorizes npm `0.4.4`, GitHub Release/tag and Action `v0` after all checks pass. T023 owns release execution. No additional runtime or dependency changes are included in release preparation.

## Verification

Version identity RED verification detects all three expected manifest, CLI and runner-image mismatches. Full release-candidate and exact-main gates must pass. Receipts are recorded in [T023 evidence](../evidence/T023/test-results.md).

## Distribution Gate

Trusted publication, registry identity/provenance and public consumer/Action execution against DSH `0.1.5-rc.1` must pass before distribution is reported complete. The immutable release tag and leased Action `v0` target must identify the same verified commit.

## Residual Risk

This is a public preview, not security certification or arbitrary-plugin UI coverage. External-template testing does not establish ongoing maintainer adoption. Model execution is not tested. The Codex natural-scheduler follow-up is paused at the user's request; GitHub scheduling is independent, and its first post-T015 receipt remains unverified.

Publication is pending the mandatory gates. Development Vitest/coverage maintenance is merged; release preparation does not refresh dependencies.
