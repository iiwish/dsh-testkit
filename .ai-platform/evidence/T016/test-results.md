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

## Linux Iteration Evidence

- Run `34210191761`, head `fdee7f7`: installed consumer initialization and external-template baseline passed. The deliberately missing row failed correctly at `assemble`; the new driver incorrectly expected `register` and failed. Exact-report contract tests correct the driver without changing product verdicts. Downloaded artifact replay matches all 127 manifest entries (1,352,170 bytes). Remaining jobs were superseded by the next revision, not accepted as a passing matrix.
- Run `34210793725`, head `1129be3`: baseline passed, deliberate configuration failed, corrected configuration passed. All three reports identify source commit `31af7ebeb8d07cff73253f52f9a9f530cde9de9a`, the same packed-subject digest `sha256:a9ac9c8195c5e6649ce14392c9aa8b324382fe0378474d819425546970190afb`, DSH `0.1.2-rc.1`, and Docker image `sha256:3f5b7f5b881ee16b51f5d928075906257d123238c2f5b35659741d537d47759f`. Independent browser setup failed with output permission denied before obtaining a screenshot. Its test-only Docker invocation was missing the caller UID/GID; the fix preserves read-only mounts and dropped capabilities, matching the production runner ownership contract. Replay matches 191 entries (1,967,507 bytes).
- Ownership/entry-point tests and a mixed-failure negative control were RED before their fixes and GREEN afterward. An intentional row failure cannot conceal a second failed/unsupported lifecycle stage.
- The independent lane uses the healthy host fixture, not the client-side status mutator. Its reports explicitly identify the test-only observation harness.
- Run `34211587214`, head `6aa00a7`: the external positive/negative/corrected lifecycle sequence passed. Independent desktop acceptance reached the actual unobstructed DSH page after normal onboarding but could not edit the disabled composer: a fresh profile requires workspace selection. The screenshot confirms this prerequisite, and the test now selects only `/work/run/workspace` through the native directory picker before entering an unsent draft. No application DOM or settings storage is patched. A focused RED/GREEN test covers that sequence.
