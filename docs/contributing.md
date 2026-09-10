# Contributing

Development requirements: Node.js 22.13+ (22.x), 24.x, or 26+, pnpm 11, Git, and Docker for the default runner. This satisfies both pnpm 11 and Vitest 5. Vitest and its V8 coverage provider use the same exact version. Suites that share environment state or run lifecycle fixtures explicitly set `concurrent: false`.

```bash
pnpm install
pnpm validate
pnpm test:e2e
pnpm test:pack
```

Behavior changes start with a failing test. Keep DSH-specific assumptions inside `src/adapters/dsh` or the versioned runtime probe. Scenario and report changes must update the Zod contract, confirmed JSON schema, published `schemas/` copy, fixtures, and projections together.

The Docker runner uses `assets/runner-pnpm-lock.yaml`, which `pnpm build` generates from the canonical root `pnpm-lock.yaml`. The generated file is ignored by Git and included in the npm package, so dependency changes require no manual lockfile copy.

The real-host E2E suite executes intentionally broken packages. Use Docker for untrusted subjects. Local E2E is reserved for repository-owned fixtures and still requires explicit unsafe consent.

Set `DSH_TESTKIT_E2E_OUTPUT` to retain lifecycle reports, sanitized logs, and browser screenshots in a chosen evidence directory. Native bundle and packaged-consumer tests retain only diagnostics and run reports there, not host homes or package installations. `test:pack` installs the produced tarball into a clean consumer, checks its public interfaces and Docker build, then executes that installed CLI against `DSH_TESTKIT_DSH_VERSION` using Docker and validates the resulting host/package identity and lifecycle report.

Release Watch runs lifecycle and native-bundle lanes as separate matrix jobs. New host candidates require both lanes; an early lifecycle failure must not suppress the bundle result. Formal CI, Release Watch, the release workflow and the source Composite Action run `scripts/prepare-evidence.mjs` before uploading diagnostics; JUnit also reads only the checked staging copy. Safe failed-run evidence is retained without converting the original failure to success. A policy rejection fails the job and suppresses both outlets.

The evidence policy permits named diagnostic files, regular non-linked inputs, UTF-8 text and the bounded browser PNG. It rejects unknown files, host directories, recognizable credentials, files over 16 MiB, bundles over 256 MiB, more than 4,000 files and excessive nesting. Success creates a fresh mode-restricted copy and a SHA-256 manifest; missing output is explicitly recorded as unavailable, not as a passing test. Review policy additions alongside representative genuine evidence and adversarial tests. Do not use this scanner as arbitrary-secret detection, screenshot privacy certification or a sandbox for concurrently hostile processes.

Runtime support starts at Node.js 22. Keep the Node type-definition major under explicit review rather than automatically adopting the latest major; newer declarations can make unavailable runtime APIs typecheck successfully.

Do not add model calls to the baseline lifecycle. A deterministic assertion needs an observable host fact, a declared expected value, and retained evidence.
