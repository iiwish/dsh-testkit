# T010 Evidence Summary

Status: Accepted

Issue #18 adds a narrow Docker-only loopback HTTP route assertion contract. The implementation keeps the v1 scenario/report schemas compatible, attaches route assertions to the existing registration stage, and never persists complete response bodies or headers.

RED evidence is captured before implementation in `test-results.md`. Focused GREEN tests and the full local validation loop are complete. GitHub Actions run [32942044225](https://github.com/iiwish/dsh-testkit/actions/runs/32942044225) passed the real Docker fixture against DSH `0.1.0-rc.6`, `0.1.0-rc.7` and `0.1.0-rc.8`, including the route assertions and lifecycle cleanup. Web-profile workspace storage is classified as host runtime state only for these route scenarios; plugin files and profile metadata remain strict residue checks.
