import { create } from 'xmlbuilder2'

import type { RunReport, StageResult } from '../domain/report.js'

function stageDetails(stage: StageResult): string {
  const assertions = stage.assertions.map(assertion => (
    `${assertion.status.toUpperCase()} ${assertion.id}: ${assertion.message}`
  ))
  return [stage.summary, ...assertions].join('\n')
}
export function renderJunit(report: RunReport): string {
  const repeatabilityFailure = report.repeatability?.consistent === false ? 1 : 0
  const failures = report.stages.filter(stage => stage.status === 'failed').length + repeatabilityFailure
  const skipped = report.stages.filter(stage => stage.status === 'skipped' || stage.status === 'unsupported').length
  const duration = report.stages.reduce((total, stage) => total + stage.durationMs, 0) / 1000
  const root = create({ version: '1.0', encoding: 'UTF-8' })
  const suite = root.ele('testsuite', {
    name: 'dsh-testkit',
    tests: String(report.stages.length + (report.repeatability === undefined ? 0 : 1)),
    failures: String(failures),
    skipped: String(skipped),
    time: duration.toFixed(3),
  })

  for (const stage of report.stages) {
    const testcase = suite.ele('testcase', {
      classname: 'dsh.lifecycle',
      name: stage.id,
      time: (stage.durationMs / 1000).toFixed(3),
    })
    if (stage.status === 'failed') {
      testcase.ele('failure', {
        type: stage.failureKind ?? 'assertion',
        message: stage.summary,
      }).txt(stageDetails(stage))
    } else if (stage.status === 'skipped' || stage.status === 'unsupported') {
      testcase.ele('skipped', { message: stage.summary })
    }
  }

  if (report.repeatability !== undefined) {
    const testcase = suite.ele('testcase', {
      classname: 'dsh.repeatability',
      name: 'repeatability',
      time: '0.000',
    })
    if (!report.repeatability.consistent) {
      testcase.ele('failure', {
        type: 'flaky',
        message: 'Repeated lifecycle attempts produced different semantic outcomes',
      }).txt(report.repeatability.attempts
        .map(attempt => `${attempt.runId}: ${attempt.verdict} ${attempt.semanticDigest}`)
        .join('\n'))
    }
  }

  return `${root.end({ prettyPrint: true })}\n`
}
