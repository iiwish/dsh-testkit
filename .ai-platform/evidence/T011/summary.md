# T011 Evidence Summary

Status: Needs_Review

Issue #19 is implemented as a deliberately narrow Docker-only browser lane. The scenario accepts one fixed `turn-status-text` smoke on the explicit `web` profile. A disposable Chromium context is limited to the runner-owned loopback origin, blocks service workers and non-origin HTTP requests, and retains only browser identity, selected text, bounded JSON evidence and a screenshot.

The fixture injects a deterministic initial TurnStatus into the real DSH web page and its client plugin changes the exact default text to `Fixture status ready`. Missing Chromium or a launch failure returns `unsupported`; failure to navigate the DSH host is infrastructure; a completed DOM mismatch remains a plugin assertion failure.

Residual risk: the local arm64 Docker host downloaded Chromium dependencies too slowly for the default ten-minute cold-image budget. The attempt ended through the new infrastructure watchdog with no owned container left behind, so the real browser pass is delegated to protected GitHub CI on the review PR.
