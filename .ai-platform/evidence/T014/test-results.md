# T014 Verification

Environment: macOS arm64, Node `24.15.0`, project pnpm `11.1.3`, Docker `29.4.0`.

## RED

- Canary CI contract: 1 new test failed because independent lanes and failure artifact upload were absent.
- Runtime baseline contract: 2 new tests failed because the baseline did not boot and could not reject a host boot failure.
- Browser auth/private evidence: 2 new tests failed because the private handoff did not exist.
- Launch-token redaction: 1 new test failed because a crashing host's URL exposed its token.
- Real `0.1.2-rc.1` healthy lifecycle reproduced uninstall failure with `profiles/dsh-testkit/.dsh-module-fallback/`, its `node_modules/` directory and `storages/` as unexplained additions. Report retained locally at `/tmp/dsh-t014-red/dsh-testkit-e2e-healthy-plugin-jCtv8w/report.json`. The remaining RED suite was interrupted after reproduction; its partial execution is not a complete matrix result.

## GREEN

- Final `pnpm validate`: passed with zod `4.5.4` and Cordis `4.0.2`; 26 files / 172 tests, including the existing-baseline credential modification regression, coverage, published contracts, Action pins, release readiness, typecheck and build.
- Focused documentation/browser/CI contracts: 14 passed.
- `pnpm typecheck`: passed after native-bundle log retention changes.
- `git diff --check`: passed.
- Actionlint `v1.7.7`: passed. The initial lint caught a `runner.temp` expression at job-env scope; the final workflow uses step-env scope.
- Real `0.1.2-rc.1` focused E2E: 2 passed / 9 intentionally unselected, 602.2 seconds total. Healthy install/boot/exercise/update/uninstall/reboot passed. The host-filename negative case failed its lifecycle as expected and retained both marker paths. Evidence root: `/tmp/dsh-t014-green-rc1/`.

## Infrastructure And Incomplete Runs

- Docker browser E2E: failed before lifecycle execution when the cold Debian image build exceeded the 600000ms attempt watchdog. No browser verdict exists. Controller build logs are retained in `/tmp/dsh-t014-green-rc1/dsh-testkit-e2e-web-status-plugin-MPMuHV/logs/`.
- `pnpm test:pack`: all sequential checks preceding its Docker build completed, including clean install, optional-peer absence, CLI help, API import, published artifacts and scaffold. The Docker build was canceled after confirming the same cold-image network bottleneck; the overall test did not pass.

## Pending

- Real-host candidate and supported-host regressions.
- Native-bundle and packaged-consumer evidence.

## Linux CI Iteration

- PR #37 CI run `34184903651` at `1dc5c59`: all 14 jobs passed, including real-host lifecycle, native bundle and packaged consumer for all four supported versions, plus positive and negative Action smoke matrices.
- Release Watch run `34184752917` at `3c1aa60`: all six candidate bundle lanes passed. Each lifecycle lane failed the browser fixture with HTTP 401; other fixture results and artifacts were retained. The public `browser-boot.json` for `0.1.2-rc.1` proves navigation reached the host, not a local image-build timeout.
- Browser probe patch declares `inject: [connection]` so the host loader activates it only after the asynchronous authentication provider is ready. Non-browser probes retain their existing dependency-free behavior. Focused patch tests cover both cases; `pnpm validate` passes 174 tests. Linux reruns are required for this correction.
- Artifact review of the next run found launch URLs in `ps` snapshots of the host browser-opener process. Process and port evidence now use the same secret sanitizer as command logs, before persistence and residue reporting. A focused regression failed with raw launcher/canary credentials before the fix; `pnpm validate` passes 175 tests after the fix. Browser E2E also scans every declared text artifact for unredacted launch URLs without printing secret values on failure.
- The 12 lifecycle archives from runs `34184752917` and `34185395643` were deleted after identifying the snapshot exposure. These were ephemeral tokens for terminated loopback-only test hosts; no durable host credential files were uploaded. Replacement sanitized artifacts are required from the final rerun.

The canonical build overwrote disposable local canary activation after the focused worker processes had started. No new host is enabled in source or claimed supported. PR #37 is open; merge, release and user acceptance are pending.

## Dependency Security

- GitHub reported four open advisories against development-only `fast-uri@3.1.5` through AJV. The lockfile pins `3.1.7`, above the reported fixed floor `3.1.6`; unrelated transitive resolutions are unchanged.
- `pnpm validate`: 26 files / 172 tests passed with the security update.
- `pnpm audit --audit-level high --registry https://registry.npmjs.org`: no known vulnerabilities. The configured mirror has no audit endpoint, so the audit used the official npm registry.
