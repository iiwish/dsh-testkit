# DSH Testkit v0.3 Release Acceptance Plan

Version: v0.3.0
Status: Active
Release channel: Public preview
Source of truth: `constitution.md`, `product-design.md`, lifecycle contracts and package manifest
Last updated: 2026-08-16

## 1. Acceptance Objective

This plan decides whether the current release candidate can be published as an honest, reproducible public preview. A passing result proves the documented DSH lifecycle behavior for the tested versions and environments. It is not a security certification or a claim of compatibility with every plugin.

The release decision uses fresh evidence from the candidate being reviewed. Historical green runs are supporting context, not substitutes for this execution.

## 2. Decision Rules

- `GO`: every mandatory gate passes and there are no open P0 or P1 findings.
- `CONDITIONAL_GO`: executable behavior is releasable, but publication metadata or repository operations must be completed atomically with release.
- `NO_GO`: a mandatory gate fails, a supported input path is unproved, evidence can be forged or confused, cleanup is unreliable, or the candidate has no immutable Git identity.
- P0 means false-pass, host-safety or artifact-integrity risk.
- P1 means a documented core workflow is broken or lacks credible acceptance evidence.
- P2 means release-quality or maintainability debt that should be fixed but does not invalidate core results.

## 3. Test Environments

| Environment | Purpose |
|---|---|
| Host Node.js and pnpm | Fast unit, integration and static checks |
| Clean Linux Node.js 22 container | Supported-runtime and clean-install proof |
| Default Docker runner | User-visible isolation, lifecycle and cleanup proof |
| Linux amd64 container or emulator | GitHub-hosted runner architecture smoke |
| Public npm registry | Exact npm source and dependency-resolution proof |

Every real-host result records DSH version, Node version, OS, architecture, package digest, scenario digest and runner image identity.

## 4. Mandatory Gates

### G01 Candidate And Governance Integrity

Requirements: Constitution 3 and 4, release policy.

- `git diff --check` passes.
- Delivery artifacts validate and contain no unfinished governed task state.
- The release candidate has an immutable Git commit and the reviewed tree matches that commit.
- Version values agree across `package.json`, runtime constants, package contents and release report.
- No generated evidence points only to an ephemeral file as its sole proof.

### G02 Build, Types And Package Contract

Requirements: FR-013 through FR-016, NFR-009, NFR-012.

- Frozen clean install, typecheck, unit/integration tests and build pass on Node.js 22.
- Packed CLI launches from a clean consumer and exposes help and version identity.
- ESM exports and declaration files resolve from the tarball.
- `publint`, package export analysis and `npm publish --dry-run` report no blocking defect.
- Package allowlist contains the runner Dockerfile, matching runner lock, schemas, README and license, with no tests, private governance files, secrets or host paths.

### G03 Scenario, Report And Exit-Code Contracts

Requirements: FR-013 through FR-016, NFR-002, NFR-008, NFR-012.

- Scenario and report examples validate with both runtime Zod schemas and the published JSON Schemas.
- JSON, JUnit, Markdown and terminal projections contain the same verdict and stage set.
- Exit codes 0 through 5 retain their documented meanings.
- Invalid input cannot create a false report; missing or escaping artifacts become infrastructure errors.
- Scenario snapshot bytes reproduce the report digest exactly.

### G04 Lifecycle State Machine

Requirements: FR-003 through FR-011, FR-017, FR-018; Constitution 2.3.

- The healthy fixture passes install, assemble, boot, register, exercise, update, uninstall, reboot and cleanup against real DSH.
- Expected boot failure proves recovery without treating a crash as the expected failure.
- Registration failure and dirty uninstall fail at the intended lifecycle stage.
- Every stage has a successful path and a fault-path orchestration test; cleanup executes after upstream failure.
- Failed output identifies stage, assertion, DSH version, evidence and reproduction command.

### G05 Supported Subject Inputs

Requirements: FR-001, FR-002, NFR-002.

- Local directory is copied, packed and installed as a tarball.
- Local tarball completes a real-host lifecycle.
- Exact npm package spec reaches the real host and records the package digest.
- Git input requires a full 40-character commit and a pinned Git fixture reaches packaging or lifecycle execution.
- Mutable npm, Git and remote tarball inputs are rejected unless explicitly allowed; allowed mutable input cannot produce a reproducible pass.
- Embedded URL credentials are rejected before persistence.

### G06 Isolation, Secret Handling And Cleanup

Requirements: FR-003, FR-012, FR-017; NFR-003, NFR-004, NFR-006.

