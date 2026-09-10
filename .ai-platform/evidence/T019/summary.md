# T019: DSH 0.1.5 RC Compatibility

Status: Running
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
- Full Linux matrix, final local validation and review remain pending. No compatibility conclusion is claimed from the candidate registry edit alone.
