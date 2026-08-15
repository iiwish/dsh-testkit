# Community Validation

This page records environment-bound compatibility evidence for DSH Testkit v0.2.1. It is not a plugin ranking, security assessment, or claim that a failing subject is defective.

## v0.2.1 Cohort

- Completed: 2026-08-15
- Testkit: `0.2.1`
- DSH: `0.1.0-rc.6`
- Runner: Docker, Linux arm64, Node.js 22.23.2, pnpm 11.1.3
- Runner image: `dsh-testkit-runner:0.2.1-b88cac3d08b2`
- Subject count: 10 exact npm versions

Selection required a public npm release and a declared DSH bundle patch. The cohort covered tool, UI, MCP, usage, memory, update, and workflow-oriented bundles available on the collection date. Versions were fixed before execution; no dist-tag or mutable source entered the run.

| Verdict | Count |
|---|---:|
| Passed | 2 |
| Failed | 8 |

| First failure stage | Count |
|---|---:|
| Boot | 5 |
| Uninstall | 3 |

All subjects ran sequentially through the Docker quick suite. The controller supplied an isolated `HOME` and `DSH_HOME`, public npm registry configuration, telemetry disablement, and a strict environment allowlist. Model, npm, GitHub, cloud, remote Docker, certificate, and Docker registry credentials were not inherited.

## Interpretation

Five first failures occurred because the isolated minimal profile did not provide a service required by the subject at activation time. This is evidence for a declarative prerequisite profile or support-bundle fixture, not enough evidence for arbitrary multi-plugin update and uninstall orchestration.

The remaining first failures occurred during uninstall. Their local evidence separates package-policy rejection, command timeout, and owned-root residue rather than flattening them into a compatibility score. Named findings remain private until independently reproduced and accompanied by maintainer-ready evidence.

The cohort therefore supports three current product decisions:

1. Keep the deterministic, single-subject lifecycle as the stable contract.
2. Explore declarative prerequisite profiles before a general multi-plugin lifecycle model.
3. Keep static dependency guidance and cross-bundle composition analysis in doctor/preflight and composition-check tools.

Observer limitations remain material: filesystem, process, port, and output-canary coverage were available; network tracing was not. Absence of observed egress is not proof that no egress occurred.
