# DSH Testkit Release Report

Version: v0.2.0
Status: Published Public Preview
Decision: GO
Last updated: 2026-08-15
Release commit: [`73e6058258564698911f3b1ca92d062647f1b423`](https://github.com/iiwish/dsh-testkit/commit/73e6058258564698911f3b1ca92d062647f1b423)

## Release Scope

DSH Testkit v0.2.0 preserves the CLI, GitHub Action and v1 report contracts while publishing the same lifecycle engine as a DSH-native Profile Bundle. The bundle registers `dsh_test`, requires both a confirmation argument and DSH pre-execution approval for agent-originated calls, constrains local inputs and outputs to the active workspace, and always executes the tested plugin through Docker.

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
| Required-check continuity | Contract coverage keeps `real-host` and both Action smoke matrix identities successful for documentation-only pull requests while skipping their expensive execution steps |
| Package quality | `publint v0.3.23` passed; dry-run tarball is under 150 KB and contains the declared bundle/runtime assets |
| Dependency security | `pnpm audit --prod --registry https://registry.npmjs.org/` passed with no known production vulnerability |
| Delivery artifacts | T006 packet, implementation evidence and residual risks are recorded |
| Protected-branch PR | [PR #7](https://github.com/iiwish/dsh-testkit/pull/7) merged after [CI run 31883230903](https://github.com/iiwish/dsh-testkit/actions/runs/31883230903) passed validate, Action smoke and real-host gates |
| Main branch | [CI run 31883503152](https://github.com/iiwish/dsh-testkit/actions/runs/31883503152) and [CodeQL run 31883502999](https://github.com/iiwish/dsh-testkit/actions/runs/31883502999) passed on the release commit |
| Trusted publication | [Release run 31883743981](https://github.com/iiwish/dsh-testkit/actions/runs/31883743981) passed validation, both real-host suites, packed-consumer testing, npm OIDC publication and public verification |
| Public consumer | A clean project installed `dsh-testkit@0.2.0` from `registry.npmjs.org`; the CLI returned `0.2.0`, the root library exported `createDshTestTool`, and the installed package declared the DSH bundle and peers |
| Community directory | [awesome-dsh-plugin PR #562](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/562) is open with English and Chinese entries for the released package |

## Review

- Spec compliance: Passed locally for US-006 and FR-019 through FR-022.
- Engineering quality: Passed locally with no open P0 or P1 finding.
- Security boundary: Passed locally; the tool preserves downstream denials and adds DSH approval only when an agent originates a confirmed call.
- QA acceptance: Passed locally across unit, contract, existing real-host, native-bundle and packed-consumer paths.
- Release acceptance: Passed for the published artifact; governed task T006 remains `Needs_Review` until explicit user acceptance.

## Residual Risks

- DSH and its tool APIs remain release-candidate contracts; each newly supported version requires a peer-range review and real-host bundle case.
- Docker isolation is not a proof against malicious code, and the tool requires Docker-daemon plus package-download network access.
- Network tracing remains unavailable. Requiring it returns `unsupported`.
- The complete real-host suite takes about ten minutes locally, and the additional native-bundle gate takes about three minutes with warm caches.
- Field success still requires ten community plugins, three upstream lifecycle findings, one external CI adopter and one private enterprise proof.

## Publication Targets

- Repository: [iiwish/dsh-testkit](https://github.com/iiwish/dsh-testkit)
- GitHub release: [`v0.2.0`](https://github.com/iiwish/dsh-testkit/releases/tag/v0.2.0), with `v0` pointing to the same release commit
- npm package: [`dsh-testkit@0.2.0`](https://www.npmjs.com/package/dsh-testkit/v/0.2.0)
- npm tarball SHA-1: `5db1e8322307decacb3d3b80564f37591a8bb6a8`
- npm integrity: `sha512-cDgCYVtCnlR8P6lY4NVUdTZ2DD8LP0FM6qihKwmVH1UW5hZQAcKPRBAq5MZ9+cL5sjxmhs0pl0ZVaIYoXLfIbg==`
- npm provenance: [SLSA v1 attestation](https://registry.npmjs.org/-/npm/v1/attestations/dsh-testkit@0.2.0)
- Community plugin directory submission: [awesome-dsh-plugin PR #562](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/562)
