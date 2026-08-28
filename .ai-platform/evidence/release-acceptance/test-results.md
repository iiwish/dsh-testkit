# DSH Testkit v0.4.0 Release Acceptance Test Results

Date: 2026-08-28
Result: Passed release gate
Release commit: `c25df9077825ab2cd7fe4ba2cb61023bfce70033`

## Repository And Package

| Check | Result |
|---|---|
| `git diff --check` | Passed |
| Delivery artifact validator | Passed for T011 and T012 release work |
| `pnpm validate` | Passed: 25 test files, 148 tests, typecheck, coverage and build |
| Package dry run | Passed: `dsh-testkit@0.4.0`, 151 entries |
| Public npm metadata | `latest` is `0.4.0`; 151 files; 821,715 unpacked bytes |
| npm tarball identity | SHA-1 `4238703a0876b038e75a90186f5c205fba661537`; integrity `sha512-865EnsRfbcTw/nwRLz+E7hzs87v6MdDuDV6zV3J8+smmGkSjBTdaZfIl75FiXe3za99dNwbQIowi/2/VDspndw==` |
| Production dependency audit | Fresh `pnpm audit --prod` found no known vulnerability |
| Production license inventory | MIT, ISC, Apache-2.0 and Python-2.0 dependencies reviewed |
| Version identity | Package, CLI, release tag, GitHub release, npm package and provenance identify v0.4.0 |

## Contracts And Protected CI

| Check | Result |
|---|---|
| Scenario/report v1 and exit-code parity | Passed; v0.4.0 adds no breaking schema or exit-code change |
| Documentation contract tests | Passed against the canonical v0.4.0 release state |
| Implementation PR #25 | Required CI, real-host, compatibility and CodeQL checks passed before merge |
| Implementation main CI | [Run 33137437612](https://github.com/iiwish/dsh-testkit/actions/runs/33137437612) passed |
| Release PR #26 | [CI run 33138444470](https://github.com/iiwish/dsh-testkit/actions/runs/33138444470) passed before merge |
| Release commit on protected main | [CI run 33138833339](https://github.com/iiwish/dsh-testkit/actions/runs/33138833339) and [CodeQL run 33138833308](https://github.com/iiwish/dsh-testkit/actions/runs/33138833308) passed |
| Trusted release | [Run 33139219598](https://github.com/iiwish/dsh-testkit/actions/runs/33139219598) passed validation, real-host, native-bundle, packed-consumer, publish and public-registry verification |
| npm provenance | SLSA v1 identifies `pkg:npm/dsh-testkit@0.4.0`, `refs/tags/v0.4.0`, the release workflow and commit `c25df90` |

## Real Host, Web And Watchdog

| Test | Result |
|---|---|
| Default protected real host | Passed on `@deepseek-ai/dsh@0.1.1-rc.2` |
| Compatibility replays | Passed on exact `0.1.0-rc.8`, `0.1.0-rc.7` and `0.1.0-rc.6` |
| Explicit `profile: web` fixture | Passed against the real DSH Web host and the fixed TurnStatus browser assertion |
| Browser unavailable path | Production adapter retains `unsupported`; it is not promoted to registration failure |
| Browser safety boundary | Disposable context, loopback-only origin, blocked service workers/non-loopback HTTP and WebSocket, bounded retained evidence |
| Host classification boundary | Pre-probe boot timeout stays generic `timeout`; route/navigation failure after live-loopback evidence is infrastructure |
| Cold runner-image reproduction | Expired at `600000ms` during slow Chromium dependency download; exit 3, host/infrastructure classification, zero owned containers afterward |
| Warm full-suite cleanup | Five attempts completed with zero owned containers afterward |

## Fresh Full Repeatability Record

Command:

```text
node dist/src/cli.js fixtures/healthy-plugin --config fixtures/healthy-plugin/dsh-testkit.yaml --dsh 0.1.1-rc.2 --suite full --runner docker --output <fresh-run-root>
```

The exact v0.4.0 runner image was built once before the warm-run gate. All five attempts used:

- Run: `20260828043957-c2cfc3c9`
- Subject: `@dsh-testkit/fixture-healthy@1.0.0`
- Subject digest: `sha256:420728ef7835c2d216d3dc4b18098608ba00327186209e57a168950769879e75`
- DSH integrity: `sha256:bf9d4cf18b53489dacb94ebd32ad3de663edaebb2da1c5517ad69e4fc75d862a`
- Scenario digest: `sha256:bf7a181994e4d5d9df0da6f6067718e0815e7b5affe05d1450df3da21f049f45`
- Semantic digest: `sha256:f1749a1d60d06ae50c4067060298dbac4808f25a2d529d6672a31ad157f9d0aa`
- Runner image: `dsh-testkit-runner:0.4.0-7ccc65787e39`
- Runner image ID: `sha256:88d010ddf2a6f681f76edeefb591a661818d06667a8f32c594092bfb9bc7b17c`
- Environment: Linux arm64 container, Node `v22.23.2`, pnpm `11.1.3`

Attempt durations were 262.783, 188.659, 187.809, 159.449 and 165.295 seconds. The root report verdict is `passed`, `completedRuns` is 5, `consistent` is `true`, and every attempt carries the same semantic digest.

## Publication Verification

- GitHub release: [`v0.4.0`](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.0)
- npm package: [`dsh-testkit@0.4.0`](https://www.npmjs.com/package/dsh-testkit/v/0.4.0)
- npm provenance: [SLSA v1 attestation](https://registry.npmjs.org/-/npm/v1/attestations/dsh-testkit@0.4.0)
- Official updates: [Show & Tell #2038](https://github.com/deepseek-ai/deepseek-harness/discussions/2038#discussioncomment-18183335) and [Ideas #2088](https://github.com/deepseek-ai/deepseek-harness/discussions/2088#discussioncomment-18183338)
- Ecosystem intake: [Blue-Whale-Harness #135](https://github.com/leenkcool/Blue-Whale-Harness/issues/135)
