# T014 Canary Compatibility Maintenance

Status: In_Progress
User authorization: Ordered remediation, commits, push and PR creation for Linux CI approved on 2026-09-08.
Base: `825382496444dfe3ebe5157f9a9b7583f11a1dd5` (main, 2026-08-31).

## Scope

- Release Watch runs lifecycle and native-bundle lanes independently and retains diagnostics on failure.
- The adapter boots a subject-free profile before capturing subject filesystem baselines. Host paths retain content-based residue detection.
- Browser smoke exchanges the owned host's launch token through its Connection API, validates the loopback authority, and keeps credentials out of public evidence.
- `zod` is pinned to `4.5.4`; the development Cordis is pinned to `4.0.2`. `@types/node` remains `24.13.3`; a Node 26 type major is not adopted while the runtime floor remains Node 22.
- Formal support and the default host remain unchanged. Compatibility documentation distinguishes supported, canary and npm-unavailable releases.

## Source Attribution

Upstream inspected at `deepseek-ai/deepseek-harness@a66e4702047846cdaa10c66c9d3df3951f5ea70d` (`dsh-v0.1.2-rc.1`). `packages/boot/app-boot` owns profile module fallback directories; `packages/client/connection` owns browser-session credentials and `authenticatedUrl(baseUrl)` / root-token exchange. No authentication fence is bypassed.

## Review Boundaries

Unchanged: v1 schemas, stable exit semantics, Docker isolation, controller packaging boundary and supported-host registry. Negative fixtures still detect plugin writes to host-looking paths, including credential-file content. No release or PR merge is authorized by this record. User acceptance is pending.

## Remaining Verification

The real `0.1.2-rc.1` healthy lifecycle and negative host-filename residue cases pass locally. The positive report has no unexplained residue; the negative report detects both `.anonymous-user-id` and `.credentials.yaml`. A focused filesystem test also proves that modifications to an existing baseline credential file are not exempted.

Docker browser execution is unverified: the cold image build exhausted the 600-second attempt watchdog while downloading Debian packages, before the host or browser started. Packaged-consumer installation, imports, CLI and scaffold checks reached the Docker build; that build was deliberately canceled to avoid repeating the same unresolved download bottleneck. Neither command counts as a full pass.

Full supported-host, candidate, native-bundle and packaged Docker matrices remain required. The authorized delivery path is a pushed repair branch and PR with Linux CI evidence. Formal support is unchanged and user acceptance is pending.
