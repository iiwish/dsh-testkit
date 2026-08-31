# DSH Testkit v0.4.1 Release Report

Version: v0.4.1
Status: Release Candidate
Decision: CONDITIONAL_GO
Release channel: Public preview
Last updated: 2026-08-31

## Release Scope

DSH Testkit v0.4.1 adds worker-owned source dependency restoration, read-only generated CI, coordinated rc.8 tool contracts, complete compatibility Action smoke, official-release/npm canary classification, and immutable design-partner rerun gates. Scenario schema v1, report schema v1, exit-code meanings, and Docker-default isolation remain unchanged.

T013 is the accepted v0.4.1 scope. T010 through T012 remain accepted v0.4.0 history. T000 through T009 retain their recorded historical states.

## Review Decision

Maintainer review found one P2 before publication: mutable `packageManager` tags were accepted and an explicit npm version was not guaranteed. The release candidate rejects non-semver manager versions and dispatches explicit npm, pnpm, and Yarn versions through Corepack. RED/GREEN unit coverage and the real Docker prepare fixture pass after the fix. No P0 through P3 finding remains.

The executable candidate is approved. Final `GO` requires the reviewed tree to merge through protected `main`, all required and compatibility CI jobs to pass, and the trusted tag workflow to publish and verify the same immutable commit.

## Candidate Evidence

| Gate | Result |
|---|---|
| Frozen install and validation | Passed: 25 test files, 159 tests, typecheck, coverage and build |
| Package contract | Passed: publint, packed consumer, npm publish dry run, 151-file allowlist |
| Package size | 199,843 bytes packed; 845,603 bytes unpacked |
| Dependency hygiene | Production audit found no known vulnerability; licenses are MIT, ISC, Apache-2.0 and Python-2.0 |
| Supported real host | Passed all 11 cases on DSH rc.2, rc.8, rc.7 and rc.6 |
| Native DSH bundle | Passed on DSH rc.2, rc.8, rc.7 and rc.6 |
| Composite Action | Healthy and expected boot-failure subjects passed on default plus all compatibility hosts |
| Source prepare path | Exact pnpm 10.17.0 fixture passed inside the owned Docker worker |
| Alpha boundary | alpha.1 waits for npm; alpha.2 remains a failing disposable canary; neither is supported |
| Design partners | No immutable package higher than the recorded shelf or spotlight baseline; no rerun performed |
| Artifact governance | T013 validator and diff checks passed |

## Publication Boundary

- The previous public release remains [`v0.4.0`](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.0) and npm `latest` remains `0.4.0` until the trusted workflow succeeds.
- The v0.4.1 tag must point to the reviewed protected-main merge commit.
- The release workflow must pass validation, real-host, native-bundle, packed-consumer, npm trusted publishing, and public-registry verification.
- The stable `v0` moving tag and GitHub Release are updated only after npm publication succeeds.

## Residual Risk

DSH `0.1.2-alpha.2` creates new credential/fallback profile paths and changes the observed TurnStatus transition. Testkit records these as unsupported canary differences rather than normalizing them into the stable adapter. Cold arm64 image builds can exceed the ten-minute attempt budget while Chromium packages download; the watchdog classifies this as infrastructure and removes owned containers.
