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

## Public Gates

- Pull-request CI run `31878982044`: passed validate, real-host, packed-consumer and both composite Action matrix jobs.
- Main CI run `31879201445`: passed validate, 7-case real-host E2E, packed-consumer and both composite Action matrix jobs.
- CodeQL run `31879314348`: passed JavaScript/TypeScript default analysis.
- npm trusted publisher: configured for `iiwish/dsh-testkit`, workflow `release.yml` and environment `npm`.
- Release workflow run `31879424206`: passed full validation and published through GitHub OIDC in 4m30s.
- Public package: `dsh-testkit@0.1.2`, SHA-1 `b54bffab1b1ce41c737f188748f6347f80e775d6`, integrity `sha512-QOVOvzVeCx0Ttj2eUJQi448W7HizCb80MyvFNlq/rpYWphQQs2M4/gK84GPL0B7PYbb3mbJccRlBuWQo4tjHDQ==`.
- Provenance: npm registry exposes SLSA v1 provenance at <https://registry.npmjs.org/-/npm/v1/attestations/dsh-testkit@0.1.2>.
- Cold public consumer: `npm exec --yes --package=dsh-testkit@0.1.2 -- dsh-test --help` passed in a clean temporary directory.
- GitHub Release: <https://github.com/iiwish/dsh-testkit/releases/tag/v0.1.2>.
