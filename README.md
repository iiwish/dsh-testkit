# DSH Testkit

Real-host lifecycle testing for DeepSeek Harness plugins.

DSH Testkit installs the exact DSH version and a plugin's packed artifact into a disposable environment, boots the real host, probes deterministic runtime capabilities, removes the plugin, reboots the same profile, and retains machine-readable evidence. It does not call a model or require a model API key.

```bash
pnpm add -D dsh-testkit
pnpm dsh-test . --dsh 0.1.0-rc.6 \
  --expect-row tool-my-plugin \
  --expect-tool my_tool
```

Docker is the default runner. The plugin and its install scripts execute inside a fresh container, while the source mount is read-only and the run root uses disposable filesystems. Local execution is deliberately loud:

```bash
pnpm dsh-test . --dsh 0.1.0-rc.6 --runner local --unsafe-local
```

## What It Proves

One scenario records these ordered stages:

`resolve -> install-dsh -> package -> install-plugin -> assemble -> boot -> register -> exercise -> update? -> uninstall -> reboot -> recover? -> cleanup`

- Local directories are copied and tested through `npm pack`, catching publication mistakes that links hide.
- DSH is installed at an exact npm version and invoked through its public profile and plugin commands.
- Expected config rows come from `--dump-config`; expected services and tool schemas come from an in-process Cordis probe.
- A baseline runtime-probe exercise always runs; declared tool exercises also use the real tool runtime without asking a model to choose or generate anything.
- Uninstall checks the profile manifest, bundle list, rebooted capabilities, and unexplained owned-root files.
- Every unavailable observer is disclosed. Requiring unavailable coverage yields `unsupported`, not a false pass.
- `--suite full` runs five isolated attempts and returns `flaky` when their semantic outcomes disagree.

The current DSH adapter supports `@deepseek-ai/dsh@0.1.0-rc.6`. Other exact versions fail with exit code `4` before a runner is created, preventing host-version drift from being reported as a plugin failure.

## Scenario

Place `dsh-testkit.yaml` in the plugin project:

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

See [Scenario Reference](docs/scenarios.md) for updates, expected failures, recovery, timeouts, and observer policy.

## Evidence And CI

Each run writes:

- `report.json`: versioned canonical result and environment fingerprint.
- `junit.xml`: one test case per lifecycle stage.
- `report.md`: support-ready lifecycle and observer summary.
- `logs/`: sanitized stdout and stderr for each external command.
- `evidence/`: resolved scenario, effective config, runtime probes, filesystem, process, and port snapshots.

Full or explicitly repeated runs retain each complete report under `attempts/{nn}/` and write an aggregate root report with semantic digests. Use `--repeat 2` through `--repeat 20` for targeted repeatability checks; full requires at least five attempts.

Lifecycle stages are stable case identifiers. Rerun a failed stage with its required prefix and the same scenario identity using `--case`:

```bash
pnpm dsh-test . --dsh 0.1.0-rc.6 --case boot
```

Later stages are recorded as skipped and cleanup still runs. The selected case is preserved in `report.json` and the reproduction command.

The package publishes `schemas/scenario-v1.json` and `schemas/report-v1.json` for CI consumers that validate artifacts outside Node.js.

Stable exit codes are `0` passed, `1` lifecycle failure, `2` invalid input, `3` infrastructure error, `4` unsupported required capability, and `5` flaky.

The composite Action publishes JUnit and uploads the complete run directory:

```yaml
- uses: iiwish/dsh-testkit/.github/actions/dsh-test@v0
  with:
    plugin: .
    dsh-version: 0.1.0-rc.6
```

Matrix jobs derive unique output directories, check names, and artifact names. `artifact-name`, `check-name`, `output`, and `artifact-retention-days` remain configurable; `artifact-id`, `artifact-url`, and `artifact-digest` are Action outputs. Pass complex extra options without shell quoting loss through `args-json`, for example `args-json: '["--expect-row", "row with spaces"]'`.

The composite Action targets GitHub.com because `actions/upload-artifact@v4+` is unavailable on GitHub Enterprise Server. GHES and other CI systems can invoke the `dsh-test` CLI directly and retain the same JSON/JUnit evidence.

Private plugins stay on the CI runner. The Testkit has no SaaS dependency and does not upload source or credentials.

## Scope And Safety

DSH Testkit tests DSH lifecycle behavior. It is not a plugin marketplace, cross-Harness standard, model-quality benchmark, static security scanner, or proof that executable code is safe. Docker reduces the default blast radius but is not a hardened malware sandbox. Do not run untrusted plugins with `--unsafe-local`.

Architecture and trust boundaries are documented in [Architecture](docs/architecture.md). Development workflow is in [Contributing](docs/contributing.md).

MIT License.
