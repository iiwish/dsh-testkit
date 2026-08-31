# DSH Testkit Technology Decision Record

Version: v0.3.0
Status: Confirmed
Last updated: 2026-08-16
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

## TDR-012: Lifecycle Stages Are Independently Addressable Cases

Decision:
Treat each lifecycle stage as a stable case identifier. `--case <stage>` executes the selected stage with its required lifecycle prefix and always performs cleanup; later stages are recorded as skipped. The selected case is preserved in the report identity and reproduction command.

Requirement mapping:
- FR-018, NFR-008, SC-006

Rationale:
- Existing JSON and JUnit output already model lifecycle stages as the smallest independently reported cases.
- Running a stage without its installation and boot prerequisites would create invalid evidence, so case reruns retain the required prefix instead of invoking an isolated adapter method.

Risks:
- A late-stage case can still require most of the lifecycle.

Mitigations:
- The CLI states that case selection stops after the selected stage rather than promising isolated stage execution.

Task impact:
- T005 adds the CLI selector, worker selection semantics, report identity and regression tests.

## TDR-013: Explicit DSH Adapter Support Registry

Decision:
Publish the exact DSH npm versions supported by the current adapter and reject unsupported targets with exit code 4 before constructing a runner. `0.1.0-rc.6` is the initial supported version. Each newly supported version requires a real-host CI case.

Requirement mapping:
- FR-002, FR-016, NFR-007, SC-007

Rationale:
- Exact semver is necessary for reproducibility but does not prove compatibility with Testkit's DSH CLI and probe assumptions.
- An explicit support registry prevents host drift from being misclassified as a plugin failure.

Risks:
- New DSH releases require a Testkit adapter update before use.

Mitigations:
- Unsupported errors list the supported versions and the registry stays isolated behind the DSH adapter boundary.

Task impact:
- T005 adds support validation and keeps the real-host matrix aligned with the registry.

## TDR-014: Trusted Release Publishing

Decision:
Publish npm releases from a protected GitHub release workflow using npm Trusted Publishing, GitHub OIDC and a clean frozen install. The workflow verifies that the tag, package version and checked-out commit agree, runs the full release gate and then invokes `npm publish` without a long-lived token. Public package provenance is generated by npm from the trusted workflow.

Requirement mapping:
- NFR-002, NFR-012

Rationale:
- Release identity and package provenance should be produced by the reviewed GitHub commit rather than a maintainer workstation.

Risks:
- npm trusted-publisher configuration must exactly match the repository and workflow name.

Mitigations:
- Configure the npm publisher before creating the GitHub release, use a release environment, and verify the public package after publication.

Task impact:
- T005 adds the workflow, release checks and public verification evidence.

## TDR-015: One Package, Two Entrypoints, One Engine

Decision:
Publish `dsh-testkit` as both the existing CLI/library package and a DSH-native Profile Bundle. The package declares `dsh.bundle.patch`; its root Cordis entry registers `dsh_test`, and the tool delegates to `runCli` instead of implementing lifecycle behavior again.

Requirement mapping:
- US-006, FR-019, FR-020, SC-011

Rationale:
- DSH native installation and tool discovery materially reduce adoption friction.
- A thin adapter preserves one lifecycle state machine, report contract and release identity across CLI, Action and DSH.

Alternatives considered:
- Separate plugin package: adds coordinated releases and version drift without an independent product boundary.
- CLI-only distribution: remains useful for CI but is absent from DSH-native plugin discovery.
- Copy lifecycle logic into the tool: creates divergent behavior and evidence.

Risks:
- DSH peer APIs are in Developer Preview and can break across release candidates.

Mitigations:
- Declare bounded peer ranges, compile against the supported DSH tool API and gate each supported adapter with real-host E2E.

Task impact:
- T006 adds the bundle manifest, Cordis entry, packed consumer contract and native DSH E2E.

## TDR-016: Docker-Only DSH Tool Safety Boundary

Decision:
The `dsh_test` tool requires `confirm: true`, forces `--runner docker`, disables implicit workspace configuration, does not expose unsafe-local or mutable-source flags, and chooses an owned output directory. Local directory and tarball inputs, including symlink targets, must resolve inside the current workspace. npm and pinned Git inputs remain subject to the lifecycle engine's immutable-source validation.

Requirement mapping:
- FR-020, FR-021, NFR-002, NFR-003, NFR-004, SC-012

