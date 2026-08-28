# T011 Evidence Summary

Status: Accepted

Issue #19 is implemented as a deliberately narrow Docker-only browser lane. The scenario accepts one fixed `turn-status-text` smoke on the explicit `web` profile. A disposable Chromium context is limited to the runner-owned loopback origin, blocks service workers and non-origin HTTP requests, and retains only browser identity, selected text, bounded JSON evidence and a screenshot.

The fixture injects a deterministic initial TurnStatus into the real DSH web page and its client plugin changes the exact default text to `Fixture status ready`. Missing Chromium or a launch failure remains an `unsupported` assertion through the real adapter and final verdict; failure to navigate a live DSH loopback host is infrastructure; a completed DOM mismatch remains a plugin assertion failure.

Maintainer re-review exercises the production `DshNpmAdapter` rather than only the fake integration adapter. The regression contract proves that an unavailable browser runner resolves with unsupported coverage instead of being promoted to a registration failure.

Protected GitHub CI run [33136222633](https://github.com/iiwish/dsh-testkit/actions/runs/33136222633) passed the real browser assertion on DSH `0.1.1-rc.2` and the compatibility matrix on `0.1.0-rc.6`, `0.1.0-rc.7`, and `0.1.0-rc.8`. The remaining environmental risk is limited to unusually slow cold-image downloads: the local arm64 attempt reached the watchdog and left no owned container behind.
