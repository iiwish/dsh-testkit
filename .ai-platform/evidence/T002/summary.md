# T002 Evidence Summary

Task: T002 Real DSH Worker, Runners And CLI
Status: Needs_Review
Attempt: T002-A001
Date: 2026-08-15

## Changed Files

- Execution boundary: `src/process/**`, `src/runners/**`, `src/worker/**` and `assets/runner.Dockerfile`.
- DSH integration: `src/adapters/dsh/**` and `src/probe/**`.
- CLI and shared contracts: `src/cli.ts`, lifecycle/report/scenario domain modules and package configuration.
- Verification: command, runner, source, worker, probe and CLI tests.

## Delivery Result

- Docker is the default isolated runner; local execution requires `--unsafe-local` and records that choice.
- The worker installs an exact DSH npm version, establishes an empty-profile baseline, packs the subject, drives the ordered lifecycle and retains a canonical report.
- The real Cordis probe verifies rows, services, tool schemas and deterministic exercises without loading plugin code in the controller or calling a model.
- Timeouts terminate process groups; controller signals are forwarded; owned roots, request files and containers are cleaned.
- Logs redact canaries and structured proxy credentials, are capped at 8 MiB per stream and use symlink-resistant replacement.
- Docker runs with a read-only root, init, dropped capabilities, `no-new-privileges`, resource limits, disposable work filesystems and read-only subject mounts.
- Reports bind the scenario snapshot, packed subject, installed DSH tree and runner image identities.

## Review

- Spec compliance: Pass for FR-003 through FR-012, FR-017, FR-018 and their mapped non-functional requirements.
- Engineering quality: Pass. DSH-specific behavior stays behind one adapter; runner transport, lifecycle semantics and report rendering remain separate.
- QA acceptance: Pass. Unit and integration tests cover success, expected failure, crash mismatch, timeout, observer unavailability, output safety and recovery.

## Residual Risks

- Network observation is intentionally unavailable and becomes `unsupported` when required.
- v0.1 produces passing host identity only for exact DSH npm versions; source-commit and nightly adapters remain later work.
- Docker is a reduced-blast-radius execution boundary, not a hardened malware sandbox.
- Direct credential injection for private registries is not a baseline feature; enterprise CI can test an already checked-out private source without uploading it.