- Docker remains the default; local execution requires explicit unsafe consent and records it.
- Container input mounts are read-only; root filesystem is read-only; capabilities are dropped; privilege escalation and unbounded process/resource use are disabled.
- Controller interruption and stage timeout leave no Testkit container, process, listener, request file or owned run root.
- Canary and proxy credentials are detected across stream chunks and redacted from commands, logs and reports.
- Worker output rejects symlinks, special files, undeclared files, missing evidence and paths resolving outside the output root.
- Required unavailable observers produce `unsupported`, never `passed`.

### G07 Determinism And Performance

Requirements: NFR-001, NFR-005, SC-004.

- The same immutable healthy input runs five times in the same default runner.
- Verdict, stage status, assertion status, subject digest, DSH integrity, scenario digest and image identity are identical across all five runs.
- Each warm quick run completes within ten minutes.
- Any semantic disagreement is a release failure until it is explained or surfaced as `flaky`.

### G08 CI And Distribution Integration

Requirements: acceptance criteria, US-002, NFR-009, NFR-011.

- Workflow and composite Action pass structural validation.
- Embedded shell passes static analysis and preserves argument/path boundaries.
- The Action runs the healthy fixture, publishes valid JUnit, uploads the complete evidence directory and enforces the CLI exit code.
- Linux amd64 can install, build and execute the package without repository-only files.

### G09 Dependency And Open-Source Hygiene

Requirements: Constitution 2.6 and 3.

- Production dependency audit has no known high or critical vulnerability.
- Runtime dependency licenses are compatible with MIT distribution.
- README documents installation, default isolation, evidence, exit codes, safety boundary and supported DSH version.
- License, contribution guidance, security-reporting policy, repository links and package provenance metadata are ready before npm publication.
- Package name availability is rechecked immediately before publication.

### G10 Native DSH Bundle And Tool Boundary

Requirements: US-006, FR-019 through FR-022, SC-011, SC-012.

- Packed package declares `dsh.bundle.patch`, ships the patch and exports the Cordis plugin entry.
- A clean real DSH profile installs the tarball, activates the bundle layer and registers `dsh_test`.
- The real DSH tool runtime invokes `dsh_test` against the healthy fixture and receives a passed Docker-isolated lifecycle report.
- Tool execution requires explicit confirmation and exposes no local runner, unsafe-local, mutable-source, config, output or arbitrary argv control.
- Local input and output symlink escapes fail before runner construction.
- DSH cancellation propagates through image inspection/build and runner subprocesses, which reach quiescence.
- Tool response is bounded and points to complete canonical evidence on disk.

### G11 Scaffold And Agent Skill Adoption Boundary

Requirements: US-008, FR-029 through FR-036, NFR-015 through NFR-018, SC-017 through SC-019.

- `dsh-test init` structurally validates the bundle manifest and patch, discovers deterministic row IDs and performs no network or package-manager operation.
- Scenario, workflow and project Skill generation pass runtime parser and contract checks; a second run is byte-identical.
- Any non-identical target or symlink path fails before the first target write unless replacement is explicitly authorized with `--force`.
- Root CLI behavior, v1 scenario/report schemas, Action inputs and exit-code meanings remain compatible.
- The repository and packed package ship the canonical Skill file within size and routing limits.
- A real DSH bundle registers `dsh_test` without the Skill service and additionally exposes `dsh-testkit` when the optional registry is present.
- Publication updates the existing official Show & Tell; official guidance is pursued through an Ideas discussion rather than a prohibited external PR; the template PR references the released `v0` Action.

## 5. Public-Preview Field Gates

These measurements require publication or an external repository and do not block the first public preview:

- SC-001: ten version-bound community plugin runs.
- SC-002: three reproducible lifecycle findings not caught by ordinary static checks.
- SC-003: one external CI adopter.
- SC-009: one private enterprise Git proof without source upload or real secrets.

They block promotion from public preview to a stable ecosystem claim.

## 6. Required Evidence

- Machine-readable command ledger with command, exit code, duration and environment.
- Release acceptance report listing each gate as `passed`, `failed`, `blocked` or `not_run`.
- Five-run semantic comparison output.
- At least one retained healthy Docker report and one retained intentional-failure report.
- Package manifest and tarball SHA-256.
- Findings with severity, file/line reference, trigger and release impact.

Evidence is stored under `.ai-platform/evidence/release-acceptance/`. Secrets and machine-specific absolute paths are removed before any evidence enters the public repository.
