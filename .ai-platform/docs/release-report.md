# DSH Testkit Release Report

Version: v0.4.0
Status: Published Public Preview
Decision: GO
Last updated: 2026-08-28
Release commit: [`c25df9077825ab2cd7fe4ba2cb61023bfce70033`](https://github.com/iiwish/dsh-testkit/commit/c25df9077825ab2cd7fe4ba2cb61023bfce70033)

## Release Scope

DSH Testkit v0.4.0 adds an explicit Docker-only `dsh web` TurnStatus browser smoke and an attempt-wide watchdog while preserving the existing lifecycle engine, scenario schema v1, report schema v1 and exit-code meanings.

The browser lane uses a disposable Chromium context, permits only the runner-owned loopback origin, blocks service workers and non-loopback HTTP/WebSocket traffic, and retains only browser identity, selected text, bounded JSON evidence and a screenshot. Missing browser support is `unsupported`; failure to navigate an already-live loopback host is infrastructure; a completed DOM mismatch remains a plugin assertion failure.

`timeouts.overallMs` bounds each local and Docker attempt. Expiry terminates the owned process tree, force-removes the deterministic container as a fallback and returns infrastructure exit code 3. A pre-probe boot timeout retains generic timeout evidence, so Testkit does not label every plugin-induced boot stall as a host defect.

## Verification

| Gate | Result |
|---|---|
| T011 and T012 task evidence | Accepted with production-adapter regression coverage and the real-host compatibility matrix |
| Local validation | `pnpm validate` passed 25 test files and 148 tests, including typecheck, coverage and build |
| Package preflight | `npm pack --dry-run --json` produced `dsh-testkit@0.4.0` with 151 entries |
| Implementation PR | [PR #25](https://github.com/iiwish/dsh-testkit/pull/25) passed protected CI, real-host DSH `0.1.1-rc.2`, compatibility replays and CodeQL before merge |
| Release PR | [PR #26](https://github.com/iiwish/dsh-testkit/pull/26) passed [CI run 33138444470](https://github.com/iiwish/dsh-testkit/actions/runs/33138444470) and CodeQL before merge |
| Protected main | [CI run 33138833339](https://github.com/iiwish/dsh-testkit/actions/runs/33138833339) and [CodeQL run 33138833308](https://github.com/iiwish/dsh-testkit/actions/runs/33138833308) passed on the release commit |
| Trusted publication | [Release run 33139219598](https://github.com/iiwish/dsh-testkit/actions/runs/33139219598) passed validation, real-host, native-bundle, packed-consumer, publish and public-registry verification |
| Host compatibility | Default `0.1.1-rc.2` plus exact replays for `0.1.0-rc.8`, `0.1.0-rc.7` and `0.1.0-rc.6` passed |
| Fresh repeatability | Warm default-Docker full suite run `20260828043957-c2cfc3c9` passed 5/5 attempts with one semantic digest; each attempt completed in 159.449 to 262.783 seconds |
| Public package | npm `latest` resolves to `0.4.0`; the registry reports 151 files and 821,715 unpacked bytes |
| npm provenance | The SLSA v1 statement identifies `pkg:npm/dsh-testkit@0.4.0`, `refs/tags/v0.4.0`, release workflow run `33139219598` and commit `c25df90` |

## Task And Evidence Authority

- T010, T011 and T012 are `Accepted` and have retained summaries, test results and diffs under `.ai-platform/evidence/`.
- T011 implements US-011, FR-043 through FR-045 and NFR-022.
- T012 implements US-012, FR-046 through FR-047 and NFR-023.
- T000 through T009 retain their historical `Needs_Review` or published-needs-acceptance states. This report does not retroactively change those records.

## Distribution

- [Show & Tell #2038](https://github.com/deepseek-ai/deepseek-harness/discussions/2038#discussioncomment-18183335) records the completed Web-host gate and watchdog boundary.
- [Ideas #2088](https://github.com/deepseek-ai/deepseek-harness/discussions/2088#discussioncomment-18183338) records the vendor-neutral release-gate rules.
- [Issue #19](https://github.com/iiwish/dsh-testkit/issues/19) closed through the reviewed implementation.
- [Blue-Whale-Harness #135](https://github.com/leenkcool/Blue-Whale-Harness/issues/135) accepted DSH Testkit as an external testing utility.

## Review

- Spec compliance: Passed for US-010 through US-012, FR-040 through FR-047, NFR-021 through NFR-023 and the v0.4.0 compatibility boundary.
- Engineering quality: Maintainer review found no surviving P0 through P3 issue on the implementation or release diff.
- Safety boundary: Passed; browser traffic remains loopback-only, retained evidence is bounded, plugin code remains in the selected runner and watchdog cleanup is deterministic.
- Compatibility: Passed; headless scenarios, HTTP-only scenarios, Action inputs, v1 schemas and exit codes remain compatible.
- Publication: Passed through protected PRs, protected main, trusted npm publishing and public provenance verification.

## Residual Risks

- The browser contract is intentionally one fixed TurnStatus smoke, not a general browser, visual or accessibility test surface.
- Chromium is provided only in the Docker runner; environments without a supported executable receive honest `unsupported` coverage.
- A cold arm64 runner-image build can exceed the default 10-minute attempt budget while downloading Chromium. The observed expiry returned infrastructure exit code 3 and left no owned container; the warm repeatability gate passed 5/5 attempts.
- Docker is not a hardened malware sandbox, and plugin/runtime code can still exercise capabilities allowed by the runner environment.
- DSH remains a release-candidate contract. GitHub has published `dsh-v0.1.2-alpha.1`, but npm `latest` and `next` remain `0.1.1-rc.2`; support changes require an exact npm canary.
- External adoption remains the next product signal. The public template PR is not yet a merged, continuously running check.

## Publication Targets

- Repository: [iiwish/dsh-testkit](https://github.com/iiwish/dsh-testkit)
- GitHub release: [`v0.4.0`](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.0)
- Stable moving tag: [`v0`](https://github.com/iiwish/dsh-testkit/tree/v0), resolving to the v0.4.0 release commit
- npm package: [`dsh-testkit@0.4.0`](https://www.npmjs.com/package/dsh-testkit/v/0.4.0)
- npm tarball SHA-1: `4238703a0876b038e75a90186f5c205fba661537`
- npm integrity: `sha512-865EnsRfbcTw/nwRLz+E7hzs87v6MdDuDV6zV3J8+smmGkSjBTdaZfIl75FiXe3za99dNwbQIowi/2/VDspndw==`
- npm provenance: [SLSA v1 attestation](https://registry.npmjs.org/-/npm/v1/attestations/dsh-testkit@0.4.0)
