# Contributing

Requirements: Node.js 22 or newer, pnpm 11, Git, and Docker for the default runner.

```bash
pnpm install
pnpm validate
pnpm test:e2e
pnpm test:pack
```

Behavior changes start with a failing test. Keep DSH-specific assumptions inside `src/adapters/dsh` or the versioned runtime probe. Scenario and report changes must update the Zod contract, confirmed JSON schema, published `schemas/` copy, fixtures, and projections together.

After changing dependencies, copy `pnpm-lock.yaml` to `assets/runner-pnpm-lock.yaml`. `pnpm validate` and `prepack` reject a stale runner lock.

The real-host E2E suite executes intentionally broken packages. Use Docker for untrusted subjects. Local E2E is reserved for repository-owned fixtures and still requires explicit unsafe consent.

Do not add model calls to the baseline lifecycle. A deterministic assertion needs an observable host fact, a declared expected value, and retained evidence.
