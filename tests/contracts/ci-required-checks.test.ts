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

  it('runs Composite Action smoke with a read-only token', async () => {
    const workflow = parse(await readFile('.github/workflows/ci.yml', 'utf8'))

    for (const jobName of ['action-smoke', 'action-smoke-compat']) {
      expect(workflow.jobs[jobName].permissions).toEqual({ contents: 'read' })
    }
  })

  it('runs both Action smoke subjects across every compatibility host', async () => {
    const workflow = parse(await readFile('.github/workflows/ci.yml', 'utf8'))
    const entries = workflow.jobs['action-smoke-compat'].strategy.matrix.include

    expect(entries).toHaveLength(6)
    for (const dshVersion of ['0.1.0-rc.8', '0.1.0-rc.7', '0.1.0-rc.6']) {
      expect(entries).toEqual(expect.arrayContaining([
        { plugin: 'fixtures/healthy-plugin', 'dsh-version': dshVersion },
        { plugin: 'fixtures/boot-failure-plugin', 'dsh-version': dshVersion },
      ]))
    }
  })

  it('defaults JUnit publication to annotations without Checks API permission', async () => {
    const action = parse(await readFile('.github/actions/dsh-test/action.yml', 'utf8'))

    expect(action.inputs['publish-junit-check']).toMatchObject({
      required: false,
      default: 'false',
    })
    const junit = action.runs.steps.find((step: Record<string, unknown>) => step.name === 'Publish JUnit')
    expect(junit.with.annotate_only).toBe("${{ inputs.publish-junit-check != 'true' }}")
  })
})
