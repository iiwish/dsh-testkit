# T017 Release Evidence

Status: Needs_Review
Base: `ce90f70ced1e290f2b0f20f45bb85811c2d7ae05`
Branch: `release/v0.4.3`
Executor: Codex, direct; no delegation authorized.
Approval: User explicitly authorized npm `0.4.3`, GitHub Release/tag and Action `v0` after passing checks on 2026-09-09.

## Dependency Review

PR #35 head `57c381390e8bd75e7c37da6ef3ea639434176f49` has green CI and no established runtime regression. It is closed as an optional out-of-scope major type upgrade: the diff also changes unrelated schemastery, ansi-styles and string-width resolutions. The release retains the Node >=22 contract. Closure is not represented as a failed test. The release's only dependency delta is the required `js-yaml@4.3.2` security patch for GHSA-2883-xcg3-v3hh, proven by a bounded RED/GREEN regression and fresh official audit.

## Acceptance And Monitoring

T016 is accepted by the user's request to complete the listed remaining acceptance/release work. Automation `dsh` is paused at the user's explicit request. Its pending natural-scheduler receipt is not represented as passed; GitHub's own workflow remains enabled.

## Publication

Published `dsh-testkit@0.4.3` at immutable commit `b6d2da02f01e0fed038fe8e75f943a218a4063fa`. PR #43, exact-main CI, trusted publishing, public npm signatures/provenance, GitHub Release and leased `v0` update all pass. Manual public CLI and released Action run `34306204816` passes against DSH `0.1.2-rc.1`; both downloaded artifacts match a fresh evidence-policy replay. Full receipts are in `test-results.md`.

Spec-compliance and code-quality review found no unresolved release blocker. T017 awaits user acceptance, distinct from completed publication. Production audit is clean; two moderate development-only Vitest/mocker findings remain. Dependabot PR #44 proposes Vitest 4 but fails with an unmatched coverage plugin and is not merged. ATTW's internal crash is recorded with clean strict consumer compilation as alternative evidence.
