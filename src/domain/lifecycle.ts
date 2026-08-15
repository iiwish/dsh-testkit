import type {
  Assertion,
  FailureKind,
  StageId,
  StageResult,
  Verdict,
} from './report.js'

export interface StageCompletion {
  summary: string
  assertions?: Assertion[]
  artifacts?: string[]
  command?: string[]
  exitCode?: number | null
  signal?: string | null
}

export interface StageRunOptions {
  failureKind?: FailureKind
}

export interface StageFailureDetails {
  failureKind?: FailureKind
  assertions?: Assertion[]
  artifacts?: string[]
  command?: string[]
  exitCode?: number | null
  signal?: string | null
}

export class StageFailure extends Error {
  readonly details: StageFailureDetails

  constructor(message: string, details: StageFailureDetails = {}) {
    super(message)
    this.name = 'StageFailure'
    this.details = details
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export class LifecycleRecorder {
  readonly stages: StageResult[] = []

  constructor(private readonly now: () => Date = () => new Date()) {}

  async run<T extends StageCompletion>(
    id: StageId,
    operation: () => Promise<T>,
    options: StageRunOptions = {},
  ): Promise<T> {
    const started = this.now()
    try {
      const completion = await operation()
      const ended = this.now()
      this.stages.push({
        id,
        status: 'passed',
        startedAt: started.toISOString(),
        endedAt: ended.toISOString(),
        durationMs: Math.max(0, ended.getTime() - started.getTime()),
        summary: completion.summary,
        assertions: completion.assertions ?? [],
        artifacts: completion.artifacts ?? [],
        ...(completion.command === undefined ? {} : { command: completion.command }),
        ...(completion.exitCode === undefined ? {} : { exitCode: completion.exitCode }),
        ...(completion.signal === undefined ? {} : { signal: completion.signal }),
      })
      return completion
    } catch (error) {
      const ended = this.now()
      const details = error instanceof StageFailure ? error.details : {}
      this.stages.push({
        id,
        status: 'failed',
        startedAt: started.toISOString(),
        endedAt: ended.toISOString(),
        durationMs: Math.max(0, ended.getTime() - started.getTime()),
        summary: errorMessage(error),
        failureKind: details.failureKind ?? options.failureKind ?? 'assertion',
        assertions: details.assertions ?? [],
        artifacts: details.artifacts ?? [],
        ...(details.command === undefined ? {} : { command: details.command }),
        ...(details.exitCode === undefined ? {} : { exitCode: details.exitCode }),
        ...(details.signal === undefined ? {} : { signal: details.signal }),
      })
      throw error
    }
  }

  skip(id: StageId, reason: string): StageResult {
    return this.recordImmediate(id, 'skipped', reason)
  }

  unsupported(id: StageId, reason: string, assertions: Assertion[] = []): StageResult {
    return this.recordImmediate(id, 'unsupported', reason, assertions)
  }

  private recordImmediate(
    id: StageId,
    status: 'skipped' | 'unsupported',
    summary: string,
    assertions: Assertion[] = [],
  ): StageResult {
    const at = this.now().toISOString()
    const result: StageResult = {
      id,
      status,
      startedAt: at,
      endedAt: at,
      durationMs: 0,
      summary,
      assertions,
      artifacts: [],
    }
    this.stages.push(result)
    return result
  }
}

export function deriveVerdict(stages: readonly StageResult[]): Verdict {
  if (stages.some(stage => stage.status === 'failed'
    && (stage.failureKind === 'infrastructure' || stage.failureKind === 'cleanup'))) {
    return 'infrastructure_error'
  }
  if (stages.some(stage => stage.status === 'failed')) return 'failed'
  if (stages.some(stage => stage.status === 'unsupported'
    || stage.assertions.some(assertion => assertion.status === 'unsupported'))) return 'unsupported'
  return 'passed'
}

const EXIT_CODES: Record<Verdict, number> = {
  passed: 0,
  failed: 1,
  invalid: 2,
  infrastructure_error: 3,
  unsupported: 4,
  flaky: 5,
}

export function exitCodeForVerdict(verdict: Verdict): number {
  return EXIT_CODES[verdict]
}
