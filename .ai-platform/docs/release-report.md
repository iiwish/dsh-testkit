# DSH Testkit Release Report

Version: v0.2.0
Status: Release Candidate
Decision: CONDITIONAL_GO
Last updated: 2026-08-15
Release commit: Pending reviewed merge commit

## Release Scope

DSH Testkit v0.2.0 preserves the CLI, GitHub Action and v1 report contracts while publishing the same lifecycle engine as an official DSH Profile Bundle. The bundle registers `dsh_test`, requires both a confirmation argument and DSH pre-execution approval for agent-originated calls, constrains local inputs and outputs to the active workspace, and always executes the tested plugin through Docker.

The release supports `@deepseek-ai/dsh@0.1.0-rc.6`. The native tool returns a bounded structured result and points to the complete canonical evidence under `.dsh-testkit/runs`.

## Verification

| Gate | Result |
|---|---|
| TDD RED | Passed: missing plugin module, bundle patch and AbortSignal forwarding produced the expected failures |
| `pnpm validate` | Passed: 15 test files, 85 tests, typecheck, contract checks, coverage and build |
| Coverage | Passed: 54.07% statements, 74.15% branches, 58.60% functions and 54.07% lines |
| Existing real DSH lifecycle | Passed: 8 fixtures/cases against rc.6 in 630.796 seconds, including the Docker boot-failure case |
| Native DSH bundle | Passed: packed install, active config layer, `dsh_test` registration, real runtime invocation, healthy Docker lifecycle and removal in 152.021 seconds |
| Packed consumer | Passed: v0.2.0 CLI/library import, DSH manifest, patch export, tool schema, embedded sources and Docker image build |
| Tool safety regressions | Passed: confirmation, DSH approval gate, downstream denial preservation, credential rejection, workspace escape, symlink escape, output-parent escape, forced Docker and bounded projection |
| Workflow validation | `actionlint v1.7.12` passed for CI and release workflows |
| Package quality | `publint v0.3.23` passed; dry-run tarball is under 150 KB and contains the declared bundle/runtime assets |
| Dependency security | No known high or critical production vulnerability from the public npm advisory endpoint |
| Delivery artifacts | T006 packet, implementation evidence and residual risks are recorded |
| Hosted PR and release gates | Pending protected-branch PR, required checks and trusted publishing |
| npm and marketplace | Pending `dsh-testkit@0.2.0` publication and official directory submission |

## Review

- Spec compliance: Passed locally for US-006 and FR-019 through FR-022.
- Engineering quality: Passed locally with no open P0 or P1 finding.
- Security boundary: Passed locally; the tool preserves downstream denials and adds DSH approval only when an agent originates a confirmed call.
- QA acceptance: Passed locally across unit, contract, existing real-host, native-bundle and packed-consumer paths.
- Release acceptance: Conditional on protected-branch CI, immutable tag, trusted npm publication and public verification.

## Residual Risks

- DSH and its tool APIs remain release-candidate contracts; each newly supported version requires a peer-range review and real-host bundle case.
- Docker isolation is not a proof against malicious code, and the tool requires Docker-daemon plus package-download network access.
- Network tracing remains unavailable. Requiring it returns `unsupported`.
- The complete real-host suite takes about ten minutes locally, and the additional native-bundle gate takes about three minutes with warm caches.
- Field success still requires ten community plugins, three upstream lifecycle findings, one external CI adopter and one private enterprise proof.

## Publication Targets

- Repository: [iiwish/dsh-testkit](https://github.com/iiwish/dsh-testkit)
- Release tag: `v0.2.0` pending
- npm package: `dsh-testkit@0.2.0` pending
- Official plugin directory submission: pending
