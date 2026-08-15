# DSH Testkit v0.1 Release Acceptance Test Results

Date: 2026-08-15
Result: Failed release gate

## Repository And Package

| Check | Result |
|---|---|
| `git diff --check` | Passed before acceptance artifacts were added |
| Delivery artifact validator | Passed for T001 through T003 |
| Git candidate identity | Failed: no `HEAD` commit exists |
| `pnpm validate` | Passed: 9 test files, 41 tests, typecheck and build |
| Linux arm64, Node v22.23.2 clean frozen install and validation | Passed |
| Linux amd64, Node v22.23.2 clean frozen install and validation | Passed |
| `pnpm test:pack` | Passed |
| `publint` | Passed |
| Package export analysis | ESM Node 16+ and bundler paths passed; legacy Node 10 and CJS warnings are outside the declared ESM runtime |
| Public npm `publish --dry-run` | Passed: 101 entries, 71,939 bytes packed, 330,505 bytes unpacked |
| Repeated package build | Passed: identical SHA-256 on two packs |
| Production dependency audit | Passed: no known vulnerabilities |
| Runtime license inventory | Passed: MIT, ISC and Python-2.0 |

## Contracts And CI

| Check | Result |
|---|---|
| Actual report against published JSON Schema | Passed with Ajv draft 2020-12 structural validation; dates also passed runtime Zod validation |
| Actual scenario against published JSON Schema | Passed |
| Actual success and failure JUnit XML | Well-formed; failure case contains one failed `register` testcase |
| Scenario snapshot SHA-256 | Matched `report.scenario.digest` exactly |
| Declared artifact audit | Healthy run retained 57 regular files and declared 57 artifacts; no symlink found |
| `actionlint` | Passed |
| Composite action validator | Passed |
| ShellCheck for each composite run block | Passed |
| GitHub-hosted Action execution | Not run: no public repository or immutable commit exists |

## Real DSH And Fault Tests

| Test | Result |
|---|---|
| `pnpm test:e2e` | Passed 5 of 5 in 275.43 seconds |
| Healthy/update default Docker | Passed |
| Healthy default Docker repeated five times | Passed subset: identical semantic signatures, all under 77 seconds |
| Exact npm source repeated twice | Failed determinism: same identities produced `failed` then `passed` |
| Local tarball default Docker | Failed at `package` with npm `ENOTDIR`, exit 1 |
| Pinned full-SHA Git source, unsafe local | Passed |
| Registration failure, default Docker | Correctly failed at `register`, exit 1 |
| Required network observer | Correctly returned `unsupported`, exit 4 |
| Missing DSH exact version | Correctly returned infrastructure error, exit 3 |
| Controller SIGINT | Passed cleanup: exit 3, no container, no request file, no report |
| Fault injection for all 13 lifecycle stages | Every injected stage was recorded failed and cleanup was called |
| Plugin-created known DSH-home residue | Failed acceptance: Testkit returned passed while the file remained |
| `quick` versus `full` state machine | Failed acceptance: adapter calls and stage statuses were identical |

## Stable Healthy Signature

- Subject digest: `sha256:420728ef7835c2d216d3dc4b18098608ba00327186209e57a168950769879e75`
- DSH integrity: `sha256:2a6fc6f9c83466349ee1974cda50008ee964041055fed19a397279f22238081e`
- Scenario digest: `sha256:2a143274533f0d0f36019baddb1a4aad87740f400f4cf821abb1034014d74c56`
- Runner image: `sha256:05f4ebb9e6796102899421c651e5ff306c90f822fb1096ee87c0542b7609dfad`

## Nondeterministic Public Plugin Signature

Both runs used:

- Subject: `dsh-plugin-greeter@0.1.11`
- Subject digest: `sha256:4a88b068442623d8e2f6522713b706686a9b06dde6880816ec3cb033b0d5c10f`
- DSH integrity: `sha256:2a6fc6f9c83466349ee1974cda50008ee964041055fed19a397279f22238081e`
- Scenario digest: `sha256:6a68c37b76877233dbcc7c49a1d9a73f77129afdfe8ef951e476872cdc42fd1d`
- Runner image: `sha256:05f4ebb9e6796102899421c651e5ff306c90f822fb1096ee87c0542b7609dfad`

The failed run's only residue was the Testkit observer command `ss -lntup`; the second run passed.
