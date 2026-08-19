import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '../..')

describe('bilingual project entrypoints', () => {
  it('ships reciprocal English and Simplified Chinese README files', async () => {
    const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
    const english = await readFile(resolve(root, 'README.md'), 'utf8')
    const chinese = await readFile(resolve(root, 'README.zh-CN.md'), 'utf8')

    expect(manifest.version).toBe('0.3.2')
    expect(manifest.files).toContain('README.zh-CN.md')
    expect(english).toContain('[简体中文](README.zh-CN.md)')
    expect(chinese).toContain('[English](README.md)')
    for (const contents of [english, chinese]) {
      expect(contents).toContain('dsh-testkit@0.3.2')
      expect(contents).toContain('dsh-test init')
      expect(contents).toContain('--repo-root')
      expect(contents).toContain('.agents/skills/dsh-testkit/SKILL.md')
      expect(contents).toContain('0.1.0-rc.7')
      expect(contents).toContain('0.1.0-rc.6')
      expect(contents).toContain('dsh-composition-check')
      expect(contents).toContain('dsh-plugin-doctor')
      expect(contents).toMatch(/resolve.*install-dsh.*package.*install-plugin.*assemble.*boot.*register.*exercise.*uninstall.*reboot.*cleanup/s)
    }
    expect(english).toContain('[dsh-plugin-doctor](https://github.com/zoahdev/dsh-plugin-doctor)')
    expect(chinese).toContain('[dsh-plugin-doctor](https://github.com/zoahdev/dsh-plugin-doctor)')
    expect(english).toContain('not a hardened malware sandbox')
    expect(chinese).toContain('不是经过强化的恶意代码沙箱')
  })

  it('records the patch release in the changelog and security support table', async () => {
    const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8')
    const security = await readFile(resolve(root, 'SECURITY.md'), 'utf8')

    expect(changelog).toContain('## [0.3.2] - 2026-08-19')
    expect(changelog).toContain('[0.3.2]: https://github.com/iiwish/dsh-testkit/compare/v0.3.1...v0.3.2')
    expect(security).toContain('| 0.3.x | Yes |')
  })
})
