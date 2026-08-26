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

`pnpm validate` passed with 134 tests across 23 files. `pnpm typecheck`, `pnpm build`, `pnpm check:contracts`, `pnpm check:actions` and `pnpm check:release` passed. The required GitHub Actions real-host matrix passed for DSH `0.1.0-rc.6`, `0.1.0-rc.7` and `0.1.0-rc.8`; the HTTP fixture registered and asserted status, selected JSON fields and subject version, then completed uninstall and reboot cleanup.
