# T014 Canary Compatibility Maintenance

Status: Accepted
User authorization: Verified fixes accepted; merge and publication approved on 2026-09-08.
Base: `825382496444dfe3ebe5157f9a9b7583f11a1dd5` (main, 2026-08-31).

## Scope

- Release Watch runs lifecycle and native-bundle lanes independently and retains diagnostics on failure.
- The adapter boots a subject-free profile before capturing subject filesystem baselines. Host paths retain content-based residue detection.
- Browser smoke exchanges the owned host's launch token through its Connection API, validates the loopback authority, and keeps credentials out of public evidence.
- `zod` is pinned to `4.5.4`; the development Cordis is pinned to `4.0.2`. `@types/node` remains `24.13.3`; a Node 26 type major is not adopted while the runtime floor remains Node 22.
- Development-only `fast-uri` is locked to `3.1.7`; the official npm audit reports no known vulnerabilities.
- Formal support and the default host remain unchanged. Compatibility documentation distinguishes supported, canary and npm-unavailable releases.

## Source Attribution

Upstream inspected at `deepseek-ai/deepseek-harness@a66e4702047846cdaa10c66c9d3df3951f5ea70d` (`dsh-v0.1.2-rc.1`). `packages/boot/app-boot` owns profile module fallback directories; `packages/client/connection` owns browser-session credentials and `authenticatedUrl(baseUrl)` / root-token exchange. No authentication fence is bypassed.

## Review Boundaries

Unchanged: v1 schemas, stable exit semantics, Docker isolation, controller packaging boundary and supported-host registry. Negative fixtures still detect plugin writes to host-looking paths, including credential-file content. The user authorized merge and patch publication after Linux acceptance.

## Verification And Handoff

The real `0.1.2-rc.1` healthy lifecycle and negative host-filename residue cases pass locally. The positive report has no unexplained residue; the negative report detects both `.anonymous-user-id` and `.credentials.yaml`. A focused filesystem test also proves that modifications to an existing baseline credential file are not exempted.

Linux acceptance at implementation commit `8d602cf399f19e738a3e8ea98eaa80016481e059`:

- [PR CI](https://github.com/iiwish/dsh-testkit/actions/runs/34185912844): all 14 jobs passed. All four supported hosts passed lifecycle, native bundle and packaged Docker consumer checks, with positive/negative Action smoke coverage.
- [Release Watch](https://github.com/iiwish/dsh-testkit/actions/runs/34185918263): discovery and all 12 candidate lanes passed for `0.1.2-alpha.2` through `0.1.2-alpha.5`, `0.1.2-rc.1` and `0.1.3-alpha.2`.
- All 12 final candidate archives were downloaded and scanned; no unredacted launch URL was found. Browser E2E enforces this for its declared text artifacts. Earlier unsafe process-snapshot archives were removed; details are in the test record.
- Local `pnpm validate`: 26 files / 175 tests passed. Typecheck and whitespace checks passed after the final E2E assertion.

Spec and code review found no remaining blocker in the scoped fixes after resolving Connection readiness and process-snapshot redaction. [PR #37](https://github.com/iiwish/dsh-testkit/pull/37) is merged at `4c00534`. Local macOS Docker builds remain affected by slow package downloads; Linux Docker acceptance is complete. Candidate packaged-consumer promotion checks were not added to Release Watch, so no candidate is promoted to formal support. The v0.4.2 release report tracks publication separately.
