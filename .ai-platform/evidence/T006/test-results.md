# T006 Test Results

Last updated: 2026-08-15

## RED

`pnpm test -- tests/unit/dsh-plugin.test.ts tests/contracts/dsh-bundle.test.ts tests/unit/command.test.ts`

- Failed because `src/dsh-plugin.ts` and `cordis.patch.yml` did not exist.
- AbortSignal regression waited for timeout instead of terminating the child process.
- Existing unrelated tests remained green.

## GREEN And Local Acceptance

- `pnpm validate`: passed, 15 files and 85 tests.
- Coverage: 54.07% statements, 74.15% branches, 58.60% functions, 54.07% lines.
- `pnpm test:e2e`: passed, 8 real DSH lifecycle cases in 630.796 seconds.
- `pnpm test:bundle-e2e`: passed, one real DSH bundle/install/tool/Docker/removal case in 152.021 seconds.
- `pnpm test:pack`: passed for the final `dsh-testkit-0.2.0.tgz` candidate after the approval and output-containment refinements.
- `publint v0.3.23`: passed.
- `actionlint v1.7.12`: passed.
- `pnpm audit --prod --registry https://registry.npmjs.org/`: no known vulnerabilities.
- `npm pack --dry-run --json`: passed; bundle patch and compiled plugin entry are included.

## Pending Hosted Evidence

- Pull request and required checks.
- Merge commit and protected tag.
- Trusted npm publication and provenance.
- GitHub release and plugin-directory submission.
