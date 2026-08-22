import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

describe('published DSH bundle contract', () => {
  it('declares an installable bundle and exports the Cordis entry', async () => {
    const root = resolve(import.meta.dirname, '../..')
    const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
    const patch = parse(await readFile(resolve(root, 'cordis.patch.yml'), 'utf8'))

    expect(manifest.version).toBe('0.3.3')
    expect(manifest.dsh).toEqual({ bundle: { patch: './cordis.patch.yml' } })
    expect(manifest.exports['.']).toMatchObject({
      types: './dist/src/index.d.ts',
      import: './dist/src/index.js',
      default: './dist/src/index.js',
    })
    expect(manifest.exports['./cordis.patch.yml']).toBe('./cordis.patch.yml')
    expect(manifest.exports['./skills/dsh-testkit/SKILL.md'])
      .toBe('./.agents/skills/dsh-testkit/SKILL.md')
    expect(manifest.files).toContain('cordis.patch.yml')
    expect(manifest.files).toContain('.agents/skills/dsh-testkit')
    expect(manifest.peerDependencies).toMatchObject({
      '@deepseek-ai/cordis': '^4.0.1',
      '@deepseek-ai/dsh-invariants': '>=0.1.0-rc.6 <0.2.0',
      '@deepseek-ai/dsh-tools': '>=0.1.0-rc.6 <0.2.0',
    })
    expect(manifest.peerDependenciesMeta).toEqual({
      '@deepseek-ai/cordis': { optional: true },
      '@deepseek-ai/dsh-invariants': { optional: true },
      '@deepseek-ai/dsh-tools': { optional: true },
    })
    expect(manifest.devDependencies).toMatchObject({
      '@deepseek-ai/dsh-invariants': '0.1.0-rc.7',
      '@deepseek-ai/dsh-tools': '0.1.0-rc.7',
    })
    expect(patch).toEqual([{ insert: [{ id: 'tool-dsh-testkit', name: 'dsh-testkit' }] }])
  })
})
