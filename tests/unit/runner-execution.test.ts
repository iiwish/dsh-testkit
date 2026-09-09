import { access, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RunReport } from '../../src/domain/report.js'
import { ScenarioSchema } from '../../src/domain/scenario.js'
import { runCommand } from '../../src/process/command.js'
import type { CommandOptions, CommandResult } from '../../src/process/command.js'
import { DockerRunner, dockerContextDigest } from '../../src/runners/docker.js'
import { createRunner } from '../../src/runners/index.js'
import { LocalRunner } from '../../src/runners/local.js'
import type { WorkerRequest } from '../../src/worker/protocol.js'

vi.mock('../../src/process/command.js', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../src/process/command.js')>(),
  runCommand: vi.fn(),
}))

let root: string
let request: WorkerRequest
let digest: string

function commandResult(overrides: Partial<CommandResult> = {}): CommandResult {
  return {
    command: ['docker'], exitCode: 0, signal: null, timedOut: false,
    stoppedAfterCompletion: false, redactionApplied: false, redactionMatches: [],
    interruptedBy: null, durationMs: 1, stdout: '', stderr: '',
    stdoutTruncated: false, stderrTruncated: false, artifacts: [], ...overrides,
  }
}

function report(): RunReport {
  const observer = { available: false, mode: 'unavailable', limitations: [] }
  return {
    schemaVersion: 1, runId: request.runId,
    startedAt: '2026-09-09T00:00:00.000Z', endedAt: '2026-09-09T00:00:01.000Z', verdict: 'passed',
    subject: { input: '.', kind: 'local-directory', packageName: 'fixture', packageVersion: '1.0.0', sourceDigest: 'sha256:fixture', gitCommit: null, mutable: false },
    dsh: { version: '0.1.2-rc.1', integrity: null },
    scenario: { name: 'runner', suite: 'quick', schemaVersion: 1, profile: 'test', digest: `sha256:${'a'.repeat(64)}` },
    testkitVersion: '0.4.3', environment: { runner: request.runner },
    observerCoverage: { filesystem: observer, process: observer, ports: observer, network: observer, canary: observer },
    stages: [], artifacts: [], reproductionCommand: request.reproductionCommand,
  }
}

async function writeReport(value = report()): Promise<void> {
  await writeFile(join(request.outputDir, 'report.json'), JSON.stringify(value))
}

// Only the process boundary is simulated; controller requests, cleanup and artifact auditing use real files.
function simulateWorker(worker: (options: CommandOptions) => Promise<CommandResult>,
  setup?: (options: CommandOptions) => CommandResult | undefined): void {
  vi.mocked(runCommand).mockImplementation(async (options) => {
    await mkdir(options.logDir, { recursive: true })
    await writeFile(join(options.logDir, `${options.logName}.stdout.log`), 'controller evidence')
    if (options.logName === 'docker-runner' || options.logName === 'local-worker') return worker(options)
    const override = setup?.(options)
    if (override) return override
    return commandResult({ stdout: options.logName === 'docker-image-inspect' ? digest : 'sha256:image' })
  })
}

beforeEach(async () => {
  vi.clearAllMocks()
  root = await mkdtemp(join(tmpdir(), 'dsh-runner-test-'))
  request = {
    schemaVersion: 1, runId: 'runner-test', outputDir: join(root, 'output'),
    scenario: ScenarioSchema.parse({ schemaVersion: 1, name: 'runner', subject: { source: 'fixture@1.0.0' }, dsh: { version: '0.1.2-rc.1' } }),
    reproductionCommand: 'dsh-test fixture@1.0.0', allowMutableSource: false, runner: 'docker', unsafeLocal: false,
  }
  digest = await dockerContextDigest(process.cwd())
})

afterEach(async () => {
  vi.useRealTimers()
  await rm(root, { recursive: true, force: true })
})

describe('runner selection', () => {
  it('selects the explicit runner', () => {
    expect(createRunner('docker')).toBeInstanceOf(DockerRunner)
    expect(createRunner('local')).toBeInstanceOf(LocalRunner)
  })
})

