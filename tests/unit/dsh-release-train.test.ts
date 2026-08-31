import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

import { describe, expect, it } from 'vitest'

import { discoverDshReleaseTrain } from '../../src/adapters/dsh/release-train.js'
import { SUPPORTED_DSH_NPM_VERSIONS } from '../../src/adapters/dsh/support.js'

const fixtures = resolve(import.meta.dirname, '../fixtures')
const root = resolve(import.meta.dirname, '../..')
const executeFile = promisify(execFile)

describe('DSH release-train discovery', () => {
  it('reports no canary when latest and next are supported', async () => {
    const metadata = JSON.parse(await readFile(resolve(fixtures, 'dsh-registry-current.json'), 'utf8'))

    expect(discoverDshReleaseTrain(metadata, ['0.1.1-rc.2', '0.1.0-rc.8', '0.1.0-rc.7', '0.1.0-rc.6'])).toEqual({
      taggedVersions: ['0.1.1-rc.2'],
      upstreamVersions: [],
      supportedVersions: ['0.1.0-rc.6', '0.1.0-rc.7', '0.1.0-rc.8', '0.1.1-rc.2'],
      canaryVersions: [],
      pendingNpmVersions: [],
    })
  })

  it('deduplicates dist-tags and exposes unseen exact candidates', async () => {
    const metadata = JSON.parse(await readFile(resolve(fixtures, 'dsh-registry-candidate.json'), 'utf8'))

    expect(discoverDshReleaseTrain(metadata, ['0.1.1-rc.2', '0.1.0-rc.8', '0.1.0-rc.7', '0.1.0-rc.6'])).toEqual({
      taggedVersions: ['0.1.1-rc.2', '0.1.1-rc.3'],
      upstreamVersions: [],
      supportedVersions: ['0.1.0-rc.6', '0.1.0-rc.7', '0.1.0-rc.8', '0.1.1-rc.2'],
      canaryVersions: ['0.1.1-rc.3'],
      pendingNpmVersions: [],
    })
  })

  it('tracks an immutable official alpha release without adding an unavailable npm package to support', async () => {
    const metadata = JSON.parse(await readFile(resolve(fixtures, 'dsh-registry-current.json'), 'utf8'))
    const releases = JSON.parse(await readFile(resolve(fixtures, 'dsh-github-releases-alpha.json'), 'utf8'))

    expect(discoverDshReleaseTrain(metadata, SUPPORTED_DSH_NPM_VERSIONS, releases)).toEqual({
      taggedVersions: ['0.1.1-rc.2'],
      upstreamVersions: ['0.1.1-rc.1', '0.1.2-alpha.1', '0.1.2-alpha.2'],
      supportedVersions: ['0.1.0-rc.6', '0.1.0-rc.7', '0.1.0-rc.8', '0.1.1-rc.2'],
      canaryVersions: [],
      pendingNpmVersions: ['0.1.2-alpha.1', '0.1.2-alpha.2'],
    })
    expect(SUPPORTED_DSH_NPM_VERSIONS).not.toContain('0.1.2-alpha.1')
  })

  it('promotes an official release to a runnable canary once its exact npm version exists', async () => {
    const metadata = JSON.parse(await readFile(resolve(fixtures, 'dsh-registry-alpha-published.json'), 'utf8'))
    const releases = JSON.parse(await readFile(resolve(fixtures, 'dsh-github-releases-alpha.json'), 'utf8'))

    expect(discoverDshReleaseTrain(metadata, SUPPORTED_DSH_NPM_VERSIONS, releases)).toMatchObject({
      canaryVersions: ['0.1.2-alpha.2'],
      pendingNpmVersions: ['0.1.2-alpha.1'],
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
    const rootSupport = await readFile(resolve(root, 'src/adapters/dsh/support.ts'), 'utf8')
    try {
      await writeFile(support, rootSupport)

      await executeFile(process.execPath, [
        resolve(root, 'scripts/enable-dsh-canary.mjs'),
        '--file', support,
        '0.1.2-alpha.2',
      ], { cwd: root })

      const updated = await readFile(support, 'utf8')
      expect(updated).toContain("  '0.1.0-rc.6',\n  '0.1.2-alpha.2',\n]")
      expect(updated).not.toContain('\n,\n')
      expect(await readFile(resolve(root, 'src/adapters/dsh/support.ts'), 'utf8')).toBe(rootSupport)
    } finally {
      await rm(temporary, { recursive: true, force: true })
    }
  })
})
