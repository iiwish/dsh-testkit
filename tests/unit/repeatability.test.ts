import { describe, expect, it } from 'vitest'

import { aggregateRunReports, semanticReportDigest } from '../../src/domain/repeatability.js'
import type { RunReport } from '../../src/domain/report.js'

function report(runId: string, verdict: RunReport['verdict'] = 'passed'): RunReport {
  return {
    schemaVersion: 1,
    runId,
    startedAt: '2026-08-15T00:00:00.000Z',
    endedAt: '2026-08-15T00:00:01.000Z',
    verdict,
    subject: {
      input: '.',
      kind: 'local-directory',
      packageName: 'fixture',
      packageVersion: '1.0.0',
      sourceDigest: `sha256:${'b'.repeat(64)}`,
      gitCommit: null,
      mutable: false,
    },
    dsh: { version: '0.1.0-rc.6', integrity: `sha256:${'c'.repeat(64)}` },
    scenario: {
      name: 'repeatable',
      suite: 'full',
      schemaVersion: 1,
      profile: 'dsh-testkit',
      digest: `sha256:${'a'.repeat(64)}`,
    },
    testkitVersion: '0.1.1',
    environment: { runner: 'docker', outputDir: `/tmp/${runId}`, imageId: 'sha256:image' },
    observerCoverage: {
      filesystem: { available: true, mode: 'snapshot', limitations: [] },
      process: { available: true, mode: 'ps', limitations: [] },
      ports: { available: true, mode: 'ss', limitations: [] },
      network: { available: false, mode: 'unavailable', limitations: [] },
      canary: { available: true, mode: 'log', limitations: [] },
    },
    stages: [{
      id: 'cleanup',
      status: 'passed',
      startedAt: '2026-08-15T00:00:00.000Z',
      endedAt: '2026-08-15T00:00:01.000Z',
      durationMs: runId.length,
      summary: 'clean',
      assertions: [],
      artifacts: ['evidence/cleanup.json'],
    }],
    artifacts: ['evidence/cleanup.json'],
    reproductionCommand: 'dsh-test fixture --suite full',
  }
}

describe('repeatability aggregation', () => {
  it('ignores run-local identity, paths and timing in the semantic digest', () => {
    const first = report('attempt-01')
    const second = report('longer-attempt-02')
    first.environment.capabilities = { process: true, ports: true }
    second.environment.capabilities = { ports: true, process: true }
    expect(semanticReportDigest(first)).toBe(semanticReportDigest(second))
  })

  it('retains every attempt and reports inconsistent outcomes as flaky', () => {
    const reports = [report('attempt-01'), report('attempt-02', 'failed')]
    const aggregate = aggregateRunReports({
      runId: 'full-run',
      reports,
      requestedRuns: 2,
      reproductionCommand: 'dsh-test fixture --repeat 2',
    })

    expect(aggregate.verdict).toBe('flaky')
    expect(aggregate.repeatability).toMatchObject({ consistent: false, completedRuns: 2 })
    expect(aggregate.stages[0]?.artifacts).toEqual(['attempts/01/evidence/cleanup.json'])
    expect(aggregate.artifacts).toContain('attempts/02/report.json')
  })
})
