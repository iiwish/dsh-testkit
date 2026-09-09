# T018: Coordinated Vitest 4 Upgrade

Status: Needs_Review
Approval: User explicitly requested repairing PR #44 on 2026-09-09.
Mode: Direct Execute; no delegation authorized. One bounded dependency-maintenance task.

## Scope And Review Gate

Align Vitest and its V8 coverage provider at exact `4.1.11`, retain runtime package identities and existing coverage thresholds, and prevent split framework/provider updates. Package version remains `0.4.3`; publication, tags and paused automations are outside scope. The reviewed plan is the coordinated upgrade followed by local validation, audit and full Linux CI. No Critical/High scope conflict is identified. User acceptance of T017 is separate.

## RED

Original PR head `406901dd3a845f7f5eeb87857014dc4a6f5155ab` fails [CI 34304895123](https://github.com/iiwish/dsh-testkit/actions/runs/34304895123): Vitest `4.1.11` warns that coverage-v8 `3.2.7` is unsupported, then throws `Cannot read properties of undefined (reading 'fetchCache')` during coverage conversion. Host, Action and adoption jobs are skipped, not passed.

## Validation

- Focused RED: all three toolchain-contract tests fail for the mixed versions and missing version/security update groups.
- Paired-upgrade intermediate check: all 233 tests pass, but V8 branch coverage is 54.49%, below the unchanged 60% threshold. This is a failed validation, not a pass. Vitest 4 uses AST-aware coverage remapping; its [migration guide](https://v4.vitest.dev/guide/migration) explains that coverage results can differ from v3. Explicit test discovery and `src/**/*.ts` coverage inclusion remain unchanged.
- Added 32 controller tests covering real filesystem request rewriting, read-only input planning, cached/missing images, build/identity failures, absent/unsafe reports, undeclared files/directories, symlinks, watchdog/cancellation cleanup and explicit local-runner state cleanup. Only the subprocess boundary is mocked; these are not substitutes for Linux Docker E2E.
- Final local `pnpm validate`: 265 tests in 36 files pass, plus contracts, typecheck, coverage and build. Coverage: statements 75.45%, branches 60.40%, functions 79.90%, lines 77.95%. No thresholds, excludes or existing tests were weakened.
- Frozen install passes with `optimistic-repeat-install=false`. Official npm audit reports zero findings across all severities for the complete 148-entry graph, including development dependencies.
- Structured lock traversal confirms all 38 snapshots/integrities reachable from non-Vitest direct dependencies equal `origin/main`; the 11-entry production closure is unchanged. The bot's unrelated schemastery refresh is removed. Runtime source has no diff. The ignored runner lock is generated from the complete root lock, including the coordinated development-tool updates.
- Dependabot groups eligible Vitest packages for version and security updates; the exact-version contract detects mismatches even when an automated security update does not include the non-vulnerable provider. Grouping follows [GitHub's configuration reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#groups--).
- `git diff --check` passes. Final PR-head checks and merge permission are tracked in [PR #44](https://github.com/iiwish/dsh-testkit/pull/44); every head must independently satisfy required checks before merge.
- First repaired-head Linux run `34308111171` fails the new runner tests because a clean checkout has no generated `assets/runner-pnpm-lock.yaml` before the build step. Test setup explicitly executes the existing lock-generation script before hashing the runner context; it does not change the CI gate order or substitute a fabricated digest. CodeQL run `34308109257` passes. Clean-checkout verification is required for the correction.

## Clean Checkout And Linux Evidence

- Fresh `git archive` checkout at `eadc7f8b527c3dc222bce3a8abc530d13f250f59`, without `node_modules`, `dist` or the generated runner lock: frozen install and full `pnpm validate` pass all 265 tests. Branch coverage is 60.46%; build succeeds.
- That exact implementation head passes all 18 jobs in [Linux CI 34308277324](https://github.com/iiwish/dsh-testkit/actions/runs/34308277324), including all five real-host versions, ten Action cases and adoption. [CodeQL 34308274963](https://github.com/iiwish/dsh-testkit/actions/runs/34308274963) passes both languages. GitHub also validates the Dependabot configuration.
- All 17 downloaded artifacts match independently replayed evidence-policy manifest file entries. Each of five formal host artifacts has 701 files and 13 reports: 10 passing and 3 intentional negative controls. All five packed-consumer reports pass. Adoption has 273 files and 5 reports (4 passing, 1 intentional negative control); all eleven Action artifacts pass.
- Runtime source, coverage configuration and existing tests remain unchanged. The closeout only adds these receipts and sets review status; the latest exact-head CI remains visible on PR #44 without a recursive evidence-only commit cycle.

## Residual Risk And Review

No runtime behavior or published package is changed. The Node-only test suite does not expose a Vitest browser/mocker server; the dependency advisory is addressed through the patched package, not by claiming an application exploit reproduction. Review retains unchanged version, default host, coverage configuration and public schemas. Branch coverage has limited margin; Linux Node 22 CI remains a required gate. No unresolved merge-blocking code or scope finding remains. T018 user acceptance is separate from permission to update or merge PR #44.
