# Unreleased Delivery Preparation

Published baseline: `dsh-testkit@0.4.2` and Action `v0`.
Publication status: Not authorized. Package version and tags remain unchanged.

## Scope

The source delivery includes exact DSH `0.1.2-rc.1` support, shared fail-closed evidence staging, complete Release Watch summaries, an isolated external-template adoption check, and independent visible-host browser acceptance. The default host remains `0.1.1-rc.2`; v1 schemas and exit codes are unchanged. Alpha hosts remain canary-only.

The independent browser harness is repository test infrastructure, not a new public scenario mode. Its named contract is native onboarding and an unsent editor draft, not arbitrary plugin UI coverage or model execution.

## Publication Gate

1. Review T015/T016 evidence and obtain explicit release approval, including the chosen version. A proposed patch release is `0.4.3`; it is not allocated or published by this preparation.
2. Update version-controlled package/version references in a separate release PR. Keep README support claims aligned with the version actually available to consumers.
3. Require clean install, full supported-host and positive/negative Action matrix, installed tarball execution, native bundle acceptance, and all evidence safety checks at that exact release commit.
4. Use the existing protected trusted-publishing workflow. Verify npm tarball identity, provenance and package contents, immutable release tag, GitHub Release, and `v0` Action target after publication.
5. Re-run the published consumer and Action entry points. Source-commit tests and an unpublished tarball are preparation evidence, not proof of registry distribution.

Release operations must not bypass failed checks or combine unrelated dependency upgrades. PR #35 is outside this delivery. External repository integration and maintainer adoption require their own authorization and evidence.

## References

- [Unreleased changes](../CHANGELOG.md)
- [T016 plan](../.ai-platform/specs/lifecycle-runner/t016-plan.md)
- [Monitoring operations](monitoring-operations.md)
