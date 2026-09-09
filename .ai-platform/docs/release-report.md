# DSH Testkit v0.4.3 Release Report

Version: v0.4.3
Status: Published
Decision: Distribution verified; T017 user acceptance pending
Release channel: Public preview
Last updated: 2026-09-09

## Release Scope

Accepted T015/T016 delivery adds exact DSH `0.1.2-rc.1` formal support, shared fail-closed artifact/JUnit evidence policy, complete Release Watch summaries, pinned external-template CLI/Action acceptance and independent desktop/mobile native onboarding/draft checks. Default DSH `0.1.1-rc.2`, v1 schemas, stable exit codes and Docker isolation are unchanged. The repository and generated runner lock pin transitive `js-yaml` to `4.3.2` for GHSA-2883-xcg3-v3hh; all other dependency identities are unchanged.

The user explicitly authorized npm `0.4.3`, GitHub Release/tag and Action `v0` after all checks pass. T017 owns release execution. PR #35 is closed as an optional out-of-scope type-major update, not merged or reported as a failing build.

## Verification

Release commit `b6d2da02f01e0fed038fe8e75f943a218a4063fa` passes [main CI 34304815739](https://github.com/iiwish/dsh-testkit/actions/runs/34304815739), all 18 jobs and CodeQL. Local validation passes 230 tests. All 17 candidate artifacts were independently rescanned, including five supported-host packed consumers and actual desktop/mobile native-editor screenshots. Exact publication, package identity and signature receipts are recorded in [T017 evidence](../evidence/T017/test-results.md).

## Distribution Gate

Published baseline is `0.4.3`. [Trusted publication](https://github.com/iiwish/dsh-testkit/actions/runs/34305470862), immutable `v0.4.3`, the [GitHub Release](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.3) and Action `v0` identify the release commit. All 151 public package entries match the validated local tarball byte-for-byte; public signatures and provenance verify. [Public CLI and released Action verification](https://github.com/iiwish/dsh-testkit/actions/runs/34306204816) passes against DSH `0.1.2-rc.1`, with both downloaded evidence manifests independently verified.

## Residual Risk

This is a public preview, not security certification or arbitrary-plugin UI coverage. External-template testing does not establish ongoing maintainer adoption. Model execution is not tested. The Codex natural-scheduler follow-up is paused at the user's request; GitHub scheduling is independent, and its first post-T015 receipt remains unverified.

Production dependency audit is clean. Two moderate development-only Vitest/mocker findings remain; Dependabot PR #44 requires a coordinated Vitest/coverage migration and is not merged. ATTW crashes internally; strict clean-consumer TypeScript compilation, ESM import and publint pass instead.
