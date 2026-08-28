# DSH Testkit v0.4.0 Release Acceptance Summary

Date: 2026-08-28
Decision: GO
Channel: Published public preview
Release commit: `c25df9077825ab2cd7fe4ba2cb61023bfce70033`
Implementation PR: [#25](https://github.com/iiwish/dsh-testkit/pull/25)
Release PR: [#26](https://github.com/iiwish/dsh-testkit/pull/26)
Acceptance plan: `.ai-platform/docs/release-acceptance-plan.md`

## Gate Result

| Gate | Result | Summary |
|---|---|---|
| G01 Candidate and governance integrity | Passed | The release commit is immutable, v0.4.0 identities agree, T010 through T012 are accepted, and historical T000 through T009 states remain unchanged. |
| G02 Build, types and package contract | Passed | Local validation passed 25 test files and 148 tests; the trusted release also passed packed-consumer and package publication checks. |
| G03 Scenario, report and exit-code contracts | Passed | Runtime and published v1 contracts remain aligned; browser and watchdog behavior retain the existing schema and exit-code meanings. |
| G04 Lifecycle state machine | Passed | Protected real-host jobs exercised the healthy lifecycle on DSH `0.1.1-rc.2` and the supported compatibility set. |
| G05 Supported subject inputs | Passed | Source-resolution contract tests and the packed-consumer gate remained green; the v0.4.0 scope does not change the accepted input boundary. |
| G06 Isolation, secret handling and cleanup | Passed | Browser traffic is loopback-only and bounded; watchdog expiry returns infrastructure exit code 3 and leaves no owned container. |
| G07 Determinism and performance | Passed | A fresh warm default-Docker full suite passed 5/5 attempts with one semantic digest; every attempt completed in 159.449 to 262.783 seconds. |
| G08 CI and distribution integration | Passed | Implementation, release and protected-main CI passed; the trusted release workflow verified the public package. |
| G09 Dependency and open-source hygiene | Passed | A fresh production audit found no known vulnerability; MIT, ISC, Apache-2.0 and Python-2.0 licenses, package metadata and npm provenance passed review. |
| G10 Native DSH bundle and tool boundary | Passed | The trusted release exercised the native bundle and packed consumer without widening the tool boundary. |
| G11 Scaffold and Agent Skill adoption boundary | Passed for release | Scaffold, Action and packaged Skill contracts passed; post-release adoption remains a field metric. |
| G12 Explicit web smoke and attempt-wide watchdog | Passed | The production adapter, real Web host, Chromium smoke, unsupported path, classification boundary and deterministic cleanup are covered. |

## Current Release Authority

- T010, T011 and T012 are the v0.4.0 release scope and are `Accepted` with retained task evidence.
- T000 through T009 remain historical records in their existing `Needs_Review` or published-needs-user-acceptance states. Publication does not supply retroactive acceptance.
- The v0.4.0 release is public on GitHub and npm; the `v0` moving tag and `v0.4.0` tag resolve to the release commit.

## Fresh Repeatability Identity

- Run: `20260828043957-c2cfc3c9`
- Subject: `@dsh-testkit/fixture-healthy@1.0.0`
- Subject digest: `sha256:420728ef7835c2d216d3dc4b18098608ba00327186209e57a168950769879e75`
- DSH: `@deepseek-ai/dsh@0.1.1-rc.2`
- DSH integrity: `sha256:bf9d4cf18b53489dacb94ebd32ad3de663edaebb2da1c5517ad69e4fc75d862a`
- Scenario digest: `sha256:bf7a181994e4d5d9df0da6f6067718e0815e7b5affe05d1450df3da21f049f45`
- Semantic digest: `sha256:f1749a1d60d06ae50c4067060298dbac4808f25a2d529d6672a31ad157f9d0aa`
- Runner image: `dsh-testkit-runner:0.4.0-7ccc65787e39`
- Runner image ID: `sha256:88d010ddf2a6f681f76edeefb591a661818d06667a8f32c594092bfb9bc7b17c`
- Attempts: 5 passed, 5 completed, consistent, 243 retained artifacts, zero owned containers after completion

## Publication And Field Boundary

- GitHub release [`v0.4.0`](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.0), npm `latest` and the SLSA provenance statement identify the same release.
- The existing Show & Tell and Ideas discussions each received one v0.4.0 update. Issue #19 is closed, and Blue-Whale-Harness intake #135 accepted the listing.
- A cold arm64 runner-image build can exceed the default attempt budget while downloading Chromium. The observed expiry was classified as host/infrastructure and left no owned container; the fresh five-run gate uses the acceptance plan's warm-run boundary.
- External repository adoption remains the next product signal and does not block the published public preview.
