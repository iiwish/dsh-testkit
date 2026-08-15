# DSH Testkit Release Report

Version: v0.1.2
Status: Approved Release Candidate
Decision: GO after hosted CI and npm trusted-publisher verification
Last updated: 2026-08-15
Release identity: `v0.1.2` must point to the reviewed merge commit

## Release Scope

DSH Testkit v0.1.2 tests packed DeepSeek Harness plugins in a real supported DSH host, preserves versioned JSON/JUnit evidence, and supports focused lifecycle-stage reruns without bypassing their required prefix.

The release supports `@deepseek-ai/dsh@0.1.0-rc.6`. Exact unsupported host versions return exit code 4 before runner creation. The v1 scenario contract remains unchanged; the v1 report contract adds the optional `scenario.case` field and retains compatibility with v0.1.1 fixtures.

## Verification

| Gate | Result |
|---|---|
| TDD RED | Passed: focused tests failed for missing case selection, support gating, Action identity and compatibility fixtures |
| `pnpm validate` | Passed: 13 test files, 76 tests, typecheck, contract checks, coverage and build |
| Coverage | Passed: 51.09% statements, 75.70% branches, 54.76% functions and 51.09% lines |
| Real DSH E2E | Passed: 7 local-runner fixtures/cases in 285.284 seconds plus the targeted Docker boot-failure regression in 91.016 seconds |
| Single-case real host | Passed: resolve through boot executed, later stages skipped, cleanup retained |
| Packed consumer | Passed: dynamic v0.1.2 identity, embedded source maps, schemas, lock generation and Docker build |
| Contract compatibility | Passed: v0.1.1 scenario and report fixtures validate with runtime and published JSON schemas |
| Composite Action | Local identity and argument tests passed; hosted two-plugin matrix smoke is the publication gate |
| Workflow validation | `actionlint v1.7.12` and immutable Action-reference checks passed |
| Package quality | `publint v0.3.23` passed |
| Dependency security | No known production or development vulnerabilities from the public npm advisory endpoint |
| Trusted publishing | Workflow uses GitHub OIDC, Node 24, npm 11.19.0, no package-manager cache and an `npm` environment |
| Delivery artifacts | T005 packet and local evidence exist; public identities are recorded after publication |

## Review

- Spec compliance: Passed for FR-018 case reruns and the existing v0.1 product boundary.
- Engineering quality: Passed locally with no open P0 or P1 finding.
- QA acceptance: GO for hosted CI.
- Publication: Tagging and npm publication remain blocked until the pull request is green and npm trusts `release.yml` for `iiwish/dsh-testkit` in environment `npm`.

## Residual Risks

- The DSH adapter has real-host coverage but low instrumented unit coverage because its subprocess behavior runs outside V8 coverage collection.
- `actions/upload-artifact@v7` is unavailable on GitHub Enterprise Server; GHES users invoke the CLI directly.
- Network tracing remains unavailable. Requiring it returns `unsupported`.
- Field success still requires ten community plugins, three upstream lifecycle findings, one external CI adopter and one private enterprise proof.

## Publication Targets

- Repository: <https://github.com/iiwish/dsh-testkit>
- Release tag: <https://github.com/iiwish/dsh-testkit/releases/tag/v0.1.2>
- npm package: <https://www.npmjs.com/package/dsh-testkit/v/0.1.2>
