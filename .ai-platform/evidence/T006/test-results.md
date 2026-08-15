# T006 Test Results

Last updated: 2026-08-15

## RED

`pnpm test -- tests/unit/dsh-plugin.test.ts tests/contracts/dsh-bundle.test.ts tests/unit/command.test.ts`

- Failed because `src/dsh-plugin.ts` and `cordis.patch.yml` did not exist.
- AbortSignal regression waited for timeout instead of terminating the child process.
- Existing unrelated tests remained green.

## GREEN And Local Acceptance

- `pnpm validate`: passed, 15 files and 85 tests.
- Coverage: 54.07% statements, 74.15% branches, 58.60% functions, 54.07% lines.
- `pnpm test:e2e`: passed, 8 real DSH lifecycle cases in 630.796 seconds.
- `pnpm test:bundle-e2e`: passed, one real DSH bundle/install/tool/Docker/removal case in 152.021 seconds.
- `pnpm test:pack`: passed for the final `dsh-testkit-0.2.0.tgz` candidate after the approval and output-containment refinements.
- `publint v0.3.23`: passed.
- `actionlint v1.7.12`: passed.
- `pnpm audit --prod --registry https://registry.npmjs.org/`: no known vulnerabilities.
- `npm pack --dry-run --json`: passed; bundle patch and compiled plugin entry are included.
- Required-check RED: `tests/contracts/ci-required-checks.test.ts` failed because `real-host` and `action-smoke` used job-level skip conditions.
- Required-check GREEN: the focused contract passed after both jobs retained their identities and moved lifecycle filtering to individual steps.
- `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.12 .github/workflows/ci.yml`: passed for the required-check fix.

## Hosted And Public Acceptance

- [PR #7](https://github.com/iiwish/dsh-testkit/pull/7) merged as `73e6058258564698911f3b1ca92d062647f1b423` after [CI run 31883230903](https://github.com/iiwish/dsh-testkit/actions/runs/31883230903) passed validate, Action smoke and real-host jobs.
- [Main CI run 31883503152](https://github.com/iiwish/dsh-testkit/actions/runs/31883503152) passed validate, both Action smoke jobs, existing real-host lifecycle, native bundle E2E and packed-consumer gates.
- [CodeQL run 31883502999](https://github.com/iiwish/dsh-testkit/actions/runs/31883502999) passed JavaScript/TypeScript analysis and received both DSH lifecycle check runs.
- [Release run 31883743981](https://github.com/iiwish/dsh-testkit/actions/runs/31883743981) passed the complete release gate and published through npm OIDC trusted publishing.
- [`v0.2.0`](https://github.com/iiwish/dsh-testkit/releases/tag/v0.2.0) and moving `v0` dereference to the release commit.
- [`dsh-testkit@0.2.0`](https://www.npmjs.com/package/dsh-testkit/v/0.2.0) has SHA-1 `5db1e8322307decacb3d3b80564f37591a8bb6a8`, integrity `sha512-cDgCYVtCnlR8P6lY4NVUdTZ2DD8LP0FM6qihKwmVH1UW5hZQAcKPRBAq5MZ9+cL5sjxmhs0pl0ZVaIYoXLfIbg==` and a [SLSA v1 attestation](https://registry.npmjs.org/-/npm/v1/attestations/dsh-testkit@0.2.0).
- A clean public-registry install returned CLI version `0.2.0`, exported `createDshTestTool` from the root module, and exposed the expected `dsh.bundle` and peer metadata.
- [awesome-dsh-plugin PR #562](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/562) submits the released bundle to the official community directory.
