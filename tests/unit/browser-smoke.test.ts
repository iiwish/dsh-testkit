import { describe, expect, it } from 'vitest'

import {
  assessTurnStatusSmoke,
  unavailableBrowserSmoke,
} from '../../src/adapters/dsh/browser-smoke.js'
import type { BrowserSmoke } from '../../src/domain/scenario.js'

const smoke: BrowserSmoke = {
  kind: 'turn-status-text',
  path: '/',
  expectedText: 'Fixture status ready',
  timeoutMs: 5_000,
}

describe('TurnStatus browser smoke', () => {
  it('returns unsupported rather than a synthetic pass without a browser runner', () => {
    const result = unavailableBrowserSmoke(smoke, 'Chromium executable was not found')
    expect(result.assertions).toEqual([
      expect.objectContaining({ id: 'browser.turn-status.runner', status: 'unsupported' }),
    ])
    expect(result.evidence).toMatchObject({ available: false, domRedacted: true })
  })

  it('passes only the selected TurnStatus text and retains browser identity', () => {
    const result = assessTurnStatusSmoke(smoke, {
      browserName: 'chromium',
      browserVersion: '123.0',
      actualText: 'Fixture status ready',
      screenshot: 'evidence/browser-boot-turn-status.png',
    })
    expect(result.assertions).toEqual([
      expect.objectContaining({ id: 'browser.turn-status.text', status: 'passed' }),
    ])
    expect(result.evidence).toMatchObject({
      available: true,
      selectedText: 'Fixture status ready',
      domRedacted: true,
      storageRedacted: true,
    })
  })

  it('keeps a completed DOM mismatch as a plugin assertion failure', () => {
    const result = assessTurnStatusSmoke(smoke, {
      browserName: 'chromium',
      browserVersion: '123.0',
      actualText: 'Deep diving...',
      screenshot: 'evidence/browser-boot-turn-status.png',
    })
    expect(result.assertions[0]).toMatchObject({ status: 'failed' })
    expect(result.infrastructureError).toBeUndefined()
  })
})
