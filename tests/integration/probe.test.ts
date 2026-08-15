import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { apply } from '../../src/probe/runtime.js'

const originalConfig = process.env.DSH_TESTKIT_PROBE_CONFIG

afterEach(() => {
  if (originalConfig === undefined) delete process.env.DSH_TESTKIT_PROBE_CONFIG
  else process.env.DSH_TESTKIT_PROBE_CONFIG = originalConfig
})

describe('runtime probe', () => {
  it('observes services and tools and executes declared deterministic calls', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-probe-'))
    const output = join(root, 'probe.json')
    process.env.DSH_TESTKIT_PROBE_CONFIG = JSON.stringify({
      schemaVersion: 1,
      output,
      mode: 'present',
      services: ['fixtureService'],
      tools: ['echo'],
      exercise: [{ tool: 'echo', arguments: { value: 'ok' } }],
      settleMs: 1,
    })
    const tools = {
      schemas: () => [{ name: 'echo' }],
      execute: async () => ({ isError: false, content: [], value: 'ok' }),
    }
    await apply({ get: name => name === 'fixtureService' ? {} : name === 'tools' ? tools : undefined })

    const report = JSON.parse(await readFile(output, 'utf8'))
    expect(report.assertions).toHaveLength(2)
    expect(report.assertions.every((assertion: { status: string }) => assertion.status === 'passed')).toBe(true)
    expect(report.exercises).toMatchObject([{ status: 'passed' }])
  })

  it('always records one baseline exercise when no tool call is declared', async () => {
    const root = await mkdtemp(join(tmpdir(), 'dsh-probe-baseline-'))
    const output = join(root, 'probe.json')
    process.env.DSH_TESTKIT_PROBE_CONFIG = JSON.stringify({
      schemaVersion: 1,
      output,
      mode: 'present',
      services: [],
      tools: [],
      exercise: [],
      settleMs: 1,
    })
    await apply({ get: () => undefined })

    const report = JSON.parse(await readFile(output, 'utf8'))
    expect(report.exercises).toMatchObject([{ id: 'exercise.runtime-probe', status: 'passed' }])
  })
})
