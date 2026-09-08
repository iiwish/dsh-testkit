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

The canonical build overwrote disposable local canary activation after the focused worker processes had started. No new host is enabled in source or claimed supported. No GitHub push, PR creation, merge or release has occurred.