describe('Docker controller execution', () => {
  it('rewrites local inputs read-only without mutating the caller and retains declared evidence', async () => {
    const plugin = join(root, 'plugin')
    const tarball = join(root, 'previous.tgz')
    await mkdir(plugin)
    await writeFile(tarball, 'fixture')
    request.scenario.subject = { source: plugin, updateFrom: tarball }
    const original = structuredClone(request)
    simulateWorker(async (options) => {
      const containerRequest = JSON.parse(await readFile(join(request.outputDir, 'worker-request.json'), 'utf8'))
      expect(containerRequest).toMatchObject({ outputDir: '/output', runner: 'docker', unsafeLocal: false, scenario: { subject: { source: '/input/primary', updateFrom: '/input/update-from.tgz' } } })
      expect(options.args).toContain(`${plugin}:/input/primary:ro`)
      expect(options.args).toContain(`${tarball}:/input/update-from.tgz:ro`)
      const result = report()
      result.artifacts = ['logs/worker.log']
      result.stages = [{ id: 'boot', status: 'passed', startedAt: result.startedAt, endedAt: result.endedAt, durationMs: 1, summary: 'booted', artifacts: [], assertions: [{ id: 'boot', status: 'passed', message: 'ok', evidence: ['checks/boot.txt'] }, { id: 'ready', status: 'passed', message: 'ok' }] }]
      await mkdir(join(request.outputDir, 'logs'))
      await mkdir(join(request.outputDir, 'checks'))
      await writeFile(join(request.outputDir, 'logs/worker.log'), 'worker')
      await writeFile(join(request.outputDir, 'checks/boot.txt'), 'ok')
      await writeReport(result)
      return commandResult()
    })
    const result = await new DockerRunner().run(request, new AbortController().signal)
    expect(result.verdict).toBe('passed')
    expect(result.artifacts).toContain('logs/docker-runner.stdout.log')
    expect(result.artifacts).toContain('logs/worker.log')
    expect(request).toEqual(original)
    await expect(access(join(request.outputDir, 'worker-request.json'))).rejects.toThrow()
    expect(vi.mocked(runCommand).mock.calls.some(([options]) => options.logName === 'docker-image-build')).toBe(false)
  })

  it('builds a missing image and leaves immutable npm inputs unchanged', async () => {
    request.scenario.subject.updateFrom = 'fixture@0.9.0'
    simulateWorker(async () => {
      const serialized = JSON.parse(await readFile(join(request.outputDir, 'worker-request.json'), 'utf8'))
      expect(serialized.scenario.subject).toEqual(request.scenario.subject)
      await writeReport()
      return commandResult()
    }, options => options.logName === 'docker-image-inspect' ? commandResult({ exitCode: 1 }) : undefined)
    expect((await new DockerRunner().run(request)).verdict).toBe('passed')
    expect(vi.mocked(runCommand).mock.calls.some(([options]) => options.logName === 'docker-image-build')).toBe(true)
  })

  it.each([
    ['build failure', 'docker-image-build', { exitCode: 1, stderr: 'build failed' }, /Unable to build/],
    ['build timeout', 'docker-image-build', { timedOut: true, stdout: 'build timed out' }, /Unable to build/],
    ['identity failure', 'docker-image-identity', { exitCode: 1 }, /Unable to inspect/],
  ] as const)('preserves controller diagnostics on %s', async (_name, step, result, message) => {
    simulateWorker(async () => commandResult(), options => {
      if (options.logName === step) return commandResult(result)
      if (options.logName === 'docker-image-inspect') return commandResult({ stdout: 'wrong context' })
      return undefined
    })
    await expect(new DockerRunner().run(request)).rejects.toThrow(message)
    expect(await readdir(request.outputDir)).toEqual(['logs'])
    expect(await readdir(join(request.outputDir, 'logs'))).toContain(`${step}.stdout.log`)
  })

  it.each([
    ['watchdog', { timedOut: true }, /Global watchdog/],
    ['stdout overflow', { stdoutTruncated: true }, /evidence limit/],
    ['stderr overflow', { stderrTruncated: true }, /evidence limit/],
    ['missing report', { exitCode: null, stderr: 'worker stopped' }, /no report \(exit null\)/],
    ['interruption', { interruptedBy: 'SIGTERM' }, /no report/],
  ] as const)('rejects %s and clears worker output', async (_name, result, message) => {
    simulateWorker(async () => {
      await writeFile(join(request.outputDir, 'undeclared.txt'), 'discard')
      return commandResult(result)
    })
    await expect(new DockerRunner().run(request)).rejects.toThrow(message)
    expect(await readdir(request.outputDir)).toEqual(['logs'])
    const cleaned = vi.mocked(runCommand).mock.calls.some(([options]) => options.logName === 'docker-watchdog-cleanup')
    expect(cleaned).toBe(_name === 'watchdog' || _name === 'interruption')
  })

  it.each(['../escape', '/absolute', ''])('rejects declared unsafe path %j', async (artifact) => {
    simulateWorker(async () => { await writeReport({ ...report(), artifacts: [artifact] }); return commandResult() })
    await expect(new DockerRunner().run(request)).rejects.toThrow(/unsafe artifact path/)
    expect(await readdir(request.outputDir)).toEqual(['logs'])
  })

  it('classifies a watchdog that expires during image setup', async () => {
    vi.useFakeTimers()
    let notifyStarted!: () => void
    const started = new Promise<void>(resolve => { notifyStarted = resolve })
    vi.mocked(runCommand).mockImplementation(async (options) => {
      notifyStarted()
      return new Promise((_resolve, reject) => {
        options.signal!.addEventListener('abort', () => reject(options.signal!.reason), { once: true })
      })
    })
    const failed = expect(new DockerRunner().run(request)).rejects.toThrow(/Global watchdog/)
    await started
    await vi.advanceTimersByTimeAsync(request.scenario.timeouts.overallMs)
    await failed
    expect(await readdir(request.outputDir)).toEqual(['logs'])
  })

  it('keeps watchdog failure authoritative when forced cleanup cannot launch', async () => {
    simulateWorker(async () => commandResult({ timedOut: true }), options => {
      if (options.logName === 'docker-watchdog-cleanup') throw new Error('cleanup unavailable')
      return undefined
    })
    await expect(new DockerRunner().run(request)).rejects.toThrow(/Global watchdog/)
    expect(await readdir(join(request.outputDir, 'logs'))).toContain('docker-watchdog-cleanup.stdout.log')
  })

  it.each(['file', 'directory', 'symlink', 'report-symlink', 'report-directory', 'invalid-json', 'logs-file'])('rejects unsafe worker output: %s', async (kind) => {
    const outside = join(root, 'outside.txt')
    await writeFile(outside, 'untouched')
    simulateWorker(async () => {
      if (kind === 'report-symlink') await symlink(outside, join(request.outputDir, 'report.json'))
      else if (kind === 'report-directory') await mkdir(join(request.outputDir, 'report.json'))
      else if (kind === 'invalid-json') await writeFile(join(request.outputDir, 'report.json'), '{')
      else {
        await writeReport({ ...report(), artifacts: kind === 'logs-file' ? ['logs'] : [] })
        if (kind === 'file') await writeFile(join(request.outputDir, 'secret.txt'), 'discard')
        if (kind === 'directory') await mkdir(join(request.outputDir, 'private'))
        if (kind === 'symlink') await symlink(outside, join(request.outputDir, 'escape'))
        if (kind === 'logs-file') await writeFile(join(request.outputDir, 'logs'), 'not a directory')
      }
      return commandResult()
    })
    await expect(new DockerRunner().run(request)).rejects.toMatchObject({ exitCode: 3 })
    expect(await readFile(outside, 'utf8')).toBe('untouched')
    expect(await readdir(request.outputDir)).toEqual(['logs'])
  })

  it.each([
    [Object.assign(new Error('missing docker'), { code: 'ENOENT' }), 4, /Docker is required/],
    [new Error('socket denied'), 3, /socket denied/],
    ['unexpected failure', 3, /unexpected failure/],
  ] as const)('classifies process launch failures without losing diagnostics', async (error, exitCode, message) => {
    vi.mocked(runCommand).mockRejectedValue(error)
    const failed = new DockerRunner().run(request)
    await expect(failed).rejects.toMatchObject({ exitCode })
    await expect(failed).rejects.toThrow(message)
  })
})

