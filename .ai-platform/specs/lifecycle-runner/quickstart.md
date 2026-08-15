# DSH Testkit MVP Quickstart Contract

Version: v0.1
Status: Confirmed

## Local Author Journey

```bash
pnpm add -D dsh-testkit
pnpm dsh-test . --dsh 0.1.0-rc.6 --expect-row tool-my-plugin --expect-tool my_tool
```

Expected result:

- The Docker runner image is keyed and verified by its build-context digest.
- The local directory is packed inside the runner.
- DSH and the tarball are installed into a fresh profile.
- Configuration, boot, tool registration, uninstall and reboot are tested.
- `.dsh-testkit/runs/{run-id}/` contains JSON, JUnit, Markdown, logs and evidence.

## Full Repeatability

```bash
dsh-test . --dsh 0.1.0-rc.6 --suite full
```

Full runs execute five isolated attempts. Attempt reports live under `attempts/{nn}/`; the root report compares semantic digests and returns exit code 5 when otherwise valid outcomes are inconsistent.

## Scenario File

```yaml
schemaVersion: 1
name: my-plugin-quick
suite: quick
subject:
  source: .
dsh:
  version: 0.1.0-rc.6
expect:
  boot: success
  rows: [tool-my-plugin]
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

## Unsafe Local Development

```bash
dsh-test ./fixtures/healthy-plugin --dsh 0.1.0-rc.6 --runner local --unsafe-local
```

The report must show `runner: local` and `isolation: unsafe-local`. Omitting `--unsafe-local` fails before packaging or installation.

## CI Journey

```yaml
- uses: ./
  with:
    plugin: .
    dsh-version: 0.1.0-rc.6
```

The Action runs on Ubuntu with Docker, uploads the run directory and exposes the CLI exit code to the workflow.
