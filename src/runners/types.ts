import type { RunReport } from '../domain/report.js'
import type { WorkerRequest } from '../worker/protocol.js'

export type RunnerKind = 'docker' | 'local'

export interface Runner {
  run(request: WorkerRequest, signal?: AbortSignal): Promise<RunReport>
}

export function runnerTimeoutMs(request: WorkerRequest): number {
  return request.scenario.timeouts.installMs * 10
    + request.scenario.timeouts.bootMs * 6
    + request.scenario.timeouts.cleanupMs
    + 10_000
}

export class RunnerError extends Error {
  constructor(message: string, readonly exitCode: 3 | 4) {
    super(message)
    this.name = 'RunnerError'
  }
}
