# T016 Test Results

Status: Needs_Review

## Local Evidence

- `pnpm vitest run tests/unit/visible-browser.test.ts tests/contracts/adoption.test.ts`: RED for missing independent browser module and missing adoption job; GREEN with 4 passing tests.
- Initial `pnpm validate`: 222 passed, 1 failed. The failing safety contract correctly rejected the new artifact outlet's omitted explicit hidden-file setting; workflow corrected.
- `/tmp/sugrid-actionlint/actionlint .github/workflows/ci.yml`: passed (1.7.12).
- Final implementation `785a37b7a90724037b5baf35184476240c51e124`: `pnpm validate` passed all 228 tests in 32 files, contract checks, typecheck, coverage gate and build.

## Actual Schedule Receipt

`gh run view 34202400081` reports event `schedule`, SHA `d6727279a9dc57bb5b23d2568a8137b9e5b2315c`, success for discovery and all twelve canary lanes. Created at `2026-09-08T08:02:49Z`. This proves natural scheduling on the T014 baseline, not post-T015 scheduling.

## Integration Validation

Implementation run `34213179544` passed all 18 CI jobs: validate, change classification, adoption, five real-host lanes and ten fixture Action lanes. Each real-host lane runs lifecycle, native bundle and installed-package checks. CodeQL run `34213173916` passed both Actions and JavaScript/TypeScript analysis. Protected merge receipt remains pending at evidence commit time.

All 17 artifacts were downloaded and independently rescanned against their published manifests. Each of the five formal artifacts contains 701 files and 13 reports (10 passing, 3 deliberately failing fixture controls); the installed-tarball report passes on each exact host with a recorded Docker image ID. Governance smoke check exits 0 with 13 compact-index field warnings; detailed scope and validation are in the linked plan/packet rather than duplicated in the index.

## Linux Iteration Evidence

- Run `34210191761`, head `fdee7f7`: installed consumer initialization and external-template baseline passed. The deliberately missing row failed correctly at `assemble`; the new driver incorrectly expected `register` and failed. Exact-report contract tests correct the driver without changing product verdicts. Downloaded artifact replay matches all 127 manifest entries (1,352,170 bytes). Remaining jobs were superseded by the next revision, not accepted as a passing matrix.
- Run `34210793725`, head `1129be3`: baseline passed, deliberate configuration failed, corrected configuration passed. All three reports identify source commit `31af7ebeb8d07cff73253f52f9a9f530cde9de9a`, the same packed-subject digest `sha256:a9ac9c8195c5e6649ce14392c9aa8b324382fe0378474d819425546970190afb`, DSH `0.1.2-rc.1`, and Docker image `sha256:3f5b7f5b881ee16b51f5d928075906257d123238c2f5b35659741d537d47759f`. Independent browser setup failed with output permission denied before obtaining a screenshot. Its test-only Docker invocation was missing the caller UID/GID; the fix preserves read-only mounts and dropped capabilities, matching the production runner ownership contract. Replay matches 191 entries (1,967,507 bytes).
- Ownership/entry-point tests and a mixed-failure negative control were RED before their fixes and GREEN afterward. An intentional row failure cannot conceal a second failed/unsupported lifecycle stage.
- The independent lane uses the healthy host fixture, not the client-side status mutator. Its reports explicitly identify the test-only observation harness.
- Run `34211587214`, head `6aa00a7`: the external positive/negative/corrected lifecycle sequence passed. Independent desktop acceptance reached the actual unobstructed DSH page after normal onboarding but could not edit the disabled composer: a fresh profile requires workspace selection. The screenshot confirms this prerequisite, and the test now selects only `/work/run/workspace` through the native directory picker before entering an unsent draft. No application DOM or settings storage is patched. A focused RED/GREEN test covers that sequence.
- Run `34212401275`, head `727973f`: workspace selection completed, but the test targeted the temporarily read-only textbox before asynchronous session creation. A focused RED/GREEN test requires the actual contenteditable composer to become visible before editing. The test does not weaken the native interaction contract.

## External Consumer And Browser Acceptance

[Run 34213179544](https://github.com/iiwish/dsh-testkit/actions/runs/34213179544), implementation `785a37b7a90724037b5baf35184476240c51e124`, adoption job `102018872330`: passed installed-package init and byte-idempotency, baseline lifecycle, intentional missing-row failure, corrected lifecycle, desktop/mobile native interaction and source Action.

- External source: `bugmaker2/dsh-plugin-template@31af7ebeb8d07cff73253f52f9a9f530cde9de9a`, package `dsh-plugin-template@0.1.0`. All three CLI runs and the Action identify digest `sha256:a9ac9c8195c5e6649ce14392c9aa8b324382fe0378474d819425546970190afb` and host `0.1.2-rc.1`.
- CLI verdicts: `passed`, `failed`, `passed`. The negative fails only at `assemble` for `config.row.dsh-testkit-deliberately-missing`; cleanup succeeds. This is a deliberate configuration fault, not an upstream defect.
- Action verdict: passed, including register, exercise, uninstall, reboot and cleanup. Update/recover are not part of this scenario and remain skipped. Docker image ID: `sha256:dea83d81aef2066f2905c67ceaf9ddb2f3557857524c261d2e3725944d54994b`.
- Desktop `1280x800` and mobile `390x844` each use a fresh profile and complete authentication, notice acknowledgement, provider skip, owned workspace selection, editor focus and exact draft readback. Both JSON observations have `passed: true`, `submitted: false`. Both screenshots were visually inspected: real DSH shell, visible draft, unobstructed controls and responsive sidebar; no injected status DOM. Model execution and arbitrary plugin UI are not covered.
- Downloaded adoption artifact independently rescans to the exact published manifest: 273 files, 2,611,485 bytes. Source Action: 57 files, 611,611 bytes. All ten downloaded positive/negative fixture Action artifacts also pass fresh manifest equality.

## Bounded Schedule Follow-Up

Created active heartbeat `DSH 自然调度验收`, ID `dsh`, hourly at minute 30. It checks only natural main-branch runs containing the T015 implementation; notifies and pauses after success, failure or the 2026-09-09 20:02 UTC freshness deadline. It is quiet otherwise and cannot mutate repositories, rerun failures or publish. The two pre-existing automations remain paused. The first qualifying natural run is still pending, not represented as passed.
