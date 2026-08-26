import type { BuildScenarioInput, Scenario } from '../domain/scenario.js'
import { ScenarioSchema } from '../domain/scenario.js'

export function parseScenario(input: unknown): Scenario {
  return ScenarioSchema.parse(input)
}

export function buildScenario(input: BuildScenarioInput): Scenario {
  return parseScenario({
    schemaVersion: 1,
    name: input.name ?? 'dsh-plugin-quick',
    suite: input.suite ?? 'quick',
    subject: {
      source: input.source,
      ...(input.updateFrom === undefined ? {} : { updateFrom: input.updateFrom }),
    },
    dsh: { version: input.dshVersion },
    ...(input.profile === undefined ? {} : { profile: input.profile }),
    expect: {
      boot: 'success',
      rows: input.rows ?? [],
      services: input.services ?? [],
      tools: input.tools ?? [],
    },
  })
}

export interface RunnerSelection {
  runner: 'docker' | 'local'
  unsafeLocal: boolean
  scenario?: Scenario
}

export function validateRunnerSelection(selection: RunnerSelection): RunnerSelection {
  if (selection.runner === 'local' && !selection.unsafeLocal) {
    throw new Error('Local runner requires explicit --unsafe-local consent')
  }
  if (selection.runner === 'local' && selection.scenario?.http !== undefined) {
    throw new Error('HTTP route assertions require the Docker runner')
  }
  if (selection.scenario?.http !== undefined && selection.scenario.profile !== 'web') {
    throw new Error('HTTP route assertions require scenario.profile: web')
  }
  return selection
}
