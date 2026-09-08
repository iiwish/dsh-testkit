# T015 DSH Support And Evidence Safety

Status: Accepted
Acceptance: User approved the next-stage plan including T015 acceptance on 2026-09-08; publication remains unauthorized.
Base: `d6727279a9dc57bb5b23d2568a8137b9e5b2315c`.
Implementation: [PR #40](https://github.com/iiwish/dsh-testkit/pull/40), merged as `1bf96dbc6711833cc367c91b012caa6f38d0ab8b`.
User approval: Exact rc.1 support, main monitoring closure and unified evidence checks; PR creation and merge after Linux acceptance; no npm release.

## Contract

DSH `0.1.2-rc.1` must pass lifecycle, HTTP/browser, negative residue, native bundle, installed-package Docker execution and healthy/negative Action smoke before support is merged. The default remains `0.1.1-rc.2` and alpha candidates remain unsupported.

Artifact upload and JUnit publication consume fresh staged evidence, not raw output directories. A shared fail-closed policy allows only known diagnostic formats, bounded input and regular non-linked files, rejects recognizable credentials, and reports rejection categories without exposing content. This is defense in depth, not arbitrary-secret or screenshot-privacy certification.

## Delivered Scope

- Exact `0.1.2-rc.1` source support joins the formal lifecycle, native-bundle, installed-package Docker and positive/negative Action matrix. Default host and all older supported versions remain unchanged.
- `test:pack` installs the produced tarball into a clean consumer and executes that installed CLI against the selected real Docker host. Its report must pass and identify the correct host/package with successful registration and deterministic exercise.
- Formal CI, Release Watch, the source Composite Action and the release workflow share the same evidence gate. Artifact and JUnit actions read only its successful staged output. Failed safety checks remain failed jobs and suppress publication.
- Release Watch closes with an always-run summary of ref, SHA, discovery, independent canary lanes, runnable versions and pending npm versions. Its current candidate is `0.1.3-alpha.2`; `0.1.3-alpha.1` awaits an exact npm package. Older alphas remain unsupported and fall below the new formal-version threshold.
- Required check identities, schemas, exit codes, package version and release tags are preserved. This is source delivery, not npm or Action `v0` publication.

## Review And Evidence

Self-review found and fixed structured Authorization/cookie and refresh/environment-token gaps through failing tests before merge. All 219 local tests pass. Formal Linux CI passes all 17 jobs across five hosts. The branch monitor passes discovery, both candidate lanes and its final summary.

All 15 formal artifacts, both branch-monitor artifacts and both main-monitor artifacts were downloaded, replayed through the final scanner and compared entry-by-entry with their path, byte-count and SHA-256 manifests. Five installed-package reports identify Docker, a real image SHA-256 and the selected host. Fifteen intentionally failed formal negative-fixture reports remain available without weakening test verdicts.

The [main-branch monitor](https://github.com/iiwish/dsh-testkit/actions/runs/34205717065) passes discovery, both candidate lanes and the final summary at merge commit `1bf96dbc6711833cc367c91b012caa6f38d0ab8b`. Detailed receipts and review limitations are in `test-results.md`.

## Boundaries

- The scanner is defense in depth, not arbitrary-secret detection, screenshot privacy certification or a sandbox against concurrently hostile processes.
- Browser acceptance covers the existing bounded DOM-transition contract. The rc.1 screenshot shows the upstream first-run testing notice; it is not proof of a visually unobstructed interaction flow.
- The release publishing job is linted and contract-tested but is not executed in this iteration. Published npm `0.4.2` and Action `v0` do not include these source changes.
- Merge and T015 acceptance are authorized; package publication is not.
