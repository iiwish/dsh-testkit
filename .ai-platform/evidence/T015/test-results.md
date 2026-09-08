# T015 Verification

Status: In_Progress

## Local Verification

- RED: support/evidence tests failed 23 of 27 cases before implementation (missing rc.1 and missing shared scanner).
- RED: workflow contracts failed 5 of 8 cases before gating and monitoring-summary changes.
- RED: a signature-only PNG was incorrectly accepted before structural screening.
- RED/GREEN review fix: four additional structured Authorization/cookie and refresh/environment-token cases failed before scanner hardening; all 28 safety tests pass afterward, and genuine-evidence replay still passes.
- GREEN: final `pnpm validate` passed all 215 tests, typecheck, contracts, Action pins, release metadata and build.
- GREEN: focused safety/workflow/discovery/summary suite passed 46 tests after PNG screening.
- GREEN: actionlint v1.7.7 and `git diff --check` passed.
- Genuine evidence replay: the shared scanner accepted all 12 T014 Linux canary archives (lifecycle and bundle for six hosts) as one input tree, including Chromium screenshots. No raw input was modified.
- Baseline main Release Watch [34201769307](https://github.com/iiwish/dsh-testkit/actions/runs/34201769307) completed successfully at `d6727279a9dc57bb5b23d2568a8137b9e5b2315c`.

## Pending Linux Acceptance

- Supported-host, installed-package and Action acceptance for rc.1.
- Unified staged uploads and downloaded-manifest verification.
- Main Release Watch terminal summary and post-merge execution.
