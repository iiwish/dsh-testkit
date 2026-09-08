import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  assessTurnStatusSmoke,
  unavailableBrowserSmoke,
  validateBrowserLaunchUrl,
} from '../../src/adapters/dsh/browser-smoke.js'
import type { BrowserSmoke } from '../../src/domain/scenario.js'

const smoke: BrowserSmoke = {
  kind: 'turn-status-text',
  path: '/',
  expectedText: 'Fixture status ready',
  timeoutMs: 5_000,
}

describe('TurnStatus browser smoke', () => {
  it('accepts only a private launch URL for the exact owned loopback root', () => {
    expect(validateBrowserLaunchUrl(null, 1234)).toBeUndefined()
    expect(validateBrowserLaunchUrl('http://127.0.0.1:1234/?token=fixture-token', 1234))
      .toBe('http://127.0.0.1:1234/?token=fixture-token')
    for (const value of [
      undefined, {}, 'not-a-url', 'https://example.com/?token=secret',
      'http://127.0.0.1:1235/?token=secret', 'http://127.0.0.1:1234/api?token=secret',
      'http://user:secret@127.0.0.1:1234/?token=secret',
      'http://127.0.0.1:1234/?token=secret#fragment',
      'http://127.0.0.1:1234/?token=secret&token=second',
      'http://127.0.0.1:1234/?token=',
      'http://127.0.0.1:1234/?token=secret&redirect=https://example.com',
    ]) {
      expect(() => validateBrowserLaunchUrl(value, 1234)).toThrow(/DSH/)
      try { validateBrowserLaunchUrl(value, 1234) } catch (error) {
        expect(String(error)).not.toContain('secret')
      }
    }
  })

  it('registers the fixture client with its exact scoped package identity', async () => {
    const fixtureRoot = join(process.cwd(), 'fixtures/web-status-plugin')
    const [manifest, client] = await Promise.all([
      readFile(join(fixtureRoot, 'package.json'), 'utf8'),
      readFile(join(fixtureRoot, 'client.js'), 'utf8'),
    ])
    const parsed = JSON.parse(manifest) as { name: string, exports: Record<string, string> }
    const packageName = parsed.name
    expect(parsed.exports['./package.json']).toBe('./package.json')
    expect(client).toContain(`id: '${packageName}'`)
    expect(client).toContain(`name = '${packageName}'`)
    expect(client).toContain("Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })")
    expect(client).toContain('window.__DSH_TESTKIT_WEB_STATUS_FIXTURE__ = true')
  })

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
