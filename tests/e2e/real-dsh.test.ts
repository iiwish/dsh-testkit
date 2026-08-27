import { execFile } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

import { DEFAULT_DSH_NPM_VERSION } from '../../src/adapters/dsh/support.js'
import { RunReportSchema } from '../../src/domain/report.js'

const executeFile = promisify(execFile)
const root = resolve(import.meta.dirname, '../..')
const cli = join(root, 'dist', 'src', 'cli.js')
const dshVersion = process.env.DSH_TESTKIT_DSH_VERSION ?? DEFAULT_DSH_NPM_VERSION

interface FixtureRun {
  code: number
  report: ReturnType<typeof RunReportSchema.parse>
  outputDir: string
}

async function runFixture(
  name: string,
  args: string[] = [],
  runner: 'local' | 'docker' = 'local',
): Promise<FixtureRun> {
  const cwd = join(root, 'fixtures', name)
  const output = await mkdtemp(join(tmpdir(), `dsh-testkit-e2e-${name}-`))
  let code = 0
  let failure: unknown
  try {
    await executeFile(process.execPath, [
      cli,
      '.',
      '--dsh', dshVersion,
      '--runner', runner,
      ...(runner === 'local' ? ['--unsafe-local'] : []),
      '--output', output,
      ...args,
    ], { cwd, timeout: 900_000, maxBuffer: 16 * 1024 * 1024 })
  } catch (error) {
    failure = error
    code = (error as { code?: number }).code ?? 1
  }
  let reportBytes: string
  try {
    reportBytes = await readFile(join(output, 'report.json'), 'utf8')
  } catch (error) {
    const details = failure as { stderr?: string, stdout?: string }
    throw new Error(`Lifecycle command produced no report: ${details.stderr ?? details.stdout ?? (error instanceof Error ? error.message : String(error))}`)
  }
  const report = RunReportSchema.parse(JSON.parse(reportBytes))
  return { code, report, outputDir: output }
}

