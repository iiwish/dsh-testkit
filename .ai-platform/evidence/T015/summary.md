# T015 DSH Support And Evidence Safety

Status: In_Progress
Base: `d6727279a9dc57bb5b23d2568a8137b9e5b2315c`.
User approval: Exact rc.1 support, main monitoring closure and unified evidence checks; PR creation and merge after Linux acceptance; no npm release.

## Contract

DSH `0.1.2-rc.1` must pass lifecycle, HTTP/browser, negative residue, native bundle, installed-package Docker execution and healthy/negative Action smoke before support is merged. The default remains `0.1.1-rc.2` and alpha candidates remain unsupported.

Artifact upload and JUnit publication consume fresh staged evidence, not raw output directories. A shared fail-closed policy allows only known diagnostic formats, bounded input and regular non-linked files, rejects recognizable credentials, and reports rejection categories without exposing content. This is defense in depth, not arbitrary-secret or screenshot-privacy certification.

## Preflight

- T014 Linux and publication evidence is complete; main is clean.
- A baseline main Release Watch was dispatched as run `34201769307`.
- Inspection found packaged-consumer smoke builds the installed package image but does not execute its CLI against the selected host. T015 adds that missing acceptance rather than treating a successful build as host compatibility proof.
- Existing required check identities are preserved. No default-host switch, new npm version or tag update is in scope.
