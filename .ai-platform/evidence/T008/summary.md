# T008 Delivery Evidence

Status: Needs_Review
Task: v0.3.0 One-Command Adoption And Agent Skill
Execution: Direct Execute because team delegation is disabled for this task

## Scope

- Added offline, non-interactive `dsh-test init [directory] [--dsh exact-version] [--force]` scaffolding.
- Added one canonical typed `dsh-testkit` Agent Skill, a byte-identical project file and optional DSH runtime registration.
- Added packed-consumer and real-host proof for the generated adoption files and native Skill discovery.
- Prepared bilingual v0.3.0 onboarding and release identities without changing scenario/report v1, root-run behavior, Action inputs or exit-code semantics.
- Published the bilingual Show & Tell at <https://github.com/deepseek-ai/deepseek-harness/discussions/2038> and recruited five initial maintainer roles.

## Review

- Spec compliance: passed for FR-029 through FR-035 and NFR-015 through NFR-018; FR-036 completes after public release and upstream submissions.
- Scaffold safety: passed structured JSON/YAML parsing, deterministic row discovery, full conflict preflight, explicit replacement, path containment and symlink rejection.
- Skill boundary: passed compact routing limits, canonical rendering, no hard DSH-version claim and optional host registration.
- Bug and code quality: no release-blocking finding after focused, full, packed-consumer and real-host review.
- User-owned `AGENTS.md`: preserved unmodified and excluded from the delivery diff.

## Release State

Pre-publication validation is green. The reviewed merge commit, v0.3.0 tag, GitHub Release, npm provenance, Show & Tell update, official Ideas proposal and plugin-template PR are recorded here after publication rather than inferred in advance.

## Residual Risk

- The generated scenario can identify declarative patch row IDs but cannot infer service, tool, exercise or prerequisite contracts safely; maintainers and agents must review and add those expectations.
- Docker reduces the default blast radius but is not a hardened malware sandbox.
- Official guidance and template integration remain subject to upstream maintainer review and are not endorsements.