describe.sequential('real DSH lifecycle fixtures', () => {
  it('passes a healthy packed plugin through real DSH and deterministic tool execution', async () => {
    const result = await runFixture('healthy-plugin', [
      '--expect-row', 'fixture-healthy',
      '--expect-service', 'fixtureHealthy',
      '--expect-tool', 'fixture_echo',
      '--update-from', '../healthy-plugin-v0',
    ])
    expect(result.code).toBe(0)
    expect(result.report.verdict).toBe('passed')
    expect(result.report.stages.find(stage => stage.id === 'exercise')?.status).toBe('passed')
    const update = result.report.stages.find(stage => stage.id === 'update')
    expect(update?.status).toBe('passed')
    expect(update?.assertions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'update.version', status: 'passed', actual: '1.0.0' }),
      expect.objectContaining({ id: 'update.config.row.fixture-healthy', status: 'passed' }),
    ]))
    expect(update?.artifacts).toContain('evidence/effective-config-update.yml')
    expect(result.report.artifacts.some(path => path.includes('probe-boot'))).toBe(true)
  }, 900_000)

  it('treats the declared boot failure as a passing negative case and recovers the profile', async () => {
    const result = await runFixture('boot-failure-plugin')
    expect(result.code).toBe(0)
    expect(result.report.verdict).toBe('passed')
    expect(result.report.stages.find(stage => stage.id === 'boot')?.status).toBe('passed')
    expect(result.report.stages.find(stage => stage.id === 'recover')?.status).toBe('passed')
  }, 900_000)

  it('reruns one real-host boot case and skips later lifecycle cases', async () => {
    const result = await runFixture('healthy-plugin', [
      '--expect-row', 'fixture-healthy',
      '--case', 'boot',
    ])
    expect(result.code).toBe(0)
    expect(result.report.scenario.case).toBe('boot')
    expect(result.report.stages.find(stage => stage.id === 'boot')?.status).toBe('passed')
    expect(result.report.stages.find(stage => stage.id === 'register')).toMatchObject({
      status: 'skipped',
      summary: 'not selected by --case boot',
    })
    expect(result.report.stages.at(-1)?.id).toBe('cleanup')
  }, 900_000)

  it('retains an expected boot-failure probe as declared Docker evidence', async () => {
    const result = await runFixture('boot-failure-plugin', [], 'docker')
    expect(result.code).toBe(0)
    expect(result.report.verdict).toBe('passed')
    expect(result.report.artifacts).toContain('evidence/probe-boot.json')
    expect(result.report.stages.find(stage => stage.id === 'boot')?.artifacts)
      .toContain('evidence/probe-boot.json')
  }, 900_000)

  it('fails at registration when an expected tool is missing', async () => {
    const result = await runFixture('registration-failure-plugin', [
      '--expect-row', 'fixture-registration-failure',
      '--expect-tool', 'fixture_missing',
    ])
    expect(result.code).toBe(1)
    expect(result.report.stages.find(stage => stage.id === 'register')?.status).toBe('failed')
  }, 900_000)

  it('fails uninstall when the plugin leaves an unexplained file', async () => {
    const result = await runFixture('dirty-uninstall-plugin', [
      '--expect-row', 'fixture-dirty-uninstall',
    ])
    expect(result.code).toBe(1)
    const uninstall = result.report.stages.find(stage => stage.id === 'uninstall')
    expect(uninstall?.status).toBe('failed')
    expect(uninstall?.assertions.find(assertion => assertion.id === 'uninstall.filesystem.residue')?.actual).toEqual(
      expect.arrayContaining([
        'added:dsh-home/fixture-dirty-uninstall.marker',
        'added:workspace/fixture-dirty-workspace.marker',
      ]),
    )
  }, 900_000)

  it('attributes residue even when it uses a DSH runtime filename', async () => {
    const result = await runFixture('known-path-residue-plugin', [
      '--expect-row', 'fixture-known-path-residue',
    ])
    expect(result.code).toBe(1)
    const residue = result.report.stages.find(stage => stage.id === 'uninstall')
      ?.assertions.find(assertion => assertion.id === 'uninstall.filesystem.residue')?.actual
    expect(residue).toEqual(expect.arrayContaining(['added:dsh-home/.anonymous-user-id']))
  }, 900_000)

  it('captures process and port evidence while an observer fixture is live', async () => {
    const result = await runFixture('observer-plugin', [
      '--expect-row', 'fixture-observer',
    ])
    expect(result.code).toBe(0)
    expect(result.report.observerCoverage.process.available).toBe(true)
    expect(result.report.observerCoverage.ports.available).toBe(true)
    expect(result.report.artifacts.some(path => path.includes('process-boot'))).toBe(true)
    expect(result.report.artifacts.some(path => path.includes('ports-boot'))).toBe(true)
  }, 900_000)

  it('asserts a deterministic route on the live Docker web host', async () => {
    const result = await runFixture('http-route-plugin', [], 'docker')
    if (result.code !== 0) {
      const [stdout, stderr] = await Promise.all([
        readFile(join(result.outputDir, 'logs/boot.stdout.log'), 'utf8').catch(() => ''),
        readFile(join(result.outputDir, 'logs/boot.stderr.log'), 'utf8').catch(() => ''),
      ])
      throw new Error(`HTTP route fixture boot failed\nstdout:\n${stdout}\nstderr:\n${stderr}\nstages:\n${JSON.stringify(result.report.stages, null, 2)}`)
    }
    expect(result.report.verdict).toBe('passed')
    const register = result.report.stages.find(stage => stage.id === 'register')
    expect(register?.assertions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'http.health.status', status: 'passed' }),
      expect.objectContaining({ id: 'http.health.json.version', status: 'passed', actual: '1.0.0' }),
    ]))
    expect(register?.artifacts).toContain('evidence/http-boot.json')
  }, 900_000)

  it('asserts a deterministic TurnStatus transition in the real Docker web host', async () => {
    const result = await runFixture('web-status-plugin', [], 'docker')
    if (result.code !== 0) {
      const [stdout, stderr] = await Promise.all([
        readFile(join(result.outputDir, 'logs/boot.stdout.log'), 'utf8').catch(() => ''),
        readFile(join(result.outputDir, 'logs/boot.stderr.log'), 'utf8').catch(() => ''),
      ])
      throw new Error(`Browser fixture failed\nstdout:\n${stdout}\nstderr:\n${stderr}\nstages:\n${JSON.stringify(result.report.stages, null, 2)}`)
    }
    expect(result.report.verdict).toBe('passed')
    expect(result.report.environment.browser).toMatchObject({ name: 'chromium' })
    const register = result.report.stages.find(stage => stage.id === 'register')
    expect(register?.assertions).toContainEqual(expect.objectContaining({
      id: 'browser.turn-status.text',
      status: 'passed',
      actual: 'Fixture status ready',
    }))
    expect(register?.artifacts).toEqual(expect.arrayContaining([
      'evidence/browser-boot.json',
      'evidence/browser-boot-turn-status.png',
    ]))
  }, 900_000)
})