describe('explicit local controller execution', () => {
  beforeEach(() => { request.runner = 'local'; request.unsafeLocal = true })

  it('sets local isolation flags and removes owned worker state', async () => {
    simulateWorker(async (options) => {
      const localRequest = JSON.parse(await readFile(join(request.outputDir, 'worker-request.json'), 'utf8'))
      expect(localRequest).toMatchObject({ runner: 'local', unsafeLocal: true })
      expect(options.env?.DSH_TESTKIT_RUNNER).toBe('local')
      await mkdir(options.env!.DSH_TESTKIT_WORK_ROOT!, { recursive: true })
      await writeReport()
      return commandResult()
    })
    const result = await new LocalRunner().run(request, new AbortController().signal)
    expect(result.artifacts).toContain('logs/local-worker.stdout.log')
    await expect(access(join(request.outputDir, '.owned-run-root'))).rejects.toThrow()
    await expect(access(join(request.outputDir, 'worker-request.json'))).rejects.toThrow()
  })

  it.each([
    [{ timedOut: true }, /Global watchdog/],
    [{ stdoutTruncated: true }, /evidence limit/],
    [{ stderrTruncated: true }, /evidence limit/],
    [{ exitCode: null }, /no valid report \(exit null\)/],
    [{ exitCode: 1 }, /no valid report \(exit 1\)/],
  ])('rejects incomplete local execution %j', async (result, message) => {
    simulateWorker(async () => commandResult(result))
    await expect(new LocalRunner().run(request)).rejects.toThrow(message)
    await expect(access(join(request.outputDir, 'worker-request.json'))).rejects.toThrow()
  })
})
