# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases use [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-15

### Added

- Added the official `dsh.bundle.patch` manifest so `dsh-testkit` installs directly into DSH profiles.
- Added the native `dsh_test` tool as a thin adapter over the existing lifecycle engine.
- Added real DSH bundle install, registration, invocation, removal, and packed-consumer verification.

### Security

- Required explicit confirmation for native tool execution and forced every tool-triggered run through Docker.
- Restricted local tool inputs and symlink targets to the active workspace, disabled implicit repository configuration, and bounded tool output.
- Forwarded DSH cancellation signals through the runner and owned subprocess group.

## [0.1.2] - 2026-08-15

### Added

- Added `--case` lifecycle-stage reruns with required-prefix execution, cleanup, report identity, and reproduction commands.
- Added runtime and published JSON Schema compatibility fixtures for the v1 scenario and report contracts.
- Added an explicit DSH adapter support registry for `@deepseek-ai/dsh@0.1.0-rc.6`.
- Added an OIDC trusted-publishing workflow for npm releases with automatic provenance.

### Fixed

- Made composite Action output, JUnit check, and artifact identities safe for plugin matrices and repeated invocations.
- Preserved complex Action arguments through `args-json` and exposed artifact identity outputs.
- Removed duplicated runner lockfiles, embedded TypeScript sources in published source maps, and made packed-consumer cleanup deterministic.

### Security

- Scoped GitHub Actions write permissions to the JUnit job and cancelled superseded CI runs.

## [0.1.1] - 2026-08-15

### Fixed

- Made the composite GitHub Action portable by removing an invalid parent-traversing cache path.
- Added a release check that rejects parent traversal in GitHub Actions cache dependency paths.

## [0.1.0] - 2026-08-15

### Added

- Real DSH install-to-recovery lifecycle execution in Docker or explicit unsafe-local mode.
- Canonical JSON, JUnit, Markdown, and terminal reports with stable verdict exit codes.
- Directory, tarball, exact npm, and full-commit Git subject inputs.
- Content-aware filesystem, process, port, and canary observers.
- Update, expected-failure recovery, full-suite repeatability, and flaky-result classification.
- Composite GitHub Action, real-host fixtures, and packed-consumer verification.

[Unreleased]: https://github.com/iiwish/dsh-testkit/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/iiwish/dsh-testkit/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/iiwish/dsh-testkit/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/iiwish/dsh-testkit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/iiwish/dsh-testkit/releases/tag/v0.1.0
