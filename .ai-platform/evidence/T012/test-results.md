# T012 Test Results

## RED

The focused pre-implementation command failed as expected because no attempt-wide budget or watchdog cleanup contract existed and DSH failures did not produce the infrastructure verdict.

```text
pnpm vitest run tests/unit/runner.test.ts tests/unit/lifecycle.test.ts tests/integration/cli.test.ts
```

## GREEN

Unit and integration coverage verifies the default/configured budget, Docker force-remove arguments, local timeout error, CLI exit code 3 and `dsh` to `infrastructure_error` verdict mapping. Full validation passed:

```text
pnpm validate
Test Files 24 passed (24)
Tests 146 passed (146)
```

## Watchdog reproduction

The targeted real-Docker browser fixture exceeded 600000 ms during a cold image build and exited with `Global watchdog expired after 600000ms; classified as host/infrastructure`. No `dsh-testkit-*` container remained. `pnpm test:pack` was separately stopped after more than ten minutes of slow shared Docker package downloads and produced no functional failure output.

Protected GitHub CI run [33061801560](https://github.com/iiwish/dsh-testkit/actions/runs/33061801560) passed the normal `real-host` job on DSH `0.1.1-rc.2`, compatibility jobs on `0.1.0-rc.6` through `0.1.0-rc.8`, validation, action smoke, and CodeQL.
