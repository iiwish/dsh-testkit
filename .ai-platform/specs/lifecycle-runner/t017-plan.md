# T017 Patch Release

Status: Confirmed
Date: 2026-09-09
Approval: User accepted continuation of the remaining review/acceptance/release work and explicitly authorized publishing `0.4.3`, creating its GitHub Release/tag and updating Action `v0` after all checks pass.

## Scope

1. Close optional dependency PR #35 after review; retain the tested dependency graph. Record T016 acceptance and the user's pause of the bounded scheduler follow-up.
2. Prepare `0.4.3` version identity, release notes and canonical bilingual support documentation for accepted T015/T016 delivery.
3. Validate the release PR and exact protected-main commit with all five supported hosts, negative fixtures, native bundle, installed tarball, independent browser and external-template acceptance. Publish only through the existing trusted workflow.
4. Verify public npm metadata, tarball contents, signatures/provenance, clean consumer and released Action identity/execution. Create the GitHub Release and advance `v0` with an exact-old-value lease.

## Boundaries

- No runtime feature, schema, exit-code, default-host or unrelated dependency change. The release audit requires the narrowly scoped `js-yaml` transitive security patch from `4.3.1` to `4.3.2` for GHSA-2883-xcg3-v3hh, including the generated runner lock and a bounded negative-control regression test.
- No external repository writes, automatic retries of deterministic failures or restoration of paused automations.
- Existing immutable release tags cannot move. A failed mandatory check stops publication.
- Natural scheduler delivery remains an optional pending observation; a manual run is not its substitute.

## Validation And Analysis

Version assertions are updated first and must fail before the identity change. Run `pnpm validate`, actionlint, package dry-run, clean consumer/API/type checks, production audit and package-export validation. Linux CI must pass all 18 jobs and CodeQL before merge; exact-main checks precede tagging. Inspect release/public-consumer receipts and safety manifests before final handoff.

Checklist: scope is bounded to accepted work; explicit publication approval is present; dependencies stay unchanged; credential-free lifecycle tests and least-privilege publishing are retained. No Critical/High contract conflict identified. Direct execution is required because no delegation was authorized.

Task: T017. Depends on: T016. Parallel: No. Status: Running.
Packet: `packets/T017.yaml`. Evidence: `.ai-platform/evidence/T017/`.
