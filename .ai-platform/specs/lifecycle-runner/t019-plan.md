# T019: DSH 0.1.5 RC Compatibility

Status: Confirmed
Date: 2026-09-10
Approval: User explicitly requested completing the proposed DSH 0.1.5-rc.1 validation and conditional support promotion.
Mode: Direct Execute; delegation is not authorized.

## Scope

Validate the immutable `@deepseek-ai/dsh@0.1.5-rc.1` artifact through the existing lifecycle, negative controls, HTTP, authenticated browser, native bundle, installed-package and Action gates. Add that exact host to the source support registry and CI matrix only with passing evidence. Keep the default at `0.1.1-rc.2` and retain all five existing supported hosts. Source support is distinct from the published `0.4.3` package and `v0` Action.

## Execution And Validation

1. Record the npm/release identities and RED support/CI contract tests.
2. Enable the exact candidate on the maintenance branch and run focused contracts and real-host tests. Investigate any failure without weakening assertions or changing verdict attribution.
3. Run `pnpm validate`, the Linux six-host lifecycle/native-bundle/pack matrix and positive/negative Action cases. Retain and inspect sanitized evidence.
4. Update support documentation with the verified source-only state and review the scoped diff.

Allowed files: `src/adapters/dsh/**`, focused regression fixtures/tests if a reproduced incompatibility requires them, `tests/unit/dsh-support.test.ts`, `tests/contracts/ci-required-checks.test.ts`, `.github/workflows/ci.yml`, bilingual README host-support sections, `docs/host-compatibility.md`, the host-support paragraph in `docs/scenarios.md`, and T019 delivery records.

Checklist/analysis: the confirmed lifecycle contract and promotion gate cover this maintenance work. Schemas, exits, isolation, default host, package version and dependency graph remain unchanged. No product-scope expansion or Critical/High contract conflict is identified. Run one maintenance task at a time. Failed acceptance blocks promotion; do not relabel infrastructure failures as plugin failures.

No npm publication, release/tag movement, main merge, other dependency PRs, external partner writes or automation changes are included. Submit implementation for review after validation; user acceptance remains separate.

Task: T019. Depends on: T015/T016 implementation. Packet: `packets/T019.yaml`. Evidence: `.ai-platform/evidence/T019/`. Final status: `Needs_Review` only after the required gates pass.
