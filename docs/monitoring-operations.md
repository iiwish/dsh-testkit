# Release Watch Operations

Owner: `iiwish`, repository maintainer. The maintainer reviews failed scheduled runs and approves host-support changes; the watcher cannot publish packages or promote support.

## Schedule And Freshness

The default-branch workflow requests one run daily at 03:17 UTC (11:17 Asia/Shanghai). GitHub may delay scheduling; a requested cron time is not an execution receipt. Treat absence of any scheduled run for 36 hours as stale and investigate Actions enablement and workflow availability.

Use `gh run list --workflow dsh-release-watch.yml --event schedule` and inspect the returned event, SHA, branch, jobs and conclusion. A successful `workflow_dispatch` verifies execution logic but cannot prove scheduler delivery.

On 2026-09-08, [scheduled run 34202400081](https://github.com/iiwish/dsh-testkit/actions/runs/34202400081) succeeded at `d6727279a9dc57bb5b23d2568a8137b9e5b2315c`. That is the T014 baseline, not T015's evidence-policy implementation. The [post-T015 manual main run](https://github.com/iiwish/dsh-testkit/actions/runs/34205717065) verifies the updated workflow at `1bf96dbc6711833cc367c91b012caa6f38d0ab8b`. The first scheduled run containing that implementation needs its own receipt.

A bounded Codex follow-up named `DSH 自然调度验收` (automation ID `dsh`) checks hourly at minute 30 for that receipt. It verifies the event, main-branch SHA ancestry, jobs and conclusion, remains quiet while nothing actionable changes, and pauses itself after success, failure or the freshness deadline of 2026-09-09 20:02 UTC. It has no authority to change repositories, rerun failures or publish. Other paused automations remain paused. This follow-up's creation is not a GitHub scheduler receipt.

## Failure Handling

1. Discovery failure: inspect release/npm reachability and exact-version parsing. No candidates discovered during an error is not a clean bill of health.
2. Official release without npm: retain a pending state. Do not run a mutable branch or substitute another package identity.
3. Canary failure: inspect lifecycle and bundle lanes independently, retain the exact failed identity and first failure stage, and distinguish infrastructure, host drift and plugin assertions.
4. Evidence safety failure: keep the job failed and suppress artifact/JUnit publication. Do not upload raw evidence to debug the scanner; reproduce and inspect locally in an isolated environment.
5. Retry only demonstrable transient infrastructure failures. Deterministic failures need a bounded fix and regression evidence.
6. Promote an exact host only through reviewed formal lifecycle, HTTP/browser, native-bundle, installed-package and Action acceptance. Preserve the existing default unless separately approved.

The workflow has read-only repository permissions. It does not create issues, send external messages or grant itself write access. Use GitHub Actions failure subscriptions for routine maintainer notifications; subscriptions are account preferences and are not verified by a green workflow. Successful unchanged runs and pending-package states do not require status-message noise.
