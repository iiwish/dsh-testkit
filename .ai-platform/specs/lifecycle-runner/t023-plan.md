# T023 Patch Release v0.4.4

Status: Confirmed
Date: 2026-09-10
Approval: User explicitly approved completing the proposed npm 0.4.4, GitHub Release v0.4.4 and Action v0 publication after validation.

## Scope And Work Graph

T023 is one sequential release task depending on merged maintenance PRs #44 and #46 through #50. Prepare version identity, canonical bilingual documentation and changelog; validate the release PR and exact main commit; publish through the existing trusted workflow; verify public distribution and advance v0 using an exact-old-value lease. Direct execution applies because delegation is not authorized.

The default DSH host, schemas, exit codes and dependency graph remain unchanged. No external repository writes, immutable tag retargeting, automation changes or failed-gate bypasses are permitted.

## Checklist And Analysis

- Explicit release approval and clean worktree verified.
- Existing product contract and constitution apply; no additional behavior is introduced.
- Runtime and package identity assertions are updated first for RED/GREEN verification.
- Required gates: clean install, pnpm validate, six-host CI including lifecycle/native bundle/installed package and positive/negative Action checks, CodeQL, package dry-run, trusted publication, public npm provenance/content identity and released consumer/Action execution.
- Registry distribution evidence is distinct from source and unpublished package evidence.
- No Critical/High contract conflicts identified. Stop on any mandatory failed gate.

Packet: `packets/T023.yaml`. Evidence: `.ai-platform/evidence/T023/`. State: Needs_Review; distribution is verified and final acceptance belongs to the user.
