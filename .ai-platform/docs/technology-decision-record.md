# DSH Testkit Technology Decision Record

Version: v0.1
Status: Confirmed
Last updated: 2026-08-15
Review: User authorized continuation to implementation after SSOT review

## Constitution Check

- Constitution source: `.ai-platform/memory/constitution.md`
- Relevant principles:
  - Real-host evidence: the worker launches an exact DSH distribution rather than mocking lifecycle behavior.
  - Isolation by default: Docker is the default runner; local execution requires an explicit unsafe flag.
  - Adapter boundary: all DSH version-specific commands and probes live behind `DshAdapter`.
  - Structured truth: JSON is canonical; terminal, JUnit and Markdown are projections of the same report.
  - Capability-aware observation: unavailable observers are reported as unsupported, never silently passed.
- Violations: None.

## Supporting Artifacts

- Research: `.ai-platform/specs/lifecycle-runner/research.md`
- Data model: `.ai-platform/specs/lifecycle-runner/data-model.md`
- Contracts: `.ai-platform/specs/lifecycle-runner/contracts/`
- Quickstart: `.ai-platform/specs/lifecycle-runner/quickstart.md`
- Work graph: `.ai-platform/specs/lifecycle-runner/tasks.md`
- Execution packets: `.ai-platform/specs/lifecycle-runner/packets/`

## TDR-001: TypeScript ESM CLI On Node.js

Decision:
Use TypeScript, ESM, Node.js 22 or newer, pnpm, Commander, Zod, YAML and xmlbuilder2. Build with `tsc`; test with Vitest.

Requirement mapping:
- FR-001, FR-013, FR-014, NFR-009, NFR-012

Rationale:
- DSH and its plugin ecosystem are Node/TypeScript based, so the tool can share runtime conventions without embedding another language runtime.
- Commander and Zod provide structured parsing; YAML and xmlbuilder2 avoid ad hoc format handling.
- Plain `tsc` keeps the published package inspectable and avoids a bundler hiding worker assets.

Alternatives considered:
- Rust: stronger single-binary distribution, but adds friction around npm packaging and DSH-specific JavaScript probes.
- Python: good orchestration libraries, but requires a second runtime in the primary ecosystem.
- Zero dependencies: lower install surface but would duplicate mature CLI, schema and XML behavior.

Risks:
- Node package dependency churn.

Mitigations:
- Keep runtime dependencies small, pin lockfile, test packed-package consumption.

Task impact:
- T001 establishes build, domain and report contracts.

## TDR-002: Controller And Worker Process Boundary

Decision:
Split the product into a controller CLI and a lifecycle worker. The controller resolves configuration, selects a runner and renders reports. The worker performs all DSH and plugin operations in an owned run root and emits one canonical JSON report.

Requirement mapping:
- FR-003 through FR-018, NFR-003, NFR-006, NFR-007

Rationale:
- The same worker can run inside Docker or an explicitly unsafe local process.
- A small JSON request/result protocol keeps runner transport separate from lifecycle semantics.

Alternatives considered:
- Put Docker commands directly into each lifecycle stage: couples domain behavior to one runner.
- Run DSH inside the controller: violates isolation and makes cleanup unreliable.

Risks:
- Protocol drift between controller and worker.

Mitigations:
- Versioned Zod schemas and round-trip contract tests.

Task impact:
- T001 defines the protocol; T002 implements both sides.

## TDR-003: Docker Default, Explicit Unsafe Local Runner

Decision:
Use an automatically built `dsh-testkit-runner:{testkit-version}-{context-digest}` image based on a pinned multi-architecture Node 22 Bookworm Slim digest. The image carries the full build-context digest as a label, and cache reuse requires both tag and label identity. It includes pnpm, Git, procps and iproute2. The container runs with a read-only root, init process, dropped capabilities, `no-new-privileges`, 4 GiB memory, two CPU and 512-process limits, disposable work filesystems and read-only subject mounts. The CLI selects Docker by default and fails with an actionable unsupported result when Docker is unavailable. `--runner local --unsafe-local` runs the same worker on the host.

Requirement mapping:
- NFR-003, NFR-006, NFR-009, NFR-011

