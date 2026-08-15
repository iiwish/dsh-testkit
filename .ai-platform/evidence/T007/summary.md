# T007 Delivery Summary

Status: In_Progress
Task: v0.2.1 Community Proof And Release Automation
Last updated: 2026-08-15

## Implemented

- Rebuilt the English README as an evidence-led project entrypoint and added a parity-checked Simplified Chinese README shipped in the npm package.
- Defined the lifecycle boundary against unit tests, `dsh-plugin-doctor`/preflight and `dsh-composition-check` without claiming official status.
- Preserved the DSH-native bundle as an optional thin adapter while keeping CLI and declarations independent of optional host peers.
- Added `dsh-test-community`, accepting only exact npm versions, requiring explicit untrusted-code acknowledgement, forcing Docker, stripping credentials and emitting a subject-free aggregate.
- Completed ten exact-version public plugin runs and published only aggregate, environment-bound evidence: 2 passed, 8 failed; first failure stage counts were boot 5 and uninstall 3.
- Added exact `latest`/`next` dist-tag discovery, disposable AST-based canary enablement and a scheduled/manual real-host canary workflow.
- Kept general multi-plugin lifecycle execution out of v0.2.1. Cohort evidence prioritizes declarative prerequisite profile/support-bundle fixtures before arbitrary cross-plugin update and uninstall semantics.
- Made DSH host peers optional and removed host-package imports from the native adapter's runtime and declarations.

## Review

- Spec compliance: local implementation and all requirement contracts pass.
- Bug and code quality: no open P0/P1 finding after focused, full, packed-consumer and real-host review.
- Credential boundary: child environments use an allowlist and omit model, npm, GitHub, cloud, remote Docker and Docker registry credentials.
- Disclosure boundary: committed cohort artifacts contain no plugin identity; raw named reports remain under a local `/tmp` evidence directory.
- QA acceptance: local gates pass; hosted PR, main, release and public-consumer gates remain pending.
- Execution mode: Direct Execute because current host policy does not authorize subagent delegation; the self-contained T007 packet constrained scope and validation.

## Residual Risks

- Five cohort subjects need a host service absent from the minimal isolated profile. A prerequisite-profile contract is the next evidence-led experiment.
- Docker reduces exposure but is not a hardened malware sandbox, and community code retains public-network access inside disposable containers.
- Network tracing is unavailable; output-canary absence does not prove absence of egress.
- DSH is still an rc contract. Canary success is evidence, not automatic support promotion.
- Public release identities and provenance are pending the reviewed protected-branch merge and trusted-publishing workflow.
