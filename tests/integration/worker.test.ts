import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import type { Scenario } from '../../src/domain/scenario.js'
import { scenarioDigest } from '../../src/domain/scenario.js'
import type {
  ObserverCoverageItem,
  StageId,
  SubjectIdentity,
} from '../../src/domain/report.js'
import { StageFailure } from '../../src/domain/lifecycle.js'
import type {
  AdapterBootObservation,
  AdapterCompletion,
  LifecycleAdapter,
} from '../../src/worker/adapter.js'
import { LifecycleWorker } from '../../src/worker/lifecycle-worker.js'
import type { WorkerRequest } from '../../src/worker/protocol.js'

const scenario: Scenario = {
  schemaVersion: 1,
  name: 'fake-success',
  suite: 'quick',
  subject: { source: '.' },
  dsh: { version: '0.1.0-rc.6' },
  profile: 'dsh-testkit',
  expect: { boot: 'success', rows: ['tool-echo'], services: ['tools'], tools: ['echo'] },
  exercise: [{ tool: 'echo', arguments: { value: 'smoke' } }],
  recovery: { onBootFailure: 'remove-plugin' },
  observers: {
    filesystem: 'required',
    process: 'preferred',
    ports: 'preferred',
    network: 'off',
    canary: 'preferred',
  },
  timeouts: { installMs: 300_000, bootMs: 30_000, cleanupMs: 30_000 },
}

function completion<T>(value: T, summary: string): AdapterCompletion<T> {
  return { value, summary, assertions: [], artifacts: [] }
}

const coverage: ObserverCoverageItem = { available: true, mode: 'fake', limitations: [] }

class FakeAdapter implements LifecycleAdapter {
  calls: string[] = []
  bootOutcome: AdapterBootObservation['outcome'] = 'success'
  registerFailure = false
  failAt: StageId | null = null

  private record(stage: StageId, call: string): void {
    this.calls.push(call)
    if (this.failAt === stage) {
      throw new StageFailure(`fault:${stage}`, { failureKind: stage === 'cleanup' ? 'cleanup' : 'subject' })
    }
  }

  async resolve() { this.record('resolve', 'resolve'); return completion(undefined, 'resolved') }
  async installDsh() { this.record('install-dsh', 'installDsh'); return completion(undefined, 'dsh installed') }
  async packageSubject() { this.record('package', 'package'); return completion(undefined, 'packed') }
  async installPlugin() { this.record('install-plugin', 'installPlugin'); return completion(undefined, 'installed') }
  async assemble() { this.record('assemble', 'assemble'); return completion(undefined, 'assembled') }
  async boot(): Promise<AdapterCompletion<AdapterBootObservation>> {
    this.record('boot', 'boot')
    return completion({ outcome: this.bootOutcome, probe: this.bootOutcome === 'success' ? { assertions: [], exercises: [] } : null }, 'boot observed')
  }
  async register() {
    this.record('register', 'register')
    if (this.registerFailure) throw new StageFailure('missing echo tool', { failureKind: 'assertion' })
    return completion(undefined, 'registered')
  }
  async exercise() { this.record('exercise', 'exercise'); return completion(undefined, 'exercised') }
  async update() { this.record('update', 'update'); return completion(undefined, 'updated') }
  async uninstall() { this.record('uninstall', 'uninstall'); return completion(undefined, 'uninstalled') }
  async reboot() { this.record('reboot', 'reboot'); return completion(undefined, 'rebooted') }
  async recover() { this.record('recover', 'recover'); return completion(undefined, 'recovered') }
  async cleanup() { this.record('cleanup', 'cleanup'); return completion(undefined, 'cleaned') }
  subjectIdentity(): SubjectIdentity {
    return { input: '.', kind: 'local-directory', packageName: 'fake-plugin', packageVersion: '1.0.0', sourceDigest: 'sha256:fake', gitCommit: null, mutable: false }
  }
  dshIdentity() { return { version: '0.1.0-rc.6', integrity: null } }
  environment() { return { runner: 'fake', node: process.version } }
  observerCoverage() { return { filesystem: coverage, process: coverage, ports: coverage, network: { available: false, mode: 'unsupported', limitations: [] }, canary: coverage } }
  artifacts() { return ['evidence/fake.json'] }
}

