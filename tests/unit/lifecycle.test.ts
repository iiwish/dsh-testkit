import { describe, expect, it } from 'vitest'

import {
  LifecycleRecorder,
  deriveVerdict,
  exitCodeForVerdict,
} from '../../src/domain/lifecycle.js'
import type { StageResult } from '../../src/domain/report.js'

function stage(overrides: Partial<StageResult> = {}): StageResult {
  return {
    id: 'resolve',
    status: 'passed',
    startedAt: '2026-08-15T00:00:00.000Z',
    endedAt: '2026-08-15T00:00:00.001Z',
    durationMs: 1,
    summary: 'resolved',
    assertions: [],
    artifacts: [],
    ...overrides,
  }
}

describe('lifecycle state', () => {
  it('records timed stages in order', async () => {
    const recorder = new LifecycleRecorder(() => new Date('2026-08-15T00:00:00.000Z'))
    await recorder.run('resolve', async () => ({ summary: 'subject resolved' }))
    recorder.skip('update', 'no updateFrom source')

    expect(recorder.stages.map(item => [item.id, item.status, item.summary])).toEqual([
      ['resolve', 'passed', 'subject resolved'],
      ['update', 'skipped', 'no updateFrom source'],
    ])
  })

  it('converts a thrown stage into a typed failed result', async () => {
    const recorder = new LifecycleRecorder()
    await expect(recorder.run('boot', async () => {
      throw new Error('plugin exploded')
    }, { failureKind: 'subject' })).rejects.toThrow('plugin exploded')

    expect(recorder.stages[0]).toMatchObject({
      id: 'boot',
      status: 'failed',
      failureKind: 'subject',
      summary: 'plugin exploded',
    })
  })

  it('applies verdict precedence and stable exit codes', () => {
    expect(deriveVerdict([stage(), stage({ id: 'boot', status: 'failed', failureKind: 'subject' })]))
      .toBe('failed')
    expect(deriveVerdict([stage({ status: 'unsupported' })])).toBe('unsupported')
    expect(deriveVerdict([stage({ assertions: [{
      id: 'source.reproducible',
      status: 'unsupported',
      message: 'mutable source',
    }] })])).toBe('unsupported')
    expect(deriveVerdict([stage({ status: 'failed', failureKind: 'infrastructure' })]))
      .toBe('infrastructure_error')

    expect(exitCodeForVerdict('passed')).toBe(0)
    expect(exitCodeForVerdict('failed')).toBe(1)
    expect(exitCodeForVerdict('invalid')).toBe(2)
    expect(exitCodeForVerdict('infrastructure_error')).toBe(3)
    expect(exitCodeForVerdict('unsupported')).toBe(4)
    expect(exitCodeForVerdict('flaky')).toBe(5)
  })
})
