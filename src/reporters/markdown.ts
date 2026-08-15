import type { RunReport } from '../domain/report.js'

export function renderMarkdown(report: RunReport): string {
  const lines = [
    '# DSH Testkit Report',
    '',
    `- Run: \`${report.runId}\``,
    `- Verdict: **${report.verdict}**`,
    `- Plugin: \`${report.subject.packageName}@${report.subject.packageVersion}\``,
    `- Plugin digest: \`${report.subject.sourceDigest}\``,
    `- DSH: \`${report.dsh.version}\``,
    `- DSH integrity: \`${report.dsh.integrity ?? 'unavailable'}\``,
    `- Scenario: \`${report.scenario.name}\` (\`${report.scenario.suite}/v${report.scenario.schemaVersion}\`)`,
    ...(report.repeatability === undefined
      ? []
      : [`- Repeatability: **${report.repeatability.consistent ? 'consistent' : 'inconsistent'}** (${report.repeatability.completedRuns}/${report.repeatability.requestedRuns} attempts)`]),
    '',
    '## Lifecycle',
    '',
    '| Stage | Status | Duration | Summary |',
    '|---|---|---:|---|',
    ...report.stages.map(stage => (
      `| ${stage.id} | ${stage.status} | ${stage.durationMs} ms | ${stage.summary.replaceAll('|', '\\|')} |`
    )),
    '',
    '## Assertions',
    '',
    '| Stage | Assertion | Status | Message |',
    '|---|---|---|---|',
    ...report.stages.flatMap(stage => stage.assertions.map(assertion => (
      `| ${stage.id} | ${assertion.id} | ${assertion.status} | ${assertion.message.replaceAll('|', '\\|')} |`
    ))),
    '',
    '## Observer Coverage',
    '',
    '| Observer | Availability | Mode | Limitations |',
    '|---|---|---|---|',
    ...Object.entries(report.observerCoverage).map(([name, coverage]) => (
      `| ${name} | ${coverage.available ? 'available' : 'unavailable'} | ${coverage.mode} | ${coverage.limitations.join('; ') || 'None'} |`
    )),
    ...(report.repeatability === undefined
      ? []
      : [
          '',
          '## Repeatability',
          '',
          '| Attempt | Verdict | Semantic digest | Report |',
          '|---|---|---|---|',
          ...report.repeatability.attempts.map(attempt => (
            `| ${attempt.runId} | ${attempt.verdict} | \`${attempt.semanticDigest}\` | \`${attempt.report}\` |`
          )),
        ]),
    '',
    '## Environment',
    '',
    '| Key | Value |',
    '|---|---|',
    ...Object.entries(report.environment).map(([name, value]) => (
      `| ${name} | ${(JSON.stringify(value) ?? String(value)).replaceAll('|', '\\|')} |`
    )),
    '',
    '## Reproduce',
    '',
    '```bash',
    report.reproductionCommand,
    '```',
    '',
  ]
  return `${lines.join('\n')}\n`
}
