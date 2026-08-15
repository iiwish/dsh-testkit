import { DockerRunner } from './docker.js'
import { LocalRunner } from './local.js'
import type { Runner, RunnerKind } from './types.js'

export function createRunner(kind: RunnerKind): Runner {
  return kind === 'docker' ? new DockerRunner() : new LocalRunner()
}
