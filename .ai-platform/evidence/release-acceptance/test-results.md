# DSH Testkit v0.4.1 Release Acceptance Test Results

Date: 2026-08-31
Result: GO; protected publication and public verification passed

## Repository And Package

| Check | Result |
|---|---|
| Release identity | Local `main`, `origin/main`, `v0.4.1` and `v0` resolve to `6725fd40d5e25333b05ce6131d0c7f1e6c9aab41` at release closeout |
| `git diff --check` | Passed |
| T013 delivery validator | Passed without warnings or errors |
| Frozen install | `CI=1 pnpm install --frozen-lockfile` passed with pnpm 11.1.3 |
| `pnpm validate` | Passed: 25 test files, 159 tests, typecheck, coverage and build |
| Coverage | 63.82% statements, 76.59% branches, 74.79% functions |
| `publint@0.3.23` | Passed with no finding |
| Packed consumer | Passed with `dsh-testkit-0.4.1.tgz` |
| npm publish dry run | Passed: 151 files, 199,843 packed bytes, 845,603 unpacked bytes |
| Package allowlist | Contains runtime assets, schemas, bilingual README and license; contains no tests, fixtures, governance files, workflows or `AGENTS.md` |
| Production audit | No known vulnerability |
| Production licenses | Apache-2.0, ISC, MIT and Python-2.0 |
| Public version check | `dsh-testkit@0.4.1` is public and npm `latest` resolves to `0.4.1` |

## Maintainer Review Regression

RED proved that the pre-review implementation accepted mutable package-manager tags and did not execute explicit npm versions through Corepack:

```text
pnpm vitest run tests/unit/npm-adapter.test.ts
3 failed, 4 passed
```

GREEN rejects `pnpm@latest`, retains inferred lockfile behavior, and dispatches exact npm/pnpm/Yarn identities through Corepack:

```text
pnpm vitest run tests/unit/npm-adapter.test.ts
7 passed
pnpm typecheck
passed
```

The exact `pnpm@10.17.0` prepare fixture passed inside the real Docker worker in 346.473 seconds. The preceding cold attempt expired while the runner image was still installing Chromium and never reached plugin code; the watchdog returned infrastructure exit code 3 and left no owned container.

## Supported Real-Host Evidence

| DSH version | Complete real host | Native bundle |
|---|---:|---:|
| `0.1.1-rc.2` | 11/11 passed | Passed |
| `0.1.0-rc.8` | 11/11 passed | Passed |
| `0.1.0-rc.7` | 11/11 passed | Passed |
| `0.1.0-rc.6` | 11/11 passed | Passed |

The local Composite Action entry passed healthy and expected boot-failure subjects on the default host and all three compatibility hosts. All eight rows returned exit code 0 and produced JSON and JUnit reports. Workflow actionlint and pinned-reference checks pass.

## Release Train And Partner Gates

Live discovery classifies `0.1.2-alpha.1` as waiting for npm and `0.1.2-alpha.2` as a runnable disposable canary. Supported versions remain rc.6, rc.7, rc.8 and rc.2. The alpha.2 real-host canary passed 6 of 11 cases and its native bundle lifecycle report failed, so no alpha support claim exists.

The public registry exposes no `dsh-shelf` package higher than the `0.7.0` baseline, and `@0xsline/dsh-spotlight` remains `0.0.2`. No design-partner rerun was performed.

## Protected Publication Checks

| Check | Result |
|---|---|
| Release PR | [#31](https://github.com/iiwish/dsh-testkit/pull/31) merged as `6725fd40d5e25333b05ce6131d0c7f1e6c9aab41` |
| Candidate CI | [33351739325](https://github.com/iiwish/dsh-testkit/actions/runs/33351739325) passed validation, default real-host, rc.6/rc.7/rc.8 compatibility real-host, and all eight Action smoke rows |
| Candidate CodeQL | [33351737788](https://github.com/iiwish/dsh-testkit/actions/runs/33351737788) passed Actions and JavaScript/TypeScript analysis |
| Protected-main CI | [33352221017](https://github.com/iiwish/dsh-testkit/actions/runs/33352221017) passed the same required and compatibility matrix |
| Protected-main CodeQL | [33352221601](https://github.com/iiwish/dsh-testkit/actions/runs/33352221601) passed Actions and JavaScript/TypeScript analysis |
| Trusted release | [33352703674](https://github.com/iiwish/dsh-testkit/actions/runs/33352703674) passed validation, real-host, native bundle, packed consumer, npm trusted publishing and public verification |
| Public tarball | Integrity `sha512-TmltTUQSCp+AjlBSnJCRA6hpUPwRGmV0LagqUtFE6JMvQ/UmKi94T2FyunBnrDj2/SeR7lNKuh7U01KNM4psLg==`; shasum `5b00611c1cccfe13110cc1cb1612ff4071b91ddd` |
| Public execution | `npm exec --yes --package=dsh-testkit@0.4.1 -- dsh-test --version` returned `0.4.1` |
| Provenance | npm attestations expose both the publish predicate and SLSA provenance; the provenance binds tag `v0.4.1`, workflow `release.yml`, run `33352703674` and commit `6725fd40d5e25333b05ce6131d0c7f1e6c9aab41` |
| Release aliases | `v0.4.1` is immutable; moving tag `v0` targets the same commit; [GitHub Release](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.1) is public |