async function request(overrides: Partial<WorkerRequest> = {}): Promise<WorkerRequest> {
  const outputDir = await mkdtemp(join(tmpdir(), 'dsh-worker-'))
  return {
    schemaVersion: 1,
    runId: 'run-worker-001',
    scenario,
    outputDir,
    reproductionCommand: 'dsh-test . --dsh 0.1.0-rc.6',
    allowMutableSource: false,
    runner: 'local',
    unsafeLocal: true,
    ...overrides,
  }
}

describe('LifecycleWorker', () => {
  it('runs the successful quick lifecycle and always cleans up', async () => {
    const adapter = new FakeAdapter()
    const report = await new LifecycleWorker(adapter).run(await request())

    expect(report.verdict).toBe('passed')
    expect(report.scenario.digest).toBe(scenarioDigest(scenario))
    expect(report.stages.map(stage => stage.id)).toEqual([
      'resolve', 'install-dsh', 'package', 'install-plugin', 'assemble',
      'boot', 'register', 'exercise', 'update', 'uninstall', 'reboot', 'recover', 'cleanup',
    ])
    expect(adapter.calls).toEqual([
      'resolve', 'installDsh', 'package', 'installPlugin', 'assemble',
      'boot', 'register', 'exercise', 'uninstall', 'reboot', 'cleanup',
    ])
  })

  it('continues to uninstall and cleanup after a registration assertion fails', async () => {
    const adapter = new FakeAdapter()
    adapter.registerFailure = true
    const report = await new LifecycleWorker(adapter).run(await request())

    expect(report.verdict).toBe('failed')
    expect(report.stages.find(stage => stage.id === 'register')).toMatchObject({
      status: 'failed',
      summary: 'missing echo tool',
    })
    expect(adapter.calls).toContain('uninstall')
    expect(adapter.calls.at(-1)).toBe('cleanup')
  })

  it('treats an expected boot failure as a negative-case pass and proves recovery', async () => {
    const adapter = new FakeAdapter()
    adapter.bootOutcome = 'failure'
    const negativeScenario: Scenario = {
      ...scenario,
      name: 'expected-boot-failure',
      expect: { ...scenario.expect, boot: 'failure' },
    }
    const report = await new LifecycleWorker(adapter).run(await request({ scenario: negativeScenario }))

    expect(report.verdict).toBe('passed')
    expect(adapter.calls).toContain('recover')
    expect(adapter.calls).not.toContain('register')
    expect(report.stages.find(stage => stage.id === 'recover')?.status).toBe('passed')
  })

  it('returns unsupported when a required observer is unavailable', async () => {
    const adapter = new FakeAdapter()
    const networkScenario: Scenario = {
      ...scenario,
      observers: { ...scenario.observers, network: 'required' },
    }
    const report = await new LifecycleWorker(adapter).run(await request({ scenario: networkScenario }))

    expect(report.verdict).toBe('unsupported')
    expect(report.stages.some(stage => stage.status === 'unsupported')).toBe(true)
    expect(adapter.calls.at(-1)).toBe('cleanup')
  })

  it('does not accept a host crash as the declared negative boot failure', async () => {
    const adapter = new FakeAdapter()
    adapter.bootOutcome = 'crash'
    const negativeScenario: Scenario = {
      ...scenario,
      name: 'expected-boot-failure',
      expect: { ...scenario.expect, boot: 'failure' },
    }
    const report = await new LifecycleWorker(adapter).run(await request({ scenario: negativeScenario }))

    expect(report.verdict).toBe('failed')
    expect(report.stages.find(stage => stage.id === 'boot')).toMatchObject({
      status: 'failed',
      summary: 'Expected boot failure but observed crash',
    })
  })

  it.each([
    'resolve', 'install-dsh', 'package', 'install-plugin', 'assemble', 'boot',
    'register', 'exercise', 'update', 'uninstall', 'reboot', 'recover', 'cleanup',
  ] satisfies StageId[])('retains a structured failure and cleanup path for the %s stage', async (stage) => {
    const adapter = new FakeAdapter()
    adapter.failAt = stage
    const stageScenario: Scenario = stage === 'update'
      ? { ...scenario, subject: { ...scenario.subject, updateFrom: './old' } }
      : stage === 'recover'
        ? { ...scenario, expect: { ...scenario.expect, boot: 'failure' } }
        : scenario
    if (stage === 'recover') adapter.bootOutcome = 'failure'

    const report = await new LifecycleWorker(adapter).run(await request({ scenario: stageScenario }))

    expect(report.stages.find(result => result.id === stage)).toMatchObject({
      status: 'failed',
      summary: `fault:${stage}`,
    })
    expect(adapter.calls).toContain('cleanup')
  })
})
