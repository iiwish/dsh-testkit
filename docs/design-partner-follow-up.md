# Design-Partner Follow-Up Gate

This register keeps design-partner lifecycle conclusions tied to immutable package identities. A source commit, mutable branch, local patch, or repeated run of the existing package does not satisfy the rerun gate.

## Current State

| Partner | Immutable baseline | State | Next eligible input |
|---|---|---|---|
| `dsh-shelf` | `dsh-shelf@0.7.0`, source identity `3787414102b160950a0859b77e9c0d59e7da0e6e` | `Waiting_For_Immutable_Package` | A published package version higher than `0.7.0`, resolved to an exact tarball and integrity digest |
| `dsh-spotlight` | `@0xsline/dsh-spotlight@0.0.2`, tag identity `dd7ef5ed160aa1a624559de16eafd4ea9406d7ed` | `Waiting_For_Immutable_Package` | A published npm version higher than `0.0.2`, resolved to an exact tarball and integrity digest |

The `dsh-shelf` fix commit `b5a34e83cb83607b44b4a04b4657da2d9692e18e` is useful maintainer evidence but is not a package rerun input. The public npm registry currently exposes no `dsh-shelf` package identity. The current `@0xsline/dsh-spotlight` npm latest remains `0.0.2`.

## Rerun Contract

1. Resolve the package from the public npm registry by exact version and retain its integrity and tarball URL.
2. Confirm the version is higher than the baseline in this register and that the package name matches the partner identity.
3. Run the declared real-host scenario in Docker against an exact supported DSH version.
4. Retain the Testkit version, scenario digest, runner image, package integrity, DSH identity and complete local report.
5. Publish a named conclusion only after the maintainer can review the exact reproduction evidence.

Until both steps 1 and 2 pass, the correct action is no lifecycle rerun and no compatibility conclusion.
