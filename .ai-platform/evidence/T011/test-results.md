# T011 Test Results

## RED

The focused pre-implementation command failed as expected because the scenario did not accept `browser`, the browser smoke module did not exist, and `timeouts.overallMs` was absent.

```text
pnpm vitest run tests/unit/scenario.test.ts tests/unit/browser-smoke.test.ts tests/unit/runner.test.ts
```

## GREEN

Focused scenario, browser, runner and lifecycle tests passed. The broader local validation completed with 25 test files and 148 tests, including browser `unsupported`, selected-text pass/fail, exact scoped client identity, Docker-only selection, host classification and existing HTTP/headless compatibility.

```text
pnpm validate
Test Files 25 passed (25)
Tests 148 passed (148)
```

## Maintainer re-review regression

The production-adapter regression initially rejected an unavailable browser runner with `StageFailure: 1 runtime registration assertion(s) failed instead of resolving`. After narrowing registration failures to assertions whose status is exactly `failed`, the real adapter preserves the browser assertion as `unsupported`.

```text
pnpm vitest run tests/unit/npm-adapter.test.ts tests/unit/browser-smoke.test.ts tests/integration/worker.test.ts tests/unit/lifecycle.test.ts
Test Files 4 passed (4)
Tests 32 passed (32)
```

## Real-host evidence

Protected GitHub CI run [33061801560](https://github.com/iiwish/dsh-testkit/actions/runs/33061801560) passed `real-host` on DSH `0.1.1-rc.2` and `real-host-compat` on `0.1.0-rc.6`, `0.1.0-rc.7`, and `0.1.0-rc.8`. These jobs exercised the packaged CLI, explicit web fixture, real DSH web host, Chromium assertion, and uninstall cleanup.

The separate local Docker attempt reached the attempt-wide 600000 ms watchdog while its cold runner image was still downloading Debian Chromium dependencies. It returned exit code 3 with `classified as host/infrastructure`; `docker ps -a --filter name=dsh-testkit-` was empty afterward. This validates the hang boundary without being counted as the browser fixture pass.
