# DSH Testkit v0.4.2 Release Report

Version: v0.4.2
Status: Release_Candidate
Decision: Awaiting release-identity CI
Release channel: Public preview
Last updated: 2026-09-08

## Release Scope

DSH Testkit v0.4.2 contains the accepted T014 compatibility and diagnostic-safety fixes: a subject-free runtime baseline, Connection-ready browser authentication, private credential handoff, launch-token redaction in logs and process snapshots, and independent canary lifecycle/bundle lanes. It updates Zod to 4.5.4, development Cordis to 4.0.2 and development-only fast-uri to 3.1.7. Scenario/report v1 schemas, exit codes, Docker-default isolation, formal host support and the default DSH version remain unchanged.

The user accepted the verified fixes and authorized merge and publication on 2026-09-08. Implementation PR [#37](https://github.com/iiwish/dsh-testkit/pull/37) is merged at `4c00534`.

## Verification

| Gate | Evidence |
| --- | --- |
| Implementation CI | [34186704924](https://github.com/iiwish/dsh-testkit/actions/runs/34186704924): all 14 jobs passed |
| Supported hosts | Lifecycle, native bundle, packaged Docker consumer and positive/negative Action smoke passed on DSH 0.1.1-rc.2 and 0.1.0-rc.6/7/8 |
| Candidate hosts | [34185918263](https://github.com/iiwish/dsh-testkit/actions/runs/34185918263): all 12 lifecycle/bundle lanes passed for 0.1.2-alpha.2/3/4/5, 0.1.2-rc.1 and 0.1.3-alpha.2 |
| Diagnostic safety | All 12 final archives downloaded and scanned with no unredacted launch URLs or private credential files; superseded unsafe archives removed |
| Dependency hygiene | Official npm audit reports no known vulnerabilities |
| Release identity local validation | v0.4.2: 26 files / 175 tests passed, with typecheck, contracts and build |
| Publication identity | Pending v0.4.2 release PR, protected-main CI and trusted publishing |

## Publication Gate

Publish only the exact v0.4.2 protected-main commit after release-identity CI and review pass. The existing tag-triggered workflow validates the package, exercises the default real host and native bundle, tests the packaged Docker consumer, publishes through npm Trusted Publishing and verifies registry visibility. Verify public installation and provenance before marking Published or advancing the existing v0 Action channel. Never retarget an immutable version tag.

## Residual Risk

Local macOS arm64 cold Docker builds are network-limited; Linux Docker acceptance is complete. Candidates remain disposable canaries because packaged-consumer promotion evidence and a support decision are separate requirements. No new host is claimed formally supported.
