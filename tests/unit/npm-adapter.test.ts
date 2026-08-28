import { describe, expect, it } from 'vitest'

import {
  classifyBootFailure,
  DshNpmAdapter,
} from '../../src/adapters/dsh/npm-adapter.js'
import type { AdapterBootObservation } from '../../src/worker/adapter.js'

describe('DshNpmAdapter verdict boundaries', () => {
  it('requires live loopback evidence before attributing a timeout to the DSH host', () => {
    expect(classifyBootFailure('pre-probe-timeout')).toBe('timeout')
    expect(classifyBootFailure('live-loopback-unresponsive')).toBe('dsh')
  })

  it('preserves an unavailable browser runner as an unsupported registration assertion', async () => {
    const adapter = new DshNpmAdapter()
    const observation: AdapterBootObservation = {
      outcome: 'success',
      probe: {
        assertions: [],
        exercises: [],
        browser: [{
          id: 'browser.turn-status.runner',
          status: 'unsupported',
          message: 'Browser runner is unavailable',
        }],
      },
    }

    await expect(adapter.register(observation)).resolves.toMatchObject({
      assertions: [expect.objectContaining({
        id: 'browser.turn-status.runner',
        status: 'unsupported',
      })],
    })
  })
})
