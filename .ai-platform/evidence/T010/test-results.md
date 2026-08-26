# T010 Test Results

## RED

Command:

```text
pnpm vitest run tests/unit/scenario.test.ts tests/unit/http-routes.test.ts tests/integration/cli.test.ts
```

Expected failures occurred before implementation:

- `ScenarioSchema` rejected the new `http` key as unrecognized.
- The HTTP helper module did not exist.
- The CLI could not classify HTTP route configuration as Docker-only.

The existing non-route scenario, CLI, scaffold and lifecycle tests continued to pass in this focused run.

## GREEN

Focused command:

```text
pnpm vitest run tests/unit/scenario.test.ts tests/unit/http-routes.test.ts tests/integration/cli.test.ts tests/integration/worker.test.ts tests/contracts/v1-compatibility.test.ts
```

Result: exit 0, 63 tests passed across six files. The tests cover GET-only parsing, path safety, loopback requests, dynamic subject version matching, digest evidence, nested redaction, bounded response reads, status mismatch, redirect handling, Docker/local selection, registration-stage attribution and boot-failure skipping.

## Refactor and validation

`pnpm test:coverage` passed with 134 tests across 23 files before the final bounded-read assertion; the focused run is green after that assertion. `pnpm typecheck`, `pnpm build`, `pnpm check:contracts`, `pnpm check:actions` and `pnpm check:release` passed. A real Docker route E2E was attempted with `DSH_TESTKIT_DSH_VERSION=0.1.0-rc.6`; the runner image build did not complete in the available environment and was interrupted, so this remains an external validation gap rather than a claimed pass.