Rationale:
- Docker provides a disposable filesystem and process namespace on common CI systems.
- Local mode remains useful for development but cannot be mistaken for isolation.

Alternatives considered:
- Local mode fallback by default: too dangerous for arbitrary install scripts.
- VM-only execution: stronger isolation but too heavy for the first open-source experience.
- Docker-in-Docker worker orchestration: unnecessary for one container per run.

Risks:
- Docker is unavailable or restricted on some runners.
- Container isolation is not a proof against malicious kernel-level behavior.

Mitigations:
- Stable runner interface for future sandbox backends; report isolation level and limitations.

Task impact:
- T002 implements Docker image discovery/build and local opt-in.

## TDR-004: Test Packed Local Artifacts

Decision:
Local plugin directories are copied into the run root, packed with `npm pack --json`, and installed from the resulting tarball. Tarball inputs are copied. npm and Git inputs must be explicit specs; mutable bare Git branches are rejected unless `--allow-mutable-source` is explicitly supplied, which prevents a reproducible pass verdict.

Requirement mapping:
- FR-001, FR-004, FR-015, NFR-002

Rationale:
- Packing catches missing `files`, entrypoint and prepare/build defects that link-based source testing hides.

Alternatives considered:
- `dsh plugin add .`: tests a linked checkout and may include unpublished files.
- Controller-side packing: would execute plugin scripts outside the runner.

Risks:
- Some repositories intentionally rely on workspace context.

Mitigations:
- Report packaging failures distinctly; future suites may add an explicit workspace mode without changing the default.

Task impact:
- T002 implements subject resolution inside the worker.

## TDR-005: Exact DSH Installation Per Run

Decision:
Install `@deepseek-ai/dsh@{exact-version}` into the run root and invoke its real binary. Source-commit support is represented by an adapter input but v0.1 only produces passing results for exact npm versions. `latest`, `next` and ranges are invalid for reproducible runs.

Requirement mapping:
- FR-002, FR-015, NFR-002, NFR-007

Rationale:
- npm rc.6 is the current public delivery path and includes the exact profile/plugin CLI being tested.

Alternatives considered:
- Global DSH: leaks host state and obscures version identity.
- `npx` for each command: can resolve different cached state and makes profile module fallback harder to reason about.

Risks:
- Installation time and network dependency.

Mitigations:
- Docker layer cache and future DSH package cache mount; distinguish infrastructure failure.

Task impact:
- T002 implements `DshNpmAdapter`.

## TDR-006: In-Tree Runtime Probe Overlay

Decision:
Append a Testkit-owned Cordis plugin through `--patch`. The probe runs after bundle rows, inspects declared Cordis services and `ctx.tools.schemas()`, optionally calls declared tools, writes a versioned probe artifact, and throws on failed assertions. The worker treats the probe artifact as boot readiness, then terminates DSH with SIGTERM.

Requirement mapping:
- FR-006, FR-007, FR-008, FR-011

Rationale:
- DSH CLI exposes no independent ready event. An appended real plugin observes the same context without parsing logs or using a model.

Alternatives considered:
- Treat process survival for several seconds as ready: cannot prove registration.
- Parse `dump-config` only: proves composition but not runtime registration.
- Import the plugin directly in Testkit: bypasses DSH loader and profile behavior.

Risks:
- Probe assumptions may change with DSH internals.

Mitigations:
- Use public Cordis `ctx.get` and documented `ctx.tools.schemas`; isolate probe generation in the DSH adapter and version its artifact.

Task impact:
- T002 implements probe assets, boot supervision and runtime assertions.

## TDR-007: Explicit Lifecycle State Machine

Decision:
Represent lifecycle stages as an ordered state machine: resolve, install-dsh, package, install-plugin, assemble, boot, register, exercise, update, uninstall, reboot, recover and cleanup. Each stage is `passed`, `failed`, `skipped` or `unsupported` and carries typed assertions, timing and artifacts.

Requirement mapping:
- FR-004 through FR-018, NFR-008

Rationale:
- Stage identity makes failures actionable and prevents one opaque subprocess result from defining the verdict.

Alternatives considered:
- Free-form event log: flexible but difficult for CI policy and stable exit codes.

Risks:
- Some stages do not apply to every scenario.

