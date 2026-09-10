# T023 Verification

## Local Preparation

- RED: version assertions in bundle, CLI and Docker runner tests fail on the expected 0.4.3/0.4.4 mismatch; 3 failed and 19 passed.
- Frozen installation: `pnpm install --frozen-lockfile --config.optimistic-repeat-install=false` passes without lock changes.
- GREEN: `pnpm validate` passes 281 tests in 36 files, contracts, release checks, pinned Action checks, TypeScript, coverage and build. Coverage: statements 76.17%, branches 61.93%, functions 80.14%, lines 78.70%; thresholds unchanged.
- `npm publish --dry-run --json` passes with 151 package entries; no publication performed by this command.
- `pnpm audit --prod --audit-level high --registry=https://registry.npmjs.org` reports no known vulnerabilities. The local default mirror lacks the audit endpoint; verification uses the public registry explicitly.
- `git diff --check` passes.
- `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/release-consumer.yml` passes; no globally installed actionlint binary is required.

## Release Identity And CI

Release commit: `acc50b4dc307dbd40e621832329aaeac34614e90`.

- [Release PR #51](https://github.com/iiwish/dsh-testkit/pull/51), candidate `5c7a3764a6feae2eea70475b235546d593bc6126`: [CI 34469107546](https://github.com/iiwish/dsh-testkit/actions/runs/34469107546) passes all 21 jobs; both CodeQL languages pass.
- [Exact-main CI 34470042570](https://github.com/iiwish/dsh-testkit/actions/runs/34470042570) passes all 21 jobs; [CodeQL 34470042331](https://github.com/iiwish/dsh-testkit/actions/runs/34470042331) passes.
- Candidate artifacts independently pass safety-policy replay with all 5,190 manifest file entries identical. All 96 reports identify Testkit 0.4.4: 77 pass and 19 intentional negative-fixture verdicts. Desktop/mobile native draft screenshots are visually verified.
- Immutable `v0.4.4` targets the release commit. [Trusted publication 34471034598](https://github.com/iiwish/dsh-testkit/actions/runs/34471034598) passes identity, frozen install, validation, real-host lifecycle, native bundle, packed consumer, evidence safety and publication. Its 701 evidence file entries independently match a fresh safety-policy replay.

## Public npm Identity

- Public registry `gitHead` equals the release commit. All 151 extracted package files match the validated local archive byte-for-byte; archive compression differs between npm clients, but unpacked contents do not.
- Public tarball SHA-512: `3l+pKNBv9Znxfg3xazo+SZq4nGKKAkDkolFUchOnL/asB3pLXah8L+ErgFZqAruobeKhQNgiywRgC48mcnQIzg==`.
- Published SLSA provenance identifies `.github/workflows/release.yml`, `refs/tags/v0.4.4`, the exact release commit and run 34471034598. Its subject digest matches the downloaded tarball.
- Registry CDN initially returned a cached 404 (`max-age=300`). A cache-distinct request returned the matching package; after expiry, ordinary `npm pack dsh-testkit@0.4.4 --ignore-scripts --registry=https://registry.npmjs.org --prefer-online` succeeds without a URL override.
- Action `v0` is advanced from `b6d2da02f01e0fed038fe8e75f943a218a4063fa` to the release commit with an exact-old-value force-with-lease. No immutable tag is moved.

## Public Consumer Gate

[Public consumer run 34472073465](https://github.com/iiwish/dsh-testkit/actions/runs/34472073465) attempt 1 stops at package installation with the same registry tarball 404. No runtime assertion fails. After ordinary registry download succeeds, [attempt 2](https://github.com/iiwish/dsh-testkit/actions/runs/34472073465/attempts/2) passes the unchanged workflow: clean public install, audit, signatures, ESM/native-tool identity, real Docker CLI execution against DSH 0.1.5-rc.1, evidence safety and the released v0 Action.

Independent local clean npm installation passes with zero vulnerabilities. CLI reports 0.4.4; public ESM exports and native dsh_test tool identity pass. `npm audit signatures --registry=https://registry.npmjs.org` verifies all 12 dependency registry signatures and 3 attestations.

Both downloaded public-consumer artifacts independently pass safety-policy replay: 55 CLI file entries and 53 released-Action entries. Both reports pass with Testkit 0.4.4, DSH 0.1.5-rc.1 and Docker isolation.

[GitHub Release v0.4.4](https://github.com/iiwish/dsh-testkit/releases/tag/v0.4.4) is published as latest only after public consumer verification succeeds. Distribution is complete; final user acceptance remains pending. Registry propagation is resolved, with no bypass or source/tag modification used to pass the consumer gate.
