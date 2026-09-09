# T017 Test Results

Status: Running

## Local Checks

- Version-identity RED: 5 expected failures across CLI, manifest, runner image and changelog assertions with the 0.4.2 source. Version update GREEN: `pnpm validate` passed all 228 tests, contracts, typecheck, coverage and build.
- `npm publish --dry-run --json --ignore-scripts`: passed; 151 files, no publication. `publint@0.3.12`: passed.
- The configured mirror has no audit endpoint. Official npm audit found high-severity GHSA-2883-xcg3-v3hh in `xmlbuilder2 > js-yaml@4.3.1`. The advisory was added to GitHub's database on 2026-09-08 and fixes the empty-merge-source work-budget bypass in `4.3.2`.
- Bounded negative-control test uses three empty merge sources and budget two; installed `4.3.1` returns without error, so the new test fails as intended. No large CPU-exhaustion payload is executed. Testkit's JUnit writer builds XML rather than parsing untrusted YAML; no application exploit is claimed.
- The targeted pnpm updater refreshed unrelated transitive packages without fixing js-yaml; those generated changes were discarded. The lock delta contains only js-yaml `4.3.1 -> 4.3.2` and the exact official-registry integrity. Official production audit then reports zero vulnerabilities. Frozen install disables pnpm's optimistic repeat-install shortcut to actually relink the changed transitive dependency.

- Security GREEN: the bounded merge-budget test passes on `4.3.2`; final `pnpm validate` passes all 229 tests in 33 files, static/type/coverage checks and build. The generated runner lock also resolves `js-yaml@4.3.2`.

- Manual distribution workflow RED: missing workflow file fails its contract. GREEN: least-privilege/manual trigger, v0/immutable-tag identity, registry CLI and released Action checks pass focused tests and actionlint. Final full validation passes 230 tests in 34 files. The workflow does not publish or create recurring automation.
- Full dependency audit has no high/critical findings and retains two moderate development-only entries for Vitest/mocker (GHSA-82fw-gwwq-j7x9). The repository runs Node-environment `vitest run`, not exposed mocker/browser dev servers; production audit is clean. A major test-framework migration is deferred rather than mixed into this patch. This is a documented residual risk, not a zero-vulnerability claim for the full development graph.

Candidate/main/release and public distribution receipts remain pending.
