# T009 Test Results

Date: 2026-08-16

## RED

Command:

```bash
pnpm vitest run tests/unit/scaffold.test.ts tests/integration/cli.test.ts tests/contracts/documentation.test.ts
```

Result before implementation: exit 1. Six nested-root assertions failed while 19 tests passed. The root-only scaffold had no `repositoryRoot`, wrote `.github` and `.agents` under the nested plugin, ignored the explicit root, and did not preflight a repository-root conflict.

A second documentation RED run produced one expected failure because neither README documented `--repo-root`; the new symlink-marker test already passed against the implementation.

## GREEN

Focused command:

```bash
pnpm vitest run tests/unit/scaffold.test.ts tests/integration/cli.test.ts tests/contracts/documentation.test.ts
```

Result: exit 0, 26 tests passed across three files.

Full command:

```bash
pnpm validate
```

Result: exit 0. Contract, Action pin, release-readiness, typecheck, coverage and build gates passed. Vitest executed 117 tests across 22 files with no failures.

Packed consumer command:

```bash
pnpm test:pack
```

Result: exit 0. `dsh-testkit-0.3.1.tgz` passed clean consumer and Docker image smoke validation.

## Exact Partner Runs

Doctor:

```bash
node <T009-dist>/src/cli.js --config dsh-testkit.yaml --output .dsh-testkit/pilot
```

Result: exit 0, run `20260816041700-17d72baa`, verdict `passed`, 52 artifacts.

Subscribe:

```bash
node <T009-dist>/src/cli.js --config plugin/dsh-testkit.yaml --output .dsh-testkit/pilot
```

Result: exit 0, run `20260816041825-1bb4305c`, verdict `passed`, 48 artifacts.

Both repositories were cloned from exact public tags into an owned temporary directory. Initialization was rerun and reported all three generated files as `unchanged`, including `dsh-test init plugin --repo-root .` for the nested layout.
