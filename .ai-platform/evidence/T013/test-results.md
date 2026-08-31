# T013 Test Results

## RED

The focused contract suite failed before implementation on the expected boundaries: both DSH tool packages were still pinned to rc.7, compatibility Action smoke contained only two rows, and release discovery had no official-release, pending-npm, or runnable-canary states.

```text
pnpm vitest run tests/unit/npm-adapter.test.ts tests/unit/scaffold.test.ts tests/unit/dsh-release-train.test.ts tests/contracts/dsh-bundle.test.ts tests/contracts/ci-required-checks.test.ts tests/contracts/documentation.test.ts
```

## GREEN And Validation

The focused suite passed after implementation. Fresh frozen installation and full validation passed:

```text
CI=1 pnpm install --frozen-lockfile
pnpm validate
Test Files 25 passed (25)
Tests 159 passed (159)
Coverage: 63.82% statements, 76.59% branches, 74.79% functions
```

Packaging, workflow syntax, Action pins, release readiness, type checking, and build all passed. The packaged consumer installed and exercised `dsh-testkit-0.4.1.tgz` successfully.

```text
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/ci.yml .github/workflows/dsh-release-watch.yml
pnpm test:pack
packed consumer smoke passed: dsh-testkit-0.4.1.tgz
```

The Composite Action YAML is covered by the repository Action-pin and permission contracts; actionlint accepts workflow files rather than composite Action manifests.

## Maintainer Review Fix

Review constructed two package-manager counterexamples: `pnpm@latest` was accepted as reproducible, and `npm@11.5.2` selected the runner's bundled npm rather than the declared release. The new tests failed on both paths before the fix, then passed after explicit managers were routed through Corepack and their versions were validated as exact semantic versions.

```text
pnpm vitest run tests/unit/npm-adapter.test.ts
RED: 3 failed, 4 passed
GREEN: 7 passed
```

The exact pnpm `prepare` fixture passed in the real Docker worker after the fix. Its first attempt exhausted the global budget while the cold image was still installing Chromium; the warm retry reached the package lifecycle and passed in 346.473 seconds.

## Supported Real-Host Matrix

Every complete 11-case real-host suite passed:

```text
0.1.1-rc.2  11/11 passed  1188s
0.1.0-rc.8  11/11 passed   618s
0.1.0-rc.7  11/11 passed   869s
0.1.0-rc.6  11/11 passed   763s
```

The first cold rc.8 attempt had five infrastructure failures while npm installation and the runner image exceeded cold-path budgets. Each failed row passed on retry, and the final complete rc.8 suite above passed without a retry exception. Local controller installation used `https://registry.npmmirror.com` after public-registry slowness; Docker lifecycle jobs retained their isolated in-container setup.

The native DSH bundle passed on all supported hosts:

```text
0.1.1-rc.2  passed  182s
0.1.0-rc.8  passed  374s
0.1.0-rc.7  passed  152s
0.1.0-rc.6  passed  139s
```

The local Composite Action entry passed all eight rows: healthy and boot-failure subjects on default `0.1.1-rc.2`, plus both subjects on compatibility hosts rc.8, rc.7, and rc.6. Every row returned exit code 0 and produced JSON and JUnit reports.

## Alpha Canary

Live release discovery returned:

```json
{
  "canaryVersions": ["0.1.2-alpha.2"],
  "pendingNpmVersions": ["0.1.2-alpha.1"],
  "supportedVersions": ["0.1.0-rc.6", "0.1.0-rc.7", "0.1.0-rc.8", "0.1.1-rc.2"]
}
```

The disposable alpha.2 support copy typechecked, then ran the actual exact version with `DSH_TESTKIT_DSH_VERSION=0.1.2-alpha.2`. The full real-host suite passed 6 of 11 cases. Five cases failed: healthy, prepare-source, observer, HTTP route, and browser status. Four reports identified new unexplained uninstall residue at `dsh-home/.credentials.yaml` and `dsh-home/profiles/web/.dsh-module-fallback/`; the browser case also observed `Deep diving...` instead of the fixture TurnStatus text.

The alpha.2 native bundle installed, registered, and invoked `dsh_test`, but the nested lifecycle report verdict was `failed`, so the bundle contract correctly failed. The initial disposable bundle attempt was discarded because a symlinked `node_modules` directory polluted `npm pack --json`; the recorded rerun used a copied dependency tree and reached the lifecycle assertion.

These failures are canary evidence, not failures of the supported matrix. Alpha.2 remains outside `SUPPORTED_DSH_NPM_VERSIONS`; alpha.1 cannot run until its exact npm artifact exists.

## Design Partners

The public registry returned 404 for `dsh-shelf`, and its repository tags end at `v0.6.0`; neither provides a package higher than the recorded `dsh-shelf@0.7.0` baseline. `@0xsline/dsh-spotlight` remains npm latest `0.0.2` with latest tag `v0.0.2` at `dd7ef5ed160aa1a624559de16eafd4ea9406d7ed`. The immutable package gates therefore stayed closed and no partner rerun was performed.
