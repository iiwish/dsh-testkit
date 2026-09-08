# T016 Test Results

Status: Running

## Local Evidence

- `pnpm vitest run tests/unit/visible-browser.test.ts tests/contracts/adoption.test.ts`: RED for missing independent browser module and missing adoption job; GREEN with 4 passing tests.
- Initial `pnpm validate`: 222 passed, 1 failed. The failing safety contract correctly rejected the new artifact outlet's omitted explicit hidden-file setting; workflow corrected.
- `/tmp/sugrid-actionlint/actionlint .github/workflows/ci.yml`: passed (1.7.12).

## Actual Schedule Receipt

`gh run view 34202400081` reports event `schedule`, SHA `d6727279a9dc57bb5b23d2568a8137b9e5b2315c`, success for discovery and all twelve canary lanes. Created at `2026-09-08T08:02:49Z`. This proves natural scheduling on the T014 baseline, not post-T015 scheduling.

## Pending Validation

Full local validation, Linux supported-host matrix, clean installed external consumer, source Action, desktop/mobile screenshot review, artifact replay and protected merge receipts.
