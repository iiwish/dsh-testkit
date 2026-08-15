import { execFile } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

import { SUPPORTED_DSH_NPM_VERSIONS } from '../../src/adapters/dsh/support.js'
import { RunReportSchema } from '../../src/domain/report.js'

const executeFile = promisify(execFile)
const root = resolve(import.meta.dirname, '../..')
const cli = join(root, 'dist', 'src', 'cli.js')
const dshVersion = process.env.DSH_TESTKIT_DSH_VERSION ?? SUPPORTED_DSH_NPM_VERSIONS[0]

interface FixtureRun {
  code: number
  report: ReturnType<typeof RunReportSchema.parse>
}

async function runFixture(name: string, args: string[] = []): Promise<FixtureRun> {
  const cwd = join(root, 'fixtures', name)
  const output = await mkdtemp(join(tmpdir(), `dsh-testkit-e2e-${name}-`))
  let code = 0
  try {
    await executeFile(process.execPath, [
      cli,
      '.',
      '--dsh', dshVersion,
      '--runner', 'local',
      '--unsafe-local',
      '--output', output,
      ...args,
    ], { cwd, timeout: 900_000, maxBuffer: 16 * 1024 * 1024 })
  } catch (error) {
    code = (error as { code?: number }).code ?? 1
  }
  const report = RunReportSchema.parse(JSON.parse(await readFile(join(output, 'report.json'), 'utf8')))
  return { code, report }
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
})
