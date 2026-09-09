# T017 Test Results

Status: Needs_Review

## Local Checks

- Version-identity RED: 5 expected failures across CLI, manifest, runner image and changelog assertions with the 0.4.2 source. Version update GREEN: `pnpm validate` passed all 228 tests, contracts, typecheck, coverage and build.
- `npm publish --dry-run --json --ignore-scripts`: passed; 151 files, no publication. `publint@0.3.12`: passed.
- The configured mirror has no audit endpoint. Official npm audit found high-severity GHSA-2883-xcg3-v3hh in `xmlbuilder2 > js-yaml@4.3.1`. The advisory was added to GitHub's database on 2026-09-08 and fixes the empty-merge-source work-budget bypass in `4.3.2`.
- Bounded negative-control test uses three empty merge sources and budget two; installed `4.3.1` returns without error, so the new test fails as intended. No large CPU-exhaustion payload is executed. Testkit's JUnit writer builds XML rather than parsing untrusted YAML; no application exploit is claimed.
- The targeted pnpm updater refreshed unrelated transitive packages without fixing js-yaml; those generated changes were discarded. The lock delta contains only js-yaml `4.3.1 -> 4.3.2` and the exact official-registry integrity. Official production audit then reports zero vulnerabilities. Frozen install disables pnpm's optimistic repeat-install shortcut to actually relink the changed transitive dependency.

- Security GREEN: the bounded merge-budget test passes on `4.3.2`; final `pnpm validate` passes all 229 tests in 33 files, static/type/coverage checks and build. The generated runner lock also resolves `js-yaml@4.3.2`.

- Manual distribution workflow RED: missing workflow file fails its contract. GREEN: least-privilege/manual trigger, v0/immutable-tag identity, registry CLI and released Action checks pass focused tests and actionlint. Final full validation passes 230 tests in 34 files. The workflow does not publish or create recurring automation.
- Full dependency audit has no high/critical findings and retains two moderate development-only entries for Vitest/mocker (GHSA-82fw-gwwq-j7x9). The repository runs Node-environment `vitest run`, not exposed mocker/browser dev servers; production audit is clean. A major test-framework migration is deferred rather than mixed into this patch. This is a documented residual risk, not a zero-vulnerability claim for the full development graph.

## Candidate And Main

- [PR #43](https://github.com/iiwish/dsh-testkit/pull/43), head `36e38b1b976af0dd40f3e9bc5df8df475bd1d92e`: [CI 34304188010](https://github.com/iiwish/dsh-testkit/actions/runs/34304188010) passes all 18 jobs; Actions and JavaScript/TypeScript CodeQL pass. Superseded initial run `34304016056` was cancelled, not counted as passing.
- Protected merge: `b6d2da02f01e0fed038fe8e75f943a218a4063fa`, 2026-09-09 02:50 UTC. Exact-main [CI 34304815739](https://github.com/iiwish/dsh-testkit/actions/runs/34304815739) passes all 18 jobs; [CodeQL 34304815472](https://github.com/iiwish/dsh-testkit/actions/runs/34304815472) passes.
- All 17 candidate artifacts were downloaded and independently rescanned against their published manifests. Every report identifies Testkit `0.4.3`. Each formal host artifact contains 701 files and 13 reports, including 3 intentional negative controls; all five installed-tarball reports pass. Adoption artifact: 273 files, 2,612,817 bytes. Both native desktop/mobile screenshots were visually inspected and show the exact unsent draft in an unobstructed native editor.

## Package Preflight

- Final local tarball contains 151 files, 863,197 unpacked bytes. SHA-1: `96d0ea6157505b4dac897162150f98c523a2c1e5`; integrity: `sha512-jwejl6yeQjWagWT2zFrkIhD7+xbgvCSO3gkmXqdGFhFTD2daObwGo6QQPUg/RinbFcbDNdAbo40t9hbfefRIxg==`.
- A clean official-registry consumer installs this tarball without scripts or optional host peers, reports CLI version `0.4.3`, and imports the public ESM API. Strict TypeScript 5.9.2 NodeNext/ES2022 compilation passes with Node 22 type declarations and without `skipLibCheck`.
- ATTW 0.18.2 crashes internally with `Cannot read properties of undefined (reading 'filename')` for both direct-tarball and pack modes. No passing ATTW result is claimed. The actual clean consumer compile/import and passing publint provide the alternative export/type evidence.

## Publication

Immutable tag `v0.4.3` identifies the verified merge commit. [Trusted release run 34305470862](https://github.com/iiwish/dsh-testkit/actions/runs/34305470862) passed identity, validation, lifecycle, native bundle, packed consumer, evidence safety, npm publication and public visibility. Its downloaded evidence rescans exactly: 701 files, 5,190,712 bytes, 13 reports including intentional negative controls.

- Public npm `0.4.3`: 151 files, 863,197 unpacked bytes. SHA-1 `7d2590531bf808ddbd29fd78476f795f49ae6fdf`; integrity `sha512-iJ+/s/huYRVt27lQNml9GFfdOL2r8c1DBsYuBeYpJ+ASUONO1VsJ84WIltyX2y2lQ9iK3aOnRs0OzJ+CfRmSXQ==`. The compressed archive differs from local preflight, but all 151 entry paths and file bytes compare exactly equal.
- Public metadata `gitHead` and SLSA provenance resolve `b6d2da02f01e0fed038fe8e75f943a218a4063fa`, `refs/tags/v0.4.3`, this repository's `.github/workflows/release.yml` and run `34305470862`. Both publish and provenance attestation subjects match the public tarball SHA-512.
- Clean official npm consumer: installation succeeds, audit reports zero vulnerabilities, CLI reports `0.4.3`. `npm audit signatures` cryptographically verifies 12 registry signatures and 3 attestations.
- [GitHub Release v0.4.3](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.3) is published. Action `v0` advances from `c418db152334cdba0e9473b828e8345b73c496cb` to the release commit using an exact-old-value lease. Existing `v0.4.2` is not retargeted.
- Runtime dependency license metadata is MIT, Apache-2.0, ISC or Python-2.0. No new runtime package is introduced.

## Public Distribution Execution

[Manual verification 34306204816](https://github.com/iiwish/dsh-testkit/actions/runs/34306204816) completed successfully on 2026-09-09 at 03:14 UTC. Release identity, official npm installation, published CLI, evidence safety and the released `v0` Action all pass. Both reports identify Testkit `0.4.3`, DSH `0.1.2-rc.1`, Docker isolation and verdict `passed`.

- Downloaded `dsh-public-consumer`: 55 files, 514,546 bytes, one passing report.
- Downloaded `dsh-public-action`: 53 files, 402,664 bytes, one passing report.
- Independent safety-policy replay matches every manifest file entry for both artifacts. Both executions record image ID `sha256:31ff3c88225173bad20fe4cbf95022b796bf74949e6283ddc3e57a5caf220e9b`.
- Dependabot PR #44 is outside the immutable release. Its Vitest 4 upgrade fails coverage with the retained Vitest 3 coverage plugin; no passing result or merge is claimed.

## Closeout Validation

Post-publication documentation validation: `pnpm validate` passes 230 tests in 34 files, contracts, typecheck, coverage and build. `git diff --check` passes. Delivery-artifact validator reports zero errors and 13 compact-index warnings; detailed task fields remain in the linked plan and packet.