Rationale:
- Installing a DSH tool gives an agent a host-process entrypoint; that must not become an arbitrary local code loader or filesystem reader.
- Docker still executes untrusted package scripts with network access and Docker-daemon authority, so explicit user confirmation remains required.

Alternatives considered:
- Expose the full CLI argv surface: permits unsafe-local, arbitrary outputs and mutable inputs.
- Trust a repository `dsh-testkit.yaml`: can redirect local sources outside the active workspace.
- Execute on the host for lower latency: violates the product's default isolation guarantee.

Risks:
- Cancellation is cooperative and Docker shutdown can take a short grace period.
- Docker isolation is not a security proof against a malicious container escape.

Mitigations:
- Forward the DSH `AbortSignal` through runner and subprocess layers, retain existing Docker hardening, and document the boundary in the tool description and README.

Task impact:
- T006 adds cancellation plumbing and focused containment, consent and forced-runner tests.

## TDR-017: Bounded Structured Tool Result

Decision:
Return a JSON object containing exit code, lifecycle verdict, absolute run/report paths, and bounded terminal summary and diagnostics. Full reports and command logs remain files under `.dsh-testkit/runs`.

Requirement mapping:
- FR-022, NFR-008, NFR-012

Rationale:
- Agents need a stable result they can reason about, while full lifecycle reports are too large for routine model context.
- File paths preserve access to complete canonical evidence without truncating the stored artifacts.

Task impact:
- T006 adds the output schema and result-projection tests.

## TDR-018: Aggregate-First Community Validation

Decision:
Run public community bundles only from exact npm versions inside Docker on a disposable, credential-free runner. Keep per-plugin reports as local review evidence. Publish the cohort selection method, environment, aggregate verdicts and first-failure-stage distribution; publish a named failure only after reproducing it and giving the maintainer actionable evidence.

Requirement mapping:
- FR-025, NFR-014, SC-013

Rationale:
- Public code is executable but not automatically safe, and a compatibility failure is not a security rating.
- Aggregate-first reporting validates market need without turning a new test harness into an unreviewed public ranking system.
- Exact npm versions and retained local reports preserve reproducibility and a path to responsible maintainer outreach.

Alternatives considered:
- Publish a named pass/fail leaderboard: creates reputational claims before environment and root cause are reviewed.
- Test mutable Git branches: cannot bind a result to an immutable artifact.
- Reuse the developer workstation environment: risks leaking credentials and contaminating results with local state.

Task impact:
- T007 adds the cohort runner, fixed validation protocol, aggregate report and release evidence.

## TDR-019: Dist-Tag Watch With Ephemeral Canary Enablement

Decision:
Discover exact DSH versions from the npm `latest` and `next` dist-tags and immutable releases from the official `deepseek-ai/deepseek-harness` GitHub repository. Versions outside `SUPPORTED_DSH_NPM_VERSIONS` become runnable canary inputs only when the exact npm version exists. Official releases without an npm package remain `pendingNpmVersions`. The canary job may update the support array only in its disposable checkout before building and running real-host tests; the committed registry and published package remain unchanged until a reviewed adapter change lands.

Requirement mapping:
- FR-026, FR-027, SC-015

Rationale:
- A strict published registry prevents unrecognized host drift from being blamed on plugins.
- A separate ephemeral canary provides early evidence without silently widening the product's support promise.

Risks:
- npm dist-tags can move or omit a release line, while an official GitHub release can precede its npm package.
- Canary failures can be infrastructure failures rather than adapter incompatibility.

Mitigations:
- Record the resolved exact version, dist-tag, official release and npm availability metadata; keep pending, canary and supported states separate; require reviewed real-host evidence before changing support.

Task impact:
- T007 adds release discovery fixtures, canary preparation and the scheduled workflow.

## TDR-020: Defer Multi-Plugin Lifecycle Execution

Decision:
Keep v0.2.1 focused on one subject plugin per isolated lifecycle. The next scenario experiment is a declarative prerequisite profile or fixed support-bundle fixture, not arbitrary multi-plugin update/uninstall/recovery semantics. General multi-plugin lifecycle behavior enters scope only when named field evidence demonstrates a failure that neither a prerequisite profile, single-plugin Testkit nor composition checks can reproduce.

Requirement mapping:
- FR-024, SC-016

