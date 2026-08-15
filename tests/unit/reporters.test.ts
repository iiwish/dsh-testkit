import { create } from 'xmlbuilder2'
import { describe, expect, it } from 'vitest'

import type { RunReport } from '../../src/domain/report.js'
import { renderJson } from '../../src/reporters/json.js'
import { renderJunit } from '../../src/reporters/junit.js'
import { renderMarkdown } from '../../src/reporters/markdown.js'
import { renderTerminal } from '../../src/reporters/terminal.js'

const report: RunReport = {
  schemaVersion: 1,
  runId: 'run-001',
  startedAt: '2026-08-15T00:00:00.000Z',
  endedAt: '2026-08-15T00:00:01.000Z',
  verdict: 'failed',
  subject: {
    input: '.',
    kind: 'local-directory',
    packageName: 'dsh-example',
    packageVersion: '1.0.0',
    sourceDigest: 'sha256:abc',
    gitCommit: null,
    mutable: false,
  },
  dsh: { version: '0.1.0-rc.6', integrity: null },
  scenario: {
    name: 'fixture',
    suite: 'quick',
    schemaVersion: 1,
    profile: 'dsh-testkit',
    digest: `sha256:${'a'.repeat(64)}`,
  },
  testkitVersion: '0.1.0',
  environment: { runner: 'docker', node: '22.18.0' },
  observerCoverage: {
    filesystem: { available: true, mode: 'owned-root-snapshot', limitations: [] },
    process: { available: true, mode: 'checkpoint', limitations: ['short-lived processes may be missed'] },
    ports: { available: true, mode: 'checkpoint', limitations: [] },
    network: { available: false, mode: 'unsupported', limitations: ['no proxy observer'] },
    canary: { available: true, mode: 'log-scan', limitations: ['egress not observed'] },
  },
  stages: [{
    id: 'boot',
    status: 'failed',
    startedAt: '2026-08-15T00:00:00.000Z',
    endedAt: '2026-08-15T00:00:01.000Z',
    durationMs: 1000,
    summary: 'plugin exploded',
    failureKind: 'subject',
    exitCode: 1,
    signal: null,
    assertions: [{
      id: 'boot.success',
      status: 'failed',
      message: 'Expected boot success',
      expected: 'success',
      actual: 'failure',
      evidence: ['logs/boot.stderr.log'],
    }],
    artifacts: ['logs/boot.stderr.log'],
  }],
  artifacts: ['report.json', 'junit.xml', 'report.md'],
  reproductionCommand: 'dsh-test . --dsh 0.1.0-rc.6',
}

describe('report projections', () => {
  it('renders stable canonical JSON with a trailing newline', () => {
    const output = renderJson(report)
    expect(output.endsWith('\n')).toBe(true)
    expect(JSON.parse(output)).toMatchObject({ runId: 'run-001', verdict: 'failed' })
  })

  it('renders well-formed JUnit with one testcase per stage', () => {
    const output = renderJunit(report)
    expect(() => create(output)).not.toThrow()
    expect(output).toContain('tests="1"')
    expect(output).toContain('<failure')
    expect(output).toContain('name="boot"')
  })

  it('renders a markdown support report with coverage and reproduction', () => {
    const output = renderMarkdown(report)
    expect(output).toContain('# DSH Testkit Report')
    expect(output).toContain('| boot | failed |')
    expect(output).toContain('network | unavailable')
    expect(output).toContain('dsh-test . --dsh 0.1.0-rc.6')
  })

  it('renders a concise no-color terminal summary', () => {
    const output = renderTerminal(report, { color: false })
    expect(output).toContain('FAILED')
    expect(output).toContain('boot')
    expect(output).toContain('plugin exploded')
    expect(output).toContain('FAILED boot.success: Expected boot success')
    expect(output).toContain('run-001')
    expect(output.indexOf('Reproduce:')).toBeLessThan(output.indexOf('Artifacts:'))
  })
})
