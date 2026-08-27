# T011 Test Results

## RED

The focused pre-implementation command failed as expected because the scenario did not accept `browser`, the browser smoke module did not exist, and `timeouts.overallMs` was absent.

```text
pnpm vitest run tests/unit/scenario.test.ts tests/unit/browser-smoke.test.ts tests/unit/runner.test.ts
```

## GREEN

Focused scenario, browser, runner and lifecycle tests passed. The broader local validation completed with 24 test files and 145 tests, including browser `unsupported`, selected-text pass/fail, Docker-only selection, host classification and existing HTTP/headless compatibility.

```text
pnpm validate
Test Files 24 passed (24)
Tests 145 passed (145)
```

## Real-host attempt

The targeted Docker fixture reached the attempt-wide 600000 ms watchdog while the cold runner image was still downloading Debian Chromium dependencies. It returned exit code 3 with `classified as host/infrastructure`; `docker ps -a --filter name=dsh-testkit-` was empty afterward. This validates the hang boundary but does not count as the browser fixture pass; protected CI remains the required real-browser evidence.