Mitigations:
- `skipped` requires a reason; `unsupported` affects verdict when the scenario marks the capability required.

Task impact:
- T001 defines the domain; T002 drives it.

## TDR-008: JSON Canonical Report With Derived Renderers

Decision:
Persist `report.json` as the canonical artifact, validate it before rendering, and derive `junit.xml`, `report.md` and terminal output from that object. Stable exit codes map invalid input to 2, test failure to 1, infrastructure error to 3, unsupported to 4 and flaky to 5.

Requirement mapping:
- FR-013, FR-015, FR-016, NFR-012

Rationale:
- CI, Catalogs and humans need different views without divergent verdict logic.

Alternatives considered:
- Parse terminal output in CI: unstable and loses structured evidence.

Risks:
- Report schema becomes a compatibility commitment.

Mitigations:
- Schema version, contract tests and major-version rule for breaking changes.

Task impact:
- T001 implements reports and renderers; T003 validates package consumption and Action output.

## TDR-009: Capability-Aware Observers

Decision:
The Linux worker always collects content-addressed DSH-home and workspace snapshots before subject installation, before boot and after uninstall, plus sequential process and listening-port snapshots at stage boundaries. Added, modified and removed paths are attributed; only profile package-manager files are allowlisted. Observer commands are excluded from process residue. A Testkit-owned no-op bundle is added and removed before the first checkpoint to establish DSH's empty-profile filesystem baseline. Network proxy and canary egress observers are optional capabilities in v0.1. Every report contains `observerCoverage` with mode and limitations; a required missing observer makes its assertion unsupported.

Requirement mapping:
- FR-012, NFR-004, NFR-006, SC-008

Rationale:
- Honest coverage is more valuable than pretending coarse snapshots prove complete monitoring.

Alternatives considered:
- `strace` all commands: powerful but platform-specific, noisy and fragile under restricted containers.
- No side-effect evidence: misses a major lifecycle risk.

Risks:
- Short-lived subprocesses between checkpoints may not be recorded.

Mitigations:
- State this limitation; retain command process metadata; add trace-based observer as a later backend.

Task impact:
- T002 implements baseline observers; T003 adds observer fixtures.

## TDR-010: Scenario-Driven Update And Recovery

Decision:
The quick suite always covers install, assemble, boot, register, uninstall and reboot. The full suite executes at least five independent attempts and compares semantic report digests; inconsistency without a higher-precedence infrastructure result is `flaky`. Update requires `updateFrom`, requires the installed identity to equal the packed target, and repeats assembly, row, boot, registration and exercise checks. Expected boot failure and recovery are expressed in the scenario. Recovery removes the installed package and proves the same profile can boot with the probe afterward.

Requirement mapping:
- FR-009, FR-010, FR-011, US-005

Rationale:
- A generic plugin has no meaningful old version unless the author supplies one. Failure fixtures can still prove recovery semantics.

Alternatives considered:
- Manufacture an update for every plugin: produces meaningless coverage.
- Always inject a separate broken plugin: tests DSH but not the subject plugin.

Risks:
- A normal quick run skips update and recover.

Mitigations:
- Mark skipped with reasons; full project self-test includes update and recovery fixtures.

Task impact:
- T002 implements conditional transitions; T003 supplies fixtures and E2E coverage.

## TDR-011: GitHub Action As A Thin Wrapper

Decision:
Ship a composite Action that installs Node and pnpm, installs the packed CLI, runs `dsh-test`, uploads the output directory and publishes JUnit through standard workflow consumers. The Action contains no independent lifecycle logic.

Requirement mapping:
- US-002, FR-013, NFR-011

Rationale:
- One engine must serve local, GitHub and other CI environments.

Alternatives considered:
- JavaScript Action with embedded implementation: duplicates release and runtime paths.

Risks:
- Docker availability varies by runner.

Mitigations:
- Target Ubuntu hosted runners in v0.1 and document self-hosted requirements.

Task impact:
- T003 implements and smoke-tests the Action contract.

## User Review Gate

- Approval: Approved under the user's 2026-08-15 instruction to continue and complete the plugin after SSOT review
- Reviewer notes: Decisions resolve all High checklist findings and do not expand the confirmed non-goals.
