# T005 Evidence Summary

Status: Published_Needs_User_Acceptance
Task: v0.1.2 contract, CI and release hardening
Date: 2026-08-15

## Scope Delivered

- Added lifecycle-stage case selection with prefix execution, cleanup, report identity and reproduction commands.
- Added an explicit supported-DSH registry and unsupported exit-code boundary.
- Added v0.1.1 runtime and JSON Schema compatibility fixtures.
- Made composite Action evidence identities matrix-safe, preserved complex arguments and exposed artifact metadata.
- Added scoped/cancellable CI, a two-plugin hosted Action matrix and npm OIDC release workflow.
- Generated the packed runner lock from the canonical root lock, embedded source content and cleaned pack-test resources.

## Review Result

- Spec compliance: Pass.
- Bug and code-quality review: Pass.
- QA acceptance: Pass in pull-request CI, main CI and the release workflow.
- Release acceptance: Pass. `v0.1.2` and `v0` resolve to release commit `01d0a344f06d170238106a3a867f44f13caf7d1e`; npm `dsh-testkit@0.1.2` is public with SLSA provenance.
- Governed user acceptance: Pending explicit acceptance of the published result.

## Public Identities

- Pull request: <https://github.com/iiwish/dsh-testkit/pull/6>
- Main CI: <https://github.com/iiwish/dsh-testkit/actions/runs/31879201445>
- Release workflow: <https://github.com/iiwish/dsh-testkit/actions/runs/31879424206>
- CodeQL: <https://github.com/iiwish/dsh-testkit/actions/runs/31879314348>
- GitHub Release: <https://github.com/iiwish/dsh-testkit/releases/tag/v0.1.2>
- npm: <https://www.npmjs.com/package/dsh-testkit/v/0.1.2>
- Provenance: <https://registry.npmjs.org/-/npm/v1/attestations/dsh-testkit@0.1.2>

## Residual Risk

- Real subprocess-heavy adapter behavior is covered by seven real-host cases but remains lightly represented in V8 unit coverage.
- Public field success criteria are not yet met.
