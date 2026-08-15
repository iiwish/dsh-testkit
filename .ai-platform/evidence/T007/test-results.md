# T007 Test Results

Last updated: 2026-08-15

## RED

`pnpm vitest run tests/contracts/documentation.test.ts tests/unit/community-validation.test.ts tests/unit/dsh-release-train.test.ts tests/contracts/dsh-bundle.test.ts`

- Failed because `README.zh-CN.md`, the community validation module and the DSH release-train module did not exist.
- Failed because package and bundle metadata still reported `0.2.0` and the changelog had no v0.2.1 entry.

## GREEN

- Focused contracts: 4 files and 9 tests passed after the first implementation; the release-train suite later expanded to 4 tests and stayed green.
- `pnpm validate`: passed 19 files and 97 tests, typecheck, published contracts, Action pinning, release readiness, coverage and build.
- Coverage: 55.40% statements, 74.74% branches, 60.62% functions and 55.40% lines; community validation is 100% covered and release-train discovery has 100% statement/function/line coverage.
- `pnpm test:e2e`: passed 8 real DSH lifecycle cases against `0.1.0-rc.6` in 389.071 seconds.
- `pnpm test:bundle-e2e`: passed real profile install, registration, `dsh_test` invocation, Docker lifecycle and removal in 81.972 seconds.
- `pnpm test:pack`: passed for `dsh-testkit-0.2.1.tgz`, including both README files, both CLIs, warning-free optional peers, root imports, declarations and Docker image construction.
- `publint v0.3.23`: passed.
- `actionlint v1.7.12`: passed for all workflows, including DSH release watch.
- `pnpm audit --prod --registry https://registry.npmjs.org/`: no known vulnerabilities.
- `npm pack --dry-run --json`: passed; version 0.2.1, bilingual docs, community CLI and compiled release/community modules are present.

## Community Cohort

- Ten exact npm versions completed sequential Docker quick suites with Testkit 0.2.1 and DSH `0.1.0-rc.6`.
- Aggregate reconciliation: cohort size 10; passed 2; failed 8; first failure stage boot 5 and uninstall 3.
- Public JSON and Markdown contain no plugin identity. Named reports and controller logs remain local at `/tmp/dsh-testkit-community-v0.2.1-20260815/.private` or the original pre-hardening `private` directory.
- Environment fingerprint: Docker/Linux arm64, Node.js 22.23.2, pnpm 11.1.3, runner image `dsh-testkit-runner:0.2.1-b88cac3d08b2`.

## DSH Release Train

- Current fixture: `latest` and `next` deduplicate to supported `0.1.0-rc.6`, with no canary.
- Candidate fixture: unseen `0.1.0-rc.7` becomes one canary input.
- Disposable source test: AST-based enablement adds rc.7 only to a temporary support file and leaves the committed registry unchanged.
- Live npm metadata on 2026-08-15: `latest`/`next` resolve only to supported `0.1.0-rc.6`; no hosted candidate run is currently required.

## Hosted And Public Acceptance

- Pending protected-branch PR and hosted CI.
- Pending merge commit, `v0.2.1`, moving `v0`, GitHub Release and npm trusted publication/provenance.
- Pending cold public install and native DSH profile verification of the published artifact.
