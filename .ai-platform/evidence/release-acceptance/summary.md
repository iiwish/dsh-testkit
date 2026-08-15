# DSH Testkit v0.1 Release Acceptance Summary

Date: 2026-08-15
Decision: NO_GO
Candidate: Uncommitted working tree, package version `0.1.0`
Acceptance plan: `.ai-platform/docs/release-acceptance-plan.md`

## Gate Result

| Gate | Result | Summary |
|---|---|---|
| G01 Candidate and governance integrity | Failed | The repository has no `HEAD` commit, so the reviewed candidate has no immutable Git identity. |
| G02 Build, types and package contract | Passed with P2 findings | Host, Linux arm64 and Linux amd64 validation passed; clean packed consumption, `publint` and public-registry publish dry run passed. |
| G03 Scenario, report and exit-code contracts | Passed with one scope gap | Actual scenario/report JSON and JUnit validate; the documented `flaky` verdict is not produced by any workflow. |
| G04 Lifecycle state machine | Failed | Real-host fixtures pass, but full-suite semantics and required update reassembly/exact-version checks are absent. |
| G05 Supported subject inputs | Failed | The default Docker path fails for a valid local `.tgz` input during `package`. |
| G06 Isolation, secret handling and cleanup | Failed | Interruption cleanup works, but a plugin-created persistent DSH-home file can receive a passing uninstall verdict. |
| G07 Determinism and performance | Failed | Five owned-fixture runs are stable, but the same immutable public npm plugin produced both `failed` and `passed` because the observer records its own `ss` process nondeterministically. |
| G08 CI and distribution integration | Blocked | Action/workflow static validation passes; GitHub-hosted execution is not available before publication, and third-party actions use mutable major tags. |
| G09 Dependency and open-source hygiene | Failed | Audit and licenses pass; repository/package metadata and a security reporting policy are absent. |

## Blocking Findings

### RA-001 P0: Filesystem residue can produce a false pass

`addedPaths()` compares path presence only. The uninstall adapter then filters broad known DSH paths, including `.anonymous-user-id`, without checking whether the subject created or modified their contents.

Acceptance fixture behavior:

- A plugin wrote `plugin-mutated-existing-state` to `DSH_HOME/.anonymous-user-id` during boot.
- The file was absent from both pre-install and pre-boot snapshots.
- The file remained in the post-uninstall snapshot with SHA-256 `fce2947749bd655b55b924cac470083bb402e706ef7f1b6494c734fbb5a23eda`.
- `uninstall.filesystem.residue` reported `passed` with `actual: []`, and the overall verdict was `passed`.

Release impact: the core product can assert clean uninstall while subject-created persistent state remains.

### RA-002 P1: Process observer creates nondeterministic false failures

Process and listening-port commands execute concurrently. A process checkpoint can include the sibling `ss -lntup` observer, while `processCommands()` filters only its own `ps` command.

The same `dsh-plugin-greeter@0.1.11` input, scenario digest, package digest, DSH integrity and runner image produced:

- Run 1: `failed`, because cleanup reported `ss -lntup` as process residue.
- Run 2: `passed`.

Release impact: an immutable healthy input can receive conflicting verdicts without being classified `flaky`.

### RA-003 P1: Local tarball input is broken in the default runner

Docker mounts every existing primary input at `/input/primary`. The mounted `.tgz` loses its filename extension, and `npm pack /input/primary` treats the file as a directory. The real acceptance run failed with `ENOTDIR` while reading `/input/primary/package.json`.

Release impact: FR-001 and the advertised tarball workflow do not work through the default Docker path.

### RA-004 P1: Flaky and full-suite contracts are not implemented

`deriveVerdict()` can return passed, failed, unsupported or infrastructure error, but never `flaky`. No multi-run workflow exists. `quick` and `full` execute the same adapter calls and stage statuses.

Release impact: exit code 5 and `--suite full` are public contracts without corresponding behavior.

### RA-005 P1: Update verification does not satisfy the approved transition

The update stage checks only that the installed version changed, not that it equals the primary packed version. It boots and probes services/tools but does not re-run configuration assembly or expected-row checks after update.

Release impact: a wrong target version or post-update configuration regression can pass the update gate.

### RA-006 P1: Runner image cache trusts a version-only local tag

The Docker runner accepts any existing `dsh-testkit-runner:0.1.0` image after `docker image inspect`; it does not compare a build-context digest or expected label.

Release impact: stale or unrelated local image content can execute under the current Testkit version and generate a schema-valid report.

### RA-007 P1: Release automation uses mutable third-party references

The workflow and composite Action reference `actions/*@v4`, `pnpm/action-setup@v4` and `mikepenz/action-junit-report@v5`. The confirmed Constitution requires third-party sources and artifacts to be pinned to a commit, version or digest.

Release impact: CI evidence is not reproducible against immutable automation code.

### RA-008 P1: The release candidate has no immutable Git identity

`git rev-parse --verify HEAD` fails because the repository has no commit. All project files are working-tree additions.

Release impact: no reviewed commit can be tagged, referenced by npm provenance or compared with the published tarball.

## Non-Blocking Release-Quality Findings

- RA-009 P2: `dsh-test --version` exits 2 because the option is not registered.
- RA-010 P2: `package.json` has no `repository`, `homepage`, `bugs`, `author`, `publishConfig` or top-level `types`; README still contains `YOUR_ORG`.
- RA-011 P2: No `SECURITY.md`, changelog or issue templates exist for the public repository.
- RA-012 P2: Coverage cannot be measured with the current project dependencies, and failure-path orchestration is not retained as a repository test for every stage.

## Positive Evidence

- Five real default-Docker runs of the owned healthy/update fixture had one identical semantic signature and completed in 65.6 to 76.5 seconds.
- The real DSH suite passed all five owned fixture cases against `@deepseek-ai/dsh@0.1.0-rc.6`.
- Controller SIGINT returned infrastructure exit 3, removed the container and request file, and produced no false report.
- Requiring the unavailable network observer returned `unsupported` and exit 4.
- A missing exact DSH version returned infrastructure exit 3.
- A pinned full-SHA Git fixture completed the lifecycle in explicit unsafe-local mode.
- A registration failure returned exit 1 at `register` and retained valid JSON, JUnit and Markdown.
- The release tarball is byte-reproducible across two packs with SHA-256 `114b08168248d28dccff6d28bf517621dc62c3e9269222416b3b8b94785d8758`.

## Release Condition

Publication remains blocked until RA-001 through RA-008 are resolved and the full acceptance plan is rerun against an immutable commit. Public field gates SC-001, SC-002, SC-003 and SC-009 remain post-public-preview measurements.
