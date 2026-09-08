import { beforeEach, describe, expect, it, vi } from 'vitest'

const browser = vi.hoisted(() => {
  const page = {
    goto: vi.fn(), url: vi.fn(), waitForFunction: vi.fn(), evaluate: vi.fn(),
    locator: vi.fn(), screenshot: vi.fn(),
  }
  const context = { route: vi.fn(), routeWebSocket: vi.fn(), newPage: vi.fn(), close: vi.fn() }
  const instance = { newContext: vi.fn(), version: () => 'test-browser', close: vi.fn() }
  return { page, context, instance, launch: vi.fn() }
})

vi.mock('playwright-core', () => ({ chromium: { launch: browser.launch, name: () => 'chromium' } }))

import { checkTurnStatusBrowserSmoke } from '../../src/adapters/dsh/browser-smoke.js'

const origin = 'http://127.0.0.1:1234'
const authenticatedUrl = `${origin}/?token=private-launch-token`
const smoke = { kind: 'turn-status-text' as const, path: '/', expectedText: 'Fixture status ready', timeoutMs: 1000 }
const options = {
  port: 1234, executablePath: process.execPath,
  screenshotPath: '/unused/screenshot.png', screenshotArtifact: 'evidence/browser.png', authenticatedUrl,
}

beforeEach(() => {
  vi.resetAllMocks()
  browser.launch.mockResolvedValue(browser.instance)
  browser.instance.newContext.mockResolvedValue(browser.context)
  browser.context.newPage.mockResolvedValue(browser.page)
  browser.instance.close.mockResolvedValue(undefined)
  browser.page.waitForFunction.mockResolvedValue(undefined)
  browser.page.goto.mockResolvedValue({ status: () => 200 })
  browser.page.url.mockReturnValue(`${origin}/`)
  browser.page.locator.mockReturnValue({ first: () => ({ textContent: async () => smoke.expectedText }) })
})

describe('private browser session exchange', () => {
  it('exchanges on the root before opening a declared subpath and retains no token', async () => {
    const result = await checkTurnStatusBrowserSmoke({ ...smoke, path: '/status' }, options)
    expect(browser.page.goto.mock.calls.map(call => call[0])).toEqual([authenticatedUrl, `${origin}/status`])
    expect(result.assertions[0]?.status).toBe('passed')
    expect(JSON.stringify(result)).not.toContain('private-launch-token')
    expect(browser.instance.close).toHaveBeenCalled()
  })

  it('retains direct navigation for hosts without the authentication API', async () => {
    const { authenticatedUrl: _url, ...legacyOptions } = options
    const result = await checkTurnStatusBrowserSmoke(smoke, legacyOptions)
    expect(browser.page.goto.mock.calls.map(call => call[0])).toEqual([`${origin}/`])
    expect(result.assertions[0]?.status).toBe('passed')
  })

  it('does not inject a synthetic status or take a screenshot of an unauthorized page', async () => {
    browser.page.goto.mockResolvedValue({ status: () => 401 })
    const result = await checkTurnStatusBrowserSmoke(smoke, options)
    expect(result.assertions[0]?.status).toBe('failed')
    expect(browser.page.evaluate).not.toHaveBeenCalled()
    expect(browser.page.screenshot).not.toHaveBeenCalled()
  })

  it('requires a token-free redirect before capturing evidence', async () => {
    browser.page.url.mockReturnValue(authenticatedUrl)
    const result = await checkTurnStatusBrowserSmoke(smoke, options)
    expect(result.assertions[0]?.status).toBe('failed')
    expect(browser.page.screenshot).not.toHaveBeenCalled()
    expect(JSON.stringify(result)).not.toContain('private-launch-token')
  })

  it('redacts navigation exceptions without changing infrastructure classification', async () => {
    browser.page.goto.mockRejectedValue(new Error(`Navigation timed out at ${authenticatedUrl}`))
    const result = await checkTurnStatusBrowserSmoke(smoke, options)
    expect(result.infrastructureError).toContain('Navigation timed out')
    expect(JSON.stringify(result)).not.toContain('private-launch-token')
    expect(browser.instance.close).toHaveBeenCalled()
  })
})
