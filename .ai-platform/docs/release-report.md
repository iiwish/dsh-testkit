# DSH Testkit Release Report

Version: v0.1
Status: Blocked
Last updated: 2026-08-15

## Release Scope

The `lifecycle-runner` MVP exists in the local repository and is not ready for publication. Release acceptance found a filesystem-residue false pass, a nondeterministic process-observer false failure, a broken default-Docker tarball path, incomplete flaky/full/update contracts, an unverified runner-image cache, mutable CI dependencies and no immutable Git candidate. No repository, npm package, image or release tag has been published.

## Verification

| Gate | Result |
|---|---|
| `pnpm validate` | Passed: typecheck, build, 9 test files and 41 tests |
| Clean Linux validation | Passed on Node v22.23.2 for arm64 and amd64 |
| Real DSH E2E | Passed: 5 fixtures against `@deepseek-ai/dsh@0.1.0-rc.6` in 275.43 s |
| Healthy default Docker repeat | Passed 5/5 with one semantic signature and 65.6-76.5 s duration |
| Exact npm repeat | Failed: identical immutable input produced both failed and passed verdicts |
| Default Docker tarball | Failed at package with npm `ENOTDIR` |
| Filesystem residue fault | Failed: plugin-created persistent file received a passed uninstall verdict |
| Interruption cleanup | Passed: exit 3, no container, request file or false report |
| Packed consumer | Passed, including a Docker image build from the installed tarball |
| Production dependency audit | No known vulnerabilities from the public npm registry |
| Static Action validation | `actionlint`, composite validation and ShellCheck passed |
| Delivery artifact validator | Passed for T001 through T003 |

The complete release test design is `.ai-platform/docs/release-acceptance-plan.md`. Findings and command results are retained in `.ai-platform/evidence/release-acceptance/`.

## Review

- Spec compliance: Failed for FR-001, FR-009, NFR-001, NFR-002, NFR-006 and the confirmed full/flaky contracts.
- Engineering quality: Failed because filesystem cleanup can false-pass and the process observer can classify its own command as subject residue.
- QA acceptance: NO_GO. Eight P0/P1 release findings remain open.
- User acceptance: Pending. Governed tasks remain `Needs_Review`.

## Field Success Criteria

- Verified locally: SC-005, SC-006, SC-007, SC-008 and the repository-native design required by SC-010.
- Requires public field work: SC-001 ten community plugins, SC-002 three upstream lifecycle findings, SC-003 external CI adoption, SC-004 five-run consistency measurement and SC-009 a private enterprise repository proof.
- The `flaky` verdict and exit code are stable contracts; multi-run aggregation is not a v0.1 CLI workflow.
- Network tracing is unavailable in v0.1. A scenario that requires it returns `unsupported`.

## Publication Gate

Publishing to GitHub, npm or a container registry is blocked until RA-001 through RA-008 in the release acceptance summary are resolved and the full gate is rerun against an immutable commit. The npm name `dsh-testkit` returned `404 Not Found` from the public registry on 2026-08-15, but availability is not reserved until publication.
