# T008 Delivery Evidence

Status: Needs_Review
Task: v0.3.0 One-Command Adoption And Agent Skill
Execution: Direct Execute because team delegation is disabled for this task

## Scope

- Added offline, non-interactive `dsh-test init [directory] [--dsh exact-version] [--force]` scaffolding.
- Added one canonical typed `dsh-testkit` Agent Skill, a byte-identical project file and optional DSH runtime registration.
- Added packed-consumer and real-host proof for the generated adoption files and native Skill discovery.
- Published the bilingual Show & Tell and recruited five initial maintainer roles.
- Published v0.3.0, then corrected two repository-root defects in v0.3.1 before submitting the public template integration.
- Submitted vendor-neutral lifecycle guidance to the official Ideas forum and an adoptable released integration to a maintained public plugin template.

## Review

- Spec compliance: passed for FR-029 through FR-036 and NFR-015 through NFR-018. The five external adopters in SC-020 remain a non-blocking field metric.
- Scaffold safety: passed structured JSON/YAML parsing, deterministic row discovery, full conflict preflight, explicit replacement, path containment and symlink rejection.
- Skill boundary: passed compact routing limits, canonical rendering, no hard DSH-version claim and optional host registration.
- Repository-root correction: passed declared Git log artifacts and fail-closed parsing of the final `npm pack --json` result after legitimate lifecycle output.
- User-owned `AGENTS.md`: preserved unmodified and excluded from every delivery commit.

## Release State

- v0.3.0 implementation: [PR #12](https://github.com/iiwish/dsh-testkit/pull/12), merge commit [`51e759472faf925345fcf8019e6fca18d9f5f7b1`](https://github.com/iiwish/dsh-testkit/commit/51e759472faf925345fcf8019e6fca18d9f5f7b1), [release](https://github.com/iiwish/dsh-testkit/releases/tag/v0.3.0), [npm](https://www.npmjs.com/package/dsh-testkit/v/0.3.0) and [provenance](https://registry.npmjs.org/-/npm/v1/attestations/dsh-testkit@0.3.0).
- v0.3.1 correction: [PR #13](https://github.com/iiwish/dsh-testkit/pull/13), merge commit [`d5a9ad0a1439e4c1481c2a499212ee3fcd537b6b`](https://github.com/iiwish/dsh-testkit/commit/d5a9ad0a1439e4c1481c2a499212ee3fcd537b6b), [release](https://github.com/iiwish/dsh-testkit/releases/tag/v0.3.1), [npm](https://www.npmjs.com/package/dsh-testkit/v/0.3.1), [release workflow](https://github.com/iiwish/dsh-testkit/actions/runs/31898835776) and [provenance](https://registry.npmjs.org/-/npm/v1/attestations/dsh-testkit@0.3.1).
- `v0.3.1` and rolling `v0` both dereference to the reviewed v0.3.1 merge commit.
- Distribution: [Show & Tell #2038](https://github.com/deepseek-ai/deepseek-harness/discussions/2038), [official Skill proposal #2088](https://github.com/deepseek-ai/deepseek-harness/discussions/2088), [template PR #1](https://github.com/bugmaker2/dsh-plugin-template/pull/1) and the merged [awesome-dsh-plugin listing](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/562).

## Residual Risk

- The generated scenario can identify declarative patch row IDs but cannot infer service, tool, exercise or prerequisite contracts safely; maintainers and agents must review and add those expectations.
- Docker reduces the default blast radius but is not a hardened malware sandbox.
- Official guidance and template integration remain subject to upstream maintainer review and are not endorsements.
- DSH remains a release-candidate contract; support is exact at `@deepseek-ai/dsh@0.1.0-rc.6` until canary evidence justifies widening it.
