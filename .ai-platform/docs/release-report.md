# DSH Testkit v0.4.1 Release Report

Version: v0.4.1
Status: Published
Decision: GO
Release channel: Public preview
Last updated: 2026-08-31

## Release Scope

DSH Testkit v0.4.1 adds worker-owned source dependency restoration, read-only generated CI, coordinated rc.8 tool contracts, complete compatibility Action smoke, official-release/npm canary classification, and immutable design-partner rerun gates. Scenario schema v1, report schema v1, exit-code meanings, and Docker-default isolation remain unchanged.

T013 is the accepted v0.4.1 scope. T010 through T012 remain accepted v0.4.0 history. T000 through T009 retain their recorded historical states.

## Review Decision

Maintainer review found one P2 before publication: mutable `packageManager` tags were accepted and an explicit npm version was not guaranteed. The release candidate rejects non-semver manager versions and dispatches explicit npm, pnpm, and Yarn versions through Corepack. RED/GREEN unit coverage and the real Docker prepare fixture pass after the fix. No P0 through P3 finding remains.

The accepted implementation is published from protected-main commit `6725fd40d5e25333b05ce6131d0c7f1e6c9aab41`. Required and compatibility CI, CodeQL, trusted npm publication, public installation and provenance verification all pass.

## Release Evidence

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

## Published Identities

- Release PR: [#31](https://github.com/iiwish/dsh-testkit/pull/31), candidate CI [33351739325](https://github.com/iiwish/dsh-testkit/actions/runs/33351739325), CodeQL [33351737788](https://github.com/iiwish/dsh-testkit/actions/runs/33351737788).
- Protected-main commit: `6725fd40d5e25333b05ce6131d0c7f1e6c9aab41`; main CI [33352221017](https://github.com/iiwish/dsh-testkit/actions/runs/33352221017) and CodeQL [33352221601](https://github.com/iiwish/dsh-testkit/actions/runs/33352221601) passed.
- Immutable tag: `v0.4.1`; stable moving tag: `v0`; both resolve to the protected-main commit.
- Trusted publication: [workflow 33352703674](https://github.com/iiwish/dsh-testkit/actions/runs/33352703674) passed validation, real-host, native-bundle, packed-consumer, publish and registry verification.
- npm: `dsh-testkit@0.4.1` is `latest`; integrity `sha512-TmltTUQSCp+AjlBSnJCRA6hpUPwRGmV0LagqUtFE6JMvQ/UmKi94T2FyunBnrDj2/SeR7lNKuh7U01KNM4psLg==`; shasum `5b00611c1cccfe13110cc1cb1612ff4071b91ddd`.
- GitHub Release: [DSH Testkit v0.4.1](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.1).
- npm exposes both the publish attestation and SLSA provenance for the public artifact; clean public execution reports `0.4.1`.

## Residual Risk

DSH `0.1.2-alpha.2` creates new credential/fallback profile paths and changes the observed TurnStatus transition. Testkit records these as unsupported canary differences rather than normalizing them into the stable adapter. Cold arm64 image builds can exceed the ten-minute attempt budget while Chromium packages download; the watchdog classifies this as infrastructure and removes owned containers.
