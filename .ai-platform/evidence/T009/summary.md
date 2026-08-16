# T009 Evidence Summary

Status: Needs_Review
Task: Nested Plugin Root And Design-Partner Pilot
Date: 2026-08-16

## Outcome

`dsh-test init` distinguishes the DSH bundle root from its repository root. A nested bundle keeps `dsh-testkit.yaml` beside `package.json`, while GitHub Actions and the project Agent Skill are generated at repository root with repository-relative plugin and config paths.

The root-layout output remains compatible. Automatic nearest-Git-root discovery and explicit `--repo-root` both work offline. One complete preflight covers the plugin scenario and both repository integrations before writing; containment, symlink and conflict tests retain zero-write behavior for rejected inputs.

The English and Simplified Chinese README files contain the reciprocal `dsh-plugin-doctor` link and describe the bounded two-stage gate: Doctor for commit-time preflight, Testkit for release-time real-host lifecycle evidence.

## Exact Pilot Inputs

### dsh-plugin-doctor

- Repository: `https://github.com/zoahdev/dsh-plugin-doctor`
- Tag: `v1.14.0`
- Commit: `73d28e88b5c07baab0a1680972d36d7cc68452c0`
- Layout: DSH bundle at repository root
- Scenario row: `doctor`
- Run: `20260816041700-17d72baa`
- Subject digest: `sha256:c7f4b4039a78212774b4e5792703e0b4b07793835837537d3efc48810b30d1c7`
- Verdict: `passed`
- Retained artifacts: 52

### dsh-subscribe

- Repository: `https://github.com/zoahdev/dsh-subscribe`
- Tag: `v0.3.1`
- Commit: `e2d3ca135dcc63c647a5524dbc58a7fe74a29330`
- Layout: DSH bundle under `plugin/`
- Scenario row: `dsh-subscribe`
- Generated Action inputs: `plugin: ./plugin`, `config: plugin/dsh-testkit.yaml`
- Run: `20260816041825-1bb4305c`
- Subject digest: `sha256:b6d96e043cdb700b347026c0683a79bd91b63fb9fd92581e16d70a6e185d4505`
- Verdict: `passed`
- Retained artifacts: 48

Both Docker quick runs passed resolve, exact DSH installation, packaging, plugin installation, assembly, boot, baseline exercise, uninstall, reboot and cleanup against `@deepseek-ai/dsh@0.1.0-rc.6`. Update and recovery were not requested.

## Evidence Boundary

These are technical baseline lifecycle results from an unreleased T009 working tree based on `dsh-testkit@0.3.1`. They are not market adoption, a security certification or proof of each plugin's domain behavior.

The generated scenarios assert deterministic configuration rows but intentionally contain no inferred service or tool expectations. The baseline exercise passed, but Doctor's `plugin_check` behavior and Subscribe's domain-specific success path require maintainer-confirmed arguments and expected results before Testkit can claim plugin-specific exercise coverage.

The nested Subscribe subject report contains the packed source digest but no in-container Git commit because the tested plugin directory does not contain the repository's parent `.git` metadata. The exact public tag and commit above were independently pinned before execution.

## Maintainer Follow-Up

Do not send a second ping before the existing response has had 24 to 48 hours. The next message should carry completed evidence rather than ask for a status update:

> I completed the baseline pilot against `dsh-plugin-doctor@v1.14.0` (`73d28e8`) and `dsh-subscribe@v0.3.1` (`e2d3ca1`). Both exact sources passed the Docker quick lifecycle through pack, install, boot, uninstall, reboot, and cleanup. The nested `plugin/` layout exposed a real scaffold boundary, and Testkit now keeps the scenario under `plugin/` while generating the workflow and project Skill at repository root. Could you confirm one deterministic plugin-specific success path for `plugin_check` and for Subscribe, and whether you would prefer the integration PR to start with `dsh-subscribe` or your plugin template? I will keep the evidence scoped to compatibility, not ranking or certification.

If there is no concrete confirmation or integration action within seven days, the repositories remain compatibility fixtures and no partner-specific roadmap work is added.

## Residual Risks

- General multi-plugin monorepo workflow merging remains out of scope; one initialization owns one lifecycle workflow and one project Skill.
- An unexpected filesystem failure after preflight can still interrupt sequential writes; the documented guarantee applies to rejected conflicts, containment and pre-existing symlink inputs before writes begin.
- The public npm package remains `0.3.1`; no release, tag movement or npm publication occurred in T009.
