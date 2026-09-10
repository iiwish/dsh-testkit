# DSH Testkit v0.4.4 Release Report

Version: v0.4.4
Status: Published
Decision: Distribution verified; T023 user acceptance pending
Release channel: Public preview
Last updated: 2026-09-10

## Release Scope

Reviewed maintenance adds exact DSH `0.1.5-rc.1` support, suppresses desktop auto-open in isolated web probes, updates Playwright Core to `1.63.0`, coordinates Vitest/coverage `5.0.0` with sequential lifecycle suites and retained coverage thresholds, and aligns pnpm setup `6.1.0` Action pins. Default DSH `0.1.1-rc.2`, v1 schemas, stable exit codes and Docker isolation are unchanged.

The user explicitly authorizes npm `0.4.4`, GitHub Release/tag and Action `v0` after all checks pass. T023 owns release execution. No additional runtime or dependency changes are included in release preparation.

## Verification

Release commit `acc50b4dc307dbd40e621832329aaeac34614e90` passes [exact-main CI](https://github.com/iiwish/dsh-testkit/actions/runs/34470042570), all 21 jobs and CodeQL. Local validation passes 281 tests with unchanged coverage thresholds. All 5,190 candidate evidence file entries independently match a fresh safety-policy replay; desktop/mobile native draft screenshots are verified. Receipts are recorded in [T023 evidence](../evidence/T023/test-results.md).

## Distribution Gate

[Trusted publication](https://github.com/iiwish/dsh-testkit/actions/runs/34471034598), npm `0.4.4`, immutable `v0.4.4`, [GitHub Release](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.4) and leased Action `v0` identify the same release commit. All 151 public package files match the validated build. Public registry signatures and provenance verify. [Published CLI and released Action verification](https://github.com/iiwish/dsh-testkit/actions/runs/34472073465/attempts/2) passes against DSH `0.1.5-rc.1` after an initial transient registry CDN 404 expires.

## Residual Risk

This is a public preview, not security certification or arbitrary-plugin UI coverage. External-template testing does not establish ongoing maintainer adoption. Model execution is not tested. The Codex natural-scheduler follow-up is paused at the user's request; GitHub scheduling is independent, and its first post-T015 receipt remains unverified.

Production audit reports zero known vulnerabilities. Development Vitest/coverage maintenance is merged; release preparation does not refresh dependencies.
