# T003 Test Results

Date: 2026-08-15

## RED

Command:

```bash
pnpm test:e2e
```

Result: Failed as expected when the five fixture classes, real-host test assets, report output and distribution files did not exist.

## GREEN

Command:

```bash
pnpm test:e2e
```

Result: Passed 5 of 5 real-host cases against `@deepseek-ai/dsh@0.1.0-rc.6` in 227.35 seconds.

| Case | Result | Duration |
|---|---|---:|
| Healthy install, exercise, update, uninstall and reboot | Passed | 44.24 s |
| Declared boot failure and profile recovery | Passed | 46.83 s |
| Missing tool registration | Failed at `register` as intended | 41.29 s |
| DSH-home and workspace residue | Failed at `uninstall` as intended | 49.11 s |
| Live process and port observer | Passed with evidence | 45.89 s |

## Final Validation

- `pnpm validate`: passed typecheck, build, 9 files and 41 tests.
- `pnpm test:pack`: passed clean consumer install and Docker build from `dsh-testkit-0.1.0.tgz`.
- Package dry run: 101 entries, 71,939 bytes packed, 330,505 bytes unpacked; runner lock, Docker ignore and both JSON schemas included.
- Default Docker quick suite: passed on Linux arm64, Node v22.23.2, pnpm 11.1.3, image `sha256:05f4ebb9e6796102899421c651e5ff306c90f822fb1096ee87c0542b7609dfad`.
- Docker cleanup: owned root removed, no process or listener beyond baseline, no active Testkit container.
- Scenario snapshot digest matched `report.scenario.digest`; DSH package-tree integrity was `sha256:2a6fc6f9c83466349ee1974cda50008ee964041055fed19a397279f22238081e`.
- `pnpm audit --prod --registry https://registry.npmjs.org`: no known vulnerabilities.
- Action, workflow and example YAML parsed successfully.

## Delivery Validation

`validate_delivery_artifacts.py --root . --feature-id lifecycle-runner` passed with all three governed tasks and their evidence bundles present. Public field metrics and publication remain outside this local verification.
