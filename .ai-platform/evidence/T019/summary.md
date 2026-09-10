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

Pending focused GREEN, real-host verification, Linux matrix, evidence inspection and final review. No compatibility conclusion is claimed from the candidate registry edit alone.
