import {
  LifecycleRecorder,
  StageFailure,
  deriveVerdict,
} from '../domain/lifecycle.js'
import type { FailureKind, RunReport, StageId } from '../domain/report.js'
import { scenarioDigest } from '../domain/scenario.js'
import { TESTKIT_VERSION } from '../version.js'
import type {
  AdapterBootObservation,
  AdapterCompletion,
  LifecycleAdapter,
} from './adapter.js'
import type { WorkerRequest } from './protocol.js'

interface SafeResult<T> {
  ok: boolean
  completion?: AdapterCompletion<T>
}

export class LifecycleWorker {
  constructor(private readonly adapter: LifecycleAdapter) {}

  async run(request: WorkerRequest): Promise<RunReport> {
    const startedAt = new Date()
    const recorder = new LifecycleRecorder()

    const safe = async <T>(
      id: StageId,
      operation: () => Promise<AdapterCompletion<T>>,
      failureKind: FailureKind,
    ): Promise<SafeResult<T>> => {
      try {
        const completion = await recorder.run(id, operation, { failureKind })
        return { ok: true, completion }
      } catch {
        return { ok: false }
      }
    }

    let installed = false
    let bootObservation: AdapterBootObservation | undefined
    let shouldRecover = false
    const resolved = await safe('resolve', async () => {
      await this.adapter.initialize?.(request)
      return await this.adapter.resolve()
    }, 'infrastructure')
    const dshInstalled = resolved.ok
      ? await safe('install-dsh', () => this.adapter.installDsh(), 'infrastructure')
      : { ok: false }
    if (!resolved.ok) recorder.skip('install-dsh', 'subject resolution failed')

    const packaged = dshInstalled.ok
      ? await safe('package', () => this.adapter.packageSubject(), 'subject')
      : { ok: false }
    if (!dshInstalled.ok) recorder.skip('package', 'DSH installation did not complete')

    const pluginInstalled = packaged.ok
      ? await safe('install-plugin', () => this.adapter.installPlugin(), 'subject')
      : { ok: false }
    installed = pluginInstalled.ok
    if (!packaged.ok) recorder.skip('install-plugin', 'subject packaging did not complete')

    const assembled = pluginInstalled.ok
      ? await safe('assemble', () => this.adapter.assemble(), 'subject')
      : { ok: false }
    if (!pluginInstalled.ok) recorder.skip('assemble', 'plugin installation did not complete')

    const booted = assembled.ok
      ? await safe('boot', async () => {
          const completion = await this.adapter.boot()
          const expected = request.scenario.expect.boot
          if (completion.value.outcome !== expected) {
            throw new StageFailure(
              `Expected boot ${expected} but observed ${completion.value.outcome}`,
              {
                failureKind: 'assertion',
                assertions: [{
                  id: 'boot.outcome',
                  status: 'failed',
                  message: `Expected boot ${expected}`,
                  expected,
                  actual: completion.value.outcome,
                }],
                ...(completion.artifacts === undefined ? {} : { artifacts: completion.artifacts }),
              },
            )
          }
          completion.assertions = [
            ...(completion.assertions ?? []),
            {
              id: 'boot.outcome',
              status: 'passed',
              message: `Observed expected boot ${expected}`,
              expected,
              actual: completion.value.outcome,
            },
          ]
          return completion
        }, 'subject')
      : { ok: false }
    if (!assembled.ok) recorder.skip('boot', 'configuration assembly did not complete')

    if (booted.ok) bootObservation = booted.completion?.value
    if (bootObservation?.outcome === 'failure') shouldRecover = true

    let registered: SafeResult<void> = { ok: false }
    if (bootObservation?.outcome === 'success') {
      registered = await safe('register', () => this.adapter.register(bootObservation!), 'assertion')
    } else {
      recorder.skip('register', bootObservation === undefined ? 'boot did not complete' : 'negative boot scenario')
    }

    if (registered.ok && bootObservation !== undefined) {
      await safe('exercise', () => this.adapter.exercise(bootObservation!), 'assertion')
    } else {
      recorder.skip('exercise', 'runtime registration did not pass')
    }

    if (request.scenario.subject.updateFrom !== undefined && bootObservation?.outcome === 'success' && registered.ok) {
      await safe('update', () => this.adapter.update(), 'subject')
    } else {
      recorder.skip('update', request.scenario.subject.updateFrom === undefined
        ? 'no updateFrom source'
        : 'pre-update lifecycle did not pass')
    }

    if (shouldRecover) {
      recorder.skip('uninstall', 'recovery owns plugin removal')
      recorder.skip('reboot', 'recovery owns reboot verification')
      if (request.scenario.recovery.onBootFailure === 'remove-plugin') {
        await safe('recover', () => this.adapter.recover(), 'subject')
        installed = false
      } else {
        recorder.skip('recover', 'scenario disables boot-failure recovery')
      }
    } else if (installed) {
      const uninstalled = await safe('uninstall', () => this.adapter.uninstall(), 'subject')
      if (uninstalled.ok) {
        installed = false
        await safe('reboot', () => this.adapter.reboot(), 'subject')
      } else {
        recorder.skip('reboot', 'plugin uninstall did not complete')
        shouldRecover = true
      }
      if (shouldRecover) await safe('recover', () => this.adapter.recover(), 'subject')
      else recorder.skip('recover', 'no recovery was required')
    } else {
      recorder.skip('uninstall', 'plugin was not installed')
      recorder.skip('reboot', 'plugin was not uninstalled')
      if (pluginInstalled.ok || assembled.ok || booted.ok) {
        await safe('recover', () => this.adapter.recover(), 'subject')
      } else {
        recorder.skip('recover', 'no recoverable profile state was created')
      }
    }

    const missingObservers = this.missingRequiredObservers(request)
    try {
      const cleanup = await this.adapter.cleanup()
      if (missingObservers.length > 0) {
        recorder.unsupported('cleanup', `Required observers unavailable: ${missingObservers.join(', ')}`, missingObservers.map(name => ({
          id: `observer.${name}`,
          status: 'unsupported',
          message: `Required ${name} observer is unavailable`,
        })))
      } else {
        await recorder.run('cleanup', async () => cleanup, { failureKind: 'cleanup' })
      }
    } catch (error) {
      try {
        await recorder.run('cleanup', async () => { throw error }, { failureKind: 'cleanup' })
      } catch {
        // The failed cleanup stage is already recorded.
      }
    }

    const endedAt = new Date()
    return {
      schemaVersion: 1,
      runId: request.runId,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      verdict: deriveVerdict(recorder.stages),
      subject: this.adapter.subjectIdentity(),
      dsh: this.adapter.dshIdentity(),
      scenario: {
        name: request.scenario.name,
        suite: request.scenario.suite,
        schemaVersion: request.scenario.schemaVersion,
        profile: request.scenario.profile,
        digest: scenarioDigest(request.scenario),
      },
      testkitVersion: TESTKIT_VERSION,
      environment: this.adapter.environment(),
      observerCoverage: this.adapter.observerCoverage(),
      stages: recorder.stages,
      artifacts: this.adapter.artifacts(),
      reproductionCommand: request.reproductionCommand,
    }
  }

  private missingRequiredObservers(request: WorkerRequest): string[] {
    const coverage = this.adapter.observerCoverage()
    return Object.entries(request.scenario.observers)
      .filter(([name, requirement]) => requirement === 'required'
        && !coverage[name as keyof typeof coverage].available)
      .map(([name]) => name)
  }
}
