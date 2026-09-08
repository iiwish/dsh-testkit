# T015 Verification

Status: Accepted

## Local Verification

- RED: support/evidence tests failed 23 of 27 cases before implementation (missing rc.1 and missing shared scanner).
- RED: workflow contracts failed 5 of 8 cases before gating and monitoring-summary changes.
- RED: a signature-only PNG was incorrectly accepted before structural screening.
- RED/GREEN review fix: four additional structured Authorization/cookie and refresh/environment-token cases failed before scanner hardening; all 28 safety tests pass afterward, and genuine-evidence replay still passes.
- GREEN: final `pnpm validate` passed all 219 tests, typecheck, contracts, Action pins, release metadata and build.
- GREEN: focused safety/workflow/discovery/summary suite passed 46 tests after PNG screening.
- GREEN: actionlint v1.7.7 and `git diff --check` passed.
- Governance validation exits 0 with 14 advisory warnings: 13 concern the repository's compact task-index format, whose execution detail is in the linked packet; the placeholder detector flags the literal policy word `unknown`. Review confirms no unresolved scope placeholder. `diff.patch` is generated directly from the baseline-to-implementation merge diff.
- Genuine evidence replay: the shared scanner accepted all 12 T014 Linux canary archives (lifecycle and bundle for six hosts) as one input tree, including Chromium screenshots. No raw input was modified.
- Baseline main Release Watch [34201769307](https://github.com/iiwish/dsh-testkit/actions/runs/34201769307) completed successfully at `d6727279a9dc57bb5b23d2568a8137b9e5b2315c`.

## Linux Acceptance

Implementation head: `6cecd15ea3e1c91dd3bc0d9af4c1b4c7e5138b6a`.

[Formal CI 34203974329](https://github.com/iiwish/dsh-testkit/actions/runs/34203974329) passes all 17 jobs.

| Exact host | Lifecycle | Native bundle | Installed CLI / Docker | Action subjects |
| --- | --- | --- | --- | --- |
| `0.1.1-rc.2` (default) | 11/11 | Passed | Passed | 2/2 |
| `0.1.2-rc.1` | 11/11 | Passed | Passed | 2/2 |
| `0.1.0-rc.8` | 11/11 | Passed | Passed | 2/2 |
| `0.1.0-rc.7` | 11/11 | Passed | Passed | 2/2 |
| `0.1.0-rc.6` | 11/11 | Passed | Passed | 2/2 |

The lifecycle suite includes deterministic exercise/update, expected boot failure and recovery, registration failure, ordinary and known-host-path residue, process/port observations, HTTP and Chromium DOM transition. The Action pair covers healthy and declared boot-failure subjects on each host.

[Branch Release Watch 34203996972](https://github.com/iiwish/dsh-testkit/actions/runs/34203996972) passes discovery, `0.1.3-alpha.2` lifecycle and bundle lanes, and the final summary. Exact npm availability is pending for `0.1.3-alpha.1`.

## Artifact Verification

- Formal CI: 15 artifacts; 4,050 checked files; 30,664,756 uncompressed bytes; 75 reports. All five installed-package reports are `passed`, identify the requested exact host, and record `runner: docker` plus an image SHA-256. Fifteen deliberately failed negative-fixture reports are retained as safe diagnostics.
- Branch monitor: two artifacts; 632 checked files; 5,661,039 uncompressed bytes; 12 reports. The three failed reports are expected negative fixtures, not failed CI jobs.
- Main monitor: two artifacts; 632 checked files; 5,558,684 uncompressed bytes; 12 reports. Both downloaded manifests match a fresh scanner replay; expected negative verdicts remain intact.
- Each downloaded artifact was copied without its root manifest, rescanned with the final shared policy, and compared with the original manifest's complete file list, byte counts and SHA-256 values. All comparisons pass; no raw download was modified.
- The policy rejects credentials in launch URLs, encoded query names, decoded JSON strings/keys, headers, structured cookie/Authorization values and token assignments; it also rejects private credential files, links, host directories, unknown files, binary text, malformed PNG framing and bounded-input violations. Rejection tests assert no staged output or GitHub output path survives, and no rejected value appears in stdout/stderr.
- YAML contracts verify every configured artifact outlet and JUnit publication uses successful shared staging rather than the raw root. Original lifecycle failure enforcement is preserved. The trusted npm publish job is not dispatched.

## Review

[Pre-merge verification](https://github.com/iiwish/dsh-testkit/pull/40#issuecomment-5581927186) covers the tested head and unchanged base. PR #40 is merged without bypassing checks. Self-review leaves no blocking findings within this scope; it is not an independent review or user acceptance.

The rc.1 browser evidence records `selectedText: Fixture status ready` with Chromium `152.0.7977.82`. Visual inspection confirms a real DSH page with its first-run testing notice. The DOM smoke does not certify an unobstructed visual interaction, arbitrary screenshot privacy or a complete frontend flow. The evidence scanner does not protect against concurrently hostile writers or identify every possible secret encoding.

## Main Closure

Main merge commit: `1bf96dbc6711833cc367c91b012caa6f38d0ab8b`.
[Main Release Watch 34205717065](https://github.com/iiwish/dsh-testkit/actions/runs/34205717065) passes discovery, both `0.1.3-alpha.2` lanes and the always-run summary. It records the main ref and merge SHA, successful discovery/canary results and the pending `0.1.3-alpha.1` exact npm package. [Main CI 34205647130](https://github.com/iiwish/dsh-testkit/actions/runs/34205647130) also passes all 17 jobs at this merge commit.

The [summary job](https://github.com/iiwish/dsh-testkit/actions/runs/34205717065/job/101996210662) checks out the merge SHA and completes with `DISCOVERY_RESULT=success`, `CANARY_RESULT=success`, candidate `0.1.3-alpha.2` and pending npm `0.1.3-alpha.1`. The source implementation also passes [main CodeQL](https://github.com/iiwish/dsh-testkit/actions/runs/34205647552).

The daily 03:17 UTC schedule remains configured on the default branch. Manual dispatch verifies the main workflow; it does not claim that a future scheduled run has executed. No npm publication, version bump or tag movement is authorized or performed.
