import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '../..')

describe('bilingual project entrypoints', () => {
  it('ships reciprocal English and Simplified Chinese README files', async () => {
    const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
    const english = await readFile(resolve(root, 'README.md'), 'utf8')
    const chinese = await readFile(resolve(root, 'README.zh-CN.md'), 'utf8')

    expect(manifest.version).toBe('0.4.4')
    expect(manifest.files).toContain('README.zh-CN.md')
    expect(english).toContain('[简体中文](README.zh-CN.md)')
    expect(chinese).toContain('[English](README.md)')
    for (const contents of [english, chinese]) {
      expect(contents).toContain('dsh-testkit@0.4.4')
      expect(contents).toContain('dsh-test init')
      expect(contents).toContain('--repo-root')
      expect(contents).toContain('.agents/skills/dsh-testkit/SKILL.md')
      expect(contents).toContain('0.1.1-rc.2')
      expect(contents).toContain('0.1.0-rc.8')
      expect(contents).toContain('0.1.0-rc.7')
      expect(contents).toContain('0.1.0-rc.6')
      expect(contents).toContain('0.1.5-rc.1')
      expect(contents).toContain('dsh-composition-check')
      expect(contents).toContain('dsh-plugin-doctor')
      expect(contents).toContain('http.routes')
      expect(contents).toContain('127.0.0.1')
      expect(contents).toContain('profile: web')
      expect(contents).toContain('browser smoke')
      expect(contents).toContain('watchdog')
      expect(contents).toContain('publish-junit-check')
      expect(contents).toContain('docs/design-partner-follow-up.md')
      expect(contents).toMatch(/resolve.*install-dsh.*package.*install-plugin.*assemble.*boot.*register.*exercise.*uninstall.*reboot.*cleanup/s)
    }
    expect(english).toContain('[dsh-plugin-doctor](https://github.com/zoahdev/dsh-plugin-doctor)')
    expect(chinese).toContain('[dsh-plugin-doctor](https://github.com/zoahdev/dsh-plugin-doctor)')
    expect(english).toContain('not a hardened malware sandbox')
    expect(chinese).toContain('不是经过强化的恶意代码沙箱')
    expect(english).toContain('real-host release gate')
    expect(chinese).toContain('真实宿主发布门禁')
    expect(english).toContain('Action `v0.4.4` for this six-host support matrix')
    expect(chinese).toContain('Action `v0.4.4` 获得此六宿主支持矩阵')
  })

  it('keeps design-partner reruns behind higher immutable package identities', async () => {
    const followUp = await readFile(resolve(root, 'docs/design-partner-follow-up.md'), 'utf8')

    expect(followUp).toContain('dsh-shelf@0.7.0')
    expect(followUp).toContain('@0xsline/dsh-spotlight@0.0.2')
    expect(followUp).toContain('Waiting_For_Immutable_Package')
    expect(followUp).not.toContain('#main')
  })

  it('describes the published Action evidence guard with immutable release evidence', async () => {
    const english = await readFile(resolve(root, 'README.md'), 'utf8')
    const chinese = await readFile(resolve(root, 'README.zh-CN.md'), 'utf8')
    const releaseAction = 'https://github.com/iiwish/dsh-testkit/blob/v0.4.4/.github/actions/dsh-test/action.yml'

    expect(english).toContain('The `v0.4.4` Action checks evidence')
    expect(chinese).toContain('`v0.4.4` Action 在两个发布出口前执行统一证据检查')
    for (const contents of [english, chinese]) expect(contents).toContain(releaseAction)
    expect(english).not.toContain('This guard is not included in the published')
    expect(chinese).not.toContain('已发布的 `v0` Action 尚不包含此检查')
  })

  it('records the patch release in the changelog and security support table', async () => {
    const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8')
    const security = await readFile(resolve(root, 'SECURITY.md'), 'utf8')

    expect(changelog).toContain('## [0.4.4] - 2026-09-10')
    expect(changelog).toContain('[0.4.4]: https://github.com/iiwish/dsh-testkit/compare/v0.4.3...v0.4.4')
    expect(security).toContain('| 0.4.x | Yes |')
    expect(security).toContain('| 0.3.x | No |')
  })
})
