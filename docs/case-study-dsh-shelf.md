# Case Study: dsh-shelf

This case study records a public, exact-artifact compatibility finding. It is
community evidence for the value of a real-host lifecycle gate, not a ranking,
security assessment, certification, or endorsement.

## Finding

`dsh-shelf@0.7.0` installed and assembled successfully, but the real DSH host
run stopped before registration. The published bundle accessed `ctx.baseDir`.
In the DSH host, an unknown context property is treated as an injection
lookup, so the run failed with:

```text
cannot get property "baseDir" without inject
```

The result came from an immutable published artifact, not a checkout. The
failure was recorded with the exact DSH host, runner, package artifact, stage,
and machine-readable evidence. It is an environment-bound compatibility
finding, not a claim that the plugin is universally defective.

Source report and maintainer discussion: [zoahdev/dsh-shelf#1](https://github.com/zoahdev/dsh-shelf/issues/1).
The original ecosystem report is also recorded in [DeepSeek Harness discussion #2088](https://github.com/deepseek-ai/deepseek-harness/discussions/2088).

## Maintainer response

The maintainer confirmed the supported path contract:

```ts
config.profileDir ?? ctx.dshHomePath?.() ?? join(homedir(), '.dsh')
```

The source fix is on commit [`b5a34e8`](https://github.com/zoahdev/dsh-shelf/commit/b5a34e83cb83607b44b4a04b4657da2d9692e18e), with a regression test that never probes the uninjected `baseDir` service. The local shelf suite passed 16/16. The issue remains open until the fix is published as a new immutable package artifact and that exact artifact is rerun.

## Why this matters

This is the useful lifecycle boundary in one sequence:

1. package installation and bundle assembly pass;
2. the real host catches a registration-time incompatibility;
3. the maintainer receives an actionable, reproducible report;
4. the fix is made against the host contract;
5. the release gate is rerun against the published fix, rather than trusting source-only tests.

The next rerun will use `dsh-testkit@0.3.3`, an explicit DSH version, and the
new immutable package artifact once it is available. Publication of the final
pass result requires the maintainer's release and the exact rerun evidence.

## Scope boundary

The case is intentionally narrow. It does not certify `dsh-shelf`, DSH, or any
other plugin; it does not prove security properties; and it does not replace
the maintainer's own test suite. It shows that testing a released bundle in a
disposable real host can find a defect that install-time and source-local tests
miss.
