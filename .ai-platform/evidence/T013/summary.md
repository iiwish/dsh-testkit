# T013 Evidence Summary

Status: Accepted

DSH Testkit v0.4.1 packages source plugins entirely inside its owned Docker worker, including package-manager dependency setup and `prepare` scripts. Generated workflows remain read-only and the Composite Action publishes JUnit annotations by default; Checks API publication is an explicit trusted-workflow option.

The development contract now pins both `@deepseek-ai/dsh-tools` and `@deepseek-ai/dsh-invariants` to `0.1.0-rc.8`. The supported real-host matrix passed on DSH `0.1.1-rc.2`, `0.1.0-rc.8`, `0.1.0-rc.7`, and `0.1.0-rc.6`; both Action smoke subjects passed on the default and all compatibility hosts.

Release discovery joins official immutable GitHub releases with exact npm availability. `0.1.2-alpha.1` remains pending because its npm artifact is absent. `0.1.2-alpha.2` appeared during execution with an exact npm artifact, entered only a disposable canary, and is not supported: its full real-host run passed 6 of 11 cases and its native bundle lifecycle report failed. Neither alpha is in the default support registry.

The design-partner register retains `dsh-shelf@0.7.0` and `@0xsline/dsh-spotlight@0.0.2` as immutable baselines. No higher public package exists, so no partner lifecycle rerun or compatibility conclusion was produced.

The English and Chinese README files describe the same quick start, proof boundaries, canary policy, and partner gate. v1 schemas, exit codes, Docker-default isolation, and the accepted T010-T012 behavior remain unchanged.

Spec-compliance review mapped every T013 acceptance criterion to focused tests or the retained matrix evidence. Maintainer review found one P2 before release: mutable `packageManager` tags were accepted and explicit npm versions were not guaranteed. The fix rejects non-semver versions and dispatches every explicit manager through Corepack at the declared version; its RED/GREEN tests and real Docker prepare fixture pass. Bug and quality review also covered the worker-only package boundary, Corepack state, read-only Action default, semantic release ordering, official-release filtering, disposable support-file editing, and support-registry isolation. No finding remains. QA review confirms that every supported row is green and that alpha failures cannot be reported as compatibility.

Residual risk: DSH alpha.2 creates new profile-owned credential/fallback paths and changes the observed TurnStatus transition. These are recorded as canary incompatibilities rather than normalized into the stable adapter without review. Publication, commit, and partner package releases remain outside this task.
