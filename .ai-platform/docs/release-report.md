# DSH Testkit v0.4.2 Release Report

Version: v0.4.2
Status: Published
Decision: GO
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
| Release PR | [#38](https://github.com/iiwish/dsh-testkit/pull/38): merged after [CI 34197687930](https://github.com/iiwish/dsh-testkit/actions/runs/34197687930) and CodeQL passed |
| Protected main | [CI 34198390655](https://github.com/iiwish/dsh-testkit/actions/runs/34198390655) and [CodeQL 34198390308](https://github.com/iiwish/dsh-testkit/actions/runs/34198390308) passed on the exact release commit |
| Trusted publication | [34199141267](https://github.com/iiwish/dsh-testkit/actions/runs/34199141267): identity, validation, real-host, native bundle, packaged consumer, publish and public visibility checks passed |
| Public consumer | Clean official-registry install completed; CLI reports 0.4.2 and public API import succeeds |
| Supply-chain verification | npm audit signatures verifies 12 registry signatures and 3 attestations; package provenance names the release workflow, tag and exact release commit |
| Repository security | No open Dependabot vulnerability alert after the fixes reached main |

## Published Identities

- Protected-main release commit: `c418db152334cdba0e9473b828e8345b73c496cb`.
- Immutable tag `v0.4.2` and moving Action channel `v0` both resolve to the release commit. The v0 channel update used an exact-old-value lease; immutable tags were not retargeted.
- npm `dsh-testkit@0.4.2` is `latest`; 151 files, 861,115 bytes unpacked.
- Integrity: `sha512-/bP4ecXFc0/6B/mhkjFWXVEIAWCrOEFCbGwOCa09FBOlRJ7UJC6SRNwwSMPIv59yezcX6MggkgPK4cQboEJFhg==`.
- SHA-1: `4643785e9e3ad8a386e5025d23cf9a832a6dc5ca`.
- [GitHub Release](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.2) is published as the latest release.
- Public consumer verification directory: `/tmp/dsh-public-042-ftkAs7`. Registry metadata, CLI/API execution and cryptographic npm signature/attestation verification all passed after installation completed.

## Residual Risk

Local macOS arm64 cold Docker builds are network-limited; Linux Docker acceptance is complete. Candidates remain disposable canaries because packaged-consumer promotion evidence and a support decision are separate requirements. No new host is claimed formally supported.
