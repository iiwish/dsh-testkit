<div align="center">

# DSH Testkit

**The real-host release gate for DeepSeek Harness plugins.**

[简体中文](README.zh-CN.md) · [Scenario reference](docs/scenarios.md) · [Architecture](docs/architecture.md) · [Contributing](docs/contributing.md)

[![CI](https://github.com/iiwish/dsh-testkit/actions/workflows/ci.yml/badge.svg)](https://github.com/iiwish/dsh-testkit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-testkit?color=cb3837)](https://www.npmjs.com/package/dsh-testkit)
[![Node.js](https://img.shields.io/node/v/dsh-testkit)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-0b7285)](LICENSE)

</div>

A plugin can compile, pass unit tests, and still fail after publication because files are missing from the tarball, its bundle does not register in DSH, or uninstall leaves the profile broken. DSH Testkit closes that gap: it tests the artifact a user actually installs against an exact, real DSH host and retains evidence a maintainer can review.

It makes no model call and needs no model API key.

## At A Glance

| Release question | Evidence from one isolated run |
|---|---|
| Does the publishable artifact install and register? | `npm pack`, exact DSH installation, bundle assembly, config rows, services, and tool schemas |
| Does its promised behavior work? | Deterministic runtime probes, declared tool calls, optional loopback HTTP routes, and explicit browser smoke |
| Can a user remove it cleanly? | Uninstall, same-profile reboot, capability checks, owned-path residue, processes, and ports |

Use DSH Testkit when you maintain a DSH plugin, review a release PR, operate a plugin template, or need a reproducible host-level bug report. It is intentionally a release gate, not another unit-test framework, static linter, model-output evaluator, or security certification.

## Quick Start

Requirements: Node.js 22 or newer and Docker.

```bash
pnpm add -D dsh-testkit
pnpm dsh-test init
pnpm dsh-test
```

For a bundle below the repository root:

```bash
pnpm dsh-test init plugin/
pnpm dsh-test --config plugin/dsh-testkit.yaml
```

`dsh-test init` works offline, finds the nearest Git worktree, and creates three reviewable files:

- `<plugin-root>/dsh-testkit.yaml` with the exact DSH version and detected row expectations
- `<repository-root>/.github/workflows/dsh-lifecycle.yml` with a read-only default token contract and correct nested paths
- `<repository-root>/.agents/skills/dsh-testkit/SKILL.md` so compatible coding agents apply the same gate

For an exported tree without `.git`, pass `--repo-root .`. Generation is byte-idempotent and preflights every target; conflicts stop all writes unless `--force` is explicit. Review detected rows and add only services, tools, exercises, and update behavior that the plugin contract promises.

Docker is the default runner. Reports land under `.dsh-testkit/runs/` as canonical `report.json`, CI-ready `junit.xml`, readable `report.md`, sanitized command logs, and bounded stage evidence.

## Where It Fits

DSH quality needs several complementary checks:

| Need | Best fit |
|---|---|
| Author-side manifest, patch, build, and pack preflight | [dsh-plugin-doctor](https://github.com/zoahdev/dsh-plugin-doctor) |
| User-side offline profile, session, and environment diagnosis | [moonquake2004/dsh-doctor](https://github.com/moonquake2004/dsh-doctor) |
| Conflicts among several bundles during composition | `dsh-composition-check` |
| Plugin-owned logic | Your unit and integration test framework |
| Packed-artifact install, boot, behavior, removal, recovery, and residue on a real host | **DSH Testkit** |

A practical pipeline runs cheap static checks on every commit and DSH Testkit on release PRs and tags. Testkit exercises one subject plugin per isolated lifecycle; multi-plugin ownership and update ordering remain composition concerns.

## The Lifecycle

```text
resolve -> install-dsh -> package -> install-plugin -> assemble -> boot -> register
        -> exercise -> update? -> uninstall -> reboot -> recover? -> cleanup
```

The adapter currently accepts exact `@deepseek-ai/dsh` versions `0.1.1-rc.2` (default), `0.1.0-rc.8`, `0.1.0-rc.7`, and `0.1.0-rc.6`. An unknown version stops before runner creation with exit code `4`, so host drift is not mislabeled as a plugin failure.

The official `dsh-v0.1.2-alpha.1` release remains a pending canary because its matching npm package is unavailable. `@deepseek-ai/dsh@0.1.2-alpha.2` is available and enters only the disposable canary matrix. Neither alpha is part of the default support matrix; a reviewed adapter change and real-host evidence are still required for formal support.

### What A Pass Means

- The same packed artifact identified in the report completed every required stage.
- Requested rows came from DSH `--dump-config`; services and tool schemas came from an in-process Cordis probe.
- Declared exercises ran through the real tool runtime without model selection.
- The same profile rebooted after removal without the subject bundle, capabilities, or attributable residue.
- Required observers were available. Missing required coverage is `unsupported`, never a synthetic pass.

A pass does not prove that arbitrary executable code is safe, that model output is good, or that unasserted behavior works.

## Scenario As Code

`dsh-test init` produces a small starting scenario:

```yaml
schemaVersion: 1
name: my-plugin-quick
subject:
  source: .
dsh:
  version: 0.1.1-rc.2
expect:
  boot: success
  rows: [tool-my-plugin]
  services: [myService]
  tools: [my_tool]
exercise:
  - tool: my_tool
    arguments:
      value: smoke
observers:
  filesystem: required
  process: preferred
  ports: preferred
  network: off
  canary: preferred
```

Local-directory subjects are mounted read-only, copied into the runner-owned writable root, and then packed. When `prepare`, `prepack`, or `postpack` is declared, Testkit restores dependencies in that copy using `packageManager` and its lockfile before `npm pack`; the original checkout is never modified.

For a public DSH web route, set `profile: web` and add a Docker-only assertion:

```yaml
profile: web
http:
  routes:
    - id: health
      path: /health
      expect:
        status: 200
        json:
          status: ok
          version: $subject.packageVersion
```

The [Scenario Reference](docs/scenarios.md) covers `http.routes`, update targets, expected failure and recovery, stage reruns, observer policy, the attempt-wide watchdog, and the explicit `dsh web` TurnStatus browser smoke. HTTP and browser traffic stays on runner-owned `127.0.0.1`. Missing Chromium is `unsupported`; a live but permanently unresponsive DSH web host or watchdog expiry is host/infrastructure, not a plugin failure.

## Least-Privilege CI

The generated workflow uses a read-only token and makes that contract visible:

```yaml
permissions:
  contents: read

steps:
  - uses: iiwish/dsh-testkit/.github/actions/dsh-test@v0
    with:
      plugin: .
      dsh-version: 0.1.1-rc.2
      config: dsh-testkit.yaml
      publish-junit-check: 'false'
```

This default writes JUnit annotations to the job, uploads the complete evidence directory, and exposes the artifact ID, URL, digest, report path, and stable exit code. It does not call the Checks API.

A trusted push or release workflow may opt into a named JUnit Check:

```yaml
permissions:
  contents: read
  checks: write

steps:
  - uses: iiwish/dsh-testkit/.github/actions/dsh-test@v0
    with:
      plugin: .
      dsh-version: 0.1.1-rc.2
      publish-junit-check: 'true'
```

Do not enable that option for untrusted fork pull requests. The repository's external Actions are pinned to immutable commits; the moving `v0` tag is the consumer compatibility channel. GitHub Enterprise Server and other CI systems can invoke the CLI directly.

Stable exits are `0` passed, `1` lifecycle failure, `2` invalid input, `3` infrastructure error, `4` unsupported, and `5` flaky. Published schemas are available at `dsh-testkit/schemas/report-v1.json` and `dsh-testkit/schemas/scenario-v1.json`.

## Native And Agent Entry Points

The project-local Skill and the exported `dsh-testkit/skills/dsh-testkit/SKILL.md` teach compatible agents how to select coverage, interpret evidence, and preserve the Docker boundary. A Skill guides usage; it does not grant trust or replace review.

DSH Testkit also ships an optional, community-maintained DSH Profile Bundle:

```bash
dsh plugin --profile web add dsh-testkit@0.4.1
dsh --profile web --dump-config
```

It registers `dsh_test`, a confirmed, Docker-only adapter over the same engine. The external CLI or CI Action remains the independent recovery gate because an in-host tool cannot diagnose a host that fails before tool registration.

## Safety And Trust

Plugins are executable code: package scripts and runtime code run during the lifecycle. Docker reduces the default blast radius with a read-only root filesystem and source mount, disposable writable state, dropped capabilities, resource limits, and bounded evidence. It is **not a hardened malware sandbox**.

Use disposable infrastructure for unknown code. Never use `--runner local --unsafe-local` for an untrusted plugin. The native tool requires Docker daemon access, and confirmation is a trust decision rather than certification. Private plugin source remains on the runner; DSH Testkit has no SaaS dependency and uploads nothing except the evidence configured by your CI workflow.

The [Architecture](docs/architecture.md) documents trust boundaries. Use the [Security Policy](SECURITY.md) for private vulnerability reports.

## Community

The [community validation protocol](docs/community-validation.md) defines credential-free, exact-version cohort runs and aggregate-only reporting. The [dsh-shelf case study](docs/case-study-dsh-shelf.md) shows why install success alone is not proof of host registration. The [design-partner follow-up gate](docs/design-partner-follow-up.md) records the immutable package baselines and prevents source-only fixes from being reported as package reruns.

Useful bug reports include the exact plugin and DSH versions, failing stage, `report.json`, and sanitized logs. Start with [Contributing](docs/contributing.md) or join the official DeepSeek Harness [Show & Tell discussion](https://github.com/deepseek-ai/deepseek-harness/discussions/2038).

DSH Testkit is an independent, unofficial community project released under the [MIT License](LICENSE).
