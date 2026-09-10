# T019: DSH 0.1.5 RC Compatibility

Status: Needs_Review
Approval: User requested completing the proposed exact-host validation and conditional support promotion on 2026-09-10.
Mode: Direct Execute; no delegation authorized.

## Identity And Scope

- Baseline: `79db3f550f7eefcd7d58b66bda0ff998fa0d637f` (`main`, Testkit `0.4.3`).
- Upstream immutable release: `dsh-v0.1.5-rc.1`, commit `183f08e9c6dde7e36cd2318eaee70b0da08fb35e`.
- Public npm artifact: `https://registry.npmjs.org/@deepseek-ai/dsh/-/dsh-0.1.5-rc.1.tgz`.
- Integrity: `sha512-rmNmzQCg3oIc1z8xH7izRSOuy1TNzq+/NILyfM+7e8DKOyV+yBtg47WEsqR2SiIe1ATec3L/rUa1YhIcfQ2XEg==`.
- The maintenance branch enables the exact candidate for acceptance. Publication and main merge are outside scope; the published `0.4.3` support matrix is unchanged.

## RED

`pnpm exec vitest run tests/unit/dsh-support.test.ts tests/contracts/ci-required-checks.test.ts` fails two assertions with 15 passing tests before implementation: the support registry omits `0.1.5-rc.1`, and the Action compatibility matrix omits its positive and negative subjects. Unknown and alpha host rejection remains covered.

## Validation

- Scheduled baseline [Release Watch 34453353489](https://github.com/iiwish/dsh-testkit/actions/runs/34453353489) passes both exact `0.1.5-rc.1` lanes. Downloaded lifecycle/bundle artifacts match all 632 manifest entries. Their 12 reports include nine passes and three intentional negative controls; HTTP and browser reports pass in Docker, and the native tool's nested Docker report passes. This is canary evidence, not the full promotion gate.
- Intermediate local validation and [CI 34454034261](https://github.com/iiwish/dsh-testkit/actions/runs/34454034261) expose a release-discovery test coupled to the live support registry: its historical 0.1.2 promotion input correctly yields no 0.1.3 candidates after 0.1.5 support. The historical case uses its explicit historical support set, and a separate current-promotion case checks that only newer candidates remain. No discovery runtime behavior changes.
- Focused GREEN: support, CI and release-discovery contracts pass all 25 tests after that correction.
- Local `pnpm validate` passes 269 tests with unchanged coverage (statements 75.45%, branches 60.40%, functions 79.90%, lines 77.95%), typecheck and build before the documentation update. Actionlint 1.7.7 passes the six-host CI workflow. Independent safety-policy replay reproduces both downloaded canary manifests exactly.
- Documentation validation at `748b4e3` identifies an obsolete README assertion requiring the historical `0.1.2-alpha.1` candidate. The README contract checks the relevant `0.1.5-rc.1` host and explicit source-versus-published support boundary in both languages; unavailable historical hosts remain documented in Host Compatibility.
- Final implementation head `7c125b0fbbadb3c707dd99e778f8ad5211e81bbf` passes all 21 jobs in [Linux CI 34454912771](https://github.com/iiwish/dsh-testkit/actions/runs/34454912771), including all six hosts, installed-package consumers, twelve positive/negative Action cases and the independent adoption gate. Both CodeQL language checks and the aggregate CodeQL check pass.
- All 20 downloaded artifacts reproduce their safety manifests under an independent policy replay: 5,190 files and 96 reports. Every formal host has 13 reports (10 passes, three intentional negative controls); all six installed-package reports pass. Adoption has four passes and one intentional negative control, and all 13 Action reports pass, including the adoption Action.
- A final local default-worker coverage run encountered two 10-second child-process timeouts in unchanged evidence-safety tests under workstation load. The complete unchanged suite passes all 269 tests with `--maxWorkers=2`, at the same coverage percentages; `pnpm build` and documentation contracts pass. Linux CI passes the unmodified default-worker `pnpm validate`. No timeout, assertion, coverage threshold or exclusion was relaxed.
- Live release discovery against the source registry returns no remaining canary or pending npm candidates: `0.1.5-rc.1` is the highest discovered host. Historical unavailable alphas are correctly outside this registry's watch range.

## Review And Boundaries

The runtime diff is one exact support-registry entry; no adapter, probe, observer, schema, exit-code, default-host or dependency behavior changes. The six-host matrix preserves every older host and both Action outcomes. The source/published boundary is explicit in both READMEs and the scenario reference. No unresolved implementation or scope blocker is identified.

The browser gate proves the existing deterministic DOM/fixture smoke on an authenticated real host, not arbitrary plugin UI correctness or model behavior. Publication, main merge and user acceptance remain separate. The closeout contains only support documentation and these receipts; current-head checks remain authoritative on [PR #49](https://github.com/iiwish/dsh-testkit/pull/49).