Rationale:
- Multi-plugin state ownership, update order and residue attribution introduce a new scenario model rather than a small extension.
- The current ecosystem already has doctor/preflight and composition-check implementations; duplicating them would dilute Testkit's real-host lifecycle boundary.
- The v0.2.1 cohort completed ten exact-version Docker runs: two passed, five first failed at boot, and three first failed at uninstall. All five boot-first cases required a service absent from the minimal isolated profile, which supports prerequisite-profile fixtures before general multi-plugin orchestration.
- The uninstall-first cases already produced distinct single-subject lifecycle evidence for package policy, timeout and residue classes; they do not require cross-plugin semantics to reproduce.

Task impact:
- T007 records the decision after the cohort run and keeps the v1 scenario/report contracts unchanged.

## TDR-021: Non-Destructive Structured Scaffold

Decision:
Add `init` as a root CLI subcommand. It reads `package.json` and the declared `dsh.bundle.patch` through JSON/YAML parsers, extracts only deterministic row IDs, preflights every target before writing, and creates a scenario, GitHub workflow and project Skill. Identical files are reported as unchanged. Non-identical files fail the whole preflight unless `--force` is explicit.

Alternatives considered:
- Text-search source files for tool/service names: rejected because generated expectations could be false or stale.
- Install dependencies and update lockfiles: rejected because initialization must stay offline, package-manager-neutral and free of package-script execution.
- Merge arbitrary existing YAML/workflows: rejected because semantic merge ownership is ambiguous; explicit conflict is safer.

Rationale:
One command reduces adoption friction without weakening evidence or taking ownership of user configuration. Structured manifest/patch parsing matches the project constitution and avoids an ad hoc source scanner.

Risks and mitigations:
- Complex patches may expose no deterministic row. Stop with an actionable unsupported-structure error rather than generating a weak scenario.
- Scaffold paths may escape through symlinks. Reject symlink path components and preflight all containment before any write.
- `--force` can replace user edits. Keep it explicit, list every replaced file and never touch package manifests, lockfiles or `AGENTS.md`.

Task impact:
- T008 adds the scaffold module, root subcommand, fixtures, workflow contracts and packed-consumer proof.

## TDR-022: One Skill Definition, Project And Runtime Distribution

Decision:
Keep the `dsh-testkit` Skill definition as a typed canonical value used by the DSH runtime registration and renderer for `.agents/skills/dsh-testkit/SKILL.md`. The project Skill is generated by `init`; the repository and npm package ship the same rendered file. The native bundle registers inside optional `ctx.inject(['skills'], ...)`, so the contribution follows the child fiber when available without declaring `skills` as a hard top-level injection.

Alternatives considered:
- Maintain unrelated Markdown and runtime strings: rejected because routing and safety guidance would drift.
- Make `skills` a hard Cordis injection: rejected because Testkit's tool must remain usable in profiles without the Skill subsystem.
- Rely only on a native runtime Skill: rejected because external coding agents and broken hosts need a repository-local path.

Rationale:
The Skill teaches workflow after discovery while `init`, CI and upstream templates make discovery habitual. One canonical definition keeps name, description, safety rules and version behavior aligned.

Risks and mitigations:
- Large Skill bodies consume retained model context. Enforce a 500-character routing description and 4 KiB rendered file limit.
- A Skill bundled in npm is not automatically visible to every Agent. Generate the project-local standard path and pursue upstream/template references; do not claim universal auto-discovery.
- Runtime registration can drift with DSH preview APIs. Use the optional public registry shape and prove it in real-host bundle E2E.

Task impact:
- T008 adds the canonical Skill definition, rendering contract, runtime registration and discovery tests.

## TDR-023: Upstream Through Policy-Compliant Evidence

Decision:
Publish one bilingual official Show & Tell and keep it current. Because DeepSeek Harness currently does not accept external pull requests, propose a vendor-neutral release-lifecycle step for `cordis-plugin-development` through an Ideas discussion with an adoptable patch outline and v0.3.0 evidence. Submit a normal PR to one maintained public plugin template after the release exists.

Alternatives considered:
- Open an unsolicited official PR: rejected by the repository's current CONTRIBUTING policy.
- Post duplicate release announcements: rejected by the plugin category's one-project-one-discussion rule.
- Ask the official Skill to mandate DSH Testkit: rejected as promotional and unnecessarily vendor-specific.

Rationale:
Upstream acceptance is more likely when the proposal names the lifecycle requirement first, respects project policy and provides a working community implementation without asking for endorsement.

