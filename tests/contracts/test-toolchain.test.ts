import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
const dependabot = parse(readFileSync(new URL('../../.github/dependabot.yml', import.meta.url), 'utf8'))

describe('test toolchain maintenance', () => {
  it('pins the coverage provider to the exact Vitest version', () => {
    expect(manifest.devDependencies.vitest).toMatch(/^\d+\.\d+\.\d+$/)
    expect(manifest.devDependencies['@vitest/coverage-v8']).toBe(manifest.devDependencies.vitest)
  })

  it.each(['version-updates', 'security-updates'])('groups the framework and provider for %s', (appliesTo) => {
    const npm = dependabot.updates.find((update: { 'package-ecosystem': string }) => update['package-ecosystem'] === 'npm')
    const groups = Object.values(npm.groups ?? {}) as Array<{ 'applies-to'?: string; patterns: string[] }>
    expect(groups.some(group => (group['applies-to'] ?? 'version-updates') === appliesTo
      && group.patterns.includes('vitest') && group.patterns.includes('@vitest/*'))).toBe(true)
  })
})
