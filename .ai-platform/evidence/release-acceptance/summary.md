# DSH Testkit v0.4.1 Release Acceptance Summary

Date: 2026-08-31
Decision: GO
Channel: Public preview
Accepted task: T013
Acceptance plan: `.ai-platform/docs/release-acceptance-plan.md`

## Gate Result

| Gate | Result | Summary |
|---|---|---|
| G01 Candidate and governance integrity | Passed | T013 is accepted, its artifacts validate, and `v0.4.1` resolves to protected-main commit `6725fd40d5e25333b05ce6131d0c7f1e6c9aab41`. |
| G02 Build, types and package contract | Passed | Frozen install, 159 tests, build, publint, package allowlist, dry-run publish and packed consumer passed. |
| G03 Scenario, report and exit-code contracts | Passed | v1 schemas and exit-code meanings remain unchanged. |
| G04 Lifecycle state machine | Passed | Every supported DSH host passed the complete 11-case real-host suite. |
| G05 Supported subject inputs | Passed | Existing input contracts remain green and the source prepare fixture passes from a read-only mount. |
| G06 Isolation, secret handling and cleanup | Passed | Dependency restoration and package scripts stay in the owned worker; watchdog cleanup remains effective. |
| G07 Determinism and performance | Passed for release | Supported matrix verdicts are green; cold image download remains a classified infrastructure condition. |
| G08 CI and distribution integration | Passed | PR, protected-main and trusted-release workflows pass the required and compatibility matrices; npm and GitHub distribution are public. |
| G09 Dependency and open-source hygiene | Passed | Production audit and license inventory pass; package metadata is complete. |
| G10 Native DSH bundle and tool boundary | Passed | Native bundle passed on every supported DSH version. |
| G11 Scaffold and Agent Skill adoption boundary | Passed | Generated workflow stays read-only and packed-consumer contracts pass. |
| G12 Explicit web smoke and attempt-wide watchdog | Passed | Supported web/browser cases and cleanup behavior remain green. |
| G13 Source packaging, least-privilege CI and canaries | Passed | Exact Corepack dispatch, rc.8 coordination, release classification and immutable partner gates are proved. |

## Review Result

The first maintainer pass found a P2 reproducibility defect in explicit package-manager handling. A negative control failed for mutable `pnpm@latest`, and explicit npm used the runner default. The accepted candidate validates an exact semantic version and invokes Corepack with the complete declared manager identity. Unit, type, package, and real Docker source-prepare evidence pass. No review finding remains.

## Publication Result

1. Release PR [#31](https://github.com/iiwish/dsh-testkit/pull/31) merged through protected `main` after all required and compatibility jobs passed.
2. `v0.4.1` and `v0` resolve to the reviewed protected-main commit.
3. Trusted release workflow [33352703674](https://github.com/iiwish/dsh-testkit/actions/runs/33352703674) published `dsh-testkit@0.4.1` with npm publish and SLSA provenance attestations.
4. The public registry reports `0.4.1` as `latest`, clean public execution passes, and the [GitHub Release](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.1) is available.