Risks and mitigations:
- Upstream or template maintainers may decline. Record the discussion/PR and feedback as field evidence; release does not depend on acceptance.
- Promotion can look like ecosystem ranking. Lead with reproducible workflow and boundaries, not failure-rate claims.

Task impact:
- T008 records Show & Tell, official Ideas and template PR identities in release evidence.

## TDR-024: Separate Repository Root From Plugin Root

Decision:
`dsh-test init [directory]` treats the requested directory as the plugin root and resolves a separate repository root from an explicit `--repo-root` or the nearest non-symlink `.git` ancestor. The scenario stays beside the plugin manifest. The GitHub workflow and project Agent Skill live at repository root. All three targets use repository-relative paths and complete one shared preflight before any write.

Requirement mapping:
- US-009, FR-037 through FR-039, NFR-019 through NFR-020, SC-021

Rationale:
- GitHub only discovers workflows under the repository-root `.github/workflows` directory.
- A repository-level Skill must be visible before an agent descends into a nested plugin package.
- Keeping the scenario beside `package.json` preserves `subject.source: .` and makes local scenario ownership unambiguous.

Alternatives considered:
- Write every file under the plugin root: rejected because GitHub ignores nested workflow directories and repository-level agents may not discover the Skill.
- Move the scenario to repository root: rejected because relative subject resolution and multi-package ownership become ambiguous.
- Require `--repo-root` every time: rejected because a real Git worktree provides a deterministic offline boundary; the explicit option remains available for exported sources and unusual layouts.
- Add general monorepo orchestration: rejected because one lifecycle still tests one subject plugin and workflow merging requires a separate product contract.

Risks and mitigations:
- An incorrectly selected ancestor could widen write ownership. Resolve real paths, require plugin containment, reject symlink markers and allow an explicit root override.
- Existing repository workflow or Skill files may belong to maintainers. Preserve whole-transaction conflict behavior and require `--force` for replacement.

Task impact:
- T009 adds nested-root scaffold contracts, generated repo-relative paths, backward compatibility tests and a bounded design-partner pilot.

## TDR-025: Deterministic Loopback HTTP Route Assertions

Decision:
Add an optional `http.routes` scenario section for deterministic host-route assertions. Route scenarios must set `profile: web`; the Docker adapter starts DSH through its public `web` command on a runner-owned loopback port, issues only `GET` requests to `http://127.0.0.1:<port>/<path>`, and performs checks after a successful boot probe and before uninstall. Local/unsafe-local runs reject scenarios containing HTTP routes.

Route evidence is bounded and machine-readable: method, path, status, expected status, selected JSON fields and a SHA-256 response digest are retained. Complete response bodies and headers are never persisted. Expected `$subject.packageVersion` values resolve from the packed immutable subject. Route assertions are attached to the existing registration stage so report schema, verdict semantics and stable exit codes remain unchanged.

Requirement mapping:
- US-010, FR-040 through FR-042, NFR-021

Rationale:
- A plugin's HTTP surface is part of its real host lifecycle and cannot be proven by static package inspection alone.
- Loopback-only requests and runner-owned ports provide a narrow deterministic contract without creating an arbitrary network client.
- Reusing the registration stage avoids a report schema fork and preserves existing lifecycle case selection.

Alternatives considered:
- Add an independent HTTP stage: rejected because it would change stage selection, report consumers and cleanup semantics for a small assertion surface.
- Allow arbitrary base URLs or headers: rejected because credentials, remote state and non-deterministic dependencies would enter the baseline lifecycle.
- Validate only with a test fixture server: rejected because it would not prove the route is registered by the real DSH host.

Risks and mitigations:
- DSH web command or route APIs may drift across release candidates. Keep the command in the DSH adapter and require a real-host fixture before claiming support.
- A route can respond before the host is ready. Use bounded connection retries and record a route-specific failure rather than treating a missing listener as boot failure.
- JSON fields can contain secrets. Redact sensitive keys and never retain raw bodies or headers.

Task impact:
- T010 adds the scenario contract, Docker adapter route probe, fixture and focused evidence tests without changing v1 report schema.

## User Review Gate

- Approval: Approved on 2026-08-16
- Reviewer notes: 用户明确批准 Show & Tell、v0.3.0 一键接入与 Agent Skill，以及按官方贡献政策推进官方 Skill 和插件模板集成；2026-08-16 批准以首位设计伙伴试点验证并修复嵌套 plugin root。Decisions preserve lifecycle, schema and safety boundaries.
