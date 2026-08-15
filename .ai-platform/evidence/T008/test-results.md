# T008 Test Results

Date: 2026-08-16
Environment: Darwin arm64, Node.js 24.15.0, pnpm 11.1.3, Docker client/server 29.4.0

## v0.3.0 TDD

- RED: focused scaffold, Agent Skill, native adapter and CLI tests failed because the modules and `init` command did not exist.
- Runtime observation RED: the real probe had no `skills` observation and could not prove native Skill discovery.
- Release-contract RED: v0.3.0 package, CLI, documentation, changelog and security assertions failed against the v0.2.1 identity.
- GREEN: the focused scaffold, Skill, native adapter, probe, CLI, package and documentation set passed 39 tests across 8 files; `pnpm typecheck` passed.

## v0.3.0 Acceptance

- `pnpm validate`: passed 108 tests across 21 files, contract/action/release checks, typecheck, coverage and build.
- `pnpm test:e2e`: passed all 8 real DSH lifecycle fixtures.
- `pnpm test:bundle-e2e`: passed real DSH bundle install, `dsh_test` execution and optional `dsh-testkit` Skill discovery.
- `pnpm test:pack`: passed `dsh-testkit-0.3.0.tgz` install, exports, declarations, one-command scaffold, byte-identical Skill and runner image construction.
- `actionlint v1.7.12`, publint 0.3.23, production dependency audit and license review passed.
- [PR #12 checks](https://github.com/iiwish/dsh-testkit/actions/runs/31896892296), main CI, CodeQL and [trusted release workflow](https://github.com/iiwish/dsh-testkit/actions/runs/31897201179) passed.

## v0.3.1 Corrective TDD

- RED: a real local Git source-resolution integration test retained `resolve-git-*` logs that were absent from the strict report artifact set.
- RED: a pack parser test with legitimate lifecycle output before the final JSON result had no safe parser and failed.
- RED: release contracts still asserted v0.3.0.
- GREEN: Git stdout/stderr artifacts are declared, the parser selects and validates only the final JSON array, and invalid final metadata cannot fall back to package-controlled output.
- `pnpm validate`: passed 111 tests across 22 files, contracts, typecheck, coverage and build.
- `pnpm test:pack`, `pnpm test:bundle-e2e`, production dependency audit, CodeQL, both Action smokes and the real-host job passed.
- [PR #13 checks](https://github.com/iiwish/dsh-testkit/actions/runs/31898405439), [main CI](https://github.com/iiwish/dsh-testkit/actions/runs/31898685006), [CodeQL](https://github.com/iiwish/dsh-testkit/actions/runs/31898684935) and [trusted release workflow](https://github.com/iiwish/dsh-testkit/actions/runs/31898835776) passed.

## Public And Upstream Evidence

- Public registry metadata reports `dsh-testkit@0.3.1`, SHA-1 `7fd8475e3479fb266621822482db6a4e85a94805` and integrity `sha512-cuL8BpHKDJpa53Sy7yxmEwVpx+ojXpWsSjktNGey3K30Hy5QaiBXscltAuQ7xzIGa5V7exgB6OvtxQQK9exGDg==`.
- npm publishes both package and SLSA attestations; the provenance subject is `pkg:npm/dsh-testkit@0.3.1` from `refs/tags/v0.3.1` and `.github/workflows/release.yml`.
- A clean public install returned CLI version 0.3.1, imported `createDshTestTool` and `initializeDshTestkitProject`, and contained the canonical 2,369-byte Skill.
- The public v0.3.1 generator was idempotent in `bugmaker2/dsh-plugin-template`, and its generated workflow passed actionlint.
- The public package completed the actual template repository-root quick lifecycle as run `20260815174406-8eff34b9`: package, install, assemble, boot, register, deterministic exercise, uninstall, reboot and cleanup passed with 52 retained artifacts.
- Show & Tell: <https://github.com/deepseek-ai/deepseek-harness/discussions/2038>
- Official vendor-neutral proposal: <https://github.com/deepseek-ai/deepseek-harness/discussions/2088>
- Maintained template submission: <https://github.com/bugmaker2/dsh-plugin-template/pull/1>
- Community directory listing: <https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/562>
