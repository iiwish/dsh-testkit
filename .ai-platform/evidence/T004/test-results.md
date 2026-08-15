# T004 Test Results

Date: 2026-08-15
Implementation commit: `5cb66b6`

## RED

Command:

```bash
pnpm test -- tests/unit/snapshot.test.ts tests/unit/runner.test.ts tests/unit/source.test.ts tests/integration/cli.test.ts tests/integration/worker.test.ts
```

Result: Failed as expected with eight regressions. Missing behavior included content diffs, sequential observer capture, observer-command filtering, exact update assertions, tarball mount paths, content-keyed image names, CLI version and full-suite repeatability/flaky classification.

## GREEN

| Command / check | Result |
|---|---|
| `pnpm validate` | Passed: 11 files, 64 tests, typecheck, build and coverage thresholds |
| V8 coverage | 49.70% statements/lines, 75.98% branches, 50.99% functions |
| 13-stage fault matrix | Passed; every target stage retained a failure and cleanup call |
| CLI full/flaky regression | Passed; five calls and exit 5 for inconsistent fake outcomes |
| Tarball default Docker | Passed the real quick lifecycle from `/input/primary.tgz` |
| Stale image label | Passed; mismatch triggered rebuild and full context label replacement |
| `dsh-test --version` | Passed with `0.1.0` before runner construction |

## REFACTOR And Release Acceptance

| Command / check | Result |
|---|---|
| `pnpm test:e2e` | Passed 6/6 real DSH fixtures in 337.782 seconds |
| Exact npm `--suite full` | Passed 5/5, one semantic digest, 60.009-85.956 seconds |
| Linux arm64 clean frozen validation | Passed on pinned Node 22 image |
| Linux amd64 clean frozen validation | Passed on pinned Node 22 image |
| `pnpm test:pack` | Passed clean consumer and installed-package Docker build |
| `publint@0.3.23` | Passed |
| `@arethetypeswrong/cli@0.18.5` | ESM and bundler green; expected ESM-only CJS warning |
| `npm publish --dry-run --ignore-scripts` | Passed: 107 files, 86,841 packed bytes |
| Repeated `npm pack` | Identical SHA-256 `896ca110cd8fb91d664102241f71658ca9126e6c00b9848aa9709d0fb79d292b` |
| `pnpm audit --prod --registry=https://registry.npmjs.org/` | No known vulnerabilities |
| Runtime license inventory | MIT, ISC and Python-2.0 |
| `actionlint@v1.7.12` | Passed |
| `@action-validator/cli@0.6.0` | Passed action and workflow schemas |
| Published report JSON Schema | Passed Ajv 8 draft 2020-12 plus formats |
| JUnit XML | Passed `xmllint` |
| Controller SIGINT | Exit 3; zero containers and request files; cleanup evidence retained |

## Stable Full Evidence

- Run ID: `20260815075115-fb14ab93`
- Semantic digest: `sha256:f4d5dfd2f8e9dbff38cfe9eed4477d00effdbf87137c871c2d27bd63f7a5f281`
- Image: `dsh-testkit-runner:0.1.0-2f86c91963b8`
- Image ID: `sha256:153f50a554a902f61473a7d635460a48d41bdcd23a0df08be83fefd06b1768c8`
- Verdict: `passed`, `consistent: true`, five completed attempts.
