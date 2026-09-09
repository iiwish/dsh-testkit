# Host Compatibility

Release scope: DSH Testkit `0.4.3`. Status checked: 2026-09-09.

| Host versions | Status |
| --- | --- |
| `0.1.1-rc.2` | Formal support; default host |
| `0.1.2-rc.1` | Formal support in Testkit `0.4.3` |
| `0.1.0-rc.6`, `0.1.0-rc.7`, `0.1.0-rc.8` | Formal compatibility support |
| `0.1.2-alpha.2` through `0.1.2-alpha.5` | Older alpha canaries with recorded passing checks; not formally supported or rerun after rc.1 promotion |
| `0.1.3-alpha.2` | Disposable canary; Linux lifecycle and native-bundle checks pass; not formally supported |
| `0.1.2-alpha.1`, `0.1.3-alpha.1` | Immutable official releases without matching npm artifacts; no runtime execution |

The support registry is `src/adapters/dsh/support.ts`. A candidate's presence in Release Watch does not enable it in the published CLI. The canary enabler changes only its disposable checkout. Release Watch selects candidates newer than the highest formally supported version. The recorded T015 discovery result identifies runnable candidate `0.1.3-alpha.2` and pending npm candidate `0.1.3-alpha.1`; fresh discovery determines the live candidate set.

## Validation

The [formal Linux CI](https://github.com/iiwish/dsh-testkit/actions/runs/34203974329) passes all five supported hosts through lifecycle, native bundle, installed-package Docker execution and positive/negative Action smoke cases. The [main candidate monitor](https://github.com/iiwish/dsh-testkit/actions/runs/34205717065) passes discovery, both independent `0.1.3-alpha.2` lanes and its terminal summary at merge commit `1bf96dbc6711833cc367c91b012caa6f38d0ab8b`. The T015 evidence record holds the checked artifact manifests and monitoring receipts.

The adapter establishes a subject-free runtime baseline before taking subject snapshots. Changes to existing host paths remain subject-attributable; host filenames are not a blanket exemption. Browser smoke waits for the Connection service and uses the disposable host's own root-token exchange without disabling its authentication fence. Logs and process snapshots redact launch tokens. The T014 evidence record tracks validation and artifact review.

## Promotion Gate

An exact npm candidate becomes formally supported only after lifecycle, negative-residue, HTTP, browser, native-bundle and packaged-consumer checks pass and the adapter change is reviewed. All existing supported hosts must remain green. Candidate failures retain their reports and do not change the default host or stable exit-code semantics.

## Monitoring

Release Watch runs daily at 03:17 UTC on the default branch and supports explicit dispatch. Its final summary records the ref, commit, discovery result, aggregate independent-lane result, runnable candidates and pending npm candidates. A failed or cancelled prerequisite cannot produce a passing summary. A successful discovery with no candidates records a skipped canary matrix. Dispatch verification does not claim that a future scheduled run has executed.
