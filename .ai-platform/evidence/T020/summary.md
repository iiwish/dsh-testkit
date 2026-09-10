# T020: Vitest 5 Compatibility

Status: Needs_Review
Approval: User explicitly requested completing the proposed Vitest 5 PR repair on 2026-09-10.
Mode: Direct Execute; no delegation authorized. One bounded dependency-maintenance task after T019 implementation validation.

## Scope And Validation Plan

Repair [PR #47](https://github.com/iiwish/dsh-testkit/pull/47) at original head `62d8ecadba9303d0f98db466ef89481700aae860`. Keep Vitest and coverage-v8 at exact `5.0.0`; replace removed suite `.sequential` calls with explicit `concurrent: false` and retain the bundle's conditional skip. Preserve test discovery, assertions, coverage inclusion and thresholds. Restore unrelated DSH dependency snapshots changed by the bot. No runtime feature, package-version, main-merge, publication, release-tag or other dependency PR work is included.

Allowed files: `package.json`, `pnpm-lock.yaml`, the three affected suites, `tests/contracts/test-toolchain.test.ts`, contributor test-toolchain requirements and this evidence record. The confirmed project testing contract applies. No Critical/High scope conflict is identified. Validation: original failing typecheck and focused RED contract tests; complete `pnpm validate`; clean frozen install; non-Vitest dependency-closure comparison; official registry audit; Linux real-host/native-bundle/installed-package/Action/adoption matrix and retained evidence review. User acceptance remains separate.

## RED

The original [CI 34311174117](https://github.com/iiwish/dsh-testkit/actions/runs/34311174117) fails typecheck because `.sequential` is absent from Vitest 5's suite API in `real-dsh.test.ts`, `real-dsh-bundle.test.ts` and `source-resolution.test.ts`. Later gates are skipped, not passed.

The original frozen dependency graph reproduces those three TypeScript errors locally. Three new AST-based suite contracts also fail before the migration (three failures, three existing toolchain-contract passes), requiring an explicit `concurrent: false` rather than relying on the framework's default execution mode.

The [official migration guide](https://vitest.dev/guide/migration/#removed-test-sequential-describe-sequential-and-sequential-options) specifies `concurrent: false` to opt out of inherited or global concurrency. Vitest 5 requires Node 22.12+ on supported Node release lines; CI's Node 22 and Vite 7.3.6 satisfy the toolchain requirements.

## Validation And Review

- Focused GREEN: all seven toolchain/source-resolution tests pass after the explicit suite-option migration.
- Local `pnpm validate` passes all 268 tests in 36 files, plus contracts, typecheck, coverage and build. Coverage: statements 75.54%, branches 60.46%, functions 79.90%, lines 78.01%. Test discovery, coverage configuration, existing assertions, timeouts and isolation remain unchanged.
- Frozen install with `optimistic-repeat-install=false` passes against the public npm registry and refreshes the actual install after the lock repair. The official-registry audit reports zero vulnerabilities across all severities for the complete 135-entry dependency graph.
- Structured traversal confirms all 38 snapshots and package integrity records reachable from non-Vitest direct dependencies equal `origin/main`; the 11-entry production closure is unchanged. The bot's unrelated schemastery update is removed. Vitest 5's exact upstream pins require `tinyexec@1.3.0` and `tinybench@6.1.4`; these are toolchain changes, not runtime dependency refreshes.
- The three AST-based suite contracts require explicit `concurrent: false`, and the native-bundle skip condition is retained. No global concurrency override or weaker isolation is introduced.
- A fresh detached checkout of `23d9bbb66d7796d8c38411189c5a8e8757285b65` passes frozen install and `pnpm validate` with all 268 tests. It starts without generated build output or runner locks. Coverage includes the same 34 files and denominators as Vitest 4: 2,094 statements, 1,692 branches, 403 functions and 1,860 lines.
- [Linux CI 34456460850](https://github.com/iiwish/dsh-testkit/actions/runs/34456460850) passes all 18 jobs at that implementation head: validation, change detection, five real-host lifecycle/native-bundle/installed-package lanes, adoption and ten Action smoke lanes. Both CodeQL analyses and the CodeQL check pass.
- All 17 retained artifacts were downloaded and independently replayed through the repository evidence scanner. All 4,380 file entries match the retained manifests exactly, including hashes and sizes. The 81 reports comprise 65 expected passes and 16 intentional negative-fixture failures: three per host and one adoption negative. No unexpected failure appears.
- A clean temporary merge preview with T019 head `e45f7f20538335c7d4d31156eafeb1d5e8bc757c` passes `pnpm validate`: 272 tests, contracts, typecheck, coverage and build. This is local composition evidence, not a combined Linux matrix claim. The temporary merge is aborted and its owned checkout removed after verification; both PRs remain independent.
- Final scope review finds no runtime dependency drift or weakened validation gates. Package version remains `0.4.3`. PR #47 is ready for maintainer review; user acceptance, main merge and publication are not performed.
