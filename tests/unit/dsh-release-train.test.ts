import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

import { discoverDshReleaseTrain } from '../../src/adapters/dsh/release-train.js'

const fixtures = resolve(import.meta.dirname, '../fixtures')
const root = resolve(import.meta.dirname, '../..')
const executeFile = promisify(execFile)

describe('DSH release-train discovery', () => {
  it('reports no canary when latest and next are supported', async () => {
    const metadata = JSON.parse(await readFile(resolve(fixtures, 'dsh-registry-current.json'), 'utf8'))

    expect(discoverDshReleaseTrain(metadata, ['0.1.0-rc.6'])).toEqual({
      taggedVersions: ['0.1.0-rc.6'],
      supportedVersions: ['0.1.0-rc.6'],
      canaryVersions: [],
    })
  })

  it('deduplicates dist-tags and exposes unseen exact candidates', async () => {
    const metadata = JSON.parse(await readFile(resolve(fixtures, 'dsh-registry-candidate.json'), 'utf8'))

    expect(discoverDshReleaseTrain(metadata, ['0.1.0-rc.6'])).toEqual({
      taggedVersions: ['0.1.0-rc.6', '0.1.0-rc.7'],
      supportedVersions: ['0.1.0-rc.6'],
      canaryVersions: ['0.1.0-rc.7'],
    })
  })

  it('rejects mutable or malformed dist-tag values', () => {
    expect(() => discoverDshReleaseTrain({
      'dist-tags': { latest: 'latest' },
    }, ['0.1.0-rc.6'])).toThrow('not an exact semantic version')
  })

  it('enables a candidate only in the requested disposable source file', async () => {
    const temporary = await mkdtemp(resolve(tmpdir(), 'dsh-testkit-canary-'))
    const support = resolve(temporary, 'support.ts')
    try {
      await writeFile(support, "export const SUPPORTED_DSH_NPM_VERSIONS = ['0.1.0-rc.6'] as const\n")

      await executeFile(process.execPath, [
        resolve(root, 'scripts/enable-dsh-canary.mjs'),
        '--file', support,
        '0.1.0-rc.7',
      ], { cwd: root })

      expect(await readFile(support, 'utf8')).toContain("['0.1.0-rc.6', '0.1.0-rc.7']")
      expect(await readFile(resolve(root, 'src/adapters/dsh/support.ts'), 'utf8')).not.toContain('0.1.0-rc.7')
    } finally {
      await rm(temporary, { recursive: true, force: true })
    }
  })
})
