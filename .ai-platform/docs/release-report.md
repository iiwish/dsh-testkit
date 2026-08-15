# DSH Testkit Release Report

Version: v0.1
Status: Ready for Public Preview
Decision: GO
Last updated: 2026-08-15
Implementation commit: `5cb66b6`

## Release Scope

DSH Testkit v0.1 is a publishable, repository-native lifecycle runner for DeepSeek Harness plugins. It tests packed plugin artifacts against an exact real DSH installation, defaults to content-addressed Docker isolation, emits canonical machine evidence and covers install through cleanup, including update and recovery.

No repository, npm package, image, release tag or external artifact has been published by this work.

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
| Delivery artifacts | T001 through T004 packet and evidence contracts validate |

## Review

- Spec compliance: Passed for the v0.1 public-preview scope.
- Engineering quality: Passed with no open P0, P1 or P2 release finding.
- QA acceptance: GO.
- User publication instruction: Pending; the current instruction authorizes local completion, not public push or publish.

## Field Success Criteria

- Verified locally: SC-004, SC-005, SC-006, SC-007, SC-008 and the repository-native design required by SC-010.
- Public field work: SC-001 ten community plugins, SC-002 three upstream lifecycle findings, SC-003 external CI adoption and SC-009 a private enterprise repository proof.
- Network tracing is unavailable in v0.1. A scenario that requires it returns `unsupported`.

## Publication Gate

The local candidate is ready for a separate GitHub and npm publication operation. The npm name `dsh-testkit` returned `404 Not Found` from the public registry on 2026-08-15; availability remains unreserved until publication.
