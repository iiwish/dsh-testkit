# DSH Testkit v0.1 Release Acceptance Summary

Date: 2026-08-15
Decision: GO
Channel: Public preview
Implementation commit: `5cb66b6`
Branch: `codex/release-hardening`
Acceptance plan: `.ai-platform/docs/release-acceptance-plan.md`

## Gate Result

| Gate | Result | Summary |
|---|---|---|
| G01 Candidate and governance integrity | Passed | The implementation has an immutable local commit; delivery artifacts and version identities validate. |
| G02 Build, types and package contract | Passed | Host and clean Linux arm64/amd64 validation, packed consumption, `publint`, ESM export analysis and public-registry dry run pass. |
| G03 Scenario, report and exit-code contracts | Passed | Runtime and published schemas validate; repeatability makes flaky and exit code 5 executable. |
| G04 Lifecycle state machine | Passed | Six real-host fixtures and retained fault tests cover every lifecycle stage, exact update target and post-update assembly. |
| G05 Supported subject inputs | Passed | Directory, local tarball, exact npm and pinned Git behaviors have executable proof. |
| G06 Isolation, secret handling and cleanup | Passed | Content-aware residue detection catches known-name files; interruption removes the container and retains an infrastructure report with cleanup evidence. |
| G07 Determinism and performance | Passed | The same immutable community plugin passed five default-Docker attempts with one semantic digest; every attempt completed under 86 seconds. |
| G08 CI and distribution integration | Passed for publication | Workflow and composite Action validate, use immutable external SHAs and package cleanly; hosted execution follows repository publication. |
| G09 Dependency and open-source hygiene | Passed | Audit, licenses, provenance metadata, security policy, changelog and community templates are ready. |

## Finding Resolution

| Finding | Resolution | Regression evidence |
|---|---|---|
| RA-001 P0 | Snapshots compare path, kind, size and digest; added, modified and removed changes are attributed. Only profile package-manager paths are allowlisted. | `tests/unit/snapshot.test.ts`; known-path residue real fixture fails uninstall with `added:dsh-home/.anonymous-user-id`. |
| RA-002 P1 | Process and port observers execute sequentially and their own commands are excluded. | Observer unit tests; `dsh-plugin-greeter@0.1.11` full run passed 5/5 with one digest. |
| RA-003 P1 | Docker file inputs mount at extension-bearing `/input/{label}.tgz` paths. | Runner unit test and real default-Docker tarball lifecycle pass. |
| RA-004 P1 | Full defaults to five attempts, repeat reports carry semantic digests, inconsistent outcomes become `flaky`, and JUnit adds a repeatability case. | CLI integration and repeatability unit tests; real full report has 5/5 attempts. |
| RA-005 P1 | Update requires exact target name/version and reruns dump-config row assertions before boot, registration and exercise probes. | Update helper unit test and healthy/update real fixture assertions. |
| RA-006 P1 | Image tags include a context digest, the full digest is a label, reuse verifies the label, and the base image is digest-pinned. | Runner unit/static gates and controlled stale-label rebuild. |
| RA-007 P1 | Every external GitHub Action reference is a 40-character commit SHA. | `check-action-pins.mjs`, actionlint and composite Action validation. |
| RA-008 P1 | Local immutable implementation commit exists on the release-hardening branch. | `git rev-parse HEAD` and clean-tree checks. |
| RA-009 P2 | Commander exposes `--version` without creating a runner. | CLI integration and packed binary output `0.1.0`. |
| RA-010 P2 | npm repository, homepage, bugs, author, provenance publish config and type entrypoints are complete; no README placeholder remains. | Release-readiness script, `publint`, package export analysis and dry run. |
| RA-011 P2 | Security policy, changelog, issue forms, PR template and Dependabot policy exist. | Release-readiness script. |
| RA-012 P2 | V8 coverage has enforced thresholds and all 13 stage fault paths are retained. | 64 unit/integration tests; parameterized stage-failure suite; coverage gate. |

## Stable Full-Suite Identity

- Run: `20260815075115-fb14ab93`
- Subject: `dsh-plugin-greeter@0.1.11`
- DSH: `@deepseek-ai/dsh@0.1.0-rc.6`
- Semantic digest: `sha256:f4d5dfd2f8e9dbff38cfe9eed4477d00effdbf87137c871c2d27bd63f7a5f281`
- Runner image: `dsh-testkit-runner:0.1.0-2f86c91963b8`
- Runner image ID: `sha256:153f50a554a902f61473a7d635460a48d41bdcd23a0df08be83fefd06b1768c8`
- Attempts: 5 passed, 5 completed, 1 semantic digest, 60.009 to 85.956 seconds

## Publication Boundary

The candidate is ready for a public-preview repository and npm publication. No push, tag, GitHub repository creation or npm publish has been performed. GitHub-hosted Action execution and public field criteria SC-001, SC-002, SC-003 and SC-009 start after publication and do not block this preview.

The package is ESM-only on Node.js 22 or newer. Package export analysis is green for ESM and bundlers and reports the expected warning for CommonJS `require`. Statement coverage is 49.70% across all source, with the large out-of-process DSH adapter and Docker transport primarily covered by real-host E2E; the enforced floor prevents regression without misrepresenting subprocess coverage.
