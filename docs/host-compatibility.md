# Host Compatibility

Status checked: 2026-09-08.

| Host versions | Status |
| --- | --- |
| `0.1.1-rc.2` | Formal support; default host |
| `0.1.0-rc.6`, `0.1.0-rc.7`, `0.1.0-rc.8` | Formal compatibility support |
| `0.1.2-alpha.2` through `0.1.2-alpha.5`, `0.1.2-rc.1` | Disposable canaries; runtime-baseline and browser-authentication fixes require full regression evidence |
| `0.1.3-alpha.2` | Newly published disposable canary; no compatibility claim |
| `0.1.2-alpha.1`, `0.1.3-alpha.1` | Immutable official releases without matching npm artifacts; no runtime execution |

The support registry is `src/adapters/dsh/support.ts`. A candidate's presence in Release Watch does not enable it in the published CLI. The canary enabler changes only its disposable checkout.

## Known Failure Classes

The [2026-09-07 Release Watch](https://github.com/iiwish/dsh-testkit/actions/runs/34099617872) reports unexplained host-runtime paths after uninstall and a web smoke stuck at `Deep diving...`. These are candidate compatibility failures, not evidence that the formal support matrix is broken.

The adapter establishes a subject-free runtime baseline before taking subject snapshots. Changes to existing host paths remain subject-attributable; host filenames are not a blanket exemption. Browser smoke uses the disposable host's own root-token exchange without disabling its authentication fence. The T014 evidence record tracks validation of these fixes.

## Promotion Gate

An exact npm candidate becomes formally supported only after lifecycle, negative-residue, HTTP, browser, native-bundle and packaged-consumer checks pass and the adapter change is reviewed. All existing supported hosts must remain green. Candidate failures retain their reports and do not change the default host or stable exit-code semantics.
