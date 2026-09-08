import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

const execute = promisify(execFile)

describe('Release Watch closure', () => {
  it.each([
    ['success', 'success', '["0.1.3-alpha.2"]', 0],
    ['success', 'skipped', '[]', 0],
    ['failure', 'skipped', '', 1],
    ['success', 'failure', '["0.1.3-alpha.2"]', 1],
    ['success', 'cancelled', '["0.1.3-alpha.2"]', 1],
    ['success', 'skipped', '["0.1.3-alpha.2"]', 1],
    ['success', 'success', '["latest"]', 1],
  ])('discovery %s / canary %s / %s gives exit %s', async (discovery, canary, versions, code) => {
    const directory = await mkdtemp(join(tmpdir(), 'release-watch-summary-'))
    const summary = join(directory, 'summary.md')
    try {
      let exitCode = 0
      try {
        await execute(process.execPath, [resolve('scripts/summarize-dsh-release-watch.mjs')], {
          env: { ...process.env, DISCOVERY_RESULT: discovery, CANARY_RESULT: canary,
            CANARY_VERSIONS: versions, PENDING_NPM_VERSIONS: '["0.1.3-alpha.1"]',
            GITHUB_STEP_SUMMARY: summary, GITHUB_SHA: 'a'.repeat(40), GITHUB_REF: 'refs/heads/main' },
        })
      } catch (error) { exitCode = (error as { code: number }).code }
      expect(exitCode).toBe(code)
      if (!versions.includes('latest')) {
        const text = await readFile(summary, 'utf8')
        expect(text).toContain('refs/heads/main')
        expect(text).toContain('a'.repeat(40))
        expect(text).toContain('0.1.3-alpha.1')
        expect(text).toContain(code === 0 ? 'Monitoring result: passed' : 'Monitoring result: requires attention')
      }
    } finally { await rm(directory, { recursive: true, force: true }) }
  })
})
