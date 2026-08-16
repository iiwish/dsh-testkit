# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases use [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added repository-root discovery and `--repo-root` for a single DSH bundle located below the Git worktree root.

### Fixed

- Kept nested-plugin scenarios beside the bundle while generating GitHub Actions and the project Agent Skill at repository root with correct relative paths and one atomic preflight.

## [0.3.1] - 2026-08-16

### Fixed

- Declared Git commit probe logs as lifecycle artifacts so testing a plugin at its repository root passes Docker output auditing.
- Added a real local Git repository regression test for commit identity and retained resolution evidence.

## [0.3.0] - 2026-08-16

### Added

- Added offline `dsh-test init` scaffolding for a deterministic scenario, least-privilege GitHub Actions workflow, and project-local Agent Skill.
- Added one canonical typed Agent Skill that ships in the npm package and registers with the optional DSH Skills service.
- Added real-host coverage for native Skill registration and packed-consumer coverage for generated adoption files.

### Security

- Preflighted every scaffold target before writing, rejected symlink path components and paths outside the plugin root, and required explicit `--force` for conflicting files.
- Kept initialization non-interactive and network-free without modifying package manifests, lockfiles, or repository instructions.

## [0.2.1] - 2026-08-15

### Added

- Added equivalent English and Simplified Chinese project entrypoints with an explicit boundary between lifecycle testing, doctor/preflight checks, and composition checks.
- Added a credential-free, exact-version community cohort protocol with aggregate-only public reporting.
- Added scheduled DSH dist-tag discovery and disposable real-host canaries for unrecognized release candidates.

### Fixed

- Made DSH host peers optional so clean CLI consumers do not install host packages or receive peer warnings.
- Removed runtime and declaration imports of DSH host packages from the native bundle adapter.
- Corrected the bundle positioning to describe a DSH-native community integration without implying official status.

### Security

- Kept community subject identities and detailed reports local, stripped credentials from cohort subprocesses, and required explicit acknowledgement before public plugin code runs.

## [0.2.0] - 2026-08-15

### Added

- Added a DSH-native `dsh.bundle.patch` manifest so `dsh-testkit` installs directly into DSH profiles.
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

[Unreleased]: https://github.com/iiwish/dsh-testkit/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/iiwish/dsh-testkit/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/iiwish/dsh-testkit/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/iiwish/dsh-testkit/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/iiwish/dsh-testkit/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/iiwish/dsh-testkit/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/iiwish/dsh-testkit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/iiwish/dsh-testkit/releases/tag/v0.1.0
