# T023 Verification

## Local Preparation

- RED: version assertions in bundle, CLI and Docker runner tests fail on the expected 0.4.3/0.4.4 mismatch; 3 failed and 19 passed.
- Frozen installation: `pnpm install --frozen-lockfile --config.optimistic-repeat-install=false` passes without lock changes.
- GREEN: `pnpm validate` passes 281 tests in 36 files, contracts, release checks, pinned Action checks, TypeScript, coverage and build. Coverage: statements 76.17%, branches 61.93%, functions 80.14%, lines 78.70%; thresholds unchanged.
- `npm publish --dry-run --json` passes with 151 package entries; no publication performed by this command.
- `pnpm audit --prod --audit-level high --registry=https://registry.npmjs.org` reports no known vulnerabilities. The local default mirror lacks the audit endpoint; verification uses the public registry explicitly.
- `git diff --check` passes.

## Pending Gates

Reviewed release PR, exact-main six-host CI and CodeQL, trusted publishing, public tarball identity/provenance, immutable tag, GitHub Release, leased v0 update and published CLI/Action execution.
