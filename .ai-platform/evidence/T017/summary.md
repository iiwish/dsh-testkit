# T017 Release Evidence

Status: Running
Base: `ce90f70ced1e290f2b0f20f45bb85811c2d7ae05`
Branch: `release/v0.4.3`
Executor: Codex, direct; no delegation authorized.
Approval: User explicitly authorized npm `0.4.3`, GitHub Release/tag and Action `v0` after passing checks on 2026-09-09.

## Dependency Review

PR #35 head `57c381390e8bd75e7c37da6ef3ea639434176f49` has green CI and no established runtime regression. It is closed as an optional out-of-scope major type upgrade: the diff also changes unrelated schemastery, ansi-styles and string-width resolutions. The release retains the Node >=22 contract. Closure is not represented as a failed test. The release's only dependency delta is the required `js-yaml@4.3.2` security patch for GHSA-2883-xcg3-v3hh, proven by a bounded RED/GREEN regression and fresh official audit.

## Acceptance And Monitoring

T016 is accepted by the user's request to complete the listed remaining acceptance/release work. Automation `dsh` is paused at the user's explicit request. Its pending natural-scheduler receipt is not represented as passed; GitHub's own workflow remains enabled.

## Publication

Pending candidate validation, protected merge, trusted publication and public distribution verification. No release success is claimed until receipts are recorded in `test-results.md`.
