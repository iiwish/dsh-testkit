import { access } from 'node:fs/promises'

import { chromium } from 'playwright-core'

import type { Assertion } from '../../domain/report.js'
import type { BrowserSmoke } from '../../domain/scenario.js'

const INITIAL_TURN_STATUS = 'Deep diving...'
const TURN_STATUS_SELECTOR = '[role="status"][aria-live="polite"]'

export interface BrowserSmokeEvidence {
  schemaVersion: 1
  available: boolean
  browserName: string | null
  browserVersion: string | null
  path: string
  selector: typeof TURN_STATUS_SELECTOR
  initialText: typeof INITIAL_TURN_STATUS
  expectedText: string
  selectedText: string | null
  screenshot: string | null
  domRedacted: true
  storageRedacted: true
  error?: string
}

export interface BrowserSmokeResult {
  assertions: Assertion[]
  evidence: BrowserSmokeEvidence
  infrastructureError?: string
}

export interface BrowserSmokeObservation {
  browserName: string
  browserVersion: string
  actualText: string | null
  screenshot: string
}

export function unavailableBrowserSmoke(smoke: BrowserSmoke, reason: string): BrowserSmokeResult {
  return {
    assertions: [{
      id: 'browser.turn-status.runner',
      status: 'unsupported',
      message: 'Browser runner is unavailable',
      expected: 'Chromium browser runner',
      actual: reason,
    }],
    evidence: {
      schemaVersion: 1,
      available: false,
      browserName: null,
      browserVersion: null,
      path: smoke.path,
      selector: TURN_STATUS_SELECTOR,
      initialText: INITIAL_TURN_STATUS,
      expectedText: smoke.expectedText,
      selectedText: null,
      screenshot: null,
      domRedacted: true,
      storageRedacted: true,
      error: reason,
    },
  }
}

export function assessTurnStatusSmoke(
  smoke: BrowserSmoke,
  observation: BrowserSmokeObservation,
): BrowserSmokeResult {
  const passed = observation.actualText === smoke.expectedText
  return {
    assertions: [{
      id: 'browser.turn-status.text',
      status: passed ? 'passed' : 'failed',
      message: passed
        ? 'TurnStatus changed to the expected fixture text'
        : 'TurnStatus did not change to the expected fixture text',
      expected: smoke.expectedText,
      actual: observation.actualText,
      evidence: [observation.screenshot],
    }],
    evidence: {
      schemaVersion: 1,
      available: true,
      browserName: observation.browserName,
      browserVersion: observation.browserVersion,
      path: smoke.path,
      selector: TURN_STATUS_SELECTOR,
      initialText: INITIAL_TURN_STATUS,
      expectedText: smoke.expectedText,
      selectedText: observation.actualText,
      screenshot: observation.screenshot,
      domRedacted: true,
      storageRedacted: true,
    },
  }
}

async function existingBrowserExecutable(explicit: string | undefined): Promise<string | null> {
  const candidates = [explicit, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
    .filter((value): value is string => value !== undefined && value !== '')
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      // Try the next runner-owned browser candidate.
    }
  }
  return null
}

export async function checkTurnStatusBrowserSmoke(
  smoke: BrowserSmoke,
  options: {
    port: number
    screenshotPath: string
    screenshotArtifact: string
    executablePath?: string
  },
): Promise<BrowserSmokeResult> {
  const executablePath = await existingBrowserExecutable(
    options.executablePath ?? process.env.DSH_TESTKIT_BROWSER_EXECUTABLE,
  )
  if (executablePath === null) return unavailableBrowserSmoke(smoke, 'Chromium executable was not found')

  const origin = `http://127.0.0.1:${options.port}`
  let browser
  let navigated = false
  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: [
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-dev-shm-usage',
        '--disable-domain-reliability',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-first-run',
        '--no-sandbox',
      ],
    })
    const context = await browser.newContext({ serviceWorkers: 'block' })
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.origin === origin) await route.continue()
      else await route.abort('blockedbyclient')
    })
    await context.routeWebSocket('**/*', async (route) => {
      const url = new URL(route.url())
      if (url.hostname === '127.0.0.1' && url.port === String(options.port)) {
        route.connectToServer()
      } else {
        await route.close({ code: 1008, reason: 'Non-loopback WebSocket blocked by DSH Testkit' })
      }
    })
    const page = await context.newPage()
    await page.goto(`${origin}${smoke.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: smoke.timeoutMs,
    })
    navigated = true
    await page.evaluate(`(() => {
      const selector = ${JSON.stringify(TURN_STATUS_SELECTOR)};
      document.querySelector(selector)?.remove();
      const status = document.createElement('div');
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.textContent = ${JSON.stringify(INITIAL_TURN_STATUS)};
      document.body.appendChild(status);
    })()`)
    await page.waitForFunction(
      `document.querySelector(${JSON.stringify(TURN_STATUS_SELECTOR)})?.textContent === ${JSON.stringify(smoke.expectedText)}`,
      undefined,
      { timeout: smoke.timeoutMs },
    ).catch(() => undefined)
    const actualText = await page.locator(TURN_STATUS_SELECTOR).first().textContent()
    await page.screenshot({ path: options.screenshotPath, fullPage: false })
    await context.close()
    return assessTurnStatusSmoke(smoke, {
      browserName: chromium.name(),
      browserVersion: browser.version(),
      actualText,
      screenshot: options.screenshotArtifact,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (browser === undefined) return unavailableBrowserSmoke(smoke, message)
    if (!navigated) {
      return {
        ...unavailableBrowserSmoke(smoke, message),
        assertions: [],
        infrastructureError: `DSH web browser navigation did not complete: ${message}`,
      }
    }
    return {
      assertions: [{
        id: 'browser.turn-status.text',
        status: 'failed',
        message: 'TurnStatus browser smoke did not complete',
        expected: smoke.expectedText,
        actual: message,
      }],
      evidence: {
        schemaVersion: 1,
        available: true,
        browserName: chromium.name(),
        browserVersion: browser?.version() ?? 'unknown',
        path: smoke.path,
        selector: TURN_STATUS_SELECTOR,
        initialText: INITIAL_TURN_STATUS,
        expectedText: smoke.expectedText,
        selectedText: null,
        screenshot: null,
        domRedacted: true,
        storageRedacted: true,
        error: message,
      },
    }
  } finally {
    await browser?.close().catch(() => undefined)
  }
}
