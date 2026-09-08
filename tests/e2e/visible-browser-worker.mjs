import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

import { DshNpmAdapter } from '../../dist/src/adapters/dsh/npm-adapter.js'
import { validateBrowserLaunchUrl } from '../../dist/src/adapters/dsh/browser-smoke.js'
import { LifecycleWorker } from '../../dist/src/worker/lifecycle-worker.js'
import { WorkerRequestSchema } from '../../dist/src/worker/protocol.js'
import { exerciseVisibleHost } from './visible-browser.mjs'

assert.equal(process.env.DSH_TESTKIT_RUNNER, 'docker', 'Visible acceptance must run in Docker')
const request = WorkerRequestSchema.parse(JSON.parse(await readFile('/output/request.json', 'utf8')))
assert.equal(request.scenario.dsh.version, '0.1.2-rc.1')
const viewport = JSON.parse(process.env.TESTKIT_VISIBLE_VIEWPORT)
const adapter = new DshNpmAdapter()

// Independent, test-only observation on the live host. The shipped adapter and
// public turn-status-text contract remain unchanged; no status DOM is seeded.
adapter.captureBrowserSmoke = async function (label, authentication) {
  assert.equal(label, 'boot')
  const origin = `http://127.0.0.1:${this.webPort}`
  const url = validateBrowserLaunchUrl(authentication, this.webPort)
  assert.ok(url, 'rc.1 must provide its private authentication handoff')
  let browser
  let passed = false
  let observation = { completed: false }
  const artifact = 'evidence/browser-boot.json'
  const screenshot = 'evidence/browser-boot-turn-status.png'
  try {
    browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] })
    const context = await browser.newContext({ viewport, locale: 'en-US', serviceWorkers: 'block' })
    await context.route('**/*', async route => {
      if (new URL(route.request().url()).origin === origin) await route.continue()
      else await route.abort('blockedbyclient')
    })
    await context.routeWebSocket('**/*', async route => {
      if (new URL(route.url()).origin === origin.replace('http:', 'ws:')) route.connectToServer()
      else await route.close({ code: 1008, reason: 'Non-loopback WebSocket blocked' })
    })
    const page = await context.newPage()
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    assert.ok(response && response.status() < 400)
    assert.equal(page.url(), `${origin}/`, 'Browser must reach a token-free loopback root')
    try {
      observation = await exerciseVisibleHost(page)
      passed = true
    } finally {
      // Only a fresh, credential-free owned profile is captured, after exchange.
      await page.screenshot({ path: join(request.outputDir, screenshot) })
      this.addArtifact(join(request.outputDir, screenshot))
    }
    this.browserIdentity = { name: 'chromium', version: browser.version() }
  } catch {
    // Playwright errors can include DOM or authenticated navigation details.
    observation = { completed: false, error: 'Visible host interaction did not complete; inspect the bounded screenshot' }
  } finally {
    await browser?.close()
  }
  await writeFile(join(request.outputDir, artifact), JSON.stringify({ schemaVersion: 1, contract: 'native-onboarding-and-unsent-draft', viewport, passed, observation, domRedacted: true, storageRedacted: true }, null, 2))
  this.addArtifact(join(request.outputDir, artifact))
  this.browserResults.set(label, {
    assertions: [{ id: 'browser.visible-host.interaction', status: passed ? 'passed' : 'failed', message: 'Native onboarding and unsent draft interaction', expected: true, actual: passed, evidence: [artifact] }],
    artifacts: [artifact],
  })
}

await mkdir(request.outputDir, { recursive: true })
const report = await new LifecycleWorker(adapter).run(request)
await writeFile('/output/report.json', JSON.stringify(report, null, 2))
process.exitCode = report.verdict === 'passed' ? 0 : 1
