# CLI Contract

Version: v0.1
Status: Confirmed

## Primary Command

```bash
dsh-test {plugin-source} --dsh {exact-version} [options]
```

## Options

| Option | Default | Contract |
|---|---|---|
| `--dsh {version}` | required unless config supplies it | Exact npm version only |
| `--config {path}` | `dsh-testkit.yaml` when present | Scenario YAML or JSON |
| `--suite {quick-or-full}` | `quick` | Selects built-in stage set |
| `--repeat {2-through-20}` | suite-dependent | Repeats quick explicitly; full defaults to five and requires at least five |
| `--runner {docker-or-local}` | `docker` | Local requires `--unsafe-local` |
| `--unsafe-local` | false | Records unsafe execution permanently |
| `--output {dir}` | `.dsh-testkit/runs/{run-id}` | Canonical artifact directory |
| `--expect-row {id}` | none | Repeatable config-row assertion |
| `--expect-service {name}` | none | Repeatable Cordis service assertion |
| `--expect-tool {name}` | none | Repeatable tool-schema assertion |
| `--update-from {source}` | none | Enables update lifecycle before installing primary source |
| `--allow-mutable-source` | false | Allows execution but reproducible pass is unsupported |
| `--json` | false | Print canonical report JSON to stdout |
| `--no-color` | environment aware | Disable terminal colors |
| `--version` | n/a | Print the installed Testkit version without creating a runner |

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | passed |
| `1` | lifecycle test failed |
| `2` | invalid input or scenario |
| `3` | infrastructure or cleanup error |
| `4` | required capability unsupported |
| `5` | flaky result |

## Output Files

- `report.json`: canonical result.
- `junit.xml`: one testcase per lifecycle stage.
- `report.md`: human-readable support report.
- `logs/{stage}.stdout.log` and `logs/{stage}.stderr.log`: sanitized stage output.
- `evidence/`: probe, profile, file, process and port snapshots.
- Full or repeated runs retain each projection under `attempts/{nn}/`; the root report contains semantic digests and the aggregate verdict.

## Safety

- Docker is required by default.
- Local runner without `--unsafe-local` is rejected before executing plugin code.
- CLI never reads model provider keys for the baseline suite.
