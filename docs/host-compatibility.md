# Host Compatibility

Release scope: DSH Testkit `0.4.4`. Status checked: 2026-09-10.

| Host versions | Status |
| --- | --- |
| `0.1.1-rc.2` | Formal support; default host |
| `0.1.5-rc.1` | Formal support in Testkit `0.4.4` with six-host CI |
| `0.1.2-rc.1` | Formal support |
| `0.1.0-rc.6`, `0.1.0-rc.7`, `0.1.0-rc.8` | Formal compatibility support |
| `0.1.2-alpha.2` through `0.1.2-alpha.5` | Older alpha canaries with recorded passing checks; not formally supported or rerun after rc.1 promotion |
| `0.1.3-alpha.2`, `0.1.5-alpha.1`, `0.1.5-alpha.2` | Disposable canaries; not formally supported |
| `0.1.2-alpha.1`, `0.1.3-alpha.1` | Immutable official releases without matching npm artifacts; no runtime execution |

The support registry is `src/adapters/dsh/support.ts`. A candidate's presence in Release Watch does not enable it in the published CLI. The canary enabler changes only its disposable checkout. Release Watch selects candidates newer than the highest supported version in that checkout. For the registry containing `0.1.5-rc.1`, older alpha hosts and unavailable older npm packages are outside the watch range; fresh discovery determines the live candidate set. The default remains `0.1.1-rc.2`, and all six listed hosts are supported.

## Validation

The [formal six-host Linux CI](https://github.com/iiwish/dsh-testkit/actions/runs/34470042570) passes lifecycle, native bundle, installed-package Docker execution, positive/negative Action cases and adoption at release commit `acc50b4dc307dbd40e621832329aaeac34614e90`. All 5,190 candidate evidence file entries independently match their manifests. The 96 candidate reports identify Testkit 0.4.4 and contain 77 passes and 19 expected negative-fixture verdicts. [Public npm CLI and released Action verification](https://github.com/iiwish/dsh-testkit/actions/runs/34472073465/attempts/2) passes against DSH `0.1.5-rc.1`; npm provenance, immutable `v0.4.4` and Action `v0` identify that release commit.

The [2026-09-10 scheduled canary run](https://github.com/iiwish/dsh-testkit/actions/runs/34453353489) passes both `0.1.5-rc.1` lanes, including deterministic HTTP, authenticated browser smoke and the native tool's Docker invocation. The T019 evidence record distinguishes canary checks from the complete promotion gate; T023 records public distribution proof.

The adapter establishes a subject-free runtime baseline before taking subject snapshots. Changes to existing host paths remain subject-attributable; host filenames are not a blanket exemption. Browser smoke waits for the Connection service and uses the disposable host's own root-token exchange without disabling its authentication fence. Logs and process snapshots redact launch tokens. The T014 evidence record tracks validation and artifact review.

## Promotion Gate

An exact npm candidate becomes formally supported only after lifecycle, negative-residue, HTTP, browser, native-bundle and packaged-consumer checks pass and the adapter change is reviewed. All existing supported hosts must remain green. Candidate failures retain their reports and do not change the default host or stable exit-code semantics.

## Monitoring

Release Watch runs daily at 03:17 UTC on the default branch and supports explicit dispatch. Its final summary records the ref, commit, discovery result, aggregate independent-lane result, runnable candidates and pending npm candidates. A failed or cancelled prerequisite cannot produce a passing summary. A successful discovery with no candidates records a skipped canary matrix. Dispatch verification does not claim that a future scheduled run has executed.
