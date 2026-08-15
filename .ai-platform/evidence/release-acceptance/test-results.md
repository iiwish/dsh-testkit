# DSH Testkit v0.1 Release Acceptance Test Results

Date: 2026-08-15
Result: Passed release gate
Implementation commit: `5cb66b6`

## Repository And Package

| Check | Result |
|---|---|
| `git diff --check` | Passed |
| Delivery artifact validator | Passed for the lifecycle-runner work graph |
| `pnpm validate` | Passed: 11 test files, 64 tests, typecheck, coverage and build |
| V8 coverage | 49.70% statements/lines, 75.98% branches, 50.99% functions; thresholds passed |
| Clean Linux arm64, Node 22 frozen install and validation | Passed |
| Clean Linux amd64, Node 22 frozen install and validation | Passed |
| `pnpm test:pack` | Passed from a clean consumer, including the pinned Docker build |
| `publint@0.3.23` | Passed |
| Package export analysis | Node 16+ ESM and bundler paths passed; CommonJS warning matches the declared ESM-only Node 22 package |
| Public npm publish dry run | Passed: 107 entries, 86,841 bytes packed, 383,970 bytes unpacked |
| Repeated package build | Passed: identical SHA-256 `896ca110cd8fb91d664102241f71658ca9126e6c00b9848aa9709d0fb79d292b` |
| Production dependency audit | Passed against the public npm registry: no known vulnerabilities |
| Runtime license inventory | Passed: MIT, ISC and Python-2.0 |
| npm name check | `dsh-testkit` returned public-registry `E404` on 2026-08-15 |

## Contracts And CI

| Check | Result |
|---|---|
| Actual full report against report-v1 JSON Schema | Passed with Ajv 8 draft 2020-12 and `ajv-formats` |
| Actual full JUnit XML | Passed `xmllint`; repeatability testcase is present |
| Runtime report parsing | Passed Zod strict schema for root and all attempt reports |
| Published contract parity | Passed byte-for-byte SSOT/public schema check |
| `dsh-test --version` | Passed with `0.1.0` and no runner construction |
| `actionlint@v1.7.12` | Passed |
| Composite action validator `v0.6.0` | Passed for action and workflow |
| External Action pin gate | Passed: all remote `uses` values are full commit SHAs |
| GitHub-hosted Action execution | Deferred until the public repository exists |

## Real DSH And Fault Tests

| Test | Result |
|---|---|
| `pnpm test:e2e` | Passed 6 of 6 against `@deepseek-ai/dsh@0.1.0-rc.6` in 337.782 seconds |
| Healthy update fixture | Passed exact target version, post-update row assembly, boot, registration and exercise |
| Expected boot failure | Passed recovery and clean reboot proof |
| Registration failure | Correctly failed at `register` |
| Dirty uninstall | Correctly reported both DSH-home and workspace additions |
| Known-name DSH residue | Correctly failed with `added:dsh-home/.anonymous-user-id` |
| Observer fixture | Passed process and port evidence without observer self-residue |
| Exact npm source full suite | Passed 5/5 with one semantic digest; 60.009-85.956 seconds per attempt |
| Local tarball, default Docker | Passed from `/input/primary.tgz` |
| Controlled stale runner image | Wrong context label caused an image rebuild; resulting full label matched the context digest |
| Controller SIGINT | Exit 3, zero containers and request files; infrastructure report retained cleanup evidence |
| Fault injection for all 13 lifecycle stages | Every injected stage was recorded failed and cleanup was called |
| Required missing observer | Unit and real-host acceptance classify it `unsupported`, exit 4 |
| Missing exact DSH version | Real-host acceptance classifies it infrastructure error, exit 3 |
| Pinned full-SHA Git source | Real-host acceptance reaches the complete lifecycle; mutable and credential-bearing variants are rejected by contract tests |

## Full Repeatability Record

All five attempts used:

- Subject: `dsh-plugin-greeter@0.1.11`
- DSH integrity: `sha256:2a6fc6f9c83466349ee1974cda50008ee964041055fed19a397279f22238081e`
- Semantic digest: `sha256:f4d5dfd2f8e9dbff38cfe9eed4477d00effdbf87137c871c2d27bd63f7a5f281`
- Runner image: `dsh-testkit-runner:0.1.0-2f86c91963b8`
- Runner image ID: `sha256:153f50a554a902f61473a7d635460a48d41bdcd23a0df08be83fefd06b1768c8`

Attempt durations were 85.956, 60.009, 66.279, 66.535 and 64.586 seconds. The root report verdict is `passed` with `consistent: true`.
