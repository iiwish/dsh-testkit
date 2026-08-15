<div align="center">

# DSH Testkit

**Deterministic, real-host lifecycle testing for DeepSeek Harness plugins.**

[简体中文](README.zh-CN.md) · [Scenario reference](docs/scenarios.md) · [Architecture](docs/architecture.md) · [Contributing](docs/contributing.md)

[![CI](https://github.com/iiwish/dsh-testkit/actions/workflows/ci.yml/badge.svg)](https://github.com/iiwish/dsh-testkit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dsh-testkit?color=cb3837)](https://www.npmjs.com/package/dsh-testkit)
[![Node.js](https://img.shields.io/node/v/dsh-testkit)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-0b7285)](LICENSE)

</div>

DSH Testkit packs your plugin, installs it beside an exact DSH version in a disposable environment, boots the real host, exercises deterministic capabilities, uninstalls the plugin, reboots the same profile, and retains reviewable evidence. No model call or model API key is required.

```text
resolve -> install-dsh -> package -> install-plugin -> assemble -> boot -> register
        -> exercise -> update? -> uninstall -> reboot -> recover? -> cleanup
```

## Quick Start

Requirements: Node.js 22 or newer and Docker.

```bash
pnpm add -D dsh-testkit
pnpm dsh-test init
pnpm dsh-test
```

`init` works offline and reads the bundle's declared patch to create exactly three reviewable files:

- `dsh-testkit.yaml` with the exact supported DSH version and detected row expectations
- `.github/workflows/dsh-lifecycle.yml` with a least-privilege lifecycle check
- `.agents/skills/dsh-testkit/SKILL.md` so coding agents can apply the same release gate

Review the detected rows and add only service, tool, update, and exercise expectations proved by the plugin contract. Re-running `init` is byte-idempotent; conflicting files stop the command before any target is written unless `--force` is explicit.

Docker is the default runner. A successful run produces `report.json`, `junit.xml`, `report.md`, sanitized command logs, and stage evidence in `.dsh-testkit/runs/`.

The current adapter supports exactly `@deepseek-ai/dsh@0.1.0-rc.6`. Unknown versions stop before runner creation with exit code `4`, so host drift is not misreported as a plugin failure.

## What It Proves

| Signal | How it is tested |
|---|---|
| Package integrity | Local directories go through `npm pack`; links and unpublished files cannot hide packaging defects. |
| Real registration | Rows come from DSH `--dump-config`; services and tool schemas come from an in-process Cordis probe. |
| Deterministic exercise | The baseline runtime probe and declared tool calls run through the real tool runtime without model selection. |
| Clean removal | The same profile is rebooted after uninstall and checked for bundles, capabilities, processes, ports, and owned-path residue. |
| Repeatability | `--suite full` runs five isolated attempts and returns `flaky` when semantic outcomes disagree. |
| Observer limits | Unavailable coverage is disclosed; a required unavailable observer returns `unsupported`, never a false pass. |

It does **not** prove that arbitrary executable code is safe or that a plugin produces high-quality model output.

## Choose The Right Check

These tools are complementary, not competing replacements.

| Need | Best fit |
|---|---|
| Fast static checks, manifest diagnostics, dependency guidance | `dsh-plugin-doctor` or a plugin preflight check |
| Conflicts among several bundles before or during assembly | `dsh-composition-check` |
| Plugin-owned unit logic | Your test framework |
| Install, boot, exercise, uninstall, reboot, recovery, residue, and repeatability on a real host | **DSH Testkit** |

DSH Testkit deliberately tests one subject plugin per isolated lifecycle. Multi-plugin state ownership and update order remain outside the current scenario contract until field evidence shows a failure that single-plugin lifecycle testing plus composition checks cannot reproduce.

## Scenario As Code

Create `dsh-testkit.yaml` in the plugin project:

```yaml
schemaVersion: 1
name: my-plugin-quick
subject:
  source: .
dsh:
  version: 0.1.0-rc.6
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

The [Scenario Reference](docs/scenarios.md) covers update targets, expected failures, recovery, timeouts, observer policy, and stage reruns.

## CI Evidence

`dsh-test init` generates this workflow using the stable moving major tag:

```yaml
- uses: iiwish/dsh-testkit/.github/actions/dsh-test@v0
  with:
    plugin: .
    dsh-version: 0.1.0-rc.6
```

The Action publishes JUnit and uploads the complete run directory. `artifact-name`, `check-name`, `output`, and retention are configurable; artifact ID, URL, and digest are outputs. GitHub Enterprise Server and other CI systems can invoke the CLI directly because `actions/upload-artifact@v4+` is not available on GHES.

Stable exit codes are: `0` passed, `1` lifecycle failure, `2` invalid input, `3` infrastructure error, `4` unsupported capability, and `5` flaky. Published JSON Schemas live at `dsh-testkit/schemas/report-v1.json` and `dsh-testkit/schemas/scenario-v1.json`.

## Agent Skill

The project-local `.agents/skills/dsh-testkit/SKILL.md` teaches compatible coding agents when and how to initialize Testkit, choose quick or full lifecycle coverage, interpret evidence, and preserve the Docker trust boundary. It is generated from the same typed definition that the native DSH bundle registers when the host exposes the optional Skills service.

The canonical file also ships in npm at the exported subpath `dsh-testkit/skills/dsh-testkit/SKILL.md`. The Skill helps an agent use Testkit consistently; it does not grant permission to execute untrusted code, replace review, or certify a plugin.

## DSH-Native Tool

DSH Testkit also ships an optional community-maintained DSH-native Profile Bundle:

```bash
dsh plugin --profile web add dsh-testkit@0.3.0
dsh --profile web --dump-config
```

The bundle registers `dsh_test`, a thin adapter over the same lifecycle engine. It defaults to the active workspace, requires `confirm: true`, always uses Docker, ignores implicit repository configuration, rejects paths outside the workspace, and never exposes unsafe-local execution or arbitrary CLI arguments.

This adapter is convenient when DSH is already healthy. Keep the external CLI or CI Action as the independent recovery and release gate because an in-host tool cannot diagnose a host that fails before tool registration.

## Community Validation

Maintainers can run an exact-version public cohort with an explicit trust acknowledgement:

```bash
pnpm exec dsh-test-community \
  --acknowledge-untrusted-code \
  --dsh 0.1.0-rc.6 \
  --plugin example-plugin@1.2.3 \
  --output /tmp/dsh-testkit-cohort
```

The runner strips model, npm, GitHub, cloud, and Docker registry credentials from child processes. It keeps named reports locally and writes a subject-free aggregate summary for responsible public reporting.

See the [v0.2.1 community validation report](docs/community-validation.md) for the selection method, aggregate evidence, limitations, and the resulting product decision.

## Safety

Plugins are executable code: package scripts and runtime code run during a lifecycle test. Docker narrows the default blast radius but is **not a hardened malware sandbox**. Use disposable infrastructure for unknown code and never use `--runner local --unsafe-local` for an untrusted plugin.

The native tool needs Docker daemon access and may execute package scripts with network access inside the runner. Confirmation is a trust decision, not a security certification. Private plugins stay on the CI runner; DSH Testkit has no SaaS dependency and does not upload source or credentials.

See [Architecture](docs/architecture.md) for trust boundaries and [Security Policy](SECURITY.md) for private vulnerability reporting.

## Contributing

Bug reports are most useful with the exact plugin version, DSH version, failing stage, `report.json`, and sanitized logs. Start with [Contributing](docs/contributing.md), then use the lifecycle-failure issue template for reproducible host behavior.

Meet the project and the first-maintainer cohort in the official DeepSeek Harness [Show & Tell discussion](https://github.com/deepseek-ai/deepseek-harness/discussions/2038).

DSH Testkit is an independent, unofficial community project released under the [MIT License](LICENSE).
