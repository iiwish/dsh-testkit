# Scenario Reference

```yaml
schemaVersion: 1
name: plugin-quick
suite: quick
subject:
  source: .
  updateFrom: ../plugin-v0
dsh:
  version: 0.1.1-rc.2
profile: web
expect:
  boot: success
  rows: [tool-my-plugin]
  services: [myService]
  tools: [my_tool]
exercise:
  - tool: my_tool
    arguments:
      value: smoke
recovery:
  onBootFailure: remove-plugin
observers:
  filesystem: required
  process: preferred
  ports: preferred
  network: off
  canary: preferred
http:
  routes:
    - id: health
      path: /health
      expect:
        status: 200
        json:
          status: ok
          version: $subject.packageVersion
timeouts:
  installMs: 300000
  bootMs: 30000
  cleanupMs: 30000
```

`subject.source` accepts a local directory, tarball, exact npm spec, or Git spec pinned to a full 40-character commit SHA. Local directories are tested as packed artifacts, not links. `updateFrom` installs the old artifact first and enables the update stage.

`suite: quick` executes one lifecycle attempt. `suite: full` executes five by default and classifies inconsistent semantic outcomes as `flaky`. `--repeat 2` through `--repeat 20` can repeat quick runs; full accepts only counts of five or greater.

Every lifecycle stage is a case identifier. `--case boot` executes resolve through boot, records all later stages as skipped, and still performs cleanup. Late cases retain their required prefix: `--case uninstall` installs and boots the plugin before exercising uninstall. The selected case is stored in the report and reproduction command. `update` requires `subject.updateFrom`; runtime cases after boot are unavailable in scenarios that declare an expected boot failure.

`expect.rows` is checked against `dsh --dump-config`. Services and tools are checked in the live Cordis context. The baseline runtime-probe exercise always proves the loaded context is callable. Additional tool exercises are explicit because a generic test runner cannot safely invent required arguments.

`http.routes` is an optional Docker-only assertion surface for the real DSH web host. The adapter allocates a disposable `127.0.0.1` port and issues only `GET` requests after a successful boot probe and before uninstall. Paths cannot contain a query, fragment, traversal segment or remote host. A JSON expectation selects dotted fields from the response; `$subject.packageVersion` resolves to the packed subject version. Route evidence records the path, status, selected fields and SHA-256 response digest under `evidence/http-<stage>.json`; complete bodies and headers are redacted. A route failure is reported in the existing `register` stage, so v1 report consumers and stable exit codes remain unchanged. Scenarios with HTTP routes are rejected by `--runner local`, even with `--unsafe-local`.

Route scenarios must set `profile: web`; this selects DSH's public web profile for both installation and boot. Other profile names remain valid for non-HTTP lifecycle scenarios.

An expected boot failure is a negative test: the boot assertion passes only when DSH fails, then recovery removes the plugin and proves that the same profile boots again.

Observer values are `required`, `preferred`, or `off`. Missing required coverage makes the run `unsupported`; preferred coverage records its limitation without changing an otherwise valid lifecycle result.

The resolved scenario is retained in the run evidence and bound to the report by SHA-256. Do not place real credentials in exercise arguments; use deterministic non-secret fixture values.

The current adapter supports the exact DSH npm versions `0.1.1-rc.2` (default), `0.1.0-rc.8`, `0.1.0-rc.7`, and `0.1.0-rc.6` (compatibility replays). Exact but unsupported versions return exit code `4` before plugin execution.
