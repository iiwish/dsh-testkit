# T022: Playwright Core Maintenance

Status: Running
Approval: The user requested review, conditional merge and completion of dependency item 3 on 2026-09-10.
Mode: Direct Execute; bounded dependency maintenance without delegation.

## Scope And Review

Review PR #48 against current main after PRs #49, #47 and #46. Upgrade only production `playwright-core` from exact `1.62.1` to `1.63.0`. Remove the bot's unrelated schemastery package, snapshot and three dependent-edge refreshes. Preserve every non-Playwright lock entry, Docker/browser selection, authentication, network restrictions, screenshots, cleanup and test assertions.

Allowed files: `package.json`, `pnpm-lock.yaml` and this record. Validation: structured comparison of every non-Playwright lock entry, public-registry metadata/integrity and audit, clean frozen installation, full validation/build, generated runner-lock parity and all six Linux host lanes with HTTP/browser/adoption/pack evidence. No runtime source changes are planned. The existing real-browser tests are the regression gate for this mechanical dependency update.

The official Playwright `v1.63.0` release adds browser/locator APIs and drops Ubuntu 20.04. The repository uses Node 22, Debian Bookworm Docker images and Ubuntu-latest CI, with an explicit system Chromium executable. It does not use the Playwright test runner or bundled browser downloads. The existing authenticated smoke path and visible desktop/mobile adoption lanes must pass against the actual system browser; unit mocks alone are insufficient.

## Evidence

The bot's rebased head `4d07639493ea08e7651b088b95b903f61c3ab60f` includes an unrelated schemastery `3.18.2` refresh. The final dependency boundary, Linux checks and review remain pending. No release or tag movement is authorized by this task.

The structured boundary check fails on the original bot lockfile and passes after repair. All 134 non-Playwright package entries, 134 snapshots, other importer entries and lock settings exactly equal current main. The public npm integrity for `playwright-core@1.63.0` matches the lock; its Node requirement is `>=20` and it adds no transitive dependency.

A fresh frozen install passes the 135-entry supply-chain policy. Public-registry audit reports zero vulnerabilities across all severities. Local `pnpm validate` passes all 280 tests in 36 files, contract checks, typecheck, unchanged coverage gates and build. The generated Docker runner lock is byte-identical to the root lock. Linux browser/host verification remains the merge gate.
