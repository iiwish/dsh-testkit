# DSH Testkit Release Report

Version: v0.3.1
Status: Published Public Preview
Decision: GO
Last updated: 2026-08-16
Release commit: [`d5a9ad0a1439e4c1481c2a499212ee3fcd537b6b`](https://github.com/iiwish/dsh-testkit/commit/d5a9ad0a1439e4c1481c2a499212ee3fcd537b6b)

## Release Scope

DSH Testkit is a deterministic real-host lifecycle runner for DeepSeek Harness plugins. The current release provides CLI and GitHub Action gates, a native `dsh_test` tool, bilingual documentation, exact-version community/release-train evidence, one-command repository adoption and one canonical Agent Skill.

`dsh-test init` generates only a scenario, least-privilege workflow and project-local Skill. It is offline, idempotent and fail-closed for conflicts, path escape and symlink targets. It does not edit package manifests, lockfiles or repository instructions.

v0.3.1 corrects repository-root behavior found while applying the v0.3.0 onboarding to a public plugin template: Git source-resolution logs are declared report artifacts, and legitimate package lifecycle output can precede the final validated `npm pack --json` result. Scenario/report v1, exit codes, Action inputs and lifecycle verdict semantics remain unchanged.

The supported host remains exactly `@deepseek-ai/dsh@0.1.0-rc.6`.

## Verification

| Gate | Result |
|---|---|
| v0.3.0 TDD | Passed: missing scaffold, Skill, runtime discovery and release identity produced the expected RED results before implementation |
| v0.3.0 validation | Passed: 108 tests across 21 files, 8 real-host fixtures, native bundle/Skill E2E, packed consumer, actionlint, publint, audit and licenses |
| v0.3.0 protected release | [PR #12](https://github.com/iiwish/dsh-testkit/pull/12), CI, CodeQL and [trusted release workflow](https://github.com/iiwish/dsh-testkit/actions/runs/31897201179) passed on merge commit `51e7594` |
| v0.3.1 corrective TDD | Passed: real Git source and lifecycle-prefixed pack-output tests failed first; declared artifacts and fail-closed final-result parsing made them green |
| v0.3.1 validation | Passed: 111 tests across 22 files, typecheck, coverage, contracts, build, pack, native bundle E2E, audit, CodeQL, Action smokes and real-host CI |
| v0.3.1 protected release | [PR #13](https://github.com/iiwish/dsh-testkit/pull/13), [main CI](https://github.com/iiwish/dsh-testkit/actions/runs/31898685006), [CodeQL](https://github.com/iiwish/dsh-testkit/actions/runs/31898684935) and [trusted release workflow](https://github.com/iiwish/dsh-testkit/actions/runs/31898835776) passed on merge commit `d5a9ad0` |
| Public package | A clean public install returned CLI 0.3.1, the root native/scaffold APIs and the canonical packaged Skill |
| npm provenance | Package and SLSA attestations identify `pkg:npm/dsh-testkit@0.3.1`, `refs/tags/v0.3.1` and the repository release workflow |
| Public template root | Released `dsh-testkit@0.3.1` passed package, install, assemble, boot, register, exercise, uninstall, reboot and cleanup for `bugmaker2/dsh-plugin-template`; run `20260815174406-8eff34b9` retained 52 artifacts |
| Generated integration | The public generator was idempotent, `pnpm install --frozen-lockfile`, template typecheck/build and actionlint v1.7.12 passed |
| Delivery artifacts | T008 implementation, corrective release, public identities, upstream submissions and residual risks pass the delivery validator |

## Distribution

- [Show & Tell #2038](https://github.com/deepseek-ai/deepseek-harness/discussions/2038) is bilingual, explicitly unofficial, demonstrates one-command adoption and recruits five initial maintainers. The [v0.3.1 follow-up](https://github.com/deepseek-ai/deepseek-harness/discussions/2038#discussioncomment-18032824) records the repository-root evidence.
- [Official Ideas proposal #2088](https://github.com/deepseek-ai/deepseek-harness/discussions/2088) provides vendor-neutral, directly adoptable release-lifecycle wording for the built-in `cordis-plugin-development` Skill or tutorial. It does not ask the official project to depend on Testkit.
- [Public plugin-template PR #1](https://github.com/bugmaker2/dsh-plugin-template/pull/1) applies the released scenario, rolling `v0` Action and project Skill with equivalent English and Chinese documentation.
- [awesome-dsh-plugin PR #562](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/562) is merged and lists DSH Testkit in both locale indexes.

## Review

- Spec compliance: Passed for US-008, FR-029 through FR-036, NFR-015 through NFR-018 and SC-017 through SC-019.
- Engineering quality: Passed with no open P0 or P1 finding.
- Safety boundary: Passed; untrusted execution remains explicit, Docker is the default and the Agent Skill cannot authorize local execution.
- Compatibility: Passed; root CLI behavior, Action inputs, v1 schemas and exit codes remain compatible.
- Release acceptance: Passed locally, on protected PRs, on main, in trusted publication and against the public template root.
- Governance acceptance: T008 remains `Needs_Review` until explicit user acceptance. The external-adopter count in SC-020 is a post-release field metric and does not block publication.

## Residual Risks

- Generated row expectations are deterministic, but service, tool, exercise and prerequisite expectations still require maintainer review.
- Docker is not a hardened malware sandbox, and tested package/runtime code can use the network inside the disposable runner.
- DSH remains a release-candidate contract. Canary success does not automatically widen the supported-version registry.
- Official Skill wording and template integration are submitted, not accepted; upstream maintainers may revise or decline them without invalidating the released evidence.
- Broad adoption is not yet demonstrated. The next product signal is repeated use by independent plugin maintainers, not additional framework surface.

## Publication Targets

- Repository: [iiwish/dsh-testkit](https://github.com/iiwish/dsh-testkit)
- GitHub release: [`v0.3.1`](https://github.com/iiwish/dsh-testkit/releases/tag/v0.3.1), with `v0` dereferencing to the same release commit
- npm package: [`dsh-testkit@0.3.1`](https://www.npmjs.com/package/dsh-testkit/v/0.3.1)
- npm tarball SHA-1: `7fd8475e3479fb266621822482db6a4e85a94805`
- npm integrity: `sha512-cuL8BpHKDJpa53Sy7yxmEwVpx+ojXpWsSjktNGey3K30Hy5QaiBXscltAuQ7xzIGa5V7exgB6OvtxQQK9exGDg==`
- npm provenance: [SLSA v1 attestation](https://registry.npmjs.org/-/npm/v1/attestations/dsh-testkit@0.3.1)
- Official forum: [Show & Tell #2038](https://github.com/deepseek-ai/deepseek-harness/discussions/2038) and [Ideas #2088](https://github.com/deepseek-ai/deepseek-harness/discussions/2088)
- Template integration: [bugmaker2/dsh-plugin-template#1](https://github.com/bugmaker2/dsh-plugin-template/pull/1)
