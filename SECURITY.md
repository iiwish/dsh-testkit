# Security Policy

## Supported Versions

Security fixes are provided for the latest published minor release.

| Version | Supported |
|---|---|
| 0.1.x | Yes |

## Reporting A Vulnerability

Do not open a public issue for a suspected vulnerability. Use the repository's private
[security advisory form](https://github.com/iiwish/dsh-testkit/security/advisories/new).

Include the affected Testkit and DSH versions, runner, subject source kind, impact, and a minimal reproduction when safe. Do not include credentials, proprietary plugin source, or unsanitized lifecycle logs.

Maintainers will acknowledge a report within seven days, keep the reporter informed while it is assessed, and coordinate disclosure after a fix is available. If the report is outside this project's boundary, the response will identify the responsible component when possible.

## Security Boundary

Docker is the default isolation boundary, not a guarantee against malicious kernel-level behavior. `--runner local --unsafe-local` executes plugin install and runtime code directly on the host and is intended only for trusted sources.
