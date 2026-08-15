# T005 Test Results

Date: 2026-08-15

## RED

`pnpm test -- tests/integration/worker.test.ts tests/integration/cli.test.ts tests/unit/action-identity.test.ts tests/contracts/v1-compatibility.test.ts`

Result: Expected failure. Five focused assertions failed because case selection, report case identity, DSH support gating and Action identity were absent; the Action identity module did not exist.

Hosted matrix RED: CI run `31878604087` proved unique artifacts and checks, while the Docker boot-failure job exposed an undeclared partial `evidence/probe-boot.json` and failed with exit code 3.

## GREEN

- `pnpm validate`: passed, 13 files and 76 tests.
- Coverage: 51.09% statements, 75.70% branches, 54.76% functions, 51.09% lines.
- `pnpm test:e2e`: passed, 7 real DSH cases in 285.284 seconds.
- Targeted Docker regression: passed in 91.016 seconds and retained `evidence/probe-boot.json` in both stage and report artifact declarations.
- `pnpm test:pack`: passed for `dsh-testkit-0.1.2.tgz` and its Docker image.
- `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.12`: passed.
- `pnpm dlx publint@latest`: passed with publint v0.3.23.
- `pnpm audit --registry https://registry.npmjs.org/`: no known vulnerabilities.
- `pnpm audit --prod --registry https://registry.npmjs.org/`: no known vulnerabilities.

## Pending Public Gates

- Hosted pull-request CI and two-plugin composite Action matrix.
- npm trusted-publisher configuration for `release.yml` and environment `npm`.
- `v0.1.2` tag workflow, npm provenance and public package verification.
