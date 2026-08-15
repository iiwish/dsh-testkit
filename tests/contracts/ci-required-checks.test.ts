import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const runLifecycle = "github.event_name == 'push' || needs.changes.outputs.lifecycle == 'true'"
const skipLifecycle = "github.event_name == 'pull_request' && needs.changes.outputs.lifecycle != 'true'"

describe('required CI checks', () => {
  it.each(['real-host', 'action-smoke'])('%s keeps its check identity for documentation-only pull requests', async (jobName) => {
    const workflow = parse(await readFile('.github/workflows/ci.yml', 'utf8'))
    const job = workflow.jobs[jobName]

    expect(job.if).toBeUndefined()
    expect(job.steps).toContainEqual(expect.objectContaining({
      if: skipLifecycle,
      run: expect.stringContaining('No lifecycle-impacting changes'),
    }))

    const executionSteps = job.steps.filter((step: Record<string, unknown>) => step.if !== skipLifecycle)
    expect(executionSteps.length).toBeGreaterThan(0)
    expect(executionSteps.every((step: Record<string, unknown>) => step.if === runLifecycle)).toBe(true)
  })
})
