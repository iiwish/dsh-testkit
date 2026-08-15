# DSH Testkit Release Report

Version: v0.1.1
Status: Published Public Preview
Decision: GO
Last updated: 2026-08-15
Release commit: `8c52ad1`

## Release Scope

DSH Testkit v0.1.1 is a published, repository-native lifecycle runner for DeepSeek Harness plugins. It tests packed plugin artifacts against an exact real DSH installation, defaults to content-addressed Docker isolation, emits canonical machine evidence and covers install through cleanup, including update and recovery.

The public distribution consists of the `iiwish/dsh-testkit` GitHub repository, immutable `v0.1.0` and `v0.1.1` release tags, the moving `v0` GitHub Action tag, and the public `dsh-testkit` npm package. npm `latest` resolves to `0.1.1`.

## Verification

| Gate | Result |
|---|---|
| `pnpm validate` | Passed: typecheck, build, 11 test files, 64 tests and enforced V8 coverage |
| Clean Linux validation | Passed on Node 22 for arm64 and amd64 |
| Real DSH E2E | Passed: 6 fixtures against `@deepseek-ai/dsh@0.1.0-rc.6` in 337.782 seconds |
| Default-Docker full suite | Passed 5/5 for `dsh-plugin-greeter@0.1.11` with one semantic digest |
| Default-Docker tarball | Passed the complete quick lifecycle |
| Residue attribution | Added, modified and removed content is compared; known-name residue correctly fails |
| Runner image identity | Digest-keyed tag, full context label and pinned multi-architecture base image passed |
| Interruption cleanup | Exit 3, no container or request residue, infrastructure report with cleanup evidence |
| Packed consumer | Passed, including ESM import, CLI version and Docker image build |
| Package quality | `publint` passed; dry run contains 107 files and no tests or private governance files |
| Production dependencies | No known vulnerabilities; MIT, ISC and Python-2.0 licenses |
| Static Action validation | Actionlint, composite schema validation and immutable-reference gate passed |
| Hosted GitHub CI | Passed on release commit `8c52ad1`: validation, 6 real DSH fixtures, packed consumer and composite Action smoke |
| Public npm install | Cold-cache execution of `dsh-testkit@0.1.1` returned CLI version `0.1.1` |
| Delivery artifacts | T001 through T004 packet and evidence contracts validate |

## Review

- Spec compliance: Passed for the v0.1 public-preview scope.
- Engineering quality: Passed with no open P0, P1 or P2 release finding.
- QA acceptance: GO.
- User publication instruction: Completed for GitHub push, release tags and npm publication.

## Field Success Criteria

- Verified locally: SC-004, SC-005, SC-006, SC-007, SC-008 and the repository-native design required by SC-010.
- Public field work: SC-001 ten community plugins, SC-002 three upstream lifecycle findings, SC-003 external CI adoption and SC-009 a private enterprise repository proof.
- Network tracing is unavailable in v0.1. A scenario that requires it returns `unsupported`.

## Publication

- Repository: <https://github.com/iiwish/dsh-testkit>
- Release tag: <https://github.com/iiwish/dsh-testkit/releases/tag/v0.1.1>
- npm package: <https://www.npmjs.com/package/dsh-testkit/v/0.1.1>
- The interactive local npm release is published without provenance because GitHub OIDC is unavailable locally. `publishConfig.provenance` remains enabled for a future trusted-publishing workflow.
