# Contributing

Requirements: Node.js 22 or newer, pnpm 11, Git, and Docker for the default runner.

```bash
pnpm install
pnpm validate
pnpm test:e2e
pnpm test:pack
```

Behavior changes start with a failing test. Keep DSH-specific assumptions inside `src/adapters/dsh` or the versioned runtime probe. Scenario and report changes must update the Zod contract, confirmed JSON schema, published `schemas/` copy, fixtures, and projections together.

The Docker runner uses `assets/runner-pnpm-lock.yaml`, which `pnpm build` generates from the canonical root `pnpm-lock.yaml`. The generated file is ignored by Git and included in the npm package, so dependency changes require no manual lockfile copy.

The real-host E2E suite executes intentionally broken packages. Use Docker for untrusted subjects. Local E2E is reserved for repository-owned fixtures and still requires explicit unsafe consent.

Set `DSH_TESTKIT_E2E_OUTPUT` to retain lifecycle reports, sanitized logs, and browser screenshots in a chosen evidence directory. Native bundle tests retain only diagnostics and nested run reports there, not host homes or package installations. Release Watch runs lifecycle and native-bundle lanes as separate matrix jobs and uploads evidence on failure as well as success. New host candidates require both lanes; an early lifecycle failure must not suppress the bundle result.

Runtime support starts at Node.js 22. Keep the Node type-definition major under explicit review rather than automatically adopting the latest major; newer declarations can make unavailable runtime APIs typecheck successfully.

Do not add model calls to the baseline lifecycle. A deterministic assertion needs an observable host fact, a declared expected value, and retained evidence.
