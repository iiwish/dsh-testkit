# T021: pnpm Action Maintenance

Status: Running
Approval: The user requested review, conditional merge and completion of dependency item 3 on 2026-09-10.
Mode: Direct Execute; bounded dependency maintenance without delegation.

## Scope And Review

Review PR #46 against current main after PRs #49 and #47. Pin pnpm/action-setup to `ea17c68df8912ef543352723c149a84f56e3d413` (`v6.1.0`) in the CI, release-watch, release workflows and consumer composite Action. Keep pnpm `11.1.3`, Node selection, permissions, triggers, evidence gates and package locks unchanged. The composite Action is an existing consumer omitted by the bot's workflow-only sweep.

Allowed files: the three workflow YAML files, `.github/actions/dsh-test/action.yml`, `tests/contracts/ci-required-checks.test.ts` and this record. Validation: a cross-surface pin-parity RED/GREEN contract, Action SHA validation, actionlint, full validation and the six-host Linux/Action/adoption matrix. Publication and tag movement are excluded.

The upstream signed `v6.1.0` tag resolves to the proposed SHA and GitHub verifies its signature. The source comparison with `v6.0.10` adds pnpm 12 bootstrap selection; exact pnpm `11.1.3` retains the non-native installation path. Bootstrap updates are upstream Action internals, not a project package-manager upgrade. No workflow permission or release-trigger expansion is present.

## Evidence

The pin-parity test is RED on the bot update: seven workflow references use the new release while the composite Action retains the old SHA. Its nine existing CI contracts pass. Frozen public-registry installation succeeds without lockfile changes. Current-head checks and final review remain pending; user merge authorization is conditional on passing validation.

After aligning the composite Action, local `pnpm validate` passes 280 tests in 36 files, contracts, typecheck, coverage and build. Action SHA checks and actionlint 1.7.7 pass all three workflows. The pnpm package lock and all version-selection inputs remain unchanged.
