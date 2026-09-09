# DSH Testkit v0.4.3 Release Report

Version: v0.4.3
Status: Release_Candidate
Decision: Pending validation
Release channel: Public preview
Last updated: 2026-09-09

## Release Scope

Accepted T015/T016 delivery adds exact DSH `0.1.2-rc.1` formal support, shared fail-closed artifact/JUnit evidence policy, complete Release Watch summaries, pinned external-template CLI/Action acceptance and independent desktop/mobile native onboarding/draft checks. Default DSH `0.1.1-rc.2`, v1 schemas, stable exit codes and Docker isolation are unchanged. The repository and generated runner lock pin transitive `js-yaml` to `4.3.2` for GHSA-2883-xcg3-v3hh; all other dependency identities are unchanged.

The user explicitly authorized npm `0.4.3`, GitHub Release/tag and Action `v0` after all checks pass. T017 owns release execution. PR #35 is closed as an optional out-of-scope type-major update, not merged or reported as a failing build.

## Verification

The accepted implementation at `ce90f70ced1e290f2b0f20f45bb85811c2d7ae05` passes [main CI 34215001063](https://github.com/iiwish/dsh-testkit/actions/runs/34215001063), all 18 jobs and CodeQL. T016 records 228 passing tests, independently rescanned artifacts and actual desktop/mobile screenshot review. Candidate-specific validation and publication receipts are recorded in [T017 evidence](../evidence/T017/test-results.md); historical success is not a substitute for the release commit's checks.

## Distribution Gate

Published baseline is `0.4.2`. Candidate publication, immutable `v0.4.3`, the GitHub Release, `v0` movement and public consumer verification remain pending. No public `0.4.3` distribution is claimed at this stage.

## Residual Risk

This is a public preview, not security certification or arbitrary-plugin UI coverage. External-template testing does not establish ongoing maintainer adoption. Model execution is not tested. The Codex natural-scheduler follow-up is paused at the user's request; GitHub scheduling is independent, and its first post-T015 receipt remains unverified.
