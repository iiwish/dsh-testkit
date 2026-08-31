# DSH Testkit v0.4.1 Release Acceptance Summary

Date: 2026-08-31
Decision: CONDITIONAL_GO
Channel: Public preview candidate
Accepted task: T013
Acceptance plan: `.ai-platform/docs/release-acceptance-plan.md`

## Gate Result

| Gate | Result | Summary |
|---|---|---|
| G01 Candidate and governance integrity | Conditional | T013 is accepted and its artifacts validate; the protected merge commit and matching tag are publication-time identities. |
| G02 Build, types and package contract | Passed | Frozen install, 159 tests, build, publint, package allowlist, dry-run publish and packed consumer passed. |
| G03 Scenario, report and exit-code contracts | Passed | v1 schemas and exit-code meanings remain unchanged. |
| G04 Lifecycle state machine | Passed | Every supported DSH host passed the complete 11-case real-host suite. |
| G05 Supported subject inputs | Passed | Existing input contracts remain green and the source prepare fixture passes from a read-only mount. |
| G06 Isolation, secret handling and cleanup | Passed | Dependency restoration and package scripts stay in the owned worker; watchdog cleanup remains effective. |
| G07 Determinism and performance | Passed for release | Supported matrix verdicts are green; cold image download remains a classified infrastructure condition. |
| G08 CI and distribution integration | Conditional | Local Action smoke and workflow validation pass; protected GitHub CI must prove the merge candidate. |
| G09 Dependency and open-source hygiene | Passed | Production audit and license inventory pass; package metadata is complete. |
| G10 Native DSH bundle and tool boundary | Passed | Native bundle passed on every supported DSH version. |
| G11 Scaffold and Agent Skill adoption boundary | Passed | Generated workflow stays read-only and packed-consumer contracts pass. |
| G12 Explicit web smoke and attempt-wide watchdog | Passed | Supported web/browser cases and cleanup behavior remain green. |
| G13 Source packaging, least-privilege CI and canaries | Passed | Exact Corepack dispatch, rc.8 coordination, release classification and immutable partner gates are proved. |

## Review Result

The first maintainer pass found a P2 reproducibility defect in explicit package-manager handling. A negative control failed for mutable `pnpm@latest`, and explicit npm used the runner default. The accepted candidate validates an exact semantic version and invokes Corepack with the complete declared manager identity. Unit, type, package, and real Docker source-prepare evidence pass. No review finding remains.

## Publication Conditions

1. Merge the reviewed candidate through protected `main` after all required and compatibility jobs pass.
2. Tag that exact commit as `v0.4.1`; do not tag a branch-local or unreviewed commit.
3. Require the trusted release workflow to publish with npm provenance and verify the public package.
4. Move `v0` and create the GitHub Release only after npm publication succeeds.
