import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import type { RunReport } from '../../src/domain/report.js'
import { runCli } from '../../src/cli.js'
import type { Runner } from '../../src/runners/types.js'
import type { WorkerRequest } from '../../src/worker/protocol.js'

function passingReport(request: WorkerRequest, verdict: RunReport['verdict'] = 'passed'): RunReport {
  return {
    schemaVersion: 1,
    runId: request.runId,
    startedAt: '2026-08-15T00:00:00.000Z',
    endedAt: '2026-08-15T00:00:01.000Z',
    verdict,
    subject: { input: '.', kind: 'local-directory', packageName: 'fixture', packageVersion: '1.0.0', sourceDigest: 'sha256:fixture', gitCommit: null, mutable: false },
    dsh: { version: '0.1.0-rc.6', integrity: null },
    scenario: {
      name: 'fixture',
      suite: request.scenario.suite,
      schemaVersion: 1,
      profile: 'dsh-testkit',
      digest: `sha256:${'a'.repeat(64)}`,
    },
    testkitVersion: '0.1.1',
    environment: { runner: 'fake', outputDir: request.outputDir },
    observerCoverage: {
      filesystem: { available: true, mode: 'fake', limitations: [] },
      process: { available: true, mode: 'fake', limitations: [] },
      ports: { available: true, mode: 'fake', limitations: [] },
      network: { available: false, mode: 'unsupported', limitations: [] },
      canary: { available: true, mode: 'log-scan', limitations: [] },
    },
    stages: [],
    artifacts: ['report.json', 'junit.xml', 'report.md'],
    reproductionCommand: request.reproductionCommand,
  }
}

describe('CLI integration', () => {
  it('writes all report projections returned by the selected runner', async () => {
    const output = await mkdtemp(join(tmpdir(), 'dsh-cli-'))
    const stdout: string[] = []
    let selectedRunner = ''
    const runner: Runner = { run: async request => passingReport(request) }

    const exitCode = await runCli([
      '.', '--dsh', '0.1.0-rc.6', '--runner', 'local', '--unsafe-local', '--output', output,
    ], {
      stdout: value => stdout.push(value),
      stderr: value => stdout.push(value),
      runnerFactory: (kind) => { selectedRunner = kind; return runner },
      cwd: process.cwd(),
      env: {},
    })

    expect(exitCode).toBe(0)
    expect(selectedRunner).toBe('local')
    expect(stdout.join('')).toContain('PASSED')
    expect(JSON.parse(await readFile(join(output, 'report.json'), 'utf8'))).toMatchObject({ verdict: 'passed' })
    expect(await readFile(join(output, 'junit.xml'), 'utf8')).toContain('<testsuite')
    expect(await readFile(join(output, 'report.md'), 'utf8')).toContain('# DSH Testkit Report')
  })

  it('returns invalid-input exit code before creating a local runner without consent', async () => {
    const stderr: string[] = []
    let factoryCalled = false
    const exitCode = await runCli(['.', '--dsh', '0.1.0-rc.6', '--runner', 'local'], {
      stdout: () => undefined,
      stderr: value => stderr.push(value),
      runnerFactory: () => { factoryCalled = true; throw new Error('must not run') },
      cwd: process.cwd(),
      env: {},
    })

    expect(exitCode).toBe(2)
    expect(factoryCalled).toBe(false)
    expect(stderr.join('')).toContain('--unsafe-local')
  })

  it('rejects a non-empty output directory instead of mixing evidence from different runs', async () => {
    const output = await mkdtemp(join(tmpdir(), 'dsh-cli-stale-'))
    await writeFile(join(output, 'previous-run.txt'), 'stale evidence\n')
    const stderr: string[] = []
    let factoryCalled = false

    const exitCode = await runCli([
      '.', '--dsh', '0.1.0-rc.6', '--runner', 'local', '--unsafe-local', '--output', output,
    ], {
      stdout: () => undefined,
      stderr: value => stderr.push(value),
      runnerFactory: () => { factoryCalled = true; throw new Error('must not run') },
      cwd: process.cwd(),
      env: {},
    })

    expect(exitCode).toBe(2)
    expect(factoryCalled).toBe(false)
    expect(stderr.join('')).toContain('output directory must be empty')
  })

  it('rejects an arbitrary output directory nested in the plugin source', async () => {
    const source = await mkdtemp(join(tmpdir(), 'dsh-cli-source-'))
    const output = join(source, 'evidence')
    await mkdir(output)
    const stderr: string[] = []
    let factoryCalled = false

    const exitCode = await runCli([
      source, '--dsh', '0.1.0-rc.6', '--runner', 'local', '--unsafe-local', '--output', output,
    ], {
      stdout: () => undefined,
      stderr: value => stderr.push(value),
      runnerFactory: () => { factoryCalled = true; throw new Error('must not run') },
      cwd: process.cwd(),
      env: {},
    })

    expect(exitCode).toBe(2)
    expect(factoryCalled).toBe(false)
    expect(stderr.join('')).toContain('must be under .dsh-testkit')
  })

  it('returns infrastructure error when a runner declares missing evidence', async () => {
    const output = await mkdtemp(join(tmpdir(), 'dsh-cli-missing-artifact-'))
    const stderr: string[] = []
    const runner: Runner = {
      run: async request => ({
        ...passingReport(request),
        artifacts: ['evidence/missing.json'],
      }),
    }

    const exitCode = await runCli([
      '.', '--dsh', '0.1.0-rc.6', '--runner', 'local', '--unsafe-local', '--output', output,
    ], {
      stdout: () => undefined,
      stderr: value => stderr.push(value),
      runnerFactory: () => runner,
      cwd: process.cwd(),
      env: {},
    })

    expect(exitCode).toBe(3)
    expect(stderr.join('')).toContain('declared artifact is missing')
  })

  it('prints the package version without constructing a runner', async () => {
    const stdout: string[] = []
    let factoryCalled = false
    const exitCode = await runCli(['--version'], {
      stdout: value => stdout.push(value),
      stderr: value => stdout.push(value),
      runnerFactory: () => { factoryCalled = true; throw new Error('must not run') },
      cwd: process.cwd(),
      env: {},
    })

    expect(exitCode).toBe(0)
    expect(factoryCalled).toBe(false)
    expect(stdout.join('')).toBe('0.1.1\n')
  })

  it('runs the full suite five times and reports inconsistent outcomes as flaky', async () => {
    const output = await mkdtemp(join(tmpdir(), 'dsh-cli-full-'))
    let attempts = 0
    const runner: Runner = {
      run: async request => {
        attempts += 1
        return passingReport(request, attempts === 3 ? 'failed' : 'passed')
      },
    }

    const exitCode = await runCli([
      '.', '--dsh', '0.1.0-rc.6', '--suite', 'full', '--runner', 'local', '--unsafe-local', '--output', output,
    ], {
      stdout: () => undefined,
      stderr: () => undefined,
      runnerFactory: () => runner,
      cwd: process.cwd(),
      env: {},
    })

    const report = JSON.parse(await readFile(join(output, 'report.json'), 'utf8')) as RunReport
    expect(attempts).toBe(5)
    expect(exitCode).toBe(5)
    expect(report.verdict).toBe('flaky')
    expect(report.repeatability).toMatchObject({ requestedRuns: 5, completedRuns: 5, consistent: false })
    expect(report.repeatability?.attempts).toHaveLength(5)
    expect(await readFile(join(output, 'junit.xml'), 'utf8')).toContain('name="repeatability"')
  })
})
