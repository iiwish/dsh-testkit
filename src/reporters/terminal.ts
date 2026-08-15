import type { RunReport, Verdict } from '../domain/report.js'

export interface TerminalRenderOptions {
  color?: boolean
}

const COLORS: Record<Verdict, string> = {
  passed: '\u001B[32m',
  failed: '\u001B[31m',
  flaky: '\u001B[33m',
  unsupported: '\u001B[33m',
  invalid: '\u001B[31m',
  infrastructure_error: '\u001B[31m',
}

export function renderTerminal(report: RunReport, options: TerminalRenderOptions = {}): string {
  const label = report.verdict.toUpperCase()
  const verdict = options.color === true
    ? `${COLORS[report.verdict]}${label}\u001B[0m`
    : label
  const stageLines = report.stages.flatMap(stage => [
    `  ${stage.status === 'passed' ? 'PASS' : stage.status.toUpperCase().padEnd(4)}  ${stage.id.padEnd(14)} ${stage.summary}`,
    ...stage.assertions.filter(assertion => assertion.status !== 'passed').map(assertion => (
      `        ${assertion.status.toUpperCase()} ${assertion.id}: ${assertion.message}`
    )),
  ])
  const artifactGroups = [...new Set(report.artifacts.map(path => {
    const separator = path.indexOf('/')
    return separator === -1 ? path : `${path.slice(0, separator)}/`
  }))].sort()
  const repeatability = report.repeatability === undefined
    ? []
    : [`Repeatability: ${report.repeatability.consistent ? 'CONSISTENT' : 'INCONSISTENT'} (${report.repeatability.completedRuns}/${report.repeatability.requestedRuns} attempts)`]
  return [
    `DSH Testkit ${verdict}  ${report.runId}`,
    `Plugin ${report.subject.packageName}@${report.subject.packageVersion}  DSH ${report.dsh.version}  Suite ${report.scenario.suite}/v${report.scenario.schemaVersion}`,
    ...stageLines,
    ...repeatability,
    `Reproduce: ${report.reproductionCommand}`,
    `Artifacts: ${report.artifacts.length} retained (${artifactGroups.join(', ')})`,
    '',
  ].join('\n')
}
