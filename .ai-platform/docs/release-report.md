# DSH Testkit Release Report

Version: v0.2.1
Status: Published Public Preview
Decision: GO
Last updated: 2026-08-15
Release commit: [`a16da3e304c48361fdb6fef3050201cce2939041`](https://github.com/iiwish/dsh-testkit/commit/a16da3e304c48361fdb6fef3050201cce2939041)

## Release Scope

DSH Testkit v0.2.1 preserves the CLI, GitHub Action, native `dsh_test` adapter and v1 report contracts while adding equivalent English and Simplified Chinese project entrypoints, exact-version community cohort validation, and DSH release-train canaries.

The product remains a deterministic real-host lifecycle runner. It complements static doctor/preflight checks and `dsh-composition-check`; it is not a plugin marketplace, security rating or general multi-plugin orchestrator. The supported host remains exactly `@deepseek-ai/dsh@0.1.0-rc.6`.

## Verification

| Gate | Result |
|---|---|
| TDD RED | Passed: missing Chinese README, v0.2.1 metadata, community validation and release-train modules produced the expected failures |
| `pnpm validate` | Passed: 19 test files, 97 tests, typecheck, contract checks, coverage and build |
| Coverage | Passed: 55.40% statements, 74.74% branches, 60.62% functions and 55.40% lines |
| Existing real DSH lifecycle | Passed: 8 fixture/case runs against rc.6 in 389.071 seconds locally |
| Native DSH bundle | Passed: install, registration, `dsh_test` invocation, healthy Docker lifecycle and removal in 81.972 seconds locally |
| Packed consumer | Passed: bilingual docs, both CLIs, warning-free optional peers, root imports, declarations and Docker image build for `dsh-testkit-0.2.1.tgz` |
| Community cohort | Passed: 10 exact public npm versions completed credential-free Docker quick suites; aggregate verdicts were 2 passed and 8 failed, with first failures at boot 5 and uninstall 3 |
| Responsible disclosure | Passed: committed cohort artifacts contain no plugin identity; named reports remain local pending independent reproduction and maintainer-ready evidence |
| DSH release watch | Passed: current/candidate fixtures, malformed tag rejection, disposable AST source enablement and scheduled/manual canary matrix |
| Live DSH release train | npm `latest` and `next` both resolve to supported rc.6; no unseen candidate was present on 2026-08-15 |
| Workflow validation | `actionlint v1.7.12` passed for CI, release and DSH release-watch workflows |
| Package quality | `publint v0.3.23` passed; npm dry-run includes bilingual docs, both CLIs and compiled community/release modules |
| Dependency security | `pnpm audit --prod --registry https://registry.npmjs.org/` passed with no known production vulnerability |
| Delivery artifacts | T007 packet, diff, implementation evidence, cohort reconciliation and residual risks pass the delivery validator |
| Protected-branch PR | [PR #9](https://github.com/iiwish/dsh-testkit/pull/9) merged after [CI run 31890006111](https://github.com/iiwish/dsh-testkit/actions/runs/31890006111) and [CodeQL run 31890005084](https://github.com/iiwish/dsh-testkit/actions/runs/31890005084) passed |
| Main branch | [CI run 31890278253](https://github.com/iiwish/dsh-testkit/actions/runs/31890278253) and [CodeQL run 31890278125](https://github.com/iiwish/dsh-testkit/actions/runs/31890278125) passed on the release commit |
| Trusted publication | [Release run 31890580554](https://github.com/iiwish/dsh-testkit/actions/runs/31890580554) passed full validation, both real-host suites, packed-consumer testing, npm OIDC publication and public verification |
| Public consumer | A clean public-registry install returned both CLI entrypoints and version 0.2.1, imported `createDshTestTool`, installed no optional DSH host peer and emitted no peer warning |
| Public DSH profile | A clean rc.6 host installed `dsh-testkit@0.2.1`, exposed `tool-dsh-testkit` in `--dump-config`, emitted no peer warning and removed the bundle successfully |

## Review

- Spec compliance: Passed for US-007, FR-023 through FR-028, NFR-013, NFR-014 and SC-013 through SC-016.
- Engineering quality: Passed with no open P0 or P1 finding.
- Credential boundary: Passed; cohort child processes inherit an allowlist rather than the controller environment.
- Disclosure boundary: Passed; public evidence is aggregate and explicitly environment-bound.
- QA acceptance: Passed locally, on the PR, on main, in the release workflow and against the public npm artifact.
- Release acceptance: Passed for the published artifact; governed task T007 remains `Needs_Review` until explicit user acceptance.

## Residual Risks

- Five cohort subjects require a host service absent from the minimal isolated profile. A declarative prerequisite profile or fixed support-bundle fixture is the next evidence-led experiment.
- Docker is not a hardened malware sandbox, and public package/runtime code has network access inside the disposable runner.
- Network tracing remains unavailable. Output-canary absence is not proof of absent egress.
- DSH remains a release-candidate contract. Canary success does not automatically widen the published support registry.
- General multi-plugin update, uninstall and ownership semantics remain out of scope until field evidence cannot be reproduced with prerequisite profiles, single-subject lifecycle tests and composition checks.

## Publication Targets

- Repository: [iiwish/dsh-testkit](https://github.com/iiwish/dsh-testkit)
- Pull request: [#9](https://github.com/iiwish/dsh-testkit/pull/9)
- GitHub release: [`v0.2.1`](https://github.com/iiwish/dsh-testkit/releases/tag/v0.2.1), with `v0` dereferencing to the same release commit
- npm package: [`dsh-testkit@0.2.1`](https://www.npmjs.com/package/dsh-testkit/v/0.2.1)
- npm tarball SHA-1: `45e1930f7a07c34a35d5220eda281240ff78edef`
- npm integrity: `sha512-ODAjLkDOVmo747k0eONyQPyGUrvLH39ibwmdjiG9H59VkxchTV4rQ62acPZ70B5tI9mIya227rISi3X1mr5YTg==`
- npm provenance: [SLSA v1 attestation](https://registry.npmjs.org/-/npm/v1/attestations/dsh-testkit@0.2.1)
- Community validation: [v0.2.1 aggregate report](../../docs/community-validation.md)
- Community plugin directory submission: [awesome-dsh-plugin PR #562](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/562)
